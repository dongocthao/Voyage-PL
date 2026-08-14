import { useMemo, useState } from "react";
import { Anchor, Save, Trash2, X } from "lucide-react";
import { Button, Checkbox, ConfigProvider, Input, Select } from "antd";
import { StyleProvider } from "@ant-design/cssinjs";
import { VE_COLORS, VE_FONT_FAMILY, veTheme } from "@/components/voyage-estimator/theme";
import { savePort, type PortMaster } from "@/lib/api/ports";

type FormErrors = Record<string, string>;

type CoordinateState = {
  degrees: string;
  minutes: string;
  indicator: string;
  decimal: string;
};

type PortFormState = PortMaster & {
  masterPort: string;
  status: "Open" | "Inactive";
  daylightSavingTime: boolean;
  latitude: CoordinateState;
  longitude: CoordinateState;
};

const COUNTRY_OPTIONS = [
  "Philippines",
  "Singapore",
  "China",
  "Korea (South)",
  "Japan",
  "Vietnam",
  "Indonesia",
  "Malaysia",
].map((value) => ({ value, label: value }));

const PORT_TYPE_OPTIONS = ["Standard Port", "Berth", "Anchorage", "Terminal", "River Port"].map(
  (value) => ({ value, label: value }),
);

const STATUS_OPTIONS = [
  { value: "Open", label: "Open" },
  { value: "Inactive", label: "Inactive" },
] as const;

const LATITUDE_INDICATORS = [
  { value: "N", label: "N" },
  { value: "S", label: "S" },
];

const LONGITUDE_INDICATORS = [
  { value: "E", label: "E" },
  { value: "W", label: "W" },
];

const LABEL_WIDTH = 92;
const CONTROL_GAP = 10;
const FORM_SECTION_WIDTH = 560;
const POSITION_GAP = 10;

const textPattern = /^[A-Za-z0-9 _.,()&/+\-]*$/;
const unlocodePattern = /^[A-Za-z0-9]{5}$/;

const emptyCoordinate = (indicator: string): CoordinateState => ({
  degrees: "",
  minutes: "",
  indicator,
  decimal: "",
});

const emptyPortState = (): PortFormState => ({
  portName: "",
  portType: "Standard Port",
  countryName: "",
  state: "",
  portOperator: "",
  portNo: null,
  timeZoneCode: "",
  unlocode: "",
  latitudeText: "",
  longitudeText: "",
  regionCode: "",
  loadlineZone: "",
  stdGmtOffset: null,
  dstGmtOffset: null,
  isActive: true,
  masterPort: "",
  status: "Open",
  daylightSavingTime: false,
  latitude: emptyCoordinate("N"),
  longitude: emptyCoordinate("E"),
});

function Field({
  label,
  children,
  header = false,
}: {
  label: string;
  children: React.ReactNode;
  header?: boolean;
}) {
  return (
    <div
      className={`grid items-center ${header ? "text-[11px] font-semibold text-[#334E63]" : ""}`}
      style={{ gridTemplateColumns: `${LABEL_WIDTH}px ${CONTROL_GAP}px minmax(0,1fr)` }}
    >
      <span className={header ? "" : "text-[11px] text-[#334E63]"}>{label}</span>
      <span />
      <div className="min-w-0">{children}</div>
    </div>
  );
}

function coordinateFromText(value: string | null | undefined, fallbackIndicator: string): CoordinateState {
  const trimmed = value?.trim() ?? "";
  if (!trimmed) {
    return emptyCoordinate(fallbackIndicator);
  }

  const decimalMatch = trimmed.match(/-?\d+(?:\.\d+)?/g);
  const indicatorMatch = trimmed.match(/[NSEW]/i);
  if (decimalMatch?.length === 1 && !indicatorMatch) {
    return {
      degrees: "",
      minutes: "",
      indicator: fallbackIndicator,
      decimal: decimalMatch[0] ?? "",
    };
  }

  const [degrees = "", minutes = ""] = decimalMatch ?? [];
  return {
    degrees,
    minutes,
    indicator: indicatorMatch?.[0]?.toUpperCase() ?? fallbackIndicator,
    decimal: "",
  };
}

