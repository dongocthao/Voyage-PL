import { useEffect, useMemo, useState } from "react";
import { Button, ConfigProvider, Input, Select, Table } from "antd";
import type { ColumnsType } from "antd/es/table";
import { CalendarOutlined } from "@ant-design/icons";
import DialogShell from "./DialogShell";
import { VE_COLORS, VE_FONT_FAMILY, veTheme } from "./theme";
import { useResizableColumns } from "./useResizableColumns";
import { saveOperationPortActivities } from "@/lib/api/operationPortActivities";

const ACTIVITY_OPTIONS = [
  "End of sea passage",
  "Anchored",
  "Anchor aweigh",
  "All fast (AF)",
  "Start cargo operation",
  "Stop cargo operation",
  "Resume cargo operation",
  "End cargo operation",
  "Unmoored",
  "Start of sea passage",
];

const FILLER_ROW_COUNT = 0;
const ROB_ROWS = [
  { type: "VLSFO", field: "vlsfo" },
  { type: "ULSFO", field: "ulsfo" },
  { type: "MGO", field: "mgo" },
  { type: "MDO", field: "mdo" },
];

const ACTIVITY_TEXT_COLOR = "#172331";
const ACTIVITY_COL_WIDTH = 230;
const AT_COL_WIDTH = 80;
const REMARKS_COL_WIDTH = 288;
const DATE_COL_WIDTH = 115;
const TIME_COL_WIDTH = 72;
const FUEL_COL_WIDTH = 78;
const ACTIVITY_TABLE_WIDTH =
  ACTIVITY_COL_WIDTH + AT_COL_WIDTH + REMARKS_COL_WIDTH + DATE_COL_WIDTH + TIME_COL_WIDTH + FUEL_COL_WIDTH * 4;
const TOP_BLOCK_LEFT = 16;
const TOP_INFO_LABEL_WIDTH = 105;
const TOP_INFO_INPUT_WIDTH = 206;
const TOP_INFO_WIDTH = 340;
const OPERATION_ID_INPUT_WIDTH = 82;
const DATE_INPUT_WIDTH = 128;
const TOP_FIELD_GAP = 8;
const BUNKER_TYPE_WIDTH = 110;
const GRID_LEFT = 13;
const ACTIVITY_TABLE_RIGHT = GRID_LEFT + ACTIVITY_TABLE_WIDTH;
const BUNKER_TABLE_LEFT = TOP_BLOCK_LEFT + TOP_INFO_LABEL_WIDTH + TOP_FIELD_GAP + TOP_INFO_INPUT_WIDTH + 24;
const BUNKER_TABLE_WIDTH = ACTIVITY_TABLE_RIGHT - BUNKER_TABLE_LEFT;
const BUNKER_NUM_WIDTH = (BUNKER_TABLE_WIDTH - BUNKER_TYPE_WIDTH) / 8;
const DIALOG_WIDTH = ACTIVITY_TABLE_WIDTH + GRID_LEFT * 2;
const TOP_SECTION_HEIGHT = 198;
const TOP_INFO_TOP = 18;
const BUNKER_TABLE_TOP = 8;
const FOOTER_LEFT = 26;
const BUTTON_WIDTH = 100;
const BUTTON_GAP = 24;
const BUTTON_GROUP_WIDTH = BUTTON_WIDTH * 3 + BUTTON_GAP * 2;
const BUTTON_GROUP_LEFT = ACTIVITY_TABLE_RIGHT - BUTTON_GROUP_WIDTH - 70;
const GRID_TOP_MARGIN = 10;
const FOOTER_TOP_MARGIN = 18;

type ActivityRow = {
  key: string;
  activity: string;
  at: string;
  remark: string;
  date: string;
  time: string;
  vlsfo: string;
  ulsfo: string;
  mgo: string;
  mdo: string;
  filler?: boolean;
};

type FuelField = "vlsfo" | "ulsfo" | "mgo" | "mdo";

type BunkerConsumptionRow = {
  type: string;
  robArrv: number;
  channel: number;
  portWorking: number;
  portIdle: number;
  margin: number;
  portCons: number;
  received: number;
  robDep: number;
};

export type PortActivitySummary = {
  channelDays: number;
  portWorkingDays: number;
  portIdleDays: number;
  portMarginDay: number;
  portStayDuration: number;
  arrival: string;
  departure: string;
};

