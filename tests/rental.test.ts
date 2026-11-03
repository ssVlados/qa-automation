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

  it.each([
    { days: 6, rent: 4800 },
    { days: 7, rent: 5040 },
    { days: 8, rent: 5760 },
    { days: 29, rent: 20880 },
  ])('знижка 10% від 7 діб: $days → $rent', ({ days, rent }) => {
    expect(calcRental(days).rent).toBeCloseTo(rent, 2);
  });

  it.each([
    { days: 29, rent: 20880 },
    { days: 30, rent: 18000 },
    { days: 31, rent: 18600 },
  ])('знижка 25% від 30 діб: $days → $rent', ({ days, rent }) => {
    expect(calcRental(days).rent).toBeCloseTo(rent, 2);
  });
});