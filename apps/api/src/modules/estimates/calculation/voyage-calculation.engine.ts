import { Injectable } from '@nestjs/common';
import type {
  SaveVoyageEstimateDto,
  VoyageBunkerRateDto,
  VoyageCargoLineDto,
  VoyagePortLegDto,
} from '../dto/voyage-estimate-snapshot.dto';

export type BunkerSummaryResult = {
  fuelTypeId: number;
  fuelCode?: string;
  pricePerMt?: number;
  consumptionMt: number;
  expense: number;
};

export type VoyageCalculationResult = {
  totalDurationDays: number;
  totalDistanceNm: number;
  ballastDays: number;
  ladenDays: number;
  ecaDays: number;
  loadDays: number;
  dischargeDays: number;
  idleDays: number;
  marginDays: number;
  revenue: number;
  opExpense: number;
  opProfit: number;
  totalHire: number;
  totalFreight: number;
  profitUsd: number;
  profitRatePct: number;
  tceUsdDay: number;
  dailyRevenue: number;
  dailyExpense: number;
  dailyProfit: number;
  bunkerSummaries: BunkerSummaryResult[];
};

@Injectable()
export class VoyageCalculationEngine {
  calculate(snapshot: SaveVoyageEstimateDto): VoyageCalculationResult {
    const totalDistanceNm = sum(snapshot.portLegs.map((leg) => leg.distanceNm));
    const legs = snapshot.portLegs.map((leg) => ({
      ...leg,
      derivedSeaDays: deriveSeaDays(leg),
      ecaDays: deriveEcaDays(leg),
      workingDays: deriveWorkingDays(leg, snapshot.cargoLines),
    }));
    const totalSeaDays = sum(legs.map((leg) => leg.derivedSeaDays));
    const totalIdleDays = sum(snapshot.portLegs.map((leg) => leg.portIdleDays));
    const totalWorkingDays = sum(legs.map((leg) => leg.workingDays));
    const marginSeaDays = num(snapshot.header.marginSeaDays);
    const marginPortIdleDays = num(snapshot.header.marginPortIdleDays);
    const actualBallastDays = sum(
      legs.map((leg, index) => (isBallastLeg(snapshot.portLegs, index) ? leg.derivedSeaDays : 0)),
    );
    const actualLadenDays = sum(
      legs.map((leg, index) => (isBallastLeg(snapshot.portLegs, index) ? 0 : leg.derivedSeaDays)),
    );
    const marginSplit = splitMarginSeaDays(marginSeaDays, actualBallastDays, actualLadenDays);
    const totalDurationDays = round2(
      totalSeaDays + totalWorkingDays + totalIdleDays + marginSeaDays + marginPortIdleDays,
    );

    const totalFreight = round2(sum(snapshot.cargoLines.map((line) => this.freightAmount(line))));
    const demurrage = sum(snapshot.portLegs.map((leg) => leg.cpTerm?.demurrage));
    const despatch = sum(snapshot.portLegs.map((leg) => leg.cpTerm?.despatch));
    const portCharge = sum(snapshot.portLegs.map((leg) => leg.portCharge));
    const linerCost = sum(snapshot.cargoLines.map((line) => line.freight.linerCostAmount));
    const manualOperationExpense = sum(
      snapshot.operationExpenseItems?.map((item) => item.amount) ?? [],
    );
    const miscOperationExpense = sum(
      snapshot.miscOperationExpenseItems?.map((item) => item.itemAmount) ?? [],
    );
    const miscVoyageRevenue = sum(
      snapshot.miscVoyageRevenueItems?.map((item) => item.itemAmount) ?? [],
    );
    const commissions = sum(
      snapshot.cargoLines.map((line) => {
        const freight = this.freightAmount(line);
        return (
          freight * (num(line.freight.addCommPct) / 100) +
          freight * (num(line.freight.brokeragePct) / 100) +
          freight * (num(line.freight.freightTaxPct) / 100)
        );
      }),
    );
    const bunkerSummaries = calculateBunkerSummaries(legs, snapshot.bunkerProfile ?? []);
    const bunkerExpense = round2(sum(bunkerSummaries.map((item) => item.expense)));

    const revenue = round2(totalFreight + demurrage + miscVoyageRevenue);
    const opExpense = round2(
      despatch +
        portCharge +
        linerCost +
        commissions +
        bunkerExpense +
        manualOperationExpense +
        miscOperationExpense,
    );
    const opProfit = round2(revenue - opExpense);
    const netHire = num(snapshot.header.hireDay) * (1 - num(snapshot.header.hireAddCommPct) / 100);
    const totalHire = round2(netHire * totalDurationDays);
    const profitUsd = round2(opProfit - totalHire);
    const dailyRevenue = perDay(revenue, totalDurationDays);
    const dailyExpense = perDay(opExpense + totalHire, totalDurationDays);
    const dailyProfit = perDay(profitUsd, totalDurationDays);

    return {
      totalDurationDays,
      totalDistanceNm: round2(totalDistanceNm),
      ballastDays: round2(actualBallastDays + marginSplit.ballast),
      ladenDays: round2(actualLadenDays + marginSplit.laden),
      ecaDays: round2(sum(legs.map((leg) => leg.ecaDays))),
      loadDays: round2(
        sum(legs.map((leg) => (leg.legType === 'LOADING' ? leg.workingDays : 0))),
      ),
      dischargeDays: round2(
        sum(legs.map((leg) => (leg.legType === 'DISCHARGE' ? leg.workingDays : 0))),
      ),
      idleDays: round2(totalIdleDays + marginPortIdleDays),
      marginDays: round2(marginSeaDays + marginPortIdleDays),
      revenue,
      opExpense,
      opProfit,
      totalHire,
      totalFreight,
      profitUsd,
      profitRatePct: revenue === 0 ? 0 : round3((profitUsd / revenue) * 100),
      tceUsdDay: perDay(opProfit, totalDurationDays),
      dailyRevenue,
      dailyExpense,
      dailyProfit,
      bunkerSummaries,
    };
  }

