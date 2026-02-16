/**
 * File: apps\backend\src\bookings\booking-rules.spec.ts
 */

import { isValidSlotDuration, isWithinOpeningHours } from './booking-rules';

describe('booking rules', () => {
  it('accepts exact slot duration', () => {
    const start = new Date(2026, 1, 13, 18, 0, 0, 0);
    const end = new Date(2026, 1, 13, 19, 30, 0, 0);

    expect(isValidSlotDuration(start, end, 90)).toBe(true);
    expect(isValidSlotDuration(start, end, 60)).toBe(false);
  });

  it('validates opening hour interval', () => {
    const validStart = new Date(2026, 1, 13, 15, 0, 0, 0);
    const validEnd = new Date(2026, 1, 13, 16, 30, 0, 0);
    const invalidStart = new Date(2026, 1, 13, 14, 0, 0, 0);
    const invalidEnd = new Date(2026, 1, 13, 23, 30, 0, 0);

    expect(isWithinOpeningHours(validStart, validEnd, 15, 23)).toBe(true);
    expect(isWithinOpeningHours(invalidStart, validEnd, 15, 23)).toBe(false);
    expect(isWithinOpeningHours(validStart, invalidEnd, 15, 23)).toBe(false);
  });
});
