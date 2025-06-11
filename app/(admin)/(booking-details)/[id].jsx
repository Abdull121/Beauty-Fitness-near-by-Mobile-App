import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useNavigation, useRouter } from 'expo-router';
import { useEffect, useLayoutEffect, useState } from 'react';
import {
  Alert,
  Platform,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

 

import config from '../../../Appwrite/config'; 

// Define the same booking status constants as in AdminDashboard
const BOOKING_STATUS = {
  PENDING: 'pending',
  CONFIRMED: 'confirm',
  CANCELLED: 'cancel',
};

// Function to get the color for a status
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



export default function BookingDetails() {


  const navigation = useNavigation();
  const params = useLocalSearchParams();

  const router = useRouter();
  
  const [booking, setBooking] = useState(null);
  


  useLayoutEffect(() => {
    navigation.setOptions({
      headerShown: false,
      animation: 'slide_from_right'
    });
  }, [navigation]);

   const id = params.id || params.$id;

   useEffect(() => {

    if (params && Object.keys(params).length > 0) {
      console.log("Received params:", params);
      setBooking(params)}
  }, []);

  const handleAction =  async (action) => {
    Alert.alert(
      'Confirm Action',
      `Are you sure you want to ${action} this booking?`,
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Yes',          onPress: async () => {
            // Implement the action logic here

            const updateStatus = await config.updateBookingStatus(booking.$id, action);
            if (!updateStatus) {
              Alert.alert('Error', 'Failed to update booking status');
              return;
            }

            console.log(`Booking ${action}ed:`, id);
            Alert.alert('Success', `Booking has been ${action}ed successfully`);
            
            // Navigate back to dashboard with params to trigger refresh
            router.replace({
              pathname: '/AdminDashboard',
              params: {
                updatedBookingId: booking.$id,
                newStatus: action,
                timestamp: new Date().getTime()
              }
            });
          },
        },
      ]
    );
  };

  if (!booking) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingState}>
          <Text>Loading booking details...</Text>
        </View>
      </SafeAreaView>
    );
  }

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
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Booking Details</Text>
          <View style={styles.headerRight} />
        </View>
      </LinearGradient>

      <ScrollView style={styles.content}>
        <View style={styles.card}>
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Booking Information</Text>
            <View style={styles.sectionContent}>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Booking ID</Text>
                <Text style={styles.infoValue}>#{booking.$id || booking.id || 'New'}</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Service</Text>
                <Text style={styles.infoValue}>{booking.serviceName }</Text>
              </View>
              <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Amount</Text>
              <Text style={styles.infoValue}>
                {` Rs. ${booking.price}`}
              </Text>
            </View>
              
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Customer Details</Text>
            <View style={styles.sectionContent}>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Name</Text>
                <Text style={styles.infoValue}>{booking.customerName}</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Phone</Text>
                <TouchableOpacity>
                  <Text style={[styles.infoValue, styles.link]}>{booking.customerPhone}</Text>
                </TouchableOpacity>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Email</Text>
                <TouchableOpacity>
                  <Text style={[styles.infoValue, styles.link]}>{booking.customerEmail}</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Appointment Details</Text>
            <View style={styles.sectionContent}>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Date & Time</Text>
            <Text style={styles.infoValue}>
              {booking.appointmentDate 
                ? `${booking.appointmentDate} ${booking.appointmentTime}` 
                : (booking.dateTime ? new Date(booking.dateTime).toLocaleString() : 'Not set')}
            </Text>
        </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Booked On</Text>
                <Text style={styles.infoValue}>
                  {booking.appointmentDate}
                </Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Status</Text>
                <View style={[
                  styles.statusBadge,
                  { backgroundColor: getStatusColor(booking.status) }
                ]}>
                  <Text style={styles.statusText}>
                    {booking.status ? booking.status.charAt(0).toUpperCase() + booking.status.slice(1) : 'Unknown'}
                  </Text>
                </View>
              </View>
            </View>
          </View>

          {booking.notes && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Notes</Text>
              <View style={styles.sectionContent}>
                <Text style={styles.notes}>{booking.notes}</Text>
              </View>
            </View>
          )}
        </View>
      </ScrollView>

      <View style={styles.actionButtons}>
        {booking.status === 'pending' && (
          <>
            <TouchableOpacity 
              style={[styles.actionButton, { backgroundColor: '#2ecc71' }]}
              onPress={() => handleAction('confirm')}
            >
              <Text style={styles.actionButtonText}>Confirm</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.actionButton, { backgroundColor: '#e74c3c' }]}
              onPress={() => handleAction('cancel')}
            >
              <Text style={styles.actionButtonText}>Cancel</Text>
            </TouchableOpacity>
          </>
        )}
        {/* {booking.status === 'confirmed' && (
          <TouchableOpacity 
            style={[styles.actionButton, { backgroundColor: '#3498db' }]}
            onPress={() => handleAction('complete')}
          >
            <Text style={styles.actionButtonText}>Complete</Text>
          </TouchableOpacity>
        )} */}
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
    paddingBottom: 15,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  headerRight: {
    width: 40,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 10,
    
    
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 20,
    marginBottom: 20,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  section: {
    marginBottom: 25,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2d3436',
    marginBottom: 12,
  },
  sectionContent: {
    backgroundColor: '#f8f9fa',
    borderRadius: 10,
    padding: 15,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  infoLabel: {
    color: '#666',
    fontSize: 14,
  },
  infoValue: {
    color: '#2d3436',
    fontSize: 14,
    fontWeight: '500',
  },
  link: {
    color: '#3498db',
    textDecorationLine: 'underline',
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
  notes: {
    color: '#2d3436',
    fontSize: 14,
    lineHeight: 20,
  },
  actionButtons: {
    flexDirection: 'row',
    padding: 20,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#eee',
    marginBottom: 0,
    paddingBottom:50,
  },
  actionButton: {
    flex: 1,
    height: 45,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 5,
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  loadingState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});