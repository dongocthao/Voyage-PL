/** ====== MOCK DATA — Time Charter Estimation (English) ====== */

export type TcCpRow = {
  key: string;
  account: string;
  deliveryPort: string;
  redeliveryPort: string;
  duration: string;
  dailyHire: string;
  grossHire: string;
  addComm: string;
  brkg: string;
};

export const tcHeadCp: TcCpRow[] = [
  {
    key: "h",
    account: "Sample",
    deliveryPort: "Changjiagang <China> [+08:00]",
    redeliveryPort: "Singapore <Singapore> [+08:00]",
    duration: "37.26",
    dailyHire: "7,000.0",
    grossHire: "260,840.3",
    addComm: "3.9 %",
    brkg: "",
  },
];

export const tcSubCp: TcCpRow[] = [
  {
    key: "s",
    account: "Netpas",
    deliveryPort: "Tianjin <China> [+08:00]",
    redeliveryPort: "Singapore <Singapore> [+08:00]",
    duration: "35.00",
    dailyHire: "8,500.0",
    grossHire: "297,500.0",
    addComm: "3.8 %",
    brkg: "1.3 %",
  },
];

export type TcPortRow = {
  key: string;
  no: string;
  type: string;
  port: string;
  distance: string;
  eca: string;
  wf: string;
  spd: string;
  sea: string;
  idle: string;
  arrival: string;
  departure: string;
};

export const tcPortData: TcPortRow[] = [
  {
    key: "1",
    no: "1",
    type: "Ballast",
    port: "Changjiagang <China> [+08:00]",
    distance: "",
    eca: "",
    wf: "",
    spd: "",
    sea: "",
    idle: "",
    arrival: "",
    departure: "2020-07-03 13:49",
  },
  {
    key: "2",
    no: "2",
    type: "Ballast",
    port: "Tianjin <China> [+08:00]",
    distance: "760",
    eca: "63",
    wf: "0.0 %",
    spd: "14.00",
    sea: "2.26",
    idle: "",
    arrival: "2020-07-05 20:07",
    departure: "2020-07-05 20:07",
  },
  {
    key: "3",
    no: "3",
    type: "Delivery",
    port: "Tianjin <China> [+08:00]",
    distance: "",
    eca: "",
    wf: "",
    spd: "",
    sea: "",
    idle: "",
    arrival: "Delivery Time",
    departure: "2020-07-05 20:07",
  },
  {
    key: "4",
    no: "4",
    type: "Redelivery",
    port: "Singapore <Singapore> [+08:00]",
    distance: "",
    eca: "",
    wf: "",
    spd: "",
    sea: "",
    idle: "",
    arrival: "Redelivery Time",
    departure: "2020-08-09 20:07",
  },
  {
    key: "5",
    no: "5",
    type: "Ballast",
    port: "Singapore <Singapore> [+08:00]",
    distance: "",
    eca: "",
    wf: "",
    spd: "",
    sea: "",
    idle: "",
    arrival: "2020-08-09 20:07",
    departure: "2020-08-09 20:07",
  },
  {
    key: "6",
    no: "6",
    type: "Ballast",
    port: "Singapore <Singapore> [+08:00]",
    distance: "0",
    eca: "0",
    wf: "5.0 %",
    spd: "14.00",
    sea: "0.00",
    idle: "",
    arrival: "2020-08-09 20:07",
    departure: "2020-08-09 20:07",
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
    idle: "1.00",
    arrival: "",
    departure: "",
  },
];

export const tcPortTotals = {
  distance: "760",
  eca: "63",
  sea: "2.26",
  idle: "0.00",
  arrival: "2020-07-03 13:49",
  departure: "2020-08-09 20:07",
};

export const tcPortSummary =
  "Total Duration: 37.26 Days, Ballast: 2.26 Days (Sea: 2.26, ECA: 0.19, Port: 0), TC Out: 35.00 Days / (Port local time) 2020-07-03 13:49 ~ 2020-08-09 20:07";

export const TC_PORT_TYPES = ["Delivery", "Redelivery", "Ballast", "Bunker", "Canal", "Others"];

export const tcHireRows: Array<[string, string, string, string]> = [
  ["Head Hire / Day", "8,500.0", "Sub Hire / Day", "10,200.0"],
  ["Head Add Comm.", "3.8 %", "Sub Add Comm.", "2.5 %"],
  ["Head Net Hire", "8,177.0", "Sub Net Hire", "9,945.0"],
  ["Hire Days", "40.43", "Ballast Bonus", "0.0"],
];

