export function calcRental(days: number): { rent: number } {
  if (!Number.isInteger(days) || days < 1) {
    throw new Error('INVALID_DAYS');
  }
  const rate = days >= 7 ? 0.1 : 0;
  return { rent: days * 800 * (1 - rate) };
}