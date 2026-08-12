"use client";

import { Button, Checkbox, ConfigProvider, InputNumber, Select, Space, Tabs } from "antd";
import { StyleProvider } from "@ant-design/cssinjs";
import { SettingOutlined } from "@ant-design/icons";
import { useEffect, useState, type ReactNode } from "react";
import { VE_COLORS, VE_FONT_FAMILY, veTheme } from "@/components/voyage-estimator/theme";
import {
  DEFAULT_SYSTEM_OPTIONS,
  fetchSystemOptions,
  saveSystemOptions,
  type SystemOptions,
} from "@/lib/api/systemOptions";

function SectionTitle({ children }: { children: ReactNode }) {
  return (
    <div className="mb-1 flex items-center gap-2">
      <span className="whitespace-nowrap text-[11px] font-bold text-[#0E5D80]">{children}</span>
      <span className="h-px flex-1 bg-[#D8E2EA]" />
    </div>
  );
}

function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex min-h-[24px] items-center gap-2 py-[1px] pl-4">
      <span className="w-56 shrink-0 text-[11px] text-[#334E63]">{label}</span>
      <div className="flex items-center gap-2">{children}</div>
    </div>
  );
}

const options = <T extends string>(values: T[]) => values.map((value) => ({ value, label: value }));

function GeneralTab({
  value,
  onChange,
  disabled,
}: {
  value: SystemOptions;
  onChange: (next: Partial<SystemOptions>) => void;
  disabled?: boolean;
}) {
  return (
    <div className="space-y-2 pb-2">
      <section>
        <SectionTitle>Sheet Option</SectionTitle>
        <Row label="Decimal Place">
          <InputNumber
            size="small"
            className="w-20"
            value={value.decimalPlace}
            min={0}
            max={6}
            disabled={disabled}
            onChange={(next) => onChange({ decimalPlace: Number(next ?? 0) })}
          />
        </Row>
        <Row label="Voyage Sheets in new workbook">
          <InputNumber
            size="small"
            className="w-20"
            value={value.voyageSheetsInNewWorkbook}
            min={1}
            disabled={disabled}
            onChange={(next) => onChange({ voyageSheetsInNewWorkbook: Number(next ?? 1) })}
          />
        </Row>
        <Row label="Cargo Relet Sheets in new workbook">
          <InputNumber
            size="small"
            className="w-20"
            value={value.cargoReletSheetsInNewWorkbook}
            min={1}
            disabled={disabled}
            onChange={(next) => onChange({ cargoReletSheetsInNewWorkbook: Number(next ?? 1) })}
          />
        </Row>
        <Row label="Time Charter Sheets in new workbook">
          <InputNumber
            size="small"
            className="w-20"
            value={value.timeCharterSheetsInNewWorkbook}
            min={1}
            disabled={disabled}
            onChange={(next) => onChange({ timeCharterSheetsInNewWorkbook: Number(next ?? 1) })}
          />
        </Row>
        <div className="min-h-[24px] py-[1px] pl-4">
          <Checkbox
            checked={value.autoMilestone}
            disabled={disabled}
            className="text-[11px]"
            onChange={(event) => onChange({ autoMilestone: event.target.checked })}
          >
            Auto Milestone
          </Checkbox>
        </div>
      </section>

      <section>
        <SectionTitle>Time Option</SectionTitle>
        <Row label="Time Type">
          <Select
            size="small"
            className="w-28"
            value={value.timeType}
            disabled={disabled}
            options={options(["Days", "Hours"])}
            onChange={(next) => onChange({ timeType: next })}
          />
        </Row>
        <Row label="Default Time Zone Type">
          <Select
            size="small"
            className="w-40"
            value={value.defaultTimeZoneType}
            disabled={disabled}
            options={options(["Port local time", "GMT", "Ship time"])}
            onChange={(next) => onChange({ defaultTimeZoneType: next })}
          />
        </Row>
      </section>

      <section>
        <SectionTitle>Speed Option</SectionTitle>
        <Row label="Default Vessel Speed">
          <InputNumber
            size="small"
            className="w-24"
            value={value.defaultVesselSpeed}
            precision={2}
            min={0}
            disabled={disabled}
            onChange={(next) => onChange({ defaultVesselSpeed: Number(next ?? 0) })}
          />
        </Row>
      </section>

      <section>
        <SectionTitle>Bunker Option</SectionTitle>
        <div className="flex min-h-[24px] flex-wrap items-center gap-2 py-[1px] pl-4">
          <span className="w-56 shrink-0 text-[11px] text-[#334E63]">Normal Main</span>
          <Select size="small" className="w-24" value={value.normalMainFuel} disabled={disabled} options={options(["VLSFO", "HSFO", "ULSFO"])} onChange={(next) => onChange({ normalMainFuel: next })} />
          <span className="ml-4 w-24 shrink-0 text-[11px] text-[#334E63]">Normal Sub</span>
          <Select size="small" className="w-24" value={value.normalSubFuel} disabled={disabled} options={options(["MGO", "MDO"])} onChange={(next) => onChange({ normalSubFuel: next })} />
        </div>
        <div className="flex min-h-[24px] flex-wrap items-center gap-2 py-[1px] pl-4">
          <span className="w-56 shrink-0 text-[11px] text-[#334E63]">Eca Main</span>
          <Select size="small" className="w-24" value={value.ecaMainFuel} disabled={disabled} options={options(["ULSFO", "VLSFO"])} onChange={(next) => onChange({ ecaMainFuel: next })} />
          <span className="ml-4 w-24 shrink-0 text-[11px] text-[#334E63]">Eca Sub</span>
          <Select size="small" className="w-24" value={value.ecaSubFuel} disabled={disabled} options={options(["MGO", "MDO"])} onChange={(next) => onChange({ ecaSubFuel: next })} />
        </div>
      </section>

      <section>
        <SectionTitle>Weather Factor Option</SectionTitle>
        <Row label="Weather Factor Type">
          <Select
            size="small"
            className="w-32"
            value={value.weatherFactorType}
            disabled={disabled}
            options={options(["Distance", "Speed", "Time"])}
            onChange={(next) => onChange({ weatherFactorType: next })}
          />
        </Row>
        <Row label="Default Weather Factor">
          <InputNumber
            size="small"
            className="w-32"
            value={value.defaultWeatherFactor}
            precision={1}
            min={0}
            max={100}
            suffix="%"
            disabled={disabled}
            onChange={(next) => onChange({ defaultWeatherFactor: Number(next ?? 0) })}
          />
        </Row>
      </section>

      <section>
        <SectionTitle>Default ETS Option</SectionTitle>
        <div className="min-h-[24px] py-[1px] pl-4">
          <Checkbox
            checked={value.applyEuEtsToSheet}
            disabled={disabled}
            className="text-[11px]"
            onChange={(event) => onChange({ applyEuEtsToSheet: event.target.checked })}
          >
            Apply EU ETS to Sheet
          </Checkbox>
        </div>
      </section>

      <section>
        <SectionTitle>Currency Option</SectionTitle>
        <div className="flex min-h-[24px] items-center gap-2 py-[1px] pl-4">
          <span className="w-56 shrink-0 text-[11px] text-[#334E63]">Default Main Currency</span>
          <span className="text-[11px] font-bold text-[#172331]">USD</span>
        </div>
        <p className="pl-8 pr-4 text-[11px] leading-4 text-[#6d7a86]">
          * Default Main Currency can not be changed. If you need to change it, please contact your
          server administrator.
        </p>
      </section>
    </div>
  );
}

