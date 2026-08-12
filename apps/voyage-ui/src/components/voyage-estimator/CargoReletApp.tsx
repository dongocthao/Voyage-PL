import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { Alert, Table, Button, Checkbox, Modal, Select } from "antd";
import type { ColumnsType } from "antd/es/table";
import {
  SearchOutlined,
  InfoCircleOutlined,
  CalculatorOutlined,
  FundOutlined,
  LineChartOutlined,
  FileTextOutlined,
  EnvironmentOutlined,
  DesktopOutlined,
} from "@ant-design/icons";
import EstimatorShell from "./EstimatorShell";
import VesselSection from "./VesselSection";
import { RowToolbar } from "./CargoTable";
import LoadableQuantityApp from "./LoadableQuantityApp";
import FreightSimulatorApp from "./FreightSimulatorApp";
import AnalyzerApp from "./AnalyzerApp";
import { CargoReletReportPreview } from "./CargoReletReportPreview";
import { LinerTermsForm, type LinerTermsContextRow } from "@/components/liner-terms-form";
import {
  buildCargoReletSnapshotPayload,
  mapCargoReletSnapshotToRows,
} from "./cargoReletSnapshotMapper";
import { SectionTitle, TxtCell, YCell } from "./cells";
import { VE_COLORS } from "./theme";
import { useRowOps } from "./useRowOps";
import { useResizableColumns } from "./useResizableColumns";
import { buildPortRotationSummary, classifySeaStateByCargoFlow } from "./portRotationSummary";
import {
  reletCargoData,
  reletPortData,
  reletPortSummary,
  type ReletCargoRow,
  type ReletPortRow,
} from "./cargoReletData";
import type { RegisterWorkspaceToolbar } from "@/components/workspace/workspaceToolbar";
import { loadCargoReletSnapshot, saveCargoReletSnapshot } from "@/lib/api/cargoReletSnapshots";
import { fetchLookup, type LookupItem } from "@/lib/api/masterData";
import { VoyageApiError } from "@/lib/api/voyageSnapshots";

type CargoReletModal = "loadable" | "freight" | "analyzer";
type ReletLinerTarget = { rowKey: string; side: "h" | "s" };

type ReletCargoField = keyof ReletCargoRow;
type ReletPortField = keyof ReletPortRow;

function lookupLabel(item: LookupItem) {
  if (item.name && item.country) return `${item.name} <${item.country}>`;
  return item.name ?? item.code ?? String(item.id);
}

function formatUtcOffset(minutes: number | null | undefined) {
  if (minutes === null || minutes === undefined || !Number.isFinite(minutes)) return "";
  const sign = minutes < 0 ? "-" : "+";
  const abs = Math.abs(minutes);
  const hours = Math.floor(abs / 60);
  const mins = abs % 60;
  return `${sign}${String(hours).padStart(2, "0")}:${String(mins).padStart(2, "0")}`;
}

function portLabel(item: LookupItem) {
  const offset = formatUtcOffset(item.utcOffsetMin);
  return offset ? `${lookupLabel(item)} [${offset}]` : lookupLabel(item);
}

function filterLookup(input: string, option?: { label?: unknown }) {
  return String(option?.label ?? "")
    .toLowerCase()
    .includes(input.toLowerCase());
}

const frtTypeOptions = [
  { value: "F", label: "F" },
  { value: "L", label: "L" },
];

const freightTypeSelect =
  (update: (key: string, field: ReletCargoField, value: string) => void, field: ReletCargoField) =>
  (value: string, row: ReletCargoRow) => (
    <Select
      size="small"
      variant="borderless"
      value={value || "F"}
      onChange={(next) => update(row.key, field, next)}
      options={frtTypeOptions}
      style={{ width: "100%", fontSize: 11 }}
    />
  );

const portLookupCell =
  (
    update: (key: string, field: ReletCargoField, value: string) => void,
    field: ReletCargoField,
    ports: LookupItem[],
  ) =>
  (value: string, row: ReletCargoRow) => (
    <div className="flex items-center">
      <Select
        showSearch
        allowClear
        size="small"
        variant="borderless"
        value={value || undefined}
        onChange={(next) => update(row.key, field, next ?? "")}
        onSearch={(next) => update(row.key, field, next)}
        options={ports.map((item) => ({ value: portLabel(item), label: portLabel(item) }))}
        filterOption={filterLookup}
        style={{ width: "100%", fontSize: 11 }}
      />
      <InfoCircleOutlined style={{ color: VE_COLORS.titleBar, fontSize: 11 }} />
    </div>
  );

const cargoText =
  (
    update: (key: string, field: ReletCargoField, value: string) => void,
    field: ReletCargoField,
    right?: boolean,
  ) =>
  (value: string, row: ReletCargoRow) => (
    <TxtCell value={value} right={right} onChange={(next) => update(row.key, field, next)} />
  );

const cargoPercent =
  (update: (key: string, field: ReletCargoField, value: string) => void, field: ReletCargoField) =>
  (value: string, row: ReletCargoRow) => (
    <TxtCell
      value={value}
      right
      onChange={(next) => update(row.key, field, formatPercentInput(next))}
    />
  );

