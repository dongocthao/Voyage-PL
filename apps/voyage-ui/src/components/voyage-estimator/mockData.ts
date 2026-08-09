/** ============ MOCK DATA — Voyage Estimator (Estimation - 5011) ============ */

export type VesselRow = {
  key: string;
  mv: string;
  dwt: string;
  draft: string;
  tpc: string;
  built: string;
  kind: string;
  type: string;
};

export const vesselData: VesselRow[] = [
  {
    key: "1",
    mv: "oriental phoenix",
    dwt: "56,811",
    draft: "12.80",
    tpc: "58.00",
    built: "2012",
    kind: "",
    type: "TCT",
  },
];

export type FuelMainRow = {
  key: string;
  main: string;
  type: string;
  ballast: string;
  laden: string;
  idle: string;
  work: string;
};

export const fuelMainData: FuelMainRow[] = [
  {
    key: "1",
    main: "Normal",
    type: "VLSFO",
    ballast: "29.00",
    laden: "33.00",
    idle: "2.50",
    work: "5.00",
  },
  {
    key: "2",
    main: "ECA",
    type: "ULSFO",
    ballast: "29.00",
    laden: "33.00",
    idle: "2.50",
    work: "5.00",
  },
];

export type FuelSubRow = {
  key: string;
  sub: string;
  type: string;
  sea: string;
  idle: string;
  work: string;
};

export const fuelSubData: FuelSubRow[] = [
  { key: "1", sub: "Normal", type: "MGO", sea: "0.10", idle: "0.00", work: "0.00" },
  { key: "2", sub: "ECA", type: "MGO", sea: "0.10", idle: "0.00", work: "0.00" },
];

export const speedData = { ballast: "14.00", laden: "14.00" };

/** Dòng thông tin ước tính dưới bảng thông số tàu */
export const estimateInfo = {
  estimateId: "",
  type: "TCT",
  voyageNo: "",
  openPosition: "",
  operator: "",
};

export type CargoRow = {
  key: string;
  no: number;
  account: string;
  accountCompanyId?: string;
  cargoName: string;
  cargoId?: string;
  loadingPort: string;
  loadingPortId?: string;
  dischargingPort: string;
  dischargingPortId?: string;
  quantity: string;
  unit: string;
  frt: string;
  term: string;
  freightTermId?: string;
  frtType: string;
  isFreightFixed?: boolean;
  frtLumpsum: string;
  totalFreight: string;
  aComm: string;
  brkg: string;
  frtTax: string;
  linerTerm: string;
};

export const cargoData: CargoRow[] = [
  {
    key: "1",
    no: 1,
    account: "5011ACCT1",
    accountCompanyId: undefined,
    cargoName: "general",
    cargoId: undefined,
    loadingPort: "Tianjin <China> [+08:00]",
    loadingPortId: undefined,
    dischargingPort: "Ravenna <Italy> [+01:00]",
    dischargingPortId: undefined,
    quantity: "15,000.0",
    unit: "MT",
    frt: "28.0",
    term: "FIO",
    freightTermId: undefined,
    frtType: "F",
    isFreightFixed: false,
    frtLumpsum: "",
    totalFreight: "420,000.0",
    aComm: "3.8 %",
    brkg: "1.3 %",
    frtTax: "",
    linerTerm: "",
  },
  {
    key: "2",
    no: 2,
    account: "5011ACCT1",
    accountCompanyId: undefined,
    cargoName: "general",
    cargoId: undefined,
    loadingPort: "Rizhao <China> [+08:00]",
    loadingPortId: undefined,
    dischargingPort: "Ravenna <Italy> [+01:00]",
    dischargingPortId: undefined,
    quantity: "10,000.0",
    unit: "MT",
    frt: "28.0",
    term: "FIO",
    freightTermId: undefined,
    frtType: "F",
    isFreightFixed: false,
    frtLumpsum: "",
    totalFreight: "280,000.0",
    aComm: "3.8 %",
    brkg: "1.3 %",
    frtTax: "",
    linerTerm: "",
  },
  {
    key: "3",
    no: 3,
    account: "5011ACCT1",
    accountCompanyId: undefined,
    cargoName: "general",
    cargoId: undefined,
    loadingPort: "Tianjin <China> [+08:00]",
    loadingPortId: undefined,
    dischargingPort: "Rotterdam <Netherlands> [...]",
    dischargingPortId: undefined,
    quantity: "10,000.0",
    unit: "MT",
    frt: "30.0",
    term: "FIO",
    freightTermId: undefined,
    frtType: "F",
    isFreightFixed: false,
    frtLumpsum: "",
    totalFreight: "300,000.0",
    aComm: "3.8 %",
    brkg: "1.3 %",
    frtTax: "",
    linerTerm: "",
  },
  {
    key: "4",
    no: 4,
    account: "5011ACCT2",
    accountCompanyId: undefined,
    cargoName: "steel",
    cargoId: undefined,
    loadingPort: "Qingdao <China> [+08:00]",
    loadingPortId: undefined,
    dischargingPort: "Rotterdam <Netherlands> [...]",
    dischargingPortId: undefined,
    quantity: "15,000.0",
    unit: "MT",
    frt: "35.0",
    term: "FIO",
    freightTermId: undefined,
    frtType: "F",
    isFreightFixed: false,
    frtLumpsum: "",
    totalFreight: "525,000.0",
    aComm: "3.8 %",
    brkg: "1.3 %",
    frtTax: "",
    linerTerm: "",
  },
  {
    key: "5",
    no: 5,
    account: "",
    accountCompanyId: undefined,
    cargoName: "",
    cargoId: undefined,
    loadingPort: "",
    loadingPortId: undefined,
    dischargingPort: "",
    dischargingPortId: undefined,
    quantity: "",
    unit: "",
    frt: "",
    term: "",
    freightTermId: undefined,
    frtType: "F",
    isFreightFixed: false,
    frtLumpsum: "",
    totalFreight: "",
    aComm: "",
    brkg: "",
    frtTax: "",
    linerTerm: "",
  },
];

