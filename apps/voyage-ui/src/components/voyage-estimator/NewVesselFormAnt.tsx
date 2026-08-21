import { useEffect, useMemo, useState, type ReactNode } from "react";
import { Button, Input, Select, Tabs, message } from "antd";
import {
  CopyOutlined,
  DeploymentUnitOutlined,
  DownloadOutlined,
  MinusCircleOutlined,
  PlusCircleOutlined,
} from "@ant-design/icons";
import {
  fetchFuelTypes,
  fetchLookup,
  fetchVesselKinds,
  fetchVesselTypes,
  type LookupItem,
} from "../../lib/api/masterData";
import {
  saveVessel,
  type FuelCondition,
  type FuelRole,
  type PerfMode,
  type VesselActivity,
  type VesselBunkerProfile,
  type VesselBunkerConsumption,
  type VesselGear,
  type VesselMaster,
  type VesselPerformanceMode,
} from "../../lib/api/vessels";
import DialogShell, { GroupTitle } from "./DialogShell";
import { RemoteLookupSelect } from "./RemoteLookupSelect";

const L = {
  windowTitle: "Vessel Particulars",
  mv: "Vessel name",
  vesselId: "vessel_id",
  vesselKind: "Vessel Kind",
  vesselType: "Vessel Type",
  draft: "Draft",
  built: "Built",
  iceClass: "ICE Class",
  wap: "WAP",
  estimatingValues: "Estimating Values",
  dwt: "DWT",
  grain: "Grain",
  bale: "Bale",
  operationExpense: "Operation Expense",
  dailyHire: "Daily Hire",
  ilohc: "ILOHC",
  cev: "CEV",
  per30days: "per 30 days",
  profileFull: "Full",
  profileEco: "Eco",
  profileC1: "Custom1",
  profileC2: "Custom2",
  profileC3: "Custom3",
  speed: "Speed",
  ballast: "Ballast",
  laden: "Laden",
  bunkerConsumption: "Bunker Consumption",
  copyNormalToEca: "Copy Normal to ECA",
  bunkerProfile: "Bunker profile",
  main: "Main",
  sub: "Sub",
  type: "Type",
  idle: "Idle",
  work: "Work",
  sea: "Sea",
  normal: "Normal",
  eca: "ECA",
  general: "General",
  owner: "Owner",
  ownership: "Ownership",
  callSign: "Call Sign",
  imoNo: "IMO No.",
  vesselCode: "Vessel Code",
  hullNo: "Hull No.",
  dwcc: "DWCC",
  loa: "LOA",
  flag: "Flag",
  grt: "GRT",
  beam: "Beam",
  class: "Class",
  nrt: "NRT",
  depth: "Depth",
  pni: "PNI",
  constant: "Constant",
  canal: "Canal",
  scnt: "SCNT",
  pcUmsNt: "PC/UMS NT",
  gearAndHaHo: "Gear & HA/HO",
  gearDesc: "Gear Desc.",
  add: "Add",
  delete: "Delete",
  hoHa: "HO/HA",
  hoHaType: "HO/HA Type",
  tankTopStrength: "Tank Top Strength (Upper/Tween)",
  hatchCoverStrength: "Hatch Cover Strength",
  export: "Export",
  ok: "OK",
  cancel: "Cancel",
  unitMTperSQM: "MT/SQM",
  unitMT: "MT",
  unitEA: "EA",
};

const O = {
  vesselType: ["Owned", "Bareboat", "Time Charter"],
  ownership: ["OWNED", "CHARTERED", "MANAGED"],
  draftUnit: ["M", "FT"],
  lengthUnit: ["M", "FT"],
  iceClass: ["None", "1A", "1B", "1C"],
  wap: ["None", "Yes"],
  grainUnit: ["CBM", "CFT"],
  tpc: ["TPC", "TPI"],
  gearDesc: ["Crane", "Derrick", "Grab"],
  gearPosition: ["Midship", "Fore", "Aft"],
  deckType: ["Single Deck", "Tween Deck"],
  coverType: ["Mc Greegor", "Folding", "Pontoon"],
};

const PROFILE_TABS: Array<[PerfMode, string]> = [
  ["FULL", L.profileFull],
  ["ECO", L.profileEco],
  ["CUSTOM1", L.profileC1],
  ["CUSTOM2", L.profileC2],
  ["CUSTOM3", L.profileC3],
];

const PROFILE_NAME: Record<PerfMode, string> = {
  FULL: "Full",
  ECO: "Eco",
  CUSTOM1: "Custom1",
  CUSTOM2: "Custom2",
  CUSTOM3: "Custom3",
};

const DEFAULT_FUEL_IDS = { VLSFO: 1, ULSFO: 2, MGO: 4 };
const today = () => new Date().toISOString().slice(0, 10);
const optionItems = (values: readonly string[]) => values.map((value) => ({ value, label: value }));
const lookupOptions = (items: LookupItem[]) =>
  items.map((item) => ({
    value: String(item.id),
    label: item.code ? `${item.name ?? item.code} (${item.code})` : (item.name ?? String(item.id)),
  }));
const fuelLookupOptions = (items: LookupItem[]) =>
  items.map((item) => ({
    value: String(item.id),
    label: item.name ?? item.code ?? String(item.id),
  }));
const inputStyle: React.CSSProperties = { height: 24, fontSize: 11, borderRadius: 2 };
const selectStyle: React.CSSProperties = { width: "100%", fontSize: 11 };

function emptyMode(mode: PerfMode, fuelIds = DEFAULT_FUEL_IDS, factor = 1): VesselPerformanceMode {
  return {
    mode,
    speedBallastKn: round2(12 * factor),
    speedLadenKn: round2(11 * factor),
    consumption: [
      row("MAIN", "NORMAL", "BALLAST", fuelIds.VLSFO, 18 * factor),
      row("MAIN", "NORMAL", "LADEN", fuelIds.VLSFO, 22 * factor),
      row("MAIN", "NORMAL", "IDLE", fuelIds.VLSFO, 1.2 * factor),
      row("MAIN", "NORMAL", "WORK", fuelIds.VLSFO, 2 * factor),
      row("MAIN", "ECA", "BALLAST", fuelIds.ULSFO, 18 * factor),
      row("MAIN", "ECA", "LADEN", fuelIds.ULSFO, 22 * factor),
      row("MAIN", "ECA", "IDLE", fuelIds.ULSFO, 1.2 * factor),
      row("MAIN", "ECA", "WORK", fuelIds.ULSFO, 2 * factor),
      row("SUB", "NORMAL", "SEA", fuelIds.MGO, 1.8 * factor),
      row("SUB", "NORMAL", "IDLE", fuelIds.MGO, 1.2 * factor),
      row("SUB", "NORMAL", "WORK", fuelIds.MGO, 2.2 * factor),
      row("SUB", "ECA", "SEA", fuelIds.MGO, 1.8 * factor),
      row("SUB", "ECA", "IDLE", fuelIds.MGO, 1.2 * factor),
      row("SUB", "ECA", "WORK", fuelIds.MGO, 2.2 * factor),
    ],
  };
}

