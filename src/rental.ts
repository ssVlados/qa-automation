export interface RentalResult {
  rent: number;
  deposit: number;
  total: number;
  depositRefund: number;
}

const DAY_PRICE = 800;
const DEPOSIT = 2000;

const DISCOUNT_TIERS = [
  { fromDays: 30, rate: 0.25 },
  { fromDays: 7, rate: 0.1 },
];

function assertValidDays(days: number): void {
  if (!Number.isInteger(days) || days < 1) {
    throw new Error('INVALID_DAYS');
  }
}

export function calcDiscountRate(days: number): number {
  const tier = DISCOUNT_TIERS.find((t) => days >= t.fromDays);
  return tier ? tier.rate : 0;
}

export function calcRent(days: number): number {
  return days * DAY_PRICE * (1 - calcDiscountRate(days));
}

export function calcRental(days: number): RentalResult {
  assertValidDays(days);
  const rent = calcRent(days);
  return {
    rent,
    deposit: DEPOSIT,
    total: rent + DEPOSIT,
    depositRefund: DEPOSIT,
  };
}