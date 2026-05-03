import React, { useCallback, useState } from 'react';
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';
import { theme } from '../theme';

const RESOLUTION_TYPES = [
  { id: 'Re-service', label: 'Free Re-service', icon: 'construct-outline', desc: 'Redo the service at no cost' },
  { id: 'Refund', label: 'Full Refund', icon: 'cash-outline', desc: 'Return the full amount' },
  { id: 'Partial Refund', label: 'Partial Refund', icon: 'wallet-outline', desc: 'Return part of the amount' },
  { id: 'Compensation', label: 'Compensation', icon: 'gift-outline', desc: 'Offer discount/free service' },
  { id: 'Apology', label: 'Formal Apology', icon: 'hand-left-outline', desc: 'Issue a formal apology' },
  { id: 'No Action', label: 'No Action Required', icon: 'close-circle-outline', desc: 'Issue is invalid/resolved' }
];

const PRIORITY_CONFIG = {
  Low: { color: theme.colors.success, label: 'Low Priority' },
  Medium: { color: theme.colors.warning, label: 'Medium Priority' },
  High: { color: theme.colors.danger, label: 'High Priority' }
};

const STATUS_CONFIG = {
  Open: { color: theme.colors.primary, label: 'Open' },
  'In Review': { color: theme.colors.warning, label: 'In Review' },
  Resolved: { color: theme.colors.success, label: 'Resolved' },
  Closed: { color: theme.colors.muted, label: 'Closed' },
  Rejected: { color: theme.colors.danger, label: 'Rejected' }
};

