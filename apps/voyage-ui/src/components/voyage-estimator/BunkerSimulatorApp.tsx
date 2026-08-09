import { Table, Checkbox, Radio, Slider, Button, InputNumber } from "antd";
import type { ColumnsType } from "antd/es/table";
import { PrinterOutlined, UnorderedListOutlined, ExperimentOutlined } from "@ant-design/icons";
import DialogShell, { GroupTitle } from "./DialogShell";
import VesselSection from "./VesselSection";
import { TxtCell } from "./cells";
import { VE_COLORS } from "./theme";
import {
  robData,
  bunkerPriceData,
  bunkerComparison,
  type RobRow,
  type BunkerPriceRow,
} from "./simulatorData";

const num = (v: string) => (
  <span
    className="block pr-1 text-right"
    style={{ color: v.startsWith("-") ? VE_COLORS.alert : undefined }}
  >
    {v}
  </span>
);

const spanCell = (r: RobRow) => ({ rowSpan: r.span });

const robCols: ColumnsType<RobRow> = [
  {
    title: "Port Name",
    dataIndex: "port",
    width: "13%",
    onCell: spanCell,
    render: (v: string) => <TxtCell value={v} />,
  },
  { title: "W.F", dataIndex: "wf", width: "4%", align: "right", onCell: spanCell, render: num },
  {
    title: "Speed",
    dataIndex: "speed",
    width: "4.5%",
    align: "right",
    onCell: spanCell,
    render: num,
  },
  { title: "Sea", dataIndex: "sea", width: "4.5%", align: "right", onCell: spanCell, render: num },
  {
    title: "Port",
    dataIndex: "portDays",
    width: "4.5%",
    align: "right",
    onCell: spanCell,
    render: num,
  },
  { title: "Type", dataIndex: "type", width: "5.5%" },
  {
    title: "Arrival Supply",
    children: [
      {
        title: "Quantity",
        dataIndex: "aQty",
        width: "6%",
        align: "right",
        render: (v: string) => <TxtCell value={v} right />,
      },
      {
        title: "Unit Price",
        dataIndex: "aUnit",
        width: "6%",
        align: "right",
        render: (v: string) => <TxtCell value={v} right />,
      },
      { title: "Price", dataIndex: "aPrice", width: "6%", align: "right", render: num },
    ],
  },
  { title: "Arrival ROB", dataIndex: "arrRob", width: "6.5%", align: "right", render: num },
  {
    title: "Departure Supply",
    children: [
      {
        title: "Quantity",
        dataIndex: "dQty",
        width: "6%",
        align: "right",
        render: (v: string) => <TxtCell value={v} right />,
      },
      {
        title: "Unit Price",
        dataIndex: "dUnit",
        width: "6%",
        align: "right",
        render: (v: string) => <TxtCell value={v} right />,
      },
      { title: "Price", dataIndex: "dPrice", width: "6%", align: "right", render: num },
    ],
  },
  { title: "Departure ROB", dataIndex: "depRob", width: "7%", align: "right", render: num },
  {
    title: "Consumption",
    children: [
      { title: "Sea", dataIndex: "cSea", width: "5.5%", align: "right", render: num },
      { title: "Port", dataIndex: "cPort", width: "5.5%", align: "right", render: num },
    ],
  },
];

const priceCols: ColumnsType<BunkerPriceRow> = [
  { title: "", dataIndex: "group", width: "20%", onCell: (r) => ({ rowSpan: r.span }) },
  { title: "Type", dataIndex: "type", width: "14%" },
  { title: "Quantity", dataIndex: "quantity", width: "17%", align: "right", render: num },
  { title: "Unit Price", dataIndex: "unitPrice", width: "17%", align: "right", render: num },
  { title: "Price", dataIndex: "price", width: "16%", align: "right", render: num },
  {
    title: "Total Price",
    dataIndex: "totalPrice",
    width: "16%",
    align: "right",
    onCell: (r) => ({ rowSpan: r.span }),
    render: num,
  },
];