const buildCargoCols = (
  update: (key: string, field: ReletCargoField, value: string) => void,
  ports: LookupItem[],
  onOpenLinerTerms: (row: ReletCargoRow, side: "h" | "s") => void,
): ColumnsType<ReletCargoRow> => [
  { title: "#", dataIndex: "no", width: 36, align: "center" },
  { title: "Account", dataIndex: "account", width: "7%", render: cargoText(update, "account") },
  {
    title: "Cargo Name",
    dataIndex: "cargoName",
    width: "8%",
    render: cargoText(update, "cargoName"),
  },
  {
    title: "Loading Port",
    dataIndex: "loadingPort",
    width: "12.5%",
    render: portLookupCell(update, "loadingPort", ports),
  },
  {
    title: "Discharging Port",
    dataIndex: "dischargingPort",
    width: "12.5%",
    render: portLookupCell(update, "dischargingPort", ports),
  },
  {
    title: "Quantity",
    dataIndex: "quantity",
    width: "6.2%",
    align: "right",
    render: cargoText(update, "quantity", true),
  },
  {
    title: "Unit",
    dataIndex: "unit",
    width: 32,
    align: "center",
    render: cargoText(update, "unit"),
  },
  {
    title: "HEAD CP",
    children: [
      {
        title: "Frt",
        dataIndex: "hFrt",
        width: "5%",
        align: "right",
        render: cargoText(update, "hFrt", true),
      },
      {
        title: "Frt Type",
        dataIndex: "hFrtType",
        width: 46,
        align: "center",
        render: freightTypeSelect(update, "hFrtType"),
      },
      {
        title: "Frt Lumpsum",
        dataIndex: "hFrtLumpsum",
        width: "6%",
        align: "right",
        render: cargoText(update, "hFrtLumpsum", true),
      },
      {
        title: "A. Comm",
        dataIndex: "hComm",
        width: 48,
        align: "right",
        render: cargoPercent(update, "hComm"),
      },
      {
        title: "Brkg",
        dataIndex: "hBrkg",
        width: 48,
        align: "right",
        render: cargoPercent(update, "hBrkg"),
      },
      {
        title: "Net Frt",
        dataIndex: "hNet",
        width: "6%",
        align: "right",
        render: (value: string) => <YCell value={value} readOnly />,
      },
      {
        title: "Liner Terms",
        dataIndex: "hLiner",
        width: "6%",
        align: "right",
        render: (value: string, row) => (
          <div className="flex items-center gap-1">
            <Button
              type="text"
              size="small"
              className="h-[18px] w-[18px] p-0"
              icon={<SearchOutlined className="text-[#73808a]" />}
              onClick={() => onOpenLinerTerms(row, "h")}
            />
            <div className="min-w-0 flex-1">
              <TxtCell value={value} right onChange={(next) => update(row.key, "hLiner", next)} />
            </div>
          </div>
        ),
      },
    ],
  },
  {
    title: "SUB CP",
    children: [
      {
        title: "Frt",
        dataIndex: "sFrt",
        width: "5%",
        align: "right",
        render: cargoText(update, "sFrt", true),
      },
      {
        title: "Frt Type",
        dataIndex: "sFrtType",
        width: 46,
        align: "center",
        render: freightTypeSelect(update, "sFrtType"),
      },
      {
        title: "Frt Lumpsum",
        dataIndex: "sFrtLumpsum",
        width: "6%",
        align: "right",
        render: cargoText(update, "sFrtLumpsum", true),
      },
      {
        title: "A. Comm",
        dataIndex: "sComm",
        width: 48,
        align: "right",
        render: cargoPercent(update, "sComm"),
      },
      {
        title: "Net Frt",
        dataIndex: "sNet",
        width: "6%",
        align: "right",
        render: (value: string) => <YCell value={value} readOnly />,
      },
      {
        title: "Liner Terms",
        dataIndex: "sLiner",
        width: "5.4%",
        align: "right",
        render: (value: string, row) => (
          <div className="flex items-center gap-1">
            <Button
              type="text"
              size="small"
              className="h-[18px] w-[18px] p-0"
              icon={<SearchOutlined className="text-[#73808a]" />}
              onClick={() => onOpenLinerTerms(row, "s")}
            />
            <div className="min-w-0 flex-1">
              <TxtCell value={value} right onChange={(next) => update(row.key, "sLiner", next)} />
            </div>
          </div>
        ),
      },
    ],
  },
  {
    title: "",
    key: "search",
    width: 32,
    align: "center",
    render: () => <SearchOutlined style={{ color: "#888" }} />,
  },
];

const isMargin = (r: ReletPortRow) => r.key === "margin";

const portRotationLookupCell =
  (
    update: (key: string, field: ReletPortField, value: string) => void,
    ports: LookupItem[],
  ) =>
  (value: string, row: ReletPortRow) =>
    isMargin(row) ? (
      <span>{value}</span>
    ) : (
      <Select
        showSearch
        allowClear
        size="small"
        variant="borderless"
        value={value || undefined}
        onChange={(next) => {
          const port = next ?? "";
          update(row.key, "port", port);
          update(row.key, "timezone", resolvePortTimezoneFromValue(port, ports));
        }}
        onSearch={(next) => {
          update(row.key, "port", next);
          update(row.key, "timezone", resolvePortTimezoneFromValue(next, ports));
        }}
        options={ports.map((item) => ({ value: portLabel(item), label: portLabel(item) }))}
        filterOption={filterLookup}
        style={{ width: "100%", fontSize: 11 }}
      />
    );

const portText =
  (
    update: (key: string, field: ReletPortField, value: string) => void,
    field: ReletPortField,
    right?: boolean,
  ) =>
  (value: string, row: ReletPortRow) =>
    isMargin(row) && field !== "sea" && field !== "idle" ? (
      <span className={right ? "block pr-1 text-right" : ""}>{value}</span>
    ) : (
      <TxtCell value={value} right={right} onChange={(next) => update(row.key, field, next)} />
    );
const portYellow =
  (
    update: (key: string, field: ReletPortField, value: string) => void,
    field: ReletPortField,
    right = true,
  ) =>
  (value: string, row: ReletPortRow) =>
    isMargin(row) && field !== "sea" && field !== "idle" ? (
      <span className={right ? "block pr-1 text-right" : ""}>{value}</span>
    ) : (
      <YCell value={value} right={right} onChange={(next) => update(row.key, field, next)} />
    );