function deriveCoordinateText(coord: CoordinateState, axis: "lat" | "lon") {
  const decimal = coord.decimal.trim();
  if (decimal) {
    return decimal;
  }

  const degrees = coord.degrees.trim();
  const minutes = coord.minutes.trim();
  if (!degrees && !minutes) {
    return null;
  }

  const indicator = (coord.indicator || (axis === "lat" ? "N" : "E")).toUpperCase();
  if (degrees && minutes) {
    return `${degrees} ${minutes} ${indicator}`;
  }
  return `${degrees || "0"} ${minutes || "0"} ${indicator}`;
}

function buildPortState(port?: Partial<PortMaster> | null): PortFormState {
  const state = emptyPortState();
  if (!port) {
    return state;
  }
  return {
    ...state,
    ...port,
    portName: port.portName ?? "",
    portType: port.portType ?? "Standard Port",
    countryName: port.countryName ?? "",
    state: port.state ?? "",
    portOperator: port.portOperator ?? "",
    portNo: port.portNo ?? null,
    timeZoneCode: port.timeZoneCode ?? "",
    unlocode: port.unlocode ?? "",
    latitudeText: port.latitudeText ?? "",
    longitudeText: port.longitudeText ?? "",
    regionCode: port.regionCode ?? "",
    loadlineZone: port.loadlineZone ?? "",
    stdGmtOffset: port.stdGmtOffset ?? null,
    dstGmtOffset: port.dstGmtOffset ?? null,
    isActive: port.isActive ?? true,
    masterPort: "",
    status: port.isActive === false ? "Inactive" : "Open",
    daylightSavingTime:
      typeof port.dstGmtOffset === "number" && typeof port.stdGmtOffset === "number"
        ? port.dstGmtOffset !== port.stdGmtOffset
        : port.dstGmtOffset !== null && port.dstGmtOffset !== undefined,
    latitude: coordinateFromText(port.latitudeText, "N"),
    longitude: coordinateFromText(port.longitudeText, "E"),
  };
}

function parseWholeNumber(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return null;
  return /^\d+$/.test(trimmed) ? Number(trimmed) : Number.NaN;
}

function parseDecimalNumber(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return null;
  const parsed = Number(trimmed);
  return Number.isFinite(parsed) ? parsed : Number.NaN;
}

function validateCoordinate(
  errors: FormErrors,
  key: "latitude" | "longitude",
  label: string,
  value: CoordinateState,
  maxDegrees: number,
  allowedIndicators: string[],
) {
  const degrees = value.degrees.trim();
  const minutes = value.minutes.trim();
  const decimal = value.decimal.trim();

  if (!degrees && !minutes && !decimal) {
    return;
  }

  if (!allowedIndicators.includes(value.indicator)) {
    errors[key] = `${label} indicator is invalid.`;
    return;
  }

  if (decimal) {
    const parsedDecimal = parseDecimalNumber(decimal);
    if (typeof parsedDecimal !== "number" || !Number.isFinite(parsedDecimal)) {
      errors[key] = `${label} decimal is invalid.`;
      return;
    }
    if (Math.abs(parsedDecimal) > maxDegrees) {
      errors[key] = `${label} decimal is out of range.`;
    }
    return;
  }

  const parsedDegrees = parseWholeNumber(degrees);
  const parsedMinutes = parseWholeNumber(minutes);
  if (
    typeof parsedDegrees !== "number" ||
    typeof parsedMinutes !== "number" ||
    !Number.isFinite(parsedDegrees) ||
    !Number.isFinite(parsedMinutes)
  ) {
    errors[key] = `${label} degrees/minutes are invalid.`;
    return;
  }
  if (parsedDegrees < 0 || parsedDegrees > maxDegrees) {
    errors[key] = `${label} degrees are out of range.`;
    return;
  }
  if (parsedMinutes < 0 || parsedMinutes > 59) {
    errors[key] = `${label} minutes are out of range.`;
  }
}

