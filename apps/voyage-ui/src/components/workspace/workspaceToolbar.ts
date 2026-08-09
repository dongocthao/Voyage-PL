import type { ToolbarCommand } from "@/components/voyage-estimator/toolbarCommandManager";

export type WorkspaceToolbarRegistration = {
  hasSheet: boolean;
  hasEstimate: boolean;
  execute: Partial<Record<ToolbarCommand, () => void>>;
};

export type RegisterWorkspaceToolbar = (registration: WorkspaceToolbarRegistration) => void;
