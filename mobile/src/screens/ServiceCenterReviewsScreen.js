import React, { useCallback, useMemo, useState } from 'react';
import { Alert, FlatList, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';
import { theme } from '../theme';

const toStars = (rating) => {
  const safe = Math.max(0, Math.min(5, Number(rating) || 0));
  return `${'★'.repeat(safe)}${'☆'.repeat(5 - safe)}`;
};

export default function ServiceCenterReviewsScreen() {
  const { authHeaders } = useAuth();
  const [center, setCenter] = useState(null);
  const [reviews, setReviews] = useState([]);

  const fetchData = async () => {
    const centerRes = await api.get('/service-centers/me', authHeaders);
    setCenter(centerRes.data);

    const { data } = await api.get('/reviews', { params: { serviceCenterId: centerRes.data?._id } });
    setReviews(Array.isArray(data) ? data : []);
  };

  useFocusEffect(
    useCallback(() => {
      fetchData().catch((error) => Alert.alert('Error', error?.response?.data?.message || 'Failed loading reviews'));
    }, [])
  );

  const headerText = useMemo(() => {
    const name = center?.centerName ? String(center.centerName) : 'Service Center';
    return `${name} Reviews`;
  }, [center?.centerName]);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{headerText}</Text>

      <FlatList
        data={reviews}
        keyExtractor={(item) => item._id}
        contentContainerStyle={{ paddingBottom: theme.spacing.xl }}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>{item.userId?.name || 'Customer'}</Text>
            <Text style={styles.meta}>
              {toStars(item.rating)} ({item.rating}/5)
            </Text>
            <Text style={styles.meta}>Service: {item.bookingId?.serviceType || '-'}</Text>
            <Text style={styles.meta}>Date: {(item.bookingId?.bookingDate || item.date || '').toString().slice(0, 10) || '-'}</Text>
            <Text style={styles.comment}>{item.comment || '—'}</Text>
          </View>
        )}
        ListEmptyComponent={<Text style={styles.empty}>No reviews yet.</Text>}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.bg, padding: theme.spacing.lg },
  title: { fontSize: 20, fontWeight: '900', color: theme.colors.text, marginBottom: 12 },
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
  comment: { marginTop: 10, color: theme.colors.text, fontWeight: '700' },
  empty: { color: theme.colors.muted, fontWeight: '800' }
});

