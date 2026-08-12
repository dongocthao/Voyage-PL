import { useEffect, useMemo, useRef } from "react";
import { Button, Modal } from "antd";
import { PrinterOutlined } from "@ant-design/icons";
import { VE_COLORS, VE_FONT_FAMILY } from "./theme";
import { buildPortRotationSummary, classifySeaStateByCargoFlow } from "./portRotationSummary";
import {
  bunkerData,
  estimateInfo,
  fuelMainData,
  fuelSubData,
  profitUsd,
  resultRows,
  speedData,
  vesselData,
  type CargoRow,
  type PortRow,
} from "./mockData";
import type { LookupItem } from "@/lib/api/masterData";
import type { VoyageSnapshotResult } from "@/lib/api/voyageSnapshots";

type VoyageHeaderState = {
  estimateTypeCode?: string;
  voyageNo?: string;
  performanceMode?: "FULL" | "ECO" | "CUSTOM1" | "CUSTOM2" | "CUSTOM3";
  hireDay?: number;
  hireAddCommPct?: number;
};

type AuditState = {
  updatedAt?: string;
  updatedBy?: string;
};

export type VoyageReportData = {
  estimateId?: string;
  estimateName?: string;
  status?: string;
  openPosition?: string;
  headerState: VoyageHeaderState;
  auditState?: AuditState;
  lookups: {
    vessels: LookupItem[];
    bunkerProfiles: LookupItem[];
  };
  vesselId?: string;
  bunkerProfileId?: string;
  cargoRows: CargoRow[];
  portRows: PortRow[];
  operationExpenseRows: Array<[string, string, string, string]>;
  result?: VoyageSnapshotResult;
  remark?: string;
};

function parseAmount(value: string | number | undefined | null) {
  if (typeof value === "number") return Number.isFinite(value) ? value : 0;
  const parsed = Number(String(value ?? "").replace(/,/g, "").replace("%", "").trim());
  return Number.isFinite(parsed) ? parsed : 0;
}

function formatAmount(value: number | undefined | null, digits = 1) {
  return (value ?? 0).toLocaleString("en-US", {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  });
}

function formatPercent(value: string | number | undefined | null) {
  const numeric = typeof value === "number" ? value : parseAmount(value);
  return `${formatAmount(numeric)} %`;
}

function formatDateTime(value?: string) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${pad(date.getDate())}/${pad(date.getMonth() + 1)}/${date.getFullYear()} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function hasCargoValue(row: CargoRow) {
  return Boolean(
    row.account?.trim() ||
      row.cargoName?.trim() ||
      row.loadingPort?.trim() ||
      row.dischargingPort?.trim() ||
      row.quantity?.trim() ||
      row.frt?.trim() ||
      row.totalFreight?.trim(),
  );
}

function hasPortValue(row: PortRow) {
  return Boolean(row.type?.trim() || row.port?.trim() || row.arrival?.trim() || row.departure?.trim());
}

function cargoTotals(rows: CargoRow[]) {
  const activeRows = rows.filter(hasCargoValue);
  const quantity = activeRows.reduce((sum, row) => sum + parseAmount(row.quantity), 0);
  const totalFreight = activeRows.reduce((sum, row) => sum + parseAmount(row.totalFreight), 0);
  const freightLumpsum = activeRows.reduce((sum, row) => sum + parseAmount(row.frtLumpsum), 0);
  const weightedPercent = (field: "aComm" | "brkg" | "frtTax") =>
    totalFreight === 0
      ? 0
      : activeRows.reduce((sum, row) => sum + parseAmount(row.totalFreight) * parseAmount(row[field]), 0) /
        totalFreight;
  const averageFreight = quantity === 0 ? 0 : totalFreight / quantity;
  const linerTerm = activeRows.reduce((sum, row) => sum + parseAmount(row.linerTerm), 0);

  return {
    quantity,
    averageFreight,
    freightLumpsum,
    totalFreight,
    addCommPct: weightedPercent("aComm"),
    brokeragePct: weightedPercent("brkg"),
    freightTaxPct: weightedPercent("frtTax"),
    linerTerm,
  };
}

