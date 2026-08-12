export type Unit = "m" | "f";
export type CapacityType = "grain" | "bale";
export type VolumeUnit = "cbm" | "cbf";
export type TpcUnit = "tpc" | "tpi";

export type LoadableQuantityInput = {
  capacityType: CapacityType;
  capacityUnit: VolumeUnit;
  grainCapacity: number;
  baleCapacity: number;
  stowageFactor: number;
  stowageFactorUnit: VolumeUnit;
  dwt: number;
  bunkerRob: number;
  unpumpableBallast: number;
  freshWater: number;
  sagHog: number;
  constant: number;
  others: number;
  loadingVesselDraft: number;
  loadingDraftRestriction: number;
  loadingDraftUnit: Unit;
  loadingTpc: number;
  loadingTpcUnit: TpcUnit;
  dischargingBunkerConsumption: number;
  dischargingFreshWaterConsumption: number;
  seaDaysTotal: number;
  dischargingDraftRestriction: number;
  dischargingDraftUnit: Unit;
  dischargingTpc: number;
  dischargingTpcUnit: TpcUnit;
};

export function calculateLoadableQuantity(input: LoadableQuantityInput) {
  const selectedCapacity =
    input.capacityType === "grain" ? input.grainCapacity : input.baleCapacity;
  const capacityCbm =
    input.capacityUnit === "cbf" ? selectedCapacity / 35.3146667 : selectedCapacity;
  const sfCbm =
    input.stowageFactorUnit === "cbf" ? input.stowageFactor / 35.3146667 : input.stowageFactor;
  const volumeLoadable = sfCbm > 0 ? capacityCbm / sfCbm : 0;
  const totalDeducted =
    input.bunkerRob +
    input.unpumpableBallast +
    input.freshWater +
    input.sagHog +
    input.constant +
    input.others;
  const dwtLoadable = Math.max(0, input.dwt - totalDeducted);
  const baseLoadable = volumeLoadable > 0 ? Math.min(volumeLoadable, dwtLoadable) : dwtLoadable;
  const loadingDraftLoss = draftLoss({
    vesselDraft: input.loadingVesselDraft,
    restriction: input.loadingDraftRestriction,
    draftUnit: input.loadingDraftUnit,
    tpc: input.loadingTpc,
    tpcUnit: input.loadingTpcUnit,
  });
  const loadingLoadable = Math.max(0, baseLoadable - loadingDraftLoss);
  const consumptionTotal =
    (input.dischargingBunkerConsumption + input.dischargingFreshWaterConsumption) *
    input.seaDaysTotal;
  const arrivalDraft = Math.max(
    0,
    input.loadingVesselDraft - consumptionTotal / (input.loadingTpc * 100 || Infinity),
  );
  const dischargingDraftLoss = draftLoss({
    vesselDraft: arrivalDraft,
    restriction: input.dischargingDraftRestriction,
    draftUnit: input.dischargingDraftUnit,
    tpc: input.dischargingTpc,
    tpcUnit: input.dischargingTpcUnit,
  });
  const dischargingLoadable = Math.max(
    0,
    loadingLoadable - consumptionTotal - dischargingDraftLoss,
  );

  return {
    volumeLoadable,
    totalDeducted,
    dwtLoadable,
    baseLoadable,
    loadingDraftLoss,
    loadingLoadable,
    consumptionTotal,
    dischargingDraftLoss,
    dischargingLoadable,
  };
}

function draftLoss({
  vesselDraft,
  restriction,
  draftUnit,
  tpc,
  tpcUnit,
}: {
  vesselDraft: number;
  restriction: number;
  draftUnit: Unit;
  tpc: number;
  tpcUnit: TpcUnit;
}) {
  if (restriction <= 0 || vesselDraft <= restriction || tpc <= 0) return 0;
  const diffCm =
    draftUnit === "f" ? (vesselDraft - restriction) * 30.48 : (vesselDraft - restriction) * 100;
  const mtPerCm = tpcUnit === "tpi" ? tpc / 2.54 : tpc;
  return diffCm * mtPerCm;
}
