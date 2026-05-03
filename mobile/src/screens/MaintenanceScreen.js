import React, { useCallback, useState } from 'react';
import { Alert, FlatList, Image, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useFocusEffect } from '@react-navigation/native';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';
import { theme } from '../theme';

export default function MaintenanceScreen({ navigation, route }) {
  const { authHeaders } = useAuth();
  const [acceptedBookings, setAcceptedBookings] = useState([]);
  const [records, setRecords] = useState([]);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [editingRecord, setEditingRecord] = useState(null);
  const [maintenanceImage, setMaintenanceImage] = useState(null);
  const [form, setForm] = useState({
    description: '',
    cost: '',
    notes: '',
    nextServiceDate: ''
  });

  const fetchData = async () => {
    const [bookingsRes, recordsRes] = await Promise.all([
      api.get('/bookings', authHeaders),
      api.get('/maintenance-records', authHeaders)
    ]);

    const recordBookingIds = new Set(recordsRes.data.map((record) => record.bookingId?._id));
    const acceptedBookingsList = bookingsRes.data.filter(
      (booking) => booking.status === 'Accepted' && !recordBookingIds.has(booking._id)
    );

    setAcceptedBookings(acceptedBookingsList);
    setRecords(recordsRes.data);
  };

  useFocusEffect(
    useCallback(() => {
      fetchData().catch((error) =>
        Alert.alert('Error', error?.response?.data?.message || 'Failed loading maintenance data')
      );
    }, [])
  );

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
      allowsEditing: true
    });

    if (!result.canceled) {
      setMaintenanceImage(result.assets[0]);
    }
  };

  const selectBooking = (booking) => {
    setSelectedBooking(booking);
    setEditingRecord(null);
    setForm({
      description: '',
      cost: '',
      notes: '',
      nextServiceDate: ''
    });
    setMaintenanceImage(null);
  };

  const startEditRecord = (record) => {
    setEditingRecord(record);
    setSelectedBooking(null);
    setForm({
      description: record.description || '',
      cost: String(record.cost || ''),
      notes: record.notes || '',
      nextServiceDate: record.nextServiceDate?.slice(0, 10) || ''
    });
    if (record.maintenanceImage) {
      setMaintenanceImage({ uri: record.maintenanceImage });
    }
  };

  const validateForm = () => {
    if (!selectedBooking && !editingRecord) {
      Alert.alert('Error', 'Please select a booking first');
      return false;
    }
    if (!form.description || !form.description.trim()) {
      Alert.alert('Error', 'Notes/description is required');
      return false;
    }
  if (form.cost === '' || form.cost === null || parseFloat(form.cost) < 0) {
    Alert.alert('Error', 'Please enter a valid additional cost');
    return false;
  }
    if (!maintenanceImage && !editingRecord) {
      Alert.alert('Error', 'Please select a maintenance image');
      return false;
    }
    return true;
  };

  const saveRecord = async () => {
    if (!validateForm()) return;

    try {
      const data = new FormData();
      data.append('description', String(form.description.trim()));
      data.append('cost', String(parseFloat(form.cost)));
      data.append('notes', String(form.notes.trim()));
      if (form.nextServiceDate) {
        data.append('nextServiceDate', String(form.nextServiceDate));
      }

      if (maintenanceImage && !maintenanceImage.uri.startsWith('http')) {
        data.append('maintenanceImage', {
          uri: maintenanceImage.uri,
          name: maintenanceImage.fileName || 'maintenance.jpg',
          type: maintenanceImage.mimeType || 'image/jpeg'
        });
      }

      const config = {
        ...authHeaders,
        headers: { ...(authHeaders?.headers || {}), 'Content-Type': 'multipart/form-data' }
      };

      if (editingRecord) {
        await api.put(`/maintenance-records/${editingRecord._id}`, data, config);
        Alert.alert('Success', 'Maintenance record updated');
      } else {
        data.append('bookingId', String(selectedBooking._id));
        await api.post('/maintenance-records', data, config);
        Alert.alert('Success', 'Maintenance record created and booking completed');
      }

      resetForm();
      await fetchData();
    } catch (error) {
      console.error('Save Error:', error);
      Alert.alert('Error', error?.response?.data?.message || error?.message || 'Failed saving record');
    }
  };

  const resetForm = () => {
    setSelectedBooking(null);
    setEditingRecord(null);
    setForm({ description: '', cost: '', notes: '', nextServiceDate: '' });
    setMaintenanceImage(null);
  };

  return (
    <ScrollView style={styles.container}>
      {selectedBooking && (
        <>
          <Text style={styles.heading}>Add Maintenance Record</Text>
          <View style={styles.selectedBookingCard}>
            <Text style={styles.selectedBookingTitle}>Selected Booking</Text>
            <Text style={styles.selectedBookingText}>
              {selectedBooking.serviceType} - {selectedBooking.vehicleId?.vehicleName || 'Vehicle'}
            </Text>
            <Text style={styles.selectedBookingText}>
              Date: {selectedBooking.bookingDate} | Slot: {selectedBooking.slotLabel}
            </Text>
            <Pressable style={styles.cancelBtn} onPress={resetForm}>
              <Text style={styles.cancelBtnText}>Cancel</Text>
            </Pressable>
          </View>

          <Text style={styles.label}>Notes / Description *</Text>
          <TextInput
            style={[styles.input, styles.notesInput]}
            placeholder="Describe the maintenance work done..."
            value={form.description}
            multiline
            onChangeText={(description) => setForm((prev) => ({ ...prev, description }))}
          />

          <Text style={styles.label}>Additional Cost (LKR) *</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter cost"
            keyboardType="decimal-pad"
            value={form.cost}
            onChangeText={(cost) => setForm((prev) => ({ ...prev, cost }))}
          />

          <Text style={styles.label}>Additional Notes</Text>
          <TextInput
            style={[styles.input, styles.notesInput]}
            placeholder="Any additional notes..."
            value={form.notes}
            multiline
            onChangeText={(notes) => setForm((prev) => ({ ...prev, notes }))}
          />

          <Text style={styles.label}>Next Service Date (Optional)</Text>
          <TextInput
            style={styles.input}
            placeholder="YYYY-MM-DD"
            value={form.nextServiceDate}
            onChangeText={(nextServiceDate) => setForm((prev) => ({ ...prev, nextServiceDate }))}
          />

          <Text style={styles.label}>Maintenance Image *</Text>
          <Pressable style={styles.imagePickerBtn} onPress={pickImage}>
            <Text style={styles.imagePickerText}>
              {maintenanceImage ? 'Change Image' : 'Select Maintenance Image'}
            </Text>
          </Pressable>
          {maintenanceImage && (
            <Image source={{ uri: maintenanceImage.uri }} style={styles.previewImage} />
          )}

          <Pressable style={styles.primaryBtn} onPress={saveRecord}>
            <Text style={styles.primaryBtnText}>Save & Complete Booking</Text>
          </Pressable>
        </>
      )}

      {editingRecord && (
        <>
          <Text style={styles.heading}>Edit Maintenance Record</Text>
          <View style={styles.selectedBookingCard}>
            <Text style={styles.selectedBookingTitle}>Editing Record</Text>
            <Text style={styles.selectedBookingText}>
              {editingRecord.vehicleId?.vehicleName || 'Vehicle'}
            </Text>
            <Pressable style={styles.cancelBtn} onPress={resetForm}>
              <Text style={styles.cancelBtnText}>Cancel</Text>
            </Pressable>
          </View>

          <Text style={styles.label}>Notes / Description *</Text>
          <TextInput
            style={[styles.input, styles.notesInput]}
            placeholder="Describe the maintenance work done..."
            value={form.description}
            multiline
            onChangeText={(description) => setForm((prev) => ({ ...prev, description }))}
          />

          <Text style={styles.label}>Additional Cost (LKR) *</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter cost"
            keyboardType="decimal-pad"
            value={form.cost}
            onChangeText={(cost) => setForm((prev) => ({ ...prev, cost }))}
          />

          <Text style={styles.label}>Additional Notes</Text>
          <TextInput
            style={[styles.input, styles.notesInput]}
            placeholder="Any additional notes..."
            value={form.notes}
            multiline
            onChangeText={(notes) => setForm((prev) => ({ ...prev, notes }))}
          />

          <Text style={styles.label}>Next Service Date (Optional)</Text>
          <TextInput
            style={styles.input}
            placeholder="YYYY-MM-DD"
            value={form.nextServiceDate}
            onChangeText={(nextServiceDate) => setForm((prev) => ({ ...prev, nextServiceDate }))}
          />

          <Text style={styles.label}>Maintenance Image *</Text>
          <Pressable style={styles.imagePickerBtn} onPress={pickImage}>
            <Text style={styles.imagePickerText}>
              {maintenanceImage ? 'Change Image' : 'Select Maintenance Image'}
            </Text>
          </Pressable>
          {maintenanceImage && (
            <Image source={{ uri: maintenanceImage.uri }} style={styles.previewImage} />
          )}

          <Pressable style={styles.primaryBtn} onPress={saveRecord}>
            <Text style={styles.primaryBtnText}>Update Record</Text>
          </Pressable>
        </>
      )}

      {!selectedBooking && !editingRecord && (
        <>
          <Text style={styles.heading}>Accepted Bookings</Text>
          <Text style={styles.subheading}>Select a booking to add maintenance record</Text>
          <FlatList
            scrollEnabled={false}
            data={acceptedBookings}
            keyExtractor={(item) => item._id}
            renderItem={({ item }) => (
              <Pressable style={styles.bookingCard} onPress={() => selectBooking(item)}>
                <Text style={styles.bookingTitle}>{item.serviceType}</Text>
                <Text style={styles.bookingText}>Vehicle: {item.vehicleId?.vehicleName || 'Vehicle'}</Text>
                <Text style={styles.bookingText}>Date: {item.bookingDate}</Text>
                <Text style={styles.bookingText}>Slot: {item.slotLabel}</Text>
                <Text style={styles.tapText}>Tap to add maintenance →</Text>
              </Pressable>
            )}
            ListEmptyComponent={
              <View style={styles.emptyBox}>
                <Text style={styles.emptyText}>No accepted bookings pending maintenance</Text>
              </View>
            }
          />

          <Text style={styles.sectionTitle}>Maintenance Records</Text>
          <FlatList
            scrollEnabled={false}
            data={records}
            keyExtractor={(item) => item._id}
            renderItem={({ item }) => (
              <View style={styles.card}>
                <Text style={styles.cardTitle}>{item.vehicleId?.vehicleName || 'Vehicle'}</Text>
                <Text style={styles.cardText}>Service: {item.bookingId?.serviceType || 'N/A'}</Text>
                <Text style={styles.cardText}>Date: {new Date(item.serviceDate).toLocaleDateString()}</Text>
                <Text style={styles.cardText}>Cost: LKR {item.cost?.toFixed(2)}</Text>
                {item.notes ? <Text style={styles.cardText}>Notes: {item.notes}</Text> : null}
                {item.nextServiceDate ? (
                  <Text style={styles.cardText}>
                    Next Service: {new Date(item.nextServiceDate).toLocaleDateString()}
                  </Text>
                ) : null}
                {item.maintenanceImage ? (
                  <Image source={{ uri: item.maintenanceImage }} style={styles.recordImage} />
                ) : null}
                <View style={styles.buttonRow}>
                  <Pressable style={[styles.smallBtn, styles.editBtn]} onPress={() => startEditRecord(item)}>
                    <Text style={styles.smallBtnText}>Edit</Text>
                  </Pressable>
                  <Pressable style={[styles.smallBtn, styles.deleteBtn]} onPress={() => {
                    Alert.alert('Confirm', 'Delete this maintenance record?', [
                      { text: 'Cancel', style: 'cancel' },
                      {
                        text: 'Delete',
                        style: 'destructive',
                        onPress: async () => {
                          try {
                            await api.delete(`/maintenance-records/${item._id}`, authHeaders);
                            Alert.alert('Success', 'Record deleted');
                            await fetchData();
                          } catch (error) {
                            Alert.alert('Error', error?.response?.data?.message || 'Delete failed');
                          }
                        }
                      }
                    ]);
                  }}>
                    <Text style={styles.smallBtnText}>Delete</Text>
                  </Pressable>
                </View>
              </View>
            )}
            ListEmptyComponent={
              <View style={styles.emptyBox}>
                <Text style={styles.emptyText}>No maintenance records yet</Text>
              </View>
            }
          />
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: theme.spacing.lg, backgroundColor: theme.colors.bg },
  heading: { fontSize: 20, fontWeight: '800', marginBottom: 10, marginTop: 4, color: theme.colors.text },
  subheading: { fontSize: 14, color: theme.colors.muted, fontWeight: '600', marginBottom: 12 },
  sectionTitle: { fontSize: 18, fontWeight: '800', marginBottom: 10, marginTop: 16, color: theme.colors.text },
  label: { marginBottom: 6, color: theme.colors.text, fontWeight: '700', marginTop: 10 },

  selectedBookingCard: {
    backgroundColor: theme.colors.primary2 + '20',
    padding: theme.spacing.md,
    borderRadius: theme.radius.lg,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: theme.colors.primary2
  },
  selectedBookingTitle: { fontSize: 16, fontWeight: '800', color: theme.colors.text, marginBottom: 6 },
  selectedBookingText: { fontSize: 14, color: theme.colors.muted, fontWeight: '600', marginBottom: 4 },

  bookingCard: {
    backgroundColor: theme.colors.card,
    padding: theme.spacing.md,
    borderRadius: theme.radius.lg,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: theme.colors.border,
    ...theme.shadow.soft
  },
  bookingTitle: { fontSize: 16, fontWeight: '700', color: theme.colors.text, marginBottom: 6 },
  bookingText: { fontSize: 14, color: theme.colors.muted, fontWeight: '600', marginBottom: 4 },
  tapText: { fontSize: 13, color: theme.colors.primary, fontWeight: '600', textAlign: 'right', marginTop: 8 },

  input: {
    backgroundColor: theme.colors.card,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.lg,
    padding: 12,
    marginBottom: 10,
    ...theme.shadow.soft
  },
  notesInput: { minHeight: 90, textAlignVertical: 'top' },

  imagePickerBtn: {
    backgroundColor: theme.colors.card,
    borderWidth: 2,
    borderColor: theme.colors.primary2,
    borderStyle: 'dashed',
    borderRadius: theme.radius.lg,
    padding: 14,
    marginBottom: 10,
    alignItems: 'center'
  },
  imagePickerText: { color: theme.colors.primary2, fontWeight: '700', fontSize: 15 },
  previewImage: {
    width: '100%',
    height: 200,
    borderRadius: theme.radius.lg,
    marginBottom: 10,
    resizeMode: 'cover'
  },

  primaryBtn: {
    backgroundColor: theme.colors.primary,
    borderRadius: theme.radius.lg,
    padding: 14,
    marginBottom: 16,
    ...theme.shadow.soft
  },
  primaryBtnText: { color: '#fff', fontWeight: '700', textAlign: 'center', fontSize: 16 },
  cancelBtn: {
    backgroundColor: theme.colors.muted,
    borderRadius: theme.radius.md,
    padding: 10,
    marginTop: 10,
    alignItems: 'center'
  },
  cancelBtnText: { color: '#fff', fontWeight: '700' },

  card: {
    backgroundColor: theme.colors.card,
    padding: theme.spacing.md,
    borderRadius: theme.radius.lg,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: theme.colors.border,
    ...theme.shadow.soft
  },
  cardTitle: { fontWeight: '700', fontSize: 16, color: theme.colors.text, marginBottom: 6 },
  cardText: { fontSize: 14, color: theme.colors.muted, fontWeight: '600', marginBottom: 4 },
  recordImage: {
    width: '100%',
    height: 180,
    borderRadius: theme.radius.md,
    marginTop: 8,
    marginBottom: 8,
    resizeMode: 'cover'
  },

  buttonRow: { flexDirection: 'row', marginTop: 10, gap: 8 },
  smallBtn: { flex: 1, padding: 12, borderRadius: theme.radius.md, ...theme.shadow.soft },
  editBtn: { backgroundColor: theme.colors.primary2 },
  deleteBtn: { backgroundColor: theme.colors.danger },
  smallBtnText: { color: '#fff', fontWeight: '700', textAlign: 'center' },

  emptyBox: {
    padding: theme.spacing.lg,
    backgroundColor: theme.colors.card,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    alignItems: 'center'
  },
  emptyText: { color: theme.colors.muted, fontWeight: '600' }
});
