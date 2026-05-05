import React, { useCallback, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import api from '../api/client';
import { theme } from '../theme';
import { useAuth } from '../context/AuthContext';
import ListItem from '../components/ListItem';

const actions = [
  { title: 'Book Service', subtitle: 'Schedule maintenance', target: 'ServicePackageSelection', icon: 'calendar' },
  {
    title: 'Search within District',
    subtitle: 'Find service centers by district',
    target: 'SearchServiceCenters',
    icon: 'map'
  }
];

export default function UserHomeScreen({ navigation }) {
  const [centers, setCenters] = useState([]);
  const [recentRecords, setRecentRecords] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [expandedRecordId, setExpandedRecordId] = useState(null);
  const { user, authHeaders } = useAuth();

  const fetchData = async () => {
    try {
      const [centersRes, recordsRes, reviewsRes] = await Promise.all([
        api.get('/service-centers'),
        api.get('/maintenance-records', authHeaders),
        api.get('/reviews')
      ]);
      setCenters(centersRes.data);
      const sortedRecords = (recordsRes.data || []).sort((a, b) => new Date(b.serviceDate) - new Date(a.serviceDate));
      setRecentRecords(sortedRecords.slice(0, 2));
      setReviews((reviewsRes.data || []).filter((r) => r.userId?._id === user?._id));
    } catch (error) {
      Alert.alert('Error', error?.response?.data?.message || 'Failed loading data');
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchData();
    }, [user?._id])
  );

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Welcome Back!</Text>
      <Text style={styles.subtitle}>{user?.name || 'User'}</Text>

      <View style={styles.actionsList}>
        {actions.map((action) => (
          <ListItem
            key={action.target}
            icon={action.icon}
            title={action.title}
            subtitle={action.subtitle}
            onPress={() => navigation.navigate(action.target)}
            style={styles.actionCard}
          />
        ))}
      </View>

      {recentRecords.length > 0 && (
        <>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recent Maintenance</Text>
            <Text style={styles.sectionSub}>Tap to view full details and rate the service.</Text>
          </View>
          {recentRecords.map((item) => {
            const review = reviews.find((r) => r.bookingId?._id === item.bookingId?._id);
            const isExpanded = expandedRecordId === item._id;

            return (
              <Pressable
                key={item._id}
                style={styles.recordCard}
                onPress={() => setExpandedRecordId(isExpanded ? null : item._id)}
              >
                <View style={styles.recordHeader}>
                  <Text style={styles.recordTitle}>{item.vehicleId?.vehicleName || 'Vehicle'}</Text>
                  <Text style={styles.recordDate}>{item.serviceDate?.slice(0, 10)}</Text>
                </View>
                <Text style={styles.centerNameLight}>{item.serviceCenterId?.centerName || 'Service Center'}</Text>

                {isExpanded && (
                  <View style={styles.expandedDetails}>
                    <Text style={styles.detailText}>Work Done: {item.description}</Text>
                    <Text style={styles.detailText}>Cost: {item.cost}</Text>
                    <Text style={styles.detailText}>Next Service: {item.nextServiceDate?.slice(0, 10)}</Text>

                    <Pressable style={styles.ratingBtn} onPress={() => navigation.navigate('Reviews', { record: item, review })}>
                      <Text style={styles.ratingBtnText}>Rating this service</Text>
                    </Pressable>
                  </View>
                )}
              </Pressable>
            );
          })}
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.bg },
  content: { padding: theme.spacing.lg, paddingBottom: theme.spacing.xl },
  title: { fontSize: 25, fontWeight: '700', color: theme.colors.text, marginBottom: 6 },
  subtitle: { color: theme.colors.muted, fontWeight: '600', marginBottom: 14, fontSize: 16 },

  actionsList: {
    marginBottom: 18,
    gap: 12
  },
  actionCard: {
    backgroundColor: theme.colors.card,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    ...theme.shadow.soft
  },

  sectionHeader: { marginBottom: 10, marginTop: 6 },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: theme.colors.text },
  sectionSub: { color: theme.colors.muted, marginTop: 2, fontWeight: '600' },

  recordCard: {
    backgroundColor: theme.colors.card,
    borderRadius: theme.radius.lg,
    padding: theme.spacing.md,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: theme.colors.primary,
    ...theme.shadow.soft
  },
  recordHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  recordTitle: { fontSize: 16, fontWeight: '800', color: theme.colors.text },
  recordDate: { color: theme.colors.muted, fontWeight: '600', fontSize: 13 },
  centerNameLight: { color: theme.colors.muted, fontWeight: '600', marginTop: 4, marginBottom: 4 },
  expandedDetails: {
    marginTop: 10,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
    paddingTop: 10
  },
  detailText: { color: theme.colors.muted, fontWeight: '700', marginBottom: 4 },
  ratingBtn: {
    marginTop: 10,
    backgroundColor: theme.colors.primary,
    paddingVertical: 10,
    borderRadius: theme.radius.md
  },
  ratingBtnText: { color: '#fff', fontWeight: '800', textAlign: 'center' }
});
