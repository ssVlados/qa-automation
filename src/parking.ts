export interface ParkingOptions {
  night?: boolean;
  weekend?: boolean;
}

export function calcParkingFee(
  minutes: number,
  options: ParkingOptions = {},
): number {
  throw new Error('INVALID_DURATION');
}