/**
 * Parses a YYYY-MM-DD date string into a Date object in local time.
 * Returns null if the date string is invalid.
 */
export function parseManualDate(dateString: string): Date | null {
  if (!dateString || typeof dateString !== 'string') {
    return null;
  }

  try {
    // Parse YYYY-MM-DD in local time
    const parts = dateString.split('-');
    if (parts.length !== 3) {
      return null;
    }

    const year = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1; // Month is 0-indexed
    const day = parseInt(parts[2], 10);

    if (isNaN(year) || isNaN(month) || isNaN(day)) {
      return null;
    }

    const date = new Date(year, month, day);

    // Validate that the date is valid
    if (
      date.getFullYear() !== year ||
      date.getMonth() !== month ||
      date.getDate() !== day
    ) {
      return null;
    }

    return date;
  } catch {
    return null;
  }
}

/**
 * Calculates the whole-number day difference between today and a manual date.
 * Returns null if the date cannot be parsed.
 * Returns negative values for future dates.
 */
export function calculateDaysSince(manualDateString: string): number | null {
  const manualDate = parseManualDate(manualDateString);
  if (!manualDate) {
    return null;
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  manualDate.setHours(0, 0, 0, 0);

  const diffMs = today.getTime() - manualDate.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  return diffDays;
}
