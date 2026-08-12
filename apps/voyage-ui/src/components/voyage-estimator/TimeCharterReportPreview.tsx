import { useEffect, useMemo, useRef } from "react";
import { Button, Modal } from "antd";
import { PrinterOutlined } from "@ant-design/icons";
import { REPORT_STYLES, printReportNode } from "./VoyageReportPreview";
import { VE_COLORS } from "./theme";
import { fuelMainData, fuelSubData, speedData, vesselData, type FuelMainRow, type FuelSubRow } from "./mockData";
import type { LookupItem } from "@/lib/api/masterData";
import type { TcBottomPanelData, TcMiscItem } from "./TcBottomPanels";
import type { TcCpRow, TcPortRow } from "./timeCharterData";

type AuditState = { updatedAt?: string; updatedBy?: string };
type PerformanceMode = "FULL" | "ECO" | "CUSTOM1" | "CUSTOM2" | "CUSTOM3";

export type TimeCharterReportData = {
  estimateId?: string;
  estimateName?: string;
  status?: string;
  auditState?: AuditState;
  vesselId?: string;
  bunkerProfileId?: string;
  performanceMode?: PerformanceMode;
  lookups: {
    vessels: LookupItem[];
    bunkerProfiles: LookupItem[];
  };
  headCpRows: TcCpRow[];
  subCpRows: TcCpRow[];
  portRows: TcPortRow[];
  bottomPanelData: TcBottomPanelData;
  miscRevenueItems?: TcMiscItem[];
  otherExpenseItems?: TcMiscItem[];
  summaryText?: string;
};

function formatDateTime(value?: string) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${pad(date.getDate())}/${pad(date.getMonth() + 1)}/${date.getFullYear()} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function hasPortValue(row: TcPortRow) {
  return Boolean(row.type?.trim() || row.port?.trim() || row.arrival?.trim() || row.departure?.trim());
}

function buildFuelRows(profile: LookupItem | undefined, performanceMode: string | undefined) {
  const mode = profile?.modes?.find((item) => item.mode === performanceMode) ?? profile?.modes?.[0];
  const pick = (
    fuelRole: "MAIN" | "SUB",
    condition: "NORMAL" | "ECA",
    activity: "BALLAST" | "LADEN" | "IDLE" | "WORK" | "SEA",
  ) =>
    mode?.consumption.find(
      (item) =>
        item.fuelRole === fuelRole && item.condition === condition && item.activity === activity,
    );
  const fuelCode = (fuelRole: "MAIN" | "SUB", condition: "NORMAL" | "ECA") =>
    mode?.consumption.find((item) => item.fuelRole === fuelRole && item.condition === condition)
      ?.fuelCode ?? "";

  return {
    main: mode
      ? (["NORMAL", "ECA"] as const).map((condition) => ({
          label: condition === "NORMAL" ? "Normal" : "ECA",
          type: fuelCode("MAIN", condition),
          ballast: formatNumber(pick("MAIN", condition, "BALLAST")?.consumptionMtDay ?? 0, 2),
          laden: formatNumber(pick("MAIN", condition, "LADEN")?.consumptionMtDay ?? 0, 2),
          idle: formatNumber(pick("MAIN", condition, "IDLE")?.consumptionMtDay ?? 0, 2),
          work: formatNumber(pick("MAIN", condition, "WORK")?.consumptionMtDay ?? 0, 2),
        }))
      : fuelMainData.map((row) => ({ label: row.main, type: row.type, ballast: row.ballast, laden: row.laden, idle: row.idle, work: row.work })),
    sub: mode
      ? (["NORMAL", "ECA"] as const).map((condition) => ({
          label: condition === "NORMAL" ? "Normal" : "ECA",
          type: fuelCode("SUB", condition),
          sea: formatNumber(pick("SUB", condition, "SEA")?.consumptionMtDay ?? 0, 2),
          idle: formatNumber(pick("SUB", condition, "IDLE")?.consumptionMtDay ?? 0, 2),
          work: formatNumber(pick("SUB", condition, "WORK")?.consumptionMtDay ?? 0, 2),
        }))
      : fuelSubData.map((row) => ({ label: row.sub, type: row.type, sea: row.sea, idle: row.idle, work: row.work })),
    speedBallast: mode ? formatNumber(mode.speedBallastKn ?? 0, 2) : speedData.ballast,
    speedLaden: mode ? formatNumber(mode.speedLadenKn ?? 0, 2) : speedData.laden,
  };
}

