import { Button, Checkbox, DatePicker, Input, Select, Table, Tabs } from "antd";
import type { ColumnsType } from "antd/es/table";
import {
  BookOutlined,
  DownloadOutlined,
  MinusCircleOutlined,
  PlusCircleOutlined,
  PrinterOutlined,
  SaveOutlined,
  SearchOutlined,
  DeploymentUnitOutlined,
} from "@ant-design/icons";
import DialogShell, { GroupTitle } from "./DialogShell";
import { TxtCell, YCell } from "./cells";
import { VE_COLORS } from "./theme";
import NewVesselFormAnt from "./NewVesselFormAnt";

type MasterFormType = "new-vessel" | "address-book" | "co2-emission";

const options = (values: string[]) => values.map((value) => ({ value, label: value }));
const inputStyle: React.CSSProperties = { height: 22, fontSize: 11 };

function Field({
  label,
  children,
  labelWidth = 108,
}: {
  label: string;
  children: React.ReactNode;
  labelWidth?: number;
}) {
  return (
    <div
      className="grid items-center gap-2 py-[3px]"
      style={{ gridTemplateColumns: `${labelWidth}px minmax(0,1fr)` }}
    >
      <span className="text-[11px] text-[#334E63]">{label}</span>
      <div className="min-w-0">{children}</div>
    </div>
  );
}

function SmallInput(props: React.ComponentProps<typeof Input>) {
  return <Input size="small" style={{ ...inputStyle, ...props.style }} {...props} />;
}

function SmallSelect({
  values,
  ...props
}: { values: string[] } & React.ComponentProps<typeof Select>) {
  return (
    <Select
      size="small"
      options={options(values)}
      style={{ width: "100%", ...props.style }}
      {...props}
    />
  );
}

function RowIcons() {
  return (
    <span className="flex items-center justify-center gap-2">
      <PlusCircleOutlined style={{ color: "#45b86b" }} />
      <MinusCircleOutlined style={{ color: "#4e9bd5" }} />
    </span>
  );
}

function MiniRibbon({ showIndex }: { showIndex?: boolean }) {
  return (
    <div
      className="flex h-[54px] items-center gap-2 border-b bg-[#F7FAFC] px-3"
      style={{ borderColor: VE_COLORS.border }}
    >
      <Button size="small" icon={<SaveOutlined />} type="primary">
        Save
      </Button>
      <Button size="small" icon={<DownloadOutlined />}>
        Export file
      </Button>
      <Button size="small" icon={<PrinterOutlined />}>
        Print
      </Button>
      {showIndex && <Button size="small">Index</Button>}
    </div>
  );
}

type FuelRow = {
  key: string;
  group: string;
  type: string;
  ballast?: string;
  laden?: string;
  idle?: string;
  work?: string;
  sea?: string;
};

const mainFuelCols: ColumnsType<FuelRow> = [
  { title: "Main", dataIndex: "group", width: 70 },
  { title: "Type", dataIndex: "type", width: 90 },
  {
    title: "Ballast",
    dataIndex: "ballast",
    align: "right",
    render: (v: string) => <YCell value={v} />,
  },
  {
    title: "Laden",
    dataIndex: "laden",
    align: "right",
    render: (v: string) => <YCell value={v} />,
  },
  {
    title: "Idle",
    dataIndex: "idle",
    align: "right",
    render: (v: string) => <TxtCell value={v} right />,
  },
  {
    title: "Work",
    dataIndex: "work",
    align: "right",
    render: (v: string) => <TxtCell value={v} right />,
  },
  { title: "", key: "actions", width: 48, render: RowIcons },
];

const subFuelCols: ColumnsType<FuelRow> = [
  { title: "Sub", dataIndex: "group", width: 70 },
  { title: "Type", dataIndex: "type", width: 90 },
  {
    title: "Sea",
    dataIndex: "sea",
    align: "right",
    render: (v: string) => <TxtCell value={v} right />,
  },
  {
    title: "Idle",
    dataIndex: "idle",
    align: "right",
    render: (v: string) => <TxtCell value={v} right />,
  },
  {
    title: "Work",
    dataIndex: "work",
    align: "right",
    render: (v: string) => <TxtCell value={v} right />,
  },
  { title: "", key: "actions", width: 48, render: RowIcons },
];

