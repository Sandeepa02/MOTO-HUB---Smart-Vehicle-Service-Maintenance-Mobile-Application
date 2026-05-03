import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { AuthProvider, useAuth } from './src/context/AuthContext';
import AppNavigator from './src/navigation/AppNavigator';

function AppNavigationContainer() {
  const { token, user } = useAuth();
  const navKey = token && user ? `app-${user.role || 'user'}` : 'auth';

  return (
    <NavigationContainer key={navKey}>
      <AppNavigator />
    </NavigationContainer>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppNavigationContainer />
    </AuthProvider>
  );
}
