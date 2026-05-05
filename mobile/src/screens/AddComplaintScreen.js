import React, { useState } from 'react';
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';
import { formatCurrency } from '../formatCurrency';
import { theme } from '../theme';

const ISSUE_TYPES = [
  { id: 'Service Quality', label: 'Service Quality', icon: 'construct-outline' },
  { id: 'Overcharging', label: 'Overcharging', icon: 'cash-outline' },
  { id: 'Delay', label: 'Delay in Service', icon: 'time-outline' },
  { id: 'Vehicle Damage', label: 'Vehicle Damage', icon: 'car-outline' },
  { id: 'Unprofessional Behavior', label: 'Unprofessional Behavior', icon: 'person-outline' },
  { id: 'Incomplete Work', label: 'Incomplete Work', icon: 'alert-circle-outline' },
  { id: 'Other', label: 'Other Issue', icon: 'ellipsis-horizontal-outline' }
];

const PRIORITIES = [
  { id: 'Low', label: 'Low', color: theme.colors.success, desc: 'Minor issue' },
  { id: 'Medium', label: 'Medium', color: theme.colors.warning, desc: 'Needs attention' },
  { id: 'High', label: 'High', color: theme.colors.danger, desc: 'Urgent issue' }
];

export default function AddComplaintScreen({ navigation, route }) {
  const { authHeaders } = useAuth();
  const record = route.params?.record || null;
  const [form, setForm] = useState({
    issueType: '',
    priority: 'Medium',
    description: ''
  });
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!form.issueType) {
      Alert.alert('Required', 'Please select an issue type');
      return;
    }
    if (!form.description.trim()) {
      Alert.alert('Required', 'Please describe your issue');
      return;
    }
    if (form.description.trim().length < 20) {
      Alert.alert('Too Short', 'Please provide more details about your issue (at least 20 characters)');
      return;
    }

    try {
      setSubmitting(true);
      await api.post(
        '/complaints',
        {
          maintenanceRecordId: record._id,
          issueType: form.issueType,
          priority: form.priority,
          description: form.description.trim()
        },
        authHeaders
      );
      Alert.alert(
        'Complaint Submitted',
        'Your complaint has been submitted successfully. The service center will respond soon.',
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );
    } catch (error) {
      Alert.alert('Error', error?.response?.data?.message || 'Failed to submit complaint');
    } finally {
      setSubmitting(false);
    }
  };

  if (!record) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>No service record found.</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.infoCard}>
        <View style={styles.infoHeader}>
          <Ionicons name="information-circle" size={22} color={theme.colors.primary} />
          <Text style={styles.infoTitle}>Filing Complaint For</Text>
        </View>
        <Text style={styles.infoText}>
          {record.serviceCenterId?.centerName} • {record.serviceDate?.slice(0, 10)}
        </Text>
        <Text style={styles.infoSubtext}>
          {record.vehicleId?.vehicleName} • {formatCurrency(record.cost)}
        </Text>
      </View>

      <Text style={styles.sectionTitle}>Select Issue Type</Text>
      <View style={styles.issueGrid}>
        {ISSUE_TYPES.map((issue) => (
          <Pressable
            key={issue.id}
            style={[
              styles.issueChip,
              form.issueType === issue.id && styles.issueChipSelected
            ]}
            onPress={() => setForm((prev) => ({ ...prev, issueType: issue.id }))}
          >
            <Ionicons
              name={issue.icon}
              size={20}
              color={form.issueType === issue.id ? '#fff' : theme.colors.text}
            />
            <Text
              style={[
                styles.issueChipText,
                form.issueType === issue.id && styles.issueChipTextSelected
              ]}
            >
              {issue.label}
            </Text>
          </Pressable>
        ))}
      </View>

      <Text style={styles.sectionTitle}>Priority Level</Text>
      <View style={styles.priorityRow}>
        {PRIORITIES.map((priority) => (
          <Pressable
            key={priority.id}
            style={[
              styles.priorityCard,
              form.priority === priority.id && {
                borderColor: priority.color,
                backgroundColor: priority.color + '15'
              }
            ]}
            onPress={() => setForm((prev) => ({ ...prev, priority: priority.id }))}
          >
            <View style={[styles.priorityDot, { backgroundColor: priority.color }]} />
            <Text
              style={[
                styles.priorityLabel,
                form.priority === priority.id && { color: priority.color }
              ]}
            >
              {priority.label}
            </Text>
            <Text style={styles.priorityDesc}>{priority.desc}</Text>
          </Pressable>
        ))}
      </View>

      <Text style={styles.sectionTitle}>Describe Your Issue</Text>
      <TextInput
        style={styles.textArea}
        placeholder="Please describe the issue in detail. Include what happened, what you expected, and any other relevant information..."
        placeholderTextColor={theme.colors.muted}
        multiline
        numberOfLines={6}
        textAlignVertical="top"
        value={form.description}
        onChangeText={(text) => setForm((prev) => ({ ...prev, description: text }))}
      />
      <Text style={styles.charCount}>{form.description.length} characters</Text>

      <View style={styles.noteCard}>
        <Ionicons name="bulb-outline" size={20} color={theme.colors.warning} />
        <Text style={styles.noteText}>
          The service center will be notified and will respond to your complaint. You can track the status in "My Complaints".
        </Text>
      </View>

      <Pressable
        style={[styles.submitBtn, submitting && styles.submitBtnDisabled]}
        onPress={handleSubmit}
        disabled={submitting}
      >
        <Ionicons name="send" size={20} color="#fff" />
        <Text style={styles.submitBtnText}>
          {submitting ? 'Submitting...' : 'Submit Complaint'}
        </Text>
      </Pressable>

      <Pressable style={styles.cancelBtn} onPress={() => navigation.goBack()}>
        <Text style={styles.cancelBtnText}>Cancel</Text>
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
    padding: theme.spacing.lg,
    paddingBottom: 40
  },
  errorText: {
    color: theme.colors.danger,
    textAlign: 'center',
    marginTop: 40,
    fontSize: 16
  },
  infoCard: {
    backgroundColor: theme.colors.bg2,
    borderRadius: theme.radius.md,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.lg,
    borderLeftWidth: 4,
    borderLeftColor: theme.colors.primary
  },
  infoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8
  },
  infoTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: theme.colors.primary
  },
  infoText: {
    fontSize: 15,
    fontWeight: '700',
    color: theme.colors.text
  },
  infoSubtext: {
    fontSize: 13,
    color: theme.colors.muted,
    marginTop: 4,
    fontWeight: '600'
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: theme.colors.text,
    marginBottom: theme.spacing.sm,
    marginTop: theme.spacing.sm
  },
  issueGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: theme.spacing.md
  },
  issueChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: theme.radius.pill,
    backgroundColor: theme.colors.card,
    borderWidth: 1,
    borderColor: theme.colors.border,
    ...theme.shadow.soft
  },
  issueChipSelected: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary
  },
  issueChipText: {
    fontSize: 13,
    fontWeight: '600',
    color: theme.colors.text
  },
  issueChipTextSelected: {
    color: '#fff'
  },
  priorityRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: theme.spacing.lg
  },
  priorityCard: {
    flex: 1,
    backgroundColor: theme.colors.card,
    borderRadius: theme.radius.md,
    padding: theme.spacing.sm,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: theme.colors.border
  },
  priorityDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginBottom: 6
  },
  priorityLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: theme.colors.text
  },
  priorityDesc: {
    fontSize: 11,
    color: theme.colors.muted,
    marginTop: 2
  },
  textArea: {
    backgroundColor: theme.colors.card,
    borderRadius: theme.radius.lg,
    padding: theme.spacing.md,
    fontSize: 15,
    minHeight: 140,
    borderWidth: 1,
    borderColor: theme.colors.border,
    color: theme.colors.text,
    fontWeight: '500',
    ...theme.shadow.soft
  },
  charCount: {
    fontSize: 12,
    color: theme.colors.muted,
    textAlign: 'right',
    marginTop: 6,
    marginBottom: theme.spacing.md
  },
  noteCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    backgroundColor: '#FFFBEB',
    borderRadius: theme.radius.md,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.lg
  },
  noteText: {
    flex: 1,
    fontSize: 13,
    color: theme.colors.text,
    lineHeight: 20,
    fontWeight: '500'
  },
  submitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: theme.colors.danger,
    borderRadius: theme.radius.lg,
    padding: 16,
    ...theme.shadow.soft
  },
  submitBtnDisabled: {
    opacity: 0.6
  },
  submitBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700'
  },
  cancelBtn: {
    alignItems: 'center',
    padding: 14,
    marginTop: 10
  },
  cancelBtnText: {
    color: theme.colors.muted,
    fontSize: 15,
    fontWeight: '600'
  }
});
