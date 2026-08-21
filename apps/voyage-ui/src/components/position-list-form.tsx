"use client";

import { useEffect, useMemo, useState } from "react";
import { ConfigProvider, Input, Select, Table, type SelectProps } from "antd";
import type { ColumnsType } from "antd/es/table";
import { SearchOutlined } from "@ant-design/icons";
import { StyleProvider } from "@ant-design/cssinjs";
import {
  createWorkspaceToolbarRegistration,
  type RegisterWorkspaceToolbar,
} from "@/components/workspace/workspaceToolbar";
import { useResizableColumns } from "@/components/voyage-estimator/useResizableColumns";
import { VE_FONT_FAMILY, veTheme } from "@/components/voyage-estimator/theme";

interface PositionListRow {
  key: string;
  positionId: string;
  vesselName: string;
  dwt: string;
  yearBuilt: string;
  openArea: string;
  openDate: string;
  status: string;
  operator: string;
  postedDate: string;
  postedBy: string;
  laycan: string;
}

interface Filters {
  vesselName?: string;
  operator?: string;
  laycan?: string;
  openArea?: string;
  openDate?: string;
  status?: string;
  postedDate?: string;
  postedBy?: string;
}

const POSITION_ROWS: PositionListRow[] = [
  {
    key: "POS-240901",
    positionId: "POS-240901",
    vesselName: "MV Ocean Laurel",
    dwt: "56,821",
    yearBuilt: "2014",
    openArea: "Spore range",
    openDate: "2026-08-24",
    status: "Open",
    operator: "Pacific Basin",
    postedDate: "2026-08-18",
    postedBy: "Admin",
    laycan: "24-27 Aug",
  },
  {
    key: "POS-240902",
    positionId: "POS-240902",
    vesselName: "MV Baltic Wind",
    dwt: "38,500",
    yearBuilt: "2011",
    openArea: "ECSA",
    openDate: "2026-08-27",
    status: "Open",
    operator: "Oldendorff",
    postedDate: "2026-08-19",
    postedBy: "Helen",
    laycan: "27-30 Aug",
  },
  {
    key: "POS-240903",
    positionId: "POS-240903",
    vesselName: "MV Green Cedar",
    dwt: "63,250",
    yearBuilt: "2019",
    openArea: "North China",
    openDate: "2026-08-29",
    status: "Prompt",
    operator: "C Transport",
    postedDate: "2026-08-19",
    postedBy: "Admin",
    laycan: "29-31 Aug",
  },
  {
    key: "POS-240904",
    positionId: "POS-240904",
    vesselName: "MV Eastern Pearl",
    dwt: "81,900",
    yearBuilt: "2016",
    openArea: "Arabian Gulf",
    openDate: "2026-09-02",
    status: "On subs",
    operator: "K Line",
    postedDate: "2026-08-20",
    postedBy: "James",
    laycan: "01-03 Sep",
  },
  {
    key: "POS-240905",
    positionId: "POS-240905",
    vesselName: "MV Blue Horizon",
    dwt: "34,780",
    yearBuilt: "2009",
    openArea: "Med / Black Sea",
    openDate: "2026-09-05",
    status: "Open",
    operator: "Norden",
    postedDate: "2026-08-20",
    postedBy: "Nina",
    laycan: "04-06 Sep",
  },
];

const BASE_COLUMNS: ColumnsType<PositionListRow> = [
  {
    title: "Position ID",
    dataIndex: "positionId",
    key: "positionId",
    width: 95,
    render: (value) => <span className="font-semibold text-[#0e5d80]">{value}</span>,
  },
  { title: "Vessel Name", dataIndex: "vesselName", key: "vesselName", width: 120 },
  { title: "DWT", dataIndex: "dwt", key: "dwt", width: 85 },
  { title: "Year Built", dataIndex: "yearBuilt", key: "yearBuilt", width: 90 },
  { title: "Open area", dataIndex: "openArea", key: "openArea", width: 150 },
  { title: "Open date", dataIndex: "openDate", key: "openDate", width: 95 },
  { title: "Status", dataIndex: "status", key: "status", width: 80 },
  { title: "Operator", dataIndex: "operator", key: "operator", width: 150 },
  { title: "Posted Date", dataIndex: "postedDate", key: "postedDate", width: 95 },
  { title: "Posted by", dataIndex: "postedBy", key: "postedBy", width: 120 },
];

function uniqueValues(rows: PositionListRow[], field: keyof PositionListRow) {
  return Array.from(new Set(rows.map((row) => String(row[field] ?? "").trim()).filter(Boolean))).sort(
    (a, b) => a.localeCompare(b),
  );
}

