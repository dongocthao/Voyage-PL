import { useEffect, useMemo, useState } from "react";
import { Box, Save, Trash2, X } from "lucide-react";
import { Button, ConfigProvider, Input, Select } from "antd";
import { StyleProvider } from "@ant-design/cssinjs";
import { VE_FONT_FAMILY, veTheme } from "@/components/voyage-estimator/theme";
import { getCargo, listCargoes, saveCargo, type CargoMaster } from "@/lib/api/cargoes";

type FormErrors = Record<string, string>;

const LEFT_LABEL_WIDTH = 88;
const RIGHT_LABEL_WIDTH = 96;
const LEFT_INPUT_WIDTH = 206;
const RIGHT_INPUT_WIDTH = 286;
const SMALL_INPUT_WIDTH = 102;
const SMALL_INPUT_RIGHT_WIDTH = 114;
const SMALL_LABEL_WIDTH = 46;
const FIELD_HEIGHT = 26;
const FORM_WIDTH = 796;
const DESCRIPTION_HEIGHT = 98;

const textPattern = /^[A-Za-z0-9 _.,()&/+\-]*$/;
const codePattern = /^[A-Za-z0-9 _./-]+$/;

const emptyCargo: CargoMaster = {
  cargoName: "",
  code: "",
  cargoGroup: "",
  cargoClass: "",
  imoName: "",
  ibcCode: "",
  imsbcCode: "",
  billBy: "",
  defaultUnit: "MT",
  stowageFactor: null,
  stowageFactorFt3: null,
  stowageFactorUnit: "CBM/MT",
  unNumber: "",
  hazardClass: "",
  productCode: "",
  capacityBasis: "Unspecified",
  description: "",
  preclearanceUsCanada: false,
  isDangerous: false,
  isActive: true,
  specialHandlingRequired: false,
};

function LeftLabel({ children }: { children: React.ReactNode }) {
  return <span className="text-right text-[11px] font-semibold text-[#486B8D]">{children}</span>;
}

function RightLabel({ children }: { children: React.ReactNode }) {
  return <span className="text-right text-[11px] font-semibold text-[#486B8D]">{children}</span>;
}

