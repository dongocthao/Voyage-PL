/** ====== MOCK DATA — Cargo Relet (English) ====== */

export type ReletCargoRow = {
  key: string;
  no: string;
  account: string;
  cargoName: string;
  loadingPort: string;
  dischargingPort: string;
  quantity: string;
  unit: string;
  hFrt: string;
  hFrtType: string;
  hFrtLumpsum: string;
  hComm: string;
  hBrkg: string;
  hNet: string;
  hLiner: string;
  sFrt: string;
  sFrtType: string;
  sFrtLumpsum: string;
  sComm: string;
  sBrkg: string;
  sNet: string;
  sLiner: string;
};

export const reletCargoData: ReletCargoRow[] = [
  {
    key: "1",
    no: "1",
    account: "RELET-ACCT1",
    cargoName: "steel coil",
    loadingPort: "Qingdao <China> [+08:00]",
    dischargingPort: "Rotterdam <Netherlands>",
    quantity: "25,000.0",
    unit: "MT",
    hFrt: "35.0",
    hFrtType: "F",
    hFrtLumpsum: "",
    hComm: "3.8 %",
    hBrkg: "1.3 %",
    hNet: "33.3",
    hLiner: "0.0",
    sFrt: "38.0",
    sFrtType: "F",
    sFrtLumpsum: "",
    sComm: "2.5 %",
    sBrkg: "1.0 %",
    sNet: "37.1",
    sLiner: "0.0",
  },
  {
    key: "2",
    no: "2",
    account: "RELET-ACCT1",
    cargoName: "general",
    loadingPort: "Tianjin <China> [+08:00]",
    dischargingPort: "Ravenna <Italy> [+01:00]",
    quantity: "15,000.0",
    unit: "MT",
    hFrt: "28.0",
    hFrtType: "F",
    hFrtLumpsum: "",
    hComm: "3.8 %",
    hBrkg: "1.3 %",
    hNet: "26.6",
    hLiner: "0.0",
    sFrt: "31.0",
    sFrtType: "F",
    sFrtLumpsum: "",
    sComm: "2.5 %",
    sBrkg: "1.0 %",
    sNet: "30.2",
    sLiner: "0.0",
  },
  {
    key: "3",
    no: "3",
    account: "RELET-ACCT2",
    cargoName: "bagged cement",
    loadingPort: "Rizhao <China> [+08:00]",
    dischargingPort: "Ravenna <Italy> [+01:00]",
    quantity: "10,000.0",
    unit: "MT",
    hFrt: "30.0",
    hFrtType: "F",
    hFrtLumpsum: "",
    hComm: "3.8 %",
    hBrkg: "1.3 %",
    hNet: "28.5",
    hLiner: "0.0",
    sFrt: "33.0",
    sFrtType: "F",
    sFrtLumpsum: "",
    sComm: "2.5 %",
    sBrkg: "1.0 %",
    sNet: "32.2",
    sLiner: "0.0",
  },
  {
    key: "4",
    no: "4",
    account: "",
    cargoName: "",
    loadingPort: "",
    dischargingPort: "",
    quantity: "",
    unit: "",
    hFrt: "",
    hFrtType: "F",
    hFrtLumpsum: "",
    hComm: "",
    hBrkg: "",
    hNet: "",
    hLiner: "",
    sFrt: "",
    sFrtType: "F",
    sFrtLumpsum: "",
    sComm: "",
    sBrkg: "",
    sNet: "",
    sLiner: "",
  },
];

export const reletCargoTotals = {
  quantity: "50,000.0",
  hFrt: "32.1",
  hFrtLumpsum: "",
  hComm: "3.8 %",
  hBrkg: "1.3 %",
  hNet: "30.5",
  hLiner: "0.0",
  sFrt: "35.2",
  sFrtLumpsum: "",
  sComm: "2.5 %",
  sBrkg: "1.0 %",
  sNet: "34.3",
  sLiner: "0.0",
};

export type ReletPortRow = {
  key: string;
  no: string;
  type: string;
  port: string;
  timezone?: string;
  distance: string;
  eca: string;
  wf: string;
  spd: string;
  sea: string;
  hLd: string;
  hDem: string;
  hDes: string;
  sLd: string;
  sDem: string;
  sDes: string;
  idle: string;
  working: string;
  portCharge: string;
  arrival: string;
  departure: string;
};

