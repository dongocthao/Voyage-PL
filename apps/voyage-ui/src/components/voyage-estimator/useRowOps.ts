import { useCallback, useState } from "react";

let seq = 0;
const nextKey = () => `new-${++seq}`;

/** Quản lý thêm / xoá / chèn dòng cho các bảng có RowToolbar */
export function useRowOps<T extends { key: string }>(initial: T[]) {
  const [rows, setRows] = useState<T[]>(initial);
  const [selectedKey, setSelectedKey] = useState<string | null>(null);

  const blank = useCallback((): T => {
    const src = rows[0] ?? ({} as T);
    const out: Record<string, unknown> = {};
    Object.keys(src).forEach((k) => (out[k] = ""));
    out.key = nextKey();
    return out as T;
  }, [rows]);

  const add = useCallback(() => {
    const row = blank();
    setRows((r) => [...r, row]);
    setSelectedKey(row.key);
  }, [blank]);

  const remove = useCallback(() => {
    if (!selectedKey) return;
    setRows((r) => r.filter((x) => x.key !== selectedKey));
    setSelectedKey(null);
  }, [selectedKey]);

  const insertAt = useCallback(
    (offset: number) => {
      const row = blank();
      setRows((r) => {
        const i = r.findIndex((x) => x.key === selectedKey);
        const copy = [...r];
        copy.splice(i < 0 ? copy.length : i + offset, 0, row);
        return copy;
      });
      setSelectedKey(row.key);
    },
    [blank, selectedKey],
  );

  const insertAbove = useCallback(() => insertAt(0), [insertAt]);
  const insertBelow = useCallback(() => insertAt(1), [insertAt]);

  const onRow = (record: T) => ({ onClick: () => setSelectedKey(record.key) });

  return {
    rows,
    setRows,
    selectedKey,
    setSelectedKey,
    add,
    remove,
    insertAbove,
    insertBelow,
    onRow,
  };
}