function formatNumber(value: number | undefined | null, digits = 1) {
  return (value ?? 0).toLocaleString("en-US", { minimumFractionDigits: digits, maximumFractionDigits: digits });
}

function ReportDocument({ data }: { data: TimeCharterReportData }) {
  const vessel = data.lookups.vessels.find((item) => String(item.id) === data.vesselId);
  const vesselFallback = vesselData[0];
  const bunkerProfile = data.lookups.bunkerProfiles.find((item) => String(item.id) === data.bunkerProfileId);
  const fuelRows = buildFuelRows(bunkerProfile, data.performanceMode);
  const activePorts = data.portRows.filter((row) => hasPortValue(row) && row.key !== "margin");
  const printedAt = formatDateTime(new Date().toISOString());

  return (
    <div className="voyage-report-sheet">
      <div className="report-content">
        <div className="report-header">
          <div className="report-header-left">
            <div className="report-main-title">Time Charter Estimation Report</div>
            <div className="report-header-meta">
              <span><b>Estimate Name:</b> {data.estimateName ?? "time-charter1"}</span>
              <span><b>Status:</b> {data.status ?? "DRAFT"}</span>
            </div>
          </div>
          <div className="report-header-right">
            <div />
            <table className="report-audit-box">
              <tbody>
                <tr><td>User Name</td><td>{data.auditState?.updatedBy ?? "Admin"}</td></tr>
                <tr><td>Last update</td><td>{formatDateTime(data.auditState?.updatedAt)}</td></tr>
              </tbody>
            </table>
          </div>
        </div>

        <div className="report-top-shell">
          <div className="report-top-left">
            <div className="report-block top-vessel-block">
              <table className="report-grid tight top-vessel-table">
                <colgroup>
                  <col style={{ width: "44%" }} />
                  <col style={{ width: "18%" }} />
                  <col style={{ width: "14%" }} />
                  <col style={{ width: "24%" }} />
                </colgroup>
                <thead><tr><th>MV</th><th>DWT</th><th>Built</th><th>Kind</th></tr></thead>
                <tbody>
                  <tr>
                    <td>{vessel?.name ?? vesselFallback.mv}</td>
                    <td className="num">{vessel?.dwt?.toLocaleString("en-US") ?? vesselFallback.dwt}</td>
                    <td className="num">{vessel?.builtYear ?? vesselFallback.built}</td>
                    <td>{vessel?.vesselKind ?? vesselFallback.kind}</td>
                  </tr>
                </tbody>
              </table>
              <table className="report-grid tight top-estimate-table">
                <colgroup>
                  <col style={{ width: "15%" }} />
                  <col style={{ width: "17%" }} />
                  <col style={{ width: "20%" }} />
                  <col style={{ width: "48%" }} />
                </colgroup>
                <thead><tr><th>EstimateID</th><th>Est Type</th><th>Voyage No</th><th>Open position</th></tr></thead>
                <tbody><tr><td>{data.estimateId ?? ""}</td><td>TCOV</td><td>{""}</td><td>{""}</td></tr></tbody>
              </table>
            </div>
            <div className="report-block speed-block">
              <table className="report-grid tight speed-profile-table">
                <thead>
                  <tr><th>Bunker profile</th><td className="select-cell">{bunkerProfile?.name ?? ""}</td></tr>
                  <tr><th>Speed</th><td className="select-cell">{data.performanceMode ?? "FULL"}</td></tr>
                </thead>
              </table>
              <table className="report-grid tight speed-values-table">
                <thead><tr><th>Ballast</th><th>Laden</th></tr></thead>
                <tbody><tr><td className="num">{fuelRows.speedBallast}</td><td className="num">{fuelRows.speedLaden}</td></tr></tbody>
              </table>
              <div className="fuel-conditions-line">Fuel conditions</div>
            </div>
          </div>
          <div className="report-top-right">
            <div className="report-block">
              <table className="report-grid tight fuel-main-table">
                <thead><tr><th>Main</th><th>Type</th><th>Ballast</th><th>Laden</th><th>Idle</th><th>Work</th></tr></thead>
                <tbody>{fuelRows.main.map((row) => <tr key={row.label}><td>{row.label}</td><td>{row.type}</td><td className="num">{row.ballast}</td><td className="num">{row.laden}</td><td className="num">{row.idle}</td><td className="num">{row.work}</td></tr>)}</tbody>
              </table>
            </div>
            <div className="report-block">
              <table className="report-grid tight fuel-sub-table">
                <thead><tr><th>Sub</th><th>Type</th><th>Sea</th><th>Idle</th><th>Work</th></tr></thead>
                <tbody>{fuelRows.sub.map((row) => <tr key={row.label}><td>{row.label}</td><td>{row.type}</td><td className="num">{row.sea}</td><td className="num">{row.idle}</td><td className="num">{row.work}</td></tr>)}</tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="report-block"><div className="report-section-title">Head CP</div>
          <table className="report-grid compact">
            <thead><tr><th>Account</th><th>Delivery Port</th><th>Redelivery Port</th><th>Duration</th><th>Daily Hire</th><th>Gross Hire</th><th>Add. Comm.</th><th>Brkg</th></tr></thead>
            <tbody>{data.headCpRows.map((row) => <tr key={row.key}><td>{row.account}</td><td>{row.deliveryPort}</td><td>{row.redeliveryPort}</td><td className="num">{row.duration}</td><td className="num">{row.dailyHire}</td><td className="num">{row.grossHire}</td><td className="num">{row.addComm}</td><td className="num">{row.brkg}</td></tr>)}</tbody>
          </table>
        </div>
        <div className="report-block"><div className="report-section-title">Sub CP</div>
          <table className="report-grid compact">
            <thead><tr><th>Account</th><th>Delivery Port</th><th>Redelivery Port</th><th>Duration</th><th>Daily Hire</th><th>Gross Hire</th><th>Add. Comm.</th><th>Brkg</th></tr></thead>
            <tbody>{data.subCpRows.map((row) => <tr key={row.key}><td>{row.account}</td><td>{row.deliveryPort}</td><td>{row.redeliveryPort}</td><td className="num">{row.duration}</td><td className="num">{row.dailyHire}</td><td className="num">{row.grossHire}</td><td className="num">{row.addComm}</td><td className="num">{row.brkg}</td></tr>)}</tbody>
          </table>
        </div>
        <div className="report-block">
          <div className="report-section-title">Port Rotation</div>
          <div className="report-summary-text">{data.summaryText ?? ""}</div>
          <table className="report-grid compact">
            <thead><tr><th>#</th><th>Type</th><th>Port Name / Coordinate</th><th>TZ</th><th>Dist</th><th>ECA</th><th>WF</th><th>Spd</th><th>Sea</th><th>Idle</th><th>Arrival</th><th>Departure</th></tr></thead>
            <tbody>{activePorts.map((row) => <tr key={row.key}><td className="center">{row.no}</td><td>{row.type}</td><td>{row.port}</td><td className="center">{row.timezone}</td><td className="num">{row.distance}</td><td className="num">{row.eca}</td><td className="num">{row.wf}</td><td className="num">{row.spd}</td><td className="num">{row.sea}</td><td className="num">{row.idle}</td><td className="center">{row.arrival}</td><td className="center">{row.departure}</td></tr>)}</tbody>
          </table>
        </div>
        <div className="report-bottom-grid">
          <div className="report-block"><div className="report-section-title">Hire</div>
            <table className="report-grid compact"><thead><tr><th>Label</th><th>Daily Gross</th><th>Daily Net</th><th>Total Gross</th><th>Add. Comm.</th><th>Brokerage</th><th>Total Net</th></tr></thead>
              <tbody>{(data.bottomPanelData.hireRows ?? []).map((row) => <tr key={row.key}><td>{row.label}</td><td className="num">{row.dailyGross}</td><td className="num">{row.dailyNet}</td><td className="num">{row.totalGross}</td><td className="num">{row.addComm}</td><td className="num">{row.brokerage}</td><td className="num">{row.totalNet}</td></tr>)}</tbody></table>
          </div>
          <div className="report-block"><div className="report-section-title">Bunker Expense</div>
            <table className="report-grid compact"><thead><tr><th>Fuel</th><th>Price / MT</th><th>Consumption</th><th>Expense</th></tr></thead>
              <tbody>{(data.bottomPanelData.bunkerRows ?? []).map((row) => <tr key={row.key}><td>{row.fuel}</td><td className="num">{row.price}</td><td className="num">{row.consumption}</td><td className="num">{row.expense}</td></tr>)}</tbody></table>
          </div>
          <div className="report-block"><div className="report-section-title">Result</div>
            <table className="report-grid compact"><tbody>{(data.bottomPanelData.resultRows ?? []).map(([k, v]) => <tr key={k}><th>{k}</th><td className="num">{v}</td></tr>)}</tbody></table>
            <div className="profit-box"><span>Profit/ (Loss)</span><b>{data.bottomPanelData.resultProfit ?? ""}</b></div>
          </div>
        </div>
      </div>
      <div className="report-footer"><div>Print date : {printedAt}</div><div className="page-counter" /></div>
    </div>
  );
}

