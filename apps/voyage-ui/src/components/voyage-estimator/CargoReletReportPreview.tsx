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
  otherAmount?: string;
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

function parseAmount(value?: string) {
  const parsed = Number(String(value ?? "").replace(/,/g, "").replace("%", "").trim());
  return Number.isFinite(parsed) ? parsed : 0;
}

function formatAmount(value: number, digits = 1) {
  return value.toLocaleString("en-US", {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  });
}

function hasCargoValue(row: ReletCargoRow) {
  return Boolean(row.account || row.cargoName || row.loadingPort || row.dischargingPort || row.quantity);
}

function hasPortValue(row: ReletPortRow) {
  return Boolean(row.type || row.port || row.arrival || row.departure);
}

function grossFreight(quantity: string, freight: string, lumpsum: string) {
  const lumpsumValue = parseAmount(lumpsum);
  if (lumpsumValue > 0) return lumpsumValue;
  return parseAmount(quantity) * parseAmount(freight);
}

function stackedCell(top?: string, bottom?: string, className = "") {
  return (
    <div className={`stacked-cell ${className}`.trim()}>
      <div>{top || ""}</div>
      <div>{bottom || ""}</div>
    </div>
  );
}

const CARGO_RELET_REPORT_STYLES = `
  .cargo-relet-report-sheet .cargo-ports-cell {
    line-height: 1.1;
  }
  .cargo-relet-report-sheet .cargo-ports-cell div + div,
  .cargo-relet-report-sheet .stacked-cell div + div {
    border-top: 1px solid ${VE_COLORS.border};
  }
  .cargo-relet-report-sheet .stacked-cell {
    display: grid;
    grid-template-rows: repeat(2, minmax(0, 1fr));
    margin: -1px -3px;
  }
  .cargo-relet-report-sheet .stacked-cell > div {
    min-height: 15px;
    padding: 2px 3px;
    display: flex;
    align-items: center;
  }
  .cargo-relet-report-sheet .stacked-cell.num > div {
    justify-content: flex-end;
    text-align: right;
  }
  .cargo-relet-report-sheet .stacked-cell.center > div {
    justify-content: center;
    text-align: center;
  }
  .cargo-relet-report-sheet .cargo-cp-cell {
    background: ${VE_COLORS.headerBg};
    color: ${VE_COLORS.headerText};
    font-weight: 600;
    text-align: center;
  }
  .cargo-relet-report-sheet .cargo-bottom-layout {
    display: grid;
    grid-template-columns: minmax(0, 1fr) 20px 216px;
    align-items: start;
  }
  .cargo-relet-report-sheet .cargo-bottom-spacer {
    width: 20px;
  }
  .cargo-relet-report-sheet .cargo-bottom-block,
  .cargo-relet-report-sheet .cargo-remark-wrap {
    display: flex;
    flex-direction: column;
  }
  .cargo-relet-report-sheet .cargo-result-table th,
  .cargo-relet-report-sheet .cargo-result-table td,
  .cargo-relet-report-sheet .cargo-remark-table th,
  .cargo-relet-report-sheet .cargo-remark-table td {
    height: 18px;
  }
  .cargo-relet-report-sheet .cargo-remark-table {
    width: 216px;
  }
  .cargo-relet-report-sheet .cargo-remark-table td {
    vertical-align: top;
    white-space: pre-wrap;
    word-break: break-word;
  }
  .cargo-relet-report-sheet .cargo-profit-cell {
    font-weight: 700;
    color: ${VE_COLORS.sectionTitle};
  }
`;

