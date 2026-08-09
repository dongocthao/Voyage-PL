import { useState } from "react";
import { Button, Checkbox, DatePicker, Input, Select, Table } from "antd";
import type { ColumnsType } from "antd/es/table";
import {
  CalendarOutlined,
  EditOutlined,
  FileProtectOutlined,
  MinusOutlined,
  PlusOutlined,
  PrinterOutlined,
  ReloadOutlined,
  SaveOutlined,
  SearchOutlined,
} from "@ant-design/icons";
import DialogShell, { GroupTitle } from "./DialogShell";
import { TxtCell, YCell } from "./cells";
import { VE_COLORS } from "./theme";

type CharterPartyType = "voyage" | "time-charter";

type ShipmentRow = {
  key: string;
  cargo: string;
  quantity: string;
  unit: string;
  margin: string;
};

type PortTermRow = {
  key: string;
  port: string;
  laytime: string;
  detention: string;
  freightTax: string;
  linerTerm: string;
};

type FreightRow = {
  key: string;
  freight: string;
  unit: string;
  term: string;
  basedOn: string;
  divisor: string;
};

type BunkerContractRow = {
  key: string;
  type: string;
  bod: string;
  bor: string;
  unit: string;
  unitPrice: string;
  priceUnit: string;
};

const selectOptions = (values: string[]) => values.map((value) => ({ value, label: value }));

const fieldStyle: React.CSSProperties = { width: "100%" };
const cellInputStyle: React.CSSProperties = {
  width: "100%",
  height: 22,
  fontSize: 11,
};
const editableCellStyle: React.CSSProperties = {
  width: "100%",
  height: 20,
  border: 0,
  background: "transparent",
  fontSize: 11,
  padding: "0 3px",
};

const nextKey = () => `${Date.now()}-${Math.random().toString(16).slice(2)}`;

