import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Plus } from "lucide-react";
// ⇩⇩ Toàn bộ nhãn tiếng Việt được gom tại: src/components/estimation/labels.ts ⇩⇩
import { L, FONT_BASE } from "./labels";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}

function Field({
  label,
  children,
  className = "",
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`grid grid-cols-[110px_1fr] items-center gap-2 ${className}`}>
      <Label className="text-xs text-muted-foreground">{label}</Label>
      <div className="min-w-0">{children}</div>
    </div>
  );
}

function NumInput({ value = "0.00", suffix }: { value?: string; suffix?: string }) {
  return (
    <div className="flex items-center gap-1">
      <Input defaultValue={value} className="h-8 text-right text-xs" />
      {suffix && (
        <Select defaultValue={suffix}>
          <SelectTrigger className="h-8 w-16 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="M">M</SelectItem>
            <SelectItem value="FT">FT</SelectItem>
          </SelectContent>
        </Select>
      )}
    </div>
  );
}

export default function NewVesselDialog({ open, onOpenChange }: Props) {
  const [name, setName] = useState("seafu");
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={`max-w-5xl p-0 gap-0 ${FONT_BASE}`}>
        <DialogHeader className="border-b px-4 py-3">
          <DialogTitle className="text-sm font-semibold">{L.newVessel}</DialogTitle>
          <DialogDescription className="text-xs">{L.newVesselDesc}</DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-6 p-4">
          {/* LEFT COLUMN */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Field label="M.V.">
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="h-8 bg-primary/10 border-primary/40 text-xs"
                />
              </Field>
              <div className="grid grid-cols-2 gap-2">
                <Field label={L.vesselKind}>
                  <Input className="h-8 text-xs" />
                </Field>
                <Field label={L.vesselType}>
                  <Select defaultValue="Owned">
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Owned">Owned</SelectItem>
                      <SelectItem value="TC In">TC In</SelectItem>
                    </SelectContent>
                  </Select>
                </Field>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <Field label={L.draft}>
                  <NumInput suffix="M" />
                </Field>
                <Field label={L.built}>
                  <Input defaultValue="0" className="h-8 text-right text-xs" />
                </Field>
              </div>
            </div>

            <div>
              <h3 className="mb-2 text-xs font-bold uppercase tracking-wide">
                {L.estimatingValues}
              </h3>
              <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                <Field label="DWT">
                  <Input defaultValue="0" className="h-8 text-right text-xs" />
                </Field>
                <Field label={L.dailyHire}>
                  <Input defaultValue="0.00" className="h-8 text-right text-xs" />
                </Field>
                <Field label={L.grain}>
                  <NumInput suffix="CBM" />
                </Field>
                <Field label="ILOHC">
                  <Input defaultValue="0.00" className="h-8 text-right text-xs" />
                </Field>
                <Field label={L.bale}>
                  <div className="flex items-center gap-2">
                    <Input defaultValue="0.00" className="h-8 text-right text-xs" />
                    <span className="text-xs text-muted-foreground">CBM</span>
                  </div>
                </Field>
                <Field label="CEV">
                  <div className="flex items-center gap-2">
                    <Input defaultValue="0.00" className="h-8 text-right text-xs" />
                    <span className="text-xs text-muted-foreground whitespace-nowrap">
                      / 30 {L.days.toLowerCase()}
                    </span>
                  </div>
                </Field>
                <Field label="TPC">
                  <div className="flex items-center gap-2">
                    <Select defaultValue="-">
                      <SelectTrigger className="h-8 w-16 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="-">-</SelectItem>
                      </SelectContent>
                    </Select>
                    <Input defaultValue="0.00" className="h-8 text-right text-xs" />
                  </div>
                </Field>
              </div>
            </div>

            <div>
              <Tabs defaultValue="full">
                <TabsList className="h-8">
                  <TabsTrigger value="full" className="text-xs">
                    Full
                  </TabsTrigger>
                  <TabsTrigger value="eco" className="text-xs">
                    Eco
                  </TabsTrigger>
                  <TabsTrigger value="c1" className="text-xs">
                    Custom1
                  </TabsTrigger>
                  <TabsTrigger value="c2" className="text-xs">
                    Custom2
                  </TabsTrigger>
                  <TabsTrigger value="c3" className="text-xs">
                    Custom3
                  </TabsTrigger>
                </TabsList>
                <TabsContent value="full" className="mt-2 space-y-2">
                  <div>
                    <div className="mb-1 grid grid-cols-[80px_1fr] gap-2 text-xs font-semibold">
                      <span>{L.speed}</span>
                      <span>{L.bunkerConsumptionTitle}</span>
                    </div>
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
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        <TableRow>
                          <TableCell className="p-1 text-right">0.00</TableCell>
                          <TableCell className="p-1 text-right">0.00</TableCell>
                          <TableCell className="p-1">Normal</TableCell>
                          <TableCell className="p-1">VLSFO</TableCell>
                          <TableCell className="p-1" />
                          <TableCell className="p-1" />
                          <TableCell className="p-1" />
                          <TableCell className="p-1" />
                        </TableRow>
                        <TableRow>
                          <TableCell className="p-1" />
                          <TableCell className="p-1" />
                          <TableCell className="p-1 text-primary">ECA</TableCell>
                          <TableCell className="p-1">ULSFO</TableCell>
                          <TableCell className="p-1" />
                          <TableCell className="p-1" />
                          <TableCell className="p-1" />
                          <TableCell className="p-1" />
                        </TableRow>
                      </TableBody>
                    </Table>
                  </div>
                  <Table className="text-xs">
                    <TableHeader>
                      <TableRow className="bg-muted/50">
                        <TableHead className="h-7">{L.sub}</TableHead>
                        <TableHead className="h-7">{L.type}</TableHead>
                        <TableHead className="h-7">{L.sea}</TableHead>
                        <TableHead className="h-7" />
                        <TableHead className="h-7">{L.idle}</TableHead>
                        <TableHead className="h-7">{L.work}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      <TableRow>
                        <TableCell className="p-1">Normal</TableCell>
                        <TableCell className="p-1">MGO</TableCell>
                        <TableCell className="p-1" />
                        <TableCell className="p-1" />
                        <TableCell className="p-1" />
                        <TableCell className="p-1" />
                      </TableRow>
                      <TableRow>
                        <TableCell className="p-1 text-primary">ECA</TableCell>
                        <TableCell className="p-1">MGO</TableCell>
                        <TableCell className="p-1" />
                        <TableCell className="p-1" />
                        <TableCell className="p-1" />
                        <TableCell className="p-1" />
                      </TableRow>
                    </TableBody>
                  </Table>
                </TabsContent>
              </Tabs>
            </div>

            <div>
              <h3 className="mb-1 text-xs font-bold uppercase tracking-wide">{L.remark}</h3>
              <Textarea className="min-h-24 text-xs" />
            </div>
          </div>

          {/* RIGHT COLUMN */}
          <div className="space-y-4">
            <div>
              <h3 className="mb-2 text-xs font-bold uppercase tracking-wide">{L.general}</h3>
              <div className="space-y-2">
                <Field label={L.owner}>
                  <Input className="h-8 text-xs" />
                </Field>
                <div className="grid grid-cols-2 gap-2">
                  <Field label={L.callSign}>
                    <Input className="h-8 text-xs" />
                  </Field>
                  <Field label={L.imoNo}>
                    <Input className="h-8 text-xs" />
                  </Field>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <Field label={L.vesselCode}>
                    <Input className="h-8 text-xs" />
                  </Field>
                  <Field label={L.hullNo}>
                    <Input className="h-8 text-xs" />
                  </Field>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <Field label="DWCC">
                    <Input defaultValue="0.00" className="h-8 text-right text-xs" />
                  </Field>
                  <Field label="LOA">
                    <NumInput suffix="M" />
                  </Field>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <Field label="GRT">
                    <Input defaultValue="0.00" className="h-8 text-right text-xs" />
                  </Field>
                  <Field label={L.beam}>
                    <NumInput suffix="M" />
                  </Field>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <Field label="NRT">
                    <Input defaultValue="0.00" className="h-8 text-right text-xs" />
                  </Field>
                  <Field label={L.depth}>
                    <NumInput suffix="M" />
                  </Field>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <Field label={L.constant}>
                    <Input defaultValue="0.00" className="h-8 text-right text-xs" />
                  </Field>
                  <Field label={L.flag}>
                    <Input className="h-8 text-xs" />
                  </Field>
                </div>
                <Field label={L.class}>
                  <Input className="h-8 text-xs" />
                </Field>
                <Field label="PNI">
                  <Input className="h-8 text-xs" />
                </Field>
              </div>
            </div>

            <div>
              <h3 className="mb-2 text-xs font-bold uppercase tracking-wide">{L.canal}</h3>
              <div className="grid grid-cols-2 gap-2">
                <Field label="SCNT">
                  <Input defaultValue="0.00" className="h-8 text-right text-xs" />
                </Field>
                <Field label="PC/UMS NT">
                  <Input defaultValue="0.00" className="h-8 text-right text-xs" />
                </Field>
              </div>
            </div>

            <div>
              <h3 className="mb-2 text-xs font-bold uppercase tracking-wide">{L.gearHaHo}</h3>
              <div className="grid grid-cols-[1fr_1fr] gap-3">
                <div className="rounded border bg-muted/30 min-h-32" />
                <div className="space-y-2">
                  <Label className="text-xs">{L.gearDesc}</Label>
                  <Select defaultValue="Crane">
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Crane">Crane</SelectItem>
                    </SelectContent>
                  </Select>
                  <div className="flex items-center gap-1">
                    <Input className="h-8 text-xs" />
                    <span className="text-xs">MT</span>
                    <Input className="h-8 text-xs" />
                    <span className="text-xs">EA</span>
                  </div>
                  <Select defaultValue="Midship">
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Midship">Midship</SelectItem>
                    </SelectContent>
                  </Select>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" className="flex-1 h-8 text-xs">
                      <Plus className="h-3 w-3" /> {L.add}
                    </Button>
                    <Button size="sm" variant="outline" className="flex-1 h-8 text-xs">
                      {L.delete}
                    </Button>
                  </div>
                </div>
              </div>
              <div className="mt-3 space-y-2">
                <div className="grid grid-cols-[140px_1fr_auto_1fr] items-center gap-2">
                  <Label className="text-xs">HO/HA</Label>
                  <Input defaultValue="0" className="h-8 text-right text-xs" />
                  <span className="text-xs">/</span>
                  <Input defaultValue="0" className="h-8 text-right text-xs" />
                </div>
                <div className="grid grid-cols-[140px_1fr_auto_1fr] items-center gap-2">
                  <Label className="text-xs">HO/HA Type</Label>
                  <Select defaultValue="Single Deck">
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Single Deck">Single Deck</SelectItem>
                    </SelectContent>
                  </Select>
                  <span className="text-xs">/</span>
                  <Select defaultValue="Mc Greegor">
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Mc Greegor">Mc Greegor</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-[200px_1fr_auto_1fr_auto] items-center gap-2">
                  <Label className="text-xs">{L.tankTopStrength}</Label>
                  <Input defaultValue="0.00" className="h-8 text-right text-xs" />
                  <span className="text-xs">/</span>
                  <Input defaultValue="0.00" className="h-8 text-right text-xs" />
                  <span className="text-xs">MT/SQM</span>
                </div>
                <div className="grid grid-cols-[200px_1fr_auto] items-center gap-2">
                  <Label className="text-xs">{L.hatchCoverStrength}</Label>
                  <Input defaultValue="0.00" className="h-8 text-right text-xs" />
                  <span className="text-xs">MT/SQM</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter className="border-t px-4 py-3">
          <Button variant="default" onClick={() => onOpenChange(false)} className="min-w-24">
            {L.ok}
          </Button>
          <Button variant="outline" onClick={() => onOpenChange(false)} className="min-w-24">
            {L.cancel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