export function PositionListForm({
  registerWorkspaceToolbar,
}: {
  registerWorkspaceToolbar?: RegisterWorkspaceToolbar;
} = {}) {
  const [rows] = useState<PositionListRow[]>(POSITION_ROWS);
  const [filters, setFilters] = useState<Filters>({});
  const [find, setFind] = useState("");
  const [selectedKey, setSelectedKey] = useState<string | undefined>(POSITION_ROWS[0]?.positionId);
  const columns = useResizableColumns(BASE_COLUMNS);

  useEffect(() => {
    registerWorkspaceToolbar?.(
      createWorkspaceToolbarRegistration({
        hasSheet: true,
        actions: {
          onUndo: () => {
            setFilters({});
            setFind("");
          },
        },
      }),
    );
  }, [registerWorkspaceToolbar]);

  const vesselNames = useMemo(() => uniqueValues(rows, "vesselName"), [rows]);
  const operators = useMemo(() => uniqueValues(rows, "operator"), [rows]);
  const laycans = useMemo(() => uniqueValues(rows, "laycan"), [rows]);
  const openAreas = useMemo(() => uniqueValues(rows, "openArea"), [rows]);
  const openDates = useMemo(() => uniqueValues(rows, "openDate"), [rows]);
  const statuses = useMemo(() => uniqueValues(rows, "status"), [rows]);
  const postedDates = useMemo(() => uniqueValues(rows, "postedDate"), [rows]);
  const postedBy = useMemo(() => uniqueValues(rows, "postedBy"), [rows]);

  const filteredRows = useMemo(() => {
    const query = find.trim().toLowerCase();
    return rows.filter((row) => {
      if (filters.vesselName && row.vesselName !== filters.vesselName) return false;
      if (filters.operator && row.operator !== filters.operator) return false;
      if (filters.laycan && row.laycan !== filters.laycan) return false;
      if (filters.openArea && row.openArea !== filters.openArea) return false;
      if (filters.openDate && row.openDate !== filters.openDate) return false;
      if (filters.status && row.status !== filters.status) return false;
      if (filters.postedDate && row.postedDate !== filters.postedDate) return false;
      if (filters.postedBy && row.postedBy !== filters.postedBy) return false;
      if (query && !Object.values(row).join(" ").toLowerCase().includes(query)) return false;
      return true;
    });
  }, [filters, find, rows]);

  const selectedRow = useMemo(
    () => rows.find((row) => row.positionId === selectedKey) ?? filteredRows[0],
    [filteredRows, rows, selectedKey],
  );

  const setFilter = (key: keyof Filters) => (value: string | undefined) =>
    setFilters((current) => ({ ...current, [key]: value }));
  const toOptions = (values: string[]): SelectProps["options"] =>
    values.map((value) => ({ label: value, value }));

  return (
    <StyleProvider hashPriority="high">
      <ConfigProvider theme={veTheme}>
        <div className="position-list-form flex h-full min-h-0 flex-col bg-white text-black" style={{ fontFamily: VE_FONT_FAMILY, fontSize: 11 }}>
          <ListStyles scope="position-list-form" />
          <div className="shrink-0 border-b border-[#d8e2ea] bg-white px-2 pb-2 pt-1">
            <div
              className="grid w-full items-end gap-x-2 gap-y-1"
              style={{ gridTemplateColumns: "120px 150px 100px 150px 95px 90px 95px 120px minmax(180px,1fr)" }}
            >
              <label className="truncate text-[11px] font-semibold text-[#334e63]">Vessel Name</label>
              <label className="truncate text-[11px] font-semibold text-[#334e63]">Operator</label>
              <label className="truncate text-[11px] font-semibold text-[#334e63]">Laycan</label>
              <label className="truncate text-[11px] font-semibold text-[#334e63]">Open area</label>
              <label className="truncate text-[11px] font-semibold text-[#334e63]">Open date</label>
              <label className="truncate text-[11px] font-semibold text-[#334e63]">Status</label>
              <label className="truncate text-[11px] font-semibold text-[#334e63]">Posted date</label>
              <label className="truncate text-[11px] font-semibold text-[#334e63]">Posted by</label>
              <label className="truncate text-[11px] font-semibold text-[#334e63]">Search</label>

              <Select size="small" value={filters.vesselName} onChange={setFilter("vesselName")} allowClear placeholder="All" options={toOptions(vesselNames)} />
              <Select size="small" value={filters.operator} onChange={setFilter("operator")} allowClear placeholder="All" options={toOptions(operators)} />
              <Select size="small" value={filters.laycan} onChange={setFilter("laycan")} allowClear placeholder="All" options={toOptions(laycans)} />
              <Select size="small" value={filters.openArea} onChange={setFilter("openArea")} allowClear placeholder="All" options={toOptions(openAreas)} />
              <Select size="small" value={filters.openDate} onChange={setFilter("openDate")} allowClear placeholder="All" options={toOptions(openDates)} />
              <Select size="small" value={filters.status} onChange={setFilter("status")} allowClear placeholder="All" options={toOptions(statuses)} />
              <Select size="small" value={filters.postedDate} onChange={setFilter("postedDate")} allowClear placeholder="All" options={toOptions(postedDates)} />
              <Select size="small" value={filters.postedBy} onChange={setFilter("postedBy")} allowClear placeholder="All" options={toOptions(postedBy)} />
              <Input size="small" value={find} onChange={(event) => setFind(event.target.value)} placeholder="Search..." allowClear prefix={<SearchOutlined className="text-[#73808a]" />} />
            </div>
          </div>

          <div className="min-h-0 flex-1 overflow-hidden bg-white p-2">
            <Table<PositionListRow>
              size="small"
              columns={columns}
              dataSource={filteredRows}
              bordered
              pagination={false}
              tableLayout="fixed"
              scroll={{ y: "calc(100vh - 224px)" }}
              rowClassName={(record) => (record.positionId === selectedRow?.positionId ? "ve-row-selected" : "")}
              onRow={(record) => ({
                onClick: () => setSelectedKey(record.positionId),
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

export default PositionListForm;
