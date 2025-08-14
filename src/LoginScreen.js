import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Animated,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import api from './api';

const LoginScreen = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const navigation = useNavigation();
  const fadeAnim = useRef(new Animated.Value(0)).current;

  // Fade-in animation
  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 1000,
      useNativeDriver: true,
    }).start();

    // Check if user is already logged in
    const checkToken = async () => {
      const accessToken = await AsyncStorage.getItem('access_token');
      if (accessToken) {
        navigation.navigate('Punch');
      }
    };
    checkToken();
  }, [navigation]);

  // Validation rules
  const validateEmail = (email) => {
    const errors = [];
    if (!email) {
      errors.push('Email is required');
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errors.push('Please enter a valid email address');
    }
    return errors;
  };

  const validatePassword = (password) => {
    const errors = [];
    if (!password) {
      errors.push('Password is required');
    } else if (password.length < 6) {
      errors.push('Password must be at least 6 characters');
    }
    return errors;
  };

  const handleSubmit = async () => {
    setError('');
    setIsSubmitted(true);
    const emailErrors = validateEmail(email);
    const passwordErrors = validatePassword(password);

    if (emailErrors.length > 0 || passwordErrors.length > 0) {
      setError(emailErrors[0] || passwordErrors[0] || 'Please fix the errors in the form.');
      return;
    }

    setIsLoading(true);

    try {
      const loginResponse = await api.post('login/', {
        email,
        password,
      });
      if (loginResponse.data.status) {
        const { access_token, refresh_token, email } = loginResponse.data.data;
        await AsyncStorage.setItem('access_token', access_token);
        await AsyncStorage.setItem('refresh_token', refresh_token);
        await AsyncStorage.setItem('user_email', email);
        navigation.navigate('Punch');
      } else {
        setError(loginResponse.data.message || 'Login failed. Please try again.');
      }
    } catch (err) {
      const errorResponse = err;
      setError(
        errorResponse.response?.data?.message || 'Invalid email or password. Please try again.'
      );
      if (errorResponse.response?.status === 401 || errorResponse.response?.status === 403) {
        await AsyncStorage.multiRemove(['access_token', 'refresh_token', 'user_email']);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{ flexGrow: 1 }}
    >
      <Animated.View style={[styles.mainContainer, { opacity: fadeAnim }]}>
        {/* Header Section */}
        <View style={styles.header}>
          <View style={styles.iconContainer}>
            <Icon name="account-group" size={64} color="#0D9488" />
          </View>
          <Text style={styles.title}>HRMS</Text>
          <Text style={styles.subtitle}>Manage your workforce efficiently</Text>
        </View>

        {/* Login Form */}
        <View style={styles.formContainer}>
          <Text style={styles.formTitle}>Sign In</Text>

          {/* Email Input */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Email Address</Text>
            <View style={styles.inputWrapper}>
              <Icon name="email" size={20} color="#0D9488" style={styles.inputIcon} />
              <TextInput
                style={styles.textInput}
                placeholder="Enter your email"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                maxLength={30}
              />
            </View>
            {isSubmitted && validateEmail(email).length > 0 && (
              <Text style={styles.errorText}>{validateEmail(email)[0]}</Text>
            )}
          </View>

          {/* Password Input */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Password</Text>
            <View style={styles.inputWrapper}>
              <TouchableOpacity
                style={styles.iconButton}
                onPress={togglePasswordVisibility}
              >
                {showPassword ? (
                  <Icon name="lock-open" size={20} color="#0D9488" />
                ) : (
                  <Icon name="lock" size={20} color="#0D9488" />
                )}
              </TouchableOpacity>
              <TextInput
                style={styles.textInput}
                placeholder="Enter your password"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                autoCorrect={false}
                maxLength={20}
              />
            </View>
            {isSubmitted && validatePassword(password).length > 0 && (
              <Text style={styles.errorText}>{validatePassword(password)[0]}</Text>
            )}
          </View>

        

          {/* Login Button */}
          <TouchableOpacity
            style={[styles.loginButton, isLoading && styles.loginButtonDisabled]}
            onPress={handleSubmit}
            disabled={isLoading}
          >
            <Text style={styles.loginButtonText}>
              {isLoading ? 'Signing In...' : 'Sign In'}
            </Text>
          </TouchableOpacity>

          {/* Forgot Password */}
          {/* <View style={styles.forgotPasswordContainer}>
            <TouchableOpacity>
              <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
            </TouchableOpacity>
          </View> */}
        </View>

        {/* Footer */}
        {/* <View style={styles.footer}>
          <Text style={styles.footerText}>
            By signing in, you agree to our Terms of Service and Privacy Policy
          </Text>
        </View> */}
      </Animated.View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F0FDFA', // Light teal background
  },
  mainContainer: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 32,
    paddingVertical: 48,
  },
  header: {
    alignItems: 'center',
    marginBottom: 48,
  },
  iconContainer: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    marginBottom: 24,
  },
  title: {
    fontSize: 30,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
  },
  formContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
    elevation: 8,
    padding: 24,
  },
  formTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 24,
    textAlign: 'center',
  },
  inputContainer: {
    marginBottom: 16,
  },
  label: {
    fontSize: 16,
    color: '#374151',
    fontWeight: '500',
    marginBottom: 8,
    marginLeft: 4,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 12, // Increased paddingVertical for more space
    borderWidth: 1,
    borderColor: '#D1D5DB',
  },
  textInput: {
    flex: 1,
    fontSize: 16,
    color: '#1F2937',
    // Remove fixed height to allow dynamic sizing
    // Alternatively, increase height if needed, e.g., height: 40
    paddingVertical: 0, // Ensure no extra internal padding
  },
  inputIcon: {
    marginRight: 12,
  },
  
  iconButton: {
    marginRight: 12,
  },
  errorText: {
    color: '#DC2626',
    fontSize: 14,
    marginTop: 4,
    marginLeft: 4,
  },
  loginButton: {
    paddingVertical: 16,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0D9488',
  },
  loginButtonDisabled: {
    backgroundColor: '#4D7C0F',
  },
  loginButtonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 18,
  },
  forgotPasswordContainer: {
    marginTop: 24,
    alignItems: 'center',
  },
  forgotPasswordText: {
    color: '#0D9488',
    fontWeight: '500',
    fontSize: 16,
  },
  footer: {
    marginTop: 32,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
  },
});

export default LoginScreen;