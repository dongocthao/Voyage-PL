import { Input, Select } from "antd";
import type { ReactNode } from "react";
import { VE_COLORS } from "./theme";

const base: React.CSSProperties = {
  height: 20,
  fontSize: 11,
  borderRadius: 0,
  border: "1px solid transparent",
  background: "#FFFFFF",
  padding: "0 4px",
};

/** Ô nhập liệu thường */
export function TxtCell({
  value = "",
  right,
  color,
  readOnly,
  onChange,
}: {
  value?: string;
  right?: boolean;
  color?: string;
  readOnly?: boolean;
  onChange?: (value: string) => void;
}) {
  const valueProps = onChange
    ? {
        value,
        onChange: (event: React.ChangeEvent<HTMLInputElement>) => onChange(event.target.value),
      }
    : readOnly
      ? { value }
      : { defaultValue: value };

  return (
    <Input
      {...valueProps}
      readOnly={readOnly}
      tabIndex={readOnly ? -1 : undefined}
      style={{
        ...base,
        textAlign: right ? "right" : "left",
        color: color ?? (readOnly ? "#334E63" : undefined),
        background: readOnly ? "#F7FAFC" : "#FFFFFF",
        cursor: readOnly ? "default" : undefined,
      }}
    />
  );
}

/** Ô nhập liệu quan trọng — nền vàng nhạt #FFFBE6 */
export function YCell({
  value = "",
  right = true,
  readOnly,
  onChange,
}: {
  value?: string;
  right?: boolean;
  readOnly?: boolean;
  onChange?: (value: string) => void;
}) {
  const valueProps = onChange
    ? {
        value,
        onChange: (event: React.ChangeEvent<HTMLInputElement>) => onChange(event.target.value),
      }
    : readOnly
      ? { value }
      : { defaultValue: value };

  return (
    <Input
      {...valueProps}
      readOnly={readOnly}
      tabIndex={readOnly ? -1 : undefined}
      style={{
        ...base,
        borderColor: "#CBD5E1",
        background: readOnly ? "#F7FAFC" : "#F6FAFC",
        textAlign: right ? "right" : "left",
        color: readOnly ? "#334E63" : undefined,
        cursor: readOnly ? "default" : undefined,
      }}
    />
  );
}

/** Nhãn key-value trong các bảng tổng hợp */
export function KVRow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <>
      <div
        className="border-b border-r px-1 py-[2px]"
        style={{ borderColor: VE_COLORS.border, background: VE_COLORS.rowAlt }}
      >
        {label}
      </div>
      <div
        className="border-b border-r px-1 py-[2px] text-right"
        style={{ borderColor: VE_COLORS.border }}
      >
        {children}
      </div>
    </>
  );
}

export function SectionTitle({ children }: { children: ReactNode }) {
  return (
    <span className="font-bold" style={{ color: VE_COLORS.sectionTitle, fontSize: 13 }}>
      {children}
    </span>
  );
}

/** Ô chọn (combobox) trong bảng */
export function SelCell({ value, options }: { value?: string; options: string[] }) {
  return (
    <Select
      size="small"
      variant="borderless"
      defaultValue={value || undefined}
      style={{ width: "100%", fontSize: 11 }}
      options={options.map((o) => ({ value: o, label: o }))}
    />
  );
}
