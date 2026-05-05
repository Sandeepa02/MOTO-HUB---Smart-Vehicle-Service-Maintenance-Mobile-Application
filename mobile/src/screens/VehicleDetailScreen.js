import React, { useCallback, useState } from 'react';
import {
  Alert,
  Image,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import * as DocumentPicker from 'expo-document-picker';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';
import { API_BASE_URL } from '../config';
import { formatCurrency } from '../formatCurrency';
import { theme } from '../theme';

const formatDate = (date) => {
  if (!date) return 'Not set';
  return new Date(date).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  });
};

const getHealthColor = (score) => {
  if (score >= 80) return '#22c55e';
  if (score >= 60) return '#84cc16';
  if (score >= 40) return '#eab308';
  if (score >= 20) return '#f97316';
  return '#ef4444';
};

const getDaysLeftColor = (days) => {
  if (days <= 7) return '#ef4444';
  if (days <= 30) return '#f97316';
  return theme.colors.muted;
};

export default function VehicleDetailScreen({ route, navigation }) {
  const { authHeaders } = useAuth();
  const vehicleId = route.params?.vehicleId;
  const [loading, setLoading] = useState(true);
  const [vehicleData, setVehicleData] = useState(null);
  const [uploading, setUploading] = useState(false);

  const uploadsBaseUrl = API_BASE_URL.replace(/\/api\/?$/, '');

  const fetchDetails = async () => {
    try {
      setLoading(true);
      const { data } = await api.get(`/vehicles/${vehicleId}/details`, authHeaders);
      setVehicleData(data);
    } catch (error) {
      Alert.alert('Error', error?.response?.data?.message || 'Failed to load vehicle details');
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      if (vehicleId) fetchDetails();
    }, [vehicleId])
  );

  const uploadDocument = async (docType) => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/pdf', 'image/*'],
        copyToCacheDirectory: true
      });

      if (result.canceled) return;

      setUploading(true);
      const file = result.assets[0];
      const formData = new FormData();
      formData.append('docType', docType);
      formData.append('name', file.name);

      if (Platform.OS === 'web') {
        const response = await fetch(file.uri);
        const blob = await response.blob();
        formData.append('document', new File([blob], file.name, { type: file.mimeType }));
      } else {
        formData.append('document', {
          uri: file.uri,
          name: file.name,
          type: file.mimeType
        });
      }

      const headers = { ...authHeaders.headers };
      if (Platform.OS !== 'web') headers['Content-Type'] = 'multipart/form-data';

      await api.post(`/vehicles/${vehicleId}/documents`, formData, { ...authHeaders, headers });
      Alert.alert('Success', 'Document uploaded successfully');
      fetchDetails();
    } catch (error) {
      Alert.alert('Error', error?.response?.data?.message || 'Failed to upload document');
    } finally {
      setUploading(false);
    }
  };

  const deleteDocument = (docId) => {
    Alert.alert('Delete Document', 'Are you sure you want to delete this document?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await api.delete(`/vehicles/${vehicleId}/documents/${docId}`, authHeaders);
            fetchDetails();
          } catch (error) {
            Alert.alert('Error', 'Failed to delete document');
          }
        }
      }
    ]);
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  if (!vehicleData) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>Vehicle not found</Text>
      </View>
    );
  }

  const { vehicle, healthScore, serviceSummary } = vehicleData;

  const insuranceDaysLeft = vehicle.insuranceExpiry
    ? Math.ceil((new Date(vehicle.insuranceExpiry) - new Date()) / (1000 * 60 * 60 * 24))
    : null;
  const registrationDaysLeft = vehicle.registrationExpiry
    ? Math.ceil((new Date(vehicle.registrationExpiry) - new Date()) / (1000 * 60 * 60 * 24))
    : null;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {vehicle.image ? (
        <Image
          source={{
            uri: vehicle.image.startsWith('http') ? vehicle.image : `${uploadsBaseUrl}${vehicle.image}`
          }}
          style={styles.vehicleImage}
        />
      ) : (
        <View style={styles.imagePlaceholder}>
          <Text style={styles.placeholderText}>No Image</Text>
        </View>
      )}

      <Text style={styles.vehicleName}>{vehicle.vehicleName}</Text>
      <Text style={styles.vehicleInfo}>
        {vehicle.brand} {vehicle.model} ({vehicle.year})
      </Text>
      <Text style={styles.vehicleNumber}>{vehicle.vehicleNumber}</Text>
      <Text style={styles.mileage}>{vehicle.mileage.toLocaleString()} km</Text>

      {/* Health Score Card */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Vehicle Health Score</Text>
        <View style={styles.healthRow}>
          <View
            style={[styles.healthCircle, { borderColor: getHealthColor(healthScore.score) }]}
          >
            <Text style={[styles.healthScore, { color: getHealthColor(healthScore.score) }]}>
              {healthScore.score}
            </Text>
          </View>
          <View style={styles.healthInfo}>
            <Text style={[styles.healthStatus, { color: getHealthColor(healthScore.score) }]}>
              {healthScore.status}
            </Text>
            <Text style={styles.healthMeta}>Age: {healthScore.vehicleAge} years</Text>
            <Text style={styles.healthMeta}>
              Avg: {healthScore.mileagePerYear.toLocaleString()} km/year
            </Text>
          </View>
        </View>
        {healthScore.factors.length > 0 && (
          <View style={styles.factorsBox}>
            {healthScore.factors.slice(0, 3).map((f, i) => (
              <Text
                key={i}
                style={[styles.factor, { color: f.impact > 0 ? '#22c55e' : '#f97316' }]}
              >
                {f.impact > 0 ? '+' : ''}{f.impact} {f.factor}
              </Text>
            ))}
          </View>
        )}
      </View>

      {/* Service Summary Card */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Service History</Text>
        <View style={styles.summaryRow}>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryValue}>{serviceSummary.totalServices}</Text>
            <Text style={styles.summaryLabel}>Services</Text>
          </View>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryValue}>{formatCurrency(serviceSummary.totalSpent)}</Text>
            <Text style={styles.summaryLabel}>Total Spent</Text>
          </View>
        </View>
        {serviceSummary.lastServiceDate && (
          <Text style={styles.lastService}>
            Last serviced: {formatDate(serviceSummary.lastServiceDate)}
          </Text>
        )}
        {serviceSummary.nextServiceDate && (
          <Text style={styles.nextService}>
            Next service due: {formatDate(serviceSummary.nextServiceDate)}
          </Text>
        )}
      </View>

      {/* Insurance & Registration Card */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Insurance & Registration</Text>

        <View style={styles.expirySection}>
          <Text style={styles.expiryTitle}>Insurance</Text>
          {vehicle.insuranceProvider && (
            <Text style={styles.expiryMeta}>Provider: {vehicle.insuranceProvider}</Text>
          )}
          {vehicle.policyNumber && (
            <Text style={styles.expiryMeta}>Policy: {vehicle.policyNumber}</Text>
          )}
          <View style={styles.expiryRow}>
            <Text style={styles.expiryDate}>Expires: {formatDate(vehicle.insuranceExpiry)}</Text>
            {insuranceDaysLeft !== null && (
              <Text style={[styles.daysLeft, { color: getDaysLeftColor(insuranceDaysLeft) }]}>
                {insuranceDaysLeft > 0 ? `${insuranceDaysLeft} days left` : 'Expired'}
              </Text>
            )}
          </View>
        </View>

        <View style={styles.divider} />

        <View style={styles.expirySection}>
          <Text style={styles.expiryTitle}>Registration</Text>
          <View style={styles.expiryRow}>
            <Text style={styles.expiryDate}>
              Expires: {formatDate(vehicle.registrationExpiry)}
            </Text>
            {registrationDaysLeft !== null && (
              <Text style={[styles.daysLeft, { color: getDaysLeftColor(registrationDaysLeft) }]}>
                {registrationDaysLeft > 0 ? `${registrationDaysLeft} days left` : 'Expired'}
              </Text>
            )}
          </View>
        </View>
      </View>

      {/* Documents Card */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Documents</Text>

        <View style={styles.uploadBtns}>
          <Pressable
            style={styles.uploadBtn}
            onPress={() => uploadDocument('rc_book')}
            disabled={uploading}
          >
            <Text style={styles.uploadBtnText}>+ RC Book</Text>
          </Pressable>
          <Pressable
            style={styles.uploadBtn}
            onPress={() => uploadDocument('insurance')}
            disabled={uploading}
          >
            <Text style={styles.uploadBtnText}>+ Insurance</Text>
          </Pressable>
          <Pressable
            style={styles.uploadBtn}
            onPress={() => uploadDocument('puc')}
            disabled={uploading}
          >
            <Text style={styles.uploadBtnText}>+ PUC</Text>
          </Pressable>
        </View>

        {vehicle.documents && vehicle.documents.length > 0 ? (
          vehicle.documents.map((doc) => (
            <View key={doc._id} style={styles.docItem}>
              <View>
                <Text style={styles.docName}>{doc.name}</Text>
                <Text style={styles.docType}>
                  {doc.docType.replace('_', ' ').toUpperCase()} • {formatDate(doc.uploadedAt)}
                </Text>
              </View>
              <Pressable onPress={() => deleteDocument(doc._id)}>
                <Text style={styles.deleteText}>Delete</Text>
              </Pressable>
            </View>
          ))
        ) : (
          <Text style={styles.noDocsText}>No documents uploaded yet</Text>
        )}
      </View>

      {/* QR Code Card */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Quick Check-in QR Code</Text>
        <Text style={styles.qrDesc}>
          Show this QR code at service centers for quick check-in
        </Text>
        {vehicle.qrCode ? (
          <Image source={{ uri: vehicle.qrCode }} style={styles.qrCode} resizeMode="contain" />
        ) : (
          <Text style={styles.noQrText}>QR code not generated</Text>
        )}
      </View>

      <Pressable
        style={styles.editBtn}
        onPress={() => navigation.navigate('VehicleForm', { vehicle })}
      >
        <Text style={styles.editBtnText}>Edit Vehicle</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.bg },
  content: { padding: theme.spacing.lg, paddingBottom: 40 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: theme.colors.bg },
  loadingText: { color: theme.colors.muted, fontWeight: '600' },
  errorText: { color: theme.colors.danger, fontWeight: '600' },

  vehicleImage: {
    width: '100%',
    height: 200,
    borderRadius: theme.radius.lg,
    marginBottom: 16,
    backgroundColor: theme.colors.card
  },
  imagePlaceholder: {
    width: '100%',
    height: 200,
    borderRadius: theme.radius.lg,
    marginBottom: 16,
    backgroundColor: theme.colors.card,
    justifyContent: 'center',
    alignItems: 'center'
  },
  placeholderText: { color: theme.colors.muted, fontWeight: '600' },

  vehicleName: { fontSize: 24, fontWeight: '800', color: theme.colors.text },
  vehicleInfo: { fontSize: 16, color: theme.colors.muted, marginTop: 4, fontWeight: '600' },
  vehicleNumber: {
    fontSize: 14,
    color: theme.colors.primary,
    marginTop: 4,
    fontWeight: '700'
  },
  mileage: { fontSize: 14, color: theme.colors.muted, marginTop: 2, fontWeight: '600' },

  card: {
    backgroundColor: theme.colors.card,
    borderRadius: theme.radius.lg,
    padding: theme.spacing.md,
    marginTop: 16,
    borderWidth: 1,
    borderColor: theme.colors.border,
    ...theme.shadow.soft
  },
  cardTitle: { fontSize: 16, fontWeight: '800', color: theme.colors.text, marginBottom: 12 },

  healthRow: { flexDirection: 'row', alignItems: 'center' },
  healthCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 4,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16
  },
  healthScore: { fontSize: 28, fontWeight: '800' },
  healthInfo: { flex: 1 },
  healthStatus: { fontSize: 18, fontWeight: '700' },
  healthMeta: { fontSize: 13, color: theme.colors.muted, marginTop: 2, fontWeight: '600' },
  factorsBox: { marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: theme.colors.border },
  factor: { fontSize: 13, fontWeight: '600', marginBottom: 4 },

  summaryRow: { flexDirection: 'row', justifyContent: 'space-around', marginBottom: 12 },
  summaryItem: { alignItems: 'center' },
  summaryValue: { fontSize: 20, fontWeight: '800', color: theme.colors.text },
  summaryLabel: { fontSize: 12, color: theme.colors.muted, marginTop: 2, fontWeight: '600' },
  lastService: { fontSize: 13, color: theme.colors.muted, fontWeight: '600' },
  nextService: { fontSize: 13, color: theme.colors.primary, marginTop: 4, fontWeight: '600' },

  expirySection: { marginBottom: 8 },
  expiryTitle: { fontSize: 14, fontWeight: '700', color: theme.colors.text, marginBottom: 4 },
  expiryMeta: { fontSize: 13, color: theme.colors.muted, fontWeight: '600' },
  expiryRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 },
  expiryDate: { fontSize: 13, color: theme.colors.text, fontWeight: '600' },
  daysLeft: { fontSize: 13, fontWeight: '700' },
  divider: { height: 1, backgroundColor: theme.colors.border, marginVertical: 12 },

  uploadBtns: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  uploadBtn: {
    flex: 1,
    backgroundColor: theme.colors.bg,
    padding: 10,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderStyle: 'dashed'
  },
  uploadBtnText: { textAlign: 'center', fontSize: 12, fontWeight: '700', color: theme.colors.primary },
  docItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border
  },
  docName: { fontSize: 14, fontWeight: '600', color: theme.colors.text },
  docType: { fontSize: 12, color: theme.colors.muted, marginTop: 2, fontWeight: '600' },
  deleteText: { color: theme.colors.danger, fontWeight: '700', fontSize: 13 },
  noDocsText: { color: theme.colors.muted, fontWeight: '600', textAlign: 'center', paddingVertical: 16 },

  qrDesc: { fontSize: 13, color: theme.colors.muted, marginBottom: 12, fontWeight: '600' },
  qrCode: { width: '100%', height: 200, backgroundColor: '#fff', borderRadius: theme.radius.md },
  noQrText: { color: theme.colors.muted, fontWeight: '600', textAlign: 'center', paddingVertical: 16 },

  editBtn: {
    backgroundColor: theme.colors.primary,
    padding: 14,
    borderRadius: theme.radius.lg,
    marginTop: 20,
    ...theme.shadow.soft
  },
  editBtnText: { color: '#fff', textAlign: 'center', fontWeight: '700' }
});
