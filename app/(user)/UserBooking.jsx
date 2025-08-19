  import { Ionicons } from '@expo/vector-icons';
  import { LinearGradient } from 'expo-linear-gradient';
  import { useRouter } from 'expo-router';
  import {useCallback, useEffect, useState } from 'react';
  import {
      ActivityIndicator,
      FlatList,
      Image,
      Platform,
      RefreshControl,
      SafeAreaView,
      StatusBar,
      StyleSheet,
      Text,
      TouchableOpacity,
      View,
      Alert
  } from 'react-native';
  import service from '../../Appwrite/config';
  import auth from '../../Appwrite/auth';
  import LocationService from '../../components/LocationService';
  import AdminProfileModal from '../../components/AdminProfileModal'; 
  import { useFocusEffect } from '@react-navigation/native';
  import { BackHandler } from 'react-native';

  // Categories for filtering
  const CATEGORIES = [
    { id: '1', name: 'All', icon: 'apps' },
    { id: '2', name: 'Salon', icon: 'cut' },
    { id: '3', name: 'Gym', icon: 'barbell' },
  ];
  const MIN_SPINNER_TIME = 25000;

  // Helper function to check if a business is currently open based on its hours
  const isBusinessOpen = (timingOpen, timingClose) => {
    // If we don't have both opening and closing times, we can't determine
    if (!timingOpen || !timingClose) {
      return false;
    }
    
    try {
      // Get current time
      const now = new Date();
      const currentHour = now.getHours();
      const currentMinute = now.getMinutes();
      
      // Parse opening time (expecting format like "9:00 AM")
      const [openTime, openPeriod] = timingOpen.split(' ');
      let [openHour, openMinute] = openTime.split(':').map(Number);
      
      // Convert to 24-hour format
      if (openPeriod && openPeriod.toUpperCase() === 'PM' && openHour < 12) {
        openHour += 12;
      } else if (openPeriod && openPeriod.toUpperCase() === 'AM' && openHour === 12) {
        openHour = 0; // 12 AM = 0 hours in 24-hour format
      }
      
      // Parse closing time
      const [closeTime, closePeriod] = timingClose.split(' ');
      let [closeHour, closeMinute] = closeTime.split(':').map(Number);
      
      // Convert to 24-hour format
      if (closePeriod && closePeriod.toUpperCase() === 'PM' && closeHour < 12) {
        closeHour += 12;
      } else if (closePeriod && closePeriod.toUpperCase() === 'AM' && closeHour === 12) {
        closeHour = 0; // 12 AM = 0 hours in 24-hour format
      }
      
      // Create Date objects for open and close times today
      const openDate = new Date();
      openDate.setHours(openHour, openMinute, 0, 0);
      
      const closeDate = new Date();
      closeDate.setHours(closeHour, closeMinute, 0, 0);
      
      // Handle overnight hours (if close time is earlier than open time)
      if (closeHour < openHour) {
        // If current time is before midnight, compare with today's opening time
        if (currentHour >= openHour) {
          return true; // After opening, before midnight
        }
        
        // If current time is after midnight, compare with today's closing time
        if (currentHour < closeHour) {
          return true; // After midnight, before closing
        }
        
        return false; // Otherwise closed
      }
      
      // Normal case - open and close on the same day
      const currentTime = new Date();
      currentTime.setHours(currentHour, currentMinute, 0, 0);
      
      return currentTime >= openDate && currentTime <= closeDate;
    } catch (error) {
      console.error('Error checking business hours:', error);
      return false; // Default to closed if there's an error
    }
  };

  export default function UserBooking() {
    const router = useRouter();
    const [selectedCategory, setSelectedCategory] = useState('All');
    const [allBusinesses, setAllBusinesses] = useState([]);
    const [backendPlaceIds, setBackendPlaceIds] = useState([]);
    const [matchedGyms, setMatchedGyms] = useState([]);
    const [filteredMatchedGyms, setFilteredMatchedGyms] = useState([]);
    const [matchedSalons, setMatchedSalons] = useState([]);

    const [isOverallLoading, setIsOverallLoading] = useState(true)

    const [minSpinnerTimePassed, setMinSpinnerTimePassed] = useState(false);
    useEffect(()=>{
        const timer = setTimeout(() => {
    setMinSpinnerTimePassed(true);
  }, MIN_SPINNER_TIME);

  return () => clearTimeout(timer);
    }, []);

    useFocusEffect(
      
    useCallback(() => {
      const onBackPress = () => {
        if (Platform.OS === 'android') {
          BackHandler.exitApp();
          return true;
        }
        return false;
      };
       const subscription = BackHandler.addEventListener('hardwareBackPress', onBackPress);

  return () => {
    subscription.remove();
  };
      
    }, [])
  );




    
    // Loading states
    const [isInitialLoading, setIsInitialLoading] = useState(true);  // First-time page load
    const [isDataLoading, setIsDataLoading] = useState(false);       // Loading during operations
    const [isRefreshing, setIsRefreshing] = useState(false);         // Pull-to-refresh
    const [dataFetchComplete, setDataFetchComplete] = useState(false);
    const [dataFetchError, setDataFetchError] = useState(null);
    const [retryCount, setRetryCount] = useState(0);
    const [userName, setUserName] = useState('User'); // Admin name for greeting

 const [isProfileModalVisible, setIsProfileModalVisible] = useState(false);

    // Fetch admin businesses for matching
    const fetchBusinesses = useCallback(async () => {
      try {
        // Clear previous data to avoid stale data issues
        setAllBusinesses([]);
        setBackendPlaceIds([]);
        
        console.log('Fetching businesses...');
        const response = await service.getAllGymsalon();
        console.log("response", response);
        
        
        if (!response || response.length === 0) {
          console.log('No businesses found in API response');
          setDataFetchError('No businesses available');
          return [];
        }
        
        console.log(`Found ${response.length} businesses in API response`);
        
        const businesses = response.map(doc => ({
          id: doc.$id,
          name: doc.name,
          type: doc.businessType,
          rating: doc.rating || '4.0',
          placeId: doc.placeId,
          gallery: Array.isArray(doc.photos) ? doc.photos : [],
          image: Array.isArray(doc.photos) && doc.photos.length > 0
            ? doc.photos[0]
            : 'https://media.istockphoto.com/id/1409329028/vector/no-picture-available-placeholder-thumbnail-icon-illustration-design.jpg?s=612x612&w=0&k=20&c=_zOuJu755g2eEUioiOUdz_mHKJQJn-tDgIAhQzyeKUQ=',
          location: doc.location || 'Unknown',
          services: JSON.parse(doc.services || '[]'),
          priceRange: doc.priceRange || 'PKR',
          timingOpen: doc.timingOpen || '',    
          timingClose: doc.timingClose || '', 
          businessDescription: doc.businessDescription || '',
          offers: doc.offers || [],
          email: doc.email || '', 
          contact: doc.contact || '',
           businessOwnerId: doc.ownerId || '',
        }));
        
       
        
        setAllBusinesses(businesses);
        console.log('allBusinesses', allBusinesses);
        
        const placeIds = businesses.map(b => b.placeId).filter(Boolean);
        console.log(`Extracted ${placeIds.length} valid place IDs`);
        
        setBackendPlaceIds(placeIds);
        return businesses;
      } catch (error) {
        console.error('Error fetching businesses:', error);
        setDataFetchError('Failed to fetch businesses');
        return [];
      }
    }, []);

    //get current userName from current account
  const getCurrentUserName = async () => {  
    try {
      const account = await auth.getAccount();
      const AdminName =  account.name || 'User'; // Fallback to 'Admin' if name is not available
       setUserName(AdminName);
    } catch (error) {
      console.error('Error fetching user name:', error);
      return 'Admin'; // Fallback in case of error
    }
  }

    // Initial data fetch with retry logic
    useEffect(() => {
      const initialFetch = async () => {
        setIsInitialLoading(true);
        setIsOverallLoading(true);
        setDataFetchError(null);
        
        
        try {
          await fetchBusinesses();
        } catch (error) {
          console.error('Initial data fetch error:', error);
          setDataFetchError('Failed to load data');
          
          // Auto-retry up to 3 times on initial load
          if (retryCount < 3) {
            console.log(`Auto-retrying fetch (${retryCount + 1}/3)...`);
            setTimeout(() => {
              setRetryCount(retryCount + 1);
            }, 3000);
          }
        }
      };
      
      initialFetch();
      getCurrentUserName();
    }, [fetchBusinesses, retryCount]);

    // Fetch nearest gyms/salons from location service using backend placeIds
    const {
      gyms,
      salons,
      isLoading: isLocationLoading,
      error: locationError,
      locationGranted,
      refreshServices,
    } = LocationService(backendPlaceIds);

    // Handle manual refresh
    const onRefresh = useCallback(async () => {
      setIsRefreshing(true);
      setDataFetchComplete(false);
      setDataFetchError(null);
      
      try {
        await fetchBusinesses();
        // LocationService will automatically refresh when backendPlaceIds changes
      } catch (error) {
        console.error('Error refreshing data:', error);
        setDataFetchError('Failed to refresh data');
        
        // Show an alert if refresh fails
        Alert.alert(
          "Refresh Failed",
          "Unable to refresh the data. Please try again later.",
          [{ text: "OK" }]
        );
      } finally {
        setIsRefreshing(false);
      }
    }, [fetchBusinesses]);

    // Match nearest API gyms to admin gyms via placeId
    useEffect(() => {
      const matchBusinesses = async () => {
        try {
          
          
          // Skip if we don't have place IDs yet
          if (!backendPlaceIds.length) {
            console.log('No place IDs available for matching');
            if (!isInitialLoading && !isRefreshing) {
              setIsDataLoading(false);
              setDataFetchComplete(true);
            }
            return;
          }
          
          // Set loading if this is not the initial load or a refresh
          if (!isInitialLoading && !isRefreshing) {
            setIsDataLoading(true);
          }
          
          // Wait for location service to complete
          if (isLocationLoading) {
            console.log('Location service is still loading, waiting...');
            return; // Don't proceed until location service is ready
          }
          
          console.log('Starting business matching process...');
          console.log(`Available gyms from API: ${gyms.length}`);
          console.log(`Available salons from API: ${salons.length}`);
          console.log(`Available businesses from backend: ${allBusinesses.length}`);
          
          // Add a small delay to ensure data synchronization
          await new Promise(resolve => setTimeout(resolve, 1000));
          
          if ((gyms.length || salons.length) && allBusinesses.length) {
            // Match gyms
            const matchedGymsData = gyms.map(apiGym => {
              const adminData = allBusinesses.find(b => b.placeId === apiGym.placeId);
              if (adminData) {
                // Calculate open/closed status
                const isOpen = isBusinessOpen(adminData.timingOpen, adminData.timingClose);
                
                return {
                  ...apiGym,
                  image: adminData.image,
                  services: Array.isArray(adminData.services) ? adminData.services : [],
                  businessType: adminData.type,
                  id: adminData.id,
                  timingOpen: adminData.timingOpen || '',
                  timingClose: adminData.timingClose || '',
                  businessDescription: adminData.businessDescription || '',
                  offers: adminData.offers || [],
                  email: adminData.email || '', 
                  contact: adminData.contact || '',
                  gallery: adminData.gallery || [],
                  openHours: isOpen, 
                  businessOwnerId: adminData.businessOwnerId|| '',
                  
                  
                };
              }
              return null;
            }).filter(Boolean);
            
            // Match salons
            const matchedSalonsData = salons.map(apiSalon => {
              const adminData = allBusinesses.find(b => b.placeId === apiSalon.placeId);
              if (adminData) {
                // Calculate open/closed status
                const isOpen = isBusinessOpen(adminData.timingOpen, adminData.timingClose);
                
                return {
                  ...apiSalon,
                  image: adminData.image,
                  services: Array.isArray(adminData.services) ? adminData.services : [],
                  businessType: adminData.type,
                  id: adminData.id,
                  timingOpen: adminData.timingOpen || '',
                  timingClose: adminData.timingClose || '',
                  businessDescription: adminData.businessDescription || '',
                  offers: adminData.offers || [],
                  email: adminData.email || '', 
                  contact: adminData.contact || '',
                  gallery: adminData.gallery || [],
                  openHours: isOpen, // Set to calculated open status
                  businessOwnerId: adminData.businessOwnerId|| '',
                  
                };
              }
              return null;
            }).filter(Boolean);
            
            console.log(`Successfully matched ${matchedGymsData.length} gyms and ${matchedSalonsData.length} salons`);
            
            // Set the matched data
            setMatchedGyms(matchedGymsData);
            setMatchedSalons(matchedSalonsData);
            
            // Initialize filtered list with all businesses based on current category filter
            const allMatched = [...matchedGymsData, ...matchedSalonsData];
            
            if (selectedCategory === 'All') {
              setFilteredMatchedGyms(allMatched);
            } else {
              const filtered = allMatched.filter(
                business => business.businessType?.toLowerCase() === selectedCategory.toLowerCase()
              );
              // console.log('filtered ', filtered)
              setFilteredMatchedGyms(filtered);
            }
            
            console.log('Combined businesses count:', allMatched.length);
            setDataFetchError(null);
          } else {
            console.log('No data available for matching. Gyms:', gyms.length, 'Salons:', salons.length, 'Businesses:', allBusinesses.length);
            if ((gyms.length === 0 && salons.length === 0) && allBusinesses.length > 0) {
              setDataFetchError('No nearby services found');
            }
          }
        } catch (error) {
          console.error('Error in business matching process:', error);
          setDataFetchError('Error matching businesses with your location');
        } finally {
          setIsInitialLoading(false);
          setIsOverallLoading(false);
          setIsDataLoading(false);
          setDataFetchComplete(true);
        }
      };
      
      // Only run the matching process if we have place IDs or if location data changed
      if (backendPlaceIds.length || gyms.length || salons.length) {
        matchBusinesses();
      }
    }, [gyms, salons, allBusinesses, backendPlaceIds, isLocationLoading, selectedCategory, isRefreshing]);

    const renderCategory = ({ item }) => (
      <TouchableOpacity
        style={[
          styles.categoryButton,
          selectedCategory === item.name && styles.categoryButtonActive
        ]}
        onPress={() => handleCategoryPress(item)}
      >
        <Ionicons
          name={item.icon}
          size={24}
          color={selectedCategory === item.name ? '#fff' : '#8e44ad'}
        />
        <Text style={[
          styles.categoryText,
          selectedCategory === item.name && styles.categoryTextActive
        ]}>
          {item.name}
        </Text>
      </TouchableOpacity>
    );

    // Category filtering
    const handleCategoryPress = (category) => {
      setSelectedCategory(category.name);
      
      // Get the latest data from both sources
      const allBusinesses = [...matchedGyms, ...matchedSalons];
      
      if (category.name === 'All') {
        setFilteredMatchedGyms(allBusinesses);
        console.log('Showing all businesses:', allBusinesses.length);
      } else {
        const filtered = allBusinesses.filter(
          business => business.businessType?.toLowerCase() === category.name.toLowerCase()
        );
        setFilteredMatchedGyms(filtered);
        console.log(`Showing ${category.name} businesses:`, filtered.length);
      }
    };

    // Truncate location to first sentence
    const getShortLocation = (locationStr) => {
      if (!locationStr) return '';
      // Split by comma or period, show first segment
      return locationStr.split(',')[0];
    };

    // Card for matched gyms
    const renderGymCard = ({ item }) => {

      // Make sure services is an array

  // Log the IDs to verify what's being passed
        console.log(`Business: ${item.name}, ID: ${item.id}, OwnerID: ${item.businessOwnerId}`);
  

      const services = Array.isArray(item.services) ? item.services : [];


      
      return (
        <TouchableOpacity
          style={styles.businessCard}
          onPress={() => router.push({
            pathname: `/(businessDetails)/${item.id}`,
            params: {
              ...item, // pass entire item for details page
              
              
              businessId: item.id,            // Business ID for time slots
              businessOwnerId: item.businessOwnerId,  // Actual owner ID for bookings

              services: JSON.stringify(services),
              gallery: JSON.stringify(item.gallery || []),
            }
          })}
        >
          <Image
            source={typeof item.image === 'string' ? { uri: item.image } : item.image}
            style={styles.businessImage}
          />
          <View style={styles.businessContent}>
            <View style={styles.businessHeader}>
              <View>
                <Text style={styles.businessName}>{item.name}</Text>
                <Text style={styles.businessType}>{item.businessType || 'Gym'}</Text>
              </View>
              <View style={styles.ratingContainer}>
                <Ionicons name="star" size={16} color="#f1c40f" />
                <Text style={styles.ratingText}>{item.rating || '4.0'}</Text>
              </View>
            </View>
            <View style={styles.businessInfo}>
              <View style={styles.infoItem}>
                <Ionicons name="location-outline" size={16} color="#666" />
                <Text style={styles.infoText} numberOfLines={1} ellipsizeMode="tail">
                  {getShortLocation(item.address)}
                </Text>
              </View>
              <View style={styles.infoItem}>
                <Ionicons name="time-outline" size={16} color="#666" />
                <Text style={[
                  styles.infoText,
                  { color: item.openHours ? '#2ecc71' : '#e74c3c' }
                ]}>
                  {item.openHours ? 'Open' : 'Closed'} • {item.timingOpen} - {item.timingClose}
                </Text>
              </View>
            </View>
            <View style={styles.servicesContainer}>
              {services.slice(0, 3).map((service, idx) => (
                <View key={idx} style={styles.serviceTag}>
                  <Text style={styles.serviceText}>
                    {typeof service === 'string' ? service : service.name || 'Service'}
                  </Text>
                </View>
              ))}
              {services.length > 3 && (
                <View style={styles.serviceTag}>
                  <Text style={styles.serviceText}>+{services.length - 3} more</Text>
                </View>
              )}
            </View>
          </View>
        </TouchableOpacity>
      );
    };

    // Render loading state
    const renderLoading = () => (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#8e44ad" />
        <Text style={styles.loadingText}>Please wait Finding nearby services...</Text>
      </View>
    );

    // Render error state for location permission
    const renderLocationError = () => (
      <View style={styles.emptyState}>
        <Ionicons name="location-off" size={64} color="#ff4757" />
        <Text style={styles.emptyStateTitle}>Location Access Required</Text>
        <Text style={styles.emptyStateText}>
          We need your location to find nearby services.
        </Text>
        <TouchableOpacity 
          style={styles.retryButton}
          onPress={refreshServices}
        >
          <Text style={styles.retryButtonText}>Grant Permission</Text>
        </TouchableOpacity>
      </View>
    );

    // Render empty state
    const renderEmpty = () => {
      // If we're still in initial loading state
      if (isInitialLoading) {
        return renderLoading();
      }
      
      // If we're refreshing
      if (isRefreshing) {
        return renderLoading();
      }
      
      // If location permission is denied
      if (!locationGranted) {
        return renderLocationError();
      }
      
      // If we have an error
      if (dataFetchError) {
        return (
          <View style={styles.emptyState}>
            <Ionicons name="alert-circle" size={64} color="#ff4757" />
            <Text style={styles.emptyStateTitle}>Couldn't Load Services</Text>
            <Text style={styles.emptyStateText}>
              {dataFetchError}
            </Text>
            <TouchableOpacity 
              style={styles.retryButton}
              onPress={onRefresh}
            >
              <Text style={styles.retryButtonText}>Try Again</Text>
            </TouchableOpacity>
          </View>
        );
      }
      
      // If data fetch is complete but no businesses found
      if (dataFetchComplete && filteredMatchedGyms.length === 0) {
        return (
          <View style={styles.emptyState}>
            <Ionicons name="business" size={64} color="#ccc" />
            <Text style={styles.emptyStateTitle}>No Businesses Found</Text>
            <Text style={styles.emptyStateText}>
              No {selectedCategory !== 'All' ? selectedCategory : ''} businesses found in your area.
            </Text>
            <TouchableOpacity 
              style={styles.retryButton}
              onPress={onRefresh}
            >
              <Text style={styles.retryButtonText}>Refresh</Text>
            </TouchableOpacity>
          </View>
        );
      }
      
      // Default loading state
      return (
        <View style={styles.emptyState}>
          <ActivityIndicator size="large" color="#8e44ad" />
          <Text style={styles.emptyStateTitle}>Processing...</Text>
          <Text style={styles.emptyStateText}>
            Please wait Finding services in your area...
          </Text>
        </View>
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
            <View>
              <Text style={styles.welcomeText}>Welcome,</Text>
              <Text style={styles.userName}>{userName}</Text>
            </View>
            <View style={styles.headerButtons}>
              <TouchableOpacity 
                style={styles.profileButton}
                onPress={() => setIsProfileModalVisible(true)}
              >
                <Ionicons name="person-circle" size={40} color="#fff" />
              </TouchableOpacity>
            </View>
          </View> 
        </LinearGradient>
        <View style={styles.content}>
          <View style={styles.categoriesContainer}>
            <FlatList
              data={CATEGORIES}
              renderItem={renderCategory}
              keyExtractor={item => item.id}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.categoriesList}
            />
          </View>
          
          {(isInitialLoading ||isOverallLoading || !minSpinnerTimePassed) ? (
        renderLoading()
      ) : (
        <FlatList
          data={filteredMatchedGyms}
          renderItem={renderGymCard}
          keyExtractor={item => item.id || Math.random().toString()}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[
            styles.businessList,
            filteredMatchedGyms.length === 0 && styles.businessListEmpty
          ]}
          ListEmptyComponent={renderEmpty}
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
          <TouchableOpacity 
            style={styles.floatingButton}
            onPress={() => router.push('/MyBookings')}
          >
            <Ionicons name="calendar-outline" size={24} color="#fff" />
            <Text style={styles.floatingButtonText}>My Bookings</Text>
          </TouchableOpacity>
        </View>

        <AdminProfileModal 
          visible={isProfileModalVisible}
          onClose={() => setIsProfileModalVisible(false)}
          username={userName}
          owner="User"
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
    },
    headerContent: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    welcomeText: {
      color: 'rgba(255, 255, 255, 0.8)',
      fontSize: 14,
    },
    userName: {
      color: '#fff',
      fontSize: 24,
      fontWeight: 'bold',
    },
    headerButtons: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    profileButton: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: 'rgba(255, 255, 255, 0.2)',
      justifyContent: 'center',
      alignItems: 'center',
      marginLeft: 10,
    },
    floatingButton: {
      position: 'absolute',
      bottom: 60,
      right: 20,
      backgroundColor: '#8e44ad',
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 12,
      paddingHorizontal: 20,
      borderRadius: 30,
      elevation: 5,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.3,
      shadowRadius: 3,
    },
    floatingButtonText: {
      color: '#fff',
      fontWeight: 'bold',
      marginLeft: 8,
    },
    content: {
      flex: 1,
      marginTop: -20,
      backgroundColor: '#f5f6fa',
      borderTopLeftRadius: 30,
      borderTopRightRadius: 30,
      overflow: 'hidden',
    },
    categoriesContainer: {
      padding: 20,
      backgroundColor: '#fff',
      borderBottomWidth: 1,
      borderBottomColor: '#eee',
    },
    categoriesList: {
      paddingRight: 20,
    },
    categoryButton: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 20,
      paddingVertical: 10,
      borderRadius: 25,
      marginRight: 10,
      backgroundColor: '#fff',
      borderWidth: 1,
      borderColor: '#8e44ad',
    },
    categoryButtonActive: {
      backgroundColor: '#8e44ad',
    },
    categoryText: {
      marginLeft: 8,
      fontSize: 14,
      color: '#8e44ad',
      fontWeight: '500',
    },
    categoryTextActive: {
      color: '#fff',
    },
    businessList: {
      padding: 20,
    },
    businessListEmpty: {
      flex: 1,
      justifyContent: 'center',
    },
    businessCard: {
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
    businessImage: {
      width: '100%',
      height: 200,
      resizeMode: 'cover',
    },
    businessContent: {
      padding: 15,
    },
    businessHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: 10,
    },
    businessName: {
      fontSize: 18,
      fontWeight: 'bold',
      color: '#2d3436',
    },
    businessType: {
      fontSize: 14,
      color: '#666',
      marginTop: 2,
    },
    ratingContainer: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    ratingText: {
      marginLeft: 4,
      fontSize: 14,
      fontWeight: 'bold',
      color: '#2d3436',
    },
    businessInfo: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      alignItems: 'center',
      marginBottom: 12,
    },
    infoItem: {
      flexDirection: 'row',
      alignItems: 'center',
      marginRight: 16,
      marginBottom: 6,
    },
    infoText: {
      marginLeft: 4,
      fontSize: 14,
      color: '#666',
      maxWidth: 180, // Limit width to prevent overflowing
    },
    servicesContainer: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      marginTop: 8,
    },
    serviceTag: {
      backgroundColor: '#f0f2f5',
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 12,
      marginRight: 8,
      marginBottom: 8,
    },
    serviceText: {
      fontSize: 12,
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
    retryButton: {
      backgroundColor: '#8e44ad',
      paddingHorizontal: 24,
      paddingVertical: 12,
      borderRadius: 25,
    },
    retryButtonText: {
      color: '#fff',
      fontSize: 16,
      fontWeight: '500',
    },
  });