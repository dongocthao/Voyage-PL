import { useState } from "react";
import { Table, Button, Checkbox, Select } from "antd";
import type { ColumnsType } from "antd/es/table";
import {
  SearchOutlined,
  InfoCircleOutlined,
  CalculatorOutlined,
  FundOutlined,
  LineChartOutlined,
  FileTextOutlined,
  EnvironmentOutlined,
  DesktopOutlined,
} from "@ant-design/icons";
import EstimatorShell from "./EstimatorShell";
import VesselSection from "./VesselSection";
import { RowToolbar } from "./CargoTable";
import LoadableQuantityApp from "./LoadableQuantityApp";
import FreightSimulatorApp from "./FreightSimulatorApp";
import AnalyzerApp from "./AnalyzerApp";
import { SectionTitle, TxtCell, YCell } from "./cells";
import { VE_COLORS } from "./theme";
import KVPanels from "./KVPanels";
import { useRowOps } from "./useRowOps";
import {
  reletCargoData,
  reletCargoTotals,
  reletPortData,
  reletPortTotals,
  reletPortSummary,
  reletHeadExpense,
  reletResultRows,
  reletProfitUsd,
  type ReletCargoRow,
  type ReletPortRow,
} from "./cargoReletData";

type CargoReletModal = "loadable" | "freight" | "analyzer";

const portCell = (v: string) => (
  <div className="flex items-center">
    <TxtCell value={v} />
    <InfoCircleOutlined style={{ color: VE_COLORS.titleBar, fontSize: 11 }} />
  </div>
);

const txt = (right?: boolean) => (v: string) => <TxtCell value={v} right={right} />;
const yc = (v: string) => <YCell value={v} />;

const cargoCols: ColumnsType<ReletCargoRow> = [
  { title: "#", dataIndex: "no", width: "2.6%", align: "center" },
  { title: "Account", dataIndex: "account", width: "7%", render: txt() },
  { title: "Cargo Name", dataIndex: "cargoName", width: "8%", render: txt() },
  { title: "Loading Port", dataIndex: "loadingPort", width: "12.5%", render: portCell },
  { title: "Discharging Port", dataIndex: "dischargingPort", width: "12.5%", render: portCell },
  { title: "Quantity", dataIndex: "quantity", width: "6.2%", align: "right", render: txt(true) },
  { title: "Unit", dataIndex: "unit", width: "3.2%", align: "center", render: txt() },
  {
    title: "HEAD CP",
    children: [
      { title: "Frt", dataIndex: "hFrt", width: "5%", align: "right", render: txt(true) },
      { title: "Frt Type", dataIndex: "hFrtType", width: "4.3%", align: "center", render: txt() },
      {
        title: "Frt Lumpsum",
        dataIndex: "hFrtLumpsum",
        width: "6%",
        align: "right",
        render: txt(true),
      },
      { title: "A. Comm", dataIndex: "hComm", width: "5%", align: "right", render: txt(true) },
      { title: "Brkg", dataIndex: "hBrkg", width: "5%", align: "right", render: txt(true) },
      { title: "Net Frt", dataIndex: "hNet", width: "6%", align: "right", render: yc },
      { title: "Liner Terms", dataIndex: "hLiner", width: "6%", align: "right", render: txt(true) },
    ],
  },
  {
    title: "SUB CP",
    children: [
      { title: "Frt", dataIndex: "sFrt", width: "5%", align: "right", render: txt(true) },
      { title: "Frt Type", dataIndex: "sFrtType", width: "4.3%", align: "center", render: txt() },
      {
        title: "Frt Lumpsum",
        dataIndex: "sFrtLumpsum",
        width: "6%",
        align: "right",
        render: txt(true),
      },
      { title: "A. Comm", dataIndex: "sComm", width: "5%", align: "right", render: txt(true) },
      { title: "Brkg", dataIndex: "sBrkg", width: "5%", align: "right", render: txt(true) },
      { title: "Net Frt", dataIndex: "sNet", width: "6%", align: "right", render: yc },
      {
        title: "Liner Terms",
        dataIndex: "sLiner",
        width: "5.4%",
        align: "right",
        render: txt(true),
      },
    ],
  },
  {
    title: "",
    key: "search",
    width: "3%",
    align: "center",
    render: () => <SearchOutlined style={{ color: "#888" }} />,
  },
];

const isMargin = (r: ReletPortRow) => r.key === "margin";
const ptxt = (right?: boolean) => (v: string, r: ReletPortRow) =>
  isMargin(r) ? (
    <span className={right ? "block pr-1 text-right" : ""}>{v}</span>
  ) : (
    <TxtCell value={v} right={right} />
  );
const pyc = (v: string, r: ReletPortRow) => (isMargin(r) ? v : <YCell value={v} />);

