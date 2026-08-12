export type LaytimeInterval = "days" | "hours";

export type LaytimeInput = {
  interval: LaytimeInterval;
  cargoQuantity: number;
  cpRate: number;
  actualRate: number;
  demurrageRate: number;
  despatchRate: number;
  holidayConstant: boolean;
  holidaysDuringPortStay: number;
  holidaysToBeWorked: number;
  workingTimeNotCounted: number;
  additionalPortIdleMargin: number;
  applyDespatchMoney: boolean;
  applyPortWorkDay: boolean;
  applyPortIdleDay: boolean;
};

export function calculateLaytime(input: LaytimeInput) {
  const cpAllowedDays = rateToDays(input.cargoQuantity, input.cpRate, input.interval);
  const actualWorkDays = rateToDays(input.cargoQuantity, input.actualRate, input.interval);
  const holidayExcepted = input.holidayConstant
    ? Math.max(0, input.holidaysDuringPortStay - input.holidaysToBeWorked)
    : 0;
  const exceptedTimeToBeCounted = holidayExcepted + input.workingTimeNotCounted;
  const usedLaytimeDays = Math.max(0, actualWorkDays - exceptedTimeToBeCounted);
  const laytimeSaved = cpAllowedDays - usedLaytimeDays;
  const despatchMoney =
    input.applyDespatchMoney && laytimeSaved > 0 ? laytimeSaved * input.despatchRate : 0;
  const demurrageMoney = laytimeSaved < 0 ? Math.abs(laytimeSaved) * input.demurrageRate : 0;
  const portWorkDay = input.applyPortWorkDay ? actualWorkDays : 0;
  const portIdleDay = input.applyPortIdleDay ? input.additionalPortIdleMargin : 0;

  return {
    cpAllowedDays,
    actualWorkDays,
    holidayExcepted,
    exceptedTimeToBeCounted,
    usedLaytimeDays,
    laytimeSaved,
    despatchMoney,
    demurrageMoney,
    portWorkDay,
    portIdleDay,
    portStayTotal: portWorkDay + portIdleDay,
  };
}

function rateToDays(quantity: number, rate: number, interval: LaytimeInterval) {
  if (quantity <= 0 || rate <= 0) return 0;
  const duration = quantity / rate;
  return interval === "hours" ? duration / 24 : duration;
}
