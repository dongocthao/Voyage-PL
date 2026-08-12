import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { Alert, Table, Button, Checkbox, Select } from "antd";
import type { ColumnsType } from "antd/es/table";
import {
  InfoCircleOutlined,
  LineChartOutlined,
  FileTextOutlined,
  EnvironmentOutlined,
  DesktopOutlined,
} from "@ant-design/icons";
import EstimatorShell from "./EstimatorShell";
import VesselSection from "./VesselSection";
import { RowToolbar } from "./CargoTable";
import TcBottomPanels from "./TcBottomPanels";
import type { TcBottomPanelData, TcMiscItem } from "./TcBottomPanels";
import AnalyzerApp from "./AnalyzerApp";
import { TimeCharterReportPreview } from "./TimeCharterReportPreview";
import { useRowOps } from "./useRowOps";
import { SectionTitle, TxtCell, YCell, SelCell } from "./cells";
import { VE_COLORS } from "./theme";
import {
  tcHeadCp,
  tcSubCp,
  tcPortData,
  tcPortSummary,
  TC_PORT_TYPES,
  type TcCpRow,
  type TcPortRow,
} from "./timeCharterData";
import { fetchBunkerProfiles, type LookupItem } from "@/lib/api/masterData";
import {
  loadTimeCharterSnapshot,
  saveTimeCharterSnapshot,
  type TimeCharterSnapshotPayload,
} from "@/lib/api/timeCharterSnapshots";
import { listVessels } from "@/lib/api/vessels";
import { VoyageApiError, type VoyageSnapshotResult } from "@/lib/api/voyageSnapshots";
import {
  buildTimeCharterSnapshotPayload,
  mapTimeCharterSnapshotToRows,
} from "./timeCharterSnapshotMapper";
import { ToolbarCommandManager, type ToolbarCommand } from "./toolbarCommandManager";
import type { RegisterWorkspaceToolbar } from "@/components/workspace/workspaceToolbar";
import { buildPortRotationSummary } from "./portRotationSummary";

const portEditorWithInfo = (v: string, onChange: (value: string) => void) => (
  <div className="flex items-center">
    <TxtCell value={v} onChange={onChange} />
    <InfoCircleOutlined style={{ color: VE_COLORS.titleBar, fontSize: 11 }} />
  </div>
);

const isMargin = (r: TcPortRow) => r.key === "margin";
const isDeliveryTimeRow = (row: TcPortRow) => row.type === "Delivery" || row.type === "Redelivery";
const deliveryTimeText = (row: TcPortRow) =>
  row.type === "Redelivery" ? "Redelivery time" : "Delivery time";
