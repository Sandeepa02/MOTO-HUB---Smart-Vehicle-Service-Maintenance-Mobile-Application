import React, { useCallback, useMemo, useState } from 'react';
import {
  Alert,
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';
import { theme } from '../theme';
import InputField from '../components/InputField';
import DistrictSelect from '../components/DistrictSelect';
import { SRI_LANKA_DISTRICTS } from '../constants/sriLankaDistricts';

const districtOptions = SRI_LANKA_DISTRICTS.map((d) => ({ label: d, value: d }));

export default function ManageBranchScreen({ route, navigation }) {
  const branchId = route.params?.branchId || null;
  const { authHeaders } = useAuth();

  const isEdit = Boolean(branchId);
  const [loading, setLoading] = useState(isEdit);

  const [form, setForm] = useState({
    branchName: '',
    location: '',
    district: '',
    contactNumber: '',
    maxBookingsPerSlot: '',
    slotDurationHours: '',
    latitude: '',
    longitude: ''
  });

  const [isActive, setIsActive] = useState(true);
  const [branchCode, setBranchCode] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const coordsPayload = useMemo(() => {
    const lat = parseFloat(form.latitude);
    const lng = parseFloat(form.longitude);
    if (Number.isNaN(lat) || Number.isNaN(lng)) return null;
    return { latitude: lat, longitude: lng };
  }, [form.latitude, form.longitude]);

  const loadBranch = async () => {
    if (!branchId) return;
    setLoading(true);
    try {
      const { data } = await api.get(`/service-centers/me/branches/${branchId}`, authHeaders);
      setBranchCode(data.branchCode || '');
      setIsActive(data.isActive !== false);
      const coords = data.coordinates?.coordinates;
      setForm({
        branchName: data.branchName || '',
        location: data.location || '',
        district: data.district || '',
        contactNumber: data.contactNumber || '',
        maxBookingsPerSlot: data.maxBookingsPerSlot != null ? String(data.maxBookingsPerSlot) : '',
        slotDurationHours: data.slotDurationHours != null ? String(data.slotDurationHours) : '',
        latitude: coords ? String(coords[1]) : '',
        longitude: coords ? String(coords[0]) : ''
      });
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      if (!branchId) {
        setForm({
          branchName: '',
          location: '',
          district: '',
          contactNumber: '',
          maxBookingsPerSlot: '',
          slotDurationHours: '',
          latitude: '',
          longitude: ''
        });
        setBranchCode('');
        setIsActive(true);
        setLoading(false);
        return undefined;
      }

      loadBranch().catch((e) =>
        Alert.alert('Error', e?.response?.data?.message || 'Failed to load outlet')
      );
    }, [branchId])
  );

  const buildPayload = () => ({
    branchName: form.branchName.trim(),
    location: form.location.trim(),
    district: form.district,
    contactNumber: form.contactNumber.trim(),
    ...(form.maxBookingsPerSlot.trim() ? { maxBookingsPerSlot: parseInt(form.maxBookingsPerSlot, 10) } : {}),
    ...(form.slotDurationHours.trim() ? { slotDurationHours: parseInt(form.slotDurationHours, 10) } : {}),
    ...(coordsPayload ? coordsPayload : {})
  });

  const save = async () => {
    if (!form.branchName.trim()) {
      Alert.alert('Required', 'Enter a branch name.');
      return;
    }
    if (!form.location.trim()) {
      Alert.alert('Required', 'Enter location / address.');
      return;
    }
    if (!form.district.trim()) {
      Alert.alert('Required', 'Choose a district.');
      return;
    }

    const payload = buildPayload();

    const m = form.maxBookingsPerSlot.trim();
    const s = form.slotDurationHours.trim();
    if (m && (Number.isNaN(parseInt(m, 10)) || parseInt(m, 10) < 1)) {
      Alert.alert('Invalid', 'Max bookings per slot must be a positive number.');
      return;
    }
    if (s && (Number.isNaN(parseInt(s, 10)) || parseInt(s, 10) < 1)) {
      Alert.alert('Invalid', 'Slot duration (hours) must be a positive number.');
      return;
    }

    setSubmitting(true);
    try {
      if (branchId) {
        await api.put(`/service-centers/me/branches/${branchId}`, { ...payload, isActive }, authHeaders);
        Alert.alert('Saved', 'Outlet updated.');
      } else {
        await api.post('/service-centers/me/branches', payload, authHeaders);
        Alert.alert('Created', 'New outlet added.', [
          {
            text: 'OK',
            onPress: () => navigation.goBack()
          }
        ]);
        return;
      }
      navigation.goBack();
    } catch (error) {
      Alert.alert('Error', error?.response?.data?.message || 'Could not save');
    } finally {
      setSubmitting(false);
    }
  };

  const deactivate = async () => {
    if (!branchId) return;
    Alert.alert(
      'Deactivate outlet',
      'This outlet will disappear from booking lists until reactivated.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Deactivate',
          style: 'destructive',
          onPress: async () => {
            setSubmitting(true);
            try {
              const body = buildPayload();
              await api.put(`/service-centers/me/branches/${branchId}`, { ...body, isActive: false }, authHeaders);
              setIsActive(false);
              Alert.alert('Updated', 'Outlet deactivated.');
              navigation.goBack();
            } catch (error) {
              Alert.alert('Error', error?.response?.data?.message || 'Could not deactivate');
            } finally {
              setSubmitting(false);
            }
          }
        }
      ]
    );
  };

  const removePermanently = async () => {
    if (!branchId) return;
    Alert.alert('Delete permanently', 'Only allowed if no bookings reference this outlet.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          setSubmitting(true);
          try {
            await api.delete(`/service-centers/me/branches/${branchId}`, authHeaders);
            Alert.alert('Deleted');
            navigation.goBack();
          } catch (error) {
            Alert.alert('Error', error?.response?.data?.message || 'Could not delete');
          } finally {
            setSubmitting(false);
          }
        }
      }
    ]);
  };

  if (loading) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Text style={styles.heading}>{isEdit ? 'Edit outlet' : 'Add outlet'}</Text>
      {branchCode ? (
        <Text style={styles.kicker}>Code {branchCode}</Text>
      ) : null}

      <InputField
        label="Branch name"
        placeholder="Halford Maharagama"
        value={form.branchName}
        onChangeText={(branchName) => setForm((f) => ({ ...f, branchName }))}
      />
      <InputField
        label="Location"
        placeholder="Street, area…"
        value={form.location}
        onChangeText={(location) => setForm((f) => ({ ...f, location }))}
      />
      <DistrictSelect
        label="District"
        value={form.district}
        onChange={(district) => setForm((f) => ({ ...f, district }))}
        options={districtOptions}
      />
      <InputField
        label="Contact number (optional)"
        placeholder=""
        keyboardType="phone-pad"
        value={form.contactNumber}
        onChangeText={(contactNumber) => setForm((f) => ({ ...f, contactNumber }))}
      />

      <InputField
        label="Max bookings per slot (optional override)"
        placeholder="Uses center default if empty"
        keyboardType="number-pad"
        value={form.maxBookingsPerSlot}
        onChangeText={(maxBookingsPerSlot) => setForm((f) => ({ ...f, maxBookingsPerSlot }))}
      />
      <InputField
        label="Slot duration hours (optional override)"
        placeholder="Uses center default if empty"
        keyboardType="number-pad"
        value={form.slotDurationHours}
        onChangeText={(slotDurationHours) => setForm((f) => ({ ...f, slotDurationHours }))}
      />

      <InputField
        label="Latitude (optional)"
        placeholder=""
        keyboardType="decimal-pad"
        value={form.latitude}
        onChangeText={(latitude) => setForm((f) => ({ ...f, latitude }))}
      />
      <InputField
        label="Longitude (optional)"
        placeholder=""
        keyboardType="decimal-pad"
        value={form.longitude}
        onChangeText={(longitude) => setForm((f) => ({ ...f, longitude }))}
      />

      <Pressable style={[styles.primaryBtn, submitting && styles.btnDisabled]} onPress={save} disabled={submitting}>
        <Text style={styles.primaryBtnText}>{isEdit ? 'Save changes' : 'Create outlet'}</Text>
      </Pressable>

      {isEdit ? (
        <View style={styles.dangerBlock}>
          {isActive ? (
            <Pressable style={styles.secondaryBtn} onPress={deactivate} disabled={submitting}>
              <Text style={styles.secondaryText}>Deactivate outlet</Text>
            </Pressable>
          ) : null}
          <Pressable style={styles.dangerBtn} onPress={removePermanently} disabled={submitting}>
            <Text style={styles.dangerText}>Delete permanently</Text>
          </Pressable>
        </View>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  loader: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.bg
  },
  screen: { flex: 1, backgroundColor: theme.colors.bg },
  content: { padding: theme.spacing.lg, paddingBottom: theme.spacing.xl },
  heading: { fontSize: 20, fontWeight: '900', color: theme.colors.text, marginBottom: 4 },
  kicker: { color: theme.colors.primary, fontWeight: '800', marginBottom: theme.spacing.md },
  primaryBtn: {
    backgroundColor: theme.colors.primary,
    borderRadius: theme.radius.lg,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: theme.spacing.sm,
    ...theme.shadow.soft
  },
  primaryBtnText: { color: '#fff', fontWeight: '800', fontSize: 15 },
  btnDisabled: { opacity: 0.6 },
  dangerBlock: { marginTop: theme.spacing.xl, gap: 10 },
  secondaryBtn: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.card,
    borderRadius: theme.radius.lg,
    paddingVertical: 12,
    alignItems: 'center'
  },
  secondaryText: { fontWeight: '800', color: theme.colors.text },
  dangerBtn: {
    backgroundColor: '#FEE2E2',
    borderRadius: theme.radius.lg,
    paddingVertical: 12,
    alignItems: 'center'
  },
  dangerText: { fontWeight: '800', color: '#991B1B' }
});