function NewVesselForm() {
  return (
    <DialogShell
      title="New Vessel"
      icon={<DeploymentUnitOutlined />}
      width={1180}
      modal={false}
      actions={[{ label: "OK", primary: true }, { label: "Cancel" }]}
      footerLeft={
        <Button size="small" icon={<DownloadOutlined />}>
          Export file
        </Button>
      }
    >
      <div className="mb-2 text-[11px] text-[#5a6e7f]">
        Input all speed and bunker consumption to produce P&amp;L estimation.
      </div>
      <div className="grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)] gap-6">
        <section className="min-w-0">
          <div className="grid grid-cols-2 gap-x-4">
            <Field label="Vessel Name">
              <SmallInput defaultValue="seafuture" />
            </Field>
            <Field label="Vessel Type">
              <SmallInput />
            </Field>
            <Field label="Ownership">
              <SmallSelect values={["Owned", "Bareboat", "Time charter"]} defaultValue="Owned" />
            </Field>
            <Field label="Draft">
              <div className="flex gap-1">
                <SmallInput defaultValue="0.00" />
                <SmallSelect values={["M", "FT"]} defaultValue="M" style={{ width: 72 }} />
              </div>
            </Field>
            <Field label="Year built">
              <SmallInput defaultValue="0" />
            </Field>
            <Field label="ICE Class">
              <SmallSelect values={["No", "1A", "1B", "1C"]} defaultValue="No" />
            </Field>
            <Field label="WAP">
              <SmallSelect values={["No", "Yes"]} defaultValue="No" />
            </Field>
          </div>

          <div className="mt-3 grid grid-cols-2 gap-4">
            <section>
              <GroupTitle>Particulars</GroupTitle>
              <Field label="DWT" labelWidth={72}>
                <SmallInput defaultValue="55,250" />
              </Field>
              <Field label="Grain" labelWidth={72}>
                <div className="flex gap-1">
                  <SmallInput defaultValue="0.00" />
                  <SmallSelect values={["CBM", "CFT"]} defaultValue="CBM" style={{ width: 78 }} />
                </div>
              </Field>
              <Field label="Bale" labelWidth={72}>
                <SmallInput defaultValue="0.00" />
              </Field>
              <Field label="TPC" labelWidth={72}>
                <SmallInput defaultValue="0.00" />
              </Field>
            </section>
            <section>
              <GroupTitle>Operation Expenses</GroupTitle>
              <Field label="Hire rate" labelWidth={84}>
                <SmallInput defaultValue="0.00" />
              </Field>
              <Field label="ILOHC" labelWidth={84}>
                <SmallInput defaultValue="0.00" />
              </Field>
              <Field label="CEV" labelWidth={84}>
                <SmallInput defaultValue="0.00" addonAfter="/ 30 days" />
              </Field>
            </section>
          </div>

          <Tabs
            size="small"
            defaultActiveKey="full"
            className="mt-3"
            items={["Full", "Eco", "Custom1", "Custom2", "Custom3"].map((label) => ({
              key: label.toLowerCase(),
              label,
              children: (
                <div className="space-y-3">
                  <div className="grid grid-cols-[180px_minmax(0,1fr)] gap-3">
                    <section>
                      <GroupTitle>Speed</GroupTitle>
                      <Table
                        size="small"
                        bordered
                        pagination={false}
                        tableLayout="fixed"
                        columns={[
                          {
                            title: "Ballast",
                            dataIndex: "ballast",
                            render: (v: string) => <YCell value={v} />,
                          },
                          {
                            title: "Laden",
                            dataIndex: "laden",
                            render: (v: string) => <YCell value={v} />,
                          },
                        ]}
                        dataSource={[{ key: "1", ballast: "0.00", laden: "0.00" }]}
                      />
                    </section>
                    <section>
                      <GroupTitle>Bunker Consumption</GroupTitle>
                      <Table<FuelRow>
                        size="small"
                        bordered
                        pagination={false}
                        tableLayout="fixed"
                        columns={mainFuelCols}
                        dataSource={[
                          {
                            key: "1",
                            group: "Normal",
                            type: "VLSFO",
                            ballast: "0.00",
                            laden: "0.00",
                            idle: "0.00",
                            work: "0.00",
                          },
                          {
                            key: "2",
                            group: "ECA",
                            type: "ULSFO",
                            ballast: "0.00",
                            laden: "0.00",
                            idle: "0.00",
                            work: "0.00",
                          },
                        ]}
                      />
                    </section>
                  </div>
                  <Table<FuelRow>
                    size="small"
                    bordered
                    pagination={false}
                    tableLayout="fixed"
                    columns={subFuelCols}
                    dataSource={[
                      {
                        key: "1",
                        group: "Normal",
                        type: "MGO",
                        sea: "0.00",
                        idle: "0.00",
                        work: "0.00",
                      },
                      {
                        key: "2",
                        group: "ECA",
                        type: "MGO",
                        sea: "0.00",
                        idle: "0.00",
                        work: "0.00",
                      },
                    ]}
                  />
                </div>
              ),
            }))}
          />

          <GroupTitle>Remark</GroupTitle>
          <Input.TextArea rows={4} />
        </section>

        <section className="min-w-0">
          <GroupTitle>General</GroupTitle>
          <div className="grid grid-cols-2 gap-x-4">
            {[
              "Owner",
              "Callsign",
              "IMO No",
              "Vessel code",
              "Hull No",
              "DWCC",
              "LOA",
              "Flag",
              "GRT",
              "Beam",
              "Class",
              "NRT",
              "Depth",
              "P&I",
              "Constant",
            ].map((label) => (
              <Field key={label} label={label}>
                <SmallInput />
              </Field>
            ))}
          </div>
          <div className="mt-3">
            <GroupTitle>Canal</GroupTitle>
            <div className="grid grid-cols-2 gap-x-4">
              <Field label="SCNT">
                <SmallInput defaultValue="0.00" />
              </Field>
              <Field label="PC/UMS NT">
                <SmallInput defaultValue="0.00" />
              </Field>
            </div>
          </div>
          <div className="mt-3">
            <GroupTitle>Gears & Ho/Ha</GroupTitle>
            <div className="grid grid-cols-[minmax(0,1fr)_220px] gap-3">
              <Input.TextArea rows={7} />
              <div className="space-y-2">
                <SmallSelect values={["Crane", "Derrick", "Grab"]} defaultValue="Crane" />
                <div className="grid grid-cols-2 gap-2">
                  <SmallInput addonAfter="MT" />
                  <SmallInput addonAfter="EA" />
                </div>
                <SmallSelect values={["Midship", "Bow", "Astern"]} defaultValue="Midship" />
                <div className="grid grid-cols-2 gap-2">
                  <Button size="small">Add</Button>
                  <Button size="small">Delete</Button>
                </div>
              </div>
            </div>
            <Field label="HO/HA" labelWidth={160}>
              <div className="flex gap-2">
                <SmallInput defaultValue="0" />
                <SmallInput defaultValue="0" />
              </div>
            </Field>
            <Field label="HO/HA Type" labelWidth={160}>
              <div className="flex gap-2">
                <SmallSelect
                  values={["Single decker", "Tween decker"]}
                  defaultValue="Single decker"
                />
                <SmallSelect
                  values={["Mc Gregor", "Folding", "Pontoon"]}
                  defaultValue="Mc Gregor"
                />
              </div>
            </Field>
            <Field label="Tanktop strength" labelWidth={160}>
              <SmallInput addonAfter="MT/SQM" />
            </Field>
            <Field label="Hatchcover strength" labelWidth={160}>
              <SmallInput addonAfter="MT/SQM" />
            </Field>
          </div>
        </section>
      </div>
    </DialogShell>
  );
}