const buildPortCols = (
  update: (key: string, field: ReletPortField, value: string) => void,
  ports: LookupItem[],
): ColumnsType<ReletPortRow> => [
  { title: "#", dataIndex: "no", width: 36, align: "center" },
  {
    title: "Type",
    dataIndex: "type",
    width: 85,
    render: (v: string, r) =>
      isMargin(r) ? (
        <b>{v}</b>
      ) : (
        <TxtCell value={v} onChange={(next) => update(r.key, "type", next)} />
      ),
  },
  {
    title: "Port Name / Coordinate",
    dataIndex: "port",
    width: 230,
    render: portRotationLookupCell(update, ports),
  },
  {
    title: "Time Zone",
    dataIndex: "timezone",
    width: 85,
    align: "center",
    render: (value: string) => <YCell value={value} right={false} readOnly />,
  },
  {
    title: "Distance",
    children: [
      {
        title: "TTL",
        dataIndex: "distance",
        width: 56,
        align: "right",
        render: portText(update, "distance", true),
      },
      {
        title: "ECA",
        dataIndex: "eca",
        width: 44,
        align: "right",
        render: portText(update, "eca", true),
      },
    ],
  },
  {
    title: "WF",
    dataIndex: "wf",
    width: 44,
    align: "right",
    render: portText(update, "wf", true),
  },
  {
    title: "Spd",
    dataIndex: "spd",
    width: 44,
    align: "right",
    render: portYellow(update, "spd"),
  },
  {
    title: "Sea",
    dataIndex: "sea",
    width: 60,
    align: "right",
    render: (value: string, row) =>
      isMargin(row) ? (
        <YCell value={value} onChange={(next) => update(row.key, "sea", next)} />
      ) : (
        <YCell value={value} readOnly />
      ),
  },
  {
    title: "HEAD CP",
    children: [
      {
        title: "L/D Rate",
        dataIndex: "hLd",
        width: 70,
        align: "right",
        render: portYellow(update, "hLd"),
      },
      {
        title: "Dem",
        dataIndex: "hDem",
        width: 80,
        align: "right",
        render: portText(update, "hDem", true),
      },
      {
        title: "Des",
        dataIndex: "hDes",
        width: 80,
        align: "right",
        render: portText(update, "hDes", true),
      },
    ],
  },
  {
    title: "SUB CP",
    children: [
      {
        title: "L/D Rate",
        dataIndex: "sLd",
        width: 70,
        align: "right",
        render: portYellow(update, "sLd"),
      },
      {
        title: "Dem",
        dataIndex: "sDem",
        width: 80,
        align: "right",
        render: portText(update, "sDem", true),
      },
      {
        title: "Des",
        dataIndex: "sDes",
        width: 80,
        align: "right",
        render: portText(update, "sDes", true),
      },
    ],
  },
  {
    title: "Port (I/W)",
    children: [
      {
        title: "Idle",
        dataIndex: "idle",
        width: 60,
        align: "right",
        render: portYellow(update, "idle"),
      },
      {
        title: "Working",
        dataIndex: "working",
        width: 60,
        align: "right",
        render: (value: string) => <YCell value={value} readOnly />,
      },
    ],
  },
  {
    title: "Arrival",
    dataIndex: "arrival",
    width: 140,
    align: "center",
    render: (value: string, row) =>
      row.key === "1" ? (
        <TxtCell value={value} onChange={(next) => update(row.key, "arrival", next)} />
      ) : (
        <YCell value={value} right={false} readOnly />
      ),
  },
  {
    title: "Departure",
    dataIndex: "departure",
    width: 140,
    align: "center",
    render: (value: string, row) =>
      row.key === "1" ? (
        <TxtCell value={value} onChange={(next) => update(row.key, "departure", next)} />
      ) : (
        <YCell value={value} right={false} readOnly />
      ),
  },
];

