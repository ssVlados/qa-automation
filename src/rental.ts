const DAY_PRICE = 800;
const WEEK_FROM = 7;
const WEEK_DISCOUNT = 0.1;
const MONTH_FROM = 30;
const MONTH_DISCOUNT = 0.25;

export function calcRental(days: number): { rent: number } {
  if (!Number.isInteger(days) || days < 1) {
    throw new Error('INVALID_DAYS');
  }
  let rate = 0;
  if (days >= MONTH_FROM) {
    rate = MONTH_DISCOUNT;
  } else if (days >= WEEK_FROM) {
    rate = WEEK_DISCOUNT;
  }
  return { rent: days * DAY_PRICE * (1 - rate) };
}