import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { Alert, Input, Modal } from "antd";
import EstimatorShell from "./EstimatorShell";
import VesselSection from "./VesselSection";
import CargoTable from "./CargoTable";
import PortRotationTable from "./PortRotationTable";
import BottomPanels from "./BottomPanels";
import LoadableQuantityApp from "./LoadableQuantityApp";
import FreightSimulatorApp from "./FreightSimulatorApp";
import BunkerSimulatorApp from "./BunkerSimulatorApp";
import AnalyzerApp from "./AnalyzerApp";
import { VoyageReportPreview } from "./VoyageReportPreview";
import { cargoData, portRotationData, type CargoRow, type PortRow } from "./mockData";
import { buildVoyageSnapshotPayload, mapVoyageSnapshotToRows } from "./voyageSnapshotMapper";
import type { FreightSimulationResponse } from "@/lib/api/estimateSimulations";
import { findOperationByEstimateId } from "@/lib/api/operationSnapshots";
import {
  loadVoyageReportSummary,
  loadVoyageSnapshot,
  saveVoyageSnapshot,
  VoyageApiError,
  type VoyageSnapshotPayload,
  type VoyageSnapshotResult,
} from "@/lib/api/voyageSnapshots";
import { fetchBunkerProfiles, fetchLookup, type LookupItem } from "@/lib/api/masterData";
import type { RegisterWorkspaceToolbar } from "@/components/workspace/workspaceToolbar";

type VoyageModal = "loadable" | "freight" | "bunker" | "analyzer";
type SnapshotDetails = Pick<
  VoyageSnapshotPayload,
  "operationExpenseItems" | "miscOperationExpenseItems" | "miscVoyageRevenueItems"
>;
type OperationExpenseItem = NonNullable<VoyageSnapshotPayload["operationExpenseItems"]>[number];
type MiscItem = NonNullable<VoyageSnapshotPayload["miscOperationExpenseItems"]>[number];
type VoyageHeaderState = Pick<
  VoyageSnapshotPayload["header"],
  | "voyageNo"
  | "estimateTypeCode"
  | "remark"
  | "vesselId"
  | "bunkerProfileId"
  | "performanceMode"
  | "routingSuez"
  | "routingPanama"
  | "routingKiel"
  | "hireDay"
  | "hireAddCommPct"
  | "timeDisplayUnit"
  | "timezoneDisplayMode"
>;

type VoyageReportMetaState = {
  estimateName?: string;
  status?: string;
};

const defaultHeaderState: VoyageHeaderState = {
  estimateTypeCode: "TCOV",
  voyageNo: "",
  performanceMode: "FULL",
  routingSuez: true,
  routingPanama: true,
  routingKiel: false,
  hireDay: 18_000,
  hireAddCommPct: 3.75,
  timeDisplayUnit: "DAYS",
  timezoneDisplayMode: "PORT_LOCAL",
};

