import React, { useCallback, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';
import { theme } from '../theme';

export default function FeedbackComplaintsScreen({ navigation, route }) {
  const { authHeaders, user } = useAuth();
  const record = route.params?.record || null;
  const existingReview = route.params?.review || null;
  const [complaint, setComplaint] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchComplaint = async () => {
    if (!record) return;
    try {
      const { data } = await api.get('/complaints', authHeaders);
      const existing = data.find(
        (c) => c.maintenanceRecordId?._id === record._id && c.status !== 'Closed'
      );
      setComplaint(existing || null);
    } catch {
      setComplaint(null);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchComplaint();
    }, [record?._id])
  );

  if (!record) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>No service record found. Please go back and try again.</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.serviceCard}>
        <View style={styles.cardHeader}>
          <Ionicons name="construct" size={24} color={theme.colors.primary} />
          <Text style={styles.cardTitle}>Service Details</Text>
        </View>
        <View style={styles.divider} />
        <View style={styles.detailRow}>
          <Text style={styles.label}>Vehicle</Text>
          <Text style={styles.value}>{record.vehicleId?.vehicleName || 'N/A'}</Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.label}>Service Center</Text>
          <Text style={styles.value}>{record.serviceCenterId?.centerName || 'N/A'}</Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.label}>Service Date</Text>
          <Text style={styles.value}>{record.serviceDate?.slice(0, 10) || 'N/A'}</Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.label}>Work Done</Text>
          <Text style={styles.value}>{record.description || 'N/A'}</Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.label}>Amount Paid</Text>
          <Text style={[styles.value, styles.amount]}>₹{record.cost || 0}</Text>
        </View>
      </View>

      <Text style={styles.sectionTitle}>What would you like to do?</Text>

      <Pressable
        style={[styles.optionCard, styles.feedbackCard]}
        onPress={() => navigation.navigate('Reviews', { record, review: existingReview })}
      >
        <View style={styles.optionIcon}>
          <Ionicons name="star" size={32} color="#FFD700" />
        </View>
        <View style={styles.optionContent}>
          <Text style={styles.optionTitle}>
            {existingReview ? 'Edit Rating & Feedback' : 'Add Rating & Feedback'}
          </Text>
          <Text style={styles.optionDesc}>
            {existingReview
              ? 'Update your rating and feedback for this service'
              : 'Share your experience and rate the service'}
          </Text>
        </View>
        <Ionicons name="chevron-forward" size={24} color={theme.colors.muted} />
      </Pressable>

      {complaint ? (
        <Pressable
          style={[styles.optionCard, styles.viewComplaintCard]}
          onPress={() => navigation.navigate('ComplaintDetails', { complaintId: complaint._id })}
        >
          <View style={[styles.optionIcon, styles.complaintIconBg]}>
            <Ionicons name="document-text" size={32} color={theme.colors.warning} />
          </View>
          <View style={styles.optionContent}>
            <Text style={styles.optionTitle}>View Your Complaint</Text>
            <Text style={styles.optionDesc}>
              Status: <Text style={styles.statusText}>{complaint.status}</Text>
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={24} color={theme.colors.muted} />
        </Pressable>
      ) : (
        <Pressable
          style={[styles.optionCard, styles.complaintCard]}
          onPress={() => navigation.navigate('AddComplaint', { record })}
        >
          <View style={[styles.optionIcon, styles.complaintIconBg]}>
            <Ionicons name="warning" size={32} color={theme.colors.danger} />
          </View>
          <View style={styles.optionContent}>
            <Text style={styles.optionTitle}>File a Complaint</Text>
            <Text style={styles.optionDesc}>
              Report an issue or problem with this service
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={24} color={theme.colors.muted} />
        </Pressable>
      )}

      <Pressable
        style={[styles.optionCard, styles.historyCard]}
        onPress={() => navigation.navigate('MyComplaints')}
      >
        <View style={[styles.optionIcon, styles.historyIconBg]}>
          <Ionicons name="list" size={32} color={theme.colors.primary2} />
        </View>
        <View style={styles.optionContent}>
          <Text style={styles.optionTitle}>My Complaints History</Text>
          <Text style={styles.optionDesc}>View all your submitted complaints</Text>
        </View>
        <Ionicons name="chevron-forward" size={24} color={theme.colors.muted} />
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.bg
  },
  content: {
    padding: theme.spacing.lg
  },
  errorText: {
    color: theme.colors.danger,
    textAlign: 'center',
    marginTop: 40,
    fontSize: 16
  },
  serviceCard: {
    backgroundColor: theme.colors.card,
    borderRadius: theme.radius.lg,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    ...theme.shadow.card
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 12
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: theme.colors.text
  },
  divider: {
    height: 1,
    backgroundColor: theme.colors.border,
    marginBottom: 14
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8
  },
  label: {
    fontSize: 14,
    color: theme.colors.muted,
    fontWeight: '600'
  },
  value: {
    fontSize: 14,
    color: theme.colors.text,
    fontWeight: '700',
    maxWidth: '60%',
    textAlign: 'right'
  },
  amount: {
    color: theme.colors.success,
    fontSize: 16,
    fontWeight: '800'
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.colors.text,
    marginBottom: theme.spacing.md,
    marginTop: theme.spacing.sm
  },
  optionCard: {
    backgroundColor: theme.colors.card,
    borderRadius: theme.radius.lg,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.border,
    ...theme.shadow.soft
  },
  feedbackCard: {
    borderLeftWidth: 4,
    borderLeftColor: '#FFD700'
  },
  complaintCard: {
    borderLeftWidth: 4,
    borderLeftColor: theme.colors.danger
  },
  viewComplaintCard: {
    borderLeftWidth: 4,
    borderLeftColor: theme.colors.warning
  },
  historyCard: {
    borderLeftWidth: 4,
    borderLeftColor: theme.colors.primary2
  },
  optionIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#FFF8DC',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14
  },
  complaintIconBg: {
    backgroundColor: '#FFF0F0'
  },
  historyIconBg: {
    backgroundColor: theme.colors.bg2
  },
  optionContent: {
    flex: 1
  },
  optionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.colors.text,
    marginBottom: 4
  },
  optionDesc: {
    fontSize: 13,
    color: theme.colors.muted,
    fontWeight: '500'
  },
  statusText: {
    fontWeight: '700',
    color: theme.colors.warning
  }
});
