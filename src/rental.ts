export function calcRental(days: number): { rent: number } {
  if (!Number.isInteger(days) || days < 1) {
    throw new Error('INVALID_DAYS');
  }
  return { rent: days * 800 };
}