import React, { useCallback, useState } from 'react';
import { Alert, FlatList, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';
import { theme } from '../theme';

export default function UserMaintenanceScreen({ navigation }) {
  const { authHeaders, user } = useAuth();
  const [records, setRecords] = useState([]);
  const [reviews, setReviews] = useState([]);

  const fetchData = async () => {
    const [recordsRes, reviewsRes] = await Promise.all([
      api.get('/maintenance-records', authHeaders),
      api.get('/reviews')
    ]);

    setRecords(recordsRes.data);
    setReviews(reviewsRes.data.filter((review) => review.userId?._id === user?._id));
  };

  useFocusEffect(
    useCallback(() => {
      fetchData().catch((error) => Alert.alert('Error', error?.response?.data?.message || 'Failed loading maintenance history'));
    }, [user?._id])
  );

  const findReview = (bookingId) => reviews.find((review) => review.bookingId?._id === bookingId);

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.heading}>Completed Maintenance</Text>
      <FlatList
        scrollEnabled={false}
        data={records}
        keyExtractor={(item) => item._id}
        renderItem={({ item }) => {
          const review = findReview(item.bookingId?._id);

          return (
            <View style={styles.card}>
              <Text style={styles.title}>{item.vehicleId?.vehicleName || 'Vehicle'}</Text>
              <Text style={styles.text}>Service Center: {item.serviceCenterId?.centerName || 'Service Center'}</Text>
              <Text style={styles.text}>Service Date: {item.serviceDate?.slice(0, 10)}</Text>
              <Text style={styles.text}>Work Done: {item.description}</Text>
              <Text style={styles.text}>Cost: {item.cost}</Text>
              <Text style={styles.text}>Next Service: {item.nextServiceDate?.slice(0, 10)}</Text>
              <Pressable
                style={[styles.actionBtn, review ? styles.editBtn : styles.primaryBtn]}
                onPress={() => navigation.navigate('FeedbackComplaints', { record: item, review })}
              >
                <Text style={styles.actionBtnText}>{review ? 'Feedback & Complaints' : 'Add Feedback / File Complaint'}</Text>
              </Pressable>
            </View>
          );
        }}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: theme.spacing.lg, backgroundColor: theme.colors.bg },
  heading: { fontSize: 20, fontWeight: '700', marginBottom: 10, marginTop: 4, color: theme.colors.text },
  card: {
    backgroundColor: theme.colors.card,
    padding: theme.spacing.md,
    borderRadius: theme.radius.lg,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: theme.colors.border,
    ...theme.shadow.soft
  },
  title: { fontWeight: '800', fontSize: 16, color: theme.colors.text },
  text: { color: theme.colors.muted, marginBottom: 2, fontWeight: '700' },
  actionBtn: { borderRadius: theme.radius.md, padding: 12, marginTop: 10, ...theme.shadow.soft },
  primaryBtn: { backgroundColor: theme.colors.primary },
  editBtn: { backgroundColor: theme.colors.primary2 },
  actionBtnText: { color: '#fff', fontWeight: '800', textAlign: 'center' }
});