function AddressBookForm() {
  const contactFields = [
    "Name",
    "Division",
    "Title",
    "Phone",
    "Mobile Phone",
    "Fax",
    "E-mail",
    "Instant Messenger",
  ];
  return (
    <DialogShell
      title="Company Detail [New]"
      icon={<BookOutlined />}
      width={906}
      modal={false}
      actions={[{ label: "OK", primary: true }, { label: "Cancel" }]}
    >
      <div className="grid grid-cols-2 gap-4">
        <section className="min-w-0">
          <Field label="Company (Account)">
            <SmallInput defaultValue="Netpas" />
          </Field>
          <Field label="Alias">
            <div className="flex gap-1">
              <SmallInput />
              <RowIcons />
            </div>
          </Field>
          <Field label="Business Type">
            <SmallInput defaultValue="Bunker (Supplier, Broker and etc)" />
          </Field>
          <div className="grid grid-cols-2 gap-2">
            <Field label="Country">
              <SmallSelect
                values={["Korea (South)", "Singapore", "China"]}
                defaultValue="Korea (South)"
              />
            </Field>
            <Field label="Time Zone">
              <SmallSelect
                values={["GMT +09:00", "GMT +08:00", "GMT +00:00"]}
                defaultValue="GMT +09:00"
              />
            </Field>
          </div>
          <AddressPanel />
          {["Phone", "Fax", "Web Site", "Bank Account"].map((label) => (
            <Field key={label} label={label}>
              <div className="flex gap-1">
                <SmallInput
                  defaultValue={
                    label === "Web Site"
                      ? "www.netpas.net"
                      : label === "Bank Account"
                        ? "1081-600-391597"
                        : ""
                  }
                />
                <RowIcons />
              </div>
            </Field>
          ))}
          <Field label="Remark">
            <Input.TextArea rows={5} defaultValue="WOORI BANK Jamsil Station Branch" />
          </Field>
        </section>
        <section className="min-w-0 border p-3" style={{ borderColor: VE_COLORS.border }}>
          <Tabs
            size="small"
            defaultActiveKey="erin"
            items={[{ key: "erin", label: "Erin Kim", children: null }]}
          />
          {contactFields.map((label) => (
            <Field key={label} label={label}>
              <div className="flex gap-1">
                <SmallInput
                  defaultValue={
                    label === "Name"
                      ? "Erin Kim"
                      : label === "Division"
                        ? "Sales"
                        : label === "Title"
                          ? "Manager"
                          : label === "E-mail"
                            ? "sales@netpas.net"
                            : ""
                  }
                />
                <RowIcons />
              </div>
            </Field>
          ))}
          <AddressPanel compact />
          <Field label="Remark">
            <Input.TextArea rows={3} />
          </Field>
          <div className="mt-2 text-right">
            <Button size="small">Move to other company</Button>
          </div>
        </section>
      </div>
      <div className="mt-3 border-t pt-2 text-[11px]" style={{ borderColor: VE_COLORS.border }}>
        Click to show Related Company
      </div>
    </DialogShell>
  );
}