export function PortActivitiesDialog({
  operationId,
  portRotationId,
  portName,
  previousPortName,
  functionName,
  vesselName,
  voyageNo,
  gmtOffset,
  arrival,
  departure,
  portMarginDay,
  onApplySummary,
  onClose,
}: {
  operationId?: string;
  portRotationId: number;
  portName: string;
  previousPortName?: string;
  functionName?: string;
  vesselName?: string;
  voyageNo?: string;
  gmtOffset?: string;
  arrival?: string;
  departure?: string;
  portMarginDay?: number;
  onApplySummary?: (summary: PortActivitySummary) => void;
  onClose: () => void;
}) {
  const [rows, setRows] = useState<ActivityRow[]>(() =>
    buildInitialRows(arrival, departure),
  );
  const [arrivalDraftFwd, setArrivalDraftFwd] = useState("0.00");
  const [arrivalDraftAft, setArrivalDraftAft] = useState("0.00");
  const [departureDraftFwd, setDepartureDraftFwd] = useState("0.00");
  const [departureDraftAft, setDepartureDraftAft] = useState("0.00");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("Ready");
  const arrivalValue = useMemo(
    () => getActivityDateTime(rows, "End of sea passage"),
    [rows],
  );
  const departureValue = useMemo(
    () => getActivityDateTime(rows, "Start of sea passage"),
    [rows],
  );
  const summary = useMemo(
    () => calculatePortActivitySummary(rows, portMarginDay ?? 0, arrivalValue, departureValue),
    [arrivalValue, departureValue, portMarginDay, rows],
  );
  const bunkerSummary = useMemo(
    () => calculateBunkerConsumption(rows, portMarginDay ?? 0),
    [portMarginDay, rows],
  );
  const displayRows = useMemo(() => withFillerRows(rows), [rows]);
  const currentSignature = useMemo(
    () =>
      JSON.stringify({
        rows,
        arrivalDraftFwd,
        arrivalDraftAft,
        departureDraftFwd,
        departureDraftAft,
      }),
    [arrivalDraftAft, arrivalDraftFwd, departureDraftAft, departureDraftFwd, rows],
  );
  const [cleanSignature, setCleanSignature] = useState("");
  const isDirty = cleanSignature !== "" && currentSignature !== cleanSignature;

  useEffect(() => {
    if (cleanSignature) return;
    setCleanSignature(currentSignature);
  }, [cleanSignature, currentSignature]);

  const updateRow = (key: string, patch: Partial<ActivityRow>) => {
    setRows((current) => current.map((row) => (row.key === key ? { ...row, ...patch } : row)));
  };

  const requestClose = () => {
    if (!isDirty || window.confirm("Discard unsaved changes in Port Activities?")) {
      onClose();
    }
  };

  const sortActivities = () => {
    setRows((current) =>
      [...current].sort((a, b) => {
        const left = getEventTime(a)?.getTime() ?? Number.MAX_SAFE_INTEGER;
        const right = getEventTime(b)?.getTime() ?? Number.MAX_SAFE_INTEGER;
        return left - right;
      }),
    );
  };

  const handleSave = async () => {
    if (!operationId) {
      setMessage("Save Operation first before saving Port Activities.");
      return;
    }

    const validationError = validatePortActivities({
      rows,
      arrivalDraftFwd,
      arrivalDraftAft,
      departureDraftFwd,
      departureDraftAft,
    });
    if (validationError) {
      setMessage(validationError);
      return;
    }

    setSaving(true);
    try {
      await saveOperationPortActivities({
        operationId,
        portRotationId,
        portName,
        channelDays: summary.channelDays,
        portWorkingDays: summary.portWorkingDays,
        portIdleDays: summary.portIdleDays,
        portMarginDay: summary.portMarginDay,
        portStayDuration: summary.portStayDuration,
      });
      onApplySummary?.(summary);
      setCleanSignature(currentSignature);
      setMessage("Saved Port Activities.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Failed to save Port Activities.");
    } finally {
      setSaving(false);
    }
  };

  const columns: ColumnsType<ActivityRow> = [
    {
      title: "Activity",
      dataIndex: "activity",
      width: ACTIVITY_COL_WIDTH,
      render: (value: string, record) =>
        record.filler ? null : (
          <Select
            size="small"
            value={value}
            options={ACTIVITY_OPTIONS.map((activity) => ({ value: activity, label: activity }))}
            onChange={(activity) => updateRow(record.key, { activity })}
            style={{ width: "100%" }}
          />
        ),
    },
    {
      title: "AT",
      dataIndex: "at",
      width: AT_COL_WIDTH,
      render: (value: string, record) =>
        record.filler ? null : (
          <Input size="small" value={value} onChange={(event) => updateRow(record.key, { at: event.target.value })} />
        ),
    },
    {
      title: "Remarks",
      dataIndex: "remark",
      width: REMARKS_COL_WIDTH,
      render: (value: string, record) =>
        record.filler ? null : (
          <Input size="small" value={value} onChange={(event) => updateRow(record.key, { remark: event.target.value })} />
        ),
    },
    {
      title: "Date From",
      dataIndex: "date",
      width: DATE_COL_WIDTH,
      render: (value: string, record) =>
        record.filler ? null : (
          <Input size="small" value={value} onChange={(event) => updateRow(record.key, { date: event.target.value })} />
        ),
    },
    {
      title: "Time",
      dataIndex: "time",
      width: TIME_COL_WIDTH,
      render: (value: string, record) =>
        record.filler ? null : (
          <Input size="small" value={value} onChange={(event) => updateRow(record.key, { time: event.target.value })} />
        ),
    },
    ...(["vlsfo", "ulsfo", "mgo", "mdo"] as const).map((fuel) => ({
      title: fuel.toUpperCase(),
      dataIndex: fuel,
      width: FUEL_COL_WIDTH,
      align: "right" as const,
      render: (value: string, record: ActivityRow) =>
        record.filler ? null : (
          <Input
            size="small"
            value={value}
            onChange={(event) => updateRow(record.key, { [fuel]: event.target.value })}
            style={{ textAlign: "right" }}
          />
        ),
    })),
  ];
  const resizableColumns = useResizableColumns(columns);

  return (
    <DialogShell
      title="Port Activities"
      icon={<CalendarOutlined />}
      width={DIALOG_WIDTH}
      bodyPadding={0}
      onClose={requestClose}
      actions={[]}
    >
      <ConfigProvider theme={veTheme}>
        <div className="port-activities-dialog" style={{ color: ACTIVITY_TEXT_COLOR, fontFamily: VE_FONT_FAMILY, fontSize: 11 }}>
          <style>
            {`
              .port-activities-dialog .ant-table-thead > tr > th {
                height: 36px !important;
                padding: 4px 6px !important;
                border-inline-end: 1px solid #cbd8e2 !important;
                color: ${ACTIVITY_TEXT_COLOR} !important;
                background: #dbeaf1 !important;
              }
              .port-activities-dialog .ant-table-tbody > tr > td {
                padding: 2px 4px !important;
                border-inline-end: 1px solid #d8e2ea !important;
                border-bottom: 1px solid #d8e2ea !important;
                color: ${ACTIVITY_TEXT_COLOR} !important;
              }
              .port-activities-dialog .ant-input,
              .port-activities-dialog .ant-select-selector,
              .port-activities-dialog .ant-btn {
                border-radius: 0 !important;
                font-size: 11px !important;
                color: ${ACTIVITY_TEXT_COLOR} !important;
              }
              .port-activities-dialog .activity-grid .ant-input,
              .port-activities-dialog .activity-grid .ant-select-selector {
                border-color: transparent !important;
                box-shadow: none !important;
                background: transparent !important;
              }
              .port-activities-dialog .activity-grid .ant-select-arrow {
                color: ${ACTIVITY_TEXT_COLOR} !important;
              }
              .port-activities-dialog .activity-grid .ant-table,
              .port-activities-dialog .activity-grid .ant-table-container,
              .port-activities-dialog .activity-grid .ant-table-content {
                width: fit-content !important;
              }
              .port-activities-dialog .activity-grid table {
                width: auto !important;
                min-width: ${ACTIVITY_TABLE_WIDTH}px !important;
              }
              .port-activities-dialog .activity-grid .ant-table-summary > tr > td {
                border: 1px solid #cbd8e2 !important;
                padding: 9px 32px !important;
                color: ${VE_COLORS.sectionTitle} !important;
                font-size: 11px !important;
                font-weight: 600 !important;
              }
              .port-activities-dialog .ant-table-tbody > tr > td {
                height: 31px !important;
              }
            `}
          </style>

          <div className="relative" style={{ height: TOP_SECTION_HEIGHT }}>
            <div className="absolute" style={{ left: TOP_BLOCK_LEFT, top: TOP_INFO_TOP, width: TOP_INFO_WIDTH }}>
              <div className="grid gap-[7px]">
                <div
                  className="grid items-center gap-2"
                  style={{ gridTemplateColumns: `${TOP_INFO_LABEL_WIDTH}px ${OPERATION_ID_INPUT_WIDTH}px` }}
                >
                  <div className="text-right">Operation ID:</div>
                  <Input size="small" value={operationId ?? ""} readOnly />
                </div>
                <InfoField label="Prev Port" value={previousPortName ?? ""} labelWidth={TOP_INFO_LABEL_WIDTH} inputWidth={TOP_INFO_INPUT_WIDTH} />
                <InfoField label="Curr Port" value={portName} labelWidth={TOP_INFO_LABEL_WIDTH} inputWidth={TOP_INFO_INPUT_WIDTH} />
                <InfoField label="Function" value={functionName ?? ""} labelWidth={TOP_INFO_LABEL_WIDTH} inputWidth={TOP_INFO_INPUT_WIDTH} />
                <div className="grid items-center gap-2" style={{ gridTemplateColumns: `${TOP_INFO_LABEL_WIDTH}px ${DATE_INPUT_WIDTH}px 70px` }}>
                <div className="text-right">Arrival</div>
                  <Input size="small" value={formatDisplayDateTime(arrivalValue)} readOnly style={{ textAlign: "right" }} />
                  <Input size="small" value={gmtOffset ?? ""} readOnly style={{ textAlign: "right" }} />
                </div>
                <div className="grid items-center gap-2" style={{ gridTemplateColumns: `${TOP_INFO_LABEL_WIDTH}px ${DATE_INPUT_WIDTH}px 70px` }}>
                  <div className="text-right">Departure</div>
                  <Input size="small" value={formatDisplayDateTime(departureValue)} readOnly style={{ textAlign: "right" }} />
                  <Input size="small" value={gmtOffset ?? ""} readOnly style={{ textAlign: "right" }} />
                </div>
              </div>
            </div>

            <div className="absolute" style={{ left: BUNKER_TABLE_LEFT, top: BUNKER_TABLE_TOP, width: BUNKER_TABLE_WIDTH }}>
              <RobSummaryGrid summary={bunkerSummary} />
            </div>
          </div>

          <div className="activity-grid" style={{ marginLeft: GRID_LEFT, marginTop: GRID_TOP_MARGIN, width: ACTIVITY_TABLE_WIDTH }}>
            <ActivityGridTopbar
              vesselName={vesselName}
              voyageNo={voyageNo}
              onSort={sortActivities}
            />
            <Table<ActivityRow>
              size="small"
              columns={resizableColumns}
              dataSource={displayRows}
              bordered
              pagination={false}
              tableLayout="fixed"
              summary={() => (
                <Table.Summary.Row>
                  <Table.Summary.Cell index={0} colSpan={9}>
                    {formatSummary(summary)}
                  </Table.Summary.Cell>
                </Table.Summary.Row>
              )}
            />
          </div>

          <div className="flex items-start" style={{ marginLeft: FOOTER_LEFT, marginTop: FOOTER_TOP_MARGIN, marginBottom: 30 }}>
            <div className="grid gap-[6px]">
              <InfoField label="Arrival Draft Fwd (m)" value={arrivalDraftFwd} onChange={setArrivalDraftFwd} labelWidth={135} inputWidth={74} right />
              <InfoField label="Arrival Draft Aft (m)" value={arrivalDraftAft} onChange={setArrivalDraftAft} labelWidth={135} inputWidth={74} right />
            </div>
            <div className="ml-[28px] grid gap-[6px]">
              <InfoField label="Departure Draft Fwd (m)" value={departureDraftFwd} onChange={setDepartureDraftFwd} labelWidth={150} inputWidth={74} right />
              <InfoField label="Departure Draft Aft (m)" value={departureDraftAft} onChange={setDepartureDraftAft} labelWidth={150} inputWidth={74} right />
            </div>
            <div className="flex" style={{ gap: BUTTON_GAP, marginLeft: BUTTON_GROUP_LEFT - FOOTER_LEFT - 135 - 74 - 28 - 150 - 74 }}>
              <Button loading={saving} onClick={() => void handleSave()} style={{ width: BUTTON_WIDTH }}>
                Save
              </Button>
              <Button onClick={requestClose} style={{ width: BUTTON_WIDTH }}>
                Cancel
              </Button>
              <Button onClick={requestClose} style={{ width: BUTTON_WIDTH }}>
                Close
              </Button>
            </div>
          </div>
          {message !== "Ready" ? <div className="mt-2 px-6 text-[11px] text-[#6d7a86]">{message}</div> : null}
        </div>
      </ConfigProvider>
    </DialogShell>
  );
}

