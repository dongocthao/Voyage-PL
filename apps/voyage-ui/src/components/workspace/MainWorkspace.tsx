import {
  Anchor,
  BriefcaseBusiness,
  ChevronDown,
  CircleDollarSign,
  Database,
  FileMinus,
  FilePlus2,
  FolderOpen,
  Gauge,
  History,
  LayoutDashboard,
  LogOut,
  Maximize2,
  Minus,
  PackageOpen,
  Plus,
  RefreshCw,
  RotateCcw,
  RotateCw,
  Save,
  SaveAll,
  Search,
  Settings,
  Ship,
  UserRound,
  X,
  ZoomIn,
  ZoomOut,
} from "lucide-react";
import { Suspense, lazy, useCallback, useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import { Modal } from "antd";
import VoyageEstimator from "@/components/voyage-estimator/VoyageEstimator";
import DialogShell from "@/components/voyage-estimator/DialogShell";
import {
  ToolbarCommandManager,
  type ToolbarCommand,
  type ToolbarCommandState,
} from "@/components/voyage-estimator/toolbarCommandManager";
import type { WorkspaceSheetLifecycle, WorkspaceToolbarRegistration } from "./workspaceToolbar";

const OperationApp = lazy(() => import("@/components/voyage-estimator/OperationApp"));
const TimeCharterApp = lazy(() => import("@/components/voyage-estimator/TimeCharterApp"));
const CargoReletApp = lazy(() => import("@/components/voyage-estimator/CargoReletApp"));
const CharterPartyApp = lazy(() => import("@/components/voyage-estimator/CharterPartyApps"));
const EstimateListForm = lazy(() =>
  import("@/components/estimate-list-form").then((module) => ({
    default: module.EstimateListForm,
  })),
);
const OperationListForm = lazy(() =>
  import("@/components/operation-list-form").then((module) => ({
    default: module.OperationListForm,
  })),
);
const CargoListForm = lazy(() =>
  import("@/components/cargo-list-form").then((module) => ({
    default: module.CargoListForm,
  })),
);
const OrderListForm = lazy(() =>
  import("@/components/order-list-form").then((module) => ({
    default: module.OrderListForm,
  })),
);
const PortListForm = lazy(() =>
  import("@/components/port-list-form").then((module) => ({
    default: module.PortListForm,
  })),
);
const PositionListForm = lazy(() =>
  import("@/components/position-list-form").then((module) => ({
    default: module.PositionListForm,
  })),
);
const OptionForm = lazy(() =>
  import("@/components/option-form").then((module) => ({
    default: module.OptionForm,
  })),
);
const NewCargoForm = lazy(() =>
  import("@/components/new-cargo-form").then((module) => ({
    default: module.NewCargoForm,
  })),
);
const NewPortForm = lazy(() =>
  import("@/components/new-port-form").then((module) => ({
    default: module.NewPortForm,
  })),
);
const NewVesselFormAnt = lazy(() => import("@/components/voyage-estimator/NewVesselFormAnt"));

type WorkspacePage =
  | "voyage-estimation"
  | "estimate-list"
  | "time-charter"
  | "cargo-relet"
  | "operation-list"
  | "operation"
  | "voyage-charter-party"
  | "time-charter-party"
  | "cargo-list"
  | "order-list"
  | "port-list"
  | "position-list"
  | "option";

type WorkspaceSheet = {
  id: string;
  page: WorkspacePage;
  title: string;
  estimateId?: string;
  operationId?: string;
  sourceEstimateId?: string;
  closable: boolean;
};

type PendingSheetAction = {
  sheetId: string;
  title: string;
  action: () => void | Promise<void>;
  allowSave: boolean;
  reason?: "dirty" | "hydrating" | "error";
};

type RibbonAction = {
  command: ToolbarCommand;
  label: string;
  icon: React.ComponentType<{ className?: string; strokeWidth?: number; style?: CSSProperties }>;
  color: string;
};

type SettingsOption = {
  label: string;
  dialog?: "option" | "vessel";
  page?: WorkspacePage;
};

type SettingDialogType = "option" | "vessel" | "cargo" | "port";

const ribbonGroups: RibbonAction[][] = [
  [
    { command: "new", label: "New Sheet", icon: FilePlus2, color: "#008d61" },
    { command: "delete", label: "Delete sheet", icon: FileMinus, color: "#ce3f34" },
  ],
  [
    { command: "save", label: "Save", icon: Save, color: "#006994" },
    { command: "saveAs", label: "Save as", icon: SaveAll, color: "#007A9E" },
    { command: "open", label: "Open", icon: FolderOpen, color: "#d28a00" },
    { command: "reload", label: "Reload", icon: RefreshCw, color: "#1b7f5f" },
  ],
  [
    { command: "undo", label: "Undo", icon: RotateCcw, color: "#6d7a86" },
    { command: "redo", label: "Redo", icon: RotateCw, color: "#6d7a86" },
  ],
  [
    { command: "increase", label: "Increase", icon: Plus, color: "#006994" },
    { command: "decrease", label: "Decrease", icon: Minus, color: "#006994" },
    { command: "options", label: "Option", icon: Settings, color: "#5f6470" },
    { command: "toOperation", label: "To Operation", icon: History, color: "#007A9E" },
  ],
];

const estimationOptions: Array<{ id: WorkspacePage; label: string }> = [
  { id: "estimate-list", label: "Estimate List" },
  { id: "voyage-estimation", label: "Voyage Estimation" },
  { id: "time-charter", label: "Time Charter Estimation" },
  { id: "cargo-relet", label: "Cargo Relet" },
];

const charterPartyOptions: Array<{ id: WorkspacePage; label: string }> = [
  { id: "voyage-charter-party", label: "Voyage Charter Party" },
  { id: "time-charter-party", label: "Time Charter Party" },
];

const settingsOptions: SettingsOption[] = [
  { label: "Option", dialog: "option" },
  { label: "Vessel", dialog: "vessel" },
  { label: "Cargo", page: "cargo-list" },
  { label: "Port", page: "port-list" },
];

const pageLabels: Record<WorkspacePage, string> = {
  "voyage-estimation": "Voyage Estimation",
  "estimate-list": "Estimate List",
  "time-charter": "Time Charter Estimation",
  "cargo-relet": "Cargo Relet",
  "operation-list": "Operation List",
  operation: "Operation",
  "voyage-charter-party": "Voyage Charter Party",
  "time-charter-party": "Time Charter Party",
  "cargo-list": "Cargo List",
  "order-list": "Order list",
  "port-list": "Port List",
  "position-list": "Position list",
  option: "Option",
};

const defaultToolbarRegistration: WorkspaceToolbarRegistration = {
  hasSheet: false,
  hasEstimate: false,
  isDirty: false,
  isUserModified: false,
  lifecycle: "settled",
  execute: {},
};

const allCommands: ToolbarCommand[] = [
  "new",
  "delete",
  "save",
  "saveAs",
  "open",
  "reload",
  "undo",
  "redo",
  "increase",
  "decrease",
  "options",
  "toOperation",
];

const dirtySensitiveCommands = new Set<ToolbarCommand>(["new", "delete", "open", "reload"]);

function getCommandLabel(command: ToolbarCommand) {
  switch (command) {
    case "new":
      return "New Sheet";
    case "delete":
      return "Delete Sheet";
    case "save":
      return "Save";
    case "saveAs":
      return "Save As";
    case "open":
      return "Open";
    case "reload":
      return "Reload";
    case "undo":
      return "Undo";
    case "redo":
      return "Redo";
    case "increase":
      return "Increase";
    case "decrease":
      return "Decrease";
    case "options":
      return "Option";
    case "toOperation":
      return "To Operation";
    default:
      return command;
  }
}

function getCommandPolicy(page: WorkspacePage | undefined, command: ToolbarCommand) {
  if (!page) {
    return { allowed: false, reason: "There is no active sheet." };
  }

  if (page === "operation" && command === "delete") {
    return { allowed: false, reason: "Delete Sheet is not available for Operation." };
  }

  if (
    (page === "cargo-list" ||
      page === "port-list" ||
      page === "order-list" ||
      page === "position-list" ||
      page === "option") &&
    (command === "save" || command === "saveAs" || command === "reload" || command === "toOperation")
  ) {
    return {
      allowed: false,
      reason: `${getCommandLabel(command)} is not available for ${pageLabels[page]}.`,
    };
  }

  return { allowed: true };
}

function singletonSheet(page: WorkspacePage, closable = true): WorkspaceSheet {
  return {
    id: `page:${page}`,
    page,
    title: pageLabels[page],
    closable,
  };
}

function estimateSheet(page: "voyage-estimation" | "time-charter" | "cargo-relet", estimateId?: string) {
  return {
    id: estimateId ? `${page}:${estimateId}` : `page:${page}`,
    page,
    estimateId,
    title: estimateId ? `${pageLabels[page]} ${estimateId}` : pageLabels[page],
    closable: true,
  } satisfies WorkspaceSheet;
}

function operationSheet({
  operationId,
  sourceEstimateId,
}: {
  operationId?: string;
  sourceEstimateId?: string;
}) {
  const suffix = operationId ?? (sourceEstimateId ? `E${sourceEstimateId}` : "New");
  return {
    id: operationId
      ? `operation:${operationId}`
      : sourceEstimateId
        ? `operation:estimate:${sourceEstimateId}`
        : "page:operation",
    page: "operation" as const,
    operationId,
    sourceEstimateId,
    title: `Operation ${suffix}`,
    closable: true,
  } satisfies WorkspaceSheet;
}

function sectionForPage(page: WorkspacePage) {
  if (page === "option" || page === "cargo-list" || page === "port-list") return "Settings";
  if (page === "order-list" || page === "position-list") return "Market";
  if (page.includes("charter-party")) return "Charter Party";
  if (page === "operation" || page === "operation-list") return "Operation";
  return "Estimation";
}

function titleForEstimate(type: "Voyage Charter" | "Time Charter" | "Cargo Relet", estimateId: string) {
  if (type === "Time Charter") return `Time Charter ${estimateId}`;
  if (type === "Cargo Relet") return `Cargo Relet ${estimateId}`;
  return `Voyage Estimation ${estimateId}`;
}

export default function MainWorkspace() {
  const [sheets, setSheets] = useState<WorkspaceSheet[]>([singletonSheet("voyage-estimation", false)]);
  const [activeSheetId, setActiveSheetId] = useState("page:voyage-estimation");
  const [activeSettingDialog, setActiveSettingDialog] = useState<SettingDialogType | null>(null);
  const [selectedCargoId, setSelectedCargoId] = useState<string>();
  const [selectedPortId, setSelectedPortId] = useState<string>();
  const [sidebarWidth, setSidebarWidth] = useState(90);
  const [estimationOpen, setEstimationOpen] = useState(false);
  const [charterPartyOpen, setCharterPartyOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [userOpen, setUserOpen] = useState(false);
  const [toolbarMessage, setToolbarMessage] = useState<string>();
  const [toolbarRegistrations, setToolbarRegistrations] = useState<Record<string, WorkspaceToolbarRegistration>>(
    {},
  );
  const [pendingSheetAction, setPendingSheetAction] = useState<PendingSheetAction | null>(null);
  const dragState = useRef<{ startX: number; startWidth: number } | null>(null);

  const activeSheet = useMemo(
    () => sheets.find((sheet) => sheet.id === activeSheetId) ?? sheets[0],
    [activeSheetId, sheets],
  );
  const activePage = activeSheet?.page ?? "voyage-estimation";
  const activeToolbarRegistration =
    (activeSheet ? toolbarRegistrations[activeSheet.id] : undefined) ?? defaultToolbarRegistration;

  const toolbarManager = useMemo(
    () =>
      new ToolbarCommandManager(
        activeToolbarRegistration.hasSheet,
        activeToolbarRegistration.hasEstimate,
      ),
    [activeToolbarRegistration.hasEstimate, activeToolbarRegistration.hasSheet],
  );

  const toolbarCommandState = useMemo<ToolbarCommandState>(() => {
    const baseState = toolbarManager.getState();
    const nextState = { ...baseState };
    for (const command of allCommands) {
      const policy = getCommandPolicy(activeSheet?.page, command);
      if (!policy.allowed || !activeToolbarRegistration.execute[command]) {
        nextState[command] = false;
      }
    }
    return nextState;
  }, [activeSheet?.page, activeToolbarRegistration.execute, toolbarManager]);

  const registerToolbarForSheet = useCallback(
    (sheetId: string) => (registration: WorkspaceToolbarRegistration) => {
      setToolbarRegistrations((current) => ({ ...current, [sheetId]: registration }));
    },
    [],
  );

  const openOrActivateSheet = useCallback((nextSheet: WorkspaceSheet) => {
    setSheets((current) => {
      if (current.some((sheet) => sheet.id === nextSheet.id)) {
        return current;
      }
      return [...current, nextSheet];
    });
    setActiveSheetId(nextSheet.id);
    setToolbarMessage(undefined);
  }, []);

  const getSheetRegistration = useCallback(
    (sheetId: string) => toolbarRegistrations[sheetId] ?? defaultToolbarRegistration,
    [toolbarRegistrations],
  );

  const anyDirtySheets = useMemo(
    () => Object.values(toolbarRegistrations).some((registration) => registration.isDirty),
    [toolbarRegistrations],
  );

  const runPendingSheetAction = useCallback(async () => {
    if (!pendingSheetAction) return;
    const nextAction = pendingSheetAction.action;
    setPendingSheetAction(null);
    await Promise.resolve(nextAction());
  }, [pendingSheetAction]);

  const requestDirtyConfirmation = useCallback(
    (
      sheetId: string,
      action: () => void | Promise<void>,
      options?: { allowSave?: boolean; reason?: "dirty" | "hydrating" | "error" },
    ) => {
      const sheet = sheets.find((item) => item.id === sheetId);
      const title = sheet?.title ?? "Current sheet";
      setPendingSheetAction({
        sheetId,
        title,
        action,
        allowSave: options?.allowSave ?? true,
        reason: options?.reason ?? "dirty",
      });
    },
    [sheets],
  );

  const shouldGuardSheet = useCallback((registration: WorkspaceToolbarRegistration) => {
    const lifecycle = registration.lifecycle ?? "settled";
    if (lifecycle === "error") {
      return registration.isUserModified === true
        ? { guard: true, allowSave: false, reason: "error" as const }
        : { guard: false, allowSave: false, reason: "error" as const };
    }
    if (lifecycle === "loading" || lifecycle === "hydrating" || lifecycle === "init") {
      return registration.isUserModified === true
        ? { guard: true, allowSave: false, reason: "hydrating" as const }
        : { guard: false, allowSave: false, reason: "hydrating" as const };
    }

    return registration.isDirty === true
      ? { guard: true, allowSave: true, reason: "dirty" as const }
      : { guard: false, allowSave: true, reason: "dirty" as const };
  }, []);

  const runGuardedSheetAction = useCallback(
    async (sheetId: string, action: () => void | Promise<void>) => {
      const registration = getSheetRegistration(sheetId);
      const guardState = shouldGuardSheet(registration);
      if (guardState.guard) {
        requestDirtyConfirmation(sheetId, action, {
          allowSave: guardState.allowSave,
          reason: guardState.reason,
        });
        return;
      }
      await Promise.resolve(action());
    },
    [getSheetRegistration, requestDirtyConfirmation, shouldGuardSheet],
  );

  const closeSheet = useCallback(
    (sheetId: string) => {
      setSheets((current) => {
        if (current.length <= 1) return current;
        const index = current.findIndex((sheet) => sheet.id === sheetId);
        if (index < 0) return current;
        const remaining = current.filter((sheet) => sheet.id !== sheetId);
        if (activeSheetId === sheetId) {
          const fallback = remaining[Math.max(0, index - 1)] ?? remaining[0];
          setActiveSheetId(fallback.id);
        }
        return remaining;
      });
      setToolbarRegistrations((current) => {
        const next = { ...current };
        delete next[sheetId];
        return next;
      });
      setToolbarMessage(undefined);
    },
    [activeSheetId],
  );

  const openEstimateSheet = useCallback(
    (estimate: { id: string; type: "Voyage Charter" | "Time Charter" | "Cargo Relet" }) => {
      const page =
        estimate.type === "Time Charter"
          ? "time-charter"
          : estimate.type === "Cargo Relet"
            ? "cargo-relet"
            : "voyage-estimation";
      openOrActivateSheet({
        ...estimateSheet(page, estimate.id),
        title: titleForEstimate(estimate.type, estimate.id),
      });
    },
    [openOrActivateSheet],
  );

  const openOperationSheet = useCallback(
    (params: { operationId?: string; sourceEstimateId?: string }) => {
      openOrActivateSheet(operationSheet(params));
    },
    [openOrActivateSheet],
  );

  const executeToolbarCommand = useCallback(
    async (command: ToolbarCommand) => {
      if (!activeSheet) {
        setToolbarMessage("There is no active sheet.");
        return;
      }

      const commandPolicy = getCommandPolicy(activeSheet.page, command);
      if (!commandPolicy.allowed) {
        setToolbarMessage(commandPolicy.reason);
        return;
      }

      if (!toolbarCommandState[command]) {
        const result = toolbarManager.execute(command);
        setToolbarMessage(
          result.ok
            ? `${getCommandLabel(command)} is not available for the current sheet.`
            : result.message,
        );
        return;
      }

      const handler = activeToolbarRegistration.execute[command];
      if (!handler) {
        setToolbarMessage(`${getCommandLabel(command)} is not available for the current sheet.`);
        return;
      }

      const runHandler = async () => {
        setToolbarMessage(undefined);
        try {
          await Promise.resolve(handler());
        } catch (error) {
          setToolbarMessage(error instanceof Error ? error.message : `Command ${command} failed.`);
        }
      };

      const guardState = shouldGuardSheet(activeToolbarRegistration);
      if (guardState.guard && dirtySensitiveCommands.has(command)) {
        requestDirtyConfirmation(activeSheet.id, runHandler, {
          allowSave: guardState.allowSave,
          reason: guardState.reason,
        });
        return;
      }

      await runHandler();
    },
    [
      activeSheet,
      activeToolbarRegistration.execute,
      activeToolbarRegistration.isDirty,
      requestDirtyConfirmation,
      shouldGuardSheet,
      toolbarCommandState,
      toolbarManager,
    ],
  );

  const breadcrumb = useMemo(() => {
    const section = sectionForPage(activePage);
    const pageLabel = activeSheet?.title ?? pageLabels[activePage];
    return pageLabel === section ? ["Voyage P&L", section] : ["Voyage P&L", section, pageLabel];
  }, [activePage, activeSheet?.title]);

  const startResize = (event: React.MouseEvent<HTMLDivElement>) => {
    dragState.current = { startX: event.clientX, startWidth: sidebarWidth };

    const handleMove = (moveEvent: MouseEvent) => {
      if (!dragState.current) return;
      const nextWidth = dragState.current.startWidth + moveEvent.clientX - dragState.current.startX;
      setSidebarWidth(Math.min(220, Math.max(60, nextWidth)));
    };

    const stopResize = () => {
      dragState.current = null;
      window.removeEventListener("mousemove", handleMove);
      window.removeEventListener("mouseup", stopResize);
    };

    window.addEventListener("mousemove", handleMove);
    window.addEventListener("mouseup", stopResize);
  };

  const openSidebarPage = useCallback(
    (nextPage: WorkspacePage) => {
      void runGuardedSheetAction(activeSheetId, () => {
        openOrActivateSheet(singletonSheet(nextPage));
        setEstimationOpen(false);
        setCharterPartyOpen(false);
        setSettingsOpen(false);
        setToolbarMessage(undefined);
      });
    },
    [activeSheetId, openOrActivateSheet, runGuardedSheetAction],
  );

  const openSettingsTarget = useCallback(
    (option: SettingsOption) => {
      void runGuardedSheetAction(activeSheetId, () => {
        setSettingsOpen(false);
        setEstimationOpen(false);
        setCharterPartyOpen(false);
        if (option.page) {
          openOrActivateSheet(singletonSheet(option.page));
          setToolbarMessage(undefined);
          return;
        }
        setActiveSettingDialog(option.dialog ?? null);
      });
    },
    [activeSheetId, openOrActivateSheet, runGuardedSheetAction],
  );

  const activateSheet = useCallback(
    (sheetId: string) => {
      if (sheetId === activeSheetId) return;
      void runGuardedSheetAction(activeSheetId, () => {
        setActiveSheetId(sheetId);
        setToolbarMessage(undefined);
      });
    },
    [activeSheetId, runGuardedSheetAction],
  );

  const requestCloseSheet = useCallback(
    (sheetId: string) => {
      void runGuardedSheetAction(sheetId, () => closeSheet(sheetId));
    },
    [closeSheet, runGuardedSheetAction],
  );

  const handleDirtyModalCancel = useCallback(() => {
    setPendingSheetAction(null);
  }, []);

  const handleDirtyModalDiscard = useCallback(() => {
    void runPendingSheetAction();
  }, [runPendingSheetAction]);

  const handleDirtyModalSave = useCallback(async () => {
    if (!pendingSheetAction) return;
    if (!pendingSheetAction.allowSave) {
      return;
    }
    const registration = getSheetRegistration(pendingSheetAction.sheetId);
    const saveHandler = registration.execute.save ?? registration.execute.saveAs;
    if (!saveHandler) {
      setToolbarMessage(`Save is not available for ${pendingSheetAction.title}.`);
      return;
    }

    try {
      const result = await Promise.resolve(saveHandler());
      if (result === false) {
        return;
      }
      await runPendingSheetAction();
    } catch (error) {
      setToolbarMessage(error instanceof Error ? error.message : "Save failed.");
    }
  }, [getSheetRegistration, pendingSheetAction, runPendingSheetAction]);

  const dirtyModalText = pendingSheetAction
    ? pendingSheetAction.reason === "hydrating"
      ? `${pendingSheetAction.title} is still loading and has user changes.`
      : pendingSheetAction.reason === "error"
        ? `${pendingSheetAction.title} has load errors and user changes.`
        : `${pendingSheetAction.title} has unsaved changes.`
    : "This sheet has unsaved changes.";
  const dirtyModalHelpText = pendingSheetAction
    ? pendingSheetAction.allowSave
      ? "Save before continuing, discard your changes, or cancel to stay on the current sheet."
      : "Saving is temporarily disabled because this sheet is not in a reliable state yet. You can discard the pending edits or stay on the current sheet."
    : "Save before continuing, discard your changes, or cancel to stay on the current sheet.";

  useEffect(() => {
    if (typeof window === "undefined") return undefined;
    const beforeUnload = (event: BeforeUnloadEvent) => {
      if (!anyDirtySheets) return;
      event.preventDefault();
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", beforeUnload);
    return () => window.removeEventListener("beforeunload", beforeUnload);
  }, [anyDirtySheets]);

  const renderSheet = useCallback(
    (sheet: WorkspaceSheet) => {
      const registerWorkspaceToolbar = registerToolbarForSheet(sheet.id);

      if (sheet.page === "estimate-list") {
        return (
          <EstimateListForm
            registerWorkspaceToolbar={registerWorkspaceToolbar}
            onOpenEstimate={openEstimateSheet}
          />
        );
      }
      if (sheet.page === "voyage-estimation") {
        return (
          <VoyageEstimator
            registerWorkspaceToolbar={registerWorkspaceToolbar}
            initialEstimateId={sheet.estimateId}
            onToOperation={(estimateId) => openOperationSheet({ sourceEstimateId: estimateId })}
          />
        );
      }
      if (sheet.page === "time-charter") {
        return (
          <TimeCharterApp
            registerWorkspaceToolbar={registerWorkspaceToolbar}
            initialEstimateId={sheet.estimateId}
          />
        );
      }
      if (sheet.page === "cargo-relet") {
        return (
          <CargoReletApp
            registerWorkspaceToolbar={registerWorkspaceToolbar}
            initialEstimateId={sheet.estimateId}
          />
        );
      }
      if (sheet.page === "operation-list") {
        return (
          <OperationListForm
            registerWorkspaceToolbar={registerWorkspaceToolbar}
            onOpenOperation={(operationId) => openOperationSheet({ operationId })}
          />
        );
      }
      if (sheet.page === "operation") {
        return (
          <OperationApp
            embedded
            registerWorkspaceToolbar={registerWorkspaceToolbar}
            operationId={sheet.operationId}
            sourceEstimateId={sheet.sourceEstimateId}
          />
        );
      }
      if (sheet.page === "order-list") {
        return <OrderListForm registerWorkspaceToolbar={registerWorkspaceToolbar} />;
      }
      if (sheet.page === "cargo-list") {
        return (
          <CargoListForm
            registerWorkspaceToolbar={registerWorkspaceToolbar}
            onOpenCargo={(cargoId) => {
              setSelectedCargoId(cargoId);
              setActiveSettingDialog("cargo");
            }}
          />
        );
      }
      if (sheet.page === "position-list") {
        return <PositionListForm registerWorkspaceToolbar={registerWorkspaceToolbar} />;
      }
      if (sheet.page === "port-list") {
        return (
          <PortListForm
            registerWorkspaceToolbar={registerWorkspaceToolbar}
            onOpenPort={(portId) => {
              setSelectedPortId(portId);
              setActiveSettingDialog("port");
            }}
          />
        );
      }
      if (sheet.page === "voyage-charter-party") {
        return <CharterPartyApp type="voyage" />;
      }
      if (sheet.page === "time-charter-party") {
        return <CharterPartyApp type="time-charter" />;
      }
      return <OptionForm />;
    },
    [openEstimateSheet, openOperationSheet, registerToolbarForSheet],
  );

  return (
    <div className="h-screen w-screen overflow-hidden bg-[#F0F3F6] font-['Segoe_UI',Tahoma,Arial,sans-serif] text-[#102A3A]">
      <Topbar
        breadcrumb={breadcrumb}
        userOpen={userOpen}
        onToggleUser={() => setUserOpen((value) => !value)}
      />
      <RibbonBar commandState={toolbarCommandState} onCommand={executeToolbarCommand} />
      {toolbarMessage && (
        <div className="border-b border-[#f0b8b8] bg-[#fff2f0] px-3 py-1 text-[12px] font-semibold text-[#b42318]">
          {toolbarMessage}
        </div>
      )}
      <div className="flex h-[calc(100vh-52px-52px-28px)] min-h-0">
        <Sidebar
          width={sidebarWidth}
          page={activePage}
          estimationOpen={estimationOpen}
          charterPartyOpen={charterPartyOpen}
          settingsOpen={settingsOpen}
          onToggleEstimation={() => {
            setEstimationOpen((value) => !value);
            setCharterPartyOpen(false);
            setSettingsOpen(false);
          }}
          onToggleCharterParty={() => {
            setCharterPartyOpen((value) => !value);
            setEstimationOpen(false);
            setSettingsOpen(false);
          }}
          onToggleSettings={() => {
            setSettingsOpen((value) => !value);
            setEstimationOpen(false);
            setCharterPartyOpen(false);
          }}
          onSelectPage={openSidebarPage}
          onSelectSettings={(option) => {
            openSettingsTarget(option);
          }}
        />
        <div
          aria-hidden="true"
          className="w-1 shrink-0 cursor-col-resize bg-[#dcdfe6] transition-colors hover:bg-[#b8c2cc]"
          onMouseDown={startResize}
        />
        <main className="flex min-w-0 flex-1 flex-col overflow-hidden bg-white">
          <SheetTabs
            sheets={sheets}
            activeSheetId={activeSheetId}
            onActivate={activateSheet}
            onClose={requestCloseSheet}
          />
          <div className="min-h-0 flex-1 overflow-auto">
            <div className="min-w-[1180px] p-2">
              <Suspense
                fallback={<div className="p-4 text-sm text-[#006994]">Loading workspace...</div>}
              >
                {sheets.map((sheet) => (
                  <div key={sheet.id} className={sheet.id === activeSheetId ? "block" : "hidden"}>
                    {renderSheet(sheet)}
                  </div>
                ))}
              </Suspense>
            </div>
          </div>
        </main>
      </div>
      {activeSettingDialog && (
        <SettingsDialogLayer
          type={activeSettingDialog}
          cargoId={selectedCargoId}
          portId={selectedPortId}
          onClose={() => setActiveSettingDialog(null)}
        />
      )}
      <Modal
        open={Boolean(pendingSheetAction)}
        title="Unsaved changes"
        onCancel={handleDirtyModalCancel}
        closable={false}
        maskClosable={false}
        footer={[
          <button
            key="cancel"
            type="button"
            onClick={handleDirtyModalCancel}
            className="rounded border border-[#d8e2ea] bg-white px-4 py-1.5 text-[13px] font-semibold text-[#2b3e4d]"
          >
            Cancel
          </button>,
          <button
            key="discard"
            type="button"
            onClick={handleDirtyModalDiscard}
            className="rounded border border-[#d8e2ea] bg-white px-4 py-1.5 text-[13px] font-semibold text-[#2b3e4d]"
          >
            Don't Save
          </button>,
          <button
            key="save"
            type="button"
            onClick={() => void handleDirtyModalSave()}
            disabled={!pendingSheetAction?.allowSave}
            className="rounded bg-[#155b78] px-4 py-1.5 text-[13px] font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
          >
            Save
          </button>,
        ]}
      >
        <p className="text-[13px] text-[#2b3e4d]">{dirtyModalText}</p>
        <p className="mt-2 text-[12px] text-[#617381]">{dirtyModalHelpText}</p>
      </Modal>
      <StatusBar />
    </div>
  );
}

function SheetTabs({
  sheets,
  activeSheetId,
  onActivate,
  onClose,
}: {
  sheets: WorkspaceSheet[];
  activeSheetId: string;
  onActivate: (sheetId: string) => void;
  onClose: (sheetId: string) => void;
}) {
  return (
    <div className="flex h-9 items-end gap-1 overflow-x-auto border-b border-[#d8e2ea] bg-[#f7f9fb] px-2 pt-1">
      {sheets.map((sheet) => {
        const active = sheet.id === activeSheetId;
        return (
          <div
            key={sheet.id}
            className={`flex h-8 min-w-[160px] max-w-[280px] items-center gap-2 rounded-t-[4px] border border-b-0 px-3 text-[12px] ${
              active
                ? "border-[#bfd1df] bg-white font-semibold text-[#0e5d80]"
                : "border-[#d8e2ea] bg-[#edf3f7] text-[#526677]"
            }`}
          >
            <button
              type="button"
              onClick={() => onActivate(sheet.id)}
              className="min-w-0 flex-1 truncate text-left"
              title={sheet.title}
            >
              {sheet.title}
            </button>
            {sheet.closable && sheets.length > 1 && (
              <button
                type="button"
                onClick={() => onClose(sheet.id)}
                className="rounded p-[1px] text-[#6e7d88] hover:bg-[#dfe8ee] hover:text-[#1f3342]"
                aria-label={`Close ${sheet.title}`}
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
}

function SettingsDialogLayer({
  type,
  cargoId,
  portId,
  onClose,
}: {
  type: "option" | "vessel" | "cargo" | "port";
  cargoId?: string;
  portId?: string;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-[80] bg-[#003c52]/30 p-3">
      <div className="flex h-full items-start justify-center overflow-auto">
        <Suspense fallback={<div className="p-4 text-sm text-white">Loading...</div>}>
          {type === "option" && (
            <DialogShell
              title="Option"
              icon={<Settings className="h-3.5 w-3.5" />}
              width={760}
              onClose={onClose}
              bodyPadding={0}
              actions={[]}
            >
              <OptionForm embedded onClose={onClose} />
            </DialogShell>
          )}
          {type === "cargo" && (
            <DialogShell
              title="Cargo"
              icon={<PackageOpen className="h-3.5 w-3.5" />}
              width={828}
              onClose={onClose}
              bodyPadding={0}
              actions={[]}
            >
              <NewCargoForm embedded initialCargoId={cargoId} onClose={onClose} />
            </DialogShell>
          )}
          {type === "port" && (
            <DialogShell
              title="Ports"
              icon={<Anchor className="h-3.5 w-3.5" />}
              width={610}
              onClose={onClose}
              bodyPadding={0}
              actions={[]}
            >
              <NewPortForm embedded initialPortId={portId} onClose={onClose} />
            </DialogShell>
          )}
          {type === "vessel" && <NewVesselFormAnt onClose={onClose} />}
        </Suspense>
      </div>
    </div>
  );
}

function Topbar({
  breadcrumb,
  userOpen,
  onToggleUser,
}: {
  breadcrumb: string[];
  userOpen: boolean;
  onToggleUser: () => void;
}) {
  return (
    <header className="flex h-[52px] items-center gap-4 bg-[#155B78] px-4 text-white shadow-sm">
      <div className="flex min-w-[190px] items-center gap-2 font-bold">
        <div className="flex h-8 w-8 items-center justify-center rounded-full border border-white/35 bg-white/12">
          <Ship className="h-5 w-5 text-[#91D7EA]" strokeWidth={2.2} />
        </div>
        <span className="whitespace-nowrap text-[15px] tracking-wide">Voyage P&L</span>
      </div>

      <nav className="min-w-0 flex-1 truncate text-[13px] font-semibold text-white/72">
        {breadcrumb.map((item, index) => (
          <span key={item} className={index === breadcrumb.length - 1 ? "text-white" : undefined}>
            {index > 0 && <span className="px-2 text-[#cfe9f2]/70">&gt;</span>}
            {item}
          </span>
        ))}
      </nav>

      <div className="relative flex items-center gap-3">
        <label className="flex h-8 w-[300px] items-center gap-2 rounded-[5px] border border-white/25 bg-white/15 px-3 text-white shadow-inner">
          <Search className="h-4 w-4 text-[#cfe9f2]" />
          <input
            aria-label="Search"
            placeholder="Search voyage, vessel, port..."
            className="min-w-0 flex-1 bg-transparent text-[13px] text-white outline-none placeholder:text-white/60"
          />
        </label>

        <button
          type="button"
          onClick={onToggleUser}
          className="flex h-9 items-center gap-2 rounded-full px-2 font-bold hover:bg-white/10"
        >
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#cfe9f2] text-[#003c52]">
            <UserRound className="h-4 w-4" />
          </span>
          <span className="text-[13px]">Admin</span>
          <ChevronDown className="h-3.5 w-3.5 text-[#cfe9f2]" />
        </button>

        {userOpen && (
          <div className="absolute right-0 top-11 z-30 w-56 rounded border border-[#dcdfe6] bg-white py-2 text-[#172331] shadow-lg">
            <div className="border-b border-[#dcdfe6] px-3 pb-2">
              <div className="text-sm font-bold">Administrator</div>
              <div className="text-xs text-slate-500">admin@voyage-pnl.local</div>
            </div>
            <button className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-[#F0F3F6]">
              <UserRound className="h-4 w-4 text-[#007A9E]" />
              User Information
            </button>
            <button className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-[#F0F3F6]">
              <LogOut className="h-4 w-4 text-[#ce3f34]" />
              Logout
            </button>
          </div>
        )}
      </div>
    </header>
  );
}

function RibbonBar({
  commandState,
  onCommand,
}: {
  commandState: ToolbarCommandState;
  onCommand: (command: ToolbarCommand) => void | Promise<void>;
}) {
  return (
    <section className="flex h-[52px] items-stretch overflow-x-auto border-b border-[#C8D3DC] bg-[#F4F7FA] px-2">
      {ribbonGroups.map((group, groupIndex) => (
        <div
          key={groupIndex}
          className="flex items-center gap-1 border-r border-[#D4DEE6] px-2 last:border-r-0"
        >
          {group.map((action) => {
            const Icon = action.icon;
            const disabled = commandState[action.command] === false;
            return (
              <button
                key={action.label}
                type="button"
                disabled={disabled}
                onClick={() => void onCommand(action.command)}
                className="flex h-[46px] w-[70px] flex-col items-center justify-center gap-[2px] rounded-[4px] text-[10px] font-semibold text-[#2B3E4D] hover:bg-white disabled:cursor-not-allowed disabled:opacity-40"
              >
                <Icon className="h-5 w-5" style={{ color: action.color }} strokeWidth={1.8} />
                <span className="leading-tight">{action.label}</span>
              </button>
            );
          })}
        </div>
      ))}
    </section>
  );
}

function Sidebar({
  width,
  page,
  estimationOpen,
  charterPartyOpen,
  settingsOpen,
  onToggleEstimation,
  onToggleCharterParty,
  onToggleSettings,
  onSelectPage,
  onSelectSettings,
}: {
  width: number;
  page: WorkspacePage;
  estimationOpen: boolean;
  charterPartyOpen: boolean;
  settingsOpen: boolean;
  onToggleEstimation: () => void;
  onToggleCharterParty: () => void;
  onToggleSettings: () => void;
  onSelectPage: (page: WorkspacePage) => void;
  onSelectSettings: (option: SettingsOption) => void;
}) {
  const itemClass =
    "relative flex h-[74px] w-full flex-col items-center justify-center gap-1 rounded-[4px] px-1 text-center text-[11px] font-bold";

  return (
    <aside
      className="relative shrink-0 border-r border-[#0F4E68] bg-[#0B4B65] p-1"
      style={{ width }}
    >
      <button
        type="button"
        onClick={() => onSelectPage("order-list")}
        className={`${itemClass} ${
          page === "order-list" ? "bg-[#237EA4] text-white" : "text-white/90 hover:bg-white/10"
        }`}
      >
        <PackageOpen className="h-6 w-6" />
        <span>Orders</span>
      </button>
      <button
        type="button"
        onClick={() => onSelectPage("position-list")}
        className={`${itemClass} ${
          page === "position-list" ? "bg-[#237EA4] text-white" : "text-white/90 hover:bg-white/10"
        }`}
      >
        <Ship className="h-6 w-6" />
        <span>Position</span>
      </button>

      <div className="relative">
        <button
          type="button"
          onClick={onToggleCharterParty}
          className={`${itemClass} ${
            page.includes("charter-party")
              ? "bg-[#237EA4] text-white"
              : "text-white/90 hover:bg-white/10"
          }`}
        >
          <BriefcaseBusiness className="h-6 w-6" />
          <span>Charter Party</span>
        </button>
        {charterPartyOpen && (
          <div className="absolute left-full top-0 z-20 ml-2 w-56 rounded border border-[#dcdfe6] bg-white py-1 shadow-lg">
            {charterPartyOptions.map((option) => (
              <button
                key={option.id}
                type="button"
                onClick={() => onSelectPage(option.id)}
                className={`block w-full px-3 py-2 text-left text-sm hover:bg-[#F0F3F6] ${
                  page === option.id ? "font-bold text-[#0E5D80]" : "text-[#172331]"
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="relative">
        <button
          type="button"
          onClick={onToggleEstimation}
          className={`${itemClass} ${
            ["estimate-list", "voyage-estimation", "time-charter", "cargo-relet"].includes(page)
              ? "bg-[#237EA4] text-white"
              : "text-white/90 hover:bg-white/10"
          }`}
        >
          <Gauge className="h-6 w-6" />
          <span>Estimation</span>
        </button>
        {estimationOpen && (
          <div className="absolute left-full top-0 z-20 ml-2 w-56 rounded border border-[#dcdfe6] bg-white py-1 shadow-lg">
            {estimationOptions.map((option) => (
              <button
                key={option.id}
                type="button"
                onClick={() => onSelectPage(option.id)}
                className={`block w-full px-3 py-2 text-left text-sm hover:bg-[#F0F3F6] ${
                  page === option.id ? "font-bold text-[#0E5D80]" : "text-[#172331]"
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        )}
      </div>

      <button
        type="button"
        onClick={() => onSelectPage("operation-list")}
        className={`${itemClass} ${
          page === "operation" || page === "operation-list"
            ? "bg-[#237EA4] text-white"
            : "text-white/90 hover:bg-white/10"
        }`}
      >
        <Anchor className="h-6 w-6" />
        <span>Operation</span>
      </button>

      <SidebarPlaceholder icon={LayoutDashboard} label="P&L Summary" />
      <SidebarPlaceholder icon={CircleDollarSign} label="Financial" />

      <div className="relative">
        <button
          type="button"
          onClick={onToggleSettings}
          className={`${itemClass} ${
            settingsOpen || page === "option"
              ? "bg-[#237EA4] text-white"
              : "text-white/90 hover:bg-white/10"
          }`}
        >
          <Settings className="h-6 w-6" />
          <span>Settings</span>
        </button>
        {settingsOpen && (
          <div className="absolute left-full top-0 z-20 ml-2 w-56 rounded border border-[#dcdfe6] bg-white py-1 shadow-lg">
            {settingsOptions.map((option) => (
              <button
                key={option.label}
                type="button"
                onClick={() => onSelectSettings(option)}
                className="block w-full px-3 py-2 text-left text-sm text-[#172331] hover:bg-[#F0F3F6]"
              >
                {option.label}
              </button>
            ))}
          </div>
        )}
      </div>
    </aside>
  );
}

function SidebarPlaceholder({
  icon: Icon,
  label,
}: {
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
  label: string;
}) {
  return (
    <button
      type="button"
      disabled
      title="Chức năng đang phát triển"
      className="flex h-[74px] w-full cursor-not-allowed flex-col items-center justify-center gap-1 rounded-[4px] px-1 text-center text-[11px] font-bold text-white/75 opacity-65"
    >
      <Icon className="h-6 w-6" strokeWidth={1.8} />
      <span>{label}</span>
    </button>
  );
}

function StatusBar() {
  return (
    <footer className="flex h-[28px] items-center justify-between bg-[#0E4F68] px-3 text-[12px] font-semibold text-[#91D7EA]">
      <div>Sẵn sàng</div>
      <div className="flex items-center gap-5">
        <div className="truncate">No critical alerts</div>
        <div className="flex items-center gap-1">
          <span className="h-2 w-2 rounded-full bg-[#27c266]" />
          <Database className="h-3.5 w-3.5" />
          <span>Connected</span>
        </div>
        <div className="flex items-center gap-2">
          <ZoomOut className="h-4 w-4 text-[#7fe3ff]" />
          <span>100%</span>
          <ZoomIn className="h-4 w-4 text-[#7fe3ff]" />
          <Maximize2 className="h-3.5 w-3.5 text-[#7fe3ff]" />
        </div>
      </div>
    </footer>
  );
}
