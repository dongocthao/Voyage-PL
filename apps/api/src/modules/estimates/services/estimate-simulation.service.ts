import { Injectable } from '@nestjs/common';
import { VoyageCalculationEngine } from '../calculation/voyage-calculation.engine';
import type {
  AnalyzerSimulationDto,
  CargoReletCalculationDto,
  FreightSimulationDto,
  ReletFreightSideDto,
  TimeCharterCalculationDto,
  TimeCharterSideDto,
} from '../dto/estimate-simulation.dto';
import type { SaveVoyageEstimateDto, VoyageCargoLineDto } from '../dto/voyage-estimate-snapshot.dto';

@Injectable()
export class EstimateSimulationService {
  constructor(private readonly engine: VoyageCalculationEngine) {}

  simulateFreight(input: FreightSimulationDto) {
    const baseResult = this.engine.calculate(input.snapshot);
    const targetProfitUsd =
      input.targetProfitUsd ?? (input.targetDailyProfit ?? 0) * baseResult.totalDurationDays;
    const adjustableLines = input.snapshot.cargoLines.filter((line) => !line.freight.isFreightFixed);

    if (adjustableLines.length === 0) {
      return { baseResult, targetProfitUsd, adjustedSnapshot: input.snapshot, adjustedResult: baseResult };
    }

    let low = -1000;
    let high = 1000;
    let bestSnapshot = input.snapshot;
    let bestResult = baseResult;

    for (let i = 0; i < 50; i += 1) {
      const delta = (low + high) / 2;
      const candidate = this.applyFreightDelta(input.snapshot, delta);
      const result = this.engine.calculate(candidate);
      bestSnapshot = candidate;
      bestResult = result;

      if (result.profitUsd < targetProfitUsd) {
        low = delta;
      } else {
        high = delta;
      }
    }

    return {
      baseResult,
      targetProfitUsd,
      adjustedSnapshot: bestSnapshot,
      adjustedResult: bestResult,
      cargoAdjustments: bestSnapshot.cargoLines.map((line, index) => ({
        lineNo: line.lineNo,
        fixed: input.snapshot.cargoLines[index]?.freight.isFreightFixed ?? false,
        freightRate: line.freight.freightRate,
        freightLumpsum: line.freight.freightLumpsum,
        revenue: freightAmount(line),
      })),
    };
  }

  simulateAnalyzer(input: AnalyzerSimulationDto) {
    const baseResult = this.engine.calculate(input.snapshot);
    return {
      baseResult,
      rows: input.scenario.deltas.map((delta) => {
        const snapshot = this.applyAnalyzerDelta(input.snapshot, input.scenario.variable, delta);
        const result = this.engine.calculate(snapshot);
        return { variable: input.scenario.variable, delta, result };
      }),
    };
  }

  calculateCargoRelet(input: CargoReletCalculationDto) {
    const headFreight = sum(input.cargoLines.map((line) => freightSideAmount(line.head, line.quantity)));
    const subFreight = sum(input.cargoLines.map((line) => freightSideAmount(line.sub, line.quantity)));
    const headCommission = sum(input.cargoLines.map((line) => sideCommission(line.head, line.quantity)));
    const subCommission = sum(input.cargoLines.map((line) => sideCommission(line.sub, line.quantity)));
    const headLiner = sum(input.cargoLines.map((line) => line.head.linerCostAmount));
    const subLiner = sum(input.cargoLines.map((line) => line.sub.linerCostAmount));
    const headDemurrage = sum(input.portTerms?.map((term) => term.headDemurrage) ?? []);
    const subDemurrage = sum(input.portTerms?.map((term) => term.subDemurrage) ?? []);
    const headDespatch = sum(input.portTerms?.map((term) => term.headDespatch) ?? []);
    const subDespatch = sum(input.portTerms?.map((term) => term.subDespatch) ?? []);
    const headNet = round2(headFreight + headDemurrage - headDespatch - headCommission - headLiner);
    const subNet = round2(subFreight + subDemurrage - subDespatch - subCommission - subLiner);

    return {
      head: { freight: round2(headFreight), demurrage: round2(headDemurrage), despatch: round2(headDespatch), commission: round2(headCommission), linerCost: round2(headLiner), net: headNet },
      sub: { freight: round2(subFreight), demurrage: round2(subDemurrage), despatch: round2(subDespatch), commission: round2(subCommission), linerCost: round2(subLiner), net: subNet },
      diff: { profitUsd: round2(headNet - subNet) },
    };
  }

