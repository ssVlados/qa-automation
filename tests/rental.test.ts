import { describe, it, expect } from 'vitest';
import { calcRental } from '../src/rental';

describe('calcRental', () => {
  it.each([0, -1, 1.5, NaN])('відхиляє кількість діб %s', (days) => {
    expect(() => calcRental(days)).toThrow('INVALID_DAYS');
  });

  it.each([
    { days: 1, rent: 800 },
    { days: 3, rent: 2400 },
    { days: 6, rent: 4800 },
  ])('оренда $days діб без знижки: $rent', ({ days, rent }) => {
    expect(calcRental(days).rent).toBe(rent);
  });
});