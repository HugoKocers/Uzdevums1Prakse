import { describe, expect, it } from 'vitest';
import { calculateCapacity } from '../src/shared/calculation';

describe('calculateCapacity', () => {
  it('uses the approved section modulus and uniformly distributed load formula', () => {
    const result = calculateCapacity({ length: 6, width: 0.1, height: 0.3, strength: 20000 });
    expect(result.sectionModulus).toBeCloseTo(0.0015);
    expect(result.capacity).toBeCloseTo(6.6666666667);
  });

  it.each([
    { length: 0, width: 0.1, height: 0.3, strength: 20000 },
    { length: Number.NaN, width: 0.1, height: 0.3, strength: 20000 },
    { length: 6, width: Number.POSITIVE_INFINITY, height: 0.3, strength: 20000 },
    { length: 6, width: 0.1, height: -0.3, strength: 20000 },
    { length: 6, width: 0.1, height: 0.3, strength: 0 }
  ])('rejects invalid input %#', (inputs) => {
    expect(() => calculateCapacity(inputs)).toThrow();
  });
});
