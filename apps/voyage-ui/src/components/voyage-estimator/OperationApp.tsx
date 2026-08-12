import { useEffect, useState } from "react";
import { Alert, Table, Button, Checkbox, Modal, Select, Tag } from "antd";
import type { ColumnsType } from "antd/es/table";
import {
  CalendarOutlined,
  EnvironmentOutlined,
  DesktopOutlined,
  SearchOutlined,
  PlusOutlined,
  SwapOutlined,
  FileTextOutlined,
  DashboardOutlined,
  ExperimentOutlined,
  CalculatorOutlined,
  FundOutlined,
  PlayCircleOutlined,
} from "@ant-design/icons";
import EstimatorShell from "./EstimatorShell";
import { EstimateInfoGrid } from "./VesselSection";
import { SectionTitle, TxtCell, YCell, SelCell } from "./cells";
import { RowToolbar } from "./CargoTable";
import { useRowOps } from "./useRowOps";
import { VE_COLORS } from "./theme";
import {
  ArrivalReportModal,
  DepartureReportModal,
  StartOperationModal,
  type ArrivalReportData,
  type DepartureReportData,
} from "./OperationReports";
import LoadableQuantityApp from "./LoadableQuantityApp";
import FreightSimulatorApp from "./FreightSimulatorApp";
import BunkerSimulatorApp from "./BunkerSimulatorApp";
import LaytimeCalculatorApp from "./LaytimeCalculatorApp";
import { LinerTermsForm, type LinerTermsContextRow } from "@/components/liner-terms-form";
import {
  deleteOperationSnapshot,
  loadOperationSnapshot,
  saveOperationSnapshot,
  type OperationSnapshotPayload,
} from "@/lib/api/operationSnapshots";
import { loadVoyageSnapshot } from "@/lib/api/voyageSnapshots";
import type { LoadedVoyageSnapshot } from "@/lib/api/voyageSnapshots";
import type { RegisterWorkspaceToolbar } from "@/components/workspace/workspaceToolbar";
import {
  opVessel,
  opSpeed,
  opFuelMain,
  opFuelSub,
  opCargoData,
  opPortData,
  opPortSummary,
  opExpense,
  opBunkerData,
  opResultRows,
  arrivalReport,
  departureReport,
  FUEL_TYPES,
  type OpFuelMainRow,
  type OpFuelSubRow,
  type OpCargoRow,
  type OpPortRow,
  type OpBunkerRow,
} from "./operationData";

const B = { borderColor: VE_COLORS.border };
const HD: React.CSSProperties = {
  background: VE_COLORS.headerBg,
  color: VE_COLORS.headerText,
  ...B,
};

const PORT_TYPES = ["Ballast", "Loading", "Dischg.", "Bunker", "Canal", "Others"];

type OperationModal = "loadable" | "freight" | "bunker" | "laytime";
type OperationSaveState =
  | { status: "idle" }
  | { status: "validated"; message: string }
  | { status: "error"; message: string; details?: string[] };
type OperationReportKind = "arrival" | "departure";
type OperationReportSelection = { kind: OperationReportKind; portKey: string };
type OperationLegReports = {
  arrival?: ArrivalReportData;
  departure?: DepartureReportData;
};

/* ------------------------------ Vessel particular ------------------------------ */

const mainCols: ColumnsType<OpFuelMainRow> = [
  { title: "Main", dataIndex: "main", width: "18%" },
  {
    title: "Type",
    dataIndex: "type",
    width: "18%",
    render: (v: string) => <TxtCell value={v} readOnly />,
  },
  {
    title: "Ballast",
    dataIndex: "ballast",
    width: "16%",
    render: (v: string) => <YCell value={v} readOnly />,
  },
  {
    title: "Laden",
    dataIndex: "laden",
    width: "16%",
    render: (v: string) => <YCell value={v} readOnly />,
  },
  {
    title: "Idle",
    dataIndex: "idle",
    width: "16%",
    render: (v: string) => <TxtCell value={v} right readOnly />,
  },
  {
    title: "Work",
    dataIndex: "work",
    width: "16%",
    render: (v: string) => <TxtCell value={v} right readOnly />,
  },
];

const subCols: ColumnsType<OpFuelSubRow> = [
  { title: "Sub", dataIndex: "sub", width: "20%" },
  {
    title: "Type",
    dataIndex: "type",
    width: "20%",
    render: (v: string) => <TxtCell value={v} readOnly />,
  },
  {
    title: "Sea",
    dataIndex: "sea",
    width: "20%",
    render: (v: string) => <TxtCell value={v} right readOnly />,
  },
  {
    title: "Idle",
    dataIndex: "idle",
    width: "20%",
    render: (v: string) => <TxtCell value={v} right readOnly />,
  },
  {
    title: "Work",
    dataIndex: "work",
    width: "20%",
    render: (v: string) => <TxtCell value={v} right readOnly />,
  },
];

