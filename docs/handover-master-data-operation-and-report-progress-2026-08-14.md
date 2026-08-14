# Handover - Master Data, Operation, and Report Progress - 2026-08-14

This handover captures work completed up to Friday, August 14, 2026, after the previous handover file `docs/handover-estimation-reports-and-forms-2026-08-12.md`.

## 1. Scope Completed Since Last Handover

Work continued across these areas:

- Operation form UI restructuring and behavior wiring
- Operation report / print implementation
- Time Charter report / print tuning
- Cargo Relet report / print tuning
- Voyage report / print footer fix
- Settings > Port popup form redesign and persistence-safe layout work
- Settings > Cargo popup form redesign and persistence-safe layout work

## 2. Key Source Files Changed

Primary source files updated in this phase:

- `apps/voyage-ui/src/components/voyage-estimator/OperationApp.tsx`
- `apps/voyage-ui/src/components/voyage-estimator/OperationReportPreview.tsx`
- `apps/voyage-ui/src/components/voyage-estimator/TimeCharterReportPreview.tsx`
- `apps/voyage-ui/src/components/voyage-estimator/CargoReletReportPreview.tsx`
- `apps/voyage-ui/src/components/voyage-estimator/VoyageReportPreview.tsx`
- `apps/voyage-ui/src/components/voyage-estimator/CargoReletApp.tsx`
- `apps/voyage-ui/src/components/new-port-form.tsx`
- `apps/voyage-ui/src/components/new-cargo-form.tsx`
- `apps/voyage-ui/src/components/workspace/MainWorkspace.tsx`

Temporary investigation / smoke-test files were also created under `tmp/` during the broader implementation stream. Those are development artifacts and should be reviewed separately before any future cleanup.

## 3. Operation Form Progress

### 3.1 What was implemented

`apps/voyage-ui/src/components/voyage-estimator/OperationApp.tsx`

Main completed items:

- Removed duplicated local window chrome so Operation uses the shared main workspace toolbar flow
- Adjusted top form structure and removed the incorrect extra title repetition in the breadcrumb flow
- Added `Report` and `Print` actions near the existing comparison action
- Added Operation report preview integration
- Reworked Vessel/Bunker/Profile section structure
- Removed the obsolete fuel-condition row beneath Bunker Profile
- Reworked Bunker Profile layout to restore the separate `Bunker profile` combobox and put `Speed` back on the correct row
- Added `Misc Revenue` to Result area
- Renamed result caption to `Profit /(Loss)`
- Added `Other expenses` lookup trigger at the Operation expense area
- Added `Remark` trigger alignment changes on the Operation expense section
- Updated Last Update placement to sit with `Status` / `To be updated`
- Removed the mistaken extra top-right `Last Update : 2020-08-06 17:11, erin`
- Preserved the lower `Last update` near `To be updated`
- Removed `(USD)` from the `PROFIT` label in Operation where requested
- Updated Port Rotation:
  - removed `W.F`
  - changed `L/d Rate` caption to `Channel`
  - disabled/hid the first Arrival date behavior where that cell should not be used
  - applied requested checkbox checked-color changes for route flags

### 3.2 Important business rules now reflected

- Operation is treated as its own business object and not just a visual clone of Voyage Estimation
- Actual bunker consumption is intended to be operation-derived, not hand-edited from Main/Sub profile rows
- Result formula direction was aligned with the user guidance in this phase
- Main/Sub bunker profile rows are treated as read-only profile-driven values, not free-entry values

### 3.3 Still incomplete / next work on Operation

The following still needs to continue in a later session:

- actual operation snapshot persistence end-to-end against the DB
- actual voyage leg persistence and arrival/departure actual reporting
- detailed actual bunker consumption breakdown by loading/discharge/laden/ballast/idle/work/margin
- despatch/demurrage actual logic
- off-hire and actual bunker reading integration into Result
- final Operation validation and save/load verification with the live local database

## 4. Operation Report / Print

### 4.1 New file added

- `apps/voyage-ui/src/components/voyage-estimator/OperationReportPreview.tsx`

### 4.2 Current behavior

- Operation now has working preview/print entry points
- Report layout follows the same general print shell as the estimation reports
- Built from live Operation state, not a static mock

### 4.3 Status

