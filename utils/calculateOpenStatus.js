// utils/openStatus.js
export const calculateOpenStatus = (openTime, closeTime) => {
  if (!openTime || !closeTime) return false;
  
  const now = new Date();
  const [openHours, openMinutes] = openTime.split(':').map(Number);
  const [closeHours, closeMinutes] = closeTime.split(':').map(Number);

  const openDate = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
    openHours,
    openMinutes
  );

  const closeDate = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
    closeHours,
    closeMinutes
  );

  // Handle overnight hours (e.g., 22:00 to 06:00)
  if (closeDate < openDate) {
    return now >= openDate || now <= closeDate;
  }

  return now >= openDate && now <= closeDate;
};