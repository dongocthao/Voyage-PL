'use client';

import { Card, Col, Row, Statistic, Table, Tag, Typography } from 'antd';
import type { ColumnsType } from 'antd/es/table';

type VoyageRow = {
  key: string;
  vessel: string;
  route: string;
  status: string;
  profit: number;
};

const rows: VoyageRow[] = [
  { key: '1', vessel: 'MV Horizon', route: 'Singapore - Yokohama', status: 'estimating', profit: 184500 },
  { key: '2', vessel: 'MV Meridian', route: 'Vung Tau - Shanghai', status: 'fixed', profit: 126800 },
  { key: '3', vessel: 'MV Pacific Star', route: 'Kalimantan - Chennai', status: 'draft', profit: 0 },
];

const columns: ColumnsType<VoyageRow> = [
  { title: 'Vessel', dataIndex: 'vessel' },
  { title: 'Route', dataIndex: 'route' },
  { title: 'Status', dataIndex: 'status', render: (value) => <Tag>{value}</Tag> },
  {
    title: 'Estimated P&L',
    dataIndex: 'profit',
    align: 'right',
    render: (value) => Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value),
  },
];

export default function Home() {
  return (
    <main className="min-h-screen p-6">
      <Typography.Title level={2}>Voyage P&L</Typography.Title>
      <Row gutter={[16, 16]} className="mb-4">
        <Col xs={24} md={8}>
          <Card>
            <Statistic title="Open Voyages" value={18} />
          </Card>
        </Col>
        <Col xs={24} md={8}>
          <Card>
            <Statistic title="Monthly Estimated Profit" value={842300} prefix="$" />
          </Card>
        </Col>
        <Col xs={24} md={8}>
          <Card>
            <Statistic title="Bunker Exposure" value={2940} suffix="MT" />
          </Card>
        </Col>
      </Row>
      <Card title="Voyage Estimates">
        <Table columns={columns} dataSource={rows} pagination={false} />
      </Card>
    </main>
  );
}