function FormTabs({ activeKey, onChange }: { activeKey: string; onChange: (key: string) => void }) {
  const tabs = [
    { key: "main", label: "Main Terms" },
    { key: "recap", label: "Recap" },
    { key: "attachment", label: "Attachment" },
  ];

  return (
    <div className="flex h-[30px] items-end gap-1">
      {tabs.map((tab) => (
        <button
          key={tab.key}
          type="button"
          onClick={() => onChange(tab.key)}
          className="h-[26px] border border-b-0 px-3 text-[12px] font-semibold"
          style={{
            borderColor: VE_COLORS.border,
            background: activeKey === tab.key ? "#ffffff" : "#EEF3F7",
            color: activeKey === tab.key ? VE_COLORS.sectionTitle : "#52687a",
          }}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="grid grid-cols-[112px_minmax(0,1fr)] items-center gap-2 py-[4px] text-[11px]">
      <span className="text-[#334E63]">{label}</span>
      <div>{children}</div>
    </label>
  );
}

function ContractActions() {
  return (
    <div className="mt-2 flex justify-end gap-2">
      <Button size="small" type="primary" icon={<SaveOutlined />}>
        Save
      </Button>
      <Button size="small" icon={<SaveOutlined />}>
        Save As
      </Button>
      <Button size="small" icon={<ReloadOutlined />}>
        Reload
      </Button>
      <Button size="small" icon={<FileProtectOutlined />}>
        Import Contract
      </Button>
      <Button size="small" icon={<PrinterOutlined />}>
        Print
      </Button>
    </div>
  );
}

function RowActions({ onAdd, onRemove }: { onAdd?: () => void; onRemove?: () => void }) {
  return (
    <div className="flex items-center justify-center gap-1">
      <button
        type="button"
        aria-label="Add row"
        onClick={onAdd}
        className="grid h-[18px] w-[18px] place-items-center rounded-full border border-[#3ba76d] bg-[#e8f7ef] text-[#14824d] hover:bg-[#d7f0e2]"
      >
        <PlusOutlined className="text-[10px]" />
      </button>
      <button
        type="button"
        aria-label="Delete row"
        onClick={onRemove}
        className="grid h-[18px] w-[18px] place-items-center rounded-full border border-[#458fc5] bg-[#e8f2fb] text-[#1d6ea7] hover:bg-[#d8e9f8]"
      >
        <MinusOutlined className="text-[10px]" />
      </button>
    </div>
  );
}

function BasicDetails({ type }: { type: CharterPartyType }) {
  const isTimeCharter = type === "time-charter";
  const fieldControlStyle: React.CSSProperties = { width: "100%" };

  return (
    <section className="min-w-0">
      <div className="border p-3" style={{ borderColor: VE_COLORS.border }}>
        <GroupTitle>Charter Party Details</GroupTitle>
        <Field label="Contract Number">
          <Input
            size="small"
            defaultValue={isTimeCharter ? "Seafuture 2022" : "Coal202203"}
            style={fieldStyle}
          />
        </Field>
        <Field label="Vessel">
          <Select
            size="small"
            defaultValue={isTimeCharter ? "NETPAS" : undefined}
            options={selectOptions(["NETPAS", "ORIENTAL PHOENIX", "VTC OCEAN 09"])}
            style={fieldControlStyle}
            showSearch
          />
        </Field>
        <Field label="Owners">
          <Input
            size="small"
            defaultValue={isTimeCharter ? "Netpas" : "Seafuture"}
            style={fieldControlStyle}
          />
        </Field>
        {isTimeCharter && (
          <Field label="Manager">
            <Select
              size="small"
              defaultValue="Manager"
              options={selectOptions(["Manager", "Owner", "Broker"])}
              style={fieldControlStyle}
            />
          </Field>
        )}
        <Field label="Charterers">
          <Input
            size="small"
            defaultValue={isTimeCharter ? "" : "Coal Trader"}
            style={fieldControlStyle}
          />
        </Field>
        <Field label="CP Form">
          <Input
            size="small"
            defaultValue={isTimeCharter ? "" : "GENCON"}
            style={fieldControlStyle}
          />
        </Field>
        <Field label="CP Date">
          <DatePicker size="small" suffixIcon={<CalendarOutlined />} style={fieldControlStyle} />
        </Field>
        <Field label="Status">
          <Select
            size="small"
            defaultValue="Standby"
            options={selectOptions(["Standby", "Fixed", "Canceled"])}
            style={fieldControlStyle}
          />
        </Field>
        {isTimeCharter ? (
          <Field label="TC">
            <Select
              size="small"
              defaultValue="In"
              options={selectOptions(["In", "Out"])}
              style={fieldControlStyle}
            />
          </Field>
        ) : (
          <Field label="Relet">
            <Checkbox />
          </Field>
        )}
      </div>

      <div className="mt-2">
        <GroupTitle>Remark</GroupTitle>
        <Input.TextArea rows={isTimeCharter ? 7 : 12} className="!text-[11px]" />
      </div>
      <ContractActions />
    </section>
  );
}

const bunkerBaseCols: ColumnsType<BunkerContractRow> = [
  {
    title: "Type",
    dataIndex: "type",
    width: 80,
    render: (v: string) => <TxtCell value={v} />,
  },
  {
    title: "Quantity",
    children: [
      {
        title: "BOD",
        dataIndex: "bod",
        width: 78,
        align: "right",
        render: (v: string) => <TxtCell value={v} right />,
      },
      {
        title: "BOR",
        dataIndex: "bor",
        width: 78,
        align: "right",
        render: (v: string) => <TxtCell value={v} right />,
      },
      {
        title: "Unit",
        dataIndex: "unit",
        width: 58,
        render: (v: string) => <TxtCell value={v} />,
      },
    ],
  },
  {
    title: "Price at both ends",
    children: [
      {
        title: "Unit Price",
        dataIndex: "unitPrice",
        width: 92,
        align: "right",
        render: (v: string) => <YCell value={v} />,
      },
      {
        title: "Unit",
        dataIndex: "priceUnit",
        width: 72,
        render: (v: string) => <TxtCell value={v} />,
      },
    ],
  },
];

function StackedPortTable({
  rows,
  onAdd,
  onRemove,
}: {
  rows: PortTermRow[];
  onAdd: () => void;
  onRemove: (key: string) => void;
}) {
  const headerCell = "flex items-center justify-center border-r px-1 text-center last:border-r-0";
  const inputCell = "flex h-[20px] items-center border-b border-r px-1 last:border-r-0";
  const yellowInput = (value: string, right?: boolean) => (
    <>
      <SearchOutlined className="mr-1 shrink-0 text-[#637381]" />
      <input defaultValue={value} className={right ? "text-right" : ""} style={editableCellStyle} />
    </>
  );

  return (
    <div className="border text-[11px]" style={{ borderColor: VE_COLORS.border }}>
      <div
        className="grid h-[40px] border-b"
        style={{
          borderColor: VE_COLORS.border,
          gridTemplateColumns: "190px 175px 175px 48px",
          background: VE_COLORS.headerBg,
          color: VE_COLORS.headerText,
        }}
      >
        <div className={headerCell} style={{ borderColor: VE_COLORS.border }}>
          Port
        </div>
        <div className="grid grid-rows-2 border-r" style={{ borderColor: VE_COLORS.border }}>
          <div
            className="flex items-center justify-center border-b"
            style={{ borderColor: VE_COLORS.border }}
          >
            Laytime
          </div>
          <div className="flex items-center justify-center">Detention</div>
        </div>
        <div className="grid grid-rows-2 border-r" style={{ borderColor: VE_COLORS.border }}>
          <div
            className="flex items-center justify-center border-b"
            style={{ borderColor: VE_COLORS.border }}
          >
            Freight Tax
          </div>
          <div className="flex items-center justify-center">Liner Term</div>
        </div>
        <div />
      </div>

      {rows.map((row) => (
        <div
          key={row.key}
          className="grid border-b last:border-b-0"
          style={{ borderColor: VE_COLORS.border, gridTemplateColumns: "190px 175px 175px 48px" }}
        >
          <div
            className="flex min-h-[40px] items-center border-r px-1"
            style={{ borderColor: VE_COLORS.border }}
          >
            <input defaultValue={row.port} style={editableCellStyle} />
            <EditOutlined className="text-[#2f8bc2]" />
          </div>
          <div className="grid grid-rows-2 border-r" style={{ borderColor: VE_COLORS.border }}>
            <div
              className={inputCell}
              style={{ borderColor: VE_COLORS.border, background: "#FFFDE7" }}
            >
              {yellowInput(row.laytime, true)}
            </div>
            <div className="flex h-[20px] items-center px-1" style={{ background: "#FFFDE7" }}>
              {yellowInput(row.detention, true)}
            </div>
          </div>
          <div className="grid grid-rows-2 border-r" style={{ borderColor: VE_COLORS.border }}>
            <div
              className={inputCell}
              style={{ borderColor: VE_COLORS.border, background: "#FFFDE7" }}
            >
              {yellowInput(row.freightTax, true)}
            </div>
            <div className="flex h-[20px] items-center px-1" style={{ background: "#FFFDE7" }}>
              {yellowInput(row.linerTerm, true)}
            </div>
          </div>
          <RowActions onAdd={onAdd} onRemove={() => onRemove(row.key)} />
        </div>
      ))}
    </div>
  );
}

function DateRange({ withTimezone = true }: { withTimezone?: boolean }) {
  return (
    <div className="grid grid-cols-[minmax(0,1fr)_16px_minmax(0,1fr)_130px] gap-2">
      <DatePicker size="small" suffixIcon={<CalendarOutlined />} style={fieldStyle} />
      <span className="text-center">-</span>
      <DatePicker size="small" suffixIcon={<CalendarOutlined />} style={fieldStyle} />
      {withTimezone ? (
        <Select
          size="small"
          defaultValue="GMT +00:00"
          options={selectOptions(["GMT +00:00", "GMT +07:00", "GMT +09:00"])}
        />
      ) : (
        <span />
      )}
    </div>
  );
}

function VoyageTerms() {
  const [shipments, setShipments] = useState<ShipmentRow[]>([
    { key: "1", cargo: "Coal", quantity: "45,000.0", unit: "MT", margin: "" },
    { key: "2", cargo: "", quantity: "", unit: "", margin: "" },
  ]);
  const [loadingPorts, setLoadingPorts] = useState<PortTermRow[]>([
    {
      key: "1",
      port: "Tianjin <China>",
      laytime: "",
      detention: "per Days",
      freightTax: "",
      linerTerm: "",
    },
    {
      key: "2",
      port: "Qingdao <China>",
      laytime: "",
      detention: "per Days",
      freightTax: "",
      linerTerm: "",
    },
  ]);
  const [dischargingPorts, setDischargingPorts] = useState<PortTermRow[]>([
    {
      key: "1",
      port: "Ravenna <Italy>",
      laytime: "",
      detention: "per Days",
      freightTax: "",
      linerTerm: "",
    },
    {
      key: "2",
      port: "Rotterdam <Netherlands>",
      laytime: "",
      detention: "per Days",
      freightTax: "",
      linerTerm: "",
    },
  ]);
  const [freightRows, setFreightRows] = useState<FreightRow[]>([
    { key: "1", freight: "28.00", unit: "per MT", term: "FIO", basedOn: "Base On", divisor: "/" },
    { key: "2", freight: "", unit: "", term: "", basedOn: "Base On", divisor: "/" },
  ]);
  const [brokerageRows, setBrokerageRows] = useState([
    { key: "1", account: "", brokerage: "", brokerageUnit: "Percent" },
  ]);

  const removeShipment = (key: string) =>
    setShipments((rows) => (rows.length > 1 ? rows.filter((row) => row.key !== key) : rows));
  const removeFreight = (key: string) =>
    setFreightRows((rows) => (rows.length > 1 ? rows.filter((row) => row.key !== key) : rows));
  const removeBrokerage = (key: string) =>
    setBrokerageRows((rows) => (rows.length > 1 ? rows.filter((row) => row.key !== key) : rows));

  const shipmentCols: ColumnsType<ShipmentRow> = [
    {
      title: "Cargo",
      dataIndex: "cargo",
      width: 190,
      render: (v: string) => <TxtCell value={v} />,
    },
    {
      title: "Quantity",
      dataIndex: "quantity",
      width: 120,
      align: "right",
      render: (v: string) => <YCell value={v} />,
    },
    { title: "Unit", dataIndex: "unit", width: 80, render: (v: string) => <TxtCell value={v} /> },
    {
      title: "Margin",
      dataIndex: "margin",
      width: 140,
      render: (v: string) => <TxtCell value={v} />,
    },
    {
      title: "",
      key: "action",
      width: 52,
      render: (_: unknown, row) => (
        <RowActions
          onAdd={() =>
            setShipments((rows) => [
              ...rows,
              { key: nextKey(), cargo: "", quantity: "", unit: "", margin: "" },
            ])
          }
          onRemove={() => removeShipment(row.key)}
        />
      ),
    },
  ];

  const freightCols: ColumnsType<FreightRow> = [
    {
      title: "Freight",
      dataIndex: "freight",
      width: 190,
      render: (v: string) => <YCell value={v} />,
    },
    { title: "Unit", dataIndex: "unit", width: 90, render: (v: string) => <TxtCell value={v} /> },
    { title: "Term", dataIndex: "term", width: 100, render: (v: string) => <TxtCell value={v} /> },
    {
      title: "Based On",
      width: 130,
      render: (_: unknown, row) => (
        <div className="grid grid-cols-[1fr_24px]">
          <input defaultValue={row.basedOn} style={editableCellStyle} />
          <input
            defaultValue={row.divisor}
            className="border-l text-center"
            style={editableCellStyle}
          />
        </div>
      ),
    },
    {
      title: "",
      key: "action",
      width: 52,
      render: (_: unknown, row) => (
        <RowActions
          onAdd={() =>
            setFreightRows((rows) => [
              ...rows,
              { key: nextKey(), freight: "", unit: "", term: "", basedOn: "Base On", divisor: "/" },
            ])
          }
          onRemove={() => removeFreight(row.key)}
        />
      ),
    },
  ];

  return (
    <section className="min-w-0 border p-3" style={{ borderColor: VE_COLORS.border }}>
      <div className="mb-2 flex items-center gap-2">
        <GroupTitle>Voyage Charter Details</GroupTitle>
        <Select
          size="small"
          defaultValue="Single"
          options={selectOptions(["Single", "Multiple"])}
          style={{ width: 110 }}
        />
      </div>

      <div className="grid grid-cols-[112px_minmax(0,1fr)] gap-x-2 gap-y-2 text-[11px]">
        <span className="pt-2 text-[#334E63]">Shipment</span>
        <Table<ShipmentRow>
          size="small"
          bordered
          pagination={false}
          tableLayout="fixed"
          columns={shipmentCols}
          dataSource={shipments}
        />

        <span className="self-center text-[#334E63]">Lay / Can</span>
        <DateRange />

        <span className="pt-2 text-[#334E63]">Loading Port</span>
        <StackedPortTable
          rows={loadingPorts}
          onAdd={() =>
            setLoadingPorts((rows) => [
              ...rows,
              {
                key: nextKey(),
                port: "",
                laytime: "",
                detention: "per Days",
                freightTax: "",
                linerTerm: "",
              },
            ])
          }
          onRemove={(key) =>
            setLoadingPorts((rows) =>
              rows.length > 1 ? rows.filter((row) => row.key !== key) : rows,
            )
          }
        />

        <span className="pt-2 text-[#334E63]">Discharging Port</span>
        <StackedPortTable
          rows={dischargingPorts}
          onAdd={() =>
            setDischargingPorts((rows) => [
              ...rows,
              {
                key: nextKey(),
                port: "",
                laytime: "",
                detention: "per Days",
                freightTax: "",
                linerTerm: "",
              },
            ])
          }
          onRemove={(key) =>
            setDischargingPorts((rows) =>
              rows.length > 1 ? rows.filter((row) => row.key !== key) : rows,
            )
          }
        />

        <span className="pt-2 text-[#334E63]">Freight</span>
        <Table<FreightRow>
          size="small"
          bordered
          pagination={false}
          tableLayout="fixed"
          columns={freightCols}
          dataSource={freightRows}
        />

        <span className="self-center text-[#334E63]">Add Comm.</span>
        <Input size="small" style={{ ...cellInputStyle, width: 160 }} />

        <span className="pt-2 text-[#334E63]">Brokerage</span>
        <Table
          size="small"
          bordered
          pagination={false}
          tableLayout="fixed"
          columns={[
            {
              title: "Account",
              dataIndex: "account",
              render: (v: string) => <TxtCell value={v} />,
            },
            {
              title: "Brokerage",
              children: [
                {
                  title: "",
                  dataIndex: "brokerage",
                  width: 110,
                  align: "right",
                  render: (v: string) => <YCell value={v} />,
                },
                {
                  title: "",
                  dataIndex: "brokerageUnit",
                  width: 80,
                  render: (v: string) => <TxtCell value={v} />,
                },
              ],
            },
            {
              title: "",
              key: "action",
              width: 52,
              render: (_: unknown, row: { key: string }) => (
                <RowActions
                  onAdd={() =>
                    setBrokerageRows((rows) => [
                      ...rows,
                      { key: nextKey(), account: "", brokerage: "", brokerageUnit: "Percent" },
                    ])
                  }
                  onRemove={() => removeBrokerage(row.key)}
                />
              ),
            },
          ]}
          dataSource={brokerageRows}
        />
      </div>
    </section>
  );
}

function TimeCharterTerms() {
  const [bunkerRows, setBunkerRows] = useState<BunkerContractRow[]>([
    {
      key: "1",
      type: "VLSFO",
      bod: "",
      bor: "",
      unit: "MT",
      unitPrice: "",
      priceUnit: "per MT",
    },
    {
      key: "2",
      type: "MGO",
      bod: "",
      bor: "",
      unit: "MT",
      unitPrice: "",
      priceUnit: "per MT",
    },
  ]);
  const removeBunker = (key: string) =>
    setBunkerRows((rows) => (rows.length > 1 ? rows.filter((row) => row.key !== key) : rows));
  const bunkerCols: ColumnsType<BunkerContractRow> = [
    ...bunkerBaseCols,
    {
      title: "",
      key: "action",
      width: 52,
      render: (_: unknown, row) => (
        <RowActions
          onAdd={() =>
            setBunkerRows((rows) => [
              ...rows,
              {
                key: nextKey(),
                type: "",
                bod: "",
                bor: "",
                unit: "MT",
                unitPrice: "",
                priceUnit: "per MT",
              },
            ])
          }
          onRemove={() => removeBunker(row.key)}
        />
      ),
    },
  ];

  return (
    <section className="min-w-0 border p-3" style={{ borderColor: VE_COLORS.border }}>
      <div className="mb-2 flex items-center gap-2">
        <GroupTitle>Time Charter Details</GroupTitle>
        <Select
          size="small"
          defaultValue="Single"
          options={selectOptions(["Single", "Multiple"])}
          style={{ width: 110 }}
        />
      </div>

      <div className="grid grid-cols-[130px_minmax(0,1fr)] gap-x-2 gap-y-2 text-[11px]">
        <span className="self-center text-[#334E63]">Duration</span>
        <div className="grid grid-cols-[110px_minmax(0,1fr)_80px_16px_110px_minmax(0,1fr)_80px] gap-2">
          <Select
            size="small"
            defaultValue="Minimum"
            options={selectOptions(["Minimum", "About", "Exact"])}
          />
          <Input size="small" />
          <Select size="small" defaultValue="Day" options={selectOptions(["Day", "Month"])} />
          <span className="text-center">-</span>
          <Select
            size="small"
            defaultValue="Maximum"
            options={selectOptions(["Maximum", "About", "Exact"])}
          />
          <Input size="small" />
          <Select size="small" defaultValue="Day" options={selectOptions(["Day", "Month"])} />
        </div>

        <span className="self-center text-[#334E63]">Lay / Can</span>
        <DateRange />

        <span className="self-center text-[#334E63]">Del Area or Port</span>
        <div className="grid grid-cols-[90px_minmax(0,1fr)] gap-2">
          <Select size="small" options={selectOptions(["Area", "Port"])} />
          <Input size="small" defaultValue="Incheon (KR) [+09:00]" />
        </div>

        <span className="self-center text-[#334E63]">Redel Area or Port</span>
        <div className="grid grid-cols-[90px_minmax(0,1fr)] gap-2">
          <Select size="small" options={selectOptions(["Area", "Port"])} />
          <Input size="small" defaultValue="London (GB) [+00:00]" />
        </div>

        <span className="self-center text-[#334E63]">Estimated Schedule</span>
        <DateRange withTimezone={false} />

        <span className="self-center text-[#334E63]">Actual Schedule</span>
        <DateRange withTimezone={false} />

        <span className="self-center text-[#334E63]">Hire</span>
        <div>
          <Input size="small" style={{ width: 180 }} />
          <div className="mt-1 text-[#7b8794]">Input custom hire option.</div>
        </div>

        <span className="self-center text-[#334E63]">Add. Comm.</span>
        <Input size="small" style={{ width: 160 }} />

        <span className="self-center text-[#334E63]">Ballast Bonus</span>
        <Input size="small" style={{ width: 160 }} />

        <span className="self-center text-[#334E63]">C. E. V.</span>
        <div className="grid grid-cols-[160px_160px] gap-2">
          <Input size="small" defaultValue="1,300.00" />
          <Select
            size="small"
            defaultValue="in Lumpsum"
            options={selectOptions(["in Lumpsum", "per Day"])}
          />
        </div>

        <span className="self-center text-[#334E63]">ILOHC</span>
        <Input size="small" defaultValue="4,500.00" style={{ width: 160 }} />

        <span className="pt-2 text-[#334E63]">Bunker</span>
        <div>
          <div className="mb-2 flex items-center gap-2">
            <span>BOR to be</span>
            <Select
              size="small"
              defaultValue="About Same As On BOD"
              options={selectOptions(["About Same As On BOD", "Exact ROB", "Manual"])}
              style={{ width: 220 }}
            />
          </div>
          <Table<BunkerContractRow>
            size="small"
            bordered
            pagination={false}
            tableLayout="fixed"
            columns={bunkerCols}
            dataSource={bunkerRows}
          />
        </div>
      </div>
    </section>
  );
}

function RecapView({ type }: { type: CharterPartyType }) {
  return (
    <div className="border p-3" style={{ borderColor: VE_COLORS.border }}>
      <GroupTitle>Recap</GroupTitle>
      <Input.TextArea
        rows={18}
        defaultValue={
          type === "time-charter"
            ? "Time charter recap will be generated from the main terms."
            : "Voyage charter recap will be generated from the main terms."
        }
      />
    </div>
  );
}

function AttachmentView() {
  return (
    <div className="border p-3" style={{ borderColor: VE_COLORS.border }}>
      <GroupTitle>Attachment</GroupTitle>
      <div
        className="flex h-[280px] items-center justify-center border border-dashed text-[#5a6e7f]"
        style={{ borderColor: VE_COLORS.border }}
      >
        Drop charter party files here or use the upload command.
      </div>
    </div>
  );
}

export default function CharterPartyApp({ type }: { type: CharterPartyType }) {
  const [tab, setTab] = useState("main");
  const isTimeCharter = type === "time-charter";

  return (
    <DialogShell
      title={isTimeCharter ? "Time Charter Contract" : "Voyage Charter Contract"}
      icon={<FileProtectOutlined />}
      width={1180}
      bodyPadding={0}
      modal={false}
      actions={[]}
    >
      <div className="px-2 pt-1">
        <FormTabs activeKey={tab} onChange={setTab} />
      </div>
      <div
        className="border-t p-2"
        style={{ borderColor: VE_COLORS.border, background: "#ffffff" }}
      >
        {tab === "main" && (
          <div className="grid grid-cols-[404px_minmax(0,1fr)] gap-3">
            <BasicDetails type={type} />
            {isTimeCharter ? <TimeCharterTerms /> : <VoyageTerms />}
          </div>
        )}
        {tab === "recap" && <RecapView type={type} />}
        {tab === "attachment" && <AttachmentView />}
      </div>
    </DialogShell>
  );
}