function EmptyTab({ name }: { name: string }) {
  return <div className="py-10 text-center text-[11px] text-[#6d7a86]">{name} options</div>;
}

export function OptionForm({
  embedded = false,
  onClose,
}: {
  embedded?: boolean;
  onClose?: () => void;
}) {
  const tabs = ["Display", "Navigation", "Canal", "Map", "TVM", "Print", "System", "Network"];
  const [settings, setSettings] = useState<SystemOptions>(DEFAULT_SYSTEM_OPTIONS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  const load = async () => {
    setLoading(true);
    setMessage("");
    try {
      setSettings(await fetchSystemOptions());
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Failed to load system options");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const updateSettings = (next: Partial<SystemOptions>) => {
    setSettings((current) => ({ ...current, ...next, defaultMainCurrency: "USD" }));
    setMessage("");
  };

  const handleSave = async () => {
    setSaving(true);
    setMessage("");
    try {
      setSettings(await saveSystemOptions(settings));
      setMessage("Saved.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Failed to save system options");
    } finally {
      setSaving(false);
    }
  };

  return (
    <StyleProvider hashPriority="high">
      <ConfigProvider theme={veTheme}>
        <div
          className="option-form h-full bg-white text-[#172331]"
          style={{ fontFamily: VE_FONT_FAMILY, fontSize: 11 }}
        >
          <style>
            {`
              .option-form .ant-tabs-nav {
                margin-bottom: 6px !important;
              }

              .option-form .ant-tabs-tab {
                border-radius: 0 !important;
              }

              .option-form .ant-checkbox-checked .ant-checkbox-inner {
                background-color: ${VE_COLORS.sectionTitle} !important;
                border-color: ${VE_COLORS.sectionTitle} !important;
              }
            `}
          </style>

          <div
            className={`${embedded ? "w-[720px]" : "mx-auto max-w-[720px] border border-[#D8E2EA] bg-white shadow-sm"}`.trim()}
          >
            {!embedded && (
              <div className="flex h-[30px] items-center gap-2 border-b border-[#D8E2EA] bg-[#E9F1F6] px-3 text-[12px] font-bold text-[#0E5D80]">
                <SettingOutlined />
                <span>Option</span>
              </div>
            )}

            <div className="px-3 pt-2">
              {message && (
                <div className="mb-2 border border-[#f0d08a] bg-[#fff7e6] px-2 py-1 text-[11px] font-semibold text-[#8a5a00]">
                  {message}
                </div>
              )}
              <Tabs
                size="small"
                defaultActiveKey="general"
                items={[
                  {
                    key: "general",
                    label: "General",
                    children: (
                      <GeneralTab
                        value={settings}
                        onChange={updateSettings}
                        disabled={loading || saving}
                      />
                    ),
                  },
                  ...tabs.map((tab) => ({ key: tab, label: tab, children: <EmptyTab name={tab} /> })),
                ]}
              />
            </div>

            <div className="flex justify-end border-t border-[#D8E2EA] px-3 py-2">
              <Space size="small">
                <Button size="small" type="primary" className="w-24" loading={saving} onClick={handleSave}>
                  OK
                </Button>
                <Button
                  size="small"
                  className="w-24"
                  disabled={loading || saving}
                  onClick={() => {
                    if (embedded && onClose) {
                      onClose();
                      return;
                    }
                    void load();
                  }}
                >
                  Cancel
                </Button>
              </Space>
            </div>
          </div>
        </div>
      </ConfigProvider>
    </StyleProvider>
  );
}
