import React, { useCallback, useMemo, useState } from 'react';
import { Alert, FlatList, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';
import { theme } from '../theme';

export default function ServiceCenterPaymentsScreen() {
  const { authHeaders } = useAuth();
  const [bookings, setBookings] = useState([]);

  const fetchData = async () => {
    const { data } = await api.get('/bookings', authHeaders);
    const rows = Array.isArray(data) ? data : [];
    setBookings(rows.filter((b) => b?.status === 'Completed'));
  };

  useFocusEffect(
    useCallback(() => {
      fetchData().catch((error) => Alert.alert('Error', error?.response?.data?.message || 'Failed loading payments'));
    }, [])
  );

  const title = useMemo(() => `Recent Payments`, []);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.subtitle}>Showing completed bookings (payment records not available yet).</Text>

      <FlatList
        data={bookings}
        keyExtractor={(item) => item._id}
        contentContainerStyle={{ paddingBottom: theme.spacing.xl }}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>{item.userId?.name || 'Customer'}</Text>
            <Text style={styles.meta}>Service: {item.serviceType || '-'}</Text>
            <Text style={styles.meta}>Date: {(item.bookingDate || '').toString().slice(0, 10) || '-'}</Text>
            <Text style={styles.meta}>Slot: {item.slotLabel || '-'}</Text>
            <Text style={styles.meta}>Status: {item.status || '-'}</Text>
          </View>
        )}
        ListEmptyComponent={<Text style={styles.empty}>No completed bookings yet.</Text>}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.bg, padding: theme.spacing.lg },
  title: { fontSize: 20, fontWeight: '900', color: theme.colors.text, marginBottom: 6 },
  subtitle: { color: theme.colors.muted, fontWeight: '700', marginBottom: 14 },
  card: {
    backgroundColor: theme.colors.card,
    padding: theme.spacing.md,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    marginBottom: 12,
    ...theme.shadow.soft
  },
  cardTitle: { fontSize: 16, fontWeight: '900', color: theme.colors.text, marginBottom: 6 },
  meta: { color: theme.colors.muted, fontWeight: '700', marginBottom: 2 },
  empty: { color: theme.colors.muted, fontWeight: '800' }
});

