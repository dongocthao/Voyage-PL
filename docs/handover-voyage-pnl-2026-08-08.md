# Voyage P&L Coding Handover - 2026-08-08

## Purpose

This file is a compact handover for continuing Voyage P&L coding in a new chat.
It summarizes current implementation state, decisions already confirmed by the user,
verification status, and the recommended next work.

## Repository

- Workspace: `D:\Project\VoyageP&L`
- Frontend app: `apps/voyage-ui`
- API app: `apps/api`
- Package manager: `pnpm`
- UI stack: React/TanStack/Vite + Ant Design + existing voyage estimator custom components.
- Database stack: PostgreSQL/Supabase target, local/dev Prisma flow used for coding.

## User Intent And Working Style

- This chat is for coding implementation of Voyage P&L.
- Keep changes focused on core workflow and avoid drifting into minor side details unless they affect correctness.
- Prefer practical, incremental implementation with verification.
- User often supplies exact UI/business rules; follow those literally where specified.
- Communication language: Vietnamese.

## Key Business Rules Confirmed

### Estimate Snapshot / Save

- Snapshot should store user inputs plus cached result.
- Do not store all calculated intermediate rows unless needed later.
- No version/history for each save for now.
- Report fields such as `C/Base`, `Net Hire` should be recalculated on load, not cached as separate report fields.

### Remarks And Status

- Remarks in all three Estimation forms are general notes.
- Store remark in `estimates.remark`.
- UI Remark button opens a note popup.
- Workflow status after `DRAFT`: `CONFIRMED`, `FIXED`, `LOST`, `CANCELLED`.
- Status changes are manually controlled by user for now, with no transition constraints yet.

### Master Data Priority

Must prioritize:

- Vessel
- Bunker profile
- Port
- Company/account
- CP terms
- Laytime terms
- Fuel type
- Expense categories
- Cargo master

Cargo master is required long-term because Loadable Quantity needs cargo stowage factor.

### Voyage Estimation Rules

- Store UI estimate type code such as `TCOV`, `OVOV`, `RELT` into `estimate_type`.
- Add/store `voyage_no` where needed.
- Header `Open Position` can be treated as first Port Rotation leg.
- Cargo quantity can be non-MT; Cargo needs `unit` field.
- Freight supports:
  - Rate x quantity
  - Lump sum freight
  - `Frt Type`: `F` for rate, `L` for lumpsum
  - `Frt lumpsum` field
- Liner Cost is lump sum, user-entered.
- Demurrage is revenue.
- Despatch is operation expense.
- `Working` days in Port Rotation derive from data.
- Add separate margin sea days and margin port idle days.
- Hire/day and H/Add Comm are user-entered.
- `Net Hire = Hire / Day x (1 - H/Add Comm.)`
- `Total Hire = Net Hire x Total Duration`
- `C/Base = (Op. Expense / Total Duration) + Net Hire - (PROFIT / Total Duration)`

### Laden / Ballast Rule

- A leg is Ballast before cargo is onboard.
- Once cargo is onboard, subsequent legs are Laden until final discharge completes.
- Bunker/canal/intermediate legs can still be Laden if cargo remains onboard.
- Example confirmed: CJK to Tianjin is Ballast; subsequent legs via loading ports, Singapore bunker, Suez canal, and Rotterdam discharge are Laden while cargo is onboard.

### Weather Factor

- Adjusted distance = `distance x (1 + WF)`.
- WF applies to the full leg, including ECA distance.

### ECA Consumption

- ECA days use the corresponding laden/ballast speed; no separate ECA speed.
- In ECA, main engine uses ULSFO.
- Non-ECA defaults to VLSFO.
- Sub engine uses profile fuel consumption rules.

### Freight Simulator

- `Fixed` unchecked: freight of that cargo is variable and can be adjusted to reach Target Profit.
- `Fixed` checked: freight is locked and excluded from simulation adjustment.

### Cargo Relet

- Head CP and Sub CP cargo quantity are the same.
- Head/Sub do not have separate port rotations.
- Dem/Des Head and Sub are calculated separately.
- Bunker/port cost are not included in Cargo Relet; only freight difference.
- `Profit (USD)` can be saved as `estimate_results.side = DIFF`.
- Sub CP may need Brokerage column.
- Port Charge is paid by Sub-side.

