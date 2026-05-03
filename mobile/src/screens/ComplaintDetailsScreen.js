import React, { useCallback, useState } from 'react';
import {
  Alert,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';
import { theme } from '../theme';

const STATUS_CONFIG = {
  Open: { color: theme.colors.primary, icon: 'radio-button-on', bg: '#EBF5FF' },
  'In Review': { color: theme.colors.warning, icon: 'time', bg: '#FFF8E6' },
  Resolved: { color: theme.colors.success, icon: 'checkmark-circle', bg: '#E6F9F1' },
  Closed: { color: theme.colors.muted, icon: 'lock-closed', bg: '#F5F5F5' },
  Rejected: { color: theme.colors.danger, icon: 'close-circle', bg: '#FEE2E2' }
};

const PRIORITY_CONFIG = {
  Low: { color: theme.colors.success, label: 'Low Priority' },
  Medium: { color: theme.colors.warning, label: 'Medium Priority' },
  High: { color: theme.colors.danger, label: 'High Priority' }
};

const RESOLUTION_LABELS = {
  Refund: 'Full Refund',
  'Re-service': 'Free Re-service',
  'Partial Refund': 'Partial Refund',
  Compensation: 'Compensation Offered',
  Apology: 'Formal Apology',
  'No Action': 'No Action Taken'
};

export default function ComplaintDetailsScreen({ navigation, route }) {
  const { authHeaders } = useAuth();
  const complaintId = route.params?.complaintId;
  const [complaint, setComplaint] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchComplaint = async () => {
    try {
      const { data } = await api.get(`/complaints/${complaintId}`, authHeaders);
      setComplaint(data);
    } catch (error) {
      Alert.alert('Error', error?.response?.data?.message || 'Failed to load complaint');
      navigation.goBack();
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      if (complaintId) fetchComplaint();
    }, [complaintId])
  );

  const handleCloseComplaint = (satisfied) => {
    Alert.alert(
      'Close Complaint',
      satisfied
        ? 'Are you satisfied with the resolution?'
        : 'Close this complaint as unresolved?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm',
          onPress: async () => {
            try {
              await api.put(
                `/complaints/${complaintId}/close`,
                { userSatisfied: satisfied },
                authHeaders
              );
              Alert.alert('Success', 'Complaint has been closed');
              fetchComplaint();
            } catch (error) {
              Alert.alert('Error', error?.response?.data?.message || 'Failed to close complaint');
            }
          }
        }
      ]
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  if (!complaint) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.errorText}>Complaint not found</Text>
      </View>
    );
  }

  const statusConfig = STATUS_CONFIG[complaint.status] || STATUS_CONFIG.Open;
  const priorityConfig = PRIORITY_CONFIG[complaint.priority] || PRIORITY_CONFIG.Medium;

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={() => {
            setRefreshing(true);
            fetchComplaint();
          }}
          colors={[theme.colors.primary]}
        />
      }
    >
      <View style={[styles.statusCard, { backgroundColor: statusConfig.bg }]}>
        <Ionicons name={statusConfig.icon} size={28} color={statusConfig.color} />
        <View style={styles.statusInfo}>
          <Text style={[styles.statusLabel, { color: statusConfig.color }]}>
            {complaint.status}
          </Text>
          <Text style={styles.statusDate}>
            Filed on {new Date(complaint.createdAt).toLocaleDateString('en-IN', {
              day: 'numeric',
              month: 'long',
              year: 'numeric'
            })}
          </Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Service Details</Text>
        <View style={styles.detailCard}>
          <View style={styles.detailRow}>
            <Ionicons name="business-outline" size={18} color={theme.colors.muted} />
            <View style={styles.detailContent}>
              <Text style={styles.detailLabel}>Service Center</Text>
              <Text style={styles.detailValue}>
                {complaint.serviceCenterId?.centerName || 'N/A'}
              </Text>
            </View>
          </View>
          <View style={styles.detailRow}>
            <Ionicons name="car-outline" size={18} color={theme.colors.muted} />
            <View style={styles.detailContent}>
              <Text style={styles.detailLabel}>Vehicle</Text>
              <Text style={styles.detailValue}>
                {complaint.vehicleId?.vehicleName || 'N/A'} ({complaint.vehicleId?.vehicleNumber || ''})
              </Text>
            </View>
          </View>
          <View style={styles.detailRow}>
            <Ionicons name="construct-outline" size={18} color={theme.colors.muted} />
            <View style={styles.detailContent}>
              <Text style={styles.detailLabel}>Service Type</Text>
              <Text style={styles.detailValue}>
                {complaint.bookingId?.serviceType || 'N/A'}
              </Text>
            </View>
          </View>
          <View style={styles.detailRow}>
            <Ionicons name="calendar-outline" size={18} color={theme.colors.muted} />
            <View style={styles.detailContent}>
              <Text style={styles.detailLabel}>Service Date</Text>
              <Text style={styles.detailValue}>
                {complaint.maintenanceRecordId?.serviceDate?.slice(0, 10) || complaint.bookingId?.bookingDate || 'N/A'}
              </Text>
            </View>
          </View>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Your Complaint</Text>
        <View style={styles.complaintCard}>
          <View style={styles.complaintHeader}>
            <View style={styles.issueTypeTag}>
              <Text style={styles.issueTypeText}>{complaint.issueType}</Text>
            </View>
            <View style={[styles.priorityTag, { backgroundColor: priorityConfig.color + '20' }]}>
              <View style={[styles.priorityDot, { backgroundColor: priorityConfig.color }]} />
              <Text style={[styles.priorityText, { color: priorityConfig.color }]}>
                {priorityConfig.label}
              </Text>
            </View>
          </View>
          <Text style={styles.complaintDescription}>{complaint.description}</Text>
        </View>
      </View>

      {complaint.response ? (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Service Center Response</Text>
          <View style={styles.responseCard}>
            <View style={styles.responseHeader}>
              <Ionicons name="chatbubbles" size={20} color={theme.colors.success} />
              <Text style={styles.responseHeaderText}>
                {complaint.serviceCenterId?.centerName} replied
              </Text>
            </View>
            <Text style={styles.responseDate}>
              {complaint.respondedAt
                ? new Date(complaint.respondedAt).toLocaleDateString('en-IN', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })
                : ''}
            </Text>
            <Text style={styles.responseText}>{complaint.response}</Text>

            {complaint.resolutionType && (
              <View style={styles.resolutionBox}>
                <Ionicons name="checkmark-done" size={18} color={theme.colors.success} />
                <View style={styles.resolutionContent}>
                  <Text style={styles.resolutionLabel}>Resolution Offered</Text>
                  <Text style={styles.resolutionValue}>
                    {RESOLUTION_LABELS[complaint.resolutionType] || complaint.resolutionType}
                  </Text>
                  {complaint.resolutionNotes ? (
                    <Text style={styles.resolutionNotes}>{complaint.resolutionNotes}</Text>
                  ) : null}
                </View>
              </View>
            )}
          </View>
        </View>
      ) : (
        <View style={styles.section}>
          <View style={styles.pendingCard}>
            <Ionicons name="hourglass-outline" size={32} color={theme.colors.warning} />
            <Text style={styles.pendingTitle}>Awaiting Response</Text>
            <Text style={styles.pendingText}>
              The service center has been notified and will respond to your complaint soon.
            </Text>
          </View>
        </View>
      )}

      {(complaint.status === 'Resolved' || complaint.status === 'Rejected') && (
        <View style={styles.actionSection}>
          <Text style={styles.actionTitle}>
            {complaint.status === 'Resolved'
              ? 'Was the issue resolved to your satisfaction?'
              : 'Close this complaint?'}
          </Text>
          <View style={styles.actionButtons}>
            <Pressable
              style={[styles.actionBtn, styles.satisfiedBtn]}
              onPress={() => handleCloseComplaint(true)}
            >
              <Ionicons name="thumbs-up" size={20} color="#fff" />
              <Text style={styles.actionBtnText}>Satisfied</Text>
            </Pressable>
            <Pressable
              style={[styles.actionBtn, styles.unsatisfiedBtn]}
              onPress={() => handleCloseComplaint(false)}
            >
              <Ionicons name="thumbs-down" size={20} color="#fff" />
              <Text style={styles.actionBtnText}>Not Satisfied</Text>
            </Pressable>
          </View>
        </View>
      )}

      {complaint.status === 'Closed' && (
        <View style={styles.closedCard}>
          <Ionicons
            name={complaint.userSatisfied ? 'happy-outline' : 'sad-outline'}
            size={32}
            color={complaint.userSatisfied ? theme.colors.success : theme.colors.warning}
          />
          <Text style={styles.closedTitle}>Complaint Closed</Text>
          <Text style={styles.closedText}>
            {complaint.userSatisfied
              ? 'You marked this complaint as resolved satisfactorily.'
              : 'You closed this complaint as not fully resolved.'}
          </Text>
          <Text style={styles.closedDate}>
            Closed on {new Date(complaint.closedAt).toLocaleDateString('en-IN', {
              day: 'numeric',
              month: 'long',
              year: 'numeric'
            })}
          </Text>
        </View>
      )}

      <View style={styles.timeline}>
        <Text style={styles.timelineTitle}>Timeline</Text>
        <View style={styles.timelineItem}>
          <View style={[styles.timelineDot, { backgroundColor: theme.colors.primary }]} />
          <View style={styles.timelineContent}>
            <Text style={styles.timelineLabel}>Complaint Filed</Text>
            <Text style={styles.timelineDate}>
              {new Date(complaint.createdAt).toLocaleString('en-IN')}
            </Text>
          </View>
        </View>
        {complaint.respondedAt && (
          <View style={styles.timelineItem}>
            <View style={[styles.timelineDot, { backgroundColor: theme.colors.warning }]} />
            <View style={styles.timelineContent}>
              <Text style={styles.timelineLabel}>Response Received</Text>
              <Text style={styles.timelineDate}>
                {new Date(complaint.respondedAt).toLocaleString('en-IN')}
              </Text>
            </View>
          </View>
        )}
        {complaint.resolvedAt && (
          <View style={styles.timelineItem}>
            <View style={[styles.timelineDot, { backgroundColor: theme.colors.success }]} />
            <View style={styles.timelineContent}>
              <Text style={styles.timelineLabel}>Marked Resolved</Text>
              <Text style={styles.timelineDate}>
                {new Date(complaint.resolvedAt).toLocaleString('en-IN')}
              </Text>
            </View>
          </View>
        )}
        {complaint.closedAt && (
          <View style={styles.timelineItem}>
            <View style={[styles.timelineDot, { backgroundColor: theme.colors.muted }]} />
            <View style={styles.timelineContent}>
              <Text style={styles.timelineLabel}>Complaint Closed</Text>
              <Text style={styles.timelineDate}>
                {new Date(complaint.closedAt).toLocaleString('en-IN')}
              </Text>
            </View>
          </View>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.bg
  },
  content: {
    padding: theme.spacing.lg,
    paddingBottom: 40
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.bg
  },
  loadingText: {
    color: theme.colors.muted,
    fontSize: 16
  },
  errorText: {
    color: theme.colors.danger,
    fontSize: 16
  },
  statusCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    padding: theme.spacing.lg,
    borderRadius: theme.radius.lg,
    marginBottom: theme.spacing.lg
  },
  statusInfo: {
    flex: 1
  },
  statusLabel: {
    fontSize: 20,
    fontWeight: '800'
  },
  statusDate: {
    fontSize: 13,
    color: theme.colors.muted,
    marginTop: 4,
    fontWeight: '500'
  },
  section: {
    marginBottom: theme.spacing.lg
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.colors.text,
    marginBottom: theme.spacing.sm
  },
  detailCard: {
    backgroundColor: theme.colors.card,
    borderRadius: theme.radius.lg,
    padding: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    ...theme.shadow.soft
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border
  },
  detailContent: {
    flex: 1
  },
  detailLabel: {
    fontSize: 12,
    color: theme.colors.muted,
    fontWeight: '500'
  },
  detailValue: {
    fontSize: 14,
    color: theme.colors.text,
    fontWeight: '600',
    marginTop: 2
  },
  complaintCard: {
    backgroundColor: theme.colors.card,
    borderRadius: theme.radius.lg,
    padding: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    ...theme.shadow.soft
  },
  complaintHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 12,
    flexWrap: 'wrap'
  },
  issueTypeTag: {
    backgroundColor: theme.colors.primary + '15',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: theme.radius.pill
  },
  issueTypeText: {
    color: theme.colors.primary,
    fontWeight: '700',
    fontSize: 13
  },
  priorityTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: theme.radius.pill
  },
  priorityDot: {
    width: 8,
    height: 8,
    borderRadius: 4
  },
  priorityText: {
    fontSize: 12,
    fontWeight: '700'
  },
  complaintDescription: {
    fontSize: 15,
    color: theme.colors.text,
    lineHeight: 24,
    fontWeight: '500'
  },
  responseCard: {
    backgroundColor: '#F0FDF4',
    borderRadius: theme.radius.lg,
    padding: theme.spacing.md,
    borderLeftWidth: 4,
    borderLeftColor: theme.colors.success
  },
  responseHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4
  },
  responseHeaderText: {
    fontSize: 15,
    fontWeight: '700',
    color: theme.colors.success
  },
  responseDate: {
    fontSize: 12,
    color: theme.colors.muted,
    marginBottom: 12,
    fontWeight: '500'
  },
  responseText: {
    fontSize: 15,
    color: theme.colors.text,
    lineHeight: 24,
    fontWeight: '500'
  },
  resolutionBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: theme.colors.success + '30'
  },
  resolutionContent: {
    flex: 1
  },
  resolutionLabel: {
    fontSize: 12,
    color: theme.colors.muted,
    fontWeight: '600'
  },
  resolutionValue: {
    fontSize: 15,
    color: theme.colors.success,
    fontWeight: '700',
    marginTop: 2
  },
  resolutionNotes: {
    fontSize: 13,
    color: theme.colors.text,
    marginTop: 6,
    fontWeight: '500'
  },
  pendingCard: {
    backgroundColor: '#FFFBEB',
    borderRadius: theme.radius.lg,
    padding: theme.spacing.xl,
    alignItems: 'center'
  },
  pendingTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: theme.colors.warning,
    marginTop: 12
  },
  pendingText: {
    fontSize: 14,
    color: theme.colors.muted,
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 22,
    fontWeight: '500'
  },
  actionSection: {
    backgroundColor: theme.colors.card,
    borderRadius: theme.radius.lg,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    ...theme.shadow.soft
  },
  actionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: theme.colors.text,
    textAlign: 'center',
    marginBottom: theme.spacing.md
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12
  },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 14,
    borderRadius: theme.radius.lg,
    ...theme.shadow.soft
  },
  satisfiedBtn: {
    backgroundColor: theme.colors.success
  },
  unsatisfiedBtn: {
    backgroundColor: theme.colors.warning
  },
  actionBtnText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700'
  },
  closedCard: {
    backgroundColor: theme.colors.card,
    borderRadius: theme.radius.lg,
    padding: theme.spacing.xl,
    alignItems: 'center',
    marginBottom: theme.spacing.lg,
    borderWidth: 1,
    borderColor: theme.colors.border
  },
  closedTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: theme.colors.text,
    marginTop: 12
  },
  closedText: {
    fontSize: 14,
    color: theme.colors.muted,
    textAlign: 'center',
    marginTop: 8,
    fontWeight: '500'
  },
  closedDate: {
    fontSize: 12,
    color: theme.colors.muted,
    marginTop: 8,
    fontWeight: '500'
  },
  timeline: {
    backgroundColor: theme.colors.card,
    borderRadius: theme.radius.lg,
    padding: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.border
  },
  timelineTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: theme.colors.text,
    marginBottom: 12
  },
  timelineItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    marginBottom: 16
  },
  timelineDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginTop: 4
  },
  timelineContent: {
    flex: 1
  },
  timelineLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.text
  },
  timelineDate: {
    fontSize: 12,
    color: theme.colors.muted,
    marginTop: 2,
    fontWeight: '500'
  }
});
