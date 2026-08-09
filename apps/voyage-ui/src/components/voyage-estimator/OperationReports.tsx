import { Modal, Button, Input, Checkbox, Select } from "antd";
import { Fragment } from "react";
import type { ReactNode } from "react";
import {
  PlusCircleOutlined,
  MinusCircleOutlined,
  CalendarOutlined,
  DollarOutlined,
} from "@ant-design/icons";
import { VE_COLORS } from "./theme";
import { arrivalReport, departureReport, FUEL_TYPES } from "./operationData";

const B = { borderColor: VE_COLORS.border };
const HD: React.CSSProperties = {
  background: VE_COLORS.headerBg,
  color: VE_COLORS.headerText,
  ...B,
};
const cell: React.CSSProperties = { height: 20, fontSize: 11, borderRadius: 0, padding: "0 4px" };

/** Nhãn trái + nội dung phải */
function Row({
  label,
  children,
  align = "center",
}: {
  label?: ReactNode;
  children: ReactNode;
  align?: "center" | "start";
}) {
  return (
    <div
      className="mb-2 flex gap-3"
      style={{ alignItems: align === "center" ? "center" : "flex-start" }}
    >
      <div className="w-[135px] shrink-0 font-bold text-[11px]">{label}</div>
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}

/** Bảng 3 loại nhiên liệu + 2 cột trống như ảnh gốc */
function FuelGrid({ values, editable }: { values: string[]; editable?: boolean }) {
  return (
    <div className="grid border" style={{ ...B, gridTemplateColumns: "repeat(5, 1fr)" }}>
      {FUEL_TYPES.map((t) => (
        <div key={t} className="border-b border-r px-1 py-[3px] text-center font-medium" style={HD}>
          {t}
        </div>
      ))}
      <div className="border-b border-r px-1 py-[3px]" style={HD} />
      <div className="border-b px-1 py-[3px]" style={HD} />
      {values.map((v, i) => (
        <div
          key={i}
          className="border-r"
          style={{ ...B, background: editable ? VE_COLORS.editable : undefined }}
        >
          <Input defaultValue={v} variant="borderless" style={{ ...cell, textAlign: "right" }} />
        </div>
      ))}
      <div className="border-r" style={{ ...B, background: "#F5F7FA" }} />
      <div style={{ background: "#F5F7FA" }} />
    </div>
  );
}

/** Bảng Supply (Type / Account / Quantity / Unit Price / Price) */
function SupplyGrid({ disabled }: { disabled?: boolean }) {
  return (
    <div className="border" style={B}>
      <div className="grid" style={{ gridTemplateColumns: "60px 1fr 1fr 1fr 1fr 44px" }}>
        {["Type", "Account", "Quantity", "Unit Price", "Price", ""].map((h) => (
          <div
            key={h}
            className="border-b border-r px-1 py-[3px] text-center font-medium last:border-r-0"
            style={HD}
          >
            {h}
          </div>
        ))}
        {FUEL_TYPES.map((t) => (
          <Fragment key={t}>
            <div
              key={`${t}-t`}
              className="border-b border-r px-1 py-[3px]"
              style={{ ...B, opacity: disabled ? 0.45 : 1 }}
            >
              {t}
            </div>
            <div key={`${t}-a`} className="border-b border-r" style={B}>
              <Input disabled={disabled} variant="borderless" style={cell} />
            </div>
            <div key={`${t}-q`} className="border-b border-r" style={B}>
              <Input
                disabled={disabled}
                variant="borderless"
                style={{ ...cell, textAlign: "right" }}
              />
            </div>
            <div key={`${t}-u`} className="flex items-center border-b border-r" style={B}>
              <DollarOutlined style={{ color: "#FFB300", fontSize: 11, marginLeft: 4 }} />
              <Input
                disabled={disabled}
                variant="borderless"
                style={{ ...cell, textAlign: "right" }}
              />
            </div>
            <div
              key={`${t}-p`}
              className="border-b border-r"
              style={{ ...B, background: VE_COLORS.editable }}
            >
              <Input
                disabled={disabled}
                defaultValue="0.00"
                variant="borderless"
                style={{ ...cell, textAlign: "right" }}
              />
            </div>
            <div
              key={`${t}-x`}
              className="flex items-center justify-center gap-1 border-b px-1"
              style={B}
            >
              <PlusCircleOutlined style={{ color: VE_COLORS.headerBg }} />
              <MinusCircleOutlined style={{ color: VE_COLORS.headerBg }} />
            </div>
          </Fragment>
        ))}
      </div>
    </div>
  );
}

function ReportModal({
  open,
  onClose,
  title,
  width,
  footer,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  width: number;
  footer: ReactNode;
  children: ReactNode;
}) {
  return (
    <Modal
      open={open}
      onCancel={onClose}
      title={<span className="text-[12px] font-bold">{title}</span>}
      width={width}
      footer={footer}
      styles={{ body: { paddingTop: 8 } }}
      maskClosable={false}
      destroyOnHidden
    >
      {children}
    </Modal>
  );
}

export function ArrivalReportModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const d = arrivalReport;
  return (
    <ReportModal
      open={open}
      onClose={onClose}
      title={d.portTitle}
      width={700}
      footer={
        <div className="flex items-center justify-between">
          <div className="flex gap-2">
            <Button size="small">Apply Estimation</Button>
            <Button size="small" disabled>
              Reset Estimation
            </Button>
          </div>
          <div className="flex gap-2">
            <Button size="small" type="primary">
              Fix Arrival
            </Button>
            <Button size="small" onClick={onClose}>
              Cancel
            </Button>
          </div>
        </div>
      }
    >
      <Row label="Arrival Time">
        <div className="flex items-center justify-between gap-2">
          <div>
            <div className="flex items-center gap-1 border px-1" style={{ ...B, width: 190 }}>
              <Input defaultValue={d.time} variant="borderless" style={cell} />
              <CalendarOutlined style={{ color: VE_COLORS.titleBar }} />
            </div>
            <div
              className="mt-1 border px-2 py-[2px]"
              style={{ ...B, background: VE_COLORS.editable, width: 190 }}
            >
              {d.note}
            </div>
          </div>
          <Button size="small">Captain Report</Button>
        </div>
      </Row>

      <Row label="Bunker" align="start">
        <div className="mb-1 font-bold">ROB</div>
        <FuelGrid values={d.rob} />

        <div className="mb-1 mt-3 flex items-center gap-2">
          <span className="font-bold">Supply</span>
          <Button size="small">Import from Bunker Simulator</Button>
          <Checkbox className="ml-auto text-[11px]">N/A</Checkbox>
        </div>
        <SupplyGrid />

        <div className="mb-1 mt-3 font-bold">Sea Consumption</div>
        <FuelGrid values={d.seaConsumption} editable />
      </Row>

      <Row label="Actual Distance sailed as per Master's Report" align="start">
        <div className="flex flex-col items-end gap-1">
          <div className="flex items-center gap-2">
            <span>Total</span>
            <Input
              defaultValue={d.totalDistance}
              style={{ ...cell, width: 120, textAlign: "right" }}
            />
            <span className="w-[36px]">Miles</span>
          </div>
          <div className="flex items-center gap-2">
            <span>ECA</span>
            <Input
              defaultValue={d.ecaDistance}
              style={{ ...cell, width: 120, textAlign: "right" }}
            />
            <span className="w-[36px]">Miles</span>
          </div>
        </div>
      </Row>

      <Row label="Av. Speed">
        <div className="flex items-center justify-end gap-2">
          <Input
            defaultValue={d.avSpeed}
            style={{ ...cell, width: 120, textAlign: "right", background: VE_COLORS.editable }}
          />
          <span className="w-[36px]">Knots</span>
        </div>
      </Row>

      <Row label="Remark" align="start">
        <Input.TextArea rows={2} style={{ fontSize: 11 }} />
      </Row>
    </ReportModal>
  );
}

