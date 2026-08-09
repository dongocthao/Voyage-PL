import type { ReactNode } from "react";
import { ConfigProvider } from "antd";
import { StyleProvider } from "@ant-design/cssinjs";
import RibbonHeader from "./RibbonHeader";
import { veTheme, VE_FONT_FAMILY } from "./theme";
import type { ToolbarCommand, ToolbarCommandState } from "./toolbarCommandManager";

export type SheetKind = "voyage" | "cargo relet" | "time charter" | "operation";

export default function EstimatorShell({
  sheetKind = "voyage",
  children,
  onSave,
  onOpen,
  onReload,
  onToolbarCommand,
  toolbarCommandState,
}: {
  title?: string;
  sheetKind?: SheetKind;
  children: ReactNode;
  onSave?: () => void;
  onOpen?: () => void;
  onReload?: () => void;
  onToolbarCommand?: (command: ToolbarCommand) => void;
  toolbarCommandState?: Partial<ToolbarCommandState>;
}) {
  const tabs =
    sheetKind === "operation"
      ? [
          { key: "voyage1", label: "voyage1", icon: <span>□</span> },
          { key: "operation1", label: "operation1", icon: <span>▣</span>, active: true },
        ]
      : [{ key: `${sheetKind}1`, label: `${sheetKind}1`, icon: <span>▣</span>, active: true }];

  const showHeaderAndToolbar =
    sheetKind !== "voyage" && sheetKind !== "time charter" && sheetKind !== "cargo relet";

  return (
    <StyleProvider hashPriority="high">
      <ConfigProvider theme={veTheme}>
        <div
          className="flex min-h-0 flex-col overflow-visible bg-white text-black"
          style={{ fontFamily: VE_FONT_FAMILY, fontSize: 11 }}
        >
          <RibbonHeader
            tabs={tabs}
            onSave={onSave}
            onOpen={onOpen}
            onReload={onReload}
            onCommand={onToolbarCommand}
            commandState={toolbarCommandState}
            showHeaderAndToolbar={showHeaderAndToolbar}
          />
          <main className="overflow-visible px-2 py-2">{children}</main>
        </div>
      </ConfigProvider>
    </StyleProvider>
  );
}