  calculateTimeCharter(input: TimeCharterCalculationDto) {
    const head = input.head ? calculateTcSide(input.head) : undefined;
    const sub = input.sub ? calculateTcSide(input.sub) : undefined;
    return {
      head,
      sub,
      diff: head && sub ? { profitUsd: round2(sub.netHire - head.netHire) } : undefined,
    };
  }

  private applyFreightDelta(snapshot: SaveVoyageEstimateDto, deltaRate: number): SaveVoyageEstimateDto {
    return {
      ...snapshot,
      cargoLines: snapshot.cargoLines.map((line) => {
        if (line.freight.isFreightFixed) return line;
        if (line.freight.freightType === 'L') {
          return {
            ...line,
            freight: {
              ...line.freight,
              freightLumpsum: Math.max(0, num(line.freight.freightLumpsum) + deltaRate * num(line.quantity)),
            },
          };
        }
        return {
          ...line,
          freight: { ...line.freight, freightRate: Math.max(0, num(line.freight.freightRate) + deltaRate) },
        };
      }),
    };
  }

  private applyAnalyzerDelta(
    snapshot: SaveVoyageEstimateDto,
    variable: AnalyzerSimulationDto['scenario']['variable'],
    delta: number,
  ): SaveVoyageEstimateDto {
    if (variable === 'HIRE') {
      return { ...snapshot, header: { ...snapshot.header, hireDay: num(snapshot.header.hireDay) + delta } };
    }
    if (variable === 'QUANTITY') {
      return { ...snapshot, cargoLines: snapshot.cargoLines.map((line) => ({ ...line, quantity: Math.max(0, num(line.quantity) + delta) })) };
    }
    if (variable === 'BUNKER_PRICE') {
      return {
        ...snapshot,
        bunkerProfile: snapshot.bunkerProfile?.map((rate) => ({
          ...rate,
          pricePerMt: Math.max(0, num(rate.pricePerMt) + delta),
        })),
      };
    }
    return this.applyFreightDelta(snapshot, delta);
  }
}

function calculateTcSide(side: TimeCharterSideDto) {
  const payableDays = side.totalDurationDays + num(side.optionDays);
  let remaining = payableDays;
  let grossHire = 0;
  const periodBreakdown = side.periods.map((period, index) => {
    const days =
      index === side.periods.length - 1
        ? remaining
        : Math.min(remaining, period.durationDays);
    remaining = Math.max(0, remaining - days);
    const amount = days * period.hirePerDay;
    grossHire += amount;
    return { days: round2(days), hirePerDay: period.hirePerDay, amount: round2(amount) };
  });
  const commission = grossHire * ((num(side.addCommPct) + num(side.brokeragePct)) / 100);
  return { payableDays: round2(payableDays), grossHire: round2(grossHire), commission: round2(commission), netHire: round2(grossHire - commission), periodBreakdown };
}

function freightAmount(line: VoyageCargoLineDto): number {
  return line.freight.freightType === 'L'
    ? num(line.freight.freightLumpsum)
    : num(line.quantity) * num(line.freight.freightRate);
}

function freightSideAmount(side: ReletFreightSideDto, quantity: number): number {
  return side.freightType === 'L' ? num(side.freightLumpsum) : quantity * num(side.freightRate);
}

function sideCommission(side: ReletFreightSideDto, quantity: number): number {
  return freightSideAmount(side, quantity) * ((num(side.addCommPct) + num(side.brokeragePct)) / 100);
}

function sum(values: Array<number | undefined>): number {
  return values.reduce<number>((total, value) => total + num(value), 0);
}

function num(value: number | undefined): number {
  return value ?? 0;
}

function round2(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}
