import { useCallback, useMemo, useState } from "react";
import type { WorkspaceSheetLifecycle } from "./workspaceToolbar";

function isInteractiveElement(target: EventTarget | null) {
  if (!(target instanceof HTMLElement)) return false;
  return Boolean(
    target.closest(
      'input, textarea, select, [contenteditable="true"], .ant-input, .ant-select, .ant-picker, .ant-checkbox, .ant-radio, button',
    ),
  );
}

export function useWorkspaceDirtyTracker() {
  const [lifecycle, setLifecycle] = useState<WorkspaceSheetLifecycle>("init");
  const [isUserModified, setIsUserModified] = useState(false);

  const markUserModified = useCallback(() => {
    setIsUserModified(true);
  }, []);

  const resetUserModified = useCallback(() => {
    setIsUserModified(false);
  }, []);

  const interactionProps = useMemo(
    () => ({
      onInputCapture: () => {
        setIsUserModified(true);
      },
      onChangeCapture: () => {
        setIsUserModified(true);
      },
      onClickCapture: (event: React.MouseEvent<HTMLElement>) => {
        if (isInteractiveElement(event.target)) {
          setIsUserModified(true);
        }
      },
    }),
    [],
  );

  return {
    lifecycle,
    setLifecycle,
    isUserModified,
    markUserModified,
    resetUserModified,
    interactionProps,
  };
}
