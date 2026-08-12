import { useMemo, useState } from "react";
import { Radio } from "antd";
import { CalculatorOutlined } from "@ant-design/icons";
import DialogShell, { GroupTitle, FieldRow } from "./DialogShell";
import { TxtCell, YCell } from "./cells";
import { VE_COLORS } from "./theme";
import {
  calculateLoadableQuantity,
  type LoadableQuantityInput,
  type Unit,
} from "@/lib/calculations/loadableQuantity";

const MF = (
  <Radio.Group size="small" defaultValue="m">
    <Radio value="m">M</Radio>
    <Radio value="f">F</Radio>
  </Radio.Group>
);

const initialInput: LoadableQuantityInput = {
  capacityType: "grain",
  capacityUnit: "cbm",
  grainCapacity: 0,
  baleCapacity: 0,
  stowageFactor: 0,
  stowageFactorUnit: "cbm",
  dwt: 57124,
  bunkerRob: 0,
  unpumpableBallast: 0,
  freshWater: 0,
  sagHog: 0,
  constant: 0,
  others: 0,
  loadingVesselDraft: 12.5,
  loadingDraftRestriction: 0,
  loadingDraftUnit: "m",
  loadingTpc: 0,
  loadingTpcUnit: "tpc",
  dischargingBunkerConsumption: 0,
  dischargingFreshWaterConsumption: 0,
  seaDaysTotal: 0,
  dischargingDraftRestriction: 0,
  dischargingDraftUnit: "m",
  dischargingTpc: 0,
  dischargingTpcUnit: "tpc",
};

function parseAmount(value: string) {
  const parsed = Number(value.replace(/,/g, ""));
  return Number.isFinite(parsed) ? parsed : 0;
}

