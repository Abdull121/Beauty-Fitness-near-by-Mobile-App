import { FontAwesome5, Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import {
  Alert,
  Animated,
  Dimensions,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View, 
  ActivityIndicator,
} from 'react-native';
import 'react-native-get-random-values';
import Constants from 'expo-constants';

import PlaceAutocomplete from '../../components/PlaceAutocomplete';

import service from '../../Appwrite/config';

// timeStorage.js
import * as SecureStore from 'expo-secure-store';
import { debugListBusinessHours } from '../../utils/businessHoursDebug';

const { width, height } = Dimensions.get('window');

export default function AdminBusinessInfo() {
  const router = useRouter();

  const [placeInfo, setPlaceInfo] = useState(null);
  
  // Form data state
  const [businessName, setBusinessName] = useState('');
  const [businessType, setBusinessType] = useState('');
  const [contactNumber, setContactNumber] = useState('');
  const [email, setEmail] = useState('');
  const [openTime, setOpenTime] = useState('9:00 AM');
  const [closeTime, setCloseTime] = useState('9:00 PM');

  const [submitting, setSubmitting] = useState(false);
  
  // Initialize services as a non-empty array to prevent undefined errors
  const [services, setServices] = useState([
    { id: 1, name: '', price: '' }
  ]);
  
  const [photos, setPhotos] = useState([]);
  const [description, setDescription] = useState('');
  const [offers, setOffers] = useState('');
  
  // UI state
  const [currentSection, setCurrentSection] = useState(1);
  const [errors, setErrors] = useState({});
  const [showLocationModal, setShowLocationModal] = useState(false);
  
  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideUpAnim = useRef(new Animated.Value(50)).current;
  const submitButtonScale = useRef(new Animated.Value(1)).current;

  // Focus state for inputs
  const [focusedInput, setFocusedInput] = useState(null);

  // Refs for scroll positioning
  const scrollViewRef = useRef(null);

  useEffect(() => {
    // Start animations when component mounts
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(slideUpAnim, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      })
    ]).start();
  }, []);

  const handleBack = () => {
    Alert.alert(
      "Unsaved Changes",
      "If you go back, your business information will not be saved. Continue?",
      [
        {
          text: "Stay",
          style: "cancel"
        },
        { 
          text: "Go Back", 
          onPress: () => router.back()
        }
      ]
    );
  };

  const clearLocation = () => {
    setPlaceInfo(null);
  };

  const addService = () => {
    try {
      // Create a new service with a unique ID
      const newId = services.length > 0 ? Math.max(...services.map(s => s.id)) + 1 : 1;
      const newServices = [...services, { id: newId, name: '', price: '' }];
      setServices(newServices);
    } catch (error) {
      console.error("Error adding service:", error);
      // Recover from error
      setServices([{ id: 1, name: '', price: '' }]);
    }
  };

  const removeService = (id) => {
    try {
      // Only remove if we have more than one service
      if (services.length <= 1) {
        return;
      }
      
      const filteredServices = services.filter(service => service.id !== id);
      setServices(filteredServices);
    } catch (error) {
      console.error("Error removing service:", error);
      // Recover from error
      setServices([{ id: 1, name: '', price: '' }]);
    }
  };

  const updateService = (id, field, value) => {
    try {
      const updatedServices = services.map(service => 
        service.id === id ? { ...service, [field]: value } : service
      );
      setServices(updatedServices);
    } catch (error) {
      console.error("Error updating service:", error);
      // Recover from error
      setServices([{ id: 1, name: '', price: '' }]);
    }
  };

  const pickImages = async () => {
    try {
      let result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaType,
        allowsMultipleSelection: true,
        quality: 0.8,
      });

      if (!result.canceled && result.assets) {
        // Add new photos (limit to 5 total)
        console.log("Selected images:", photos);

        const newPhotos = [...photos, ...result.assets.map(asset => asset.uri)];
        setPhotos(newPhotos.slice(0, 5));
      }
    } catch (error) {
      console.error("Error picking images:", error);
      // Recover from error
      setPhotos([]);
    }
  };

  const removePhoto = (index) => {
    try {
      const newPhotos = photos.filter((_, i) => i !== index);
      setPhotos(newPhotos);
    } catch (error) {
      console.error("Error removing photo:", error);
      // Recover from error
      setPhotos([]);
    }
  };

  const handleNextSection = () => {
    const newErrors = {};
    
    // Validate current section
    if (currentSection === 1) {
      if (!businessName.trim()) newErrors.businessName = "Business name is required";
      if (!businessType) newErrors.businessType = "Business type is required";
    } 
    
    else if (currentSection === 2) {
        if (!placeInfo|| !placeInfo.description) {
          newErrors.location = "Location is required";
        }
        if (!contactNumber.trim()) {
          newErrors.contactNumber = "Contact number is required";
        }
        
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!email.trim()) {
          newErrors.email = "Email is required";
        } else if (!emailRegex.test(email)) {
          newErrors.email = "Please enter a valid email";
        }
      }
    
    
    else if (currentSection === 3) {
      try {
        // Check if all services have name and price
        const invalidServices = services.filter(s => !s.name.trim() || !s.price.trim());
        if (invalidServices.length > 0) {
          newErrors.services = "All services must have a name and price";
        }
        
        // Check if at least one photo is uploaded
        if (photos.length === 0) {
          newErrors.photos = "Please upload at least one photo";
        }
        
        // Check if description is provided
        if (!description.trim()) {
          newErrors.description = "Description is required";
        }
      } catch (error) {
        console.error("Error validating section 3:", error);
        newErrors.general = "There was an error validating your information";
      }
    }
    
    setErrors(newErrors);
    
    if (Object.keys(newErrors).length === 0) {
      if (currentSection < 3) {
        setCurrentSection(currentSection + 1);
        scrollViewRef.current?.scrollTo({ y: 0, animated: true });
      } else {
        handleSubmit();
      }
    }
  };

  const handlePrevSection = () => {
    if (currentSection > 1) {
      setCurrentSection(currentSection - 1);
      scrollViewRef.current?.scrollTo({ y: 0, animated: true });
    }
  };

  const handleSubmit = async() => {
  try {
    // Validate final section
    const newErrors = {};
    
    if (!description.trim()) {
      newErrors.description = "Description is required";
    }
    
    setErrors(newErrors);
    
    if (Object.keys(newErrors).length === 0) {
      // Button press animation
      Animated.sequence([
        Animated.timing(submitButtonScale, {
          toValue: 0.95,
          duration: 100,
          useNativeDriver: true,
        }),
        Animated.timing(submitButtonScale, {
          toValue: 1,
          duration: 100,
          useNativeDriver: true,
        })
      ]).start(async () => {
        setSubmitting(true);
        
        // Prepare the data for submission
        const validServices = services.filter(s => s.name.trim() && s.price.trim());

        try {
          // Register the business
          const sendData = await service.salonGymRegister({
            businessName,
            businessType,
            placeId: placeInfo?.placeId || '',
            contactNumber,
            email,
            openTime,
            closeTime,
            services: validServices,
            photos,
            description,
            offers
          });          // Store the time values in SecureStore using the local state values
          // (not relying on sendData which might not have these properties)
          try {
            // Get the owner ID from the response or use a default fallback
            const ownerId = sendData?.$id || 'hairby56738';
            
            // Use owner-specific keys to store business hours
            const openTimeKey = `OpenTime_${ownerId}`;
            const closeTimeKey = `CloseTime_${ownerId}`;
            
            // Store with owner-specific keys
            await SecureStore.setItemAsync(openTimeKey, openTime);
            await SecureStore.setItemAsync(closeTimeKey, closeTime);
            
            // Verify the stored values
            const storedOpenTime = await SecureStore.getItemAsync(openTimeKey);
            const storedCloseTime = await SecureStore.getItemAsync(closeTimeKey);
            
            console.log(`✅ Stored business hours for owner ${ownerId}:`);
            console.log(`Open Time: ${storedOpenTime}`);
            console.log(`Close Time: ${storedCloseTime}`);
          } catch (storageError) {
            console.error("Error storing time data:", storageError);
          }

          setSubmitting(false);
          
          if (!sendData) {
            Alert.alert(
              "Error",
              "Failed to submit your business information. Please try again."
            );
            return;
          } else {
            // Show success message
            Alert.alert(
              "Success!",
              "Your business information has been submitted successfully.",
              [
                { 
                  text: "OK", 
                  onPress: () => {
                    // Navigate to dashboard or another appropriate screen
                    router.push('/AdminDashboard');
                  }
                }
              ]
            );
          }
        } catch (error) {
          console.error("Error registering business:", error);
          setSubmitting(false);
          Alert.alert(
            "Error",
            "There was an error submitting your information. Please try again."
          );
        }
      });
    }
  } catch (error) {
    setSubmitting(false);
    console.error("Error in handleSubmit:", error);
    Alert.alert(
      "Error",
      "There was an error submitting your information. Please try again."
    );
  }
};

  const renderSectionContent = () => {
    switch (currentSection) {
      case 1:
        return (
          <>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionIconContainer}>
                <Ionicons name="business-outline" size={24} color="#fff" />
              </View>
              <Text style={styles.sectionTitle}>Basic Information</Text>
            </View>
            
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Business Name</Text>
              <View style={[
                styles.inputContainer,
                focusedInput === 'businessName' && styles.inputContainerFocused,
                errors.businessName && styles.inputContainerError
              ]}>
                <TextInput
                  style={styles.input}
                  placeholder="e.g. Elegant Beauty Salon"
                  placeholderTextColor="#999"
                  value={businessName}
                  onChangeText={setBusinessName}
                  onFocus={() => setFocusedInput('businessName')}
                  onBlur={() => setFocusedInput(null)}
                />
              </View>
              {errors.businessName && (
                <Text style={styles.errorText}>
                  <Ionicons name="alert-circle-outline" size={14} color="#ff4757" /> {errors.businessName}
                </Text>
              )}
            </View>
            
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Business Type</Text>
              <View style={styles.businessTypeContainer}>
                <TouchableOpacity
                  style={[
                    styles.businessTypeOption,
                    businessType === 'Salon' && styles.businessTypeSelected
                  ]}
                  onPress={() => setBusinessType('Salon')}
                >
                  <FontAwesome5 
                    name="cut" 
                    size={20} 
                    color={businessType === 'Salon' ? "#00cec9" : "#8e44ad"} 
                    style={styles.businessTypeIcon}
                  />
                  <Text style={[
                    styles.businessTypeText,
                    businessType === 'Salon' && styles.businessTypeTextSelected
                  ]}>
                    Salon
                  </Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={[
                    styles.businessTypeOption,
                    businessType === 'Gym' && styles.businessTypeSelected
                  ]}
                  onPress={() => setBusinessType('Gym')}
                >
                  <FontAwesome5 
                    name="dumbbell" 
                    size={20} 
                    color={businessType === 'Gym' ? "#00cec9" : "#8e44ad"} 
                    style={styles.businessTypeIcon}
                  />
                  <Text style={[
                    styles.businessTypeText,
                    businessType === 'Gym' && styles.businessTypeTextSelected
                  ]}>
                    Gym
                  </Text>
                </TouchableOpacity>
              </View>
              {errors.businessType && (
                <Text style={styles.errorText}>
                  <Ionicons name="alert-circle-outline" size={14} color="#ff4757" /> {errors.businessType}
                </Text>
              )}
            </View>
          </>
        );
        
      case 2:
        return (
          <>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionIconContainer}>
                <Ionicons name="location-outline" size={24} color="#fff" />
              </View>
              <Text style={styles.sectionTitle}>Contact & Location</Text>
            </View>
            
          {/* Google Places Auto Complete - REPLACED WITH BUTTON */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Business Location</Text>
            
            <TouchableOpacity 
              style={styles.inputContainer}
              onPress={() => setShowLocationModal(true)}
            >
              <View style={{ maxWidth: '90%' }}>
              <Text
                style={{ fontSize: 16,  color: '#999' }}
                numberOfLines={1}
                ellipsizeMode="tail"
              >
                {placeInfo ? placeInfo.description : "Search for your business location"}
              </Text>
            </View>
            </TouchableOpacity>
            
            {placeInfo&& (
              <View style={styles.selectedLocationContainer}>
                <Ionicons name="location" size={20} color="#00cec9" style={styles.locationIcon} />
                <Text style={styles.selectedLocationText}>{placeInfo.description}</Text>
                <TouchableOpacity 
                  style={styles.clearLocationButton}
                  onPress={clearLocation}
                >
                  <Ionicons name="close-circle" size={20} color="#ff4757" />
                </TouchableOpacity>
              </View>
            )}
            
            {errors.location && (
              <Text style={styles.errorText}>
                <Ionicons name="alert-circle-outline" size={14} color="#ff4757" /> {errors.location}
              </Text>
            )}
          </View>
            
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Contact Number</Text>
              <View style={[
                styles.inputContainer,
                focusedInput === 'contactNumber' && styles.inputContainerFocused,
                errors.contactNumber && styles.inputContainerError
              ]}>
                <TextInput
                  style={styles.input}
                  placeholder="e.g. 0301-2345678"
                  placeholderTextColor="#999"
                  value={contactNumber}
                  onChangeText={setContactNumber}
                  keyboardType="phone-pad"
                  onFocus={() => setFocusedInput('contactNumber')}
                  onBlur={() => setFocusedInput(null)}
                />
              </View>
              {errors.contactNumber && (
                <Text style={styles.errorText}>
                  <Ionicons name="alert-circle-outline" size={14} color="#ff4757" /> {errors.contactNumber}
                </Text>
              )}
            </View>
            
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Email Address</Text>
              <View style={[
                styles.inputContainer,
                focusedInput === 'email' && styles.inputContainerFocused,
                errors.email && styles.inputContainerError
              ]}>
                <TextInput
                  style={styles.input}
                  placeholder="e.g. business@example.com"
                  placeholderTextColor="#999"
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  onFocus={() => setFocusedInput('email')}
                  onBlur={() => setFocusedInput(null)}
                />
              </View>
              {errors.email && (
                <Text style={styles.errorText}>
                  <Ionicons name="alert-circle-outline" size={14} color="#ff4757" /> {errors.email}
                </Text>
              )}
            </View>
            
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Business Hours</Text>
              
              <View style={styles.timeContainer}>
                <Text style={styles.timeHeaderLabel}>Opening Time</Text>
                <View style={styles.timeInputRow}>
                  <View style={styles.timeInputContainer}>
                    <TextInput
                      style={styles.timeInputField}
                      placeholder="9:00"
                      placeholderTextColor="#999"
                      value={openTime.split(' ')[0]} // Extract time part
                      onChangeText={(text) => {
                        // Keep AM/PM part and update time part
                        const ampm = openTime.includes('PM') ? 'PM' : 'AM';
                        setOpenTime(`${text} ${ampm}`);
                      }}
                      keyboardType="numbers-and-punctuation"
                    />
                  </View>
                  
                  <View style={styles.ampmContainer}>
                    <TouchableOpacity
                      style={[
                        styles.ampmButton,
                        openTime.includes('AM') && styles.ampmButtonSelected
                      ]}
                      onPress={() => {
                        // Keep time part and set to AM
                        const timePart = openTime.split(' ')[0];
                        setOpenTime(`${timePart} AM`);
                      }}
                    >
                      <Text style={[
                        styles.ampmText,
                        openTime.includes('AM') && styles.ampmTextSelected
                      ]}>AM</Text>
                    </TouchableOpacity>
                    
                    <TouchableOpacity
                      style={[
                        styles.ampmButton,
                        openTime.includes('PM') && styles.ampmButtonSelected
                      ]}
                      onPress={() => {
                        // Keep time part and set to PM
                        const timePart = openTime.split(' ')[0];
                        setOpenTime(`${timePart} PM`);
                      }}
                    >
                      <Text style={[
                        styles.ampmText,
                        openTime.includes('PM') && styles.ampmTextSelected
                      ]}>PM</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
              
              <View style={styles.timeContainer}>
                <Text style={styles.timeHeaderLabel}>Closing Time</Text>
                <View style={styles.timeInputRow}>
                  <View style={styles.timeInputContainer}>
                    <TextInput
                      style={styles.timeInputField}
                      placeholder="9:00"
                      placeholderTextColor="#999"
                      value={closeTime.split(' ')[0]} // Extract time part
                      onChangeText={(text) => {
                        // Keep AM/PM part and update time part
                        const ampm = closeTime.includes('PM') ? 'PM' : 'AM';
                        setCloseTime(`${text} ${ampm}`);
                      }}
                      keyboardType="numbers-and-punctuation"
                    />
                  </View>
                  
                  <View style={styles.ampmContainer}>
                    <TouchableOpacity
                      style={[
                        styles.ampmButton,
                        closeTime.includes('AM') && styles.ampmButtonSelected
                      ]}
                      onPress={() => {
                        // Keep time part and set to AM
                        const timePart = closeTime.split(' ')[0];
                        setCloseTime(`${timePart} AM`);
                      }}
                    >
                      <Text style={[
                        styles.ampmText,
                        closeTime.includes('AM') && styles.ampmTextSelected
                      ]}>AM</Text>
                    </TouchableOpacity>
                    
                    <TouchableOpacity
                      style={[
                        styles.ampmButton,
                        closeTime.includes('PM') && styles.ampmButtonSelected
                      ]}
                      onPress={() => {
                        // Keep time part and set to PM
                        const timePart = closeTime.split(' ')[0];
                        setCloseTime(`${timePart} PM`);
                      }}
                    >
                      <Text style={[
                        styles.ampmText,
                        closeTime.includes('PM') && styles.ampmTextSelected
                      ]}>PM</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            </View>
          </>
        );
        
      case 3:
        return (
          <>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionIconContainer}>
                <Ionicons name="list-outline" size={24} color="#fff" />
              </View>
              <Text style={styles.sectionTitle}>Services & Gallery</Text>
            </View>
            
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Services Offered</Text>
              
              {services.map((service, index) => (
                <View key={service.id} style={styles.serviceContainer}>
                  <View style={styles.serviceInputGroup}>
                    <View style={[
                      styles.serviceNameContainer,
                      focusedInput === `serviceName-${service.id}` && styles.inputContainerFocused
                    ]}>
                      <TextInput
                        style={styles.serviceNameInput}
                        placeholder="Service name"
                        placeholderTextColor="#999"
                        value={service.name}
                        onChangeText={(text) => updateService(service.id, 'name', text)}
                        onFocus={() => setFocusedInput(`serviceName-${service.id}`)}
                        onBlur={() => setFocusedInput(null)}
                      />
                    </View>
                    
                    <View style={[
                      styles.servicePriceContainer,
                      focusedInput === `servicePrice-${service.id}` && styles.inputContainerFocused
                    ]}>
                      <TextInput
                        style={styles.servicePriceInput}
                        placeholder="Price"
                        placeholderTextColor="#999"
                        value={service.price}
                        onChangeText={(text) => updateService(service.id, 'price', text)}
                        keyboardType="numeric"
                        onFocus={() => setFocusedInput(`servicePrice-${service.id}`)}
                        onBlur={() => setFocusedInput(null)}
                      />
                    </View>
                    
                    {services.length > 1 && (
                      <TouchableOpacity
                        style={styles.removeServiceButton}
                        onPress={() => removeService(service.id)}
                      >
                        <Ionicons name="close-circle" size={24} color="#ff4757" />
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              ))}
              
              <TouchableOpacity
                style={styles.addServiceButton}
                onPress={addService}
              >
                <Ionicons name="add-circle-outline" size={20} color="#00cec9" />
                <Text style={styles.addServiceText}>Add Another Service</Text>
              </TouchableOpacity>
              
              {errors.services && (
                <Text style={styles.errorText}>
                  <Ionicons name="alert-circle-outline" size={14} color="#ff4757" /> {errors.services}
                </Text>
              )}
            </View>
            
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>
                Business Photos <Text style={styles.photoSubLabel}>(Max 5)</Text>
              </Text>
              
              <View style={styles.photosContainer}>
                {photos.map((uri, index) => (
                  <View key={index} style={styles.photoItem}>
                    <Image source={{ uri }} style={styles.photoThumbnail} />
                    <TouchableOpacity
                      style={styles.removePhotoButton}
                      onPress={() => removePhoto(index)}
                    >
                      <Ionicons name="close-circle" size={22} color="#ff4757" />
                    </TouchableOpacity>
                  </View>
                ))}
                
                {photos.length < 5 && (
                  <TouchableOpacity
                    style={styles.addPhotoButton}
                    onPress={pickImages}
                  >
                    <Ionicons name="image-outline" size={32} color="#8e44ad" />
                    <Text style={styles.addPhotoText}>Add</Text>
                  </TouchableOpacity>
                )}
              </View>
              
              {errors.photos && (
                <Text style={styles.errorText}>
                  <Ionicons name="alert-circle-outline" size={14} color="#ff4757" /> {errors.photos}
                </Text>
              )}
            </View>
            
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Business Description</Text>
              <View style={[
                styles.textAreaContainer,
                focusedInput === 'description' && styles.inputContainerFocused,
                errors.description && styles.inputContainerError
              ]}>
                <TextInput
                  style={styles.textArea}
                  placeholder="Describe your business services and facilities..."
                  placeholderTextColor="#999"
                  value={description}
                  onChangeText={setDescription}
                  multiline
                  numberOfLines={4}
                  textAlignVertical="top"
                  onFocus={() => setFocusedInput('description')}
                  onBlur={() => setFocusedInput(null)}
                />
              </View>
              {errors.description && (
                <Text style={styles.errorText}>
                  <Ionicons name="alert-circle-outline" size={14} color="#ff4757" /> {errors.description}
                </Text>
              )}
            </View>
            
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Available Offers <Text style={styles.optionalLabel}>(Optional)</Text></Text>
              <View style={[
                styles.inputContainer,
                focusedInput === 'offers' && styles.inputContainerFocused
              ]}>
                <TextInput
                  style={styles.input}
                  placeholder="e.g. 20% off for new customers"
                  placeholderTextColor="#999"
                  value={offers}
                  onChangeText={setOffers}
                  onFocus={() => setFocusedInput('offers')}
                  onBlur={() => setFocusedInput(null)}
                />
              </View>
            </View>
          </>
        );
        
      default:
        return null;
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
      
      {/* Background Image */}
      <Image
        source={require('../../assets/gym-salon-bg.jpg')}
        style={styles.backgroundImage}
        resizeMode="cover"
      />
      
      {/* Semi-transparent overlay */}
      <View style={styles.overlay} />
      
      {/* Gradient background */}
      <LinearGradient
        colors={['rgba(108, 52, 131, 0.85)', 'rgba(142, 68, 173, 0.85)', 'rgba(108, 52, 131, 0.85)']}
        start={{x: 0, y: 0}}
        end={{x: 1, y: 1}}
        opacity={0.18}
        style={styles.background}
      />
      
      <View style={styles.backgroundPattern}>
        {[...Array(15)].map((_, i) => (
          <View 
            key={i} 
            style={[
              styles.circle, 
              { 
                left: Math.random() * width, 
                top: Math.random() * height,
                width: 20 + Math.random() * 80,
                height: 20 + Math.random() * 80,
                opacity: 0.03 + Math.random() * 0.05
              }
            ]} 
          />
        ))}
      </View>
      
      {/* LOCATION SEARCH MODAL */}
      <Modal
        visible={showLocationModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowLocationModal(false)}
      >
        <View style={styles.locationModal}>
          <View style={styles.locationModalContent}>
            <View style={styles.locationModalHeader}>
              <Text style={styles.locationModalTitle}>Select Location</Text>
              <TouchableOpacity onPress={() => setShowLocationModal(false)}>
                <Ionicons name="close" size={24} color="#333" />
              </TouchableOpacity>
            </View>
            
            <View style={{ marginTop: 20 }}>
              <PlaceAutocomplete
                apiKey={Constants.expoConfig.extra.SALONGYM_API_KEY}
                placeholder="Search your business location"
                debounceTime={500}
                onSelect={(place) => {
                  console.log("Selected place:", place);
                  setPlaceInfo({
                    placeId: place.place_id || '',
                    description: place.description || '',
                  });
                  setShowLocationModal(false); // Close modal after selection
                }}
              />

              {placeInfo && (
                <View style={styles.selectedLocationContainer}>
                  <Ionicons name="location" size={20} color="#00cec9" style={styles.locationIcon} />
                  <Text style={styles.selectedLocationText}>{placeInfo.description}</Text>
                  <TouchableOpacity 
                    style={styles.clearLocationButton}
                    onPress={clearLocation}
                  >
                    <Ionicons name="close-circle" size={20} color="#ff4757" />
                  </TouchableOpacity>
                </View>
              )}
            </View>
          </View>
        </View>
      </Modal>
      
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoid}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 100 : 0}
      >
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.backButton} 
            onPress={handleBack}
            hitSlop={{ top: 20, bottom: 20, left: 20, right: 20 }}
          >
            <Ionicons name="chevron-back" size={28} color="#fff" />
          </TouchableOpacity>
          
          <View style={styles.headerCenter}>
            <View style={styles.adminBadge}>
              <Ionicons name="shield-checkmark" size={20} color="#fff" />
              <Text style={styles.adminBadgeText}>ADMIN SETUP</Text>
            </View>
            <Text style={styles.headerTitle}>Business Information</Text>
          </View>
          
          <View style={styles.progressContainer}>
            <View style={styles.progressDots}>
              {[1, 2, 3].map(section => (
                <View 
                  key={section} 
                  style={[
                    styles.progressDot, 
                    section === currentSection ? styles.progressDotActive : 
                    section < currentSection ? styles.progressDotCompleted : null
                  ]}
                >
                  {section < currentSection ? (
                    <Ionicons name="checkmark" size={12} color="#fff" />
                  ) : null}
                </View>
              ))}
            </View>
            <Text style={styles.progressText}>
              {currentSection}/3
            </Text>
          </View>
        </View>
        
        <ScrollView 
          ref={scrollViewRef}
          contentContainerStyle={styles.scrollContent} 
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <Animated.View 
            style={[
              styles.content,
              { 
                opacity: fadeAnim,
                transform: [{ translateY: slideUpAnim }]
              }
            ]}
          >
            <View style={styles.formContainer}>
              {renderSectionContent()}
              
              <View style={styles.navigationButtons}>
                {currentSection > 1 && (
                  <TouchableOpacity 
                    style={styles.prevButton} 
                    onPress={handlePrevSection}
                  >
                    <Ionicons name="chevron-back" size={22} color="#fff" />
                    <Text style={styles.prevButtonText}>Previous</Text>
                  </TouchableOpacity>
                )}
                
                <Animated.View style={{ 
                  transform: [{ scale: submitButtonScale }],
                  flex: currentSection > 1 ? 1 : 'auto',
                }}>
                  <TouchableOpacity
                    style={[styles.nextButton, submitting && styles.disabledButton]}
                    onPress={currentSection < 3 ? handleNextSection : handleSubmit}
                    activeOpacity={0.9}
                    disabled={submitting}
                  >
                    <LinearGradient
                      colors={["#00cec9", "#00b5b1"]}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={styles.buttonGradient}
                    >
                      {submitting ? (
                        <ActivityIndicator color="#fff" size="small" />
                      ) : (
                        <>
                          <Text style={styles.nextButtonText}>
                            {currentSection < 3 ? "Next" : "Submit"}
                          </Text>
                          {currentSection < 3 ? (
                            <Ionicons name="chevron-forward" size={22} color="#fff" />
                          ) : (
                            <Ionicons name="checkmark-circle-outline" size={22} color="#fff" />
                          )}
                        </>
                      )}
                    </LinearGradient>
                  </TouchableOpacity>
                </Animated.View>
              </View>
            </View>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  // Background image styles
  backgroundImage: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    zIndex: 1,
  },
  overlay: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    backgroundColor: 'rgba(25, 25, 50, 0.55)', // Dark blue overlay
    zIndex: 2,
  },
  background: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    zIndex: 3,
  },
  backgroundPattern: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    overflow: 'hidden',
    zIndex: 4,
  },
  circle: {
    position: 'absolute',
    borderRadius: 200,
    backgroundColor: '#ffffff',
  },
  keyboardAvoid: {
    flex: 1,
    zIndex: 5,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 10 : 40,
    paddingBottom: 10,
    zIndex: 1,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  adminBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
    marginBottom: 5,
  },
  adminBadgeText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: 'bold',
    marginLeft: 5,
    letterSpacing: 1,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#ffffff',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0.5, height: 0.5 },
    textShadowRadius: 1,
  },
  progressContainer: {
    alignItems: 'center',
  },
  progressDots: {
    flexDirection: 'row',
    marginBottom: 5,
  },
  progressDot: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    marginHorizontal: 3,
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressDotActive: {
    backgroundColor: '#00cec9',
  },
  progressDotCompleted: {
    backgroundColor: '#00cec9',
  },
  progressText: {
    color: '#ffffff',
    fontSize: 12,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0.5, height: 0.5 },
    textShadowRadius: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  formContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 16,
    padding: 20,
    marginBottom: 30,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 4,
    backdropFilter: 'blur(10px)',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  sectionIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 206, 201, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0.5, height: 0.5 },
    textShadowRadius: 1,
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    color: '#ffffff',
    marginBottom: 8,
    fontWeight: '500',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0.5, height: 0.5 },
    textShadowRadius: 1,
  },
  inputContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  inputContainerFocused: {
    borderWidth: 2,
    borderColor: '#00cec9',
  },
  inputContainerError: {
    borderWidth: 2,
    borderColor: '#ff4757',
  },
  input: {
    fontSize: 16,
    color: '#333',
  },
  textAreaContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  textArea: {
    fontSize: 16,
    color: '#333',
    height: 100,
  },
  errorText: {
    color: '#ff4757',
    fontSize: 14,
    marginTop: 8,
    alignItems: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0.5, height: 0.5 },
    textShadowRadius: 1,
  },
  businessTypeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  businessTypeOption: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 15,
    marginHorizontal: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  businessTypeSelected: {
    borderWidth: 2,
    borderColor: '#00cec9',
    backgroundColor: 'rgba(0, 206, 201, 0.05)',
  },
  businessTypeIcon: {
    marginRight: 10,
  },
  businessTypeText: {
    fontSize: 16,
    color: '#8e44ad',
    fontWeight: '500',
  },
  businessTypeTextSelected: {
    color: '#00cec9',
    fontWeight: 'bold',
  },
  // Google Places styles
  googlePlacesWrapper: {
    minHeight: 50,
    zIndex: 5, // Make sure it's above other elements
  },
  selectedLocationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 206, 201, 0.1)',
    borderRadius: 12,
    padding: 12,
    marginTop: 10,
    borderWidth: 1,
    borderColor: 'rgba(0, 206, 201, 0.3)',
  },
  locationIcon: {
    marginRight: 8,
  },
  selectedLocationText: {
    flex: 1,
    fontSize: 14,
    color: '#333', // Changed to darker color for modal
  },
  clearLocationButton: {
    padding: 5,
  },
  // Location Modal Styles
  locationModal: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  locationModalContent: {
    backgroundColor: 'white',
    borderRadius: 12,
    width: '90%',
    maxHeight: '80%',
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  locationModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  locationModalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  // Time picker styles
  timeContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 15,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  timeHeaderLabel: {
    fontSize: 14,
    color: '#8e44ad',
    fontWeight: '500',
    marginBottom: 10,
  },
  timeInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  timeInputContainer: {
    flex: 1,
    borderWidth: 1,
    borderColor: 'rgba(142, 68, 173, 0.2)',
    borderRadius: 8,
    marginRight: 10,
    height: 50,
    justifyContent: 'center',
    paddingHorizontal: 10,
  },
  timeInputField: {
    fontSize: 18,
    color: '#333',
    textAlign: 'center',
  },
  ampmContainer: {
    flexDirection: 'row',
    borderWidth: 1,
    borderColor: 'rgba(142, 68, 173, 0.2)',
    borderRadius: 8,
    overflow: 'hidden',
  },
  ampmButton: {
    width: 50,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f8f8',
  },
  ampmButtonSelected: {
    backgroundColor: '#00cec9',
  },
  ampmText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#8e44ad',
  },
  ampmTextSelected: {
    color: '#ffffff',
  },
  serviceContainer: {
    marginBottom: 10,
  },
  serviceInputGroup: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  serviceNameContainer: {
    flex: 2,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 15,
    marginRight: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  serviceNameInput: {
    fontSize: 16,
    color: '#333',
  },
  servicePriceContainer: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 15,
    marginRight: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  servicePriceInput: {
    fontSize: 16,
    color: '#333',
  },
  removeServiceButton: {
    padding: 5,
  },
  addServiceButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 10,
    backgroundColor: 'rgba(0, 206, 201, 0.1)',
    borderRadius: 12,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: 'rgba(0, 206, 201, 0.5)',
    marginTop: 10,
  },
  addServiceText: {
    fontSize: 14,
    color: '#00cec9',
    fontWeight: '500',
    marginLeft: 5,
  },
  photosContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 5,
  },
  photoItem: {
    width: 80,
    height: 80,
    borderRadius: 8,
    margin: 5,
    position: 'relative',
  },
  photoThumbnail: {
    width: '100%',
    height: '100%',
    borderRadius: 8,
  },
  removePhotoButton: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 2,
  },
  addPhotoButton: {
    width: 80,
    height: 80,
    borderRadius: 8,
    margin: 5,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: 'rgba(255, 255, 255, 0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  addPhotoText: {
    fontSize: 12,
    color: '#ffffff',
    marginTop: 5,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0.5, height: 0.5 },
    textShadowRadius: 1,
  },
  photoSubLabel: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.7)',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0.5, height: 0.5 },
    textShadowRadius: 1,
  },
  optionalLabel: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.7)',
    fontStyle: 'italic',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0.5, height: 0.5 },
    textShadowRadius: 1,
  },
  navigationButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  prevButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 12,
    paddingVertical: 15,
    paddingHorizontal: 20,
    marginRight: 10,
  },
  prevButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '500',
    marginLeft: 5,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0.5, height: 0.5 },
    textShadowRadius: 1,
  },
  nextButton: {
    flex: 1,
    borderRadius: 12,
    shadowColor: '#00cec9',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
    overflow: 'hidden',
  },
  buttonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    paddingVertical: 15,
    paddingHorizontal: 20,
  },
  nextButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
    marginRight: 5,
  },
  disabledButton: {
    opacity: 0.7,
  },
});