function row(
  fuelRole: FuelRole,
  condition: FuelCondition,
  activity: VesselActivity,
  fuelTypeId: number,
  consumptionMtDay = 0,
): VesselBunkerConsumption {
  return { fuelRole, condition, activity, fuelTypeId, consumptionMtDay: round2(consumptionMtDay) };
}

function round2(value: number) {
  return Math.round(value * 100) / 100;
}

function emptyProfile(
  profileName: string,
  fuelIds = DEFAULT_FUEL_IDS,
  factor = 1,
): VesselBunkerProfile {
  return {
    profileName,
    effectiveFrom: today(),
    isActive: true,
    modes: PROFILE_TABS.map(([mode], index) => emptyMode(mode, fuelIds, factor - index * 0.03)),
  };
}

function emptyVessel(fuelIds = DEFAULT_FUEL_IDS): VesselMaster {
  return {
    vesselId: "",
    mvName: "",
    ownership: "OWNED",
    isActive: true,
    gears: [],
    bunkerProfiles: [
      emptyProfile("Q1/2026 Standard", fuelIds, 1),
      emptyProfile("Q2/2026 Eco", fuelIds, 0.86),
      emptyProfile("Q3/2026 Heavy", fuelIds, 1.12),
    ],
  };
}

function ensureVesselShape(vessel: VesselMaster, fuelIds = DEFAULT_FUEL_IDS): VesselMaster {
  const profiles = vessel.bunkerProfiles.length
    ? vessel.bunkerProfiles
    : [emptyProfile("Standard", fuelIds, 1)];

  return {
    ...vessel,
    ownership: vessel.ownership ?? "OWNED",
    gears: vessel.gears ?? [],
    bunkerProfiles: profiles.map((profile) => {
      const fallback = emptyProfile(profile.profileName || "Standard", fuelIds, 1);
      const modes = PROFILE_TABS.map(([mode]) => {
        const existing = profile.modes.find((item) => item.mode === mode);
        const fallbackMode =
          fallback.modes.find((item) => item.mode === mode) ?? emptyMode(mode, fuelIds);
        return existing ? ensureModeShape(existing, fallbackMode) : fallbackMode;
      });

      return {
        ...profile,
        profileName: profile.profileName || "Standard",
        effectiveFrom: profile.effectiveFrom || today(),
        isActive: profile.isActive ?? true,
        modes,
      };
    }),
  };
}

function ensureModeShape(
  mode: VesselPerformanceMode,
  fallback: VesselPerformanceMode,
): VesselPerformanceMode {
  return {
    ...mode,
    speedBallastKn: mode.speedBallastKn ?? fallback.speedBallastKn,
    speedLadenKn: mode.speedLadenKn ?? fallback.speedLadenKn,
    consumption: fallback.consumption.map((fallbackItem) => {
      const existing = mode.consumption.find(
        (item) =>
          item.fuelRole === fallbackItem.fuelRole &&
          item.condition === fallbackItem.condition &&
          item.activity === fallbackItem.activity,
      );
      return existing ?? fallbackItem;
    }),
  };
}

function Field({
  label,
  children,
  labelWidth = 112,
  className,
}: {
  label: string;
  children: ReactNode;
  labelWidth?: number;
  className?: string;
}) {
  return (
    <div
      className={`grid items-center gap-2 py-[3px] ${className ?? ""}`}
      style={{ gridTemplateColumns: `${labelWidth}px minmax(0,1fr)` }}
    >
      <span className="text-[11px] text-[#334E63]">{label}</span>
      <div className="flex min-w-0 items-center gap-1">{children}</div>
    </div>
  );
}

function TInput({
  align = "left",
  ...props
}: React.ComponentProps<typeof Input> & { align?: "left" | "right" }) {
  return (
    <Input size="small" style={{ ...inputStyle, textAlign: align, ...props.style }} {...props} />
  );
}

function TSelect({
  values,
  ...props
}: { values: readonly string[] } & React.ComponentProps<typeof Select>) {
  return (
    <Select
      size="small"
      options={optionItems(values)}
      style={{ ...selectStyle, ...props.style }}
      {...props}
    />
  );
}

function Th({ children, className = "" }: { children?: ReactNode; className?: string }) {
  return (
    <div
      className={`border-b border-r border-[#CBD7E2] bg-[#EAF3FF] px-2 py-[3px] text-[11px] font-medium text-[#214F68] last:border-r-0 ${className}`}
    >
      {children}
    </div>
  );
}

function Td({
  children,
  className = "",
  numeric,
}: {
  children?: ReactNode;
  className?: string;
  numeric?: boolean;
}) {
  return (
    <div
      className={`flex items-center border-b border-r border-[#CBD7E2] px-2 py-[2px] text-[11px] last:border-r-0 ${numeric ? "justify-end" : ""} ${className}`}
    >
      {children}
    </div>
  );
}

function NumCell({ value, onChange }: { value: number; onChange: (value: number) => void }) {
  return (
    <Input
      size="small"
      value={String(value)}
      onChange={(event) => onChange(toNumber(event.target.value))}
      bordered={false}
      style={{ height: 20, padding: "0 2px", textAlign: "right", fontSize: 11 }}
    />
  );
}

function toNumber(value: string) {
  const number = Number(value);
  return Number.isFinite(number) ? number : 0;
}

