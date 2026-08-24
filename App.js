import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import LandingScreen from './screens/LandingScreen';
import LoginScreen from './screens/LoginScreen';
import HomeScreen from './screens/HomeScreen';
import CandidateDetailScreen from './screens/CandidateDetailScreen';
import ComparisonScreen from './screens/ComparisonScreen';
import OfferLetterScreen from './screens/OfferLetterScreen';
import ReportScreen from './screens/ReportScreen';
import MainTabsNavigator from './navigation/MainTabsNavigator';

const Stack = createNativeStackNavigator();

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <NavigationContainer>
        <Stack.Navigator
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: '#0B0F19' },
            animation: 'fade',
          }}
        >
          <Stack.Screen name="Landing" component={LandingScreen} />
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="Home" component={HomeScreen} />
          <Stack.Screen name="MainTabs" component={MainTabsNavigator} />
          <Stack.Screen name="CandidateDetail" component={CandidateDetailScreen} />
          <Stack.Screen name="Comparison" component={ComparisonScreen} />
          <Stack.Screen name="OfferLetter" component={OfferLetterScreen} />
          <Stack.Screen name="Rejection" component={OfferLetterScreen} />
          <Stack.Screen name="Report" component={ReportScreen} />
        </Stack.Navigator>
        <StatusBar style="light" />
      </NavigationContainer>
    </GestureHandlerRootView>
  );
}
