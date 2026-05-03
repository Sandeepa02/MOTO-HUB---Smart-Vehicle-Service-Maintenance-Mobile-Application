import React, { useCallback, useState } from 'react';
import {
  Alert,
  FlatList,
  Pressable,
  RefreshControl,
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
  Open: { color: theme.colors.primary, icon: 'radio-button-on', label: 'Open' },
  'In Review': { color: theme.colors.warning, icon: 'time', label: 'In Review' },
  Resolved: { color: theme.colors.success, icon: 'checkmark-circle', label: 'Resolved' },
  Closed: { color: theme.colors.muted, icon: 'lock-closed', label: 'Closed' },
  Rejected: { color: theme.colors.danger, icon: 'close-circle', label: 'Rejected' }
};

const PRIORITY_COLORS = {
  Low: theme.colors.success,
  Medium: theme.colors.warning,
  High: theme.colors.danger
};

export default function MyComplaintsScreen({ navigation }) {
  const { authHeaders } = useAuth();
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState('All');

  const fetchComplaints = async () => {
    try {
      const { data } = await api.get('/complaints', authHeaders);
      setComplaints(data);
    } catch (error) {
      Alert.alert('Error', error?.response?.data?.message || 'Failed to load complaints');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchComplaints();
    }, [])
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchComplaints();
  };

  const filteredComplaints = complaints.filter((c) => {
    if (filter === 'All') return true;
    if (filter === 'Active') return ['Open', 'In Review'].includes(c.status);
    if (filter === 'Resolved') return c.status === 'Resolved';
    if (filter === 'Closed') return ['Closed', 'Rejected'].includes(c.status);
    return true;
  });

  const renderComplaint = ({ item }) => {
    const statusConfig = STATUS_CONFIG[item.status] || STATUS_CONFIG.Open;
    const priorityColor = PRIORITY_COLORS[item.priority] || theme.colors.warning;

    return (
      <Pressable
        style={styles.card}
        onPress={() => navigation.navigate('ComplaintDetails', { complaintId: item._id })}
      >
        <View style={styles.cardHeader}>
          <View style={styles.centerInfo}>
            <Text style={styles.centerName} numberOfLines={1}>
              {item.serviceCenterId?.centerName || 'Service Center'}
            </Text>
            <Text style={styles.vehicleName}>
              {item.vehicleId?.vehicleName || 'Vehicle'}
            </Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: statusConfig.color + '20' }]}>
            <Ionicons name={statusConfig.icon} size={14} color={statusConfig.color} />
            <Text style={[styles.statusText, { color: statusConfig.color }]}>
              {statusConfig.label}
            </Text>
          </View>
        </View>

        <View style={styles.issueRow}>
          <View style={[styles.priorityDot, { backgroundColor: priorityColor }]} />
          <Text style={styles.issueType}>{item.issueType}</Text>
        </View>

        <Text style={styles.description} numberOfLines={2}>
          {item.description}
        </Text>

        <View style={styles.cardFooter}>
          <View style={styles.dateInfo}>
            <Ionicons name="calendar-outline" size={14} color={theme.colors.muted} />
            <Text style={styles.dateText}>
              {new Date(item.createdAt).toLocaleDateString('en-IN', {
                day: 'numeric',
                month: 'short',
                year: 'numeric'
              })}
            </Text>
          </View>
          {item.response ? (
            <View style={styles.responseIndicator}>
              <Ionicons name="chatbubble-ellipses" size={14} color={theme.colors.success} />
              <Text style={styles.responseText}>Response received</Text>
            </View>
          ) : (
            <Text style={styles.pendingText}>Awaiting response</Text>
          )}
        </View>

        <View style={styles.viewDetails}>
          <Text style={styles.viewDetailsText}>View Details</Text>
          <Ionicons name="chevron-forward" size={16} color={theme.colors.primary} />
        </View>
      </Pressable>
    );
  };

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="document-text-outline" size={64} color={theme.colors.border} />
      <Text style={styles.emptyTitle}>No Complaints Found</Text>
      <Text style={styles.emptySubtext}>
        {filter === 'All'
          ? "You haven't filed any complaints yet"
          : `No ${filter.toLowerCase()} complaints`}
      </Text>
    </View>
  );

  const filterOptions = ['All', 'Active', 'Resolved', 'Closed'];

  return (
    <View style={styles.container}>
      <View style={styles.filterRow}>
        {filterOptions.map((option) => (
          <Pressable
            key={option}
            style={[styles.filterChip, filter === option && styles.filterChipActive]}
            onPress={() => setFilter(option)}
          >
            <Text
              style={[styles.filterText, filter === option && styles.filterTextActive]}
            >
              {option}
            </Text>
          </Pressable>
        ))}
      </View>

      <FlatList
        data={filteredComplaints}
        keyExtractor={(item) => item._id}
        renderItem={renderComplaint}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[theme.colors.primary]}
          />
        }
        ListEmptyComponent={renderEmpty}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.bg
  },
  filterRow: {
    flexDirection: 'row',
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    gap: 10
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: theme.radius.pill,
    backgroundColor: theme.colors.card,
    borderWidth: 1,
    borderColor: theme.colors.border
  },
  filterChipActive: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary
  },
  filterText: {
    fontSize: 13,
    fontWeight: '600',
    color: theme.colors.muted
  },
  filterTextActive: {
    color: '#fff'
  },
  listContent: {
    padding: theme.spacing.lg,
    paddingTop: 0,
    flexGrow: 1
  },
  card: {
    backgroundColor: theme.colors.card,
    borderRadius: theme.radius.lg,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    ...theme.shadow.soft
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10
  },
  centerInfo: {
    flex: 1,
    marginRight: 10
  },
  centerName: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.colors.text
  },
  vehicleName: {
    fontSize: 13,
    color: theme.colors.muted,
    marginTop: 2,
    fontWeight: '500'
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: theme.radius.pill
  },
  statusText: {
    fontSize: 12,
    fontWeight: '700'
  },
  issueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8
  },
  priorityDot: {
    width: 8,
    height: 8,
    borderRadius: 4
  },
  issueType: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.text
  },
  description: {
    fontSize: 13,
    color: theme.colors.muted,
    lineHeight: 20,
    marginBottom: 12,
    fontWeight: '500'
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border
  },
  dateInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4
  },
  dateText: {
    fontSize: 12,
    color: theme.colors.muted,
    fontWeight: '500'
  },
  responseIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4
  },
  responseText: {
    fontSize: 12,
    color: theme.colors.success,
    fontWeight: '600'
  },
  pendingText: {
    fontSize: 12,
    color: theme.colors.warning,
    fontWeight: '600'
  },
  viewDetails: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border
  },
  viewDetailsText: {
    fontSize: 14,
    fontWeight: '700',
    color: theme.colors.primary
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.colors.text,
    marginTop: 16
  },
  emptySubtext: {
    fontSize: 14,
    color: theme.colors.muted,
    marginTop: 8
  }
});
