import React, { useState } from 'react';
import { Alert, Image, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import DateTimePicker from '@react-native-community/datetimepicker';
import InputField from '../components/InputField';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';
import { theme } from '../theme';

const formatDate = (date) => {
  if (!date) return '';
  const d = new Date(date);
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
};

export default function VehicleFormScreen({ navigation, route }) {
  const { authHeaders } = useAuth();
  const vehicle = route.params?.vehicle;
  const [form, setForm] = useState({
    vehicleName: vehicle?.vehicleName || '',
    vehicleNumber: vehicle?.vehicleNumber || '',
    brand: vehicle?.brand || '',
    model: vehicle?.model || '',
    year: String(vehicle?.year || ''),
    mileage: String(vehicle?.mileage || ''),
    insuranceProvider: vehicle?.insuranceProvider || '',
    policyNumber: vehicle?.policyNumber || ''
  });
  const [insuranceExpiry, setInsuranceExpiry] = useState(
    vehicle?.insuranceExpiry ? new Date(vehicle.insuranceExpiry) : null
  );
  const [registrationExpiry, setRegistrationExpiry] = useState(
    vehicle?.registrationExpiry ? new Date(vehicle.registrationExpiry) : null
  );
  const [showInsurancePicker, setShowInsurancePicker] = useState(false);
  const [showRegistrationPicker, setShowRegistrationPicker] = useState(false);
  const [image, setImage] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8
    });
    if (!result.canceled) setImage(result.assets[0]);
  };

  const handleSave = async () => {
    try {
      setSubmitting(true);

      const data = new FormData();
      Object.entries(form).forEach(([key, value]) => data.append(key, value));

      if (insuranceExpiry) {
        data.append('insuranceExpiry', insuranceExpiry.toISOString());
      }
      if (registrationExpiry) {
        data.append('registrationExpiry', registrationExpiry.toISOString());
      }

      if (image) {
        if (Platform.OS === 'web') {
          const response = await fetch(image.uri);
          const blob = await response.blob();
          const fileName = image.fileName || 'vehicle.jpg';
          const fileType = image.mimeType || blob.type || 'image/jpeg';
          data.append('image', new File([blob], fileName, { type: fileType }));
        } else {
          data.append('image', {
            uri: image.uri,
            name: image.fileName || 'vehicle.jpg',
            type: image.mimeType || 'image/jpeg'
          });
        }
      }

      const headers = { ...authHeaders.headers };
      if (Platform.OS !== 'web') headers['Content-Type'] = 'multipart/form-data';
      const config = { ...authHeaders, headers };

      if (vehicle?._id) {
        await api.put(`/vehicles/${vehicle._id}`, data, config);
      } else {
        await api.post('/vehicles', data, config);
      }

      navigation.goBack();
    } catch (error) {
      console.log('Vehicle save failed:', {
        message: error?.message,
        status: error?.response?.status,
        data: error?.response?.data
      });
      const status = error?.response?.status;
      const message = error?.response?.data?.message || 'Save failed';
      Alert.alert('Error', status ? `${status}: ${message}` : message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.sectionTitle}>Basic Information</Text>
      <InputField label="Vehicle Name" value={form.vehicleName} onChangeText={(vehicleName) => setForm((p) => ({ ...p, vehicleName }))} />
      <InputField label="Vehicle Number" value={form.vehicleNumber} onChangeText={(vehicleNumber) => setForm((p) => ({ ...p, vehicleNumber }))} />
      <InputField label="Brand" value={form.brand} onChangeText={(brand) => setForm((p) => ({ ...p, brand }))} />
      <InputField label="Model" value={form.model} onChangeText={(model) => setForm((p) => ({ ...p, model }))} />
      <InputField label="Year" value={form.year} keyboardType="numeric" onChangeText={(year) => setForm((p) => ({ ...p, year }))} />
      <InputField label="Mileage (km)" value={form.mileage} keyboardType="numeric" onChangeText={(mileage) => setForm((p) => ({ ...p, mileage }))} />

      <Pressable style={styles.grayBtn} onPress={pickImage}>
        <Text style={styles.grayBtnText}>Select Vehicle Image</Text>
      </Pressable>
      {image ? <Image source={{ uri: image.uri }} style={styles.preview} /> : null}

      <Text style={styles.sectionTitle}>Insurance Details</Text>
      <InputField
        label="Insurance Provider"
        value={form.insuranceProvider}
        onChangeText={(insuranceProvider) => setForm((p) => ({ ...p, insuranceProvider }))}
      />
      <InputField
        label="Policy Number"
        value={form.policyNumber}
        onChangeText={(policyNumber) => setForm((p) => ({ ...p, policyNumber }))}
      />
      <Text style={styles.label}>Insurance Expiry Date</Text>
      <Pressable style={styles.dateBtn} onPress={() => setShowInsurancePicker(true)}>
        <Text style={styles.dateBtnText}>
          {insuranceExpiry ? formatDate(insuranceExpiry) : 'Select Date'}
        </Text>
      </Pressable>
      {showInsurancePicker && (
        <DateTimePicker
          value={insuranceExpiry || new Date()}
          mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={(event, date) => {
            setShowInsurancePicker(Platform.OS === 'ios');
            if (date) setInsuranceExpiry(date);
          }}
        />
      )}

      <Text style={styles.sectionTitle}>Registration Details</Text>
      <Text style={styles.label}>Registration Expiry Date</Text>
      <Pressable style={styles.dateBtn} onPress={() => setShowRegistrationPicker(true)}>
        <Text style={styles.dateBtnText}>
          {registrationExpiry ? formatDate(registrationExpiry) : 'Select Date'}
        </Text>
      </Pressable>
      {showRegistrationPicker && (
        <DateTimePicker
          value={registrationExpiry || new Date()}
          mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={(event, date) => {
            setShowRegistrationPicker(Platform.OS === 'ios');
            if (date) setRegistrationExpiry(date);
          }}
        />
      )}

      <View style={styles.spacer} />
      <Pressable style={styles.saveBtn} onPress={handleSave} disabled={submitting}>
        <Text style={styles.saveBtnText}>{submitting ? 'Saving...' : 'Save Vehicle'}</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: theme.spacing.lg, backgroundColor: theme.colors.bg, flexGrow: 1 },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: theme.colors.text,
    marginTop: 16,
    marginBottom: 8
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.muted,
    marginBottom: 6
  },
  grayBtn: {
    backgroundColor: theme.colors.card,
    padding: 14,
    borderRadius: theme.radius.lg,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: theme.colors.border,
    ...theme.shadow.soft
  },
  grayBtnText: { textAlign: 'center', fontWeight: '700', color: theme.colors.text },
  dateBtn: {
    backgroundColor: theme.colors.card,
    padding: 14,
    borderRadius: theme.radius.lg,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: theme.colors.border,
    ...theme.shadow.soft
  },
  dateBtnText: { textAlign: 'center', fontWeight: '600', color: theme.colors.text },
  preview: { width: '100%', height: 180, borderRadius: theme.radius.lg, marginBottom: 12, ...theme.shadow.soft },
  spacer: { height: 20 },
  saveBtn: { backgroundColor: theme.colors.primary, padding: 14, borderRadius: theme.radius.lg, ...theme.shadow.soft, marginBottom: 30 },
  saveBtnText: { color: '#fff', textAlign: 'center', fontWeight: '700' }
});
