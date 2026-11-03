import { describe, it, expect } from 'vitest';
import { calcRental } from '../src/rental';

describe('calcRental', () => {
  it.each([0, -1, 1.5, NaN])('відхиляє кількість діб %s', (days) => {
    expect(() => calcRental(days)).toThrow('INVALID_DAYS');
  });
});