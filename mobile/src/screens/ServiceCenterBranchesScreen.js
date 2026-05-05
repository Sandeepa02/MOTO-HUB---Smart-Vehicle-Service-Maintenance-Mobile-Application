import React, { useCallback, useState } from 'react';
import { Alert, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';
import { theme } from '../theme';

export default function ServiceCenterBranchesScreen({ navigation }) {
  const { authHeaders } = useAuth();
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    const { data } = await api.get('/service-centers/me/branches', authHeaders);
    setBranches(Array.isArray(data) ? data : []);
    setLoading(false);
  };

  useFocusEffect(
    useCallback(() => {
      load().catch((error) => {
        setLoading(false);
        Alert.alert('Error', error?.response?.data?.message || 'Failed to load outlets');
      });
    }, [])
  );

  const goAdd = () => navigation.navigate('ManageBranch', {});

  return (
    <View style={styles.screen}>
      <View style={styles.headerRow}>
        <Text style={styles.title}>Branches and outlets</Text>
        <Pressable style={styles.addBtn} onPress={goAdd}>
          <Ionicons name="add" size={22} color="#fff" />
          <Text style={styles.addBtnText}>Add</Text>
        </Pressable>
      </View>
      <Text style={styles.sub}>
        Add outlets like “Halford Maharagama” or “Kadawatha”. Customers must pick an outlet when booking.
      </Text>

      <FlatList
        data={loading ? [] : branches}
        keyExtractor={(item) => item._id}
        contentContainerStyle={styles.listPad}
        refreshing={loading}
        onRefresh={() => {
          setLoading(true);
          load().catch((e) => Alert.alert('Error', e?.response?.data?.message)).finally(() => setLoading(false));
        }}
        ListEmptyComponent={
          !loading ? (
            <View style={styles.empty}>
              <Text style={styles.emptyText}>No outlets yet. Add your first branch.</Text>
            </View>
          ) : null
        }
        renderItem={({ item }) => (
          <Pressable
            style={styles.card}
            onPress={() => navigation.navigate('ManageBranch', { branchId: item._id })}
          >
            <View style={styles.cardTop}>
              <Text style={styles.cardTitle}>{item.branchName}</Text>
              <View style={[styles.status, item.isActive ? styles.statusOn : styles.statusOff]}>
                <Text style={[styles.statusText, item.isActive ? styles.statusTextOn : styles.statusTextOff]}>
                  {item.isActive ? 'Active' : 'Inactive'}
                </Text>
              </View>
            </View>
            {item.branchCode ? <Text style={styles.code}>{item.branchCode}</Text> : null}
            <Text style={styles.meta}>{item.location}</Text>
            {item.district ? <Text style={styles.metaMuted}>{item.district}</Text> : null}
          </Pressable>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: theme.colors.bg },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.md
  },
  title: { fontSize: 20, fontWeight: '900', color: theme.colors.text, flex: 1 },
  sub: {
    color: theme.colors.muted,
    paddingHorizontal: theme.spacing.lg,
    marginTop: 8,
    marginBottom: 4,
    fontWeight: '600'
  },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: theme.colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: theme.radius.lg,
    ...theme.shadow.soft
  },
  addBtnText: { color: '#fff', fontWeight: '800' },
  listPad: { padding: theme.spacing.lg, paddingBottom: theme.spacing.xl },
  card: {
    backgroundColor: theme.colors.card,
    borderRadius: theme.radius.lg,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.sm,
    borderWidth: 1,
    borderColor: theme.colors.border,
    ...theme.shadow.soft
  },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  cardTitle: { flex: 1, fontWeight: '800', fontSize: 16, color: theme.colors.text },
  meta: { marginTop: 6, fontWeight: '700', color: theme.colors.text },
  metaMuted: { marginTop: 2, fontWeight: '600', color: theme.colors.muted },
  code: { marginTop: 4, fontSize: 12, fontWeight: '700', color: theme.colors.primary },
  status: {
    marginLeft: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: theme.radius.pill,
    borderWidth: 1
  },
  statusOn: { backgroundColor: '#DCFCE7', borderColor: '#86EFAC' },
  statusOff: { backgroundColor: '#F3F4F6', borderColor: theme.colors.border },
  statusText: { fontSize: 11, fontWeight: '800' },
  statusTextOn: { color: '#166534' },
  statusTextOff: { color: theme.colors.muted },
  empty: { padding: theme.spacing.xl, alignItems: 'center' },
  emptyText: { color: theme.colors.muted, fontWeight: '700', textAlign: 'center' }
});
