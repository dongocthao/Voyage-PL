import { useState } from "react";
import { Table, Button, Checkbox, Select, Tag } from "antd";
import type { ColumnsType } from "antd/es/table";
import {
  CalendarOutlined,
  EnvironmentOutlined,
  DesktopOutlined,
  PlusOutlined,
  SwapOutlined,
  FileTextOutlined,
  DashboardOutlined,
  ExperimentOutlined,
  CalculatorOutlined,
  FundOutlined,
  PlayCircleOutlined,
} from "@ant-design/icons";
import EstimatorShell from "./EstimatorShell";
import { EstimateInfoGrid } from "./VesselSection";
import { SectionTitle, TxtCell, YCell, SelCell } from "./cells";
import { RowToolbar } from "./CargoTable";
import { useRowOps } from "./useRowOps";
import { VE_COLORS } from "./theme";
import { ArrivalReportModal, DepartureReportModal, StartOperationModal } from "./OperationReports";
import LoadableQuantityApp from "./LoadableQuantityApp";
import FreightSimulatorApp from "./FreightSimulatorApp";
import BunkerSimulatorApp from "./BunkerSimulatorApp";
import LaytimeCalculatorApp from "./LaytimeCalculatorApp";
import {
  opVessel,
  opSpeed,
  opFuelMain,
  opFuelSub,
  opCargoData,
  opCargoTotals,
  opPortData,
  opPortTotals,
  opPortSummary,
  opExpense,
  opBunkerData,
  opResultRows,
  opProfitUsd,
  type OpFuelMainRow,
  type OpFuelSubRow,
  type OpCargoRow,
  type OpPortRow,
  type OpBunkerRow,
} from "./operationData";

const B = { borderColor: VE_COLORS.border };
const HD: React.CSSProperties = {
  background: VE_COLORS.headerBg,
  color: VE_COLORS.headerText,
  ...B,
};

const PORT_TYPES = ["Ballast", "Loading", "Dischg.", "Bunker", "Canal", "Others"];

type OperationModal = "loadable" | "freight" | "bunker" | "laytime";

/* ------------------------------ Vessel particular ------------------------------ */

const mainCols: ColumnsType<OpFuelMainRow> = [
  { title: "Main", dataIndex: "main", width: "18%" },
  { title: "Type", dataIndex: "type", width: "18%", render: (v: string) => <TxtCell value={v} /> },
  {
    title: "Ballast",
    dataIndex: "ballast",
    width: "16%",
    render: (v: string) => <YCell value={v} />,
  },
  { title: "Laden", dataIndex: "laden", width: "16%", render: (v: string) => <YCell value={v} /> },
  {
    title: "Idle",
    dataIndex: "idle",
    width: "16%",
    render: (v: string) => <TxtCell value={v} right />,
  },
  {
    title: "Work",
    dataIndex: "work",
    width: "16%",
    render: (v: string) => <TxtCell value={v} right />,
  },
];

const subCols: ColumnsType<OpFuelSubRow> = [
  { title: "Sub", dataIndex: "sub", width: "20%" },
  { title: "Type", dataIndex: "type", width: "20%", render: (v: string) => <TxtCell value={v} /> },
  {
    title: "Sea",
    dataIndex: "sea",
    width: "20%",
    render: (v: string) => <TxtCell value={v} right />,
  },
  {
    title: "Idle",
    dataIndex: "idle",
    width: "20%",
    render: (v: string) => <TxtCell value={v} right />,
  },
  {
    title: "Work",
    dataIndex: "work",
    width: "20%",
    render: (v: string) => <TxtCell value={v} right />,
  },
];

