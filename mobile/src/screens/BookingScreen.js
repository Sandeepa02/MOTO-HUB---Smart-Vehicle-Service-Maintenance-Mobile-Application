import React, { useCallback, useEffect, useState } from 'react';
import { Alert, FlatList, Linking, Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';
import { theme } from '../theme';
import DatePicker from '../components/DatePicker';

const TAX_RATE = 5;

const todayYyyyMmDd = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const normalizeDateInput = (value = '') => value.trim().replace(/[./]/g, '-');
const isAcceptedDateInput = (value = '') => /^\d{4}[-/.]\d{2}[-/.]\d{2}$/.test(value.trim());
const isCanonicalDate = (value = '') => /^\d{4}-\d{2}-\d{2}$/.test(value);

const CANCELLATION_REASONS = [
  { value: 'change_of_plans', label: 'Change of plans', icon: '📅' },
  { value: 'found_better_price', label: 'Found better price elsewhere', icon: '💰' },
  { value: 'vehicle_issue_resolved', label: 'Vehicle issue resolved itself', icon: '🔧' },
  { value: 'service_center_issue', label: 'Issue with service center', icon: '🏪' },
  { value: 'emergency', label: 'Personal emergency', icon: '🚨' },
  { value: 'rescheduling', label: 'Need to reschedule', icon: '🔄' },
  { value: 'other', label: 'Other reason', icon: '📝' }
];

const formatDuration = (hours) => {
  if (!hours) return '~1 hour';
  if (hours < 1) return `~${Math.round(hours * 60)} mins`;
  if (hours === 1) return '~1 hour';
  if (hours % 1 === 0) return `~${hours} hours`;
  const h = Math.floor(hours);
  const m = Math.round((hours % 1) * 60);
  return `~${h}h ${m}m`;
};

const formatEstimatedCompletion = (slotLabel, durationHours) => {
  if (!slotLabel || !durationHours) return null;
  const match = slotLabel.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);
  if (!match) return null;
  
  let hours = parseInt(match[1], 10);
  const minutes = parseInt(match[2], 10);
  const period = match[3].toUpperCase();
  
  if (period === 'PM' && hours !== 12) hours += 12;
  if (period === 'AM' && hours === 12) hours = 0;
  
  const totalMinutes = hours * 60 + minutes + (durationHours * 60);
  let endHours = Math.floor(totalMinutes / 60) % 24;
  const endMinutes = Math.round(totalMinutes % 60);
  
  const endPeriod = endHours >= 12 ? 'PM' : 'AM';
  endHours = endHours % 12 || 12;
  
  return `${endHours}:${String(endMinutes).padStart(2, '0')} ${endPeriod}`;
};

