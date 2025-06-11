import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Dimensions,
  Image,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
  ActivityIndicator,
} from 'react-native';
import auth from '../../Appwrite/auth'
import * as SecureStore from 'expo-secure-store';

const { width, height } = Dimensions.get('window');

export default function SignupScreen() {
  const router = useRouter();
  const { role } = useLocalSearchParams();
  
  // Initialize isAdmin based on the role parameter from navigation
  const [isAdmin, setIsAdmin] = useState(role === 'admin');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
 
  const [showPassword, setShowPassword] = useState(false);
  
  const [isUsernameFocused, setIsUsernameFocused] = useState(false);
  const [isEmailFocused, setIsEmailFocused] = useState(false);
  const [isPasswordFocused, setIsPasswordFocused] = useState(false);
  const [formError, setFormError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideUpAnim = useRef(new Animated.Value(50)).current;
  const signupButtonScale = useRef(new Animated.Value(1)).current;
  const switchContainerAnimation = useRef(new Animated.Value(isAdmin ? 1 : 0)).current;

  

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

  useEffect(() => {
    // Animate switch container background when isAdmin changes
    Animated.timing(switchContainerAnimation, {
      toValue: isAdmin ? 1 : 0,
      duration: 300,
      useNativeDriver: false,
    }).start();
  }, [isAdmin]);

  const handleBack = () => {
    router.back();
  };

  const validateForm = () => {
  // Username validation
  if (!username.trim()) {
    setFormError('Please enter a username');
    return false;
  }

  if (username.length < 3) {
    setFormError('Username must be at least 3 characters');
    return false;
  }

  // Email validation - use a more comprehensive regex
  if (!email.trim()) {
    setFormError('Please enter your email');
    return false;
  }

  // More comprehensive email validation regex
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  if (!emailRegex.test(email)) {
    setFormError('Please enter a valid email (e.g., user@example.com)');
    return false;
  }

  // Password validation
  if (!password.trim()) {
    setFormError('Please enter a password');
    setIsLoading(false);
    return false;
  }

  if (password.length < 8) {
    setFormError('Password must be at least 8 characters');
    setIsLoading(false);
    return false;
  }

  setFormError('');
  return true;
};

  // Change this part of your handleSignup function
const handleSignup = async () => {
setFormError('');
  setIsLoading(true);
  
  if (!validateForm()) {
    setIsLoading(false);
    return;
  }
  
  // Button press animation
  Animated.sequence([
    Animated.timing(signupButtonScale, {
      toValue: 0.95,
      duration: 100,
      useNativeDriver: true,
    }),
    Animated.timing(signupButtonScale, {
      toValue: 1,
      duration: 100,
      useNativeDriver: true,
    })
  ]).start(async() => {
    // Handle signup logic here
    console.log('Signup with:', { username, email, password, isAdmin });

   try {
  if (isAdmin) {
    console.log("Attempting to create admin account...");
    const createAdminAccount = await auth.createAdminAccount({
      username, 
      email: email.trim().toLowerCase(), // Format email before sending
      password
    });
    
    if (!createAdminAccount) {
      setFormError('Failed to create admin account. Please try again.');
      setIsLoading(false);
      return;
    }
    
    setIsLoading(false);
    setFormError('');
    console.log("Admin account created successfully:", createAdminAccount);
    // Navigate to admin dashboard
    router.push('/AdminBusinessInfo');

    await SecureStore.setItemAsync("role", isAdmin ? "admin" : "user");


  } else {
    // Handle regular user signup
    console.log("Attempting to create user account...");
    const createUserAccount = await auth.createUserAccount({
      username, 
      email: email.trim().toLowerCase(), // Format email before sending
      password
    });
    if (!createUserAccount) {
      setFormError('Failed to create user account. Please try again.');
      setIsLoading(false);
      return;
    }
    setIsLoading(false);
    setFormError('');
    console.log("User account created successfully:", createUserAccount);
    // Navigate to user dashboard
    router.push('/UserLoginScreen');

    await SecureStore.setItemAsync("role", isAdmin ? "admin" : "user");
  }
} catch (error) {
  console.error('Signup error:', error);
  // Display a more user-friendly error message
  if (error.message.includes("email")) {
    setFormError('Please enter a valid email address (e.g., user@example.com)');
  } else {
    setFormError(error.message || 'Account creation failed. Please try again.');
  }
}
finally{
    setIsLoading(false);
}


  });
};

  const handleLogin = () => {
    // Navigate to login
    router.push(isAdmin ? '/AdminLoginScreen' : '/UserLoginScreen');
  };

  // Interpolate background color for switch container
  const switchBgColor = switchContainerAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: ['rgba(0, 0, 40, 0.3)', 'rgba(0, 0, 0, 0.3)']
  });

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
        colors={
          isAdmin 
            ? ['rgba(108, 52, 131, 0.85)', 'rgba(142, 68, 173, 0.85)', 'rgba(108, 52, 131, 0.85)'] 
            : ['rgba(142, 68, 173, 0.85)', 'rgba(155, 89, 182, 0.85)', 'rgba(142, 68, 173, 0.85)']
        }
        start={{x: 0, y: 0}}
        end={{x: 1, y: 1}}
        opacity={0.15}
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
                {isAdmin && (
                  <View style={styles.adminBadge}>
                    <Ionicons name="shield-checkmark" size={20} color="#fff" />
                    <Text style={styles.adminBadgeText}>ADMIN REGISTRATION</Text>
                  </View>
                )}
                <Text style={styles.headerTitle}>Create Account</Text>
                <Text style={styles.headerSubtitle}>
                  {isAdmin 
                    ? 'Register as an administrator' 
                    : 'Join Beauty & Fitness Nearby'}
                </Text>
              </View>
              
              <Animated.View 
                style={[
                  styles.switchContainer,
                  {
                    backgroundColor: switchBgColor
                  }
                ]}
              >
                <Text style={[
                  styles.switchLabel, 
                  !isAdmin && styles.switchLabelActive
                ]}>
                  User
                </Text>
                <Switch
                  value={isAdmin}
                  onValueChange={setIsAdmin}
                  trackColor={{ false: 'rgba(255, 255, 255, 0.3)', true: 'rgba(255, 255, 255, 0.3)' }}
                  thumbColor={isAdmin ? '#00cec9' : '#f8c291'}
                  ios_backgroundColor="rgba(255, 255, 255, 0.3)"
                  style={styles.switch}
                />
                <Text style={[
                  styles.switchLabel,
                  isAdmin && styles.switchLabelActive
                ]}>
                  Admin
                </Text>
              </Animated.View>
              
              <View style={styles.formContainer}>
                <View style={[
                  styles.inputContainer,
                  isUsernameFocused && styles.inputContainerFocused
                ]}>
                  <Ionicons 
                    name="person-outline" 
                    size={22} 
                    color={isUsernameFocused ? "#00cec9" : "#8e44ad"} 
                    style={styles.inputIcon} 
                  />
                  <TextInput
                    style={styles.input}
                    placeholder="Username"
                    placeholderTextColor="#999"
                    value={username}
                    onChangeText={setUsername}
                    autoCapitalize="none"
                    onFocus={() => setIsUsernameFocused(true)}
                    onBlur={() => setIsUsernameFocused(false)}
                  />
                </View>
                
                <View style={[
                  styles.inputContainer,
                  isEmailFocused && styles.inputContainerFocused
                ]}>
                  <Ionicons 
                    name="mail-outline" 
                    size={22} 
                    color={isEmailFocused ? "#00cec9" : "#8e44ad"} 
                    style={styles.inputIcon} 
                  />
                  <TextInput
                    style={styles.input}
                    placeholder="Email Address"
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
                
                <Animated.View style={{ transform: [{ scale: signupButtonScale }] }}>
                  <TouchableOpacity 
                    style={styles.signupButton} 
                    onPress={handleSignup}
                    activeOpacity={0.8}
                    disabled={isLoading}

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
                        {isAdmin && (
                          <Ionicons name="shield-checkmark-outline" size={20} color="#fff" style={{marginRight: 8}} />
                        )}
                        <Text style={styles.signupButtonText}>
                          {isAdmin ? 'Register as Admin' : 'Create Account'}
                        </Text>
                      </>
                    )}
                      
                    </LinearGradient>
                  </TouchableOpacity>
                </Animated.View>
                
                <View style={styles.loginContainer}>
                  <Text style={styles.loginText}>Already have an account?</Text>
                  <TouchableOpacity onPress={handleLogin}>
                    <Text style={styles.loginLink}>Log In</Text>
                  </TouchableOpacity>
                </View>
                
                {isAdmin && (
                  <View style={styles.securityNote}>
                    <Ionicons name="information-circle-outline" size={14} color="rgba(255, 255, 255, 0.7)" />
                    <Text style={styles.securityNoteText}>
                      Admin accounts require approval
                    </Text>
                  </View>
                )}
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
    marginBottom: 20,
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
  switchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 30,
    paddingVertical: 8,
    paddingHorizontal: 15,
    marginBottom: 25,
    alignSelf: 'center',
  },
  switchLabel: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 14,
    fontWeight: '500',
    paddingHorizontal: 10,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0.5, height: 0.5 },
    textShadowRadius: 1,
  },
  switchLabelActive: {
    color: '#ffffff',
    fontWeight: 'bold',
  },
  switch: {
    transform: [{ scaleX: 0.8 }, { scaleY: 0.8 }],
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
  signupButton: {
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
  signupButtonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '600',
  },
  loginContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 25,
    marginBottom: 15,
  },
  loginText: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 14,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0.5, height: 0.5 },
    textShadowRadius: 1,
  },
  loginLink: {
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