export function calculatePortActivitySummary(
  rows: ActivityRow[],
  portMarginDay = 0,
  arrival = "",
  departure = "",
): PortActivitySummary {
  const totals = {
    channelDays: 0,
    portWorkingDays: 0,
    portIdleDays: 0,
    portMarginDay,
    portStayDuration: 0,
    arrival,
    departure,
  };
  const sorted = [...rows]
    .map((row) => ({ row, time: getEventTime(row) }))
    .filter((item): item is { row: ActivityRow; time: Date } => Boolean(item.time))
    .sort((a, b) => a.time.getTime() - b.time.getTime());

  for (let index = 0; index < sorted.length - 1; index += 1) {
    const current = normalizeActivity(sorted[index].row.activity);
    const next = normalizeActivity(sorted[index + 1].row.activity);
    const days = diffDays(sorted[index].time, sorted[index + 1].time);
    const bucket = classifyActivitySpan(current, next);
    if (bucket === "channel") totals.channelDays += days;
    if (bucket === "working") totals.portWorkingDays += days;
    if (bucket === "idle") totals.portIdleDays += days;
  }

  totals.channelDays = roundDays(totals.channelDays);
  totals.portWorkingDays = roundDays(totals.portWorkingDays);
  totals.portIdleDays = roundDays(totals.portIdleDays);
  totals.portMarginDay = roundDays(totals.portMarginDay);
  totals.portStayDuration = roundDays(
    totals.channelDays + totals.portWorkingDays + totals.portIdleDays + totals.portMarginDay,
  );
  return totals;
}

