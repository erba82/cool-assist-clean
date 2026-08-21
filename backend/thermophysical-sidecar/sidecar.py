"""Local CoolProp thermophysical-property sidecar for Cool-Assist.

The server deliberately binds to 127.0.0.1 only. It accepts SI-only canonical
requests, performs no outbound requests, records provenance, and never returns
fallback values for an unsupported fluid, invalid state or solver error.
"""

from __future__ import annotations

import json
import math
import os
import time
from datetime import datetime, timezone
from http import HTTPStatus
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from typing import Any

import CoolProp.CoolProp as CP

HOST = os.getenv("COOLPROP_SIDECAR_HOST", "127.0.0.1")
PORT = int(os.getenv("COOLPROP_SIDECAR_PORT", "5011"))
REFERENCE_STATE = os.getenv("COOLPROP_SIDECAR_REFERENCE_STATE", "IIR").upper()

FLUID_MAP = {
    "R717": "Ammonia",
    "R744": "CarbonDioxide",
    "R290": "Propane",
    "R32": "R32",
    "R404A": "R404A",
    "R410A": "R410A",
    "R134a": "R134a",
    "R22": "R22",
}

INPUT_KEYS = {"T", "P", "Q", "Hmass", "Smass", "Dmass"}
OUTPUT_KEYS = {
    "P": "P",
    "T": "T",
    "Q": "Q",
    "Dmass": "Dmass",
    "Hmass": "Hmass",
    "Smass": "Smass",
    "Cpmass": "Cpmass",
    "VISCOSITY": "VISCOSITY",
    "CONDUCTIVITY": "CONDUCTIVITY",
}
ALLOWED_REFERENCE_STATES = {"IIR", "ASHRAE", "NBP", "DEF"}


def iso_now() -> str:
    return datetime.now(timezone.utc).isoformat().replace("+00:00", "Z")


def finite(value: Any) -> bool:
    return isinstance(value, (int, float)) and not isinstance(value, bool) and math.isfinite(value)


def value_si(value: Any) -> float:
    candidate = value.get("valueSI") if isinstance(value, dict) else value
    if not finite(candidate):
        raise ValueError("Each state input must be a finite SI number.")
    return float(candidate)


def normalize_refrigerant(value: Any) -> str:
    code = str(value or "").strip().upper().replace(" ", "").replace("-", "")
    return "R134a" if code == "R134A" else code


def response_provenance(code: str, inputs: list[dict[str, float]], reference_state: str) -> dict[str, Any]:
    return {
        "providerId": "coolprop",
        "providerVersion": CP.get_global_param_string("version"),
        "providerGitRevision": CP.get_global_param_string("gitrevision"),
        "backend": "HEOS",
        "fluidIdentifier": FLUID_MAP[code],
        "referenceState": reference_state,
        "sourceRevision": f"CoolProp-{CP.get_global_param_string('version')}",
        "queriedAt": iso_now(),
        "inputsSI": inputs,
        "applicability": {
            "status": "provider-result-review-required",
            "note": "Provider result is not manufacturer-map validation or a construction approval."
        }
    }


def validate_request(payload: dict[str, Any]) -> tuple[str, dict[str, float], list[str], str]:
    code = normalize_refrigerant(payload.get("refrigerant"))
    if code not in FLUID_MAP:
        raise LookupError(f"Unsupported refrigerant: {code or 'blank'}.")

    state = payload.get("state")
    if not isinstance(state, dict):
        raise ValueError("state must be an object with exactly two independent SI inputs.")
    active = {key: value_si(value) for key, value in state.items() if key in INPUT_KEYS}
    if len(active) != 2 or len(active) != len(state):
        raise ValueError("Exactly two supported independent state inputs are required.")
    if "Q" in active and not 0.0 <= active["Q"] <= 1.0:
        raise ValueError("Vapour quality Q must be within [0, 1].")
    if "T" in active and active["T"] <= 0:
        raise ValueError("Temperature T must be greater than 0 K.")
    if "P" in active and active["P"] <= 0:
        raise ValueError("Pressure P must be greater than 0 Pa.")

    outputs = payload.get("outputs")
    if not isinstance(outputs, list) or not outputs:
        raise ValueError("outputs must be a non-empty array.")
    if any(output not in OUTPUT_KEYS for output in outputs):
        raise ValueError("Requested output is not in the approved SI output allow-list.")

    reference_state = str(payload.get("referenceState") or REFERENCE_STATE).upper()
    if reference_state not in ALLOWED_REFERENCE_STATES:
        raise ValueError(f"Unsupported reference state: {reference_state}.")
    if reference_state != REFERENCE_STATE:
        raise ValueError(f"Sidecar reference state is fixed to {REFERENCE_STATE}; restart it to use a different approved reference state.")

    return code, active, outputs, reference_state


