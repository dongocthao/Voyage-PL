import {
  Anchor,
  BarChart3,
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
  ZoomIn,
  ZoomOut,
} from "lucide-react";
import { useNavigate } from "@tanstack/react-router";
import { Suspense, lazy, useCallback, useMemo, useRef, useState, type CSSProperties } from "react";
import VoyageEstimator from "@/components/voyage-estimator/VoyageEstimator";
import {
  ToolbarCommandManager,
  type ToolbarCommand,
  type ToolbarCommandState,
} from "@/components/voyage-estimator/toolbarCommandManager";
import type { WorkspaceToolbarRegistration } from "./workspaceToolbar";

const OperationApp = lazy(() => import("@/components/voyage-estimator/OperationApp"));
const TimeCharterApp = lazy(() => import("@/components/voyage-estimator/TimeCharterApp"));
const CargoReletApp = lazy(() => import("@/components/voyage-estimator/CargoReletApp"));
const CharterPartyApp = lazy(() => import("@/components/voyage-estimator/CharterPartyApps"));

type WorkspacePage =
  | "voyage-estimation"
  | "time-charter"
  | "cargo-relet"
  | "operation"
  | "voyage-charter-party"
  | "time-charter-party";

type RibbonAction = {
  command: ToolbarCommand;
  label: string;
  icon: React.ComponentType<{ className?: string; strokeWidth?: number; style?: CSSProperties }>;
  color: string;
};

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
  { id: "voyage-estimation", label: "Voyage Estimation" },
  { id: "time-charter", label: "Time Charter Estimation" },
  { id: "cargo-relet", label: "Cargo Relet" },
];

const charterPartyOptions: Array<{ id: WorkspacePage; label: string }> = [
  { id: "voyage-charter-party", label: "Voyage Charter Party" },
  { id: "time-charter-party", label: "Time Charter Party" },
];

const settingsOptions: Array<{ label: string; to?: "/new-vessel" | "/new-cargo" | "/new-port" }> = [
  { label: "Vessel", to: "/new-vessel" },
  { label: "Cargo", to: "/new-cargo" },
  { label: "Port", to: "/new-port" },
];

const pageLabels: Record<WorkspacePage, string> = {
  "voyage-estimation": "Voyage Estimation",
  "time-charter": "Time Charter Estimation",
  "cargo-relet": "Cargo Relet",
  operation: "Operation",
  "voyage-charter-party": "Voyage Charter Party",
  "time-charter-party": "Time Charter Party",
};