function classifyActivitySpan(current: string, next: string) {
  if (current === "END OF SEA PASSAGE" && next === "ANCHORED") return "channel";
  if (current === "ANCHORED" && next === "ANCHOR AWEIGH") return "idle";
  if (current === "ANCHOR AWEIGH" && next === "ALL FAST") return "channel";
  if (current === "ALL FAST" && next === "START CARGO OPERATION") return "idle";
  if (current === "START CARGO OPERATION" && next === "STOP CARGO OPERATION") return "working";
  if (current === "STOP CARGO OPERATION" && next === "RESUME CARGO OPERATION") return "idle";
  if (current === "RESUME CARGO OPERATION" && next === "END CARGO OPERATION") return "working";
  if (current === "START CARGO OPERATION" && next === "END CARGO OPERATION") return "working";
  if (current === "END CARGO OPERATION" && next === "UNMOORED") return "idle";
  if (current === "UNMOORED" && next === "START SEA PASSAGE") return "channel";
  if (current === "UNMOORED" && next === "START OF SEA PASSAGE") return "channel";
  if (current === "UNMOORED" && next === "ANCHORED") return "channel";
  return undefined;
}

function buildInitialRows(arrival?: string, departure?: string): ActivityRow[] {
  const arrivalParts = splitDateTime(arrival);
  const departureParts = splitDateTime(departure);
  return ACTIVITY_OPTIONS.map((activity, index) => ({
    key: String(index + 1),
    activity,
    at: defaultAt(activity),
    remark: defaultRemark(activity),
    date: index === 0 ? arrivalParts.date : index === ACTIVITY_OPTIONS.length - 1 ? departureParts.date : "",
    time: index === 0 ? arrivalParts.time : index === ACTIVITY_OPTIONS.length - 1 ? departureParts.time : "00:00",
    vlsfo: "",
    ulsfo: "",
    mgo: "",
    mdo: "",
  }));
}

