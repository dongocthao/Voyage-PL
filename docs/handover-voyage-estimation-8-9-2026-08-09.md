# Handover Voyage Estimation Steps 8-9 - 2026-08-09

## Scope completed

- Step 8: runtime smoke test for Voyage Estimation UI.
- Step 9: regression coverage for voyage calculation engine and freight simulation.

## Files changed/added

- `apps/api/package.json`
  - Added `test:regression`.
- `apps/api/scripts/voyage-calculation.regression.cjs`
  - Covers rate + lump sum freight, demurrage revenue, despatch/port/liner/commission/bunker expense, WF-adjusted duration, ballast/laden sea days, ECA fuel usage, and freight simulator behavior for fixed vs unfixed cargo lines.
- `tmp/voyage-ui-runtime-check.py`
  - Playwright smoke test for `/voyage-estimator`.
  - Verifies key panels render and Save validation shows required Vessel/Bunker Profile messages.
- Formatting only:
  - `apps/voyage-ui/src/components/voyage-estimator/PortRotationTable.tsx`
  - `apps/voyage-ui/src/routes/new-cargo.tsx`
  - `apps/voyage-ui/src/routes/new-port.tsx`

## Verification results

Use `pnpm.cmd` on Windows PowerShell because plain `pnpm` is blocked by execution policy.

Passed:

```powershell
pnpm.cmd --filter @voyage-pnl/api build
pnpm.cmd --filter @voyage-pnl/api lint
pnpm.cmd --filter @voyage-pnl/api test:regression
pnpm.cmd --filter @voyage-pnl/voyage-ui build
pnpm.cmd --filter @voyage-pnl/voyage-ui lint
```

UI lint result:

- 0 errors.
- 6 pre-existing `react-refresh/only-export-components` warnings in `apps/voyage-ui/src/components/ui/*`.

Runtime smoke test passed with real Chromium:

```powershell
$env:VOYAGE_UI_URL='http://127.0.0.1:5191/voyage-estimator'
python 'C:\Users\Administrator\.codex\skills\webapp-testing\scripts\with_server.py' --server "pnpm.cmd --dir apps/voyage-ui exec vite dev --host 127.0.0.1 --port 5191 --strictPort" --port 5191 --timeout 60 -- python tmp/voyage-ui-runtime-check.py
```

Notes:

- `vite preview` through the helper was unreliable because ports `4173-4175` were already occupied and Vite auto-shifted ports.
- Direct `pnpm.cmd --dir apps/voyage-ui exec vite dev ... --strictPort` worked and should be reused for the next runtime pass.
- Static serving of `dist/client` is not enough for this TanStack Start build because there is no emitted `index.html` at that level.

## Recommended next steps

1. Add API-backed save/load runtime test once the Nest API and database are running with known seed data.
2. Extend UI smoke test from validation-only to a successful save flow:
   - select vessel
   - select bunker profile
   - add/verify cargo and port rows
   - Save
   - reload estimate
3. Resolve the 6 shared UI Fast Refresh warnings later if desired; they are not blocking Voyage Estimation behavior.
