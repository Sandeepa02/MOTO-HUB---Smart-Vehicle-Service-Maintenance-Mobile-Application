import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { theme } from '../theme';

const actions = [
  { label: 'Manage Vehicles', screen: 'Vehicles' },
  { label: 'Book Services', screen: 'Bookings' },
  { label: 'Maintenance History', screen: 'MaintenanceHistory' },
  { label: 'Feedback', screen: 'Reviews' }
];

export default function UserDashboardScreen({ navigation }) {
  const { user, logout } = useAuth();

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>User Dashboard</Text>
      <Text style={styles.subtitle}>Welcome, {user?.name || 'User'}</Text>
      {actions.map((action) => (
        <Pressable key={action.screen} style={styles.card} onPress={() => navigation.navigate(action.screen)}>
          <Text style={styles.cardText}>{action.label}</Text>
        </Pressable>
      ))}
      <Pressable style={styles.logoutBtn} onPress={logout}>
        <Text style={styles.logoutText}>Logout</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: theme.spacing.lg, backgroundColor: theme.colors.bg, flexGrow: 1 },
  title: { fontSize: 28, fontWeight: '900', marginBottom: 8, color: theme.colors.text },
  subtitle: { color: theme.colors.muted, marginBottom: 20, fontWeight: '800' },
  card: {
    backgroundColor: theme.colors.card,
    padding: theme.spacing.md,
    borderRadius: theme.radius.lg,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: theme.colors.border,
    ...theme.shadow.card
  },
  cardText: { fontSize: 16, fontWeight: '900', color: theme.colors.text },
  logoutBtn: { backgroundColor: theme.colors.danger, padding: 14, borderRadius: theme.radius.lg, marginTop: 8, ...theme.shadow.soft },
  logoutText: { textAlign: 'center', color: '#fff', fontWeight: '900' }
});