function validateVessel(vessel: VesselMaster) {
  if (!vessel.mvName.trim()) return "Vessel name is required.";

  const numericFields: Array<[keyof VesselMaster, string]> = [
    ["builtYear", L.built],
    ["dwt", L.dwt],
    ["dwcc", L.dwcc],
    ["draftM", L.draft],
    ["loaM", L.loa],
    ["beamM", L.beam],
    ["depthM", L.depth],
    ["grt", L.grt],
    ["nrt", L.nrt],
    ["scnt", L.scnt],
    ["pcUmsNt", L.pcUmsNt],
    ["tpc", "TPC"],
    ["grainCbm", L.grain],
    ["baleCbm", L.bale],
    ["constantMt", L.constant],
    ["tankTopStrengthUpper", "Tank top upper"],
    ["tankTopStrengthTween", "Tank top tween"],
    ["hatchCoverStrength", L.hatchCoverStrength],
  ];

  for (const [field, label] of numericFields) {
    const value = vessel[field];
    if (typeof value === "number" && value < 0) return `${label} must be zero or greater.`;
  }

  for (const gear of vessel.gears) {
    if ((gear.capacityMt ?? 0) < 0) return "Gear capacity must be zero or greater.";
    if ((gear.qtyEa ?? 0) < 0) return "Gear quantity must be zero or greater.";
  }

  if (!vessel.bunkerProfiles.length) return "At least one bunker profile is required.";
  for (const bunkerProfile of vessel.bunkerProfiles) {
    if (!bunkerProfile.profileName.trim()) return "Bunker profile name is required.";
    if (!bunkerProfile.effectiveFrom) return "Bunker profile effective date is required.";
    for (const mode of bunkerProfile.modes) {
      if (mode.speedBallastKn < 0 || mode.speedLadenKn < 0) {
        return `${PROFILE_NAME[mode.mode]} speed must be zero or greater.`;
      }
      for (const item of mode.consumption) {
        if (item.consumptionMtDay < 0) {
          return `${PROFILE_NAME[mode.mode]} consumption must be zero or greater.`;
        }
      }
    }
  }

  return undefined;
}

