import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Image,
  Platform,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import BookingModal from '../../../components/userBooking/BookingModal';
import config from '../../../Appwrite/config'; 
// import { set } from 'date-fns';

export default function BusinessDetails() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const services = params.services ? JSON.parse(params.services) : [];
  const gallery = params.gallery ? JSON.parse(params.gallery) : [];
  console.log('BusinessDetails services:', gallery)
  console.log('BusinessDetails params:', params);
  console.log('Services:', services);
  
  const [business, setBusiness] = useState(null);
  const [selectedService, setSelectedService] = useState(null);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [scrollY] = useState(new Animated.Value(0));
  const [userId, setUserId] = useState(null);
  
  // app, fetch this from API)
  const BUSINESS_DETAILS = {
    id: params?.id,
    name: params?.name || "Elite Fitness Center",
    type: params?.businessType || "Gym",
    rating: params?.rating || "4.5",
    image: { uri: params?.image || 'https://media.istockphoto.com/id/1409329028/vector/no-picture-available-placeholder-thumbnail-icon-illustration-design.jpg?s=612x612&w=0&k=20&c=_zOuJu755g2eEUioiOUdz_mHKJQJn-tDgIAhQzyeKUQ=' },
    location: params?.address || "Lahore, Pakistan",
    isOpen: params?.openHours,
    hours: {
      open: params?.timingOpen || '6:00 AM',
      close: params?.timingClose || '10:00 PM',
    },
    
    description: params?.businessDescription || "Elite Fitness Center offers state-of-the-art equipment, expert trainers, and a variety of classes to help you achieve your fitness goals. Whether you're into weightlifting, cardio, or group classes, we have something for everyone.",
    offers: params?.offers || 'no offers available',
    gallery: [
      require('../../../assets/placeholder.jpg'),
      require('../../../assets/placeholder.jpg'),
      require('../../../assets/placeholder.jpg'),
    ],
    phone: params?.contact || '03254577194',
    email: params?.email || 'info@gmail.com',
  };

  const fetcUserId = async () => {
    try {
      const AccountUserId = await config.getAccountId();
      setUserId(AccountUserId);
      
    } catch (error) {
      console.error('Error fetching user ID:', error);
      return null;
    }
  }

  useEffect(() => {
    // In real app, fetch business details from API
    setBusiness(BUSINESS_DETAILS);
    fetcUserId();

  }, [params.id]);

  const headerOpacity = scrollY.interpolate({
    inputRange: [0, 200],
    outputRange: [0, 1],
    extrapolate: 'clamp',
  });

  if (!business) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#8e44ad" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

      {/* Animated Header */}
      <Animated.View style={[styles.header, { opacity: headerOpacity }]}>
        <LinearGradient
          colors={['#6c3483', '#8e44ad']}
          style={StyleSheet.absoluteFill}
        />
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>{business.name}</Text>
        </View>
      </Animated.View>

      {/* Back Button */}
      <TouchableOpacity 
        style={styles.backButton}
        onPress={() => router.back()}
      >
        <Ionicons name="arrow-back" size={24} color="#fff" />
      </TouchableOpacity>

      <Animated.ScrollView
        showsVerticalScrollIndicator={false}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: true }
        )}
        scrollEventThrottle={16}
      >
        {/* Hero Image */}
        <Image source={business.image} style={styles.heroImage} />

        {/* Business Info */}
        <View style={styles.content}>
          <View style={styles.businessHeader}>
            <View>
              <Text style={styles.businessName}>{business.name}</Text>
              <Text style={styles.businessType}>{business.type}</Text>
            </View>
            <View style={styles.ratingContainer}>
              <Ionicons name="star" size={20} color="#f1c40f" />
              <Text style={styles.rating}>{business.rating}</Text>
            </View>
          </View>

          {/* Location & Hours */}
          <View style={styles.infoSection}>
            <View style={styles.infoRow}>
              <Ionicons name="location-outline" size={20} color="#666" />
              <Text style={styles.infoText}>{business.location}</Text>
            </View>
            <View style={styles.infoRow}>
              <Ionicons name="time-outline" size={20} color="#666" />
              <Text style={styles.infoText}>
                {business.hours.open} - {business.hours.close}
              </Text>
              <View
                style={[
                  styles.statusBadge,
                  {
                    backgroundColor: business.isOpen === "true"
                      ? '#2ecc71'
                      : '#e74c3c'
                  }
                ]}
              >
                <Text style={styles.statusText}>
                  {business.isOpen === "true" ? 'Open' : 'Closed'}
                </Text>
          </View>
            </View>
          </View>

          {/* Services */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Services</Text>
            {services.map((service) => (
              <TouchableOpacity
                key={service.id}
                style={styles.serviceCard}
                onPress={() => {
                  setSelectedService(service);
                  setShowBookingModal(true);
                }}
              >
                <View>
                  <Text style={styles.serviceName}>{service.name}</Text>
                </View>
                <View style={styles.serviceRight}>
                  <Text style={styles.servicePrice}>
                    Rs. {Number(service.price).toLocaleString('en-PK')}
                  </Text>
                  <Ionicons name="chevron-forward" size={20} color="#666" />
                </View>
              </TouchableOpacity>
            ))}
          </View>

          {/* Description */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>About</Text>
            <Text style={styles.description}>{business.description}</Text>
          </View>

          {/* Amenities */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Offers</Text>
            <View style={styles.offersContainer}>
                <View style={styles.amenityTag}>
                  <Text style={styles.amenityText}>{BUSINESS_DETAILS.offers}</Text>
                </View>
            </View>
          </View>

          {/* Gallery */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Gallery</Text>
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false}
              style={styles.gallery}
            >
              {gallery.length > 0 ? gallery.map((url, index) => (
                <Image
                  key={index}
                  source={{ uri: url }}
                  style={styles.galleryImage}
                />
              )) : (
                // fallback image if no gallery
                <Image
                  source={require('../../../assets/placeholder.jpg')}
                  style={styles.galleryImage}
                />
              )}
            </ScrollView>
          </View>

          {/* Contact */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Contact</Text>
            <TouchableOpacity style={styles.contactButton}>
              <Ionicons name="call-outline" size={20} color="#8e44ad" />
              <Text style={styles.contactButtonText}>{business.phone}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.contactButton}>
              <Ionicons name="mail-outline" size={20} color="#8e44ad" />
              <Text style={styles.contactButtonText}>{business.email}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Animated.ScrollView>
      
      {/* Booking Modal */}
      <BookingModal
        visible={showBookingModal}
        onClose={() => setShowBookingModal(false)}
        selectedService={selectedService}
        currentUser=""
        userId={userId} 
        businessId={params?.businessId || params?.id} // ID for time slots
        businessOwnerId={params?.businessOwnerId} // Owner ID for bookings // Use ownerId if available, fall back to id parameter
        businessName={params.name||BUSINESS_DETAILS.name}
        adminEmail={params?.email}
        
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  // Styles remain the same
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: Platform.OS === 'ios' ? 90 : 70,
    zIndex: 1,
  },
  headerContent: {
    flex: 1,
    justifyContent: 'flex-end',
    paddingHorizontal: 20,
    paddingBottom: 10,
  },
  headerTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  backButton: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 50 : 40,
    left: 20,
    zIndex: 2,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  heroImage: {
    width: '100%',
    height: 300,
    resizeMode: 'cover',
  },
  content: {
    flex: 1,
    padding: 20,
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    marginTop: -20,
  },
  businessHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 15,
  },
  businessName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2d3436',
  },
  businessType: {
    fontSize: 16,
    color: '#666',
    marginTop: 4,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rating: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2d3436',
    marginLeft: 4,
  },
  
  infoSection: {
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 15,
    marginBottom: 20,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  infoText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 10,
    flex: 1,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginLeft: 10,
  },
  statusText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '500',
  },
  section: {
    marginBottom: 25,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2d3436',
    marginBottom: 15,
  },
  serviceCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 15,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#eee',
  },
  serviceName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#2d3436',
  },
  
  serviceRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  servicePrice: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#8e44ad',
    marginRight: 10,
  },
  description: {
    fontSize: 14,
    color: '#666',
    lineHeight: 22,
  },
  offersContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  amenityTag: {
    backgroundColor: '#f0f2f5',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
    marginRight: 8,
    marginBottom: 8,
  },
  amenityText: {
    fontSize: 14,
    color: '#666',
  },
  gallery: {
    marginHorizontal: -20,
    paddingHorizontal: 20,
  },
  galleryImage: {
    width: 200,
    height: 150,
    borderRadius: 12,
    marginRight: 10,
  },
  contactButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 15,
    marginBottom: 10,
  },
  contactButtonText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 10,
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
    maxHeight: '80%',
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
  serviceDetails: {
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 15,
    marginBottom: 20,
  },
  serviceTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2d3436',
    marginBottom: 8,
  },
  serviceInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  confirmButton: {
    backgroundColor: '#8e44ad',
    borderRadius: 12,
    padding: 15,
    alignItems: 'center',
    marginTop: 20,
  },
  confirmButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});