export function TimeCharterReportPreview({
  open,
  onClose,
  data,
  autoPrintToken,
}: {
  open: boolean;
  onClose: () => void;
  data: TimeCharterReportData;
  autoPrintToken?: number;
}) {
  const reportRef = useRef<HTMLDivElement | null>(null);
  const lastPrintedToken = useRef<number | undefined>(undefined);

  useEffect(() => {
    if (!open || autoPrintToken === undefined || autoPrintToken === lastPrintedToken.current) return;
    lastPrintedToken.current = autoPrintToken;
    window.setTimeout(() => printReportNode(reportRef.current), 80);
  }, [autoPrintToken, open]);

  const content = useMemo(() => <ReportDocument data={data} />, [data]);

  return (
    <Modal open={open} onCancel={onClose} width={1200} centered destroyOnHidden title="Time Charter Estimation Report" footer={[
      <Button key="print" type="primary" icon={<PrinterOutlined />} onClick={() => printReportNode(reportRef.current)}>Print</Button>,
      <Button key="close" onClick={onClose}>Close</Button>,
    ]} styles={{ body: { background: "#E7EDF2", padding: 12, maxHeight: "80vh", overflow: "auto" } }}>
      <style>{REPORT_STYLES}</style>
      <style>{`.report-grid th,.report-grid td{border:1px solid ${VE_COLORS.border};padding:2px 4px;vertical-align:middle;word-break:break-word}.report-grid{width:calc(100% - 5px);margin-right:5px;border-collapse:collapse;table-layout:fixed}.report-grid thead th,.report-grid tbody th{background:${VE_COLORS.headerBg};color:${VE_COLORS.headerText};font-weight:600}.report-grid .num{text-align:right;white-space:nowrap}.report-grid .center{text-align:center}.report-grid.compact th,.report-grid.compact td{font-size:10.5px;padding:1px 3px}`}</style>
      <div ref={reportRef}>{content}</div>
    </Modal>
  );
}
