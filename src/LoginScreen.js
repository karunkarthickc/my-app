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
  const [isDarkMode, setIsDarkMode] = useState(true); // Theme state
  const navigation = useNavigation();
  const fadeAnim = useRef(new Animated.Value(0)).current;

  // Fade-in animation and token check
  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 800,
      useNativeDriver: true,
    }).start();

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

  const toggleTheme = () => {
    setIsDarkMode(!isDarkMode);
  };

  // Theme-based styles
  const themeStyles = isDarkMode ? darkStyles : lightStyles;

  return (
    <ScrollView
      style={themeStyles.container}
      contentContainerStyle={{ flexGrow: 1 }}
    >
      <Animated.View style={[themeStyles.mainContainer, { opacity: fadeAnim }]}>
        {/* Theme Toggle Button */}
        <TouchableOpacity style={themeStyles.themeToggle} onPress={toggleTheme}>
          <Icon
            name={isDarkMode ? 'weather-sunny' : 'weather-night'}
            size={24}
            color={isDarkMode ? '#FFFFFF' : '#000000'}
          />
        </TouchableOpacity>

        {/* Header Section */}
        <View style={themeStyles.header}>
          <View style={themeStyles.iconContainer}>
            <Icon name="account-group" size={64} color={isDarkMode ? '#FFFFFF' : '#000000'} />
          </View>
          <Text style={themeStyles.title}>HRMS</Text>
          <Text style={themeStyles.subtitle}>Manage your workforce efficiently</Text>
        </View>

        {/* Login Form */}
        <View style={themeStyles.formContainer}>
          <Text style={themeStyles.formTitle}>Sign In</Text>

          {/* Email Input */}
          <View style={themeStyles.inputContainer}>
            <Text style={themeStyles.label}>Email Address</Text>
            <View style={themeStyles.inputWrapper}>
              <Icon name="email" size={20} color={isDarkMode ? '#FFFFFF' : '#000000'} style={themeStyles.inputIcon} />
              <TextInput
                style={themeStyles.textInput}
                placeholder="Enter your email"
                placeholderTextColor={isDarkMode ? '#A1A1A1' : '#666666'}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                maxLength={30}
              />
            </View>
            {isSubmitted && validateEmail(email).length > 0 && (
              <Text style={themeStyles.errorText}>{validateEmail(email)[0]}</Text>
            )}
          </View>

          {/* Password Input */}
          <View style={themeStyles.inputContainer}>
            <Text style={themeStyles.label}>Password</Text>
            <View style={themeStyles.inputWrapper}>
              <TouchableOpacity
                style={themeStyles.iconButton}
                onPress={togglePasswordVisibility}
              >
                {showPassword ? (
                  <Icon name="lock-open" size={20} color={isDarkMode ? '#FFFFFF' : '#000000'} />
                ) : (
                  <Icon name="lock" size={20} color={isDarkMode ? '#FFFFFF' : '#000000'} />
                )}
              </TouchableOpacity>
              <TextInput
                style={themeStyles.textInput}
                placeholder="Enter your password"
                placeholderTextColor={isDarkMode ? '#A1A1A1' : '#666666'}
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                autoCorrect={false}
                maxLength={20}
              />
            </View>
            {isSubmitted && validatePassword(password).length > 0 && (
              <Text style={themeStyles.errorText}>{validatePassword(password)[0]}</Text>
            )}
          </View>

          {/* Login Button */}
          <TouchableOpacity
            style={[themeStyles.loginButton, isLoading && themeStyles.loginButtonDisabled]}
            onPress={handleSubmit}
            disabled={isLoading}
          >
            <Text style={themeStyles.loginButtonText}>
              {isLoading ? 'Signing In...' : 'Sign In'}
            </Text>
          </TouchableOpacity>
        </View>
      </Animated.View>
    </ScrollView>
  );
};

// Dark Theme Styles
const darkStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  mainContainer: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 40,
  },
  themeToggle: {
    position: 'absolute',
    top: 20,
    right: 20,
    padding: 10,
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  iconContainer: {
    backgroundColor: '#1A1A1A',
    padding: 16,
    borderRadius: 12,
    shadowColor: '#FFFFFF',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
    marginBottom: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 8,
    fontFamily: 'System',
  },
  subtitle: {
    fontSize: 16,
    color: '#D1D5DB',
    textAlign: 'center',
    fontFamily: 'System',
  },
  formContainer: {
    backgroundColor: '#1A1A1A',
    borderRadius: 12,
    shadowColor: '#FFFFFF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
    padding: 24,
  },
  formTitle: {
    fontSize: 26,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 24,
    textAlign: 'center',
    fontFamily: 'System',
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    color: '#D1D5DB',
    fontWeight: '500',
    marginBottom: 8,
    marginLeft: 4,
    fontFamily: 'System',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2A2A2A',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#4A4A4A',
  },
  textInput: {
    flex: 1,
    fontSize: 16,
    color: '#FFFFFF',
    fontFamily: 'System',
    paddingVertical: 0,
  },
  inputIcon: {
    marginRight: 12,
  },
  iconButton: {
    marginRight: 12,
  },
  errorText: {
    color: '#FF4D4D',
    fontSize: 14,
    marginTop: 4,
    marginLeft: 4,
    fontFamily: 'System',
  },
  loginButton: {
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    shadowColor: '#FFFFFF',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  loginButtonDisabled: {
    backgroundColor: '#A1A1A1',
  },
  loginButtonText: {
    color: '#000000',
    fontWeight: '600',
    fontSize: 18,
    fontFamily: 'System',
  },
});

// Light Theme Styles
const lightStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5', // Light gray background
  },
  mainContainer: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 40,
  },
  themeToggle: {
    position: 'absolute',
    top: 20,
    right: 20,
    padding: 10,
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  iconContainer: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
    marginBottom: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: '#000000',
    marginBottom: 8,
    fontFamily: 'System',
  },
  subtitle: {
    fontSize: 16,
    color: '#666666',
    textAlign: 'center',
    fontFamily: 'System',
  },
  formContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
    padding: 24,
  },
  formTitle: {
    fontSize: 26,
    fontWeight: '700',
    color: '#000000',
    marginBottom: 24,
    textAlign: 'center',
    fontFamily: 'System',
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    color: '#333333',
    fontWeight: '500',
    marginBottom: 8,
    marginLeft: 4,
    fontFamily: 'System',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0F0F0',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#D1D5DB',
  },
  textInput: {
    flex: 1,
    fontSize: 16,
    color: '#000000',
    fontFamily: 'System',
    paddingVertical: 0,
  },
  inputIcon: {
    marginRight: 12,
  },
  iconButton: {
    marginRight: 12,
  },
  errorText: {
    color: '#D32F2F',
    fontSize: 14,
    marginTop: 4,
    marginLeft: 4,
    fontFamily: 'System',
  },
  loginButton: {
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#000000', // Black button for light theme
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  loginButtonDisabled: {
    backgroundColor: '#666666',
  },
  loginButtonText: {
    color: '#FFFFFF', // White text on black button
    fontWeight: '600',
    fontSize: 18,
    fontFamily: 'System',
  },
});

export default LoginScreen;