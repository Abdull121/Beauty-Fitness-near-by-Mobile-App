import { addDays, addHours, format, isToday } from 'date-fns';
import * as SecureStore from 'expo-secure-store';
// No need for useEffect here, as it's a utility function, not a component.

// --- Helper Function (Remains the same) ---
function parseHourFromTimeString(timeString) {
  const [time, period] = timeString.split(' ');
  let [hours, minutes] = time.split(':').map(Number);

  if (period && period.toLowerCase() === 'pm' && hours < 12) {
    hours += 12;
  }
  if (period && period.toLowerCase() === 'am' && hours === 12) { // Midnight (12:xx AM) is 0 hours
    hours = 0;
  }
  return hours;
}
// --- End Helper Function ---

// --- Async Function to Get Business Hours ---
async function getBusinessHours(ownerId = '') {
  try {
    console.log(`Retrieving business hours for owner: ${ownerId}`);
    
    // Use owner-specific keys to prevent global settings
    const openTimeKey = `OpenTime_${ownerId}`;
    const closeTimeKey = `CloseTime_${ownerId}`;
    
    console.log(`Looking up keys: ${openTimeKey}, ${closeTimeKey}`);
    
    const storedOpenTime = await SecureStore.getItemAsync(openTimeKey);
    const storedCloseTime = await SecureStore.getItemAsync(closeTimeKey);
    
    console.log(`Times for owner ${ownerId}:`);
    console.log(`Open Time: ${storedOpenTime || 'Not set (will use default)'}`);
    console.log(`Close Time: ${storedCloseTime || 'Not set (will use default)'}`);
    
    return { storedOpenTime, storedCloseTime };
  } catch (error) {
    console.error(`Error retrieving business hours for owner ${ownerId}:`, error);
    return { storedOpenTime: null, storedCloseTime: null };
  }
}

// Helper function to convert UTC to PKT if needed (Remains the same)
const ensurePKTTime = (date) => {
  const dateStr = date.toString();
  if (dateStr.includes('GMT+0000') || dateStr.includes('UTC')) {
    console.log('Converting UTC time to PKT');
    const pktTime = new Date(date);
    pktTime.setHours(pktTime.getHours() + 5);
    return pktTime;
  }
  return date;
};

// Generate time slots for a selected date
export const generateTimeSlots = async (selectedDate, currentDateTime, ownerId = '') => {
  try {
    const { storedOpenTime, storedCloseTime } = await getBusinessHours(ownerId);
    console.log(`Stored Open Time for owner ${ownerId}:`, storedOpenTime);
    console.log(`Stored Close Time for owner ${ownerId}:`, storedCloseTime);

    // Parse both opening and closing hours from the stored time strings
    const dynamicOpeningHour = storedOpenTime ? parseHourFromTimeString(storedOpenTime) : 3; // Default to 3 AM if not found
    const dynamicClosingHour = storedCloseTime ? parseHourFromTimeString(storedCloseTime) : 24; // Default to 24 (midnight) if not found

    const now = ensurePKTTime(new Date(currentDateTime)); // Current time in PKT
    const selected = ensurePKTTime(new Date(selectedDate));

    const selectedDateOnly = new Date(selected);
    selectedDateOnly.setHours(0, 0, 0, 0); // Reset time components for date comparison

    // Dynamic opening time (based on owner settings)
    const openingTime = new Date(selectedDateOnly);
    openingTime.setHours(dynamicOpeningHour, 0, 0, 0);

    // Dynamic closing time
    const closingTime = new Date(selectedDateOnly);
    closingTime.setHours(dynamicClosingHour, 0, 0, 0);    let startTimeForSlots;

    if (isToday(selectedDateOnly)) {
      // If selected date is today:
      // 1. Check if current time is past closing time
      if (now >= closingTime) {
        console.log('No more slots available today - current time is after closing time');
        return [];
      }

      // 2. Determine potential start based on current time, rounded up
      let currentHourRoundedUp = new Date(now);
      currentHourRoundedUp.setMinutes(0);
      currentHourRoundedUp.setSeconds(0, 0);
      if (now.getMinutes() > 0 || now.getSeconds() > 0) {
        currentHourRoundedUp = addHours(currentHourRoundedUp, 1);
      }

      // 3. The actual start time for slots is the LATER of openingTime AND currentHourRoundedUp
      startTimeForSlots = currentHourRoundedUp > openingTime ? currentHourRoundedUp : openingTime;

      console.log(`Debug Today: Current Time (PKT): ${format(now, 'HH:mm')}, Rounded Up: ${format(currentHourRoundedUp, 'HH:mm')}, Dynamic Opening: ${format(openingTime, 'HH:mm')}, Final Start Time: ${format(startTimeForSlots, 'HH:mm')}`);

    } else {
      // If selected date is in the future:
      // Always start from the dynamic opening time
      startTimeForSlots = new Date(openingTime);
      console.log(`Debug Future: Start Time: ${format(startTimeForSlots, 'HH:mm')}`);
    }

    // Generate 1-hour slots
    const slots = [];
    let currentSlot = new Date(startTimeForSlots);

    // Calculate latest possible start time (1 hour before closing)
    const latestStartTime = new Date(closingTime);
    latestStartTime.setHours(latestStartTime.getHours() - 1);

    // Ensure we don't try to generate slots if the start time is already after the latest possible start time
    if (currentSlot > latestStartTime) {
        console.log('Start time is already past the latest possible slot start time.');
        return [];
    }

    while (currentSlot <= latestStartTime) {
      const slot = new Date(currentSlot);
      slots.push(slot);
      currentSlot = addHours(currentSlot, 1);
    }

    console.log(`Generated ${slots.length} time slots`);
    if (slots.length > 0) {
      console.log('First slot:', format(slots[0], 'yyyy-MM-dd hh:mm a'));
      console.log('Last slot:', format(slots[slots.length-1], 'yyyy-MM-dd hh:mm a'));
    }

    return slots;

  } catch (error) {
    console.error("Error in generateTimeSlots:", error); // Use console.error for errors
    return []; // Return empty array on error
  }
};

// Generate available dates (unchanged)
export const generateAvailableDates = (currentDateTime, daysToShow = 7) => {
  const now = ensurePKTTime(new Date(currentDateTime));
  const dates = [];
  for (let i = 0; i < daysToShow; i++) {
    const newDate = addDays(new Date(now), i);
    newDate.setHours(0, 0, 0, 0);
    dates.push(newDate);
  }
  return dates;
};

// Format time consistently (unchanged)
export const formatTime = (date) => {
  if (!(date instanceof Date)) {
    date = new Date(date);
  }
  return format(date, 'hh:mm a');
};

// Format time range (unchanged)
export const formatTimeRange = (startTime) => {
  if (!(startTime instanceof Date)) {
    startTime = new Date(startTime);
  }
  const endTime = addHours(new Date(startTime), 1);
  return `${format(startTime, 'hh:mm a')} - ${format(endTime, 'hh:mm a')}`;
};