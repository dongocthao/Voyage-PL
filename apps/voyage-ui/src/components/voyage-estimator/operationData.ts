/** ====== MOCK DATA — Operation (Netpas Prosperity) ====== */

export const opVessel = {
  mv: "Netpas Prosperity",
  dwt: "57,650",
  draft: "12.80",
  tpc: "58.00",
  built: "2018",
  kind: "SDBC",
  type: "",
};

export const opSpeed = { ballast: "14.50", laden: "14.00" };

export type OpFuelMainRow = {
  key: string;
  main: string;
  type: string;
  ballast: string;
  laden: string;
  idle: string;
  work: string;
};
export const opFuelMain: OpFuelMainRow[] = [
  {
    key: "1",
    main: "Normal",
    type: "VLSFO",
    ballast: "32.00",
    laden: "32.00",
    idle: "3.00",
    work: "5.00",
  },
  {
    key: "2",
    main: "ECA",
    type: "ULSFO",
    ballast: "32.00",
    laden: "32.00",
    idle: "3.00",
    work: "5.00",
  },
];

export type OpFuelSubRow = {
  key: string;
  sub: string;
  type: string;
  sea: string;
  idle: string;
  work: string;
};
export const opFuelSub: OpFuelSubRow[] = [
  { key: "1", sub: "Normal", type: "MGO", sea: "0.10", idle: "0.10", work: "0.10" },
  { key: "2", sub: "ECA", type: "MGO", sea: "0.10", idle: "0.10", work: "0.10" },
];

export type OpCargoRow = {
  key: string;
  no: string;
  account: string;
  cargoName: string;
  loadingPort: string;
  dischargingPort: string;
  quantity: string;
  unit: string;
  frt: string;
  term: string;
  totalFreight: string;
  aComm: string;
  brkg: string;
  frtTax: string;
  linerTerm: string;
};

export const opCargoData: OpCargoRow[] = [
  {
    key: "1",
    no: "1",
    account: "Erin0506",
    cargoName: "coal in bulk",
    loadingPort: "Taboneo (ID) [+08:00]",
    dischargingPort: "Guangzhou (CN) [+08:00]",
    quantity: "55,000.00",
    unit: "MT",
    frt: "9.50",
    term: "FIO",
    totalFreight: "522,500.00",
    aComm: "3.75 %",
    brkg: "1.25 %",
    frtTax: "",
    linerTerm: "",
  },
  {
    key: "2",
    no: "2",
    account: "",
    cargoName: "",
    loadingPort: "",
    dischargingPort: "",
    quantity: "",
    unit: "",
    frt: "",
    term: "",
    totalFreight: "",
    aComm: "",
    brkg: "",
    frtTax: "",
    linerTerm: "",
  },
];

export const opCargoTotals = {
  quantity: "55,000.00",
  frt: "9.50",
  totalFreight: "522,500.00",
  aComm: "3.75 %",
  brkg: "1.25 %",
  frtTax: "0.00 %",
  linerTerm: "0.00",
};

export type OpPortRow = {
  key: string;
  no: string;
  type: string;
  port: string;
  distance: string;
  eca: string;
  wf: string;
  spd: string;
  sea: string;
  ldRate: string;
  idle: string;
  working: string;
  dem: string;
  des: string;
  portCharge: string;
  arrival: string;
  departure: string;
};

export const opPortData: OpPortRow[] = [
  {
    key: "1",
    no: "1",
    type: "Ballast",
    port: "Singapore (SG) [+08:00]",
    distance: "",
    eca: "",
    wf: "",
    spd: "",
    sea: "",
    ldRate: "",
    idle: "",
    working: "",
    dem: "",
    des: "",
    portCharge: "",
    arrival: "",
    departure: "2022-05-06 12:41",
  },
  {
    key: "2",
    no: "2",
    type: "Loading",
    port: "Taboneo (ID) [+08:00]",
    distance: "773",
    eca: "0",
    wf: "",
    spd: "7.39",
    sea: "4.36",
    ldRate: "8,500.00",
    idle: "0.50",
    working: "6.47",
    dem: "",
    des: "5,426.47",
    portCharge: "15,000.00",
    arrival: "2022-05-10 21:18",
    departure: "2022-05-18 02:35",
  },
  {
    key: "3",
    no: "3",
    type: "Dischg.",
    port: "Guangzhou (CN) [+08:00]",
    distance: "1,972",
    eca: "0",
    wf: "0.0 %",
    spd: "14.00",
    sea: "5.87",
    ldRate: "18,000.00",
    idle: "0.50",
    working: "3.06",
    dem: "",
    des: "12,166.67",
    portCharge: "45,000.00",
    arrival: "2022-05-24 08:09",
    departure: "2022-05-28 03:29",
  },
  {
    key: "4",
    no: "4",
    type: "",
    port: "",
    distance: "",
    eca: "",
    wf: "",
    spd: "",
    sea: "",
    ldRate: "",
    idle: "",
    working: "",
    dem: "",
    des: "",
    portCharge: "",
    arrival: "",
    departure: "",
  },
  {
    key: "5",
    no: "5",
    type: "",
    port: "",
    distance: "",
    eca: "",
    wf: "",
    spd: "",
    sea: "",
    ldRate: "",
    idle: "",
    working: "",
    dem: "",
    des: "",
    portCharge: "",
    arrival: "",
    departure: "",
  },
  {
    key: "margin",
    no: "",
    type: "Margin",
    port: "",
    distance: "",
    eca: "",
    wf: "",
    spd: "",
    sea: "0.36",
    ldRate: "",
    idle: "0.50",
    working: "",
    dem: "",
    des: "",
    portCharge: "",
    arrival: "",
    departure: "",
  },
];

