import { MINUTES_IN_HOUR, ZERO_VALUE } from "@/constants";
import { IFormattedDuration } from "@/types/analytics.types";

export function getBDTime(date?: Date | number): Date {
  const now = date ? new Date(date) : new Date();
  const utc = now.getTime() + now.getTimezoneOffset() * 60000;
  return new Date(utc + 3600000 * 6);
}

export function getEffectiveBDDateStr(date?: Date | number): string {
  const bdTime = getBDTime(date);
  if (bdTime.getHours() < 6) {
    bdTime.setDate(bdTime.getDate() - 1);
  }
  return `${bdTime.getFullYear()}-${String(bdTime.getMonth() + 1).padStart(2, "0")}-${String(
    bdTime.getDate(),
  ).padStart(2, "0")}`;
}

/**
 * Splits duration in minutes into hours and remaining minutes.
 *
 * Time Complexity: O(1) - Constant time arithmetic calculations.
 * Space Complexity: O(1) - Constant space allocation for return values.
 *
 * @param totalMinutes - The total duration in minutes.
 * @returns The formatted duration details.
 */
export const formatDuration = (totalMinutes: number): IFormattedDuration => {
  const hasHours = totalMinutes >= MINUTES_IN_HOUR;
  const hours = hasHours
    ? Math.floor(totalMinutes / MINUTES_IN_HOUR)
    : ZERO_VALUE;
  const minutes = hasHours ? totalMinutes % MINUTES_IN_HOUR : totalMinutes;
  const hasMinutes = !hasHours || minutes > ZERO_VALUE;

  return {
    hours,
    minutes,
    hasHours,
    hasMinutes,
  };
};
