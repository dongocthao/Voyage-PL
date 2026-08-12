import { useState } from "react";
import { Table, Select } from "antd";
import type { ColumnsType } from "antd/es/table";
import { SearchOutlined } from "@ant-design/icons";
import { TxtCell, YCell } from "./cells";
import { VE_COLORS } from "./theme";
import {
  vesselData,
  fuelMainData,
  fuelSubData,
  speedData,
  estimateInfo,
  type FuelMainRow,
  type FuelSubRow,
} from "./mockData";
import type { LookupItem } from "@/lib/api/masterData";

type PerformanceMode = "FULL" | "ECO" | "CUSTOM1" | "CUSTOM2" | "CUSTOM3";
type PerformanceModeDetail = NonNullable<LookupItem["modes"]>[number];

const mainCols: ColumnsType<FuelMainRow> = [
  { title: "Main", dataIndex: "main", width: "18%" },
  {
    title: "Type",
    dataIndex: "type",
    width: "18%",
    render: (v: string) => <TxtCell value={v} readOnly />,
  },
  {
    title: "Ballast",
    dataIndex: "ballast",
    width: "17%",
    render: (v: string) => <YCell value={v} readOnly />,
  },
  {
    title: "Laden",
    dataIndex: "laden",
    width: "17%",
    render: (v: string) => <YCell value={v} readOnly />,
  },
  {
    title: "Idle",
    dataIndex: "idle",
    width: "15%",
    render: (v: string) => <TxtCell value={v} right readOnly />,
  },
  {
    title: "Work",
    dataIndex: "work",
    width: "15%",
    render: (v: string) => <TxtCell value={v} right readOnly />,
  },
];

const subCols: ColumnsType<FuelSubRow> = [
  { title: "Sub", dataIndex: "sub", width: "20%" },
  {
    title: "Type",
    dataIndex: "type",
    width: "20%",
    render: (v: string) => <TxtCell value={v} readOnly />,
  },
  {
    title: "Sea",
    dataIndex: "sea",
    width: "20%",
    render: (v: string) => <TxtCell value={v} right readOnly />,
  },
  {
    title: "Idle",
    dataIndex: "idle",
    width: "20%",
    render: (v: string) => <TxtCell value={v} right readOnly />,
  },
  {
    title: "Work",
    dataIndex: "work",
    width: "20%",
    render: (v: string) => <TxtCell value={v} right readOnly />,
  },
];

const HD: React.CSSProperties = {
  background: VE_COLORS.headerBg,
  borderColor: VE_COLORS.border,
  color: VE_COLORS.headerText,
};

const EST_TYPE_OPTIONS = [
  ["OVOV", "Owned Vessel, Own Voyage"],
  ["OVTO", "Owned Vessel, TC Out"],
  ["RELT", "Cargo Relet"],
  ["SPOT", "Charter of Vessel for single Voyage"],
  ["TCOV", "TC In Vessel, Own Voyage"],
  ["TCTO", "TC In Vessel, TC Out"],
  ["VCOV", "VC In Vessel, Own Voyage"],
] as const;