export const opPortTotals = {
  distance: "2,745",
  eca: "0",
  sea: "10.59",
  idle: "1.50",
  working: "9.53",
  dem: "0.00",
  des: "17,593.14",
  portCharge: "60,000.00",
  arrival: "2022-05-06 12:41",
  departure: "2022-05-28 03:29",
};

export const opPortSummary =
  "Total Duration: 21.62 (ECA: 0) Days (Ballast: 4.36, Laden: 6.23, Port: 11.03) / (Port local time) 2022-05-06 12:41 ~ 2022-05-28 03:29";

export const opExpense: Array<[string, string, string, string]> = [
  ["Dem/Des", "17,593.14", "Bunker Expense", "148,092.15"],
  ["Add Comm.", "19,593.75", "C.E.V.", "1,080.84"],
  ["Brokerage", "6,531.25", "ILOHC", "5,000.00"],
  ["Freight Tax", "0.00", "Ballast Bonus", ""],
  ["Liner Terms", "0.00", "Routing Service", ""],
  ["Port Charge", "60,000.00", "Others", "0.00"],
];

export type OpBunkerRow = {
  key: string;
  type: string;
  price: string;
  consumption: string;
  expense: string;
};
export const opBunkerData: OpBunkerRow[] = [
  { key: "1", type: "VLSFO", price: "450.00", consumption: "327.04", expense: "147,170.14" },
  { key: "2", type: "MGO", price: "470.00", consumption: "1.96", expense: "922.01" },
  { key: "3", type: "ULSFO", price: "0.00", consumption: "0.00", expense: "0.00" },
];

export const opResultRows: Array<[string, string, string, string]> = [
  ["Hire / Day", "12,000.00", "Revenue", "522,500.00"],
  ["H/Add Comm.", "1.25 %", "Op. Expense", "257,891.12"],
  ["Net Hire", "11,850.00", "Op. Profit", "264,608.88"],
  ["Off Hire", "0.00", "Total Hire", "256,157.96"],
  ["C/Base", "12,240.94", "Total Expense", "514,049.08"],
];

export const opProfitUsd = "8,450.92";

/** ROB / Supply / Consumption dùng chung cho Arrival & Departure Report */
export const FUEL_TYPES = ["VLSFO", "MGO", "ULSFO"] as const;

export const arrivalReport = {
  portTitle: "Arrival Record at Lanshan (CN) [+08:00] Sailed from Vostochny (RU) [+10:00]",
  time: "8/31/2022 21:00 +08:00",
  note: "Sailing 3.97 days",
  rob: ["811.50", "82.73", "0.00"],
  seaConsumption: ["118.63", "0.37", "0.00"],
  totalDistance: "1,017",
  ecaDistance: "0",
  avSpeed: "10.68",
};

export const departureReport = {
  portTitle: "Departure Record at Lanshan (CN) [+08:00] Discharging coal in bulk",
  time: "9/5/2022 15:00 +08:00",
  note: "Port Stay 4.75 days",
  idle: "1.00",
  work: "3.75",
  rob: ["791.50", "80.10", "0.00"],
  portConsumption: ["20.00", "1.50", "0.00"],
  laytime: "Laytime Saved 1.277778 days  Despatch 12,777.78",
  portChargeTotal: "45,000.00",
};

export const startOperation = {
  vessel: "Xin Meng Xiang",
  voyageNumber: "voyage1",
  statistics: "Sep 2022",
  commencing: "8/21/2022 09:00",
  completed: "9/7/2022 14:21",
  folder: "Common",
};

export type ContractRow = {
  key: string;
  contractNo: string;
  type: string;
  cpDate: string;
  charterers: string;
  vessel: string;
  cargo: string;
  ok?: boolean;
};

export const startContracts: ContractRow[] = [
  {
    key: "1",
    contractNo: "Coal202202",
    type: "VC Own",
    cpDate: "8/1/2022",
    charterers: "Coal Trader",
    vessel: "",
    cargo: "Coal in Bulk",
    ok: true,
  },
  { key: "2", contractNo: "", type: "", cpDate: "", charterers: "", vessel: "", cargo: "" },
];
