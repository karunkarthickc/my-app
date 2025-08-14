import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack'; // Changed import
import { Provider as PaperProvider } from 'react-native-paper';
import LoginScreen from './src/LoginScreen';
import PunchScreen from './src/PunchInScreen';

// Create stack navigator
const Stack = createNativeStackNavigator(); // Updated to createNativeStackNavigator

const App = () => {
  return (
    <PaperProvider>
      <NavigationContainer>
        <Stack.Navigator initialRouteName="Login" screenOptions={{ headerShown: false }}>
          <Stack.Screen name="Login"  component={LoginScreen}  />
          <Stack.Screen name="Punch" component={PunchScreen} />
        </Stack.Navigator>
      </NavigationContainer>
    </PaperProvider>
  );
};

export default App;