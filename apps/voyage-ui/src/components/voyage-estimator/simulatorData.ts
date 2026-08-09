/** ====== MOCK DATA — Bunker / Freight / Analyzer / Laytime ====== */

export type RobRow = {
  key: string;
  port: string;
  span: number;
  wf: string;
  speed: string;
  sea: string;
  portDays: string;
  type: string;
  aQty: string;
  aUnit: string;
  aPrice: string;
  arrRob: string;
  dQty: string;
  dUnit: string;
  dPrice: string;
  depRob: string;
  cSea: string;
  cPort: string;
};

const mk = (
  port: string,
  wf: string,
  speed: string,
  sea: string,
  portDays: string,
  rows: Array<[string, string, string, string, string]>,
): RobRow[] =>
  rows.map(([type, arrRob, depRob, cSea, cPort], i) => ({
    key: `${port}-${type}`,
    port: i === 0 ? port : "",
    span: i === 0 ? rows.length : 0,
    wf: i === 0 ? wf : "",
    speed: i === 0 ? speed : "",
    sea: i === 0 ? sea : "",
    portDays: i === 0 ? portDays : "",
    type,
    aQty: "",
    aUnit: "",
    aPrice: "0.0",
    arrRob,
    dQty: "",
    dUnit: "",
    dPrice: "0.0",
    depRob,
    cSea,
    cPort,
  }));

export const robData: RobRow[] = [
  ...mk("CJK (Changjiangkou) <China>", "", "", "", "0.00", [
    ["VLSFO", "0.0", "0.0", "0.0", "0.0"],
    ["MGO", "0.0", "0.0", "0.0", "0.0"],
    ["ULSFO", "0.0", "0.0", "0.0", "0.0"],
  ]),
  ...mk("Tianjin <China>", "5.0 %", "14.00", "2.11", "3.00", [
    ["VLSFO", "-64.3", "-78.3", "64.3", "14.0"],
    ["MGO", "-0.2", "-0.2", "0.2", "0.0"],
    ["ULSFO", "0.0", "0.0", "0.0", "0.0"],
  ]),
  ...mk("Qingdao <China>", "5.0 %", "14.00", "1.45", "3.50", [
    ["VLSFO", "-128.3", "-144.8", "50.1", "16.5"],
    ["MGO", "-0.4", "-0.4", "0.2", "0.0"],
    ["ULSFO", "0.0", "0.0", "0.0", "0.0"],
  ]),
  ...mk("Rizhao <China>", "5.0 %", "14.00", "0.26", "2.50", [
    ["VLSFO", "-153.7", "-165.2", "8.8", "11.5"],
    ["MGO", "-0.4", "-0.4", "0.0", "0.0"],
    ["ULSFO", "0.0", "0.0", "0.0", "0.0"],
  ]),
  ...mk("Singapore <Singapore>", "5.0 %", "14.00", "7.69", "0.50", [
    ["VLSFO", "-431.3", "-432.8", "266.1", "1.5"],
    ["MGO", "-1.2", "-1.2", "0.8", "0.0"],
    ["ULSFO", "0.0", "0.0", "0.0", "0.0"],
  ]),
  ...mk("Suez Canal (RP) <Routing Points>", "5.0 %", "14.00", "15.77", "0.21", [
    ["VLSFO", "-978.7", "-979.3", "545.8", "0.6"],
    ["MGO", "-2.9", "-2.9", "1.7", "0.0"],
    ["ULSFO", "0.0", "0.0", "0.0", "0.0"],
  ]),
  ...mk("Ravenna <Italy>", "5.0 %", "14.00", "4.24", "3.63", [
    ["VLSFO", "-1,125.9", "-1,125.9", "146.7", "0.0"],
    ["MGO", "-3.3", "-3.3", "0.4", "0.0"],
    ["ULSFO", "0.0", "-17.1", "0.0", "17.1"],
  ]),
];

export type BunkerPriceRow = {
  key: string;
  group: string;
  span: number;
  type: string;
  quantity: string;
  unitPrice: string;
  price: string;
  totalPrice: string;
  negative?: boolean;
};