const portCols: ColumnsType<ReletPortRow> = [
  { title: "#", dataIndex: "no", width: "2.4%", align: "center" },
  {
    title: "Type",
    dataIndex: "type",
    width: "5%",
    render: (v: string, r) => (isMargin(r) ? <b>{v}</b> : <TxtCell value={v} />),
  },
  { title: "Port Name / Coordinate", dataIndex: "port", width: "14%", render: ptxt() },
  {
    title: "Distance",
    children: [
      { title: "TTL", dataIndex: "distance", width: "4.2%", align: "right", render: ptxt(true) },
      { title: "ECA", dataIndex: "eca", width: "3.6%", align: "right", render: ptxt(true) },
    ],
  },
  { title: "WF", dataIndex: "wf", width: "3.8%", align: "right", render: ptxt(true) },
  { title: "Spd", dataIndex: "spd", width: "3.8%", align: "right", render: pyc },
  { title: "Sea", dataIndex: "sea", width: "3.8%", align: "right", render: ptxt(true) },
  {
    title: "HEAD CP",
    children: [
      { title: "L/D Rate", dataIndex: "hLd", width: "5.6%", align: "right", render: pyc },
      { title: "Dem", dataIndex: "hDem", width: "4.2%", align: "right", render: ptxt(true) },
      { title: "Des", dataIndex: "hDes", width: "4.6%", align: "right", render: ptxt(true) },
    ],
  },
  {
    title: "SUB CP",
    children: [
      { title: "L/D Rate", dataIndex: "sLd", width: "5.6%", align: "right", render: pyc },
      { title: "Dem", dataIndex: "sDem", width: "4.2%", align: "right", render: ptxt(true) },
      { title: "Des", dataIndex: "sDes", width: "4.6%", align: "right", render: ptxt(true) },
    ],
  },
  {
    title: "Port (I/W)",
    children: [
      { title: "Idle", dataIndex: "idle", width: "3.8%", align: "right", render: ptxt(true) },
      { title: "Working", dataIndex: "working", width: "4.4%", align: "right", render: ptxt(true) },
    ],
  },
  { title: "Port Charge", dataIndex: "portCharge", width: "6.4%", align: "right", render: pyc },
  { title: "Arrival", dataIndex: "arrival", width: "8%", align: "center", render: ptxt() },
  { title: "Departure", dataIndex: "departure", width: "8%", align: "center", render: ptxt() },
];