function defaultAt(activity: string) {
  if (activity === "All fast (AF)") return "AF";
  if (activity === "End cargo operation") return "OE";
  if (activity === "Start of sea passage") return "PE";
  if (activity.toLowerCase().includes("cargo")) return "OS";
  if (activity === "End of sea passage") return "PS";
  return "NM";
}

function defaultRemark(activity: string) {
  if (activity === "Anchored") return "REASON:";
  if (activity === "All fast (AF)") return "BERTH:";
  if (activity === "Start cargo operation") return "CARGO:";
  return "";
}

function splitDateTime(value?: string) {
  const match = value?.match(/^(\d{4}-\d{2}-\d{2})\s+(\d{2}:\d{2})/);
  return { date: match?.[1] ? formatDateForInput(match[1]) : "", time: match?.[2] ?? "00:00" };
}

function getEventTime(row: ActivityRow) {
  if (!row.date || !row.time) return undefined;
  const normalizedTime = row.time.length === 5 ? row.time : row.time.slice(0, 5);
  const isoValue = normalizeDateForParse(row.date);
  const isoDate = new Date(`${isoValue}T${normalizedTime}:00`);
  if (!Number.isNaN(isoDate.getTime())) return isoDate;
  const looseDate = new Date(`${row.date} ${normalizedTime}`);
  return Number.isNaN(looseDate.getTime()) ? undefined : looseDate;
}

