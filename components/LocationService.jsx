import { useEffect, useState, useCallback } from 'react';
import * as Location from 'expo-location';
import axios from 'axios';
import uuid from 'react-native-uuid';
import Constants from 'expo-constants';
import { set } from 'date-fns';

// Use PLACE_API from .env or expo constants
const place_API = Constants.expoConfig?.extra?.SALONGYM_API_KEY;
console.log('Using PLACE_API:', place_API);

const LocationService = (backendPlaceIds = []) => {
  const [gyms, setGyms] = useState([]);
  const [salons, setSalons] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [locationGranted, setLocationGranted] = useState(false);

  console.log('Backend Place IDs:', backendPlaceIds);
  console.log('Initial Gyms:', gyms);
  console.log('Initial Salons:', salons);

  
  

  useEffect(() => {
    requestLocationPermission();
  }, []);

  const requestLocationPermission = async () => {
    setIsLoading(true);
    setError(null);

    try {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setLocationGranted(false);
        setError('Permission to access location was denied');
        setIsLoading(false);
        return;
      }

      setLocationGranted(true);
      let location = await Location.getCurrentPositionAsync({});
      const { latitude, longitude } = location.coords;

      await Promise.all([
        fetchNearbyGyms(latitude, longitude),
        fetchNearbySalons(latitude, longitude),
      ]);
    } catch (err) {
      console.error('Location error:', err);
      setError(err);
    } finally {
      setIsLoading(false);
    }
  };

  // const fetchNearbyGyms = useCallback(async (lat, lon) => {
  //   try {

  //     console.log('Fetching gyms for coordinates:', lat, lon);
  //     console.log('Using backendPlaceIds:', backendPlaceIds);
  //     const response = await axios.get(
  //       `https://maps.gomaps.pro/maps/api/place/nearbysearch/json?location=${lat},${lon}&keyword=gym%near%me&radius=500&type=gym&key=${place_API}`
  //     );
  //     console.log('Gym response:', response.data);
  //     const filtered = response.data.results.filter((item) =>
  //       backendPlaceIds.includes(item.place_id)
  //     );
  //     const gymData = filtered.map((element) => ({
  //       id: uuid.v4(),
  //       placeId: element.place_id,
  //       name: element.name || "Nearby Gym",
  //       address: element.vicinity,
  //       rating: element.rating,
  //       lat: element.geometry?.location?.lat,
  //       lon: element.geometry?.location?.lng,
  //       openHours: element.opening_hours?.open_now,
  //     }));
  //     setGyms(gymData);
  //   } catch (err) {
  //     setGyms([]);
  //   }
  // }, [backendPlaceIds]);

  //  const fetchNearbySalons = useCallback(async (lat, lon) => {
  //   try {
  //     const response = await axios.get(
  //       `https://maps.gomaps.pro/maps/api/place/nearbysearch/json?location=${lat},${lon}&keyword=salon%near%me&radius=500&type=salon&key=${place_API}`
  //     );
  //     console.log(' response:', response.data);
  //     const filtered = response.data.results.filter((item) =>
  //       backendPlaceIds.includes(item.place_id)
  //     );
  //     const salonData = filtered.map((element) => ({
  //       id: uuid.v4(),
  //       placeId: element.place_id,
  //       name: element.name || "Nearby Salon",
  //       address: element.vicinity,
  //       rating: element.rating,
  //       lat: element.geometry?.location?.lat,
  //       lon: element.geometry?.location?.lng,
  //       openHours: element.opening_hours?.open_now,
  //     }));
  //     setSalons(salonData);
  //   } catch (err) {
  //     setSalons([]);
  //   }
  // }, [backendPlaceIds]);



  const fetchNearbyGyms = useCallback(async (lat, lon) => {
  try {
    setIsLoading(true);
    console.log('Fetching gyms for coordinates:', lat, lon);
    console.log('Using backendPlaceIds:', backendPlaceIds);
    
    const response = await axios.get(
      `https://maps.gomaps.pro/maps/api/place/nearbysearch/json?location=${lat},${lon}&keyword=gym%near%me&radius=500&type=gym&key=${place_API}`
    );
    
    // Log before filtering to see what's available
    console.log('Gym API returned items:', response.data.results.length);
    
    // Check for matching placeIds
    const matchingIds = response.data.results
      .map(item => item.place_id)
      .filter(id => backendPlaceIds.includes(id));
    console.log('Matching gym place IDs:', matchingIds);
    
    const filtered = response.data.results.filter((item) =>
      backendPlaceIds.includes(item.place_id)
    );
    
    console.log('Filtered gyms count:', filtered.length);
    
    const gymData = filtered.map((element) => ({
      id: uuid.v4(),
      placeId: element.place_id,
      name: element.name || "Nearby Gym",
      address: element.vicinity,
      rating: element.rating,
      lat: element.geometry?.location?.lat,
      lon: element.geometry?.location?.lng,
      openHours: element.opening_hours?.open_now,
      businessType: 'Gym', // Add this to ensure proper categorization
    }));
    
    setGyms(gymData);
  } catch (err) {
    setIsLoading(false);
    console.error('Error fetching gyms:', err);
    setGyms([]);
  }
  finally{
    setIsLoading(false);
  }
}, [backendPlaceIds]);



const fetchNearbySalons = useCallback(async (lat, lon) => {
  try {
    setIsLoading(true);
    console.log('Fetching salons for coordinates:', lat, lon);
    
    const response = await axios.get(
      `https://maps.gomaps.pro/maps/api/place/nearbysearch/json?location=${lat},${lon}&keyword=salon%near%me&radius=500&type=salon&key=${place_API}`
    );
    
    console.log('Salon API returned items:', response.data.results.length);
    
    // Check for matching placeIds
    const matchingIds = response.data.results
      .map(item => item.place_id)
      .filter(id => backendPlaceIds.includes(id));
    console.log('Matching salon place IDs:', matchingIds);
    
    const filtered = response.data.results.filter((item) =>
      backendPlaceIds.includes(item.place_id)
    );
    
    console.log('Filtered salons count:', filtered.length);
    
    const salonData = filtered.map((element) => ({
      id: uuid.v4(),
      placeId: element.place_id,
      name: element.name || "Nearby Salon",
      address: element.vicinity,
      rating: element.rating,
      lat: element.geometry?.location?.lat,
      lon: element.geometry?.location?.lng,
      openHours: element.opening_hours?.open_now,
      businessType: 'Salon', // Add this to ensure proper categorization
    }));
    
    setSalons(salonData);
  } catch (err) {
    setIsLoading(false);
    console.error('Error fetching salons:', err);
    setSalons([]);
  }
  finally{
    setIsLoading(false);
  }
}, [backendPlaceIds]);



  const refreshServices = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setLocationGranted(false);
        setError('Permission to access location was denied');
        setIsLoading(false);
        return;
      }
      setLocationGranted(true);
      let location = await Location.getCurrentPositionAsync({});
      const { latitude, longitude } = location.coords;
      await Promise.all([
        fetchNearbyGyms(latitude, longitude),
        fetchNearbySalons(latitude, longitude),
      ]);
    } catch (err) {
      setIsLoading(false);
      setError(err);
    }finally{
      setIsLoading(false);
    }
    
  }, [fetchNearbyGyms, fetchNearbySalons]);

  useEffect(() => {
    if (backendPlaceIds.length > 0) refreshServices();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [backendPlaceIds.join(',')]);

  return {
     gyms,
    salons,
    isLoading,
    error,
    locationGranted,
    refreshServices,
  };
};

export default LocationService;