export default function BunkerSimulatorApp({ onClose }: { onClose?: () => void }) {
  return (
    <DialogShell
      title="Bunker Simulator"
      icon={<ExperimentOutlined />}
      width={1300}
      onClose={onClose}
      actions={[{ label: "Close" }]}
      footerLeft={
        <>
          <Button size="small" icon={<PrinterOutlined />}>
            Print
          </Button>
          <Button size="small" icon={<UnorderedListOutlined />}>
            Index
          </Button>
          <span className="ml-2">Reset</span>
          <div className="w-[140px]">
            <Slider defaultValue={50} tooltip={{ open: false }} />
          </div>
          <span>100 %</span>
        </>
      }
    >
      <GroupTitle>Vessel Particular</GroupTitle>
      <VesselSection />

      <div className="mt-2 grid grid-cols-1 gap-3 xl:grid-cols-[1fr_460px]">
        <section>
          <div className="mb-1 flex flex-wrap items-center gap-3">
            <GroupTitle>ROB &amp; Supply</GroupTitle>
            <span className="font-bold" style={{ color: VE_COLORS.alert }}>
              Bunker supply (VLSFO, MGO, ULSFO) is insufficient.
            </span>
            <Checkbox defaultChecked>VLSFO</Checkbox>
            <Checkbox defaultChecked>MGO</Checkbox>
            <Checkbox defaultChecked>ULSFO</Checkbox>
          </div>
          <Table<RobRow>
            size="small"
            bordered
            pagination={false}
            tableLayout="fixed"
            columns={robCols}
            dataSource={robData}
            scroll={{ y: 420 }}
          />
        </section>

        <div className="space-y-3">
          <section>
            <div className="mb-1 flex items-center justify-between">
              <GroupTitle>Bunker Price</GroupTitle>
              <Radio.Group size="small" defaultValue="avg">
                <Radio value="avg">Average</Radio>
                <Radio value="fifo">FIFO</Radio>
              </Radio.Group>
            </div>
            <Table<BunkerPriceRow>
              size="small"
              bordered
              pagination={false}
              tableLayout="fixed"
              columns={priceCols}
              dataSource={bunkerPriceData}
            />
          </section>

          <section>
            <div className="mb-1 flex items-center justify-between">
              <GroupTitle>Bunker Price Comparison</GroupTitle>
              <span className="flex items-center gap-1">
                Hire / Day
                <InputNumber size="small" defaultValue={8500} style={{ width: 100 }} />
              </span>
            </div>
            <div className="border" style={{ borderColor: VE_COLORS.border }}>
              <div
                className="grid grid-cols-4 font-medium"
                style={{ background: VE_COLORS.headerBg, color: VE_COLORS.headerText }}
              >
                {["", "Full Speed", "Eco Speed", "Difference (Full - Eco)"].map((h) => (
                  <div
                    key={h}
                    className="border-r px-1 py-[3px] text-center last:border-r-0"
                    style={{ borderColor: VE_COLORS.border }}
                  >
                    {h}
                  </div>
                ))}
              </div>
              {bunkerComparison.map((r) => (
                <div
                  key={r[0]}
                  className="grid grid-cols-4 border-t"
                  style={{ borderColor: VE_COLORS.border }}
                >
                  <div
                    className="border-r px-1 py-[3px]"
                    style={{ borderColor: VE_COLORS.border, background: VE_COLORS.rowAlt }}
                  >
                    {r[0]}
                  </div>
                  <div
                    className="border-r px-1 py-[3px] text-right"
                    style={{ borderColor: VE_COLORS.border }}
                  >
                    {r[1]}
                  </div>
                  <div
                    className="border-r px-1 py-[3px] text-right"
                    style={{ borderColor: VE_COLORS.border }}
                  >
                    {r[2]}
                  </div>
                  <div
                    className="px-1 py-[3px] text-right"
                    style={{
                      color: r[3].startsWith("-") ? VE_COLORS.alert : VE_COLORS.sectionTitle,
                    }}
                  >
                    {r[3]}
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>
    </DialogShell>
  );
}
