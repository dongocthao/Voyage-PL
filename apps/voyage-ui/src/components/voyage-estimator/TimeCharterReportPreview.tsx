import { useEffect, useMemo, useRef } from "react";
import { Button, Modal } from "antd";
import { PrinterOutlined } from "@ant-design/icons";
import { REPORT_STYLES, printReportNode } from "./VoyageReportPreview";
import { VE_COLORS } from "./theme";
import {
  fuelMainData,
  fuelSubData,
  speedData,
  vesselData,
  type FuelMainRow,
  type FuelSubRow,
} from "./mockData";
import type { LookupItem } from "@/lib/api/masterData";
import type { TcBottomPanelData, TcMiscItem } from "./TcBottomPanels";
import {
  tcBunkerTable,
  tcOperationTable,
  tcOthers,
  tcResultProfit,
  tcResultTable,
  type TcBunkerRow,
  type TcCpRow,
  type TcOperationRow,
  type TcPortRow,
} from "./timeCharterData";

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
  remark?: string;
};

type FuelMainDisplayRow = {
  label: string;
  type: string;
  ballast: string;
  laden: string;
  idle: string;
  work: string;
};

type FuelSubDisplayRow = {
  label: string;
  type: string;
  sea: string;
  idle: string;
  work: string;
};

function formatDateTime(value?: string) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${pad(date.getDate())}/${pad(date.getMonth() + 1)}/${date.getFullYear()} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function formatNumber(value: number | undefined | null, digits = 1) {
  return (value ?? 0).toLocaleString("en-US", {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  });
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
      : fuelMainData.map((row: FuelMainRow) => ({
          label: row.main,
          type: row.type,
          ballast: row.ballast,
          laden: row.laden,
          idle: row.idle,
          work: row.work,
        })),
    sub: mode
      ? (["NORMAL", "ECA"] as const).map((condition) => ({
          label: condition === "NORMAL" ? "Normal" : "ECA",
          type: fuelCode("SUB", condition),
          sea: formatNumber(pick("SUB", condition, "SEA")?.consumptionMtDay ?? 0, 2),
          idle: formatNumber(pick("SUB", condition, "IDLE")?.consumptionMtDay ?? 0, 2),
          work: formatNumber(pick("SUB", condition, "WORK")?.consumptionMtDay ?? 0, 2),
        }))
      : fuelSubData.map((row: FuelSubRow) => ({
          label: row.sub,
          type: row.type,
          sea: row.sea,
          idle: row.idle,
          work: row.work,
        })),
    speedBallast: mode ? formatNumber(mode.speedBallastKn ?? 0, 2) : speedData.ballast,
    speedLaden: mode ? formatNumber(mode.speedLadenKn ?? 0, 2) : speedData.laden,
  };
}

const TIME_CHARTER_REPORT_STYLES = `
  .time-charter-report-sheet .tc-report-bottom-grid {
    display: grid;
    grid-template-columns: 46% 29% 25%;
    gap: 8px;
    align-items: stretch;
  }
  .time-charter-report-sheet .tc-report-column {
    display: flex;
    flex-direction: column;
    gap: 8px;
    min-width: 0;
  }
  .time-charter-report-sheet .tc-report-column-middle,
  .time-charter-report-sheet .tc-report-column-right {
    height: 100%;
  }
  .time-charter-report-sheet .tc-remark-stack {
    display: flex;
    flex-direction: column;
  }
  .time-charter-report-sheet .tc-remark-box {
    min-height: 24px;
  }
  .time-charter-report-sheet .tc-result-block {
    display: flex;
    flex-direction: column;
    height: 100%;
  }
  .time-charter-report-sheet .tc-result-grid {
    width: calc(100% - 18px);
    margin-right: 18px;
  }
  .time-charter-report-sheet .tc-result-grid tbody th {
    text-align: left;
  }
  .time-charter-report-sheet .tc-profit-box {
    width: calc(100% - 18px);
    margin-right: 18px;
    margin-top: 6px;
  }
`;

