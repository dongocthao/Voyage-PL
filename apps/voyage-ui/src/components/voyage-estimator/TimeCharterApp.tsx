import { useState } from "react";
import { Table, Button, Checkbox, Select } from "antd";
import type { ColumnsType } from "antd/es/table";
import {
  InfoCircleOutlined,
  LineChartOutlined,
  FileTextOutlined,
  EnvironmentOutlined,
  DesktopOutlined,
} from "@ant-design/icons";
import EstimatorShell from "./EstimatorShell";
import VesselSection from "./VesselSection";
import { RowToolbar } from "./CargoTable";
import TcBottomPanels from "./TcBottomPanels";
import AnalyzerApp from "./AnalyzerApp";
import { useRowOps } from "./useRowOps";
import { SectionTitle, TxtCell, YCell, SelCell } from "./cells";
import { VE_COLORS } from "./theme";
import {
  tcHeadCp,
  tcSubCp,
  tcPortData,
  tcPortTotals,
  tcPortSummary,
  TC_PORT_TYPES,
  type TcCpRow,
  type TcPortRow,
} from "./timeCharterData";

const portWithInfo = (v: string) => (
  <div className="flex items-center">
    <TxtCell value={v} />
    <InfoCircleOutlined style={{ color: VE_COLORS.titleBar, fontSize: 11 }} />
  </div>
);

const cpCols: ColumnsType<TcCpRow> = [
  {
    title: "Account",
    dataIndex: "account",
    width: "13%",
    render: (v: string) => <TxtCell value={v} />,
  },
  { title: "Delivery Port", dataIndex: "deliveryPort", width: "19%", render: portWithInfo },
  { title: "Redelivery Port", dataIndex: "redeliveryPort", width: "19%", render: portWithInfo },
  {
    title: "Duration",
    dataIndex: "duration",
    width: "10%",
    align: "right",
    render: (v: string) => <TxtCell value={v} right />,
  },
  {
    title: "Daily Hire",
    dataIndex: "dailyHire",
    width: "11%",
    align: "right",
    render: (v: string) => <TxtCell value={v} right />,
  },
  {
    title: "Gross Hire",
    dataIndex: "grossHire",
    width: "12%",
    align: "right",
    render: (v: string) => <YCell value={v} />,
  },
  {
    title: "Add com",
    dataIndex: "addComm",
    width: "8%",
    align: "right",
    render: (v: string) => <TxtCell value={v} right />,
  },
  {
    title: "Brkg",
    dataIndex: "brkg",
    width: "8%",
    align: "right",
    render: (v: string) => <TxtCell value={v} right />,
  },
];

const isMargin = (r: TcPortRow) => r.key === "margin";
const ptxt = (right?: boolean) => (v: string, r: TcPortRow) =>
  isMargin(r) ? (
    <span className={right ? "block pr-1 text-right" : ""}>{v}</span>
  ) : (
    <TxtCell value={v} right={right} />
  );
const pyc = (v: string, r: TcPortRow) => (isMargin(r) ? v : <YCell value={v} />);

const portCols: ColumnsType<TcPortRow> = [
  { title: "#", dataIndex: "no", width: "2.6%", align: "center" },
  {
    title: "Type",
    dataIndex: "type",
    width: "9%",
    render: (v: string, r) =>
      isMargin(r) ? <b>{v}</b> : <SelCell value={v} options={TC_PORT_TYPES} />,
  },
  { title: "Port Name or Coordinates", dataIndex: "port", width: "24%", render: ptxt() },
  {
    title: "Distance / ECA",
    children: [
      { title: "TTL", dataIndex: "distance", width: "7%", align: "right", render: ptxt(true) },
      { title: "ECA", dataIndex: "eca", width: "6%", align: "right", render: ptxt(true) },
    ],
  },
  { title: "W.F", dataIndex: "wf", width: "7%", align: "right", render: ptxt(true) },
  { title: "Spd", dataIndex: "spd", width: "7%", align: "right", render: pyc },
  {
    title: "Sea",
    dataIndex: "sea",
    width: "7%",
    align: "right",
    render: (v: string) => <TxtCell value={v} right />,
  },
  {
    title: "Port (Idle)",
    dataIndex: "idle",
    width: "7.4%",
    align: "right",
    render: (v: string) => <TxtCell value={v} right />,
  },
  { title: "Arrival", dataIndex: "arrival", width: "11.5%", align: "center", render: ptxt() },
  { title: "Departure", dataIndex: "departure", width: "11.5%", align: "center", render: ptxt() },
];

