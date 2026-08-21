import { useEffect, useMemo, useState } from "react";
import { Select } from "antd";
import type { LookupItem } from "@/lib/api/masterData";

type RemoteLookupSelectProps = {
  value: string;
  initialOptions?: LookupItem[];
  onInputChange: (value: string) => void;
  onResolvedChange?: (value: string, selected?: LookupItem) => void;
  formatOption?: (item: LookupItem) => string;
  fetchOptions: (query: string) => Promise<LookupItem[]>;
  mapValue?: (item: LookupItem) => string;
  sortOptions?: boolean;
};

function defaultFormatOption(item: LookupItem) {
  if (item.name && item.country) return `${item.name} <${item.country}>`;
  return item.name ?? item.term ?? item.code ?? String(item.id);
}

function defaultMapValue(item: LookupItem) {
  return defaultFormatOption(item);
}

function mergeLookupOptions(
  sources: LookupItem[][],
  formatOption: (item: LookupItem) => string,
  mapValue: (item: LookupItem) => string,
  currentValue?: string,
  sortOptions = true,
) {
  const merged = new Map<string, { item: LookupItem; label: string }>();
  for (const source of sources) {
    for (const item of source) {
      const optionValue = mapValue(item);
      if (!optionValue) continue;
      if (!merged.has(optionValue)) {
        merged.set(optionValue, { item, label: formatOption(item) });
      }
    }
  }

  if (currentValue?.trim() && !merged.has(currentValue.trim())) {
    merged.set(currentValue.trim(), {
      item: { id: currentValue.trim(), name: currentValue.trim() },
      label: currentValue.trim(),
    });
  }

  const list = [...merged.entries()].map(([value, payload]) => ({
    value,
    label: payload.label,
    item: payload.item,
  }));

  return sortOptions ? list.sort((a, b) => a.label.localeCompare(b.label)) : list;
}

export function RemoteLookupSelect({
  value,
  initialOptions = [],
  onInputChange,
  onResolvedChange,
  formatOption = defaultFormatOption,
  fetchOptions,
  mapValue = defaultMapValue,
  sortOptions = true,
}: RemoteLookupSelectProps) {
  const [remoteOptions, setRemoteOptions] = useState<LookupItem[]>([]);
  const [searchText, setSearchText] = useState("");

  useEffect(() => {
    let cancelled = false;
    const trimmed = searchText.trim();

    if (!trimmed) {
      setRemoteOptions([]);
      return;
    }

    const timeoutId = window.setTimeout(() => {
      void fetchOptions(trimmed)
        .then((rows) => {
          if (!cancelled) {
            setRemoteOptions(rows);
          }
        })
        .catch(() => {
          if (!cancelled) {
            setRemoteOptions([]);
          }
        });
    }, 180);

    return () => {
      cancelled = true;
      window.clearTimeout(timeoutId);
    };
  }, [fetchOptions, searchText]);

  const options = useMemo(
    () => mergeLookupOptions([initialOptions, remoteOptions], formatOption, mapValue, value, sortOptions),
    [formatOption, initialOptions, mapValue, remoteOptions, sortOptions, value],
  );

  return (
    <Select
      showSearch
      allowClear
      size="small"
      variant="borderless"
      value={value || undefined}
      onSearch={(next) => {
        setSearchText(next);
        onInputChange(next);
      }}
      onChange={(next) => {
        const resolvedValue = next ?? "";
        const selected = options.find((option) => option.value === resolvedValue)?.item;
        onInputChange(resolvedValue);
        onResolvedChange?.(resolvedValue, selected);
      }}
      filterOption={false}
      style={{ width: "100%", fontSize: 11 }}
      options={options.map((option) => ({ value: option.value, label: option.label }))}
    />
  );
}
