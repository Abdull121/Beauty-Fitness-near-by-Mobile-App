import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter, useNavigation, useLocalSearchParams } from 'expo-router';
import { useEffect, useRef,useCallback, useState } from 'react';
import config from '../../Appwrite/config'; 
import auth from '../../Appwrite/auth';
import AdminProfileModal from '../../components/AdminProfileModal'; 
import { useFocusEffect } from '@react-navigation/native';
import { BackHandler } from 'react-native';


import {
  Animated,
  Dimensions,
  FlatList,
  Platform,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Alert,
} from 'react-native';

const BOOKING_STATUS = {
  PENDING: 'pending',
  CONFIRMED: 'confirm',
  CANCELLED: 'cancel',
};

export default function AdminDashboard() 
{
  const params = useLocalSearchParams();
  const router = useRouter();
  const [activeFilter, setActiveFilter] = useState('all');
  const [allBookings, setAllBookings] = useState([]);
  const [filteredBookings, setFilteredBookings] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isProfileModalVisible, setIsProfileModalVisible] = useState(false);
  const [stats, setStats] = useState({
    total: 0,
    confirmed: 0,
    pending: 0
  });
  const [adminName, setAdminName] = useState('Admin');
  const slideAnim = useRef(new Animated.Value(0)).current;

  const navigation = useNavigation();
  useFocusEffect(
  useCallback(() => {
    const onBackPress = () => {
      // Exit the app if you're on this screen
      if (Platform.OS === 'android') {
        BackHandler.exitApp();
        return true; // prevent default behavior (going back)
      }
      return false;
    };

     const subscription = BackHandler.addEventListener('hardwareBackPress', onBackPress);

  return () => {
    subscription.remove();
  };
  }, []));

  const fetchBookings = async () => {
    try {
      setLoading(true);
      const response = await config.getAllUserBookingDetails();
      if (response && response.length > 0) {
        console.log('Fetched bookings:', response);
          // Calculate stats
        const todayStats = {
          total: response.length,
          confirmed: response.filter(b => b.status === BOOKING_STATUS.CONFIRMED).length,
          pending: response.filter(b => b.status === BOOKING_STATUS.PENDING).length
        };
        
        setStats(todayStats);
        setAllBookings(response);
        setFilteredBookings(response);
      } else {
        setAllBookings([]);
        setFilteredBookings([]);
      }
    } catch (error) {
      console.error('Error fetching bookings:', error);
      Alert.alert('Error', 'Failed to load bookings');
    } finally {
      setLoading(false);
    }
  };

  //get current userName from current account
  const getCurrentUserName = async () => {  
    try {
      const account = await auth.getAccount();
      const AdminName =  account.name || 'Admin'; // Fallback to 'Admin' if name is not available
       setAdminName(AdminName);
    } catch (error) {
      console.error('Error fetching user name:', error);
      return 'Admin'; // Fallback in case of error
    }
  }

  useEffect(() => {
    Animated.timing(slideAnim, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true,
    }).start();
    
    // Call fetchBookings when component mounts
    fetchBookings();
    getCurrentUserName();

   
    if (params.updatedBookingId) {
      console.log('Detected booking update:', params);
      fetchBookings();
      
      // Clear params by navigating to the same screen without params
      // This prevents re-fetching on every render
      setTimeout(() => {
        router.setParams({});
      }, 100);
    }
  }, [navigation, params.updatedBookingId]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchBookings();
    setRefreshing(false);
  };
  const filterBookings = (status) => {
    setActiveFilter(status);
    if (status === 'all') {
      setFilteredBookings(allBookings);
    } else {
      // Convert status from display format (e.g., 'confirmed') to actual status value ('confirm')
      let filterStatus = status;
      if (status === 'confirmed') filterStatus = BOOKING_STATUS.CONFIRMED;
      if (status === 'cancelled') filterStatus = BOOKING_STATUS.CANCELLED;
      if (status === 'pending') filterStatus = BOOKING_STATUS.PENDING;
      
      const filtered = allBookings.filter(booking => booking.status === filterStatus);
      setFilteredBookings(filtered);
    }
  };
  const getStatusColor = (status) => {
    switch (status) {
      case BOOKING_STATUS.PENDING:
        return '#f1c40f'; // Yellow
      case BOOKING_STATUS.CONFIRMED:
        return '#2ecc71'; // Green
      case BOOKING_STATUS.CANCELLED:
        return '#e74c3c'; // Red
      default:
        return '#95a5a6'; // Gray
    }
  };

  const navigateToBookingDetails = (booking) => {
    // Stringify any complex objects or arrays
    const serializedBooking = {
      ...booking,
      // Add any other fields that might need special handling
    };
    
    router.push({
      pathname: `/(booking-details)/${booking.$id}`,
      params: serializedBooking
    });
  };

  const renderBookingCard = ({ item: booking, index }) => {
    const slideInStyle = {
      transform: [{
        translateX: slideAnim.interpolate({
          inputRange: [0, 1],
          outputRange: [Dimensions.get('window').width, 0]
        })
      }]
    };

    return (
      <TouchableOpacity 
        onPress={() => navigateToBookingDetails(booking)}
        activeOpacity={0.7}
      >
        <Animated.View 
          style={[
            styles.bookingCard,
            slideInStyle,
            { animationDelay: `${index * 100}ms` }
          ]}
        >
          <View style={styles.bookingHeader}>
            <View style={styles.customerInfo}>
              <Text style={styles.customerName}>{booking.customerName || 'Customer'}</Text>
              <Text style={styles.bookingId}>#{booking.$id ? booking.$id.substring(0, 8) : 'New'}</Text>
            </View>
            <View style={[
              styles.statusBadge,
              { backgroundColor: getStatusColor(booking.status || 'pending') }
            ]}>
              <Text style={styles.statusText}>
                {(booking.status || 'pending').charAt(0).toUpperCase() + 
                (booking.status || 'pending').slice(1)}
              </Text>
            </View>
          </View>

          <View style={styles.bookingDetails}>
            <View style={styles.detailRow}>
              <View style={styles.detailItem}>
                <Ionicons name="cut-outline" size={18} color="#666" />
                <Text style={styles.detailText}>{booking.serviceName || 'Service'}</Text>
              </View>
              <View style={styles.detailItem}>
                <Ionicons name="calendar-outline" size={18} color="#666" />
                <Text style={styles.detailText}>{booking.appointmentDate || 'No date'}</Text>
              </View>
            </View>

            <View style={styles.detailRow}>
              <View style={styles.detailItem}>
                <Ionicons name="time-outline" size={18} color="#666" />
                <Text style={styles.detailText}>{booking.appointmentTime || 'No time'}</Text>
              </View>
              <View style={styles.detailItem}>
                <Ionicons name="card-outline" size={18} color="#666" />
                <Text style={styles.detailText}>
                  PKR {typeof booking.price === 'number' 
                    ? booking.price.toFixed(2) 
                    : booking.price || '0.00'}
                </Text>
              </View>
            </View>
          </View>
          
          {/* Removed action buttons as requested */}
        </Animated.View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#6c3483" />
      
      <LinearGradient
        colors={['#6c3483', '#8e44ad']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          <View style={styles.headerLeft}>
            <Text style={styles.welcomeText}>Welcome Back,</Text>
            <Text style={styles.businessName}>{adminName}</Text>
          </View>
          <TouchableOpacity style={styles.profileButton}
            onPress={() => setIsProfileModalVisible(true)}
          
          >
            <Ionicons name="person-circle" size={40} color="#fff" />
          </TouchableOpacity>
        </View>

        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{stats.total}</Text>
            <Text style={styles.statLabel}>Today's{'\n'}Bookings</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{stats.confirmed}</Text>
            <Text style={styles.statLabel}>Confirmed{'\n'}Today</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{stats.pending}</Text>
            <Text style={styles.statLabel}>Pending{'\n'}Approval</Text>
          </View>
        </View>
      </LinearGradient>

      <View style={styles.content}>
        <View style={styles.filterContainer}>
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filterScrollContent}
          >
            {['all', 'pending', 'confirmed',  'cancelled'].map((filter) => (
              <TouchableOpacity
                key={filter}
                style={[
                  styles.filterButton,
                  activeFilter === filter && styles.filterButtonActive
                ]}
                onPress={() => filterBookings(filter)}
              >
                <Text style={[
                  styles.filterButtonText,
                  activeFilter === filter && styles.filterButtonTextActive
                ]}>
                  {filter.charAt(0).toUpperCase() + filter.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        <FlatList
          data={filteredBookings}
          renderItem={renderBookingCard}
          keyExtractor={(item) => item.$id || `booking-${Math.random()}`}
          contentContainerStyle={styles.bookingsList}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor="#8e44ad"
              colors={['#8e44ad']}
            />
          }
          ListEmptyComponent={() => (
            <View style={styles.emptyState}>
              <Ionicons name="calendar-outline" size={64} color="#ccc" />
              <Text style={styles.emptyStateText}>No bookings found</Text>
              <Text style={styles.emptyStateSubtext}>
                {loading ? 'Loading bookings...' : 'Pull down to refresh or try a different filter'}
              </Text>
            </View>
          )}
        />

      </View>

      <AdminProfileModal 
  visible={isProfileModalVisible}
  onClose={() => setIsProfileModalVisible(false)}
  username={adminName}
  owner="Admin"
/>
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
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  headerLeft: {
    flex: 1,
  },
  welcomeText: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 14,
    marginBottom: 4,
  },
  businessName: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
  },
  profileButton: {
    padding: 5,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 15,
    padding: 15,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statNumber: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  statLabel: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 12,
    textAlign: 'center',
  },
  statDivider: {
    width: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    marginHorizontal: 10,
  },
  content: {
    flex: 1,
    marginTop: -20,
  },
  filterContainer: {
    paddingHorizontal: 20,
    marginBottom: 10,
  },
  filterScrollContent: {
    paddingVertical: 10,
  },
  filterButton: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#fff',
    marginRight: 10,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  filterButtonActive: {
    backgroundColor: '#8e44ad',
  },
  filterButtonText: {
    color: '#666',
    fontSize: 14,
    fontWeight: '500',
  },
  filterButtonTextActive: {
    color: '#fff',
  },
  bookingsList: {
    padding: 20,
  },
  bookingCard: {
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 15,
    marginBottom: 15,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  bookingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  customerInfo: {
    flex: 1,
  },
  customerName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2d3436',
  },
  bookingId: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '500',
  },
  bookingDetails: {
    backgroundColor: '#f8f9fa',
    borderRadius: 10,
    padding: 12,
    marginBottom: 15,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  detailText: {
    marginLeft: 6,
    color: '#2d3436',
    fontSize: 14,
  },
  bookingActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 8,
    borderRadius: 8,
    marginHorizontal: 4,
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '500',
    marginLeft: 4,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  emptyStateText: {
    fontSize: 18,
    color: '#666',
    marginTop: 10,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    marginTop: 5,
  },
});