export default function RespondComplaintScreen({ navigation, route }) {
  const { authHeaders } = useAuth();
  const complaintId = route.params?.complaintId;
  const [complaint, setComplaint] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    response: '',
    resolutionType: '',
    resolutionNotes: ''
  });

  const fetchComplaint = async () => {
    try {
      const { data } = await api.get(`/complaints/${complaintId}`, authHeaders);
      setComplaint(data);
      if (data.response) {
        setForm({
          response: data.response,
          resolutionType: data.resolutionType || '',
          resolutionNotes: data.resolutionNotes || ''
        });
      }
    } catch (error) {
      Alert.alert('Error', error?.response?.data?.message || 'Failed to load complaint');
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      if (complaintId) fetchComplaint();
    }, [complaintId])
  );

  const handleRespond = async () => {
    if (!form.response.trim()) {
      Alert.alert('Required', 'Please enter your response');
      return;
    }
    if (form.response.trim().length < 20) {
      Alert.alert('Too Short', 'Please provide a more detailed response (at least 20 characters)');
      return;
    }

    try {
      setSubmitting(true);
      await api.put(
        `/complaints/${complaintId}/respond`,
        {
          response: form.response.trim(),
          resolutionType: form.resolutionType || null,
          resolutionNotes: form.resolutionNotes.trim() || null
        },
        authHeaders
      );
      Alert.alert('Success', 'Response sent successfully', [
        { text: 'OK', onPress: () => fetchComplaint() }
      ]);
    } catch (error) {
      Alert.alert('Error', error?.response?.data?.message || 'Failed to send response');
    } finally {
      setSubmitting(false);
    }
  };

  const handleResolve = async () => {
    Alert.alert(
      'Mark as Resolved',
      'Are you sure you want to mark this complaint as resolved?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm',
          onPress: async () => {
            try {
              setSubmitting(true);
              await api.put(
                `/complaints/${complaintId}/resolve`,
                {
                  resolutionType: form.resolutionType || null,
                  resolutionNotes: form.resolutionNotes.trim() || null
                },
                authHeaders
              );
              Alert.alert('Success', 'Complaint marked as resolved', [
                { text: 'OK', onPress: () => navigation.goBack() }
              ]);
            } catch (error) {
              Alert.alert('Error', error?.response?.data?.message || 'Failed to resolve complaint');
            } finally {
              setSubmitting(false);
            }
          }
        }
      ]
    );
  };

  const handleReject = async () => {
    if (!form.response.trim()) {
      Alert.alert('Required', 'Please provide a reason for rejection');
      return;
    }

    Alert.alert(
      'Reject Complaint',
      'Are you sure you want to reject this complaint? This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reject',
          style: 'destructive',
          onPress: async () => {
            try {
              setSubmitting(true);
              await api.put(
                `/complaints/${complaintId}/reject`,
                { response: form.response.trim() },
                authHeaders
              );
              Alert.alert('Success', 'Complaint has been rejected', [
                { text: 'OK', onPress: () => navigation.goBack() }
              ]);
            } catch (error) {
              Alert.alert('Error', error?.response?.data?.message || 'Failed to reject complaint');
            } finally {
              setSubmitting(false);
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

  const priorityConfig = PRIORITY_CONFIG[complaint.priority] || PRIORITY_CONFIG.Medium;
  const statusConfig = STATUS_CONFIG[complaint.status] || STATUS_CONFIG.Open;
  const isEditable = ['Open', 'In Review'].includes(complaint.status);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={[styles.statusBanner, { backgroundColor: statusConfig.color + '15' }]}>
        <Text style={[styles.statusText, { color: statusConfig.color }]}>
          Status: {statusConfig.label}
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Customer Details</Text>
        <View style={styles.card}>
          <View style={styles.customerRow}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>
                {(complaint.userId?.name || 'U').charAt(0).toUpperCase()}
              </Text>
            </View>
            <View style={styles.customerInfo}>
              <Text style={styles.customerName}>{complaint.userId?.name || 'Customer'}</Text>
              <Text style={styles.customerEmail}>{complaint.userId?.email || ''}</Text>
            </View>
          </View>
          <View style={styles.divider} />
          <View style={styles.infoRow}>
            <Ionicons name="car-outline" size={16} color={theme.colors.muted} />
            <Text style={styles.infoText}>
              {complaint.vehicleId?.vehicleName} ({complaint.vehicleId?.vehicleNumber})
            </Text>
          </View>
          <View style={styles.infoRow}>
            <Ionicons name="construct-outline" size={16} color={theme.colors.muted} />
            <Text style={styles.infoText}>
              {complaint.bookingId?.serviceType} • {complaint.bookingId?.bookingDate}
            </Text>
          </View>
          <View style={styles.infoRow}>
            <Ionicons name="cash-outline" size={16} color={theme.colors.muted} />
            <Text style={styles.infoText}>
              Amount Paid: ₹{complaint.maintenanceRecordId?.cost || 'N/A'}
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Complaint Details</Text>
        <View style={styles.card}>
          <View style={styles.complaintHeader}>
            <View style={styles.issueTag}>
              <Text style={styles.issueTagText}>{complaint.issueType}</Text>
            </View>
            <View style={[styles.priorityTag, { backgroundColor: priorityConfig.color + '20' }]}>
              <View style={[styles.priorityDot, { backgroundColor: priorityConfig.color }]} />
              <Text style={[styles.priorityText, { color: priorityConfig.color }]}>
                {priorityConfig.label}
              </Text>
            </View>
          </View>
          <Text style={styles.complaintText}>{complaint.description}</Text>
          <Text style={styles.dateText}>
            Filed on {new Date(complaint.createdAt).toLocaleDateString('en-IN', {
              day: 'numeric',
              month: 'long',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            })}
          </Text>
        </View>
      </View>

      {isEditable ? (
        <>
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Your Response</Text>
            <TextInput
              style={styles.textArea}
              placeholder="Write your response to the customer here. Be professional and address their concerns clearly..."
              placeholderTextColor={theme.colors.muted}
              multiline
              numberOfLines={5}
              textAlignVertical="top"
              value={form.response}
              onChangeText={(text) => setForm((prev) => ({ ...prev, response: text }))}
            />
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Resolution Offered (Optional)</Text>
            <View style={styles.resolutionGrid}>
              {RESOLUTION_TYPES.map((type) => (
                <Pressable
                  key={type.id}
                  style={[
                    styles.resolutionCard,
                    form.resolutionType === type.id && styles.resolutionCardSelected
                  ]}
                  onPress={() =>
                    setForm((prev) => ({
                      ...prev,
                      resolutionType: prev.resolutionType === type.id ? '' : type.id
                    }))
                  }
                >
                  <Ionicons
                    name={type.icon}
                    size={22}
                    color={form.resolutionType === type.id ? '#fff' : theme.colors.primary}
                  />
                  <Text
                    style={[
                      styles.resolutionLabel,
                      form.resolutionType === type.id && styles.resolutionLabelSelected
                    ]}
                  >
                    {type.label}
                  </Text>
                  <Text
                    style={[
                      styles.resolutionDesc,
                      form.resolutionType === type.id && styles.resolutionDescSelected
                    ]}
                    numberOfLines={2}
                  >
                    {type.desc}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>

          {form.resolutionType && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Resolution Notes</Text>
              <TextInput
                style={styles.notesInput}
                placeholder="Add details about the resolution (e.g., discount code, appointment details)..."
                placeholderTextColor={theme.colors.muted}
                multiline
                numberOfLines={3}
                textAlignVertical="top"
                value={form.resolutionNotes}
                onChangeText={(text) => setForm((prev) => ({ ...prev, resolutionNotes: text }))}
              />
            </View>
          )}

          <View style={styles.actionButtons}>
            <Pressable
              style={[styles.actionBtn, styles.respondBtn, submitting && styles.btnDisabled]}
              onPress={handleRespond}
              disabled={submitting}
            >
              <Ionicons name="chatbubble-ellipses" size={18} color="#fff" />
              <Text style={styles.actionBtnText}>
                {complaint.response ? 'Update Response' : 'Send Response'}
              </Text>
            </Pressable>

            {complaint.response && (
              <Pressable
                style={[styles.actionBtn, styles.resolveBtn, submitting && styles.btnDisabled]}
                onPress={handleResolve}
                disabled={submitting}
              >
                <Ionicons name="checkmark-circle" size={18} color="#fff" />
                <Text style={styles.actionBtnText}>Mark Resolved</Text>
              </Pressable>
            )}

            <Pressable
              style={[styles.actionBtn, styles.rejectBtn, submitting && styles.btnDisabled]}
              onPress={handleReject}
              disabled={submitting}
            >
              <Ionicons name="close-circle" size={18} color="#fff" />
              <Text style={styles.actionBtnText}>Reject Complaint</Text>
            </Pressable>
          </View>
        </>
      ) : (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Your Response</Text>
          <View style={styles.responseCard}>
            <Text style={styles.responseText}>{complaint.response}</Text>
            {complaint.resolutionType && (
              <View style={styles.resolutionInfo}>
                <Ionicons name="checkmark-done" size={16} color={theme.colors.success} />
                <Text style={styles.resolutionInfoText}>
                  Resolution: {complaint.resolutionType}
                </Text>
              </View>
            )}
            {complaint.resolutionNotes && (
              <Text style={styles.resolutionNotesText}>{complaint.resolutionNotes}</Text>
            )}
            <Text style={styles.respondedDate}>
              Responded on {new Date(complaint.respondedAt).toLocaleDateString('en-IN')}
            </Text>
          </View>

          {complaint.status === 'Closed' && (
            <View style={styles.closedInfo}>
              <Ionicons
                name={complaint.userSatisfied ? 'happy' : 'sad'}
                size={24}
                color={complaint.userSatisfied ? theme.colors.success : theme.colors.warning}
              />
              <Text style={styles.closedText}>
                Customer {complaint.userSatisfied ? 'was satisfied' : 'was not satisfied'} with the resolution
              </Text>
            </View>
          )}
        </View>
      )}
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
  statusBanner: {
    padding: 12,
    borderRadius: theme.radius.md,
    marginBottom: theme.spacing.lg,
    alignItems: 'center'
  },
  statusText: {
    fontSize: 14,
    fontWeight: '700'
  },
  section: {
    marginBottom: theme.spacing.lg
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: theme.colors.text,
    marginBottom: theme.spacing.sm
  },
  card: {
    backgroundColor: theme.colors.card,
    borderRadius: theme.radius.lg,
    padding: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    ...theme.shadow.soft
  },
  customerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: theme.colors.primary + '20',
    justifyContent: 'center',
    alignItems: 'center'
  },
  avatarText: {
    fontSize: 20,
    fontWeight: '700',
    color: theme.colors.primary
  },
  customerInfo: {
    flex: 1
  },
  customerName: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.colors.text
  },
  customerEmail: {
    fontSize: 13,
    color: theme.colors.muted,
    marginTop: 2
  },
  divider: {
    height: 1,
    backgroundColor: theme.colors.border,
    marginBottom: 12
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 6
  },
  infoText: {
    fontSize: 13,
    color: theme.colors.text,
    fontWeight: '500'
  },
  complaintHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 12,
    flexWrap: 'wrap'
  },
  issueTag: {
    backgroundColor: theme.colors.danger + '15',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: theme.radius.pill
  },
  issueTagText: {
    color: theme.colors.danger,
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
  complaintText: {
    fontSize: 15,
    color: theme.colors.text,
    lineHeight: 24,
    fontWeight: '500',
    marginBottom: 12
  },
  dateText: {
    fontSize: 12,
    color: theme.colors.muted,
    fontWeight: '500'
  },
  textArea: {
    backgroundColor: theme.colors.card,
    borderRadius: theme.radius.lg,
    padding: theme.spacing.md,
    fontSize: 15,
    minHeight: 120,
    borderWidth: 1,
    borderColor: theme.colors.border,
    color: theme.colors.text,
    fontWeight: '500',
    ...theme.shadow.soft
  },
  resolutionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10
  },
  resolutionCard: {
    width: '48%',
    backgroundColor: theme.colors.card,
    borderRadius: theme.radius.md,
    padding: theme.spacing.sm,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.border,
    ...theme.shadow.soft
  },
  resolutionCardSelected: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary
  },
  resolutionLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: theme.colors.text,
    marginTop: 8,
    textAlign: 'center'
  },
  resolutionLabelSelected: {
    color: '#fff'
  },
  resolutionDesc: {
    fontSize: 11,
    color: theme.colors.muted,
    textAlign: 'center',
    marginTop: 4
  },
  resolutionDescSelected: {
    color: '#ffffffcc'
  },
  notesInput: {
    backgroundColor: theme.colors.card,
    borderRadius: theme.radius.lg,
    padding: theme.spacing.md,
    fontSize: 14,
    minHeight: 80,
    borderWidth: 1,
    borderColor: theme.colors.border,
    color: theme.colors.text,
    fontWeight: '500',
    ...theme.shadow.soft
  },
  actionButtons: {
    gap: 12,
    marginTop: theme.spacing.md
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    padding: 16,
    borderRadius: theme.radius.lg,
    ...theme.shadow.soft
  },
  respondBtn: {
    backgroundColor: theme.colors.primary
  },
  resolveBtn: {
    backgroundColor: theme.colors.success
  },
  rejectBtn: {
    backgroundColor: theme.colors.danger
  },
  btnDisabled: {
    opacity: 0.6
  },
  actionBtnText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700'
  },
  responseCard: {
    backgroundColor: '#F0FDF4',
    borderRadius: theme.radius.lg,
    padding: theme.spacing.md,
    borderLeftWidth: 4,
    borderLeftColor: theme.colors.success
  },
  responseText: {
    fontSize: 15,
    color: theme.colors.text,
    lineHeight: 24,
    fontWeight: '500'
  },
  resolutionInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: theme.colors.success + '30'
  },
  resolutionInfoText: {
    fontSize: 14,
    color: theme.colors.success,
    fontWeight: '600'
  },
  resolutionNotesText: {
    fontSize: 13,
    color: theme.colors.muted,
    marginTop: 8,
    fontWeight: '500'
  },
  respondedDate: {
    fontSize: 12,
    color: theme.colors.muted,
    marginTop: 12,
    fontWeight: '500'
  },
  closedInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: theme.colors.card,
    borderRadius: theme.radius.md,
    padding: theme.spacing.md,
    marginTop: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.border
  },
  closedText: {
    flex: 1,
    fontSize: 14,
    color: theme.colors.text,
    fontWeight: '600'
  }
});
