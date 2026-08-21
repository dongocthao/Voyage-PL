"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { ConfigProvider, Input, Select, Table, type SelectProps } from "antd";
import type { ColumnsType } from "antd/es/table";
import { SearchOutlined } from "@ant-design/icons";
import { StyleProvider } from "@ant-design/cssinjs";
import { listCargoes, type CargoLookup } from "@/lib/api/cargoes";
import {
  createWorkspaceToolbarRegistration,
  type RegisterWorkspaceToolbar,
} from "@/components/workspace/workspaceToolbar";
import { useResizableColumns } from "@/components/voyage-estimator/useResizableColumns";
import { VE_FONT_FAMILY, veTheme } from "@/components/voyage-estimator/theme";

interface CargoListRow {
  key: string;
  id: string;
  shortName: string;
  cargoGroup: string;
  cargoClass: string;
  unNumber: string;
  stowageFactor: string;
  defaultUnit: string;
  lastUpdated: string;
}

interface Filters {
  cargoGroup?: string;
  cargoClass?: string;
}

const BASE_COLUMNS: ColumnsType<CargoListRow> = [
  {
    title: "Cargo ID",
    dataIndex: "id",
    key: "id",
    width: 90,
    render: (value) => <span className="font-semibold text-[#0e5d80]">{value}</span>,
  },
  { title: "Cargo short name", dataIndex: "shortName", key: "shortName", width: 300 },
  { title: "Cargo Group", dataIndex: "cargoGroup", key: "cargoGroup", width: 160 },
  { title: "Cargo Class", dataIndex: "cargoClass", key: "cargoClass", width: 150 },
  { title: "UN Number", dataIndex: "unNumber", key: "unNumber", width: 100 },
  { title: "Stowage Factor", dataIndex: "stowageFactor", key: "stowageFactor", width: 120 },
  { title: "Default CP Unit", dataIndex: "defaultUnit", key: "defaultUnit", width: 130 },
  { title: "Last update", dataIndex: "lastUpdated", key: "lastUpdated", width: 130 },
];

function toCargoRow(row: CargoLookup): CargoListRow {
  return {
    key: row.id,
    id: row.id,
    shortName: row.code ?? row.name ?? "",
    cargoGroup: row.cargoGroup ?? "",
    cargoClass: row.cargoClass ?? "",
    unNumber: row.unNumber ?? "",
    stowageFactor: formatNumber(row.stowageFactor),
    defaultUnit: row.defaultUnit ?? "",
    lastUpdated: formatDateTime(row.lastUpdated),
  };
}

function uniqueValues(rows: CargoListRow[], field: keyof CargoListRow) {
  return Array.from(new Set(rows.map((row) => String(row[field] ?? "").trim()).filter(Boolean))).sort(
    (a, b) => a.localeCompare(b),
  );
}

