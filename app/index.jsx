import 'react-native-url-polyfill/auto';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Dimensions,
  Image,
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import * as SecureStore from 'expo-secure-store';

const { width, height } = Dimensions.get('window');

export default function WelcomeScreen() {
  const [initialRoute, setInitialRoute] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  
  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideUpAnim = useRef(new Animated.Value(50)).current;
  const buttonScaleUser = useRef(new Animated.Value(1)).current;
  const buttonScaleAdmin = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // Check login status first
    const checkAuthStatus = async () => {
      try {
        const role = await SecureStore.getItemAsync("role");
        console.log("Retrieved role:", role);
        
        if (role === "admin") {
          // Redirect to admin dashboard
          console.log("Redirecting to admin dashboard");
          router.replace('/AdminDashboard');
        } else if (role === "user") {
          // Redirect to user booking
          console.log("Redirecting to user booking");
          router.replace('/UserBooking');
        } else {
          // User is not logged in, stay on welcome screen
          console.log("No role found, staying on welcome screen");
          setInitialRoute("welcome");
          setIsLoading(false);
          
          // Start animations only after loading is complete
          Animated.parallel([
            Animated.timing(fadeAnim, {
              toValue: 1,
              duration: 1000,
              useNativeDriver: true,
            }),
            Animated.timing(slideUpAnim, {
              toValue: 0,
              duration: 800,
              useNativeDriver: true,
            })
          ]).start();
        }
      } catch (error) {
        console.error("Error checking auth status:", error);
        setInitialRoute("welcome");
        setIsLoading(false);
      }
    };

    checkAuthStatus();
  }, [router]);

  const handleUserJoin = () => {
    // Button press animation
    Animated.sequence([
      Animated.timing(buttonScaleUser, {
        toValue: 0.95,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(buttonScaleUser, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      })
    ]).start(() => {
      // Navigate to user registration
      router.push('/UserLoginScreen');
    });
  };

  const handleAdminLogin = () => {
    // Button press animation
    Animated.sequence([
      Animated.timing(buttonScaleAdmin, {
        toValue: 0.95,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(buttonScaleAdmin, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      })
    ]).start(() => {
      // Navigate to admin login
      router.push('/AdminLoginScreen');
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
      
      {/* Background Image */}
      <Image
        source={require('../assets/gym-salon-bg.jpg')}
        style={styles.backgroundImage}
        resizeMode="cover"
      />
      
      {/* Semi-transparent overlay */}
      <View style={styles.overlay} />
      
      {/* Enhanced background with multiple gradient layers */}
      <LinearGradient
        colors={['#8e44ad', '#9b59b6', '#8e44ad']}
        start={{x: 0, y: 0}}
        end={{x: 1, y: 1}}
        style={styles.background}
        opacity={0.15}
      />
      
      <View style={styles.backgroundPattern}>
        {[...Array(20)].map((_, i) => (
          <View 
            key={i} 
            style={[
              styles.circle, 
              { 
                left: Math.random() * width, 
                top: Math.random() * height,
                width: 20 + Math.random() * 100,
                height: 20 + Math.random() * 100,
                opacity: 0.03 + Math.random() * 0.05
              }
            ]} 
          />
        ))}
      </View>
      
      {isLoading ? (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#ffffff" />
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      ) : (
        <Animated.View 
          style={[
            styles.content,
            { 
              opacity: fadeAnim,
              transform: [{ translateY: slideUpAnim }]
            }
          ]}
        >
          <View style={styles.logoContainer}>
            <Text style={styles.appName}>Beauty & Fitness</Text>
            <Text style={styles.appNameHighlight}>NEARBY</Text>
            <View style={styles.taglineContainer}>
              <View style={styles.taglineLine} />
              <Text style={styles.tagline}>DISCOVER · BOOK · RELAX</Text>
              <View style={styles.taglineLine} />
            </View>
          </View>

          <View style={styles.buttonContainer}>
            <Animated.View style={{ transform: [{ scale: buttonScaleUser }] }}>
              <TouchableOpacity 
                style={styles.userButton} 
                onPress={handleUserJoin}
                activeOpacity={0.9}
              >
                <LinearGradient
                  colors={['#00cec9', '#00b5b1']}
                  start={{x: 0, y: 0}}
                  end={{x: 1, y: 0}}
                  style={styles.buttonGradient}
                >
                  <Ionicons name="person-add-outline" size={22} color="#fff" style={styles.buttonIcon} />
                  <Text style={styles.userButtonText}>Join as a User</Text>
                </LinearGradient>
              </TouchableOpacity>
            </Animated.View>
            
            <Animated.View style={{ transform: [{ scale: buttonScaleAdmin }] }}>
              <TouchableOpacity 
                style={styles.adminButton}
                onPress={handleAdminLogin}
                activeOpacity={0.9}
              >
                <Ionicons name="shield-checkmark-outline" size={22} color="#fff" style={styles.buttonIcon} />
                <Text style={styles.adminButtonText}>Login as Admin</Text>
              </TouchableOpacity>
            </Animated.View>
          </View>

          <View style={styles.footer}>
            <View style={styles.footerLine} />
            <Text style={styles.footerText}>
              © 2025 Beauty & Fitness Nearby
            </Text>
          </View>
        </Animated.View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingOverlay: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    zIndex: 10,
  },
  loadingText: {
    color: '#ffffff',
    marginTop: 15,
    fontSize: 16,
    fontWeight: 'bold',
  },
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
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
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
  content: {
    flex: 1,
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 60,
    paddingBottom: 30,
    paddingHorizontal: 25,
    zIndex: 5,
  },
  logoContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 80,
  },
  appName: {
    fontSize: 32,
    fontWeight: '300',
    color: '#ffffff',
    textAlign: 'center',
    letterSpacing: 1,
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  appNameHighlight: {
    fontSize: 38,
    fontWeight: 'bold',
    color: '#ffffff',
    textAlign: 'center',
    letterSpacing: 4,
    marginTop: -5,
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  taglineContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 15,
    width: '100%',
  },
  taglineLine: {
    flex: 1,
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
  tagline: {
    fontSize: 12,
    color: '#f8c291',
    textAlign: 'center',
    letterSpacing: 2,
    paddingHorizontal: 10,
    fontWeight: '500',
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  buttonContainer: {
    width: '100%',
    marginBottom: 40,
    paddingHorizontal: 10,
  },
  buttonGradient: {
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
  },
  userButton: {
    borderRadius: 16,
    marginBottom: 20,
    shadowColor: '#00cec9',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 8,
    overflow: 'hidden',
  },
  userButtonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  adminButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.5)',
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
    flexDirection: 'row',
    justifyContent: 'center',
  },
  adminButtonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  buttonIcon: {
    marginRight: 10,
  },
  footer: {
    width: '100%',
    alignItems: 'center',
  },
  footerLine: {
    width: 50,
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 2,
    marginBottom: 15,
  },
  footerText: {
    color: 'rgba(255, 255, 255, 0.6)',
    fontSize: 12,
    letterSpacing: 1,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 1,
  },
});


// import { useRouter } from 'expo-router';
// import { useEffect } from 'react';

// const index = () => {
//   const router = useRouter();
  
//   useEffect(() => {
//     // Redirect to AdminDashboard when component mounts
//     setTimeout(()=>{
//       router.replace('/AdminDashboard');
//     },[1000])
//   }, []);
  
//   // Return null or a loading indicator while redirecting
//   return null;
// };

// export default index