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
THERMOPHYSICAL_PROVIDER_HEALTH_INTERVAL_MS=30000
THERMOPHYSICAL_PROVIDER_HEALTH_STALE_AFTER_MS=90000
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

## Runtime health governance and manual restart

The backend exposes `GET /api/core/thermophysical-provider/runtime-status`. It performs an explicit local health observation and returns a **fail-closed** selection gate. When the sidecar is unavailable, malformed, or stale beyond `THERMOPHYSICAL_PROVIDER_HEALTH_STALE_AFTER_MS`, property-dependent candidate work is blocked. A healthy sidecar permits only review-gated candidate work; it never authorizes final equipment selection.

The backend may poll health while it is running, but it **never automatically starts or restarts** a sidecar process. This prevents hidden runtime changes to the evidence chain. If the runtime gate is blocked, use this controlled runbook:

1. Preserve the sidecar diagnostic output and identify the failed process; do not retain its unverified result as current evidence.
2. Stop only that local sidecar process, then rerun the PowerShell launcher shown above from the repository root.
3. Confirm `http://127.0.0.1:5011/health` reports `providerId: coolprop`, a non-empty version and revision, `outboundRequests: false`, and all required fluid mappings as available.
4. Run `npm run test:coolprop-sidecar` from `backend`; restart the backend only after the approved opt-in variables are present.
5. Record the provider version/revision in the review evidence. Repeat manufacturer-map and independent engineering review before any selection decision.

## Engineering boundary

Use results as property-based preliminary calculations. Do not treat them as manufacturer selection, pressure-vessel rating, safety approval, ASHRAE/IIAR compliance, or construction issue. Validate required operating envelopes and compare against approved manufacturer maps before release.
