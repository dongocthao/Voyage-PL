import { Tabs, Radio, Select, Checkbox, Input } from "antd";
import { ClockCircleOutlined, EnvironmentOutlined, PlusCircleOutlined } from "@ant-design/icons";
import DialogShell, { GroupTitle, FieldRow } from "./DialogShell";
import { TxtCell, YCell } from "./cells";
import { VE_COLORS } from "./theme";

const TERMS = [
  "SHEX EIU",
  "SHEX UU Half day",
  "SHEX UU Full day",
  "SHEX UU Other",
  "SHINC(FHINC)",
  "Other",
];

function Estimator() {
  return (
    <div className="grid grid-cols-1 gap-3 lg:grid-cols-[190px_1fr_1fr]">
      {/* Ports tree */}
      <div className="border p-2" style={{ borderColor: VE_COLORS.border }}>
        <div className="flex items-center gap-1 py-[2px]">
          <EnvironmentOutlined style={{ color: VE_COLORS.titleBar }} />
          <span>New York &lt;U.S.A&gt;</span>
        </div>
        <div className="flex items-center gap-1 py-[2px]">
          <EnvironmentOutlined style={{ color: VE_COLORS.titleBar }} />
          <span>Izmir &lt;Turkey&gt;</span>
        </div>
        <div className="mt-2 flex items-center gap-1" style={{ color: VE_COLORS.sectionTitle }}>
          <PlusCircleOutlined /> New Reversible Group
        </div>
      </div>

      {/* Charter Party Details */}
      <div className="border p-2" style={{ borderColor: VE_COLORS.border }}>
        <GroupTitle>Charter Party Details</GroupTitle>
        <FieldRow label="Interval">
          <Radio.Group size="small" defaultValue="days">
            <Radio value="days">Days</Radio>
            <Radio value="hours">Hours</Radio>
          </Radio.Group>
        </FieldRow>
        <FieldRow label="Cargo Quantity" suffix="MT">
          <YCell value="45,000.0" />
        </FieldRow>
        <FieldRow label="L/D Rate in CP" suffix="MT/D">
          <TxtCell value="7,000.0" right />
        </FieldRow>
        <FieldRow label="" suffix="Days">
          <TxtCell value="6.4" right />
        </FieldRow>
        <FieldRow label="Demurrage Rate" suffix="/D">
          <TxtCell value="20,000.0" right />
        </FieldRow>
        <FieldRow label="Despatch Rate" suffix={<Checkbox defaultChecked>DHD</Checkbox>}>
          <TxtCell value="10,000.0" right />
        </FieldRow>
        <FieldRow label="Terms">
          <Select
            size="small"
            defaultValue="SHEX EIU"
            style={{ width: "100%" }}
            options={TERMS.map((t) => ({ value: t, label: t }))}
          />
        </FieldRow>
        <div className="mt-2">
          <GroupTitle>Remark</GroupTitle>
          <Input.TextArea rows={6} />
        </div>
      </div>

      {/* Laytime Estimator */}
      <div className="border p-2" style={{ borderColor: VE_COLORS.border }}>
        <GroupTitle>Laytime Estimator</GroupTitle>
        <div className="flex items-center gap-2 py-[2px]">
          <span style={{ width: 150 }}>L/D Rate in CP</span>
          <div className="flex-1">
            <TxtCell value="7,000.0" right />
          </div>
          <span className="w-[40px] text-gray-600">MT/D</span>
          <div className="w-[80px]">
            <TxtCell value="6.4" right />
          </div>
          <span className="w-[40px] text-gray-600">Days</span>
        </div>
        <div className="flex items-center gap-2 py-[2px]">
          <span style={{ width: 150 }}>L/D Rate Actual</span>
          <div className="flex-1">
            <TxtCell value="7,000.0" right />
          </div>
          <span className="w-[40px] text-gray-600">MT/D</span>
          <div className="w-[80px]">
            <TxtCell value="6.4" right />
          </div>
          <span className="w-[40px] text-gray-600">Days</span>
        </div>

        <div className="my-2 border-t" style={{ borderColor: VE_COLORS.border }} />

        <FieldRow label={<Checkbox>Holiday Constant</Checkbox>}>
          <TxtCell value="0.0" right />
        </FieldRow>
        <FieldRow label="Holidays during port stay">
          <TxtCell value="0.0" right />
        </FieldRow>
        <FieldRow label="Holidays to be worked">
          <TxtCell value="0.0" right />
        </FieldRow>
        <FieldRow label="Working time not counted, if any">
          <TxtCell value="0.5" right />
        </FieldRow>
        <FieldRow label="Excepted time to be counted">
          <YCell value="0.5" />
        </FieldRow>
        <FieldRow label="Additional port idle margin">
          <TxtCell value="0.0" right />
        </FieldRow>

        <div className="my-2 border-t" style={{ borderColor: VE_COLORS.border }} />

        <FieldRow label="Laytime Saved">
          <YCell value="0.5" />
        </FieldRow>
        <FieldRow label={<Checkbox defaultChecked>Apply — Despatch Money</Checkbox>}>
          <YCell value="5,000.0" />
        </FieldRow>
        <FieldRow label={<Checkbox defaultChecked>Apply — Port work day</Checkbox>}>
          <YCell value="6.4" />
        </FieldRow>
        <FieldRow label={<Checkbox>Apply — Port idle day</Checkbox>}>
          <YCell value="0.0" />
        </FieldRow>
        <FieldRow label="Port stay total" bold>
          <YCell value="6.4" />
        </FieldRow>
      </div>
    </div>
  );
}

export default function LaytimeCalculatorApp({ onClose }: { onClose?: () => void }) {
  return (
    <DialogShell
      title="Laytime — New York <U.S.A - New York> [-05:00]"
      icon={<ClockCircleOutlined />}
      width={1022}
      onClose={onClose}
      actions={[{ label: "Save" }, { label: "OK", primary: true }, { label: "Cancel" }]}
    >
      <Tabs
        size="small"
        defaultActiveKey="estimator"
        items={[
          { key: "estimator", label: "Estimator", children: <Estimator /> },
          { key: "calculator", label: "Calculator", children: <Estimator /> },
        ]}
      />
    </DialogShell>
  );
}
