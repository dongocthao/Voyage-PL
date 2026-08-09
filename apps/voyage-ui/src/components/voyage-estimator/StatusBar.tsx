import { Slider } from "antd";
import { VE_COLORS } from "./theme";

export default function StatusBar() {
  return (
    <div
      className="flex h-[24px] shrink-0 items-center gap-4 px-2 text-[11px] text-white"
      style={{ background: VE_COLORS.statusBar }}
    >
      <button className="underline">Reset</button>
      <div className="w-[140px]">
        <Slider
          defaultValue={100}
          min={50}
          max={150}
          tooltip={{ open: false }}
          style={{ margin: 0 }}
        />
      </div>
      <span>100 %</span>
      <span className="mx-auto">Great Circle Line</span>
      <span>Anti Piracy : JWLA024 (17th May 2019)</span>
      <span>ECA : IMO, Each Country</span>
    </div>
  );
}
