import type { LookupItem } from "@/lib/api/masterData";
import { listPorts } from "@/lib/api/ports";
import { RemoteLookupSelect } from "./RemoteLookupSelect";

type PortLookupSelectProps = {
  value: string;
  initialOptions?: LookupItem[];
  onInputChange: (value: string) => void;
  onResolvedChange?: (value: string, selected?: LookupItem) => void;
  formatOption?: (item: LookupItem) => string;
};

function defaultFormatOption(item: LookupItem) {
  if (item.name && item.country) return `${item.name} <${item.country}>`;
  return item.name ?? item.code ?? String(item.id);
}

export function PortLookupSelect({
  value,
  initialOptions = [],
  onInputChange,
  onResolvedChange,
  formatOption = defaultFormatOption,
}: PortLookupSelectProps) {
  return (
    <RemoteLookupSelect
      value={value}
      initialOptions={initialOptions}
      onInputChange={onInputChange}
      onResolvedChange={onResolvedChange}
      formatOption={formatOption}
      fetchOptions={(query) => listPorts(query) as Promise<LookupItem[]>}
    />
  );
}