export default function VoyageEstimator({
  registerWorkspaceToolbar,
  onToOperation,
}: {
  registerWorkspaceToolbar?: RegisterWorkspaceToolbar;
  onToOperation?: (estimateId: string) => void;
} = {}) {
  const [modal, setModal] = useState<VoyageModal | null>(null);
  const [remarkOpen, setRemarkOpen] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [reportPrintToken, setReportPrintToken] = useState<number>();
  const [cargoRows, setCargoRows] = useState<CargoRow[]>(cargoData);
  const [portRows, setPortRows] = useState<PortRow[]>(portRotationData);
  const [cargoSeedRows, setCargoSeedRows] = useState<CargoRow[]>(cargoData);
  const [portSeedRows, setPortSeedRows] = useState<PortRow[]>(portRotationData);
  const [reloadKey, setReloadKey] = useState(0);
  const [estimateId, setEstimateId] = useState<string>();
  const [estimateFileId, setEstimateFileId] = useState<string>();
  const [sheetExists, setSheetExists] = useState(true);
  const [loadEstimateId, setLoadEstimateId] = useState("");
  const [openPosition, setOpenPosition] = useState("");
  const [apiResult, setApiResult] = useState<VoyageSnapshotResult>();
  const [auditState, setAuditState] = useState({ updatedAt: "", updatedBy: "Admin" });
  const [reportMeta, setReportMeta] = useState<VoyageReportMetaState>({
    estimateName: "voyage1",
    status: "DRAFT",
  });
  const [snapshotDetails, setSnapshotDetails] = useState<SnapshotDetails>({});
  const [headerState, setHeaderState] = useState<VoyageHeaderState>(defaultHeaderState);
  const [lookups, setLookups] = useState<{
    cargoes: LookupItem[];
    ports: LookupItem[];
    companies: LookupItem[];
    cpTerms: LookupItem[];
    laytimeTerms: LookupItem[];
    fuelTypes: LookupItem[];
    expenseCategories: LookupItem[];
    vessels: LookupItem[];
    bunkerProfiles: LookupItem[];
  }>({
    cargoes: [],
    ports: [],
    companies: [],
    cpTerms: [],
    laytimeTerms: [],
    fuelTypes: [],
    expenseCategories: [],
    vessels: [],
    bunkerProfiles: [],
  });
  const [saveState, setSaveState] = useState<
    | { status: "idle" }
    | { status: "saving" }
    | { status: "saved"; message: string }
    | { status: "loading" }
    | { status: "loaded"; message: string }
    | { status: "error"; message: string; details?: string[] }
  >({ status: "idle" });
  const workspaceToolbarActionsRef = useRef<{
    resetSheet: () => void;
    deleteSheet: () => void;
    save: () => void;
    load: () => void;
    reload: () => void;
    toOperation: () => void;
    clear: () => void;
  }>({
    resetSheet: () => undefined,
    deleteSheet: () => undefined,
    save: () => undefined,
    load: () => undefined,
    reload: () => undefined,
    toOperation: () => undefined,
    clear: () => undefined,
  });
  const routeEstimateLoadRef = useRef<string | undefined>(undefined);

  const formatError = (error: unknown, fallback: string) => {
    if (error instanceof VoyageApiError) {
      return {
        message: error.message,
        details: error.details.map((detail) =>
          detail.path ? `${detail.path}: ${detail.message}` : (detail.message ?? ""),
        ),
      };
    }

    return { message: error instanceof Error ? error.message : fallback };
  };

  const currentOperationExpenseItems = snapshotDetails.operationExpenseItems ?? [];
  const manualExpenseAmount = (categoryCode: string) =>
    currentOperationExpenseItems.find((item) => item.categoryCode === categoryCode)?.amount ?? 0;
  const setOperationExpenseItems = (items: OperationExpenseItem[]) => {
    setSnapshotDetails((current) => ({ ...current, operationExpenseItems: items }));
  };
  const setMiscOperationExpenseItems = (items: MiscItem[]) => {
    setSnapshotDetails((current) => ({ ...current, miscOperationExpenseItems: items }));
  };
  const setMiscVoyageRevenueItems = (items: MiscItem[]) => {
    setSnapshotDetails((current) => ({ ...current, miscVoyageRevenueItems: items }));
  };
  const operationExpenseRows = buildOperationExpenseRows(
    cargoRows,
    portRows,
    apiResult,
    manualExpenseAmount("ROUTING_SERVICE"),
    sum((snapshotDetails.miscOperationExpenseItems ?? []).map((item) => item.itemAmount)),
  );
  const reportData = {
    estimateId,
    estimateName: reportMeta.estimateName,
    status: reportMeta.status,
    openPosition,
    headerState: {
      estimateTypeCode: headerState.estimateTypeCode,
      voyageNo: headerState.voyageNo,
      performanceMode: headerState.performanceMode,
      hireDay: headerState.hireDay,
      hireAddCommPct: headerState.hireAddCommPct,
    },
    auditState: {
      updatedAt: auditState.updatedAt,
      updatedBy: auditState.updatedBy,
    },
    lookups: {
      vessels: lookups.vessels,
      bunkerProfiles: lookups.bunkerProfiles,
    },
    vesselId: headerState.vesselId,
    bunkerProfileId: headerState.bunkerProfileId,
    cargoRows,
    portRows,
    operationExpenseRows,
    result: apiResult,
    remark: headerState.remark,
  };

  useLayoutEffect(() => {
    let active = true;
    void Promise.all([
      fetchLookup("cargoes"),
      fetchLookup("ports"),
      fetchLookup("companies"),
      fetchLookup("cp-terms"),
      fetchLookup("laytime-terms"),
      fetchLookup("fuel-types"),
      fetchLookup("expense-categories"),
      fetchLookup("vessels"),
      fetchLookup("bunker-profiles"),
    ])
      .then(
        ([
          cargoes,
          ports,
          companies,
          cpTerms,
          laytimeTerms,
          fuelTypes,
          expenseCategories,
          vessels,
          bunkerProfiles,
        ]) => {
          if (active) {
            setLookups({
              cargoes,
              ports,
              companies,
              cpTerms,
              laytimeTerms,
              fuelTypes,
              expenseCategories,
              vessels,
              bunkerProfiles,
            });
            setCargoRows((rows) => hydrateCargoRows(rows, { cargoes, ports, companies, cpTerms }));
            setCargoSeedRows((rows) =>
              hydrateCargoRows(rows, { cargoes, ports, companies, cpTerms }),
            );
            setPortRows((rows) => hydratePortRows(rows, ports));
            setPortSeedRows((rows) => hydratePortRows(rows, ports));
            setHeaderState((current) => ({
              ...current,
              vesselId:
                current.vesselId ?? (vessels.length === 1 ? String(vessels[0].id) : undefined),
            }));
          }
        },
      )
      .catch(() => {
        if (active) {
          setLookups({
            cargoes: [],
            ports: [],
            companies: [],
            cpTerms: [],
            laytimeTerms: [],
            fuelTypes: [],
            expenseCategories: [],
            vessels: [],
            bunkerProfiles: [],
          });
        }
      });

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    let active = true;
    void fetchBunkerProfiles({ vesselId: headerState.vesselId })
      .then((bunkerProfiles) => {
        if (!active) return;

        setLookups((current) => ({ ...current, bunkerProfiles }));
        setHeaderState((current) => {
          const nextProfileId =
            current.bunkerProfileId ??
            (bunkerProfiles.length === 1 ? String(bunkerProfiles[0].id) : undefined);
          if (!nextProfileId) return current;

          const profileStillAvailable = bunkerProfiles.some(
            (item) => String(item.id) === nextProfileId,
          );
          return profileStillAvailable
            ? { ...current, bunkerProfileId: nextProfileId }
            : { ...current, bunkerProfileId: undefined };
        });
      })
      .catch(() => {
        if (active) {
          setLookups((current) => ({ ...current, bunkerProfiles: [] }));
        }
      });

    return () => {
      active = false;
    };
  }, [headerState.vesselId]);

  const save = async () => {
    if (!sheetExists) {
      setSaveState({ status: "error", message: "Create a New Sheet before saving." });
      return;
    }

    const validationDetails = validateVoyageForm({
      header: headerState,
      cargoRows,
      portRows,
    });
    if (validationDetails.length) {
      setSaveState({
        status: "error",
        message: "Please fix Voyage Estimation inputs before saving.",
        details: validationDetails,
      });
      return;
    }

    setSaveState({ status: "saving" });
    try {
      const payload = buildVoyageSnapshotPayload({
        estimateId,
        estimateFileId,
        header: headerState,
        cargoRows,
        portRows,
      });
      const response = await saveVoyageSnapshot({
        ...payload,
        ...sanitizeSnapshotDetails(snapshotDetails),
      });
      setEstimateId(response.estimateId);
      setEstimateFileId(response.estimateFileId);
      setLoadEstimateId(response.estimateId);
      setApiResult(response.result);
      setAuditState({
        updatedAt: response.updatedAt ?? new Date().toISOString(),
        updatedBy: response.updatedByName ?? "Admin",
      });
      setReportMeta((current) => ({
        estimateName: current.estimateName ?? "voyage1",
        status: current.status ?? "DRAFT",
      }));
      setSaveState({
        status: "saved",
        message: `Saved estimate #${response.estimateId}. Profit USD ${response.result.profitUsd.toLocaleString("en-US")}`,
      });
    } catch (error) {
      const formatted = formatError(error, "Save failed");
      setSaveState({
        status: "error",
        message: formatted.message,
        details: formatted.details,
      });
    }
  };

  const currentSnapshot = (): VoyageSnapshotPayload => {
    const payload = buildVoyageSnapshotPayload({
      estimateId,
      estimateFileId,
      header: headerState,
      cargoRows,
      portRows,
    });

    return {
      ...payload,
      ...sanitizeSnapshotDetails(snapshotDetails),
    };
  };

  const loadById = async (id: string) => {
    setSaveState({ status: "loading" });
    try {
      const snapshot = await loadVoyageSnapshot(id);
      const mapped = mapVoyageSnapshotToRows(snapshot);
      setCargoSeedRows(mapped.cargoRows);
      setPortSeedRows(mapped.portRows);
      setCargoRows(mapped.cargoRows);
      setPortRows(mapped.portRows);
      setEstimateId(snapshot.header.estimateId);
      setEstimateFileId(snapshot.header.estimateFileId);
      setLoadEstimateId(snapshot.header.estimateId ?? id);
      setApiResult(snapshot.result);
      setAuditState({
        updatedAt: snapshot.header.updatedAt ?? "",
        updatedBy: snapshot.header.updatedByName ?? "Admin",
      });
      setReportMeta({
        estimateName: snapshot.header.sheetName ?? "voyage1",
        status: snapshot.header.status ?? "DRAFT",
      });
      setSnapshotDetails({
        operationExpenseItems: snapshot.operationExpenseItems,
        miscOperationExpenseItems: snapshot.miscOperationExpenseItems,
        miscVoyageRevenueItems: snapshot.miscVoyageRevenueItems,
      });
      setHeaderState((current) => ({
        ...current,
        vesselId: snapshot.header.vesselId,
        estimateTypeCode: snapshot.header.estimateTypeCode ?? current.estimateTypeCode,
        bunkerProfileId: snapshot.header.bunkerProfileId,
        performanceMode: snapshot.header.performanceMode ?? "FULL",
        remark: snapshot.header.remark,
        voyageNo: snapshot.header.voyageNo ?? "",
        routingSuez: snapshot.header.routingSuez ?? current.routingSuez,
        routingPanama: snapshot.header.routingPanama ?? current.routingPanama,
        routingKiel: snapshot.header.routingKiel ?? current.routingKiel,
        hireDay: snapshot.header.hireDay ?? current.hireDay,
        hireAddCommPct: snapshot.header.hireAddCommPct ?? current.hireAddCommPct,
        timeDisplayUnit: snapshot.header.timeDisplayUnit ?? current.timeDisplayUnit,
        timezoneDisplayMode: snapshot.header.timezoneDisplayMode ?? current.timezoneDisplayMode,
      }));
      setReloadKey((key) => key + 1);
      setSaveState({
        status: "loaded",
        message: `Loaded estimate #${snapshot.header.estimateId ?? id}.`,
      });
    } catch (error) {
      const formatted = formatError(error, "Load failed");
      setSaveState({
        status: "error",
        message: formatted.message,
        details: formatted.details,
      });
    }
  };

  const load = async () => {
    if (!sheetExists) {
      setSaveState({ status: "error", message: "There is no sheet to open." });
      return;
    }

    const id = loadEstimateId.trim() || estimateId;
    if (!id) {
      setSaveState({ status: "error", message: "Enter an Estimate ID to load." });
      return;
    }

    await loadById(id);
  };

  useEffect(() => {
    const routeEstimateId = new URLSearchParams(window.location.search).get("estimateId")?.trim();
    if (!routeEstimateId || routeEstimateLoadRef.current === routeEstimateId) return;

    routeEstimateLoadRef.current = routeEstimateId;
    void loadById(routeEstimateId);
  }, []);

  const loadReportSummary = async () => {
    if (!sheetExists) {
      setSaveState({ status: "error", message: "There is no sheet to open." });
      return;
    }

    const id = loadEstimateId.trim() || estimateId;
    if (!id) {
      setSaveState({ status: "error", message: "Enter an Estimate ID to load report." });
      return;
    }

    try {
      const report = await loadVoyageReportSummary(id);
      setSaveState({
        status: "loaded",
        message: `Report #${report.estimateId}: Net Hire ${report.netHire.toLocaleString("en-US")} | C/Base ${report.cBase.toLocaleString("en-US")} | Profit ${report.profitUsd.toLocaleString("en-US")}`,
      });
    } catch (error) {
      const formatted = formatError(error, "Report summary failed");
      setSaveState({ status: "error", message: formatted.message, details: formatted.details });
    }
  };

  const toOperation = async () => {
    if (!sheetExists) {
      setSaveState({ status: "error", message: "There is no sheet to convert to Operation." });
      return;
    }

    if (!estimateId) {
      setSaveState({
        status: "error",
        message: "Save this Voyage Estimation before sending it to Operation.",
      });
      return;
    }

    try {
      const existingOperation = await findOperationByEstimateId(estimateId);
      if (existingOperation.exists) {
        setSaveState({
          status: "error",
          message: `Operation #${existingOperation.operationId} already exists for estimate #${estimateId}.`,
        });
        return;
      }

      onToOperation?.(estimateId);
    } catch (error) {
      const formatted = formatError(error, "Operation lookup failed");
      setSaveState({
        status: "error",
        message: formatted.message,
        details: formatted.details,
      });
    }
  };

  const resetSheet = () => {
    setCargoSeedRows(cargoData);
    setPortSeedRows(portRotationData);
    setCargoRows(cargoData);
    setPortRows(portRotationData);
    setEstimateId(undefined);
    setEstimateFileId(undefined);
    setLoadEstimateId("");
    setOpenPosition("");
    setApiResult(undefined);
    setAuditState({ updatedAt: "", updatedBy: "Admin" });
    setReportMeta({ estimateName: "voyage1", status: "DRAFT" });
    setSnapshotDetails({});
    setHeaderState(defaultHeaderState);
    setSheetExists(true);
    setReloadKey((key) => key + 1);
    setSaveState({ status: "idle" });
  };

  const deleteSheet = () => {
    setCargoSeedRows([]);
    setPortSeedRows([]);
    setCargoRows([]);
    setPortRows([]);
    setEstimateId(undefined);
    setEstimateFileId(undefined);
    setLoadEstimateId("");
    setApiResult(undefined);
    setAuditState({ updatedAt: "", updatedBy: "Admin" });
    setReportMeta({ estimateName: "voyage1", status: "DRAFT" });
    setSnapshotDetails({});
    setSheetExists(false);
    setReloadKey((key) => key + 1);
    setSaveState({ status: "idle" });
  };

  const applyFreightSimulation = (response?: FreightSimulationResponse) => {
    if (!response?.adjustedSnapshot) return;
    const adjustedByLine = new Map(
      response.adjustedSnapshot.cargoLines.map((line) => [line.lineNo, line]),
    );
    setCargoRows((current) =>
      current.map((row) => {
        const adjusted = adjustedByLine.get(Number(row.no));
        if (!adjusted) return row;
        const totalFreight =
          adjusted.freight.freightType === "L"
            ? adjusted.freight.freightLumpsum
            : (adjusted.quantity ?? 0) * (adjusted.freight.freightRate ?? 0);
        return {
          ...row,
          frt: formatSimulationNumber(adjusted.freight.freightRate),
          frtLumpsum: formatSimulationNumber(adjusted.freight.freightLumpsum),
          totalFreight: formatSimulationNumber(totalFreight),
          isFreightFixed: adjusted.freight.isFreightFixed,
        };
      }),
    );
    setModal(null);
    setSaveState({
      status: "loaded",
      message: `Freight simulation applied. Profit ${response.adjustedResult.profitUsd.toLocaleString("en-US")}`,
    });
  };

  workspaceToolbarActionsRef.current = {
    resetSheet,
    deleteSheet,
    save: () => void save(),
    load: () => void load(),
    reload: () => void loadReportSummary(),
    toOperation: () => void toOperation(),
    clear: () => setSaveState({ status: "idle" }),
  };

  useEffect(() => {
    registerWorkspaceToolbar?.({
      hasSheet: sheetExists,
      hasEstimate: Boolean(estimateId),
      execute: {
        new: () => workspaceToolbarActionsRef.current.resetSheet(),
        delete: () => workspaceToolbarActionsRef.current.deleteSheet(),
        save: () => workspaceToolbarActionsRef.current.save(),
        saveAs: () => workspaceToolbarActionsRef.current.save(),
        open: () => workspaceToolbarActionsRef.current.load(),
        reload: () => workspaceToolbarActionsRef.current.reload(),
        toOperation: () => workspaceToolbarActionsRef.current.toOperation(),
        undo: () => workspaceToolbarActionsRef.current.clear(),
        increase: () => workspaceToolbarActionsRef.current.clear(),
        decrease: () => workspaceToolbarActionsRef.current.clear(),
        options: () => workspaceToolbarActionsRef.current.clear(),
      },
    });
  }, [estimateId, registerWorkspaceToolbar, sheetExists]);

  return (
    <EstimatorShell
      sheetKind="voyage"
      onSave={save}
      onOpen={load}
      onReload={loadReportSummary}
      lastUpdatedAt={auditState.updatedAt}
      lastUpdatedBy={auditState.updatedBy}
    >
      {(apiResult ||
        saveState.status === "saved" ||
        saveState.status === "loaded" ||
        saveState.status === "error") && (
        <div className="mb-2 flex flex-wrap items-center gap-2">
          {apiResult && (
            <span className="text-[11px] font-semibold text-[#1f6f94]">
              Revenue {apiResult.revenue.toLocaleString("en-US")} | Profit{" "}
              {apiResult.profitUsd.toLocaleString("en-US")} | Days{" "}
              {apiResult.totalDurationDays.toLocaleString("en-US")}
            </span>
          )}
          {(saveState.status === "saved" || saveState.status === "loaded") && (
            <Alert type="success" showIcon message={saveState.message} />
          )}
          {saveState.status === "error" && (
            <Alert
              type="error"
              showIcon
              message={saveState.message}
              description={
                saveState.details?.length ? (
                  <ul className="m-0 pl-4">
                    {saveState.details.map((detail) => (
                      <li key={detail}>{detail}</li>
                    ))}
                  </ul>
                ) : undefined
              }
            />
          )}
        </div>
      )}
      <VesselSection
        estimateId={estimateId}
        voyageNo={headerState.voyageNo}
        estType={headerState.estimateTypeCode}
        openPosition={openPosition}
        vesselId={headerState.vesselId}
        bunkerProfileId={headerState.bunkerProfileId}
        performanceMode={headerState.performanceMode}
        vessels={lookups.vessels}
        bunkerProfiles={lookups.bunkerProfiles}
        ports={lookups.ports}
        onVoyageNoChange={(voyageNo) => setHeaderState((current) => ({ ...current, voyageNo }))}
        onEstTypeChange={(estimateTypeCode) =>
          setHeaderState((current) => ({ ...current, estimateTypeCode }))
        }
        onOpenPositionChange={setOpenPosition}
        onVesselIdChange={(vesselId) =>
          setHeaderState((current) => ({
            ...current,
            vesselId,
            bunkerProfileId: undefined,
            performanceMode: "FULL",
          }))
        }
        onBunkerProfileIdChange={(bunkerProfileId) =>
          setHeaderState((current) => ({ ...current, bunkerProfileId, performanceMode: "FULL" }))
        }
        onPerformanceModeChange={(performanceMode) =>
          setHeaderState((current) => ({ ...current, performanceMode }))
        }
      />
      <CargoTable
        onOpenLoadableQuantity={() => setModal("loadable")}
        onOpenFreightSimulator={() => setModal("freight")}
        onRowsChange={setCargoRows}
        initialRows={cargoSeedRows}
        reloadKey={reloadKey}
        lookups={lookups}
      />
      <PortRotationTable
        onOpenAnalyzer={() => setModal("analyzer")}
        onOpenRemark={() => setRemarkOpen(true)}
        onRowsChange={setPortRows}
        timeDisplayUnit={headerState.timeDisplayUnit}
        timezoneDisplayMode={headerState.timezoneDisplayMode}
        onTimeDisplayUnitChange={(timeDisplayUnit) =>
          setHeaderState((current) => ({ ...current, timeDisplayUnit }))
        }
        onTimezoneDisplayModeChange={(timezoneDisplayMode) =>
          setHeaderState((current) => ({ ...current, timezoneDisplayMode }))
        }
        routingSuez={headerState.routingSuez}
        routingPanama={headerState.routingPanama}
        routingKiel={headerState.routingKiel}
        onRoutingSuezChange={(routingSuez) =>
          setHeaderState((current) => ({ ...current, routingSuez }))
        }
        onRoutingPanamaChange={(routingPanama) =>
          setHeaderState((current) => ({ ...current, routingPanama }))
        }
        onRoutingKielChange={(routingKiel) =>
          setHeaderState((current) => ({ ...current, routingKiel }))
        }
        initialRows={portSeedRows}
        reloadKey={reloadKey}
        ports={lookups.ports}
        cargoRows={cargoRows}
      />
      <BottomPanels
        onOpenBunkerSimulator={() => setModal("bunker")}
        onOpenRemark={() => setRemarkOpen(true)}
        onOpenReport={() => setReportOpen(true)}
        onPrintReport={() => {
          setReportOpen(true);
          setReportPrintToken(Date.now());
        }}
        result={apiResult}
        operationExpenseRows={operationExpenseRows}
        operationExpenseItems={currentOperationExpenseItems}
        onOperationExpenseItemsChange={setOperationExpenseItems}
        miscOperationExpenseItems={snapshotDetails.miscOperationExpenseItems ?? []}
        onMiscOperationExpenseItemsChange={setMiscOperationExpenseItems}
        miscVoyageRevenueItems={snapshotDetails.miscVoyageRevenueItems ?? []}
        onMiscVoyageRevenueItemsChange={setMiscVoyageRevenueItems}
        hireDay={headerState.hireDay}
        hireAddCommPct={headerState.hireAddCommPct}
        onHireDayChange={(hireDay) => setHeaderState((current) => ({ ...current, hireDay }))}
        onHireAddCommPctChange={(hireAddCommPct) =>
          setHeaderState((current) => ({ ...current, hireAddCommPct }))
        }
      />
      {modal === "loadable" && <LoadableQuantityApp onClose={() => setModal(null)} />}
      {modal === "freight" && (
        <FreightSimulatorApp
          onClose={() => setModal(null)}
          snapshot={currentSnapshot()}
          onApply={applyFreightSimulation}
        />
      )}
      {modal === "bunker" && <BunkerSimulatorApp onClose={() => setModal(null)} />}
      {modal === "analyzer" && (
        <AnalyzerApp onClose={() => setModal(null)} snapshot={currentSnapshot()} />
      )}
      <Modal
        title="Remark"
        open={remarkOpen}
        onCancel={() => setRemarkOpen(false)}
        onOk={() => setRemarkOpen(false)}
        okText="Done"
      >
        <Input.TextArea
          rows={5}
          value={headerState.remark ?? ""}
          onChange={(event) =>
            setHeaderState((current) => ({ ...current, remark: event.target.value }))
          }
        />
      </Modal>
      <VoyageReportPreview
        open={reportOpen}
        onClose={() => setReportOpen(false)}
        data={reportData}
        autoPrintToken={reportPrintToken}
      />
    </EstimatorShell>
  );
}

