import { useState } from "react";
import { Package, Save, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import {
  saveCargo,
  type CargoMaster,
} from "@/lib/api/cargoes";

const inputClass = "h-6 rounded-none px-2 text-[11px]";
const selectClass = "h-6 rounded-none px-2 text-[11px]";
const invalidClass = "border-red-500 bg-red-50";
const labelClass = "text-right text-[11px] font-medium text-muted-foreground";
const actionClass = "h-7 w-20 rounded-none border-border bg-card px-2 text-[11px] text-foreground hover:bg-muted";
const fontClass = "font-['Segoe_UI',Tahoma,Arial,sans-serif] text-[11px]";
const codePattern = /^[A-Za-z0-9 _./-]+$/;
const textPattern = /^[A-Za-z0-9 _.,()&/+-]*$/;

type FormErrors = Record<string, string>;

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="grid grid-cols-[136px_minmax(0,1fr)] items-center gap-2">
      <Label className={labelClass}>{label}</Label>
      {children}
    </div>
  );
}

function SimpleSelect({
  placeholder,
  value,
  items,
  onChange,
  className = "",
}: {
  placeholder?: string;
  value?: string;
  items: Array<string | { value: string; label: string }>;
  onChange?: (value: string) => void;
  className?: string;
}) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className={`${selectClass} ${className}`.trim()}>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {items.map((item) => (
          <SelectItem
            key={typeof item === "string" ? item : item.value}
            value={typeof item === "string" ? item : item.value}
            className={fontClass}
          >
            {typeof item === "string" ? item : item.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

function Option({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <label className="flex items-center gap-2 rounded-none border border-border/70 px-2 py-1 text-[11px]">
      <Checkbox
        className="rounded-none"
        checked={checked}
        onCheckedChange={(value) => onChange(value === true)}
      />
      <span>{label}</span>
    </label>
  );
}

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
  stowageFactor: 0,
  stowageFactorFt3: 0,
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

export function NewCargoForm({
  embedded = false,
  onClose,
}: {
  embedded?: boolean;
  onClose?: () => void;
}) {
  const [cargo, setCargo] = useState<CargoMaster>(emptyCargo);
  const [message, setMessage] = useState("Ready");
  const [errors, setErrors] = useState<FormErrors>({});

  const update = <K extends keyof CargoMaster>(key: K, value: CargoMaster[K]) => {
    setCargo((current) => ({ ...current, [key]: value }));
  };

  const handleSave = async () => {
    const payload = mapCargoPayload(cargo);
    const nextErrors = validateCargoForm(payload);
    setErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) {
      setMessage(Object.values(nextErrors)[0] ?? "Please review the highlighted fields.");
      return;
    }

    const saved = await saveCargo(payload);
    setCargo({ ...emptyCargo, ...saved });
    setErrors({});
    setMessage(`Saved ${saved.cargoName}`);
  };

  const handleDelete = async () => {
    if (!cargo.id) {
      setCargo(emptyCargo);
      setMessage("Cleared new cargo.");
      return;
    }
    const saved = await saveCargo({ ...cargo, isActive: false });
    setCargo({ ...emptyCargo, ...saved });
    setErrors({});
    setMessage(`Marked inactive: ${saved.cargoName}`);
  };

  return (
    <Card
      className={`${embedded ? "border-0 shadow-none" : "mx-auto max-w-[1020px] border-border/80 shadow-sm"} rounded-none ${fontClass}`.trim()}
    >
      {!embedded && (
        <CardHeader className="h-6 border-b border-[#0F4E68] bg-[#155B78] px-2 py-0 text-white">
          <CardTitle className="flex h-full items-center gap-1.5 text-[11px] font-bold leading-none text-white">
            <Package className="h-3.5 w-3.5 text-white" />
            IMOS Cargo Name
          </CardTitle>
        </CardHeader>
      )}
      <CardContent className="space-y-2 px-4 pb-4 pt-6">
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
          <section className="space-y-1">
            <div className="text-[11px] font-semibold uppercase text-muted-foreground">
              Classification
            </div>
            <Field label="Short Name">
              <Input
                className={`${inputClass} ${errorClass(errors, "code")}`.trim()}
                value={cargo.code ?? ""}
                onChange={(event) => update("code", event.target.value)}
              />
            </Field>
            <Field label="Cargo Group">
              <Input
                className={`${inputClass} ${errorClass(errors, "cargoGroup")}`.trim()}
                value={cargo.cargoGroup ?? ""}
                onChange={(event) => update("cargoGroup", event.target.value)}
              />
            </Field>
            <Field label="Cargo Class">
              <Input
                className={`${inputClass} ${errorClass(errors, "cargoClass")}`.trim()}
                value={cargo.cargoClass ?? ""}
                onChange={(event) => update("cargoClass", event.target.value)}
              />
            </Field>
            <Field label="IMO Name">
              <Input
                className={`${inputClass} ${errorClass(errors, "imoName")}`.trim()}
                value={cargo.imoName ?? ""}
                onChange={(event) => update("imoName", event.target.value)}
              />
            </Field>
            <Field label="IBC Code">
              <Input
                className={`${inputClass} ${errorClass(errors, "ibcCode")}`.trim()}
                value={cargo.ibcCode ?? ""}
                onChange={(event) => update("ibcCode", event.target.value)}
              />
            </Field>
            <Field label="IMSBC Code">
              <Input
                className={`${inputClass} ${errorClass(errors, "imsbcCode")}`.trim()}
                value={cargo.imsbcCode ?? ""}
                onChange={(event) => update("imsbcCode", event.target.value)}
              />
            </Field>
            <Field label="Bill By">
              <Input
                className={`${inputClass} ${errorClass(errors, "billBy")}`.trim()}
                value={cargo.billBy ?? ""}
                onChange={(event) => update("billBy", event.target.value)}
              />
            </Field>
          </section>

          <section className="space-y-1">
            <div className="text-[11px] font-semibold uppercase text-muted-foreground">
              Measurement
            </div>
            <Field label="Full Name">
              <Input
                className={`${inputClass} ${errorClass(errors, "cargoName")}`.trim()}
                value={cargo.cargoName}
                onChange={(event) => update("cargoName", event.target.value)}
              />
            </Field>
            <Field label="Stow Factor">
              <div className="grid grid-cols-[1fr_48px_1fr] items-center gap-1.5">
                <Input
                  className={`${inputClass} ${errorClass(errors, "stowageFactor")}`.trim()}
                  type="number"
                  step="0.0001"
                  value={cargo.stowageFactor ?? ""}
                  onChange={(event) => update("stowageFactor", parseNumber(event.target.value))}
                />
                <span className="text-center text-[11px] text-muted-foreground">Ft3/MT</span>
                <Input
                  className={`${inputClass} ${errorClass(errors, "stowageFactorFt3")}`.trim()}
                  type="number"
                  step="0.0001"
                  value={cargo.stowageFactorFt3 ?? ""}
                  onChange={(event) => update("stowageFactorFt3", parseNumber(event.target.value))}
                />
              </div>
            </Field>
            <Field label="UN Number">
              <div className="grid grid-cols-[1fr_40px_1fr] items-center gap-1.5">
                <Input
                  className={`${inputClass} ${errorClass(errors, "unNumber")}`.trim()}
                  value={cargo.unNumber ?? ""}
                  onChange={(event) => update("unNumber", event.target.value)}
                />
                <span className="text-center text-[11px] text-muted-foreground">Class</span>
                <Input
                  className={`${inputClass} ${errorClass(errors, "hazardClass")}`.trim()}
                  value={cargo.hazardClass ?? ""}
                  onChange={(event) => update("hazardClass", event.target.value)}
                />
              </div>
            </Field>
            <Field label="Product Code">
              <Input
                className={`${inputClass} ${errorClass(errors, "productCode")}`.trim()}
                value={cargo.productCode ?? ""}
                onChange={(event) => update("productCode", event.target.value)}
              />
            </Field>
            <Field label="Default CP Unit">
              <SimpleSelect
                placeholder="Select unit"
                value={cargo.defaultUnit ?? "MT"}
                items={["MT", "CBM"]}
                onChange={(value) => update("defaultUnit", value)}
                className={errorClass(errors, "defaultUnit")}
              />
            </Field>
            <Field label="Capacity Basis">
              <SimpleSelect
                value={cargo.capacityBasis ?? "Unspecified"}
                items={["Unspecified", "Grain", "Bale"]}
                onChange={(value) => update("capacityBasis", value)}
                className={errorClass(errors, "capacityBasis")}
              />
            </Field>
          </section>
        </div>

        <div className="grid grid-cols-1 gap-3 lg:grid-cols-[1fr_300px]">
          <div className="space-y-1">
            <Label className="text-[11px] font-medium text-muted-foreground">Description</Label>
            <Textarea
              className={`min-h-[78px] rounded-none px-2 py-1 text-[11px] ${errorClass(errors, "description")}`.trim()}
              value={cargo.description ?? ""}
              onChange={(event) => update("description", event.target.value)}
            />
          </div>
          <div className="grid content-start gap-1 pt-4">
            <Option
              label="Pre-clearance for US and Canada"
              checked={cargo.preclearanceUsCanada ?? false}
              onChange={(checked) => update("preclearanceUsCanada", checked)}
            />
            <Option
              label="Dangerous"
              checked={cargo.isDangerous ?? false}
              onChange={(checked) => update("isDangerous", checked)}
            />
            <Option
              label="Inactive"
              checked={cargo.isActive === false}
              onChange={(checked) => update("isActive", !checked)}
            />
            <Option
              label="Special Handling Required"
              checked={cargo.specialHandlingRequired ?? false}
              onChange={(checked) => update("specialHandlingRequired", checked)}
            />
          </div>
        </div>

        <Separator />
        <div className="flex items-center justify-between gap-2">
          <span className="text-[11px] text-muted-foreground">{message}</span>
          <div className="flex justify-end gap-1.5">
          <Button size="sm" variant="outline" className={actionClass} onClick={() => setCargo(emptyCargo)}>Add</Button>
          <Button size="sm" variant="outline" className={actionClass} onClick={() => void handleDelete()}>
            <Trash2 className="h-4 w-4" />
            Delete
          </Button>
          <Button size="sm" variant="outline" className={actionClass} onClick={() => void handleSave()}>
            <Save className="h-4 w-4" />
            Save
          </Button>
          <Button
            size="sm"
            variant="outline"
            className={actionClass}
            onClick={() => {
              if (embedded && onClose) {
                onClose();
                return;
              }
              window.history.back();
            }}
          >
            <X className="h-4 w-4" />
            Close
          </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function errorClass(errors: FormErrors, key: string) {
  return errors[key] ? invalidClass : "";
}

function parseNumber(value: string) {
  if (!value.trim()) {
    return null;
  }
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
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
    billBy: cargo.billBy ?? "",
    defaultUnit: cargo.defaultUnit ?? "MT",
    stowageFactor: cargo.stowageFactor ?? null,
    stowageFactorFt3: cargo.stowageFactorFt3 ?? null,
    stowageFactorUnit: cargo.stowageFactorUnit ?? "CBM/MT",
    unNumber: cargo.unNumber ?? "",
    hazardClass: cargo.hazardClass ?? "",
    productCode: cargo.productCode ?? "",
    capacityBasis: cargo.capacityBasis ?? "Unspecified",
    description: cargo.description ?? "",
    preclearanceUsCanada: cargo.preclearanceUsCanada ?? false,
    isDangerous: cargo.isDangerous ?? false,
    isActive: cargo.isActive ?? true,
    specialHandlingRequired: cargo.specialHandlingRequired ?? false,
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
  optionalText(errors, "imsbcCode", cargo.imsbcCode, "IMSBC Code", 50, codePattern);
  optionalText(errors, "billBy", cargo.billBy, "Bill By", 50, textPattern);
  optionalText(errors, "defaultUnit", cargo.defaultUnit, "Default CP Unit", 20, codePattern);
  optionalPositiveNumber(errors, "stowageFactor", cargo.stowageFactor, "Stow Factor");
  optionalPositiveNumber(errors, "stowageFactorFt3", cargo.stowageFactorFt3, "Stow Factor Ft3");
  optionalText(errors, "unNumber", cargo.unNumber, "UN Number", 30, codePattern);
  optionalText(errors, "hazardClass", cargo.hazardClass, "Hazard Class", 30, codePattern);
  optionalText(errors, "productCode", cargo.productCode, "Product Code", 50, codePattern);
  optionalText(errors, "capacityBasis", cargo.capacityBasis, "Capacity Basis", 30, textPattern);
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