function VesselPanel({
  status,
}: {
  status: string;
}) {
  return (
    <section className="mb-2">
      <div className="mb-1 flex flex-wrap items-center gap-3">
        <div className="ml-auto flex items-center gap-2">
          <span className="text-[11px]">
            Status : <b>{status}</b>
          </span>
          <Tag color="cyan" className="!text-[11px]">
            To be Updated
          </Tag>
        </div>
      </div>

      <div className="flex w-full flex-row flex-nowrap items-start gap-2">
        {/* thông số tàu */}
        <div style={{ flex: "1 1 40%", minWidth: 0 }}>
          <div
            className="grid border text-[11px]"
            style={{ ...B, gridTemplateColumns: "1fr 80px 80px 66px 60px 70px 70px" }}
          >
            {["MV", "DWT", "Draft (M)", "TPC", "Built", "Kind", "Type"].map((h) => (
              <div
                key={h}
                className="border-b border-r px-1 py-[3px] text-center font-medium last:border-r-0"
                style={HD}
              >
                {h}
              </div>
            ))}
            <div className="border-r" style={B}>
              <TxtCell value={opVessel.mv} />
            </div>
            <div className="border-r" style={B}>
              <TxtCell value={opVessel.dwt} right />
            </div>
            <div className="border-r" style={B}>
              <TxtCell value={opVessel.draft} right />
            </div>
            <div className="border-r" style={B}>
              <TxtCell value={opVessel.tpc} right />
            </div>
            <div className="border-r" style={B}>
              <TxtCell value={opVessel.built} right />
            </div>
            <div className="border-r" style={B}>
              <TxtCell value={opVessel.kind} />
            </div>
            <div>
              <TxtCell value={opVessel.type} />
            </div>
          </div>
          <EstimateInfoGrid estType={opVessel.type} />
        </div>

        {/* bunker profile / speed */}
        <div style={{ flex: "0 0 210px" }}>
          <div className="grid grid-cols-[122px_1fr] border text-[11px]" style={B}>
            <div className="border-b border-r px-1 py-[3px]" style={HD}>
              Bunker profile
            </div>
            <div className="border-b" style={B}>
              <Select
                size="small"
                variant="borderless"
                popupMatchSelectWidth={false}
                style={{ width: "100%", fontSize: 11 }}
                options={[
                  { value: "profile1", label: "Profile 1" },
                  { value: "eco", label: "Eco" },
                  { value: "custom", label: "Custom" },
                ]}
              />
            </div>
            <div className="border-r px-1 py-[3px]" style={HD}>
              Speed
            </div>
            <Select
              size="small"
              defaultValue="FULL"
              variant="borderless"
              popupMatchSelectWidth={false}
              style={{ width: "100%", fontSize: 11 }}
              options={[
                { value: "FULL", label: "Full" },
                { value: "ECO", label: "Eco" },
                { value: "C1", label: "Custom1" },
                { value: "C2", label: "Custom2" },
                { value: "C3", label: "Custom3" },
              ]}
            />
          </div>
          <div className="grid grid-cols-2 border border-t-0" style={B}>
            <div className="border-b border-r px-2 py-[3px] text-center" style={HD}>
              Ballast
            </div>
            <div className="border-b px-2 py-[3px] text-center" style={HD}>
              Laden
            </div>
            <div className="border-r" style={B}>
              <YCell value={opSpeed.ballast} />
            </div>
            <div>
              <YCell value={opSpeed.laden} />
            </div>
          </div>
          <div className="border-x border-b py-[3px] text-center text-[11px]" style={B}>
            <SearchOutlined style={{ fontSize: 11, color: VE_COLORS.headerText }} /> Fuel conditions
          </div>
        </div>

        <div style={{ flex: "1 1 27%", minWidth: 0 }}>
          <Table<OpFuelMainRow>
            size="small"
            bordered
            pagination={false}
            tableLayout="fixed"
            columns={mainCols}
            dataSource={opFuelMain}
          />
        </div>
        <div style={{ flex: "1 1 22%", minWidth: 0 }}>
          <Table<OpFuelSubRow>
            size="small"
            bordered
            pagination={false}
            tableLayout="fixed"
            columns={subCols}
            dataSource={opFuelSub}
          />
          <div className="mt-[2px] text-right">
            <Checkbox className="op-form-checkbox text-[11px]">Fix Port Consumption</Checkbox>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ------------------------------ Cargo ------------------------------ */

const buildCargoCols = (
  update: (key: string, field: keyof OpCargoRow, value: string) => void,
  onOpenLinerTerms: (rowKey: string) => void,
): ColumnsType<OpCargoRow> => [
  { title: "#", dataIndex: "no", width: "2.6%", align: "center" },
  {
    title: "Account",
    dataIndex: "account",
    width: "7.5%",
    render: (v: string, row) => (
      <TxtCell value={v} onChange={(value) => update(row.key, "account", value)} />
    ),
  },
  {
    title: "Cargo Name",
    dataIndex: "cargoName",
    width: "8.5%",
    render: (v: string, row) => (
      <TxtCell value={v} onChange={(value) => update(row.key, "cargoName", value)} />
    ),
  },
  {
    title: "Loading Port",
    dataIndex: "loadingPort",
    width: "10.5%",
    render: (v: string, row) => (
      <TxtCell value={v} onChange={(value) => update(row.key, "loadingPort", value)} />
    ),
  },
  {
    title: "Discharging Port",
    dataIndex: "dischargingPort",
    width: "10.5%",
    render: (v: string, row) => (
      <TxtCell value={v} onChange={(value) => update(row.key, "dischargingPort", value)} />
    ),
  },
  {
    title: "Quantity",
    dataIndex: "quantity",
    width: "7.5%",
    align: "right",
    render: (v: string, row) => (
      <div className="flex items-center justify-end gap-1">
        <TxtCell value={v} right onChange={(value) => update(row.key, "quantity", value)} />
        <span className="w-[18px] text-[11px]">{row.unit}</span>
      </div>
    ),
  },
  {
    title: "Frt",
    dataIndex: "frt",
    width: "5%",
    align: "right",
    render: (v: string, row) => (
      <TxtCell
        value={v}
        right
        readOnly={row.frtType === "L"}
        onChange={(value) => update(row.key, "frt", value)}
      />
    ),
  },
  {
    title: "Term",
    dataIndex: "term",
    width: "4.5%",
    align: "center",
    render: (v: string, row) => (
      <TxtCell value={v} onChange={(value) => update(row.key, "term", value)} />
    ),
  },
  {
    title: "Frt Type",
    dataIndex: "frtType",
    width: "4.5%",
    align: "center",
    render: (v: OpCargoRow["frtType"], row) => (
      <Select
        size="small"
        variant="borderless"
        value={v || "F"}
        onChange={(value) => update(row.key, "frtType", value)}
        style={{ width: "100%", fontSize: 11 }}
        options={[
          { value: "F", label: "F" },
          { value: "L", label: "L" },
        ]}
      />
    ),
  },
  {
    title: "Frt Lumpsum",
    dataIndex: "frtLumpsum",
    width: "7%",
    align: "right",
    render: (v: string, row) => (
      <TxtCell
        value={v}
        right
        readOnly={row.frtType !== "L"}
        onChange={(value) => update(row.key, "frtLumpsum", value)}
      />
    ),
  },
  {
    title: "Total Freight",
    dataIndex: "totalFreight",
    width: "8%",
    align: "right",
    render: (_v: string, row) => <YCell value={formatAmount(operationFreightAmount(row))} readOnly />,
  },
  {
    title: "A. Comm",
    dataIndex: "aComm",
    width: "5.5%",
    align: "right",
    render: (v: string, row) => (
      <TxtCell value={v} right onChange={(value) => update(row.key, "aComm", value)} />
    ),
  },
  {
    title: "Brkg",
    dataIndex: "brkg",
    width: "5%",
    align: "right",
    render: (v: string, row) => (
      <TxtCell value={v} right onChange={(value) => update(row.key, "brkg", value)} />
    ),
  },
  {
    title: "Frt Tax",
    dataIndex: "frtTax",
    width: "5%",
    align: "right",
    render: (v: string, row) => (
      <TxtCell value={v} right onChange={(value) => update(row.key, "frtTax", value)} />
    ),
  },
  {
    title: "Liner Term",
    dataIndex: "linerTerm",
    width: "6%",
    render: (v: string, row) => (
      <TxtCell value={v} onChange={(value) => update(row.key, "linerTerm", value)} />
    ),
  },
  {
    title: "",
    key: "linerSearch",
    width: "3%",
    align: "center",
    render: (_: unknown, row) => (
      <Button
        type="text"
        size="small"
        icon={<SearchOutlined style={{ color: "#888" }} />}
        onClick={(event) => {
          event.stopPropagation();
          onOpenLinerTerms(row.key);
        }}
      />
    ),
  },
];

/* ------------------------------ Bottom ------------------------------ */

const buildBunkerCols = (
  update: (key: string, field: keyof OpBunkerRow, value: string) => void,
): ColumnsType<OpBunkerRow> => [
  { title: "", dataIndex: "type", width: "22%" },
  {
    title: "Price / MT",
    dataIndex: "price",
    width: "24%",
    align: "right",
    render: (v: string, row) => (
      <YCell value={v} onChange={(value) => update(row.key, "price", value)} />
    ),
  },
  {
    title: (
      <span>
        <Checkbox defaultChecked className="mr-1" />
        Consumption
      </span>
    ),
    dataIndex: "consumption",
    width: "27%",
    align: "right",
    render: (v: string, row) => (
      <TxtCell value={v} right onChange={(value) => update(row.key, "consumption", value)} />
    ),
  },
  {
    title: "Expense",
    dataIndex: "expense",
    width: "27%",
    align: "right",
    render: (_v: string, row) => <TxtCell value={formatAmount(bunkerExpense(row))} right readOnly />,
  },
];

function KVGrid({ rows }: { rows: Array<[string, string, string, string]> }) {
  return (
    <div className="border text-[11px]" style={B}>
      {rows.map((r, i) => (
        <div key={i} className="grid grid-cols-4 border-b last:border-b-0" style={B}>
          <div className="border-r px-1 py-[3px]" style={{ ...B, background: VE_COLORS.rowAlt }}>
            {r[0]}
          </div>
          <div className="border-r px-1 py-[3px] text-right" style={B}>
            {r[1]}
          </div>
          <div className="border-r px-1 py-[3px]" style={{ ...B, background: VE_COLORS.rowAlt }}>
            {r[2]}
          </div>
          <div className="px-1 py-[3px] text-right">{r[3]}</div>
        </div>
      ))}
    </div>
  );
}

/* ------------------------------ Screen ------------------------------ */

export default function OperationApp({
  embedded = false,
  registerWorkspaceToolbar,
  operationId: initialOperationId,
  sourceEstimateId,
}: {
  embedded?: boolean;
  registerWorkspaceToolbar?: RegisterWorkspaceToolbar;
  operationId?: string;
  sourceEstimateId?: string;
} = {}) {
  const cargo = useRowOps<OpCargoRow>(opCargoData);
  const port = useRowOps<OpPortRow>(opPortData);
  const [bunkerRows, setBunkerRows] = useState<OpBunkerRow[]>(opBunkerData);
  const [operationId, setOperationId] = useState<string | undefined>(initialOperationId);
  const [operationHeader, setOperationHeader] = useState({
    estimateId: sourceEstimateId,
    vesselId: undefined as string | undefined,
    vesselName: opVessel.mv,
    voyageNo: "voyage1",
    status: "ONGOING",
  });
  const [activeReport, setActiveReport] = useState<OperationReportSelection | null>(null);
  const [actualReports, setActualReports] = useState<Record<string, OperationLegReports>>({});
  const [startOp, setStartOp] = useState(false);
  const [modal, setModal] = useState<OperationModal | null>(null);
  const [linerRowKey, setLinerRowKey] = useState<string | null>(null);
  const [saveState, setSaveState] = useState<OperationSaveState>({ status: "idle" });
  const [auditState, setAuditState] = useState({ updatedAt: "", updatedBy: "Admin" });

  const validateForSave = () => {
    const details = validateOperationForm({
      cargoRows: cargo.rows,
      portRows: port.rows,
      bunkerRows,
    });
    if (details.length) {
      setSaveState({
        status: "error",
        message: "Please fix Operation inputs before saving.",
        details,
      });
      return false;
    }

    setSaveState({
      status: "validated",
      message: "Operation inputs are valid.",
    });
    return true;
  };
  useEffect(() => {
    if (!sourceEstimateId) {
      return;
    }

    let active = true;
    setSaveState({ status: "validated", message: `Loading estimate ${sourceEstimateId}...` });
    loadVoyageSnapshot(sourceEstimateId)
      .then((snapshot) => {
        if (!active) return;
        const mapped = mapVoyageSnapshotToOperation(snapshot);
        setOperationId(undefined);
        setOperationHeader(mapped.header);
        setAuditState({ updatedAt: "", updatedBy: "Admin" });
        cargo.setRows(mapped.cargoRows);
        cargo.setSelectedKey(null);
        port.setRows(mapped.portRows);
        port.setSelectedKey(null);
        setActualReports({});
        setSaveState({
          status: "validated",
          message: `Loaded estimate ${sourceEstimateId} into Operation draft.`,
        });
      })
      .catch((error) => {
        if (!active) return;
        setSaveState({
          status: "error",
          message:
            error instanceof Error
              ? error.message
              : `Failed to load estimate ${sourceEstimateId}.`,
        });
      });

    return () => {
      active = false;
    };
  }, [sourceEstimateId]);

  const saveCurrentOperation = async (mode: "save" | "saveAs" = "save") => {
    if (!validateForSave()) {
      return;
    }
    try {
      const response = await saveOperationSnapshot(
        buildOperationSnapshotPayload({
          operationId: mode === "saveAs" ? undefined : operationId,
          header: operationHeader,
          cargoRows: cargo.rows,
          portRows: port.rows,
          bunkerRows,
          actualReports,
        }),
      );
      setOperationId(response.operationId);
      setAuditState({
        updatedAt: response.updatedAt ?? new Date().toISOString(),
        updatedBy: response.updatedByName ?? "Admin",
      });
      setSaveState({
        status: "validated",
        message: `Operation ${response.operationId} saved.`,
      });
    } catch (error) {
      setSaveState({
        status: "error",
        message: error instanceof Error ? error.message : "Operation save failed.",
      });
    }
  };
  const reloadCurrentOperation = async () => {
    if (!operationId) {
      setSaveState({
        status: "error",
        message: "No OperationID is available to load.",
      });
      return;
    }
    try {
      const snapshot = await loadOperationSnapshot(operationId);
      applyLoadedOperationSnapshot(snapshot, cargo.setRows, port.setRows, setBunkerRows);
      setOperationHeader({
        estimateId: snapshot.header.estimateId,
        vesselId: snapshot.header.vesselId,
        vesselName: snapshot.header.vesselName,
        voyageNo: snapshot.header.voyageNo,
        status: snapshot.header.status ?? "ONGOING",
      });
      setAuditState({
        updatedAt: snapshot.header.updatedAt ?? "",
        updatedBy: snapshot.header.updatedByName ?? "Admin",
      });
      setSaveState({
        status: "validated",
        message: `Operation ${operationId} loaded.`,
      });
    } catch (error) {
      setSaveState({
        status: "error",
        message: error instanceof Error ? error.message : "Operation load failed.",
      });
    }
  };
  useEffect(() => {
    if (!initialOperationId) {
      return;
    }
    setOperationId(initialOperationId);
    void (async () => {
      try {
        const snapshot = await loadOperationSnapshot(initialOperationId);
        applyLoadedOperationSnapshot(snapshot, cargo.setRows, port.setRows, setBunkerRows);
        setOperationHeader({
          estimateId: snapshot.header.estimateId,
          vesselId: snapshot.header.vesselId,
          vesselName: snapshot.header.vesselName,
          voyageNo: snapshot.header.voyageNo,
          status: snapshot.header.status ?? "ONGOING",
        });
        setAuditState({
          updatedAt: snapshot.header.updatedAt ?? "",
          updatedBy: snapshot.header.updatedByName ?? "Admin",
        });
        setActualReports({});
        setSaveState({
          status: "validated",
          message: `Operation ${initialOperationId} loaded.`,
        });
      } catch (error) {
        setSaveState({
          status: "error",
          message: error instanceof Error ? error.message : "Operation load failed.",
        });
      }
    })();
  }, [initialOperationId]);

  const newOperation = () => {
    setOperationId(undefined);
    setOperationHeader({
      estimateId: undefined,
      vesselId: undefined,
      vesselName: opVessel.mv,
      voyageNo: "voyage1",
      status: "ONGOING",
    });
    setAuditState({ updatedAt: "", updatedBy: "Admin" });
    cargo.setRows(opCargoData);
    cargo.setSelectedKey(null);
    port.setRows(opPortData);
    port.setSelectedKey(null);
    setBunkerRows(opBunkerData);
    setActualReports({});
    setSaveState({ status: "validated", message: "New Operation draft is ready." });
  };
  const deleteCurrentOperation = async () => {
    if (!operationId) {
      newOperation();
      return;
    }
    try {
      await deleteOperationSnapshot(operationId);
      newOperation();
      setSaveState({ status: "validated", message: `Operation ${operationId} deleted.` });
    } catch (error) {
      setSaveState({
        status: "error",
        message: error instanceof Error ? error.message : "Operation delete failed.",
      });
    }
  };

  useEffect(() => {
    registerWorkspaceToolbar?.({
      hasSheet: true,
      hasEstimate: true,
      execute: {
        new: newOperation,
        delete: deleteCurrentOperation,
        save: () => void saveCurrentOperation("save"),
        saveAs: () => void saveCurrentOperation("saveAs"),
        open: () => void reloadCurrentOperation(),
        reload: () => void reloadCurrentOperation(),
        undo: () => setSaveState({ status: "idle" }),
      },
    });
  }, [
    actualReports,
    bunkerRows,
    cargo.rows,
    operationHeader,
    operationId,
    port.rows,
    registerWorkspaceToolbar,
  ]);

  const isMargin = (r: OpPortRow) => r.key === "margin";
  const ensureReportForPort = (kind: OperationReportKind, row: OpPortRow) => {
    setActualReports((reports) => {
      const current = reports[row.key] ?? {};
      if (current[kind]) {
        return reports;
      }

      return {
        ...reports,
        [row.key]: {
          ...current,
          [kind]:
            kind === "arrival"
              ? buildArrivalReportForPort(row)
              : buildDepartureReportForPort(row),
        },
      };
    });
    setActiveReport({ kind, portKey: row.key });
  };
  const openArrivalReport = (row: OpPortRow) => {
    if (isMargin(row) || row.key === "1") {
      return;
    }
    ensureReportForPort("arrival", row);
  };
  const openDepartureReport = (row: OpPortRow) => {
    if (isMargin(row)) {
      return;
    }
    ensureReportForPort("departure", row);
  };
  const activeLegReports = activeReport ? actualReports[activeReport.portKey] : undefined;
  const activeArrivalReport =
    activeReport?.kind === "arrival" ? activeLegReports?.arrival : undefined;
  const activeDepartureReport =
    activeReport?.kind === "departure" ? activeLegReports?.departure : undefined;
  const setFixedReport = (
    kind: OperationReportKind,
    portKey: string,
    report: ArrivalReportData | DepartureReportData,
  ) => {
    setActualReports((reports) => ({
      ...reports,
      [portKey]: {
        ...(reports[portKey] ?? {}),
        [kind]: report,
      },
    }));
  };
  const txt = (right?: boolean) => (v: string, r: OpPortRow) =>
    isMargin(r) ? (
      <span className={right ? "block pr-1 text-right font-medium" : ""}>{v}</span>
    ) : (
      <TxtCell value={v} right={right} />
    );

  const dateCell =
    (
      onOpen: (row: OpPortRow) => void,
      options: { disableFirstRow?: boolean; showIconWhenBlank?: boolean } = {},
    ) =>
    (v: string, r: OpPortRow) => {
      if (isMargin(r)) {
        return null;
      }
      if (options.disableFirstRow && r.key === "1") {
        return <TxtCell value="" readOnly />;
      }
      return (
        <div className="flex items-center">
          <TxtCell value={v} />
          {(v || options.showIconWhenBlank) && (
            <CalendarOutlined
              role="button"
              aria-label="Open report"
              className="cursor-pointer"
              style={{ color: VE_COLORS.alert, fontSize: 12, marginRight: 2 }}
              onClick={() => onOpen(r)}
            />
          )}
        </div>
      );
    };

  const portCols: ColumnsType<OpPortRow> = [
    { title: "#", dataIndex: "no", width: "2.6%", align: "center" },
    {
      title: "Type",
      dataIndex: "type",
      width: "6%",
      render: (v: string, r) =>
        isMargin(r) ? <b>{v}</b> : <SelCell value={v} options={PORT_TYPES} />,
    },
    { title: "Port Name or Coordinates", dataIndex: "port", width: "17%", render: txt() },
    {
      title: "Distance (TTL / ECA)",
      children: [
        { title: "TTL", dataIndex: "distance", width: "5%", align: "right", render: txt(true) },
        { title: "ECA", dataIndex: "eca", width: "4%", align: "right", render: txt(true) },
      ],
    },
    { title: "W.F", dataIndex: "wf", width: "4.4%", align: "right", render: txt(true) },
    {
      title: "Spd",
      dataIndex: "spd",
      width: "4.4%",
      align: "right",
      render: (v: string, r) => (isMargin(r) ? v : <YCell value={v} />),
    },
    {
      title: "Sea",
      dataIndex: "sea",
      width: "4.4%",
      align: "right",
      render: (v: string, r) => (isMargin(r) ? <YCell value={v} /> : <TxtCell value={v} right />),
    },
    {
      title: "L / D Rate",
      dataIndex: "ldRate",
      width: "6.6%",
      align: "right",
      render: (v: string, r) => (isMargin(r) ? null : <YCell value={v} />),
    },
    {
      title: "Port (I / W)",
      children: [
        {
          title: "Idle",
          dataIndex: "idle",
          width: "4.2%",
          align: "right",
          render: (v: string, r) =>
            isMargin(r) ? <YCell value={v} /> : <TxtCell value={v} right />,
        },
        {
          title: "Working",
          dataIndex: "working",
          width: "4.6%",
          align: "right",
          render: txt(true),
        },
      ],
    },
    { title: "Dem", dataIndex: "dem", width: "5.4%", align: "right", render: txt(true) },
    { title: "Des", dataIndex: "des", width: "6.4%", align: "right", render: txt(true) },
    {
      title: "Port Charge",
      dataIndex: "portCharge",
      width: "7%",
      align: "right",
      render: (v: string, r) => (isMargin(r) ? null : <YCell value={v} />),
    },
    {
      title: "Arrival",
      dataIndex: "arrival",
      width: "8.9%",
      render: dateCell(openArrivalReport, { disableFirstRow: true }),
    },
    {
      title: "Departure",
      dataIndex: "departure",
      width: "9.1%",
      render: dateCell(openDepartureReport, { showIconWhenBlank: true }),
    },
  ];

  const sel = (key: string | null) => (r: OpPortRow | OpCargoRow) =>
    r.key === key ? "ve-row-selected" : r.key === "margin" ? "ve-margin-row" : "";

  const linerRow = linerRowKey ? cargo.rows.find((row) => row.key === linerRowKey) ?? null : null;
  const updateCargo = (key: string, field: keyof OpCargoRow, value: string) =>
    cargo.setRows((rows) =>
      rows.map((row) => (row.key === key ? { ...row, [field]: value } : row)),
    );
  const cargoCols = buildCargoCols(updateCargo, setLinerRowKey);
  const updateBunker = (key: string, field: keyof OpBunkerRow, value: string) =>
    setBunkerRows((rows) => rows.map((row) => (row.key === key ? { ...row, [field]: value } : row)));
  const bunkerCols = buildBunkerCols(updateBunker);
  const cargoTotals = calculateOperationCargoTotals(cargo.rows);
  const portTotals = calculateOperationPortTotals(port.rows);
  const bunkerTotals = calculateOperationBunkerTotals(bunkerRows);
  const operationExpenseRows = buildOperationExpenseRows(cargoTotals, portTotals, bunkerTotals);
  const resultRows = buildOperationResultRows(cargoTotals, operationExpenseRows);
  const profitUsd = calculateOperationProfit(cargoTotals, operationExpenseRows);
  const operationTabLabel = operationHeader.voyageNo.trim() || `Operation ${operationId ?? "Draft"}`;
  const operationTabs = [
    {
      key: "operation-sheet",
      label: operationTabLabel,
      icon: <span>[]</span>,
      active: true,
      renamable: true,
    },
  ];

  const content = (
    <div className="operation-app">
      <style>
        {`
          .operation-app .op-canal-checkbox .ant-checkbox-checked .ant-checkbox-inner,
          .operation-app .op-form-checkbox .ant-checkbox-checked .ant-checkbox-inner {
            background-color: ${VE_COLORS.headerText} !important;
            border-color: ${VE_COLORS.headerText} !important;
          }

          .operation-app .op-canal-checkbox .ant-checkbox-checked::after,
          .operation-app .op-form-checkbox .ant-checkbox-checked::after {
            border-color: ${VE_COLORS.headerText} !important;
          }
        `}
      </style>
      {saveState.status !== "idle" && (
        <div className="mb-2">
          {saveState.status === "validated" && (
            <Alert type="success" showIcon message={saveState.message} />
          )}
          {saveState.status === "error" && (
            <Alert
              type="error"
              showIcon
              message={saveState.message}
              description={
                saveState.details?.length ? (
                  <ul className="m-0 pl-4">
                    {saveState.details.map((detail) => (
                      <li key={detail}>{detail}</li>
                    ))}
                  </ul>
                ) : undefined
              }
            />
          )}
        </div>
      )}
      <VesselPanel status={operationHeader.status ?? "ONGOING"} />

      <section className="mb-2">
        <div className="mb-1 flex flex-wrap items-center gap-3">
          <SectionTitle>Cargo</SectionTitle>
          <Button
            size="small"
            icon={<PlayCircleOutlined />}
            type="primary"
            onClick={() => setStartOp(true)}
          >
            Start Operation
          </Button>
          <Button size="small" icon={<CalculatorOutlined />} onClick={() => setModal("loadable")}>
            Loadable Quantity Calculator
          </Button>
          <Button size="small" icon={<FundOutlined />} onClick={() => setModal("freight")}>
            Frt. Simulator
          </Button>
        </div>
        <Table<OpCargoRow>
          size="small"
          bordered
          pagination={false}
          tableLayout="fixed"
          columns={cargoCols}
          dataSource={cargo.rows}
          onRow={(record) => ({
            ...cargo.onRow(record),
            onDoubleClick: () => setLinerRowKey(record.key),
          })}
          rowClassName={sel(cargo.selectedKey)}
          summary={() => (
            <Table.Summary fixed>
              <Table.Summary.Row style={{ background: "#F5F7FA", fontWeight: 600 }}>
                <Table.Summary.Cell index={0} colSpan={5} align="right">
                  Total
                </Table.Summary.Cell>
                <Table.Summary.Cell index={5} align="right">
                  {cargoTotals.quantity}
                </Table.Summary.Cell>
                <Table.Summary.Cell index={6} align="right">
                  {cargoTotals.frt}
                </Table.Summary.Cell>
                <Table.Summary.Cell index={7} />
                <Table.Summary.Cell index={8} />
                <Table.Summary.Cell index={9} align="right">
                  {cargoTotals.frtLumpsum}
                </Table.Summary.Cell>
                <Table.Summary.Cell index={10} align="right">
                  {cargoTotals.totalFreight}
                </Table.Summary.Cell>
                <Table.Summary.Cell index={11} align="right">
                  {cargoTotals.aComm}
                </Table.Summary.Cell>
                <Table.Summary.Cell index={12} align="right">
                  {cargoTotals.brkg}
                </Table.Summary.Cell>
                <Table.Summary.Cell index={13} align="right">
                  {cargoTotals.frtTax}
                </Table.Summary.Cell>
                <Table.Summary.Cell index={14} align="right">
                  {cargoTotals.linerTerm}
                </Table.Summary.Cell>
                <Table.Summary.Cell index={15} />
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
        <div className="mb-1 flex flex-wrap items-center gap-3">
          <SectionTitle>Port Rotation</SectionTitle>
          <Checkbox defaultChecked className="op-canal-checkbox text-[11px]">
            SUEZ
          </Checkbox>
          <Checkbox defaultChecked className="op-canal-checkbox text-[11px]">
            PANAMA
          </Checkbox>
          <Checkbox className="op-canal-checkbox text-[11px]">KIEL</Checkbox>
          <span className="ml-[216px] text-[11px] font-bold text-gray-700">{opPortSummary}</span>
        </div>
        <Table<OpPortRow>
          size="small"
          bordered
          pagination={false}
          tableLayout="fixed"
          columns={portCols}
          dataSource={port.rows}
          onRow={port.onRow}
          rowClassName={sel(port.selectedKey)}
          summary={() => (
            <Table.Summary fixed>
              <Table.Summary.Row style={{ background: VE_COLORS.rowAlt, fontWeight: 600 }}>
                <Table.Summary.Cell index={0} colSpan={3} align="right">
                  Totals
                </Table.Summary.Cell>
                <Table.Summary.Cell index={3} align="right">
                  {portTotals.distance}
                </Table.Summary.Cell>
                <Table.Summary.Cell index={4} align="right">
                  {portTotals.eca}
                </Table.Summary.Cell>
                <Table.Summary.Cell index={5} />
                <Table.Summary.Cell index={6} />
                <Table.Summary.Cell index={7} align="right">
                  {portTotals.sea}
                </Table.Summary.Cell>
                <Table.Summary.Cell index={8} />
                <Table.Summary.Cell index={9} align="right">
                  {portTotals.idle}
                </Table.Summary.Cell>
                <Table.Summary.Cell index={10} align="right">
                  {portTotals.working}
                </Table.Summary.Cell>
                <Table.Summary.Cell index={11} align="right">
                  {portTotals.dem}
                </Table.Summary.Cell>
                <Table.Summary.Cell index={12} align="right">
                  {portTotals.des}
                </Table.Summary.Cell>
                <Table.Summary.Cell index={13} align="right">
                  {portTotals.portCharge}
                </Table.Summary.Cell>
                <Table.Summary.Cell index={14} align="right">
                  {portTotals.arrival}
                </Table.Summary.Cell>
                <Table.Summary.Cell index={15} align="right">
                  {portTotals.departure}
                </Table.Summary.Cell>
              </Table.Summary.Row>
            </Table.Summary>
          )}
        />
        <div className="mt-[2px] flex flex-wrap items-center gap-2">
          <RowToolbar
            onAdd={port.add}
            onDelete={port.remove}
            onInsertAbove={port.insertAbove}
            onInsertBelow={port.insertBelow}
          />
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
            <span className="rounded-sm border px-2 py-[1px] text-[11px]" style={B}>
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

      <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
        <section>
          <div className="mb-1">
            <SectionTitle>Operation Expense</SectionTitle>
          </div>
          <KVGrid rows={operationExpenseRows} />
        </section>

        <section>
          <div className="mb-1 flex items-center gap-2">
            <SectionTitle>Bunker Expense</SectionTitle>
            <Button size="small" icon={<DashboardOutlined />}>
              Bunker Index
            </Button>
            <Button size="small" icon={<ExperimentOutlined />} onClick={() => setModal("bunker")}>
              Bunker Simulator
            </Button>
          </div>
          <Table<OpBunkerRow>
            size="small"
            bordered
            pagination={false}
            tableLayout="fixed"
            columns={bunkerCols}
            dataSource={bunkerRows}
          />
        </section>

        <section>
          <div className="mb-1 flex items-center gap-2">
            <SectionTitle>Result</SectionTitle>
            <Button size="small" icon={<PlusOutlined />}>
              Result Plus
            </Button>
            <Button size="small" icon={<SwapOutlined />}>
              Comparison
            </Button>
            <Button size="small" icon={<FileTextOutlined />}>
              Remark
            </Button>
          </div>
          <KVGrid rows={resultRows} />
          <div
            className="mt-[2px] grid grid-cols-4 border text-[12px] font-bold"
            style={{ ...B, background: VE_COLORS.rowAlt }}
          >
            <div className="border-r px-1 py-[3px]" style={B} />
            <div className="border-r px-1 py-[3px]" style={B} />
            <div className="border-r px-1 py-[3px]" style={B}>
              PROFIT
            </div>
            <div className="px-1 py-[3px] text-right" style={{ color: VE_COLORS.sectionTitle }}>
              {profitUsd}
            </div>
          </div>
        </section>
      </div>

      <ArrivalReportModal
        open={activeReport?.kind === "arrival"}
        report={activeArrivalReport}
        onClose={() => setActiveReport(null)}
        onFix={(report) => {
          if (activeReport?.kind === "arrival") {
            setFixedReport("arrival", activeReport.portKey, report);
          }
        }}
      />
      <DepartureReportModal
        open={activeReport?.kind === "departure"}
        report={activeDepartureReport}
        onClose={() => setActiveReport(null)}
        onFix={(report) => {
          if (activeReport?.kind === "departure") {
            setFixedReport("departure", activeReport.portKey, report);
          }
        }}
        onOpenLaytime={() => setModal("laytime")}
      />
      <StartOperationModal open={startOp} onClose={() => setStartOp(false)} />
      {modal === "loadable" && <LoadableQuantityApp onClose={() => setModal(null)} />}
      {modal === "freight" && <FreightSimulatorApp onClose={() => setModal(null)} />}
      {modal === "bunker" && <BunkerSimulatorApp onClose={() => setModal(null)} />}
      {modal === "laytime" && <LaytimeCalculatorApp onClose={() => setModal(null)} />}
      <Modal
        open={Boolean(linerRow)}
        footer={null}
        closable={false}
        centered
        width={1120}
        onCancel={() => setLinerRowKey(null)}
        destroyOnHidden
      >
        {linerRow && (
          <LinerTermsForm
            rows={buildOperationLinerContextRows(linerRow)}
            initialTotal={parseAmount(linerRow.linerTerm)}
            onCancel={() => setLinerRowKey(null)}
            onApply={({ amount }) => {
              updateCargo(linerRow.key, "linerTerm", formatAmount(amount));
              setLinerRowKey(null);
            }}
          />
        )}
      </Modal>
    </div>
  );

  return embedded ? (
    <EstimatorShell
      sheetKind="operation"
      showHeaderAndToolbar={false}
      tabs={operationTabs}
      onRenameTab={(_tabKey, label) =>
        setOperationHeader((current) => ({ ...current, voyageNo: label }))
      }
      lastUpdatedAt={auditState.updatedAt}
      lastUpdatedBy={auditState.updatedBy}
    >
      {content}
    </EstimatorShell>
  ) : (
    <EstimatorShell
      title="Operation - Netpas Prosperity"
      sheetKind="operation"
      tabs={operationTabs}
      onRenameTab={(_tabKey, label) =>
        setOperationHeader((current) => ({ ...current, voyageNo: label }))
      }
      lastUpdatedAt={auditState.updatedAt}
      lastUpdatedBy={auditState.updatedBy}
    >
      {content}
    </EstimatorShell>
  );
}

function buildArrivalReportForPort(row: OpPortRow): ArrivalReportData {
  return {
    ...arrivalReport,
    portTitle: `Arrival Record at ${row.port || "Port"} (${row.type || "Operation"})`,
    time: row.arrival || arrivalReport.time,
    note: row.departure ? `Next departure ${row.departure}` : arrivalReport.note,
  };
}

function buildDepartureReportForPort(row: OpPortRow): DepartureReportData {
  return {
    ...departureReport,
    portTitle: `Departure Record at ${row.port || "Port"} (${row.type || "Operation"})`,
    time: row.departure || departureReport.time,
    note: row.arrival ? `Port stay from ${row.arrival}` : departureReport.note,
  };
}

function mapVoyageSnapshotToOperation(snapshot: LoadedVoyageSnapshot) {
  const cargoRows: OpCargoRow[] = snapshot.cargoLines.map((line, index) => ({
    key: `estimate-cargo-${line.lineNo || index + 1}`,
    no: String(line.lineNo || index + 1),
    account: line.accountCompanyName ?? "",
    cargoName: line.cargoName ?? "",
    loadingPort: line.loadingPortName ?? "",
    dischargingPort: line.dischargingPortName ?? "",
    quantity: formatAmount(line.quantity ?? 0),
    unit: line.unit || "MT",
    frt: formatAmount(line.freight.freightRate ?? 0),
    term: "",
    frtType: line.freight.freightType,
    frtLumpsum: formatAmount(line.freight.freightLumpsum ?? 0),
    totalFreight: formatAmount(
      line.freight.freightType === "L"
        ? (line.freight.freightLumpsum ?? 0)
        : (line.quantity ?? 0) * (line.freight.freightRate ?? 0),
    ),
    aComm: formatPercentValue(line.freight.addCommPct),
    brkg: formatPercentValue(line.freight.brokeragePct),
    frtTax: formatPercentValue(line.freight.freightTaxPct),
    linerTerm: formatAmount(line.freight.linerCostAmount ?? 0),
  }));

  const portRows: OpPortRow[] = snapshot.portLegs.map((leg, index) => ({
    key: `estimate-port-${leg.legNo || index + 1}`,
    no: String(leg.legNo || index + 1),
    type: formatOperationPortType(leg.legType),
    port: leg.portName ?? "",
    distance: formatAmount(leg.distanceNm ?? 0),
    eca: formatAmount(leg.ecaNm ?? 0),
    wf: formatPercentValue(leg.wfPct),
    spd: formatAmount(leg.speedKn ?? 0),
    sea: formatAmount(leg.seaDays ?? 0),
    ldRate: formatAmount(leg.cpTerm?.ldRate ?? 0),
    idle: formatAmount(leg.portIdleDays ?? 0),
    working: "",
    dem: formatAmount(leg.cpTerm?.demurrage ?? 0),
    des: formatAmount(leg.cpTerm?.despatch ?? 0),
    portCharge: formatAmount(leg.portCharge ?? 0),
    arrival: formatOperationDateTime(leg.arrivalAt),
    departure: formatOperationDateTime(leg.departureAt),
  }));

  portRows.push({
    key: "margin",
    no: "",
    type: "Margin",
    port: "",
    distance: "",
    eca: "",
    wf: "",
    spd: "",
    sea: formatAmount(snapshot.header.marginSeaDays ?? 0),
    ldRate: "",
    idle: formatAmount(snapshot.header.marginPortIdleDays ?? 0),
    working: "",
    dem: "",
    des: "",
    portCharge: "",
    arrival: "",
    departure: "",
  });

  return {
    header: {
      estimateId: snapshot.header.estimateId,
      vesselId: snapshot.header.vesselId,
      vesselName: snapshot.header.vesselName ?? opVessel.mv,
      voyageNo: snapshot.header.voyageNo || "voyage1",
      status: "ONGOING",
    },
    cargoRows: cargoRows.length ? cargoRows : opCargoData,
    portRows: portRows.length > 1 ? portRows : opPortData,
  };
}

function buildOperationSnapshotPayload({
  operationId,
  header,
  cargoRows,
  portRows,
  bunkerRows,
  actualReports,
}: {
  operationId?: string;
  header: {
    estimateId?: string;
    vesselId?: string;
    vesselName: string;
    voyageNo: string;
    status?: string;
  };
  cargoRows: OpCargoRow[];
  portRows: OpPortRow[];
  bunkerRows: OpBunkerRow[];
  actualReports: Record<string, OperationLegReports>;
}): OperationSnapshotPayload {
  return {
    header: {
      operationId,
      estimateId: header.estimateId,
      vesselId: header.vesselId,
      vesselName: header.vesselName,
      voyageNo: header.voyageNo,
      status: header.status ?? "ONGOING",
      currency: "USD",
    },
    cargoRows: cargoRows
      .filter(hasOperationCargoInput)
      .map((row, index) => ({
        lineNo: index + 1,
        account: row.account,
        cargoName: row.cargoName,
        loadingPort: row.loadingPort,
        dischargingPort: row.dischargingPort,
        quantity: parseAmount(row.quantity),
        frtType: row.frtType,
        freightRate: parseAmount(row.frt),
        freightLumpsum: parseAmount(row.frtLumpsum),
        linerCost: parseAmount(row.linerTerm),
        totalFreight: operationFreightAmount(row),
      })),
    portRows: portRows
      .filter((row) => row.key !== "margin" && (row.port || row.type))
      .map((row, index) => ({
        lineNo: index + 1,
        type: row.type,
        portName: row.port,
        distanceNm: parseAmount(row.distance),
        ecaNm: parseAmount(row.eca),
        arrival: row.arrival,
        departure: row.departure,
      })),
    bunkerRows: bunkerRows.map((row) => ({
      fuelType: row.type,
      pricePerMt: parseAmount(row.price),
      consumptionMt: parseAmount(row.consumption),
      expense: bunkerExpense(row),
    })),
    reports: Object.entries(actualReports).flatMap(([portKey, report]) => [
      ...(report.arrival
        ? [
            {
              portKey,
              kind: "arrival" as const,
              time: report.arrival.time,
              remark: report.arrival.note,
              fuels: buildReportFuels(report.arrival.rob),
            },
          ]
        : []),
      ...(report.departure
        ? [
            {
              portKey,
              kind: "departure" as const,
              time: report.departure.time,
              remark: report.departure.note,
              fuels: buildReportFuels(report.departure.rob),
            },
          ]
        : []),
    ]),
  };
}

function applyLoadedOperationSnapshot(
  snapshot: OperationSnapshotPayload,
  setCargoRows: (rows: OpCargoRow[]) => void,
  setPortRows: (rows: OpPortRow[]) => void,
  setBunkerRows: (rows: OpBunkerRow[]) => void,
) {
  setCargoRows(
    snapshot.cargoRows.map((row, index) => ({
      key: String(index + 1),
      no: String(index + 1),
      account: row.account ?? "",
      cargoName: row.cargoName ?? "",
      loadingPort: row.loadingPort ?? "",
      dischargingPort: row.dischargingPort ?? "",
      quantity: formatAmount(row.quantity ?? 0),
      unit: "MT",
      frt: formatAmount(row.freightRate ?? 0),
      term: "",
      frtType: row.frtType ?? "F",
      frtLumpsum: formatAmount(row.freightLumpsum ?? 0),
      totalFreight: formatAmount(row.totalFreight ?? 0),
      aComm: "",
      brkg: "",
      frtTax: "",
      linerTerm: formatAmount(row.linerCost ?? 0),
    })),
  );
  setPortRows(
    snapshot.portRows.map((row, index) => ({
      key: String(index + 1),
      no: String(index + 1),
      type: row.type ?? "",
      port: row.portName ?? "",
      distance: formatAmount(row.distanceNm ?? 0),
      eca: formatAmount(row.ecaNm ?? 0),
      wf: "",
      spd: "",
      sea: "",
      ldRate: "",
      idle: "",
      working: "",
      dem: "",
      des: "",
      portCharge: "",
      arrival: row.arrival ?? "",
      departure: row.departure ?? "",
    })),
  );
  setBunkerRows(
    snapshot.bunkerRows.map((row, index) => ({
      key: String(index + 1),
      type: row.fuelType,
      price: formatAmount(row.pricePerMt ?? 0),
      consumption: formatAmount(row.consumptionMt ?? 0),
      expense: formatAmount(row.expense ?? 0),
    })),
  );
}

function buildReportFuels(rob: string[]) {
  return FUEL_TYPES.map((fuelType, index) => ({
    fuelType,
    robMt: parseAmount(rob[index] ?? "0"),
  }));
}

function formatPercentValue(value?: number) {
  return value == null ? "" : `${value} %`;
}

function formatOperationDateTime(value?: string) {
  if (!value) return "";
  return value.replace("T", " ").slice(0, 16);
}

function formatOperationPortType(value: LoadedVoyageSnapshot["portLegs"][number]["legType"]) {
  if (value === "BALLAST") return "Ballast";
  if (value === "LOADING") return "Loading";
  if (value === "DISCHARGE") return "Dischg.";
  if (value === "BUNKER") return "Bunker";
  if (value === "CANAL") return "Canal";
  return "Others";
}

function buildOperationLinerContextRows(row: OpCargoRow): LinerTermsContextRow[] {
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

function operationFreightAmount(row: OpCargoRow) {
  return row.frtType === "L"
    ? parseAmount(row.frtLumpsum)
    : parseAmount(row.quantity) * parseAmount(row.frt);
}

function bunkerExpense(row: OpBunkerRow) {
  return parseAmount(row.price) * parseAmount(row.consumption);
}

type OperationCargoTotals = ReturnType<typeof calculateOperationCargoTotals>;
type OperationPortTotals = ReturnType<typeof calculateOperationPortTotals>;
type OperationBunkerTotals = ReturnType<typeof calculateOperationBunkerTotals>;

function calculateOperationCargoTotals(rows: OpCargoRow[]) {
  const activeRows = rows.filter(hasOperationCargoInput);
  const quantity = sum(activeRows.map((row) => parseAmount(row.quantity)));
  const freightValues = activeRows.map(operationFreightAmount);
  const totalFreight = sum(freightValues);
  const frtLumpsum = sum(activeRows.map((row) => parseAmount(row.frtLumpsum)));
  const addComm = sum(
    activeRows.map((row, index) => freightValues[index] * (parseAmount(row.aComm) / 100)),
  );
  const brokerage = sum(
    activeRows.map((row, index) => freightValues[index] * (parseAmount(row.brkg) / 100)),
  );
  const freightTax = sum(
    activeRows.map((row, index) => freightValues[index] * (parseAmount(row.frtTax) / 100)),
  );
  const linerTerm = sum(activeRows.map((row) => parseAmount(row.linerTerm)));
  const averageFreight = quantity > 0 ? totalFreight / quantity : 0;

  return {
    quantity: formatAmount(quantity),
    frt: formatAmount(averageFreight),
    frtLumpsum: formatAmount(frtLumpsum),
    totalFreight: formatAmount(totalFreight),
    aComm: formatAmount(addComm),
    brkg: formatAmount(brokerage),
    frtTax: formatAmount(freightTax),
    linerTerm: formatAmount(linerTerm),
    quantityValue: quantity,
    revenueValue: totalFreight,
    addCommValue: addComm,
    brokerageValue: brokerage,
    freightTaxValue: freightTax,
    linerTermValue: linerTerm,
  };
}

function calculateOperationPortTotals(rows: OpPortRow[]) {
  const activeRows = rows.filter((row) => row.key !== "margin" && hasOperationPortInput(row));
  const distance = sum(activeRows.map((row) => parseAmount(row.distance)));
  const eca = sum(activeRows.map((row) => parseAmount(row.eca)));
  const sea = sum(activeRows.map((row) => parseAmount(row.sea)));
  const idle = sum(activeRows.map((row) => parseAmount(row.idle)));
  const working = sum(activeRows.map((row) => parseAmount(row.working)));
  const dem = sum(activeRows.map((row) => parseAmount(row.dem)));
  const des = sum(activeRows.map((row) => parseAmount(row.des)));
  const portCharge = sum(activeRows.map((row) => parseAmount(row.portCharge)));

  return {
    distance: formatAmount(distance),
    eca: formatAmount(eca),
    sea: formatAmount(sea),
    idle: formatAmount(idle),
    working: formatAmount(working),
    dem: formatAmount(dem),
    des: formatAmount(des),
    portCharge: formatAmount(portCharge),
    arrival: earliestDate(activeRows.map((row) => row.arrival)),
    departure: latestDate(activeRows.map((row) => row.departure)),
    demDesValue: des - dem,
    portChargeValue: portCharge,
    durationDaysValue: sea + idle + working,
  };
}

function calculateOperationBunkerTotals(rows: OpBunkerRow[]) {
  const expense = sum(rows.map(bunkerExpense));
  const consumption = sum(rows.map((row) => parseAmount(row.consumption)));
  return {
    expense: formatAmount(expense),
    consumption: formatAmount(consumption),
    expenseValue: expense,
  };
}

function buildOperationExpenseRows(
  cargoTotals: OperationCargoTotals,
  portTotals: OperationPortTotals,
  bunkerTotals: OperationBunkerTotals,
) {
  const cev = parseKvAmount(opExpense, "C.E.V.");
  const ilohc = parseKvAmount(opExpense, "ILOHC");
  const ballastBonus = parseKvAmount(opExpense, "Ballast Bonus");
  const routingService = parseKvAmount(opExpense, "Routing Service");
  const others = parseKvAmount(opExpense, "Others");

  return [
    ["Dem/Des", formatAmount(portTotals.demDesValue), "Bunker Expense", bunkerTotals.expense],
    ["Add Comm.", formatAmount(cargoTotals.addCommValue), "C.E.V.", formatAmount(cev)],
    ["Brokerage", formatAmount(cargoTotals.brokerageValue), "ILOHC", formatAmount(ilohc)],
    ["Freight Tax", formatAmount(cargoTotals.freightTaxValue), "Ballast Bonus", formatAmount(ballastBonus)],
    ["Liner Terms", formatAmount(cargoTotals.linerTermValue), "Routing Service", formatAmount(routingService)],
    ["Port Charge", formatAmount(portTotals.portChargeValue), "Others", formatAmount(others)],
  ] satisfies Array<[string, string, string, string]>;
}

function buildOperationResultRows(
  cargoTotals: OperationCargoTotals,
  operationExpenseRows: Array<[string, string, string, string]>,
) {
  const totalHire = parseKvAmount(opResultRows, "Total Hire");
  const hireDay = parseKvAmount(opResultRows, "Hire / Day");
  const hireAddComm = findKvValue(opResultRows, "H/Add Comm.") || "0.00 %";
  const netHire = parseKvAmount(opResultRows, "Net Hire");
  const offHire = parseKvAmount(opResultRows, "Off Hire");
  const cBase = parseKvAmount(opResultRows, "C/Base");
  const opExpense = sumKvRows(operationExpenseRows);
  const opProfit = cargoTotals.revenueValue - opExpense;
  const totalExpense = opExpense + totalHire;

  return [
    ["Hire / Day", formatAmount(hireDay), "Revenue", formatAmount(cargoTotals.revenueValue)],
    ["H/Add Comm.", hireAddComm, "Op. Expense", formatAmount(opExpense)],
    ["Net Hire", formatAmount(netHire), "Op. Profit", formatAmount(opProfit)],
    ["Off Hire", formatAmount(offHire), "Total Hire", formatAmount(totalHire)],
    ["C/Base", formatAmount(cBase), "Total Expense", formatAmount(totalExpense)],
  ] satisfies Array<[string, string, string, string]>;
}

function calculateOperationProfit(
  cargoTotals: OperationCargoTotals,
  operationExpenseRows: Array<[string, string, string, string]>,
) {
  const opExpense = sumKvRows(operationExpenseRows);
  const totalHire = parseKvAmount(opResultRows, "Total Hire");
  return formatAmount(cargoTotals.revenueValue - opExpense - totalHire);
}

function validateOperationForm({
  cargoRows,
  portRows,
  bunkerRows,
}: {
  cargoRows: OpCargoRow[];
  portRows: OpPortRow[];
  bunkerRows: OpBunkerRow[];
}) {
  const details: string[] = [];
  const activeCargoRows = cargoRows.filter(hasOperationCargoInput);
  const activePortRows = portRows.filter((row) => row.key !== "margin" && hasOperationPortInput(row));

  if (!activeCargoRows.length) details.push("At least one Cargo row is required.");
  if (!activePortRows.length) details.push("At least one Port Rotation row is required.");

  activeCargoRows.forEach((row, index) => {
    const prefix = `Cargo row ${index + 1}`;
    if (!row.cargoName.trim()) details.push(`${prefix}: Cargo Name is required.`);
    if (!row.loadingPort.trim()) details.push(`${prefix}: Loading Port is required.`);
    if (!row.dischargingPort.trim()) details.push(`${prefix}: Discharging Port is required.`);
    if (parseAmount(row.quantity) <= 0) details.push(`${prefix}: Quantity must be greater than 0.`);
    if (row.frtType === "L") {
      if (parseAmount(row.frtLumpsum) <= 0) {
        details.push(`${prefix}: Frt Lumpsum is required when Frt Type is L.`);
      }
    } else if (parseAmount(row.frt) <= 0) {
      details.push(`${prefix}: Frt is required when Frt Type is F.`);
    }
    validatePercent(row.aComm, `${prefix}: A. Comm`, details);
    validatePercent(row.brkg, `${prefix}: Brkg`, details);
    validatePercent(row.frtTax, `${prefix}: Frt Tax`, details);
    if (parseAmount(row.linerTerm) < 0) details.push(`${prefix}: Liner Term must not be negative.`);
  });

  activePortRows.forEach((row, index) => {
    const prefix = `Port row ${index + 1}`;
    if (!row.type.trim()) details.push(`${prefix}: Type is required.`);
    if (row.type && row.type !== "Others" && !row.port.trim()) {
      details.push(`${prefix}: Port Name or Coordinates is required.`);
    }

    const distance = parseAmount(row.distance);
    const eca = parseAmount(row.eca);
    if (distance < 0) details.push(`${prefix}: Distance must not be negative.`);
    if (eca < 0) details.push(`${prefix}: ECA distance must not be negative.`);
    if (eca > distance) details.push(`${prefix}: ECA distance must not exceed total distance.`);
    if (distance > 0 && parseAmount(row.spd) <= 0) {
      details.push(`${prefix}: Speed is required when distance is provided.`);
    }
    validatePercent(row.wf, `${prefix}: W.F`, details);
    if (parseAmount(row.sea) < 0) details.push(`${prefix}: Sea must not be negative.`);
    if (parseAmount(row.ldRate) < 0) details.push(`${prefix}: L / D Rate must not be negative.`);
    if (parseAmount(row.idle) < 0) details.push(`${prefix}: Idle must not be negative.`);
    if (parseAmount(row.working) < 0) details.push(`${prefix}: Working must not be negative.`);
    if (parseAmount(row.dem) < 0) details.push(`${prefix}: Dem must not be negative.`);
    if (parseAmount(row.des) < 0) details.push(`${prefix}: Des must not be negative.`);
    if (parseAmount(row.portCharge) < 0) details.push(`${prefix}: Port Charge must not be negative.`);
    validateChronology(row.arrival, row.departure, `${prefix}: Arrival must be before Departure.`, details);
  });

  const margin = portRows.find((row) => row.key === "margin");
  if (margin) {
    if (parseAmount(margin.sea) < 0) details.push("Port margin: Sea must not be negative.");
    if (parseAmount(margin.idle) < 0) details.push("Port margin: Idle must not be negative.");
  }

  bunkerRows.forEach((row, index) => {
    const prefix = `Bunker row ${index + 1}`;
    if (!row.type.trim()) details.push(`${prefix}: Fuel type is required.`);
    if (parseAmount(row.price) < 0) details.push(`${prefix}: Price / MT must not be negative.`);
    if (parseAmount(row.consumption) < 0) {
      details.push(`${prefix}: Consumption must not be negative.`);
    }
    if (parseAmount(row.expense) < 0) details.push(`${prefix}: Expense must not be negative.`);
  });

  return details;
}

function hasOperationCargoInput(row: OpCargoRow) {
  return Boolean(
    row.account.trim() ||
      row.cargoName.trim() ||
      row.loadingPort.trim() ||
      row.dischargingPort.trim() ||
      row.quantity.trim() ||
      row.frt.trim() ||
      row.frtLumpsum.trim() ||
      row.term.trim() ||
      row.aComm.trim() ||
      row.brkg.trim() ||
      row.frtTax.trim() ||
      row.linerTerm.trim(),
  );
}

function hasOperationPortInput(row: OpPortRow) {
  return Boolean(
    row.type.trim() ||
      row.port.trim() ||
      row.distance.trim() ||
      row.eca.trim() ||
      row.wf.trim() ||
      row.spd.trim() ||
      row.sea.trim() ||
      row.ldRate.trim() ||
      row.idle.trim() ||
      row.working.trim() ||
      row.dem.trim() ||
      row.des.trim() ||
      row.portCharge.trim() ||
      row.arrival.trim() ||
      row.departure.trim(),
  );
}

function validatePercent(value: string, label: string, details: string[]) {
  if (!value.trim()) return;
  const percent = parseAmount(value);
  if (percent < 0 || percent > 100) details.push(`${label} must be between 0 and 100.`);
}

function validateChronology(
  start: string,
  end: string,
  message: string,
  details: string[],
) {
  if (!start.trim() || !end.trim()) return;
  const startTime = parseDateTime(start);
  const endTime = parseDateTime(end);
  if (!startTime || !endTime) {
    details.push(message.replace("before", "a valid date before"));
    return;
  }
  if (startTime.getTime() > endTime.getTime()) details.push(message);
}

function earliestDate(values: string[]) {
  const parsed = values
    .map((value) => ({ value, date: parseDateTime(value) }))
    .filter((item): item is { value: string; date: Date } => Boolean(item.date));
  parsed.sort((a, b) => a.date.getTime() - b.date.getTime());
  return parsed[0]?.value ?? "";
}

function latestDate(values: string[]) {
  const parsed = values
    .map((value) => ({ value, date: parseDateTime(value) }))
    .filter((item): item is { value: string; date: Date } => Boolean(item.date));
  parsed.sort((a, b) => b.date.getTime() - a.date.getTime());
  return parsed[0]?.value ?? "";
}

function parseKvAmount(rows: Array<[string, string, string, string]>, label: string) {
  return parseAmount(findKvValue(rows, label));
}

function findKvValue(rows: Array<[string, string, string, string]>, label: string) {
  for (const [leftLabel, leftValue, rightLabel, rightValue] of rows) {
    if (leftLabel === label) return leftValue;
    if (rightLabel === label) return rightValue;
  }
  return "";
}

function sumKvRows(rows: Array<[string, string, string, string]>) {
  return sum(rows.flatMap((row) => [parseAmount(row[1]), parseAmount(row[3])]));
}

function sum(values: number[]) {
  return values.reduce((total, value) => total + value, 0);
}

function parseDateTime(value: string) {
  const parsed = new Date(value.replace(" ", "T"));
  return Number.isNaN(parsed.getTime()) ? undefined : parsed;
}

function parseAmount(value: string | number | undefined) {
  if (typeof value === "number") return Number.isFinite(value) ? value : 0;
  if (!value) return 0;
  const parsed = Number(String(value).replace(/,/g, "").replace(/%/g, "").trim());
  return Number.isFinite(parsed) ? parsed : 0;
}

function formatAmount(value: number) {
  return value.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}
