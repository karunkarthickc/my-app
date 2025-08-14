import React, { useState, useEffect, useRef } from 'react';
import { View, Image, PermissionsAndroid, Platform, Text, StyleSheet, Animated } from 'react-native';
import { Button, HelperText, DefaultTheme, configureFonts } from 'react-native-paper';
import { Camera, useCameraDevice } from 'react-native-vision-camera';
import Geolocation from 'react-native-geolocation-service';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Toast from 'react-native-toast-message';
import api from './api';
import moment from 'moment';
import axios from 'axios';

// Theme and styles remain unchanged
const theme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: '#1B263B',
    accent: '#FFFFFF',
    background: '#F8FAFC',
    text: '#1B263B',
    surface: '#FFFFFF',
    error: '#D32F2F',
    success: '#2E7D32',
    punchIn: '#4CAF50', // Green for punch in
    punchOut: '#F44336', // Red for punch out
    disabled: '#B0BEC5', // Grey for disabled buttons
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
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
    backgroundColor: theme.colors.primary,
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  headerTextContainer: {
    flex: 1,
  },
  greeting: {
    fontSize: 22,
    fontWeight: '700',
    color: theme.colors.accent,
  },
  name: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.accent,
    marginTop: 4,
  },
  designation: {
    fontSize: 14,
    color: theme.colors.accent,
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
    borderColor: theme.colors.accent,
  },
  employeeId: {
    fontSize: 12,
    color: theme.colors.accent,
    opacity: 0.7,
    marginTop: 4,
  },
  statusCard: {
    backgroundColor: theme.colors.surface,
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  statusText: {
    fontSize: 14,
    color: theme.colors.text,
    marginBottom: 4,
  },
  imageContainer: {
    width: '100%',
    height: 300,
    borderRadius: 16,
    backgroundColor: '#E5E7EB',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#E0E0E0',
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
    color: theme.colors.text,
    opacity: 0.5,
  },
  locationText: {
    fontSize: 14,
    color: theme.colors.text,
    textAlign: 'center',
    marginBottom: 12,
    fontWeight: '500',
  },
  errorText: {
    color: theme.colors.error,
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
    backgroundColor: theme.colors.punchIn,
  },
  punchOutButton: {
    backgroundColor: theme.colors.punchOut,
  },
  disabledButton: {
    backgroundColor: theme.colors.disabled,
    opacity: 0.5,
  },
  buttonLabel: {
    fontSize: 16,
    fontWeight: '600',
    paddingVertical: 6,
    color: theme.colors.accent,
  },
  timerText: {
    fontSize: 16,
    color: theme.colors.primary,
    textAlign: 'center',
    marginBottom: 12,
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
  const [userData, setUserData] = useState(null); // State to store user data
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
          // Store email in AsyncStorage for submitAttendance
          await AsyncStorage.setItem('user_email', response.data.data.email);
        } else {
          showToast('error', 'Error', 'Failed to fetch user data.');
        }
      } catch (err) {
        console.warn('Fetch user data error:', err);
        showToast('error', 'Error', 'Failed to fetch user data.');
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
      showToast('error', 'Error', 'Failed to fetch attendance status.');
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
    Toast.show({
      type,
      text1,
      text2,
      position: 'top',
      visibilityTime: 4000,
      autoHide: true,
      topOffset: 30,
    });
  };

  const takePhoto = async (callback) => {
  if (!hasCameraPermission) {
    showToast('error', 'Permission Denied', 'Camera permission is required.');
    return;
  }
  if (!camera.current || !isCameraReady) {
    showToast('error', 'Camera Error', 'Camera is not ready.');
    return;
  }
  try {
    const photo = await camera.current.takePhoto({
      flash: 'off',
      enableShutterSound: true,
      quality: 0.5, // Reduce quality to match API expectations and reduce payload size
    });
    console.log('Photo captured:', photo);
    const uri = `file://${photo.path}`;
    setImageUri(uri);

    // Fetch the photo file as a blob
    const response = await fetch(uri);
    const blob = await response.blob();

    // Convert blob to base64
    const base64 = await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = (error) => reject(error);
      reader.readAsDataURL(blob);
    });

    console.log('Base64 generated:', base64.substring(0, 30) + '...'); // Log first 30 chars for verification
    setImageBase64(base64); // Update state for UI
    callback(base64); // Pass base64 to callback
  } catch (error) {
    console.error('Error capturing or converting photo:', error);
    showToast('error', 'Error', 'Failed to capture or convert photo.');
  }
};

const getLocation = async (callback, base64) => {
  if (hasLocationPermission) {
    Geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        const newLocation = { latitude, longitude };
        setLocation(newLocation);
        const address = await getAddressFromCoordinates(latitude, longitude);
        setLocationName(address);
        console.log('Location and address:', newLocation, address);
        callback(base64, newLocation, address); // Pass base64, location, and address
      },
      (error) => {
        console.warn('Geolocation error:', error);
        showToast('error', 'Error', 'Failed to get location.');
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 10000 }
    );
  } else {
    showToast('error', 'Permission Denied', 'Location permission is required.');
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
    if (response.data.status) {
      showToast('success', 'Success', response.data.message);
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
      showToast('error', 'Error', response.data.message || 'Failed to submit attendance.');
    }
  } catch (err) {
    console.error('Submit attendance error:', {
      message: err.message,
      status: err.response?.status,
      data: err.response?.data,
    });
    showToast('error', 'Error', err.response?.data?.message || 'Failed to submit attendance.');
  } finally {
    setIsLoading(false);
  }
};

const handlePunchIn = () => {
  takePhoto((base64) => getLocation((base64, location, locationName) => submitAttendance(0, base64, location, locationName)));
};

const handlePunchOut = () => {
  takePhoto((base64) => getLocation((base64, location, locationName) => submitAttendance(1, base64, location, locationName)));
};



  if (hasCameraPermission === null || hasLocationPermission === null || userData === null) {
    return <Text>Loading...</Text>;
  }

  if (!hasCameraPermission) {
    return <Text>Camera permission not granted</Text>;
  }

  if (!device) {
    return <Text>No front camera device available</Text>;
  }

  return (
    <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
      <View style={styles.contentContainer}>
        <View>
          <View style={styles.header}>
            <View style={styles.headerTextContainer}>
              <Text style={styles.greeting}>{getGreeting()}</Text>
              <Text style={styles.name}>{`${userData.first_name} ${userData.last_name}`}</Text>
              <Text style={styles.designation}>{userData.employee.designation}</Text>
            </View>
            <View style={styles.profileContainer}>
              <Image
                source={{ uri: userData.profile_image_url || 'https://via.placeholder.com/60' }}
                style={styles.logo}
              />
              <Text style={styles.employeeId}>{userData.employee_id}</Text>
            </View>
          </View>
          {/* <View style={styles.statusCard}>
            <Text style={styles.statusText}>
              Punch In: 
            </Text>
            <Text style={styles.statusText}>
              Punch Out:
            </Text>
          </View> */}
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
              
              style={[styles.button, styles.punchInButton, hasPunchedIn && styles.disabledButton]}
              labelStyle={styles.buttonLabel}
              loading={isLoading && !hasPunchedIn}
            >
              Punch In
            </Button>
            <Button
              mode="contained"
              onPress={handlePunchOut}
             
              style={[styles.button, styles.punchOutButton, !hasPunchedIn && styles.disabledButton]}
              labelStyle={styles.buttonLabel}
              loading={isLoading && hasPunchedIn}
            >
              Punch Out
            </Button>
          </View>
        </View>
      </View>
    </Animated.View>
  );
};

export default PunchInScreen; 