export default function TimeCharterApp() {
  const head = useRowOps<TcCpRow>(tcHeadCp);
  const sub = useRowOps<TcCpRow>(tcSubCp);
  const port = useRowOps<TcPortRow>(tcPortData);
  const [headMulti, setHeadMulti] = useState(false);
  const [subMulti, setSubMulti] = useState(false);
  const [analyzerOpen, setAnalyzerOpen] = useState(false);
  const sel = (key: string | null) => (r: { key: string }) =>
    r.key === key ? "ve-row-selected" : "";

  return (
    <EstimatorShell title="Time Charter — Estimation W5" sheetKind="time charter">
      <VesselSection />

      <section className="mb-2 grid grid-cols-1 gap-2 lg:grid-cols-2">
        <div>
          <div className="mb-1 flex items-center gap-2">
            <SectionTitle>Head CP</SectionTitle>
            <Checkbox
              className="ml-auto text-[11px]"
              checked={headMulti}
              onChange={(e) => setHeadMulti(e.target.checked)}
            >
              Use Multi Duration
            </Checkbox>
          </div>
          <Table<TcCpRow>
            size="small"
            bordered
            pagination={false}
            tableLayout="fixed"
            columns={cpCols}
            dataSource={head.rows}
            onRow={head.onRow}
            rowClassName={sel(head.selectedKey)}
          />
          {headMulti && (
            <RowToolbar
              onAdd={head.add}
              onDelete={head.remove}
              onInsertAbove={head.insertAbove}
              onInsertBelow={head.insertBelow}
            />
          )}
        </div>
        <div>
          <div className="mb-1 flex items-center gap-2">
            <SectionTitle>Sub CP</SectionTitle>
            <Checkbox
              className="ml-auto text-[11px]"
              checked={subMulti}
              onChange={(e) => setSubMulti(e.target.checked)}
            >
              Use Multi Duration
            </Checkbox>
          </div>
          <Table<TcCpRow>
            size="small"
            bordered
            pagination={false}
            tableLayout="fixed"
            columns={cpCols}
            dataSource={sub.rows}
            onRow={sub.onRow}
            rowClassName={sel(sub.selectedKey)}
          />
          {subMulti && (
            <RowToolbar
              onAdd={sub.add}
              onDelete={sub.remove}
              onInsertAbove={sub.insertAbove}
              onInsertBelow={sub.insertBelow}
            />
          )}
        </div>
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
          <span className="text-[11px] text-gray-600">{tcPortSummary}</span>
        </div>
        <Table<TcPortRow>
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
                  {tcPortTotals.distance}
                </Table.Summary.Cell>
                <Table.Summary.Cell index={4} align="right">
                  {tcPortTotals.eca}
                </Table.Summary.Cell>
                <Table.Summary.Cell index={5} />
                <Table.Summary.Cell index={6} />
                <Table.Summary.Cell index={7} align="right">
                  {tcPortTotals.sea}
                </Table.Summary.Cell>
                <Table.Summary.Cell index={8} align="right">
                  {tcPortTotals.idle}
                </Table.Summary.Cell>
                <Table.Summary.Cell index={9} align="center">
                  {tcPortTotals.arrival}
                </Table.Summary.Cell>
                <Table.Summary.Cell index={10} align="center">
                  {tcPortTotals.departure}
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
          <Button size="small" icon={<LineChartOutlined />} onClick={() => setAnalyzerOpen(true)}>
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

      <TcBottomPanels onOpenAnalyzer={() => setAnalyzerOpen(true)} />
      {analyzerOpen && <AnalyzerApp onClose={() => setAnalyzerOpen(false)} />}
    </EstimatorShell>
  );
}