function EstTypeSelect({
  value = "TCOV",
  onChange,
}: {
  value?: string;
  onChange?: (value: string) => void;
}) {
  const currentValue = EST_TYPE_OPTIONS.some(([code]) => code === value) ? value : "TCOV";
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <button
        type="button"
        className="flex h-[18px] w-full items-center justify-between border bg-white px-1 text-left text-[11px]"
        style={{ borderColor: "#cbd7e2" }}
        onClick={() => setOpen((current) => !current)}
      >
        <span>{currentValue}</span>
        <span className="text-[9px] text-[#52687a]">⌄</span>
      </button>
      {open && (
        <div
          className="absolute left-0 top-[20px] z-50 w-[320px] border bg-white py-1 shadow-lg"
          style={{ borderColor: "#cbd7e2" }}
        >
          {EST_TYPE_OPTIONS.map(([code, description]) => (
            <button
              key={code}
              type="button"
              className="grid w-full grid-cols-[56px_1fr] gap-2 px-2 py-[3px] text-left text-[11px] hover:bg-[#EAF6FB]"
              onClick={() => {
                onChange?.(code);
                setOpen(false);
              }}
            >
              <b>{code}</b>
              <span>{description}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export function EstimateInfoGrid({
  estimateId = estimateInfo.estimateId,
  estType = estimateInfo.type,
  voyageNo = estimateInfo.voyageNo,
  openPosition = estimateInfo.openPosition,
  operator = estimateInfo.operator,
  onVoyageNoChange,
  onEstTypeChange,
}: {
  estimateId?: string;
  estType?: string;
  voyageNo?: string;
  openPosition?: string;
  operator?: string;
  onVoyageNoChange?: (value: string) => void;
  onEstTypeChange?: (value: string) => void;
}) {
  return (
    <div
      className="mt-[2px] grid border"
      style={{
        borderColor: VE_COLORS.border,
        gridTemplateColumns: "68px 84px 0.75fr 1.125fr 1.125fr",
      }}
    >
      {["EstimateID", "Est Type", "Voyage No", "Open position", "Operator"].map((h) => (
        <div
          key={h}
          className="border-b border-r px-1 py-[3px] font-medium last:border-r-0"
          style={HD}
        >
          {h}
        </div>
      ))}
      <div className="border-r" style={{ borderColor: VE_COLORS.border }}>
        <TxtCell value={estimateId} readOnly />
      </div>
      <div
        className="border-r px-[2px] py-[1px]"
        style={{ borderColor: VE_COLORS.border, background: VE_COLORS.editable }}
      >
        <EstTypeSelect value={estType} onChange={onEstTypeChange} />
      </div>
      <div className="border-r" style={{ borderColor: VE_COLORS.border }}>
        <TxtCell value={voyageNo} onChange={onVoyageNoChange} />
      </div>
      <div className="border-r" style={{ borderColor: VE_COLORS.border }}>
        <TxtCell value={openPosition} />
      </div>
      <div>
        <TxtCell value={operator} />
      </div>
    </div>
  );
}

/** Khối trái: bảng thông số tàu + dòng EstimateID / Type / Voyage No / Open position / Operator */
type VesselSectionProps = {
  estimateId?: string;
  voyageNo?: string;
  openPosition?: string;
  estType?: string;
  vesselId?: string;
  bunkerProfileId?: string;
  performanceMode?: PerformanceMode;
  vessels?: LookupItem[];
  bunkerProfiles?: LookupItem[];
  ports?: LookupItem[];
  onVoyageNoChange?: (value: string) => void;
  onEstTypeChange?: (value: string) => void;
  onOpenPositionChange?: (value: string) => void;
  onVesselIdChange?: (value: string | undefined) => void;
  onBunkerProfileIdChange?: (value: string | undefined) => void;
  onPerformanceModeChange?: (value: PerformanceMode) => void;
};

function vesselLabel(item: LookupItem) {
  return item.name ?? item.code ?? String(item.id);
}

function bunkerProfileLabel(item: LookupItem) {
  const name = item.name ?? String(item.id);
  return item.vesselName ? `${name} - ${item.vesselName}` : name;
}

function portLabel(item: LookupItem) {
  if (item.name && item.country) return `${item.name} <${item.country}>`;
  return item.name ?? item.code ?? String(item.id);
}

function VesselBlock({
  estimateId,
  voyageNo,
  openPosition,
  estType = estimateInfo.type,
  vesselId,
  vessels = [],
  ports = [],
  onVoyageNoChange,
  onEstTypeChange,
  onOpenPositionChange,
  onVesselIdChange,
}: VesselSectionProps) {
  const v = vesselData[0]!;
  const selectedVessel = vessels.find((item) => String(item.id) === vesselId);
  const displayVessel = selectedVessel
    ? {
        mv: vesselLabel(selectedVessel),
        dwt: selectedVessel.dwt?.toLocaleString("en-US") ?? v.dwt,
        draft: selectedVessel.draftM?.toLocaleString("en-US") ?? v.draft,
        tpc: selectedVessel.tpc?.toLocaleString("en-US") ?? v.tpc,
        built: selectedVessel.builtYear ? String(selectedVessel.builtYear) : v.built,
        kind: selectedVessel.vesselKind ?? v.kind,
      }
    : v;
  return (
    <div className="text-[11px]">
      {/* Bảng MV ... Kind */}
      <div
        className="grid border"
        style={{
          borderColor: VE_COLORS.border,
          gridTemplateColumns: "1fr 90px 70px 140px",
        }}
      >
        {["MV", "DWT", "Built", "Kind"].map((h) => (
          <div
            key={h}
            className="border-b border-r px-1 py-[3px] font-medium last:border-r-0"
            style={HD}
          >
            {h}
          </div>
        ))}
        <div className="flex items-center border-r" style={{ borderColor: VE_COLORS.border }}>
          <Select
            showSearch
            allowClear
            size="small"
            variant="borderless"
            value={vesselId}
            onChange={(value) => onVesselIdChange?.(value ? String(value) : undefined)}
            options={vessels.map((item) => ({ value: String(item.id), label: vesselLabel(item) }))}
            placeholder={displayVessel.mv}
            style={{ width: "100%", fontSize: 11 }}
            filterOption={(input, option) =>
              String(option?.label ?? "")
                .toLowerCase()
                .includes(input.toLowerCase())
            }
          />
        </div>
        <div className="border-r" style={{ borderColor: VE_COLORS.border }}>
          <TxtCell value={displayVessel.dwt} right readOnly />
        </div>
        <div className="border-r" style={{ borderColor: VE_COLORS.border }}>
          <TxtCell value={displayVessel.built} right readOnly />
        </div>
        <div>
          <TxtCell value={displayVessel.kind} readOnly />
        </div>
      </div>

      {/* Dòng EstimateID / Type / Voyage No / Open position / Operator */}
      <div
        className="mt-[2px] grid border"
        style={{
          borderColor: VE_COLORS.border,
          gridTemplateColumns: "68px 84px 0.75fr 2.25fr",
        }}
      >
        {["EstimateID", "Est Type", "Voyage No", "Open position"].map((h) => (
          <div
            key={h}
            className="border-b border-r px-1 py-[3px] font-medium last:border-r-0"
            style={HD}
          >
            {h}
          </div>
        ))}
        <div className="border-r" style={{ borderColor: VE_COLORS.border }}>
          <TxtCell value={estimateId ?? estimateInfo.estimateId} readOnly />
        </div>
        <div className="border-r" style={{ borderColor: VE_COLORS.border }}>
          <div className="px-[2px] py-[1px]" style={{ background: VE_COLORS.editable }}>
            <EstTypeSelect value={estType} onChange={onEstTypeChange} />
          </div>
        </div>
        <div className="border-r" style={{ borderColor: VE_COLORS.border }}>
          <TxtCell value={voyageNo ?? estimateInfo.voyageNo} onChange={onVoyageNoChange} />
        </div>
        <div className="border-r" style={{ borderColor: VE_COLORS.border }}>
          <Select
            showSearch
            allowClear
            size="small"
            variant="borderless"
            value={openPosition || undefined}
            onSearch={onOpenPositionChange}
            onChange={(value) => onOpenPositionChange?.(value ?? "")}
            options={ports.map((item) => ({ value: portLabel(item), label: portLabel(item) }))}
            style={{ width: "100%", fontSize: 11 }}
            filterOption={(input, option) =>
              String(option?.label ?? "")
                .toLowerCase()
                .includes(input.toLowerCase())
            }
          />
        </div>
      </div>
    </div>
  );
}

/** Khối tốc độ: Speed [combobox] + Ballast / Laden */
function SpeedBlock({
  bunkerProfileId,
  performanceMode = "FULL",
  bunkerProfiles = [],
  onBunkerProfileIdChange,
  onPerformanceModeChange,
}: VesselSectionProps) {
  const selectedProfile = bunkerProfiles.find((item) => String(item.id) === bunkerProfileId);
  const selectedMode = selectedProfile?.modes?.find((mode) => mode.mode === performanceMode);
  const availableModes = selectedProfile?.modes?.length
    ? selectedProfile.modes.map((mode) => mode.mode)
    : PERFORMANCE_MODE_OPTIONS.map((option) => option.value);

  return (
    <div className="text-[11px]">
      <div className="grid grid-cols-[98px_1fr] border" style={{ borderColor: VE_COLORS.border }}>
        <div className="border-r px-1 py-[3px]" style={HD}>
          Bunker profile
        </div>
        <Select
          size="small"
          variant="borderless"
          value={bunkerProfileId}
          onChange={(value) => onBunkerProfileIdChange?.(value ? String(value) : undefined)}
          style={{ width: "100%", fontSize: 11 }}
          options={bunkerProfiles.map((item) => ({
            value: String(item.id),
            label: bunkerProfileLabel(item),
          }))}
        />
      </div>
      <div
        className="grid grid-cols-[98px_1fr] border border-t-0"
        style={{ borderColor: VE_COLORS.border }}
      >
        <div className="border-r px-1 py-[3px]" style={HD}>
          Speed
        </div>
        <Select
          size="small"
          value={performanceMode}
          popupMatchSelectWidth={false}
          variant="borderless"
          onChange={(value) => onPerformanceModeChange?.(value)}
          style={{ width: "100%", fontSize: 11 }}
          options={PERFORMANCE_MODE_OPTIONS.map((option) => ({
            ...option,
            disabled: !availableModes.includes(option.value),
          }))}
        />
      </div>
      <div className="grid grid-cols-2 border border-t-0" style={{ borderColor: VE_COLORS.border }}>
        <div className="border-b border-r px-2 py-[3px] text-center" style={HD}>
          Ballast
        </div>
        <div className="border-b px-2 py-[3px] text-center" style={HD}>
          Laden
        </div>
        <div className="border-r" style={{ borderColor: VE_COLORS.border }}>
          <YCell value={formatNumber(selectedMode?.speedBallastKn) ?? speedData.ballast} readOnly />
        </div>
        <div>
          <YCell value={formatNumber(selectedMode?.speedLadenKn) ?? speedData.laden} readOnly />
        </div>
      </div>
      <div className="mt-[2px] text-center text-[11px] text-gray-500">
        <SearchOutlined /> Fuel conditions
      </div>
    </div>
  );
}

export default function VesselSection(props: VesselSectionProps = {}) {
  const selectedProfile = props.bunkerProfiles?.find(
    (item) => String(item.id) === props.bunkerProfileId,
  );
  const selectedMode = selectedProfile?.modes?.find(
    (mode) => mode.mode === (props.performanceMode ?? "FULL"),
  );
  const fuelRows = buildFuelRows(selectedMode);

  return (
    <section className="mb-2 w-full">
      <div className="flex w-full flex-row flex-nowrap items-start gap-2">
        <div style={{ flex: "1 1 calc(44% - 20px)", minWidth: 0 }}>
          <VesselBlock {...props} />
        </div>
        <div style={{ flex: "0 0 188px", minWidth: 0 }}>
          <SpeedBlock {...props} />
        </div>
        <div style={{ flex: "1 1 27%", minWidth: 0 }}>
          <Table<FuelMainRow>
            size="small"
            bordered
            pagination={false}
            tableLayout="fixed"
            columns={mainCols}
            dataSource={fuelRows.main}
          />
        </div>
        <div style={{ flex: "1 1 22%", minWidth: 0 }}>
          <Table<FuelSubRow>
            size="small"
            bordered
            pagination={false}
            tableLayout="fixed"
            columns={subCols}
            dataSource={fuelRows.sub}
          />
        </div>
      </div>
    </section>
  );
}

const PERFORMANCE_MODE_OPTIONS: Array<{ value: PerformanceMode; label: string }> = [
  { value: "FULL", label: "Full" },
  { value: "ECO", label: "Eco" },
  { value: "CUSTOM1", label: "Custom 1" },
  { value: "CUSTOM2", label: "Custom 2" },
  { value: "CUSTOM3", label: "Custom 3" },
];

function buildFuelRows(mode: PerformanceModeDetail | undefined) {
  if (!mode) return { main: fuelMainData, sub: fuelSubData };

  const pick = (
    fuelRole: "MAIN" | "SUB",
    condition: "NORMAL" | "ECA",
    activity: "BALLAST" | "LADEN" | "IDLE" | "WORK" | "SEA",
  ) =>
    mode.consumption.find(
      (item) =>
        item.fuelRole === fuelRole && item.condition === condition && item.activity === activity,
    );
  const fuelCode = (fuelRole: "MAIN" | "SUB", condition: "NORMAL" | "ECA") =>
    mode.consumption.find((item) => item.fuelRole === fuelRole && item.condition === condition)
      ?.fuelCode ?? "";

  return {
    main: (["NORMAL", "ECA"] as const).map((condition) => ({
      key: condition,
      main: condition === "NORMAL" ? "Normal" : "ECA",
      type: fuelCode("MAIN", condition),
      ballast: formatNumber(pick("MAIN", condition, "BALLAST")?.consumptionMtDay) ?? "",
      laden: formatNumber(pick("MAIN", condition, "LADEN")?.consumptionMtDay) ?? "",
      idle: formatNumber(pick("MAIN", condition, "IDLE")?.consumptionMtDay) ?? "",
      work: formatNumber(pick("MAIN", condition, "WORK")?.consumptionMtDay) ?? "",
    })),
    sub: (["NORMAL", "ECA"] as const).map((condition) => ({
      key: condition,
      sub: condition === "NORMAL" ? "Normal" : "ECA",
      type: fuelCode("SUB", condition),
      sea: formatNumber(pick("SUB", condition, "SEA")?.consumptionMtDay) ?? "",
      idle: formatNumber(pick("SUB", condition, "IDLE")?.consumptionMtDay) ?? "",
      work: formatNumber(pick("SUB", condition, "WORK")?.consumptionMtDay) ?? "",
    })),
  };
}

function formatNumber(value: number | undefined) {
  return value === undefined
    ? undefined
    : value.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