function formatAmount(value: number) {
  return value.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export default function LoadableQuantityApp({ onClose }: { onClose?: () => void }) {
  const [input, setInput] = useState<LoadableQuantityInput>(initialInput);
  const result = useMemo(() => calculateLoadableQuantity(input), [input]);
  const setNumber = (key: keyof LoadableQuantityInput) => (value: string) =>
    setInput((prev) => ({ ...prev, [key]: parseAmount(value) }));
  const setValue = <Key extends keyof LoadableQuantityInput>(
    key: Key,
    value: LoadableQuantityInput[Key],
  ) => setInput((prev) => ({ ...prev, [key]: value }));

  return (
    <DialogShell
      title="Loadable Quantity Calculator"
      icon={<CalculatorOutlined />}
      subtitle="Loadable quantity calculation either by Grain/Bale Capacity or by DWT. Please click the vessel icon to import the Vessel Specification."
      width={876}
      onClose={onClose}
      actions={[{ label: "OK", primary: true }, { label: "Cancel" }]}
    >
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* Left */}
        <div>
          <Radio checked>
            <b>Volume Calculation</b>
          </Radio>
          <div className="mt-1 pl-4">
            <FieldRow
              label={
                <Radio.Group size="small" value={input.capacityType} onChange={(event) => setValue("capacityType", event.target.value)}>
                  <Radio value="grain">Grain</Radio>
                  <Radio value="bale">Bale</Radio>
                </Radio.Group>
              }
              suffix={
                <Radio.Group size="small" value={input.capacityUnit} onChange={(event) => setValue("capacityUnit", event.target.value)}>
                  <Radio value="cbm">CBM</Radio>
                  <Radio value="cbf">CBF</Radio>
                </Radio.Group>
              }
            >
              <TxtCell
                value={formatAmount(input.capacityType === "grain" ? input.grainCapacity : input.baleCapacity)}
                right
                onChange={(value) =>
                  setInput((prev) => ({
                    ...prev,
                    [prev.capacityType === "grain" ? "grainCapacity" : "baleCapacity"]: parseAmount(value),
                  }))
                }
              />
            </FieldRow>
            <FieldRow
              label="Stowage Factor"
              suffix={
                <Radio.Group size="small" value={input.stowageFactorUnit} onChange={(event) => setValue("stowageFactorUnit", event.target.value)}>
                  <Radio value="cbm">CBM</Radio>
                  <Radio value="cbf">CBF</Radio>
                </Radio.Group>
              }
            >
              <TxtCell value={formatAmount(input.stowageFactor)} right onChange={setNumber("stowageFactor")} />
            </FieldRow>
            <FieldRow label="Loadable Quantity" bold suffix="MT">
              <YCell value={formatAmount(result.volumeLoadable)} readOnly />
            </FieldRow>
          </div>

          <div className="mt-3">
            <Radio>
              <b>DWT Calculation</b>
            </Radio>
          </div>
          <div className="mt-1 pl-4">
            <FieldRow label="DWT" suffix="MT">
              <TxtCell value={formatAmount(input.dwt)} right onChange={setNumber("dwt")} />
            </FieldRow>
            <div className="py-[2px]">Deducted</div>
            {[
              ["Bunker ROB", "bunkerRob"],
              ["Unpumpable Ballast", "unpumpableBallast"],
              ["Fresh water", "freshWater"],
              ["SAG / HOG", "sagHog"],
              ["Constant", "constant"],
              ["Others", "others"],
            ].map(([label, key]) => (
              <FieldRow key={label} label={label} indent={1} suffix="MT">
                <TxtCell value={formatAmount(input[key as keyof LoadableQuantityInput] as number)} right onChange={setNumber(key as keyof LoadableQuantityInput)} />
              </FieldRow>
            ))}
            <FieldRow label="Total" indent={1} suffix="MT">
              <TxtCell value={formatAmount(result.totalDeducted)} right readOnly />
            </FieldRow>
            <FieldRow label="Loadable Quantity" bold suffix="MT">
              <TxtCell value={formatAmount(result.dwtLoadable)} right readOnly />
            </FieldRow>
          </div>
        </div>

        {/* Right */}
        <div className="lg:border-l lg:pl-4" style={{ borderColor: VE_COLORS.border }}>
          <GroupTitle>Draft Consideration</GroupTitle>

          <div className="mb-1 font-bold">At Loading Port</div>
          <FieldRow label="Loadable Quantity" indent={1} suffix="MT">
            <TxtCell value={formatAmount(result.baseLoadable)} right readOnly />
          </FieldRow>
          <FieldRow label="Vessel Draft" indent={1} suffix={MF}>
            <TxtCell value={formatAmount(input.loadingVesselDraft)} right onChange={setNumber("loadingVesselDraft")} />
          </FieldRow>
          <FieldRow label="Draft Restriction" indent={1} suffix={<DraftUnit value={input.loadingDraftUnit} onChange={(value) => setValue("loadingDraftUnit", value)} />}>
            <TxtCell value={formatAmount(input.loadingDraftRestriction)} right onChange={setNumber("loadingDraftRestriction")} />
          </FieldRow>
          <FieldRow
            label={
              <Radio.Group size="small" value={input.loadingTpcUnit} className="pl-3" onChange={(event) => setValue("loadingTpcUnit", event.target.value)}>
                <Radio value="tpc">TPC</Radio>
                <Radio value="tpi">TPI</Radio>
              </Radio.Group>
            }
          >
            <TxtCell value={formatAmount(input.loadingTpc)} right onChange={setNumber("loadingTpc")} />
          </FieldRow>
          <FieldRow label="Loadable Deducted" indent={1} suffix="MT">
            <TxtCell value={formatAmount(result.loadingDraftLoss)} right readOnly />
          </FieldRow>
          <FieldRow label="Loadable Quantity" indent={1} bold suffix="MT">
            <TxtCell value={formatAmount(result.loadingLoadable)} right readOnly />
          </FieldRow>

          <div className="mb-1 mt-3 font-bold">At Discharging Port</div>
          <FieldRow label="Bunker Consumption" indent={1} suffix="MT / 1 day">
            <TxtCell value={formatAmount(input.dischargingBunkerConsumption)} right onChange={setNumber("dischargingBunkerConsumption")} />
          </FieldRow>
          <FieldRow label="Fresh Water Consumption" indent={1} suffix="MT / 1 day">
            <TxtCell value={formatAmount(input.dischargingFreshWaterConsumption)} right onChange={setNumber("dischargingFreshWaterConsumption")} />
          </FieldRow>
          <FieldRow label="Sea Days Total" indent={1} suffix="days">
            <TxtCell value={formatAmount(input.seaDaysTotal)} right onChange={setNumber("seaDaysTotal")} />
          </FieldRow>
          <FieldRow label="Consumption Total" indent={1} suffix="MT">
            <TxtCell value={formatAmount(result.consumptionTotal)} right readOnly />
          </FieldRow>
          <FieldRow label="Draft Restriction" indent={1} suffix={<DraftUnit value={input.dischargingDraftUnit} onChange={(value) => setValue("dischargingDraftUnit", value)} />}>
            <TxtCell value={formatAmount(input.dischargingDraftRestriction)} right onChange={setNumber("dischargingDraftRestriction")} />
          </FieldRow>
          <FieldRow
            label={
              <Radio.Group size="small" value={input.dischargingTpcUnit} className="pl-3" onChange={(event) => setValue("dischargingTpcUnit", event.target.value)}>
                <Radio value="tpc">TPC</Radio>
                <Radio value="tpi">TPI</Radio>
              </Radio.Group>
            }
          >
            <TxtCell value={formatAmount(input.dischargingTpc)} right onChange={setNumber("dischargingTpc")} />
          </FieldRow>
          <FieldRow label="Loadable Deducted" indent={1} suffix="MT">
            <TxtCell value={formatAmount(result.dischargingDraftLoss)} right readOnly />
          </FieldRow>
          <FieldRow label="Loadable Quantity" indent={1} bold suffix="MT">
            <TxtCell value={formatAmount(result.dischargingLoadable)} right readOnly />
          </FieldRow>
        </div>
      </div>
    </DialogShell>
  );
}

function DraftUnit({ value, onChange }: { value: Unit; onChange: (value: Unit) => void }) {
  return (
    <Radio.Group size="small" value={value} onChange={(event) => onChange(event.target.value)}>
      <Radio value="m">M</Radio>
      <Radio value="f">F</Radio>
    </Radio.Group>
  );
}
