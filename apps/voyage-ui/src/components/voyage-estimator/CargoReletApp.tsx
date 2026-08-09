import { useLayoutEffect, useMemo, useRef, useState } from "react";
import { Alert, Table, Button, Checkbox, Select } from "antd";
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
import {
  buildCargoReletSnapshotPayload,
  mapCargoReletSnapshotToRows,
} from "./cargoReletSnapshotMapper";
import { SectionTitle, TxtCell, YCell } from "./cells";
import { VE_COLORS } from "./theme";
import KVPanels from "./KVPanels";
import { useRowOps } from "./useRowOps";
import { useResizableColumns } from "./useResizableColumns";
import {
  reletCargoData,
  reletPortData,
  reletPortSummary,
  type ReletCargoRow,
  type ReletPortRow,
} from "./cargoReletData";
import type { RegisterWorkspaceToolbar } from "@/components/workspace/workspaceToolbar";
import { loadCargoReletSnapshot, saveCargoReletSnapshot } from "@/lib/api/cargoReletSnapshots";
import { VoyageApiError } from "@/lib/api/voyageSnapshots";

type CargoReletModal = "loadable" | "freight" | "analyzer";

const portCell = (v: string) => (
  <div className="flex items-center">
    <TxtCell value={v} />
    <InfoCircleOutlined style={{ color: VE_COLORS.titleBar, fontSize: 11 }} />
  </div>
);

