import {
  buildTimeCharterSnapshotPayload,
  mapTimeCharterSnapshotToRows,
} from "../apps/voyage-ui/src/components/voyage-estimator/timeCharterSnapshotMapper";
import { tcHeadCp, tcPortData, tcSubCp } from "../apps/voyage-ui/src/components/voyage-estimator/timeCharterData";

const payload = buildTimeCharterSnapshotPayload({
  estimateId: "42",
  estimateFileId: "7",
  header: {
    vesselId: "11",
    bunkerProfileId: "22",
    routingSuez: true,
    routingPanama: false,
    routingKiel: true,
  },
  headCpRows: tcHeadCp,
  subCpRows: tcSubCp,
  portRows: tcPortData,
  headMultiDuration: true,
  subMultiDuration: false,
});

if (payload.header.estimateTypeCode !== "TCOV") {
  throw new Error("Time Charter estimate type must be TCOV");
}

if (payload.charterTerms.length !== 2) {
  throw new Error(`Expected 2 charter terms, got ${payload.charterTerms.length}`);
}

const headTerm = payload.charterTerms.find((term) => term.cpSide === "HEAD");
if (!headTerm?.useMultiDuration || headTerm.durationPeriods.length !== 1) {
  throw new Error("Head CP multi duration period was not mapped");
}

if (payload.portLegs.some((leg) => String(leg.legType) === "MARGIN")) {
  throw new Error("Margin row must be mapped to header margin fields, not port legs");
}

const rows = mapTimeCharterSnapshotToRows(payload);
if (rows.portRows.at(-1)?.key !== "margin") {
  throw new Error("Loaded rows must include a final margin row");
}

console.log("Time Charter mapper smoke passed");