### Time Charter Multi Duration

- Hire periods apply sequentially by duration.
- Example: total period 120 days:
  - first 80 days at 5000/day
  - next 40 days at 7000/day
- If period option extends beyond 120 days, extra days use the immediately preceding period rate, i.e. 7000/day.
- If actual period is greater than 80 and less than 120, days after 80 use 7000/day.

### UI Preferences

- Need store UI preferences such as Days/Hours and Port local/UTC.

## Implemented / Touched Areas

### Voyage Estimation Core

Previously implemented across the app:

- Editable state for Cargo grid and Port Rotation grid.
- Save/load Voyage Estimation smoke flow.
- BottomPanels wired to real result API.
- Basic master lookup started for Cargo/Port/Company/CP Terms.
- Port Rotation lookup.
- Calculation engine partly completed:
  - laden/ballast leg logic
  - weather factor distance adjustment
  - ECA/non-ECA bunker consumption with fuel type rule
  - temporary single bunker profile fallback until Vessel Particular UI supports selecting profile.

### UI Additions

Added to Voyage Estimation:

- `Misc Revenue` textbox under Result near Profit/CBase area.
- Search icon next to Misc Revenue label opens modal.
- Search icon next to Operation Expense `Other` opens Other Expense modal.
- Other Expense modal:
  - columns: Exp Id, Exp Description, Exp Type, Exp Amount
  - footer total fills Operation Expense Other textbox
  - width adjusted to about one third screen
  - Save/Cancel buttons
  - row delete button
- Misc Revenue modal:
  - columns: Revenue Id, Revenue Desc, Revenue Type, Revenue Amount
  - footer total fills Misc Revenue textbox
  - width adjusted to about one third screen
  - Save/Cancel buttons
  - row delete button

### UI Changes Requested And Implemented

- Removed standalone `bunker profile` components from previous positions.
- Repositioned Bunker Profile in the Speed Ballast/Laden component style.
- Port Rotation `Type` column is combo/select with:
  - Laden
  - Ballast
  - Loading
  - Discharge
  - Bunkering
  - Canal
  - Drydocking
  - Others
- Cargo `Frt Type` column uses combo/select values `F`, `L`.
- Cargo `Unit` column uses combo/select with common units including `MT`.
- Cargo Liner Term width reduced, Term width increased accordingly.
- Open Position can select from same style/options as Port Rotation Port Name.

### Vessel Form Replacement

User supplied:

- `C:\Users\Administrator\Downloads\new-vessel-form-en.tsx`

Implemented:

- New Ant Design version:
  - `apps/voyage-ui/src/components/voyage-estimator/NewVesselFormAnt.tsx`
- Wired Setting > Vessel route to new form:
  - `apps/voyage-ui/src/components/voyage-estimator/MasterDataForms.tsx`
  - `MasterDataForm({ type: "new-vessel" })` now returns `<NewVesselFormAnt />`.
- Existing Setting menu already points Vessel to `/new-vessel`:
  - `apps/voyage-ui/src/components/workspace/MainWorkspace.tsx`

Scope:

- Preserved supplied design/content structure.
- Converted visual controls to Ant Design components:
  - `Input`
  - `Select`
  - `Tabs`
  - `Button`
  - Ant icons
- Form currently appears UI-only/static; binding to database tables still needs implementation.

## Important Files To Inspect First In New Chat

- `apps/voyage-ui/src/components/voyage-estimator/NewVesselFormAnt.tsx`
- `apps/voyage-ui/src/components/voyage-estimator/MasterDataForms.tsx`
- `apps/voyage-ui/src/components/workspace/MainWorkspace.tsx`
- `apps/voyage-ui/src/components/voyage-estimator/VoyageEstimator.tsx`
- `apps/voyage-ui/src/components/voyage-estimator/VesselSection.tsx`
- `apps/voyage-ui/src/components/voyage-estimator/CargoTable.tsx`
- `apps/voyage-ui/src/components/voyage-estimator/PortRotationTable.tsx`
- `apps/voyage-ui/src/components/voyage-estimator/BottomPanels.tsx`
- `apps/voyage-ui/src/lib/estimate/*`
- `apps/api/src/*`
- `apps/api/prisma/schema.prisma`
- `apps/api/prisma/seed.sql`