export const tcOperationExpense: Array<[string, string, string, string]> = [
  ["Dem/Des", "6,000.0", "Bunker Expense", "352,140.0"],
  ["Add Comm.", "13,060.0", "C.E.V.", "2,150.0"],
  ["Brokerage", "4,465.0", "ILOHC", "5,000.0"],
  ["Port Charge", "260,000.0", "Others", "0.0"],
];

export const tcResultRows: Array<[string, string, string, string]> = [
  ["Revenue (Sub Hire)", "402,046.0", "Op. Expense", "330,600.0"],
  ["Head Hire Cost", "330,600.0", "Net Voyage Days", "40.43"],
  ["Gross Margin", "71,446.0", "TCE / Day", "1,767.0"],
];

export const tcProfitUsd = "71,446.0";
/** ====== Bottom panels ====== */
export type TcHireRow = {
  key: string;
  label: string;
  dailyGross: string;
  dailyNet: string;
  totalGross: string;
  addComm: string;
  brokerage: string;
  totalNet: string;
};

export const tcHireTable: TcHireRow[] = [
  {
    key: "head",
    label: "Head CP",
    dailyGross: "7,000.0",
    dailyNet: "6,727.0",
    totalGross: "260,840.3",
    addComm: "10,172.8",
    brokerage: "",
    totalNet: "250,667.6",
  },
  {
    key: "sub",
    label: "Sub CP",
    dailyGross: "8,500.0",
    dailyNet: "8,070.8",
    totalGross: "297,500.0",
    addComm: "11,305.0",
    brokerage: "3,718.7",
    totalNet: "282,476.3",
  },
  {
    key: "diff",
    label: "Diff.",
    dailyGross: "1,500.0",
    dailyNet: "1,343.8",
    totalGross: "36,659.7",
    addComm: "",
    brokerage: "",
    totalNet: "31,808.7",
  },
];

export type TcOperationRow = {
  key: string;
  label: string;
  ballastBonus: string;
  ilohc: string;
  cev: string;
  bunkerExpense: string;
  total: string;
};

export const tcOperationTable: TcOperationRow[] = [
  {
    key: "head",
    label: "Head CP",
    ballastBonus: "0.0",
    ilohc: "2,500.0",
    cev: "1,608.4",
    bunkerExpense: "23,169.0",
    total: "27,277.4",
  },
  {
    key: "sub",
    label: "Sub CP",
    ballastBonus: "0.0",
    ilohc: "4,500.0",
    cev: "1,516.6",
    bunkerExpense: "",
    total: "6,016.6",
  },
  {
    key: "diff",
    label: "Diff.",
    ballastBonus: "0.0",
    ilohc: "2,000.0",
    cev: "-91.8",
    bunkerExpense: "",
    total: "-21,260.8",
  },
];

export type TcBunkerRow = {
  key: string;
  fuel: string;
  price: string;
  consumption: string;
  expense: string;
};

export const tcBunkerTable: TcBunkerRow[] = [
  { key: "vlsfo", fuel: "VLSFO", price: "400.0", consumption: "54.0", expense: "21,583.4" },
  { key: "mgo", fuel: "MGO", price: "500.0", consumption: "0.2", expense: "108.5" },
  { key: "ulsfo", fuel: "ULSFO", price: "300.0", consumption: "4.9", expense: "1,477.2" },
  { key: "b1", fuel: "", price: "", consumption: "", expense: "" },
  { key: "b2", fuel: "", price: "", consumption: "", expense: "" },
];

export const tcOthers = { income: "4,500.0", expense: "7,000.0" };

export const tcResultTable: Array<[string, string]> = [
  ["Daily Revenue", "8,266.0"],
  ["Daily Expense", "8,050.1"],
  ["Daily Profit", "216.0"],
  ["C/Base", "6,943.0"],
  ["Revenue", "308,016.6"],
  ["Op. Expense", "49,301.1"],
  ["Op. Profit", "258,715.5"],
  ["Total Hire", "250,667.6"],
  ["Total Expense", "299,968.7"],
  ["Profit Rate", "8.2 %"],
];

export const tcResultProfit = "8,047.9";
