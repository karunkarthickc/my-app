import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Alert } from 'react-native';
import { Camera, useCameraDevice } from 'react-native-vision-camera';
import Biometrics from 'react-native-biometrics';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Toast from 'react-native-toast-message';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F5F5', // Light gray
  },
  imageContainer: {
    width: 300,
    height: 400,
    borderRadius: 16,
    backgroundColor: '#D3D3D3', // Lighter gray
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    overflow: 'hidden',
  },
  camera: {
    width: '100%',
    height: '100%',
  },
  scanLine: {
    position: 'absolute',
    width: '100%',
    height: 2,
    backgroundColor: '#00FF00', // Green scan line
    top: 0,
  },
  scanText: {
    fontSize: 18,
    color: '#000000', // Black
    marginTop: 10,
    fontWeight: '500',
  },
  instruction: {
    fontSize: 14,
    color: '#808080', // Gray
    marginTop: 20,
    textAlign: 'center',
  },
  errorText: {
    fontSize: 14,
    color: '#B00020', // Red
    marginTop: 10,
    textAlign: 'center',
  },
});

const FaceUnlockScreen = ({ navigation }) => {
  const device = useCameraDevice('front');
  const camera = useRef(null);
  const [hasCameraPermission, setHasCameraPermission] = useState(null);
  const [isCameraReady, setIsCameraReady] = useState(false);
  const [isBiometricSupported, setIsBiometricSupported] = useState(false);
  const [isEnrolled, setIsEnrolled] = useState(false);
  const [error, setError] = useState('');
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scanLineAnim = useRef(new Animated.Value(0)).current;
  const rnBiometrics = new Biometrics();

  useEffect(() => {
    // Start fade-in animation for the screen
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 800,
      useNativeDriver: true,
    }).start();

    // Start scan line animation
    const scanAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(scanLineAnim, {
          toValue: 398, // Height of imageContainer (400 - 2 for scan line height)
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(scanLineAnim, {
          toValue: 0,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    );
    scanAnimation.start();

    const requestCameraPermission = async () => {
      try {
        const cameraPermission = await Camera.requestCameraPermission();
        setHasCameraPermission(cameraPermission === 'granted');
      } catch (err) {
        console.warn('Camera permission error:', err);
        showToast('error', 'Permission Error', 'Failed to request camera permission.');
      }
    };

    const checkBiometricSupport = async () => {
      try {
        const { available, biometryType } = await rnBiometrics.isSensorAvailable();
        if (available && biometryType === 'FaceID') {
          setIsBiometricSupported(true);
          checkEnrollment();
        } else {
          setError('Face authentication is not supported on this device.');
          Alert.alert(
            'Error',
            'Face authentication is not supported on this device.',
            [{ text: 'OK', onPress: () => navigation.goBack() }]
          );
        }
      } catch (error) {
        console.warn('Biometric check error:', error);
        setError('Failed to check biometric support.');
        showToast('error', 'Error', 'Failed to check biometric support.');
      }
    };

    const checkEnrollment = async () => {
      try {
        const enrolled = await AsyncStorage.getItem('isFaceEnrolled');
        if (enrolled === 'true') {
          setIsEnrolled(true);
        }
        handleBiometricAuth();
      } catch (error) {
        console.error('Failed to check enrollment:', error);
        setError('Failed to check enrollment status.');
      }
    };

    requestCameraPermission();
    checkBiometricSupport();

    return () => {
      scanAnimation.stop();
    };
  }, [navigation, scanLineAnim]);

  const onCameraInitialized = () => {
    console.log('Camera initialized');
    setIsCameraReady(true);
  };

  const onCameraError = (error) => {
    console.error('Camera error:', error);
    showToast('error', 'Camera Error', 'Failed to initialize camera.');
    setError('Failed to initialize camera.');
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

  const handleBiometricAuth = async () => {
    if (!isBiometricSupported) {
      showToast('error', 'Error', 'Face authentication is not supported on this device.');
      return;
    }
    try {
      if (!isEnrolled) {
        // First time: Enroll biometric data
        const result = await rnBiometrics.createKeys();
        if (result.publicKey) {
          await AsyncStorage.setItem('isFaceEnrolled', 'true');
          setIsEnrolled(true);
          showToast('success', 'Success', 'Face enrollment completed.');
          navigation.goBack();
        } else {
          setError('Failed to enroll face. Please try again.');
          showToast('error', 'Enrollment Failed', 'Failed to enroll face. Please try again.');
        }
      } else {
        // Second time and onwards: Verify biometric data
        const result = await rnBiometrics.simplePrompt({
          promptMessage: 'Authenticate with Face ID',
        });
        if (result.success) {
          showToast('success', 'Success', 'Face authentication successful.');
          navigation.goBack();
        } else {
          setError('Face authentication failed. Please try again.');
          showToast('error', 'Authentication Failed', 'Face authentication failed. Please try again.');
        }
      }
    } catch (error) {
      console.error('Biometric auth error:', error);
      setError('An error occurred during biometric processing.');
      showToast('error', 'Error', 'An error occurred during biometric processing.');
    }
  };

  if (hasCameraPermission === null) {
    return <Text>Loading...</Text>;
  }

  if (!hasCameraPermission) {
    return <Text style={styles.errorText}>Camera permission not granted</Text>;
  }

  if (!device) {
    return <Text style={styles.errorText}>No front camera device available</Text>;
  }

  return (
    <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
      <View style={styles.imageContainer}>
        <Camera
          ref={camera}
          style={styles.camera}
          device={device}
          isActive={true}
          photo={true}
          onInitialized={onCameraInitialized}
          onError={onCameraError}
        />
        {isBiometricSupported && (
          <Animated.View
            style={[
              styles.scanLine,
              { transform: [{ translateY: scanLineAnim }] },
            ]}
          />
        )}
      </View>
      <Text style={styles.scanText}>
        {isBiometricSupported
          ? isEnrolled
            ? 'Scanning Face...'
            : 'Enrolling Face...'
          : 'Checking Biometric Support...'}
      </Text>
      <Text style={styles.instruction}>Align your face within the frame</Text>
      {error ? <Text style={styles.errorText}>{error}</Text> : null}
    </Animated.View>
  );
};

export default FaceUnlockScreen;