Exact filenames under `src/lib/estimate` and `apps/api/src` should be rechecked with `rg --files` because they may evolve.

## Verification Status At Handover

Most recent frontend checks after replacing Vessel form:

- `pnpm --filter @voyage-pnl/voyage-ui exec tsc --noEmit` passed.
- `pnpm --filter @voyage-pnl/voyage-ui build` passed.
- `pnpm --filter @voyage-pnl/voyage-ui lint` passed with 6 pre-existing warnings in:
  - `apps/voyage-ui/src/components/ui/badge.tsx`
  - `apps/voyage-ui/src/components/ui/button.tsx`
  - `apps/voyage-ui/src/components/ui/form.tsx`
  - `apps/voyage-ui/src/components/ui/navigation-menu.tsx`
  - `apps/voyage-ui/src/components/ui/sidebar.tsx`
  - `apps/voyage-ui/src/components/ui/toggle.tsx`

These warnings are `react-refresh/only-export-components` and are unrelated to the new Vessel form.

Prior local test servers may still have been used in earlier work:

- API test server: `http://localhost:3101/api`
- UI test server: `http://localhost:5174/voyage-estimator`

Do not assume they are still running in a new chat. Recheck with PowerShell/processes or restart if needed.

## Recommended Next Steps

### 1. Bind Vessel Form To Data Model

Goal: make Setting > Vessel a real master-data form.

Recommended sequence:

1. Inspect Prisma schema tables:
   - `vessels`
   - `vessel_gears`
   - `vessel_bunker_profiles`
   - `vessel_bunker_consumption`
2. Define a Vessel DTO matching the UI groups.
3. Add API endpoints:
   - list vessels
   - get vessel by id
   - create/update vessel with nested gears/profiles/consumption
4. Convert `NewVesselFormAnt.tsx` from static fields into controlled editable state.
5. Implement Save/Cancel behavior.
6. Add initial validation at UI and API boundary.

### 2. Master Lookup Integration

Continue master lookup work for:

- Ports
- Companies/accounts
- Cargo master
- CP terms
- Laytime terms
- Fuel types
- Expense categories
- Vessel/bunker profiles

### 3. Finish Voyage Estimation Engine

Continue with:

- Final bunker expense calculation from consumption x price.
- Port cost / canal / liner / routing / misc expense integration.
- Misc revenue integration into result.
- Hire/fixed expense final calculation.
- Result API parity with UI bottom panels.
- Regression tests for:
  - laden/ballast
  - WF including ECA
  - ECA fuel selection
  - Dem as revenue, Des as expense
  - lump sum vs rate freight

### 4. Validation And Error Architecture

Implement focused structure:

- Component-level validation: field formatting, required values, basic numeric constraints.
- Business validation: cross-field rules such as cargo/port rotation/freight/hire consistency.
- API validation: schema validation for incoming DTOs.
- Central error handling: consistent API error shape and UI notification/display.

Keep it pragmatic; avoid a large validation framework unless repeated patterns justify it.

### 5. What-If Engine Design

For Freight Simulator and Estimation Analyzer:

- Keep calculation engine pure and deterministic.
- Input: normalized estimate snapshot + scenario overrides.
- Output: result object with enough breakdown for UI.
- Avoid mutating persisted estimate state during simulation.
- Use lightweight recalculation for fast sensitivity analysis.

### 6. Cargo Relet And Time Charter Phases

After Voyage Estimation stabilizes:

- Implement Cargo Relet save/load and calculation.
- Implement Time Charter period hire calculation and save/load.
- Reuse snapshot/validation/error patterns.

## Suggested First Prompt For New Chat

Use this prompt:

```text
Bạn hãy đọc file handover `D:\Project\VoyageP&L\docs\handover-voyage-pnl-2026-08-08.md`, sau đó tiếp tục coding từ bước tiếp theo: bind form Setting > Vessel (`NewVesselFormAnt.tsx`) với các bảng vessels, vessel_gears, vessel_bunker_profiles, vessel_bunker_consumption. Trước khi sửa code, hãy rà lại schema Prisma/API hiện tại và đề xuất checklist ngắn, rồi thực hiện tuần tự.
```