def property_response(payload: dict[str, Any]) -> dict[str, Any]:
    code, state, outputs, reference_state = validate_request(payload)
    fluid = FLUID_MAP[code]
    ((key1, input1), (key2, input2)) = tuple(state.items())
    values = {}
    for output in outputs:
        result = CP.PropsSI(OUTPUT_KEYS[output], key1, input1, key2, input2, fluid)
        if not math.isfinite(result):
            raise ValueError(f"CoolProp returned a non-finite {output} result.")
        values[output] = result

    inputs = [{"key": key, "valueSI": value} for key, value in state.items()]
    return {
        "status": "ok",
        "valuesSI": values,
        "provenance": response_provenance(code, inputs, reference_state),
        "reviewRequired": True,
        "warnings": []
    }


def positive_number(payload: dict[str, Any], key: str, *, minimum: float = 0.0) -> float:
    value = payload.get(key)
    if not finite(value) or float(value) <= minimum:
        raise ValueError(f"{key} must be finite and greater than {minimum}.")
    return float(value)


def simple_cycle_response(payload: dict[str, Any]) -> dict[str, Any]:
    """Calculate a simple vapor-compression cycle for preliminary comparison only.

    R744 transcritical / booster calculations are intentionally blocked because they
    require a different pressure architecture and controls model.
    """
    code = normalize_refrigerant(payload.get("refrigerant"))
    if code not in FLUID_MAP:
        raise LookupError(f"Unsupported refrigerant: {code or 'blank'}.")
    if code == "R744":
        raise RuntimeError("R744 transcritical/booster cycle requires a dedicated high-pressure-control model and is not represented by simple vapor-compression equations.")

    evap_temp = positive_number(payload, "evapTempK")
    cond_temp = positive_number(payload, "condTempK")
    superheat = float(payload.get("superheatK", 0.0))
    subcool = float(payload.get("subcoolK", 0.0))
    eta_is = float(payload.get("compressorIsentropicEfficiency", 0.75))
    load_w = positive_number(payload, "loadW", minimum=0.0)
    if superheat < 0 or subcool < 0:
        raise ValueError("superheatK and subcoolK must be non-negative.")
    if not 0.0 < eta_is <= 1.0:
        raise ValueError("compressorIsentropicEfficiency must be within (0, 1].")
    if cond_temp <= evap_temp:
        raise ValueError("condTempK must be greater than evapTempK.")

    fluid = FLUID_MAP[code]
    p_evap = CP.PropsSI("P", "T", evap_temp, "Q", 1, fluid)
    p_cond = CP.PropsSI("P", "T", cond_temp, "Q", 0, fluid)
    h1 = CP.PropsSI("Hmass", "T", evap_temp + superheat, "P", p_evap, fluid)
    s1 = CP.PropsSI("Smass", "T", evap_temp + superheat, "P", p_evap, fluid)
    h2s = CP.PropsSI("Hmass", "P", p_cond, "Smass", s1, fluid)
    h2 = h1 + (h2s - h1) / eta_is
    t2 = CP.PropsSI("T", "P", p_cond, "Hmass", h2, fluid)
    h3 = CP.PropsSI("Hmass", "T", cond_temp - subcool, "P", p_cond, fluid)
    s3 = CP.PropsSI("Smass", "T", cond_temp - subcool, "P", p_cond, fluid)
    h4 = h3
    q_evap = h1 - h4
    work = h2 - h1
    if q_evap <= 0 or work <= 0:
        raise ValueError("Calculated cycle has non-positive refrigerating effect or compressor work.")

    mass_flow = load_w / q_evap
    compressor_power = mass_flow * work
    heat_rejection = load_w + compressor_power
    inputs = [
        {"key": "evapTempK", "valueSI": evap_temp},
        {"key": "condTempK", "valueSI": cond_temp},
        {"key": "superheatK", "valueSI": superheat},
        {"key": "subcoolK", "valueSI": subcool},
        {"key": "compressorIsentropicEfficiency", "valueSI": eta_is},
        {"key": "loadW", "valueSI": load_w},
    ]
    return {
        "status": "ok",
        "cycle": {
            "point1": {"T": evap_temp + superheat, "P": p_evap, "Hmass": h1, "Smass": s1},
            "point2": {"T": t2, "P": p_cond, "Hmass": h2, "Smass": s1},
            "point3": {"T": cond_temp - subcool, "P": p_cond, "Hmass": h3, "Smass": s3},
            "point4": {"T": evap_temp, "P": p_evap, "Hmass": h4},
        },
        "performanceSI": {
            "refrigeratingEffectJPerKg": q_evap,
            "compressorSpecificWorkJPerKg": work,
            "cop": q_evap / work,
            "massFlowKgPerS": mass_flow,
            "compressorPowerW": compressor_power,
            "heatRejectionW": heat_rejection,
            "pressureRatio": p_cond / p_evap,
        },
        "provenance": response_provenance(code, inputs, REFERENCE_STATE),
        "reviewRequired": True,
        "warnings": ["Simple vapor-compression model only. Manufacturer map and project engineering review are required before selection."]
    }


