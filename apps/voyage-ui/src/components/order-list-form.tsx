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

interface OrderListRow {
  key: string;
  orderId: string;
  accountName: string;
  orderType: string;
  laycan: string;
  loadingDeliveryPlace: string;
  dischargeRedeliveryPlace: string;
  status: string;
  cargoDescription: string;
  brokerage: string;
  postedDate: string;
  postedBy: string;
}

interface Filters {
  accountName?: string;
  orderType?: string;
  laycan?: string;
  status?: string;
  brokerage?: string;
  postedDate?: string;
  postedBy?: string;
}

const ORDER_ROWS: OrderListRow[] = [
  {
    key: "ORD-240801",
    orderId: "ORD-240801",
    accountName: "Cargill Ocean",
    orderType: "Cargo",
    laycan: "21-25 Aug",
    loadingDeliveryPlace: "Santos / Brazil",
    dischargeRedeliveryPlace: "Qingdao / China",
    status: "Open",
    cargoDescription: "Soybeans in bulk 60,000 mt 10% moloo",
    brokerage: "Arrow Shipping",
    postedDate: "2026-08-18",
    postedBy: "Admin",
  },
  {
    key: "ORD-240802",
    orderId: "ORD-240802",
    accountName: "Bunge Marine",
    orderType: "COA",
    laycan: "24-28 Aug",
    loadingDeliveryPlace: "New Orleans / USA",
    dischargeRedeliveryPlace: "Veracruz / Mexico",
    status: "Quoted",
    cargoDescription: "Corn in bulk about 35,000 mt",
    brokerage: "Atlantic Brokers",
    postedDate: "2026-08-18",
    postedBy: "Helen",
  },
  {
    key: "ORD-240803",
    orderId: "ORD-240803",
    accountName: "Trafigura Pte",
    orderType: "Spot",
    laycan: "26-30 Aug",
    loadingDeliveryPlace: "Singapore",
    dischargeRedeliveryPlace: "Chittagong / Bangladesh",
    status: "Open",
    cargoDescription: "Steel coils 18,000 mt underdeck only",
    brokerage: "Sealink",
    postedDate: "2026-08-19",
    postedBy: "Admin",
  },
  {
    key: "ORD-240804",
    orderId: "ORD-240804",
    accountName: "Louis Dreyfus",
    orderType: "Cargo",
    laycan: "01-05 Sep",
    loadingDeliveryPlace: "Rosario / Argentina",
    dischargeRedeliveryPlace: "Alexandria / Egypt",
    status: "Fixed",
    cargoDescription: "Wheat in bulk 42,500 mt 5% more or less",
    brokerage: "Blue Ocean",
    postedDate: "2026-08-20",
    postedBy: "James",
  },
  {
    key: "ORD-240805",
    orderId: "ORD-240805",
    accountName: "ADM Chartering",
    orderType: "Spot",
    laycan: "03-06 Sep",
    loadingDeliveryPlace: "Vung Tau / Vietnam",
    dischargeRedeliveryPlace: "Manila / Philippines",
    status: "Closed",
    cargoDescription: "Clinker 28,000 mt basis one safe berth",
    brokerage: "Arrow Shipping",
    postedDate: "2026-08-20",
    postedBy: "Nina",
  },
];

const BASE_COLUMNS: ColumnsType<OrderListRow> = [
  {
    title: "Order ID",
    dataIndex: "orderId",
    key: "orderId",
    width: 95,
    render: (value) => <span className="font-semibold text-[#0e5d80]">{value}</span>,
  },
  { title: "Account Name", dataIndex: "accountName", key: "accountName", width: 150 },
  { title: "Order Type", dataIndex: "orderType", key: "orderType", width: 80 },
  { title: "Laycan", dataIndex: "laycan", key: "laycan", width: 100 },
  {
    title: "Loading/Delivery Place",
    dataIndex: "loadingDeliveryPlace",
    key: "loadingDeliveryPlace",
    width: 165,
  },
  {
    title: "Discharge/Redelivery place",
    dataIndex: "dischargeRedeliveryPlace",
    key: "dischargeRedeliveryPlace",
    width: 170,
  },
  { title: "Status", dataIndex: "status", key: "status", width: 80 },
  { title: "Cargo description", dataIndex: "cargoDescription", key: "cargoDescription", width: 210 },
  { title: "Brokerage", dataIndex: "brokerage", key: "brokerage", width: 150 },
  { title: "Posted date", dataIndex: "postedDate", key: "postedDate", width: 95 },
  { title: "Posted by", dataIndex: "postedBy", key: "postedBy", width: 120 },
];

function uniqueValues(rows: OrderListRow[], field: keyof OrderListRow) {
  return Array.from(new Set(rows.map((row) => String(row[field] ?? "").trim()).filter(Boolean))).sort(
    (a, b) => a.localeCompare(b),
  );
}

