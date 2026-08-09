# Handover New Vessel - 2026-08-09

## Context

- Workspace: `D:\Project\VoyageP&L`
- Current date/time when saved: `2026-08-09 21:26 +07`
- Main area: Voyage UI `New Vessel` form and supporting master-data API.
- Important note: folder rename from `VoyageP&L` to `Voyage PL` was requested earlier but could not be completed because the active workspace/process held a Windows handle on the directory. Current folder remains `D:\Project\VoyageP&L`.

## Current Git Status

- `git rev-parse --show-toplevel` returns: `fatal: not a git repository`.
- The folder contains `.gitignore`, but no `.git` directory was visible from PowerShell.
- No Git remote is configured in this checkout, so pushing to GitHub cannot be done from the current state until a Git repository is initialized or the correct Git checkout/remote is restored.

## Main Files Changed

### API

- `apps/api/src/modules/master-data/master-data.controller.ts`
  - Added lookup endpoints:
    - `GET /api/master-data/vessel-kinds`
    - `GET /api/master-data/vessel-types`

- `apps/api/src/modules/master-data/master-data.service.ts`
  - Added `vesselKinds(query?: string)`.
  - Added `vesselTypes(query?: string)`.
  - These return lookup rows as `{ id, code, name }`.

### Voyage UI API Helpers

- `apps/voyage-ui/src/lib/api/masterData.ts`
  - Added lookup kinds:
    - `vessel-kinds`
    - `vessel-types`

- `apps/voyage-ui/src/lib/api/vessels.ts`
  - Added `listVessels(query = "")`.
  - Kept `getVessel(id)` and `saveVessel(vessel)`.
  - Added payload sanitization before save:
    - trim strings
    - convert blank strings to `null`
    - clean numeric fields
    - clean nested gears/profiles/modes/consumption

### New Vessel Form

- `apps/voyage-ui/src/components/voyage-estimator/NewVesselFormAnt.tsx`

Implemented/updated:

- Removed the instructional text:
  - `Input all blanks of Speed and Bunker consumption to calculate voyage estimation.`
- Removed the top `Load Vessel / Select existing vessel / New / New vessel` UI row.
- Bound main vessel fields to state and lookup data:
  - `M.V.` -> `mvName`
  - `Vessel Kind` -> `vesselKindId` combobox using `vessel-kinds`
  - `Vessel Type` -> `vesselTypeId` combobox using `vessel-types`
  - `Owner` -> `ownerCompanyId` combobox using `companies`
  - dimensions/canal/general fields bind to `VesselMaster`
- `Daily Hire`, `ILOHC`, `CEV`, and `PNI` are now editable UI controls.
  - Current schema `vessels` has no columns for these four values, so they are local UI state only and are not persisted yet.
- Bunker Profile:
  - profile dropdown remains.
  - only one datebox is displayed: `Active from`.
  - `Active to` datebox was removed from the main UI.
  - when `Active from` changes, `effectiveTo` is set to `null`.
  - `Active` combobox is the same width as the `Active from` datebox.
  - profile add/delete remain.
- Performance tabs:
  - tabs `Full`, `Eco`, `Custom1`, `Custom2`, `Custom3` each contain speed and bunker consumption controls.
  - switching profile changes the speed/consumption set.
  - `Copy Normal to ECA` updates ECA rows from Normal for current fuel role/mode/profile.
- Gear and HA/HO:
  - gear list is selectable.
  - delete removes selected row instead of always removing the last row.
  - gear list height shortened so its bottom aligns around the `Add/Delete` button row.
  - `HO/HA` through `Hatch Cover Strength` use the same vertical spacing rhythm as `ILOHC` and `CEV`.
  - `Midship` combobox is aligned with `Add/Delete`.
- Layout polish:
  - vertical spacing normalized around the form based on the `Daily Hire / ILOHC / CEV` rhythm.
  - `M.V.`, `Vessel Kind`, `Draft`, and `ICE Class` component left edges align with `DWT`.
  - Canal spacing intentionally preserved as requested.

## Tests And Verification Run

Commands already run successfully:

```powershell
pnpm.cmd --filter @voyage-pnl/api build
pnpm.cmd --filter @voyage-pnl/api lint
pnpm.cmd --filter @voyage-pnl/voyage-ui build
pnpm.cmd --filter @voyage-pnl/voyage-ui lint
```

Notes:

- UI lint passes with 6 existing Fast Refresh warnings in shared UI components:
  - `apps/voyage-ui/src/components/ui/badge.tsx`
  - `apps/voyage-ui/src/components/ui/button.tsx`
  - `apps/voyage-ui/src/components/ui/form.tsx`
  - `apps/voyage-ui/src/components/ui/navigation-menu.tsx`
  - `apps/voyage-ui/src/components/ui/sidebar.tsx`
  - `apps/voyage-ui/src/components/ui/toggle.tsx`

Additional verification scripts:

- `tmp/new-vessel-api-e2e.cjs`
  - Creates a vessel through API.
  - Updates it.
  - Loads it back.
  - Verifies nested `gears`, `bunkerProfiles`, `modes`, and `consumption`.
  - Last known pass: `New Vessel API E2E passed for vessel 2`.

- `tmp/new-vessel-ui-smoke.py`
  - Opens `/new-vessel`.
  - Verifies key UI text.
  - Clicks `OK` and verifies `M.V. is required.`
  - Last known pass with API on `3004` and UI on `5198`.

Example smoke command used:

```powershell
$env:NEW_VESSEL_URL='http://127.0.0.1:5198/new-vessel'
python 'C:\Users\Administrator\.codex\skills\webapp-testing\scripts\with_server.py' `
  --server "powershell -NoProfile -Command `$env:DATABASE_URL='postgresql://postgres@localhost:55432/voyage_pnl_dev?schema=public'; `$env:PORT='3004'; node apps/api/dist/main.js" `
  --port 3004 `
  --server "powershell -NoProfile -Command `$env:VITE_API_BASE_URL='http://127.0.0.1:3004/api'; pnpm.cmd --dir apps/voyage-ui exec vite dev --host 127.0.0.1 --port 5198 --strictPort" `
  --port 5198 `
  --timeout 60 `
  -- python tmp\new-vessel-ui-smoke.py
```

## Local Database Notes

Project PostgreSQL dev data path:

```text
D:\Project\VoyageP&L\infra\.postgres-dev\data
```

Connection string used:

```text
postgresql://postgres@localhost:55432/voyage_pnl_dev?schema=public
```

Start command used previously:

```powershell
& 'C:\Program Files\PostgreSQL\18\bin\pg_ctl.exe' `
  -D 'D:\Project\VoyageP&L\infra\.postgres-dev\data' `
  -l 'D:\Project\VoyageP&L\infra\.postgres-dev\postgres.log' `
  -o '-p 55432' start
```

## Known Remaining Items

- Persist `Daily Hire`, `ILOHC`, `CEV`, and `PNI` only after confirming target DB columns/schema design.
- If manual testing needs a stable URL, restart API/UI dev servers and use:
  - `http://127.0.0.1:5198/new-vessel`
- GitHub push is blocked until this folder is a Git repository or the correct Git checkout/remote is provided.