function portTotals(rows: PortRow[]) {
  const activeRows = rows.filter((row) => hasPortValue(row) && row.key !== "margin");
  return {
    distance: activeRows.reduce((sum, row) => sum + parseAmount(row.distance), 0),
    eca: activeRows.reduce((sum, row) => sum + parseAmount(row.eca), 0),
    sea: activeRows.reduce((sum, row) => sum + parseAmount(row.sea), 0),
    idle: activeRows.reduce((sum, row) => sum + parseAmount(row.idle), 0),
    working: activeRows.reduce((sum, row) => sum + parseAmount(row.working), 0),
    dem: activeRows.reduce((sum, row) => sum + parseAmount(row.dem), 0),
    des: activeRows.reduce((sum, row) => sum + parseAmount(row.des), 0),
    portCharge: activeRows.reduce((sum, row) => sum + parseAmount(row.portCharge), 0),
  };
}

function findVessel(itemId: string | undefined, vessels: LookupItem[]) {
  return vessels.find((item) => String(item.id) === itemId);
}

function buildFuelRows(profile: LookupItem | undefined, performanceMode: string | undefined) {
  const mode =
    profile?.modes?.find((item) => item.mode === performanceMode) ?? profile?.modes?.[0];
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
          ballast: formatAmount(pick("MAIN", condition, "BALLAST")?.consumptionMtDay ?? 0, 2),
          laden: formatAmount(pick("MAIN", condition, "LADEN")?.consumptionMtDay ?? 0, 2),
          idle: formatAmount(pick("MAIN", condition, "IDLE")?.consumptionMtDay ?? 0, 2),
          work: formatAmount(pick("MAIN", condition, "WORK")?.consumptionMtDay ?? 0, 2),
        }))
      : fuelMainData.map((row) => ({
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
          sea: formatAmount(pick("SUB", condition, "SEA")?.consumptionMtDay ?? 0, 2),
          idle: formatAmount(pick("SUB", condition, "IDLE")?.consumptionMtDay ?? 0, 2),
          work: formatAmount(pick("SUB", condition, "WORK")?.consumptionMtDay ?? 0, 2),
        }))
      : fuelSubData.map((row) => ({
          label: row.sub,
          type: row.type,
          sea: row.sea,
          idle: row.idle,
          work: row.work,
        })),
    speedBallast: mode ? formatAmount(mode.speedBallastKn ?? 0, 2) : speedData.ballast,
    speedLaden: mode ? formatAmount(mode.speedLadenKn ?? 0, 2) : speedData.laden,
  };
}