export function NewCargoForm({
  embedded = false,
  initialCargoId,
  onClose,
}: {
  embedded?: boolean;
  initialCargoId?: string;
  onClose?: () => void;
}) {
  const [cargo, setCargo] = useState<CargoMaster>(emptyCargo);
  const [errors, setErrors] = useState<FormErrors>({});
  const [message, setMessage] = useState("Ready");
  const [saving, setSaving] = useState(false);
  const [initializing, setInitializing] = useState(true);

  const selectClassName = useMemo(
    () => (embedded ? "new-cargo-embedded-select" : "new-cargo-select"),
    [embedded],
  );

  const update = <K extends keyof CargoMaster>(key: K, value: CargoMaster[K]) => {
    setCargo((current) => ({ ...current, [key]: value }));
  };

  useEffect(() => {
    let cancelled = false;

    const loadInitialCargo = async () => {
      setInitializing(true);
      try {
        if (initialCargoId) {
          const loaded = await getCargo(initialCargoId);
          if (!cancelled) {
            setCargo({ ...emptyCargo, ...loaded });
            setErrors({});
            setMessage(`Loaded ${loaded.cargoName}`);
          }
          return;
        }

        const lookupRows = await listCargoes();
        const firstActive = lookupRows.find((row) => row.isActive !== false) ?? lookupRows[0];
        if (!firstActive?.id) {
          if (!cancelled) {
            setCargo(emptyCargo);
            setMessage("No cargo master data found.");
          }
          return;
        }

        const loaded = await getCargo(firstActive.id);
        if (!cancelled) {
          setCargo({ ...emptyCargo, ...loaded });
          setErrors({});
          setMessage(`Loaded ${loaded.cargoName}`);
        }
      } catch (error) {
        if (!cancelled) {
          setCargo(emptyCargo);
          setMessage(error instanceof Error ? error.message : "Failed to load cargo.");
        }
      } finally {
        if (!cancelled) {
          setInitializing(false);
        }
      }
    };

    void loadInitialCargo();

    return () => {
      cancelled = true;
    };
  }, [initialCargoId]);

  const clearForm = () => {
    setCargo(emptyCargo);
    setErrors({});
    setMessage("Ready");
  };

  const handleSave = async () => {
    const payload = mapCargoPayload(cargo);
    const nextErrors = validateCargoForm(payload);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) {
      setMessage(Object.values(nextErrors)[0] ?? "Please review the highlighted fields.");
      return;
    }

    setSaving(true);
    try {
      const saved = await saveCargo(payload);
      setCargo({ ...emptyCargo, ...saved });
      setErrors({});
      setMessage(`Saved ${saved.cargoName}`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Failed to save cargo.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!cargo.id) {
      clearForm();
      setMessage("Cleared new cargo.");
      return;
    }

    setSaving(true);
    try {
      const saved = await saveCargo({ ...mapCargoPayload(cargo), id: cargo.id, isActive: false });
      setCargo({ ...emptyCargo, ...saved });
      setErrors({});
      setMessage(`Marked inactive: ${saved.cargoName}`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Failed to update cargo.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <StyleProvider hashPriority="high">
      <ConfigProvider theme={veTheme}>
        <div
          className="bg-white text-[#172331]"
          style={{ fontFamily: VE_FONT_FAMILY, fontSize: 11, width: FORM_WIDTH }}
        >
          <style>
            {`
              .new-cargo-shell .ant-input,
              .new-cargo-shell .ant-select-selector,
              .new-cargo-shell .ant-btn {
                border-radius: 0 !important;
                font-size: 11px !important;
              }

              .new-cargo-shell .ant-input,
              .new-cargo-shell .ant-select-selector {
                height: ${FIELD_HEIGHT}px !important;
                min-height: ${FIELD_HEIGHT}px !important;
              }

              .new-cargo-shell .ant-input {
                line-height: 24px !important;
                padding-top: 0 !important;
                padding-bottom: 0 !important;
              }

              .new-cargo-shell .ant-select-single .ant-select-selector {
                padding-top: 0 !important;
                padding-bottom: 0 !important;
              }

              .new-cargo-shell .ant-select-single .ant-select-selection-item,
              .new-cargo-shell .ant-select-single .ant-select-selection-placeholder {
                line-height: 24px !important;
              }
            `}
          </style>

          <div className={`new-cargo-shell bg-white ${embedded ? "" : "mx-auto border border-[#D8E2EA] shadow-sm"}`.trim()}>
            {!embedded && (
              <div className="flex h-[30px] items-center gap-2 border-b border-[#D8E2EA] bg-[#E9F1F6] px-3 text-[12px] font-bold text-[#0E5D80]">
                <Box className="h-3.5 w-3.5" />
                <span>Cargo</span>
              </div>
            )}

            <div className="space-y-[12px] px-5 pb-3 pt-7">
              <div className="grid" style={{ gridTemplateColumns: "304px 34px 392px" }}>
                <div className="space-y-[6px]">
                  <div
                    className="grid items-center gap-y-[6px]"
                    style={{ gridTemplateColumns: `${LEFT_LABEL_WIDTH}px ${LEFT_INPUT_WIDTH}px`, columnGap: 10 }}
                  >
                    <LeftLabel>Cargo ID</LeftLabel>
                    <Input size="small" value={cargo.id ?? ""} disabled style={{ width: 100 }} />

                    <LeftLabel>Short Name</LeftLabel>
                    <Input
                      size="small"
                      value={cargo.code ?? ""}
                      status={errors.code ? "error" : ""}
                      onChange={(event) => update("code", event.target.value)}
                    />

                    <LeftLabel>Cargo Group</LeftLabel>
                    <Input
                      size="small"
                      value={cargo.cargoGroup ?? ""}
                      status={errors.cargoGroup ? "error" : ""}
                      onChange={(event) => update("cargoGroup", event.target.value)}
                    />

                    <LeftLabel>Cargo Class</LeftLabel>
                    <Input
                      size="small"
                      value={cargo.cargoClass ?? ""}
                      status={errors.cargoClass ? "error" : ""}
                      onChange={(event) => update("cargoClass", event.target.value)}
                    />

                    <LeftLabel>IBC Code</LeftLabel>
                    <Input
                      size="small"
                      value={cargo.ibcCode ?? ""}
                      status={errors.ibcCode ? "error" : ""}
                      onChange={(event) => update("ibcCode", event.target.value)}
                    />

                    <LeftLabel>IMSBC Code</LeftLabel>
                    <Input
                      size="small"
                      value={cargo.imsbcCode ?? ""}
                      status={errors.imsbcCode ? "error" : ""}
                      onChange={(event) => update("imsbcCode", event.target.value)}
                    />
                  </div>
                </div>

                <div />

                <div className="space-y-[6px]">
                  <div
                    className="grid items-center gap-y-[6px]"
                    style={{ gridTemplateColumns: `${RIGHT_LABEL_WIDTH}px ${RIGHT_INPUT_WIDTH}px`, columnGap: 10 }}
                  >
                    <RightLabel>Full Name</RightLabel>
                    <Input
                      size="small"
                      value={cargo.cargoName}
                      status={errors.cargoName ? "error" : ""}
                      onChange={(event) => update("cargoName", event.target.value)}
                    />

                    <RightLabel>IMO Name</RightLabel>
                    <Input
                      size="small"
                      value={cargo.imoName ?? ""}
                      status={errors.imoName ? "error" : ""}
                      onChange={(event) => update("imoName", event.target.value)}
                    />

                    <RightLabel>Stow Factor</RightLabel>
                    <div
                      className="grid items-center"
                      style={{ gridTemplateColumns: `${SMALL_INPUT_WIDTH}px ${SMALL_LABEL_WIDTH}px ${SMALL_INPUT_RIGHT_WIDTH}px`, columnGap: 12, width: RIGHT_INPUT_WIDTH }}
                    >
                      <Input
                        size="small"
                        value={formatNumber(cargo.stowageFactor)}
                        status={errors.stowageFactor ? "error" : ""}
                        onChange={(event) => update("stowageFactor", parseNumber(event.target.value))}
                      />
                      <span className="text-center text-[11px] text-[#486B8D]">Ft3/MT</span>
                      <Input
                        size="small"
                        value={formatNumber(cargo.stowageFactorFt3)}
                        status={errors.stowageFactorFt3 ? "error" : ""}
                        onChange={(event) => update("stowageFactorFt3", parseNumber(event.target.value))}
                      />
                    </div>

                    <RightLabel>UN Number</RightLabel>
                    <div
                      className="grid items-center"
                      style={{ gridTemplateColumns: `${SMALL_INPUT_WIDTH}px ${SMALL_LABEL_WIDTH}px ${SMALL_INPUT_RIGHT_WIDTH}px`, columnGap: 12, width: RIGHT_INPUT_WIDTH }}
                    >
                      <Input
                        size="small"
                        value={cargo.unNumber ?? ""}
                        status={errors.unNumber ? "error" : ""}
                        onChange={(event) => update("unNumber", event.target.value)}
                      />
                      <span className="text-center text-[11px] text-[#486B8D]">Class</span>
                      <Input
                        size="small"
                        value={cargo.hazardClass ?? ""}
                        status={errors.hazardClass ? "error" : ""}
                        onChange={(event) => update("hazardClass", event.target.value)}
                      />
                    </div>

                    <RightLabel>Default CP Unit</RightLabel>
                    <Select
                      size="small"
                      value={cargo.defaultUnit ?? "MT"}
                      className={selectClassName}
                      status={errors.defaultUnit ? "error" : ""}
                      options={[
                        { value: "MT", label: "MT" },
                        { value: "CBM", label: "CBM" },
                      ]}
                      onChange={(value) => update("defaultUnit", value)}
                    />

                    <RightLabel>Capacity Basis</RightLabel>
                    <Select
                      size="small"
                      value={cargo.capacityBasis ?? "Unspecified"}
                      className={selectClassName}
                      status={errors.capacityBasis ? "error" : ""}
                      options={[
                        { value: "Unspecified", label: "Unspecified" },
                        { value: "Grain", label: "Grain" },
                        { value: "Bale", label: "Bale" },
                      ]}
                      onChange={(value) => update("capacityBasis", value)}
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-[4px]">
                <div className="text-[11px] font-semibold text-[#486B8D]">Description</div>
                <Input.TextArea
                  rows={5}
                  style={{ height: DESCRIPTION_HEIGHT }}
                  value={cargo.description ?? ""}
                  status={errors.description ? "error" : ""}
                  onChange={(event) => update("description", event.target.value)}
                />
              </div>

              <div className="flex items-center justify-between border-t border-[#D8E2EA] pt-3">
                <span className="text-[11px] text-[#6d7a86]">{message}</span>
                <div className="flex items-center gap-2">
                  <Button size="small" className="w-24" onClick={clearForm}>
                    Add
                  </Button>
                  <Button
                    size="small"
                    className="w-24"
                    icon={<Trash2 className="h-3.5 w-3.5" />}
                    onClick={() => void handleDelete()}
                    disabled={saving || initializing}
                  >
                    Delete
                  </Button>
                  <Button
                    size="small"
                    type="primary"
                    className="w-24"
                    icon={<Save className="h-3.5 w-3.5" />}
                    onClick={() => void handleSave()}
                    loading={saving}
                    disabled={initializing}
                  >
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

function parseNumber(value: string) {
  const trimmed = value.trim();
  if (!trimmed) {
    return null;
  }
  const parsed = Number(trimmed);
  return Number.isFinite(parsed) ? parsed : null;
}

function formatNumber(value: number | null | undefined) {
  return typeof value === "number" && Number.isFinite(value) ? String(value) : "";
}

function mapCargoPayload(cargo: CargoMaster): CargoMaster {
  return {
    ...cargo,
    code: cargo.code ?? "",
    cargoName: cargo.cargoName ?? "",
    cargoGroup: cargo.cargoGroup ?? "",
    cargoClass: cargo.cargoClass ?? "",
    imoName: cargo.imoName ?? "",
    ibcCode: cargo.ibcCode ?? "",
    imsbcCode: cargo.imsbcCode ?? "",
    billBy: null,
    defaultUnit: cargo.defaultUnit ?? "MT",
    stowageFactor: cargo.stowageFactor ?? null,
    stowageFactorFt3: cargo.stowageFactorFt3 ?? null,
    stowageFactorUnit: "CBM/MT",
    unNumber: cargo.unNumber ?? "",
    hazardClass: cargo.hazardClass ?? "",
    productCode: null,
    capacityBasis: cargo.capacityBasis ?? "Unspecified",
    description: cargo.description ?? "",
    preclearanceUsCanada: false,
    isDangerous: false,
    isActive: true,
    specialHandlingRequired: false,
  };
}

function validateCargoForm(cargo: CargoMaster): FormErrors {
  const errors: FormErrors = {};
  requireText(errors, "cargoName", cargo.cargoName, "Full Name", 150);
  optionalText(errors, "code", cargo.code, "Short Name", 30, codePattern);
  optionalText(errors, "cargoGroup", cargo.cargoGroup, "Cargo Group", 80, textPattern);
  optionalText(errors, "cargoClass", cargo.cargoClass, "Cargo Class", 80, textPattern);
  optionalText(errors, "imoName", cargo.imoName, "IMO Name", 150, textPattern);
  optionalText(errors, "ibcCode", cargo.ibcCode, "IBC Code", 50, codePattern);
  optionalText(errors, "imsbcCode", cargo.imsbcCode, "IMSBC Code", 150, textPattern);
  optionalText(errors, "defaultUnit", cargo.defaultUnit, "Default CP Unit", 20, codePattern);
  optionalPositiveNumber(errors, "stowageFactor", cargo.stowageFactor, "Stow Factor");
  optionalPositiveNumber(errors, "stowageFactorFt3", cargo.stowageFactorFt3, "Stow Factor Ft3");
  optionalText(errors, "unNumber", cargo.unNumber, "UN Number", 30, codePattern);
  optionalText(errors, "hazardClass", cargo.hazardClass, "Class", 30, codePattern);
  optionalText(errors, "capacityBasis", cargo.capacityBasis, "Capacity Basis", 30, textPattern);
  optionalText(errors, "description", cargo.description, "Description", 1000, textPattern);
  return errors;
}

function requireText(
  errors: FormErrors,
  key: string,
  value: string | null | undefined,
  label: string,
  maxLength: number,
) {
  const trimmed = value?.trim() ?? "";
  if (!trimmed) {
    errors[key] = `${label} is required.`;
    return;
  }
  if (trimmed.length > maxLength) {
    errors[key] = `${label} must be ${maxLength} characters or fewer.`;
  }
}

function optionalText(
  errors: FormErrors,
  key: string,
  value: string | null | undefined,
  label: string,
  maxLength: number,
  pattern?: RegExp,
) {
  const trimmed = value?.trim() ?? "";
  if (!trimmed) {
    return;
  }
  if (trimmed.length > maxLength) {
    errors[key] = `${label} must be ${maxLength} characters or fewer.`;
    return;
  }
  if (pattern && !pattern.test(trimmed)) {
    errors[key] = `${label} has an invalid format.`;
  }
}

function optionalPositiveNumber(
  errors: FormErrors,
  key: string,
  value: number | null | undefined,
  label: string,
) {
  if (value === undefined || value === null) {
    return;
  }
  if (!Number.isFinite(value) || value < 0) {
    errors[key] = `${label} must be zero or greater.`;
  }
}