export const bunkerPriceData: BunkerPriceRow[] = [
  {
    key: "s1",
    group: "Start ROB",
    span: 3,
    type: "VLSFO",
    quantity: "",
    unitPrice: "320.0",
    price: "0.0",
    totalPrice: "0.0",
  },
  {
    key: "s2",
    group: "",
    span: 0,
    type: "MGO",
    quantity: "",
    unitPrice: "360.0",
    price: "0.0",
    totalPrice: "",
  },
  {
    key: "s3",
    group: "",
    span: 0,
    type: "ULSFO",
    quantity: "",
    unitPrice: "350.0",
    price: "0.0",
    totalPrice: "",
  },
  {
    key: "u1",
    group: "Supply",
    span: 3,
    type: "VLSFO",
    quantity: "0.0",
    unitPrice: "0.0",
    price: "0.0",
    totalPrice: "0.0",
  },
  {
    key: "u2",
    group: "",
    span: 0,
    type: "MGO",
    quantity: "0.0",
    unitPrice: "0.0",
    price: "0.0",
    totalPrice: "",
  },
  {
    key: "u3",
    group: "",
    span: 0,
    type: "ULSFO",
    quantity: "0.0",
    unitPrice: "0.0",
    price: "0.0",
    totalPrice: "",
  },
  {
    key: "c1",
    group: "Consumption",
    span: 3,
    type: "VLSFO",
    quantity: "1,411.4",
    unitPrice: "320.0",
    price: "451,659.3",
    totalPrice: "484,272.0",
  },
  {
    key: "c2",
    group: "",
    span: 0,
    type: "MGO",
    quantity: "4.3",
    unitPrice: "360.0",
    price: "1,550.5",
    totalPrice: "",
  },
  {
    key: "c3",
    group: "",
    span: 0,
    type: "ULSFO",
    quantity: "88.7",
    unitPrice: "350.0",
    price: "31,062.2",
    totalPrice: "",
  },
  {
    key: "r1",
    group: "Remain",
    span: 3,
    type: "VLSFO",
    quantity: "-1,411.4",
    unitPrice: "320.0",
    price: "-451,659.3",
    totalPrice: "-484,272.0",
    negative: true,
  },
  {
    key: "r2",
    group: "",
    span: 0,
    type: "MGO",
    quantity: "-4.3",
    unitPrice: "360.0",
    price: "-1,550.5",
    totalPrice: "",
    negative: true,
  },
  {
    key: "r3",
    group: "",
    span: 0,
    type: "ULSFO",
    quantity: "-88.7",
    unitPrice: "350.0",
    price: "-31,062.2",
    totalPrice: "",
    negative: true,
  },
];

export const bunkerComparison: Array<[string, string, string, string]> = [
  ["Duration", "63.6", "68.5", "-4.9"],
  ["Hire", "519,991.7", "560,310.7", "-40,319.0"],
  ["Bunker Consumption", "1,504.5", "1,330.6", "173.9"],
  ["Bunker Expense", "484,272.0", "428,489.1", "55,782.9"],
  ["Total Expense", "1,488,691.6", "1,473,474.2", "15,217.5"],
  ["Daily C/Base", "8,752.5", "8,933.6", "-181.1"],
  ["Profit", "36,308.4", "51,525.8", "-15,217.5"],
];

export type AnalyzerRow = {
  key: string;
  freight: string;
  quantity: string;
  revenue: string;
  dailyHire: string;
  totalHire: string;
  cBase: string;
  opExpense: string;
  profit: string;
  highlight?: "blue" | "orange";
};

const A = (
  freight: string,
  revenue: string,
  cBase: string,
  opExpense: string,
  profit: string,
  highlight?: "blue" | "orange",
): AnalyzerRow => ({
  key: freight,
  freight,
  quantity: "55,000.00",
  revenue,
  dailyHire: "9,000.00",
  totalHire: "213,727.37",
  cBase,
  opExpense,
  profit,
  highlight,
});

export const analyzerData: AnalyzerRow[] = [
  A("6.75", "371,250.00", "5,252.46", "241,657.51", "-84,134.88", "blue"),
  A("7.00", "385,000.00", "5,781.89", "242,345.01", "-71,072.38", "orange"),
  A("7.25", "398,750.00", "6,311.32", "243,032.51", "-58,009.88", "orange"),
  A("7.50", "412,500.00", "6,840.76", "243,720.01", "-44,947.38", "orange"),
  A("7.75", "426,250.00", "7,370.19", "244,407.51", "-31,884.88", "orange"),
  A("8.00", "440,000.00", "7,899.62", "245,095.01", "-18,822.38", "orange"),
  A("8.25", "453,750.00", "8,429.05", "245,782.51", "-5,759.88", "orange"),
  A("8.50", "467,500.00", "8,958.48", "246,470.01", "7,302.62", "blue"),
  A("8.75", "481,250.00", "9,487.91", "247,157.51", "20,365.12", "orange"),
  A("9.00", "495,000.00", "10,017.34", "247,845.01", "33,427.62", "orange"),
  A("9.25", "508,750.00", "10,546.77", "248,532.51", "46,490.12", "orange"),
  A("9.50", "522,500.00", "11,076.20", "249,220.01", "59,552.62", "orange"),
  A("9.75", "536,250.00", "11,605.63", "249,907.51", "72,615.12", "orange"),
  A("10.00", "550,000.00", "12,135.07", "250,595.01", "85,677.62", "orange"),
  A("10.25", "563,750.00", "12,664.50", "251,282.51", "98,740.12", "orange"),
];

