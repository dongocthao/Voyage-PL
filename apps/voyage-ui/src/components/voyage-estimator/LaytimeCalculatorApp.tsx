import { useMemo, useState } from "react";
import { Tabs, Radio, Select, Checkbox, Input } from "antd";
import { ClockCircleOutlined, EnvironmentOutlined, PlusCircleOutlined } from "@ant-design/icons";
import DialogShell, { GroupTitle, FieldRow } from "./DialogShell";
import { TxtCell, YCell } from "./cells";
import { VE_COLORS } from "./theme";
import { calculateLaytime, type LaytimeInput } from "@/lib/calculations/laytime";

const TERMS = [
  "SHEX EIU",
  "SHEX UU Half day",
  "SHEX UU Full day",
  "SHEX UU Other",
  "SHINC(FHINC)",
  "Other",
];

const initialInput: LaytimeInput = {
  interval: "days",
  cargoQuantity: 45000,
  cpRate: 7000,
  actualRate: 7000,
  demurrageRate: 20000,
  despatchRate: 10000,
  holidayConstant: false,
  holidaysDuringPortStay: 0,
  holidaysToBeWorked: 0,
  workingTimeNotCounted: 0.5,
  additionalPortIdleMargin: 0,
  applyDespatchMoney: true,
  applyPortWorkDay: true,
  applyPortIdleDay: false,
};

function parseAmount(value: string) {
  const parsed = Number(value.replace(/,/g, ""));
  return Number.isFinite(parsed) ? parsed : 0;
}

function formatAmount(value: number) {
  return value.toLocaleString("en-US", {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  });
}

function Estimator({
  input,
  onChange,
}: {
  input: LaytimeInput;
  onChange: (input: LaytimeInput) => void;
}) {
  const result = useMemo(() => calculateLaytime(input), [input]);
  const setNumber = (key: keyof LaytimeInput) => (value: string) =>
    onChange({ ...input, [key]: parseAmount(value) });
  const setValue = <Key extends keyof LaytimeInput>(key: Key, value: LaytimeInput[Key]) =>
    onChange({ ...input, [key]: value });

  return (
    <div className="grid grid-cols-1 gap-3 lg:grid-cols-[190px_1fr_1fr]">
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

      <div className="border p-2" style={{ borderColor: VE_COLORS.border }}>
        <GroupTitle>Charter Party Details</GroupTitle>
        <FieldRow label="Interval">
          <Radio.Group
            size="small"
            value={input.interval}
            onChange={(event) => setValue("interval", event.target.value)}
          >
            <Radio value="days">Days</Radio>
            <Radio value="hours">Hours</Radio>
          </Radio.Group>
        </FieldRow>
        <FieldRow label="Cargo Quantity" suffix="MT">
          <YCell value={formatAmount(input.cargoQuantity)} onChange={setNumber("cargoQuantity")} />
        </FieldRow>
        <FieldRow label="L/D Rate in CP" suffix={input.interval === "hours" ? "MT/H" : "MT/D"}>
          <TxtCell value={formatAmount(input.cpRate)} right onChange={setNumber("cpRate")} />
        </FieldRow>
        <FieldRow label="" suffix="Days">
          <TxtCell value={formatAmount(result.cpAllowedDays)} right readOnly />
        </FieldRow>
        <FieldRow label="Demurrage Rate" suffix="/D">
          <TxtCell value={formatAmount(input.demurrageRate)} right onChange={setNumber("demurrageRate")} />
        </FieldRow>
        <FieldRow label="Despatch Rate" suffix={<Checkbox checked>DHD</Checkbox>}>
          <TxtCell value={formatAmount(input.despatchRate)} right onChange={setNumber("despatchRate")} />
        </FieldRow>
        <FieldRow label="Terms">
          <Select
            size="small"
            defaultValue="SHEX EIU"
            style={{ width: "100%" }}
            options={TERMS.map((term) => ({ value: term, label: term }))}
          />
        </FieldRow>
        <div className="mt-2">
          <GroupTitle>Remark</GroupTitle>
          <Input.TextArea rows={6} />
        </div>
      </div>

      <div className="border p-2" style={{ borderColor: VE_COLORS.border }}>
        <GroupTitle>Laytime Estimator</GroupTitle>
        <RateLine
          label="L/D Rate in CP"
          rate={input.cpRate}
          days={result.cpAllowedDays}
          unit={input.interval === "hours" ? "MT/H" : "MT/D"}
          readOnly
        />
        <RateLine
          label="L/D Rate Actual"
          rate={input.actualRate}
          days={result.actualWorkDays}
          unit={input.interval === "hours" ? "MT/H" : "MT/D"}
          onChange={setNumber("actualRate")}
        />

        <div className="my-2 border-t" style={{ borderColor: VE_COLORS.border }} />

        <FieldRow
          label={
            <Checkbox
              checked={input.holidayConstant}
              onChange={(event) => setValue("holidayConstant", event.target.checked)}
            >
              Holiday Constant
            </Checkbox>
          }
        >
          <TxtCell value={formatAmount(result.holidayExcepted)} right readOnly />
        </FieldRow>
        <FieldRow label="Holidays during port stay">
          <TxtCell value={formatAmount(input.holidaysDuringPortStay)} right onChange={setNumber("holidaysDuringPortStay")} />
        </FieldRow>
        <FieldRow label="Holidays to be worked">
          <TxtCell value={formatAmount(input.holidaysToBeWorked)} right onChange={setNumber("holidaysToBeWorked")} />
        </FieldRow>
        <FieldRow label="Working time not counted, if any">
          <TxtCell value={formatAmount(input.workingTimeNotCounted)} right onChange={setNumber("workingTimeNotCounted")} />
        </FieldRow>
        <FieldRow label="Excepted time to be counted">
          <YCell value={formatAmount(result.exceptedTimeToBeCounted)} readOnly />
        </FieldRow>
        <FieldRow label="Additional port idle margin">
          <TxtCell value={formatAmount(input.additionalPortIdleMargin)} right onChange={setNumber("additionalPortIdleMargin")} />
        </FieldRow>

        <div className="my-2 border-t" style={{ borderColor: VE_COLORS.border }} />

        <FieldRow label={result.laytimeSaved >= 0 ? "Laytime Saved" : "Laytime Used Over"}>
          <YCell value={formatAmount(Math.abs(result.laytimeSaved))} readOnly />
        </FieldRow>
        <FieldRow
          label={
            <Checkbox
              checked={input.applyDespatchMoney}
              onChange={(event) => setValue("applyDespatchMoney", event.target.checked)}
            >
              Apply - Despatch Money
            </Checkbox>
          }
        >
          <YCell value={formatAmount(result.despatchMoney || result.demurrageMoney)} readOnly />
        </FieldRow>
        <FieldRow
          label={
            <Checkbox
              checked={input.applyPortWorkDay}
              onChange={(event) => setValue("applyPortWorkDay", event.target.checked)}
            >
              Apply - Port work day
            </Checkbox>
          }
        >
          <YCell value={formatAmount(result.portWorkDay)} readOnly />
        </FieldRow>
        <FieldRow
          label={
            <Checkbox
              checked={input.applyPortIdleDay}
              onChange={(event) => setValue("applyPortIdleDay", event.target.checked)}
            >
              Apply - Port idle day
            </Checkbox>
          }
        >
          <YCell value={formatAmount(result.portIdleDay)} readOnly />
        </FieldRow>
        <FieldRow label="Port stay total" bold>
          <YCell value={formatAmount(result.portStayTotal)} readOnly />
        </FieldRow>
      </div>
    </div>
  );
}