export default function CargoReletApp() {
  const [modal, setModal] = useState<CargoReletModal | null>(null);
  const cargo = useRowOps<ReletCargoRow>(reletCargoData);
  const port = useRowOps<ReletPortRow>(reletPortData);

  return (
    <EstimatorShell title="Cargo Relet — Estimation W3" sheetKind="cargo relet">
      <VesselSection />

      <section className="mb-2">
        <div className="mb-1 flex items-center gap-3">
          <SectionTitle>Cargo</SectionTitle>
          <Button size="small" icon={<CalculatorOutlined />} onClick={() => setModal("loadable")}>
            Loadable Quantity Calculator
          </Button>
          <Button size="small" icon={<FundOutlined />} onClick={() => setModal("freight")}>
            Frt. Simulator
          </Button>
        </div>
        <Table<ReletCargoRow>
          size="small"
          bordered
          pagination={false}
          tableLayout="fixed"
          columns={cargoCols}
          dataSource={cargo.rows}
          onRow={cargo.onRow}
          rowClassName={(r) => (r.key === cargo.selectedKey ? "ve-row-selected" : "")}
          summary={() => (
            <Table.Summary fixed>
              <Table.Summary.Row style={{ background: VE_COLORS.rowAlt, fontWeight: 600 }}>
                <Table.Summary.Cell index={0} colSpan={5} align="right">
                  Total
                </Table.Summary.Cell>
                <Table.Summary.Cell index={5} align="right">
                  {reletCargoTotals.quantity}
                </Table.Summary.Cell>
                <Table.Summary.Cell index={6} />
                <Table.Summary.Cell index={7} align="right">
                  {reletCargoTotals.hFrt}
                </Table.Summary.Cell>
                <Table.Summary.Cell index={8} />
                <Table.Summary.Cell index={9} align="right">
                  {reletCargoTotals.hFrtLumpsum}
                </Table.Summary.Cell>
                <Table.Summary.Cell index={10} align="right">
                  {reletCargoTotals.hComm}
                </Table.Summary.Cell>
                <Table.Summary.Cell index={11} align="right">
                  {reletCargoTotals.hBrkg}
                </Table.Summary.Cell>
                <Table.Summary.Cell index={12} align="right">
                  {reletCargoTotals.hNet}
                </Table.Summary.Cell>
                <Table.Summary.Cell index={13} align="right">
                  {reletCargoTotals.hLiner}
                </Table.Summary.Cell>
                <Table.Summary.Cell index={14} align="right">
                  {reletCargoTotals.sFrt}
                </Table.Summary.Cell>
                <Table.Summary.Cell index={15} />
                <Table.Summary.Cell index={16} align="right">
                  {reletCargoTotals.sFrtLumpsum}
                </Table.Summary.Cell>
                <Table.Summary.Cell index={17} align="right">
                  {reletCargoTotals.sComm}
                </Table.Summary.Cell>
                <Table.Summary.Cell index={18} align="right">
                  {reletCargoTotals.sBrkg}
                </Table.Summary.Cell>
                <Table.Summary.Cell index={19} align="right">
                  {reletCargoTotals.sNet}
                </Table.Summary.Cell>
                <Table.Summary.Cell index={20} align="right">
                  {reletCargoTotals.sLiner}
                </Table.Summary.Cell>
                <Table.Summary.Cell index={21} />
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
          <span className="text-[11px] text-gray-600">{reletPortSummary}</span>
        </div>
        <Table<ReletPortRow>
          size="small"
          bordered
          pagination={false}
          tableLayout="fixed"
          columns={portCols}
          dataSource={port.rows}
          onRow={port.onRow}
          rowClassName={(r) =>
            isMargin(r) ? "ve-margin-row" : r.key === port.selectedKey ? "ve-row-selected" : ""
          }
          summary={() => (
            <Table.Summary fixed>
              <Table.Summary.Row style={{ background: VE_COLORS.rowAlt, fontWeight: 600 }}>
                <Table.Summary.Cell index={0} colSpan={3} align="right">
                  Totals
                </Table.Summary.Cell>
                <Table.Summary.Cell index={3} align="right">
                  {reletPortTotals.distance}
                </Table.Summary.Cell>
                <Table.Summary.Cell index={4} align="right">
                  {reletPortTotals.eca}
                </Table.Summary.Cell>
                <Table.Summary.Cell index={5} />
                <Table.Summary.Cell index={6} />
                <Table.Summary.Cell index={7} align="right">
                  {reletPortTotals.sea}
                </Table.Summary.Cell>
                <Table.Summary.Cell index={8} />
                <Table.Summary.Cell index={9} align="right">
                  {reletPortTotals.hDem}
                </Table.Summary.Cell>
                <Table.Summary.Cell index={10} align="right">
                  {reletPortTotals.hDes}
                </Table.Summary.Cell>
                <Table.Summary.Cell index={11} />
                <Table.Summary.Cell index={12} align="right">
                  {reletPortTotals.sDem}
                </Table.Summary.Cell>
                <Table.Summary.Cell index={13} align="right">
                  {reletPortTotals.sDes}
                </Table.Summary.Cell>
                <Table.Summary.Cell index={14} align="right">
                  {reletPortTotals.idle}
                </Table.Summary.Cell>
                <Table.Summary.Cell index={15} align="right">
                  {reletPortTotals.working}
                </Table.Summary.Cell>
                <Table.Summary.Cell index={16} align="right">
                  {reletPortTotals.portCharge}
                </Table.Summary.Cell>
                <Table.Summary.Cell index={17} align="center">
                  {reletPortTotals.arrival}
                </Table.Summary.Cell>
                <Table.Summary.Cell index={18} align="center">
                  {reletPortTotals.departure}
                </Table.Summary.Cell>
              </Table.Summary.Row>
            </Table.Summary>
          )}
        />
        <RowToolbar
          onAdd={port.add}
          onDelete={port.remove}
          onInsertAbove={port.insertAbove}
          onInsertBelow={port.insertBelow}
        />

        <div className="mt-1 flex flex-wrap items-center gap-2">
          <Button size="small" icon={<LineChartOutlined />} onClick={() => setModal("analyzer")}>
            Analyzer
          </Button>
          <Button size="small" icon={<FileTextOutlined />}>
            Remark
          </Button>
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
            <span
              className="rounded-sm border px-2 py-[1px] text-[11px]"
              style={{ borderColor: VE_COLORS.border }}
            >
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

      <KVPanels
        panels={[
          { title: "Operation Expense", rows: reletHeadExpense },
          {
            title: "Result",
            rows: reletResultRows,
            profitLabel: "Profit (USD)",
            profit: reletProfitUsd,
          },
        ]}
      />
      {modal === "loadable" && <LoadableQuantityApp onClose={() => setModal(null)} />}
      {modal === "freight" && <FreightSimulatorApp onClose={() => setModal(null)} />}
      {modal === "analyzer" && <AnalyzerApp onClose={() => setModal(null)} />}
    </EstimatorShell>
  );
}
