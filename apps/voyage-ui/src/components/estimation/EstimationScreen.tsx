import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  FilePlus,
  Trash2,
  Save,
  SaveAll,
  FolderOpen,
  RefreshCw,
  Undo2,
  Redo2,
  Plus,
  Minus,
  Settings2,
  LayoutGrid,
  Link2,
  FileText,
  Search,
  Calendar,
  X,
  PenLine,
  Pencil,
  Gauge,
  Anchor,
  Calculator,
  Sigma,
  PlusSquare,
  BarChart3,
  StickyNote,
  Settings,
  Save as SaveIcon,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import NewVesselDialog from "./NewVesselDialog";
// ⇩⇩ Toàn bộ nhãn tiếng Việt của các form được gom tại: src/components/estimation/labels.ts ⇩⇩
import { L, FONT_BASE } from "./labels";
import { Link } from "@tanstack/react-router";

function RibbonBtn({
  icon: Icon,
  label,
  onClick,
  accent,
}: {
  icon: LucideIcon;
  label: string;
  onClick?: () => void;
  accent?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className="flex h-16 w-[68px] flex-col items-center justify-start gap-1 rounded px-1 py-1 text-[11px] text-foreground hover:bg-accent"
    >
      <Icon
        className={`h-7 w-7 ${accent ? "text-primary" : "text-foreground/80"}`}
        strokeWidth={1.5}
      />
      <span className="leading-tight text-center">{label}</span>
    </button>
  );
}

function SectionHeader({ children }: { children: React.ReactNode }) {
  return <h2 className="mb-1 text-base font-bold text-primary">{children}</h2>;
}

function ICell({
  value = "",
  className = "",
  right = false,
}: {
  value?: string | number;
  className?: string;
  right?: boolean;
}) {
  return (
    <Input
      defaultValue={value as string}
      className={`h-7 rounded-none border-0 bg-transparent px-1 text-xs ${right ? "text-right" : ""} focus-visible:ring-1 ${className}`}
    />
  );
}

function YCell({ value = "", right = true }: { value?: string | number; right?: boolean }) {
  return (
    <Input
      defaultValue={value as string}
      className={`h-7 rounded-none border-0 bg-amber-50 px-1 text-xs ${right ? "text-right" : ""} focus-visible:ring-1`}
    />
  );
}

function TabBtn({
  active,
  children,
  onClose,
}: {
  active?: boolean;
  children: React.ReactNode;
  onClose?: boolean;
}) {
  return (
    <div
      className={`flex items-center gap-1 border border-b-0 px-3 py-1 text-xs ${active ? "bg-background" : "bg-muted text-muted-foreground"}`}
    >
      {children}
      {active && <PenLine className="h-3 w-3 text-primary" />}
      {onClose && <X className="h-3 w-3 text-muted-foreground hover:text-foreground" />}
    </div>
  );
}