export default function CargoReletApp({
  registerWorkspaceToolbar,
}: {
  registerWorkspaceToolbar?: RegisterWorkspaceToolbar;
} = {}) {
  const [modal, setModal] = useState<CargoReletModal | null>(null);
  const [linerTarget, setLinerTarget] = useState<ReletLinerTarget | null>(null);
  const [estimateId, setEstimateId] = useState<string>();
  const [estimateFileId, setEstimateFileId] = useState<string>();
  const [loadEstimateId, setLoadEstimateId] = useState("");
  const [auditState, setAuditState] = useState({ updatedAt: "", updatedBy: "Admin" });
  const [sheetExists, setSheetExists] = useState(true);
  const [otherResultAmount, setOtherResultAmount] = useState("0.0");
  const [ports, setPorts] = useState<LookupItem[]>([]);
  const [vessels, setVessels] = useState<LookupItem[]>([]);
  const [vesselId, setVesselId] = useState<string>();
  const [reportOpen, setReportOpen] = useState(false);
  const [reportPrintToken, setReportPrintToken] = useState<number>();
  const [saveState, setSaveState] = useState<
    | { status: "idle" }
    | { status: "saving"; message: string }
    | { status: "saved"; message: string }
    | { status: "loading"; message: string }
    | { status: "loaded"; message: string }
    | { status: "error"; message: string; details?: string[] }
  >({ status: "idle" });
  const workspaceToolbarActionsRef = useRef<{
    resetSheet: () => void;
    deleteSheet: () => void;
    save: () => void;
    load: () => void;
    clear: () => void;
  }>({
    resetSheet: () => undefined,
    deleteSheet: () => undefined,
    save: () => undefined,
    load: () => undefined,
    clear: () => undefined,
  });
  const routeEstimateLoadRef = useRef<string | undefined>(undefined);
  const cargo = useRowOps<ReletCargoRow>(reletCargoData);
  const port = useRowOps<ReletPortRow>(reletPortData);
  const updateCargo = (key: string, field: ReletCargoField, value: string) => {
    cargo.setRows((rows) =>
      rows.map((row) => (row.key === key ? { ...row, [field]: value } : row)),
    );
  };
  const updatePort = (key: string, field: ReletPortField, value: string) => {
    port.setRows((rows) => rows.map((row) => (row.key === key ? { ...row, [field]: value } : row)));
  };
  const calculatedCargoRows = useMemo(() => calculateCargoRows(cargo.rows), [cargo.rows]);
  const calculatedPortRows = useMemo(
    () => calculatePortRows(port.rows, calculatedCargoRows, ports),
    [calculatedCargoRows, port.rows, ports],
  );
  const cargoTotals = useMemo(
    () => calculateCargoTotals(calculatedCargoRows),
    [calculatedCargoRows],
  );
  const portTotals = useMemo(() => calculatePortTotals(calculatedPortRows), [calculatedPortRows]);
  const portSummaryText = useMemo(
    () =>
      buildPortRotationSummary(calculatedPortRows, {
        isSummaryRow: isMargin,
        type: (row) => row.type,
        sea: (row) => row.sea,
        idle: (row) => row.idle,
        working: (row) => row.working,
        eca: (row) => row.eca,
        wf: (row) => row.wf,
        spd: (row) => row.spd,
        departure: (row) => row.departure,
        classifySeaState: (row, index, activeRows) =>
          classifySeaStateByCargoFlow(activeRows, row, index, (item) => item.type),
        classifyMarginSeaState: (_row, _activeRows, lastSeaState) => lastSeaState,
      }),
    [calculatedPortRows],
  );
  const resultPanel = useMemo(
    () => buildCargoReletResult(calculatedCargoRows, portTotals, otherResultAmount),
    [calculatedCargoRows, portTotals, otherResultAmount],
  );
  const cargoColumns = useResizableColumns(
    buildCargoCols(updateCargo, ports, (row, side) => setLinerTarget({ rowKey: row.key, side })),
  );
  const portColumns = useResizableColumns(buildPortCols(updatePort, ports));
  const linerTargetRow = linerTarget
    ? calculatedCargoRows.find((row) => row.key === linerTarget.rowKey) ?? null
    : null;

  useEffect(() => {
    let alive = true;
    Promise.all([fetchLookup("ports"), fetchLookup("vessels")])
      .then(([nextPorts, nextVessels]) => {
        if (!alive) return;
        setPorts(nextPorts);
        setVessels(nextVessels);
      })
      .catch(() => {
        if (!alive) return;
        setPorts([]);
        setVessels([]);
      });
    return () => {
      alive = false;
    };
  }, []);

  const save = async () => {
    if (!sheetExists) {
      setSaveState({ status: "error", message: "Create a New Sheet before saving." });
      return;
    }

    const validationDetails = validateCargoReletForm(calculatedCargoRows, calculatedPortRows);
    if (validationDetails.length) {
      setSaveState({
        status: "error",
        message: "Cargo Relet estimate input is invalid.",
        details: validationDetails,
      });
      return;
    }

    setSaveState({ status: "saving", message: "Saving Cargo Relet estimate..." });
    try {
      const payload = buildCargoReletSnapshotPayload({
        estimateId,
        estimateFileId,
        header: { vesselId },
        cargoRows: calculatedCargoRows,
        portRows: calculatedPortRows,
        otherResultAmount,
      });
      const response = await saveCargoReletSnapshot(payload);
      setEstimateId(response.estimateId);
      setEstimateFileId(response.estimateFileId);
      setLoadEstimateId(response.estimateId);
      setAuditState({
        updatedAt: response.updatedAt ?? new Date().toISOString(),
        updatedBy: response.updatedByName ?? "Admin",
      });
      setSaveState({
        status: "saved",
        message: `Saved Cargo Relet estimate #${response.estimateId}.`,
      });
    } catch (error) {
      setSaveState({
        status: "error",
        message: error instanceof Error ? error.message : "Save failed.",
        details:
          error instanceof VoyageApiError
            ? error.details
                .map((detail) => detail.message)
                .filter((message): message is string => Boolean(message))
            : undefined,
      });
    }
  };

  const loadById = async (id: string) => {
    setSaveState({ status: "loading", message: `Loading Cargo Relet estimate #${id}...` });
    try {
      const snapshot = await loadCargoReletSnapshot(id);
      const rows = mapCargoReletSnapshotToRows(snapshot);
      cargo.setRows(rows.cargoRows);
      port.setRows(rows.portRows);
      setOtherResultAmount(rows.otherResultAmount || "0.0");
      setVesselId(snapshot.header.vesselId);
      setEstimateId(snapshot.header.estimateId ?? id);
      setEstimateFileId(snapshot.header.estimateFileId);
      setLoadEstimateId(snapshot.header.estimateId ?? id);
      setAuditState({
        updatedAt: snapshot.header.updatedAt ?? "",
        updatedBy: snapshot.header.updatedByName ?? "Admin",
      });
      setSheetExists(true);
      setSaveState({
        status: "loaded",
        message: `Loaded Cargo Relet estimate #${snapshot.header.estimateId ?? id}.`,
      });
    } catch (error) {
      setSaveState({
        status: "error",
        message: error instanceof Error ? error.message : "Load failed.",
        details:
          error instanceof VoyageApiError
            ? error.details
                .map((detail) => detail.message)
                .filter((message): message is string => Boolean(message))
            : undefined,
      });
    }
  };

  const load = async () => {
    if (!sheetExists) {
      setSaveState({ status: "error", message: "There is no sheet to open." });
      return;
    }

    const id = loadEstimateId.trim() || estimateId;
    if (!id) {
      setSaveState({ status: "error", message: "Enter an Estimate ID to load." });
      return;
    }

    await loadById(id);
  };

  useEffect(() => {
    const routeEstimateId = new URLSearchParams(window.location.search).get("estimateId")?.trim();
    if (!routeEstimateId || routeEstimateLoadRef.current === routeEstimateId) return;

    routeEstimateLoadRef.current = routeEstimateId;
    void loadById(routeEstimateId);
  }, []);

  const resetSheet = () => {
    cargo.setRows(reletCargoData);
    port.setRows(reletPortData);
    setEstimateId(undefined);
    setEstimateFileId(undefined);
    setLoadEstimateId("");
    setAuditState({ updatedAt: "", updatedBy: "Admin" });
    setSheetExists(true);
    setSaveState({ status: "idle" });
  };

  const deleteSheet = () => {
    cargo.setRows([]);
    port.setRows([]);
    setEstimateId(undefined);
    setEstimateFileId(undefined);
    setLoadEstimateId("");
    setAuditState({ updatedAt: "", updatedBy: "Admin" });
    setSheetExists(false);
    setSaveState({ status: "idle" });
  };

  workspaceToolbarActionsRef.current = {
    resetSheet,
    deleteSheet,
    save: () => void save(),
    load: () => void load(),
    clear: () => setSaveState({ status: "idle" }),
  };

  useLayoutEffect(() => {
    registerWorkspaceToolbar?.({
      hasSheet: sheetExists,
      hasEstimate: Boolean(estimateId),
      execute: {
        new: () => workspaceToolbarActionsRef.current.resetSheet(),
        delete: () => workspaceToolbarActionsRef.current.deleteSheet(),
        save: () => workspaceToolbarActionsRef.current.save(),
        saveAs: () => workspaceToolbarActionsRef.current.save(),
        open: () => workspaceToolbarActionsRef.current.load(),
        reload: () => workspaceToolbarActionsRef.current.load(),
        undo: () => workspaceToolbarActionsRef.current.clear(),
        increase: () => workspaceToolbarActionsRef.current.clear(),
        decrease: () => workspaceToolbarActionsRef.current.clear(),
        options: () => workspaceToolbarActionsRef.current.clear(),
      },
    });
  }, [estimateId, registerWorkspaceToolbar, sheetExists]);

  return (
    <EstimatorShell
      title="Cargo Relet Estimation W3"
      sheetKind="cargo relet"
      lastUpdatedAt={auditState.updatedAt}
      lastUpdatedBy={auditState.updatedBy}
    >
      <div className="cargo-relet-estimation">
      {saveState.status !== "idle" && (
        <Alert
          className="mb-2"
          type={saveState.status === "error" ? "error" : "info"}
          showIcon
          message={saveState.message}
          description={
            saveState.status === "error" && saveState.details?.length
              ? saveState.details.join(" | ")
              : undefined
          }
        />
      )}
      <VesselSection vesselId={vesselId} vessels={vessels} onVesselIdChange={setVesselId} />

      <section className="mb-2">
        <div className="mb-1 flex items-center gap-3">
          <SectionTitle>Cargo</SectionTitle>
          <Button size="small" icon={<CalculatorOutlined />} onClick={() => setModal("loadable")}>
            Loadable Quantity Calculator
          </Button>
          <Button size="small" icon={<FundOutlined />} onClick={() => setModal("freight")}>
            Frt. Simulator
          </Button>
        </div>
        <Table<ReletCargoRow>
          size="small"
          bordered
          pagination={false}
          tableLayout="fixed"
          columns={cargoColumns}
          dataSource={calculatedCargoRows}
          onRow={cargo.onRow}
          rowClassName={(r) => (r.key === cargo.selectedKey ? "ve-row-selected" : "")}
          summary={() => (
            <Table.Summary fixed>
              <Table.Summary.Row style={{ background: VE_COLORS.rowAlt, fontWeight: 600 }}>
                <Table.Summary.Cell index={0} colSpan={5} align="right">
                  Total
                </Table.Summary.Cell>
                <Table.Summary.Cell index={5} align="right">
                  {cargoTotals.quantity}
                </Table.Summary.Cell>
                <Table.Summary.Cell index={6} />
                <Table.Summary.Cell index={7} align="right">
                  {cargoTotals.hFrt}
                </Table.Summary.Cell>
                <Table.Summary.Cell index={8} />
                <Table.Summary.Cell index={9} align="right">
                  {cargoTotals.hFrtLumpsum}
                </Table.Summary.Cell>
                <Table.Summary.Cell index={10} align="right">
                  {cargoTotals.hComm}
                </Table.Summary.Cell>
                <Table.Summary.Cell index={11} align="right">
                  {cargoTotals.hBrkg}
                </Table.Summary.Cell>
                <Table.Summary.Cell index={12} align="right">
                  {cargoTotals.hNet}
                </Table.Summary.Cell>
                <Table.Summary.Cell index={13} align="right">
                  {cargoTotals.hLiner}
                </Table.Summary.Cell>
                <Table.Summary.Cell index={14} align="right">
                  {cargoTotals.sFrt}
                </Table.Summary.Cell>
                <Table.Summary.Cell index={15} />
                <Table.Summary.Cell index={16} align="right">
                  {cargoTotals.sFrtLumpsum}
                </Table.Summary.Cell>
                <Table.Summary.Cell index={17} align="right">
                  {cargoTotals.sComm}
                </Table.Summary.Cell>
                <Table.Summary.Cell index={18} align="right">
                  {cargoTotals.sNet}
                </Table.Summary.Cell>
                <Table.Summary.Cell index={19} align="right">
                  {cargoTotals.sLiner}
                </Table.Summary.Cell>
                <Table.Summary.Cell index={20} />
              </Table.Summary.Row>
            </Table.Summary>
          )}
        />
        <RowToolbar
          onAdd={cargo.add}
          onDelete={cargo.remove}
          onInsertAbove={cargo.insertAbove}
          onInsertBelow={cargo.insertBelow}
        />
      </section>

      <section className="mb-2">
        <div className="ve-routing-checkboxes mb-1 flex flex-wrap items-center gap-3">
          <SectionTitle>Port Rotation</SectionTitle>
          <Checkbox defaultChecked className="text-[11px]">
            SUEZ
          </Checkbox>
          <Checkbox defaultChecked className="text-[11px]">
            PANAMA
          </Checkbox>
          <Checkbox className="text-[11px]">KIEL</Checkbox>
          <span className="text-[11px] font-bold text-gray-700" style={{ marginLeft: 436 }}>
            {portSummaryText || reletPortSummary}
          </span>
        </div>
        <Table<ReletPortRow>
          size="small"
          bordered
          pagination={false}
          tableLayout="fixed"
          columns={portColumns}
          dataSource={calculatedPortRows}
          onRow={port.onRow}
          rowClassName={(r) =>
            isMargin(r) ? "ve-margin-row" : r.key === port.selectedKey ? "ve-row-selected" : ""
          }
          summary={() => (
            <Table.Summary fixed>
              <Table.Summary.Row style={{ background: VE_COLORS.rowAlt, fontWeight: 600 }}>
                <Table.Summary.Cell index={0} colSpan={4} align="right">
                  Totals
                </Table.Summary.Cell>
                <Table.Summary.Cell index={4} align="right">
                  {portTotals.distance}
                </Table.Summary.Cell>
                <Table.Summary.Cell index={5} align="right">
                  {portTotals.eca}
                </Table.Summary.Cell>
                <Table.Summary.Cell index={6} />
                <Table.Summary.Cell index={7} />
                <Table.Summary.Cell index={8} align="right">
                  {portTotals.sea}
                </Table.Summary.Cell>
                <Table.Summary.Cell index={9} />
                <Table.Summary.Cell index={10} align="right">
                  {portTotals.hDem}
                </Table.Summary.Cell>
                <Table.Summary.Cell index={11} align="right">
                  {portTotals.hDes}
                </Table.Summary.Cell>
                <Table.Summary.Cell index={12} />
                <Table.Summary.Cell index={13} align="right">
                  {portTotals.sDem}
                </Table.Summary.Cell>
                <Table.Summary.Cell index={14} align="right">
                  {portTotals.sDes}
                </Table.Summary.Cell>
                <Table.Summary.Cell index={15} align="right">
                  {portTotals.idle}
                </Table.Summary.Cell>
                <Table.Summary.Cell index={16} align="right">
                  {portTotals.working}
                </Table.Summary.Cell>
                <Table.Summary.Cell index={17} align="center">
                  {portTotals.arrival}
                </Table.Summary.Cell>
                <Table.Summary.Cell index={18} align="center">
                  {portTotals.departure}
                </Table.Summary.Cell>
              </Table.Summary.Row>
            </Table.Summary>
          )}
        />
        <RowToolbar
          onAdd={port.add}
          onDelete={port.remove}
          onInsertAbove={port.insertAbove}
          onInsertBelow={port.insertBelow}
        />

        <div className="mt-1 flex flex-wrap items-center gap-2">
          <div className="ml-auto flex items-center gap-2">
            <Select
              size="small"
              defaultValue="days"
              style={{ width: 80 }}
              options={[
                { value: "days", label: "Days" },
                { value: "hours", label: "Hours" },
              ]}
            />
            <span
              className="rounded-sm border px-2 py-[1px] text-[11px]"
              style={{
                borderColor: VE_COLORS.titleBar,
                color: VE_COLORS.titleBar,
                background: VE_COLORS.rowAlt,
              }}
            >
              <EnvironmentOutlined /> Port Local
            </span>
            <span
              className="rounded-sm border px-2 py-[1px] text-[11px]"
              style={{ borderColor: VE_COLORS.border }}
            >
              <DesktopOutlined /> PC Time
            </span>
            <Select
              size="small"
              defaultValue="local"
              style={{ width: 130 }}
              options={[
                { value: "local", label: "Port local time" },
                { value: "utc", label: "UTC" },
              ]}
            />
          </div>
        </div>
      </section>

      <CargoReletResultPanel
        result={resultPanel}
        otherAmount={otherResultAmount}
        onOtherAmountChange={setOtherResultAmount}
        onAnalyzer={() => setModal("analyzer")}
        onOpenReport={() => setReportOpen(true)}
        onPrintReport={() => {
          setReportOpen(true);
          setReportPrintToken(Date.now());
        }}
      />
      {modal === "loadable" && <LoadableQuantityApp onClose={() => setModal(null)} />}
      {modal === "freight" && <FreightSimulatorApp onClose={() => setModal(null)} />}
      {modal === "analyzer" && <AnalyzerApp onClose={() => setModal(null)} />}
      <Modal
        open={Boolean(linerTargetRow)}
        footer={null}
        closable={false}
        centered
        width={1120}
        onCancel={() => setLinerTarget(null)}
        destroyOnHidden
      >
        {linerTarget && linerTargetRow && (
          <LinerTermsForm
            rows={buildReletLinerContextRows(linerTargetRow)}
            initialTotal={parseAmount(linerTarget.side === "h" ? linerTargetRow.hLiner : linerTargetRow.sLiner)}
            onCancel={() => setLinerTarget(null)}
            onApply={({ amount }) => {
              updateCargo(
                linerTargetRow.key,
                linerTarget.side === "h" ? "hLiner" : "sLiner",
                formatAmount(amount),
              );
              setLinerTarget(null);
            }}
          />
        )}
      </Modal>
      <CargoReletReportPreview
        open={reportOpen}
        onClose={() => setReportOpen(false)}
        autoPrintToken={reportPrintToken}
        data={{
          estimateId,
          estimateName: "cargo-relet1",
          status: "DRAFT",
          auditState,
          vesselId,
          lookups: { vessels },
          cargoRows: calculatedCargoRows,
          portRows: calculatedPortRows,
          result: resultPanel,
          summaryText: portSummaryText,
        }}
      />
      </div>
    </EstimatorShell>
  );
}