export function DepartureReportModal({
  open,
  onClose,
  onOpenLaytime,
}: {
  open: boolean;
  onClose: () => void;
  onOpenLaytime?: () => void;
}) {
  const d = departureReport;
  return (
    <ReportModal
      open={open}
      onClose={onClose}
      title={d.portTitle}
      width={700}
      footer={
        <div className="flex items-center justify-between">
          <div className="flex gap-2">
            <Button size="small">Apply Estimation</Button>
            <Button size="small" disabled>
              Reset Estimation
            </Button>
          </div>
          <div className="flex gap-2">
            <Button size="small" type="primary">
              Fix Departure
            </Button>
            <Button size="small" onClick={onClose}>
              Cancel
            </Button>
          </div>
        </div>
      }
    >
      <Row label="Departure Time">
        <div className="flex items-center justify-between gap-2">
          <div>
            <div className="flex items-center gap-1 border px-1" style={{ ...B, width: 190 }}>
              <Input defaultValue={d.time} variant="borderless" style={cell} />
              <CalendarOutlined style={{ color: VE_COLORS.titleBar }} />
            </div>
            <div
              className="mt-1 border px-2 py-[2px]"
              style={{ ...B, background: VE_COLORS.editable, width: 190 }}
            >
              {d.note}
            </div>
          </div>
          <div className="flex gap-2">
            <Button size="small" type="primary" ghost>
              Captain Report
            </Button>
            <Button size="small">Import Port SOF</Button>
          </div>
        </div>
      </Row>

      <Row label="Idle / Work Days">
        <div className="grid w-[280px] border" style={{ ...B, gridTemplateColumns: "1fr 1fr" }}>
          <div className="border-b border-r px-1 py-[3px] text-center font-medium" style={HD}>
            Idle
          </div>
          <div className="border-b px-1 py-[3px] text-center font-medium" style={HD}>
            Work
          </div>
          <div className="border-r" style={B}>
            <Input
              defaultValue={d.idle}
              variant="borderless"
              style={{ ...cell, textAlign: "right" }}
            />
          </div>
          <div>
            <Input
              defaultValue={d.work}
              variant="borderless"
              style={{ ...cell, textAlign: "right" }}
            />
          </div>
        </div>
      </Row>

      <Row label="Bunker" align="start">
        <div className="mb-1 font-bold">ROB</div>
        <FuelGrid values={d.rob} />

        <div className="mb-1 mt-3 flex items-center gap-2">
          <span className="font-bold">Supply</span>
          <Button size="small">Import from Bunker Simulator</Button>
          <Checkbox defaultChecked className="ml-auto text-[11px]">
            N/A
          </Checkbox>
        </div>
        <SupplyGrid disabled />

        <div className="mb-1 mt-3 font-bold">Port Consumption</div>
        <FuelGrid values={d.portConsumption} editable />
      </Row>

      <Row label="Laytime Calculation">
        <div className="flex items-center justify-end gap-2">
          <span>{d.laytime}</span>
          <Button size="small" onClick={onOpenLaytime}>
            Open
          </Button>
          <Checkbox className="text-[11px]">N/A</Checkbox>
        </div>
      </Row>

      <Row label="Port Charge Details">
        <div className="flex items-center justify-end gap-2">
          <span>Total {d.portChargeTotal}</span>
          <Button size="small">Open</Button>
          <Checkbox className="text-[11px]">N/A</Checkbox>
        </div>
      </Row>

      <Row label="Port SOF">
        <div className="flex items-center justify-end gap-2">
          <Button size="small">Open</Button>
          <span className="w-[46px]" />
        </div>
      </Row>

      <Row label="Remark" align="start">
        <Input.TextArea rows={2} style={{ fontSize: 11 }} />
      </Row>
    </ReportModal>
  );
}