function AddressPanel({ compact }: { compact?: boolean }) {
  return (
    <div className={compact ? "my-2" : "my-2 ml-[108px]"}>
      <Tabs
        size="small"
        defaultActiveKey="address"
        items={[{ key: "address", label: "Address", children: null }]}
      />
      <div className="border p-2" style={{ borderColor: VE_COLORS.border }}>
        <Field label="Country" labelWidth={70}>
          <SmallSelect
            values={["Korea (South)", "Singapore", "China"]}
            defaultValue="Korea (South)"
          />
        </Field>
        <div className="grid grid-cols-2 gap-2">
          <Field label="Province" labelWidth={70}>
            <SmallInput />
          </Field>
          <Field label="Post Code" labelWidth={70}>
            <SmallInput />
          </Field>
        </div>
        <Field label="City" labelWidth={70}>
          <SmallInput defaultValue="Seoul" />
        </Field>
        <Field label="Detail" labelWidth={70}>
          <SmallInput />
        </Field>
      </div>
    </div>
  );
}

type EmissionRow = {
  key: string;
  section: string;
  type: string;
  consumption: string;
  factor: string;
  emission: string;
};

const emissionCols: ColumnsType<EmissionRow> = [
  { title: "", dataIndex: "section", width: 58 },
  { title: "Type", dataIndex: "type", width: 86 },
  {
    title: "Consumption",
    dataIndex: "consumption",
    align: "right",
    render: (v: string) => <YCell value={v} />,
  },
  {
    title: "Emission Factor",
    dataIndex: "factor",
    align: "right",
    render: (v: string) => <TxtCell value={v} right />,
  },
  {
    title: "CO2 Emission (MT)",
    dataIndex: "emission",
    align: "right",
    render: (v: string) => <YCell value={v} />,
  },
];

