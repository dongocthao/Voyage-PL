import { useMemo, useState } from "react";
import { FlaskConical, List, Printer } from "lucide-react";
import { robData, type RobRow } from "./simulatorData";
import VesselSection from "./VesselSection";
import { VE_COLORS } from "./theme";
import { valueBunkerPlan, type BunkerFuel } from "@/lib/calculations/bunker";
import DialogShell from "./DialogShell";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Slider } from "@/components/ui/slider";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

type EditableRobRow = {
  key: string;
  port: string;
  span: number;
  wf: number;
  speed: number;
  sea: number;
  portDays: number;
  type: BunkerFuel;
  initialRob: number;
  startUnitPrice: number;
  arrivalSupplyQty: number;
  arrivalSupplyUnitPrice: number;
  arrivalRob: number;
  departureSupplyQty: number;
  departureSupplyUnitPrice: number;
  departureRob: number;
  seaConsumption: number;
  portConsumption: number;
};

type DisplayRobRow = EditableRobRow & {
  arrivalPrice: number;
  departurePrice: number;
};

type BunkerPriceRow = {
  key: string;
  group: string;
  span: number;
  type: string;
  quantity: number;
  unitPrice: number;
  price: number;
  totalPrice: number | null;
  negative?: boolean;
};

const fuelTypes: BunkerFuel[] = ["VLSFO", "MGO", "ULSFO"];
const defaultPrices: Record<BunkerFuel, number> = {
  VLSFO: 320,
  MGO: 360,
  ULSFO: 350,
};