export function OrderListForm({
  registerWorkspaceToolbar,
}: {
  registerWorkspaceToolbar?: RegisterWorkspaceToolbar;
} = {}) {
  const [rows] = useState<OrderListRow[]>(ORDER_ROWS);
  const [filters, setFilters] = useState<Filters>({});
  const [find, setFind] = useState("");
  const [selectedKey, setSelectedKey] = useState<string | undefined>(ORDER_ROWS[0]?.orderId);
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

  const accountNames = useMemo(() => uniqueValues(rows, "accountName"), [rows]);
  const orderTypes = useMemo(() => uniqueValues(rows, "orderType"), [rows]);
  const laycans = useMemo(() => uniqueValues(rows, "laycan"), [rows]);
  const statuses = useMemo(() => uniqueValues(rows, "status"), [rows]);
  const brokerages = useMemo(() => uniqueValues(rows, "brokerage"), [rows]);
  const postedDates = useMemo(() => uniqueValues(rows, "postedDate"), [rows]);
  const postedBy = useMemo(() => uniqueValues(rows, "postedBy"), [rows]);

  const filteredRows = useMemo(() => {
    const query = find.trim().toLowerCase();
    return rows.filter((row) => {
      if (filters.accountName && row.accountName !== filters.accountName) return false;
      if (filters.orderType && row.orderType !== filters.orderType) return false;
      if (filters.laycan && row.laycan !== filters.laycan) return false;
      if (filters.status && row.status !== filters.status) return false;
      if (filters.brokerage && row.brokerage !== filters.brokerage) return false;
      if (filters.postedDate && row.postedDate !== filters.postedDate) return false;
      if (filters.postedBy && row.postedBy !== filters.postedBy) return false;
      if (query && !Object.values(row).join(" ").toLowerCase().includes(query)) return false;
      return true;
    });
  }, [filters, find, rows]);

  const selectedRow = useMemo(
    () => rows.find((row) => row.orderId === selectedKey) ?? filteredRows[0],
    [filteredRows, rows, selectedKey],
  );

  const setFilter = (key: keyof Filters) => (value: string | undefined) =>
    setFilters((current) => ({ ...current, [key]: value }));
  const toOptions = (values: string[]): SelectProps["options"] =>
    values.map((value) => ({ label: value, value }));

  return (
    <StyleProvider hashPriority="high">
      <ConfigProvider theme={veTheme}>
        <div className="order-list-form flex h-full min-h-0 flex-col bg-white text-black" style={{ fontFamily: VE_FONT_FAMILY, fontSize: 11 }}>
          <ListStyles scope="order-list-form" />
          <div className="shrink-0 border-b border-[#d8e2ea] bg-white px-2 pb-2 pt-1">
            <div
              className="grid w-full items-end gap-x-2 gap-y-1"
              style={{ gridTemplateColumns: "150px 80px 100px 100px 150px 95px 120px minmax(180px,1fr)" }}
            >
              <label className="truncate text-[11px] font-semibold text-[#334e63]">Account Name</label>
              <label className="truncate text-[11px] font-semibold text-[#334e63]">Order Type</label>
              <label className="truncate text-[11px] font-semibold text-[#334e63]">Laycan</label>
              <label className="truncate text-[11px] font-semibold text-[#334e63]">Status</label>
              <label className="truncate text-[11px] font-semibold text-[#334e63]">Brokerage</label>
              <label className="truncate text-[11px] font-semibold text-[#334e63]">Posted date</label>
              <label className="truncate text-[11px] font-semibold text-[#334e63]">Posted by</label>
              <label className="truncate text-[11px] font-semibold text-[#334e63]">Search</label>

              <Select size="small" value={filters.accountName} onChange={setFilter("accountName")} allowClear placeholder="All" options={toOptions(accountNames)} />
              <Select size="small" value={filters.orderType} onChange={setFilter("orderType")} allowClear placeholder="All" options={toOptions(orderTypes)} />
              <Select size="small" value={filters.laycan} onChange={setFilter("laycan")} allowClear placeholder="All" options={toOptions(laycans)} />
              <Select size="small" value={filters.status} onChange={setFilter("status")} allowClear placeholder="All" options={toOptions(statuses)} />
              <Select size="small" value={filters.brokerage} onChange={setFilter("brokerage")} allowClear placeholder="All" options={toOptions(brokerages)} />
              <Select size="small" value={filters.postedDate} onChange={setFilter("postedDate")} allowClear placeholder="All" options={toOptions(postedDates)} />
              <Select size="small" value={filters.postedBy} onChange={setFilter("postedBy")} allowClear placeholder="All" options={toOptions(postedBy)} />
              <Input size="small" value={find} onChange={(event) => setFind(event.target.value)} placeholder="Search..." allowClear prefix={<SearchOutlined className="text-[#73808a]" />} />
            </div>
          </div>

          <div className="min-h-0 flex-1 overflow-hidden bg-white p-2">
            <Table<OrderListRow>
              size="small"
              columns={columns}
              dataSource={filteredRows}
              bordered
              pagination={false}
              tableLayout="fixed"
              scroll={{ y: "calc(100vh - 224px)" }}
              rowClassName={(record) => (record.orderId === selectedRow?.orderId ? "ve-row-selected" : "")}
              onRow={(record) => ({
                onClick: () => setSelectedKey(record.orderId),
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

export default OrderListForm;