  private freightAmount(line: VoyageCargoLineDto): number {
    if (line.freight.freightType === 'L') {
      return num(line.freight.freightLumpsum);
    }

    return num(line.freight.freightRate) * num(line.quantity);
  }
}

export function deriveSeaDays(leg: VoyagePortLegDto): number {
  if (leg.distanceNm && leg.speedKn) {
    return round2((leg.distanceNm * (1 + num(leg.wfPct) / 100)) / leg.speedKn / 24);
  }

  return num(leg.seaDays);
}

function deriveEcaDays(leg: VoyagePortLegDto): number {
  if (!leg.ecaNm || !leg.speedKn) {
    return 0;
  }

  return round2((leg.ecaNm * (1 + num(leg.wfPct) / 100)) / leg.speedKn / 24);
}

function deriveWorkingDays(leg: VoyagePortLegDto, cargoLines: VoyageCargoLineDto[]): number {
  const ldRate = num(leg.cpTerm?.ldRate);
  if (ldRate === 0 || !leg.portId) {
    return 0;
  }

  if (leg.legType === 'LOADING') {
    return round2(quantityAtPort(cargoLines, 'loadingPortId', leg.portId) / ldRate);
  }

  if (leg.legType === 'DISCHARGE') {
    return round2(quantityAtPort(cargoLines, 'dischargingPortId', leg.portId) / ldRate);
  }

  return 0;
}