function CargoReletResultPanel({
  result,
  otherAmount,
  onOtherAmountChange,
  onAnalyzer,
  onOpenReport,
  onPrintReport,
}: {
  result: CargoReletResult;
  otherAmount: string;
  onOtherAmountChange: (value: string) => void;
  onAnalyzer: () => void;
  onOpenReport?: () => void;
  onPrintReport?: () => void;
}) {
  const columns: Array<keyof ResultLine> = [
    "ttlFreight",
    "addComm",
    "brokerage",
    "linerTerms",
    "demurrage",
    "despatch",
    "total",
  ];
  const titles = [
    "TTL Freight",
    "Add Comm.",
    "Brokerage",
    "Liner Terms",
    "Demurrage",
    "Despatch",
    "Total",
  ];
  const rows = [result.head, result.sub];

  return (
    <section className="mt-2">
      <div className="mb-1 flex items-center">
        <SectionTitle>Result</SectionTitle>
        <div className="ml-auto flex gap-1">
          <Button size="small" icon={<LineChartOutlined />} onClick={onAnalyzer}>
            Analyzer
          </Button>
          <Button size="small" icon={<FileTextOutlined />} onClick={onOpenReport}>
            Report
          </Button>
          <Button size="small" icon={<SearchOutlined />} onClick={onPrintReport}>
            Print
          </Button>
          <Button size="small" icon={<FileTextOutlined />}>
            Remark
          </Button>
        </div>
      </div>
      <div className="flex gap-6">
        <table className="w-full border-collapse text-[11px]">
          <thead>
            <tr>
              <th className="w-[110px] border border-[#d8e0e6] bg-[#f3f5f7]" />
              {titles.map((title) => (
                <th key={title} className="border border-[#d8e0e6] bg-[#f3f5f7] px-1 py-[3px] text-center font-medium">
                  {title}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.label}>
                <td className="border border-[#d8e0e6] bg-[#f3f5f7] px-1 py-[3px] font-medium">
                  {row.label}
                </td>
                {columns.map((key) => (
                  <td key={key} className="border border-[#d8e0e6] bg-[#ffffd9] px-1 py-[3px] text-right">
                    {key !== "ttlFreight" && key !== "total" ? (
                      <SearchOutlined className="float-left mt-[2px] text-[#73808a]" />
                    ) : null}
                    {row[key]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
        <table className="w-[315px] shrink-0 border-collapse self-end text-[11px]">
          <tbody>
            <tr>
              <td className="w-[155px] border border-[#d8e0e6] bg-[#f3f5f7] px-1 py-[3px]">
                Others
              </td>
              <td className="border border-[#d8e0e6] bg-[#ffffd9] px-1 py-[3px] text-right">
                <SearchOutlined className="float-left mt-[2px] text-[#73808a]" />
                <YCell value={otherAmount} onChange={onOtherAmountChange} />
              </td>
            </tr>
            <tr>
              <td className="border border-[#d8e0e6] bg-[#f3f5f7] px-1 py-[3px] font-bold">
                PROFIT
              </td>
              <td className="border border-[#d8e0e6] bg-[#ffffd9] px-1 py-[3px] text-right font-bold">
                {result.profit}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>
  );
}

function calculateCargoRows(rows: ReletCargoRow[]) {
  return rows.map((row) => ({
    ...row,
    hNet: formatAmount(netFreight(row, "h")),
    sNet: formatAmount(netFreight(row, "s")),
  }));
}

function netFreight(row: ReletCargoRow, side: "h" | "s") {
  const quantity = parseAmount(row.quantity);
  const gross = grossFreight(row, side, quantity);
  const comm = parseAmount(side === "h" ? row.hComm : row.sComm) / 100;
  const brkg = side === "h" ? parseAmount(row.hBrkg) / 100 : 0;
  return gross * (1 - comm - brkg);
}

function grossFreight(row: ReletCargoRow, side: "h" | "s", quantity = parseAmount(row.quantity)) {
  const frt = parseAmount(side === "h" ? row.hFrt : row.sFrt);
  const frtType = (side === "h" ? row.hFrtType : row.sFrtType).toUpperCase();
  const lumpsum = parseAmount(side === "h" ? row.hFrtLumpsum : row.sFrtLumpsum);
  const gross = frtType === "L" ? lumpsum : quantity * frt;
  return gross;
}

function calculateCargoTotals(rows: ReletCargoRow[]) {
  const dataRows = rows.filter((row) => row.key !== "margin");
  const quantity = sum(dataRows.map((row) => parseAmount(row.quantity)));
  const hNet = sum(dataRows.map((row) => parseAmount(row.hNet)));
  const sNet = sum(dataRows.map((row) => parseAmount(row.sNet)));
  return {
    quantity: formatAmount(quantity),
    hFrt: formatAmount(weightedAverage(dataRows, "hFrt")),
    hFrtLumpsum: formatAmount(sum(dataRows.map((row) => parseAmount(row.hFrtLumpsum)))),
    hComm: formatPercent(weightedAverage(dataRows, "hComm")),
    hBrkg: formatPercent(weightedAverage(dataRows, "hBrkg")),
    hNet: formatAmount(hNet),
    hLiner: formatAmount(sum(dataRows.map((row) => parseAmount(row.hLiner)))),
    sFrt: formatAmount(weightedAverage(dataRows, "sFrt")),
    sFrtLumpsum: formatAmount(sum(dataRows.map((row) => parseAmount(row.sFrtLumpsum)))),
    sComm: formatPercent(weightedAverage(dataRows, "sComm")),
    sBrkg: formatPercent(weightedAverage(dataRows, "sBrkg")),
    sNet: formatAmount(sNet),
    sLiner: formatAmount(sum(dataRows.map((row) => parseAmount(row.sLiner)))),
  };
}

function weightedAverage(rows: ReletCargoRow[], field: keyof ReletCargoRow) {
  const totalQuantity = sum(rows.map((row) => parseAmount(row.quantity)));
  if (!totalQuantity) return 0;
  return (
    sum(rows.map((row) => parseAmount(row.quantity) * parseAmount(String(row[field] ?? "")))) /
    totalQuantity
  );
}

function calculatePortRows(rows: ReletPortRow[], cargoRows: ReletCargoRow[], ports: LookupItem[]) {
  let previousDeparture: Date | undefined;
  let previousTimezone = "";

  return rows.map((row) => {
    const timezone = resolvePortTimezoneFromValue(row.port, ports) || row.timezone || "";

    if (isMargin(row)) {
      const arrival = addDays(previousDeparture, parseAmount(row.sea));
      const departure = addDays(arrival, parseAmount(row.idle));
      return {
        ...row,
        timezone: "",
        arrival: formatDateTime(arrival),
        departure: formatDateTime(departure),
      };
    }

    const seaDays = calculateSeaDays(row);
    const working = calculateWorkingDays(row, cargoRows);
    const arrival = previousDeparture
      ? addDays(previousDeparture, (seaDays ?? 0) + timezoneDeltaDays(previousTimezone, timezone))
      : parseDateTime(row.arrival);
    const initialDeparture = parseDateTime(row.departure);
    const departure =
      addDays(arrival, parseAmount(row.idle) + parseAmount(working)) ?? initialDeparture;
    previousDeparture = departure ?? arrival ?? previousDeparture;
    previousTimezone = timezone || previousTimezone;

    return {
      ...row,
      timezone,
      sea: seaDays === undefined ? "" : formatAmount(seaDays, 2),
      working,
      arrival: formatDateTime(arrival),
      departure: formatDateTime(departure),
    };
  });
}

function calculateSeaDays(row: ReletPortRow) {
  const ttl = parseAmount(row.distance);
  const eca = parseAmount(row.eca);
  const wf = parseAmount(row.wf);
  const speed = parseAmount(row.spd);
  if (!speed) return undefined;
  return ((ttl + eca) * (1 + wf / 100)) / (speed * 24);
}

function calculateWorkingDays(row: ReletPortRow, cargoRows: ReletCargoRow[]) {
  const headRate = parseAmount(row.hLd);
  const subRate = parseAmount(row.sLd);
  const ldRate = headRate || subRate;
  if (!ldRate) return "";

  const portName = normalizePortName(row.port);
  const isLoading = /load/i.test(row.type);
  const isDischarging = /disch|discharge/i.test(row.type);
  if (!isLoading && !isDischarging) return "";

  const quantity = sum(
    cargoRows
      .filter(
        (cargo) =>
          normalizePortName(isLoading ? cargo.loadingPort : cargo.dischargingPort) === portName,
      )
      .map((cargo) => parseAmount(cargo.quantity)),
  );
  return quantity ? formatAmount(quantity / ldRate, 2) : "";
}

function calculatePortTotals(rows: ReletPortRow[]) {
  const dataRows = rows.filter((row) => !isMargin(row));
  const marginRow = rows.find(isMargin);
  return {
    distance: formatAmount(sum(dataRows.map((row) => parseAmount(row.distance))), 0),
    eca: formatAmount(sum(dataRows.map((row) => parseAmount(row.eca))), 0),
    sea: formatAmount(sum(rows.map((row) => parseAmount(row.sea))), 2),
    hDem: formatAmount(sum(dataRows.map((row) => parseAmount(row.hDem)))),
    hDes: formatAmount(sum(dataRows.map((row) => parseAmount(row.hDes)))),
    sDem: formatAmount(sum(dataRows.map((row) => parseAmount(row.sDem)))),
    sDes: formatAmount(sum(dataRows.map((row) => parseAmount(row.sDes)))),
    idle: formatAmount(sum(rows.map((row) => parseAmount(row.idle))), 2),
    working: formatAmount(sum(dataRows.map((row) => parseAmount(row.working))), 2),
    portCharge: formatAmount(sum(dataRows.map((row) => parseAmount(row.portCharge)))),
    arrival: marginRow?.arrival || firstText(dataRows.map((row) => row.arrival)),
    departure: marginRow?.departure || lastText(dataRows.map((row) => row.departure)),
  };
}

export type CargoReletResult = {
  head: ResultLine;
  sub: ResultLine;
  others: number;
  profit: string;
};

type ResultLine = {
  label: string;
  totalValue: number;
  ttlFreight: string;
  addComm: string;
  brokerage: string;
  linerTerms: string;
  demurrage: string;
  despatch: string;
  total: string;
};

export function buildCargoReletResult(
  cargoRows: ReletCargoRow[],
  portTotals: ReturnType<typeof calculatePortTotals>,
  otherAmount: string,
): CargoReletResult {
  const head = buildResultLine("Head CP", cargoRows, "h", portTotals);
  const sub = buildResultLine("Sub CP", cargoRows, "s", portTotals);
  const others = parseAmount(otherAmount);
  return {
    head,
    sub,
    others,
    profit: formatAmount(head.totalValue - sub.totalValue + others),
  };
}

function buildResultLine(
  label: string,
  rows: ReletCargoRow[],
  side: "h" | "s",
  portTotals: ReturnType<typeof calculatePortTotals>,
): ResultLine {
  const dataRows = rows.filter((row) => row.key !== "margin");
  const ttlFreight = calculateTtlFreight(dataRows, side);
  const addComm = calculateCommissionAmount(dataRows, side);
  const brokerage = side === "h" ? calculateHeadBrokerageAmount(dataRows) : 0;
  const linerTerms = calculateLinerTerms(dataRows, side);
  const demurrage = parseAmount(side === "h" ? portTotals.hDem : portTotals.sDem);
  const despatch = parseAmount(side === "h" ? portTotals.hDes : portTotals.sDes);
  const total = ttlFreight - addComm - brokerage - linerTerms + demurrage - despatch;

  return {
    label,
    totalValue: total,
    ttlFreight: formatAmount(ttlFreight),
    addComm: formatAmount(addComm),
    brokerage: side === "h" ? formatAmount(brokerage) : "",
    linerTerms: formatAmount(linerTerms),
    demurrage: formatAmount(demurrage),
    despatch: formatAmount(despatch),
    total: formatAmount(total),
  };
}

function calculateTtlFreight(rows: ReletCargoRow[], side: "h" | "s") {
  return sum(rows.map((row) => grossFreight(row, side)));
}

function calculateCommissionAmount(rows: ReletCargoRow[], side: "h" | "s") {
  return sum(
    rows.map((row) => grossFreight(row, side) * (parseAmount(side === "h" ? row.hComm : row.sComm) / 100)),
  );
}

function calculateHeadBrokerageAmount(rows: ReletCargoRow[]) {
  return sum(rows.map((row) => grossFreight(row, "h") * (parseAmount(row.hBrkg) / 100)));
}

function calculateLinerTerms(rows: ReletCargoRow[], side: "h" | "s") {
  return sum(rows.map((row) => parseAmount(side === "h" ? row.hLiner : row.sLiner)));
}

function buildReletLinerContextRows(row: ReletCargoRow): LinerTermsContextRow[] {
  const quantity = parseAmount(row.quantity);
  return [
    {
      key: `${row.key}-loading`,
      type: "Loading",
      portName: row.loadingPort,
      quantity,
      account: row.account,
      cargoName: row.cargoName,
    },
    {
      key: `${row.key}-discharging`,
      type: "Discharging",
      portName: row.dischargingPort,
      quantity,
      account: row.account,
      cargoName: row.cargoName,
    },
  ].filter((item) => item.portName || item.quantity || item.account || item.cargoName);
}

function validateCargoReletForm(cargoRows: ReletCargoRow[], portRows: ReletPortRow[]) {
  const details: string[] = [];
  const activeCargoRows = cargoRows.filter((row) => row.cargoName || row.quantity);
  const activePortRows = portRows.filter((row) => row.key !== "margin" && (row.type || row.port));

  if (activeCargoRows.length === 0) details.push("Cargo table requires at least one row.");
  if (activePortRows.length === 0) details.push("Port Rotation requires at least one row.");

  activeCargoRows.forEach((row) => {
    if (parseAmount(row.quantity) <= 0) details.push(`Cargo row ${row.no}: Quantity is required.`);
    if (row.hFrtType === "F" && parseAmount(row.hFrt) <= 0) {
      details.push(`Cargo row ${row.no}: Head CP freight rate is required.`);
    }
    if (row.sFrtType === "F" && parseAmount(row.sFrt) <= 0) {
      details.push(`Cargo row ${row.no}: Sub CP freight rate is required.`);
    }
  });

  return details;
}

function parseAmount(value: string | undefined) {
  if (!value) return 0;
  const parsed = Number(value.replace(/,/g, "").replace("%", "").trim());
  return Number.isFinite(parsed) ? parsed : 0;
}

function sum(values: number[]) {
  return values.reduce((total, value) => total + value, 0);
}

function formatAmount(value: number, digits = 1) {
  return value.toLocaleString("en-US", {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  });
}

function formatPercent(value: number) {
  return `${formatAmount(value)} %`;
}

function formatPercentInput(value: string) {
  const cleaned = value.replace(/[^0-9.,-]/g, "").replace(",", ".");
  if (!cleaned.trim() || cleaned === "-" || cleaned === ".") return "";
  return `${cleaned} %`;
}

function normalizePortName(value: string | undefined) {
  return (value ?? "")
    .replace(/\s*\[[+-]\d{2}:\d{2}\]\s*/g, "")
    .trim()
    .toLowerCase();
}

function resolvePortTimezone(portNameOrCoordinate: string) {
  const match = portNameOrCoordinate.match(/\[([+-]\d{2}:\d{2})\]/);
  return match?.[1] ?? "";
}

function resolvePortTimezoneFromValue(portNameOrCoordinate: string, ports: LookupItem[]) {
  const explicit = resolvePortTimezone(portNameOrCoordinate);
  if (explicit) return explicit;

  const normalized = normalizePortName(portNameOrCoordinate);
  const match = ports.find((item) => {
    const labels = [lookupLabel(item), portLabel(item), item.name, item.code, item.unlocode]
      .filter((value): value is string => Boolean(value))
      .map(normalizePortName);
    return labels.includes(normalized);
  });
  return formatUtcOffset(match?.utcOffsetMin);
}

function timezoneDeltaDays(fromTimezone: string, toTimezone: string) {
  return (parseTimezoneHours(toTimezone) - parseTimezoneHours(fromTimezone)) / 24;
}

function parseTimezoneHours(value: string) {
  const match = value.match(/^([+-])(\d{2}):(\d{2})$/);
  if (!match) return 0;
  const sign = match[1] === "-" ? -1 : 1;
  return sign * (Number(match[2]) + Number(match[3]) / 60);
}

function addDays(date: Date | undefined, days: number | undefined) {
  if (!date || days === undefined) return undefined;
  const next = new Date(date);
  next.setMinutes(next.getMinutes() + days * 24 * 60);
  return next;
}

function parseDateTime(value: string | undefined) {
  if (!value || /time/i.test(value)) return undefined;
  const trimmed = value.trim();
  const ddmmyyyy = trimmed.match(/^(\d{2})\/(\d{2})\/(\d{4})\s+(\d{2}):(\d{2})$/);
  if (ddmmyyyy) {
    const [, day, month, year, hour, minute] = ddmmyyyy;
    return new Date(Number(year), Number(month) - 1, Number(day), Number(hour), Number(minute));
  }
  const yyyymmdd = trimmed.match(/^(\d{4})-(\d{2})-(\d{2})\s+(\d{2}):(\d{2})$/);
  if (yyyymmdd) {
    const [, year, month, day, hour, minute] = yyyymmdd;
    return new Date(Number(year), Number(month) - 1, Number(day), Number(hour), Number(minute));
  }
  const parsed = new Date(trimmed);
  return Number.isNaN(parsed.getTime()) ? undefined : parsed;
}

function formatDateTime(value: Date | undefined) {
  if (!value) return "";
  const pad = (input: number) => String(input).padStart(2, "0");
  return `${pad(value.getDate())}/${pad(value.getMonth() + 1)}/${value.getFullYear()} ${pad(
    value.getHours(),
  )}:${pad(value.getMinutes())}`;
}

function firstText(values: string[]) {
  return values.find((value) => value.trim()) ?? "";
}

function lastText(values: string[]) {
  return [...values].reverse().find((value) => value.trim()) ?? "";
}
