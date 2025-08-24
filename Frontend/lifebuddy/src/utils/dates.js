/**
 * Calculate days since a given date
 * @param {Date} date - The start date
 * @returns {number} - Number of days since the given date
 */
export const daysSince = (date) => {
  const now = new Date();
  const diffTime = Math.abs(now - date);
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
};
