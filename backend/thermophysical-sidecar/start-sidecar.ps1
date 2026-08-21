param(
    [int]$Port = 5011,
    [ValidateSet('IIR', 'ASHRAE', 'NBP', 'DEF')]
    [string]$ReferenceState = 'IIR'
)

$ErrorActionPreference = 'Stop'
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