def r744_transcritical_booster_response(payload: dict[str, Any]) -> dict[str, Any]:
    """Preliminary R744 booster cycle with explicit high-side and flash-gas pressures.

    This is not an optimization or manufacturer performance map. It deliberately
    requires the high-side and intermediate pressure inputs rather than inventing
    a gas-cooler control policy.
    """
    code = normalize_refrigerant(payload.get("refrigerant"))
    if code != "R744":
        raise ValueError("The transcritical booster endpoint accepts R744 only.")
    evap_temp = positive_number(payload, "evapTempK")
    gas_cooler_outlet_temp = positive_number(payload, "gasCoolerOutletTempK")
    high_side_pressure = positive_number(payload, "highSidePressurePa")
    flash_gas_pressure = positive_number(payload, "flashGasPressurePa")
    superheat = float(payload.get("superheatK", 0.0))
    eta_low = float(payload.get("lowStageIsentropicEfficiency", 0.75))
    eta_high = float(payload.get("highStageIsentropicEfficiency", 0.75))
    load_w = positive_number(payload, "loadW", minimum=0.0)
    if superheat < 0:
        raise ValueError("superheatK must be non-negative.")
    if not 0.0 < eta_low <= 1.0 or not 0.0 < eta_high <= 1.0:
        raise ValueError("Both isentropic efficiencies must be within (0, 1].")

    fluid = FLUID_MAP[code]
    p_evap = CP.PropsSI("P", "T", evap_temp, "Q", 1, fluid)
    critical_pressure = CP.PropsSI("pcrit", fluid)
    if high_side_pressure <= critical_pressure:
        raise ValueError("highSidePressurePa must exceed the R744 critical pressure for a transcritical model.")
    if not p_evap < flash_gas_pressure < high_side_pressure:
        raise ValueError("flashGasPressurePa must be between evaporating and high-side pressures.")

    # Low-temperature suction and booster discharge to the flash-gas receiver pressure.
    h1 = CP.PropsSI("Hmass", "T", evap_temp + superheat, "P", p_evap, fluid)
    s1 = CP.PropsSI("Smass", "T", evap_temp + superheat, "P", p_evap, fluid)
    h2s = CP.PropsSI("Hmass", "P", flash_gas_pressure, "Smass", s1, fluid)
    h2 = h1 + (h2s - h1) / eta_low

    # Gas cooler outlet is flashed into the receiver. The quality determines the
    # flash-gas mass fraction without assuming an unsupported receiver model.
    h5 = CP.PropsSI("Hmass", "P", high_side_pressure, "T", gas_cooler_outlet_temp, fluid)
    h_receiver_liquid = CP.PropsSI("Hmass", "P", flash_gas_pressure, "Q", 0, fluid)
    h_receiver_vapor = CP.PropsSI("Hmass", "P", flash_gas_pressure, "Q", 1, fluid)
    flash_fraction = (h5 - h_receiver_liquid) / (h_receiver_vapor - h_receiver_liquid)
    if not 0.0 <= flash_fraction < 1.0:
        raise ValueError("The supplied high-side pressure and gas-cooler outlet state do not produce a valid flash-gas receiver split.")

    refrigerating_effect = h1 - h_receiver_liquid
    if refrigerating_effect <= 0:
        raise ValueError("Calculated R744 refrigerating effect is non-positive.")
    low_stage_mass_flow = load_w / refrigerating_effect
    high_stage_mass_flow = low_stage_mass_flow / (1.0 - flash_fraction)
    flash_gas_mass_flow = high_stage_mass_flow - low_stage_mass_flow

    # Mix booster discharge with receiver flash gas before high-stage compression.
    h3 = ((low_stage_mass_flow * h2) + (flash_gas_mass_flow * h_receiver_vapor)) / high_stage_mass_flow
    s3 = CP.PropsSI("Smass", "P", flash_gas_pressure, "Hmass", h3, fluid)
    h4s = CP.PropsSI("Hmass", "P", high_side_pressure, "Smass", s3, fluid)
    h4 = h3 + (h4s - h3) / eta_high
    t4 = CP.PropsSI("T", "P", high_side_pressure, "Hmass", h4, fluid)

    low_stage_power = low_stage_mass_flow * (h2 - h1)
    high_stage_power = high_stage_mass_flow * (h4 - h3)
    total_power = low_stage_power + high_stage_power
    if total_power <= 0:
        raise ValueError("Calculated R744 compressor power is non-positive.")
    heat_rejection = high_stage_mass_flow * (h4 - h5)
    inputs = [
        {"key": "evapTempK", "valueSI": evap_temp},
        {"key": "gasCoolerOutletTempK", "valueSI": gas_cooler_outlet_temp},
        {"key": "highSidePressurePa", "valueSI": high_side_pressure},
        {"key": "flashGasPressurePa", "valueSI": flash_gas_pressure},
        {"key": "superheatK", "valueSI": superheat},
        {"key": "lowStageIsentropicEfficiency", "valueSI": eta_low},
        {"key": "highStageIsentropicEfficiency", "valueSI": eta_high},
        {"key": "loadW", "valueSI": load_w},
    ]
    return {
        "status": "ok",
        "architecture": "r744-transcritical-booster-preliminary",
        "cycle": {
            "lowStageSuction": {"T": evap_temp + superheat, "P": p_evap, "Hmass": h1, "Smass": s1},
            "lowStageDischarge": {"P": flash_gas_pressure, "Hmass": h2},
            "flashGasReceiver": {"P": flash_gas_pressure, "liquidHmass": h_receiver_liquid, "vaporHmass": h_receiver_vapor, "flashMassFraction": flash_fraction},
            "highStageSuction": {"P": flash_gas_pressure, "Hmass": h3, "Smass": s3},
            "highStageDischarge": {"T": t4, "P": high_side_pressure, "Hmass": h4},
            "gasCoolerOutlet": {"T": gas_cooler_outlet_temp, "P": high_side_pressure, "Hmass": h5}
        },
        "performanceSI": {
            "refrigeratingEffectJPerKg": refrigerating_effect,
            "cop": load_w / total_power,
            "lowStageMassFlowKgPerS": low_stage_mass_flow,
            "flashGasMassFlowKgPerS": flash_gas_mass_flow,
            "highStageMassFlowKgPerS": high_stage_mass_flow,
            "lowStagePowerW": low_stage_power,
            "highStagePowerW": high_stage_power,
            "compressorPowerW": total_power,
            "heatRejectionW": heat_rejection,
            "lowStagePressureRatio": flash_gas_pressure / p_evap,
            "highStagePressureRatio": high_side_pressure / flash_gas_pressure
        },
        "provenance": response_provenance(code, inputs, REFERENCE_STATE),
        "reviewRequired": True,
        "warnings": [
            "Preliminary transcritical booster calculation only; high-side pressure was supplied, not optimized.",
            "Manufacturer compressor maps, ejector/parallel-compression applicability, oil management, heat-reclaim controls and equipment envelopes require engineering review."
        ]
    }


