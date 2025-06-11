import React, { useState, useRef, useEffect } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  StyleSheet, 
  SafeAreaView, 
  StatusBar,
  Animated,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  Keyboard,
  ScrollView,
  Image,
  Dimensions,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import auth from '../../Appwrite/auth';
import * as SecureStore from 'expo-secure-store';

const { width, height } = Dimensions.get('window');

export default function AdminLoginScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isEmailFocused, setIsEmailFocused] = useState(false);
  const [isPasswordFocused, setIsPasswordFocused] = useState(false);
  const [formError, setFormError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideUpAnim = useRef(new Animated.Value(50)).current;
  const loginButtonScale = useRef(new Animated.Value(1)).current;

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
    router.back();
  };

  const handleLogin = () => {
    
    setIsLoading(true);
    // Simple validation
    if (!email.trim()) {
      setFormError('Please enter your email');
      return;
    }
    if (!password.trim()) {
      setFormError('Please enter your password');
      setIsLoading(false);
      return;
    }
    if (password.length < 8) {
    setFormError('Password must be at least 8 characters');
    setIsLoading(false);
    return false;
  }
    
    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setFormError('Please enter a valid email');
      return;
    }
    setFormError('');
    
    
    
    // Button press animation
    Animated.sequence([
      Animated.timing(loginButtonScale, {
        toValue: 0.95,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(loginButtonScale, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      })
    ]).start( async() => {
      // Handle admin login logic here
      console.log('Admin login with:', email, password);

      try{
        const login =  await auth.login({email, password});
      if (!login) {
        setFormError('Invalid email or password');
        setIsLoading(false);
        return;
      }
      
      else {
        setFormError('');
        setIsLoading(false);
        // Navigate to admin dashboard
       router.push('/AdminDashboard');
        await SecureStore.setItemAsync("role", "admin" );

      }

      
      }catch(e){
        console.log('Login error:', e);
        Alert.alert(
          'Login Failed',
          'An error occurred while trying to log in. Please check your credentials and try again.',
          [{ text: 'OK', onPress: () => setIsLoading(false) }]
        );
      } finally{
        setIsLoading(false);
      }

      
      
    });
  };

  const handleCreateAccount = () => {
    // Navigate to admin registration
    router.push({
      pathname: '/SignUp',
      params: { role: 'admin' }
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
      
      {/* Background Image  */}
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
      
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardAvoid}
        >
          <ScrollView 
            contentContainerStyle={styles.scrollContent} 
            showsVerticalScrollIndicator={false}
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
              <TouchableOpacity 
                style={styles.backButton} 
                onPress={handleBack}
                hitSlop={{ top: 20, bottom: 20, left: 20, right: 20 }}
              >
                <Ionicons name="chevron-back" size={28} color="#fff" />
              </TouchableOpacity>
              
              <View style={styles.headerContainer}>
                <View style={styles.adminBadge}>
                  <Ionicons name="shield-checkmark" size={20} color="#fff" />
                  <Text style={styles.adminBadgeText}>ADMIN PORTAL</Text>
                </View>
                <Text style={styles.headerTitle}>Administrator</Text>
                <Text style={styles.headerSubtitle}>Secure login required</Text>
              </View>
              
              <View style={styles.formContainer}>
                <View style={[
                  styles.inputContainer,
                  isEmailFocused && styles.inputContainerFocused
                ]}>
                  <Ionicons name="mail-outline" size={22} color={isEmailFocused ? "#00cec9" : "#8e44ad"} style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="Admin Email"
                    placeholderTextColor="#999"
                    value={email}
                    onChangeText={setEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    onFocus={() => setIsEmailFocused(true)}
                    onBlur={() => setIsEmailFocused(false)}
                  />
                </View>
                
                <View style={[
                  styles.inputContainer,
                  isPasswordFocused && styles.inputContainerFocused
                ]}>
                  <Ionicons 
                    name="lock-closed-outline" 
                    size={22} 
                    color={isPasswordFocused ? "#00cec9" : "#8e44ad"} 
                    style={styles.inputIcon} 
                  />
                  <TextInput
                    style={styles.input}
                    placeholder="Password"
                    placeholderTextColor="#999"
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry={!showPassword}
                    onFocus={() => setIsPasswordFocused(true)}
                    onBlur={() => setIsPasswordFocused(false)}
                  />
                  <TouchableOpacity 
                    onPress={() => setShowPassword(!showPassword)} 
                    style={styles.eyeIcon}
                  >
                    <Ionicons 
                      name={showPassword ? "eye-outline" : "eye-off-outline"} 
                      size={22} 
                      color="#8e44ad" 
                    />
                  </TouchableOpacity>
                </View>
                
                {formError ? (
                  <Text style={styles.errorText}>
                    <Ionicons name="alert-circle-outline" size={16} color="#ff4757" /> {formError}
                  </Text>
                ) : null}
                
                <Animated.View style={{ transform: [{ scale: loginButtonScale }] }}>
                  <TouchableOpacity 
                    style={styles.loginButton} 
                    onPress={handleLogin}
                    disabled={isLoading}
                    activeOpacity={0.9}
                  >
                    <LinearGradient
                      colors={['#00cec9', '#00b5b1']}
                      start={{x: 0, y: 0}}
                      end={{x: 1, y: 0}}
                      style={styles.buttonGradient}
                    >
                      {isLoading ? (
                        <ActivityIndicator size="small" color="#ffffff" />  
                      ) : (
                        <>
                        <Ionicons name="shield-checkmark-outline" size={20} color="#fff" style={{marginRight: 8}} />
                      <Text style={styles.loginButtonText}>Admin Login</Text>
                        </>
                      )}
                    </LinearGradient>
                  </TouchableOpacity>
                </Animated.View>
                
                <View style={styles.signupContainer}>
                  <Text style={styles.signupText}>Need admin access?</Text>
                  <TouchableOpacity onPress={handleCreateAccount}>
                    <Text style={styles.signupLink}>Register as Admin</Text>
                  </TouchableOpacity>
                </View>
                
                <View style={styles.securityNote}>
                  <Ionicons name="lock-closed" size={14} color="rgba(255, 255, 255, 0.7)" />
                  <Text style={styles.securityNoteText}>
                    This portal is secured and monitored
                  </Text>
                </View>
              </View>
            </Animated.View>
          </ScrollView>
        </KeyboardAvoidingView>
      </TouchableWithoutFeedback>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  // New background image styles
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
  scrollContent: {
    flexGrow: 1,
  },
  content: {
    flex: 1,
    padding: 25,
  },
  backButton: {
    marginTop: Platform.OS === 'ios' ? 10 : 40,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerContainer: {
    marginTop: 20,
    marginBottom: 40,
  },
  adminBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
    alignSelf: 'flex-start',
    marginBottom: 15,
  },
  adminBadgeText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: 'bold',
    marginLeft: 5,
    letterSpacing: 1,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 10,
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  headerSubtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0.5, height: 0.5 },
    textShadowRadius: 1,
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
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 12,
    marginBottom: 16,
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
  inputIcon: {
    padding: 10,
    marginLeft: 5,
  },
  input: {
    flex: 1,
    paddingVertical: 14,
    paddingHorizontal: 10,
    fontSize: 16,
    color: '#333',
  },
  eyeIcon: {
    padding: 10,
    marginRight: 5,
  },
  errorText: {
    color: '#ff4757',
    fontSize: 14,
    marginBottom: 16,
    alignItems: 'center',
  },
  loginButton: {
    borderRadius: 12,
    shadowColor: '#00cec9',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
    overflow: 'hidden',
    marginTop: 10,
  },
  buttonGradient: {
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  loginButtonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '600',
  },
  signupContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 25,
    marginBottom: 15,
  },
  signupText: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 14,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0.5, height: 0.5 },
    textShadowRadius: 1,
  },
  signupLink: {
    color: '#00cec9',
    fontSize: 14,
    fontWeight: 'bold',
    marginLeft: 5,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0.5, height: 0.5 },
    textShadowRadius: 1,
  },
  securityNote: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  securityNoteText: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 12,
    marginLeft: 5,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0.5, height: 0.5 },
    textShadowRadius: 1,
  },
});