export default function TimeCharterApp({
  registerWorkspaceToolbar,
}: {
  registerWorkspaceToolbar?: RegisterWorkspaceToolbar;
} = {}) {
  const head = useRowOps<TcCpRow>(tcHeadCp);
  const sub = useRowOps<TcCpRow>(tcSubCp);
  const port = useRowOps<TcPortRow>(tcPortData);
  const [vessels, setVessels] = useState<LookupItem[]>([]);
  const [bunkerProfiles, setBunkerProfiles] = useState<LookupItem[]>([]);
  const [vesselId, setVesselId] = useState<string | undefined>();
  const [bunkerProfileId, setBunkerProfileId] = useState<string | undefined>();
  const [performanceMode, setPerformanceMode] = useState<
    "FULL" | "ECO" | "CUSTOM1" | "CUSTOM2" | "CUSTOM3"
  >("FULL");
  const [headMulti, setHeadMulti] = useState(false);
  const [subMulti, setSubMulti] = useState(false);
  const [estimateId, setEstimateId] = useState<string>();
  const [estimateFileId, setEstimateFileId] = useState<string>();
  const [apiResult, setApiResult] = useState<VoyageSnapshotResult>();
  const [auditState, setAuditState] = useState({ updatedAt: "", updatedBy: "Admin" });
  const [saveState, setSaveState] = useState<
    | { status: "idle" }
    | { status: "saving" }
    | { status: "saved"; message: string }
    | { status: "loading" }
    | { status: "loaded"; message: string }
    | { status: "error"; message: string; details?: string[] }
  >({ status: "idle" });
  const [routingSuez, setRoutingSuez] = useState(true);
  const [routingPanama, setRoutingPanama] = useState(true);
  const [routingKiel, setRoutingKiel] = useState(false);
  const [timeDisplayUnit, setTimeDisplayUnit] = useState<"DAYS" | "HOURS">("DAYS");
  const [timezoneDisplayMode, setTimezoneDisplayMode] = useState<"PORT_LOCAL" | "UTC">(
    "PORT_LOCAL",
  );
  const [sheetExists, setSheetExists] = useState(true);
  const [miscRevenueItems, setMiscRevenueItems] = useState<TcMiscItem[]>([]);
  const [otherExpenseItems, setOtherExpenseItems] = useState<TcMiscItem[]>([]);
  const [analyzerOpen, setAnalyzerOpen] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [reportPrintToken, setReportPrintToken] = useState<number>();
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
  const sel = (key: string | null) => (r: { key: string }) =>
    r.key === key ? "ve-row-selected" : "";
  const updateCpRow = useCallback(
    (
      setRows: React.Dispatch<React.SetStateAction<TcCpRow[]>>,
      key: string,
      field: keyof TcCpRow,
      value: string,
    ) => {
      setRows((rows) =>
        rows.map((row) => {
          if (row.key !== key) return row;
          const next = { ...row, [field]: value };
          if (field === "duration" || field === "dailyHire") {
            next.grossHire = formatAmount(parseAmount(next.duration) * parseAmount(next.dailyHire));
          }
          if (field === "addComm" || field === "brkg") {
            next[field] = formatPercentInput(value);
          }
          return next;
        }),
      );
    },
    [],
  );
  const headCpCols = useMemo(
    () => createCpCols(head.setRows, updateCpRow),
    [head.setRows, updateCpRow],
  );
  const subCpCols = useMemo(
    () => createCpCols(sub.setRows, updateCpRow),
    [sub.setRows, updateCpRow],
  );
  const updatePortRow = useCallback(
    (key: string, field: keyof TcPortRow, value: string) => {
      port.setRows((rows) =>
        rows.map((row) => {
          if (row.key !== key) return row;
          const next = { ...row, [field]: value };
          if (field === "port") {
            next.timezone = resolvePortTimezone(value);
          }
          return next;
        }),
      );
    },
    [port],
  );
  const calculatedPortRows = useMemo(() => calculatePortSchedule(port.rows), [port.rows]);
  const portCols = useMemo(() => createPortCols(updatePortRow), [updatePortRow]);
  const portTotals = useMemo(() => calculatePortTotals(calculatedPortRows), [calculatedPortRows]);
  const tcSummaryText = useMemo(
    () =>
      buildPortRotationSummary(calculatedPortRows, {
        isSummaryRow: isMargin,
        type: (row) => row.type,
        sea: (row) => row.sea,
        idle: (row) => row.idle,
        eca: (row) => row.eca,
        wf: (row) => row.wf,
        spd: (row) => row.spd,
        departure: (row) => row.departure,
      }),
    [calculatedPortRows],
  );
  const bottomPanelData = useMemo<TcBottomPanelData>(
    () => buildBottomPanelData(head.rows, sub.rows, miscRevenueItems, otherExpenseItems),
    [head.rows, miscRevenueItems, otherExpenseItems, sub.rows],
  );
  const toolbarManager = useMemo(
    () => new ToolbarCommandManager(sheetExists, Boolean(estimateId)),
    [estimateId, sheetExists],
  );

  const formatError = (error: unknown, fallback: string) => {
    if (error instanceof VoyageApiError) {
      return {
        message: error.message,
        details: error.details.map((detail) =>
          detail.path ? `${detail.path}: ${detail.message}` : (detail.message ?? ""),
        ),
      };
    }

    return { message: error instanceof Error ? error.message : fallback };
  };

  const currentSnapshot = (): TimeCharterSnapshotPayload =>
    buildTimeCharterSnapshotPayload({
      estimateId,
      estimateFileId,
      header: {
        vesselId,
        bunkerProfileId,
        performanceMode,
        routingSuez,
        routingPanama,
        routingKiel,
        timeDisplayUnit,
        timezoneDisplayMode,
      },
      headCpRows: head.rows,
      subCpRows: sub.rows,
      portRows: calculatedPortRows,
      headMultiDuration: headMulti,
      subMultiDuration: subMulti,
    });

  const save = async () => {
    if (!sheetExists) {
      setSaveState({ status: "error", message: "Create a New Sheet before saving." });
      return;
    }

    const validationDetails = validateTimeCharterForm(head.rows, sub.rows, port.rows);
    if (validationDetails.length) {
      setSaveState({
        status: "error",
        message: "Please fix Time Charter inputs before saving.",
        details: validationDetails,
      });
      return;
    }

    setSaveState({ status: "saving" });
    try {
      const response = await saveTimeCharterSnapshot(currentSnapshot());
      setEstimateId(response.estimateId);
      setEstimateFileId(response.estimateFileId);
      setApiResult(response.result);
      setAuditState({
        updatedAt: response.updatedAt ?? new Date().toISOString(),
        updatedBy: response.updatedByName ?? "Admin",
      });
      setSaveState({
        status: "saved",
        message: `Saved Time Charter estimate #${response.estimateId}. Profit USD ${response.result.profitUsd.toLocaleString("en-US")}`,
      });
    } catch (error) {
      const formatted = formatError(error, "Save failed");
      setSaveState({ status: "error", message: formatted.message, details: formatted.details });
    }
  };

  const loadById = async (id: string) => {
    setSaveState({ status: "loading" });
    try {
      const snapshot = await loadTimeCharterSnapshot(id);
      const mapped = mapTimeCharterSnapshotToRows(snapshot);
      head.setRows(mapped.headCpRows);
      sub.setRows(mapped.subCpRows);
      port.setRows(calculatePortSchedule(mapped.portRows));
      setHeadMulti(mapped.headMultiDuration);
      setSubMulti(mapped.subMultiDuration);
      setEstimateId(snapshot.header.estimateId);
      setEstimateFileId(snapshot.header.estimateFileId);
      setVesselId(snapshot.header.vesselId);
      setBunkerProfileId(snapshot.header.bunkerProfileId);
      setPerformanceMode(snapshot.header.performanceMode ?? "FULL");
      setRoutingSuez(snapshot.header.routingSuez ?? true);
      setRoutingPanama(snapshot.header.routingPanama ?? true);
      setRoutingKiel(snapshot.header.routingKiel ?? false);
      setTimeDisplayUnit(snapshot.header.timeDisplayUnit ?? "DAYS");
      setTimezoneDisplayMode(snapshot.header.timezoneDisplayMode ?? "PORT_LOCAL");
      setApiResult(snapshot.result);
      setAuditState({
        updatedAt: snapshot.header.updatedAt ?? "",
        updatedBy: snapshot.header.updatedByName ?? "Admin",
      });
      setSaveState({
        status: "loaded",
        message: `Loaded Time Charter estimate #${snapshot.header.estimateId ?? id}.`,
      });
    } catch (error) {
      const formatted = formatError(error, "Load failed");
      setSaveState({ status: "error", message: formatted.message, details: formatted.details });
    }
  };

  const load = async () => {
    if (!sheetExists) {
      setSaveState({ status: "error", message: "There is no sheet to open." });
      return;
    }
    if (!estimateId) {
      setSaveState({ status: "error", message: "Save or select an Estimate ID before loading." });
      return;
    }

    await loadById(estimateId);
  };

  useEffect(() => {
    const routeEstimateId = new URLSearchParams(window.location.search).get("estimateId")?.trim();
    if (!routeEstimateId || routeEstimateLoadRef.current === routeEstimateId) return;

    routeEstimateLoadRef.current = routeEstimateId;
    void loadById(routeEstimateId);
  }, []);

  const resetSheet = () => {
    head.setRows(tcHeadCp);
    sub.setRows(tcSubCp);
    port.setRows(tcPortData);
    head.setSelectedKey(null);
    sub.setSelectedKey(null);
    port.setSelectedKey(null);
    setHeadMulti(false);
    setSubMulti(false);
    setEstimateId(undefined);
    setEstimateFileId(undefined);
    setApiResult(undefined);
    setAuditState({ updatedAt: "", updatedBy: "Admin" });
    setMiscRevenueItems([]);
    setOtherExpenseItems([]);
    setSheetExists(true);
    setSaveState({ status: "idle" });
  };

  const deleteSheet = () => {
    head.setRows([]);
    sub.setRows([]);
    port.setRows([]);
    setEstimateId(undefined);
    setEstimateFileId(undefined);
    setApiResult(undefined);
    setAuditState({ updatedAt: "", updatedBy: "Admin" });
    setSheetExists(false);
    setSaveState({ status: "idle" });
  };

  const handleToolbarCommand = (command: ToolbarCommand) => {
    const result = toolbarManager.execute(command);
    if (!result.ok) {
      setSaveState({ status: "error", message: result.message });
      return;
    }

    if (command === "new") {
      resetSheet();
      return;
    }
    if (command === "delete") {
      deleteSheet();
      return;
    }
    if (command === "save" || command === "saveAs") {
      void save();
      return;
    }
    if (command === "open" || command === "reload") {
      void load();
      return;
    }

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

  useEffect(() => {
    let cancelled = false;
    listVessels()
      .then((items) => {
        if (!cancelled) setVessels(items);
      })
      .catch(() => {
        if (!cancelled) setVessels([]);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    fetchBunkerProfiles({ vesselId })
      .then((items) => {
        if (cancelled) return;
        setBunkerProfiles(items);
        setBunkerProfileId((current) =>
          current && items.some((item) => String(item.id) === current)
            ? current
            : items[0]
              ? String(items[0].id)
              : undefined,
        );
      })
      .catch(() => {
        if (!cancelled) {
          setBunkerProfiles([]);
          setBunkerProfileId(undefined);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [vesselId]);

  return (
    <EstimatorShell
      title="Time Charter — Estimation W5"
      sheetKind="time charter"
      onToolbarCommand={handleToolbarCommand}
      toolbarCommandState={toolbarManager.getState()}
      lastUpdatedAt={auditState.updatedAt}
      lastUpdatedBy={auditState.updatedBy}
    >
      {(apiResult ||
        saveState.status === "saved" ||
        saveState.status === "loaded" ||
        saveState.status === "error") && (
        <div className="mb-2 flex flex-wrap items-center gap-2">
          {apiResult && (
            <span className="text-[11px] font-semibold text-[#1f6f94]">
              Revenue {apiResult.revenue.toLocaleString("en-US")} | Profit{" "}
              {apiResult.profitUsd.toLocaleString("en-US")} | Days{" "}
              {apiResult.totalDurationDays.toLocaleString("en-US")}
            </span>
          )}
          {(saveState.status === "saved" || saveState.status === "loaded") && (
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
      <VesselSection
        estimateId={estimateId}
        estType="TCOV"
        vesselId={vesselId}
        bunkerProfileId={bunkerProfileId}
        performanceMode={performanceMode}
        vessels={vessels}
        bunkerProfiles={bunkerProfiles}
        onVesselIdChange={(value) => {
          setVesselId(value);
          setBunkerProfileId(undefined);
        }}
        onBunkerProfileIdChange={setBunkerProfileId}
        onPerformanceModeChange={setPerformanceMode}
      />

      <section className="mb-2 grid grid-cols-1 gap-2 lg:grid-cols-2">
        <div>
          <div className="mb-1 flex items-center gap-2">
            <SectionTitle>Head CP</SectionTitle>
            <Checkbox
              className="ml-auto text-[11px]"
              checked={headMulti}
              onChange={(e) => setHeadMulti(e.target.checked)}
            >
              Use Multi Duration
            </Checkbox>
          </div>
          <Table<TcCpRow>
            size="small"
            bordered
            pagination={false}
            tableLayout="fixed"
            columns={headCpCols}
            dataSource={head.rows}
            onRow={head.onRow}
            rowClassName={sel(head.selectedKey)}
          />
          {headMulti && (
            <RowToolbar
              onAdd={head.add}
              onDelete={head.remove}
              onInsertAbove={head.insertAbove}
              onInsertBelow={head.insertBelow}
            />
          )}
        </div>
        <div>
          <div className="mb-1 flex items-center gap-2">
            <SectionTitle>Sub CP</SectionTitle>
            <Checkbox
              className="ml-auto text-[11px]"
              checked={subMulti}
              onChange={(e) => setSubMulti(e.target.checked)}
            >
              Use Multi Duration
            </Checkbox>
          </div>
          <Table<TcCpRow>
            size="small"
            bordered
            pagination={false}
            tableLayout="fixed"
            columns={subCpCols}
            dataSource={sub.rows}
            onRow={sub.onRow}
            rowClassName={sel(sub.selectedKey)}
          />
          {subMulti && (
            <RowToolbar
              onAdd={sub.add}
              onDelete={sub.remove}
              onInsertAbove={sub.insertAbove}
              onInsertBelow={sub.insertBelow}
            />
          )}
        </div>
      </section>

      <section className="mb-2">
        <div className="mb-1 flex flex-wrap items-center gap-3">
          <SectionTitle>Port Rotation</SectionTitle>
          <Checkbox
            checked={routingSuez}
            onChange={(event) => setRoutingSuez(event.target.checked)}
            className="text-[11px]"
          >
            SUEZ
          </Checkbox>
          <Checkbox
            checked={routingPanama}
            onChange={(event) => setRoutingPanama(event.target.checked)}
            className="text-[11px]"
          >
            PANAMA
          </Checkbox>
          <Checkbox
            checked={routingKiel}
            onChange={(event) => setRoutingKiel(event.target.checked)}
            className="text-[11px]"
          >
            KIEL
          </Checkbox>
          <span className="text-[11px] font-bold text-gray-700" style={{ marginLeft: "38.6%" }}>
            {tcSummaryText || tcPortSummary}
          </span>
        </div>
        <Table<TcPortRow>
          size="small"
          bordered
          pagination={false}
          tableLayout="fixed"
          columns={portCols}
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
                  {portTotals.idle}
                </Table.Summary.Cell>
                <Table.Summary.Cell index={10} align="center">
                  {portTotals.arrival}
                </Table.Summary.Cell>
                <Table.Summary.Cell index={11} align="center">
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
          <Button size="small" icon={<LineChartOutlined />} onClick={() => setAnalyzerOpen(true)}>
            Analyzer
          </Button>
          <Button size="small" icon={<FileTextOutlined />}>
            Remark
          </Button>
          <div className="ml-auto flex items-center gap-2">
            <Select
              size="small"
              value={timeDisplayUnit}
              onChange={setTimeDisplayUnit}
              style={{ width: 80 }}
              options={[
                { value: "DAYS", label: "Days" },
                { value: "HOURS", label: "Hours" },
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
              <EnvironmentOutlined /> {timezoneDisplayMode === "PORT_LOCAL" ? "Port Local" : "UTC"}
            </span>
            <span
              className="rounded-sm border px-2 py-[1px] text-[11px]"
              style={{ borderColor: VE_COLORS.border }}
            >
              <DesktopOutlined /> PC Time
            </span>
            <Select
              size="small"
              value={timezoneDisplayMode}
              onChange={setTimezoneDisplayMode}
              style={{ width: 130 }}
              options={[
                { value: "PORT_LOCAL", label: "Port local time" },
                { value: "UTC", label: "UTC" },
              ]}
            />
          </div>
        </div>
      </section>

      <TcBottomPanels
        onOpenAnalyzer={() => setAnalyzerOpen(true)}
        onOpenReport={() => setReportOpen(true)}
        onPrintReport={() => {
          setReportOpen(true);
          setReportPrintToken(Date.now());
        }}
        data={bottomPanelData}
        miscRevenueItems={miscRevenueItems}
        otherExpenseItems={otherExpenseItems}
        onMiscRevenueItemsChange={setMiscRevenueItems}
        onOtherExpenseItemsChange={setOtherExpenseItems}
      />
      {analyzerOpen && <AnalyzerApp onClose={() => setAnalyzerOpen(false)} />}
      <TimeCharterReportPreview
        open={reportOpen}
        onClose={() => setReportOpen(false)}
        autoPrintToken={reportPrintToken}
        data={{
          estimateId,
          estimateName: "time-charter1",
          status: "DRAFT",
          auditState,
          vesselId,
          bunkerProfileId,
          performanceMode,
          lookups: { vessels, bunkerProfiles },
          headCpRows: head.rows,
          subCpRows: sub.rows,
          portRows: calculatedPortRows,
          bottomPanelData,
          miscRevenueItems,
          otherExpenseItems,
          summaryText: tcSummaryText,
        }}
      />
    </EstimatorShell>
  );
}

function createCpCols(
  setRows: React.Dispatch<React.SetStateAction<TcCpRow[]>>,
  updateCpRow: (
    setRows: React.Dispatch<React.SetStateAction<TcCpRow[]>>,
    key: string,
    field: keyof TcCpRow,
    value: string,
  ) => void,
): ColumnsType<TcCpRow> {
  const edit =
    (field: keyof TcCpRow, right = false) =>
    (value: string, row: TcCpRow) => (
      <TxtCell
        value={value}
        right={right}
        onChange={(nextValue) => updateCpRow(setRows, row.key, field, nextValue)}
      />
    );

  return [
    {
      title: "Account",
      dataIndex: "account",
      width: "13%",
      render: edit("account"),
    },
    {
      title: "Delivery Port",
      dataIndex: "deliveryPort",
      width: "19%",
      render: (value: string, row) =>
        portEditorWithInfo(value, (nextValue) =>
          updateCpRow(setRows, row.key, "deliveryPort", nextValue),
        ),
    },
    {
      title: "Redelivery Port",
      dataIndex: "redeliveryPort",
      width: "19%",
      render: (value: string, row) =>
        portEditorWithInfo(value, (nextValue) =>
          updateCpRow(setRows, row.key, "redeliveryPort", nextValue),
        ),
    },
    {
      title: "Duration",
      dataIndex: "duration",
      width: "10%",
      align: "right",
      render: edit("duration", true),
    },
    {
      title: "Daily Hire",
      dataIndex: "dailyHire",
      width: "11%",
      align: "right",
      render: edit("dailyHire", true),
    },
    {
      title: "Gross Hire",
      dataIndex: "grossHire",
      width: "12%",
      align: "right",
      render: (value: string) => <YCell value={value} readOnly />,
    },
    {
      title: "Add com",
      dataIndex: "addComm",
      width: "8%",
      align: "right",
      render: edit("addComm", true),
    },
    {
      title: "Brkg",
      dataIndex: "brkg",
      width: "8%",
      align: "right",
      render: edit("brkg", true),
    },
  ];
}

function createPortCols(
  updatePortRow: (key: string, field: keyof TcPortRow, value: string) => void,
): ColumnsType<TcPortRow> {
  const edit =
    (field: keyof TcPortRow, right = false) =>
    (value: string, row: TcPortRow) =>
      isMargin(row) && field !== "sea" && field !== "idle" ? (
        <span className={right ? "block pr-1 text-right" : ""}>{value}</span>
      ) : (
        <TxtCell
          value={value}
          right={right}
          onChange={(nextValue) => updatePortRow(row.key, field, nextValue)}
        />
      );

  return [
    { title: "#", dataIndex: "no", width: "2.6%", align: "center" },
    {
      title: "Type",
      dataIndex: "type",
      width: "9%",
      render: (value: string, row) =>
        isMargin(row) ? (
          <b>{value}</b>
        ) : (
          <SelCell
            value={value}
            options={TC_PORT_TYPES}
            onChange={(nextValue) => updatePortRow(row.key, "type", nextValue)}
          />
        ),
    },
    { title: "Port Name or Coordinates", dataIndex: "port", width: "20%", render: edit("port") },
    {
      title: "Time Zone",
      dataIndex: "timezone",
      width: "7%",
      align: "center",
      render: (value: string) => <YCell value={value} right={false} readOnly />,
    },
    {
      title: "Distance / ECA",
      children: [
        {
          title: "TTL",
          dataIndex: "distance",
          width: "7%",
          align: "right",
          render: (value: string, row) =>
            isDeliveryTimeRow(row)
              ? {
                  children: <DeliveryTimeCell>{deliveryTimeText(row)}</DeliveryTimeCell>,
                  props: { colSpan: 7 },
                }
              : edit("distance", true)(value, row),
        },
        {
          title: "ECA",
          dataIndex: "eca",
          width: "6%",
          align: "right",
          render: (value: string, row) =>
            isDeliveryTimeRow(row)
              ? { children: value, props: { colSpan: 0 } }
              : edit("eca", true)(value, row),
        },
      ],
    },
    {
      title: "W.F",
      dataIndex: "wf",
      width: "7%",
      align: "right",
      render: (value: string, row) =>
        isDeliveryTimeRow(row)
          ? { children: value, props: { colSpan: 0 } }
          : edit("wf", true)(value, row),
    },
    {
      title: "Spd",
      dataIndex: "spd",
      width: "7%",
      align: "right",
      render: (value: string, row) =>
        isDeliveryTimeRow(row) ? (
          { children: value, props: { colSpan: 0 } }
        ) : isMargin(row) ? (
          <span className="block pr-1 text-right">{value}</span>
        ) : (
          <YCell value={value} onChange={(next) => updatePortRow(row.key, "spd", next)} />
        ),
    },
    {
      title: "Sea",
      dataIndex: "sea",
      width: "7%",
      align: "right",
      render: (value: string, row) =>
        isDeliveryTimeRow(row) ? (
          { children: value, props: { colSpan: 0 } }
        ) : isMargin(row) ? (
          <TxtCell
            value={value}
            right
            onChange={(nextValue) => updatePortRow(row.key, "sea", nextValue)}
          />
        ) : (
          <YCell value={value} readOnly />
        ),
    },
    {
      title: "Port (Idle)",
      dataIndex: "idle",
      width: "7.4%",
      align: "right",
      render: (value: string, row) =>
        isDeliveryTimeRow(row)
          ? { children: value, props: { colSpan: 0 } }
          : edit("idle", true)(value, row),
    },
    {
      title: "Arrival",
      dataIndex: "arrival",
      width: "11.5%",
      align: "center",
      render: (value: string, row) =>
        isDeliveryTimeRow(row) ? (
          { children: value, props: { colSpan: 0 } }
        ) : (
          <YCell value={value} right={false} readOnly />
        ),
    },
    {
      title: "Departure",
      dataIndex: "departure",
      width: "11.5%",
      align: "center",
      render: (value: string) => <YCell value={value} right={false} readOnly />,
    },
  ];
}

function DeliveryTimeCell({ children }: { children: string }) {
  return (
    <div
      className="px-1 py-[3px] text-center font-semibold"
      style={{ background: "#DCFCE7", color: VE_COLORS.sectionTitle }}
    >
      {children}
    </div>
  );
}

function calculatePortSchedule(rows: TcPortRow[]): TcPortRow[] {
  let previousDeparture: Date | undefined;
  let previousTimezone = "";
  const scheduledRows = rows.map((row) => {
    const timezone = resolvePortTimezone(row.port) || row.timezone;

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
    const initialDeparture = parseDateTime(row.departure);
    const arrival = previousDeparture
      ? addDays(previousDeparture, (seaDays ?? 0) + timezoneDeltaDays(previousTimezone, timezone))
      : parseDateTime(row.arrival);
    const departure = addDays(arrival, parseAmount(row.idle)) ?? initialDeparture;
    previousDeparture = departure ?? arrival ?? previousDeparture;
    previousTimezone = timezone || previousTimezone;

    return {
      ...row,
      timezone,
      sea: seaDays === undefined ? "" : formatAmount(seaDays, 2),
      arrival: formatDateTime(arrival),
      departure: formatDateTime(departure),
    };
  });

  return scheduledRows;
}

function calculateSeaDays(row: TcPortRow) {
  const ttl = parseAmount(row.distance);
  const eca = parseAmount(row.eca);
  const wf = parseAmount(row.wf);
  const speed = parseAmount(row.spd);
  if (!speed) return undefined;
  return ((ttl + eca) * (1 + wf / 100)) / (speed * 24);
}

function calculatePortTotals(rows: TcPortRow[]) {
  const dataRows = rows.filter((row) => !isMargin(row));
  const marginRow = rows.find(isMargin);
  const distance = sumTextNumbers(dataRows.map((row) => row.distance));
  const eca = sumTextNumbers(dataRows.map((row) => row.eca));
  const sea = sumTextNumbers(rows.map((row) => row.sea));
  const idle = sumTextNumbers(rows.map((row) => row.idle));

  return {
    distance: formatTotal(distance, 0),
    eca: formatTotal(eca, 0),
    sea: formatTotal(sea, 2),
    idle: formatTotal(idle, 2),
    arrival: marginRow?.arrival || firstText(dataRows.map((row) => row.arrival)),
    departure: marginRow?.departure || lastText(dataRows.map((row) => row.departure)),
  };
}

export function buildBottomPanelData(
  headRows: TcCpRow[],
  subRows: TcCpRow[],
  miscRevenueItems: TcMiscItem[],
  otherExpenseItems: TcMiscItem[],
): TcBottomPanelData {
  const head = calculateCpSummary("Head CP", headRows);
  const sub = calculateCpSummary("Sub CP", subRows);
  const miscRevenue = miscRevenueItems.reduce((sum, row) => sum + row.itemAmount, 0);
  const otherExpense = otherExpenseItems.reduce((sum, row) => sum + row.itemAmount, 0);
  const diff = {
    dailyGross: sub.dailyGross - head.dailyGross,
    dailyNet: sub.dailyNet - head.dailyNet,
    totalGross: sub.totalGross - head.totalGross,
    addComm: sub.addComm - head.addComm,
    brokerage: sub.brokerage - head.brokerage,
    totalNet: sub.totalNet - head.totalNet,
  };
  const revenue = sub.totalNet + miscRevenue;
  const expense = head.totalNet + otherExpense;
  const profit = revenue - expense;
  const duration = Math.max(head.durationDays, sub.durationDays);

  return {
    hireRows: [
      formatHireRow("head", "Head CP", head),
      formatHireRow("sub", "Sub CP", sub),
      {
        key: "diff",
        label: "Diff.",
        dailyGross: formatMoney(diff.dailyGross),
        dailyNet: formatMoney(diff.dailyNet),
        totalGross: formatMoney(diff.totalGross),
        addComm: formatMoney(diff.addComm),
        brokerage: formatMoney(diff.brokerage),
        totalNet: formatMoney(diff.totalNet),
      },
    ],
    resultRows: [
      ["Daily Revenue", formatMoney(duration ? revenue / duration : sub.dailyNet)],
      ["Daily Expense", formatMoney(duration ? expense / duration : head.dailyNet)],
      ["Daily Profit", formatMoney(duration ? profit / duration : diff.dailyNet)],
      ["C/Base", formatMoney(head.dailyNet)],
      ["Revenue", formatMoney(revenue)],
      ["Op. Expense", formatMoney(expense)],
      ["Op. Profit", formatMoney(profit)],
      ["Total Hire", formatMoney(head.totalNet)],
      ["Total Expense", formatMoney(expense)],
      ["Profit Rate", revenue ? `${formatMoney((profit / revenue) * 100)} %` : "0.0 %"],
    ],
    others: { income: formatMoney(miscRevenue), expense: formatMoney(otherExpense) },
    resultProfit: formatMoney(profit),
  };
}

function validateTimeCharterForm(headRows: TcCpRow[], subRows: TcCpRow[], portRows: TcPortRow[]) {
  const details: string[] = [];
  validateCpRows("Head CP", headRows, details);
  validateCpRows("Sub CP", subRows, details);

  if (!portRows.some((row) => row.key !== "margin" && row.type.trim())) {
    details.push("Port Rotation: at least one port leg is required.");
  }

  return details;
}

function validateCpRows(label: string, rows: TcCpRow[], details: string[]) {
  const row = rows.find(
    (item) => item.account || item.duration || item.dailyHire || item.grossHire,
  );
  if (!row) {
    details.push(`${label}: charter party row is required.`);
    return;
  }
  if (parseAmount(row.duration) <= 0) {
    details.push(`${label}: Duration must be greater than 0.`);
  }
  if (parseAmount(row.dailyHire) <= 0) {
    details.push(`${label}: Daily Hire must be greater than 0.`);
  }
}

function calculateCpSummary(label: string, rows: TcCpRow[]) {
  const dataRows = rows.filter((row) =>
    Boolean(row.account || row.duration || row.dailyHire || row.grossHire),
  );
  const primary = dataRows[0];
  const totalGross = dataRows.length
    ? dataRows.reduce((total, row) => {
        const rowGross = parseAmount(row.grossHire);
        return total + (rowGross || parseAmount(row.duration) * parseAmount(row.dailyHire));
      }, 0)
    : 0;
  const durationDays = dataRows.length
    ? dataRows.reduce((total, row) => total + parseAmount(row.duration), 0)
    : 0;
  const addCommPct = parseAmount(primary?.addComm);
  const brokeragePct = parseAmount(primary?.brkg);
  const addComm = totalGross * (addCommPct / 100);
  const brokerage = totalGross * (brokeragePct / 100);
  const totalNet = totalGross - addComm - brokerage;
  const dailyGross = durationDays ? totalGross / durationDays : parseAmount(primary?.dailyHire);
  const dailyNet = durationDays ? totalNet / durationDays : 0;

  return {
    label,
    dailyGross,
    dailyNet,
    totalGross,
    addComm,
    brokerage,
    totalNet,
    durationDays,
  };
}

function formatHireRow(key: string, label: string, value: ReturnType<typeof calculateCpSummary>) {
  return {
    key,
    label,
    dailyGross: formatMoney(value.dailyGross),
    dailyNet: formatMoney(value.dailyNet),
    totalGross: formatMoney(value.totalGross),
    addComm: formatMoney(value.addComm),
    brokerage: formatMoney(value.brokerage),
    totalNet: formatMoney(value.totalNet),
  };
}

function sumTextNumbers(values: string[]) {
  return values.reduce((total, value) => total + parseAmount(value), 0);
}

function firstText(values: string[]) {
  return values.find((value) => value.trim()) ?? "";
}

function lastText(values: string[]) {
  return [...values].reverse().find((value) => value.trim()) ?? "";
}

function formatTotal(value: number, digits: number) {
  return value.toLocaleString("en-US", {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  });
}

function formatMoney(value: number) {
  return value.toLocaleString("en-US", {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  });
}

function parseAmount(value: string | undefined) {
  if (!value) return 0;
  const parsed = Number(value.replace(/,/g, "").replace("%", "").trim());
  return Number.isFinite(parsed) ? parsed : 0;
}

function formatAmount(value: number, digits = 1) {
  return value
    ? value.toLocaleString("en-US", {
        minimumFractionDigits: digits,
        maximumFractionDigits: digits,
      })
    : "";
}

function formatPercentInput(value: string) {
  const cleaned = value.replace(/[^0-9.,-]/g, "").replace(",", ".");
  if (!cleaned.trim() || cleaned === "-" || cleaned === ".") return "";
  return `${cleaned} %`;
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