def provider_metadata() -> dict[str, Any]:
    fluid_status = {}
    for code, fluid in FLUID_MAP.items():
        try:
            critical_temp = CP.PropsSI("Tcrit", fluid)
            fluid_status[code] = {"fluidIdentifier": fluid, "available": math.isfinite(critical_temp), "criticalTemperatureK": critical_temp}
        except Exception as error:  # provider diagnostics are data, not a fallback trigger
            fluid_status[code] = {"fluidIdentifier": fluid, "available": False, "error": str(error)}
    return {
        "status": "healthy",
        "providerId": "coolprop",
        "providerVersion": CP.get_global_param_string("version"),
        "providerGitRevision": CP.get_global_param_string("gitrevision"),
        "backend": "HEOS",
        "referenceState": REFERENCE_STATE,
        "bindAddress": HOST,
        "port": PORT,
        "outboundRequests": False,
        "fluidMappings": fluid_status,
        "policy": "Loopback-only property sidecar. Values include provenance and remain review-required."
    }


class SidecarHandler(BaseHTTPRequestHandler):
    server_version = "CoolAssistCoolPropSidecar/1.0"

    def _send(self, status: HTTPStatus, payload: dict[str, Any]) -> None:
        body = json.dumps(payload, separators=(",", ":"), ensure_ascii=False).encode("utf-8")
        self.send_response(status.value)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.send_header("Cache-Control", "no-store")
        self.end_headers()
        self.wfile.write(body)

    def _payload(self) -> dict[str, Any]:
        length = int(self.headers.get("Content-Length", "0"))
        if length <= 0 or length > 1024 * 1024:
            raise ValueError("JSON body must be between 1 byte and 1 MiB.")
        payload = json.loads(self.rfile.read(length).decode("utf-8"))
        if not isinstance(payload, dict):
            raise ValueError("JSON body must be an object.")
        return payload

    def do_GET(self) -> None:  # noqa: N802
        if self.path == "/health":
            self._send(HTTPStatus.OK, provider_metadata())
            return
        if self.path == "/capabilities":
            self._send(HTTPStatus.OK, {"success": True, "provider": provider_metadata()})
            return
        self._send(HTTPStatus.NOT_FOUND, {"status": "not-found", "error": "Route not found."})

    def do_POST(self) -> None:  # noqa: N802
        try:
            payload = self._payload()
            if self.path == "/v1/properties":
                self._send(HTTPStatus.OK, property_response(payload))
                return
            if self.path == "/v1/cycle/simple-vapor-compression":
                self._send(HTTPStatus.OK, simple_cycle_response(payload))
                return
            if self.path == "/v1/cycle/r744-transcritical-booster":
                self._send(HTTPStatus.OK, r744_transcritical_booster_response(payload))
                return
            self._send(HTTPStatus.NOT_FOUND, {"status": "not-found", "error": "Route not found."})
        except LookupError as error:
            self._send(HTTPStatus.UNPROCESSABLE_ENTITY, {"status": "unsupported-fluid", "error": str(error)})
        except (ValueError, TypeError, KeyError) as error:
            self._send(HTTPStatus.BAD_REQUEST, {"status": "invalid-request", "error": str(error)})
        except RuntimeError as error:
            self._send(HTTPStatus.UNPROCESSABLE_ENTITY, {"status": "unsupported-cycle-architecture", "error": str(error)})
        except Exception as error:  # CoolProp solver exceptions are not retried or hidden.
            self._send(HTTPStatus.UNPROCESSABLE_ENTITY, {"status": "provider-error", "error": str(error)})

    def log_message(self, _format: str, *_args: Any) -> None:
        return


def configure_reference_state() -> None:
    if REFERENCE_STATE not in ALLOWED_REFERENCE_STATES:
        raise RuntimeError(f"Unsupported COOLPROP_SIDECAR_REFERENCE_STATE: {REFERENCE_STATE}")
    for fluid in FLUID_MAP.values():
        CP.set_reference_state(fluid, REFERENCE_STATE)


def main() -> None:
    configure_reference_state()
    server = ThreadingHTTPServer((HOST, PORT), SidecarHandler)
    print(json.dumps({"event": "coolprop-sidecar-started", "provider": provider_metadata(), "startedAt": iso_now()}), flush=True)
    server.serve_forever(poll_interval=0.5)


if __name__ == "__main__":
    main()