export const reletPortData: ReletPortRow[] = [
  {
    key: "1",
    no: "1",
    type: "Ballast",
    port: "CJK (Changjiangkou) <China>",
    distance: "",
    eca: "",
    wf: "",
    spd: "",
    sea: "",
    hLd: "",
    hDem: "",
    hDes: "",
    sLd: "",
    sDem: "",
    sDes: "",
    idle: "",
    working: "",
    portCharge: "",
    arrival: "",
    departure: "2021-01-14 11:38",
  },
  {
    key: "2",
    no: "2",
    type: "Loading",
    port: "Qingdao <China> [+08:00]",
    distance: "463",
    eca: "0",
    wf: "5.0 %",
    spd: "14.00",
    sea: "1.45",
    hLd: "10,000.0",
    hDem: "0.0",
    hDes: "3,000.0",
    sLd: "12,000.0",
    sDem: "0.0",
    sDes: "3,500.0",
    idle: "0.50",
    working: "2.50",
    portCharge: "35,000.0",
    arrival: "2021-01-16 04:12",
    departure: "2021-01-19 06:40",
  },
  {
    key: "3",
    no: "3",
    type: "Loading",
    port: "Tianjin <China> [+08:00]",
    distance: "676",
    eca: "0",
    wf: "5.0 %",
    spd: "14.00",
    sea: "2.11",
    hLd: "8,000.0",
    hDem: "0.0",
    hDes: "2,500.0",
    sLd: "9,000.0",
    sDem: "0.0",
    sDes: "3,000.0",
    idle: "0.50",
    working: "1.88",
    portCharge: "45,000.0",
    arrival: "2021-01-21 11:21",
    departure: "2021-01-23 20:49",
  },
  {
    key: "4",
    no: "4",
    type: "Canal",
    port: "Suez Canal (RP) <Routing Points>",
    distance: "7,508",
    eca: "0",
    wf: "5.0 %",
    spd: "14.00",
    sea: "23.46",
    hLd: "",
    hDem: "",
    hDes: "",
    sLd: "",
    sDem: "",
    sDes: "",
    idle: "0.21",
    working: "",
    portCharge: "185,000.0",
    arrival: "2021-02-16 07:34",
    departure: "2021-02-16 12:36",
  },
  {
    key: "5",
    no: "5",
    type: "Dischg.",
    port: "Ravenna <Italy> [+01:00]",
    distance: "1,356",
    eca: "0",
    wf: "5.0 %",
    spd: "14.00",
    sea: "4.24",
    hLd: "8,000.0",
    hDem: "0.0",
    hDes: "3,000.0",
    sLd: "8,500.0",
    sDem: "0.0",
    sDes: "3,200.0",
    idle: "0.50",
    working: "3.13",
    portCharge: "40,000.0",
    arrival: "2021-02-20 19:15",
    departure: "2021-02-24 12:43",
  },
  {
    key: "6",
    no: "6",
    type: "Dischg.",
    port: "Rotterdam <Netherlands> [+01:00]",
    distance: "3,057",
    eca: "417",
    wf: "5.0 %",
    spd: "14.00",
    sea: "9.55",
    hLd: "10,000.0",
    hDem: "0.0",
    hDes: "3,000.0",
    sLd: "11,000.0",
    sDem: "0.0",
    sDes: "3,400.0",
    idle: "0.50",
    working: "2.50",
    portCharge: "20,000.0",
    arrival: "2021-03-06 05:10",
    departure: "2021-03-09 19:38",
  },
  {
    key: "7",
    no: "7",
    type: "",
    port: "",
    distance: "",
    eca: "",
    wf: "",
    spd: "",
    sea: "",
    hLd: "",
    hDem: "",
    hDes: "",
    sLd: "",
    sDem: "",
    sDes: "",
    idle: "",
    working: "",
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
    sea: "2.00",
    hLd: "",
    hDem: "",
    hDes: "",
    sLd: "",
    sDem: "",
    sDes: "",
    idle: "1.00",
    working: "",
    portCharge: "",
    arrival: "",
    departure: "",
  },
];

export const reletPortTotals = {
  distance: "13,060",
  eca: "417",
  sea: "40.81",
  hDem: "0.0",
  hDes: "11,500.0",
  sDem: "0.0",
  sDes: "13,100.0",
  idle: "2.21",
  working: "10.01",
  portCharge: "325,000.0",
  arrival: "2021-01-14 11:38",
  departure: "2021-03-09 19:38",
};

export const reletPortSummary =
  "Total Duration: 54.34 Days (Ballast: 1.45, Laden: 39.36, ECA: 1.30, Port: 12.22) / (Port local time) 2021-01-14 11:38 ~ 2021-03-09 19:38";

export const reletHeadExpense: Array<[string, string, string, string]> = [
  ["Dem/Des", "11,500.0", "Bunker Expense", "484,272.0"],
  ["Add Comm.", "61,000.0", "C.E.V.", "3,177.9"],
  ["Brokerage", "20,865.0", "ILOHC", "5,000.0"],
  ["Freight Tax", "0.0", "Ballast Bonus", "0.0"],
  ["Liner Terms", "0.0", "Routing Service", "0.0"],
  ["Port Charge", "325,000.0", "Others", "0.0"],
];

export const reletResultRows: Array<[string, string, string, string]> = [
  ["Head CP Freight", "1,605,000.0", "Sub CP Freight", "1,760,000.0"],
  ["Head CP Net", "1,525,750.0", "Sub CP Net", "1,716,000.0"],
  ["Op. Expense", "910,814.9", "Days", "54.34"],
  ["Net Voyage Days", "54.34", "TCE / Day", "9,120.0"],
];

export const reletProfitUsd = "190,250.0";