function validatePortForm(port: PortFormState): FormErrors {
  const errors: FormErrors = {};
  const portName = port.portName.trim();
  if (!portName) {
    errors.portName = "Port Name is required.";
  } else if (portName.length > 150) {
    errors.portName = "Port Name must be 150 characters or fewer.";
  }

  const country = port.countryName?.trim() ?? "";
  if (!country) {
    errors.countryName = "Country is required.";
  } else if (country.length > 120) {
    errors.countryName = "Country must be 120 characters or fewer.";
  }

  const unlocode = port.unlocode?.trim() ?? "";
  if (unlocode && !unlocodePattern.test(unlocode)) {
    errors.unlocode = "UN LOCODE must be exactly 5 letters or digits.";
  }

  const timeZoneCode = port.timeZoneCode?.trim() ?? "";
  if (timeZoneCode.length > 50) {
    errors.timeZoneCode = "Time Zone must be 50 characters or fewer.";
  }

  const portType = port.portType?.trim() ?? "";
  if (portType.length > 80) {
    errors.portType = "Port Type must be 80 characters or fewer.";
  }

  validateCoordinate(errors, "latitude", "Latitude", port.latitude, 90, ["N", "S"]);
  validateCoordinate(errors, "longitude", "Longitude", port.longitude, 180, ["E", "W"]);

  if (port.state?.trim() && !textPattern.test(port.state.trim())) {
    errors.state = "Status has an invalid format.";
  }

  return errors;
}

function mapPortPayload(port: PortFormState): PortMaster {
  return {
    id: port.id,
    portName: port.portName.trim(),
    portType: port.portType?.trim() || null,
    countryName: port.countryName?.trim() || null,
    state: port.state?.trim() || null,
    portOperator: port.portOperator?.trim() || null,
    portNo: port.portNo ?? null,
    timeZoneCode: port.timeZoneCode?.trim() || null,
    unlocode: port.unlocode?.trim().toUpperCase() || null,
    latitudeText: deriveCoordinateText(port.latitude, "lat"),
    longitudeText: deriveCoordinateText(port.longitude, "lon"),
    regionCode: port.regionCode ?? null,
    loadlineZone: port.loadlineZone ?? null,
    stdGmtOffset: port.stdGmtOffset ?? null,
    dstGmtOffset: port.daylightSavingTime ? port.dstGmtOffset ?? port.stdGmtOffset ?? null : null,
    isActive: port.status !== "Inactive",
  };
}

