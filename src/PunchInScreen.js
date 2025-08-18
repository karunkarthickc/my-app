import React, { useState, useEffect, useRef } from 'react';
import { View, Image, PermissionsAndroid, Platform, Text, StyleSheet, Animated, ActivityIndicator, Modal } from 'react-native';
import { Button, HelperText, DefaultTheme, configureFonts } from 'react-native-paper';
import { Camera, useCameraDevice } from 'react-native-vision-camera';
import Geolocation from 'react-native-geolocation-service';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Toast from 'react-native-toast-message';
import api from './api';
import moment from 'moment';
import axios from 'axios';

// Theme (unchanged)
const theme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: '#000000', // Black
    accent: '#FFFFFF', // White
    background: '#F5F5F5', // Light gray
    text: '#FFFFFF', // White
    surface: '#E0E0E0', // Light gray
    error: '#B00020', // Red for errors
    success: '#4CAF50', // Green for success
    punchIn: '#333333', // Dark gray for punch in
    punchOut: '#333333', // Medium gray for punch out
    disabled: '#B0B0B0', // Light gray for disabled
  },
  fonts: configureFonts({
    default: {
      regular: { suffix: 'regular', fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto', fontWeight: '400' },
      medium: { suffix: 'medium', fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto', fontWeight: '500' },
      bold: { suffix: 'bold', fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto', fontWeight: '700' },
      light: { suffix: 'light', fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto', fontWeight: '300' },
    },
  }),
};

// Styles (updated to include loader styles)
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background, // Light gray
    padding: 20,
  },
  contentContainer: {
    flex: 1,
    justifyContent: 'space-between',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: theme.colors.primary, // Black
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 3,
  },
  headerTextContainer: {
    flex: 1,
  },
  greeting: {
    fontSize: 22,
    fontWeight: '700',
    color: theme.colors.accent, // White
  },
  name: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.accent, // White
    marginTop: 4,
  },
  designation: {
    fontSize: 14,
    color: theme.colors.accent, // White
    opacity: 0.8,
    marginTop: 2,
  },
  profileContainer: {
    alignItems: 'center',
  },
  logo: {
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 2,
    borderColor: theme.colors.accent, // White
  },
  employeeId: {
    fontSize: 12,
    color: theme.colors.accent, // White
    opacity: 0.7,
    marginTop: 4,
  },
  statusCard: {
    backgroundColor: theme.colors.surface, // Light gray
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 3,
  },
  statusText: {
    fontSize: 14,
    color: theme.colors.text, // White
    marginBottom: 4,
  },
  imageContainer: {
    width: '100%',
    height: 300,
    borderRadius: 16,
    backgroundColor: '#D3D3D3', // Lighter gray
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#B0B0B0', // Light gray
  },
  camera: {
    width: '100%',
    height: '100%',
  },
  image: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  placeholderText: {
    fontSize: 14,
    color: theme.colors.text, // White
    opacity: 0.5,
  },
  locationText: {
    fontSize: 14,
    color: theme.colors.text, // White
    textAlign: 'center',
    marginBottom: 12,
    fontWeight: '500',
  },
  errorText: {
    color: theme.colors.error, // Red
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 12,
  },
  buttonContainer: {
    width: '100%',
    paddingBottom: 20,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  button: {
    flex: 1,
    borderRadius: 6,
    paddingVertical: 2,
  },
  punchInButton: {
    backgroundColor: theme.colors.punchIn, // Dark gray
  },
  punchOutButton: {
    backgroundColor: theme.colors.punchOut, // Medium gray
  },
  disabledButton: {
    backgroundColor: theme.colors.disabled, // Light gray
    opacity: 0.5,
  },
  buttonLabel: {
    fontSize: 16,
    fontWeight: '600',
    paddingVertical: 6,
    color: theme.colors.accent, // White
  },
  timerText: {
    fontSize: 16,
    color: theme.colors.primary, // Black
    textAlign: 'center',
    marginBottom: 12,
    fontWeight: '500',
  },
  // New loader styles
  loaderContainer: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)', // Semi-transparent black overlay
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000, // Ensure loader is on top
  },
  loaderText: {
    color: theme.colors.accent, // White
    fontSize: 16,
    marginTop: 10,
    fontWeight: '500',
  },
});

