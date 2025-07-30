/**
 * Utility functions for date handling
 */

/**
 * Safely parse a date string that might include timezone offset
 * @param dateString - Date string in various formats
 * @returns Date object or null if invalid
 */
export const parseDate = (dateString: string): Date | null => {
  if (!dateString) return null;

  let date: Date;

  try {
    if (dateString.includes("+")) {
      // Handle ISO string with timezone offset (e.g., "2025-07-28 09:47:00+00")
      const dateWithoutTz = dateString.split("+")[0];
      date = new Date(dateWithoutTz + "Z"); // Add Z to treat as UTC
    } else {
      date = new Date(dateString);
    }

    // Check if date is valid
    if (isNaN(date.getTime())) {
      console.warn("Invalid date string:", dateString);
      return null;
    }

    return date;
  } catch (error) {
    console.error("Error parsing date:", dateString, error);
    return null;
  }
};

/**
 * Format date for display
 * @param dateString - Date string to format
 * @returns Formatted date string or "Invalid date" if parsing fails
 */
export const formatDate = (dateString: string): string => {
  const date = parseDate(dateString);
  if (!date) return "Invalid date";

  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

/**
 * Format date only (without time)
 * @param dateString - Date string to format
 * @returns Formatted date string or "Invalid date" if parsing fails
 */
export const formatDateOnly = (dateString: string): string => {
  const date = parseDate(dateString);
  if (!date) return "Invalid date";

  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

/**
 * Format time only
 * @param dateString - Date string to format
 * @returns Formatted time string or "Invalid time" if parsing fails
 */
export const formatTime = (dateString: string): string => {
  const date = parseDate(dateString);
  if (!date) return "Invalid time";

  return date.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
};

/**
 * Check if a date is in the future
 * @param dateString - Date string to check
 * @returns true if date is in the future
 */
export const isFutureDate = (dateString: string): boolean => {
  const date = parseDate(dateString);
  if (!date) return false;

  return date > new Date();
};

/**
 * Get relative time (e.g., "2 hours ago", "in 3 days")
 * @param dateString - Date string to format
 * @returns Relative time string
 */
export const getRelativeTime = (dateString: string): string => {
  const date = parseDate(dateString);
  if (!date) return "Invalid date";

  const now = new Date();
  const diffInMs = date.getTime() - now.getTime();
  const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
  const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
  const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

  if (diffInMs < 0) {
    // Past date
    if (Math.abs(diffInDays) > 0) {
      return `${Math.abs(diffInDays)} day${
        Math.abs(diffInDays) === 1 ? "" : "s"
      } ago`;
    } else if (Math.abs(diffInHours) > 0) {
      return `${Math.abs(diffInHours)} hour${
        Math.abs(diffInHours) === 1 ? "" : "s"
      } ago`;
    } else {
      return `${Math.abs(diffInMinutes)} minute${
        Math.abs(diffInMinutes) === 1 ? "" : "s"
      } ago`;
    }
  } else {
    // Future date
    if (diffInDays > 0) {
      return `in ${diffInDays} day${diffInDays === 1 ? "" : "s"}`;
    } else if (diffInHours > 0) {
      return `in ${diffInHours} hour${diffInHours === 1 ? "" : "s"}`;
    } else {
      return `in ${diffInMinutes} minute${diffInMinutes === 1 ? "" : "s"}`;
    }
  }
};
