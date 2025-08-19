import { Ionicons } from '@expo/vector-icons';
import { format } from 'date-fns';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { generateAvailableDates, generateTimeSlots } from '../../utils/timeUtils';
import ServiceDetails from './ServiceDetails';
import TimeSlotPicker from './TimeSlotPicker';
import UserDetailsForm from './UserDetailsForm';
import  config from '../../Appwrite/config';
import { sendEmail } from '../../services/emailservices';

// Helper function to convert UTC to PKT (UTC+5)  
const convertUTCtoPKT = (utcTime) => {
  const pktTime = new Date(utcTime);
  pktTime.setHours(pktTime.getHours() + 5);
  return pktTime;
};

const BookingModal = ({ 
  visible, 
  onClose, 
  selectedService,
  currentUser = '', // Default to empty string if no user
  userId = '',
  businessId,
  businessOwnerId= '',
   businessName,
   adminEmail = '',
}) => {
  
  useEffect(() => {
    console.log(`BookingModal using owner ID: ${businessOwnerId}`);
    console.log(`Business ID: ${businessId}`);
  }, [
businessOwnerId
]);

  // Get the current date and time
  // For your app, the issue is that it's logging in UTC but operating in PKT
  // So we need to convert UTC to PKT (UTC+5)
  const [now, setNow] = useState(() => {
    // Get current device time
    const deviceTime = new Date();
    console.log('Device time (raw):', deviceTime.toString());
    
    // Check if this looks like UTC time (based on your logs)
    const isUTC = deviceTime.toString().includes('GMT+0000');
    
    // If it's UTC, convert to PKT
    if (isUTC) {
      console.log('Converting UTC time to PKT (UTC+5)');
      return convertUTCtoPKT(deviceTime);
    }
    
    return deviceTime;
  });
  
  const [availableDates] = useState(() => 
    generateAvailableDates(now)
  );
  const [selectedDate, setSelectedDate] = useState(now);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [timeSlots, setTimeSlots] = useState([]);
  const [formData, setFormData] = useState({
    name: currentUser || '',
    email: '',
    phone: ''
  });
  const [loading, setLoading] = useState(false);  // Update time slots only when selectedDate changes
  
  useEffect(() => {
    async function fetchTimeSlots() {
      try {
        // Pass the businessOwnerId
 // to the time slot generation function
        const slots = await generateTimeSlots(selectedDate, now, businessId,);
        console.log(`Generated time slots for owner ${businessId}:`, slots.length);
        setTimeSlots(slots);
        
        // Reset selected slot when date changes if it's no longer available
        if (selectedSlot && !slots.some(slot => slot.getTime() === selectedSlot.getTime())) {
          setSelectedSlot(null);
        }
      } catch (error) {
        console.log('Error fetching time slots:', error);
        setTimeSlots([]);
      }
    }
    
    fetchTimeSlots();
  }, [selectedDate, now, businessId, selectedSlot]);

  const handleChangeForm = (field, value) => {
    setFormData(prev => ({...prev, [field]: value}));
  };

  const validateForm = () => {
    if (!selectedSlot) {
      Alert.alert('Error', 'Please select a time slot');
      return false;
    }
    if (!formData.name.trim()) {
      Alert.alert('Error', 'Please enter your name');
      return false;
    }
    if (!formData.email.trim()) {
      Alert.alert('Error', 'Please enter your email');
      return false;
    }
    if (!formData.phone.trim()) {
      Alert.alert('Error', 'Please enter your phone number');
      return false;
    }
    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setLoading(true);
    try {
      // Log all current state
      console.log('FORM SUBMISSION:');
      console.log('Current time (PKT):', format(now, 'yyyy-MM-dd hh:mm:ss a'));
      console.log('Selected date:', format(selectedDate, 'yyyy-MM-dd'));
      console.log('Selected slot:', selectedSlot ? format(selectedSlot, 'yyyy-MM-dd hh:mm:ss a') : 'None');
      
      // Ensure the selected slot has the correct date
      const appointmentDateTime = new Date(selectedSlot);
      
      // Log before date correction
      console.log('Initial appointment date/time:', format(appointmentDateTime, 'yyyy-MM-dd hh:mm:ss a'));
      
      // Set the date part from the selected date
      appointmentDateTime.setFullYear(selectedDate.getFullYear());
      appointmentDateTime.setMonth(selectedDate.getMonth());
      appointmentDateTime.setDate(selectedDate.getDate());
      
      // Log after date correction
      console.log('Corrected appointment date/time:', format(appointmentDateTime, 'yyyy-MM-dd hh:mm:ss a'));
      
      // Format dates for appointment data
      const appointmentDate = format(appointmentDateTime, 'yyyy-MM-dd');
      const appointmentTime = format(appointmentDateTime, 'hh:mm:ss a'); // 12-hour format
      const fullDateTime = format(appointmentDateTime, 'yyyy-MM-dd hh:mm:ss a'); // 12-hour format
      const bookingCreated = format(now, 'yyyy-MM-dd hh:mm:ss a'); // 12-hour format
      
      // Create appointment data object with correct date formatting
      const appointmentData = {
        service: {
          serviceId: selectedService.id,
          userId,
          businessOwnerId,
          businessId,
          name: selectedService.name,
          price: selectedService.price,
          
        },
        appointmentDate,
        appointmentTime,
        fullDateTime,
        customer: {
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
        },
        bookingCreated,
        status: 'pending',
        name: businessName
      };
      console.log('sendUserBooking:', appointmentData);


      const sendUserBooking = await config.userBooking({
    serviceId:appointmentData.service.serviceId.toString(), 
    userId: appointmentData.service.userId,
    businessOwnerId,
    businessId: appointmentData.service.businessId,
    serviceName: appointmentData.service.name,
    servicePrice: appointmentData.service.price,
    appointmentDate:appointmentData.appointmentDate,
    appointmentTime:appointmentData.appointmentTime,
    customerName:appointmentData.customer.name,
    customerEmail:appointmentData.customer.email,
    customerPhone: appointmentData.customer.phone,
    status: appointmentData.status,
    businessName: appointmentData.name

      })
      console.log('sendUserBooking:', sendUserBooking);

      if (sendUserBooking) {

         // Debug logs
      console.log('=== APPOINTMENT SUBMISSION DATA ===');
      console.log('New Appointment Data:', JSON.stringify(sendUserBooking, null, 2));
      // Log success message
      console.log('Appointment booked successfully!');
      
      Alert.alert(
        'Success',
        'Your appointment has been booked successfully!',
        [{ 
          text: 'OK', 
          onPress: () => {
            console.log('Modal closed after successful booking');
            onClose();
          }
        }]
      );
        
         }
         else{

          Alert.alert(
        'Faild',
        'Your appointment is not Book Try agin!',
        [{ 
          text: 'OK', 
          onPress: () => {
            console.log('Modal closed after successful booking');
            onClose();
          }
        }]
      );

         }

      // Send email notification
const emailPayload = {
  role: 'admin',
  name: formData.name,
  email: adminEmail,
};

try {
  const sendEmailResponse = await sendEmail(emailPayload);
  console.log('Email send response:', sendEmailResponse);
  
  if (sendEmailResponse.success) {
    console.log('Email sent successfully');
   
  } else {
    console.log('Failed to send email:', sendEmailResponse.message);
    // Alert.alert('Error', sendEmailResponse.message || 'Failed to send email notification');
  }
} catch (error) {
  console.log('Email error:', error);
  // Alert.alert('Error', error.message || 'Failed to send email');
}
      
     
      
    } catch (error) {
      // Log error
      console.log('Booking Error:', error);
     
    } finally {
      setLoading(false);
    }
  };

  // Render date buttons as a separate component to ensure proper text wrapping
  const renderDateButton = (date) => {
    const isSelected = format(selectedDate, 'yyyy-MM-dd') === format(date, 'yyyy-MM-dd');
    return (
      <TouchableOpacity
        key={date.toString()}
        style={[
          styles.dateButton,
          isSelected && styles.selectedDateButton
        ]}
        onPress={() => setSelectedDate(date)}
      >
        <Text style={[styles.dateButtonText, isSelected && styles.selectedDateButtonText]}>
          {format(date, 'EEE')}
        </Text>
        <Text style={[styles.dateButtonDay, isSelected && styles.selectedDateButtonText]}>
          {format(date, 'd')}
        </Text>
      </TouchableOpacity>
    );
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <ScrollView showsVerticalScrollIndicator={false}>
            {/* Header */}
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Book Appointment</Text>
              <TouchableOpacity 
                onPress={onClose}
                style={styles.modalCloseButton}
              >
                <Ionicons name="close" size={24} color="#333" />
              </TouchableOpacity>
            </View>

            <ServiceDetails service={selectedService} />

            {/* Current Date Display */}
            <View style={styles.dateDisplay}>
              <Text style={styles.dateTitle}>Appointment Date</Text>
              <Text style={styles.currentDateText}>
                Current time: {format(now, 'EEEE, MMMM d, yyyy hh:mm a')}
              </Text>
            </View>

            {/* Date Picker - Fix for text strings in ScrollView */}
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false}
              style={styles.datesScrollView}
              contentContainerStyle={styles.datesScrollViewContent}
            >
              <View style={styles.datesContainer}>
                {availableDates.map((date) => renderDateButton(date))}
              </View>
            </ScrollView>
            
            <TimeSlotPicker
              timeSlots={timeSlots}
              selectedSlot={selectedSlot}
              onSelectSlot={setSelectedSlot}
            />

            {/* Debug information for business hours */}
            {/* <View style={styles.debugContainer}>
              <Text style={styles.debugLabel}>Owner ID: {
businessOwnerId
}</Text>
              <Text style={styles.debugLabel}>Time slots generated: {timeSlots.length}</Text>
            </View> */}

            <UserDetailsForm
              formData={formData}
              onChangeForm={handleChangeForm}
            />

            <TouchableOpacity
              style={[
                styles.confirmButton,
                loading && styles.confirmButtonDisabled
              ]}
              onPress={handleSubmit}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.confirmButtonText}>
                  Confirm Booking
                </Text>
              )}
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  dateDisplay: {
    marginTop: 10,
  },
  dateTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2d3436',
  },
  currentDateText: {
    fontSize: 14,
    color: '#666',
    marginTop: 5,
  },
  datesScrollView: {
    marginVertical: 10,
  },
  datesScrollViewContent: {
    paddingHorizontal: 5,
  },
  datesContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dateButton: {
    padding: 10,
    borderRadius: 10,
    alignItems: 'center',
    marginHorizontal: 5,
    width: 60,
    backgroundColor: '#f0f0f0',
  },
  selectedDateButton: {
    backgroundColor: '#8e44ad',
  },
  dateButtonText: {
    fontSize: 14,
    color: '#2d3436',
  },
  dateButtonDay: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2d3436',
  },
  selectedDateButtonText: {
    color: 'white',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2d3436',
  },
  modalCloseButton: {
    padding: 5,
  },
  confirmButton: {
    backgroundColor: '#8e44ad',
    borderRadius: 12,
    padding: 15,
    alignItems: 'center',
    marginTop: 20,
  },
  confirmButtonDisabled: {
    opacity: 0.7,
  },
  confirmButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  
  // Debug styles
  debugContainer: {
    backgroundColor: '#f0f0f0',
    padding: 10,
    borderRadius: 5,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  debugLabel: {
    fontSize: 12,
    color: '#777',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
});

export default BookingModal;