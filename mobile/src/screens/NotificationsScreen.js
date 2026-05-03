import React, { useCallback, useState } from 'react';
import { Alert, FlatList, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';
import { theme } from '../theme';

const NOTIFICATION_ICONS = {
  booking_reminder: '🔔',
  booking_confirmed: '✅',
  booking_accepted: '👍',
  booking_completed: '🎉',
  booking_cancelled: '❌',
  invoice_ready: '📄',
  promotion: '🎁'
};

const formatTimeAgo = (dateString) => {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
};

export default function NotificationsScreen() {
  const { authHeaders } = useAuth();
  const navigation = useNavigation();
  const [items, setItems] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);

  const loadNotifications = async () => {
    try {
      const { data } = await api.get('/bookings/notifications', authHeaders);
      setItems(data.notifications || []);
      setUnreadCount(data.unreadCount || 0);
    } catch (error) {
      console.error('Failed to load notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadNotifications();
    }, [])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await loadNotifications();
    setRefreshing(false);
  };

  const markAsRead = async (notificationId) => {
    try {
      await api.patch(`/bookings/notifications/${notificationId}/read`, {}, authHeaders);
      setItems(prev => prev.map(item => 
        item._id === notificationId ? { ...item, isRead: true } : item
      ));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Failed to mark as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      await api.patch('/bookings/notifications/read-all', {}, authHeaders);
      setItems(prev => prev.map(item => ({ ...item, isRead: true })));
      setUnreadCount(0);
    } catch (error) {
      Alert.alert('Error', 'Failed to mark all as read');
    }
  };

  const handleNotificationPress = (notification) => {
    if (!notification.isRead) {
      markAsRead(notification._id);
    }
    
    if (notification.bookingId) {
      navigation.navigate('Bookings');
    }
  };

  return (
    <ScrollView 
      style={styles.container} 
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      <View style={styles.headerRow}>
        <View>
          <Text style={styles.title}>Notifications</Text>
          {unreadCount > 0 && (
            <Text style={styles.unreadBadge}>{unreadCount} unread</Text>
          )}
        </View>
        {unreadCount > 0 && (
          <Pressable style={styles.markAllBtn} onPress={markAllAsRead}>
            <Text style={styles.markAllText}>Mark all read</Text>
          </Pressable>
        )}
      </View>

      <FlatList
        scrollEnabled={false}
        data={items}
        keyExtractor={(item) => item._id}
        renderItem={({ item }) => (
          <Pressable 
            style={[styles.card, !item.isRead && styles.cardUnread]}
            onPress={() => handleNotificationPress(item)}
          >
            <View style={styles.cardHeader}>
              <Text style={styles.cardIcon}>
                {NOTIFICATION_ICONS[item.type] || '📢'}
              </Text>
              <View style={styles.cardContent}>
                <Text style={[styles.cardTitle, !item.isRead && styles.cardTitleUnread]}>
                  {item.title}
                </Text>
                <Text style={styles.cardBody}>{item.body}</Text>
              </View>
              {!item.isRead && <View style={styles.unreadDot} />}
            </View>
            <Text style={styles.cardTime}>{formatTimeAgo(item.createdAt)}</Text>
          </Pressable>
        )}
        ListEmptyComponent={
          <View style={styles.emptyBox}>
            <Text style={styles.emptyIcon}>🔔</Text>
            <Text style={styles.emptyText}>No notifications yet</Text>
            <Text style={styles.emptySub}>
              You'll receive booking reminders, status updates, and more here.
            </Text>
          </View>
        }
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.bg },
  content: { padding: theme.spacing.lg, paddingBottom: theme.spacing.xl },
  headerRow: { 
    flexDirection: 'row', 
    alignItems: 'flex-start', 
    justifyContent: 'space-between', 
    marginBottom: 16 
  },
  title: { fontSize: 28, fontWeight: '800', color: theme.colors.text },
  unreadBadge: {
    fontSize: 13,
    color: theme.colors.primary,
    fontWeight: '700',
    marginTop: 2
  },
  markAllBtn: { 
    backgroundColor: theme.colors.bg2, 
    borderRadius: theme.radius.md, 
    paddingHorizontal: 12, 
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: theme.colors.border
  },
  markAllText: { color: theme.colors.primary, fontWeight: '700', fontSize: 13 },
  card: {
    backgroundColor: theme.colors.card,
    borderRadius: theme.radius.lg,
    padding: theme.spacing.md,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: theme.colors.border,
    ...theme.shadow.soft
  },
  cardUnread: {
    backgroundColor: '#F0F7FF',
    borderColor: theme.colors.primary,
    borderLeftWidth: 4
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start'
  },
  cardIcon: {
    fontSize: 24,
    marginRight: 12
  },
  cardContent: {
    flex: 1
  },
  cardTitle: { 
    fontWeight: '700', 
    color: theme.colors.text,
    fontSize: 15
  },
  cardTitleUnread: {
    fontWeight: '800',
    color: theme.colors.primary
  },
  cardBody: { 
    marginTop: 4, 
    color: theme.colors.muted, 
    fontWeight: '600',
    fontSize: 13,
    lineHeight: 18
  },
  cardTime: { 
    marginTop: 8, 
    color: theme.colors.muted, 
    fontWeight: '600',
    fontSize: 12,
    textAlign: 'right'
  },
  unreadDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: theme.colors.primary,
    marginLeft: 8
  },
  emptyBox: {
    backgroundColor: theme.colors.card,
    borderRadius: theme.radius.lg,
    padding: theme.spacing.xl,
    borderWidth: 1,
    borderColor: theme.colors.border,
    alignItems: 'center',
    ...theme.shadow.soft
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 12
  },
  emptyText: { 
    color: theme.colors.text, 
    fontWeight: '700',
    fontSize: 18,
    marginBottom: 8
  },
  emptySub: { 
    color: theme.colors.muted, 
    fontWeight: '600',
    textAlign: 'center',
    lineHeight: 20
  }
});
