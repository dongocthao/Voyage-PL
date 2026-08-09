import { useCallback, useState, type MouseEvent as ReactMouseEvent } from "react";
import type { ColumnsType, ColumnType } from "antd/es/table";

export function useResizableColumns<T extends object>(columns: ColumnsType<T>) {
  const [widths, setWidths] = useState<Record<string, number>>({});
  const resizeHitAreaPx = 6;

  const resizeColumn = useCallback((key: string, width: number) => {
    setWidths((current) => ({ ...current, [key]: Math.max(40, Math.round(width)) }));
  }, []);

  const applyResizable = useCallback(
    (sourceColumns: ColumnsType<T>, parentKey = ""): ColumnsType<T> =>
      sourceColumns.map((column, index) => {
        const dataIndex = "dataIndex" in column ? column.dataIndex : undefined;
        const key = String(column.key ?? dataIndex ?? `${parentKey}${index}`);
        const columnWithChildren = column as ColumnType<T> & { children?: ColumnsType<T> };

        if (columnWithChildren.children) {
          return {
            ...column,
            children: applyResizable(columnWithChildren.children, `${key}.`),
          };
        }

        const baseWidth = Number(column.width) || widths[key] || 80;
        const width = widths[key] ?? baseWidth;
        return {
          ...column,
          key,
          width,
          onHeaderCell: () => ({
            width,
            style: { position: "relative" },
            onMouseMove: (event: ReactMouseEvent<HTMLTableCellElement>) => {
              const rect = event.currentTarget.getBoundingClientRect();
              event.currentTarget.style.cursor =
                rect.right - event.clientX <= resizeHitAreaPx ? "col-resize" : "";
            },
            onMouseLeave: (event: ReactMouseEvent<HTMLTableCellElement>) => {
              event.currentTarget.style.cursor = "";
            },
            onMouseDown: (event: ReactMouseEvent<HTMLTableCellElement>) => {
              const rect = event.currentTarget.getBoundingClientRect();
              if (rect.right - event.clientX > resizeHitAreaPx) return;

              event.preventDefault();
              event.stopPropagation();

              const startX = event.clientX;
              const startWidth = width;

              const handleMove = (moveEvent: MouseEvent) => {
                resizeColumn(key, startWidth + moveEvent.clientX - startX);
              };

              const stopResize = () => {
                document.removeEventListener("mousemove", handleMove);
                document.removeEventListener("mouseup", stopResize);
                document.body.style.cursor = "";
                document.body.style.userSelect = "";
              };

              document.body.style.cursor = "col-resize";
              document.body.style.userSelect = "none";
              document.addEventListener("mousemove", handleMove);
              document.addEventListener("mouseup", stopResize);
            },
          }),
        };
      }),
    [resizeColumn, widths],
  );

  return applyResizable(columns);
}