function buildOperationExpenseRows(
  cargoRows: CargoRow[],
  portRows: PortRow[],
  result: VoyageSnapshotResult | undefined,
  routingService: number,
  otherExpense: number,
): Array<[string, string, string, string]> {
  const despatch = sum(portRows.map((row) => parseAmount(row.des)));
  const portCharge = sum(portRows.map((row) => parseAmount(row.portCharge)));
  const addComm = sum(cargoRows.map((row) => cargoFreight(row) * (parseAmount(row.aComm) / 100)));
  const brokerage = sum(cargoRows.map((row) => cargoFreight(row) * (parseAmount(row.brkg) / 100)));
  const freightTax = sum(
    cargoRows.map((row) => cargoFreight(row) * (parseAmount(row.frtTax) / 100)),
  );
  const linerTerms = sum(cargoRows.map((row) => parseAmount(row.linerTerm)));
  const bunkerExpense =
    result?.bunkerSummaries?.reduce((total, item) => total + item.expense, 0) ?? 0;

  return [
    ["Dem/Des", formatAmount(despatch), "Bunker Expense", formatAmount(bunkerExpense)],
    ["Add Comm.", formatAmount(addComm), "C.E.V.", "0.0"],
    ["Brokerage", formatAmount(brokerage), "ILOHC", "0.0"],
    ["Freight Tax", formatAmount(freightTax), "Ballast Bonus", "0.0"],
    ["Liner Terms", formatAmount(linerTerms), "Routing Service", formatAmount(routingService)],
    ["Port Charge", formatAmount(portCharge), "Other", formatAmount(otherExpense)],
  ];

  function cargoFreight(row: CargoRow) {
    return row.frtType === "L"
      ? parseAmount(row.frtLumpsum)
      : parseAmount(row.quantity) * parseAmount(row.frt);
  }
}

