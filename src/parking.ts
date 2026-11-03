export interface ParkingOptions {
  night?: boolean;
  weekend?: boolean;
}

export function calcParkingFee(
  minutes: number,
  options: ParkingOptions = {},
): number {
  if (!Number.isInteger(minutes) || minutes < 0) {
    throw new Error('INVALID_DURATION');
  }
  return 0;
}