function calculateBunkerSummaries(
  legs: Array<VoyagePortLegDto & { derivedSeaDays: number; ecaDays: number; workingDays: number }>,
  rates: VoyageBunkerRateDto[],
): BunkerSummaryResult[] {
  if (rates.length === 0) {
    return [];
  }

  const byFuel = new Map<number, BunkerSummaryResult>();

  legs.forEach((leg, index) => {
    const ballast = isBallastLeg(legs, index);
    const ecaDays = leg.ecaDays;
    const normalSeaDays = Math.max(0, leg.derivedSeaDays - ecaDays);
    const seaActivity = ballast ? 'BALLAST' : 'LADEN';

    addConsumption(byFuel, rates, 'MAIN', 'NORMAL', seaActivity, normalSeaDays);
    addConsumption(byFuel, rates, 'MAIN', 'ECA', seaActivity, ecaDays);
    addConsumption(byFuel, rates, 'SUB', 'NORMAL', 'SEA', normalSeaDays);
    addConsumption(byFuel, rates, 'SUB', 'ECA', 'SEA', ecaDays);
    addConsumption(byFuel, rates, 'MAIN', 'NORMAL', 'IDLE', num(leg.portIdleDays));
    addConsumption(byFuel, rates, 'SUB', 'NORMAL', 'IDLE', num(leg.portIdleDays));
    addConsumption(byFuel, rates, 'MAIN', 'NORMAL', 'WORK', leg.workingDays);
    addConsumption(byFuel, rates, 'SUB', 'NORMAL', 'WORK', leg.workingDays);
  });

  return [...byFuel.values()].map((item) => ({
    ...item,
    consumptionMt: round3(item.consumptionMt),
    expense: round2(item.expense),
  }));
}

function addConsumption(
  byFuel: Map<number, BunkerSummaryResult>,
  rates: VoyageBunkerRateDto[],
  role: VoyageBunkerRateDto['role'],
  condition: VoyageBunkerRateDto['condition'],
  activity: VoyageBunkerRateDto['activity'],
  days: number,
) {
  if (days === 0) return;
  const rate = rates.find(
    (item) => item.role === role && item.condition === condition && item.activity === activity,
  );
  if (!rate) return;

  const consumption = days * rate.consumptionMtDay;
  if (consumption === 0) return;
  const current = byFuel.get(rate.fuelTypeId) ?? {
    fuelTypeId: rate.fuelTypeId,
    fuelCode: rate.fuelCode,
    pricePerMt: rate.pricePerMt,
    consumptionMt: 0,
    expense: 0,
  };

  current.consumptionMt += consumption;
  current.expense += consumption * num(rate.pricePerMt);
  byFuel.set(rate.fuelTypeId, current);
}

function quantityAtPort(
  cargoLines: VoyageCargoLineDto[],
  portField: 'loadingPortId' | 'dischargingPortId',
  portId: string,
): number {
  return sum(
    cargoLines.map((cargo) => (cargo[portField] === portId ? cargo.quantity : undefined)),
  );
}

function isBallastLeg(legs: VoyagePortLegDto[], index: number): boolean {
  const previousLegs = legs.slice(0, index);
  const loadedCargoEvents = previousLegs.filter((leg) => leg.legType === 'LOADING').length;
  const dischargedCargoEvents = previousLegs.filter((leg) => leg.legType === 'DISCHARGE').length;

  return loadedCargoEvents <= dischargedCargoEvents;
}

function splitMarginSeaDays(marginSeaDays: number, ballastDays: number, ladenDays: number) {
  const base = ballastDays + ladenDays;
  if (base === 0) {
    return { ballast: 0, laden: marginSeaDays };
  }

  const ballast = marginSeaDays * (ballastDays / base);
  return { ballast, laden: marginSeaDays - ballast };
}

function sum(values: Array<number | undefined>): number {
  return values.reduce<number>((total, value) => total + num(value), 0);
}

function num(value: number | undefined): number {
  return value ?? 0;
}

function perDay(value: number, days: number): number {
  return days === 0 ? 0 : round2(value / days);
}

function round2(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

function round3(value: number): number {
  return Math.round((value + Number.EPSILON) * 1000) / 1000;
}
