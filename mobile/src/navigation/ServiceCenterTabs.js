import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { theme } from '../theme';
import { Ionicons } from '@expo/vector-icons';
import ServiceCenterHomeScreen from '../screens/ServiceCenterHomeScreen';
import ServiceCenterProfileScreen from '../screens/ServiceCenterProfileScreen';
import NotificationsScreen from '../screens/NotificationsScreen';
import ServiceCenterBookingsScreen from '../screens/ServiceCenterBookingsScreen';
import MaintenanceScreen from '../screens/MaintenanceScreen';
import ManageServicesScreen from '../screens/ManageServicesScreen';
import ServiceCenterBranchesScreen from '../screens/ServiceCenterBranchesScreen';
import ManageBranchScreen from '../screens/ManageBranchScreen';
import ServiceCentersScreen from '../screens/ServiceCentersScreen';
import ServiceCenterReviewsScreen from '../screens/ServiceCenterReviewsScreen';
import ServiceCenterPaymentsScreen from '../screens/ServiceCenterPaymentsScreen';
import ServiceCenterComplaintsScreen from '../screens/ServiceCenterComplaintsScreen';
import RespondComplaintScreen from '../screens/RespondComplaintScreen';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

const HomeStack = () => (
  <Stack.Navigator>
    <Stack.Screen name="Home" component={ServiceCenterHomeScreen} />
    <Stack.Screen name="ServiceCenterBookings" component={ServiceCenterBookingsScreen} options={{ title: 'Incoming Bookings' }} />
    <Stack.Screen name="Maintenance" component={MaintenanceScreen} options={{ title: 'Maintenance Records' }} />
    <Stack.Screen name="ManageServices" component={ManageServicesScreen} options={{ title: 'Manage Services' }} />
    <Stack.Screen
      name="ServiceCenterBranches"
      component={ServiceCenterBranchesScreen}
      options={{ title: 'Branches / Outlets' }}
    />
    <Stack.Screen name="ManageBranch" component={ManageBranchScreen} options={{ title: 'Outlet' }} />
    <Stack.Screen name="ServiceCenterComplaints" component={ServiceCenterComplaintsScreen} options={{ title: 'Customer Complaints' }} />
    <Stack.Screen name="RespondComplaint" component={RespondComplaintScreen} options={{ title: 'Respond to Complaint' }} />
  </Stack.Navigator>
);

const ProfileStack = () => (
  <Stack.Navigator>
    <Stack.Screen name="ServiceCenterMenu" component={ServiceCenterProfileScreen} options={{ headerShown: false }} />
    <Stack.Screen name="ServiceCenterProfileEdit" component={ServiceCentersScreen} options={{ title: 'My Profile' }} />
    <Stack.Screen name="ServiceCenterReviews" component={ServiceCenterReviewsScreen} options={{ title: 'My Reviews' }} />
    <Stack.Screen name="ServiceCenterPayments" component={ServiceCenterPaymentsScreen} options={{ title: 'Recent Payments' }} />
  </Stack.Navigator>
);

export default function ServiceCenterTabs() {
  return (
    <Tab.Navigator
      backBehavior="history"
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.muted,
        tabBarIcon: ({ focused, color, size }) => {
          const name =
            route.name === 'HomeTab'
              ? focused
                ? 'home'
                : 'home-outline'
              : route.name === 'ProfileTab'
              ? focused
                ? 'person'
                : 'person-outline'
              : focused
              ? 'notifications'
              : 'notifications-outline';
          return <Ionicons name={name} size={size} color={color} />;
        },
        tabBarStyle: {
          backgroundColor: theme.colors.card,
          borderTopColor: theme.colors.border,
          borderTopWidth: 1,
          height: 62,
          paddingBottom: 10,
          paddingTop: 8
        },
        tabBarLabelStyle: { fontWeight: '800' }
      })}
    >
      <Tab.Screen name="HomeTab" component={HomeStack} options={{ title: 'Home' }} />
      <Tab.Screen name="ProfileTab" component={ProfileStack} options={{ title: 'Profile' }} />
      <Tab.Screen name="NotificationsTab" component={NotificationsScreen} options={{ title: 'Notifications' }} />
    </Tab.Navigator>
  );
}