export default function NewVesselFormAnt({ onClose }: { onClose?: () => void } = {}) {
  const [profile, setProfile] = useState<PerfMode>("FULL");
  const [activeProfileIndex, setActiveProfileIndex] = useState(0);
  const [fuelIds, setFuelIds] = useState(DEFAULT_FUEL_IDS);
  const [fuelTypes, setFuelTypes] = useState<LookupItem[]>([]);
  const [form, setForm] = useState<VesselMaster>(() => emptyVessel());
  const [vesselKinds, setVesselKinds] = useState<LookupItem[]>([]);
  const [vesselTypes, setVesselTypes] = useState<LookupItem[]>([]);
  const [companies, setCompanies] = useState<LookupItem[]>([]);
  const [operationExpense, setOperationExpense] = useState({
    dailyHire: 0,
    ilohc: 0,
    cev: 0,
    pni: "",
  });
  const [gearDraft, setGearDraft] = useState<VesselGear>({
    gearType: "Crane",
    position: "Midship",
    capacityMt: 0,
    qtyEa: 0,
  });
  const [selectedGearIndex, setSelectedGearIndex] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [closed, setClosed] = useState(false);
  const [messageApi, contextHolder] = message.useMessage();

  useEffect(() => {
    void Promise.all([
      fetchFuelTypes(),
      fetchVesselKinds(),
      fetchLookup("companies"),
    ])
      .then(([fuelTypes, kinds, companyRows]) => {
        setVesselKinds(kinds);
        setVesselTypes([]);
        setCompanies(companyRows);
        setFuelTypes(fuelTypes);

        const items = fuelTypes;
        const byCode = new Map(items.map((item) => [item.code, Number(item.id)]));
        const next = {
          VLSFO: byCode.get("VLSFO") ?? DEFAULT_FUEL_IDS.VLSFO,
          ULSFO: byCode.get("ULSFO") ?? DEFAULT_FUEL_IDS.ULSFO,
          MGO: byCode.get("MGO") ?? DEFAULT_FUEL_IDS.MGO,
        };
        setFuelIds(next);
        setForm(emptyVessel(next));
        setActiveProfileIndex(0);
      })
      .catch(() => messageApi.warning("Master-data lookup failed; using defaults where possible."));
  }, [messageApi]);

  useEffect(() => {
    if (!form.vesselKindId) {
      setVesselTypes([]);
      setForm((current) => ({
        ...current,
        vesselTypeId: null,
      }));
      return;
    }

    void fetchVesselTypes(form.vesselKindId)
      .then((types) => {
        setVesselTypes(types);
        setForm((current) => {
          if (!current.vesselTypeId) return current;
          const exists = types.some((item) => Number(item.id) === current.vesselTypeId);
          return exists ? current : { ...current, vesselTypeId: null };
        });
      })
      .catch(() => {
        setVesselTypes([]);
        messageApi.warning("Vessel type lookup failed.");
      });
  }, [form.vesselKindId, messageApi]);

  const activeBunkerProfile = form.bunkerProfiles[activeProfileIndex] ?? form.bunkerProfiles[0];
  const activeMode = useMemo(
    () =>
      activeBunkerProfile?.modes.find((mode) => mode.mode === profile) ??
      emptyMode(profile, fuelIds),
    [activeBunkerProfile?.modes, fuelIds, profile],
  );

  function setField<K extends keyof VesselMaster>(key: K, value: VesselMaster[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function setFuelType(fuelRole: FuelRole, condition: FuelCondition, fuelTypeId: number) {
    updateActiveMode((mode) => ({
      ...mode,
      consumption: mode.consumption.map((item) =>
        item.fuelRole === fuelRole && item.condition === condition ? { ...item, fuelTypeId } : item,
      ),
    }));
  }

  function getFuelType(fuelRole: FuelRole, condition: FuelCondition) {
    return (
      activeMode.consumption.find(
        (item) => item.fuelRole === fuelRole && item.condition === condition,
      )?.fuelTypeId ?? null
    );
  }

  function setNumberField(key: keyof VesselMaster, value: string) {
    setForm((current) => ({ ...current, [key]: toNumber(value) }));
  }

  function resetForm() {
    setForm(emptyVessel(fuelIds));
    setOperationExpense({ dailyHire: 0, ilohc: 0, cev: 0, pni: "" });
    setProfile("FULL");
    setActiveProfileIndex(0);
    setGearDraft({ gearType: "Crane", position: "Midship", capacityMt: 0, qtyEa: 0 });
    setSelectedGearIndex(null);
  }

  function updateActiveMode(updater: (mode: VesselPerformanceMode) => VesselPerformanceMode) {
    setForm((current) => ({
      ...current,
      bunkerProfiles: current.bunkerProfiles.map((profileItem, index) =>
        index === activeProfileIndex
          ? {
              ...profileItem,
              modes: profileItem.modes.map((mode) =>
                mode.mode === profile ? updater(mode) : mode,
              ),
            }
          : profileItem,
      ),
    }));
  }

  function setConsumption(
    fuelRole: FuelRole,
    condition: FuelCondition,
    activity: VesselActivity,
    value: number,
  ) {
    updateActiveMode((mode) => ({
      ...mode,
      consumption: mode.consumption.map((item) =>
        item.fuelRole === fuelRole && item.condition === condition && item.activity === activity
          ? { ...item, consumptionMtDay: value }
          : item,
      ),
    }));
  }

  function getConsumption(fuelRole: FuelRole, condition: FuelCondition, activity: VesselActivity) {
    return (
      activeMode.consumption.find(
        (item) =>
          item.fuelRole === fuelRole && item.condition === condition && item.activity === activity,
      )?.consumptionMtDay ?? 0
    );
  }

  function copyNormalToEca(fuelRole: FuelRole) {
    updateActiveMode((mode) => ({
      ...mode,
      consumption: mode.consumption.map((item) => {
        if (item.fuelRole !== fuelRole || item.condition !== "ECA") return item;

        const normal = mode.consumption.find(
          (source) =>
            source.fuelRole === item.fuelRole &&
            source.condition === "NORMAL" &&
            source.activity === item.activity,
        );
        return normal ? { ...item, consumptionMtDay: normal.consumptionMtDay } : item;
      }),
    }));
  }

  async function handleSave() {
    const validationError = validateVessel(form);
    if (validationError) {
      messageApi.error(validationError);
      return;
    }

    setSaving(true);
    try {
      const saved = await saveVessel(form);
      setForm(ensureVesselShape(saved, fuelIds));
      setActiveProfileIndex(0);
      messageApi.success("Vessel saved.");
    } catch (error) {
      messageApi.error(error instanceof Error ? error.message : "Failed to save vessel.");
    } finally {
      setSaving(false);
    }
  }

  function handleCancel() {
    resetForm();
  }

  function handleClose() {
    if (onClose) {
      onClose();
      return;
    }
    setClosed(true);
  }

  function addGear() {
    if (!gearDraft.gearType.trim()) return;

    setForm((current) => ({
      ...current,
      gears: [...current.gears, { ...gearDraft }],
    }));
    setSelectedGearIndex(form.gears.length);
  }

  function removeSelectedGear() {
    setForm((current) => {
      if (selectedGearIndex === null) return current;
      return {
        ...current,
        gears: current.gears.filter((_, index) => index !== selectedGearIndex),
      };
    });
    setSelectedGearIndex(null);
  }

  function updateActiveProfile(updater: (profile: VesselBunkerProfile) => VesselBunkerProfile) {
    setForm((current) => ({
      ...current,
      bunkerProfiles: current.bunkerProfiles.map((profileItem, index) =>
        index === activeProfileIndex ? updater(profileItem) : profileItem,
      ),
    }));
  }

  function addBunkerProfile() {
    setForm((current) => {
      const nextProfile = emptyProfile(`Profile ${current.bunkerProfiles.length + 1}`, fuelIds, 1);
      setActiveProfileIndex(current.bunkerProfiles.length);
      setProfile("FULL");
      return { ...current, bunkerProfiles: [...current.bunkerProfiles, nextProfile] };
    });
  }

  function deleteActiveBunkerProfile() {
    setForm((current) => {
      if (current.bunkerProfiles.length <= 1) return current;
      const nextProfiles = current.bunkerProfiles.filter(
        (_, index) => index !== activeProfileIndex,
      );
      setActiveProfileIndex(Math.max(0, activeProfileIndex - 1));
      setProfile("FULL");
      return { ...current, bunkerProfiles: nextProfiles };
    });
  }

  if (closed) return null;

  return (
    <DialogShell
      title={L.windowTitle}
      icon={<DeploymentUnitOutlined />}
      width={1180}
      modal={false}
      actions={[
        { label: L.ok, primary: true, onClick: handleSave, loading: saving },
        { label: L.cancel, onClick: handleCancel },
      ]}
      onClose={handleClose}
      footerLeft={
        <Button size="small" icon={<DownloadOutlined />}>
          {L.export}
        </Button>
      }
    >
      {contextHolder}
      <div className="grid grid-cols-1 gap-x-8 gap-y-4 lg:grid-cols-2">
        <div className="space-y-4">
          <div>
            <div className="grid grid-cols-2 gap-x-6">
              <Field label={L.mv} labelWidth={72}>
                <TInput
                  value={form.mvName}
                  onChange={(event) => setField("mvName", event.target.value)}
                />
              </Field>
              <Field label={L.vesselId} labelWidth={96}>
                <TInput value={form.vesselId ?? form.id ?? ""} readOnly align="right" />
              </Field>
              <Field label={L.vesselKind} labelWidth={72}>
                <Select
                  allowClear
                  showSearch
                  size="small"
                  value={form.vesselKindId ? String(form.vesselKindId) : undefined}
                  onChange={(value) =>
                    setForm((current) => ({
                      ...current,
                      vesselKindId: value ? Number(value) : null,
                      vesselTypeId: null,
                    }))
                  }
                  options={lookupOptions(vesselKinds)}
                  style={selectStyle}
                />
              </Field>
              <Field label={L.vesselType} labelWidth={96}>
                <Select
                  allowClear
                  showSearch
                  size="small"
                  disabled={!form.vesselKindId}
                  value={form.vesselTypeId ? String(form.vesselTypeId) : undefined}
                  onChange={(value) => setField("vesselTypeId", value ? Number(value) : null)}
                  options={lookupOptions(vesselTypes)}
                  style={selectStyle}
                />
              </Field>
              <Field label={L.draft} labelWidth={72}>
                <TInput
                  value={String(form.draftM ?? 0)}
                  onChange={(event) => setNumberField("draftM", event.target.value)}
                  align="right"
                />
                <TSelect values={O.draftUnit} defaultValue="M" style={{ width: 72 }} />
              </Field>
              <Field label={L.built} labelWidth={96}>
                <TInput
                  value={String(form.builtYear ?? 0)}
                  onChange={(event) => setNumberField("builtYear", event.target.value)}
                  align="right"
                />
              </Field>
              <Field label={L.iceClass} labelWidth={72}>
                <TSelect
                  values={O.iceClass}
                  value={form.iceClass ?? "None"}
                  onChange={(value) => setField("iceClass", String(value))}
                />
              </Field>
              <Field label={L.wap} labelWidth={96}>
                <TSelect
                  values={O.wap}
                  value={form.wap ?? "None"}
                  onChange={(value) => setField("wap", String(value))}
                />
              </Field>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6">
            <section>
              <GroupTitle>{L.estimatingValues}</GroupTitle>
              <Field label={L.dwt} labelWidth={72}>
                <TInput
                  value={String(form.dwt ?? 0)}
                  onChange={(event) => setNumberField("dwt", event.target.value)}
                  align="right"
                />
              </Field>
              <Field label={L.grain} labelWidth={72}>
                <TInput
                  value={String(form.grainCbm ?? 0)}
                  onChange={(event) => setNumberField("grainCbm", event.target.value)}
                  align="right"
                />
                <TSelect values={O.grainUnit} defaultValue="CBM" style={{ width: 78 }} />
              </Field>
              <Field label={L.bale} labelWidth={72}>
                <TInput
                  value={String(form.baleCbm ?? 0)}
                  onChange={(event) => setNumberField("baleCbm", event.target.value)}
                  align="right"
                />
                <TSelect values={O.grainUnit} defaultValue="CBM" style={{ width: 78 }} />
              </Field>
              <Field label="" labelWidth={72}>
                <TSelect values={O.tpc} defaultValue="TPC" style={{ width: 78 }} />
                <TInput
                  value={String(form.tpc ?? 0)}
                  onChange={(event) => setNumberField("tpc", event.target.value)}
                  align="right"
                />
              </Field>
            </section>

            <section>
              <GroupTitle>{L.operationExpense}</GroupTitle>
              <Field label={L.dailyHire} labelWidth={84}>
                <TInput
                  value={String(operationExpense.dailyHire)}
                  onChange={(event) =>
                    setOperationExpense((current) => ({
                      ...current,
                      dailyHire: toNumber(event.target.value),
                    }))
                  }
                  align="right"
                />
              </Field>
              <Field label={L.ilohc} labelWidth={84}>
                <TInput
                  value={String(operationExpense.ilohc)}
                  onChange={(event) =>
                    setOperationExpense((current) => ({
                      ...current,
                      ilohc: toNumber(event.target.value),
                    }))
                  }
                  align="right"
                />
                <span className="invisible whitespace-nowrap text-[11px]">{L.per30days}</span>
              </Field>
              <Field label={L.cev} labelWidth={84}>
                <TInput
                  value={String(operationExpense.cev)}
                  onChange={(event) =>
                    setOperationExpense((current) => ({
                      ...current,
                      cev: toNumber(event.target.value),
                    }))
                  }
                  align="right"
                />
                <span className="whitespace-nowrap text-[11px] text-[#5A6E7F]">{L.per30days}</span>
              </Field>
            </section>
          </div>

          <Tabs
            activeKey={profile}
            onChange={(key) => setProfile(key as PerfMode)}
            size="small"
            items={PROFILE_TABS.map(([key, label]) => ({
              key,
              label,
              children: (
                <ProfileTabContent
                  mode={activeMode}
                  bunkerProfiles={form.bunkerProfiles}
                  activeProfileIndex={activeProfileIndex}
                  onProfileChange={setActiveProfileIndex}
                  onUpdateProfile={updateActiveProfile}
                  onAddProfile={addBunkerProfile}
                  onDeleteProfile={deleteActiveBunkerProfile}
                  getConsumption={getConsumption}
                  setConsumption={setConsumption}
                  setSpeed={(field, value) =>
                    updateActiveMode((mode) => ({
                      ...mode,
                      [field]: value,
                    }))
                  }
                  copyNormalToEca={copyNormalToEca}
                  fuelTypeOptions={fuelLookupOptions(fuelTypes)}
                  getFuelType={getFuelType}
                  setFuelType={setFuelType}
                />
              ),
            }))}
          />
        </div>

        <div className="space-y-4">
          <section>
            <GroupTitle>{L.general}</GroupTitle>
            <div className="grid grid-cols-2 gap-x-6">
              <Field label={L.owner} labelWidth={96} className="col-span-2">
                <RemoteLookupSelect
                  value={form.ownerCompanyId ?? ""}
                  initialOptions={companies}
                  onInputChange={() => undefined}
                  onResolvedChange={(_value, selected) =>
                    setField("ownerCompanyId", selected ? String(selected.id) : null)
                  }
                  fetchOptions={(query) => fetchLookup("companies", query)}
                  formatOption={(item) =>
                    item.code ? `${item.name ?? item.code} (${item.code})` : (item.name ?? String(item.id))
                  }
                  mapValue={(item) => String(item.id)}
                  sortOptions={false}
                />
              </Field>
              <Field label={L.callSign} labelWidth={96}>
                <TInput
                  value={form.callSign ?? ""}
                  onChange={(event) => setField("callSign", event.target.value)}
                />
              </Field>
              <Field label={L.ownership} labelWidth={96}>
                <TSelect
                  values={O.ownership}
                  value={form.ownership}
                  onChange={(value) => setField("ownership", value as VesselMaster["ownership"])}
                />
              </Field>
              <Field label={L.vesselCode} labelWidth={96}>
                <TInput
                  value={form.vesselCode ?? ""}
                  onChange={(event) => setField("vesselCode", event.target.value)}
                />
              </Field>
              <Field label={L.imoNo} labelWidth={96}>
                <TInput
                  value={form.imoNo ?? ""}
                  onChange={(event) => setField("imoNo", event.target.value)}
                />
              </Field>
              <Field label={L.flag} labelWidth={96}>
                <TInput
                  value={form.flag ?? ""}
                  onChange={(event) => setField("flag", event.target.value)}
                />
              </Field>
              <Field label={L.hullNo} labelWidth={96}>
                <TInput
                  value={form.hullNo ?? ""}
                  onChange={(event) => setField("hullNo", event.target.value)}
                />
              </Field>
              <Field label={L.class} labelWidth={96}>
                <TInput
                  value={form.class ?? ""}
                  onChange={(event) => setField("class", event.target.value)}
                />
              </Field>
              <Field label={L.pni} labelWidth={96}>
                <TInput
                  value={operationExpense.pni}
                  onChange={(event) =>
                    setOperationExpense((current) => ({ ...current, pni: event.target.value }))
                  }
                />
              </Field>
              <Field label={L.dwcc} labelWidth={96}>
                <TInput
                  value={String(form.dwcc ?? 0)}
                  onChange={(event) => setNumberField("dwcc", event.target.value)}
                  align="right"
                />
              </Field>
              <Field label={L.loa} labelWidth={96}>
                <TInput
                  value={String(form.loaM ?? 0)}
                  onChange={(event) => setNumberField("loaM", event.target.value)}
                  align="right"
                />
                <TSelect values={O.lengthUnit} defaultValue="M" style={{ width: 72 }} />
              </Field>
              <Field label={L.grt} labelWidth={96}>
                <TInput
                  value={String(form.grt ?? 0)}
                  onChange={(event) => setNumberField("grt", event.target.value)}
                  align="right"
                />
              </Field>
              <Field label={L.beam} labelWidth={96}>
                <TInput
                  value={String(form.beamM ?? 0)}
                  onChange={(event) => setNumberField("beamM", event.target.value)}
                  align="right"
                />
                <TSelect values={O.lengthUnit} defaultValue="M" style={{ width: 72 }} />
              </Field>
              <Field label={L.nrt} labelWidth={96}>
                <TInput
                  value={String(form.nrt ?? 0)}
                  onChange={(event) => setNumberField("nrt", event.target.value)}
                  align="right"
                />
              </Field>
              <Field label={L.depth} labelWidth={96}>
                <TInput
                  value={String(form.depthM ?? 0)}
                  onChange={(event) => setNumberField("depthM", event.target.value)}
                  align="right"
                />
                <TSelect values={O.lengthUnit} defaultValue="M" style={{ width: 72 }} />
              </Field>
              <Field label={L.constant} labelWidth={96}>
                <TInput
                  value={String(form.constantMt ?? 0)}
                  onChange={(event) => setNumberField("constantMt", event.target.value)}
                  align="right"
                />
              </Field>
            </div>
          </section>

          <section>
            <GroupTitle>{L.canal}</GroupTitle>
            <div className="grid grid-cols-2 gap-x-6">
              <Field label={L.scnt} labelWidth={96}>
                <TInput
                  value={String(form.scnt ?? 0)}
                  onChange={(event) => setNumberField("scnt", event.target.value)}
                  align="right"
                />
              </Field>
              <Field label={L.pcUmsNt} labelWidth={96}>
                <TInput
                  value={String(form.pcUmsNt ?? 0)}
                  onChange={(event) => setNumberField("pcUmsNt", event.target.value)}
                  align="right"
                />
              </Field>
            </div>
          </section>

          <section>
            <GroupTitle>{L.gearAndHaHo}</GroupTitle>
            <div className="grid grid-cols-2 gap-3">
              <div className="h-[138px] overflow-hidden border border-[#CBD7E2] bg-white text-[11px]">
                <div className="grid grid-cols-[1fr_64px_44px_72px] border-b border-[#CBD7E2] bg-[#EAF3FF] px-2 py-1 font-medium text-[#214F68]">
                  <span>{L.gearDesc}</span>
                  <span className="text-right">{L.unitMT}</span>
                  <span className="text-right">{L.unitEA}</span>
                  <span>{L.hoHa}</span>
                </div>
                {form.gears.length ? (
                  form.gears.map((gear, index) => (
                    <button
                      key={`${gear.gearType}-${index}`}
                      type="button"
                      className={`grid w-full grid-cols-[1fr_64px_44px_72px] px-2 py-1 text-left hover:bg-[#EAF6FB] ${
                        selectedGearIndex === index ? "bg-[#D4E8F1]" : ""
                      }`}
                      onClick={() => setSelectedGearIndex(index)}
                    >
                      <span>{gear.gearType}</span>
                      <span className="text-right">{gear.capacityMt ?? 0}</span>
                      <span className="text-right">{gear.qtyEa ?? 0}</span>
                      <span>{gear.position ?? ""}</span>
                    </button>
                  ))
                ) : (
                  <div className="px-2 py-3 text-[#5A6E7F]">No gear rows.</div>
                )}
              </div>
              <div className="grid content-start gap-y-[6px]">
                <div className="text-[11px] text-[#5A6E7F]">{L.gearDesc}</div>
                <TSelect
                  values={O.gearDesc}
                  value={gearDraft.gearType}
                  onChange={(value) =>
                    setGearDraft((current) => ({ ...current, gearType: String(value) }))
                  }
                />
                <div className="grid grid-cols-2 gap-2">
                  <div className="flex items-center gap-1">
                    <TInput
                      value={String(gearDraft.capacityMt ?? 0)}
                      onChange={(event) =>
                        setGearDraft((current) => ({
                          ...current,
                          capacityMt: toNumber(event.target.value),
                        }))
                      }
                      align="right"
                    />
                    <span className="text-[11px] text-[#5A6E7F]">{L.unitMT}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <TInput
                      value={String(gearDraft.qtyEa ?? 0)}
                      onChange={(event) =>
                        setGearDraft((current) => ({
                          ...current,
                          qtyEa: Math.trunc(toNumber(event.target.value)),
                        }))
                      }
                      align="right"
                    />
                    <span className="text-[11px] text-[#5A6E7F]">{L.unitEA}</span>
                  </div>
                </div>
                <TSelect
                  values={O.gearPosition}
                  value={gearDraft.position ?? "Midship"}
                  onChange={(value) =>
                    setGearDraft((current) => ({ ...current, position: String(value) }))
                  }
                />
                <div className="grid grid-cols-2 gap-2">
                  <Button size="small" icon={<PlusCircleOutlined />} onClick={addGear}>
                    {L.add}
                  </Button>
                  <Button
                    size="small"
                    icon={<MinusCircleOutlined />}
                    onClick={removeSelectedGear}
                    disabled={selectedGearIndex === null}
                  >
                    {L.delete}
                  </Button>
                </div>
              </div>
            </div>

            <div className="mt-2">
              <Field label={L.hoHa} labelWidth={208}>
                <TInput
                  value={form.hoHaGear?.split("/")?.[0] ?? "0"}
                  onChange={(event) =>
                    setField(
                      "hoHaGear",
                      `${event.target.value}/${form.hoHaGear?.split("/")?.[1] ?? 0}`,
                    )
                  }
                  align="right"
                />
                <span className="text-[11px]">/</span>
                <TInput
                  value={form.hoHaGear?.split("/")?.[1] ?? "0"}
                  onChange={(event) =>
                    setField(
                      "hoHaGear",
                      `${form.hoHaGear?.split("/")?.[0] ?? 0}/${event.target.value}`,
                    )
                  }
                  align="right"
                />
              </Field>
              <Field label={L.hoHaType} labelWidth={208}>
                <TSelect
                  values={O.deckType}
                  value={form.hoHaType?.split("/")?.[0] ?? "Single Deck"}
                  onChange={(value) =>
                    setField(
                      "hoHaType",
                      `${String(value)}/${form.hoHaType?.split("/")?.[1] ?? "Mc Greegor"}`,
                    )
                  }
                />
                <span className="text-[11px]">/</span>
                <TSelect
                  values={O.coverType}
                  value={form.hoHaType?.split("/")?.[1] ?? "Mc Greegor"}
                  onChange={(value) =>
                    setField(
                      "hoHaType",
                      `${form.hoHaType?.split("/")?.[0] ?? "Single Deck"}/${String(value)}`,
                    )
                  }
                />
              </Field>
              <Field label={L.tankTopStrength} labelWidth={208}>
                <TInput
                  value={String(form.tankTopStrengthUpper ?? 0)}
                  onChange={(event) => setNumberField("tankTopStrengthUpper", event.target.value)}
                  align="right"
                />
                <span className="text-[11px]">/</span>
                <TInput
                  value={String(form.tankTopStrengthTween ?? 0)}
                  onChange={(event) => setNumberField("tankTopStrengthTween", event.target.value)}
                  align="right"
                />
                <span className="whitespace-nowrap text-[11px] text-[#5A6E7F]">
                  {L.unitMTperSQM}
                </span>
              </Field>
              <Field label={L.hatchCoverStrength} labelWidth={208}>
                <TInput
                  value={String(form.hatchCoverStrength ?? 0)}
                  onChange={(event) => setNumberField("hatchCoverStrength", event.target.value)}
                  align="right"
                />
                <span className="whitespace-nowrap text-[11px] text-[#5A6E7F]">
                  {L.unitMTperSQM}
                </span>
              </Field>
            </div>
          </section>
        </div>
      </div>
    </DialogShell>
  );
}

function ProfileTabContent({
  mode,
  bunkerProfiles,
  activeProfileIndex,
  onProfileChange,
  onUpdateProfile,
  onAddProfile,
  onDeleteProfile,
  getConsumption,
  setConsumption,
  setSpeed,
  copyNormalToEca,
  fuelTypeOptions,
  getFuelType,
  setFuelType,
}: {
  mode: VesselPerformanceMode;
  bunkerProfiles: VesselBunkerProfile[];
  activeProfileIndex: number;
  onProfileChange: (index: number) => void;
  onUpdateProfile: (updater: (profile: VesselBunkerProfile) => VesselBunkerProfile) => void;
  onAddProfile: () => void;
  onDeleteProfile: () => void;
  getConsumption: (
    fuelRole: FuelRole,
    condition: FuelCondition,
    activity: VesselActivity,
  ) => number;
  setConsumption: (
    fuelRole: FuelRole,
    condition: FuelCondition,
    activity: VesselActivity,
    value: number,
  ) => void;
  setSpeed: (field: "speedBallastKn" | "speedLadenKn", value: number) => void;
  copyNormalToEca: (fuelRole: FuelRole) => void;
  fuelTypeOptions: Array<{ value: string; label: string }>;
  getFuelType: (fuelRole: FuelRole, condition: FuelCondition) => number | null;
  setFuelType: (fuelRole: FuelRole, condition: FuelCondition, fuelTypeId: number) => void;
}) {
  const activeProfile = bunkerProfiles[activeProfileIndex];

  return (
    <div className="space-y-3 border border-[#CBD7E2] bg-white p-3">
      <div className="grid gap-5 lg:grid-cols-[160px_minmax(0,1fr)]">
        <div>
          <div className="mb-1 text-[11px] text-[#334E63]">{L.speed}</div>
          <div className="grid w-[160px] grid-cols-2 overflow-hidden border border-[#CBD7E2]">
            <Th className="text-center">{L.ballast}</Th>
            <Th className="text-center">{L.laden}</Th>
            <Td className="border-b-0" numeric>
              <NumCell
                value={mode.speedBallastKn}
                onChange={(value) => setSpeed("speedBallastKn", value)}
              />
            </Td>
            <Td className="border-b-0" numeric>
              <NumCell
                value={mode.speedLadenKn}
                onChange={(value) => setSpeed("speedLadenKn", value)}
              />
            </Td>
          </div>
        </div>
        <div>
          <div className="grid max-w-[448px] grid-cols-[minmax(0,1fr)_136px] gap-x-3 gap-y-1">
            <div className="text-[11px] text-[#334E63]">{L.bunkerProfile}</div>
            <div className="text-[11px] text-[#334E63]">Active from</div>
            <Select
              size="small"
              value={activeProfileIndex}
              onChange={onProfileChange}
              options={bunkerProfiles.map((item, index) => ({
                value: index,
                label: item.profileName,
              }))}
              style={selectStyle}
            />
            <Input
              size="small"
              type="date"
              value={activeProfile?.effectiveFrom ?? today()}
              onChange={(event) =>
                onUpdateProfile((profile) => ({
                  ...profile,
                  effectiveFrom: event.target.value,
                  effectiveTo: null,
                }))
              }
              style={inputStyle}
            />
          </div>
          <div className="mt-2 grid max-w-[448px] grid-cols-[auto_auto_minmax(0,1fr)_136px] items-center gap-2">
            <Button size="small" icon={<PlusCircleOutlined />} onClick={onAddProfile}>
              {L.add}
            </Button>
            <Button
              size="small"
              icon={<MinusCircleOutlined />}
              onClick={onDeleteProfile}
              disabled={bunkerProfiles.length <= 1}
            >
              {L.delete}
            </Button>
            <Select
              size="small"
              value={activeProfile?.isActive === false ? "N" : "Y"}
              onChange={(value) =>
                onUpdateProfile((profile) => ({ ...profile, isActive: value === "Y" }))
              }
              options={[
                { value: "Y", label: "Active" },
                { value: "N", label: "Inactive" },
              ]}
              style={selectStyle}
            />
          </div>
        </div>
      </div>

      <ConsumptionGrid
        fuelRole="MAIN"
        rowTitle={L.main}
        normalFuel="VLSFO"
        ecaFuel="ULSFO"
        activities={["BALLAST", "LADEN", "IDLE", "WORK"]}
        labels={[L.ballast, L.laden, L.idle, L.work]}
        getConsumption={getConsumption}
        setConsumption={setConsumption}
        copyNormalToEca={copyNormalToEca}
        fuelTypeOptions={fuelTypeOptions}
        getFuelType={getFuelType}
        setFuelType={setFuelType}
      />
      <ConsumptionGrid
        fuelRole="SUB"
        rowTitle={L.sub}
        normalFuel="MGO"
        ecaFuel="MGO"
        activities={["SEA", "IDLE", "WORK"]}
        labels={[L.sea, L.idle, L.work]}
        getConsumption={getConsumption}
        setConsumption={setConsumption}
        copyNormalToEca={copyNormalToEca}
        fuelTypeOptions={fuelTypeOptions}
        getFuelType={getFuelType}
        setFuelType={setFuelType}
      />
    </div>
  );
}

function ConsumptionGrid({
  fuelRole,
  rowTitle,
  normalFuel,
  ecaFuel,
  activities,
  labels,
  getConsumption,
  setConsumption,
  copyNormalToEca,
  fuelTypeOptions,
  getFuelType,
  setFuelType,
}: {
  fuelRole: FuelRole;
  rowTitle: string;
  normalFuel: string;
  ecaFuel: string;
  activities: VesselActivity[];
  labels: string[];
  getConsumption: (
    fuelRole: FuelRole,
    condition: FuelCondition,
    activity: VesselActivity,
  ) => number;
  setConsumption: (
    fuelRole: FuelRole,
    condition: FuelCondition,
    activity: VesselActivity,
    value: number,
  ) => void;
  copyNormalToEca: (fuelRole: FuelRole) => void;
  fuelTypeOptions: Array<{ value: string; label: string }>;
  getFuelType: (fuelRole: FuelRole, condition: FuelCondition) => number | null;
  setFuelType: (fuelRole: FuelRole, condition: FuelCondition, fuelTypeId: number) => void;
}) {
  return (
    <div>
      <div className="mb-1 flex items-center justify-between">
        <div className="text-[11px] text-[#334E63]">
          {fuelRole === "MAIN" ? L.bunkerConsumption : ""}
        </div>
        <Button size="small" icon={<CopyOutlined />} onClick={() => copyNormalToEca(fuelRole)}>
          {L.copyNormalToEca}
        </Button>
      </div>
      <div
        className="grid overflow-hidden border border-[#CBD7E2]"
        style={{ gridTemplateColumns: `60px 80px repeat(${activities.length}, 1fr) 56px` }}
      >
        <Th>{rowTitle}</Th>
        <Th>{L.type}</Th>
        {labels.map((label) => (
          <Th key={label} className="text-right">
            {label}
          </Th>
        ))}
        <Th />
        {(["NORMAL", "ECA"] as const).map((condition) => (
          <BunkerRow
            key={condition}
            fuelRole={fuelRole}
            condition={condition}
            conditionLabel={condition === "NORMAL" ? L.normal : L.eca}
            fuelLabel={condition === "NORMAL" ? normalFuel : ecaFuel}
            activities={activities}
            getConsumption={getConsumption}
            setConsumption={setConsumption}
            isLast={condition === "ECA"}
            fuelTypeOptions={fuelTypeOptions}
            fuelTypeId={getFuelType(fuelRole, condition)}
            setFuelType={setFuelType}
          />
        ))}
      </div>
    </div>
  );
}

function BunkerRow({
  fuelRole,
  condition,
  conditionLabel,
  fuelLabel,
  activities,
  getConsumption,
  setConsumption,
  isLast,
  fuelTypeOptions,
  fuelTypeId,
  setFuelType,
}: {
  fuelRole: FuelRole;
  condition: FuelCondition;
  conditionLabel: string;
  fuelLabel: string;
  activities: VesselActivity[];
  getConsumption: (
    fuelRole: FuelRole,
    condition: FuelCondition,
    activity: VesselActivity,
  ) => number;
  setConsumption: (
    fuelRole: FuelRole,
    condition: FuelCondition,
    activity: VesselActivity,
    value: number,
  ) => void;
  isLast: boolean;
  fuelTypeOptions: Array<{ value: string; label: string }>;
  fuelTypeId: number | null;
  setFuelType: (fuelRole: FuelRole, condition: FuelCondition, fuelTypeId: number) => void;
}) {
  const border = isLast ? "border-b-0" : "";

  return (
    <>
      <Td className={border}>{conditionLabel}</Td>
      <Td className={border}>
        <Select
          size="small"
          value={fuelTypeId ? String(fuelTypeId) : undefined}
          options={fuelTypeOptions}
          onChange={(value) => setFuelType(fuelRole, condition, Number(value))}
          style={{ width: "100%", fontSize: 11 }}
          popupMatchSelectWidth={false}
        />
      </Td>
      {activities.map((activity) => (
        <Td key={activity} className={border} numeric>
          <NumCell
            value={getConsumption(fuelRole, condition, activity)}
            onChange={(value) => setConsumption(fuelRole, condition, activity, value)}
          />
        </Td>
      ))}
      <Td className={border}>
        <span className="flex items-center justify-center gap-2">
          <PlusCircleOutlined style={{ color: "#45B86B" }} />
          <MinusCircleOutlined style={{ color: "#4E9BD5" }} />
        </span>
      </Td>
    </>
  );
}
