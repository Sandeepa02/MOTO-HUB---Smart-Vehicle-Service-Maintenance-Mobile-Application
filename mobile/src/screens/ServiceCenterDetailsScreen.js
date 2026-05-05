import React, { useCallback, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import api from '../api/client';
import { theme } from '../theme';

export default function ServiceCenterDetailsScreen({ navigation, route }) {
  const serviceCenterId = route.params?.serviceCenterId;
  const [center, setCenter] = useState(null);
  const [services, setServices] = useState([]);

  const [branches, setBranches] = useState([]);

  const fetchCenter = async () => {
    if (!serviceCenterId) {
      throw new Error('Missing service center id');
    }

    const [centerRes, servicesRes, branchesRes] = await Promise.all([
      api.get(`/service-centers/${serviceCenterId}`),
      api.get(`/service-packages?serviceCenterId=${serviceCenterId}`),
      api.get(`/service-centers/${serviceCenterId}/branches`)
    ]);
    setCenter(centerRes.data);
    setServices(servicesRes.data);
    setBranches(Array.isArray(branchesRes.data) ? branchesRes.data : []);
  };

  useFocusEffect(
    useCallback(() => {
      fetchCenter().catch((error) => Alert.alert('Error', error?.response?.data?.message || error.message || 'Failed loading service center'));
    }, [serviceCenterId])
  );

  if (!center) {
    return (
      <View style={styles.loadingBox}>
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.section}>
      <Text style={styles.title}>{center.centerName}</Text>
      <Text style={styles.meta}>📌: {center.location}</Text>
      <Text style={styles.meta}>☎️: {center.contactNumber}</Text>

        {branches.length ? (
          <>
            <Text style={styles.sectionTitle}>Outlets</Text>
            {branches.map((b) => (
              <Text key={b._id} style={styles.outletLine}>
                • {b.branchName} — {b.location}
              </Text>
            ))}
          </>
        ) : null}

        <Text style={styles.sectionTitle}>Services Offered</Text>
        {services.length ? (
          services.map((service) => (
            <View key={service._id} style={styles.serviceCard}>
              <View style={styles.serviceHeader}>
                <Text style={styles.serviceName}>{service.serviceName}</Text>
                <Text style={styles.servicePrice}>LKR {service.price.toFixed(2)}</Text>
              </View>
              {service.includedServices && service.includedServices.length > 0 ? (
                <View style={styles.includedServicesBox}>
                  {service.includedServices.map((item, idx) => (
                    <Text key={idx} style={styles.includedItem}>• {item}</Text>
                  ))}
                </View>
              ) : null}
            </View>
          ))
        ) : (
          <Text style={styles.meta}>No services listed yet.</Text>
        )}
      </View>

      <Pressable 
        style={styles.primaryBtn} 
        onPress={() => navigation.navigate('ServicePackageSelection', { 
          serviceCenterId: center._id,
          serviceCenterName: center.centerName 
        })}
      >
        <Text style={styles.primaryBtnText}>Book Service</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.bg },
  content: { padding: theme.spacing.lg, paddingBottom: theme.spacing.xl },
  title: { fontSize: 20, fontWeight: '800', color: theme.colors.text, marginBottom: 8 },
  meta: { color: theme.colors.muted, marginBottom: 7, fontWeight: '700' },
  section: {
    backgroundColor: theme.colors.card,
    borderRadius: theme.radius.lg,
    padding: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    paddingLeft: 20,
    ...theme.shadow.card
  },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: theme.colors.text, marginBottom: 10,marginTop: 10 },
  serviceCard: {
    backgroundColor: theme.colors.bg,
    borderRadius: theme.radius.md,
    padding: theme.spacing.sm,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: theme.colors.border
  },
  serviceHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  serviceName: { fontSize: 15, fontWeight: '700', color: theme.colors.text, flex: 1 },
  servicePrice: { fontSize: 15, fontWeight: '700', color: theme.colors.primary },
  includedServicesBox: {
    backgroundColor: theme.colors.card,
    padding: 8,
    borderRadius: theme.radius.sm,
    marginTop: 6
  },
  includedItem: { fontSize: 12, color: theme.colors.muted, marginBottom: 2, marginLeft: 6 },
  outletLine: { fontSize: 13, color: theme.colors.muted, fontWeight: '700', marginBottom: 4 },
  servicePill: {
    alignSelf: 'flex-start',
    backgroundColor: '#DCEBFF',
    borderRadius: theme.radius.pill,
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: theme.colors.border
  },
  serviceText: { fontWeight: '700', color: theme.colors.text },
  primaryBtn: { backgroundColor: theme.colors.primary, borderRadius: theme.radius.lg, padding: 14, marginTop: 18, ...theme.shadow.soft },
  primaryBtnText: { color: '#fff', fontWeight: '700', textAlign: 'center' },
  loadingBox: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: theme.colors.bg },
  loadingText: { color: theme.colors.muted, fontWeight: '700' }
});
