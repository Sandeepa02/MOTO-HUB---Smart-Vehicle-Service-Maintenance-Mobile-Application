import React, { useCallback, useState } from 'react';
import { Alert, FlatList, Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';
import { theme } from '../theme';

const formatDuration = (hours) => {
  if (!hours) return '';
  if (hours < 1) return `${Math.round(hours * 60)} mins`;
  if (hours === 1) return '1 hour';
  return `${hours} hours`;
};

export default function ServiceCenterBookingsScreen({ navigation }) {
  const { authHeaders } = useAuth();
  const [bookings, setBookings] = useState([]);
  const [records, setRecords] = useState([]);
  const [completeModal, setCompleteModal] = useState({ visible: false, booking: null });
  const [additionalNotes, setAdditionalNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchData = async () => {
    const [bookingsRes, recordsRes] = await Promise.all([
      api.get('/bookings', authHeaders),
      api.get('/maintenance-records', authHeaders)
    ]);

    setBookings(bookingsRes.data);
    setRecords(recordsRes.data);
  };

  useFocusEffect(
    useCallback(() => {
      fetchData().catch((error) => Alert.alert('Error', error?.response?.data?.message || 'Failed loading bookings'));
    }, [])
  );

  const acceptBooking = async (id) => {
    try {
      await api.patch(`/bookings/${id}/accept`, {}, authHeaders);
      await fetchData();
      Alert.alert('Success', 'Booking accepted! Customer will be notified.');
    } catch (error) {
      Alert.alert('Error', error?.response?.data?.message || 'Accept failed');
    }
  };

  const openCompleteModal = (booking) => {
    setCompleteModal({ visible: true, booking });
    setAdditionalNotes('');
  };

  const closeCompleteModal = () => {
    setCompleteModal({ visible: false, booking: null });
    setAdditionalNotes('');
  };

  const completeBooking = async () => {
    if (!completeModal.booking) return;
    
    setIsSubmitting(true);
    try {
      const response = await api.patch(
        `/bookings/${completeModal.booking._id}/complete`,
        { additionalNotes },
        authHeaders
      );
      
      closeCompleteModal();
      await fetchData();
      
      Alert.alert(
        'Service Completed', 
        `Invoice #${response.data.invoice?.invoiceNumber || 'N/A'} has been generated and sent to the customer.`,
        [{ text: 'OK' }]
      );
    } catch (error) {
      Alert.alert('Error', error?.response?.data?.message || 'Failed to complete booking');
    } finally {
      setIsSubmitting(false);
    }
  };

  const findRecord = (bookingId) => records.find((record) => record.bookingId?._id === bookingId);

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.heading}>Incoming and Active Bookings</Text>
      <FlatList
        scrollEnabled={false}
        data={bookings}
        keyExtractor={(item) => item._id}
        renderItem={({ item }) => {
          const record = findRecord(item._id);

          return (
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <Text style={styles.title}>{item.serviceType}</Text>
                <View style={[
                  styles.statusBadge,
                  item.status === 'Completed' && styles.statusCompleted,
                  item.status === 'Accepted' && styles.statusAccepted,
                  item.status === 'Cancelled' && styles.statusCancelled,
                  item.status === 'Pending' && styles.statusPending
                ]}>
                  <Text style={styles.statusText}>{item.status}</Text>
                </View>
              </View>
              
              <View style={styles.cardBody}>
                <View style={styles.cardRow}>
                  <Text style={styles.cardIcon}>👤</Text>
                  <Text style={styles.text}>{item.userId?.name || 'User'}</Text>
                </View>
                <View style={styles.cardRow}>
                  <Text style={styles.cardIcon}>🏍️</Text>
                  <Text style={styles.text}>{item.vehicleId?.vehicleName || 'Vehicle'}</Text>
                </View>
                <View style={styles.cardRow}>
                  <Text style={styles.cardIcon}>📅</Text>
                  <Text style={styles.text}>{item.bookingDate} at {item.slotLabel}</Text>
                </View>
                {item.servicePackageId?.estimatedDuration && (
                  <View style={styles.cardRow}>
                    <Text style={styles.cardIcon}>⏱</Text>
                    <Text style={styles.text}>Est. Duration: {formatDuration(item.servicePackageId.estimatedDuration)}</Text>
                  </View>
                )}
                {(item.estimatedCost > 0 || item.servicePackageId?.price > 0) && (
                  <View style={styles.cardRow}>
                    <Text style={styles.cardIcon}>💰</Text>
                    <Text style={styles.textHighlight}>
                      Est. Cost: LKR {((item.estimatedCost || item.servicePackageId?.price || 0) * 1.05).toFixed(2)}
                    </Text>
                  </View>
                )}
              </View>

              <View style={styles.row}>
                {item.status === 'Pending' && (
                  <Pressable style={[styles.smallBtn, styles.acceptBtn]} onPress={() => acceptBooking(item._id)}>
                    <Text style={styles.smallBtnText}>Accept Booking</Text>
                  </Pressable>
                )}

                {item.status === 'Accepted' && (
                  <>
                    <Pressable
                      style={[styles.smallBtn, styles.maintenanceBtn]}
                      onPress={() => navigation.navigate('Maintenance', { booking: item })}
                    >
                      <Text style={styles.smallBtnText}>Add Record</Text>
                    </Pressable>
                    <Pressable
                      style={[styles.smallBtn, styles.completeBtn]}
                      onPress={() => openCompleteModal(item)}
                    >
                      <Text style={styles.smallBtnText}>Complete</Text>
                    </Pressable>
                  </>
                )}

                {item.status === 'Completed' && record && (
                  <Pressable
                    style={[styles.smallBtn, styles.editBtn]}
                    onPress={() => navigation.navigate('Maintenance', { record })}
                  >
                    <Text style={styles.smallBtnText}>View Record</Text>
                  </Pressable>
                )}

                {item.status === 'Completed' && item.invoiceNumber && (
                  <View style={styles.invoiceInfo}>
                    <Text style={styles.invoiceText}>📄 Invoice: {item.invoiceNumber}</Text>
                  </View>
                )}
              </View>
            </View>
          );
        }}
        ListEmptyComponent={
          <View style={styles.emptyBox}>
            <Text style={styles.emptyIcon}>📋</Text>
            <Text style={styles.emptyText}>No bookings yet</Text>
            <Text style={styles.emptySub}>Customer bookings will appear here</Text>
          </View>
        }
      />

      <Modal
        visible={completeModal.visible}
        transparent
        animationType="slide"
        onRequestClose={closeCompleteModal}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Complete Service</Text>
            <Text style={styles.modalSubtitle}>
              Mark this booking as completed? An invoice will be automatically generated.
            </Text>

            {completeModal.booking && (
              <View style={styles.modalSummary}>
                <Text style={styles.modalSummaryTitle}>{completeModal.booking.serviceType}</Text>
                <Text style={styles.modalSummaryText}>
                  Customer: {completeModal.booking.userId?.name}
                </Text>
                <Text style={styles.modalSummaryText}>
                  Vehicle: {completeModal.booking.vehicleId?.vehicleName}
                </Text>
              </View>
            )}

            <TextInput
              style={styles.notesInput}
              placeholder="Service notes (optional)"
              placeholderTextColor={theme.colors.muted}
              multiline
              numberOfLines={3}
              value={additionalNotes}
              onChangeText={setAdditionalNotes}
            />

            <View style={styles.modalButtons}>
              <Pressable 
                style={styles.modalCancelBtn} 
                onPress={closeCompleteModal}
                disabled={isSubmitting}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </Pressable>
              <Pressable 
                style={[styles.modalConfirmBtn, isSubmitting && styles.disabledButton]} 
                onPress={completeBooking}
                disabled={isSubmitting}
              >
                <Text style={styles.modalConfirmText}>
                  {isSubmitting ? 'Processing...' : 'Complete & Generate Invoice'}
                </Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: theme.spacing.lg, backgroundColor: theme.colors.bg },
  heading: { fontSize: 20, fontWeight: '900', marginBottom: 10, marginTop: 4, color: theme.colors.text },
  card: {
    backgroundColor: theme.colors.card,
    padding: theme.spacing.md,
    borderRadius: theme.radius.lg,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: theme.colors.border,
    ...theme.shadow.soft
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10
  },
  cardBody: {
    marginBottom: 4
  },
  cardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4
  },
  cardIcon: {
    fontSize: 14,
    marginRight: 8,
    width: 20
  },
  title: { fontWeight: '900', fontSize: 16, color: theme.colors.text, flex: 1 },
  text: { color: theme.colors.muted, fontWeight: '700', fontSize: 13 },
  textHighlight: { color: theme.colors.success, fontWeight: '700', fontSize: 13 },
  
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: theme.radius.pill
  },
  statusPending: { backgroundColor: '#FEF3C7' },
  statusAccepted: { backgroundColor: '#DBEAFE' },
  statusCompleted: { backgroundColor: '#D1FAE5' },
  statusCancelled: { backgroundColor: '#FEE2E2' },
  statusText: {
    fontSize: 11,
    fontWeight: '700',
    color: theme.colors.text
  },

  row: { flexDirection: 'row', marginTop: 12, gap: 8, flexWrap: 'wrap' },
  smallBtn: { flex: 1, minWidth: 100, padding: 12, borderRadius: theme.radius.md, ...theme.shadow.soft },
  acceptBtn: { backgroundColor: theme.colors.primary },
  maintenanceBtn: { backgroundColor: theme.colors.primary2 },
  completeBtn: { backgroundColor: theme.colors.success },
  editBtn: { backgroundColor: '#2B3A67' },
  smallBtnText: { color: '#fff', fontWeight: '900', textAlign: 'center', fontSize: 13 },
  
  invoiceInfo: {
    flex: 1,
    backgroundColor: theme.colors.bg2,
    padding: 10,
    borderRadius: theme.radius.md,
    alignItems: 'center'
  },
  invoiceText: {
    color: theme.colors.text,
    fontWeight: '700',
    fontSize: 12
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
    textAlign: 'center'
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end'
  },
  modalContent: {
    backgroundColor: theme.colors.card,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: theme.colors.text,
    textAlign: 'center'
  },
  modalSubtitle: {
    fontSize: 14,
    color: theme.colors.muted,
    textAlign: 'center',
    marginTop: 4,
    marginBottom: 16
  },
  modalSummary: {
    backgroundColor: theme.colors.bg,
    padding: 14,
    borderRadius: theme.radius.md,
    marginBottom: 16
  },
  modalSummaryTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: theme.colors.text,
    marginBottom: 6
  },
  modalSummaryText: {
    fontSize: 13,
    color: theme.colors.muted,
    fontWeight: '600',
    marginTop: 2
  },
  notesInput: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.md,
    padding: 12,
    marginBottom: 16,
    minHeight: 80,
    textAlignVertical: 'top',
    backgroundColor: theme.colors.bg,
    color: theme.colors.text
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12
  },
  modalCancelBtn: {
    flex: 1,
    padding: 14,
    borderRadius: theme.radius.md,
    backgroundColor: theme.colors.bg,
    borderWidth: 1,
    borderColor: theme.colors.border
  },
  modalCancelText: {
    textAlign: 'center',
    fontWeight: '700',
    color: theme.colors.text
  },
  modalConfirmBtn: {
    flex: 2,
    padding: 14,
    borderRadius: theme.radius.md,
    backgroundColor: theme.colors.success
  },
  modalConfirmText: {
    textAlign: 'center',
    fontWeight: '700',
    color: '#fff'
  },
  disabledButton: { opacity: 0.5 }
});