- Build-clean
- Needs later visual QA against user screenshots after more Operation field logic settles

## 5. Voyage / Time Charter / Cargo Relet Report and Print Progress

### 5.1 Voyage report

`apps/voyage-ui/src/components/voyage-estimator/VoyageReportPreview.tsx`

Additional completed fix in this phase:

- Footer print date / page info was moved into a true page-footer style so it no longer sits directly under the rendered form body

### 5.2 Time Charter report

`apps/voyage-ui/src/components/voyage-estimator/TimeCharterReportPreview.tsx`

Substantial tuning was completed:

- rebalanced Head CP and Sub CP widths
- redesigned Port Rotation widths
- added missing `Operation` section
- fixed Bunker Expense missing row content
- added `Other`
- added `Remark`
- reshaped `Result`
- corrected footer/page behavior
- added print/report header parity with Voyage

Status:

- usable and build-clean
- still needs more visual comparison against screenshots/PDF if exact parity is required

### 5.3 Cargo Relet report

`apps/voyage-ui/src/components/voyage-estimator/CargoReletReportPreview.tsx`

Progress completed:

- redesigned report cargo table with dual-row cargo/head-sub structure
- redesigned Port Rotation structure
- reworked bottom area layout multiple times
- added / tuned `Result`, `Other`, `Profit`, and `Remark`
- aligned shared report shell with the other estimation reports

`apps/voyage-ui/src/components/voyage-estimator/CargoReletApp.tsx`

- report / print access is wired into the Cargo Relet form

Status:

- build-clean
- still needs final visual pass from screenshot comparison

## 6. Settings > Port Form Progress

### 6.1 Files

- `apps/voyage-ui/src/components/new-port-form.tsx`
- `apps/voyage-ui/src/components/workspace/MainWorkspace.tsx`

### 6.2 Completed work

The old port form was replaced earlier, and this phase further reworked it into the popup-window version used from Settings.

Completed items:

- popup/window usage from Settings via `MainWorkspace`
- shared title bar and close behavior
- compact ERP-style inputs
- unified control height for textbox/combobox
- retained taller `Remark`
- reduced vertical spacing
- introduced coordinate layout for:
  - `Degrees`
  - `Minutes`
  - `Indicator`
  - `Decimal`
- aligned `Time Zone` and `Daylight Saving Time` on one row
- narrowed popup width to reduce wasted space
- retained mapping and persistence logic to the existing port master API

### 6.3 Critical lesson from this form

Multiple layout mistakes happened because popup width and inner form width were adjusted separately without matching the screenshot first. This must be avoided next time.

### 6.4 Current status

- build-clean
- much closer to requested compact popup behavior
- still may need further pixel tuning if user provides another screenshot

## 7. Settings > Cargo Form Progress

### 7.1 Files

- `apps/voyage-ui/src/components/new-cargo-form.tsx`
- `apps/voyage-ui/src/components/workspace/MainWorkspace.tsx`

### 7.2 What is currently implemented

The form has been reworked away from the earlier shadcn mock and now behaves as a compact popup form using the current project styling direction.

Current active layout direction:

- popup with title bar `Cargo`
- includes `Cargo ID`
- left-side fields:
  - `Cargo ID`
  - `Short Name`
  - `Cargo Group`
  - `Cargo Class`
  - `IBC Code`
  - `IMSBC Code`
- right-side fields:
  - `Full Name`
  - `IMO Name`
  - `Stow Factor`
  - `UN Number`
  - `Default CP Unit`
  - `Capacity Basis`
- lower `Description`
- bottom command row:
  - `Add`
  - `Delete`
  - `Save`
  - `Close`

Data handling completed for the active visible controls:

- validation for visible text fields
- validation for numeric stow-factor fields
- mapping to `CargoMaster`
- save via `saveCargo`
- inactive/delete flow
- reset/clear flow

For GUI fields removed from the current visual form:

- `billBy`
- `productCode`
- right-side checkbox options

those are no longer shown and are mapped to neutral defaults / null on save.

### 7.3 Current status

- build-clean
- actively tuned against screenshots
- not yet final pixel-perfect

### 7.4 Remaining known layout issues

At the end of this session, Cargo popup still needs more screenshot-based tuning. The user specifically requested:

- make left/right outside margins feel visually balanced
- use `Description` width as the visual reference
- ensure the right edge of the second `Stow Factor` box aligns with `Full Name` and `IMO Name`
- ensure the right edge of the `Class` box aligns the same way

This work was partially improved, but should be checked again from the next screenshot before further edits.

## 8. Verification Performed

The main repeated verification commands during this phase were:

- `pnpm --dir apps/voyage-ui exec tsc --noEmit`
- `pnpm --dir apps/voyage-ui build`

Latest status at end of this handover:

- Typecheck: pass
- Build: pass

Note:

- Build/typecheck success does not prove screenshot parity or DB persistence parity.
- Visual and persistence-sensitive tasks still require screenshot comparison and live API/DB validation.

## 9. UI Fixing Mistakes to Avoid in the Next Chat

These are the concrete mistakes that caused wasted iterations and must be avoided:

1. Do not infer UI geometry from source alone when the user explicitly says to follow screenshots.
2. Do not assume the latest screenshot is the “old” form. First identify which screenshot is the current target before editing.
3. Do not adjust only inner form width when the real visual issue is the popup shell width.
4. Do not adjust only popup shell width when the real visual issue is inner control widths.
5. For dual-input rows such as `Stow Factor` and `UN Number / Class`, always align the outer right edge to the long inputs above, not just by approximate total width.
6. Do not keep removed GUI controls in the visual layout after the user has eliminated them from the target screenshot.
7. When a control no longer exists in the GUI but still exists in the data model, hide it and map it safely to defaults/null instead of forcing it into the UI.
8. For master-data popup forms, treat the screenshot as the authority for:
   - popup width
   - control width
   - inter-column gap
   - right-edge alignment
   - bottom button alignment
9. When the user says “do not guess,” ask for another screenshot rather than inventing spacing from old layouts.

## 10. Database / Seeding / Next Functional Work

The next major stream the user wants to continue is not only UI polish, but also functional readiness for trial use:

- seed lookup / master data
- create some additional forms
- continue fixing runtime issues that appear during real trial operation

Important context:

- local PostgreSQL was switched to a manually created database on `localhost:5432`
- database name is `voyage_pnl_dev`
- do not write local password/secret values into committed docs or source

Before seeding in the next chat:

1. confirm API server local DB connection is using the intended local DB
2. inspect Prisma schema and existing seed or migration utilities
3. decide whether lookup seeding should be:
   - SQL script
   - Prisma seed
   - API-based import
   - JSON fixture loader
4. seed only the lookup/master data sets the current forms depend on first

Priority lookup groups likely needed soon:

- countries
- ports
- port types / status
- units
- cargo groups / cargo classes
- business/account lookup sets used by estimation forms
- vessels / bunker profile related defaults where applicable

## 11. Recommended Resume Order for the Next Chat

Use this order to continue efficiently:

1. Re-open and visually finish `Cargo` popup from the latest screenshot
2. Re-open and visually finish `Ports` popup if the user provides another screenshot
3. Verify `Operation` current behavior on screen before deeper persistence work
4. Wire / verify local DB connection for `voyage_pnl_dev`
5. Seed the first batch of lookup data needed by current forms
6. Create the next requested new forms
7. Run trial flows and fix runtime issues that appear

## 12. Suggested New-Chat Kickoff Prompt

To continue cleanly in a new chat, use something close to this:

`Tiếp tục trong repo D:\\Project\\VoyageP&L. Trước hết đọc docs/handover-master-data-operation-and-report-progress-2026-08-14.md và các handover liên quan gần nhất. Sau đó tiếp tục theo thứ tự: (1) chốt nốt popup Cargo theo screenshot mới nhất, (2) kiểm tra popup Ports nếu cần, (3) kết nối/verify DB voyage_pnl_dev local, (4) bắt đầu seeding lookup/master data tối thiểu để chạy thử, (5) tiếp tục tạo form mới và sửa lỗi phát sinh. Không tự đoán layout nếu user đã gửi screenshot; phải bám screenshot làm chuẩn.`

## 13. Safety Note

Do not revert unrelated in-flight changes in the tree. There are both source changes and temporary local investigation files in the workspace. Inspect `git status` first before making destructive cleanup choices.
