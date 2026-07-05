$ErrorActionPreference = 'Stop'
$Root = Split-Path -Parent $PSScriptRoot
Set-Location -LiteralPath $Root
& node (Join-Path $Root 'scripts\ci_smoke.mjs')
exit $LASTEXITCODE