function sanitizeSnapshotDetails(details: SnapshotDetails): SnapshotDetails {
  return {
    ...details,
    miscOperationExpenseItems: sanitizeMiscItems(details.miscOperationExpenseItems),
    miscVoyageRevenueItems: sanitizeMiscItems(details.miscVoyageRevenueItems),
  };
}

function sanitizeMiscItems(items: MiscItem[] | undefined) {
  return items
    ?.filter((item) => item.itemDescription.trim() || item.itemType?.trim() || item.itemAmount)
    .map((item, index) => ({ ...item, itemId: item.itemId || index + 1 }));
}

function parseAmount(value: string | undefined) {
  if (!value) return 0;
  const parsed = Number(value.replace(/,/g, "").replace("%", "").trim());
  return Number.isFinite(parsed) ? parsed : 0;
}

function sum(values: number[]) {
  return values.reduce((total, value) => total + value, 0);
}

function formatAmount(value: number) {
  return value.toLocaleString("en-US", { minimumFractionDigits: 1, maximumFractionDigits: 1 });
}

function hydrateCargoRows(
  rows: CargoRow[],
  lookups: Pick<typeof defaultLookups, "cargoes" | "ports" | "companies" | "cpTerms">,
) {
  return rows.map((row) => {
    const account = findLookup(row.account, lookups.companies);
    const cargo = findLookup(row.cargoName, lookups.cargoes);
    const loadingPort = findLookup(row.loadingPort, lookups.ports);
    const dischargingPort = findLookup(row.dischargingPort, lookups.ports);
    const freightTerm = findLookup(row.term, lookups.cpTerms);

    return {
      ...row,
      accountCompanyId: row.accountCompanyId ?? account?.id?.toString(),
      cargoId: row.cargoId ?? cargo?.id?.toString(),
      unit: row.unit || cargo?.defaultUnit || "MT",
      loadingPortId: row.loadingPortId ?? loadingPort?.id?.toString(),
      dischargingPortId: row.dischargingPortId ?? dischargingPort?.id?.toString(),
      freightTermId: row.freightTermId ?? freightTerm?.id?.toString(),
    };
  });
}

