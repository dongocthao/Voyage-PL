"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { ConfigProvider, Input, Select, Table, type SelectProps } from "antd";
import type { ColumnsType } from "antd/es/table";
import { StyleProvider } from "@ant-design/cssinjs";
import { SearchOutlined } from "@ant-design/icons";
import { fetchOperationList, type OperationListRow } from "@/lib/api/operationList";
import {
  createWorkspaceToolbarRegistration,
  type RegisterWorkspaceToolbar,
} from "@/components/workspace/workspaceToolbar";
import { useResizableColumns } from "@/components/voyage-estimator/useResizableColumns";
import { veTheme, VE_FONT_FAMILY } from "@/components/voyage-estimator/theme";

type OperationType = "Voyage Charter" | "Time Charter" | "Cargo Relet";
type OperationStatus = "Draft" | "Estimated" | "Fixed" | "Failed" | "Cancelled";

interface OperationRow {
  key: string;
  id: string;
  year: string;
  type: OperationType;
  vessel: string;
  voyage: string;
  charterer: string;
  operator: string;
  status: OperationStatus;
  cargo: string;
  qty: string;
  loadPort: string;
  dischargePort: string;
  commenced: string;
  completed: string;
  updated: string;
}

interface Filters {
  year?: string;
  type?: string;
  vessel?: string;
  charterer?: string;
  operator?: string;
  status?: string;
}

const OPERATION_TYPES: OperationType[] = ["Voyage Charter", "Time Charter", "Cargo Relet"];
const STATUSES: OperationStatus[] = ["Draft", "Estimated", "Fixed", "Failed", "Cancelled"];

const BASE_COLUMNS: ColumnsType<OperationRow> = [
  {
    title: "Operation Id",
    dataIndex: "id",
    key: "id",
    width: 86,
    render: (value) => <span className="font-semibold text-[#0e5d80]">{value}</span>,
  },
  { title: "Operation Type", dataIndex: "type", key: "type", width: 104 },
  { title: "Vessel", dataIndex: "vessel", key: "vessel", width: 116 },
  { title: "Voyage No", dataIndex: "voyage", key: "voyage", width: 68 },
  { title: "Charterer", dataIndex: "charterer", key: "charterer", width: 116 },
  {
    title: "Status",
    dataIndex: "status",
    key: "status",
    width: 72,
    className: "estimate-status-column",
    onCell: (record) => ({
      className: `estimate-status-cell estimate-status-${record.status.toLowerCase()}`,
    }),
    render: (status: OperationStatus) => <span>{status}</span>,
  },
  { title: "Cargo", dataIndex: "cargo", key: "cargo", width: 96 },
  { title: "Quantity", dataIndex: "qty", key: "qty", width: 92 },
  { title: "Load/Delivery port", dataIndex: "loadPort", key: "loadPort", width: 120 },
  { title: "Discharge/Redelivery port", dataIndex: "dischargePort", key: "dischargePort", width: 120 },
  { title: "Commenced", dataIndex: "commenced", key: "commenced", width: 78 },
  { title: "Completed", dataIndex: "completed", key: "completed", width: 78 },
];

function toOperationRow(row: OperationListRow): OperationRow {
  return {
    key: row.operationId,
    id: row.operationId,
    year: getBusinessYear(row),
    type: row.operationType,
    vessel: row.vessel,
    voyage: row.voyageNo,
    charterer: row.charterer,
    operator: row.operator,
    status: row.status,
    cargo: row.cargo,
    qty: row.quantity,
    loadPort: row.loadPort,
    dischargePort: row.dischargePort,
    commenced: row.commenced,
    completed: row.completed,
    updated: row.lastUpdated,
  };
}

function getBusinessYear(row: OperationListRow) {
  return (
    row.operationId.match(/\b(20\d{2})\b/)?.[1] ??
    row.commenced.match(/^\d{4}/)?.[0] ??
    row.lastUpdated.match(/^\d{4}/)?.[0] ??
    ""
  );
}

function uniqueValues(rows: OperationRow[], field: keyof OperationRow) {
  return Array.from(new Set(rows.map((row) => String(row[field] ?? "")).filter(Boolean))).sort((a, b) =>
    field === "year" ? b.localeCompare(a) : a.localeCompare(b),
  );
}