export default function BunkerSimulatorApp({ onClose }: { onClose?: () => void }) {
  const [hirePerDay, setHirePerDay] = useState(8500);
  const [efficiencyPct, setEfficiencyPct] = useState(100);
  const [enabledFuels, setEnabledFuels] = useState<Record<BunkerFuel, boolean>>({
    VLSFO: true,
    MGO: true,
    ULSFO: true,
  });
  const [rows, setRows] = useState<EditableRobRow[]>(() => normalizeRows(robData));
  const [priceMode, setPriceMode] = useState<"avg" | "fifo">("avg");

  const displayRows = useMemo(() => calculateDisplayRows(rows), [rows]);
  const priceRows = useMemo(() => buildBunkerPriceRows(displayRows, priceMode), [displayRows, priceMode]);
  const comparisonRows = useMemo(
    () => buildComparisonRows(hirePerDay, efficiencyPct / 100, priceRows),
    [hirePerDay, efficiencyPct, priceRows],
  );
  const warning = useMemo(() => buildWarning(displayRows, enabledFuels), [displayRows, enabledFuels]);

  function updateRow(
    rowKey: string,
    field:
      | "wf"
      | "speed"
      | "sea"
      | "portDays"
      | "arrivalSupplyQty"
      | "arrivalSupplyUnitPrice"
      | "departureSupplyQty"
      | "departureSupplyUnitPrice"
      | "seaConsumption"
      | "portConsumption",
    value: number,
  ) {
    setRows((current) =>
      current.map((row) => (row.key === rowKey ? { ...row, [field]: sanitizeNumber(value) } : row)),
    );
  }

  function toggleFuel(type: BunkerFuel, checked: boolean) {
    setEnabledFuels((current) => ({ ...current, [type]: checked }));
  }

  function handleReset() {
    setRows(normalizeRows(robData));
    setHirePerDay(8500);
    setEfficiencyPct(100);
    setEnabledFuels({ VLSFO: true, MGO: true, ULSFO: true });
    setPriceMode("avg");
  }

  return (
    <DialogShell
      title="Bunker Simulator"
      icon={<FlaskConical className="h-4 w-4" />}
      width={1700}
      bodyPadding={12}
      onClose={onClose}
      actions={[
        { label: "Close", onClick: onClose },
      ]}
      footerLeft={
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="h-7 rounded-none border-[#C9D4E1] px-2 text-[11px]">
            <Printer className="h-3.5 w-3.5" />
            Print
          </Button>
          <Button variant="outline" size="sm" className="h-7 rounded-none border-[#C9D4E1] px-2 text-[11px]">
            <List className="h-3.5 w-3.5" />
            Index
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="h-7 rounded-none border-[#C9D4E1] px-2 text-[11px]"
            onClick={handleReset}
          >
            Reset
          </Button>
          <div className="ml-2 flex w-[180px] items-center gap-2">
            <Slider
              min={50}
              max={150}
              step={1}
              value={[efficiencyPct]}
              onValueChange={(value) => setEfficiencyPct(value[0] ?? 100)}
            />
            <span className="w-[42px] text-right text-[11px] text-[#35516C]">{efficiencyPct}%</span>
          </div>
        </div>
      }
    >
      <div className="bunker-simulator-dialog space-y-3">
        <style>
          {`
            .bunker-simulator-dialog [data-state="checked"] {
              background-color: ${VE_COLORS.headerText};
              border-color: ${VE_COLORS.headerText};
              color: ${VE_COLORS.headerText};
            }
            .bunker-simulator-dialog [role="radio"][data-state="checked"] {
              border-color: ${VE_COLORS.headerText};
            }
            .bunker-simulator-dialog [role="radio"][data-state="checked"]::after,
            .bunker-simulator-dialog [role="radio"][data-state="checked"] span {
              background-color: ${VE_COLORS.headerText};
            }
          `}
        </style>
        <section className="space-y-2">
          <div className="text-[12px] font-semibold uppercase tracking-wide text-[#35516C]">
            Vessel Particular
          </div>
          <VesselSection />
        </section>

        <div className="grid grid-cols-[1fr_400px] gap-4">
          <section className="space-y-2">
            <div className="flex items-center gap-3">
              <div className="text-[12px] font-semibold uppercase tracking-wide text-[#35516C]">
                ROB &amp; Supply
              </div>
              <span
                className="text-[11px] font-semibold"
                style={{ color: warning ? VE_COLORS.alert : VE_COLORS.sectionTitle }}
              >
                {warning || "Bunker supply is sufficient."}
              </span>
              {fuelTypes.map((type) => (
                <label key={type} className="flex items-center gap-1 text-[11px] text-[#35516C]">
                  <Checkbox
                    checked={enabledFuels[type]}
                    onCheckedChange={(value) => toggleFuel(type, value === true)}
                    className="rounded-none"
                  />
                  <span>{type}</span>
                </label>
              ))}
            </div>

            <div className="overflow-x-auto rounded-none border border-[#C9D4E1]">
              <Table className="min-w-[1258px] table-fixed border-collapse text-[11px] [&_td]:border [&_td]:border-[#D9E2EC] [&_th]:border [&_th]:border-[#C9D4E1]">
                <colgroup>
                  <col className="w-[180px]" />
                  <col className="w-[42px]" />
                  <col className="w-[54px]" />
                  <col className="w-[56px]" />
                  <col className="w-[56px]" />
                  <col className="w-[62px]" />
                  <col className="w-[80px]" />
                  <col className="w-[80px]" />
                  <col className="w-[82px]" />
                  <col className="w-[86px]" />
                  <col className="w-[80px]" />
                  <col className="w-[80px]" />
                  <col className="w-[82px]" />
                  <col className="w-[90px]" />
                  <col className="w-[74px]" />
                  <col className="w-[74px]" />
                </colgroup>
                <TableHeader>
                  <TableRow className="border-b-[#C9D4E1] bg-[#EDF3F9] hover:bg-[#EDF3F9]">
                    <TableHead rowSpan={2} className="h-7 px-1.5 text-[#35516C]">
                      Port Name
                    </TableHead>
                    <TableHead rowSpan={2} className="h-7 px-1.5 text-right text-[#35516C]">
                      W.F
                    </TableHead>
                    <TableHead rowSpan={2} className="h-7 px-1.5 text-right text-[#35516C]">
                      Speed
                    </TableHead>
                    <TableHead rowSpan={2} className="h-7 px-1.5 text-right text-[#35516C]">
                      Sea
                    </TableHead>
                    <TableHead rowSpan={2} className="h-7 px-1.5 text-right text-[#35516C]">
                      Port
                    </TableHead>
                    <TableHead rowSpan={2} className="h-7 px-1.5 text-[#35516C]">
                      Type
                    </TableHead>
                    <TableHead colSpan={3} className="h-7 px-1.5 text-center text-[#35516C]">
                      Arrival Supply
                    </TableHead>
                    <TableHead rowSpan={2} className="h-7 px-1.5 text-right text-[#35516C]">
                      Arrival ROB
                    </TableHead>
                    <TableHead colSpan={3} className="h-7 px-1.5 text-center text-[#35516C]">
                      Departure Supply
                    </TableHead>
                    <TableHead rowSpan={2} className="h-7 px-1.5 text-right text-[#35516C]">
                      Departure ROB
                    </TableHead>
                    <TableHead colSpan={2} className="h-7 px-1.5 text-center text-[#35516C]">
                      Consumption
                    </TableHead>
                  </TableRow>
                  <TableRow className="border-b-[#C9D4E1] bg-[#EDF3F9] hover:bg-[#EDF3F9]">
                    {["Quantity", "Unit Price", "Price", "Quantity", "Unit Price", "Price", "Sea", "Port"].map(
                      (header, index) => (
                        <TableHead
                          key={header + index}
                          className="h-7 px-1.5 text-right text-[#35516C]"
                        >
                          {header}
                        </TableHead>
                      ),
                    )}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {displayRows.map((row) => (
                    <TableRow key={row.key} className="h-[25px] border-b-[#D9E2EC] hover:bg-[#F7FAFC]">
                      {row.span > 0 ? (
                        <>
                          <TableCell rowSpan={row.span} className="h-[25px] px-1.5 py-1 align-top">
                            {row.port}
                          </TableCell>
                          <TableCell rowSpan={row.span} className="h-[25px] px-1 py-1 align-top">
                            {renderTableInput(row.key, "wf", row.wf, 0.1, updateRow)}
                          </TableCell>
                          <TableCell rowSpan={row.span} className="h-[25px] px-1 py-1 align-top">
                            {renderTableInput(row.key, "speed", row.speed, 0.1, updateRow)}
                          </TableCell>
                          <TableCell rowSpan={row.span} className="h-[25px] px-1 py-1 align-top">
                            {renderTableInput(row.key, "sea", row.sea, 0.01, updateRow)}
                          </TableCell>
                          <TableCell rowSpan={row.span} className="h-[25px] px-1 py-1 align-top">
                            {renderTableInput(row.key, "portDays", row.portDays, 0.01, updateRow)}
                          </TableCell>
                        </>
                      ) : null}
                      <TableCell className="h-[25px] px-1.5 py-1">{row.type}</TableCell>
                      <TableCell className="h-[25px] px-1 py-1">
                        {renderTableInput(row.key, "arrivalSupplyQty", row.arrivalSupplyQty, 0.1, updateRow)}
                      </TableCell>
                      <TableCell className="h-[25px] px-1 py-1">
                        {renderTableInput(
                          row.key,
                          "arrivalSupplyUnitPrice",
                          row.arrivalSupplyUnitPrice,
                          0.1,
                          updateRow,
                        )}
                      </TableCell>
                      <TableCell className="h-[25px] px-1.5 py-1 text-right">
                        {formatAmount(row.arrivalPrice)}
                      </TableCell>
                      <TableCell className="h-[25px] px-1.5 py-1 text-right">
                        <span style={{ color: row.arrivalRob < 0 ? VE_COLORS.alert : undefined }}>
                          {formatAmount(row.arrivalRob)}
                        </span>
                      </TableCell>
                      <TableCell className="h-[25px] px-1 py-1">
                        {renderTableInput(row.key, "departureSupplyQty", row.departureSupplyQty, 0.1, updateRow)}
                      </TableCell>
                      <TableCell className="h-[25px] px-1 py-1">
                        {renderTableInput(
                          row.key,
                          "departureSupplyUnitPrice",
                          row.departureSupplyUnitPrice,
                          0.1,
                          updateRow,
                        )}
                      </TableCell>
                      <TableCell className="h-[25px] px-1.5 py-1 text-right">
                        {formatAmount(row.departurePrice)}
                      </TableCell>
                      <TableCell className="h-[25px] px-1.5 py-1 text-right">
                        <span style={{ color: row.departureRob < 0 ? VE_COLORS.alert : undefined }}>
                          {formatAmount(row.departureRob)}
                        </span>
                      </TableCell>
                      <TableCell className="h-[25px] px-1 py-1">
                        {renderTableInput(row.key, "seaConsumption", row.seaConsumption, 0.1, updateRow)}
                      </TableCell>
                      <TableCell className="h-[25px] px-1 py-1">
                        {renderTableInput(row.key, "portConsumption", row.portConsumption, 0.1, updateRow)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </section>

          <div className="space-y-3">
            <section className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="text-[12px] font-semibold uppercase tracking-wide text-[#35516C]">
                  Bunker Price
                </div>
                <RadioGroup
                  value={priceMode}
                  onValueChange={(value) => setPriceMode(value as "avg" | "fifo")}
                  className="flex grid-cols-none items-center gap-3"
                >
                  {[
                    { value: "avg", label: "Average" },
                    { value: "fifo", label: "FIFO" },
                  ].map((item) => (
                    <label key={item.value} className="flex items-center gap-1 text-[11px] text-[#35516C]">
                      <RadioGroupItem value={item.value} className="h-3.5 w-3.5" />
                      <span>{item.label}</span>
                    </label>
                  ))}
                </RadioGroup>
              </div>

              <div className="overflow-hidden rounded-none border border-[#C9D4E1]">
                <Table className="border-collapse text-[11px] [&_td]:border [&_td]:border-[#D9E2EC] [&_th]:border [&_th]:border-[#C9D4E1]">
                  <TableHeader>
                    <TableRow className="border-b-[#C9D4E1] bg-[#EDF3F9] hover:bg-[#EDF3F9]">
                      {["", "Type", "Quantity", "Unit Price", "Price", "Total Price"].map((header) => (
                        <TableHead
                          key={header}
                          className="h-7 px-1.5 text-right text-[#35516C] first:text-left"
                        >
                          {header}
                        </TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {priceRows.map((row) => (
                      <TableRow key={row.key} className="h-[25px] border-b-[#D9E2EC] hover:bg-[#F7FAFC]">
                        {row.span > 0 ? (
                          <TableCell rowSpan={row.span} className="h-[25px] px-1.5 py-1 align-top">
                            {row.group}
                          </TableCell>
                        ) : null}
                        <TableCell className="h-[25px] px-1.5 py-1">{row.type}</TableCell>
                        <TableCell className="h-[25px] px-1.5 py-1 text-right">
                          {formatAmount(row.quantity)}
                        </TableCell>
                        <TableCell className="h-[25px] px-1.5 py-1 text-right">
                          {formatAmount(row.unitPrice)}
                        </TableCell>
                        <TableCell className="h-[25px] px-1.5 py-1 text-right">
                          <span style={{ color: row.negative ? VE_COLORS.alert : undefined }}>
                            {formatAmount(row.price)}
                          </span>
                        </TableCell>
                        {row.totalPrice !== null ? (
                          <TableCell rowSpan={row.span} className="h-[25px] px-1.5 py-1 align-top text-right">
                            <span style={{ color: row.negative ? VE_COLORS.alert : undefined }}>
                              {formatAmount(row.totalPrice)}
                            </span>
                          </TableCell>
                        ) : null}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </section>

            <section className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="text-[12px] font-semibold uppercase tracking-wide text-[#35516C]">
                  Bunker Price Comparison
                </div>
                <label className="flex items-center gap-2 text-[11px] text-[#35516C]">
                  <span>Hire / Day</span>
                  <Input
                    value={hirePerDay.toFixed(1)}
                    onChange={(event) => setHirePerDay(parseEditableNumber(event.target.value))}
                    className="h-7 w-[108px] rounded-none border-[#C9D4E1] px-2 text-right text-[11px]"
                    inputMode="decimal"
                  />
                </label>
              </div>

              <div className="overflow-hidden border border-[#C9D4E1] text-[11px]">
                <div className="grid grid-cols-4 bg-[#EDF3F9] font-semibold text-[#35516C]">
                  {["", "Full Speed", "Eco Speed", "Difference (Full - Eco)"].map((header) => (
                    <div key={header} className="border-r border-[#C9D4E1] px-1.5 py-1 text-center last:border-r-0">
                      {header}
                    </div>
                  ))}
                </div>
                {comparisonRows.map((row) => (
                  <div key={row[0]} className="grid grid-cols-4 border-t border-[#D9E2EC]">
                    <div className="border-r border-[#D9E2EC] bg-[#F7FAFC] px-1.5 py-1">{row[0]}</div>
                    <div className="border-r border-[#D9E2EC] px-1.5 py-1 text-right">{row[1]}</div>
                    <div className="border-r border-[#D9E2EC] px-1.5 py-1 text-right">{row[2]}</div>
                    <div
                      className="px-1.5 py-1 text-right"
                      style={{ color: row[3].startsWith("-") ? VE_COLORS.alert : VE_COLORS.sectionTitle }}
                    >
                      {row[3]}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </div>
        </div>
      </div>
    </DialogShell>
  );
}

function renderTableInput(
  rowKey: string,
  field:
    | "wf"
    | "speed"
    | "sea"
    | "portDays"
    | "arrivalSupplyQty"
    | "arrivalSupplyUnitPrice"
    | "departureSupplyQty"
    | "departureSupplyUnitPrice"
    | "seaConsumption"
    | "portConsumption",
  value: number,
  step: number,
  updateRow: (
    rowKey: string,
    field:
      | "wf"
      | "speed"
      | "sea"
      | "portDays"
      | "arrivalSupplyQty"
      | "arrivalSupplyUnitPrice"
      | "departureSupplyQty"
      | "departureSupplyUnitPrice"
      | "seaConsumption"
      | "portConsumption",
    value: number,
  ) => void,
) {
  return (
    <Input
      value={formatEditValue(value, step)}
      onChange={(event) => updateRow(rowKey, field, parseEditableNumber(event.target.value))}
      className={`${tableInputClass(field)} rounded-none border-0 bg-transparent px-1 py-0 text-right text-[11px] leading-[16.5px] shadow-none outline-none focus-visible:border-0 focus-visible:ring-0`}
      inputMode="decimal"
      style={{ border: 0, boxShadow: "none", background: "transparent" }}
    />
  );
}

function tableInputClass(
  field:
    | "wf"
    | "speed"
    | "sea"
    | "portDays"
    | "arrivalSupplyQty"
    | "arrivalSupplyUnitPrice"
    | "departureSupplyQty"
    | "departureSupplyUnitPrice"
    | "seaConsumption"
    | "portConsumption",
) {
  if (field === "wf") return "h-[16.5px] w-[34px]";
  if (field === "speed") return "h-[16.5px] w-[44px]";
  if (field === "sea" || field === "portDays") return "h-[16.5px] w-[46px]";
  return "h-[16.5px] w-full min-w-[64px]";
}

function normalizeRows(rows: RobRow[]): EditableRobRow[] {
  return rows.map((row, index) => ({
    key: row.key,
    port: row.port,
    span: row.span,
    wf: parseAmount(row.wf),
    speed: parseAmount(row.speed),
    sea: parseAmount(row.sea),
    portDays: parseAmount(row.portDays),
    type: row.type as BunkerFuel,
    initialRob: index < 3 ? Math.max(0, parseAmount(row.arrRob)) : 0,
    startUnitPrice: defaultPrices[row.type as BunkerFuel] ?? 0,
    arrivalSupplyQty: parseAmount(row.aQty),
    arrivalSupplyUnitPrice: parseAmount(row.aUnit),
    arrivalRob: 0,
    departureSupplyQty: parseAmount(row.dQty),
    departureSupplyUnitPrice: parseAmount(row.dUnit),
    departureRob: 0,
    seaConsumption: parseAmount(row.cSea),
    portConsumption: parseAmount(row.cPort),
  }));
}

function calculateDisplayRows(rows: EditableRobRow[]): DisplayRobRow[] {
  const previousDeparture = new Map<string, number>();
  return rows.map((row) => {
    const prior = previousDeparture.get(row.type) ?? row.initialRob;
    const arrivalRob = prior - row.seaConsumption;
    const departureRob =
      arrivalRob + row.arrivalSupplyQty + row.departureSupplyQty - row.portConsumption;
    previousDeparture.set(row.type, departureRob);

    return {
      ...row,
      arrivalRob,
      departureRob,
      arrivalPrice: row.arrivalSupplyQty * row.arrivalSupplyUnitPrice,
      departurePrice: row.departureSupplyQty * row.departureSupplyUnitPrice,
    };
  });
}

function buildBunkerPriceRows(rows: DisplayRobRow[], priceMode: "avg" | "fifo") {
  const summary = valueBunkerPlan(
    rows.map((row) => ({
      type: row.type,
      initialRob: row.initialRob,
      startUnitPrice: row.startUnitPrice,
      arrivalSupplyQty: row.arrivalSupplyQty,
      arrivalSupplyUnitPrice: row.arrivalSupplyUnitPrice,
      departureSupplyQty: row.departureSupplyQty,
      departureSupplyUnitPrice: row.departureSupplyUnitPrice,
      seaConsumption: row.seaConsumption,
      portConsumption: row.portConsumption,
    })),
    defaultPrices,
  );
  const priceField = priceMode === "fifo" ? "start" : "avg";

  return [
    ...summary.map((row, index) => ({
      key: `s-${row.type}`,
      group: index === 0 ? "Start ROB" : "",
      span: index === 0 ? summary.length : 0,
      type: row.type,
      quantity: row.initialQty,
      unitPrice:
        priceField === "start"
          ? row.initialQty > 0
            ? row.initialCost / row.initialQty
            : row.averageUnitPrice
          : row.averageUnitPrice,
      price: row.initialCost,
      totalPrice: index === 0 ? summary.reduce((total, item) => total + item.initialCost, 0) : null,
      negative: false,
    })),
    ...summary.map((row, index) => ({
      key: `u-${row.type}`,
      group: index === 0 ? "Supply" : "",
      span: index === 0 ? summary.length : 0,
      type: row.type,
      quantity: row.supplyQty,
      unitPrice: row.supplyQty > 0 ? row.supplyCost / row.supplyQty : row.averageUnitPrice,
      price: row.supplyCost,
      totalPrice: index === 0 ? summary.reduce((total, item) => total + item.supplyCost, 0) : null,
      negative: false,
    })),
    ...summary.map((row, index) => ({
      key: `c-${row.type}`,
      group: index === 0 ? "Consumption" : "",
      span: index === 0 ? summary.length : 0,
      type: row.type,
      quantity: row.consumptionQty,
      unitPrice: row.averageUnitPrice,
      price: row.consumptionCost,
      totalPrice: index === 0 ? summary.reduce((total, item) => total + item.consumptionCost, 0) : null,
      negative: false,
    })),
    ...summary.map((row, index) => ({
      key: `r-${row.type}`,
      group: index === 0 ? "Remain" : "",
      span: index === 0 ? summary.length : 0,
      type: row.type,
      quantity: row.remainQty,
      unitPrice: row.averageUnitPrice,
      price: row.remainValue,
      totalPrice: index === 0 ? summary.reduce((total, item) => total + item.remainValue, 0) : null,
      negative: row.remainQty < 0,
    })),
  ] satisfies BunkerPriceRow[];
}

function buildComparisonRows(
  hirePerDay: number,
  efficiencyFactor: number,
  priceRows: BunkerPriceRow[],
): Array<[string, string, string, string]> {
  const bunkerExpense =
    priceRows.find((row) => row.group === "Consumption" && row.totalPrice !== null)?.totalPrice ?? 0;
  const baseDuration = 63.6;
  const ecoDuration = baseDuration / Math.max(efficiencyFactor, 0.5);
  const ecoBunker = bunkerExpense * efficiencyFactor;
  const fullHire = baseDuration * hirePerDay;
  const ecoHire = ecoDuration * hirePerDay;
  const fullTotal = fullHire + bunkerExpense;
  const ecoTotal = ecoHire + ecoBunker;
  const bunkerQty = priceRows
    .filter((row) => row.key.startsWith("c-"))
    .reduce((total, row) => total + row.quantity, 0);
  const ecoQty = bunkerQty * efficiencyFactor;
  const fullProfit = 15217.5;
  const ecoProfit = fullProfit + (fullTotal - ecoTotal);

  return [
    ["Duration", formatAmount(baseDuration), formatAmount(ecoDuration), formatAmount(baseDuration - ecoDuration)],
    ["Hire", formatAmount(fullHire), formatAmount(ecoHire), formatAmount(fullHire - ecoHire)],
    ["Bunker Consumption", formatAmount(bunkerQty), formatAmount(ecoQty), formatAmount(bunkerQty - ecoQty)],
    ["Bunker Expense", formatAmount(bunkerExpense), formatAmount(ecoBunker), formatAmount(bunkerExpense - ecoBunker)],
    ["Total Expense", formatAmount(fullTotal), formatAmount(ecoTotal), formatAmount(fullTotal - ecoTotal)],
    ["Daily C/Base", formatAmount(fullTotal / baseDuration), formatAmount(ecoTotal / ecoDuration), formatAmount(fullTotal / baseDuration - ecoTotal / ecoDuration)],
    ["Profit", formatAmount(fullProfit), formatAmount(ecoProfit), formatAmount(fullProfit - ecoProfit)],
  ];
}

function buildWarning(rows: DisplayRobRow[], enabledFuels: Record<BunkerFuel, boolean>) {
  const insufficient = fuelTypes.filter(
    (type) => enabledFuels[type] && rows.some((row) => row.type === type && row.departureRob < 0),
  );
  return insufficient.length > 0 ? `Bunker supply (${insufficient.join(", ")}) is insufficient.` : "";
}

function parseAmount(value: string) {
  const parsed = Number(value.replace(/,/g, ""));
  return Number.isFinite(parsed) ? parsed : 0;
}

function parseEditableNumber(value: string) {
  const normalized = value.replace(/,/g, "").trim();
  if (!normalized) return 0;
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : 0;
}

function sanitizeNumber(value: number) {
  return Number.isFinite(value) ? value : 0;
}

function formatEditValue(value: number, step: number) {
  if (!Number.isFinite(value)) return "";
  const decimals = step >= 1 ? 0 : step >= 0.1 ? 1 : 2;
  return value.toFixed(decimals);
}

function formatAmount(value: number) {
  return value.toLocaleString("en-US", {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  });
}