function Co2EmissionForm() {
  const rows: EmissionRow[] = [
    {
      key: "1",
      section: "Sea",
      type: "VLSFO",
      consumption: "711.59",
      factor: "3.151040",
      emission: "2,242.26",
    },
    {
      key: "2",
      section: "Sea",
      type: "MGO",
      consumption: "1.25",
      factor: "3.206000",
      emission: "4.00",
    },
    {
      key: "3",
      section: "Sea",
      type: "Sub Total",
      consumption: "",
      factor: "",
      emission: "2,246.25",
    },
    {
      key: "4",
      section: "Port",
      type: "VLSFO",
      consumption: "51.00",
      factor: "3.151040",
      emission: "160.70",
    },
    {
      key: "5",
      section: "Port",
      type: "MGO",
      consumption: "1.96",
      factor: "3.206000",
      emission: "6.28",
    },
    {
      key: "6",
      section: "Port",
      type: "Sub Total",
      consumption: "",
      factor: "",
      emission: "166.99",
    },
    {
      key: "7",
      section: "Total",
      type: "Total",
      consumption: "",
      factor: "",
      emission: "2,413.24",
    },
  ];

  return (
    <DialogShell
      title="Bunker Simulator"
      icon={<DeploymentUnitOutlined />}
      width={1500}
      modal={false}
      actions={[{ label: "OK", primary: true }, { label: "Cancel" }]}
      footerLeft={<MiniRibbon showIndex />}
    >
      <div className="mb-3 grid grid-cols-[520px_minmax(0,1fr)] gap-4">
        <section className="border p-3" style={{ borderColor: VE_COLORS.border }}>
          <GroupTitle>Vessel Particular</GroupTitle>
          <Table
            size="small"
            bordered
            pagination={false}
            tableLayout="fixed"
            columns={["MV", "DWT", "Draft (M)", "TPC", "Built", "Type"].map((title) => ({
              title,
              dataIndex: title,
            }))}
            dataSource={[
              {
                key: "1",
                MV: "NETPAS",
                DWT: "74,222",
                "Draft (M)": "13.95",
                TPC: "66.20",
                Built: "2012",
                Type: "Bulker",
              },
            ]}
          />
        </section>
        <section>
          <Tabs
            size="small"
            defaultActiveKey="full"
            items={["Full", "Eco", "Custom1", "Custom2", "Custom3"].map((label) => ({
              key: label,
              label,
              children: null,
            }))}
          />
          <Table<FuelRow>
            size="small"
            bordered
            pagination={false}
            tableLayout="fixed"
            columns={mainFuelCols.slice(0, 6)}
            dataSource={[
              {
                key: "1",
                group: "Normal",
                type: "VLSFO",
                ballast: "32.00",
                laden: "32.00",
                idle: "3.50",
                work: "5.00",
              },
              {
                key: "2",
                group: "ECA",
                type: "ULSFO",
                ballast: "32.00",
                laden: "32.00",
                idle: "3.50",
                work: "5.00",
              },
            ]}
          />
        </section>
      </div>

      <Tabs
        size="small"
        defaultActiveKey="emission"
        items={[
          { key: "rob", label: "ROB & Supply / Bunker Price", children: null },
          { key: "simulation", label: "Bunker Simulation & Report", children: null },
          { key: "emission", label: "Emission", children: null },
          { key: "eu", label: "EU ETS & FuelEU", children: null },
        ]}
      />
      <div
        className="grid grid-cols-[500px_minmax(0,1fr)] gap-6 border p-3"
        style={{ borderColor: VE_COLORS.border }}
      >
        <section>
          <div className="mb-2 flex items-center gap-3">
            <GroupTitle>CO2 Emission</GroupTitle>
            <YCell value="2,413.24" />
          </div>
          <Table<EmissionRow>
            size="small"
            bordered
            pagination={false}
            tableLayout="fixed"
            columns={emissionCols}
            dataSource={rows}
          />
        </section>
        <section>
          <div className="mb-2 flex items-center gap-3">
            <GroupTitle>CII Rating</GroupTitle>
            <YCell value="E" />
          </div>
          <div className="mb-2 text-[11px] text-[#5a6e7f]">
            Estimated CII Rating of the year calculated based on current voyage only.
          </div>
          <Table
            size="small"
            bordered
            pagination={false}
            tableLayout="fixed"
            columns={[
              "Year",
              "Sailed Distance (NM)",
              "CO2 Emission (MT)",
              "Attained CII",
              "Ref. CII",
              "CII Rating",
            ].map((title) => ({ title, dataIndex: title }))}
            dataSource={[
              {
                key: "1",
                Year: "2025",
                "Sailed Distance (NM)": "3,548",
                "CO2 Emission (MT)": "2,413.24",
                "Attained CII": "9.17",
                "Ref. CII": "4.43",
                "CII Rating": "E",
              },
            ]}
          />
          <GroupTitle>Combination with Annual Data</GroupTitle>
          {["CII rating before this voyage", "CII rating of this voyage", "3.1 + 2"].map(
            (label, index) => (
              <Field key={label} label={label} labelWidth={220}>
                <YCell value={index === 0 ? "No data" : "E (2025)"} />
              </Field>
            ),
          )}
        </section>
      </div>
    </DialogShell>
  );
}

export default function MasterDataForm({ type }: { type: MasterFormType }) {
  if (type === "new-vessel") return <NewVesselFormAnt />;
  if (type === "address-book") return <AddressBookForm />;
  return <Co2EmissionForm />;
}
