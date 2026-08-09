import { Avatar, Badge, Space, Tooltip } from "antd";
import {
  AppstoreOutlined,
  BellOutlined,
  BorderOutlined,
  ClockCircleOutlined,
  CloseOutlined,
  CompassOutlined,
  CopyOutlined,
  DeleteOutlined,
  EditOutlined,
  FileAddOutlined,
  FolderOpenOutlined,
  MinusSquareOutlined,
  PlusSquareOutlined,
  ProfileOutlined,
  QuestionCircleOutlined,
  RedoOutlined,
  ReloadOutlined,
  SaveOutlined,
  SettingOutlined,
  UndoOutlined,
  UserOutlined,
} from "@ant-design/icons";
import { VE_COLORS } from "./theme";

const DEFAULT_TABS = [
  { key: "voyage1", label: "voyage1", icon: <ProfileOutlined />, active: true },
  { key: "relet", label: "cargo relet1", icon: <BorderOutlined /> },
  { key: "tc", label: "time charter1", icon: <ClockCircleOutlined /> },
];

export type WorkTab = { key: string; label: string; icon: React.ReactNode; active?: boolean };

export default function RibbonHeader({
  title = "Voyage Estimator - Estimation 5011",
  tabs = DEFAULT_TABS,
  onSave,
  onOpen,
  onReload,
}: {
  title?: string;
  tabs?: WorkTab[];
  onSave?: () => void;
  onOpen?: () => void;
  onReload?: () => void;
}) {
  const actions = [
    { icon: <FileAddOutlined />, label: "New\nSheet" },
    { icon: <DeleteOutlined />, label: "Delete\nSheet" },
    { icon: <SaveOutlined />, label: "Save", onClick: onSave },
    { icon: <CopyOutlined />, label: "Save\nas" },
    { icon: <FolderOpenOutlined />, label: "Open", onClick: onOpen },
    { icon: <ReloadOutlined />, label: "Reload", onClick: onReload },
    { icon: <UndoOutlined />, label: "Undo" },
    { icon: <RedoOutlined />, label: "Redo", disabled: true },
    { icon: <PlusSquareOutlined />, label: "Increase" },
    { icon: <MinusSquareOutlined />, label: "Decrease" },
    { icon: <SettingOutlined />, label: "Options" },
    { icon: <AppstoreOutlined />, label: "To\nOperation" },
  ];

  return (
    <div className="shrink-0">
      <header
        className="flex h-[36px] items-center justify-between px-3 text-white"
        style={{ background: VE_COLORS.titleBar }}
      >
        <div className="flex items-center gap-2">
          <span
            className="flex h-[22px] w-[22px] items-center justify-center rounded-sm"
            style={{ background: "rgba(255,255,255,.18)" }}
          >
            <CompassOutlined style={{ fontSize: 14 }} />
          </span>
          <span className="text-[13px] font-bold tracking-wide">{title}</span>
        </div>
        <Space size={14} className="text-[14px]">
          <Tooltip title="Settings">
            <SettingOutlined />
          </Tooltip>
          <Tooltip title="Help">
            <QuestionCircleOutlined />
          </Tooltip>
          <Badge dot color="#FF4D4F">
            <BellOutlined style={{ color: "#fff" }} />
          </Badge>
          <span className="flex items-center gap-2">
            <Avatar
              size={22}
              icon={<UserOutlined />}
              style={{ background: "rgba(255,255,255,.25)" }}
            />
            <span className="text-[12px]">erin</span>
          </span>
        </Space>
      </header>

      <div className="border-b bg-white" style={{ borderColor: VE_COLORS.border }}>
        <div className="flex h-[66px] items-stretch justify-start">
          {actions.map((action, index) => (
            <div
              key={action.label}
              className="flex items-center border-r px-[6px]"
              style={{ borderColor: VE_COLORS.border }}
            >
              <button
                type="button"
                disabled={action.disabled}
                onClick={action.onClick}
                aria-label={action.label.replace("\n", " ")}
                title={action.label.replace("\n", " ")}
                className="flex h-[58px] min-w-[42px] flex-col items-center justify-center gap-[2px] text-[11px] leading-[12px] text-[#38576b] disabled:text-[#b8c3cc]"
              >
                <span
                  className="text-[24px] leading-none"
                  style={{
                    color: action.disabled
                      ? "#b8c3cc"
                      : index === 4
                        ? "#f6a040"
                        : index === 5
                          ? "#50b36b"
                          : VE_COLORS.titleBar,
                  }}
                >
                  {action.icon}
                </span>
                {action.label.split("\n").map((line) => (
                  <span key={line}>{line}</span>
                ))}
              </button>
            </div>
          ))}
        </div>
      </div>

      <div
        className="flex h-[28px] items-center justify-between border-b bg-[#F5F7FA] px-2"
        style={{ borderColor: VE_COLORS.border }}
      >
        <div className="flex h-full items-end gap-1">
          {tabs.map((tab) => (
            <div
              key={tab.key}
              className="flex items-center gap-1 border border-b-0 px-2 py-[3px] text-[12px]"
              style={{
                borderColor: VE_COLORS.border,
                background: tab.active ? "#fff" : "#E8EDF3",
                color: tab.active ? VE_COLORS.titleBar : "#555",
              }}
            >
              <span>{tab.icon}</span>
              {tab.label}
              {tab.active && (
                <>
                  <EditOutlined style={{ fontSize: 10 }} />
                  <CloseOutlined style={{ fontSize: 10 }} />
                </>
              )}
            </div>
          ))}
        </div>
        <div
          className="rounded-sm border px-2 py-[1px] text-[11px]"
          style={{ borderColor: VE_COLORS.border }}
        >
          Last Update : 2020-08-06 17:11, erin
        </div>
      </div>
    </div>
  );
}