export const cargoTotals = {
  quantity: "50,000.0",
  frt: "30.5",
  frtLumpsum: "",
  totalFreight: "1,525,000.0",
  aComm: "3.8 %",
  brkg: "1.3 %",
  frtTax: "0.0 %",
  linerTerm: "0.0",
};

export type PortRow = {
  key: string;
  no: string;
  type: string;
  port: string;
  portId?: string;
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

export const portRotationData: PortRow[] = [
  {
    key: "1",
    no: "1",
    type: "Ballast",
    port: "CJK (Changjiangkou) <China> [+08:00]",
    portId: undefined,
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
    departure: "2020-08-06 16:10",
  },
  {
    key: "2",
    no: "2",
    type: "Loading",
    port: "Tianjin <China> [+08:00]",
    portId: undefined,
    distance: "676",
    eca: "0",
    wf: "5.0 %",
    spd: "14.00",
    sea: "2.11",
    ldRate: "10,000.0",
    idle: "0.50",
    working: "2.50",
    dem: "",
    des: "3,000.0",
    portCharge: "45,000.0",
    arrival: "2020-08-08 21:21",
    departure: "2020-08-11 23:49",
  },
  {
    key: "3",
    no: "3",
    type: "Loading",
    port: "Qingdao <China> [+08:00]",
    portId: undefined,
    distance: "463",
    eca: "0",
    wf: "5.0 %",
    spd: "14.00",
    sea: "1.45",
    ldRate: "5,000.0",
    idle: "0.50",
    working: "3.00",
    dem: "",
    des: "2,500.0",
    portCharge: "35,000.0",
    arrival: "2020-08-13 12:13",
    departure: "2020-08-17 02:41",
  },
  {
    key: "4",
    no: "4",
    type: "Loading",
    port: "Rizhao <China> [+08:00]",
    portId: undefined,
    distance: "82",
    eca: "0",
    wf: "5.0 %",
    spd: "14.00",
    sea: "0.26",
    ldRate: "5,000.0",
    idle: "0.50",
    working: "2.00",
    dem: "",
    des: "3,000.0",
    portCharge: "35,000.0",
    arrival: "2020-08-17 09:07",
    departure: "2020-08-19 23:35",
  },
  {
    key: "5",
    no: "5",
    type: "Bunker",
    port: "Singapore <Singapore> [+08:00]",
    portId: undefined,
    distance: "2,461",
    eca: "0",
    wf: "5.0 %",
    spd: "14.00",
    sea: "7.69",
    ldRate: "",
    idle: "0.50",
    working: "",
    dem: "",
    des: "3,000.0",
    portCharge: "20,000.0",
    arrival: "2020-08-28 01:09",
    departure: "2020-08-28 15:37",
  },
  {
    key: "6",
    no: "6",
    type: "Canal",
    port: "Suez Canal (RP) <Routing Points> [+0...",
    portId: undefined,
    distance: "5,047",
    eca: "0",
    wf: "5.0 %",
    spd: "14.00",
    sea: "15.77",
    ldRate: "",
    idle: "0.21",
    working: "",
    dem: "",
    des: "",
    portCharge: "185,000.0",
    arrival: "2020-09-13 22:34",
    departure: "2020-09-14 04:36",
  },
  {
    key: "7",
    no: "7",
    type: "Dischg.",
    port: "Ravenna <Italy> [+01:00]",
    portId: undefined,
    distance: "1,356",
    eca: "0",
    wf: "5.0 %",
    spd: "14.00",
    sea: "4.24",
    ldRate: "8,000.0",
    idle: "0.50",
    working: "3.13",
    dem: "",
    des: "3,000.0",
    portCharge: "40,000.0",
    arrival: "2020-09-18 14:15",
    departure: "2020-09-22 07:43",
  },
  {
    key: "8",
    no: "8",
    type: "Dischg.",
    port: "Rotterdam <Netherlands> [+01...",
    portId: undefined,
    distance: "3,057",
    eca: "417",
    wf: "5.0 %",
    spd: "14.00",
    sea: "9.55",
    ldRate: "10,000.0",
    idle: "0.50",
    working: "1.00",
    dem: "",
    des: "3,000.0",
    portCharge: "20,000.0",
    arrival: "2020-10-02 08:10",
    departure: "2020-10-03 22:38",
  },
  {
    key: "9",
    no: "9",
    type: "Dischg.",
    port: "Rotterdam <Netherlands> [+01:00]",
    portId: undefined,
    distance: "0",
    eca: "0",
    wf: "5.0 %",
    spd: "14.00",
    sea: "0.00",
    ldRate: "5,000.0",
    idle: "1.66",
    working: "3.00",
    dem: "",
    des: "2,500.0",
    portCharge: "20,000.0",
    arrival: "2020-10-03 22:38",
    departure: "2020-10-08 22:34",
  },
  {
    key: "10",
    no: "10",
    type: "",
    port: "",
    portId: undefined,
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
    portId: undefined,
    distance: "",
    eca: "",
    wf: "",
    spd: "",
    sea: "2.00",
    ldRate: "",
    idle: "1.00",
    working: "",
    dem: "",
    des: "",
    portCharge: "",
    arrival: "",
    departure: "",
  },
];

export const portRotationTotals = {
  distance: "13,142",
  eca: "417",
  sea: "43.07",
  ldRate: "",
  idle: "5.87",
  working: "14.63",
  dem: "0.0",
  des: "17,000.0",
  portCharge: "383,000.0",
  arrival: "2020-08-06 16:10",
  departure: "2020-10-08 22:34",
};

export const portSummary =
  "Total Duration: 63.56 Days (Ballast: 2.22, Laden: 40.85, ECA: 11.70, Port: 20.49) / (Port local time) 2020-08-06 16:10 ~ 2020-10-08 22:34";

export const operationExpense: Array<[string, string, string, string]> = [
  ["Dem/Des", "17,000.0", "Bunker Expense", "484,272.0"],
  ["Add Comm.", "57,187.5", "C.E.V.", "3,177.9"],
  ["Brokerage", "19,062.5", "ILOHC", "5,000.0"],
  ["Freight Tax", "0.0", "Ballast Bonus", "0.0"],
  ["Liner Terms", "0.0", "Routing Service", "0.0"],
  ["Port Charge", "383,000.0", "Others", "0.0"],
];

export type BunkerRow = {
  key: string;
  type: string;
  price: string;
  consumption: string;
  expense: string;
};

export const bunkerData: BunkerRow[] = [
  { key: "1", type: "VLSFO", price: "320.0", consumption: "1,411.4", expense: "451,659.3" },
  { key: "2", type: "MGO", price: "360.0", consumption: "4.3", expense: "1,550.5" },
  { key: "3", type: "ULSFO", price: "350.0", consumption: "88.7", expense: "31,062.2" },
];

export const resultRows: Array<[string, string, string, string]> = [
  ["Hire / Day", "8,500.0", "Revenue", "1,525,000.0"],
  ["H/Add Comm.", "3.8 %", "Op. Expense", "968,699.9"],
  ["Net Hire", "8,181.3", "Op. Profit", "556,300.1"],
  ["C/Base", "8,752.5", "Total Hire", "519,991.7"],
  ["", "", "Total Expense", "1,488,691.6"],
];

export const profitUsd = "36,308.4";
