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
  Open: { color: theme.colors.primary, icon: 'radio-button-on', label: 'New' },
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

export default function ServiceCenterComplaintsScreen({ navigation }) {
  const { authHeaders } = useAuth();
  const [complaints, setComplaints] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState('Active');

  const fetchData = async () => {
    try {
      const [complaintsRes, statsRes] = await Promise.all([
        api.get('/complaints', authHeaders),
        api.get('/complaints/stats', authHeaders)
      ]);
      setComplaints(complaintsRes.data);
      setStats(statsRes.data);
    } catch (error) {
      Alert.alert('Error', error?.response?.data?.message || 'Failed to load complaints');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchData();
    }, [])
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  const filteredComplaints = complaints.filter((c) => {
    if (filter === 'All') return true;
    if (filter === 'Active') return ['Open', 'In Review'].includes(c.status);
    if (filter === 'Resolved') return c.status === 'Resolved';
    if (filter === 'Closed') return ['Closed', 'Rejected'].includes(c.status);
    return true;
  });

  const sortedComplaints = [...filteredComplaints].sort((a, b) => {
    const priorityOrder = { High: 0, Medium: 1, Low: 2 };
    if (a.status === 'Open' && b.status !== 'Open') return -1;
    if (a.status !== 'Open' && b.status === 'Open') return 1;
    if (a.priority !== b.priority) {
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    }
    return new Date(b.createdAt) - new Date(a.createdAt);
  });

  const renderStats = () => (
    <View style={styles.statsContainer}>
      <View style={[styles.statCard, styles.statOpen]}>
        <Text style={styles.statNumber}>{stats?.open || 0}</Text>
        <Text style={styles.statLabel}>Open</Text>
      </View>
      <View style={[styles.statCard, styles.statReview]}>
        <Text style={styles.statNumber}>{stats?.inReview || 0}</Text>
        <Text style={styles.statLabel}>In Review</Text>
      </View>
      <View style={[styles.statCard, styles.statResolved]}>
        <Text style={styles.statNumber}>{stats?.resolved || 0}</Text>
        <Text style={styles.statLabel}>Resolved</Text>
      </View>
      <View style={[styles.statCard, styles.statClosed]}>
        <Text style={styles.statNumber}>{stats?.closed || 0}</Text>
        <Text style={styles.statLabel}>Closed</Text>
      </View>
    </View>
  );

  const renderComplaint = ({ item }) => {
    const statusConfig = STATUS_CONFIG[item.status] || STATUS_CONFIG.Open;
    const priorityColor = PRIORITY_COLORS[item.priority] || theme.colors.warning;
    const isUrgent = item.priority === 'High' && item.status === 'Open';

    return (
      <Pressable
        style={[styles.card, isUrgent && styles.urgentCard]}
        onPress={() => navigation.navigate('RespondComplaint', { complaintId: item._id })}
      >
        {isUrgent && (
          <View style={styles.urgentBanner}>
            <Ionicons name="alert-circle" size={14} color="#fff" />
            <Text style={styles.urgentText}>Urgent - Requires Immediate Attention</Text>
          </View>
        )}
        
        <View style={styles.cardHeader}>
          <View style={styles.customerInfo}>
            <View style={styles.avatarCircle}>
              <Text style={styles.avatarText}>
                {(item.userId?.name || 'U').charAt(0).toUpperCase()}
              </Text>
            </View>
            <View>
              <Text style={styles.customerName}>{item.userId?.name || 'Customer'}</Text>
              <Text style={styles.vehicleText}>
                {item.vehicleId?.vehicleName} • {item.vehicleId?.vehicleNumber}
              </Text>
            </View>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: statusConfig.color + '20' }]}>
            <Ionicons name={statusConfig.icon} size={12} color={statusConfig.color} />
            <Text style={[styles.statusText, { color: statusConfig.color }]}>
              {statusConfig.label}
            </Text>
          </View>
        </View>

        <View style={styles.issueRow}>
          <View style={[styles.priorityIndicator, { backgroundColor: priorityColor }]} />
          <Text style={styles.issueType}>{item.issueType}</Text>
          <Text style={styles.priorityLabel}>{item.priority}</Text>
        </View>

        <Text style={styles.description} numberOfLines={2}>
          {item.description}
        </Text>

        <View style={styles.cardFooter}>
          <View style={styles.dateInfo}>
            <Ionicons name="time-outline" size={14} color={theme.colors.muted} />
            <Text style={styles.dateText}>
              {new Date(item.createdAt).toLocaleDateString('en-IN', {
                day: 'numeric',
                month: 'short'
              })}
            </Text>
          </View>
          <View style={styles.serviceInfo}>
            <Ionicons name="construct-outline" size={14} color={theme.colors.muted} />
            <Text style={styles.serviceText}>
              {item.bookingId?.serviceType || 'Service'}
            </Text>
          </View>
        </View>

        <Pressable
          style={[
            styles.actionButton,
            item.status === 'Open' ? styles.respondBtn : styles.viewBtn
          ]}
          onPress={() => navigation.navigate('RespondComplaint', { complaintId: item._id })}
        >
          <Ionicons
            name={item.status === 'Open' ? 'chatbubble-ellipses' : 'eye'}
            size={16}
            color="#fff"
          />
          <Text style={styles.actionButtonText}>
            {item.status === 'Open' ? 'Respond Now' : 'View Details'}
          </Text>
        </Pressable>
      </Pressable>
    );
  };

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="happy-outline" size={64} color={theme.colors.success} />
      <Text style={styles.emptyTitle}>No Complaints</Text>
      <Text style={styles.emptySubtext}>
        {filter === 'Active'
          ? 'Great job! No active complaints to handle.'
          : `No ${filter.toLowerCase()} complaints found.`}
      </Text>
    </View>
  );

  const filterOptions = ['Active', 'All', 'Resolved', 'Closed'];

  return (
    <View style={styles.container}>
      {stats && renderStats()}

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
              {option === 'Active' && stats && (stats.open + stats.inReview) > 0 && (
                <Text style={styles.filterCount}> ({stats.open + stats.inReview})</Text>
              )}
            </Text>
          </Pressable>
        ))}
      </View>

      <FlatList
        data={sortedComplaints}
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
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.md,
    gap: 8
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
    borderRadius: theme.radius.md,
    ...theme.shadow.soft
  },
  statOpen: {
    backgroundColor: '#EBF5FF'
  },
  statReview: {
    backgroundColor: '#FFF8E6'
  },
  statResolved: {
    backgroundColor: '#E6F9F1'
  },
  statClosed: {
    backgroundColor: '#F5F5F5'
  },
  statNumber: {
    fontSize: 20,
    fontWeight: '800',
    color: theme.colors.text
  },
  statLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: theme.colors.muted,
    marginTop: 2
  },
  filterRow: {
    flexDirection: 'row',
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    gap: 8
  },
  filterChip: {
    paddingHorizontal: 14,
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
  filterCount: {
    fontWeight: '800'
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
  urgentCard: {
    borderColor: theme.colors.danger,
    borderWidth: 2
  },
  urgentBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: theme.colors.danger,
    marginHorizontal: -theme.spacing.md,
    marginTop: -theme.spacing.md,
    marginBottom: theme.spacing.sm,
    padding: 8,
    borderTopLeftRadius: theme.radius.lg - 2,
    borderTopRightRadius: theme.radius.lg - 2
  },
  urgentText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700'
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12
  },
  customerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1
  },
  avatarCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.colors.primary + '20',
    justifyContent: 'center',
    alignItems: 'center'
  },
  avatarText: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.colors.primary
  },
  customerName: {
    fontSize: 15,
    fontWeight: '700',
    color: theme.colors.text
  },
  vehicleText: {
    fontSize: 12,
    color: theme.colors.muted,
    marginTop: 2,
    fontWeight: '500'
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: theme.radius.pill
  },
  statusText: {
    fontSize: 11,
    fontWeight: '700'
  },
  issueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8
  },
  priorityIndicator: {
    width: 4,
    height: 20,
    borderRadius: 2
  },
  issueType: {
    fontSize: 14,
    fontWeight: '700',
    color: theme.colors.text,
    flex: 1
  },
  priorityLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: theme.colors.muted,
    textTransform: 'uppercase'
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
    borderTopColor: theme.colors.border,
    marginBottom: 12
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
  serviceInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4
  },
  serviceText: {
    fontSize: 12,
    color: theme.colors.muted,
    fontWeight: '500'
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 12,
    borderRadius: theme.radius.md,
    ...theme.shadow.soft
  },
  respondBtn: {
    backgroundColor: theme.colors.primary
  },
  viewBtn: {
    backgroundColor: theme.colors.primary2
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700'
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
    marginTop: 8,
    textAlign: 'center'
  }
});
