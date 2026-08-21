# CoolProp Local Thermophysical Sidecar

This sidecar provides **loopback-only**, SI-unit property calculations for Cool-Assist. It binds to `127.0.0.1:5011`, makes no outbound requests, returns CoolProp version and reference-state provenance, and keeps every result review-required. It is not a manufacturer performance map, an optimized control model, or approval for procurement or construction.

## Installation and start

Use PowerShell from the project root:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File backend\thermophysical-sidecar\start-sidecar.ps1 -Port 5011 -ReferenceState IIR
```

The launcher creates `backend/thermophysical-sidecar/.venv` and installs the pinned MIT-licensed `CoolProp==8.0.0` runtime there. The virtual environment is local runtime state and must not be committed.

## Backend opt-in

Keep the provider disabled by default. Only after the sidecar health and eight-fluid mapping checks pass, set these values in `backend/.env` and restart the backend:

```dotenv
THERMOPHYSICAL_PROVIDER_MODE=coolprop-sidecar
THERMOPHYSICAL_PROVIDER_URL=http://127.0.0.1:5011
THERMOPHYSICAL_PROVIDER_ALLOW_OUTBOUND=true
THERMOPHYSICAL_PROVIDER_REFERENCE_STATE=IIR
THERMOPHYSICAL_PROVIDER_TIMEOUT_MS=3000
```

`ALLOW_OUTBOUND` enables the backend-to-loopback request policy; it does **not** permit internet calls. Remote URLs are rejected by the Node client.

## Endpoints

| Endpoint | Purpose | Constraint |
|---|---|---|
| `GET /health` | Version, backend, mapping and loopback policy | Read-only |
| `POST /v1/properties` | Two independent SI state inputs and approved outputs | All eight registered refrigerants |
| `POST /v1/cycle/simple-vapor-compression` | Preliminary simple vapor-compression cycle | R717, R290, R32, R404A, R410A, R134a, R22; not R744 |
| `POST /v1/cycle/r744-transcritical-booster` | Preliminary CO₂ booster calculation | Requires explicit high-side and flash-gas pressures; no control setpoint optimization |

The R744 endpoint requires `evapTempK`, `gasCoolerOutletTempK`, `highSidePressurePa`, `flashGasPressurePa`, both isentropic efficiencies and `loadW`. It blocks subcritical high-side pressure, invalid pressure ordering, invalid flash split and non-finite results.

## Verification

With the sidecar running, execute:

```powershell
cd backend
npm run test:coolprop-sidecar
```

Run `npm test` separately for the full regression suite that does not require the local sidecar.

## Engineering boundary

Use results as property-based preliminary calculations. Do not treat them as manufacturer selection, pressure-vessel rating, safety approval, ASHRAE/IIAR compliance, or construction issue. Validate required operating envelopes and compare against approved manufacturer maps before release.