export default function EstimationScreen() {
  const [openVessel, setOpenVessel] = useState(false);

  return (
    <div className={`min-h-screen bg-background text-foreground ${FONT_BASE}`}>
      {/* Ribbon */}
      <div className="flex items-end gap-1 border-b bg-card px-2 py-1">
        <RibbonBtn icon={FilePlus} label={L.new} accent />
        <RibbonBtn icon={Trash2} label={L.delete} accent />
        <div className="mx-1 h-12 w-px bg-border" />
        <RibbonBtn icon={Save} label={L.save} accent />
        <RibbonBtn icon={SaveAll} label={L.saveAs} accent />
        <div className="mx-1 h-12 w-px bg-border" />
        <RibbonBtn icon={FolderOpen} label={L.open} accent />
        <RibbonBtn icon={RefreshCw} label={L.reload} accent />
        <div className="mx-1 h-12 w-px bg-border" />
        <RibbonBtn icon={Undo2} label={L.undo} accent />
        <RibbonBtn icon={Redo2} label={L.redo} />
        <div className="mx-1 h-12 w-px bg-border" />
        <RibbonBtn icon={Plus} label={L.increase} />
        <RibbonBtn icon={Minus} label={L.decrease} />
        <div className="mx-1 h-12 w-px bg-border" />
        <RibbonBtn icon={Settings2} label={L.options} accent />
        <div className="mx-1 h-12 w-px bg-border" />
        <RibbonBtn icon={Link2} label={L.loadContract} accent />
        <RibbonBtn icon={FileText} label={L.relatedContract} accent />
        <div className="ml-auto" />
      </div>

      {/* Tab strip */}
      <div className="flex items-end gap-0 border-b bg-muted/40 px-3 pt-2">
        <TabBtn active>
          <span className="text-primary">⚓</span>
          {L.voyage1}
          <PenLine className="h-3 w-3 text-primary" />
          <X className="h-3 w-3 text-muted-foreground" />
        </TabBtn>
        <TabBtn>
          <span>⚓</span>
          {L.voyage2}
        </TabBtn>
        <TabBtn>
          <span>🚢</span>
          {L.cargoRelet1}
        </TabBtn>
        <TabBtn>
          <span>📋</span>
          {L.timeCharter1}
        </TabBtn>
      </div>

      {/* Body */}
      <div className="space-y-4 bg-background p-4">
        <div className="flex justify-end text-xs text-muted-foreground">
          {L.lastUpdate} : 9/6/2022 15:06
        </div>

        {/* Vessel Particular + Bunker */}
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_1.4fr]">
          <div>
            <SectionHeader>{L.vesselParticular}</SectionHeader>
            <div className="overflow-hidden rounded border">
              <Table className="text-xs">
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead className="h-7">{L.mv}</TableHead>
                    <TableHead className="h-7">{L.dwt}</TableHead>
                    <TableHead className="h-7">{L.draftM}</TableHead>
                    <TableHead className="h-7">{L.tpc}</TableHead>
                    <TableHead className="h-7">{L.built}</TableHead>
                    <TableHead className="h-7">{L.kind}</TableHead>
                    <TableHead className="h-7">{L.type}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow>
                    <TableCell className="p-0">
                      <div className="flex items-center">
                        <Input
                          defaultValue="Xin Meng Xiang"
                          className="h-7 rounded-none border-0 px-1 text-xs"
                        />
                        <button onClick={() => setOpenVessel(true)} className="px-1">
                          <Pencil className="h-3 w-3 text-primary" />
                        </button>
                        <button className="px-1">
                          <X className="h-3 w-3 text-destructive" />
                        </button>
                      </div>
                    </TableCell>
                    <TableCell className="p-0">
                      <ICell value="74,222" right />
                    </TableCell>
                    <TableCell className="p-0">
                      <ICell value="13.95" right />
                    </TableCell>
                    <TableCell className="p-0">
                      <ICell value="66.20" right />
                    </TableCell>
                    <TableCell className="p-0">
                      <ICell value="2002" right />
                    </TableCell>
                    <TableCell className="p-0">
                      <ICell value="SCBC" />
                    </TableCell>
                    <TableCell className="p-0">
                      <ICell value="Owned" />
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
              <div className="flex items-center gap-1 border-t bg-muted/30 px-1 py-0.5">
                <button className="rounded p-1 hover:bg-accent">
                  <LayoutGrid className="h-3 w-3" />
                </button>
              </div>
            </div>
          </div>

          <div>
            <div className="mb-1 flex items-center justify-between">
              <div className="flex items-end gap-0">
                {["Full", "Eco", "Custom1", "Custom2", "Custom3"].map((t, i) => (
                  <TabBtn key={t} active={i === 0}>
                    {t}
                  </TabBtn>
                ))}
              </div>
              <label className="flex items-center gap-1 text-xs">
                <Checkbox id="fpc" /> {L.fixPortConsumption}
              </label>
            </div>
            <div className="overflow-hidden rounded border">
              <Table className="text-xs">
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead className="h-7">{L.ballast}</TableHead>
                    <TableHead className="h-7">{L.laden}</TableHead>
                    <TableHead className="h-7">{L.main}</TableHead>
                    <TableHead className="h-7">{L.type}</TableHead>
                    <TableHead className="h-7">{L.ballast}</TableHead>
                    <TableHead className="h-7">{L.laden}</TableHead>
                    <TableHead className="h-7">{L.idle}</TableHead>
                    <TableHead className="h-7">{L.work}</TableHead>
                    <TableHead className="h-7">{L.channel}</TableHead>
                    <TableHead className="h-7">{L.sub}</TableHead>
                    <TableHead className="h-7">{L.type}</TableHead>
                    <TableHead className="h-7">{L.sea}</TableHead>
                    <TableHead className="h-7">{L.idle}</TableHead>
                    <TableHead className="h-7">{L.work}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow>
                    <TableCell className="p-0">
                      <ICell value="13.00" right />
                    </TableCell>
                    <TableCell className="p-0">
                      <ICell value="12.00" right />
                    </TableCell>
                    <TableCell className="p-1">Normal</TableCell>
                    <TableCell className="p-1">VLSFO</TableCell>
                    <TableCell className="p-0">
                      <ICell value="32.00" right />
                    </TableCell>
                    <TableCell className="p-0">
                      <ICell value="32.00" right />
                    </TableCell>
                    <TableCell className="p-0">
                      <ICell value="3.50" right />
                    </TableCell>
                    <TableCell className="p-0">
                      <ICell value="5.50" right />
                    </TableCell>
                    <TableCell className="p-0">
                      <ICell value="1.00" right />
                    </TableCell>
                    <TableCell className="p-1">Normal</TableCell>
                    <TableCell className="p-1">MGO</TableCell>
                    <TableCell className="p-0">
                      <ICell value="0.10" right />
                    </TableCell>
                    <TableCell className="p-0">
                      <ICell value="0.10" right />
                    </TableCell>
                    <TableCell className="p-0">
                      <ICell value="0.20" right />
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="p-1" />
                    <TableCell className="p-1" />
                    <TableCell className="p-1 text-primary">ECA</TableCell>
                    <TableCell className="p-1">ULSFO</TableCell>
                    <TableCell className="p-0">
                      <ICell value="32.00" right />
                    </TableCell>
                    <TableCell className="p-0">
                      <ICell value="32.00" right />
                    </TableCell>
                    <TableCell className="p-0">
                      <ICell value="3.50" right />
                    </TableCell>
                    <TableCell className="p-0">
                      <ICell value="5.50" right />
                    </TableCell>
                    <TableCell className="p-0">
                      <ICell value="1.00" right />
                    </TableCell>
                    <TableCell className="p-1 text-primary">ECA</TableCell>
                    <TableCell className="p-1">MGO</TableCell>
                    <TableCell className="p-0">
                      <ICell value="0.10" right />
                    </TableCell>
                    <TableCell className="p-0">
                      <ICell value="0.10" right />
                    </TableCell>
                    <TableCell className="p-0">
                      <ICell value="0.20" right />
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>
          </div>
        </div>

        {/* Cargo */}
        <div>
          <div className="mb-1 flex items-center justify-between">
            <SectionHeader>{L.cargo}</SectionHeader>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" className="h-7 gap-1 text-xs">
                <Calculator className="h-3 w-3" />
                {L.loadableQtyCalc}
              </Button>
              <Button variant="outline" size="sm" className="h-7 gap-1 text-xs">
                <Sigma className="h-3 w-3" />
                {L.frtSimulator}
              </Button>
            </div>
          </div>
          <div className="overflow-hidden rounded border">
            <Table className="text-xs">
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead className="h-7 w-8 text-center">#</TableHead>
                  <TableHead className="h-7">{L.account}</TableHead>
                  <TableHead className="h-7">{L.cargoName}</TableHead>
                  <TableHead className="h-7">{L.loadingPort}</TableHead>
                  <TableHead className="h-7">{L.dischargingPort}</TableHead>
                  <TableHead className="h-7 text-right">{L.quantity}</TableHead>
                  <TableHead className="h-7" />
                  <TableHead className="h-7 text-right">{L.frt}</TableHead>
                  <TableHead className="h-7">{L.term}</TableHead>
                  <TableHead className="h-7 text-right">{L.totalFreight}</TableHead>
                  <TableHead className="h-7 text-right">{L.aComm}</TableHead>
                  <TableHead className="h-7 text-right">{L.brkg}</TableHead>
                  <TableHead className="h-7 text-right">{L.frtTax}</TableHead>
                  <TableHead className="h-7">{L.linerTerm}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  <TableCell className="p-1 text-center">1</TableCell>
                  <TableCell className="p-0">
                    <ICell value="Coal Trader" />
                  </TableCell>
                  <TableCell className="p-0">
                    <ICell value="Coal in Bulk" />
                  </TableCell>
                  <TableCell className="p-0">
                    <ICell value="Vostochny (RU) [+10:00]" />
                  </TableCell>
                  <TableCell className="p-0">
                    <ICell value="Lanshan (CN) [+08:00]" />
                  </TableCell>
                  <TableCell className="p-0">
                    <YCell value="70,000.00" />
                  </TableCell>
                  <TableCell className="p-1 text-xs">MT</TableCell>
                  <TableCell className="p-0">
                    <YCell value="12.00" />
                  </TableCell>
                  <TableCell className="p-1 text-xs">FIO</TableCell>
                  <TableCell className="p-0">
                    <YCell value="840,000.00" />
                  </TableCell>
                  <TableCell className="p-0">
                    <ICell value="3.75 %" right />
                  </TableCell>
                  <TableCell className="p-0">
                    <ICell value="1.25 %" right />
                  </TableCell>
                  <TableCell className="p-1" />
                  <TableCell className="p-1">
                    <Search className="h-3 w-3 text-muted-foreground" />
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="p-1 text-center text-muted-foreground">2</TableCell>
                  <TableCell className="p-1" colSpan={13}>
                    <Pencil className="h-3 w-3 text-muted-foreground" />
                  </TableCell>
                </TableRow>
                <TableRow className="bg-muted/20 font-semibold">
                  <TableCell className="p-1" />
                  <TableCell className="p-1" colSpan={4} />
                  <TableCell className="p-1 text-right">70,000.00</TableCell>
                  <TableCell className="p-1" />
                  <TableCell className="p-1 text-right">12.00</TableCell>
                  <TableCell className="p-1" />
                  <TableCell className="p-1 text-right">840,000.00</TableCell>
                  <TableCell className="p-1 text-right">3.75 %</TableCell>
                  <TableCell className="p-1 text-right">1.25 %</TableCell>
                  <TableCell className="p-1 text-right">0.00 %</TableCell>
                  <TableCell className="p-1 text-right">0.00</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>
        </div>

        {/* Port Rotation */}
        <div>
          <div className="mb-1 flex items-center gap-4">
            <SectionHeader>{L.portRotation}</SectionHeader>
            <div className="flex items-center gap-3 text-xs">
              <label className="flex items-center gap-1">
                <Checkbox defaultChecked id="suez" /> SUEZ
              </label>
              <label className="flex items-center gap-1">
                <Checkbox defaultChecked id="panama" /> PANAMA
              </label>
              <label className="flex items-center gap-1">
                <Checkbox id="kiel" /> KIEL
              </label>
              <span className="text-muted-foreground">
                {L.totalDuration}:{" "}
                <span className="font-semibold text-foreground">10.56 (ECA: 0)</span> {L.days}
                (Ballast: 0, Laden: 0, Port: 10.56)
              </span>
            </div>
          </div>
          <div className="overflow-hidden rounded border">
            <Table className="text-xs">
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead className="h-7">{L.type}</TableHead>
                  <TableHead className="h-7">{L.portNameCoord}</TableHead>
                  <TableHead className="h-7 text-right">{L.distanceTTLECA}</TableHead>
                  <TableHead className="h-7 text-right">{L.wf}</TableHead>
                  <TableHead className="h-7 text-right">{L.spd}</TableHead>
                  <TableHead className="h-7 text-right">{L.sea}</TableHead>
                  <TableHead className="h-7 text-right">{L.ldRate}</TableHead>
                  <TableHead className="h-7 text-right">{L.portIW}</TableHead>
                  <TableHead className="h-7 text-right">{L.dem}</TableHead>
                  <TableHead className="h-7 text-right">{L.des}</TableHead>
                  <TableHead className="h-7 text-right">{L.portCharge}</TableHead>
                  <TableHead className="h-7">{L.arrival}</TableHead>
                  <TableHead className="h-7">{L.departure}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {[
                  {
                    type: "Ballast",
                    port: "Dangjin (KR) [+09:00]",
                    wf: "",
                    spd: "",
                    sea: "",
                    ld: "",
                    pw: "",
                    dem: "",
                    des: "",
                    pc: "",
                    port2: "",
                  },
                  {
                    type: "Loading",
                    port: "Vostochny (RU) [+10:00]",
                    wf: "5.0 %",
                    spd: "13.00",
                    sea: "",
                    ld: "15,000.00",
                    pw: "0.50",
                    dem: "4.67",
                    des: "",
                    pc: "5,000.00",
                    port2: "65,000.00",
                  },
                  {
                    type: "Dischg.",
                    port: "Lanshan (CN) [+08:00]",
                    wf: "5.0 %",
                    spd: "12.00",
                    sea: "",
                    ld: "18,000.00",
                    pw: "0.50",
                    dem: "3.89",
                    des: "",
                    pc: "12,777.78",
                    port2: "45,000.00",
                  },
                ].map((r, i) => (
                  <TableRow key={i}>
                    <TableCell className="p-1">{r.type}</TableCell>
                    <TableCell className="p-0">
                      <div className="flex items-center">
                        <Input
                          defaultValue={r.port}
                          className="h-7 rounded-none border-0 px-1 text-xs"
                        />
                        <Search className="mx-1 h-3 w-3 text-muted-foreground" />
                      </div>
                    </TableCell>
                    <TableCell className="p-0">
                      <YCell value="" />
                    </TableCell>
                    <TableCell className="p-0">
                      <ICell value={r.wf} right />
                    </TableCell>
                    <TableCell className="p-0">
                      <ICell value={r.spd} right />
                    </TableCell>
                    <TableCell className="p-0">
                      <YCell value="" />
                    </TableCell>
                    <TableCell className="p-0">
                      <ICell value={r.ld} right />
                    </TableCell>
                    <TableCell className="p-0">
                      <ICell value={r.pw} right />
                    </TableCell>
                    <TableCell className="p-0">
                      <ICell value={r.dem} right />
                    </TableCell>
                    <TableCell className="p-0">
                      <ICell value={r.des} right />
                    </TableCell>
                    <TableCell className="p-0">
                      <ICell value={r.pc} right />
                    </TableCell>
                    <TableCell className="p-0">
                      <ICell value={r.port2} right />
                    </TableCell>
                    <TableCell className="p-0">
                      <ICell value="" />
                    </TableCell>
                  </TableRow>
                ))}
                {[4, 5].map((n) => (
                  <TableRow key={n}>
                    <TableCell className="p-1 text-muted-foreground">{n === 4 ? "" : ""}</TableCell>
                    <TableCell className="p-1" colSpan={12}>
                      {n === 4 && <Pencil className="h-3 w-3 text-muted-foreground" />}
                    </TableCell>
                  </TableRow>
                ))}
                <TableRow className="bg-muted/20 font-semibold">
                  <TableCell className="p-1">{L.margin}</TableCell>
                  <TableCell className="p-1" colSpan={4} />
                  <TableCell className="p-1 text-right">1.00</TableCell>
                  <TableCell className="p-1" colSpan={7} />
                </TableRow>
                <TableRow className="bg-muted/20 font-semibold">
                  <TableCell className="p-1" />
                  <TableCell className="p-1" />
                  <TableCell className="p-1 text-right">0 / 0</TableCell>
                  <TableCell className="p-1" />
                  <TableCell className="p-1" />
                  <TableCell className="p-1 text-right">0.00</TableCell>
                  <TableCell className="p-1" />
                  <TableCell className="p-1 text-right">2.00</TableCell>
                  <TableCell className="p-1 text-right">8.56</TableCell>
                  <TableCell className="p-1 text-right">0.00</TableCell>
                  <TableCell className="p-1 text-right">17,777.78</TableCell>
                  <TableCell className="p-1 text-right">110,000.00</TableCell>
                  <TableCell className="p-1" />
                </TableRow>
              </TableBody>
            </Table>
          </div>
          <div className="mt-1 flex items-center justify-between">
            <div />
            <div className="flex items-center gap-2 text-xs">
              <select className="h-7 rounded border bg-background px-2 text-xs">
                <option>{L.days}</option>
                <option>{L.hours}</option>
              </select>
              <Button variant="default" size="sm" className="h-7 gap-1 text-xs">
                <Anchor className="h-3 w-3" />
                {L.portLocal}
              </Button>
              <Button variant="outline" size="sm" className="h-7 gap-1 text-xs">
                <Calendar className="h-3 w-3" />
                {L.pcTime}
              </Button>
              <select className="h-7 rounded border bg-background px-2 text-xs">
                <option>{L.portLocalTime}</option>
                <option>{L.utc}</option>
              </select>
            </div>
          </div>
        </div>

        {/* Bottom: Operation expense / Bunker / Result */}
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          {/* Operation Expense */}
          <div>
            <SectionHeader>{L.operationExpense}</SectionHeader>
            <div className="overflow-hidden rounded border">
              <Table className="text-xs">
                <TableBody>
                  {[
                    [L.demDes, "17,777.78", L.bunkerExpense, "39,941.11"],
                    [L.addComm, "31,500.00", L.cev, "527.78"],
                    [L.brokerage, "10,500.00", L.ilohc, "6,000.00"],
                    [L.freightTax, "0.00", L.ballastBonus, ""],
                    [L.linerTerms, "0.00", L.routingService, ""],
                    [L.portCharge, "110,000.00", L.others, "0.00"],
                  ].map((r, i) => (
                    <TableRow key={i}>
                      <TableCell className="p-1 w-24 text-muted-foreground">{r[0]}</TableCell>
                      <TableCell className="p-1 text-right">{r[1]}</TableCell>
                      <TableCell className="p-1 w-28 text-muted-foreground">{r[2]}</TableCell>
                      <TableCell className="p-1 text-right">{r[3]}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>

          {/* Bunker Expense */}
          <div>
            <div className="mb-1 flex items-center justify-between">
              <SectionHeader>{L.bunkerExpense}</SectionHeader>
              <div className="flex gap-1">
                <Button variant="outline" size="sm" className="h-7 text-xs">
                  {L.recent}
                </Button>
                <Button variant="outline" size="sm" className="h-7 gap-1 text-xs">
                  <BarChart3 className="h-3 w-3" />
                  {L.bunkerIndex}
                </Button>
                <Button variant="outline" size="sm" className="h-7 gap-1 text-xs">
                  <Gauge className="h-3 w-3" />
                  {L.bunkerSimulator}
                </Button>
              </div>
            </div>
            <div className="overflow-hidden rounded border">
              <Table className="text-xs">
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead className="h-7" />
                    <TableHead className="h-7 text-right">{L.pricePerMT}</TableHead>
                    <TableHead className="h-7 text-right">{L.consumption}</TableHead>
                    <TableHead className="h-7 text-right">{L.expense}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {[
                    ["VLSFO", "700.00", "54.06", "37,838.89"],
                    ["MGO", "1,100.00", "1.91", "2,102.22"],
                    ["ULSFO", "1,200.00", "0.00", "0.00"],
                  ].map((r, i) => (
                    <TableRow key={i}>
                      <TableCell className="p-1 font-medium">{r[0]}</TableCell>
                      <TableCell className="p-1 text-right">{r[1]}</TableCell>
                      <TableCell className="p-1 text-right">{r[2]}</TableCell>
                      <TableCell className="p-1 text-right">{r[3]}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>

          {/* Result */}
          <div>
            <div className="mb-1 flex items-center justify-between">
              <SectionHeader>{L.result}</SectionHeader>
              <div className="flex gap-1">
                <Button variant="outline" size="sm" className="h-7 gap-1 text-xs">
                  <PlusSquare className="h-3 w-3" />
                  {L.resultPlus}
                </Button>
                <Button variant="outline" size="sm" className="h-7 gap-1 text-xs">
                  <BarChart3 className="h-3 w-3" />
                  {L.analyzer}
                </Button>
                <Button variant="outline" size="sm" className="h-7 gap-1 text-xs">
                  <StickyNote className="h-3 w-3" />
                  {L.remark}
                </Button>
              </div>
            </div>
            <div className="overflow-hidden rounded border">
              <Table className="text-xs">
                <TableBody>
                  {[
                    [L.hirePerDay, "20,000.00", L.revenue, "840,000.00"],
                    [L.hAddComm, "3.75 %", L.opExpense, "216,246.67", true],
                    [L.netHire, "19,250.00", L.opProfit, "623,753.33"],
                    [L.cBase, "59,092.42", L.totalHire, "203,194.44"],
                    ["", "", L.totalExpense, "419,441.11"],
                  ].map((r, i) => (
                    <TableRow key={i}>
                      <TableCell className="p-1 w-28 text-muted-foreground">{r[0]}</TableCell>
                      <TableCell className={`p-1 text-right ${r[4] ? "bg-primary/10" : ""}`}>
                        {r[1]}
                      </TableCell>
                      <TableCell className="p-1 w-28 text-muted-foreground">{r[2]}</TableCell>
                      <TableCell className="p-1 text-right">{r[3]}</TableCell>
                    </TableRow>
                  ))}
                  <TableRow className="bg-amber-100 font-bold">
                    <TableCell className="p-1" />
                    <TableCell className="p-1" />
                    <TableCell className="p-1">{L.profitUSD}</TableCell>
                    <TableCell className="p-1 text-right text-base">420,558.89</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>
          </div>
        </div>
      </div>

      {/* Status bar */}
      <div className="flex items-center justify-between border-t bg-muted/30 px-3 py-1 text-xs text-muted-foreground">
        <span>{L.reset}</span>
        <input type="range" defaultValue={100} className="w-48" />
        <span>100 %</span>
      </div>

      <NewVesselDialog open={openVessel} onOpenChange={setOpenVessel} />

      {/* dev nav */}
      <div className="fixed bottom-3 right-3 flex gap-2 rounded border bg-card p-2 shadow">
        <Link to="/" className="text-xs text-primary underline">
          {L.navEstimation}
        </Link>
        <Link to="/operation" className="text-xs text-primary underline">
          {L.navOperation}
        </Link>
        <Link to="/time-charter" className="text-xs text-primary underline">
          {L.navTimeCharter}
        </Link>
        <Link to="/loadable-quantity-calc" className="text-xs text-primary underline">
          {L.navLoadableQty}
        </Link>
        <Link to="/cargo-relet" className="text-xs text-primary underline">
          {L.navCargoRelet}
        </Link>
      </div>
    </div>
  );
}