export default function MainWorkspace() {
  const [page, setPage] = useState<WorkspacePage>("voyage-estimation");
  const [sidebarWidth, setSidebarWidth] = useState(90);
  const [estimationOpen, setEstimationOpen] = useState(false);
  const [charterPartyOpen, setCharterPartyOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [userOpen, setUserOpen] = useState(false);
  const [toolbarMessage, setToolbarMessage] = useState<string>();
  const [toolbarRegistration, setToolbarRegistration] = useState<WorkspaceToolbarRegistration>({
    hasSheet: false,
    hasEstimate: false,
    execute: {},
  });
  const navigate = useNavigate();
  const dragState = useRef<{ startX: number; startWidth: number } | null>(null);
  const toolbarManager = useMemo(
    () => new ToolbarCommandManager(toolbarRegistration.hasSheet, toolbarRegistration.hasEstimate),
    [toolbarRegistration.hasEstimate, toolbarRegistration.hasSheet],
  );
  const toolbarCommandState = useMemo(() => toolbarManager.getState(), [toolbarManager]);
  const registerToolbar = useCallback((registration: WorkspaceToolbarRegistration) => {
    setToolbarRegistration(registration);
  }, []);

  const resetToolbarRegistration = () => {
    setToolbarMessage(undefined);
    setToolbarRegistration({ hasSheet: false, hasEstimate: false, execute: {} });
  };

  const executeToolbarCommand = (command: ToolbarCommand) => {
    const result = toolbarManager.execute(command);
    if (!result.ok) {
      setToolbarMessage(result.message);
      return;
    }

    setToolbarMessage(undefined);
    if (command === "toOperation") {
      resetToolbarRegistration();
      setPage("operation");
      return;
    }

    const handler = toolbarRegistration.execute[command];
    if (handler) {
      handler();
      if (command === "new") {
        setToolbarRegistration((current) => ({ ...current, hasSheet: true, hasEstimate: false }));
      }
      if (command === "delete") {
        setToolbarRegistration((current) => ({ ...current, hasSheet: false, hasEstimate: false }));
      }
      return;
    }

    if (command === "options") {
      setToolbarMessage("Options are not available for this sheet yet.");
      return;
    }

    setToolbarMessage(`Command ${command} is not available for this sheet yet.`);
  };

  const breadcrumb = useMemo(() => {
    const section = page.includes("charter-party")
      ? "Charter Party"
      : page === "operation"
        ? "Operation"
        : "Estimation";
    return ["Voyage P&L", section, pageLabels[page]];
  }, [page]);

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
      <div className="flex h-[calc(100vh-52px-88px-28px)] min-h-0">
        <Sidebar
          width={sidebarWidth}
          page={page}
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
          onSelectPage={(nextPage) => {
            resetToolbarRegistration();
            setPage(nextPage);
            setEstimationOpen(false);
            setCharterPartyOpen(false);
            setSettingsOpen(false);
          }}
          onSelectSettings={(to) => {
            setSettingsOpen(false);
            setEstimationOpen(false);
            setCharterPartyOpen(false);
            navigate({ to });
          }}
        />
        <div
          aria-hidden="true"
          className="w-1 shrink-0 cursor-col-resize bg-[#dcdfe6] transition-colors hover:bg-[#b8c2cc]"
          onMouseDown={startResize}
        />
        <main className="min-w-0 flex-1 overflow-auto bg-white">
          <div className="min-w-[1180px] p-2">
            <Suspense
              fallback={<div className="p-4 text-sm text-[#006994]">Loading workspace...</div>}
            >
              {page === "voyage-estimation" && (
                <VoyageEstimator registerWorkspaceToolbar={registerToolbar} />
              )}
              {page === "time-charter" && (
                <TimeCharterApp registerWorkspaceToolbar={registerToolbar} />
              )}
              {page === "cargo-relet" && (
                <CargoReletApp registerWorkspaceToolbar={registerToolbar} />
              )}
              {page === "operation" && <OperationApp />}
              {page === "voyage-charter-party" && <CharterPartyApp type="voyage" />}
              {page === "time-charter-party" && <CharterPartyApp type="time-charter" />}
            </Suspense>
          </div>
        </main>
      </div>
      <StatusBar />
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
  onCommand: (command: ToolbarCommand) => void;
}) {
  return (
    <section className="flex h-[88px] items-stretch overflow-x-auto border-b border-[#C8D3DC] bg-[#F4F7FA] px-2">
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
                onClick={() => onCommand(action.command)}
                className="flex h-[72px] w-[74px] flex-col items-center justify-center gap-1 rounded-[4px] text-[11px] font-semibold text-[#2B3E4D] hover:bg-white disabled:cursor-not-allowed disabled:opacity-40"
              >
                <Icon className="h-6 w-6" style={{ color: action.color }} strokeWidth={1.8} />
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
  onSelectSettings: (to: "/new-vessel" | "/new-cargo" | "/new-port") => void;
}) {
  const itemClass =
    "relative flex h-[74px] w-full flex-col items-center justify-center gap-1 rounded-[4px] px-1 text-center text-[11px] font-bold";

  return (
    <aside
      className="relative shrink-0 border-r border-[#0F4E68] bg-[#0B4B65] p-1"
      style={{ width }}
    >
      <SidebarPlaceholder icon={PackageOpen} label="Cargo Offer" />
      <SidebarPlaceholder icon={Ship} label="Open Position" />

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
            page !== "operation" ? "bg-[#237EA4] text-white" : "text-white/90 hover:bg-white/10"
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
        onClick={() => onSelectPage("operation")}
        className={`${itemClass} ${
          page === "operation" ? "bg-[#237EA4] text-white" : "text-white/90 hover:bg-white/10"
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
            settingsOpen ? "bg-[#237EA4] text-white" : "text-white/90 hover:bg-white/10"
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
                onClick={() => option.to && onSelectSettings(option.to)}
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