function VesselPanel() {
  return (
    <section className="mb-2">
      <div className="mb-1 flex flex-wrap items-center gap-3">
        <SectionTitle>Vessel Particular</SectionTitle>
        <div className="ml-auto flex items-center gap-2">
          <span className="text-[11px]">
            Status : <b>Ongoing</b>
          </span>
          <Tag color="cyan" className="!text-[11px]">
            To be Updated
          </Tag>
          <span className="text-[11px] text-gray-600">Last Update : 2022-05-06 13:54, erinkim</span>
        </div>
      </div>

      <div className="flex w-full flex-row flex-nowrap items-start gap-2">
        {/* thông số tàu */}
        <div style={{ flex: "1 1 40%", minWidth: 0 }}>
          <div
            className="grid border text-[11px]"
            style={{ ...B, gridTemplateColumns: "1fr 80px 80px 66px 60px 70px 70px" }}
          >
            {["MV", "DWT", "Draft (M)", "TPC", "Built", "Kind", "Type"].map((h) => (
              <div
                key={h}
                className="border-b border-r px-1 py-[3px] text-center font-medium last:border-r-0"
                style={HD}
              >
                {h}
              </div>
            ))}
            <div className="border-r" style={B}>
              <TxtCell value={opVessel.mv} />
            </div>
            <div className="border-r" style={B}>
              <TxtCell value={opVessel.dwt} right />
            </div>
            <div className="border-r" style={B}>
              <TxtCell value={opVessel.draft} right />
            </div>
            <div className="border-r" style={B}>
              <TxtCell value={opVessel.tpc} right />
            </div>
            <div className="border-r" style={B}>
              <TxtCell value={opVessel.built} right />
            </div>
            <div className="border-r" style={B}>
              <TxtCell value={opVessel.kind} />
            </div>
            <div>
              <TxtCell value={opVessel.type} />
            </div>
          </div>
          <EstimateInfoGrid estType={opVessel.type} />
        </div>

        {/* speed */}
        <div style={{ flex: "0 0 160px" }}>
          <div
            className="flex items-center justify-between gap-1 border px-1 py-[2px] text-[11px] font-medium"
            style={HD}
          >
            <span>Speed</span>
            <Select
              size="small"
              defaultValue="FULL"
              popupMatchSelectWidth={false}
              style={{ width: 80 }}
              options={[
                { value: "FULL", label: "Full" },
                { value: "ECO", label: "Eco" },
                { value: "C1", label: "Custom1" },
                { value: "C2", label: "Custom2" },
                { value: "C3", label: "Custom3" },
              ]}
            />
          </div>
          <div className="grid grid-cols-2 border border-t-0" style={B}>
            <div className="border-b border-r px-2 py-[3px] text-center" style={HD}>
              Ballast
            </div>
            <div className="border-b px-2 py-[3px] text-center" style={HD}>
              Laden
            </div>
            <div className="border-r" style={B}>
              <YCell value={opSpeed.ballast} />
            </div>
            <div>
              <YCell value={opSpeed.laden} />
            </div>
          </div>
        </div>

        <div style={{ flex: "1 1 27%", minWidth: 0 }}>
          <Table<OpFuelMainRow>
            size="small"
            bordered
            pagination={false}
            tableLayout="fixed"
            columns={mainCols}
            dataSource={opFuelMain}
          />
        </div>
        <div style={{ flex: "1 1 22%", minWidth: 0 }}>
          <Table<OpFuelSubRow>
            size="small"
            bordered
            pagination={false}
            tableLayout="fixed"
            columns={subCols}
            dataSource={opFuelSub}
          />
          <div className="mt-[2px] text-right">
            <Checkbox className="text-[11px]">Fix Port Consumption</Checkbox>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ------------------------------ Cargo ------------------------------ */

const cargoCols: ColumnsType<OpCargoRow> = [
  { title: "#", dataIndex: "no", width: "2.6%", align: "center" },
  {
    title: "Account",
    dataIndex: "account",
    width: "8%",
    render: (v: string) => <TxtCell value={v} />,
  },
  {
    title: "Cargo Name",
    dataIndex: "cargoName",
    width: "9.5%",
    render: (v: string) => <TxtCell value={v} />,
  },
  {
    title: "Loading Port",
    dataIndex: "loadingPort",
    width: "14%",
    render: (v: string) => <TxtCell value={v} />,
  },
  {
    title: "Discharging Port",
    dataIndex: "dischargingPort",
    width: "14%",
    render: (v: string) => <TxtCell value={v} />,
  },
  {
    title: "Quantity",
    dataIndex: "quantity",
    width: "9%",
    align: "right",
    render: (v: string, r) => (
      <div className="flex items-center justify-end gap-1">
        <TxtCell value={v} right />
        <span className="w-[18px] text-[11px]">{r.unit}</span>
      </div>
    ),
  },
  {
    title: "Frt",
    dataIndex: "frt",
    width: "5%",
    align: "right",
    render: (v: string) => <TxtCell value={v} right />,
  },
  {
    title: "Term",
    dataIndex: "term",
    width: "4.5%",
    align: "center",
    render: (v: string) => <TxtCell value={v} />,
  },
  {
    title: "Total Freight",
    dataIndex: "totalFreight",
    width: "9.5%",
    align: "right",
    render: (v: string) => <YCell value={v} />,
  },
  {
    title: "A. Comm",
    dataIndex: "aComm",
    width: "6%",
    align: "right",
    render: (v: string) => <TxtCell value={v} right />,
  },
  {
    title: "Brkg",
    dataIndex: "brkg",
    width: "5.5%",
    align: "right",
    render: (v: string) => <TxtCell value={v} right />,
  },
  {
    title: "Frt Tax",
    dataIndex: "frtTax",
    width: "5.5%",
    align: "right",
    render: (v: string) => <TxtCell value={v} right />,
  },
  {
    title: "Liner Term",
    dataIndex: "linerTerm",
    width: "7%",
    render: (v: string) => <TxtCell value={v} />,
  },
];

/* ------------------------------ Bottom ------------------------------ */

const bunkerCols: ColumnsType<OpBunkerRow> = [
  { title: "", dataIndex: "type", width: "22%" },
  {
    title: "Price / MT",
    dataIndex: "price",
    width: "24%",
    align: "right",
    render: (v: string) => <YCell value={v} />,
  },
  {
    title: (
      <span>
        <Checkbox defaultChecked className="mr-1" />
        Consumption
      </span>
    ),
    dataIndex: "consumption",
    width: "27%",
    align: "right",
    render: (v: string) => <TxtCell value={v} right />,
  },
  {
    title: "Expense",
    dataIndex: "expense",
    width: "27%",
    align: "right",
    render: (v: string) => <TxtCell value={v} right />,
  },
];

function KVGrid({ rows }: { rows: Array<[string, string, string, string]> }) {
  return (
    <div className="border text-[11px]" style={B}>
      {rows.map((r, i) => (
        <div key={i} className="grid grid-cols-4 border-b last:border-b-0" style={B}>
          <div className="border-r px-1 py-[3px]" style={{ ...B, background: VE_COLORS.rowAlt }}>
            {r[0]}
          </div>
          <div className="border-r px-1 py-[3px] text-right" style={B}>
            {r[1]}
          </div>
          <div className="border-r px-1 py-[3px]" style={{ ...B, background: VE_COLORS.rowAlt }}>
            {r[2]}
          </div>
          <div className="px-1 py-[3px] text-right">{r[3]}</div>
        </div>
      ))}
    </div>
  );
}

/* ------------------------------ Screen ------------------------------ */

export default function OperationApp() {
  const cargo = useRowOps<OpCargoRow>(opCargoData);
  const port = useRowOps<OpPortRow>(opPortData);
  const [arrival, setArrival] = useState(false);
  const [departure, setDeparture] = useState(false);
  const [startOp, setStartOp] = useState(false);
  const [modal, setModal] = useState<OperationModal | null>(null);

  const isMargin = (r: OpPortRow) => r.key === "margin";
  const txt = (right?: boolean) => (v: string, r: OpPortRow) =>
    isMargin(r) ? (
      <span className={right ? "block pr-1 text-right font-medium" : ""}>{v}</span>
    ) : (
      <TxtCell value={v} right={right} />
    );

  const dateCell = (onOpen: () => void) => (v: string, r: OpPortRow) =>
    isMargin(r) ? null : (
      <div className="flex items-center">
        <TxtCell value={v} />
        <CalendarOutlined
          role="button"
          aria-label="Open report"
          className="cursor-pointer"
          style={{ color: VE_COLORS.alert, fontSize: 12, marginRight: 2 }}
          onClick={onOpen}
        />
      </div>
    );

  const portCols: ColumnsType<OpPortRow> = [
    { title: "#", dataIndex: "no", width: "2.6%", align: "center" },
    {
      title: "Type",
      dataIndex: "type",
      width: "6%",
      render: (v: string, r) =>
        isMargin(r) ? <b>{v}</b> : <SelCell value={v} options={PORT_TYPES} />,
    },
    { title: "Port Name or Coordinates", dataIndex: "port", width: "17%", render: txt() },
    {
      title: "Distance (TTL / ECA)",
      children: [
        { title: "TTL", dataIndex: "distance", width: "5%", align: "right", render: txt(true) },
        { title: "ECA", dataIndex: "eca", width: "4%", align: "right", render: txt(true) },
      ],
    },
    { title: "W.F", dataIndex: "wf", width: "4.4%", align: "right", render: txt(true) },
    {
      title: "Spd",
      dataIndex: "spd",
      width: "4.4%",
      align: "right",
      render: (v: string, r) => (isMargin(r) ? v : <YCell value={v} />),
    },
    {
      title: "Sea",
      dataIndex: "sea",
      width: "4.4%",
      align: "right",
      render: (v: string, r) => (isMargin(r) ? <YCell value={v} /> : <TxtCell value={v} right />),
    },
    {
      title: "L / D Rate",
      dataIndex: "ldRate",
      width: "6.6%",
      align: "right",
      render: (v: string, r) => (isMargin(r) ? null : <YCell value={v} />),
    },
    {
      title: "Port (I / W)",
      children: [
        {
          title: "Idle",
          dataIndex: "idle",
          width: "4.2%",
          align: "right",
          render: (v: string, r) =>
            isMargin(r) ? <YCell value={v} /> : <TxtCell value={v} right />,
        },
        {
          title: "Working",
          dataIndex: "working",
          width: "4.6%",
          align: "right",
          render: txt(true),
        },
      ],
    },
    { title: "Dem", dataIndex: "dem", width: "5.4%", align: "right", render: txt(true) },
    { title: "Des", dataIndex: "des", width: "6.4%", align: "right", render: txt(true) },
    {
      title: "Port Charge",
      dataIndex: "portCharge",
      width: "7%",
      align: "right",
      render: (v: string, r) => (isMargin(r) ? null : <YCell value={v} />),
    },
    {
      title: "Arrival",
      dataIndex: "arrival",
      width: "8.9%",
      render: dateCell(() => setArrival(true)),
    },
    {
      title: "Departure",
      dataIndex: "departure",
      width: "9.1%",
      render: dateCell(() => setDeparture(true)),
    },
  ];

  const sel = (key: string | null) => (r: OpPortRow | OpCargoRow) =>
    r.key === key ? "ve-row-selected" : r.key === "margin" ? "ve-margin-row" : "";

  return (
    <EstimatorShell title="Operation — Netpas Prosperity" sheetKind="operation">
      <VesselPanel />

      <section className="mb-2">
        <div className="mb-1 flex flex-wrap items-center gap-3">
          <SectionTitle>Cargo</SectionTitle>
          <Button
            size="small"
            icon={<PlayCircleOutlined />}
            type="primary"
            onClick={() => setStartOp(true)}
          >
            Start Operation
          </Button>
          <Button size="small" icon={<CalculatorOutlined />} onClick={() => setModal("loadable")}>
            Loadable Quantity Calculator
          </Button>
          <Button size="small" icon={<FundOutlined />} onClick={() => setModal("freight")}>
            Frt. Simulator
          </Button>
        </div>
        <Table<OpCargoRow>
          size="small"
          bordered
          pagination={false}
          tableLayout="fixed"
          columns={cargoCols}
          dataSource={cargo.rows}
          onRow={cargo.onRow}
          rowClassName={sel(cargo.selectedKey)}
          summary={() => (
            <Table.Summary fixed>
              <Table.Summary.Row style={{ background: "#F5F7FA", fontWeight: 600 }}>
                <Table.Summary.Cell index={0} colSpan={5} align="right">
                  Total
                </Table.Summary.Cell>
                <Table.Summary.Cell index={5} align="right">
                  {opCargoTotals.quantity}
                </Table.Summary.Cell>
                <Table.Summary.Cell index={6} align="right">
                  {opCargoTotals.frt}
                </Table.Summary.Cell>
                <Table.Summary.Cell index={7} />
                <Table.Summary.Cell index={8} align="right">
                  {opCargoTotals.totalFreight}
                </Table.Summary.Cell>
                <Table.Summary.Cell index={9} align="right">
                  {opCargoTotals.aComm}
                </Table.Summary.Cell>
                <Table.Summary.Cell index={10} align="right">
                  {opCargoTotals.brkg}
                </Table.Summary.Cell>
                <Table.Summary.Cell index={11} align="right">
                  {opCargoTotals.frtTax}
                </Table.Summary.Cell>
                <Table.Summary.Cell index={12} align="right">
                  {opCargoTotals.linerTerm}
                </Table.Summary.Cell>
              </Table.Summary.Row>
            </Table.Summary>
          )}
        />
        <RowToolbar
          onAdd={cargo.add}
          onDelete={cargo.remove}
          onInsertAbove={cargo.insertAbove}
          onInsertBelow={cargo.insertBelow}
        />
      </section>

      <section className="mb-2">
        <div className="mb-1 flex flex-wrap items-center gap-3">
          <SectionTitle>Port Rotation</SectionTitle>
          <Checkbox defaultChecked className="text-[11px]">
            SUEZ
          </Checkbox>
          <Checkbox defaultChecked className="text-[11px]">
            PANAMA
          </Checkbox>
          <Checkbox className="text-[11px]">KIEL</Checkbox>
          <span className="text-[11px] text-gray-600">{opPortSummary}</span>
        </div>
        <Table<OpPortRow>
          size="small"
          bordered
          pagination={false}
          tableLayout="fixed"
          columns={portCols}
          dataSource={port.rows}
          onRow={port.onRow}
          rowClassName={sel(port.selectedKey)}
          summary={() => (
            <Table.Summary fixed>
              <Table.Summary.Row style={{ background: VE_COLORS.rowAlt, fontWeight: 600 }}>
                <Table.Summary.Cell index={0} colSpan={3} align="right">
                  Totals
                </Table.Summary.Cell>
                <Table.Summary.Cell index={3} align="right">
                  {opPortTotals.distance}
                </Table.Summary.Cell>
                <Table.Summary.Cell index={4} align="right">
                  {opPortTotals.eca}
                </Table.Summary.Cell>
                <Table.Summary.Cell index={5} />
                <Table.Summary.Cell index={6} />
                <Table.Summary.Cell index={7} align="right">
                  {opPortTotals.sea}
                </Table.Summary.Cell>
                <Table.Summary.Cell index={8} />
                <Table.Summary.Cell index={9} align="right">
                  {opPortTotals.idle}
                </Table.Summary.Cell>
                <Table.Summary.Cell index={10} align="right">
                  {opPortTotals.working}
                </Table.Summary.Cell>
                <Table.Summary.Cell index={11} align="right">
                  {opPortTotals.dem}
                </Table.Summary.Cell>
                <Table.Summary.Cell index={12} align="right">
                  {opPortTotals.des}
                </Table.Summary.Cell>
                <Table.Summary.Cell index={13} align="right">
                  {opPortTotals.portCharge}
                </Table.Summary.Cell>
                <Table.Summary.Cell index={14} align="right">
                  {opPortTotals.arrival}
                </Table.Summary.Cell>
                <Table.Summary.Cell index={15} align="right">
                  {opPortTotals.departure}
                </Table.Summary.Cell>
              </Table.Summary.Row>
            </Table.Summary>
          )}
        />
        <div className="mt-[2px] flex flex-wrap items-center gap-2">
          <RowToolbar
            onAdd={port.add}
            onDelete={port.remove}
            onInsertAbove={port.insertAbove}
            onInsertBelow={port.insertBelow}
          />
          <div className="ml-auto flex items-center gap-2">
            <Select
              size="small"
              defaultValue="days"
              style={{ width: 80 }}
              options={[
                { value: "days", label: "Days" },
                { value: "hours", label: "Hours" },
              ]}
            />
            <span
              className="rounded-sm border px-2 py-[1px] text-[11px]"
              style={{
                borderColor: VE_COLORS.titleBar,
                color: VE_COLORS.titleBar,
                background: VE_COLORS.rowAlt,
              }}
            >
              <EnvironmentOutlined /> Port Local
            </span>
            <span className="rounded-sm border px-2 py-[1px] text-[11px]" style={B}>
              <DesktopOutlined /> PC Time
            </span>
            <Select
              size="small"
              defaultValue="local"
              style={{ width: 130 }}
              options={[
                { value: "local", label: "Port local time" },
                { value: "utc", label: "UTC" },
              ]}
            />
          </div>
        </div>
      </section>

      <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
        <section>
          <div className="mb-1">
            <SectionTitle>Operation Expense</SectionTitle>
          </div>
          <KVGrid rows={opExpense} />
        </section>

        <section>
          <div className="mb-1 flex items-center gap-2">
            <SectionTitle>Bunker Expense</SectionTitle>
            <Button size="small" icon={<DashboardOutlined />}>
              Bunker Index
            </Button>
            <Button size="small" icon={<ExperimentOutlined />} onClick={() => setModal("bunker")}>
              Bunker Simulator
            </Button>
          </div>
          <Table<OpBunkerRow>
            size="small"
            bordered
            pagination={false}
            tableLayout="fixed"
            columns={bunkerCols}
            dataSource={opBunkerData}
          />
        </section>

        <section>
          <div className="mb-1 flex items-center gap-2">
            <SectionTitle>Result</SectionTitle>
            <Button size="small" icon={<PlusOutlined />}>
              Result Plus
            </Button>
            <Button size="small" icon={<SwapOutlined />}>
              Comparison
            </Button>
            <Button size="small" icon={<FileTextOutlined />}>
              Remark
            </Button>
          </div>
          <KVGrid rows={opResultRows} />
          <div
            className="mt-[2px] grid grid-cols-4 border text-[12px] font-bold"
            style={{ ...B, background: VE_COLORS.rowAlt }}
          >
            <div className="border-r px-1 py-[3px]" style={B} />
            <div className="border-r px-1 py-[3px]" style={B} />
            <div className="border-r px-1 py-[3px]" style={B}>
              PROFIT (USD)
            </div>
            <div className="px-1 py-[3px] text-right" style={{ color: VE_COLORS.sectionTitle }}>
              {opProfitUsd}
            </div>
          </div>
        </section>
      </div>

      <ArrivalReportModal open={arrival} onClose={() => setArrival(false)} />
      <DepartureReportModal
        open={departure}
        onClose={() => setDeparture(false)}
        onOpenLaytime={() => setModal("laytime")}
      />
      <StartOperationModal open={startOp} onClose={() => setStartOp(false)} />
      {modal === "loadable" && <LoadableQuantityApp onClose={() => setModal(null)} />}
      {modal === "freight" && <FreightSimulatorApp onClose={() => setModal(null)} />}
      {modal === "bunker" && <BunkerSimulatorApp onClose={() => setModal(null)} />}
      {modal === "laytime" && <LaytimeCalculatorApp onClose={() => setModal(null)} />}
    </EstimatorShell>
  );
}
