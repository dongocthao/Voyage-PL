import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
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
  Settings,
  PenLine,
  X,
  Clock,
  Search,
} from "lucide-react";
import { RibbonBtn, SectionHeader, ICell, YCell, TabBtn } from "./shared";
// ⇩⇩ Toàn bộ nhãn tiếng Việt được gom tại: src/components/estimation/labels.ts ⇩⇩
import { L, FONT_BASE } from "./labels";

export default function TimeCharterScreen() {
  return (
    <div className={`min-h-screen bg-background text-foreground ${FONT_BASE}`}>
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

      <div className="flex items-end gap-0 border-b bg-muted/40 px-3 pt-2">
        <TabBtn active>
          <Clock className="h-3 w-3 text-primary" />
          {L.timeCharter1}
          <PenLine className="h-3 w-3 text-primary" />
          <X className="h-3 w-3" />
        </TabBtn>
      </div>

      <div className="space-y-4 bg-background p-4">
        <div className="flex justify-end text-xs text-muted-foreground">
          {L.lastUpdate} : 2021-01-14 11:59, SJLee
        </div>

        {/* Vessel Particular */}
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_1.4fr]">
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
                      <ICell />
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
              <label className="flex items-center gap-1 text-xs">
                <Checkbox id="fpc2" /> {L.fixPortConsumption}
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
                  {[
                    [
                      "14.50",
                      "14.00",
                      "Normal",
                      "VLSFO",
                      "32.00",
                      "32.00",
                      "3.00",
                      "5.00",
                      "1.00",
                      "Normal",
                      "MGO",
                      "0.10",
                      "0.10",
                      "0.10",
                    ],
                    [
                      "",
                      "",
                      "ECA",
                      "ULSFO",
                      "32.00",
                      "32.00",
                      "3.00",
                      "5.00",
                      "1.00",
                      "ECA",
                      "MGO",
                      "0.10",
                      "0.10",
                      "0.10",
                    ],
                  ].map((row, i) => (
                    <TableRow key={i}>
                      {row.map((c, j) => (
                        <TableCell key={j} className="p-0">
                          <ICell value={c} right={!isNaN(Number(c))} />
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        </div>

        {/* Head CP & Sub CP */}
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {[
            {
              title: L.headCPShort,
              account: "Netpas",
              delivery: "Singapore (SG) [+08:...]",
              redelivery: "Guangzhou (CN) [+...]",
              duration: "27.22",
              daily: "10,000.00",
              gross: "272,222.05",
            },
            {
              title: L.subCPShort,
              account: "Seafuture",
              delivery: "Taboneo (ID) [+08:00]",
              redelivery: "Guangzhou (CN) [+...]",
              duration: "25.00",
              daily: "12,500.00",
              gross: "312,500.00",
            },
          ].map((cp, idx) => (
            <div key={idx}>
              <div className="flex items-center justify-between">
                <SectionHeader>{cp.title}</SectionHeader>
                <label className="flex items-center gap-1 text-xs">
                  <Checkbox />
                  {L.useMultiDuration}
                </label>
              </div>
              <div className="overflow-hidden rounded border">
                <Table className="text-xs">
                  <TableHeader>
                    <TableRow className="bg-muted/50">
                      {[
                        L.account,
                        L.deliveryPort,
                        L.redeliveryPort,
                        L.duration,
                        L.dailyHire,
                        L.grossHire,
                        L.aComm,
                        L.brkg,
                      ].map((h) => (
                        <TableHead key={h} className="h-7">
                          {h}
                        </TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <TableRow>
                      <TableCell className="p-0">
                        <ICell value={cp.account} />
                      </TableCell>
                      <TableCell className="p-0">
                        <ICell value={cp.delivery} />
                      </TableCell>
                      <TableCell className="p-0">
                        <ICell value={cp.redelivery} />
                      </TableCell>
                      <TableCell className="p-0">
                        <ICell value={cp.duration} right />
                      </TableCell>
                      <TableCell className="p-0">
                        <YCell value={cp.daily} />
                      </TableCell>
                      <TableCell className="p-0">
                        <YCell value={cp.gross} />
                      </TableCell>
                      <TableCell className="p-0">
                        <ICell value="3.75 %" right />
                      </TableCell>
                      <TableCell className="p-0">
                        <ICell value={idx === 1 ? "1.25 %" : ""} right />
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </div>
            </div>
          ))}
        </div>

        {/* Port Rotation */}
        <div>
          <div className="mb-1 flex flex-wrap items-center gap-3">
            <SectionHeader>{L.portRotation}</SectionHeader>
            <label className="flex items-center gap-1 text-xs">
              <Checkbox defaultChecked />
              SUEZ
            </label>
            <label className="flex items-center gap-1 text-xs">
              <Checkbox defaultChecked />
              PANAMA
            </label>
            <label className="flex items-center gap-1 text-xs">
              <Checkbox />
              KIEL
            </label>
            <span className="text-xs text-muted-foreground">
              {L.totalDuration}: 27.22 {L.days}, Ballast: 2.22 {L.days} (Sea: 2.22, ECA: 0, Port:
              0), {L.tcOut}: 25.00 {L.days} / ({L.portLocalTime}) 2021-01-08 08:00 ~ 2021-02-04
              13:19
            </span>
          </div>
          <div className="overflow-x-auto rounded border">
            <Table className="text-xs">
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead rowSpan={2} className="h-7 whitespace-nowrap">
                    #
                  </TableHead>
                  <TableHead rowSpan={2} className="h-7 whitespace-nowrap">
                    {L.type}
                  </TableHead>
                  <TableHead rowSpan={2} className="h-7 whitespace-nowrap">
                    {L.portNameCoord}
                  </TableHead>
                  <TableHead rowSpan={2} className="h-7 whitespace-nowrap">
                    {L.distanceECA}
                  </TableHead>
                  <TableHead rowSpan={2} className="h-7 whitespace-nowrap">
                    {L.wf}
                  </TableHead>
                  <TableHead rowSpan={2} className="h-7 whitespace-nowrap">
                    {L.spd}
                  </TableHead>
                  <TableHead rowSpan={2} className="h-7 whitespace-nowrap">
                    {L.sea}
                  </TableHead>
                  <TableHead colSpan={2} className="h-7 whitespace-nowrap text-center">
                    {L.portIW}
                  </TableHead>
                  <TableHead rowSpan={2} className="h-7 whitespace-nowrap">
                    {L.arrival}
                  </TableHead>
                  <TableHead rowSpan={2} className="h-7 whitespace-nowrap">
                    {L.departure}
                  </TableHead>
                </TableRow>
                <TableRow className="bg-muted/40">
                  <TableHead className="h-6 text-center">{L.idle}</TableHead>
                  <TableHead className="h-6 text-center">{L.work}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {[
                  [
                    "1",
                    "Ballast",
                    "Singapore (SG) [+08:00]",
                    "",
                    "",
                    "",
                    "",
                    "",
                    "",
                    "",
                    "2021-01-08 08:00",
                  ],
                  [
                    "2",
                    "Ballast",
                    "Taboneo (ID) [+08:00]",
                    "773",
                    "0",
                    "0.0 %",
                    "14.50",
                    "2.22",
                    "0.00",
                    "2.22",
                    "2021-01-10 13:19",
                    "2021-01-10 13:19",
                  ],
                  [
                    "3",
                    "Delivery",
                    "Taboneo (ID) [+08:00]",
                    "",
                    "",
                    "",
                    "",
                    "",
                    "",
                    "",
                    L.deliveryTime,
                    "2021-01-10 13:19",
                  ],
                  [
                    "4",
                    "Redelivery",
                    "Guangzhou (CN) [+08:00]",
                    "",
                    `${L.tcOut} 25.00 ${L.days}`,
                    "",
                    "",
                    "",
                    "",
                    "",
                    L.redeliveryTime,
                    "2021-02-04 13:19",
                  ],
                  [
                    "5",
                    "Ballast",
                    "Guangzhou (CN) [+08:00]",
                    "",
                    "",
                    "",
                    "",
                    "",
                    "",
                    "",
                    "2021-02-04 13:19",
                    "2021-02-04 13:19",
                  ],
                ].map((row, i) => (
                  <TableRow key={i} className={i === 2 || i === 3 ? "bg-[#E6F0F5]" : ""}>
                    <TableCell className="w-8 text-center">{row[0]}</TableCell>
                    {row.slice(1).map((c, j) => (
                      <TableCell key={j} className="p-0">
                        <ICell
                          value={c}
                          right={j > 2 && !!c && !isNaN(Number(String(c).replace(/[,.]/g, "")))}
                        />
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
                <TableRow className="bg-muted/20 font-semibold">
                  <TableCell colSpan={3} className="text-right">
                    {L.totals}
                  </TableCell>
                  <TableCell className="text-right">773</TableCell>
                  <TableCell className="text-right">0</TableCell>
                  <TableCell />
                  <TableCell className="text-right">2.22</TableCell>
                  <TableCell className="text-right">0.00</TableCell>
                  <TableCell className="text-right">2.22</TableCell>
                  <TableCell className="text-right">2021-01-08 08:00</TableCell>
                  <TableCell className="text-right">2021-02-04 13:19</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <div className="ml-auto flex items-center gap-1 text-xs">
              <select className="h-7 rounded border bg-background px-2 text-xs">
                <option>{L.days}</option>
                <option>{L.hours}</option>
              </select>
              <span className="rounded border bg-primary/10 px-2 py-1 text-primary">
                ⚓ {L.portLocal}
              </span>
              <span className="rounded border px-2 py-1">🖥 {L.pcTime}</span>
              <select className="h-7 rounded border bg-background px-2 text-xs">
                <option>{L.portLocalTime}</option>
                <option>{L.utc}</option>
              </select>
            </div>
          </div>
        </div>

        {/* Hire and Bunker Expense / Result */}
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1.4fr_1fr_1fr]">
          <div>
            <SectionHeader>{L.hire}</SectionHeader>
            <div className="overflow-hidden rounded border">
              <Table className="text-xs">
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead className="h-7"></TableHead>
                    {[
                      L.dailyGrossHire,
                      L.dailyNetHire,
                      L.totalGrossHire,
                      L.addComm,
                      L.brokerage,
                      L.totalNetHire,
                    ].map((h) => (
                      <TableHead key={h} className="h-7">
                        {h}
                      </TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {[
                    [
                      L.headCPShort,
                      "10,000.00",
                      "9,625.00",
                      "272,222.05",
                      "10,208.33",
                      "",
                      "262,013.72",
                    ],
                    [
                      L.subCPShort,
                      "12,500.00",
                      "11,875.00",
                      "312,500.00",
                      "11,718.75",
                      "3,906.25",
                      "296,875.00",
                    ],
                    [L.diff, "2,500.00", "2,250.00", "40,277.95", "", "", "34,861.28"],
                  ].map((r, i) => (
                    <TableRow key={i} className={i === 2 ? "bg-muted/20 font-medium" : ""}>
                      <TableCell className="bg-muted/30 px-2">{r[0]}</TableCell>
                      {r.slice(1).map((c, j) => (
                        <TableCell key={j} className="p-0">
                          <ICell value={c} right />
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            <div className="mt-4">
              <SectionHeader>{L.operation}</SectionHeader>
              <div className="mb-1 flex justify-end">
                <Button variant="outline" size="sm" className="h-6 text-xs">
                  ⛽ {L.tcBunkerCalc}
                </Button>
              </div>
              <div className="overflow-hidden rounded border">
                <Table className="text-xs">
                  <TableHeader>
                    <TableRow className="bg-muted/50">
                      <TableHead className="h-7"></TableHead>
                      {[L.ballastBonus, L.ilohc, L.cev, "Bunker", L.total].map((h) => (
                        <TableHead key={h} className="h-7">
                          {h}
                        </TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {[
                      [L.headCPShort, "0.00", "5,000.00", "1,361.11", "24,970.91", "31,332.02"],
                      [L.subCPShort, "0.00", "5,000.00", "1,250.00", "0.00", "6,250.00"],
                      [L.diff, "0.00", "0.00", "-111.11", "", "-25,082.02"],
                    ].map((r, i) => (
                      <TableRow key={i} className={i === 2 ? "bg-muted/20 font-medium" : ""}>
                        <TableCell className="bg-muted/30 px-2">{r[0]}</TableCell>
                        {r.slice(1).map((c, j) => (
                          <TableCell key={j} className="p-0">
                            <ICell
                              value={c}
                              right
                              className={String(c).startsWith("-") ? "text-destructive" : ""}
                            />
                          </TableCell>
                        ))}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between">
              <SectionHeader>{L.bunkerExpense}</SectionHeader>
              <div className="flex gap-1 text-xs">
                <Button variant="outline" size="sm" className="h-6 text-xs">
                  {L.recent}
                </Button>
                <Button variant="outline" size="sm" className="h-6 text-xs">
                  ⛽ {L.bunkerIndex}
                </Button>
                <Button variant="outline" size="sm" className="h-6 text-xs">
                  ⚗ {L.bunkerSimulator}
                </Button>
              </div>
            </div>
            <div className="overflow-hidden rounded border">
              <Table className="text-xs">
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead className="h-7"></TableHead>
                    <TableHead className="h-7">{L.pricePerMT}</TableHead>
                    <TableHead className="h-7">{L.consumption}</TableHead>
                    <TableHead className="h-7">{L.expense}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {[
                    ["VLSFO", "350.00", "71.11", "24,888.69"],
                    ["MGO", "370.00", "0.22", "82.22"],
                    ["ULSFO", "", "0.00", "0.00"],
                  ].map((r, i) => (
                    <TableRow key={i}>
                      <TableCell>{r[0]}</TableCell>
                      <TableCell className="p-0">
                        <ICell value={r[1]} right />
                      </TableCell>
                      <TableCell className="p-0">
                        <ICell value={r[2]} right />
                      </TableCell>
                      <TableCell className="p-0">
                        <ICell value={r[3]} right />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            <div className="mt-4">
              <SectionHeader>{L.others}</SectionHeader>
              <div className="overflow-hidden rounded border">
                <Table className="text-xs">
                  <TableHeader>
                    <TableRow className="bg-muted/50">
                      <TableHead className="h-7">{L.income}</TableHead>
                      <TableHead className="h-7">{L.expense}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <TableRow>
                      <TableCell className="p-0">
                        <ICell value="0.00" right />
                      </TableCell>
                      <TableCell className="p-0">
                        <ICell value="0.00" right />
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </div>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between">
              <SectionHeader>{L.result}</SectionHeader>
              <div className="flex gap-1 text-xs">
                <Button variant="outline" size="sm" className="h-6 text-xs">
                  📊 {L.analyzer}
                </Button>
                <Button variant="outline" size="sm" className="h-6 text-xs">
                  🗒 {L.remark}
                </Button>
              </div>
            </div>
            <div className="rounded border">
              {[
                [L.dailyRevenue, "11,709.19"],
                [L.dailyExpense, "11,349.95"],
                [L.dailyProfit, "359.24"],
                [L.cBase, "9,984.24"],
                [L.revenue, "318,750.00"],
                [L.opExpense, "46,957.02"],
                [L.opProfit, "271,792.98"],
                [L.totalHire, "262,013.72"],
                [L.totalExpense, "308,970.74"],
                [L.profitRate, "3.07 %"],
              ].map((r, i) => (
                <div key={i} className="grid grid-cols-[1fr_1fr] border-b text-xs">
                  <div className="border-r bg-muted/30 px-2 py-1">{r[0]}</div>
                  <div className="px-2 py-1 text-right">{r[1]}</div>
                </div>
              ))}
              <div className="grid grid-cols-[1fr_1fr] bg-amber-50 text-xs font-bold">
                <div className="border-r px-2 py-1">{L.profitUSD}</div>
                <div className="px-2 py-1 text-right text-primary">9,779.26</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between border-t bg-muted/30 px-3 py-1 text-xs text-muted-foreground">
        <div className="flex items-center gap-3">
          <button className="underline">{L.reset}</button>
          <input type="range" defaultValue={100} className="h-1 w-32" />
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
