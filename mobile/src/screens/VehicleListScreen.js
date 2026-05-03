import React, { useCallback, useState } from 'react';
import { Alert, FlatList, Image, Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';
import { API_BASE_URL } from '../config';
import { theme } from '../theme';

const formatExpiryDate = (date) => {
  if (!date) return '';
  const d = new Date(date);
  const daysLeft = Math.ceil((d - new Date()) / (1000 * 60 * 60 * 24));
  const formatted = d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
  if (daysLeft < 0) return `Expired`;
  if (daysLeft <= 7) return `${formatted} (${daysLeft}d left)`;
  if (daysLeft <= 30) return `${formatted} (${daysLeft}d left)`;
  return formatted;
};

const getExpiryStyle = (date) => {
  if (!date) return {};
  const daysLeft = Math.ceil((new Date(date) - new Date()) / (1000 * 60 * 60 * 24));
  if (daysLeft < 0) return { color: '#ef4444' };
  if (daysLeft <= 7) return { color: '#ef4444' };
  if (daysLeft <= 30) return { color: '#f97316' };
  return {};
};

export default function VehicleListScreen({ navigation }) {
  const { authHeaders } = useAuth();
  const [vehicles, setVehicles] = useState([]);
  const [refreshing, setRefreshing] = useState(false);

  const uploadsBaseUrl = API_BASE_URL.replace(/\/api\/?$/, '');

  const fetchVehicles = async () => {
    const { data } = await api.get('/vehicles', authHeaders);
    setVehicles(data);
  };

  useFocusEffect(
    useCallback(() => {
      fetchVehicles().catch((error) => {
        Alert.alert('Error', error?.response?.data?.message || 'Failed to load vehicles');
      });
    }, [])
  );

  const onRefresh = async () => {
    try {
      setRefreshing(true);
      await fetchVehicles();
    } finally {
      setRefreshing(false);
    }
  };

  const handleDelete = (id) => {
    Alert.alert('Delete Vehicle', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await api.delete(`/vehicles/${id}`, authHeaders);
            await fetchVehicles();
          } catch (error) {
            Alert.alert('Error', error?.response?.data?.message || 'Delete failed');
          }
        }
      }
    ]);
  };

  return (
    <View style={styles.container}>
      <Pressable style={styles.addBtn} onPress={() => navigation.navigate('VehicleForm')}>
        <Text style={styles.btnText}>+ Add Vehicle</Text>
      </Pressable>
      <FlatList
        data={vehicles}
        keyExtractor={(item) => item._id}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        renderItem={({ item }) => (
          <Pressable onPress={() => navigation.navigate('VehicleDetail', { vehicleId: item._id })}>
            <View style={styles.card}>
              {item.image ? (
                <Image
                  source={{ uri: item.image.startsWith('http') ? item.image : `${uploadsBaseUrl}${item.image}` }}
                  style={styles.vehicleImage}
                />
              ) : null}
              <Text style={styles.title}>{item.vehicleName}</Text>
              <Text style={styles.text}>
                {item.brand} {item.model} ({item.year})
              </Text>
              <Text style={styles.text}>Number: {item.vehicleNumber}</Text>
              <Text style={styles.text}>Mileage: {item.mileage} km</Text>
              {item.insuranceExpiry && (
                <Text style={[styles.text, getExpiryStyle(item.insuranceExpiry)]}>
                  Insurance: {formatExpiryDate(item.insuranceExpiry)}
                </Text>
              )}
              <View style={styles.row}>
                <Pressable
                  style={[styles.smallBtn, styles.viewBtn]}
                  onPress={() => navigation.navigate('VehicleDetail', { vehicleId: item._id })}
                >
                  <Text style={styles.btnText}>View Details</Text>
                </Pressable>
                <Pressable style={[styles.smallBtn, styles.deleteBtn]} onPress={() => handleDelete(item._id)}>
                  <Text style={styles.btnText}>Delete</Text>
                </Pressable>
              </View>
            </View>
          </Pressable>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: theme.spacing.lg, backgroundColor: theme.colors.bg },
  addBtn: { backgroundColor: theme.colors.primary, padding: 14, borderRadius: theme.radius.lg, marginBottom: 12, ...theme.shadow.soft },
  card: {
    backgroundColor: theme.colors.card,
    padding: theme.spacing.md,
    borderRadius: theme.radius.lg,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: theme.colors.border,
    ...theme.shadow.soft
  },
  vehicleImage: { width: '100%', height: 140, borderRadius: theme.radius.lg, marginBottom: 10, backgroundColor: theme.colors.bg },
  title: { fontSize: 17, fontWeight: '700', color: theme.colors.text },
  text: { color: theme.colors.muted, marginTop: 2, fontWeight: '600' },
  row: { flexDirection: 'row', gap: 10, marginTop: 10 },
  smallBtn: { flex: 1, padding: 12, borderRadius: theme.radius.md, ...theme.shadow.soft },
  viewBtn: { backgroundColor: theme.colors.primary },
  editBtn: { backgroundColor: theme.colors.primary2 },
  deleteBtn: { backgroundColor: theme.colors.danger },
  btnText: { textAlign: 'center', color: '#fff', fontWeight: '600' }
});