export function NewPortForm({
  embedded = false,
  onClose,
}: {
  embedded?: boolean;
  onClose?: () => void;
}) {
  const [port, setPort] = useState<PortFormState>(() => buildPortState());
  const [errors, setErrors] = useState<FormErrors>({});
  const [message, setMessage] = useState("Ready");
  const [saving, setSaving] = useState(false);

  const selectClassName = useMemo(
    () =>
      embedded
        ? "new-port-embedded-select"
        : "new-port-select",
    [embedded],
  );

  const setField = <K extends keyof PortFormState>(key: K, value: PortFormState[K]) => {
    setPort((current) => ({ ...current, [key]: value }));
  };

  const setCoordinate = (
    axis: "latitude" | "longitude",
    key: keyof CoordinateState,
    value: string,
  ) => {
    setPort((current) => ({
      ...current,
      [axis]: {
        ...current[axis],
        [key]: value,
      },
    }));
  };

  const clearForm = () => {
    setPort(buildPortState());
    setErrors({});
    setMessage("Ready");
  };

  const handleSave = async () => {
    const nextErrors = validatePortForm(port);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) {
      setMessage(Object.values(nextErrors)[0] ?? "Please review the highlighted fields.");
      return;
    }

    setSaving(true);
    try {
      const saved = await savePort(mapPortPayload(port));
      setPort(buildPortState(saved));
      setErrors({});
      setMessage(`Saved ${saved.portName}`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Failed to save port.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!port.id) {
      clearForm();
      setMessage("Cleared new port.");
      return;
    }

    setSaving(true);
    try {
      const saved = await savePort({ ...mapPortPayload(port), id: port.id, isActive: false });
      setPort(buildPortState(saved));
      setErrors({});
      setMessage(`Marked inactive: ${saved.portName}`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Failed to update port.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <StyleProvider hashPriority="high">
      <ConfigProvider theme={veTheme}>
        <div
          className="bg-white text-[#172331]"
          style={{ fontFamily: VE_FONT_FAMILY, fontSize: 11, width: embedded ? 580 : 580 }}
        >
          <style>
            {`
              .new-port-shell .ant-input,
              .new-port-shell .ant-select-selector {
                border-radius: 0 !important;
                font-size: 11px !important;
                height: 26px !important;
                min-height: 26px !important;
              }

              .new-port-shell .ant-input {
                line-height: 24px !important;
                padding-top: 0 !important;
                padding-bottom: 0 !important;
              }

              .new-port-shell .ant-select-single .ant-select-selector {
                padding-top: 0 !important;
                padding-bottom: 0 !important;
              }

              .new-port-shell .ant-select-single .ant-select-selection-item,
              .new-port-shell .ant-select-single .ant-select-selection-placeholder {
                line-height: 24px !important;
              }

              .new-port-shell .ant-btn {
                border-radius: 0 !important;
                font-size: 11px !important;
              }

              .new-port-shell .ant-checkbox-checked .ant-checkbox-inner {
                background-color: ${VE_COLORS.sectionTitle} !important;
                border-color: ${VE_COLORS.sectionTitle} !important;
              }
            `}
          </style>

          <div
            className={`new-port-shell bg-white ${embedded ? "" : "mx-auto border border-[#D8E2EA] shadow-sm"}`.trim()}
          >
            {!embedded && (
              <div className="flex h-[30px] items-center gap-2 border-b border-[#D8E2EA] bg-[#E9F1F6] px-3 text-[12px] font-bold text-[#0E5D80]">
                <Anchor className="h-3.5 w-3.5" />
                <span>Ports</span>
              </div>
            )}

            <div className="space-y-[10px] px-[10px] pb-4 pt-4">
              <div className="space-y-[10px]" style={{ width: FORM_SECTION_WIDTH }}>
                <Field label="Port ID">
                  <Input value={port.id ?? ""} disabled size="small" />
                </Field>

                <Field label="Port Name">
                  <Input
                    size="small"
                    value={port.portName}
                    status={errors.portName ? "error" : ""}
                    onChange={(event) => setField("portName", event.target.value)}
                  />
                </Field>

                <div
                  className="grid items-center"
                  style={{
                    width: FORM_SECTION_WIDTH,
                    gridTemplateColumns: `${LABEL_WIDTH}px ${CONTROL_GAP}px 200px 20px ${LABEL_WIDTH}px ${CONTROL_GAP}px minmax(0,1fr)`,
                    columnGap: 0,
                  }}
                >
                  <span className="text-[11px] text-[#334E63]">Country</span>
                  <span />
                  <Select
                    size="small"
                    showSearch
                    value={port.countryName || undefined}
                    status={errors.countryName ? "error" : ""}
                    className={selectClassName}
                    options={COUNTRY_OPTIONS}
                    onChange={(value) => setField("countryName", value)}
                  />
                  <span />
                  <span className="text-[11px] text-[#334E63]">UN LOCODE</span>
                  <span />
                  <Input
                    size="small"
                    value={port.unlocode ?? ""}
                    status={errors.unlocode ? "error" : ""}
                    onChange={(event) => setField("unlocode", event.target.value.toUpperCase())}
                  />
                </div>

                <div
                  className="grid items-center"
                  style={{
                    width: FORM_SECTION_WIDTH,
                    gridTemplateColumns: `${LABEL_WIDTH}px ${CONTROL_GAP}px 170px 16px ${LABEL_WIDTH}px ${CONTROL_GAP}px 170px`,
                    columnGap: 0,
                  }}
                >
                  <span className="text-[11px] text-[#334E63]">Port Type</span>
                  <span />
                  <Select
                    size="small"
                    value={port.portType || undefined}
                    status={errors.portType ? "error" : ""}
                    className={selectClassName}
                    options={PORT_TYPE_OPTIONS}
                    onChange={(value) => setField("portType", value)}
                  />
                  <span />
                  <span className="text-[11px] text-[#334E63]">Status</span>
                  <span />
                  <Select
                    size="small"
                    value={port.status}
                    className={selectClassName}
                    options={STATUS_OPTIONS as unknown as { value: string; label: string }[]}
                    onChange={(value) => setField("status", value as PortFormState["status"])}
                  />
                </div>

                <Field label="Master Port">
                  <Input
                    size="small"
                    value={port.masterPort}
                    disabled
                    placeholder="Not mapped in current database schema"
                  />
                </Field>
              </div>

              <fieldset className="box-border border border-[#D8E2EA] px-4 pb-4" style={{ width: FORM_SECTION_WIDTH }}>
                <legend className="px-1 text-[11px] text-[#334E63]">Position</legend>

                <div
                  className="grid items-center"
                  style={{
                    gridTemplateColumns: `${LABEL_WIDTH}px 80px 80px 50px 150px`,
                    columnGap: POSITION_GAP,
                    rowGap: 10,
                  }}
                >
                  <span />
                  <span className="text-[11px] font-semibold text-[#334E63]">Degrees</span>
                  <span className="text-[11px] font-semibold text-[#334E63]">Minutes</span>
                  <span className="text-[11px] font-semibold text-[#334E63]">Indicator</span>
                  <span className="text-[11px] font-semibold text-[#334E63]">Decimal</span>

                  <span className="text-[11px] text-[#334E63]">Latitude</span>
                  <Input
                    size="small"
                    value={port.latitude.degrees}
                    status={errors.latitude ? "error" : ""}
                    onChange={(event) => setCoordinate("latitude", "degrees", event.target.value)}
                  />
                  <Input
                    size="small"
                    value={port.latitude.minutes}
                    status={errors.latitude ? "error" : ""}
                    onChange={(event) => setCoordinate("latitude", "minutes", event.target.value)}
                  />
                  <Select
                    size="small"
                    value={port.latitude.indicator}
                    status={errors.latitude ? "error" : ""}
                    className={selectClassName}
                    options={LATITUDE_INDICATORS}
                    onChange={(value) => setCoordinate("latitude", "indicator", value)}
                  />
                  <Input
                    size="small"
                    value={port.latitude.decimal}
                    status={errors.latitude ? "error" : ""}
                    onChange={(event) => setCoordinate("latitude", "decimal", event.target.value)}
                  />

                  <span className="text-[11px] text-[#334E63]">Longitude</span>
                  <Input
                    size="small"
                    value={port.longitude.degrees}
                    status={errors.longitude ? "error" : ""}
                    onChange={(event) => setCoordinate("longitude", "degrees", event.target.value)}
                  />
                  <Input
                    size="small"
                    value={port.longitude.minutes}
                    status={errors.longitude ? "error" : ""}
                    onChange={(event) => setCoordinate("longitude", "minutes", event.target.value)}
                  />
                  <Select
                    size="small"
                    value={port.longitude.indicator}
                    status={errors.longitude ? "error" : ""}
                    className={selectClassName}
                    options={LONGITUDE_INDICATORS}
                    onChange={(value) => setCoordinate("longitude", "indicator", value)}
                  />
                  <Input
                    size="small"
                    value={port.longitude.decimal}
                    status={errors.longitude ? "error" : ""}
                    onChange={(event) => setCoordinate("longitude", "decimal", event.target.value)}
                  />

                  <span className="text-[11px] text-[#334E63]">Time Zone</span>
                  <Input
                    size="small"
                    value={port.timeZoneCode ?? ""}
                    status={errors.timeZoneCode ? "error" : ""}
                    onChange={(event) => setField("timeZoneCode", event.target.value)}
                    style={{ gridColumn: "2 / span 2", width: 170 }}
                  />
                  <label className="col-start-4 col-span-2 flex items-center gap-2 whitespace-nowrap text-[11px] text-[#334E63]">
                    <Checkbox
                      checked={port.daylightSavingTime}
                      onChange={(event) =>
                        setField("daylightSavingTime", event.target.checked)
                      }
                    />
                    <span>Daylight Saving Time</span>
                  </label>
                </div>
              </fieldset>

              <div className="space-y-2" style={{ width: FORM_SECTION_WIDTH }}>
                <div className="text-[12px] font-bold text-[#0E5D80]">Remark</div>
                <Input.TextArea
                  rows={5}
                  disabled
                  value=""
                  placeholder="Not mapped in current database schema"
                />
              </div>

              <div
                className="flex items-center justify-between gap-3 border-t border-[#D8E2EA] pt-3"
                style={{ width: FORM_SECTION_WIDTH }}
              >
                <span className="text-[11px] text-[#6d7a86]">{message}</span>
                <div className="flex items-center gap-2">
                  <Button size="small" className="w-24" onClick={clearForm}>
                    Add
                  </Button>
                  <Button size="small" className="w-24" icon={<Trash2 className="h-3.5 w-3.5" />} onClick={() => void handleDelete()} disabled={saving}>
                    Delete
                  </Button>
                  <Button size="small" type="primary" className="w-24" icon={<Save className="h-3.5 w-3.5" />} onClick={() => void handleSave()} loading={saving}>
                    Save
                  </Button>
                  <Button
                    size="small"
                    className="w-24"
                    icon={<X className="h-3.5 w-3.5" />}
                    onClick={() => {
                      if (embedded && onClose) {
                        onClose();
                        return;
                      }
                      window.history.back();
                    }}
                  >
                    Close
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </ConfigProvider>
    </StyleProvider>
  );
}
