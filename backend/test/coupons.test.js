import { describe, it, expect } from 'vitest';
import { computeDiscount } from '../src/modules/coupons/coupons.service.js';

describe('computeDiscount', () => {
  it('calcula un porcentaje y redondea', () => {
    expect(computeDiscount({ type: 'PERCENTAGE', value: 10 }, 100000)).toBe(10000);
    expect(computeDiscount({ type: 'PERCENTAGE', value: 15 }, 33333)).toBe(5000); // 4999.95 → 5000
  });

  it('aplica un monto fijo', () => {
    expect(computeDiscount({ type: 'FIXED', value: 5000 }, 100000)).toBe(5000);
  });

  it('nunca descuenta más que el subtotal', () => {
    expect(computeDiscount({ type: 'FIXED', value: 999999 }, 20000)).toBe(20000);
    expect(computeDiscount({ type: 'PERCENTAGE', value: 100 }, 20000)).toBe(20000);
  });
});
