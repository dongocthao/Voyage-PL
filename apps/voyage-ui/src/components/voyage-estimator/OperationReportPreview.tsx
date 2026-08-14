import { useEffect, useMemo, useRef } from "react";
import { Button, Modal } from "antd";
import { PrinterOutlined } from "@ant-design/icons";
import { REPORT_STYLES, printReportNode } from "./VoyageReportPreview";
import { VE_COLORS } from "./theme";
import { opFuelMain, opFuelSub, opSpeed, type OpBunkerRow, type OpCargoRow, type OpPortRow } from "./operationData";

type AuditState = { updatedAt?: string; updatedBy?: string };

export type OperationReportData = {
  operationId?: string;
  estimateId?: string;
  vesselName: string;
  voyageNo: string;
  status?: string;
  auditState?: AuditState;
  cargoRows: OpCargoRow[];
  portRows: OpPortRow[];
  bunkerRows: OpBunkerRow[];
  operationExpenseRows: Array<[string, string, string, string]>;
  resultRows: Array<[string, string, string, string]>;
  miscRevenueAmount: string;
  profit: string;
  remark?: string;
  summaryText?: string;
};

function formatDateTime(value?: string) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  const pad = (num: number) => String(num).padStart(2, "0");
  return `${pad(date.getDate())}/${pad(date.getMonth() + 1)}/${date.getFullYear()} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function hasCargoValue(row: OpCargoRow) {
  return Boolean(row.account || row.cargoName || row.loadingPort || row.dischargingPort || row.quantity);
}

function hasPortValue(row: OpPortRow) {
  return Boolean(row.type || row.port || row.arrival || row.departure);
}

function ReportDocument({ data }: { data: OperationReportData }) {
  const cargoRows = data.cargoRows.filter(hasCargoValue);
  const portRows = data.portRows.filter((row) => row.key !== "margin" && hasPortValue(row));
  const printedAt = formatDateTime(new Date().toISOString());

  return (
    <div className="voyage-report-sheet operation-report-sheet">
      <div className="report-content">
        <div className="report-header">
          <div className="report-header-left">
            <div className="report-main-title">Operation Report</div>
            <div className="report-header-meta">
              <span><b>Operation ID:</b> {data.operationId ?? ""}</span>
              <span><b>Estimate ID:</b> {data.estimateId ?? ""}</span>
              <span><b>Status:</b> {data.status ?? "ONGOING"}</span>
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
                  <col style={{ width: "48%" }} />
                  <col style={{ width: "18%" }} />
                  <col style={{ width: "12%" }} />
                  <col style={{ width: "22%" }} />
                </colgroup>
                <thead><tr><th>MV</th><th>DWT</th><th>Built</th><th>Kind</th></tr></thead>
                <tbody><tr><td>{data.vesselName}</td><td className="num">57,650</td><td className="num">2018</td><td>SDBC</td></tr></tbody>
              </table>
              <table className="report-grid tight top-estimate-table">
                <colgroup>
                  <col style={{ width: "25%" }} />
                  <col style={{ width: "25%" }} />
                  <col style={{ width: "50%" }} />
                </colgroup>
                <thead><tr><th>Voyage No</th><th>Est Type</th><th>Operation</th></tr></thead>
                <tbody><tr><td>{data.voyageNo}</td><td>OPER</td><td>{data.status ?? "ONGOING"}</td></tr></tbody>
              </table>
            </div>
            <div className="report-block speed-block">
              <table className="report-grid tight speed-profile-table">
                <thead><tr><th>Bunker profile</th><td className="select-cell">Profile 1</td></tr><tr><th>Speed</th><td className="select-cell">FULL</td></tr></thead>
              </table>
              <table className="report-grid tight speed-values-table">
                <thead><tr><th>Ballast</th><th>Laden</th></tr></thead>
                <tbody><tr><td className="num">{opSpeed.ballast}</td><td className="num">{opSpeed.laden}</td></tr></tbody>
              </table>
            </div>
          </div>
          <div className="report-top-right">
            <div className="report-block">
              <table className="report-grid tight fuel-main-table">
                <thead><tr><th>Main</th><th>Type</th><th>Ballast</th><th>Laden</th><th>Idle</th><th>Work</th></tr></thead>
                <tbody>{opFuelMain.map((row) => <tr key={row.key}><td>{row.main}</td><td>{row.type}</td><td className="num">{row.ballast}</td><td className="num">{row.laden}</td><td className="num">{row.idle}</td><td className="num">{row.work}</td></tr>)}</tbody>
              </table>
            </div>
            <div className="report-block">
              <table className="report-grid tight fuel-sub-table">
                <thead><tr><th>Sub</th><th>Type</th><th>Sea</th><th>Idle</th><th>Work</th></tr></thead>
                <tbody>{opFuelSub.map((row) => <tr key={row.key}><td>{row.sub}</td><td>{row.type}</td><td className="num">{row.sea}</td><td className="num">{row.idle}</td><td className="num">{row.work}</td></tr>)}</tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="report-block">
          <div className="report-section-title">Cargo</div>
          <table className="report-grid compact">
            <thead><tr><th>#</th><th>Account</th><th>Cargo</th><th>Loading Port</th><th>Discharge Port</th><th>Qty</th><th>Frt</th><th>Term</th><th>Frt Type</th><th>Frt Lumpsum</th><th>Total Freight</th><th>A. Comm</th><th>Brkg</th><th>Frt Tax</th><th>Liner</th></tr></thead>
            <tbody>{cargoRows.map((row) => <tr key={row.key}><td className="center">{row.no}</td><td>{row.account}</td><td>{row.cargoName}</td><td>{row.loadingPort}</td><td>{row.dischargingPort}</td><td className="num">{row.quantity}</td><td className="num">{row.frt}</td><td>{row.term}</td><td className="center">{row.frtType}</td><td className="num">{row.frtLumpsum}</td><td className="num">{row.totalFreight}</td><td className="num">{row.aComm}</td><td className="num">{row.brkg}</td><td className="num">{row.frtTax}</td><td className="num">{row.linerTerm}</td></tr>)}</tbody>
          </table>
        </div>

        <div className="report-block">
          <div className="report-section-title">Port Rotation</div>
          <div className="report-summary-text">{data.summaryText ?? ""}</div>
          <table className="report-grid compact">
            <thead><tr><th>#</th><th>Type</th><th>Port Name / Coordinate</th><th>Dist</th><th>ECA</th><th>Spd</th><th>Sea</th><th>Channel</th><th>Idle</th><th>Working</th><th>Dem</th><th>Des</th><th>Port Charge</th><th>Arrival</th><th>Departure</th></tr></thead>
            <tbody>{portRows.map((row) => <tr key={row.key}><td className="center">{row.no}</td><td>{row.type}</td><td>{row.port}</td><td className="num">{row.distance}</td><td className="num">{row.eca}</td><td className="num">{row.spd}</td><td className="num">{row.sea}</td><td className="num">{row.ldRate}</td><td className="num">{row.idle}</td><td className="num">{row.working}</td><td className="num">{row.dem}</td><td className="num">{row.des}</td><td className="num">{row.portCharge}</td><td className="center">{row.arrival}</td><td className="center">{row.departure}</td></tr>)}</tbody>
          </table>
        </div>

        <div className="report-bottom-grid">
          <div className="report-block">
            <div className="report-section-title">Operation Expense</div>
            <table className="report-grid tight kv-grid">
              <colgroup><col style={{ width: "18%" }} /><col style={{ width: "32%" }} /><col style={{ width: "18%" }} /><col style={{ width: "32%" }} /></colgroup>
              <tbody>{data.operationExpenseRows.map((row, index) => <tr key={`${row[0]}-${index}`}><th>{row[0]}</th><td className="num">{row[1]}</td><th>{row[2]}</th><td className="num">{row[3]}</td></tr>)}</tbody>
            </table>
          </div>
          <div className="report-block">
            <div className="report-section-title">Bunker Expense</div>
            <table className="report-grid tight">
              <thead><tr><th>Fuel</th><th>Price / MT</th><th>Consumption</th><th>Expense</th></tr></thead>
              <tbody>{data.bunkerRows.map((row) => <tr key={row.key}><td>{row.type}</td><td className="num">{row.price}</td><td className="num">{row.consumption}</td><td className="num">{row.expense}</td></tr>)}</tbody>
            </table>
          </div>
          <div className="report-block">
            <div className="report-section-title">Result</div>
            <table className="report-grid tight kv-grid">
              <colgroup><col style={{ width: "18%" }} /><col style={{ width: "32%" }} /><col style={{ width: "18%" }} /><col style={{ width: "32%" }} /></colgroup>
              <tbody>{data.resultRows.map((row, index) => <tr key={`${row[0]}-${index}`}><th>{row[0]}</th><td className="num">{row[1]}</td><th>{row[2]}</th><td className={`num ${row[2] === "Profit /(Loss)" ? "font-bold" : ""}`}>{row[3]}</td></tr>)}</tbody>
            </table>
            <div className="report-remark-block">
              <div className="report-section-title">Remark</div>
              <div className="report-remark-box">{data.remark ?? ""}</div>
            </div>
          </div>
        </div>
      </div>
      <div className="report-footer"><div>Print date : {printedAt}</div><div className="page-counter" /></div>
    </div>
  );
}

export function OperationReportPreview({
  open,
  onClose,
  data,
  autoPrintToken,
}: {
  open: boolean;
  onClose: () => void;
  data: OperationReportData;
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
    <Modal
      open={open}
      onCancel={onClose}
      width={1200}
      centered
      destroyOnHidden
      title="Operation Report"
      footer={[
        <Button key="print" type="primary" icon={<PrinterOutlined />} onClick={() => printReportNode(reportRef.current)}>Print</Button>,
        <Button key="close" onClick={onClose}>Close</Button>,
      ]}
      styles={{ body: { background: "#E7EDF2", padding: 12, maxHeight: "80vh", overflow: "auto" } }}
    >
      <style>{REPORT_STYLES}</style>
      <style>{`.report-grid th,.report-grid td{border:1px solid ${VE_COLORS.border};padding:2px 4px;vertical-align:middle;word-break:break-word}.report-grid{width:calc(100% - 5px);margin-right:5px;border-collapse:collapse;table-layout:fixed}.report-grid thead th,.report-grid tbody th{background:${VE_COLORS.headerBg};color:${VE_COLORS.headerText};font-weight:600}.report-grid .num{text-align:right;white-space:nowrap}.report-grid .center{text-align:center}.report-grid.compact th,.report-grid.compact td{font-size:10.5px;padding:1px 3px}`}</style>
      <div ref={reportRef}>{content}</div>
    </Modal>
  );
}
