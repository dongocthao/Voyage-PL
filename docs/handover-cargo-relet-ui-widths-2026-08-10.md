# Handover - Cargo Relet UI Widths - 2026-08-10

## Current status

- Form Cargo Relet Estimation is the active working area.
- Latest user-reviewed UI work focused on default column widths in the Cargo Relet `Port Rotation` table.
- Changes were made in `apps/voyage-ui/src/components/voyage-estimator/CargoReletApp.tsx`.

## Port Rotation column widths now configured

| Column | Width |
| --- | ---: |
| `#` | `36px` |
| `Type` | `85px` |
| `Port Name / Coordinate` | `150px` |
| `Time Zone` | `85px` |
| `TTL` | `56px` |
| `ECA` | `44px` |
| `WF` | `44px` |
| `Spd` | `44px` |
| `Sea` | `60px` |
| `HEAD CP - L/D Rate` | `70px` |
| `HEAD CP - Dem` | `80px` |
| `HEAD CP - Des` | `80px` |
| `SUB CP - L/D Rate` | `70px` |
| `SUB CP - Dem` | `80px` |
| `SUB CP - Des` | `80px` |
| `Idle` | `60px` |
| `Working` | `60px` |
| `Port Charge` | `6.4%` |
| `Arrival` | `140px` |
| `Departure` | `140px` |

## Verification

- `pnpm.cmd --dir apps/voyage-ui build` passed after the latest width changes.

## Notes for next chat

- The user is manually reviewing visual layout and may continue to request pixel-level width changes.
- `useResizableColumns` allows drag resizing, but column widths are not persisted from the browser runtime. Default widths must still be saved into source when the user confirms them.
- Avoid adding a local title bar or local toolbar to estimation forms. The main workspace toolbar is the intended command surface.
