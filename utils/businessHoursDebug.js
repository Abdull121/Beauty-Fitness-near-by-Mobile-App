// businessHoursDebug.js - Utility for debugging business hours storage/retrieval
import * as SecureStore from 'expo-secure-store';

/**
 * Debug utility to list all stored business hours by owner ID
 * @param {string[]} ownerIds - Array of owner IDs to check
 * @returns {Promise<Object>} - Object mapping owner IDs to their business hours
 */
export const debugListBusinessHours = async (ownerIds = ['hairby56738']) => {
  try {
    const results = {};
    
    for (const ownerId of ownerIds) {
      const openTimeKey = `OpenTime_${ownerId}`;
      const closeTimeKey = `CloseTime_${ownerId}`;
      
      const openTime = await SecureStore.getItemAsync(openTimeKey);
      const closeTime = await SecureStore.getItemAsync(closeTimeKey);
      
      results[ownerId] = {
        openTime: openTime || 'Not set',
        closeTime: closeTime || 'Not set'
      };
    }
    
    console.log('=== DEBUG: ALL BUSINESS HOURS ===');
    console.log(JSON.stringify(results, null, 2));
    
    return results;
  } catch (error) {
    console.error('Error debugging business hours:', error);
    return {};
  }
};

/**
 * Debug utility to set test business hours for multiple owners
 * @param {Object} ownerHours - Object mapping owner IDs to their business hours
 * @returns {Promise<boolean>} - Success status
 */
export const debugSetBusinessHours = async (ownerHours = {
  'hairby56738': { openTime: '9:00 AM', closeTime: '5:00 PM' },
  'testowner123': { openTime: '10:00 AM', closeTime: '8:00 PM' }
}) => {
  try {
    for (const [ownerId, hours] of Object.entries(ownerHours)) {
      const openTimeKey = `OpenTime_${ownerId}`;
      const closeTimeKey = `CloseTime_${ownerId}`;
      
      await SecureStore.setItemAsync(openTimeKey, hours.openTime);
      await SecureStore.setItemAsync(closeTimeKey, hours.closeTime);
      
      console.log(`Set hours for ${ownerId}: ${hours.openTime} - ${hours.closeTime}`);
    }
    
    return true;
  } catch (error) {
    console.error('Error setting test business hours:', error);
    return false;
  }
};

/**
 * Clear all business hours for testing
 * @param {string[]} ownerIds - Array of owner IDs to clear
 * @returns {Promise<boolean>} - Success status
 */
export const debugClearBusinessHours = async (ownerIds = ['hairby56738', 'testowner123']) => {
  try {
    for (const ownerId of ownerIds) {
      const openTimeKey = `OpenTime_${ownerId}`;
      const closeTimeKey = `CloseTime_${ownerId}`;
      
      await SecureStore.deleteItemAsync(openTimeKey);
      await SecureStore.deleteItemAsync(closeTimeKey);
      
      console.log(`Cleared hours for ${ownerId}`);
    }
    
    return true;
  } catch (error) {
    console.error('Error clearing business hours:', error);
    return false;
  }
};