function ReportDocument({ data }: { data: CargoReletReportData }) {
  const vessel = data.lookups.vessels.find((item) => String(item.id) === data.vesselId);
  const vesselFallback = vesselData[0];
  const cargoRows = data.cargoRows.filter(hasCargoValue);
  const portRows = data.portRows.filter((row) => hasPortValue(row) && row.key !== "margin");
  const printedAt = formatDateTime(new Date().toISOString());

  return (
    <div className="voyage-report-sheet cargo-relet-report-sheet">
      <div className="report-content">
        <div className="report-header">
          <div className="report-header-left">
            <div className="report-main-title">Cargo Relet Estimation Report</div>
            <div className="report-header-meta">
              <span>
                <b>Estimate Name:</b> {data.estimateName ?? "cargo-relet1"}
              </span>
              <span>
                <b>Status:</b> {data.status ?? "DRAFT"}
              </span>
            </div>
          </div>
          <div className="report-header-right">
            <div />
            <table className="report-audit-box">
              <tbody>
                <tr>
                  <td>User Name</td>
                  <td>{data.auditState?.updatedBy ?? "Admin"}</td>
                </tr>
                <tr>
                  <td>Last update</td>
                  <td>{formatDateTime(data.auditState?.updatedAt)}</td>
                </tr>
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
                <thead>
                  <tr>
                    <th>MV</th>
                    <th>DWT</th>
                    <th>Built</th>
                    <th>Kind</th>
                  </tr>
                </thead>
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
                <thead>
                  <tr>
                    <th>EstimateID</th>
                    <th>Est Type</th>
                    <th>Voyage No</th>
                    <th>Open position</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>{data.estimateId ?? ""}</td>
                    <td>RELT</td>
                    <td />
                    <td />
                  </tr>
                </tbody>
              </table>
            </div>
            <div className="report-block speed-block">
              <table className="report-grid tight speed-profile-table">
                <thead>
                  <tr>
                    <th>Bunker profile</th>
                    <td className="select-cell" />
                  </tr>
                  <tr>
                    <th>Speed</th>
                    <td className="select-cell">FULL</td>
                  </tr>
                </thead>
              </table>
              <table className="report-grid tight speed-values-table">
                <thead>
                  <tr>
                    <th>Ballast</th>
                    <th>Laden</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="num">{speedData.ballast}</td>
                    <td className="num">{speedData.laden}</td>
                  </tr>
                </tbody>
              </table>
              <div className="fuel-conditions-line">Fuel conditions</div>
            </div>
          </div>
          <div className="report-top-right">
            <div className="report-block">
              <table className="report-grid tight fuel-main-table">
                <thead>
                  <tr>
                    <th>Main</th>
                    <th>Type</th>
                    <th>Ballast</th>
                    <th>Laden</th>
                    <th>Idle</th>
                    <th>Work</th>
                  </tr>
                </thead>
                <tbody>
                  {fuelMainData.map((row) => (
                    <tr key={row.key}>
                      <td>{row.main}</td>
                      <td>{row.type}</td>
                      <td className="num">{row.ballast}</td>
                      <td className="num">{row.laden}</td>
                      <td className="num">{row.idle}</td>
                      <td className="num">{row.work}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="report-block">
              <table className="report-grid tight fuel-sub-table">
                <thead>
                  <tr>
                    <th>Sub</th>
                    <th>Type</th>
                    <th>Sea</th>
                    <th>Idle</th>
                    <th>Work</th>
                  </tr>
                </thead>
                <tbody>
                  {fuelSubData.map((row) => (
                    <tr key={row.key}>
                      <td>{row.sub}</td>
                      <td>{row.type}</td>
                      <td className="num">{row.sea}</td>
                      <td className="num">{row.idle}</td>
                      <td className="num">{row.work}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="report-block">
          <div className="report-section-title">Cargo</div>
          <table className="report-grid compact">
            <colgroup>
              <col style={{ width: "26px" }} />
              <col style={{ width: "108px" }} />
              <col style={{ width: "66px" }} />
              <col style={{ width: "146px" }} />
              <col style={{ width: "66px" }} />
              <col style={{ width: "44px" }} />
              <col style={{ width: "66px" }} />
              <col style={{ width: "46px" }} />
              <col style={{ width: "32px" }} />
              <col style={{ width: "52px" }} />
              <col style={{ width: "40px" }} />
              <col style={{ width: "40px" }} />
              <col style={{ width: "62px" }} />
              <col style={{ width: "62px" }} />
              <col style={{ width: "62px" }} />
            </colgroup>
            <thead>
              <tr>
                <th rowSpan={2}>#</th>
                <th rowSpan={2}>Account</th>
                <th rowSpan={2}>Cargo</th>
                <th>Loading Port</th>
                <th rowSpan={2}>Qty</th>
                <th rowSpan={2}>Unit</th>
                <th rowSpan={2}></th>
                <th rowSpan={2}>Freight</th>
                <th rowSpan={2}>Type</th>
                <th rowSpan={2}>Frt Lumpsum</th>
                <th rowSpan={2}>Add comm</th>
                <th rowSpan={2}>Brkg</th>
                <th rowSpan={2}>Net Freight</th>
                <th rowSpan={2}>Total Frt</th>
                <th rowSpan={2}>Liner</th>
              </tr>
              <tr>
                <th>Discharge Port</th>
              </tr>
            </thead>
            <tbody>
              {cargoRows.map((row) => {
                const hTotal = formatAmount(grossFreight(row.quantity, row.hFrt, row.hFrtLumpsum));
                const sTotal = formatAmount(grossFreight(row.quantity, row.sFrt, row.sFrtLumpsum));
                return (
                  <>
                    <tr key={`${row.key}-head`}>
                      <td rowSpan={2} className="center">
                        {row.no}
                      </td>
                      <td rowSpan={2}>{row.account}</td>
                      <td rowSpan={2}>{row.cargoName}</td>
                      <td rowSpan={2} className="cargo-ports-cell">
                        <div>{row.loadingPort}</div>
                        <div>{row.dischargingPort}</div>
                      </td>
                      <td rowSpan={2} className="num">
                        {row.quantity}
                      </td>
                      <td rowSpan={2} className="center">
                        {row.unit}
                      </td>
                      <td className="cargo-cp-cell">Head CP</td>
                      <td className="num">{row.hFrt}</td>
                      <td className="center">{row.hFrtType}</td>
                      <td className="num">{row.hFrtLumpsum}</td>
                      <td className="num">{row.hComm}</td>
                      <td className="num">{row.hBrkg}</td>
                      <td className="num">{row.hNet}</td>
                      <td className="num">{hTotal}</td>
                      <td className="num">{row.hLiner}</td>
                    </tr>
                    <tr key={`${row.key}-sub`}>
                      <td className="cargo-cp-cell">Sub CP</td>
                      <td className="num">{row.sFrt}</td>
                      <td className="center">{row.sFrtType}</td>
                      <td className="num">{row.sFrtLumpsum}</td>
                      <td className="num">{row.sComm}</td>
                      <td className="num">{row.sBrkg}</td>
                      <td className="num">{row.sNet}</td>
                      <td className="num">{sTotal}</td>
                      <td className="num">{row.sLiner}</td>
                    </tr>
                  </>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="report-block">
          <div className="report-section-title">Port Rotation</div>
          <div className="report-summary-text">{data.summaryText ?? ""}</div>
          <table className="report-grid compact">
            <colgroup>
              <col style={{ width: "26px" }} />
              <col style={{ width: "54px" }} />
              <col style={{ width: "156px" }} />
              <col style={{ width: "46px" }} />
              <col style={{ width: "44px" }} />
              <col style={{ width: "36px" }} />
              <col style={{ width: "40px" }} />
              <col style={{ width: "34px" }} />
              <col style={{ width: "42px" }} />
              <col style={{ width: "48px" }} />
              <col style={{ width: "48px" }} />
              <col style={{ width: "48px" }} />
              <col style={{ width: "42px" }} />
              <col style={{ width: "42px" }} />
              <col style={{ width: "108px" }} />
              <col style={{ width: "108px" }} />
            </colgroup>
            <thead>
              <tr>
                <th rowSpan={2}>#</th>
                <th rowSpan={2}>Type</th>
                <th rowSpan={2}>Port Name / Coordinate</th>
                <th rowSpan={2}>TZ</th>
                <th rowSpan={2}>Dist</th>
                <th rowSpan={2}>ECA</th>
                <th rowSpan={2}>WF</th>
                <th rowSpan={2}>Spd</th>
                <th rowSpan={2}>Sea</th>
                <th>Head L/D</th>
                <th>Head Dem</th>
                <th>Head Des</th>
                <th rowSpan={2}>Idle</th>
                <th rowSpan={2}>Working</th>
                <th rowSpan={2}>Arrival</th>
                <th rowSpan={2}>Departure</th>
              </tr>
              <tr>
                <th>Sub L/D</th>
                <th>Sub Dem</th>
                <th>Sub Des</th>
              </tr>
            </thead>
            <tbody>
              {portRows.map((row) => (
                <tr key={row.key}>
                  <td className="center">{row.no}</td>
                  <td>{row.type}</td>
                  <td>{row.port}</td>
                  <td className="center">{row.timezone ?? ""}</td>
                  <td className="num">{row.distance}</td>
                  <td className="num">{row.eca}</td>
                  <td className="num">{row.wf}</td>
                  <td className="num">{row.spd}</td>
                  <td className="num">{row.sea}</td>
                  <td>{stackedCell(row.hLd, row.sLd, "num")}</td>
                  <td>{stackedCell(row.hDem, row.sDem, "num")}</td>
                  <td>{stackedCell(row.hDes, row.sDes, "num")}</td>
                  <td className="num">{row.idle}</td>
                  <td className="num">{row.working}</td>
                  <td className="center">{row.arrival}</td>
                  <td className="center">{row.departure}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="cargo-bottom-layout">
          <div className="report-block cargo-bottom-block">
            <div className="report-section-title">Result</div>
            <table className="report-grid compact cargo-result-table">
              <colgroup>
                <col style={{ width: "52px" }} />
                <col style={{ width: "55px" }} />
                <col style={{ width: "35px" }} />
                <col style={{ width: "35px" }} />
                <col style={{ width: "45px" }} />
                <col style={{ width: "35px" }} />
                <col style={{ width: "35px" }} />
                <col style={{ width: "55px" }} />
                <col style={{ width: "60px" }} />
                <col style={{ width: "70px" }} />
              </colgroup>
              <thead>
                <tr>
                  <th></th>
                  <th>TTL Freight</th>
                  <th>Add Comm.</th>
                  <th>Brokerage</th>
                  <th>Liner Terms</th>
                  <th>Demurrage</th>
                  <th>Despatch</th>
                  <th>Total</th>
                  <th>Other</th>
                  <th>Profit</th>
                </tr>
              </thead>
              <tbody>
                {[data.result.head, data.result.sub].map((row, index) => (
                  <tr key={row.label}>
                    <th>{row.label}</th>
                    <td className="num">{row.ttlFreight}</td>
                    <td className="num">{row.addComm}</td>
                    <td className="num">{row.brokerage}</td>
                    <td className="num">{row.linerTerms}</td>
                    <td className="num">{row.demurrage}</td>
                    <td className="num">{row.despatch}</td>
                    <td className="num">{row.total}</td>
                    <td className="num">{index === 0 ? data.otherAmount ?? "0.0" : ""}</td>
                    {index === 0 ? (
                      <td rowSpan={2} className="cargo-profit-cell num">
                        {data.result.profit}
                      </td>
                    ) : null}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="cargo-bottom-spacer" />

          <div className="report-block cargo-remark-wrap">
            <div className="report-section-title">Remark</div>
            <table className="report-grid compact cargo-remark-table">
              <thead>
                <tr>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td rowSpan={2}></td>
                </tr>
                <tr></tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
      <div className="report-footer">
        <div>Print date : {printedAt}</div>
        <div className="page-counter" />
      </div>
    </div>
  );
}

export function CargoReletReportPreview({
  open,
  onClose,
  data,
  autoPrintToken,
}: {
  open: boolean;
  onClose: () => void;
  data: CargoReletReportData;
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
      title="Cargo Relet Estimation Report"
      footer={[
        <Button
          key="print"
          type="primary"
          icon={<PrinterOutlined />}
          onClick={() => printReportNode(reportRef.current)}
        >
          Print
        </Button>,
        <Button key="close" onClick={onClose}>
          Close
        </Button>,
      ]}
      styles={{ body: { background: "#E7EDF2", padding: 12, maxHeight: "80vh", overflow: "auto" } }}
    >
      <style>{REPORT_STYLES}</style>
      <style>{`
        .report-grid th,.report-grid td{border:1px solid ${VE_COLORS.border};padding:2px 4px;vertical-align:middle;word-break:break-word}
        .report-grid{width:calc(100% - 5px);margin-right:5px;border-collapse:collapse;table-layout:fixed}
        .report-grid thead th,.report-grid tbody th{background:${VE_COLORS.headerBg};color:${VE_COLORS.headerText};font-weight:600}
        .report-grid .num{text-align:right;white-space:nowrap}
        .report-grid .center{text-align:center}
        .report-grid.compact th,.report-grid.compact td{font-size:10.5px;padding:1px 3px}
      `}</style>
      <div ref={reportRef}>
        <style>{CARGO_RELET_REPORT_STYLES}</style>
        {content}
      </div>
    </Modal>
  );
}
