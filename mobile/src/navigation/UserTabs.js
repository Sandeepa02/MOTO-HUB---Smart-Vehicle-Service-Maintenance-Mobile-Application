import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { theme } from '../theme';
import { Ionicons } from '@expo/vector-icons';
import UserHomeScreen from '../screens/UserHomeScreen';
import UserProfileScreen from '../screens/UserProfileScreen';
import NotificationsScreen from '../screens/NotificationsScreen';
import ServiceCenterDetailsScreen from '../screens/ServiceCenterDetailsScreen';
import ServicePackageSelectionScreen from '../screens/ServicePackageSelectionScreen';
import VehicleListScreen from '../screens/VehicleListScreen';
import VehicleFormScreen from '../screens/VehicleFormScreen';
import VehicleDetailScreen from '../screens/VehicleDetailScreen';
import BookingScreen from '../screens/BookingScreen';
import UserMaintenanceScreen from '../screens/UserMaintenanceScreen';
import ReviewsScreen from '../screens/ReviewsScreen';
import SearchServiceCentersScreen from '../screens/SearchServiceCentersScreen';
import FeedbackComplaintsScreen from '../screens/FeedbackComplaintsScreen';
import AddComplaintScreen from '../screens/AddComplaintScreen';
import MyComplaintsScreen from '../screens/MyComplaintsScreen';
import ComplaintDetailsScreen from '../screens/ComplaintDetailsScreen';
import NearbyServiceCentersScreen from '../screens/NearbyServiceCentersScreen';
import UpdateProfileScreen from '../screens/UpdateProfileScreen';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

const HomeStack = () => (
  <Stack.Navigator>
    <Stack.Screen name="Home" component={UserHomeScreen} />
    <Stack.Screen name="Vehicles" component={VehicleListScreen} />
    <Stack.Screen name="VehicleForm" component={VehicleFormScreen} options={{ title: 'Vehicle Form' }} />
    <Stack.Screen name="VehicleDetail" component={VehicleDetailScreen} options={{ title: 'Vehicle Details' }} />
    <Stack.Screen name="Bookings" component={BookingScreen} options={{ title: 'Book Service' }} />
    <Stack.Screen name="MaintenanceHistory" component={UserMaintenanceScreen} options={{ title: 'Maintenance History' }} />
    <Stack.Screen name="Reviews" component={ReviewsScreen} options={{ title: 'Feedback' }} />
    <Stack.Screen name="FeedbackComplaints" component={FeedbackComplaintsScreen} options={{ title: 'Feedback & Complaints' }} />
    <Stack.Screen name="AddComplaint" component={AddComplaintScreen} options={{ title: 'File a Complaint' }} />
    <Stack.Screen name="MyComplaints" component={MyComplaintsScreen} options={{ title: 'My Complaints' }} />
    <Stack.Screen name="ComplaintDetails" component={ComplaintDetailsScreen} options={{ title: 'Complaint Details' }} />
    <Stack.Screen name="ServiceCenterDetails" component={ServiceCenterDetailsScreen} options={{ title: 'Service Center' }} />
    <Stack.Screen name="ServicePackageSelection" component={ServicePackageSelectionScreen} options={{ title: 'Select Service' }} />
    <Stack.Screen name="SearchServiceCenters" component={SearchServiceCentersScreen} options={{ title: 'Search Centers' }} />
    <Stack.Screen name="NearbyServiceCenters" component={NearbyServiceCentersScreen} options={{ title: 'Nearby Centers' }} />
  </Stack.Navigator>
);

const ProfileStack = () => (
  <Stack.Navigator>
    <Stack.Screen name="ProfileMain" component={UserProfileScreen} options={{ title: 'Menu' }} />
    <Stack.Screen name="UpdateProfile" component={UpdateProfileScreen} options={{ title: 'Your Profile' }} />
  </Stack.Navigator>
);

export default function UserTabs() {
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
