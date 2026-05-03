import React from 'react';
import { ActivityIndicator, View } from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAuth } from '../context/AuthContext';
import LoginScreen from '../screens/LoginScreen';
import RegisterScreen from '../screens/RegisterScreen';
import VehicleListScreen from '../screens/VehicleListScreen';
import VehicleFormScreen from '../screens/VehicleFormScreen';
import BookingScreen from '../screens/BookingScreen';
import MaintenanceScreen from '../screens/MaintenanceScreen';
import ReviewsScreen from '../screens/ReviewsScreen';
import ServiceCentersScreen from '../screens/ServiceCentersScreen';
import ServiceCenterDashboardScreen from '../screens/ServiceCenterDashboardScreen';
import ServiceCenterBookingsScreen from '../screens/ServiceCenterBookingsScreen';
import UserMaintenanceScreen from '../screens/UserMaintenanceScreen';
import UserTabs from './UserTabs';
import ServiceCenterTabs from './ServiceCenterTabs';

const Stack = createNativeStackNavigator();

const AuthStack = () => (
  <Stack.Navigator>
    <Stack.Screen name="Login" component={LoginScreen} />
    <Stack.Screen name="Register" component={RegisterScreen} />
  </Stack.Navigator>
);

const UserStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="UserTabs" component={UserTabs} />
  </Stack.Navigator>
);

const ServiceCenterStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="ServiceCenterTabs" component={ServiceCenterTabs} />
  </Stack.Navigator>
);

export default function AppNavigator() {
  const { token, loading, user } = useAuth();

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (!token || !user) {
    return <AuthStack />;
  }

  return user.role === 'service-center' ? <ServiceCenterStack /> : <UserStack />;
}
