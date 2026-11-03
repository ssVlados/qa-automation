const DAY_PRICE = 800;
const WEEK_FROM = 7;
const WEEK_DISCOUNT = 0.1;

export function calcRental(days: number): { rent: number } {
  if (!Number.isInteger(days) || days < 1) {
    throw new Error('INVALID_DAYS');
  }
  const rate = days >= WEEK_FROM ? WEEK_DISCOUNT : 0;
  return { rent: days * DAY_PRICE * (1 - rate) };
}