import { Button } from "antd";
import { PlusOutlined, SwapOutlined, FileTextOutlined } from "@ant-design/icons";
import { SectionTitle } from "./cells";
import { VE_COLORS } from "./theme";

export type KVPanel = {
  title: string;
  rows: Array<[string, string, string, string]>;
  profitLabel?: string;
  profit?: string;
};

function KVGrid({ rows }: { rows: Array<[string, string, string, string]> }) {
  return (
    <div className="border text-[11px]" style={{ borderColor: VE_COLORS.border }}>
      {rows.map((r, i) => (
        <div
          key={i}
          className="grid grid-cols-4 border-b last:border-b-0"
          style={{ borderColor: VE_COLORS.border }}
        >
          <div
            className="border-r px-1 py-[3px]"
            style={{ borderColor: VE_COLORS.border, background: VE_COLORS.rowAlt }}
          >
            {r[0]}
          </div>
          <div
            className="border-r px-1 py-[3px] text-right"
            style={{ borderColor: VE_COLORS.border }}
          >
            {r[1]}
          </div>
          <div
            className="border-r px-1 py-[3px]"
            style={{ borderColor: VE_COLORS.border, background: VE_COLORS.rowAlt }}
          >
            {r[2]}
          </div>
          <div className="px-1 py-[3px] text-right">{r[3]}</div>
        </div>
      ))}
    </div>
  );
}

export default function KVPanels({ panels }: { panels: KVPanel[] }) {
  return (
    <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
      {panels.map((p) => (
        <section key={p.title}>
          <div className="mb-1 flex items-center gap-2">
            <SectionTitle>{p.title}</SectionTitle>
            {p.profit !== undefined && (
              <>
                <Button size="small" icon={<PlusOutlined />}>
                  Result +
                </Button>
                <Button size="small" icon={<SwapOutlined />}>
                  Comparison
                </Button>
                <Button size="small" icon={<FileTextOutlined />}>
                  Remark
                </Button>
              </>
            )}
          </div>
          <KVGrid rows={p.rows} />
          {p.profit !== undefined && (
            <div
              className="mt-[2px] grid grid-cols-4 border text-[12px] font-bold"
              style={{ borderColor: VE_COLORS.border, background: VE_COLORS.rowAlt }}
            >
              <div className="border-r px-1 py-[3px]" style={{ borderColor: VE_COLORS.border }} />
              <div className="border-r px-1 py-[3px]" style={{ borderColor: VE_COLORS.border }} />
              <div className="border-r px-1 py-[3px]" style={{ borderColor: VE_COLORS.border }}>
                {p.profitLabel}
              </div>
              <div className="px-1 py-[3px] text-right" style={{ color: VE_COLORS.sectionTitle }}>
                {p.profit}
              </div>
            </div>
          )}
        </section>
      ))}
    </div>
  );
}