export function CargoListForm({
  registerWorkspaceToolbar,
  onOpenCargo,
}: {
  registerWorkspaceToolbar?: RegisterWorkspaceToolbar;
  onOpenCargo?: (cargoId: string) => void;
} = {}) {
  const [rows, setRows] = useState<CargoListRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<Filters>({});
  const [find, setFind] = useState("");
  const [selectedKey, setSelectedKey] = useState<string | undefined>();
  const columns = useResizableColumns(BASE_COLUMNS);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    listCargoes()
      .then((items) => {
        if (!alive) return;
        const nextRows = items.map(toCargoRow);
        setRows(nextRows);
        setSelectedKey((current) => current ?? nextRows[0]?.id);
      })
      .catch(() => {
        if (!alive) return;
        setRows([]);
        setSelectedKey(undefined);
      })
      .finally(() => {
        if (alive) setLoading(false);
      });

    return () => {
      alive = false;
    };
  }, []);

  const cargoGroups = useMemo(() => uniqueValues(rows, "cargoGroup"), [rows]);
  const cargoClasses = useMemo(() => uniqueValues(rows, "cargoClass"), [rows]);

  const filteredRows = useMemo(() => {
    const query = find.trim().toLowerCase();
    return rows.filter((row) => {
      if (filters.cargoGroup && row.cargoGroup !== filters.cargoGroup) return false;
      if (filters.cargoClass && row.cargoClass !== filters.cargoClass) return false;
      if (query && !Object.values(row).join(" ").toLowerCase().includes(query)) return false;
      return true;
    });
  }, [filters, find, rows]);

  const selectedRow = useMemo(
    () => rows.find((row) => row.id === selectedKey) ?? filteredRows[0],
    [filteredRows, rows, selectedKey],
  );

  const handleOpen = useCallback(() => {
    if (selectedRow) onOpenCargo?.(selectedRow.id);
  }, [onOpenCargo, selectedRow]);

  useEffect(() => {
    registerWorkspaceToolbar?.(
      createWorkspaceToolbarRegistration({
        hasSheet: true,
        hasEstimate: Boolean(selectedRow),
        actions: {
          onOpen: handleOpen,
          onUndo: () => {
            setFilters({});
            setFind("");
          },
        },
      }),
    );
  }, [handleOpen, registerWorkspaceToolbar, selectedRow]);

  const setFilter = (key: keyof Filters) => (value: string | undefined) =>
    setFilters((current) => ({ ...current, [key]: value }));
  const toOptions = (values: string[]): SelectProps["options"] =>
    values.map((value) => ({ label: value, value }));

  return (
    <StyleProvider hashPriority="high">
      <ConfigProvider theme={veTheme}>
        <div className="cargo-list-form flex h-full min-h-0 flex-col bg-white text-black" style={{ fontFamily: VE_FONT_FAMILY, fontSize: 11 }}>
          <ListStyles scope="cargo-list-form" />
          <div className="shrink-0 border-b border-[#d8e2ea] bg-white px-2 pb-2 pt-1">
            <div className="grid w-full items-end gap-x-2 gap-y-1" style={{ gridTemplateColumns: "200px 200px 250px minmax(0,1fr)" }}>
              <label className="truncate text-[11px] font-semibold text-[#334e63]">Cargo Group</label>
              <label className="truncate text-[11px] font-semibold text-[#334e63]">Cargo Class</label>
              <label className="truncate text-[11px] font-semibold text-[#334e63]">Find</label>
              <span />

              <Select size="small" value={filters.cargoGroup} onChange={setFilter("cargoGroup")} allowClear placeholder="All" options={toOptions(cargoGroups)} />
              <Select size="small" value={filters.cargoClass} onChange={setFilter("cargoClass")} allowClear placeholder="All" options={toOptions(cargoClasses)} />
              <Input size="small" value={find} onChange={(event) => setFind(event.target.value)} placeholder="Find..." allowClear prefix={<SearchOutlined className="text-[#73808a]" />} />
              <span />
            </div>
          </div>

          <div className="min-h-0 flex-1 overflow-hidden bg-white p-2">
            <Table<CargoListRow>
              size="small"
              columns={columns}
              dataSource={filteredRows}
              loading={loading}
              bordered
              pagination={false}
              tableLayout="fixed"
              scroll={{ y: "calc(100vh - 224px)" }}
              rowClassName={(record) => (record.id === selectedRow?.id ? "ve-row-selected" : "")}
              onRow={(record) => ({
                onClick: () => setSelectedKey(record.id),
                onDoubleClick: () => onOpenCargo?.(record.id),
              })}
            />
          </div>
        </div>
      </ConfigProvider>
    </StyleProvider>
  );
}

function ListStyles({ scope }: { scope: string }) {
  return (
    <style>
      {`
        .${scope} .ant-table-thead > tr > th {
          height: 30px !important;
          padding-top: 6px !important;
          padding-bottom: 6px !important;
          border-inline-end: 1px solid #cbd8e2 !important;
          border-bottom: 1px solid #cbd8e2 !important;
        }

        .${scope} .ant-table-tbody > tr > td {
          border-inline-end: 1px solid #d8e2ea !important;
          border-bottom: 1px solid #d8e2ea !important;
        }

        .${scope} .ant-table-tbody > tr > td:last-child,
        .${scope} .ant-table-thead > tr > th:last-child {
          border-inline-end: 0 !important;
        }
      `}
    </style>
  );
}

function formatNumber(value?: number | null) {
  return typeof value === "number" && Number.isFinite(value) ? String(value) : "";
}

function formatDateTime(value?: string) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toISOString().slice(0, 16).replace("T", " ");
}

export default CargoListForm;