export default function BookingScreen({ route, navigation }) {
  const { authHeaders } = useAuth();
  const [vehicles, setVehicles] = useState([]);
  const [services, setServices] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [availableSlots, setAvailableSlots] = useState([]);
  const [editingId, setEditingId] = useState(null);
  
  const [cancelModal, setCancelModal] = useState({ visible: false, booking: null });
  const [cancelReason, setCancelReason] = useState('');
  const [cancelNote, setCancelNote] = useState('');
  const [branches, setBranches] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const preselectedCenterId = route?.params?.serviceCenterId || '';
  const preselectedPackageId = route?.params?.selectedPackageId || '';
  const preselectedPackageName = route?.params?.selectedPackageName || '';
  const preselectedPackagePrice = route?.params?.selectedPackagePrice || 0;
  const preselectedPackageDuration = route?.params?.selectedPackageDuration || 1;
  const serviceCenterName = route?.params?.serviceCenterName || '';
  const packageCenterId = route?.params?.packageCenterId || '';

  const [form, setForm] = useState({
    vehicleId: '',
    serviceCenterId: preselectedCenterId || packageCenterId,
    servicePackageId: preselectedPackageId,
    serviceType: preselectedPackageName,
    bookingDate: '',
    slotLabel: '',
    notes: '',
    branchId: ''
  });

  const getSelectedPackageDetails = () => {
    if (preselectedPackageId) {
      return {
        price: preselectedPackagePrice,
        duration: preselectedPackageDuration,
        name: preselectedPackageName
      };
    }
    const selected = services.find(s => s._id === form.servicePackageId);
    return selected ? {
      price: selected.price,
      duration: selected.estimatedDuration || 1,
      name: selected.serviceName
    } : null;
  };

  const calculateCosts = () => {
    const pkg = getSelectedPackageDetails();
    if (!pkg) return null;
    
    const basePrice = pkg.price;
    const taxAmount = Math.round(basePrice * (TAX_RATE / 100) * 100) / 100;
    const totalAmount = Math.round((basePrice + taxAmount) * 100) / 100;
    
    return {
      basePrice,
      taxAmount,
      totalAmount,
      duration: pkg.duration,
      serviceName: pkg.name
    };
  };

  const fetchData = async () => {
    const [vehiclesRes, bookingsRes] = await Promise.all([
      api.get('/vehicles', authHeaders),
      api.get('/bookings', authHeaders)
    ]);

    setVehicles(vehiclesRes.data);
    setBookings(bookingsRes.data);
  };

  const fetchAvailability = async (serviceCenterId, bookingDate, branchIdOptional) => {
    if (!serviceCenterId || !bookingDate) {
      setAvailableSlots([]);
      return;
    }

    const params = { serviceCenterId, bookingDate };
    if (branchIdOptional) {
      params.branchId = branchIdOptional;
    }

    const { data } = await api.get('/bookings/availability', {
      ...authHeaders,
      params
    });

    setAvailableSlots(data.slots);
  };

  const fetchServices = async (serviceCenterId) => {
    if (!serviceCenterId) {
      setServices([]);
      return;
    }

    const { data } = await api.get(`/service-packages?serviceCenterId=${serviceCenterId}`);
    setServices(data);
  };

  useFocusEffect(
    useCallback(() => {
      fetchData().catch((error) => Alert.alert('Error', error?.response?.data?.message || 'Failed loading bookings'));
    }, [])
  );

  useEffect(() => {
    let cancelled = false;
    async function loadBranchesForCenter() {
      if (!form.serviceCenterId) {
        if (!cancelled) {
          setBranches([]);
          setForm((prev) => ({ ...prev, branchId: '' }));
        }
        return;
      }
      try {
        const { data } = await api.get(`/service-centers/${form.serviceCenterId}/branches`);
        if (cancelled) return;
        const list = Array.isArray(data) ? data : [];
        setBranches(list);
        setForm((prev) => {
          if (!list.length) {
            return { ...prev, branchId: '' };
          }
          if (list.length === 1) {
            return { ...prev, branchId: list[0]._id };
          }
          const stillOk = prev.branchId && list.some((b) => b._id === prev.branchId);
          return stillOk ? prev : { ...prev, branchId: '' };
        });
      } catch (_) {
        if (!cancelled) {
          setBranches([]);
          setForm((prev) => ({ ...prev, branchId: '' }));
        }
      }
    }

    loadBranchesForCenter();

    return () => {
      cancelled = true;
    };
  }, [form.serviceCenterId]);

  useEffect(() => {
    if (form.serviceCenterId && !preselectedPackageId) {
      fetchServices(form.serviceCenterId);
    } else if (preselectedPackageId) {
      setServices([]);
    }
  }, [form.serviceCenterId]);

  useEffect(() => {
    const normalizedDate = normalizeDateInput(form.bookingDate);
    if (!normalizedDate || !isCanonicalDate(normalizedDate) || !form.serviceCenterId) {
      setAvailableSlots([]);
      return;
    }

    const gatedBranchId =
      branches.length > 0 ? form.branchId : '';

    if (branches.length > 0 && !gatedBranchId) {
      setAvailableSlots([]);
      return;
    }

    fetchAvailability(form.serviceCenterId, normalizedDate, gatedBranchId || undefined).catch((error) => {
      Alert.alert('Error', error?.response?.data?.message || 'Failed loading time slots');
    });
  }, [form.bookingDate, form.serviceCenterId, form.branchId, branches.length]);

  const onDateChange = (date) => {
    if (!date) {
      setForm((prev) => ({ ...prev, bookingDate: '', slotLabel: '' }));
      return;
    }

    const raw = date.trim();
    if (raw && !isAcceptedDateInput(raw)) {
      setForm((prev) => ({ ...prev, bookingDate: raw, slotLabel: '' }));
      return;
    }

    const normalized = normalizeDateInput(raw);
    if (normalized < todayYyyyMmDd()) {
      Alert.alert('Invalid Date', 'You cannot select a previous date for booking.');
      setForm((prev) => ({ ...prev, bookingDate: '', slotLabel: '' }));
      return;
    }

    setForm((prev) => ({ ...prev, bookingDate: normalized, slotLabel: '' }));
  };

  const saveBooking = async () => {
    try {
      console.log('Saving booking with form:', form);
      
      if (!form.vehicleId) {
        Alert.alert('Error', 'Please select a vehicle');
        return;
      }
      if (!form.serviceCenterId) {
        Alert.alert('Error', 'Service center is missing');
        return;
      }
      if (!form.servicePackageId) {
        Alert.alert('Error', 'Please select a service package');
        return;
      }
      if (!form.bookingDate) {
        Alert.alert('Error', 'Please select a booking date');
        return;
      }
      const normalizedDate = normalizeDateInput(form.bookingDate);
      if (!isCanonicalDate(normalizedDate) || normalizedDate < todayYyyyMmDd()) {
        Alert.alert('Invalid Date', 'Please enter date as YYYY/MM/DD, YYYY.MM.DD, or YYYY-MM-DD.');
        return;
      }
      if (!form.slotLabel) {
        Alert.alert('Error', 'Please select a time slot');
        return;
      }
      if (branches.length > 0 && !form.branchId) {
        Alert.alert('Error', 'Please select an outlet');
        return;
      }

      const payload = { ...form, bookingDate: normalizedDate };
      if (editingId) {
        await api.put(`/bookings/${editingId}`, payload, authHeaders);
      } else {
        await api.post('/bookings', payload, authHeaders);
      }

      setForm({
        vehicleId: '',
        serviceCenterId: '',
        servicePackageId: '',
        serviceType: '',
        bookingDate: '',
        slotLabel: '',
        notes: '',
        branchId: ''
      });
      setEditingId(null);
      await fetchData();
      setAvailableSlots([]);
      setServices([]);
      Alert.alert('Success', editingId ? 'Booking updated successfully!' : 'Booking created successfully!');
    } catch (error) {
      console.error('Booking error:', error);
      Alert.alert('Error', error?.response?.data?.message || 'Booking save failed');
    }
  };

  const startEdit = (item) => {
    setEditingId(item._id);
    setForm({
      vehicleId: item.vehicleId?._id || '',
      serviceCenterId: item.serviceCenterId?._id || '',
      servicePackageId: item.servicePackageId?._id || '',
      serviceType: item.serviceType,
      bookingDate: item.bookingDate || '',
      slotLabel: item.slotLabel || '',
      notes: item.notes || '',
      branchId: item.branchId?._id ? String(item.branchId._id) : item.branchId ? String(item.branchId) : ''
    });
  };

  const openCancelModal = (booking) => {
    setCancelModal({ visible: true, booking });
    setCancelReason('');
    setCancelNote('');
  };

  const closeCancelModal = () => {
    setCancelModal({ visible: false, booking: null });
    setCancelReason('');
    setCancelNote('');
  };

  const confirmCancellation = async () => {
    if (!cancelReason) {
      Alert.alert('Required', 'Please select a reason');
      return;
    }

    setIsSubmitting(true);
    try {
      await api.delete(`/bookings/${cancelModal.booking._id}`, {
        ...authHeaders,
        data: { 
          cancellationReason: cancelReason, 
          cancellationNote: cancelNote 
        }
      });
      closeCancelModal();
      await fetchData();
      Alert.alert('Removed', 'Your booking has been deleted.');
    } catch (error) {
      Alert.alert('Error', error?.response?.data?.message || 'Delete failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  const removeCancelledBooking = (booking) => {
    Alert.alert(
      'Remove booking',
      'This will permanently delete this cancelled booking from your history.',
      [
        { text: 'Keep', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            try {
              await api.delete(`/bookings/${booking._id}`, authHeaders);
              await fetchData();
              Alert.alert('Removed', 'The booking has been deleted.');
            } catch (error) {
              Alert.alert('Error', error?.response?.data?.message || 'Could not remove booking');
            }
          }
        }
      ]
    );
  };

  const downloadInvoice = async (bookingId) => {
    try {
      const { data } = await api.get(`/bookings/${bookingId}/invoice`, authHeaders);
      if (data.pdfPath) {
        const baseUrl = api.defaults.baseURL?.replace('/api', '') || '';
        const invoiceUrl = `${baseUrl}${data.pdfPath}`;
        await Linking.openURL(invoiceUrl);
      } else {
        Alert.alert('Info', 'Invoice is being generated. Please try again in a moment.');
      }
    } catch (error) {
      if (error?.response?.status === 404) {
        try {
          await api.post(`/bookings/${bookingId}/invoice`, {}, authHeaders);
          Alert.alert('Success', 'Invoice generated! Tap again to download.');
        } catch (genError) {
          Alert.alert('Error', genError?.response?.data?.message || 'Failed to generate invoice');
        }
      } else {
        Alert.alert('Error', error?.response?.data?.message || 'Failed to get invoice');
      }
    }
  };

  const selectService = (service) => {
    setForm((prev) => ({ 
      ...prev,
      servicePackageId: service._id,
      serviceType: service.serviceName
    }));
  };

  const visibleSlots = availableSlots.some((slot) => slot.slotLabel === form.slotLabel)
    ? availableSlots
    : form.slotLabel
    ? [{ slotLabel: form.slotLabel, available: true, remainingCapacity: 0 }, ...availableSlots]
    : availableSlots;

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.heading}>{editingId ? 'Update Booking' : 'Book Service'}</Text>

      {serviceCenterName && !editingId ? (
        <View style={styles.infoCard}>
          <Text style={styles.infoText}>Service Center: {serviceCenterName}</Text>
        </View>
      ) : null}
      {preselectedPackageId ? (
          <View style={styles.selectedPackage}>
            <Text style={styles.selectedPackageText}>
              Selected: {preselectedPackageName}
            </Text>
            <View style={styles.packageDetailsRow}>
              <View style={styles.packageBadge}>
                <Text style={styles.packageBadgeText}>LKR {preselectedPackagePrice.toFixed(2)}</Text>
              </View>
              <View style={[styles.packageBadge, styles.durationBadge]}>
                <Text style={styles.packageBadgeText}>⏱ {formatDuration(preselectedPackageDuration)}</Text>
              </View>
            </View>
          </View>
      ) : services.length > 0 ? (
          <View>
            <Text style={styles.label}>Select Service Package</Text>
            <View style={styles.rowWrap}>
              {services.map((service) => (
                  <Pressable
                      key={service._id}
                      style={[styles.pill, styles.servicePill, form.servicePackageId === service._id && styles.activePill]}
                      onPress={() => selectService(service)}
                  >
                    <Text style={[styles.pillText, form.servicePackageId === service._id && styles.activePillText]}>
                      {service.serviceName}
                    </Text>
                    <View style={styles.serviceMetaRow}>
                      <Text style={[styles.serviceMetaText, form.servicePackageId === service._id && styles.activePillText]}>
                        LKR {service.price.toFixed(2)}
                      </Text>
                      <Text style={[styles.serviceMetaText, form.servicePackageId === service._id && styles.activePillText]}>
                        ⏱ {formatDuration(service.estimatedDuration)}
                      </Text>
                    </View>
                  </Pressable>
              ))}
            </View>
          </View>
      ) : null}

      {branches.length > 1 ? (
        <View style={{ marginBottom: 4 }}>
          <Text style={styles.label}>Select outlet</Text>
          <View style={styles.rowWrap}>
            {branches.map((b) => (
              <Pressable
                key={b._id}
                style={[styles.pill, styles.servicePill, form.branchId === b._id && styles.activePill]}
                onPress={() => setForm((prev) => ({ ...prev, branchId: b._id, slotLabel: '' }))}
              >
                <Text style={[styles.pillText, form.branchId === b._id && styles.activePillText]} numberOfLines={2}>
                  {b.branchName}
                </Text>
                <Text
                  style={[styles.serviceMetaText, form.branchId === b._id && styles.activePillText]}
                  numberOfLines={1}
                >
                  {b.location}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>
      ) : branches.length === 1 ? (
        <View style={styles.branchSingleCard}>
          <Text style={styles.branchSingleKicker}>Outlet</Text>
          <Text style={styles.branchSingleTitle}>{branches[0].branchName}</Text>
          <Text style={styles.branchSingleMeta}>{branches[0].location}</Text>
        </View>
      ) : null}

      <Text style={styles.label}>Select Vehicle</Text>
      <View style={styles.rowWrap}>
        {vehicles.map((vehicle) => (
          <Pressable
            key={vehicle._id}
            style={[styles.pill, form.vehicleId === vehicle._id && styles.activePill]}
            onPress={() => setForm((prev) => ({ ...prev, vehicleId: vehicle._id }))}
          >
            <Text style={[styles.pillText, form.vehicleId === vehicle._id && styles.activePillText]}>
              {vehicle.vehicleName}
            </Text>
          </Pressable>
        ))}
      </View>



      <DatePicker
        label="Select Date"
        value={form.bookingDate}
        onChange={onDateChange}
        minimumDate={new Date()}
      />

      {form.bookingDate ? (
        <View>
          <Text style={styles.label}>Available Time Slots</Text>
          <View style={styles.rowWrap}>
            {visibleSlots.map((slot) => (
              <Pressable
                key={slot.slotLabel}
                disabled={!slot.available && form.slotLabel !== slot.slotLabel}
                style={[
                  styles.pill,
                  form.slotLabel === slot.slotLabel && styles.activePill,
                  !slot.available && form.slotLabel !== slot.slotLabel && styles.disabledPill
                ]}
                onPress={() => setForm((prev) => ({ ...prev, slotLabel: slot.slotLabel }))}
              >
                <Text
                  style={[
                    styles.pillText,
                    form.slotLabel === slot.slotLabel && styles.activePillText,
                    !slot.available && form.slotLabel !== slot.slotLabel && styles.disabledText
                  ]}
                >
                  {slot.slotLabel}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>
      ) : null}

      <Text style={styles.label}>Notes (Optional)</Text>
      <View style={styles.notesContainer}>
        <TextInput
          style={styles.notesInput}
          placeholder="Any special instructions..."
          multiline
          value={form.notes}
          onChangeText={(notes) => setForm((prev) => ({ ...prev, notes }))}
        />
      </View>

      {form.vehicleId && form.servicePackageId && form.bookingDate && form.slotLabel && calculateCosts() ? (
        <View style={styles.costSummaryCard}>
          <Text style={styles.summaryTitle}>Booking Summary</Text>
          
          <View style={styles.summarySection}>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Service</Text>
              <Text style={styles.summaryValue}>{calculateCosts().serviceName}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Date & Time</Text>
              <Text style={styles.summaryValue}>{form.bookingDate} at {form.slotLabel}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Duration</Text>
              <Text style={styles.summaryValue}>{formatDuration(calculateCosts().duration)}</Text>
            </View>
            {formatEstimatedCompletion(form.slotLabel, calculateCosts().duration) && (
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Est. Ready By</Text>
                <Text style={[styles.summaryValue, styles.highlightText]}>
                  {formatEstimatedCompletion(form.slotLabel, calculateCosts().duration)}
                </Text>
              </View>
            )}
          </View>
          
          <View style={styles.divider} />
          
          <View style={styles.summarySection}>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Base Price</Text>
              <Text style={styles.summaryValue}>LKR {calculateCosts().basePrice.toFixed(2)}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Service Tax ({TAX_RATE}%)</Text>
              <Text style={styles.summaryValue}>LKR {calculateCosts().taxAmount.toFixed(2)}</Text>
            </View>
          </View>
          
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Estimated Total</Text>
            <Text style={styles.totalValue}>LKR {calculateCosts().totalAmount.toFixed(2)}</Text>
          </View>
          
          <Text style={styles.disclaimer}>
            * Final amount may vary based on additional services required
          </Text>
        </View>
      ) : null}

      <Pressable style={styles.primaryBtn} onPress={saveBooking}>
        <Text style={styles.primaryBtnText}>{editingId ? 'Update Booking' : 'Confirm Booking'}</Text>
      </Pressable>

      <Text style={styles.heading}>My Bookings</Text>
      <FlatList
        scrollEnabled={false}
        data={bookings}
        keyExtractor={(item) => item._id}
        renderItem={({ item }) => {
          const canEdit = item.status === 'Pending';
          const canCancel = item.status !== 'Completed' && item.status !== 'Cancelled';
          const canRemove = item.status === 'Cancelled';
          const showInvoice = item.status === 'Completed';

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
                  <Text style={styles.cardIcon}>🏍️</Text>
                  <Text style={styles.text}>{item.vehicleId?.vehicleName || 'N/A'}</Text>
                </View>
                <View style={styles.cardRow}>
                  <Text style={styles.cardIcon}>🏪</Text>
                  <Text style={styles.text}>{item.serviceCenterId?.centerName || 'N/A'}</Text>
                </View>
                {item.branchId?.branchName ? (
                  <View style={styles.cardRow}>
                    <Text style={styles.cardIcon}>📍</Text>
                    <Text style={styles.text}>{item.branchId.branchName}</Text>
                  </View>
                ) : null}
                <View style={styles.cardRow}>
                  <Text style={styles.cardIcon}>📅</Text>
                  <Text style={styles.text}>{item.bookingDate} at {item.slotLabel}</Text>
                </View>
                {item.servicePackageId?.estimatedDuration && (
                  <View style={styles.cardRow}>
                    <Text style={styles.cardIcon}>⏱</Text>
                    <Text style={styles.text}>Duration: {formatDuration(item.servicePackageId.estimatedDuration)}</Text>
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

              {item.status === 'Cancelled' && item.cancellationReason && (
                <View style={styles.cancellationInfo}>
                  <Text style={styles.cancellationLabel}>Cancellation Reason:</Text>
                  <Text style={styles.cancellationText}>
                    {CANCELLATION_REASONS.find(r => r.value === item.cancellationReason)?.label || item.cancellationReason}
                  </Text>
                </View>
              )}

              <View style={styles.row}>
                {canEdit && (
                  <Pressable
                    style={[styles.smallBtn, styles.editBtn]}
                    onPress={() => startEdit(item)}
                  >
                    <Text style={styles.smallBtnText}>Edit</Text>
                  </Pressable>
                )}
                {canCancel && (
                  <Pressable
                    style={[styles.smallBtn, styles.deleteBtn]}
                    onPress={() => openCancelModal(item)}
                  >
                    <Text style={styles.smallBtnText}>Delete</Text>
                  </Pressable>
                )}
                {canRemove && (
                  <Pressable
                    style={[styles.smallBtn, styles.deleteBtn]}
                    onPress={() => removeCancelledBooking(item)}
                  >
                    <Text style={styles.smallBtnText}>Remove</Text>
                  </Pressable>
                )}
                {showInvoice && (
                  <Pressable
                    style={[styles.smallBtn, styles.invoiceBtn]}
                    onPress={() => downloadInvoice(item._id)}
                  >
                    <Text style={styles.smallBtnText}>📄 Invoice</Text>
                  </Pressable>
                )}
              </View>
            </View>
          );
        }}
      />

      <Modal
        visible={cancelModal.visible}
        transparent
        animationType="slide"
        onRequestClose={closeCancelModal}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Delete booking</Text>
            <Text style={styles.modalSubtitle}>
              This permanently removes the booking. Why are you deleting it?
            </Text>

            <ScrollView style={styles.reasonsList} showsVerticalScrollIndicator={false}>
              {CANCELLATION_REASONS.map((reason) => (
                <Pressable
                  key={reason.value}
                  style={[
                    styles.reasonOption,
                    cancelReason === reason.value && styles.reasonSelected
                  ]}
                  onPress={() => setCancelReason(reason.value)}
                >
                  <Text style={styles.reasonIcon}>{reason.icon}</Text>
                  <Text style={[
                    styles.reasonText,
                    cancelReason === reason.value && styles.reasonTextSelected
                  ]}>
                    {reason.label}
                  </Text>
                  {cancelReason === reason.value && (
                    <Text style={styles.checkIcon}>✓</Text>
                  )}
                </Pressable>
              ))}
            </ScrollView>

            <TextInput
              style={styles.cancelNoteInput}
              placeholder="Additional comments (optional)"
              placeholderTextColor={theme.colors.muted}
              multiline
              numberOfLines={3}
              value={cancelNote}
              onChangeText={setCancelNote}
            />

            <View style={styles.modalButtons}>
              <Pressable 
                style={styles.modalCancelBtn} 
                onPress={closeCancelModal}
                disabled={isSubmitting}
              >
                <Text style={styles.modalCancelText}>Go Back</Text>
              </Pressable>
              <Pressable 
                style={[styles.modalConfirmBtn, isSubmitting && styles.disabledButton]} 
                onPress={confirmCancellation}
                disabled={isSubmitting}
              >
                <Text style={styles.modalConfirmText}>
                  {isSubmitting ? 'Deleting...' : 'Delete booking'}
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
  heading: { fontSize: 20, fontWeight: '800', marginBottom: 10, marginTop: 4, color: theme.colors.text },
  label: { marginBottom: 8, color: theme.colors.muted, fontWeight: '700' },
  rowWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 10 },
  pill: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.pill,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: theme.colors.card,
    ...theme.shadow.soft
  },
  servicePill: {
    borderRadius: theme.radius.md,
    paddingVertical: 10,
    minWidth: 140
  },
  serviceMetaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 4,
    gap: 8
  },
  serviceMetaText: {
    fontSize: 11,
    color: theme.colors.muted,
    fontWeight: '600'
  },
  activePill: { backgroundColor: theme.colors.primary, borderColor: theme.colors.primary },
  disabledPill: { backgroundColor: '#E7F0FF', borderColor: theme.colors.border, opacity: 0.6 },
  pillText: { fontWeight: '700', color: theme.colors.text },
  activePillText: { color: '#fff' },
  disabledText: { color: theme.colors.muted },
  infoCard: {
    backgroundColor: theme.colors.primary2,
    padding: 12,
    borderRadius: theme.radius.md,
    marginBottom: 12
  },
  infoText: { color: '#fff', fontWeight: '600', fontSize: 14 },
  selectedPackage: {
    backgroundColor: theme.colors.success,
    padding: 14,
    borderRadius: theme.radius.md,
    marginBottom: 12
  },
  selectedPackageText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  packageDetailsRow: {
    flexDirection: 'row',
    marginTop: 8,
    gap: 8
  },
  packageBadge: {
    backgroundColor: 'rgba(255,255,255,0.25)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: theme.radius.pill
  },
  durationBadge: {
    backgroundColor: 'rgba(255,255,255,0.35)'
  },
  packageBadgeText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 12
  },
  branchSingleCard: {
    backgroundColor: theme.colors.card,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.md,
    padding: theme.spacing.sm,
    marginBottom: theme.spacing.sm,
    ...theme.shadow.soft
  },
  branchSingleKicker: { fontSize: 11, fontWeight: '800', color: theme.colors.muted, marginBottom: 4 },
  branchSingleTitle: { fontSize: 15, fontWeight: '800', color: theme.colors.text },
  branchSingleMeta: { marginTop: 4, fontSize: 13, fontWeight: '600', color: theme.colors.muted },
  notesContainer: {
    backgroundColor: theme.colors.card,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.lg,
    marginBottom: 12,
    ...theme.shadow.soft
  },
  notesInput: {
    padding: 12,
    minHeight: 80,
    textAlignVertical: 'top',
    color: theme.colors.text
  },

  costSummaryCard: {
    backgroundColor: theme.colors.card,
    borderRadius: theme.radius.lg,
    padding: 16,
    marginBottom: 16,
    borderWidth: 2,
    borderColor: theme.colors.primary,
    ...theme.shadow.soft
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 12,
    color: theme.colors.text
  },
  summarySection: {
    marginBottom: 4
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8
  },
  summaryLabel: {
    color: theme.colors.muted,
    fontWeight: '600',
    fontSize: 13
  },
  summaryValue: {
    color: theme.colors.text,
    fontWeight: '700',
    fontSize: 13
  },
  highlightText: {
    color: theme.colors.success,
    fontWeight: '800'
  },
  divider: {
    height: 1,
    backgroundColor: theme.colors.border,
    marginVertical: 12
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
    paddingTop: 12,
    borderTopWidth: 2,
    borderTopColor: theme.colors.primary
  },
  totalLabel: {
    fontSize: 15,
    fontWeight: '800',
    color: theme.colors.text
  },
  totalValue: {
    fontSize: 18,
    fontWeight: '800',
    color: theme.colors.success
  },
  disclaimer: {
    fontSize: 11,
    color: theme.colors.muted,
    marginTop: 12,
    fontStyle: 'italic',
    textAlign: 'center'
  },

  primaryBtn: { 
    backgroundColor: theme.colors.primary, 
    borderRadius: theme.radius.lg, 
    padding: 14, 
    marginBottom: 14, 
    ...theme.shadow.soft 
  },
  primaryBtnText: { color: '#fff', fontWeight: '700', textAlign: 'center', fontSize: 15 },

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
    marginBottom: 8
  },
  cardBody: {
    marginBottom: 4
  },
  cardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4
  },
  cardIcon: {
    fontSize: 14,
    marginRight: 8,
    width: 20
  },
  title: { fontWeight: '800', fontSize: 16, color: theme.colors.text, flex: 1 },
  text: { color: theme.colors.muted, fontWeight: '600', fontSize: 13 },
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

  cancellationInfo: {
    backgroundColor: '#FEF2F2',
    padding: 10,
    borderRadius: theme.radius.sm,
    marginTop: 8
  },
  cancellationLabel: {
    fontSize: 11,
    color: theme.colors.danger,
    fontWeight: '700'
  },
  cancellationText: {
    fontSize: 12,
    color: theme.colors.muted,
    marginTop: 2
  },

  row: { flexDirection: 'row', marginTop: 12, gap: 8 },
  smallBtn: { flex: 1, padding: 12, borderRadius: theme.radius.md, ...theme.shadow.soft },
  editBtn: { backgroundColor: theme.colors.primary2 },
  deleteBtn: { backgroundColor: theme.colors.danger },
  invoiceBtn: { backgroundColor: theme.colors.success },
  disabledButton: { opacity: 0.45 },
  smallBtnText: { color: '#fff', fontWeight: '700', textAlign: 'center' },

  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end'
  },
  modalContent: {
    backgroundColor: theme.colors.card,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    maxHeight: '80%'
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
  reasonsList: {
    maxHeight: 280
  },
  reasonOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    marginBottom: 8,
    backgroundColor: theme.colors.bg
  },
  reasonSelected: {
    borderColor: theme.colors.primary,
    backgroundColor: '#EEF4FF'
  },
  reasonIcon: {
    fontSize: 18,
    marginRight: 12
  },
  reasonText: {
    flex: 1,
    fontSize: 14,
    color: theme.colors.text,
    fontWeight: '600'
  },
  reasonTextSelected: {
    color: theme.colors.primary
  },
  checkIcon: {
    fontSize: 16,
    color: theme.colors.primary,
    fontWeight: '700'
  },
  cancelNoteInput: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.md,
    padding: 12,
    marginTop: 8,
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
    flex: 1,
    padding: 14,
    borderRadius: theme.radius.md,
    backgroundColor: theme.colors.danger
  },
  modalConfirmText: {
    textAlign: 'center',
    fontWeight: '700',
    color: '#fff'
  }
});
