import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import * as SecureStore from 'expo-secure-store';

/**
 * A component to debug and test business hours for different owners
 */
const BusinessHoursDebugger = () => {
  const [businessHours, setBusinessHours] = useState({});
  const [loading, setLoading] = useState(false);
  
  // Test owner IDs
  const testOwnerIds = ['hairby56738', 'testowner123', 'gymowner456'];
  
  // Test business hours data
  const testData = {
    'hairby56738': { openTime: '9:00 AM', closeTime: '5:00 PM' },
    'testowner123': { openTime: '10:00 AM', closeTime: '8:00 PM' },
    'gymowner456': { openTime: '6:00 AM', closeTime: '10:00 PM' },
  };
  
  // Load all business hours on mount
  useEffect(() => {
    loadAllBusinessHours();
  }, []);
  
  // Function to load all business hours
  const loadAllBusinessHours = async () => {
    try {
      setLoading(true);
      const results = {};
      
      for (const ownerId of testOwnerIds) {
        const openTimeKey = `OpenTime_${ownerId}`;
        const closeTimeKey = `CloseTime_${ownerId}`;
        
        const openTime = await SecureStore.getItemAsync(openTimeKey);
        const closeTime = await SecureStore.getItemAsync(closeTimeKey);
        
        results[ownerId] = {
          openTime: openTime || 'Not set',
          closeTime: closeTime || 'Not set'
        };
      }
      
      setBusinessHours(results);
      console.log('Loaded business hours:', results);
    } catch (error) {
      console.error('Error loading business hours:', error);
    } finally {
      setLoading(false);
    }
  };
  
  // Function to set test data
  const setTestData = async () => {
    try {
      setLoading(true);
      
      for (const [ownerId, hours] of Object.entries(testData)) {
        const openTimeKey = `OpenTime_${ownerId}`;
        const closeTimeKey = `CloseTime_${ownerId}`;
        
        await SecureStore.setItemAsync(openTimeKey, hours.openTime);
        await SecureStore.setItemAsync(closeTimeKey, hours.closeTime);
      }
      
      // Reload data to confirm changes
      await loadAllBusinessHours();
    } catch (error) {
      console.error('Error setting test data:', error);
    } finally {
      setLoading(false);
    }
  };
  
  // Function to clear all data
  const clearAllData = async () => {
    try {
      setLoading(true);
      
      for (const ownerId of testOwnerIds) {
        const openTimeKey = `OpenTime_${ownerId}`;
        const closeTimeKey = `CloseTime_${ownerId}`;
        
        await SecureStore.deleteItemAsync(openTimeKey);
        await SecureStore.deleteItemAsync(closeTimeKey);
      }
      
      // Reload data to confirm changes
      await loadAllBusinessHours();
    } catch (error) {
      console.error('Error clearing data:', error);
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Business Hours Debugger</Text>
      
      <View style={styles.buttonRow}>
        <TouchableOpacity 
          style={styles.button} 
          onPress={loadAllBusinessHours}
          disabled={loading}
        >
          <Text style={styles.buttonText}>Refresh</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.button, styles.buttonPrimary]} 
          onPress={setTestData}
          disabled={loading}
        >
          <Text style={[styles.buttonText, styles.buttonTextPrimary]}>Set Test Data</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.button, styles.buttonDanger]} 
          onPress={clearAllData}
          disabled={loading}
        >
          <Text style={[styles.buttonText, styles.buttonTextDanger]}>Clear All</Text>
        </TouchableOpacity>
      </View>
      
      {loading ? (
        <Text style={styles.loadingText}>Loading...</Text>
      ) : (
        <ScrollView style={styles.dataContainer}>
          {Object.entries(businessHours).map(([ownerId, hours]) => (
            <View key={ownerId} style={styles.ownerCard}>
              <Text style={styles.ownerTitle}>Owner ID: {ownerId}</Text>
              <View style={styles.hoursRow}>
                <Text style={styles.hoursLabel}>Open Time:</Text>
                <Text style={styles.hoursValue}>{hours.openTime}</Text>
              </View>
              <View style={styles.hoursRow}>
                <Text style={styles.hoursLabel}>Close Time:</Text>
                <Text style={styles.hoursValue}>{hours.closeTime}</Text>
              </View>
            </View>
          ))}
        </ScrollView>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    marginVertical: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#333',
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  button: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 4,
    backgroundColor: '#eee',
    minWidth: 80,
    alignItems: 'center',
  },
  buttonPrimary: {
    backgroundColor: '#8e44ad',
  },
  buttonDanger: {
    backgroundColor: '#f5f5f5',
    borderWidth: 1,
    borderColor: '#ff4757',
  },
  buttonText: {
    color: '#333',
    fontSize: 14,
  },
  buttonTextPrimary: {
    color: '#fff',
  },
  buttonTextDanger: {
    color: '#ff4757',
  },
  loadingText: {
    textAlign: 'center',
    color: '#666',
    marginVertical: 16,
  },
  dataContainer: {
    maxHeight: 300,
  },
  ownerCard: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  ownerTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#333',
  },
  hoursRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 4,
  },
  hoursLabel: {
    color: '#666',
    fontSize: 14,
  },
  hoursValue: {
    fontWeight: '500',
    color: '#333',
    fontSize: 14,
  },
});

export default BusinessHoursDebugger;