function ReportDocument({ data }: { data: TimeCharterReportData }) {
  const vessel = data.lookups.vessels.find((item) => String(item.id) === data.vesselId);
  const vesselFallback = vesselData[0];
  const bunkerProfile = data.lookups.bunkerProfiles.find(
    (item) => String(item.id) === data.bunkerProfileId,
  );
  const fuelRows = buildFuelRows(bunkerProfile, data.performanceMode);
  const activePorts = data.portRows.filter((row) => hasPortValue(row) && row.key !== "margin");
  const printedAt = formatDateTime(new Date().toISOString());
  const hireRows = data.bottomPanelData.hireRows ?? [];
  const operationRows: TcOperationRow[] = data.bottomPanelData.operationRows ?? tcOperationTable;
  const bunkerRows: TcBunkerRow[] = data.bottomPanelData.bunkerRows?.length
    ? data.bottomPanelData.bunkerRows
    : tcBunkerTable;
  const others = data.bottomPanelData.others ?? tcOthers;
  const resultRows = data.bottomPanelData.resultRows?.length
    ? data.bottomPanelData.resultRows
    : tcResultTable;
  const resultProfit = data.bottomPanelData.resultProfit ?? tcResultProfit;

  return (
    <div className="voyage-report-sheet time-charter-report-sheet">
      <div className="report-content">
        <div className="report-header">
          <div className="report-header-left">
            <div className="report-main-title">Time Charter Estimation Report</div>
            <div className="report-header-meta">
              <span>
                <b>Estimate Name:</b> {data.estimateName ?? "time-charter1"}
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
                    <td>TCOV</td>
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
                    <td className="select-cell">{bunkerProfile?.name ?? ""}</td>
                  </tr>
                  <tr>
                    <th>Speed</th>
                    <td className="select-cell">{data.performanceMode ?? "FULL"}</td>
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
                    <td className="num">{fuelRows.speedBallast}</td>
                    <td className="num">{fuelRows.speedLaden}</td>
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
                  {(fuelRows.main as FuelMainDisplayRow[]).map((row) => (
                    <tr key={row.label}>
                      <td>{row.label}</td>
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
                  {(fuelRows.sub as FuelSubDisplayRow[]).map((row) => (
                    <tr key={row.label}>
                      <td>{row.label}</td>
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
          <div className="report-section-title">Head CP</div>
          <table className="report-grid compact">
            <colgroup>
              <col style={{ width: "25%" }} />
              <col style={{ width: "18%" }} />
              <col style={{ width: "18%" }} />
              <col style={{ width: "7%" }} />
              <col style={{ width: "8%" }} />
              <col style={{ width: "10%" }} />
              <col style={{ width: "7%" }} />
              <col style={{ width: "7%" }} />
            </colgroup>
            <thead>
              <tr>
                <th>Account</th>
                <th>Delivery Port</th>
                <th>Redelivery Port</th>
                <th>Duration</th>
                <th>Daily Hire</th>
                <th>Gross Hire</th>
                <th>Add. Comm.</th>
                <th>Brkg</th>
              </tr>
            </thead>
            <tbody>
              {data.headCpRows.map((row) => (
                <tr key={row.key}>
                  <td>{row.account}</td>
                  <td>{row.deliveryPort}</td>
                  <td>{row.redeliveryPort}</td>
                  <td className="num">{row.duration}</td>
                  <td className="num">{row.dailyHire}</td>
                  <td className="num">{row.grossHire}</td>
                  <td className="num">{row.addComm}</td>
                  <td className="num">{row.brkg}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="report-block">
          <div className="report-section-title">Sub CP</div>
          <table className="report-grid compact">
            <colgroup>
              <col style={{ width: "25%" }} />
              <col style={{ width: "18%" }} />
              <col style={{ width: "18%" }} />
              <col style={{ width: "7%" }} />
              <col style={{ width: "8%" }} />
              <col style={{ width: "10%" }} />
              <col style={{ width: "7%" }} />
              <col style={{ width: "7%" }} />
            </colgroup>
            <thead>
              <tr>
                <th>Account</th>
                <th>Delivery Port</th>
                <th>Redelivery Port</th>
                <th>Duration</th>
                <th>Daily Hire</th>
                <th>Gross Hire</th>
                <th>Add. Comm.</th>
                <th>Brkg</th>
              </tr>
            </thead>
            <tbody>
              {data.subCpRows.map((row) => (
                <tr key={row.key}>
                  <td>{row.account}</td>
                  <td>{row.deliveryPort}</td>
                  <td>{row.redeliveryPort}</td>
                  <td className="num">{row.duration}</td>
                  <td className="num">{row.dailyHire}</td>
                  <td className="num">{row.grossHire}</td>
                  <td className="num">{row.addComm}</td>
                  <td className="num">{row.brkg}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="report-block">
          <div className="report-section-title">Port Rotation</div>
          <div className="report-summary-text">{data.summaryText ?? ""}</div>
          <table className="report-grid compact">
            <colgroup>
              <col style={{ width: "30px" }} />
              <col style={{ width: "80px" }} />
              <col style={{ width: "293px" }} />
              <col style={{ width: "54px" }} />
              <col style={{ width: "53px" }} />
              <col style={{ width: "53px" }} />
              <col style={{ width: "53px" }} />
              <col style={{ width: "53px" }} />
              <col style={{ width: "53px" }} />
              <col style={{ width: "53px" }} />
              <col style={{ width: "142px" }} />
              <col style={{ width: "153px" }} />
            </colgroup>
            <thead>
              <tr>
                <th>#</th>
                <th>Type</th>
                <th>Port Name</th>
                <th>TZ</th>
                <th>Dist</th>
                <th>ECA</th>
                <th>WF</th>
                <th>Spd</th>
                <th>Sea</th>
                <th>Idle</th>
                <th>Arrival</th>
                <th>Departure</th>
              </tr>
            </thead>
            <tbody>
              {activePorts.map((row) => (
                <tr key={row.key}>
                  <td className="center">{row.no}</td>
                  <td>{row.type}</td>
                  <td>{row.port}</td>
                  <td className="center">{row.timezone}</td>
                  <td className="num">{row.distance}</td>
                  <td className="num">{row.eca}</td>
                  <td className="num">{row.wf}</td>
                  <td className="num">{row.spd}</td>
                  <td className="num">{row.sea}</td>
                  <td className="num">{row.idle}</td>
                  <td className="center">{row.arrival}</td>
                  <td className="center">{row.departure}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="tc-report-bottom-grid">
          <div className="tc-report-column tc-report-column-left">
            <div className="report-block">
              <div className="report-section-title">Hire</div>
              <table className="report-grid compact">
                <colgroup>
                  <col style={{ width: "14%" }} />
                  <col style={{ width: "14%" }} />
                  <col style={{ width: "14%" }} />
                  <col style={{ width: "17%" }} />
                  <col style={{ width: "13%" }} />
                  <col style={{ width: "13%" }} />
                  <col style={{ width: "15%" }} />
                </colgroup>
                <thead>
                  <tr>
                    <th>Label</th>
                    <th>Daily Gross</th>
                    <th>Daily Net</th>
                    <th>Total Gross</th>
                    <th>Add. Comm.</th>
                    <th>Brkg</th>
                    <th>Total Net</th>
                  </tr>
                </thead>
                <tbody>
                  {hireRows.map((row) => (
                    <tr key={row.key}>
                      <td>{row.label}</td>
                      <td className="num">{row.dailyGross}</td>
                      <td className="num">{row.dailyNet}</td>
                      <td className="num">{row.totalGross}</td>
                      <td className="num">{row.addComm}</td>
                      <td className="num">{row.brokerage}</td>
                      <td className="num">{row.totalNet}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="report-block">
              <div className="report-section-title">Operation</div>
              <table className="report-grid compact">
                <colgroup>
                  <col style={{ width: "14%" }} />
                  <col style={{ width: "17%" }} />
                  <col style={{ width: "16%" }} />
                  <col style={{ width: "14%" }} />
                  <col style={{ width: "19%" }} />
                  <col style={{ width: "20%" }} />
                </colgroup>
                <thead>
                  <tr>
                    <th>Label</th>
                    <th>Ballast Bonus</th>
                    <th>ILOHC</th>
                    <th>C.E.V.</th>
                    <th>Bunker Expense</th>
                    <th>Total</th>
                  </tr>
                </thead>
                <tbody>
                  {operationRows.map((row) => (
                    <tr key={row.key}>
                      <td>{row.label}</td>
                      <td className="num">{row.ballastBonus}</td>
                      <td className="num">{row.ilohc}</td>
                      <td className="num">{row.cev}</td>
                      <td className="num">{row.bunkerExpense}</td>
                      <td className="num">{row.total}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="tc-report-column tc-report-column-middle">
            <div className="report-block">
              <div className="report-section-title">Bunker Expense</div>
              <table className="report-grid compact">
                <colgroup>
                  <col style={{ width: "20%" }} />
                  <col style={{ width: "24%" }} />
                  <col style={{ width: "26%" }} />
                  <col style={{ width: "30%" }} />
                </colgroup>
                <thead>
                  <tr>
                    <th>Fuel</th>
                    <th>Price / MT</th>
                    <th>Consumption</th>
                    <th>Expense</th>
                  </tr>
                </thead>
                <tbody>
                  {bunkerRows.map((row) => (
                    <tr key={row.key}>
                      <td>{row.fuel}</td>
                      <td className="num">{row.price}</td>
                      <td className="num">{row.consumption}</td>
                      <td className="num">{row.expense}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="report-block">
              <div className="report-section-title">Other</div>
              <table className="report-grid compact">
                <colgroup>
                  <col style={{ width: "50%" }} />
                  <col style={{ width: "50%" }} />
                </colgroup>
                <thead>
                  <tr>
                    <th>Income</th>
                    <th>Expense</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="num">{others.income}</td>
                    <td className="num">{others.expense}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="report-block tc-remark-stack">
              <div className="report-section-title">Remark</div>
              <div className="report-remark-box tc-remark-box">{data.remark?.trim() || ""}</div>
            </div>
          </div>

          <div className="tc-report-column tc-report-column-right">
            <div className="report-block tc-result-block">
              <div className="report-section-title">Result</div>
              <table className="report-grid compact tc-result-grid">
                <colgroup>
                  <col style={{ width: "42%" }} />
                  <col style={{ width: "58%" }} />
                </colgroup>
                <tbody>
                  {resultRows.map(([label, value]) => (
                    <tr key={label}>
                      <th>{label}</th>
                      <td className="num">{value}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="profit-box tc-profit-box">
                <span>Profit/ (Loss)</span>
                <b>{resultProfit}</b>
              </div>
            </div>
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
    <Modal
      open={open}
      onCancel={onClose}
      width={1200}
      centered
      destroyOnHidden
      title="Time Charter Estimation Report"
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
        .report-grid th,
        .report-grid td {
          border: 1px solid ${VE_COLORS.border};
          padding: 2px 4px;
          vertical-align: middle;
          word-break: break-word;
        }
        .report-grid {
          width: calc(100% - 5px);
          margin-right: 5px;
          border-collapse: collapse;
          table-layout: fixed;
        }
        .report-grid thead th,
        .report-grid tbody th {
          background: ${VE_COLORS.headerBg};
          color: ${VE_COLORS.headerText};
          font-weight: 600;
        }
        .report-grid .num {
          text-align: right;
          white-space: nowrap;
        }
        .report-grid .center {
          text-align: center;
        }
        .report-grid.compact th,
        .report-grid.compact td {
          font-size: 10.5px;
          padding: 1px 3px;
        }
        .report-audit-box {
          width: 245px;
        }
      `}</style>
      <div ref={reportRef}>
        <style>{TIME_CHARTER_REPORT_STYLES}</style>
        {content}
      </div>
    </Modal>
  );
}
