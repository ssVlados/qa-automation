export interface ParkingOptions {
  night?: boolean;
  weekend?: boolean;
}

const FREE_MINUTES = 15;
const FIRST_HOUR_FEE = 30;
const EXTRA_HOUR_FEE = 20;
const DAILY_CAP = 200;

export function calcParkingFee(
  minutes: number,
  options: ParkingOptions = {},
): number {
  if (!Number.isInteger(minutes) || minutes < 0) {
    throw new Error('INVALID_DURATION');
  }

  let fee: number;
  if (minutes <= FREE_MINUTES) {
    fee = 0;
  } else if (minutes <= 60) {
    fee = FIRST_HOUR_FEE;
  } else {
    const extraHours = Math.ceil((minutes - 60) / 60);
    fee = Math.min(FIRST_HOUR_FEE + extraHours * EXTRA_HOUR_FEE, DAILY_CAP);
  }

  if (options.night) fee = fee / 2;
  if (options.weekend) fee = fee * 0.8;
  return fee;
}