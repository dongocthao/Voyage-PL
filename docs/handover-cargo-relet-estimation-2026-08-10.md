# Handover - Cargo Relet Estimation - 2026-08-10

## Scope completed

- Cargo Relet Estimation now hides the child title bar and child toolbar via `EstimatorShell`.
- Cargo table:
  - Head/Sub `A. Comm` and `Brkg` normalize input to percent text.
  - Head/Sub `Net Frt` recalculates from Quantity, freight rate/lumpsum, A. Comm, and Brkg.
  - Totals recalculate from current rows.
- Port Rotation:
  - `Time Zone` column is present.
  - Sea days, port working, arrival, and departure are calculated with the same pattern used by Voyage Estimation and Time Charter.
  - Sea margin and Port Idle margin remain editable.
- Bottom result panels:
  - Operation Expense and Result panels now derive from current Cargo and Port Rotation totals instead of static mock totals.
- Main toolbar:
  - `CargoReletApp` registers with the workspace toolbar command manager.
  - New/Delete/Save/Save as/Open/Reload/Undo/Increase/Decrease/Options are connected to the current Cargo Relet sheet state.
- Persistence:
  - Added Cargo Relet frontend API client and snapshot mapper.
  - Added backend DTO/service/controller endpoints for save/load.
  - Persistence uses existing DB tables: `estimates`, `estimate_cargo_lines`, `estimate_cargo_freight_terms`, `estimate_port_legs`, `estimate_port_leg_cp_terms`, `estimate_results`, `estimate_vessels`.

## Key files changed

- `apps/voyage-ui/src/components/voyage-estimator/CargoReletApp.tsx`
- `apps/voyage-ui/src/components/voyage-estimator/cargoReletSnapshotMapper.ts`
- `apps/voyage-ui/src/lib/api/cargoReletSnapshots.ts`
- `apps/voyage-ui/src/components/voyage-estimator/EstimatorShell.tsx`
- `apps/voyage-ui/src/components/workspace/MainWorkspace.tsx`
- `apps/api/src/modules/estimates/dto/cargo-relet-snapshot.dto.ts`
- `apps/api/src/modules/estimates/services/cargo-relet-estimate-snapshot.service.ts`
- `apps/api/src/modules/estimates/estimates.controller.ts`
- `apps/api/src/modules/estimates/estimates.module.ts`
- `tmp/cargo-relet-api-e2e.cjs`
- `tmp/cargo-relet-smoke.py`
- `tmp/start-api-3004.ps1`
- `tmp/run-time-charter-regression.ps1`

## API endpoints added

- `POST /api/estimates/cargo-relet-snapshots`
- `GET /api/estimates/cargo-relet-snapshots/:estimateId`

## Verification passed

- `pnpm.cmd --dir apps/api build`
- `pnpm.cmd --dir apps/voyage-ui build`
- `node tmp/cargo-relet-api-e2e.cjs` against API build on port 3004
- `python tmp/cargo-relet-smoke.py` against UI dev server on port 3000
- `powershell -NoProfile -ExecutionPolicy Bypass -File tmp/run-time-charter-regression.ps1`

## Known residual notes

- UI lint still reports the existing 6 Fast Refresh warnings in shared UI components. There are no lint errors.
- Direct route `/cargo-relet` has no local Save/Load control by design; save/load is wired through the main workspace toolbar.
- Loaded Cargo Relet rows currently restore numeric/business fields from DB. Display names for account/ports/cargo are not rehydrated from master data yet when only IDs are stored.
