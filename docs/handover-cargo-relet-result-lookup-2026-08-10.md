# Handover - Cargo Relet Result and Lookup - 2026-08-10

## Scope completed

- Form: `Cargo Relet Estimation`.
- Main file updated: `apps/voyage-ui/src/components/voyage-estimator/CargoReletApp.tsx`.
- Supporting files updated:
  - `apps/voyage-ui/src/styles.css`
  - `apps/voyage-ui/src/components/voyage-estimator/cargoReletSnapshotMapper.ts`
  - `apps/voyage-ui/src/lib/api/cargoReletSnapshots.ts`
  - `apps/api/src/modules/estimates/dto/cargo-relet-snapshot.dto.ts`
  - `apps/api/src/modules/estimates/services/cargo-relet-estimate-snapshot.service.ts`

## UI changes

- Cargo table:
  - Removed `SUB CP - Brkg` from the visible table.
  - `HEAD CP - Frt Type` and `SUB CP - Frt Type` are now comboboxes with only `F` and `L`.
  - `Frt Type` column width increased to `46px`.
  - `Loading Port` and `Discharging Port` are searchable dropdown/autocomplete cells backed by master-data ports.
- Port Rotation table:
  - Removed `Port Charge` from the visible table.
  - `Port Name / Coordinate` is now a searchable dropdown/autocomplete cell backed by master-data ports.
  - `Port Name / Coordinate` width is now `230px`.
  - `Time Zone` auto-resolves from the selected/typed port:
    - first from inline text like `[+08:00]`;
    - otherwise from matching master-data port `utcOffsetMin`.
  - `SUEZ`, `PANAMA`, `KIEL` checkboxes use `ve-routing-checkboxes` so checked state uses the form text color instead of faint gray.
- Result area:
  - Removed the extra `Analyzer` and `Remark` buttons above `Result`.
  - Kept the `Analyzer` and `Remark` buttons on the right side of the Result header.
  - Removed the previous `Operation Expense` panel from Cargo Relet.
  - Replaced the Result area with the Cargo Relet-specific layout:
    - rows: `Head CP`, `Sub CP`;
    - columns: `TTL Freight`, `Add Comm.`, `Brokerage`, `Liner Terms`, `Demurrage`, `Despatch`, `Total`;
    - separate summary table: `Others`, `PROFIT (USD)`.
- Table control styling:
  - Added `.cargo-relet-estimation` scope.
  - Inside Cargo Relet tables, input/select holders have transparent borders and no focus shadow, leaving only table gridlines visible.

## Calculation behavior

- `Sub CP Net Frt` no longer subtracts `sBrkg` because `SUB CP - Brkg` is no longer user-visible.
- Result table is now calculated from current form data:
  - `TTL Freight = Quantity x Frt Rate`, or `Frt Lumpsum` when `Frt Type = L`.
  - `Add Comm. = TTL Freight x A. Comm %`.
  - `Brokerage` is calculated only for `Head CP`.
  - `Liner Terms` is summed from cargo rows.
  - `Demurrage` and `Despatch` are summed from Port Rotation Head/Sub CP columns.
  - `Total = TTL Freight - Add Comm. - Brokerage - Liner Terms + Demurrage - Despatch`.
  - `PROFIT (USD) = Head CP Total - Sub CP Total + Others`.
- `Others` is editable and recalculates `PROFIT (USD)` immediately.

## Persistence/API

- Cargo Relet snapshot payload now includes:
  - `header.vesselId`
  - `header.otherResultAmount`
- Frontend save/load:
  - saves selected MV `vesselId`;
  - saves editable `Others`;
  - restores `Others` from `snapshot.header.otherResultAmount`, falling back to `snapshot.result.opExpense`.
- Backend DTO:
  - `CargoReletHeaderDto.otherResultAmount?: number`.
- Backend result calculation now matches the new Cargo Relet Result table:
  - no longer uses the old `subNet - headNet - portCharge` formula.
  - stores `Others` in `estimate_results.op_expense` for this form.

## Verification

- `pnpm.cmd --dir apps/voyage-ui build` passed.
- `pnpm.cmd --dir apps/api build` passed.

## Important notes for next chat

- Do not apply this Cargo Relet result layout to Voyage Estimation or Time Charter Estimation. The user explicitly said this Result layout is specific to Cargo Relet.
- Port Charge is still present in the underlying row type and persistence mapping for compatibility, but it is hidden from the Cargo Relet UI.
- `SUB CP - Brkg` is still present in the underlying row type and mapper for compatibility, but it is hidden from the Cargo Relet UI and not used in Sub CP net/result calculation.
- The workspace currently has other dirty files from unrelated simulator/master-data work; do not revert them unless the user explicitly asks.
