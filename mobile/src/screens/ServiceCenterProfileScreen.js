import React, { useCallback, useMemo, useState } from 'react';
import { Alert, Image, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';
import { theme } from '../theme';
import { API_BASE_URL } from '../config';
import ListItem from '../components/ListItem';

export default function ServiceCenterProfileScreen({ navigation }) {
  const { user, authHeaders, logout } = useAuth();
  const [center, setCenter] = useState(null);

  const fetchCenter = async () => {
    const { data } = await api.get('/service-centers/me', authHeaders);
    setCenter(data);
  };

  useFocusEffect(
    useCallback(() => {
      fetchCenter().catch((error) => Alert.alert('Error', error?.response?.data?.message || 'Failed loading service center profile'));
    }, [])
  );

  const displayName = useMemo(() => center?.centerName || user?.name || 'Service Center', [center?.centerName, user?.name]);
  const baseUrl = useMemo(() => API_BASE_URL.replace(/\/api\/?$/, ''), []);
  const imageUrl = useMemo(() => (center?.image ? `${baseUrl}${center.image}` : ''), [baseUrl, center?.image]);

  const handleLogout = async () => {
    try {
      await logout();
    } catch (_error) {
      Alert.alert('Error', 'Sign out failed. Please try again.');
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        {imageUrl ? (
          <Image source={{ uri: imageUrl }} style={styles.avatar} />
        ) : (
          <View style={[styles.avatar, styles.avatarPlaceholder]}>
            <Text style={styles.avatarText}>{displayName.slice(0, 1).toUpperCase()}</Text>
          </View>
        )}
        <View style={{ flex: 1 }}>
          <Text style={styles.name}>{displayName}</Text>
          <Text style={styles.meta}>Center ID: {center?.centerId || '-'}</Text>
          <Text style={styles.meta}>Email: {user?.email || '-'}</Text>
        </View>
      </View>

      <View style={styles.section}>
        <ListItem
          icon="person-outline"
          title="Profile"
          subtitle="Add / update center details"
          onPress={() => navigation.navigate('ServiceCenterProfileEdit')}
          showDivider
        />
        <ListItem
          icon="star-outline"
          title="My Reviews"
          subtitle="View customer feedback"
          onPress={() => navigation.navigate('ServiceCenterReviews')}
          showDivider
        />
        <ListItem
          icon="card-outline"
          title="Recent Payments"
          subtitle="View completed bookings"
          onPress={() => navigation.navigate('ServiceCenterPayments')}
        />
      </View>

      <View style={styles.section}>
        <ListItem icon="log-out-outline" title="Sign Out" danger onPress={handleLogout} />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.bg },
  content: { padding: theme.spacing.lg, paddingBottom: theme.spacing.xl },
  header: {
    flexDirection: 'row',
    gap: 14,
    alignItems: 'center',
    backgroundColor: theme.colors.card,
    padding: theme.spacing.md,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    ...theme.shadow.soft,
    marginBottom: 14
  },
  avatar: { width: 62, height: 62, borderRadius: 31, borderWidth: 1, borderColor: theme.colors.border, backgroundColor: theme.colors.card },
  avatarPlaceholder: { justifyContent: 'center', alignItems: 'center' },
  avatarText: { fontSize: 22, fontWeight: '900', color: theme.colors.text },
  name: { fontSize: 18, fontWeight: '900', color: theme.colors.text, marginBottom: 2 },
  meta: { color: theme.colors.muted, fontWeight: '800' },
  section: {
    backgroundColor: theme.colors.card,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    overflow: 'hidden',
    ...theme.shadow.soft,
    marginBottom: 12
  }
});
