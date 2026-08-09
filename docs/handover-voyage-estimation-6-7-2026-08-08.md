# Voyage Estimation Handover - Items 6-7 - 2026-08-08

## Scope Completed

Continued checklist items:

6. Validation
7. Freight Simulator

## Files Changed

- `apps/voyage-ui/src/components/voyage-estimator/mockData.ts`
- `apps/voyage-ui/src/components/voyage-estimator/CargoTable.tsx`
- `apps/voyage-ui/src/components/voyage-estimator/voyageSnapshotMapper.ts`
- `apps/voyage-ui/src/components/voyage-estimator/VoyageEstimator.tsx`
- `apps/voyage-ui/src/components/voyage-estimator/FreightSimulatorApp.tsx`

## What Changed

### Validation

- Added UI pre-save validation in `VoyageEstimator.tsx`.
- It blocks save and shows Alert details for:
  - missing Vessel
  - missing Bunker Profile
  - no Cargo rows
  - no Port Rotation rows
  - missing cargo name
  - loading/discharging port not selected from lookup
  - quantity <= 0
  - freight type F without freight rate
  - freight type L without freight lumpsum
  - port row not selected from lookup
  - ECA distance > total distance
  - distance > 0 without speed
- API validator already existed and remains the backend guard.

### Freight Simulator / Fixed Flag

- Added `isFreightFixed?: boolean` to `CargoRow` mock/type.
- Added `Fixed` checkbox column to `CargoTable.tsx`.
- `voyageSnapshotMapper.ts` now saves and loads `freight.isFreightFixed`.
- Freight Type behavior:
  - `Frt` cell is read-only when `Frt Type = L`.
  - `Frt Lumpsum` cell is read-only unless `Frt Type = L`.
- `FreightSimulatorApp.tsx` now displays fixed status from snapshot/response.
- Backend simulator already excludes fixed cargo from adjustment.

## Verification

Fresh verification after these edits:

- `pnpm --filter @voyage-pnl/voyage-ui exec tsc --noEmit` passed.
- `pnpm --filter @voyage-pnl/api typecheck` passed.

Not yet rerun after this final patch due token pressure:

- UI build
- UI lint
- API build/lint

Expected known UI lint baseline: 6 pre-existing Fast Refresh warnings in `apps/voyage-ui/src/components/ui/*`.

## Remaining Work

### Validation

- Add API validation for `estimateTypeCode` allowed values if DB/UI code behavior is finalized.
- Add UI validation for duplicate line numbers after row insert/delete if row renumbering is not implemented.
- Decide whether Working days should be UI-derived or backend-only.

### Freight Simulator

- Add Apply behavior to write adjusted freight values back into Cargo grid.
- Add mode behavior for Distance Rate vs Average Rate radio.
- Show cargo names/accounts in adjustment rows from snapshot rather than `Line N` after simulation response, or extend API response.

## Suggested Next Prompt

```text
Đọc `D:\Project\VoyageP&L\docs\handover-voyage-estimation-6-7-2026-08-08.md`, chạy lại build/lint, rồi tiếp tục: implement Apply trong Freight Simulator để ghi adjusted freight về CargoTable, và renumber rows sau add/delete/insert.
```