type ReletCargoField = keyof ReletCargoRow;
type ReletPortField = keyof ReletPortRow;

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
): ColumnsType<ReletCargoRow> => [
  { title: "#", dataIndex: "no", width: 36, align: "center" },
  { title: "Account", dataIndex: "account", width: "7%", render: cargoText(update, "account") },
  {
    title: "Cargo Name",
    dataIndex: "cargoName",
    width: "8%",
    render: cargoText(update, "cargoName"),
  },
  { title: "Loading Port", dataIndex: "loadingPort", width: "12.5%", render: portCell },
  { title: "Discharging Port", dataIndex: "dischargingPort", width: "12.5%", render: portCell },
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
        width: 32,
        align: "center",
        render: cargoText(update, "hFrtType"),
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
        render: cargoText(update, "hLiner", true),
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
        width: 32,
        align: "center",
        render: cargoText(update, "sFrtType"),
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
        title: "Brkg",
        dataIndex: "sBrkg",
        width: 48,
        align: "right",
        render: cargoPercent(update, "sBrkg"),
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
        render: cargoText(update, "sLiner", true),
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
    width: 150,
    render: portText(update, "port"),
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
    title: "Port Charge",
    dataIndex: "portCharge",
    width: "6.4%",
    align: "right",
    render: portYellow(update, "portCharge"),
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
  const [estimateId, setEstimateId] = useState<string>();
  const [estimateFileId, setEstimateFileId] = useState<string>();
  const [loadEstimateId, setLoadEstimateId] = useState("");
  const [sheetExists, setSheetExists] = useState(true);
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
    () => calculatePortRows(port.rows, calculatedCargoRows),
    [calculatedCargoRows, port.rows],
  );
  const cargoTotals = useMemo(
    () => calculateCargoTotals(calculatedCargoRows),
    [calculatedCargoRows],
  );
  const portTotals = useMemo(() => calculatePortTotals(calculatedPortRows), [calculatedPortRows]);
  const bottomPanels = useMemo(
    () => buildCargoReletBottomPanels(cargoTotals, portTotals),
    [cargoTotals, portTotals],
  );
  const cargoColumns = useResizableColumns(buildCargoCols(updateCargo));
  const portColumns = useResizableColumns(buildPortCols(updatePort));

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
        cargoRows: calculatedCargoRows,
        portRows: calculatedPortRows,
      });
      const response = await saveCargoReletSnapshot(payload);
      setEstimateId(response.estimateId);
      setEstimateFileId(response.estimateFileId);
      setLoadEstimateId(response.estimateId);
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

    setSaveState({ status: "loading", message: `Loading Cargo Relet estimate #${id}...` });
    try {
      const snapshot = await loadCargoReletSnapshot(id);
      const rows = mapCargoReletSnapshotToRows(snapshot);
      cargo.setRows(rows.cargoRows);
      port.setRows(rows.portRows);
      setEstimateId(snapshot.header.estimateId ?? id);
      setEstimateFileId(snapshot.header.estimateFileId);
      setLoadEstimateId(snapshot.header.estimateId ?? id);
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

  const resetSheet = () => {
    cargo.setRows(reletCargoData);
    port.setRows(reletPortData);
    setEstimateId(undefined);
    setEstimateFileId(undefined);
    setLoadEstimateId("");
    setSheetExists(true);
    setSaveState({ status: "idle" });
  };

  const deleteSheet = () => {
    cargo.setRows([]);
    port.setRows([]);
    setEstimateId(undefined);
    setEstimateFileId(undefined);
    setLoadEstimateId("");
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
    <EstimatorShell title="Cargo Relet — Estimation W3" sheetKind="cargo relet">
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
      <VesselSection />

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
                  {cargoTotals.sBrkg}
                </Table.Summary.Cell>
                <Table.Summary.Cell index={19} align="right">
                  {cargoTotals.sNet}
                </Table.Summary.Cell>
                <Table.Summary.Cell index={20} align="right">
                  {cargoTotals.sLiner}
                </Table.Summary.Cell>
                <Table.Summary.Cell index={21} />
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
          <Checkbox defaultChecked className="text-[11px]">
            SUEZ
          </Checkbox>
          <Checkbox defaultChecked className="text-[11px]">
            PANAMA
          </Checkbox>
          <Checkbox className="text-[11px]">KIEL</Checkbox>
          <span className="text-[11px] text-gray-600">{reletPortSummary}</span>
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
                <Table.Summary.Cell index={9} align="right">
                  {portTotals.hDem}
                </Table.Summary.Cell>
                <Table.Summary.Cell index={10} align="right">
                  {portTotals.hDes}
                </Table.Summary.Cell>
                <Table.Summary.Cell index={11} />
                <Table.Summary.Cell index={12} align="right">
                  {portTotals.sDem}
                </Table.Summary.Cell>
                <Table.Summary.Cell index={13} align="right">
                  {portTotals.sDes}
                </Table.Summary.Cell>
                <Table.Summary.Cell index={14} align="right">
                  {portTotals.idle}
                </Table.Summary.Cell>
                <Table.Summary.Cell index={15} align="right">
                  {portTotals.working}
                </Table.Summary.Cell>
                <Table.Summary.Cell index={16} align="right">
                  {portTotals.portCharge}
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
          <Button size="small" icon={<LineChartOutlined />} onClick={() => setModal("analyzer")}>
            Analyzer
          </Button>
          <Button size="small" icon={<FileTextOutlined />}>
            Remark
          </Button>
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

      <KVPanels
        panels={[
          { title: "Operation Expense", rows: bottomPanels.operationExpense },
          {
            title: "Result",
            rows: bottomPanels.resultRows,
            profitLabel: "Profit (USD)",
            profit: bottomPanels.profitUsd,
          },
        ]}
      />
      {modal === "loadable" && <LoadableQuantityApp onClose={() => setModal(null)} />}
      {modal === "freight" && <FreightSimulatorApp onClose={() => setModal(null)} />}
      {modal === "analyzer" && <AnalyzerApp onClose={() => setModal(null)} />}
    </EstimatorShell>
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
  const frt = parseAmount(side === "h" ? row.hFrt : row.sFrt);
  const frtType = (side === "h" ? row.hFrtType : row.sFrtType).toUpperCase();
  const lumpsum = parseAmount(side === "h" ? row.hFrtLumpsum : row.sFrtLumpsum);
  const comm = parseAmount(side === "h" ? row.hComm : row.sComm) / 100;
  const brkg = parseAmount(side === "h" ? row.hBrkg : row.sBrkg) / 100;
  const gross = frtType === "L" ? lumpsum : quantity * frt;
  return gross * (1 - comm - brkg);
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

function calculatePortRows(rows: ReletPortRow[], cargoRows: ReletCargoRow[]) {
  let previousDeparture: Date | undefined;
  let previousTimezone = "";

  return rows.map((row) => {
    const timezone = resolvePortTimezone(row.port) || row.timezone || "";

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

function buildCargoReletBottomPanels(
  cargoTotals: ReturnType<typeof calculateCargoTotals>,
  portTotals: ReturnType<typeof calculatePortTotals>,
) {
  const headNet = parseAmount(cargoTotals.hNet);
  const subNet = parseAmount(cargoTotals.sNet);
  const portCharge = parseAmount(portTotals.portCharge);
  const headDes = parseAmount(portTotals.hDes);
  const subDes = parseAmount(portTotals.sDes);
  const demDes = headDes - subDes;
  const opExpense = portCharge + Math.max(0, demDes);
  const days = Math.max(parseAmount(portTotals.sea) + parseAmount(portTotals.idle), 0);
  const profit = subNet - headNet - opExpense;

  return {
    operationExpense: [
      ["Dem/Des", formatAmount(demDes), "Bunker Expense", "0.0"],
      ["Add Comm.", "0.0", "C.E.V.", "0.0"],
      ["Brokerage", "0.0", "ILOHC", "0.0"],
      ["Freight Tax", "0.0", "Ballast Bonus", "0.0"],
      ["Liner Terms", formatAmount(parseAmount(cargoTotals.hLiner)), "Routing Service", "0.0"],
      ["Port Charge", portTotals.portCharge, "Others", "0.0"],
    ] satisfies Array<[string, string, string, string]>,
    resultRows: [
      ["Head CP Freight", cargoTotals.hNet, "Sub CP Freight", cargoTotals.sNet],
      ["Head CP Net", cargoTotals.hNet, "Sub CP Net", cargoTotals.sNet],
      ["Op. Expense", formatAmount(opExpense), "Days", formatAmount(days, 2)],
      [
        "Net Voyage Days",
        formatAmount(days, 2),
        "TCE / Day",
        days ? formatAmount(profit / days) : "0.0",
      ],
    ] satisfies Array<[string, string, string, string]>,
    profitUsd: formatAmount(profit),
  };
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
