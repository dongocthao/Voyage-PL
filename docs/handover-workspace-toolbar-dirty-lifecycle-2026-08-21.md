# Handover Workspace Toolbar, Dirty Lifecycle, and Master Data Progress

Date: 2026-08-21

## Scope completed

This handover summarizes the current state of the workspace command system, dirty-form lifecycle tracking, master-data list screens, vessel/fuel normalization work, and recent verification.

## Main workspace and toolbar

Core workspace command routing is centered in:

- `apps/voyage-ui/src/components/workspace/MainWorkspace.tsx`
- `apps/voyage-ui/src/components/workspace/workspaceToolbar.ts`
- `apps/voyage-ui/src/components/workspace/useWorkspaceDirtyTracker.ts`

Implemented:

1. Active-sheet-aware toolbar execution.
2. Central command policy for page-specific command availability.
3. Dirty guard with lifecycle-aware behavior:
   - `loading`
   - `hydrating`
   - `settled`
   - `error`
4. Unified unsaved-changes modal for:
   - tab switching
   - sidebar page switching
   - toolbar commands such as `New`, `Open`, `Reload`, and `Delete`

## Hybrid dirty lifecycle rollout

The hybrid dirty lifecycle standard is now applied to all 4 primary sheets:

- `apps/voyage-ui/src/components/voyage-estimator/VoyageEstimator.tsx`
- `apps/voyage-ui/src/components/voyage-estimator/TimeCharterApp.tsx`
- `apps/voyage-ui/src/components/voyage-estimator/CargoReletApp.tsx`
- `apps/voyage-ui/src/components/voyage-estimator/OperationApp.tsx`

Current rule:

- dirty only when:
  - lifecycle is `settled`
  - user interaction really occurred
  - current signature differs from clean baseline

This was introduced to stop false-positive dirty prompts caused by hydration/reload flows.

## Command semantics status

The lightweight phase-4-to-6 consolidation is implemented in `MainWorkspace.tsx`.

Current shape:

1. `getCommandPolicy(...)` centralizes page-level command allowance.
2. `getCommandLabel(...)` normalizes user-facing command messages.
3. Sidebar/settings navigation now goes through the same dirty guard path as sheet switching.
4. `Operation` explicitly blocks `Delete Sheet`.
5. List/master pages do not expose unsupported commands such as save/reload/to-operation unless they provide handlers.

## Workspace list screens and market/settings additions

List-style screens currently in workspace:

- `apps/voyage-ui/src/components/estimate-list-form.tsx`
- `apps/voyage-ui/src/components/operation-list-form.tsx`
- `apps/voyage-ui/src/components/cargo-list-form.tsx`
- `apps/voyage-ui/src/components/port-list-form.tsx`
- `apps/voyage-ui/src/components/order-list-form.tsx`
- `apps/voyage-ui/src/components/position-list-form.tsx`

Sidebar grouping and breadcrumb updates were also added for market-module screens.

## Port Activities and operation integrations

Related files:

- `apps/voyage-ui/src/components/voyage-estimator/PortActivitiesDialog.tsx`
- `apps/voyage-ui/src/components/voyage-estimator/OperationApp.tsx`
- `apps/voyage-ui/src/components/voyage-estimator/OperationReports.tsx`
- `apps/voyage-ui/src/lib/api/operationPortActivities.ts`
- `apps/api/src/modules/estimates/dto/operation-port-activities.dto.ts`
- `apps/api/src/modules/estimates/services/operation-port-activities.service.ts`

Implemented:

1. Combined Port Activities dialog replacing separate arrival/departure forms.
2. Port stay category calculations and save path.
3. Summary pushback into Operation fields.
4. Additional local popup dirty-guard experiments were started for `PortActivitiesDialog` and `OperationReports`.

Note:

- popup-level guard work was explored but not promoted as the main project direction;
- workspace-level dirty lifecycle remains the important completed path.

## Vessel/fuel normalization and master data backend work

Backend/source areas:

- `apps/api/prisma/schema.prisma`
- `apps/api/prisma/migrations/20260818103000_normalize_vessel_and_fuel_catalogs/`
- `apps/api/prisma/migrations/20260818171000_cleanup_legacy_fuel_types/`
- `apps/api/prisma/migrations/20260818174000_enforce_canonical_fuel_types/`
- `apps/api/prisma/migrations/20260818180000_fix_bio_alt_canonical_flags/`
- `apps/api/prisma/migrations/20260818183000_delete_unused_legacy_fuel_types/`
- `apps/api/prisma/migrations/20260818184000_delete_unused_legacy_fuel_types_fix/`
- `apps/api/src/modules/master-data/*`
- `apps/api/src/modules/estimates/services/estimate-deletion.service.ts`
- `apps/api/src/modules/master-data/catalog-alias.controller.ts`

Frontend/source areas:

- `apps/voyage-ui/src/components/voyage-estimator/NewVesselFormAnt.tsx`
- `apps/voyage-ui/src/lib/api/masterData.ts`
- `apps/voyage-ui/src/lib/api/vessels.ts`
- `apps/voyage-ui/src/lib/api/cargoes.ts`
- `apps/voyage-ui/src/lib/api/ports.ts`

Implemented:

1. Vessel kind/type normalization support.
2. Fuel category/type normalization support.
3. Cleanup toward canonical bunker/fuel type usage.
4. Master-data seed/migration support and alias lookup plumbing.

## LAN/testing support

Related files:

- `apps/voyage-ui/.env.lan.example`
- `docs/lan-setup.md`
- `apps/api/scripts/start-dev-safe.cjs`

These were added to help local LAN app access and safer local start flows.

## Verification status

Verified successfully during this run:

1. `pnpm exec tsc --noEmit` in `apps/voyage-ui`
2. Workspace E2E suite:
   - `tmp/toolbar-workspace.spec.js`
   - `tmp/estimate-delete.spec.js`
   - `tmp/active-sheet-save.spec.js`
3. Additional command-policy and sidebar-dirty-guard tests were added:
   - `apps/voyage-ui/tmp/command-policy.spec.js`
   - `apps/voyage-ui/tmp/sidebar-dirty-guard.spec.js`

Important note on phase 7:

- the original 3 workspace tests passed;
- the 2 new tests are still being tuned around flyout navigation stability and should be treated as in-progress test coverage, not yet final proof.

## Recommended next step for a new chat

If continuing from a new chat, start here:

1. Read this handover.
2. Inspect `MainWorkspace.tsx`, `workspaceToolbar.ts`, and `useWorkspaceDirtyTracker.ts`.
3. If phase 7 continues, stabilize:
   - `apps/voyage-ui/tmp/command-policy.spec.js`
   - `apps/voyage-ui/tmp/sidebar-dirty-guard.spec.js`
4. If product work resumes instead of infra work, treat phases 1-6 as effectively complete and move on from workspace command infrastructure.