function diffDays(start: Date, end: Date) {
  return Math.max(0, (end.getTime() - start.getTime()) / 86_400_000);
}

function roundDays(value: number) {
  return Math.round(value * 100) / 100;
}

function normalizeActivity(value: string) {
  return value.replace(/\s*\([^)]*\)\s*/g, " ").replace(/\s+/g, " ").trim().toUpperCase();
}

function formatSummary(summary: PortActivitySummary) {
  return `Port Stay : ${formatDays(summary.portStayDuration)} days (Channel : ${formatDays(summary.channelDays)} days, Port Working : ${formatDays(summary.portWorkingDays)} days, Port Idle : ${formatDays(summary.portIdleDays)} days, Port Margin : ${formatDays(summary.portMarginDay)} days)`;
}

function formatDays(value: number) {
  return value.toFixed(2);
}

function withFillerRows(rows: ActivityRow[]) {
  const fillers: ActivityRow[] = Array.from({ length: FILLER_ROW_COUNT }, (_, index) => ({
    key: `filler-${index + 1}`,
    activity: "",
    at: "",
    remark: "",
    date: "",
    time: "",
    vlsfo: "",
    ulsfo: "",
    mgo: "",
    mdo: "",
    filler: true,
  }));
  return [...rows, ...fillers];
}

function InfoField({
  label,
  value,
  labelWidth = 70,
  inputWidth = 225,
  right,
  onChange,
}: {
  label: string;
  value: string;
  labelWidth?: number;
  inputWidth?: number;
  right?: boolean;
  onChange?: (value: string) => void;
}) {
  return (
    <div className="grid items-center gap-2" style={{ gridTemplateColumns: `${labelWidth}px ${inputWidth}px` }}>
      <div className="text-right">{label}</div>
      <Input
        size="small"
        value={value}
        readOnly={!onChange}
        onChange={onChange ? (event) => onChange(event.target.value) : undefined}
        style={{ textAlign: right ? "right" : "left" }}
      />
    </div>
  );
}

function ActivityGridTopbar({
  vesselName,
  voyageNo,
  onSort,
}: {
  vesselName?: string;
  voyageNo?: string;
  onSort: () => void;
}) {
  return (
    <div
      className="grid border border-b-0 bg-[#e9edf2]"
      style={{
        borderColor: "#cbd8e2",
        gridTemplateColumns: `${ACTIVITY_COL_WIDTH + AT_COL_WIDTH + REMARKS_COL_WIDTH}px ${DATE_COL_WIDTH}px ${TIME_COL_WIDTH}px ${FUEL_COL_WIDTH * 4}px`,
        height: 35,
      }}
    >
      <div className="px-2 font-semibold leading-[35px]">
        MV {vesselName || ""} , Voy No. {voyageNo || ""}
      </div>
      <div className="flex items-center border-l px-1" style={{ borderColor: "#cbd8e2" }}>
        <Button size="small" onClick={onSort}>
          Sort Activities
        </Button>
      </div>
      <div className="border-l" style={{ borderColor: "#cbd8e2" }} />
      <div className="border-l bg-[#dbeaf1] text-center font-semibold leading-[35px]" style={{ borderColor: "#cbd8e2", color: VE_COLORS.sectionTitle }}>
        Bunker Quantity ROB
      </div>
    </div>
  );
}

