import { format, isSameDay, isToday } from 'date-fns';
import {
    FlatList,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

export const DateSelector = ({ dates, selectedDate, onSelectDate }) => {
  const renderDateItem = ({ item }) => {
    const isSelected = isSameDay(selectedDate, item);
    const isCurrentDay = isToday(item);

    return (
      <TouchableOpacity
        style={[
          styles.dateCard,
          isSelected && styles.dateCardSelected
        ]}
        onPress={() => onSelectDate(item)}
      >
        <Text style={[
          styles.weekday,
          isSelected && styles.textSelected
        ]}>
          {format(item, 'EEE')}
        </Text>
        <Text style={[
          styles.day,
          isSelected && styles.textSelected,
          isCurrentDay && styles.currentDay
        ]}>
          {format(item, 'd')}
        </Text>
        <Text style={[
          styles.month,
          isSelected && styles.textSelected
        ]}>
          {format(item, 'MMM')}
        </Text>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.dateContainer}>
      <Text style={styles.sectionTitle}>Select Date</Text>
      <FlatList
        horizontal
        showsHorizontalScrollIndicator={false}
        data={dates}
        renderItem={renderDateItem}
        keyExtractor={(item) => item.toISOString()}
        contentContainerStyle={styles.dateList}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  dateContainer: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2d3436',
    marginBottom: 10,
    paddingHorizontal: 5,
  },
  dateList: {
    paddingHorizontal: 5,
  },
  dateCard: {
    width: 70,
    padding: 10,
    borderRadius: 12,
    backgroundColor: '#f0f2f5',
    marginRight: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#eee',
  },
  dateCardSelected: {
    backgroundColor: '#8e44ad',
    borderColor: '#8e44ad',
  },
  weekday: {
    fontSize: 13,
    color: '#666',
    marginBottom: 5,
  },
  day: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2d3436',
    marginBottom: 2,
  },
  currentDay: {
    color: '#8e44ad',
  },
  month: {
    fontSize: 13,
    color: '#666',
  },
  textSelected: {
    color: '#fff',
  },
}); 