import React, { useCallback, useMemo, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';
import { theme } from '../theme';
import ListItem from '../components/ListItem';

const actions = [
  { title: 'Incoming Bookings', subtitle: 'Accept and manage bookings', target: 'ServiceCenterBookings', icon: 'clipboard-outline' },
  { title: 'Maintenance Records', subtitle: 'Add and update records', target: 'Maintenance', icon: 'build-outline' },
  { title: 'Manage Services', subtitle: 'Edit service packages', target: 'ManageServices', icon: 'construct-outline' },
  { title: 'Customer Complaints', subtitle: 'View and respond to complaints', target: 'ServiceCenterComplaints', icon: 'chatbubble-ellipses-outline' }
];

const normalizeDate = (value) => {
  if (!value) return null;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return null;
  d.setHours(0, 0, 0, 0);
  return d;
};

export default function ServiceCenterHomeScreen({ navigation }) {
  const { user, authHeaders } = useAuth();
  const [upcoming, setUpcoming] = useState([]);
  const [allBookings, setAllBookings] = useState([]);

  const displayName = useMemo(
    () => user?.serviceCenterProfile?.centerName || user?.name || 'Service Center',
    [user?.name, user?.serviceCenterProfile?.centerName]
  );

  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  }, []);

  const stats = useMemo(() => {
    const pending = allBookings.filter((b) => b?.status === 'Pending').length;
    const accepted = allBookings.filter((b) => b?.status === 'Accepted').length;
    const completed = allBookings.filter((b) => b?.status === 'Completed').length;
    const allClear = pending === 0;
    return { pending, accepted, completed, allClear };
  }, [allBookings]);

  const fetchBookings = async () => {
    const { data } = await api.get('/bookings', authHeaders);
    const rows = Array.isArray(data) ? data : [];
    setAllBookings(rows);

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const upcomingAccepted = rows
      .filter((b) => b?.status === 'Accepted')
      .filter((b) => {
        const d = normalizeDate(b?.bookingDate);
        if (!d) return true;
        return d >= today;
      })
      .sort((a, b) => {
        const da = normalizeDate(a?.bookingDate);
        const db = normalizeDate(b?.bookingDate);
        if (!da && !db) return 0;
        if (!da) return 1;
        if (!db) return -1;
        return da.getTime() - db.getTime();
      });

    setUpcoming(upcomingAccepted.slice(0, 5));
  };

  useFocusEffect(
    useCallback(() => {
      fetchBookings().catch((error) => Alert.alert('Error', error?.response?.data?.message || 'Failed loading bookings'));
    }, [])
  );

  const goToNotifications = () => navigation.getParent?.()?.navigate?.('NotificationsTab');
  const goToProfile = () => navigation.getParent?.()?.navigate?.('ProfileTab');

  const pillStyles = {
    pending: styles.pillPending,
    accepted: styles.pillAccepted,
    completed: styles.pillCompleted
  };

  const StatPill = ({ label, value, variant }) => (
    <View style={[styles.pill, pillStyles[variant]]}>
      <Text style={styles.pillValue}>{value}</Text>
      <Text style={styles.pillLabel}>{label}</Text>
    </View>
  );

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.topRow}>
        <View style={{ flex: 1 }}>
          <Text style={styles.kicker}>{greeting}</Text>
          <Text style={styles.title}>{displayName}</Text>
        </View>
        <Pressable style={styles.iconBtn} onPress={goToNotifications}>
          <Ionicons name="notifications-outline" size={20} color={theme.colors.text} />
        </Pressable>
        <Pressable style={styles.iconBtn} onPress={goToProfile}>
          <Ionicons name="person-outline" size={20} color={theme.colors.text} />
        </Pressable>
      </View>

      <View style={styles.statusCard}>
        <View style={styles.statusHeader}>
          <Text style={styles.statusTitle}>System Status</Text>
          <View style={[styles.statusChip, stats.allClear ? styles.statusChipOk : styles.statusChipWarn]}>
            <View style={[styles.dot, stats.allClear ? styles.dotOk : styles.dotWarn]} />
            <Text style={[styles.statusChipText, stats.allClear ? styles.statusTextOk : styles.statusTextWarn]}>
              {stats.allClear ? 'All clear' : 'Needs attention'}
            </Text>
          </View>
        </View>
        <Text style={styles.statusSub}>
          {stats.allClear ? 'No pending bookings right now.' : `${stats.pending} booking(s) waiting for acceptance.`}
        </Text>
        <View style={styles.pillsRow}>
          <StatPill label="Pending" value={stats.pending} variant="pending" />
          <StatPill label="Accepted" value={stats.accepted} variant="accepted" />
          <StatPill label="Completed" value={stats.completed} variant="completed" />
        </View>
      </View>

      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <Text style={styles.sectionSub}>Common tasks for today.</Text>
      </View>

      <View style={styles.section}>
        {actions.map((action, idx) => (
          <ListItem
            key={action.target}
            icon={action.icon}
            title={action.title}
            subtitle={action.subtitle}
            onPress={() => navigation.navigate(action.target)}
            showDivider={idx !== actions.length - 1}
          />
        ))}
      </View>

      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Upcoming Bookings</Text>
        <Text style={styles.sectionSub}>Accepted bookings appear here.</Text>
      </View>

      <View style={styles.section}>
        {upcoming.length ? (
          upcoming.map((b, idx) => (
            <ListItem
              key={b._id}
              icon="calendar-outline"
              title={`${b.serviceType || 'Service'} | ${b.bookingDate || ''}`}
              subtitle={`Customer: ${b.userId?.name || 'User'} | Slot: ${b.slotLabel || '-'}`}
              onPress={() => navigation.navigate('ServiceCenterBookings')}
              showDivider={idx !== upcoming.length - 1}
            />
          ))
        ) : (
          <View style={styles.emptyBox}>
            <Text style={styles.emptyText}>No upcoming accepted bookings yet.</Text>
          </View>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.bg },
  content: { padding: theme.spacing.lg, paddingBottom: theme.spacing.xl },

  topRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12 },
  kicker: { color: theme.colors.muted, fontWeight: '900', letterSpacing: 0.3 },
  title: { fontSize: 24, fontWeight: '900', color: theme.colors.text, marginTop: 2 },
  iconBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: theme.colors.card,
    borderWidth: 1,
    borderColor: theme.colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    ...theme.shadow.soft
  },

  statusCard: {
    backgroundColor: theme.colors.border,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: theme.colors.extra,
    padding: theme.spacing.md,
    ...theme.shadow.card,
    marginBottom: 14
  },
  statusHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  statusTitle: { fontSize: 18, fontWeight: '900', color: theme.colors.text },
  statusSub: { marginTop: 6, color: theme.colors.muted, fontWeight: '700' },
  statusChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1
  },
  statusChipOk: { backgroundColor: '#16A34A12', borderColor: '#16A34A35' },
  statusChipWarn: { backgroundColor: '#F59E0B12', borderColor: '#F59E0B35' },
  statusChipText: { fontWeight: '900', fontSize: 12 },
  statusTextOk: { color: '#16A34A' },
  statusTextWarn: { color: '#F59E0B' },
  dot: { width: 8, height: 8, borderRadius: 4 },
  dotOk: { backgroundColor: '#16A34A' },
  dotWarn: { backgroundColor: '#F59E0B' },
  pillsRow: { flexDirection: 'row', gap: 10, marginTop: 12 },
  pill: { flex: 1, borderRadius: theme.radius.md, paddingVertical: 10, paddingHorizontal: 12, borderWidth: 1 },
  pillPending: { backgroundColor: '#FEE2E2', borderColor: '#FCA5A5' },
  pillAccepted: { backgroundColor: '#DCFCE7', borderColor: '#86EFAC' },
  pillCompleted: { backgroundColor: '#FEF9C3', borderColor: '#FDE047' },
  pillValue: { fontSize: 18, fontWeight: '900', color: theme.colors.text },
  pillLabel: { marginTop: 2, fontWeight: '800', color: theme.colors.muted, fontSize: 12 },

  sectionHeader: { marginBottom: 10, marginTop: 6 },
  sectionTitle: { fontSize: 18, fontWeight: '900', color: theme.colors.text },
  sectionSub: { color: theme.colors.muted, marginTop: 2, fontWeight: '700' },
  section: {
    backgroundColor: theme.colors.card,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    overflow: 'hidden',
    ...theme.shadow.soft,
    marginBottom: 12
  },
  emptyBox: { padding: theme.spacing.md },
  emptyText: { color: theme.colors.muted, fontWeight: '800' },
  banner: {
    backgroundColor: theme.colors.primary,
    borderRadius: theme.radius.lg,
    padding: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.primary2,
    ...theme.shadow.card
  },
  bannerTitle: { color: '#fff', fontWeight: '700', fontSize: 16 },
  bannerText: { color: '#EAF3FF', fontWeight: '600', marginTop: 6 }
});