function RobSummaryGrid({ summary }: { summary: BunkerConsumptionRow[] }) {
  return (
    <table className="table-fixed border-collapse text-[11px]" style={{ width: BUNKER_TABLE_WIDTH }}>
      <colgroup>
        <col style={{ width: BUNKER_TYPE_WIDTH }} />
        {Array.from({ length: 8 }, (_, index) => (
          <col key={index} style={{ width: BUNKER_NUM_WIDTH }} />
        ))}
      </colgroup>
      <thead>
        <tr className="bg-[#e9edf2]">
          {["Type", "ROB Arr", "Channel", "Working", "Idle", "Margin", "Port Cons", "Received", "ROB Dep"].map((header) => (
            <th key={header} className="h-[58px] border border-[#cbd8e2] px-1 py-[6px] text-right first:text-left">
              {header}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {summary.map((row) => (
          <tr key={row.type}>
            <td className="border border-[#cbd8e2] px-1 py-[5px]">{row.type}</td>
            <td className="border border-[#cbd8e2] px-1 py-[5px] text-right">{formatRobDays(row.robArrv)}</td>
            <td className="border border-[#cbd8e2] px-1 py-[5px] text-right">{formatRobDays(row.channel)}</td>
            <td className="border border-[#cbd8e2] px-1 py-[5px] text-right">{formatRobDays(row.portWorking)}</td>
            <td className="border border-[#cbd8e2] px-1 py-[5px] text-right">{formatRobDays(row.portIdle)}</td>
            <td className="border border-[#cbd8e2] px-1 py-[5px] text-right">{formatRobDays(row.margin)}</td>
            <td className="border border-[#cbd8e2] px-1 py-[5px] text-right">{formatRobDays(row.portCons)}</td>
            <td className="border border-[#cbd8e2] px-1 py-[5px] text-right">{formatRobDays(row.received)}</td>
            <td className="border border-[#cbd8e2] px-1 py-[5px] text-right">{formatRobDays(row.robDep)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function formatRotation(portRotationId: number) {
  return Number.isFinite(portRotationId) ? String(Math.trunc(portRotationId)) : "";
}

function formatDisplayDateTime(value?: string) {
  if (!value) return "";
  const parts = splitDateTime(value);
  return parts.date ? `${parts.date} ${parts.time}` : value;
}

function formatRobDays(value: number) {
  return value.toFixed(3);
}

function formatDateForInput(value: string) {
  const match = value.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  return match ? `${match[3]}/${match[2]}/${match[1]}` : value;
}

function normalizeDateForParse(value: string) {
  const dmy = value.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (dmy) return `${dmy[3]}-${dmy[2]}-${dmy[1]}`;
  return value;
}

function calculateBunkerConsumption(rows: ActivityRow[], portMarginDay: number): BunkerConsumptionRow[] {
  return ROB_ROWS.map(({ type, field }) => {
    const fuel = field as FuelField;
    const robArrv = getRob(rows, "END OF SEA PASSAGE", fuel);
    const channel =
      consumptionBetween(rows, "ANCHOR AWEIGH", "ALL FAST", fuel) +
      consumptionBetween(rows, "UNMOORED", "START OF SEA PASSAGE", fuel);
    const cargoTotal = consumptionBetween(rows, "START CARGO OPERATION", "END CARGO OPERATION", fuel);
    const stoppedTotal = consumptionBetween(rows, "STOP CARGO OPERATION", "RESUME CARGO OPERATION", fuel);
    const portWorking = Math.max(0, cargoTotal - stoppedTotal);
    const portIdle =
      consumptionBetween(rows, "ANCHORED", "ANCHOR AWEIGH", fuel) +
      consumptionBetween(rows, "ALL FAST", "START CARGO OPERATION", fuel) +
      consumptionBetween(rows, "END CARGO OPERATION", "UNMOORED", fuel);
    const margin = portMarginDay > 0 ? 0 : 0;
    const portCons = channel + portWorking + portIdle + margin;
    const received = 0;
    const robDep = Math.max(0, robArrv + received - portCons);
    return {
      type,
      robArrv,
      channel,
      portWorking,
      portIdle,
      margin,
      portCons,
      received,
      robDep,
    };
  });
}

function getActivityDateTime(rows: ActivityRow[], activity: string) {
  const row = rows.find((item) => normalizeActivity(item.activity) === normalizeActivity(activity));
  if (!row) return "";
  return buildOperationDateTime(row.date, row.time);
}

function buildOperationDateTime(date: string, time: string) {
  if (!date || !time) return "";
  const normalizedDate = normalizeDateForParse(date);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(normalizedDate)) return "";
  const normalizedTime = normalizeTimeInput(time);
  if (!normalizedTime) return "";
  return `${normalizedDate} ${normalizedTime}`;
}

function normalizeTimeInput(value: string) {
  const match = value.match(/^(\d{2}):(\d{2})$/);
  if (!match) return "";
  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59) return "";
  return `${match[1]}:${match[2]}`;
}

function validatePortActivities({
  rows,
  arrivalDraftFwd,
  arrivalDraftAft,
  departureDraftFwd,
  departureDraftAft,
}: {
  rows: ActivityRow[];
  arrivalDraftFwd: string;
  arrivalDraftAft: string;
  departureDraftFwd: string;
  departureDraftAft: string;
}) {
  const activityOrder = new Map(
    ACTIVITY_OPTIONS.map((activity, index) => [normalizeActivity(activity), index]),
  );
  const seenActivities = new Set<string>();
  const filledRows: Array<{ row: ActivityRow; time: Date; order: number }> = [];

  for (const row of rows) {
    if (!row.date && !row.time) continue;
    if (!row.date || !row.time) {
      return `Please enter both Date From and Time for "${row.activity}".`;
    }
    if (!isValidDisplayDate(row.date)) {
      return `Invalid date format for "${row.activity}". Use dd/mm/yyyy.`;
    }
    if (!normalizeTimeInput(row.time)) {
      return `Invalid time format for "${row.activity}". Use hh:mm.`;
    }

    const normalizedActivity = normalizeActivity(row.activity);
    if (seenActivities.has(normalizedActivity)) {
      return `Activity "${row.activity}" is duplicated.`;
    }
    seenActivities.add(normalizedActivity);

    const eventTime = getEventTime(row);
    if (!eventTime) {
      return `Invalid date/time value for "${row.activity}".`;
    }

    filledRows.push({
      row,
      time: eventTime,
      order: activityOrder.get(normalizedActivity) ?? Number.MAX_SAFE_INTEGER,
    });
  }

  const arrivalTime = filledRows.find((item) => normalizeActivity(item.row.activity) === normalizeActivity("End of sea passage"));
  const departureTime = filledRows.find((item) => normalizeActivity(item.row.activity) === normalizeActivity("Start of sea passage"));
  if (!arrivalTime) return 'Please enter date/time for "End of sea passage".';
  if (!departureTime) return 'Please enter date/time for "Start of sea passage".';
  if (departureTime.time.getTime() < arrivalTime.time.getTime()) {
    return "Departure must not be earlier than Arrival.";
  }

  const sortedByTime = [...filledRows].sort((a, b) => a.time.getTime() - b.time.getTime());
  for (let index = 1; index < sortedByTime.length; index += 1) {
    const previous = sortedByTime[index - 1];
    const current = sortedByTime[index];
    if (current.order < previous.order) {
      return `"${current.row.activity}" cannot happen before "${previous.row.activity}".`;
    }
  }

  const stopExists = seenActivities.has(normalizeActivity("Stop cargo operation"));
  const resumeExists = seenActivities.has(normalizeActivity("Resume cargo operation"));
  if (resumeExists && !stopExists) {
    return 'Please enter "Stop cargo operation" before "Resume cargo operation".';
  }

  const arrivalDraftError = validateDraftPair("Arrival", arrivalDraftFwd, arrivalDraftAft);
  if (arrivalDraftError) return arrivalDraftError;
  const departureDraftError = validateDraftPair("Departure", departureDraftFwd, departureDraftAft);
  if (departureDraftError) return departureDraftError;

  return "";
}

function validateDraftPair(label: string, forward: string, aft: string) {
  const fwd = parseDraftValue(forward);
  const aftValue = parseDraftValue(aft);
  if (fwd == null || aftValue == null) {
    return `${label} Draft must be a valid number.`;
  }
  if (fwd > aftValue) {
    return `${label} Draft Fwd cannot be greater than Draft Aft.`;
  }
  return "";
}

function parseDraftValue(value: string) {
  const amount = Number(String(value).trim().replace(/,/g, ""));
  return Number.isFinite(amount) ? amount : null;
}

function isValidDisplayDate(value: string) {
  const match = value.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (!match) return false;
  const day = Number(match[1]);
  const month = Number(match[2]);
  const year = Number(match[3]);
  const date = new Date(year, month - 1, day);
  return (
    date.getFullYear() === year &&
    date.getMonth() === month - 1 &&
    date.getDate() === day
  );
}

function consumptionBetween(rows: ActivityRow[], startActivity: string, endActivity: string, fuel: FuelField) {
  const start = getRob(rows, startActivity, fuel);
  const end = getRob(rows, endActivity, fuel);
  if (start === 0 && end === 0) return 0;
  return Math.max(0, start - end);
}

function getRob(rows: ActivityRow[], activity: string, fuel: FuelField) {
  const row = rows.find((item) => normalizeActivity(item.activity) === normalizeActivity(activity));
  return parseAmount(row?.[fuel] ?? "");
}

function parseAmount(value: string) {
  const amount = Number(String(value).replace(/,/g, ""));
  return Number.isFinite(amount) ? amount : 0;
}

export default PortActivitiesDialog;
