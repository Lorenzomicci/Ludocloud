/**
 * File: apps\backend\src\bookings\booking-rules.ts
 */

export const MINUTES_IN_MS = 60 * 1000;

/**
 * Verifica che la durata prenotazione sia esattamente pari allo slot configurato.
 */
export function isValidSlotDuration(
  startAt: Date,
  endAt: Date,
  slotMinutes: number,
): boolean {
  const diff = endAt.getTime() - startAt.getTime();
  return diff === slotMinutes * MINUTES_IN_MS;
}

/**
 * Verifica che la prenotazione:
 * - sia nello stesso giorno
 * - inizi dopo apertura
 * - termini prima chiusura.
 */
export function isWithinOpeningHours(
  startAt: Date,
  endAt: Date,
  openHour: number,
  closeHour: number,
): boolean {
  if (startAt.toDateString() !== endAt.toDateString()) {
    return false;
  }

  const openAt = new Date(startAt);
  openAt.setHours(openHour, 0, 0, 0);

  const closeAt = new Date(startAt);
  closeAt.setHours(closeHour, 0, 0, 0);

  return startAt >= openAt && endAt <= closeAt;
}