function ReportDocument({ data }: { data: VoyageReportData }) {
  const reportRef = data;
  const activeCargoRows = reportRef.cargoRows.filter(hasCargoValue);
  const activePortRows = reportRef.portRows.filter(hasPortValue);
  const cargoSummary = cargoTotals(activeCargoRows);
  const portSummary = portTotals(activePortRows);
  const vessel = findVessel(reportRef.vesselId, reportRef.lookups.vessels);
  const bunkerProfile = reportRef.lookups.bunkerProfiles.find(
    (item) => String(item.id) === reportRef.bunkerProfileId,
  );
  const vesselFallback = vesselData[0];
  const fuelRows = buildFuelRows(bunkerProfile, reportRef.headerState.performanceMode);
  const bunkerExpenseRows =
    reportRef.result?.bunkerSummaries?.length
      ? reportRef.result.bunkerSummaries.map((row) => ({
          fuel: row.fuelCode ?? String(row.fuelTypeId),
          price: formatAmount(row.pricePerMt ?? 0),
          consumption: formatAmount(row.consumptionMt),
          expense: formatAmount(row.expense),
        }))
      : bunkerData.map((row) => ({
          fuel: row.type,
          price: row.price,
          consumption: row.consumption,
          expense: row.expense,
        }));
  const displayResultRows: Array<[string, string, string, string]> = reportRef.result
    ? [
        ["Hire / Day", formatAmount(reportRef.headerState.hireDay ?? 0), "Revenue", formatAmount(reportRef.result.revenue ?? 0)],
        ["H/Add Comm.", formatPercent(reportRef.headerState.hireAddCommPct ?? 0), "Op. Expense", formatAmount(reportRef.result.opExpense ?? 0)],
        ["Net Hire", formatAmount((reportRef.headerState.hireDay ?? 0) * (1 - (reportRef.headerState.hireAddCommPct ?? 0) / 100)), "Op. Profit", formatAmount(reportRef.result.opProfit ?? 0)],
        ["TCE / Day", formatAmount(reportRef.result.tceUsdDay ?? 0), "Total Hire", formatAmount(reportRef.result.totalHire ?? 0)],
        ["Days", formatAmount(reportRef.result.totalDurationDays ?? 0), "Total Freight", formatAmount(reportRef.result.totalFreight ?? 0)],
      ]
    : resultRows;
  const displayProfit = reportRef.result ? formatAmount(reportRef.result.profitUsd ?? 0) : profitUsd;
  const printedAt = formatDateTime(new Date().toISOString());
  const summaryText = buildPortRotationSummary(activePortRows, {
    isSummaryRow: (row) => row.key === "margin",
    type: (row) => row.type,
    sea: (row) => row.sea,
    idle: (row) => row.idle,
    working: (row) => row.working,
    eca: (row) => row.eca,
    wf: (row) => row.wf,
    spd: (row) => row.spd,
    departure: (row) => row.departure,
    classifySeaState: (row, index, rows) =>
      classifySeaStateByCargoFlow(rows, row, index, (item) => item.type),
    classifyMarginSeaState: (_row, _rows, lastSeaState) => lastSeaState,
  });

  return (
    <div className="voyage-report-sheet">
      <div className="report-content">
        <div className="report-header">
          <div className="report-header-left">
            <div className="report-main-title">Voyage Estimation Report</div>
            <div className="report-header-meta">
              <span><b>Estimate Name:</b> {reportRef.estimateName ?? "voyage1"}</span>
              <span><b>Status:</b> {reportRef.status ?? "DRAFT"}</span>
            </div>
          </div>
          <div className="report-header-right">
            <div />
            <table className="report-audit-box">
              <tbody>
                <tr>
                  <td>User Name</td>
                  <td>{reportRef.auditState?.updatedBy ?? "Admin"}</td>
                </tr>
                <tr>
                  <td>Last update</td>
                  <td>{formatDateTime(reportRef.auditState?.updatedAt)}</td>
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
                    <td>{vessel?.name ?? vesselFallback?.mv ?? ""}</td>
                    <td className="num">{vessel?.dwt?.toLocaleString("en-US") ?? vesselFallback?.dwt ?? ""}</td>
                    <td className="num">{vessel?.builtYear ?? vesselFallback?.built ?? ""}</td>
                    <td>{vessel?.vesselKind ?? vesselFallback?.kind ?? ""}</td>
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
                    <td>{reportRef.estimateId ?? estimateInfo.estimateId ?? ""}</td>
                    <td>{reportRef.headerState.estimateTypeCode ?? estimateInfo.type ?? ""}</td>
                    <td>{reportRef.headerState.voyageNo ?? estimateInfo.voyageNo ?? ""}</td>
                    <td>{reportRef.openPosition ?? estimateInfo.openPosition ?? ""}</td>
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
                    <td className="select-cell">{reportRef.headerState.performanceMode ?? "Full"}</td>
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
                <colgroup>
                  <col style={{ width: "18%" }} />
                  <col style={{ width: "18%" }} />
                  <col style={{ width: "16%" }} />
                  <col style={{ width: "16%" }} />
                  <col style={{ width: "16%" }} />
                  <col style={{ width: "16%" }} />
                </colgroup>
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
                  {fuelRows.main.map((row) => (
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
                <colgroup>
                  <col style={{ width: "22%" }} />
                  <col style={{ width: "20%" }} />
                  <col style={{ width: "19%" }} />
                  <col style={{ width: "19%" }} />
                  <col style={{ width: "20%" }} />
                </colgroup>
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
                  {fuelRows.sub.map((row) => (
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
        <div className="report-section-title">Cargo</div>
        <table className="report-grid compact">
          <colgroup>
            <col style={{ width: "3%" }} />
            <col style={{ width: "7%" }} />
            <col style={{ width: "7%" }} />
            <col style={{ width: "14%" }} />
            <col style={{ width: "14%" }} />
            <col style={{ width: "6%" }} />
            <col style={{ width: "3%" }} />
            <col style={{ width: "5%" }} />
            <col style={{ width: "3%" }} />
            <col style={{ width: "3%" }} />
            <col style={{ width: "7%" }} />
            <col style={{ width: "9%" }} />
            <col style={{ width: "4%" }} />
            <col style={{ width: "4%" }} />
            <col style={{ width: "4%" }} />
            <col style={{ width: "7%" }} />
          </colgroup>
          <thead>
            <tr>
              <th>#</th>
              <th>Account</th>
              <th>Cargo</th>
              <th>Load Port</th>
              <th>Discharge Port</th>
              <th>Qty</th>
              <th>Unit</th>
              <th>Frt</th>
              <th>Term</th>
              <th>F/L</th>
              <th>L/S</th>
              <th>Total Freight</th>
              <th>A/Comm</th>
              <th>Brkg</th>
              <th>Tax</th>
              <th>Liner</th>
            </tr>
          </thead>
          <tbody>
            {activeCargoRows.map((row) => (
              <tr key={row.key}>
                <td className="center">{row.no}</td>
                <td>{row.account}</td>
                <td>{row.cargoName}</td>
                <td>{row.loadingPort}</td>
                <td>{row.dischargingPort}</td>
                <td className="num">{row.quantity}</td>
                <td className="center">{row.unit}</td>
                <td className="num">{row.frt}</td>
                <td className="center">{row.term}</td>
                <td className="center">{row.frtType}</td>
                <td className="num">{row.frtLumpsum}</td>
                <td className="num">{row.totalFreight}</td>
                <td className="num">{row.aComm}</td>
                <td className="num">{row.brkg}</td>
                <td className="num">{row.frtTax}</td>
                <td className="num">{row.linerTerm}</td>
              </tr>
            ))}
            <tr className="report-total-row">
              <td colSpan={5}>Total</td>
              <td className="num">{formatAmount(cargoSummary.quantity)}</td>
              <td />
              <td className="num">{formatAmount(cargoSummary.averageFreight)}</td>
              <td />
              <td />
              <td className="num">{formatAmount(cargoSummary.freightLumpsum)}</td>
              <td className="num">{formatAmount(cargoSummary.totalFreight)}</td>
              <td className="num">{formatPercent(cargoSummary.addCommPct)}</td>
              <td className="num">{formatPercent(cargoSummary.brokeragePct)}</td>
              <td className="num">{formatPercent(cargoSummary.freightTaxPct)}</td>
              <td className="num">{formatAmount(cargoSummary.linerTerm)}</td>
            </tr>
          </tbody>
        </table>
        </div>

        <div className="report-block">
        <div className="report-section-title">Port Rotation</div>
        <div className="report-summary-text">{summaryText}</div>
        <table className="report-grid compact">
          <colgroup>
            <col style={{ width: "2.5%" }} />
            <col style={{ width: "5.5%" }} />
            <col style={{ width: "18%" }} />
            <col style={{ width: "5%" }} />
            <col style={{ width: "4%" }} />
            <col style={{ width: "4%" }} />
            <col style={{ width: "4%" }} />
            <col style={{ width: "4%" }} />
            <col style={{ width: "4%" }} />
            <col style={{ width: "5%" }} />
            <col style={{ width: "4%" }} />
            <col style={{ width: "4%" }} />
            <col style={{ width: "5.5%" }} />
            <col style={{ width: "5.5%" }} />
            <col style={{ width: "5%" }} />
            <col style={{ width: "9%" }} />
            <col style={{ width: "9%" }} />
          </colgroup>
          <thead>
            <tr>
              <th>#</th>
              <th>Type</th>
              <th>Port Name / Coordinate</th>
              <th>TZ</th>
              <th>Dist</th>
              <th>ECA</th>
              <th>WF</th>
              <th>Spd</th>
              <th>Sea</th>
              <th>L/D Rate</th>
              <th>Idle</th>
              <th>Working</th>
              <th>Dem</th>
              <th>Des</th>
              <th>Port Charge</th>
              <th>Arrival</th>
              <th>Departure</th>
            </tr>
          </thead>
          <tbody>
            {activePortRows.map((row) => (
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
                <td className="num">{row.ldRate}</td>
                <td className="num">{row.idle}</td>
                <td className="num">{row.working}</td>
                <td className="num">{row.dem}</td>
                <td className="num">{row.des}</td>
                <td className="num">{row.portCharge}</td>
                <td className="center">{row.arrival}</td>
                <td className="center">{row.departure}</td>
              </tr>
            ))}
            <tr className="report-total-row">
              <td colSpan={4}>Totals</td>
              <td className="num">{formatAmount(portSummary.distance)}</td>
              <td className="num">{formatAmount(portSummary.eca)}</td>
              <td />
              <td />
              <td className="num">{formatAmount(portSummary.sea)}</td>
              <td />
              <td className="num">{formatAmount(portSummary.idle)}</td>
              <td className="num">{formatAmount(portSummary.working)}</td>
              <td className="num">{formatAmount(portSummary.dem)}</td>
              <td className="num">{formatAmount(portSummary.des)}</td>
              <td className="num">{formatAmount(portSummary.portCharge)}</td>
              <td />
              <td />
            </tr>
          </tbody>
        </table>
        </div>

        <div className="report-bottom-grid">
          <div className="report-block">
            <div className="report-section-title">Operation Expense</div>
            <table className="report-grid tight kv-grid">
              <colgroup>
                <col style={{ width: "18%" }} />
                <col style={{ width: "32%" }} />
                <col style={{ width: "18%" }} />
                <col style={{ width: "32%" }} />
              </colgroup>
              <tbody>
                {reportRef.operationExpenseRows.map((row, index) => (
                  <tr key={`${row[0]}-${index}`}>
                    <th>{row[0]}</th>
                    <td className="num">{row[1]}</td>
                    <th>{row[2]}</th>
                    <td className="num">{row[3]}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="report-block">
            <div className="report-section-title">Bunker Expense</div>
            <table className="report-grid tight">
              <colgroup>
                <col style={{ width: "20%" }} />
                <col style={{ width: "23%" }} />
                <col style={{ width: "27%" }} />
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
                {bunkerExpenseRows.map((row) => (
                  <tr key={row.fuel}>
                    <td>{row.fuel}</td>
                    <td className="num">{row.price}</td>
                    <td className="num">{row.consumption}</td>
                    <td className="num">{row.expense}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="report-remark-block">
              <div className="report-section-title">Remark</div>
              <div className="report-remark-box">{reportRef.remark?.trim() || ""}</div>
            </div>
          </div>

          <div className="report-block">
            <div className="report-section-title">Result</div>
            <table className="report-grid tight kv-grid">
              <colgroup>
                <col style={{ width: "18%" }} />
                <col style={{ width: "32%" }} />
                <col style={{ width: "18%" }} />
                <col style={{ width: "32%" }} />
              </colgroup>
              <tbody>
                {displayResultRows.map((row, index) => (
                  <tr key={`${row[0]}-${index}`}>
                    <th>{row[0]}</th>
                    <td className="num">{row[1]}</td>
                    <th>{row[2]}</th>
                    <td className="num">{row[3]}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="profit-box">
              <span>Profit/ (Loss)</span>
              <b>{displayProfit}</b>
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

export function buildPrintHtml(content: string) {
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>Voyage Estimation Report</title>
  <style>${REPORT_STYLES}</style>
</head>
<body>${content}</body>
</html>`;
}

export function printReportNode(node: HTMLElement | null) {
  if (!node) return;
  const popup = window.open("", "_blank", "width=1280,height=900");
  if (!popup) return;
  popup.document.open();
  popup.document.write(buildPrintHtml(node.outerHTML));
  popup.document.close();
  popup.focus();
  popup.onload = () => {
    popup.print();
  };
}

export function VoyageReportPreview({
  open,
  onClose,
  data,
  autoPrintToken,
}: {
  open: boolean;
  onClose: () => void;
  data: VoyageReportData;
  autoPrintToken?: number;
}) {
  const reportRef = useRef<HTMLDivElement | null>(null);
  const lastPrintedToken = useRef<number | undefined>(undefined);

  useEffect(() => {
    if (!open || autoPrintToken === undefined || autoPrintToken === lastPrintedToken.current) return;
    lastPrintedToken.current = autoPrintToken;
    window.setTimeout(() => {
      printReportNode(reportRef.current);
    }, 80);
  }, [autoPrintToken, open]);

  const content = useMemo(() => <ReportDocument data={data} />, [data]);

  return (
    <Modal
      open={open}
      onCancel={onClose}
      width={1200}
      centered
      destroyOnHidden
      title="Voyage Estimation Report"
      footer={[
        <Button key="print" type="primary" icon={<PrinterOutlined />} onClick={() => printReportNode(reportRef.current)}>
          Print
        </Button>,
        <Button key="close" onClick={onClose}>
          Close
        </Button>,
      ]}
      styles={{
        body: {
          background: "#E7EDF2",
          padding: 12,
          maxHeight: "80vh",
          overflow: "auto",
        },
      }}
    >
      <style>{REPORT_STYLES}</style>
      <div ref={reportRef}>{content}</div>
    </Modal>
  );
}

export const REPORT_STYLES = `
  @page {
    size: A4 landscape;
    margin: 8mm;
  }

  body {
    margin: 0;
    background: #e7edf2;
    font-family: ${VE_FONT_FAMILY};
    color: #102A3A;
  }

  .voyage-report-sheet {
    width: 1123px;
    min-height: 794px;
    margin: 0 auto;
    background: white;
    box-shadow: 0 0 0 1px #d5dde5;
    padding: 14px 16px;
    box-sizing: border-box;
    font-size: 10.5px;
    line-height: 1.15;
    display: flex;
    flex-direction: column;
  }

  .report-content {
    flex: 1 1 auto;
  }

  .report-top-grid,
  .report-bottom-grid {
    display: grid;
    gap: 8px;
  }

  .report-header {
    display: grid;
    grid-template-columns: 47% 53%;
    margin-bottom: 8px;
  }

  .report-header-left {
    min-width: 0;
    padding-right: 12px;
  }

  .report-header-right {
    display: grid;
    grid-template-columns: minmax(0, 1fr) 250px;
    column-gap: 8px;
  }

  .report-main-title {
    font-size: 15px;
    font-weight: 700;
    color: ${VE_COLORS.sectionTitle};
    margin-bottom: 4px;
  }

  .report-header-meta {
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
    font-size: 10px;
    color: #43586a;
  }

  .report-audit-box {
    width: 250px;
    border: 1px solid ${VE_COLORS.border};
    border-collapse: separate;
    border-spacing: 0;
    table-layout: fixed;
    font-size: 10.5px;
    justify-self: start;
  }

  .report-audit-box td {
    padding: 4px 6px;
    vertical-align: middle;
  }

  .report-audit-box td:first-child {
    width: 38%;
    font-weight: 700;
    color: ${VE_COLORS.headerText};
  }

  .report-top-shell {
    display: grid;
    grid-template-columns: 47% 53%;
    gap: 8px;
    margin-bottom: 8px;
    align-items: start;
  }

  .report-top-left {
    display: grid;
    grid-template-columns: minmax(0, 1fr) 163px;
    gap: 8px;
    align-items: start;
  }

  .report-top-right {
    display: grid;
    grid-template-columns: 300px 250px;
    gap: 8px;
    align-items: start;
  }

  .report-bottom-grid {
    grid-template-columns: 1.08fr 0.9fr 1.08fr;
    margin-top: 8px;
  }

  .report-block {
    margin-bottom: 8px;
  }

  .report-section-title {
    margin-bottom: 3px;
    font-weight: 700;
    font-size: 11px;
    color: ${VE_COLORS.sectionTitle};
  }

  .report-summary-text {
    margin: 0 0 4px;
    font-weight: 700;
    color: #43586a;
    font-size: 9px;
  }

  .report-grid {
    width: calc(100% - 5px);
    margin-right: 5px;
    border-collapse: collapse;
    table-layout: fixed;
  }

  .report-grid th,
  .report-grid td {
    border: 1px solid ${VE_COLORS.border};
    padding: 2px 4px;
    vertical-align: middle;
    word-break: break-word;
  }

  .report-grid thead th,
  .report-grid tbody th {
    background: ${VE_COLORS.headerBg};
    color: ${VE_COLORS.headerText};
    font-weight: 600;
  }

  .report-grid.tight th,
  .report-grid.tight td {
    padding: 2px 3px;
  }

  .report-grid.compact th,
  .report-grid.compact td {
    padding: 1px 3px;
    font-size: 10.5px;
  }

  .report-total-row td {
    background: #f5f7fa;
    font-weight: 700;
  }

  .report-grid .num {
    text-align: right;
    white-space: nowrap;
  }

  .report-grid .center {
    text-align: center;
  }

  .kv-grid th {
    width: 32%;
    text-align: left;
  }

  .top-vessel-block .top-vessel-table {
    margin-bottom: 2px;
  }

  .fuel-main-table,
  .fuel-sub-table {
    font-size: 10.5px;
  }

  .speed-profile-table th,
  .speed-profile-table td,
  .speed-values-table th,
  .speed-values-table td {
    padding: 3px 4px;
  }

  .speed-profile-table th {
    width: 52%;
    text-align: left;
  }

  .select-cell {
    background: #fff;
  }

  .fuel-conditions-line {
    padding-top: 2px;
    text-align: center;
    font-size: 9px;
    color: #5a6e7f;
  }

  .profit-box {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-top: 4px;
    border: 1px solid ${VE_COLORS.border};
    background: #f5f7fa;
    padding: 4px 6px;
    font-size: 10.5px;
    color: ${VE_COLORS.sectionTitle};
    width: calc(100% - 10px);
    margin-right: 10px;
    box-sizing: border-box;
  }

  .profit-box span {
    font-weight: 700;
  }

  .profit-box b {
    font-size: 10.5px;
    font-weight: 600;
  }

  .report-remark-block {
    margin-top: 8px;
  }

  .report-remark-box {
    border: 1px solid ${VE_COLORS.border};
    min-height: 42px;
    padding: 4px 6px;
    white-space: pre-wrap;
    word-break: break-word;
    width: calc(100% - 5px);
    margin-right: 5px;
    box-sizing: border-box;
  }

  .report-footer {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-top: 8px;
    padding-top: 4px;
    border-top: 1px solid ${VE_COLORS.border};
    font-size: 9.5px;
    color: #43586a;
  }

  .page-counter::after {
    content: "Page " counter(page) " of " counter(pages);
  }

  @media print {
    body {
      background: white;
    }

    .voyage-report-sheet {
      width: auto;
      min-height: auto;
      box-shadow: none;
      margin: 0;
      padding: 0;
    }
  }
`;
