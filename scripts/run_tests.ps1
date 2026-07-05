$ErrorActionPreference = 'Stop'
$Root = Split-Path -Parent $PSScriptRoot
Set-Location -LiteralPath $Root
& node (Join-Path $Root 'tests\run_all_smoke.js')
exit $LASTEXITCODE
