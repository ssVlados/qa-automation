const DAY_PRICE = 800;

const DISCOUNT_TIERS = [
  { fromDays: 30, rate: 0.25 },
  { fromDays: 7, rate: 0.1 },
];

function calcDiscountRate(days: number): number {
  const tier = DISCOUNT_TIERS.find((t) => days >= t.fromDays);
  return tier ? tier.rate : 0;
}

export function calcRental(days: number): { rent: number } {
  if (!Number.isInteger(days) || days < 1) {
    throw new Error('INVALID_DAYS');
  }
  return { rent: days * DAY_PRICE * (1 - calcDiscountRate(days)) };
}