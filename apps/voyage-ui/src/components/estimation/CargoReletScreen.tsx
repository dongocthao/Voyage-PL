import { Link } from "@tanstack/react-router";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
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
  Settings,
  PenLine,
  X,
  Package,
  Search,
  Calendar,
  BarChart3,
  StickyNote,
  ArrowRightToLine,
  ArrowLeftToLine,
  Rows3,
  Columns3,
  Globe,
  Monitor,
  ChevronDown,
} from "lucide-react";
import { RibbonBtn, SectionHeader, ICell, YCell, TabBtn } from "./shared";
// ⇩⇩ Toàn bộ nhãn tiếng Việt được gom tại: src/components/estimation/labels.ts ⇩⇩
import { L, FONT_BASE } from "./labels";

const HEAD_CP = [L.frt, L.aComm, L.brkg, L.netFrt, L.linerTerms];
const SUB_CP = [L.frt, L.aComm, L.netFrt, L.linerTerms];

export default function CargoReletScreen() {
  return (
    <div className={`min-h-screen bg-background text-foreground ${FONT_BASE}`}>
      {/* Ribbon */}
      <div className="flex items-end gap-1 border-b bg-card px-2 py-1">
        <RibbonBtn icon={FilePlus} label={L.new} accent />
        <RibbonBtn icon={Trash2} label={L.delete} accent />
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
      </div>

      {/* Tabs */}
      <div className="flex items-end gap-0 border-b bg-muted/40 px-3 pt-2">
        <TabBtn active>
          <Package className="h-3 w-3 text-primary" />
          {L.cargoRelet1}
          <PenLine className="h-3 w-3 text-primary" />
        </TabBtn>
      </div>

      <div className="space-y-4 bg-background p-4">
        <div className="flex justify-end text-xs text-muted-foreground">
          {L.lastUpdate} : 2021-01-14 11:38 , SJLee
        </div>

        {/* Vessel Particular + Bunker */}
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_1.6fr]">
          <div>
            <SectionHeader>{L.vesselParticular}</SectionHeader>
            <div className="overflow-hidden rounded border">
              <Table className="text-xs">
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    {[L.mv, L.dwt, L.draftM, L.tpc, L.built, L.kind, L.type].map((h) => (
                      <TableHead key={h} className="h-7">
                        {h}
                      </TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow>
                    <TableCell className="p-0">
                      <div className="flex items-center">
                        <input
                          defaultValue="Netpas Prosperity"
                          className="h-7 w-full border-0 bg-transparent px-1 text-xs outline-none"
                        />
                        <button className="px-1">
                          <PenLine className="h-3 w-3 text-primary" />
                        </button>
                        <button className="px-1">
                          <X className="h-3 w-3 text-destructive" />
                        </button>
                      </div>
                    </TableCell>
                    <TableCell className="p-0">
                      <ICell value="57,650" right />
                    </TableCell>
                    <TableCell className="p-0">
                      <ICell value="12.80" right />
                    </TableCell>
                    <TableCell className="p-0">
                      <ICell value="58.00" right />
                    </TableCell>
                    <TableCell className="p-0">
                      <ICell value="2018" right />
                    </TableCell>
                    <TableCell className="p-0">
                      <ICell value="SDBC" />
                    </TableCell>
                    <TableCell className="p-0">
                      <ICell value="" />
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
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
              <label className="flex items-center gap-1 text-xs text-muted-foreground">
                <Checkbox className="h-3 w-3" /> {L.fixPortConsumption}
              </label>
            </div>
            <div className="grid grid-cols-[7rem_1fr_1fr_1fr] gap-2 text-xs">
              {/* Ballast/Laden */}
              <div className="overflow-hidden rounded border">
                <Table className="text-xs">
                  <TableHeader>
                    <TableRow className="bg-muted/50">
                      <TableHead className="h-7">{L.ballast}</TableHead>
                      <TableHead className="h-7">{L.laden}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <TableRow>
                      <TableCell className="p-0">
                        <ICell value="14.50" right />
                      </TableCell>
                      <TableCell className="p-0">
                        <ICell value="14.00" right />
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </div>
              {/* Main */}
              <div className="overflow-hidden rounded border">
                <Table className="text-xs">
                  <TableHeader>
                    <TableRow className="bg-muted/50">
                      {[L.main, L.type, L.ballast, L.laden, L.idle, L.work].map((h) => (
                        <TableHead key={h} className="h-7">
                          {h}
                        </TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <TableRow>
                      <TableCell className="p-0">
                        <ICell value="Normal" />
                      </TableCell>
                      <TableCell className="p-0">
                        <ICell value="VLSFO" />
                      </TableCell>
                      <TableCell className="p-0">
                        <ICell value="32.00" right />
                      </TableCell>
                      <TableCell className="p-0">
                        <ICell value="32.00" right />
                      </TableCell>
                      <TableCell className="p-0">
                        <ICell value="3.00" right />
                      </TableCell>
                      <TableCell className="p-0">
                        <ICell value="5.00" right />
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="p-0">
                        <ICell value="ECA" />
                      </TableCell>
                      <TableCell className="p-0">
                        <ICell value="ULSFO" />
                      </TableCell>
                      <TableCell className="p-0">
                        <ICell value="32.00" right />
                      </TableCell>
                      <TableCell className="p-0">
                        <ICell value="32.00" right />
                      </TableCell>
                      <TableCell className="p-0">
                        <ICell value="3.00" right />
                      </TableCell>
                      <TableCell className="p-0">
                        <ICell value="5.00" right />
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </div>
              {/* Channel / Luồng */}
              <div className="overflow-hidden rounded border">
                <Table className="text-xs">
                  <TableHeader>
                    <TableRow className="bg-muted/50">
                      {[L.channel, L.type, L.ballast, L.laden, L.idle, L.work].map((h) => (
                        <TableHead key={h} className="h-7">
                          {h}
                        </TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <TableRow>
                      <TableCell className="p-0">
                        <ICell value="Normal" />
                      </TableCell>
                      <TableCell className="p-0">
                        <ICell value="VLSFO" />
                      </TableCell>
                      <TableCell className="p-0">
                        <ICell value="20.00" right />
                      </TableCell>
                      <TableCell className="p-0">
                        <ICell value="20.00" right />
                      </TableCell>
                      <TableCell className="p-0">
                        <ICell value="2.00" right />
                      </TableCell>
                      <TableCell className="p-0">
                        <ICell value="3.00" right />
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="p-0">
                        <ICell value="ECA" />
                      </TableCell>
                      <TableCell className="p-0">
                        <ICell value="ULSFO" />
                      </TableCell>
                      <TableCell className="p-0">
                        <ICell value="20.00" right />
                      </TableCell>
                      <TableCell className="p-0">
                        <ICell value="20.00" right />
                      </TableCell>
                      <TableCell className="p-0">
                        <ICell value="2.00" right />
                      </TableCell>
                      <TableCell className="p-0">
                        <ICell value="3.00" right />
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </div>
              {/* Sub */}
              <div className="overflow-hidden rounded border">
                <Table className="text-xs">
                  <TableHeader>
                    <TableRow className="bg-muted/50">
                      {[L.sub, L.type, L.sea, L.idle, L.work].map((h) => (
                        <TableHead key={h} className="h-7">
                          {h}
                        </TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <TableRow>
                      <TableCell className="p-0">
                        <ICell value="Normal" />
                      </TableCell>
                      <TableCell className="p-0">
                        <ICell value="MGO" />
                      </TableCell>
                      <TableCell className="p-0">
                        <ICell value="0.10" right />
                      </TableCell>
                      <TableCell className="p-0">
                        <ICell value="0.10" right />
                      </TableCell>
                      <TableCell className="p-0">
                        <ICell value="0.10" right />
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="p-0">
                        <ICell value="ECA" />
                      </TableCell>
                      <TableCell className="p-0">
                        <ICell value="MGO" />
                      </TableCell>
                      <TableCell className="p-0">
                        <ICell value="0.10" right />
                      </TableCell>
                      <TableCell className="p-0">
                        <ICell value="0.10" right />
                      </TableCell>
                      <TableCell className="p-0">
                        <ICell value="0.10" right />
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </div>
            </div>
          </div>
        </div>

        {/* Cargo with HEAD CP + SUB CP */}
        <div>
          <div className="mb-1 flex items-center justify-between">
            <SectionHeader>{L.cargo}</SectionHeader>
            <Button variant="outline" size="sm" className="h-7 gap-1 text-xs">
              <Package className="h-3 w-3" /> {L.loadableQtyCalc}
            </Button>
          </div>
          <div className="overflow-x-auto rounded border">
            <Table className="text-xs">
              <TableHeader>
                <TableRow className="bg-muted/30">
                  <TableHead className="h-6" colSpan={7}></TableHead>
                  <TableHead className="h-6 bg-primary/10 text-primary text-center" colSpan={5}>
                    HEAD CP
                  </TableHead>
                  <TableHead className="h-6 bg-amber-50 text-center" colSpan={4}>
                    SUB CP
                  </TableHead>
                </TableRow>
                <TableRow className="bg-muted/50">
                  <TableHead className="h-7 w-10">#</TableHead>
                  <TableHead className="h-7">{L.account}</TableHead>
                  <TableHead className="h-7">{L.cargoName}</TableHead>
                  <TableHead className="h-7">{L.loadingPort}</TableHead>
                  <TableHead className="h-7">{L.dischargingPort}</TableHead>
                  <TableHead className="h-7" colSpan={2}>
                    {L.quantity}
                  </TableHead>
                  {HEAD_CP.map((h) => (
                    <TableHead key={"h" + h} className="h-7 bg-primary/10 text-primary">
                      {h}
                    </TableHead>
                  ))}
                  {SUB_CP.map((h) => (
                    <TableHead key={"s" + h} className="h-7 bg-amber-50">
                      {h}
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  <TableCell className="p-1 text-center">1</TableCell>
                  <TableCell className="p-0">
                    <ICell value="netpas" />
                  </TableCell>
                  <TableCell className="p-0">
                    <ICell value="coal in bulk" />
                  </TableCell>
                  <TableCell className="p-0">
                    <ICell value="Taboneo (ID) [+08:00]" />
                  </TableCell>
                  <TableCell className="p-0">
                    <ICell value="Guangzhou (CN) [+0..." />
                  </TableCell>
                  <TableCell className="p-0">
                    <ICell value="55,000.00" right />
                  </TableCell>
                  <TableCell className="p-0">
                    <ICell value="MT" />
                  </TableCell>
                  <TableCell className="p-0">
                    <ICell value="10.00" right />
                  </TableCell>
                  <TableCell className="p-0">
                    <ICell value="3.75 %" right />
                  </TableCell>
                  <TableCell className="p-0">
                    <ICell value="1.25 %" right />
                  </TableCell>
                  <TableCell className="p-0">
                    <YCell value="522,500.00" />
                  </TableCell>
                  <TableCell className="p-0">
                    <ICell value="" />
                  </TableCell>
                  <TableCell className="p-0">
                    <ICell value="9.50" right />
                  </TableCell>
                  <TableCell className="p-0">
                    <ICell value="3.75 %" right />
                  </TableCell>
                  <TableCell className="p-0">
                    <YCell value="502,906.25" />
                  </TableCell>
                  <TableCell className="p-0">
                    <ICell value="" />
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="p-1 text-center text-muted-foreground">2</TableCell>
                  {Array.from({ length: 15 }).map((_, i) => (
                    <TableCell key={i} className="p-0">
                      <ICell value="" />
                    </TableCell>
                  ))}
                </TableRow>
                <TableRow className="bg-muted/30 font-medium">
                  <TableCell className="p-1" colSpan={5}></TableCell>
                  <TableCell className="p-1 text-right">55,000.00</TableCell>
                  <TableCell className="p-1"></TableCell>
                  <TableCell className="p-1 text-right">10.00</TableCell>
                  <TableCell className="p-1 text-right">3.75 %</TableCell>
                  <TableCell className="p-1 text-right">1.25 %</TableCell>
                  <TableCell className="p-1 text-right">522,500.00</TableCell>
                  <TableCell className="p-1 text-right">0.00</TableCell>
                  <TableCell className="p-1 text-right">9.50</TableCell>
                  <TableCell className="p-1 text-right">3.75 %</TableCell>
                  <TableCell className="p-1 text-right">502,906.25</TableCell>
                  <TableCell className="p-1 text-right">0.00</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>
          {/* Row toolbar */}
          <div className="mt-1 flex items-center gap-1 rounded border bg-muted/30 px-2 py-1">
            <button className="rounded p-1 hover:bg-muted" title={L.delete}>
              <Trash2 className="h-3.5 w-3.5 text-muted-foreground" />
            </button>
            <button className="rounded p-1 hover:bg-muted" title={L.add}>
              <Plus className="h-3.5 w-3.5 text-primary" />
            </button>
            <button className="rounded p-1 hover:bg-muted" title="Chèn trái">
              <ArrowLeftToLine className="h-3.5 w-3.5 text-muted-foreground" />
            </button>
            <button className="rounded p-1 hover:bg-muted" title="Chèn phải">
              <ArrowRightToLine className="h-3.5 w-3.5 text-muted-foreground" />
            </button>
            <button className="rounded p-1 hover:bg-muted" title="Dòng">
              <Rows3 className="h-3.5 w-3.5 text-muted-foreground" />
            </button>
            <button className="rounded p-1 hover:bg-muted" title="Cột">
              <Columns3 className="h-3.5 w-3.5 text-muted-foreground" />
            </button>
          </div>
        </div>

        {/* Port Rotation */}
        <div>
          <div className="mb-1 flex items-center justify-between">
            <SectionHeader>{L.portRotation}</SectionHeader>
            <div className="flex items-center gap-3 text-xs">
              <label className="flex items-center gap-1">
                <Checkbox className="h-3 w-3" defaultChecked /> SUEZ
              </label>
              <label className="flex items-center gap-1">
                <Checkbox className="h-3 w-3" defaultChecked /> PANAMA
              </label>
              <label className="flex items-center gap-1">
                <Checkbox className="h-3 w-3" /> KIEL
              </label>
              <span className="text-muted-foreground">
                {L.totalDuration}: 18.26 {L.days} (Ballast: 2.22, Laden: 5.87, ECA: 0, Port: 10.17)
                / ({L.portLocalTime}) 2021-01-02 08:00 ~ 2021-01-20 14:11
              </span>
            </div>
          </div>
          <div className="overflow-x-auto rounded border">
            <Table className="text-xs">
              <TableHeader>
                <TableRow className="bg-muted/30">
                  <TableHead className="h-6" colSpan={7}></TableHead>
                  <TableHead className="h-6 bg-primary/10 text-primary text-center" colSpan={3}>
                    HEAD CP
                  </TableHead>
                  <TableHead className="h-6 bg-amber-50 text-center" colSpan={3}>
                    SUB CP
                  </TableHead>
                  <TableHead className="h-6" colSpan={3}></TableHead>
                </TableRow>
                <TableRow className="bg-muted/50">
                  <TableHead className="h-7 w-10">#</TableHead>
                  <TableHead className="h-7">{L.type}</TableHead>
                  <TableHead className="h-7">{L.portNameCoord}</TableHead>
                  <TableHead className="h-7">{L.distanceECA}</TableHead>
                  <TableHead className="h-7">{L.wf}</TableHead>
                  <TableHead className="h-7">{L.spd}</TableHead>
                  <TableHead className="h-7">{L.sea}</TableHead>
                  <TableHead className="h-7 bg-primary/10">{L.ldRate}</TableHead>
                  <TableHead className="h-7 bg-primary/10">{L.dem}</TableHead>
                  <TableHead className="h-7 bg-primary/10">{L.des}</TableHead>
                  <TableHead className="h-7 bg-amber-50">{L.ldRate}</TableHead>
                  <TableHead className="h-7 bg-amber-50">{L.dem}</TableHead>
                  <TableHead className="h-7 bg-amber-50">{L.des}</TableHead>
                  <TableHead className="h-7">{L.portIW}</TableHead>
                  <TableHead className="h-7">{L.arrival}</TableHead>
                  <TableHead className="h-7">{L.departure}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {[
                  {
                    n: 1,
                    type: "Ballast",
                    port: "Singapore (SG) [+08:00]",
                    dep: "2021-01-02 08:00",
                  },
                  {
                    n: 2,
                    type: "Loading",
                    port: "Taboneo (ID) [+08:00]",
                    dist: "773",
                    wf: "0.0 %",
                    spd: "14.50",
                    sea: "2.22",
                    ldH: "9,000.00",
                    desH: "8,215.28",
                    ldS: "9,000.00",
                    demS: "7,583.33",
                    desS: "0.50",
                    pw: "6.11",
                    arr: "2021-01-04 13:19",
                    dep: "2021-01-11 03:59",
                  },
                  {
                    n: 3,
                    type: "Dischg.",
                    port: "Guangzhou (CN) [+08:00]",
                    dist: "1,972",
                    wf: "0.0 %",
                    spd: "14.00",
                    sea: "5.87",
                    ldH: "18,000.00",
                    desH: "13,180.56",
                    ldS: "18,000.00",
                    demS: "12,166.67",
                    desS: "0.50",
                    pw: "3.06",
                    arr: "2021-01-17 00:51",
                    dep: "2021-01-20 14:11",
                  },
                ].map((r) => (
                  <TableRow key={r.n}>
                    <TableCell className="p-1 text-center">{r.n}</TableCell>
                    <TableCell className="p-0">
                      <ICell value={r.type} />
                    </TableCell>
                    <TableCell className="p-0">
                      <ICell value={r.port} />
                    </TableCell>
                    <TableCell className="p-0">
                      <ICell value={r.dist ?? ""} right />
                    </TableCell>
                    <TableCell className="p-0">
                      <ICell value={r.wf ?? ""} right />
                    </TableCell>
                    <TableCell className="p-0">
                      <ICell value={r.spd ?? ""} right />
                    </TableCell>
                    <TableCell className="p-0">
                      <ICell value={r.sea ?? ""} right />
                    </TableCell>
                    <TableCell className="p-0">
                      <ICell value={r.ldH ?? ""} right />
                    </TableCell>
                    <TableCell className="p-0">
                      <ICell value="" right />
                    </TableCell>
                    <TableCell className="p-0">
                      <YCell value={r.desH ?? ""} />
                    </TableCell>
                    <TableCell className="p-0">
                      <ICell value={r.ldS ?? ""} right />
                    </TableCell>
                    <TableCell className="p-0">
                      <YCell value={r.demS ?? ""} />
                    </TableCell>
                    <TableCell className="p-0">
                      <YCell value={r.desS ?? ""} />
                    </TableCell>
                    <TableCell className="p-0">
                      <ICell value={r.pw ?? ""} right />
                    </TableCell>
                    <TableCell className="p-0">
                      <ICell value={r.arr ?? ""} />
                    </TableCell>
                    <TableCell className="p-0">
                      <ICell value={r.dep ?? ""} />
                    </TableCell>
                  </TableRow>
                ))}
                {[4, 5].map((n) => (
                  <TableRow key={n}>
                    <TableCell className="p-1 text-center text-muted-foreground">{n}</TableCell>
                    {Array.from({ length: 15 }).map((_, i) => (
                      <TableCell key={i} className="p-0">
                        <ICell value="" />
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
                <TableRow>
                  <TableCell className="p-1 text-center text-muted-foreground">
                    {L.margin}
                  </TableCell>
                  {Array.from({ length: 15 }).map((_, i) => (
                    <TableCell key={i} className="p-0">
                      <ICell value="" />
                    </TableCell>
                  ))}
                </TableRow>
                <TableRow className="bg-muted/30 font-medium">
                  <TableCell className="p-1" colSpan={3}></TableCell>
                  <TableCell className="p-1 text-right">2,745</TableCell>
                  <TableCell className="p-1 text-right">0</TableCell>
                  <TableCell className="p-1"></TableCell>
                  <TableCell className="p-1 text-right">8.09</TableCell>
                  <TableCell className="p-1 text-right">0.00</TableCell>
                  <TableCell className="p-1 text-right">21,395.83</TableCell>
                  <TableCell className="p-1 text-right">0.00</TableCell>
                  <TableCell className="p-1 text-right">19,750.00</TableCell>
                  <TableCell className="p-1 text-right">1.00</TableCell>
                  <TableCell className="p-1"></TableCell>
                  <TableCell className="p-1 text-right">9.17</TableCell>
                  <TableCell className="p-1">2021-01-02 08:00</TableCell>
                  <TableCell className="p-1">2021-01-20 14:11</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>
        </div>

        {/* Result */}
        <div>
          <div className="mb-1 flex items-center justify-between">
            <SectionHeader>{L.result}</SectionHeader>
            <div className="flex items-center gap-2 text-xs">
              <div className="flex items-center gap-2">
                <select className="h-7 rounded border bg-background px-2 text-xs">
                  <option>{L.days}</option>
                  <option>{L.hours}</option>
                </select>
                <button className="flex h-7 items-center gap-1 rounded bg-primary px-2 text-xs text-primary-foreground">
                  <Globe className="h-3 w-3" /> {L.portLocal}
                </button>
                <button className="flex h-7 items-center gap-1 rounded border bg-background px-2 text-xs">
                  <Monitor className="h-3 w-3" /> {L.pcTime}
                </button>
                <select className="h-7 rounded border bg-background px-2 text-xs">
                  <option>{L.portLocalTime}</option>
                  <option>{L.utc}</option>
                </select>
              </div>
              <div className="mx-1 h-5 w-px bg-border" />
              <Button size="sm" variant="outline" className="h-7 gap-1 text-xs">
                <BarChart3 className="h-3 w-3" /> {L.analyzer}
              </Button>
              <Button size="sm" variant="outline" className="h-7 gap-1 text-xs">
                <StickyNote className="h-3 w-3" /> {L.remark}
              </Button>
            </div>
          </div>
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-[2.4fr_1fr]">
            <div className="overflow-hidden rounded border">
              <Table className="text-xs">
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead className="h-7"></TableHead>
                    {[
                      "TTL Freight",
                      L.addComm,
                      L.brokerage,
                      L.linerTerms,
                      "Demurrage",
                      "Despatch",
                      L.total,
                    ].map((h) => (
                      <TableHead key={h} className="h-7 text-right">
                        {h}
                      </TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow>
                    <TableCell className="p-1 font-medium text-primary">{L.headCPShort}</TableCell>
                    <TableCell className="p-0">
                      <ICell value="550,000.00" right />
                    </TableCell>
                    <TableCell className="p-0">
                      <ICell value="20,625.00" right />
                    </TableCell>
                    <TableCell className="p-0">
                      <ICell value="6,875.00" right />
                    </TableCell>
                    <TableCell className="p-0">
                      <ICell value="0.00" right />
                    </TableCell>
                    <TableCell className="p-0">
                      <ICell value="0.00" right />
                    </TableCell>
                    <TableCell className="p-0">
                      <ICell value="21,395.83" right />
                    </TableCell>
                    <TableCell className="p-1 text-right font-semibold">501,104.17</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="p-1 font-medium text-amber-700">{L.subCPShort}</TableCell>
                    <TableCell className="p-0">
                      <ICell value="522,500.00" right />
                    </TableCell>
                    <TableCell className="p-0">
                      <ICell value="19,593.75" right />
                    </TableCell>
                    <TableCell className="p-0">
                      <ICell value="" right />
                    </TableCell>
                    <TableCell className="p-0">
                      <ICell value="0.00" right />
                    </TableCell>
                    <TableCell className="p-0">
                      <ICell value="0.00" right />
                    </TableCell>
                    <TableCell className="p-0">
                      <ICell value="19,750.00" right />
                    </TableCell>
                    <TableCell className="p-1 text-right font-semibold">483,156.25</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>
            <div className="overflow-hidden rounded border">
              <Table className="text-xs">
                <TableBody>
                  <TableRow>
                    <TableCell className="p-1 text-muted-foreground">{L.others}</TableCell>
                    <TableCell className="p-1 text-right">0.00</TableCell>
                  </TableRow>
                  <TableRow className="bg-amber-50">
                    <TableCell className="p-1 font-bold">{L.profitUSD}</TableCell>
                    <TableCell className="p-1 text-right text-base font-bold text-primary">
                      17,947.92
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>
          </div>
        </div>
      </div>

      {/* Status bar */}
      <div className="flex items-center justify-between border-t bg-muted/40 px-3 py-1 text-xs text-muted-foreground">
        <div className="flex items-center gap-3">
          <span>{L.reset}</span>
          <span>100 %</span>
          <span>{L.greatCircleLine}</span>
        </div>
        <div className="flex items-center gap-4">
          <span>{L.antiPiracy} : JWLA025 (21st Sep 2020)</span>
          <span>{L.ecaInfo}</span>
        </div>
      </div>

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
