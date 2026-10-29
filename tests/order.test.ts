import { describe, it, expect } from 'vitest';
import {
  calcSubtotal,
  calcDiscountRate,
  calcShipping,
  calcOrderTotal,
  applyGiftCard,
  type OrderItem,
} from '../src/order';

const item = (price: number, qty = 1): OrderItem => ({
  sku: 'SKU-1',
  price,
  qty,
});

describe('calcSubtotal', () => {
  it('підсумовує вартість позицій з урахуванням кількості', () => {
    // Arrange
    const items = [item(100, 2), { sku: 'SKU-2', price: 50, qty: 3 }];

    // Act
    const result = calcSubtotal(items);

    // Assert
    expect(result).toBe(350);
  });

  it('відхиляє порожнє замовлення', () => {
    expect(() => calcSubtotal([])).toThrow('EMPTY_ORDER');
  });

  it('відхиляє від’ємну ціну', () => {
    expect(() => calcSubtotal([item(-1)])).toThrow('NEGATIVE_PRICE');
  });

  it.each([0, -1, 1.5])('відхиляє кількість %s', (qty) => {
    expect(() => calcSubtotal([item(100, qty)])).toThrow('INVALID_QTY');
  });
});

describe('calcDiscountRate', () => {
  it.each([
    { tier: 'basic' as const, subtotal: 500, expected: 0 },
    { tier: 'silver' as const, subtotal: 500, expected: 0.05 },
    { tier: 'gold' as const, subtotal: 500, expected: 0.1 },
    { tier: 'basic' as const, subtotal: 2000, expected: 0.05 },
    { tier: 'gold' as const, subtotal: 2000, expected: 0.15 },
  ])(
    'рівень $tier із сумою $subtotal дає ставку $expected',
    ({ tier, subtotal, expected }) => {
      expect(calcDiscountRate(tier, subtotal)).toBeCloseTo(expected, 4);
    },
  );

  it.each([
    { subtotal: 1999, expected: 0 },
    { subtotal: 2000, expected: 0.05 },
    { subtotal: 2001, expected: 0.05 },
  ])('межа великого замовлення: $subtotal', ({ subtotal, expected }) => {
    expect(calcDiscountRate('basic', subtotal)).toBeCloseTo(expected, 4);
  });

  it('обмежує сумарну знижку максимальним значенням', () => {
    expect(calcDiscountRate('gold', 2000, 0.5)).toBe(0.25);
  });

  it('відхиляє від’ємний промокод', () => {
    expect(() => calcDiscountRate('basic', 500, -0.1))
      .toThrow('INVALID_PROMO');
  });
});

describe('calcShipping', () => {
  it.each([
    [999, 60],
    [1000, 0],
    [1001, 0],
  ])('сума %i → доставка %i', (amount, expected) => {
    expect(calcShipping(amount)).toBe(expected);
  });
});

describe('calcOrderTotal', () => {
  it('додає доставку до замовлення нижче порога', () => {
    const total = calcOrderTotal([item(500)], 'basic');
    expect(total).toBeCloseTo(560, 2);
  });

  it('не додає доставку, якщо сума після знижки сягає порога', () => {
    // 1200 − 10 % = 1080 ≥ 1000, доставка безкоштовна
    const total = calcOrderTotal([item(1200)], 'gold');
    expect(total).toBeCloseTo(1080, 2);
  });

  it('знижка може опустити суму нижче порога доставки', () => {
    // 1050 − 10 % = 945 < 1000, тому доставка платна
    const total = calcOrderTotal([item(1050)], 'gold');
    expect(total).toBeCloseTo(1005, 2);
  });

  it('передає виняток із нижнього рівня', () => {
    expect(() => calcOrderTotal([], 'gold')).toThrow('EMPTY_ORDER');
  });
});

describe('applyGiftCard', () => {
  it.each([
    { total: 500, balance: 0, toPay: 500, remaining: 0 },
    { total: 500, balance: 200, toPay: 300, remaining: 0 },
    { total: 500, balance: 499, toPay: 1, remaining: 0 },
    { total: 500, balance: 500, toPay: 0, remaining: 0 },
    { total: 500, balance: 501, toPay: 0, remaining: 1 },
    { total: 500, balance: 1000, toPay: 0, remaining: 500 },
    { total: 0, balance: 300, toPay: 0, remaining: 300 },
  ])(
    'сума $total, баланс $balance → до сплати $toPay, залишок $remaining',
    ({ total, balance, toPay, remaining }) => {
      expect(applyGiftCard(total, balance)).toEqual({ toPay, remaining });
    },
  );

  it.each([
    { total: 99.99, balance: 50.5, toPay: 49.49, remaining: 0 },
    { total: 0.3, balance: 0.1, toPay: 0.2, remaining: 0 },
    { total: 10, balance: 10.01, toPay: 0, remaining: 0.01 },
  ])(
    'дробові суми: сума $total, баланс $balance',
    ({ total, balance, toPay, remaining }) => {
      const result = applyGiftCard(total, balance);
      expect(result.toPay).toBeCloseTo(toPay, 2);
      expect(result.remaining).toBeCloseTo(remaining, 2);
    },
  );

  it.each([
    { total: -0.01, balance: 100, code: 'INVALID_TOTAL' },
    { total: NaN, balance: 100, code: 'INVALID_TOTAL' },
    { total: 100, balance: -0.01, code: 'INVALID_BALANCE' },
    { total: 100, balance: NaN, code: 'INVALID_BALANCE' },
    { total: 100, balance: Infinity, code: 'INVALID_BALANCE' },
  ])(
    'відхиляє некоректні дані: сума $total, баланс $balance → $code',
    ({ total, balance, code }) => {
      expect(() => applyGiftCard(total, balance)).toThrow(code);
    },
  );
});