function hydratePortRows(rows: PortRow[], ports: LookupItem[]) {
  return rows.map((row) => ({
    ...row,
    portId: row.portId ?? findLookup(row.port, ports)?.id?.toString(),
  }));
}

const defaultLookups = {
  cargoes: [] as LookupItem[],
  ports: [] as LookupItem[],
  companies: [] as LookupItem[],
  cpTerms: [] as LookupItem[],
};

function findLookup(value: string | undefined, options: LookupItem[]) {
  const normalized = normalizeLookupText(value);
  if (!normalized) return undefined;

  return options.find((item) => {
    const candidates = [
      item.name,
      item.code,
      item.term,
      item.country && item.name ? `${item.name} <${item.country}>` : undefined,
    ];
    return candidates.some((candidate) => normalizeLookupText(candidate) === normalized);
  });
}

function normalizeLookupText(value: string | null | undefined) {
  return value
    ?.replace(/\[[^\]]*]/g, "")
    .replace(/\.\.\./g, "")
    .trim()
    .toLowerCase();
}

function validateVoyageForm({
  header,
  cargoRows,
  portRows,
}: {
  header: VoyageHeaderState;
  cargoRows: CargoRow[];
  portRows: PortRow[];
}) {
  const details: string[] = [];
  const activeCargoRows = cargoRows.filter((row) => row.key !== "margin" && hasCargoInput(row));
  const activePortRows = portRows.filter((row) => row.key !== "margin" && hasPortInput(row));

  if (!header.vesselId) details.push("Vessel is required.");
  if (!header.bunkerProfileId) details.push("Bunker Profile is required.");
  if (!activeCargoRows.length) details.push("At least one Cargo row is required.");
  if (!activePortRows.length) details.push("At least one Port Rotation row is required.");

  activeCargoRows.forEach((row, index) => {
    const prefix = `Cargo row ${index + 1}`;
    if (!row.cargoName && !row.cargoId) details.push(`${prefix}: Cargo Name is required.`);
    if (!row.loadingPortId) details.push(`${prefix}: Loading Port must be selected from lookup.`);
    if (!row.dischargingPortId) {
      details.push(`${prefix}: Discharging Port must be selected from lookup.`);
    }
    if (parseAmount(row.quantity) <= 0) details.push(`${prefix}: Quantity must be greater than 0.`);
    if (row.frtType === "L" && parseAmount(row.frtLumpsum) <= 0) {
      details.push(`${prefix}: Frt Lumpsum is required when Frt Type is L.`);
    }
    if (row.frtType !== "L" && parseAmount(row.frt) <= 0) {
      details.push(`${prefix}: Frt is required when Frt Type is F.`);
    }
  });

  activePortRows.forEach((row, index) => {
    const prefix = `Port row ${index + 1}`;
    if (row.type && row.type !== "Others" && !row.portId) {
      details.push(`${prefix}: Port must be selected from lookup.`);
    }
    if (parseAmount(row.eca) > parseAmount(row.distance)) {
      details.push(`${prefix}: ECA distance must not exceed total distance.`);
    }
    if (parseAmount(row.distance) > 0 && parseAmount(row.spd) <= 0) {
      details.push(`${prefix}: Speed is required when distance is provided.`);
    }
  });

  return details;
}

function hasCargoInput(row: CargoRow) {
  return Boolean(
    row.cargoName ||
    row.quantity ||
    row.frt ||
    row.frtLumpsum ||
    row.loadingPort ||
    row.dischargingPort,
  );
}

function hasPortInput(row: PortRow) {
  return Boolean(row.type || row.port || row.distance || row.sea || row.departure);
}

function formatSimulationNumber(value: number | undefined) {
  return value === undefined
    ? ""
    : value.toLocaleString("en-US", {
        minimumFractionDigits: 1,
        maximumFractionDigits: 3,
      });
}
