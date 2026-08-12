import { useEffect, useMemo, useRef } from "react";
import { Button, Modal } from "antd";
import { PrinterOutlined } from "@ant-design/icons";
import { REPORT_STYLES, printReportNode } from "./VoyageReportPreview";
import { VE_COLORS } from "./theme";
import { fuelMainData, fuelSubData, speedData, vesselData } from "./mockData";
import type { LookupItem } from "@/lib/api/masterData";
import type { ReletCargoRow, ReletPortRow } from "./cargoReletData";

type AuditState = { updatedAt?: string; updatedBy?: string };

export type CargoReletReportData = {
  estimateId?: string;
  estimateName?: string;
  status?: string;
  auditState?: AuditState;
  vesselId?: string;
  lookups: { vessels: LookupItem[] };
  cargoRows: ReletCargoRow[];
  portRows: ReletPortRow[];
  result: CargoReletResult;
  summaryText?: string;
};

type ResultLine = {
  label: string;
  ttlFreight: string;
  addComm: string;
  brokerage: string;
  linerTerms: string;
  demurrage: string;
  despatch: string;
  total: string;
};

type CargoReletResult = {
  head: ResultLine;
  sub: ResultLine;
  profit: string;
};

function formatDateTime(value?: string) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${pad(date.getDate())}/${pad(date.getMonth() + 1)}/${date.getFullYear()} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function hasCargoValue(row: ReletCargoRow) {
  return Boolean(row.account || row.cargoName || row.loadingPort || row.dischargingPort || row.quantity);
}

function hasPortValue(row: ReletPortRow) {
  return Boolean(row.type || row.port || row.arrival || row.departure);
}

function ReportDocument({ data }: { data: CargoReletReportData }) {
  const vessel = data.lookups.vessels.find((item) => String(item.id) === data.vesselId);
  const vesselFallback = vesselData[0];
  const cargoRows = data.cargoRows.filter(hasCargoValue);
  const portRows = data.portRows.filter((row) => hasPortValue(row) && row.key !== "margin");
  const printedAt = formatDateTime(new Date().toISOString());

  return (
    <div className="voyage-report-sheet">
      <div className="report-content">
        <div className="report-header">
          <div className="report-header-left">
            <div className="report-main-title">Cargo Relet Estimation Report</div>
            <div className="report-header-meta">
              <span><b>Estimate Name:</b> {data.estimateName ?? "cargo-relet1"}</span>
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
                <colgroup><col style={{ width: "44%" }} /><col style={{ width: "18%" }} /><col style={{ width: "14%" }} /><col style={{ width: "24%" }} /></colgroup>
                <thead><tr><th>MV</th><th>DWT</th><th>Built</th><th>Kind</th></tr></thead>
                <tbody><tr><td>{vessel?.name ?? vesselFallback.mv}</td><td className="num">{vessel?.dwt?.toLocaleString("en-US") ?? vesselFallback.dwt}</td><td className="num">{vessel?.builtYear ?? vesselFallback.built}</td><td>{vessel?.vesselKind ?? vesselFallback.kind}</td></tr></tbody>
              </table>
              <table className="report-grid tight top-estimate-table">
                <colgroup><col style={{ width: "15%" }} /><col style={{ width: "17%" }} /><col style={{ width: "20%" }} /><col style={{ width: "48%" }} /></colgroup>
                <thead><tr><th>EstimateID</th><th>Est Type</th><th>Voyage No</th><th>Open position</th></tr></thead>
                <tbody><tr><td>{data.estimateId ?? ""}</td><td>RELT</td><td></td><td></td></tr></tbody>
              </table>
            </div>
            <div className="report-block speed-block">
              <table className="report-grid tight speed-profile-table">
                <thead><tr><th>Bunker profile</th><td className="select-cell" /></tr><tr><th>Speed</th><td className="select-cell">FULL</td></tr></thead>
              </table>
              <table className="report-grid tight speed-values-table">
                <thead><tr><th>Ballast</th><th>Laden</th></tr></thead>
                <tbody><tr><td className="num">{speedData.ballast}</td><td className="num">{speedData.laden}</td></tr></tbody>
              </table>
              <div className="fuel-conditions-line">Fuel conditions</div>
            </div>
          </div>
          <div className="report-top-right">
            <div className="report-block">
              <table className="report-grid tight fuel-main-table"><thead><tr><th>Main</th><th>Type</th><th>Ballast</th><th>Laden</th><th>Idle</th><th>Work</th></tr></thead><tbody>{fuelMainData.map((row) => <tr key={row.key}><td>{row.main}</td><td>{row.type}</td><td className="num">{row.ballast}</td><td className="num">{row.laden}</td><td className="num">{row.idle}</td><td className="num">{row.work}</td></tr>)}</tbody></table>
            </div>
            <div className="report-block">
              <table className="report-grid tight fuel-sub-table"><thead><tr><th>Sub</th><th>Type</th><th>Sea</th><th>Idle</th><th>Work</th></tr></thead><tbody>{fuelSubData.map((row) => <tr key={row.key}><td>{row.sub}</td><td>{row.type}</td><td className="num">{row.sea}</td><td className="num">{row.idle}</td><td className="num">{row.work}</td></tr>)}</tbody></table>
            </div>
          </div>
        </div>
        <div className="report-block"><div className="report-section-title">Cargo</div>
          <table className="report-grid compact">
            <thead><tr><th>#</th><th>Account</th><th>Cargo</th><th>Load Port</th><th>Discharge Port</th><th>Qty</th><th>Unit</th><th>H Frt</th><th>H Type</th><th>H L/S</th><th>H Net</th><th>H Liner</th><th>S Frt</th><th>S Type</th><th>S L/S</th><th>S Net</th><th>S Liner</th></tr></thead>
            <tbody>{cargoRows.map((row) => <tr key={row.key}><td className="center">{row.no}</td><td>{row.account}</td><td>{row.cargoName}</td><td>{row.loadingPort}</td><td>{row.dischargingPort}</td><td className="num">{row.quantity}</td><td className="center">{row.unit}</td><td className="num">{row.hFrt}</td><td className="center">{row.hFrtType}</td><td className="num">{row.hFrtLumpsum}</td><td className="num">{row.hNet}</td><td className="num">{row.hLiner}</td><td className="num">{row.sFrt}</td><td className="center">{row.sFrtType}</td><td className="num">{row.sFrtLumpsum}</td><td className="num">{row.sNet}</td><td className="num">{row.sLiner}</td></tr>)}</tbody>
          </table>
        </div>
        <div className="report-block"><div className="report-section-title">Port Rotation</div><div className="report-summary-text">{data.summaryText ?? ""}</div>
          <table className="report-grid compact">
            <thead><tr><th>#</th><th>Type</th><th>Port Name / Coordinate</th><th>TZ</th><th>Dist</th><th>ECA</th><th>WF</th><th>Spd</th><th>Sea</th><th>H L/D</th><th>H Dem</th><th>H Des</th><th>S L/D</th><th>S Dem</th><th>S Des</th><th>Idle</th><th>Working</th><th>Arrival</th><th>Departure</th></tr></thead>
            <tbody>{portRows.map((row) => <tr key={row.key}><td className="center">{row.no}</td><td>{row.type}</td><td>{row.port}</td><td className="center">{row.timezone ?? ""}</td><td className="num">{row.distance}</td><td className="num">{row.eca}</td><td className="num">{row.wf}</td><td className="num">{row.spd}</td><td className="num">{row.sea}</td><td className="num">{row.hLd}</td><td className="num">{row.hDem}</td><td className="num">{row.hDes}</td><td className="num">{row.sLd}</td><td className="num">{row.sDem}</td><td className="num">{row.sDes}</td><td className="num">{row.idle}</td><td className="num">{row.working}</td><td className="center">{row.arrival}</td><td className="center">{row.departure}</td></tr>)}</tbody>
          </table>
        </div>
        <div className="report-block"><div className="report-section-title">Result</div>
          <table className="report-grid compact">
            <thead><tr><th></th><th>TTL Freight</th><th>Add Comm.</th><th>Brokerage</th><th>Liner Terms</th><th>Demurrage</th><th>Despatch</th><th>Total</th></tr></thead>
            <tbody>
              {[data.result.head, data.result.sub].map((row) => <tr key={row.label}><th>{row.label}</th><td className="num">{row.ttlFreight}</td><td className="num">{row.addComm}</td><td className="num">{row.brokerage}</td><td className="num">{row.linerTerms}</td><td className="num">{row.demurrage}</td><td className="num">{row.despatch}</td><td className="num">{row.total}</td></tr>)}
            </tbody>
          </table>
          <div className="profit-box"><span>Profit/ (Loss)</span><b>{data.result.profit}</b></div>
        </div>
      </div>
      <div className="report-footer"><div>Print date : {printedAt}</div><div className="page-counter" /></div>
    </div>
  );
}

