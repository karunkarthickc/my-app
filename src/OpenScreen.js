import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';

const OpenScreen = ({ navigation }) => {
  const handleFaceID = () => {
    navigation.navigate('FaceUnlock');
  };

  const handlePassword = () => {
    navigation.navigate('Login');
  };

  const handleSignUp = () => {
    console.log('Navigate to Sign up');
  };

  return (
    <View style={styles.container}>
      <View style={styles.buttonContainer}>
        <TouchableOpacity style={styles.button} onPress={handleFaceID}>
          <Icon name="face" size={40} color="#000000" style={styles.buttonIcon} />
          <Text style={styles.buttonLabel}>Face ID</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.button} onPress={handlePassword}>
          <Icon name="lock" size={40} color="#000000" style={styles.buttonIcon} />
          <Text style={styles.buttonLabel}>Password</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '80%',
    marginBottom: 20,
  },
  button: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#F0F0F0',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
  },
  buttonIcon: {
    marginBottom: 10,
  },
  buttonLabel: {
    fontSize: 16,
    color: '#000000',
    textAlign: 'center',
  },
  signUpText: {
    fontSize: 14,
    color: '#808080',
    textAlign: 'center',
  },
});

export default OpenScreen;