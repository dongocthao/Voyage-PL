const assert = require("node:assert/strict");
const {
  VoyageCalculationEngine,
} = require("../dist/modules/estimates/calculation/voyage-calculation.engine");
const { EstimateSimulationService } = require("../dist/modules/estimates/services/estimate-simulation.service");

const engine = new VoyageCalculationEngine();

const snapshot = {
  header: {
    fileName: "Regression",
    sheetName: "voyage",
    hireDay: 1000,
    hireAddCommPct: 10,
    marginSeaDays: 0,
    marginPortIdleDays: 0,
  },
  cargoLines: [
    {
      lineNo: 1,
      cargoName: "Steel",
      loadingPortId: "1",
      dischargingPortId: "2",
      quantity: 1000,
      unit: "MT",
      freight: {
        freightType: "F",
        freightRate: 20,
        addCommPct: 5,
        brokeragePct: 0,
        freightTaxPct: 0,
        linerCostAmount: 100,
        isFreightFixed: true,
      },
    },
    {
      lineNo: 2,
      cargoName: "Grain",
      loadingPortId: "1",
      dischargingPortId: "2",
      quantity: 500,
      unit: "MT",
      freight: {
        freightType: "L",
        freightLumpsum: 20000,
        addCommPct: 0,
        brokeragePct: 0,
        freightTaxPct: 0,
        linerCostAmount: 0,
        isFreightFixed: false,
      },
    },
  ],
  portLegs: [
    {
      legNo: 1,
      legType: "LOADING",
      portId: "1",
      distanceNm: 240,
      ecaNm: 24,
      wfPct: 10,
      speedKn: 10,
      portIdleDays: 1,
      portCharge: 1000,
      cpTerm: { ldRate: 1500, demurrage: 100, despatch: 50 },
    },
    {
      legNo: 2,
      legType: "DISCHARGE",
      portId: "2",
      distanceNm: 240,
      ecaNm: 48,
      wfPct: 0,
      speedKn: 10,
      portIdleDays: 1,
      portCharge: 2000,
      cpTerm: { ldRate: 1500, demurrage: 200, despatch: 75 },
    },
  ],
  bunkerProfile: [
    rate("MAIN", "NORMAL", "BALLAST", 1, "VLSFO", 10, 100),
    rate("MAIN", "NORMAL", "LADEN", 1, "VLSFO", 20, 100),
    rate("MAIN", "ECA", "BALLAST", 2, "ULSFO", 10, 200),
    rate("MAIN", "ECA", "LADEN", 2, "ULSFO", 20, 200),
    rate("SUB", "NORMAL", "SEA", 3, "MGO", 1, 300),
    rate("SUB", "ECA", "SEA", 3, "MGO", 1, 300),
    rate("MAIN", "NORMAL", "IDLE", 1, "VLSFO", 1, 100),
    rate("SUB", "NORMAL", "IDLE", 3, "MGO", 1, 300),
    rate("MAIN", "NORMAL", "WORK", 1, "VLSFO", 1, 100),
    rate("SUB", "NORMAL", "WORK", 3, "MGO", 1, 300),
  ],
};

const result = engine.calculate(snapshot);

assert.equal(result.totalFreight, 40000, "rate and lump sum freight are both included");
assert.equal(result.revenue, 40300, "demurrage is revenue");
assert.equal(result.opExpense, 10065, "despatch, port, liner, commission and bunker are expense");
assert.equal(result.totalDurationDays, 6.1, "WF-adjusted sea days and working/idle days are included");
assert.equal(result.ballastDays, 1.1, "first leg before loading completes is ballast");
assert.equal(result.ladenDays, 1, "leg after loading is laden");
assert.equal(result.ecaDays, 0.31, "ECA days use leg speed and ECA distance");
assert(result.bunkerSummaries.some((item) => item.fuelCode === "ULSFO"), "ECA main engine uses ULSFO");

const simulator = new EstimateSimulationService(engine);
const simulation = simulator.simulateFreight({ snapshot, targetProfitUsd: result.profitUsd + 1000 });
const fixedLine = simulation.cargoAdjustments.find((line) => line.lineNo === 1);
const adjustableLine = simulation.cargoAdjustments.find((line) => line.lineNo === 2);
assert.equal(fixedLine.fixed, true, "fixed cargo remains marked fixed");
assert.equal(fixedLine.freightRate, 20, "fixed freight rate is unchanged");
assert.notEqual(adjustableLine.freightLumpsum, 20000, "unfixed lump sum cargo is adjusted");

console.log("Voyage calculation regression tests passed.");

function rate(role, condition, activity, fuelTypeId, fuelCode, consumptionMtDay, pricePerMt) {
  return { role, condition, activity, fuelTypeId, fuelCode, consumptionMtDay, pricePerMt };
}
