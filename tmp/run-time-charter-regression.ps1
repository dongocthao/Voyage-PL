$ErrorActionPreference = "Stop"

$root = Split-Path -Parent $PSScriptRoot
Set-Location $root

pnpm.cmd --dir apps/voyage-ui exec tsc --noEmit -p ..\..\tmp\tsconfig.time-charter-mapper.json
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
pnpm.cmd --filter @voyage-pnl/api build
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
pnpm.cmd --filter @voyage-pnl/api lint
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
pnpm.cmd --filter @voyage-pnl/voyage-ui build
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
pnpm.cmd --filter @voyage-pnl/voyage-ui lint
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

$env:API_BASE = "http://localhost:3001/api"
node tmp/time-charter-validation-e2e.cjs
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
node tmp/time-charter-api-e2e.cjs
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

$env:API_BASE = "http://localhost:3004/api"
python 'C:\Users\Administrator\.codex\skills\webapp-testing\scripts\with_server.py' `
  --server "powershell -NoProfile -ExecutionPolicy Bypass -File tmp/start-api-3004.ps1" `
  --port 3004 `
  --timeout 45 `
  -- node tmp/cargo-relet-api-e2e.cjs
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

$env:UI_BASE = "http://localhost:3000"
python 'C:\Users\Administrator\.codex\skills\webapp-testing\scripts\with_server.py' `
  --server "pnpm.cmd --dir apps/voyage-ui exec vite dev --host localhost --port 3000 --strictPort" `
  --port 3000 `
  --timeout 60 `
  -- python tmp/time-charter-cp-ui-smoke.py
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

$env:UI_BASE = "http://localhost:3000"
python 'C:\Users\Administrator\.codex\skills\webapp-testing\scripts\with_server.py' `
  --server "pnpm.cmd --dir apps/voyage-ui exec vite dev --host localhost --port 3000 --strictPort" `
  --port 3000 `
  --timeout 60 `
  -- python tmp/workspace-toolbar-smoke.py
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

$env:UI_BASE = "http://localhost:3000"
python 'C:\Users\Administrator\.codex\skills\webapp-testing\scripts\with_server.py' `
  --server "pnpm.cmd --dir apps/voyage-ui exec vite dev --host localhost --port 3000 --strictPort" `
  --port 3000 `
  --timeout 60 `
  -- python tmp/cargo-relet-smoke.py
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

Write-Host "Time Charter regression passed"
