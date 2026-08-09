export type ToolbarCommand =
  | "new"
  | "delete"
  | "save"
  | "saveAs"
  | "open"
  | "reload"
  | "undo"
  | "redo"
  | "increase"
  | "decrease"
  | "options"
  | "toOperation";

export type ToolbarCommandState = Record<ToolbarCommand, boolean>;

export type ToolbarCommandResult =
  { ok: true; command: ToolbarCommand } | { ok: false; command: ToolbarCommand; message: string };

export class ToolbarCommandManager {
  constructor(
    private readonly hasSheet: boolean,
    private readonly hasEstimate: boolean,
    private readonly canRedo = false,
  ) {}

  getState(): ToolbarCommandState {
    return {
      new: true,
      delete: true,
      save: this.hasSheet,
      saveAs: this.hasSheet,
      open: true,
      reload: this.hasSheet && this.hasEstimate,
      undo: this.hasSheet,
      redo: this.hasSheet && this.canRedo,
      increase: this.hasSheet,
      decrease: this.hasSheet,
      options: true,
      toOperation: this.hasSheet,
    };
  }

  execute(command: ToolbarCommand): ToolbarCommandResult {
    if ((command === "open" || command === "delete") && !this.hasSheet) {
      return {
        ok: false,
        command,
        message: command === "open" ? "There is no sheet to open." : "There is no sheet to delete.",
      };
    }

    if (!this.getState()[command]) {
      return {
        ok: false,
        command,
        message:
          command === "open"
            ? "There is no sheet to open."
            : command === "delete"
              ? "There is no sheet to delete."
              : `Command ${command} is not available for the current sheet state.`,
      };
    }

    return { ok: true, command };
  }
}