function RateLine({
  label,
  rate,
  days,
  unit,
  readOnly,
  onChange,
}: {
  label: string;
  rate: number;
  days: number;
  unit: string;
  readOnly?: boolean;
  onChange?: (value: string) => void;
}) {
  return (
    <div className="flex items-center gap-2 py-[2px]">
      <span style={{ width: 150 }}>{label}</span>
      <div className="flex-1">
        <TxtCell value={formatAmount(rate)} right readOnly={readOnly} onChange={onChange} />
      </div>
      <span className="w-[40px] text-gray-600">{unit}</span>
      <div className="w-[80px]">
        <TxtCell value={formatAmount(days)} right readOnly />
      </div>
      <span className="w-[40px] text-gray-600">Days</span>
    </div>
  );
}

export default function LaytimeCalculatorApp({ onClose }: { onClose?: () => void }) {
  const [savedEstimator, setSavedEstimator] = useState<LaytimeInput>(initialInput);
  const [savedCalculator, setSavedCalculator] = useState<LaytimeInput>({
    ...initialInput,
    actualRate: 6200,
    workingTimeNotCounted: 0,
  });
  const [estimatorInput, setEstimatorInput] = useState<LaytimeInput>(savedEstimator);
  const [calculatorInput, setCalculatorInput] = useState<LaytimeInput>(savedCalculator);
  const [activeTab, setActiveTab] = useState("estimator");
  const [message, setMessage] = useState("");

  const save = () => {
    setSavedEstimator(estimatorInput);
    setSavedCalculator(calculatorInput);
    setMessage("Laytime calculation saved.");
  };
  const cancel = () => {
    setEstimatorInput(savedEstimator);
    setCalculatorInput(savedCalculator);
    onClose?.();
  };
  const ok = () => {
    save();
    onClose?.();
  };

  return (
    <DialogShell
      title="Laytime - New York <U.S.A - New York> [-05:00]"
      icon={<ClockCircleOutlined />}
      width={1022}
      onClose={onClose}
      actions={[
        { label: "Save", onClick: save },
        { label: "OK", primary: true, onClick: ok },
        { label: "Cancel", onClick: cancel },
      ]}
    >
      {message && <div className="mb-2 text-xs text-[#285C7A]">{message}</div>}
      <Tabs
        size="small"
        activeKey={activeTab}
        onChange={setActiveTab}
        items={[
          {
            key: "estimator",
            label: "Estimator",
            children: <Estimator input={estimatorInput} onChange={setEstimatorInput} />,
          },
          {
            key: "calculator",
            label: "Calculator",
            children: <Estimator input={calculatorInput} onChange={setCalculatorInput} />,
          },
        ]}
      />
    </DialogShell>
  );
}