export function CargoReletReportPreview({ open, onClose, data, autoPrintToken }: { open: boolean; onClose: () => void; data: CargoReletReportData; autoPrintToken?: number }) {
  const reportRef = useRef<HTMLDivElement | null>(null);
  const lastPrintedToken = useRef<number | undefined>(undefined);
  useEffect(() => {
    if (!open || autoPrintToken === undefined || autoPrintToken === lastPrintedToken.current) return;
    lastPrintedToken.current = autoPrintToken;
    window.setTimeout(() => printReportNode(reportRef.current), 80);
  }, [autoPrintToken, open]);
  const content = useMemo(() => <ReportDocument data={data} />, [data]);
  return (
    <Modal open={open} onCancel={onClose} width={1200} centered destroyOnHidden title="Cargo Relet Estimation Report" footer={[
      <Button key="print" type="primary" icon={<PrinterOutlined />} onClick={() => printReportNode(reportRef.current)}>Print</Button>,
      <Button key="close" onClick={onClose}>Close</Button>,
    ]} styles={{ body: { background: "#E7EDF2", padding: 12, maxHeight: "80vh", overflow: "auto" } }}>
      <style>{REPORT_STYLES}</style>
      <style>{`.report-grid th,.report-grid td{border:1px solid ${VE_COLORS.border};padding:2px 4px;vertical-align:middle;word-break:break-word}.report-grid{width:calc(100% - 5px);margin-right:5px;border-collapse:collapse;table-layout:fixed}.report-grid thead th,.report-grid tbody th{background:${VE_COLORS.headerBg};color:${VE_COLORS.headerText};font-weight:600}.report-grid .num{text-align:right;white-space:nowrap}.report-grid .center{text-align:center}.report-grid.compact th,.report-grid.compact td{font-size:10.5px;padding:1px 3px}`}</style>
      <div ref={reportRef}>{content}</div>
    </Modal>
  );
}
