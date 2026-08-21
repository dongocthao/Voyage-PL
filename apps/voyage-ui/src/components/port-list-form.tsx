"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { ConfigProvider, Input, Select, Table, type SelectProps } from "antd";
import type { ColumnsType } from "antd/es/table";
import { SearchOutlined } from "@ant-design/icons";
import { StyleProvider } from "@ant-design/cssinjs";
import { listPorts, type PortLookup } from "@/lib/api/ports";
import {
  createWorkspaceToolbarRegistration,
  type RegisterWorkspaceToolbar,
} from "@/components/workspace/workspaceToolbar";
import { useResizableColumns } from "@/components/voyage-estimator/useResizableColumns";
import { VE_FONT_FAMILY, veTheme } from "@/components/voyage-estimator/theme";

interface PortListRow {
  key: string;
  id: string;
  name: string;
  country: string;
  timeZone: string;
  portType: string;
  status: string;
  latitude: string;
  longitude: string;
  lastUpdated: string;
}

interface Filters {
  country?: string;
  portType?: string;
  status?: string;
  timeZone?: string;
}

const BASE_COLUMNS: ColumnsType<PortListRow> = [
  {
    title: "Port ID",
    dataIndex: "id",
    key: "id",
    width: 90,
    render: (value) => <span className="font-semibold text-[#0e5d80]">{value}</span>,
  },
  { title: "Port name", dataIndex: "name", key: "name", width: 250 },
  { title: "Country", dataIndex: "country", key: "country", width: 150 },
  { title: "Time Zone", dataIndex: "timeZone", key: "timeZone", width: 100 },
  { title: "Port Type", dataIndex: "portType", key: "portType", width: 140 },
  { title: "Status", dataIndex: "status", key: "status", width: 90 },
  { title: "Latitude", dataIndex: "latitude", key: "latitude", width: 150 },
  { title: "Longtitude", dataIndex: "longitude", key: "longitude", width: 150 },
  { title: "Last update", dataIndex: "lastUpdated", key: "lastUpdated", width: 130 },
];

function toPortRow(row: PortLookup): PortListRow {
  return {
    key: row.id,
    id: row.id,
    name: row.name ?? "",
    country: row.country ?? "",
    timeZone: row.timeZoneCode ?? formatUtcOffset(row.utcOffsetMin),
    portType: row.portType ?? "",
    status: row.status ?? (row.isActive === false ? "Inactive" : "Open"),
    latitude: formatCoordinate(row.latitude),
    longitude: formatCoordinate(row.longitude),
    lastUpdated: formatDateTime(row.lastUpdated),
  };
}

function uniqueValues(rows: PortListRow[], field: keyof PortListRow) {
  return Array.from(new Set(rows.map((row) => String(row[field] ?? "").trim()).filter(Boolean))).sort(
    (a, b) => a.localeCompare(b),
  );
}

export function PortListForm({
  registerWorkspaceToolbar,
  onOpenPort,
}: {
  registerWorkspaceToolbar?: RegisterWorkspaceToolbar;
  onOpenPort?: (portId: string) => void;
} = {}) {
  const [rows, setRows] = useState<PortListRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<Filters>({});
  const [find, setFind] = useState("");
  const [selectedKey, setSelectedKey] = useState<string | undefined>();
  const columns = useResizableColumns(BASE_COLUMNS);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    listPorts()
      .then((items) => {
        if (!alive) return;
        const nextRows = items.map(toPortRow);
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

  const countries = useMemo(() => uniqueValues(rows, "country"), [rows]);
  const portTypes = useMemo(() => uniqueValues(rows, "portType"), [rows]);
  const statuses = useMemo(() => uniqueValues(rows, "status"), [rows]);
  const timeZones = useMemo(() => uniqueValues(rows, "timeZone"), [rows]);

  const filteredRows = useMemo(() => {
    const query = find.trim().toLowerCase();
    return rows.filter((row) => {
      if (filters.country && row.country !== filters.country) return false;
      if (filters.portType && row.portType !== filters.portType) return false;
      if (filters.status && row.status !== filters.status) return false;
      if (filters.timeZone && row.timeZone !== filters.timeZone) return false;
      if (query && !Object.values(row).join(" ").toLowerCase().includes(query)) return false;
      return true;
    });
  }, [filters, find, rows]);

  const selectedRow = useMemo(
    () => rows.find((row) => row.id === selectedKey) ?? filteredRows[0],
    [filteredRows, rows, selectedKey],
  );

  const handleOpen = useCallback(() => {
    if (selectedRow) onOpenPort?.(selectedRow.id);
  }, [onOpenPort, selectedRow]);

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
        <div className="port-list-form flex h-full min-h-0 flex-col bg-white text-black" style={{ fontFamily: VE_FONT_FAMILY, fontSize: 11 }}>
          <ListStyles scope="port-list-form" />
          <div className="shrink-0 border-b border-[#d8e2ea] bg-white px-2 pb-2 pt-1">
            <div className="grid w-full items-end gap-x-2 gap-y-1" style={{ gridTemplateColumns: "200px 200px 200px 150px 250px minmax(0,1fr)" }}>
              <label className="truncate text-[11px] font-semibold text-[#334e63]">Country</label>
              <label className="truncate text-[11px] font-semibold text-[#334e63]">Port Type</label>
              <label className="truncate text-[11px] font-semibold text-[#334e63]">Status</label>
              <label className="truncate text-[11px] font-semibold text-[#334e63]">Time Zone</label>
              <label className="truncate text-[11px] font-semibold text-[#334e63]">Find</label>
              <span />

              <Select size="small" value={filters.country} onChange={setFilter("country")} allowClear placeholder="All" options={toOptions(countries)} />
              <Select size="small" value={filters.portType} onChange={setFilter("portType")} allowClear placeholder="All" options={toOptions(portTypes)} />
              <Select size="small" value={filters.status} onChange={setFilter("status")} allowClear placeholder="All" options={toOptions(statuses)} />
              <Select size="small" value={filters.timeZone} onChange={setFilter("timeZone")} allowClear placeholder="All" options={toOptions(timeZones)} />
              <Input size="small" value={find} onChange={(event) => setFind(event.target.value)} placeholder="Find..." allowClear prefix={<SearchOutlined className="text-[#73808a]" />} />
              <span />
            </div>
          </div>

          <div className="min-h-0 flex-1 overflow-hidden bg-white p-2">
            <Table<PortListRow>
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
                onDoubleClick: () => onOpenPort?.(record.id),
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

function formatCoordinate(value?: number | null) {
  return typeof value === "number" && Number.isFinite(value) ? String(value) : "";
}

function formatUtcOffset(value?: number | null) {
  if (typeof value !== "number" || !Number.isFinite(value)) return "";
  const sign = value < 0 ? "-" : "+";
  const absolute = Math.abs(value);
  const hours = Math.floor(absolute / 60);
  const minutes = absolute % 60;
  return `${sign}${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
}

function formatDateTime(value?: string) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toISOString().slice(0, 16).replace("T", " ");
}

export default PortListForm;
