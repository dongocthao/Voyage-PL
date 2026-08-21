import type { ToolbarCommand } from "@/components/voyage-estimator/toolbarCommandManager";

export type WorkspaceToolbarHandler = () => boolean | void | Promise<boolean | void>;

export type WorkspaceToolbarActionMap = Partial<Record<ToolbarCommand, WorkspaceToolbarHandler>>;

export type WorkspaceSheetLifecycle =
  | "init"
  | "loading"
  | "hydrating"
  | "settled"
  | "error";

export type WorkspaceToolbarRegistration = {
  hasSheet: boolean;
  hasEstimate: boolean;
  isDirty?: boolean;
  isUserModified?: boolean;
  lifecycle?: WorkspaceSheetLifecycle;
  execute: WorkspaceToolbarActionMap;
};

export type RegisterWorkspaceToolbar = (registration: WorkspaceToolbarRegistration) => void;

type BuilderInput = {
  hasSheet: boolean;
  hasEstimate?: boolean;
  isDirty?: boolean;
  isUserModified?: boolean;
  lifecycle?: WorkspaceSheetLifecycle;
  actions?: {
    onNew?: WorkspaceToolbarHandler;
    onDelete?: WorkspaceToolbarHandler;
    onSave?: WorkspaceToolbarHandler;
    onSaveAs?: WorkspaceToolbarHandler;
    onOpen?: WorkspaceToolbarHandler;
    onReload?: WorkspaceToolbarHandler;
    onUndo?: WorkspaceToolbarHandler;
    onRedo?: WorkspaceToolbarHandler;
    onIncrease?: WorkspaceToolbarHandler;
    onDecrease?: WorkspaceToolbarHandler;
    onOptions?: WorkspaceToolbarHandler;
    onToOperation?: WorkspaceToolbarHandler;
  };
};

export function createWorkspaceToolbarRegistration({
  hasSheet,
  hasEstimate = false,
  isDirty = false,
  isUserModified = false,
  lifecycle = "settled",
  actions,
}: BuilderInput): WorkspaceToolbarRegistration {
  return {
    hasSheet,
    hasEstimate,
    isDirty,
    isUserModified,
    lifecycle,
    execute: {
      new: actions?.onNew,
      delete: actions?.onDelete,
      save: actions?.onSave,
      saveAs: actions?.onSaveAs,
      open: actions?.onOpen,
      reload: actions?.onReload,
      undo: actions?.onUndo,
      redo: actions?.onRedo,
      increase: actions?.onIncrease,
      decrease: actions?.onDecrease,
      options: actions?.onOptions,
      toOperation: actions?.onToOperation,
    },
  };
}
