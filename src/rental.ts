const DAY_PRICE = 800;
const DEPOSIT = 2000;

const DISCOUNT_TIERS = [
  { fromDays: 30, rate: 0.25 },
  { fromDays: 7, rate: 0.1 },
];

function calcDiscountRate(days: number): number {
  const tier = DISCOUNT_TIERS.find((t) => days >= t.fromDays);
  return tier ? tier.rate : 0;
}

export function calcRental(days: number): {
  rent: number;
  deposit: number;
  total: number;
  depositRefund: number;
} {
  if (!Number.isInteger(days) || days < 1) {
    throw new Error('INVALID_DAYS');
  }
  const rent = days * DAY_PRICE * (1 - calcDiscountRate(days));
  return {
    rent,
    deposit: DEPOSIT,
    total: rent + DEPOSIT,
    depositRefund: DEPOSIT,
  };
}