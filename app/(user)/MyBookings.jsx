import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Platform,
  RefreshControl,
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';

import config from '../../Appwrite/config'; 

export default function MyBookings() {
  const router = useRouter();
  const [bookings, setBookings] = useState([]);
  const [filteredBookings, setFilteredBookings] = useState([]);
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Apply the current filter to the bookings
  const applyFilter = useCallback((data, filter) => {
    if (filter === 'all') {
      return data;
    } else {
      // Map filter names to actual status values
      const statusMap = {
        'pending': ['pending'],
        'confirm': ['confirm'],
        'cancel': ['cancel']
      };
      
      const statusValues = statusMap[filter] || [filter];
      return data.filter(booking => 
        statusValues.includes(booking.status)
      );
    }
  }, []);

  // Fetch bookings from Appwrite
  const fetchBookings = useCallback(async () => {
    try {
      setIsLoading(true);
      
      const userBookings = await config.getUserBookingDetailsByUserId();
      if(!userBookings || userBookings.length === 0){
        console.log('No bookings found for this user.');
        setBookings([]);
        setFilteredBookings([]);
        return;
      }
      
      console.log('Fetched user bookings:', userBookings);
      setBookings(userBookings);
      
      // Apply the current filter to the new data
      const filtered = applyFilter(userBookings, selectedFilter);
      setFilteredBookings(filtered);
    } catch (error) {
      console.error('Error fetching bookings:', error);
    } finally {
      setIsLoading(false);
    }
  }, [selectedFilter, applyFilter]);

  // Initial fetch
  useEffect(() => {
    fetchBookings();
  }, [fetchBookings]);

  // Handle refresh
  const onRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await fetchBookings();
    setIsRefreshing(false);
  }, [fetchBookings]);

  // Filter bookings
  const filterBookings = (filter) => {
    setSelectedFilter(filter);
    const filtered = applyFilter(bookings, filter);
    setFilteredBookings(filtered);
  };

  // Format date to more readable format
  const formatDate = (dateString) => {
    if (!dateString) return 'No date';
    
    try {
      const options = { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' };
      return new Date(dateString).toLocaleDateString('en-US', options);
    } catch (error) {
      return dateString; // Return the original if parsing fails
    }
  };

  // Render booking card
  const renderBookingCard = ({ item }) => {
    // Determine status color and icon
    let statusColor = '#8e44ad'; // default purple
    let statusIcon = 'calendar-outline';
    
    if (item.status === 'confirm') {
      statusColor = '#2ecc71'; // green
      statusIcon = 'checkmark-circle-outline';
    } else if (item.status === 'cancel') {
      statusColor = '#e74c3c'; // red
      statusIcon = 'close-circle-outline';
    } else if (item.status === 'pending') {
      statusColor = '#3498db'; // blue
      statusIcon = 'time-outline';
    }
    
    return (
      <TouchableOpacity 
        style={styles.bookingCard}
        onPress={() => {
          // In a real app, navigate to booking details
          console.log('View booking details for:', item.$id);
        }}
      >
        <View style={styles.bookingHeader}>
          {/* Placeholder for missing image */}
          <View style={[styles.businessImage, {backgroundColor: '#eaeaea', justifyContent: 'center', alignItems: 'center'}]}>
            <Ionicons name="business-outline" size={24} color="#999" />
          </View>
          <View style={styles.bookingInfo}>
            <Text style={styles.businessName}>{item.businessName || 'Business Name'}</Text>
            <Text style={styles.businessType}>{item.serviceName || 'Service'}</Text>
            <View style={[styles.statusBadge, { backgroundColor: statusColor }]}>
              <Ionicons name={statusIcon} size={12} color="#fff" />
              <Text style={styles.statusText}>
                {item.status ? item.status.charAt(0).toUpperCase() + item.status.slice(1) : 'Unknown'}
              </Text>
            </View>
          </View>
        </View>
        
        <View style={styles.bookingDetails}>
          <View style={styles.detailItem}>
            <Ionicons name="calendar-outline" size={16} color="#666" />
            <Text style={styles.detailText}>{item.appointmentDate ? formatDate(item.appointmentDate) : 'No date'}</Text>
          </View>
          <View style={styles.detailItem}>
            <Ionicons name="time-outline" size={16} color="#666" />
            <Text style={styles.detailText}>{item.appointmentTime || 'No time'}</Text>
          </View>
          <View style={styles.detailItem}>
            <Ionicons name="cut-outline" size={16} color="#666" />
            <Text style={styles.detailText}>{item.serviceName || 'No service'}</Text>
          </View>
          <View style={styles.detailItem}>
            <Ionicons name="cash-outline" size={16} color="#666" />
            <Text style={styles.detailText}>Rs. {item.price || '0'}</Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  // Render filter tabs
  const renderFilterTabs = () => (
    <View style={styles.filterTabs}>
      <TouchableOpacity 
        style={[
          styles.filterTab, 
          selectedFilter === 'all' && styles.activeFilterTab
        ]}
        onPress={() => filterBookings('all')}
      >
        <Text style={[
          styles.filterTabText,
          selectedFilter === 'all' && styles.activeFilterTabText
        ]}>All</Text>
      </TouchableOpacity>
      <TouchableOpacity 
        style={[
          styles.filterTab, 
          selectedFilter === 'pending' && styles.activeFilterTab
        ]}
        onPress={() => filterBookings('pending')}
      >
        <Text style={[
          styles.filterTabText,
          selectedFilter === 'pending' && styles.activeFilterTabText
        ]}>Pending</Text>
      </TouchableOpacity>
      <TouchableOpacity 
        style={[
          styles.filterTab, 
          selectedFilter === 'confirm' && styles.activeFilterTab
        ]}
        onPress={() => filterBookings('confirm')}
      >
        <Text style={[
          styles.filterTabText,
          selectedFilter === 'confirm' && styles.activeFilterTabText
        ]}>Confirmed</Text>
      </TouchableOpacity>
      <TouchableOpacity 
        style={[
          styles.filterTab, 
          selectedFilter === 'cancel' && styles.activeFilterTab
        ]}
        onPress={() => filterBookings('cancel')}
      >
        <Text style={[
          styles.filterTabText,
          selectedFilter === 'cancel' && styles.activeFilterTabText
        ]}>Cancelled</Text>
      </TouchableOpacity>
    </View>
  );

  // Render empty state
  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Ionicons name="calendar-outline" size={64} color="#ccc" />
      <Text style={styles.emptyStateTitle}>No Bookings Found</Text>
      <Text style={styles.emptyStateText}>
        You don't have any {selectedFilter !== 'all' ? selectedFilter : ''} bookings yet.
      </Text>
      <TouchableOpacity 
        style={styles.bookNowButton}
        onPress={() => router.back()}
      >
        <Text style={styles.bookNowButtonText}>Book Now</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
      <LinearGradient
        colors={['#6c3483', '#8e44ad']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>My Bookings</Text>
          <View style={{ width: 40 }} />
        </View>
      </LinearGradient>
      
      <View style={styles.content}>
        {renderFilterTabs()}
        
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#8e44ad" />
            <Text style={styles.loadingText}>Loading your bookings...</Text>
          </View>
        ) : (
          <FlatList
            data={filteredBookings}
            renderItem={renderBookingCard}
            keyExtractor={item => item.$id || String(Math.random())}
            contentContainerStyle={[
              styles.bookingsList,
              filteredBookings.length === 0 && styles.emptyList
            ]}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={renderEmptyState}
            refreshControl={
              <RefreshControl
                refreshing={isRefreshing}
                onRefresh={onRefresh}
                colors={['#8e44ad']}
                tintColor="#8e44ad"
              />
            }
          />
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f6fa',
  },
  header: {
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight + 15 : 15,
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  content: {
    flex: 1,
    marginTop: -20,
    backgroundColor: '#f5f6fa',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    overflow: 'hidden',
  },
  filterTabs: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    paddingVertical: 15,
    paddingHorizontal: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  filterTab: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    marginHorizontal: 2,
    borderRadius: 20,
  },
  activeFilterTab: {
    backgroundColor: 'rgba(142, 68, 173, 0.1)',
  },
  filterTabText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  activeFilterTabText: {
    color: '#8e44ad',
    fontWeight: 'bold',
  },
  bookingsList: {
    padding: 20,
  },
  emptyList: {
    flex: 1,
    justifyContent: 'center',
  },
  bookingCard: {
    backgroundColor: '#fff',
    borderRadius: 15,
    marginBottom: 20,
    overflow: 'hidden',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  bookingHeader: {
    flexDirection: 'row',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  businessImage: {
    width: 60,
    height: 60,
    borderRadius: 10,
  },
  bookingInfo: {
    marginLeft: 15,
    flex: 1,
  },
  businessName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2d3436',
  },
  businessType: {
    fontSize: 14,
    color: '#666',
    marginBottom: 6,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  statusText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '500',
    marginLeft: 4,
  },
  bookingDetails: {
    padding: 15,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  detailText: {
    marginLeft: 10,
    fontSize: 14,
    color: '#666',
  },
  // Loading state
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: 50,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  // Empty state
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2d3436',
    marginTop: 10,
    marginBottom: 5,
  },
  emptyStateText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
  },
  bookNowButton: {
    backgroundColor: '#8e44ad',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 25,
  },
  bookNowButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
  },
});