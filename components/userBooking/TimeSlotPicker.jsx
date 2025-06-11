import { format } from 'date-fns';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import React, { useEffect } from 'react';
import { formatTimeRange } from '../../utils/timeUtils';

const TimeSlotPicker = ({ timeSlots, selectedSlot, onSelectSlot }) => {  //Debug log when component receives new time slots
  useEffect(() => {
    console.log(`TimeSlotPicker received ${timeSlots.length} slots`);
    if (timeSlots.length > 0) {
      console.log('Time slots range:');
      console.log('  First slot:', format(timeSlots[0], 'yyyy-MM-dd hh:mm a'));
      console.log('  Last slot:', format(timeSlots[timeSlots.length-1], 'yyyy-MM-dd hh:mm a'));
    }

    console.log("Full time slots array:", timeSlots.map(slot => format(slot, 'yyyy-MM-dd hh:mm a')));
  }, [timeSlots]);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Select Time</Text>
      
      {/* Debug information */}
      <Text style={styles.debugText}>
        Available slots: {timeSlots.length}
      </Text>
      
      {/* Show a message if time slots array is empty */}
      {timeSlots.length === 0 && (
        <Text style={styles.noSlotsText}>No available time slots for this date</Text>
      )}
      
      {/* Only render the ScrollView if there are time slots */}
      {timeSlots.length > 0 && (
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          style={styles.timeSlotsContainer}
        >
          {timeSlots.map((slot, index) => {
            const isSelected = selectedSlot && selectedSlot.getTime() === slot.getTime();
            
            return (
              <TouchableOpacity
                key={index}
                style={[
                  styles.timeSlot,
                  isSelected && styles.timeSlotSelected
                ]}
                onPress={() => {
                  console.log(`Selected slot: ${format(slot, 'yyyy-MM-dd hh:mm a')}`);
                  onSelectSlot(slot);
                }}
              >
                <Text style={[
                  styles.timeSlotText,
                  isSelected && styles.timeSlotTextSelected
                ]}>
                  {formatTimeRange(slot)}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 15,
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2d3436',
    marginBottom: 5,
  },
  debugText: {
    fontSize: 12,
    color: '#aaa',
    marginBottom: 5,
  },
  timeSlotsContainer: {
    flexGrow: 0,
  },
  timeSlot: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: '#f0f2f5',
    marginRight: 10,
    borderWidth: 1,
    borderColor: '#eee',
  },
  timeSlotSelected: {
    backgroundColor: '#8e44ad',
    borderColor: '#8e44ad',
  },
  timeSlotText: {
    fontSize: 14,
    color: '#666',
  },
  timeSlotTextSelected: {
    color: '#fff',
    fontWeight: '500',
  },
  noSlotsText: {
    fontSize: 14,
    color: '#666',
    fontStyle: 'italic',
    marginBottom: 10,
  }
});

export default TimeSlotPicker;