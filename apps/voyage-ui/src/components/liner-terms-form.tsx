import { useEffect, useMemo, useState, type CSSProperties } from "react";
import { Check, FileText, Minus, Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const linerFont: CSSProperties = {
  fontFamily: '"Segoe UI", Tahoma, Arial, sans-serif',
  fontSize: 11,
};
const cellInputClass =
  "h-6 rounded-none border-0 bg-transparent px-1 text-[11px] shadow-none font-['Segoe_UI',Tahoma,Arial,sans-serif]";
const actionClass =
  "h-7 w-20 rounded-none border-border bg-card px-2 text-[11px] font-normal text-foreground hover:bg-muted font-['Segoe_UI',Tahoma,Arial,sans-serif]";
const rowActionClass =
  "h-5 w-5 rounded-none border border-border bg-card p-0 text-foreground hover:bg-muted font-['Segoe_UI',Tahoma,Arial,sans-serif]";
const fontClass = "font-['Segoe_UI',Tahoma,Arial,sans-serif] text-[11px]";

type LinerRow = {
  key: string;
  portType: string;
  portName: string;
  account: string;
  cargoName: string;
  lumpsum: boolean;
  quantity: number | "";
  rate: number | "";
  amount: number | "";
};

export type LinerTermsContextRow = {
  key?: string;
  type: string;
  portName: string;
  quantity: number;
  account: string;
  cargoName?: string;
  rate?: number;
};

export type LinerTermsApplyResult = {
  amount: number;
  rows: LinerRow[];
};

const initialRows: LinerTermsContextRow[] = [
  { key: "1", type: "Loading", portName: "New York <U.S.A - New...>", account: "", cargoName: "Sample", quantity: 45000 },
  { key: "2", type: "Discharging", portName: "Izmir <Turkey> [+03:00]", account: "", cargoName: "Sample", quantity: 45000 },
];

function toNumber(value: string): number | "" {
  const normalized = value.replace(/,/g, "").trim();
  if (!normalized) return "";
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : "";
}

function buildRows(rows: LinerTermsContextRow[], initialTotal?: number): LinerRow[] {
  const rate =
    rows.length && initialTotal !== undefined
      ? Number((initialTotal / rows.reduce((sum, row) => sum + row.quantity, 0)).toFixed(4))
      : "";
  return rows.map((row, index) => ({
    key: row.key ?? String(index + 1),
    portType: row.type,
    portName: row.portName,
    account: row.account,
    cargoName: row.cargoName ?? "",
    lumpsum: true,
    quantity: row.quantity,
    rate: row.rate ?? rate,
    amount: "",
  }));
}

function calculateAmount(row: LinerRow): number | "" {
  if (typeof row.quantity !== "number" || typeof row.rate !== "number") return "";
  return row.quantity * row.rate;
}

function formatAmount(value: number) {
  return value.toLocaleString("en-US", {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  });
}

export function LinerTermsForm({
  rows: sourceRows = initialRows,
  initialTotal,
  onApply,
  onCancel,
}: {
  rows?: LinerTermsContextRow[];
  initialTotal?: number;
  onApply?: (result: LinerTermsApplyResult) => void;
  onCancel?: () => void;
}) {
  const [rows, setRows] = useState<LinerRow[]>(() => buildRows(sourceRows, initialTotal));
  const [message, setMessage] = useState("");

  useEffect(() => {
    setRows(buildRows(sourceRows, initialTotal));
    setMessage("");
  }, [sourceRows, initialTotal]);

  const update = (key: string, patch: Partial<LinerRow>) =>
    setRows((prev) => prev.map((row) => (row.key === key ? { ...row, ...patch } : row)));
  const addRow = (key: string) =>
    setRows((prev) => {
      const sourceIndex = prev.findIndex((row) => row.key === key);
      const sourceRow = prev[sourceIndex] ?? prev.at(-1);
      const nextRow: LinerRow = {
        key: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        portType: sourceRow?.portType ?? "Loading",
        portName: sourceRow?.portName ?? "",
        account: sourceRow?.account ?? "",
        cargoName: sourceRow?.cargoName ?? "",
        lumpsum: true,
        quantity: sourceRow?.quantity ?? "",
        rate: "",
        amount: "",
      };
      if (sourceIndex < 0) return [...prev, nextRow];
      return [...prev.slice(0, sourceIndex + 1), nextRow, ...prev.slice(sourceIndex + 1)];
    });
  const deleteRow = (key: string) =>
    setRows((prev) => (prev.length > 1 ? prev.filter((row) => row.key !== key) : prev));

  const calculatedRows = useMemo(
    () => rows.map((row) => ({ ...row, amount: calculateAmount(row) })),
    [rows],
  );
  const total = calculatedRows.reduce(
    (sum, row) => sum + (typeof row.amount === "number" ? row.amount : 0),
    0,
  );
  const handleOk = () => {
    const result = { amount: total, rows: calculatedRows };
    if (onApply) {
      onApply(result);
      return;
    }
    setMessage(`OK: Sum of amount ${formatAmount(result.amount)}`);
  };

  const handleCancel = () => {
    if (onCancel) {
      onCancel();
      return;
    }
    setRows(buildRows(sourceRows, initialTotal));
    setMessage("Cancel: changes were discarded.");
  };

  return (
    <Card
      className={`mx-auto max-w-[1120px] rounded-none border-border/80 shadow-sm ${fontClass} [&_*]:font-['Segoe_UI',Tahoma,Arial,sans-serif] [&_*]:text-[11px]`}
      style={linerFont}
    >
      <CardHeader className="h-6 border-b border-[#0F4E68] bg-[#155B78] px-2 py-0 text-white">
        <CardTitle className="flex h-full items-center gap-1.5 text-[11px] font-bold leading-none text-white" style={linerFont}>
          <FileText className="h-3.5 w-3.5 text-white" />
          Liner Term
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2 px-4 pb-4 pt-6">
        <div className="overflow-hidden rounded-none border">
          <Table className={fontClass} style={linerFont}>
            <TableHeader className="bg-muted/60">
              <TableRow>
                <TableHead className="h-7 w-[124px] px-1.5 text-[11px]" style={linerFont}>Port Type</TableHead>
                <TableHead className="h-7 w-[220px] px-1.5 text-[11px]" style={linerFont}>Port Name</TableHead>
                <TableHead className="h-7 w-[160px] px-1.5 text-[11px]" style={linerFont}>Account</TableHead>
                <TableHead className="h-7 w-[160px] px-1.5 text-[11px]" style={linerFont}>Cargo Name</TableHead>
                <TableHead className="h-7 w-[88px] px-1.5 text-center text-[11px]" style={linerFont}>Lumpsum</TableHead>
                <TableHead className="h-7 w-[130px] px-1.5 text-right text-[11px]" style={linerFont}>Quantity</TableHead>
                <TableHead className="h-7 w-[120px] px-1.5 text-right text-[11px]" style={linerFont}>Rate / MT</TableHead>
                <TableHead className="h-7 w-[130px] px-1.5 text-right text-[11px]" style={linerFont}>Amount</TableHead>
                <TableHead className="h-7 w-[60px] px-1.5 text-center text-[11px]" style={linerFont}> </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {calculatedRows.map((row) => (
                <TableRow key={row.key}>
                  <TableCell className="px-1.5 py-0.5">
                    <Select
                      value={row.portType}
                      disabled
                      onValueChange={(portType) => update(row.key, { portType })}
                    >
                      <SelectTrigger
                        className={`${fontClass} h-6 rounded-none border-0 bg-transparent px-0 shadow-none`}
                        style={linerFont}
                      >
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className={`${fontClass} rounded-none`} style={linerFont}>
                        {["Loading", "Discharging", "Bunkering"].map((item) => (
                          <SelectItem key={item} value={item} className={fontClass} style={linerFont}>
                            {item}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell className="px-1.5 py-0.5">
                    <Input
                      className={cellInputClass}
                      value={row.portName}
                      readOnly
                      style={linerFont}
                    />
                  </TableCell>
                  <TableCell className="px-1.5 py-0.5">
                    <Input
                      className={cellInputClass}
                      value={row.account}
                      readOnly
                      style={linerFont}
                    />
                  </TableCell>
                  <TableCell className="px-1.5 py-0.5">
                    <Input
                      className={cellInputClass}
                      value={row.cargoName}
                      readOnly
                      style={linerFont}
                    />
                  </TableCell>
                  <TableCell className="px-1.5 py-0.5 text-center">
                    <Checkbox
                      className="rounded-none"
                      checked={row.lumpsum}
                      disabled
                      onCheckedChange={(checked) => update(row.key, { lumpsum: checked === true })}
                    />
                  </TableCell>
                  <TableCell className="px-1.5 py-0.5">
                    <Input
                      className={`${cellInputClass} text-right`}
                      value={row.quantity}
                      readOnly
                      style={linerFont}
                    />
                  </TableCell>
                  <TableCell className="px-1.5 py-0.5">
                    <Input
                      className={`${cellInputClass} bg-yellow-50 text-right`}
                      value={row.rate}
                      onChange={(event) => update(row.key, { rate: toNumber(event.target.value) })}
                      style={linerFont}
                    />
                  </TableCell>
                  <TableCell className="px-1.5 py-0.5">
                    <Input
                      className={`${cellInputClass} text-right`}
                      value={typeof row.amount === "number" ? formatAmount(row.amount) : ""}
                      readOnly
                      style={linerFont}
                    />
                  </TableCell>
                  <TableCell className="px-1.5 py-0.5">
                    <div className="flex items-center justify-center gap-1">
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        className={rowActionClass}
                        style={linerFont}
                        onClick={() => addRow(row.key)}
                        aria-label="Add liner term row"
                        title="Add row"
                      >
                        <Plus className="h-3 w-3" />
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        className={rowActionClass}
                        style={linerFont}
                        onClick={() => deleteRow(row.key)}
                        disabled={rows.length <= 1}
                        aria-label="Delete liner term row"
                        title="Delete row"
                      >
                        <Minus className="h-3 w-3" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        <div className="flex justify-end pr-2 text-[11px] font-semibold">
          {formatAmount(total)}
        </div>
        {message ? <div className="text-right text-[11px] text-muted-foreground">{message}</div> : null}

        <Separator />
        <div className="flex justify-end gap-1.5">
          <Button
            type="button"
            size="sm"
            variant="outline"
            className={actionClass}
            style={linerFont}
            onClick={handleOk}
          >
            <Check className="h-4 w-4" />
            OK
          </Button>
          <Button
            type="button"
            size="sm"
            variant="outline"
            className={actionClass}
            style={linerFont}
            onClick={handleCancel}
          >
            <X className="h-4 w-4" />
            Cancel
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
