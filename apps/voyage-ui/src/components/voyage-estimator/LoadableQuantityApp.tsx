import { Radio } from "antd";
import { CalculatorOutlined } from "@ant-design/icons";
import DialogShell, { GroupTitle, FieldRow } from "./DialogShell";
import { TxtCell, YCell } from "./cells";
import { VE_COLORS } from "./theme";

const MF = (
  <Radio.Group size="small" defaultValue="m">
    <Radio value="m">M</Radio>
    <Radio value="f">F</Radio>
  </Radio.Group>
);

export default function LoadableQuantityApp({ onClose }: { onClose?: () => void }) {
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
                <Radio.Group size="small" defaultValue="grain">
                  <Radio value="grain">Grain</Radio>
                  <Radio value="bale">Bale</Radio>
                </Radio.Group>
              }
              suffix={
                <Radio.Group size="small" defaultValue="cbm">
                  <Radio value="cbm">CBM</Radio>
                  <Radio value="cbf">CBF</Radio>
                </Radio.Group>
              }
            >
              <TxtCell value="0.00" right />
            </FieldRow>
            <FieldRow
              label="Stowage Factor"
              suffix={
                <Radio.Group size="small" defaultValue="cbm">
                  <Radio value="cbm">CBM</Radio>
                  <Radio value="cbf">CBF</Radio>
                </Radio.Group>
              }
            >
              <TxtCell value="0.00" right />
            </FieldRow>
            <FieldRow label="Loadable Quantity" bold suffix="MT">
              <YCell value="0.00" />
            </FieldRow>
          </div>

          <div className="mt-3">
            <Radio>
              <b>DWT Calculation</b>
            </Radio>
          </div>
          <div className="mt-1 pl-4">
            <FieldRow label="DWT" suffix="MT">
              <TxtCell value="57,124.00" right />
            </FieldRow>
            <div className="py-[2px]">Deducted</div>
            {[
              "Bunker ROB",
              "Unpumpable Ballast",
              "Fresh water",
              "SAG / HOG",
              "Constant",
              "Others",
            ].map((l) => (
              <FieldRow key={l} label={l} indent={1} suffix="MT">
                <TxtCell value="0.00" right />
              </FieldRow>
            ))}
            <FieldRow label="Total" indent={1} suffix="MT">
              <TxtCell value="0.00" right />
            </FieldRow>
            <FieldRow label="Loadable Quantity" bold suffix="MT">
              <TxtCell value="57,124.00" right />
            </FieldRow>
          </div>
        </div>

        {/* Right */}
        <div className="lg:border-l lg:pl-4" style={{ borderColor: VE_COLORS.border }}>
          <GroupTitle>Draft Consideration</GroupTitle>

          <div className="mb-1 font-bold">At Loading Port</div>
          <FieldRow label="Loadable Quantity" indent={1} suffix="MT">
            <TxtCell value="57,124.00" right />
          </FieldRow>
          <FieldRow label="Vessel Draft" indent={1} suffix={MF}>
            <TxtCell value="12.50" right />
          </FieldRow>
          <FieldRow label="Draft Restriction" indent={1} suffix={MF}>
            <TxtCell value="0.00" right />
          </FieldRow>
          <FieldRow
            label={
              <Radio.Group size="small" defaultValue="tpc" className="pl-3">
                <Radio value="tpc">TPC</Radio>
                <Radio value="tpi">TPI</Radio>
              </Radio.Group>
            }
          >
            <TxtCell value="0.00" right />
          </FieldRow>
          <FieldRow label="Loadable Deducted" indent={1} suffix="MT">
            <TxtCell value="0.00" right />
          </FieldRow>
          <FieldRow label="Loadable Quantity" indent={1} bold suffix="MT">
            <TxtCell value="57,124.00" right />
          </FieldRow>

          <div className="mb-1 mt-3 font-bold">At Discharging Port</div>
          <FieldRow label="Bunker Consumption" indent={1} suffix="MT / 1 day">
            <TxtCell value="0.00" right />
          </FieldRow>
          <FieldRow label="Fresh Water Consumption" indent={1} suffix="MT / 1 day">
            <TxtCell value="0.00" right />
          </FieldRow>
          <FieldRow label="Sea Days Total" indent={1} suffix="days">
            <TxtCell value="0.00" right />
          </FieldRow>
          <FieldRow label="Consumption Total" indent={1} suffix="MT">
            <TxtCell value="0.00" right />
          </FieldRow>
          <FieldRow label="Draft Restriction" indent={1} suffix={MF}>
            <TxtCell value="0.00" right />
          </FieldRow>
          <FieldRow
            label={
              <Radio.Group size="small" defaultValue="tpc" className="pl-3">
                <Radio value="tpc">TPC</Radio>
                <Radio value="tpi">TPI</Radio>
              </Radio.Group>
            }
          >
            <TxtCell value="0.00" right />
          </FieldRow>
          <FieldRow label="Loadable Deducted" indent={1} suffix="MT">
            <TxtCell value="0.00" right />
          </FieldRow>
          <FieldRow label="Loadable Quantity" indent={1} bold suffix="MT">
            <TxtCell value="57,124.00" right />
          </FieldRow>
        </div>
      </div>
    </DialogShell>
  );
}