/** ====== ANALYZER — sensitivity (what-if) engine ======
 * Base case: freight 8.50 / qty 55,000 / daily hire 9,000 / duration 24.6725 days
 * revenue      = freight x quantity
 * op. expense  = fixed 223,095.01 + 5% commission on revenue
 * total hire   = daily hire x 23.74748 hire days
 * C/Base       = (revenue - op. expense) / duration
 * profit       = revenue - total hire - op. expense
 */
const BASE = {
  freight: 8.5,
  quantity: 55000,
  dailyHire: 9000,
  hireDays: 23.74748,
  duration: 24.6725,
  fixedOp: 223095.01,
  commission: 0.05,
  bunkerPrice: 320,
  bunkerQty: 1504.5,
};

const f2 = (n: number) =>
  n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

function calc(freight: number, quantity: number, dailyHire: number, bunkerPrice: number) {
  const revenue = freight * quantity;
  const bunkerDelta = (bunkerPrice - BASE.bunkerPrice) * BASE.bunkerQty;
  const opExpense = BASE.fixedOp + revenue * BASE.commission + bunkerDelta;
  const totalHire = dailyHire * BASE.hireDays;
  const cBase = (revenue - opExpense) / BASE.duration;
  const profit = revenue - totalHire - opExpense;
  return { revenue, opExpense, totalHire, cBase, profit };
}

export type AnalyzerVariable = "freight" | "hire" | "quantity" | "bunker";

const STEPS: Record<AnalyzerVariable, { base: number; step: number }> = {
  freight: { base: BASE.freight, step: 0.25 },
  hire: { base: BASE.dailyHire, step: 250 },
  quantity: { base: BASE.quantity, step: 1000 },
  bunker: { base: BASE.bunkerPrice, step: 10 },
};

export type AnalyzerCalcRow = AnalyzerRow & { bunkerPrice: string };

/** Sinh bảng độ nhạy cho từng tab (7 bước dưới và 7 bước trên giá trị gốc) */
export function buildAnalyzerRows(
  variable: AnalyzerVariable,
  stepOverride?: number,
): AnalyzerCalcRow[] {
  const { base, step } = STEPS[variable];
  const s = stepOverride ?? step;
  const rows: AnalyzerCalcRow[] = [];
  for (let i = -7; i <= 7; i++) {
    const v = base + i * s;
    const freight = variable === "freight" ? v : BASE.freight;
    const quantity = variable === "quantity" ? v : BASE.quantity;
    const dailyHire = variable === "hire" ? v : BASE.dailyHire;
    const bunkerPrice = variable === "bunker" ? v : BASE.bunkerPrice;
    const r = calc(freight, quantity, dailyHire, bunkerPrice);
    rows.push({
      key: `${variable}-${i}`,
      freight: variable === "freight" ? v.toFixed(2) : BASE.freight.toFixed(2),
      quantity: f2(quantity),
      revenue: f2(r.revenue),
      dailyHire: f2(dailyHire),
      totalHire: f2(r.totalHire),
      cBase: f2(r.cBase),
      opExpense: f2(r.opExpense),
      profit: f2(r.profit),
      bunkerPrice: f2(bunkerPrice),
      highlight: i === 0 ? "blue" : "orange",
    });
  }
  // đánh dấu dòng đổi dấu lãi/lỗ (break even point)
  for (let i = 1; i < rows.length; i++) {
    const prev = Number(rows[i - 1]!.profit.replace(/,/g, ""));
    const cur = Number(rows[i]!.profit.replace(/,/g, ""));
    if (prev < 0 && cur >= 0) rows[i]!.highlight = "blue";
  }
  return rows;
}

/** Tab Interactive — giá & chi phí bunker */
export const interactiveBunker: Array<{ type: string; unitPrice: string; expense: string }> = [
  { type: "VLSFO", unitPrice: "320.0", expense: "451,659.3" },
  { type: "MGO", unitPrice: "360.0", expense: "1,550.5" },
  { type: "ULSFO", unitPrice: "350.0", expense: "31,062.2" },
];
export const interactiveBunkerTotal = "484,272.0";

export type FreightSimRow = {
  key: string;
  account: string;
  cargoName: string;
  freight: string;
  revenue: string;
};

export const freightSimData: FreightSimRow[] = [
  { key: "1", account: "5011ACCT1", cargoName: "general", freight: "26.8", revenue: "402,689.7" },
  { key: "2", account: "5011ACCT1", cargoName: "general", freight: "25.3", revenue: "252,915.5" },
  { key: "3", account: "5011ACCT1", cargoName: "general", freight: "35.6", revenue: "355,684.1" },
  { key: "4", account: "5011ACCT2", cargoName: "steel", freight: "34.2", revenue: "513,710.8" },
];

export const freightSimTotal = "1,525,000.0";
