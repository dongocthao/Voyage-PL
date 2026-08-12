import type { MouseEvent, ReactNode } from "react";
import { useRef, useState } from "react";
import { ConfigProvider, Button } from "antd";
import { StyleProvider } from "@ant-design/cssinjs";
import { CloseOutlined } from "@ant-design/icons";
import { veTheme, VE_FONT_FAMILY, VE_COLORS } from "./theme";

export type DialogAction = {
  label: string;
  icon?: ReactNode;
  primary?: boolean;
  disabled?: boolean;
  loading?: boolean;
  onClick?: () => void;
};

/** Khung chung cho các form dạng modal dialog (Bunker Simulator, Analyzer, ...) */
export default function DialogShell({
  title,
  icon,
  subtitle,
  footerLeft,
  actions = [{ label: "OK", primary: true }, { label: "Cancel" }],
  onClose,
  modal = true,
  width = 1460,
  bodyPadding = 12,
  children,
}: {
  title: string;
  icon?: ReactNode;
  subtitle?: string;
  footerLeft?: ReactNode;
  actions?: DialogAction[];
  onClose?: () => void;
  modal?: boolean;
  /** Chiều rộng tối đa của modal (px) */
  width?: number;
  /** Padding trong thân modal (px) */
  bodyPadding?: number;
  children: ReactNode;
}) {
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const dragStartRef = useRef<{ mouseX: number; mouseY: number; x: number; y: number } | null>(
    null,
  );

  const startDrag = (event: MouseEvent<HTMLElement>) => {
    if (!modal) return;
    const target = event.target as HTMLElement;
    if (target.closest("button")) return;

    dragStartRef.current = {
      mouseX: event.clientX,
      mouseY: event.clientY,
      x: position.x,
      y: position.y,
    };

    const onMove = (moveEvent: globalThis.MouseEvent) => {
      const start = dragStartRef.current;
      if (!start) return;
      setPosition({
        x: start.x + moveEvent.clientX - start.mouseX,
        y: start.y + moveEvent.clientY - start.mouseY,
      });
    };

    const onUp = () => {
      dragStartRef.current = null;
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };

    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
  };

  return (
    <StyleProvider hashPriority="high">
      <ConfigProvider theme={veTheme}>
        <div
          className={
            modal
              ? "fixed inset-0 z-50 flex min-h-screen items-start justify-center overflow-auto bg-[#003c52]/35 p-3 text-black"
              : "flex min-h-0 items-start justify-center overflow-visible bg-transparent text-black"
          }
          style={{ fontFamily: VE_FONT_FAMILY, fontSize: 11 }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-label={title}
            className="w-full border bg-white shadow-2xl"
            style={{
              borderColor: VE_COLORS.border,
              maxWidth: width,
              transform: modal ? `translate(${position.x}px, ${position.y}px)` : undefined,
            }}
          >
            <header
              className="flex h-[32px] items-center gap-2 px-3 text-[13px] font-bold text-white"
              onMouseDown={startDrag}
              style={{
                background: "linear-gradient(90deg, #155B78 0%, #1C78A0 100%)",
                cursor: modal ? "move" : "default",
              }}
            >
              {icon}
              <span className="flex-1 truncate">{title}</span>
              <button
                type="button"
                aria-label="Close"
                onClick={onClose}
                className="cursor-pointer text-white/90 hover:text-white"
              >
                <CloseOutlined />
              </button>
            </header>

            {subtitle && (
              <div
                className="border-b bg-[#F7FAFC] px-3 py-[5px] text-[11px] text-[#5a6e7f]"
                style={{ borderColor: VE_COLORS.border }}
              >
                {subtitle}
              </div>
            )}

            <div style={{ padding: bodyPadding }}>{children}</div>

            {(footerLeft || actions.length > 0) && (
              <footer
                className="flex items-center justify-between gap-2 border-t px-3 py-[6px]"
                style={{ borderColor: VE_COLORS.border, background: VE_COLORS.summary }}
              >
                <div className="flex items-center gap-2">{footerLeft}</div>
                <div className="flex items-center gap-2">
                  {actions.map((a) => (
                    <Button
                      key={a.label}
                      size="small"
                      type={a.primary ? "primary" : "default"}
                      icon={a.icon}
                      disabled={a.disabled}
                      loading={a.loading}
                      onClick={a.onClick ?? (!a.primary ? onClose : undefined)}
                      style={{ minWidth: 72 }}
                    >
                      {a.label}
                    </Button>
                  ))}
                </div>
              </footer>
            )}
          </div>
        </div>
      </ConfigProvider>
    </StyleProvider>
  );
}

/** Tiêu đề nhóm bên trong dialog */
export function GroupTitle({ children }: { children: ReactNode }) {
  return (
    <div className="mb-1 text-[12px] font-bold" style={{ color: VE_COLORS.sectionTitle }}>
      {children}
    </div>
  );
}

/** Một dòng label + control trong form dialog */
export function FieldRow({
  label,
  bold,
  indent,
  children,
  suffix,
}: {
  label: ReactNode;
  bold?: boolean;
  indent?: number;
  children: ReactNode;
  suffix?: ReactNode;
}) {
  return (
    <div className="flex items-center gap-2 py-[2px] text-[11px]">
      <span
        className={bold ? "font-bold" : ""}
        style={{ width: 150, paddingLeft: (indent ?? 0) * 12, flex: "0 0 auto" }}
      >
        {label}
      </span>
      <div className="flex-1">{children}</div>
      <span className="w-[64px] shrink-0 text-gray-600">{suffix}</span>
    </div>
  );
}