export function OperationListForm({
  registerWorkspaceToolbar,
  onOpenOperation,
}: {
  registerWorkspaceToolbar?: RegisterWorkspaceToolbar;
  onOpenOperation?: (operationId: string) => void;
} = {}) {
  const [rows, setRows] = useState<OperationRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<Filters>({});
  const [find, setFind] = useState("");
  const [selectedKey, setSelectedKey] = useState<string | undefined>();
  const columns = useResizableColumns(BASE_COLUMNS);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    fetchOperationList()
      .then((items) => {
        if (!alive) return;
        const nextRows = items.map(toOperationRow);
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

  const years = useMemo(() => uniqueValues(rows, "year"), [rows]);
  const vessels = useMemo(() => uniqueValues(rows, "vessel"), [rows]);
  const charterers = useMemo(() => uniqueValues(rows, "charterer"), [rows]);
  const operators = useMemo(() => uniqueValues(rows, "operator"), [rows]);

  const filteredRows = useMemo(() => {
    return rows.filter((row) => {
      if (filters.year && row.year !== filters.year) return false;
      if (filters.type && row.type !== filters.type) return false;
      if (filters.vessel && row.vessel !== filters.vessel) return false;
      if (filters.charterer && row.charterer !== filters.charterer) return false;
      if (filters.operator && row.operator !== filters.operator) return false;
      if (filters.status && row.status !== filters.status) return false;
      if (find.trim()) {
        const query = find.trim().toLowerCase();
        if (!Object.values(row).join(" ").toLowerCase().includes(query)) return false;
      }
      return true;
    });
  }, [filters, find, rows]);

  const selectedRow = useMemo(
    () => rows.find((row) => row.id === selectedKey) ?? filteredRows[0],
    [filteredRows, rows, selectedKey],
  );

  const handleOpen = useCallback(() => {
    if (!selectedRow) return;
    onOpenOperation?.(selectedRow.id);
  }, [onOpenOperation, selectedRow]);

  useEffect(() => {
    registerWorkspaceToolbar?.(
      createWorkspaceToolbarRegistration({
        hasSheet: true,
        hasEstimate: Boolean(selectedRow),
        actions: {
          onOpen: handleOpen,
          onUndo: () => setFilters({}),
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
        <div
          className="operation-list-form flex h-full min-h-0 flex-col bg-white text-black"
          style={{ fontFamily: VE_FONT_FAMILY, fontSize: 11 }}
        >
          <style>
            {`
              .operation-list-form .ant-table-thead > tr > th {
                height: 30px !important;
                padding-top: 6px !important;
                padding-bottom: 6px !important;
                border-inline-end: 1px solid #cbd8e2 !important;
                border-bottom: 1px solid #cbd8e2 !important;
              }

              .operation-list-form .ant-table-tbody > tr > td,
              .operation-list-form .ant-table-summary > tr > td {
                border-inline-end: 1px solid #d8e2ea !important;
                border-bottom: 1px solid #d8e2ea !important;
              }

              .operation-list-form .ant-table-tbody > tr > td:last-child,
              .operation-list-form .ant-table-thead > tr > th:last-child,
              .operation-list-form .ant-table-summary > tr > td:last-child {
                border-inline-end: 0 !important;
              }

              .operation-list-form .estimate-status-cell {
                text-align: center;
                font-weight: 600;
              }

              .operation-list-form .ant-table-tbody > tr > td.estimate-status-draft {
                background: #ffe9c7 !important;
                color: #8a4f00;
              }

              .operation-list-form .ant-table-tbody > tr > td.estimate-status-estimated {
                background: #dceeff !important;
                color: #0e5d80;
              }

              .operation-list-form .ant-table-tbody > tr > td.estimate-status-fixed {
                background: #ddf4d7 !important;
                color: #236b1d;
              }

              .operation-list-form .ant-table-tbody > tr > td.estimate-status-failed {
                background: #eadcff !important;
                color: #5d2c9b;
              }

              .operation-list-form .ant-table-tbody > tr > td.estimate-status-cancelled {
                background: #ffdada !important;
                color: #9a1f1f;
              }

              .operation-list-form .ant-table-tbody > tr.ve-row-selected > td.estimate-status-draft,
              .operation-list-form .ant-table-tbody > tr.ve-row-selected > td.estimate-status-estimated,
              .operation-list-form .ant-table-tbody > tr.ve-row-selected > td.estimate-status-fixed,
              .operation-list-form .ant-table-tbody > tr.ve-row-selected > td.estimate-status-failed,
              .operation-list-form .ant-table-tbody > tr.ve-row-selected > td.estimate-status-cancelled {
                box-shadow: inset 0 0 0 1px #7aa8bd;
              }

              .operation-list-form .ant-table-summary > tr > td {
                height: 27px;
                padding: 4px 8px !important;
              }
            `}
          </style>
          <div className="shrink-0 border-b border-[#d8e2ea] bg-white px-2 pb-2 pt-1">
            <div
              className="grid w-full items-end gap-x-2 gap-y-1"
              style={{
                gridTemplateColumns:
                  "72px 126px 186px 300px 292px 104px minmax(90px,1fr)",
              }}
            >
              <label className="truncate text-[11px] font-semibold text-[#334e63]">Year</label>
              <label className="truncate text-[11px] font-semibold text-[#334e63]">Operation Type</label>
              <label className="truncate text-[11px] font-semibold text-[#334e63]">Vessel</label>
              <label className="truncate text-[11px] font-semibold text-[#334e63]">Charterers</label>
              <label className="truncate text-[11px] font-semibold text-[#334e63]">Operator</label>
              <label className="truncate text-[11px] font-semibold text-[#334e63]">Status</label>
              <label className="truncate text-[11px] font-semibold text-[#334e63]">Find</label>

              <Select size="small" value={filters.year} onChange={setFilter("year")} allowClear placeholder="All" options={toOptions(years)} />
              <Select size="small" value={filters.type} onChange={setFilter("type")} allowClear placeholder="All" options={toOptions(OPERATION_TYPES)} />
              <Select size="small" value={filters.vessel} onChange={setFilter("vessel")} allowClear placeholder="All" options={toOptions(vessels)} />
              <Select size="small" value={filters.charterer} onChange={setFilter("charterer")} allowClear placeholder="All" options={toOptions(charterers)} />
              <Select size="small" value={filters.operator} onChange={setFilter("operator")} allowClear placeholder="All" options={toOptions(operators)} />
              <Select size="small" value={filters.status} onChange={setFilter("status")} allowClear placeholder="All" options={toOptions(STATUSES)} />
              <Input
                size="small"
                value={find}
                onChange={(event) => setFind(event.target.value)}
                placeholder="Find..."
                allowClear
                prefix={<SearchOutlined className="text-[#73808a]" />}
              />
            </div>
          </div>

          <div className="min-h-0 flex-1 overflow-hidden bg-white p-2">
            <Table<OperationRow>
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
                onDoubleClick: handleOpen,
              })}
              summary={() => (
                <Table.Summary fixed>
                  <Table.Summary.Row>
                    <Table.Summary.Cell index={0} colSpan={9}>
                      <div className="flex min-w-0 items-center gap-4 text-[11px] text-[#0e4f68]">
                        <span>
                          Operation ID: <strong>{selectedRow?.id ?? ""}</strong>
                        </span>
                        <span>
                          Vessel Name: <strong>{selectedRow?.vessel ?? ""}</strong>
                        </span>
                        <span>
                          Voyage No: <strong>{selectedRow?.voyage ?? ""}</strong>
                        </span>
                        <span>
                          Operator: <strong>{selectedRow?.operator ?? ""}</strong>
                        </span>
                        <span>
                          Last Update: <strong>{selectedRow?.updated ?? ""}</strong>
                        </span>
                      </div>
                    </Table.Summary.Cell>
                    <Table.Summary.Cell index={9} colSpan={3}>
                      <div className="text-right text-[11px] text-[#0e4f68]">
                        Current view <strong>{filteredRows.length}</strong> of <strong>{rows.length}</strong>
                      </div>
                    </Table.Summary.Cell>
                  </Table.Summary.Row>
                </Table.Summary>
              )}
            />
          </div>
        </div>
      </ConfigProvider>
    </StyleProvider>
  );
}

export default OperationListForm;