export function StartOperationModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  return (
    <Modal
      open={open}
      onCancel={onClose}
      title={<span className="text-[12px] font-bold">Start Operation</span>}
      width={640}
      maskClosable={false}
      destroyOnHidden
      footer={
        <div className="flex justify-end gap-2">
          <Button size="small" type="primary" style={{ minWidth: 72 }}>
            OK
          </Button>
          <Button size="small" style={{ minWidth: 72 }} onClick={onClose}>
            Cancel
          </Button>
        </div>
      }
    >
      <Row label="Performing Vessel">Xin Meng Xiang</Row>
      <Row label="Voyage Number">
        <Input defaultValue="voyage1" style={{ ...cell, width: "100%" }} />
      </Row>
      <Row label="Statistics">
        <Select
          size="small"
          defaultValue="Sep 2022"
          style={{ width: 130 }}
          options={["Jul 2022", "Aug 2022", "Sep 2022", "Oct 2022"].map((v) => ({
            value: v,
            label: v,
          }))}
        />
      </Row>
      <Row label="(Estimated) Commencing Time">8/21/2022 09:00</Row>
      <Row label="(Estimated) Completed Time">9/7/2022 14:21</Row>
      <Row label="Remark" align="start">
        <Input.TextArea rows={2} style={{ fontSize: 11 }} />
      </Row>

      <div className="mb-1 font-bold">Contract</div>
      <div className="mb-1 text-[11px] text-gray-600">
        The related contracts are for reference only and will not be applied to calculation.
      </div>
      <div
        className="grid border"
        style={{ ...B, gridTemplateColumns: "1.2fr 0.8fr 0.9fr 1.2fr 0.9fr 1.1fr 40px 50px" }}
      >
        {["Contract No.", "Type", "CP Date", "Charterers", "Vessel", "Cargo", "", ""].map(
          (h, i) => (
            <div
              key={i}
              className="border-b border-r px-1 py-[3px] text-center font-medium last:border-r-0"
              style={HD}
            >
              {h}
            </div>
          ),
        )}
        {["Coal202202", "VC Own", "8/1/2022", "Coal Trader", "", "Coal in Bulk"].map((v, i) => (
          <div key={i} className="border-b border-r px-1 py-[3px]" style={B}>
            {v}
          </div>
        ))}
        <div className="border-b border-r px-1 text-center" style={B}>
          ✔
        </div>
        <div className="flex items-center justify-center gap-1 border-b" style={B}>
          <PlusCircleOutlined style={{ color: VE_COLORS.headerBg }} />
          <MinusCircleOutlined style={{ color: VE_COLORS.headerBg }} />
        </div>
        {Array.from({ length: 6 }, (_, i) => (
          <div key={`e${i}`} className="border-r px-1 py-[3px]" style={B}>
            &nbsp;
          </div>
        ))}
        <div className="border-r" style={B} />
        <div className="flex items-center justify-center gap-1">
          <PlusCircleOutlined style={{ color: VE_COLORS.headerBg }} />
          <MinusCircleOutlined style={{ color: VE_COLORS.headerBg }} />
        </div>
      </div>

      <div className="mt-2 flex items-center gap-2">
        <span className="w-[135px] shrink-0 font-bold">Selected Folder</span>
        <Input defaultValue="Common" style={{ ...cell, flex: 1 }} />
        <Button size="small">Browse Folders</Button>
      </div>
    </Modal>
  );
}
