# Voyage Estimation Handover - 2026-08-08

## Latest User Request

Continue checklist items 4-5 for Voyage Estimation:

4. Sync Bottom Panels with result API.
5. Complete grid interactions.

User also asked to save state in project folder because token/account may run out.

## Current Workspace

- Root: `D:\Project\VoyageP&L`
- UI: `apps/voyage-ui`
- API: `apps/api`
- Package manager: `pnpm`

## Work Completed In This Continuation

### Previous continuation in same chat

- `VoyageEstimator.tsx`
  - Added `fetchBunkerProfiles({ vesselId })`.
  - Bunker profiles are refetched when Vessel changes.
  - Vessel change clears stale `bunkerProfileId`.
  - Added `estimateTypeCode` state, wired to `VesselSection`.
  - Added lookup hydration for Cargo/Port rows to populate ids when labels match master data.
- `VesselSection.tsx`
  - Est Type select is now controlled by parent state.
- `voyageSnapshotMapper.ts`, `voyageSnapshots.ts`, API DTO
  - Added `estimateTypeCode` to payload/DTO.
  - Note: DB currently only has enum `estimate_type = VOYAGE/CARGO_RELET/TIME_CHARTER`; persisting UI codes like `TCOV` needs a migration/column.
- `voyage-calculation.engine.ts`
  - Weather Factor now recalculates sea days from `distance * (1 + WF) / speed / 24` when distance and speed exist.
  - Ballast/Laden logic now treats legs before first loading as ballast and legs after loading as laden until discharge count catches up.

### This final continuation

- `CargoTable.tsx`
  - Removed static `cargoTotals` usage.
  - Cargo summary now calculates from current rows:
    - quantity
    - average freight
    - freight lumpsum
    - total freight
    - weighted Add Comm / Brokerage / Freight Tax
    - liner term
- `PortRotationTable.tsx`
  - Removed static `portRotationTotals` usage.
  - Port Rotation summary now calculates from current rows:
    - distance
    - ECA
    - sea
    - idle including margin idle
    - working
    - dem
    - des
    - port charge
    - first arrival
    - last departure

## Verification Run

Fresh checks after latest edits:

- `pnpm --filter @voyage-pnl/voyage-ui exec tsc --noEmit` passed.
- `pnpm --filter @voyage-pnl/api typecheck` passed.

Build/lint were not rerun after the final dynamic totals patch due token pressure. Earlier in the same chat:

- API typecheck/build/lint passed.
- UI typecheck/build passed.
- UI lint passed with the known 6 pre-existing Fast Refresh warnings in `components/ui/*`.

## Important Files

- `apps/voyage-ui/src/components/voyage-estimator/VoyageEstimator.tsx`
- `apps/voyage-ui/src/components/voyage-estimator/VesselSection.tsx`
- `apps/voyage-ui/src/components/voyage-estimator/CargoTable.tsx`
- `apps/voyage-ui/src/components/voyage-estimator/PortRotationTable.tsx`
- `apps/voyage-ui/src/components/voyage-estimator/BottomPanels.tsx`
- `apps/voyage-ui/src/components/voyage-estimator/voyageSnapshotMapper.ts`
- `apps/voyage-ui/src/lib/api/masterData.ts`
- `apps/voyage-ui/src/lib/api/voyageSnapshots.ts`
- `apps/api/src/modules/estimates/dto/voyage-estimate-snapshot.dto.ts`
- `apps/api/src/modules/estimates/calculation/voyage-calculation.engine.ts`
- `apps/api/src/modules/estimates/services/voyage-estimate-snapshot.service.ts`

## Remaining Work For Items 4-5

### Item 4: Bottom Panels Result API Sync

- BottomPanels already displays API result for Revenue, Op Expense, Op Profit, Total Hire, Total Freight, Profit, bunker summary.
- Still improve:
  - Add `C/Base` display from backend report summary or compute in UI from result + hire fields.
  - Add Total Expense row if desired: `opExpense + totalHire`.
  - Ensure Bunker Price edits in Bunker Expense table feed into snapshot/result, currently bunker table is display-only unless using simulator.
  - Consider an explicit Calculate button separate from Save if users expect calculation without persistence.

### Item 5: Grid Interactions

- Row add/delete/insert already exists via `useRowOps`.
- Cargo totals and Port Rotation totals are now dynamic.
- Still improve:
  - Freight Type `F/L`: disable or visually mute `Frt` when `L`, and disable/mute `Frt Lumpsum` when `F`.
  - Add `isFreightFixed` checkbox column for Freight Simulator.
  - Re-number rows after add/delete/insert.
  - Port Rotation Type currently maps `Drydocking/Others` to `OTHER`; confirm API enum if separate drydock needed.
  - Working days are calculated in backend, but UI working cell remains editable/visible from row state. Decide whether UI should recalc on edit or only show backend result after save/calculate.

## Suggested Next Prompt

```text
Đọc `D:\Project\VoyageP&L\docs\handover-voyage-estimation-continue-2026-08-08.md`, tiếp tục item 4-5. Trước tiên chạy lại UI build/lint sau patch cuối, rồi hoàn thiện C/Base/Total Expense trong BottomPanels và Freight Type F/L enable-disable + Fixed checkbox trong CargoTable.
```