const PunchInScreen = () => {
  const device = useCameraDevice('front');
  const camera = useRef(null);
  const [hasCameraPermission, setHasCameraPermission] = useState(null);
  const [hasLocationPermission, setHasLocationPermission] = useState(null);
  const [isCameraReady, setIsCameraReady] = useState(false);
  const [imageUri, setImageUri] = useState(null);
  const [imageBase64, setImageBase64] = useState(null);
  const [location, setLocation] = useState(null);
  const [locationName, setLocationName] = useState('');
  const [hasPunchedIn, setHasPunchedIn] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [timer, setTimer] = useState(0);
  const [punchInTime, setPunchInTime] = useState(null);
  const [userData, setUserData] = useState(null);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  const getGreeting = () => {
    const hour = moment().hour();
    if (hour < 12) return 'Good Morning';
    if (hour < 17) return 'Good Afternoon';
    return 'Good Evening';
  };

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 800,
      useNativeDriver: true,
    }).start();

    const requestPermissions = async () => {
      try {
        const cameraPermission = await Camera.requestCameraPermission();
        setHasCameraPermission(cameraPermission === 'granted');
        if (Platform.OS === 'android') {
          const grantedLocation = await PermissionsAndroid.request(
            PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
            {
              title: 'Location Permission',
              message: 'App needs access to your location for punch in/out.',
              buttonNeutral: 'Ask Me Later',
              buttonNegative: 'Cancel',
              buttonPositive: 'OK',
            }
          );
          setHasLocationPermission(grantedLocation === PermissionsAndroid.RESULTS.GRANTED);
        } else {
          const result = await Geolocation.requestAuthorization('whenInUse');
          setHasLocationPermission(result === 'granted');
        }
      } catch (err) {
        console.warn(err);
        showToast('error', 'Permission Error', 'Failed to request permissions.');
      }
    };

    const fetchUserData = async () => {
      try {
        const response = await api.get('/user/view');
        console.log('User data response:', response.data);
        if (response.data.status) {
          setUserData(response.data.data);
          await AsyncStorage.setItem('user_email', response.data.data.email);
        } else {
          showToast('error', 'Error', response.data.message || 'Failed to fetch user data.');
        }
      } catch (err) {
        console.warn('Fetch user data error:', err);
        showToast('error', 'Error', err.response?.data?.message || 'Failed to fetch user data.');
      }
    };

    requestPermissions();
    fetchUserData();
    fetchAttendanceStatus();

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, []);

  const timerRef = useRef(null);

  const onCameraInitialized = () => {
    console.log('Camera initialized');
    setIsCameraReady(true);
  };

  const onCameraError = (error) => {
    console.error('Camera error:', error);
    showToast('error', 'Camera Error', 'Failed to initialize camera.');
  };

  const getAddressFromCoordinates = async (latitude, longitude) => {
    try {
      const response = await axios.get(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`
      );
      const address = response.data.display_name || 'Unknown Address';
      console.log('Resolved Address:', address);
      return address;
    } catch (err) {
      console.warn('Reverse Geocoding Error:', err);
      return 'Unknown Address';
    }
  };

  const fetchAttendanceStatus = async () => {
    try {
      const response = await api.get('/attendance/');
      console.log('Attendance status response:', response.data);
      const { results } = response.data;
      if (results && results.length > 0) {
        const latestRecord = results[0];
        if (latestRecord.punch_in_time && !latestRecord.punch_out_time) {
          setHasPunchedIn(true);
          const punchInDateTime = moment(
            `${latestRecord.date} ${latestRecord.punch_in_time}`,
            'YYYY-MM-DD HH:mm:ss'
          ).valueOf();
          setPunchInTime(punchInDateTime);
          startTimer(punchInDateTime);
          await AsyncStorage.setItem('punchInTime', punchInDateTime.toString());
        } else {
          setHasPunchedIn(false);
          setPunchInTime(null);
          setTimer(0);
          await AsyncStorage.removeItem('punchInTime');
        }
      }
    } catch (err) {
      console.warn(err);
      showToast('error', 'Error', err.response?.data?.message || 'Failed to fetch attendance status.');
    }
  };

  const startTimer = (startTime) => {
    const updateTimer = () => {
      const now = Date.now();
      const elapsed = Math.floor((now - startTime) / 1000);
      setTimer(elapsed);
    };
    updateTimer();
    timerRef.current = setInterval(updateTimer, 1000);
  };

  const formatTime = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes
      .toString()
      .padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const showToast = (type, text1, text2) => {
    console.log('Showing toast:', { type, text1, text2 }); // Debug log
    Toast.show({
      type,
      text1,
      text2,
      position: 'top',
      visibilityTime: 4000,
      autoHide: true,
      topOffset: 50,
      text1Style: { fontSize: 16, fontWeight: 'bold' },
      text2Style: { fontSize: 14 },
    });
  };

  const takePhoto = async () => {
    if (!hasCameraPermission) {
      showToast('error', 'Permission Denied', 'Camera permission is required.');
      return null;
    }
    if (!camera.current || !isCameraReady) {
      showToast('error', 'Camera Error', 'Camera is not ready.');
      return null;
    }
    try {
      const photo = await camera.current.takePhoto({
        flash: 'off',
        enableShutterSound: true,
        quality: 0.5,
      });
      console.log('Photo captured:', photo);
      const uri = `file://${photo.path}`;
      setImageUri(uri);

      const response = await fetch(uri);
      const blob = await response.blob();

      const base64 = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = (error) => reject(error);
        reader.readAsDataURL(blob);
      });

      console.log('Base64 generated:', base64.substring(0, 30) + '...');
      setImageBase64(base64);
      return base64;
    } catch (error) {
      console.error('Error capturing or converting photo:', error);
      showToast('error', 'Error', 'Failed to capture or convert photo.');
      return null;
    }
  };

  const getLocation = async () => {
    if (!hasLocationPermission) {
      showToast('error', 'Permission Denied', 'Location permission is required.');
      return null;
    }
    try {
      const position = await new Promise((resolve, reject) => {
        Geolocation.getCurrentPosition(
          (pos) => resolve(pos),
          (error) => reject(error),
          { enableHighAccuracy: true, timeout: 15000, maximumAge: 10000 }
        );
      });
      const { latitude, longitude } = position.coords;
      const newLocation = { latitude, longitude };
      setLocation(newLocation);
      const address = await getAddressFromCoordinates(latitude, longitude);
      setLocationName(address);
      console.log('Location and address:', newLocation, address);
      return { location: newLocation, address };
    } catch (error) {
      console.warn('Geolocation error:', error);
      showToast('error', 'Error', 'Failed to get location.');
      return null;
    }
  };

  const submitAttendance = async (flag, base64, location, locationName) => {
    console.log('submitAttendance called with flag:', flag, 'base64:', !!base64, 'location:', !!location, 'locationName:', !!locationName);
    if (!base64 || !location || !locationName) {
      console.log('Missing base64, location, or locationName');
      showToast('error', 'Missing Data', 'Please capture an image and allow location access.');
      return;
    }
    setIsLoading(true);
    setError('');
    try {
      const email = await AsyncStorage.getItem('user_email');
      console.log('Retrieved email:', email);
      const currentTime = moment().format('HH:mm:ss');
      const currentDate = moment().format('YYYY-MM-DD');
      const data = {
        email,
        date: currentDate,
        flag,
        ...(flag === 0 && {
          punch_in_time: currentTime,
          punch_in_location: locationName,
          punch_in_image: base64,
        }),
        ...(flag === 1 && {
          punch_out_time: currentTime,
          punch_out_location: locationName,
          punch_out_image: base64,
        }),
      };
      console.log('Submitting attendance to URL:', api.defaults.baseURL + '/attendance/', 'with data:', data);
      const response = await api.post('/attendance/', data);
      console.log('Submit attendance response:', response.data);

      // Handle API response
      if (response.data.status) {
        showToast('success', 'Success', response.data.message || 'Attendance recorded successfully.');
        if (flag === 0) {
          setHasPunchedIn(true);
          const punchInDateTime = moment().valueOf();
          setPunchInTime(punchInDateTime);
          startTimer(punchInDateTime);
          await AsyncStorage.setItem('punchInTime', punchInDateTime.toString());
        } else {
          setHasPunchedIn(false);
          setPunchInTime(null);
          setTimer(0);
          await AsyncStorage.removeItem('punchInTime');
        }
        setImageUri(null);
        setImageBase64(null);
        setLocation(null);
        setLocationName('');
      } else {
        console.log('API error response:', response.data);
        showToast('error', 'Error', response.data.message || 'Failed to submit attendance.');
      }
    } catch (err) {
      console.error('Submit attendance error:', {
        message: err.message,
        status: err.response?.status,
        data: err.response?.data,
      });
      const errorMessage = err.response?.data?.message || 'Failed to submit attendance. Please try again.';
      showToast('error', 'Error', errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePunchIn = async () => {
    setIsLoading(true);
    const base64 = await takePhoto();
    if (!base64) {
      setIsLoading(false);
      return;
    }
    const locationData = await getLocation();
    if (!locationData) {
      setIsLoading(false);
      return;
    }
    const { location, address } = locationData;
    console.log('Calling submitAttendance for punch in');
    await submitAttendance(0, base64, location, address);
  };

  const handlePunchOut = async () => {
    setIsLoading(true);
    const base64 = await takePhoto();
    if (!base64) {
      setIsLoading(false);
      return;
    }
    const locationData = await getLocation();
    if (!locationData) {
      setIsLoading(false);
      return;
    }
    const { location, address } = locationData;
    console.log('Calling submitAttendance for punch out');
    await submitAttendance(1, base64, location, address);
  };

  if (hasCameraPermission === null || hasLocationPermission === null || userData === null) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={styles.loaderText}>Loading...</Text>
      </View>
    );
  }

  if (!hasCameraPermission) {
    return <Text>Camera permission not granted</Text>;
  }

  if (!device) {
    return <Text>No front camera device available</Text>;
  }

  return (
    <>
      <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
        <View style={styles.contentContainer}>
          <View>
            <View style={styles.header}>
              <View style={styles.headerTextContainer}>
                <Text style={styles.greeting}>
                  {getGreeting()},<Text style={styles.name}> {userData.first_name} </Text>
                </Text>
              </View>
              <View style={styles.profileContainer}>
                <Image
                  source={{ uri: userData.profile_image_url || 'https://via.placeholder.com/60' }}
                  style={styles.logo}
                />
              </View>
            </View>
            <Text style={styles.timerText}>
              {hasPunchedIn ? 'Punched In' : 'Punched Out'}: {formatTime(timer)}
            </Text>
            <View style={styles.imageContainer}>
              {imageUri ? (
                <Image source={{ uri: imageUri }} style={styles.image} />
              ) : (
                <Camera
                  ref={camera}
                  style={styles.camera}
                  device={device}
                  isActive={true}
                  photo={true}
                  onInitialized={onCameraInitialized}
                  onError={onCameraError}
                />
              )}
            </View>
            {locationName && <Text style={styles.locationText}>{locationName}</Text>}
            {error ? <HelperText type="error" style={styles.errorText}>{error}</HelperText> : null}
          </View>
          <View style={styles.buttonContainer}>
            <View style={styles.buttonRow}>
              <Button
                mode="contained"
                onPress={handlePunchIn}
                style={[styles.button, styles.punchInButton]}
                labelStyle={styles.buttonLabel}
                loading={isLoading && !hasPunchedIn}
                disabled={isLoading}
              >
                Punch In
              </Button>
              <Button
                mode="contained"
                onPress={handlePunchOut}
                style={[styles.button, styles.punchOutButton]}
                labelStyle={styles.buttonLabel}
                loading={isLoading && hasPunchedIn}
                disabled={isLoading}
              >
                Punch Out
              </Button>
              {/* Temporary test button for debugging toast */}
       {/*        <Button
                mode="contained"
                onPress={() => showToast('success', 'Test', 'This is a test toast.')}
                style={styles.button}
                labelStyle={styles.buttonLabel}
              >
                Test Toast
              </Button> */}
            </View>
          </View>
        </View>
        {isLoading && (
          <View style={styles.loaderContainer}>
            <ActivityIndicator size="large" color={theme.colors.primary} />
            <Text style={styles.loaderText}>Processing...</Text>
          </View>
        )}
      </Animated.View>
      <Toast />
    </>
  );
};

export default PunchInScreen;