param(
    [int]$Port = 5011,
    [ValidateSet('IIR', 'ASHRAE', 'NBP', 'DEF')]
    [string]$ReferenceState = 'IIR'
)

$ErrorActionPreference = 'Stop'

# The backend health governor is intentionally fail-closed and never restarts this
# process automatically. Refuse a duplicate launch so the operator can preserve
# diagnostics, identify the existing process, and follow the documented runbook.
$listener = Get-NetTCPConnection -State Listen -LocalPort $Port -ErrorAction SilentlyContinue
if ($listener) {
    throw "A process is already listening on 127.0.0.1:$Port (PID $($listener[0].OwningProcess)). Do not start a second sidecar; verify health or follow the manual restart runbook."
}

$root = Split-Path -Parent $MyInvocation.MyCommand.Path
$venv = Join-Path $root '.venv'
$python = Join-Path $venv 'Scripts\python.exe'

if (-not (Test-Path $python)) {
    py -3.13 -m venv $venv
}

& $python -m pip install --disable-pip-version-check --requirement (Join-Path $root 'requirements.txt')
$env:COOLPROP_SIDECAR_HOST = '127.0.0.1'
$env:COOLPROP_SIDECAR_PORT = "$Port"
$env:COOLPROP_SIDECAR_REFERENCE_STATE = $ReferenceState
& $python (Join-Path $root 'sidecar.py')
