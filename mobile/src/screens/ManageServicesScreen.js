import React, { useCallback, useState } from 'react';
import { Alert, FlatList, Pressable, ScrollView, StyleSheet, Switch, Text, TextInput, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';
import { theme } from '../theme';

const CATEGORIES = ['Basic', 'Premium', 'Comprehensive'];

const CATEGORY_COLORS = {
  Basic: '#3B82F6',
  Premium: '#F59E0B', 
  Comprehensive: '#8B5CF6'
};

export default function ManageServicesScreen({ navigation }) {
  const { authHeaders } = useAuth();
  const [services, setServices] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({
    serviceName: '',
    includedServices: '',
    price: '',
    category: 'Basic',
    estimatedDuration: '1',
    discountPrice: '',
    discountValidTill: '',
    isCustomizable: false
  });

  const fetchServices = async () => {
    const { data } = await api.get('/service-packages/my', authHeaders);
    setServices(data);
  };

  useFocusEffect(
    useCallback(() => {
      fetchServices().catch((error) =>
        Alert.alert('Error', error?.response?.data?.message || 'Failed loading services')
      );
    }, [])
  );

  const saveService = async () => {
    try {
      if (!form.serviceName || !form.price) {
        Alert.alert('Error', 'Service name and price are required');
        return;
      }

      const payload = {
        serviceName: form.serviceName,
        includedServices: form.includedServices
          ? form.includedServices.split('\n').filter(s => s.trim())
          : [],
        price: parseFloat(form.price),
        category: form.category,
        estimatedDuration: parseFloat(form.estimatedDuration) || 1,
        discountPrice: form.discountPrice ? parseFloat(form.discountPrice) : undefined,
        discountValidTill: form.discountValidTill || undefined,
        isCustomizable: form.isCustomizable
      };

      if (editingId) {
        await api.put(`/service-packages/${editingId}`, payload, authHeaders);
      } else {
        await api.post('/service-packages', payload, authHeaders);
      }

      setForm({ 
        serviceName: '', 
        includedServices: '', 
        price: '',
        category: 'Basic',
        estimatedDuration: '1',
        discountPrice: '',
        discountValidTill: '',
        isCustomizable: false
      });
      setEditingId(null);
      await fetchServices();
      Alert.alert('Success', editingId ? 'Service updated' : 'Service added');
    } catch (error) {
      Alert.alert('Error', error?.response?.data?.message || 'Save failed');
    }
  };

  const startEdit = (item) => {
    setEditingId(item._id);
    setForm({
      serviceName: item.serviceName,
      includedServices: item.includedServices ? item.includedServices.join('\n') : '',
      price: item.price.toString(),
      category: item.category || 'Basic',
      estimatedDuration: item.estimatedDuration?.toString() || '1',
      discountPrice: item.discountPrice?.toString() || '',
      discountValidTill: item.discountValidTill ? item.discountValidTill.split('T')[0] : '',
      isCustomizable: item.isCustomizable || false
    });
  };

  const removeService = async (id) => {
    try {
      await api.delete(`/service-packages/${id}`, authHeaders);
      await fetchServices();
      Alert.alert('Success', 'Service deleted');
    } catch (error) {
      Alert.alert('Error', error?.response?.data?.message || 'Delete failed');
    }
  };

  const resetForm = () => {
    setForm({ 
      serviceName: '', 
      includedServices: '', 
      price: '',
      category: 'Basic',
      estimatedDuration: '1',
      discountPrice: '',
      discountValidTill: '',
      isCustomizable: false
    });
    setEditingId(null);
  };

  const formatDuration = (hours) => {
    if (!hours) return '';
    if (hours < 1) return `${Math.round(hours * 60)} mins`;
    if (hours === 1) return '1 hour';
    return `${hours} hours`;
  };

  const isDiscountActive = (validTill) => {
    if (!validTill) return false;
    return new Date(validTill) > new Date();
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.heading}>{editingId ? 'Edit Service Package' : 'Add New Service Package'}</Text>

      <TextInput
        style={styles.input}
        placeholder="Service/Package Name"
        value={form.serviceName}
        onChangeText={(serviceName) => setForm((prev) => ({ ...prev, serviceName }))}
      />

      <Text style={styles.label}>Category</Text>
      <View style={styles.categoryRow}>
        {CATEGORIES.map((cat) => (
          <Pressable
            key={cat}
            style={[
              styles.categoryPill,
              form.category === cat && { backgroundColor: CATEGORY_COLORS[cat] }
            ]}
            onPress={() => setForm((prev) => ({ ...prev, category: cat }))}
          >
            <Text style={[
              styles.categoryText,
              form.category === cat && styles.categoryTextActive
            ]}>{cat}</Text>
          </Pressable>
        ))}
      </View>

      <TextInput
        style={[styles.input, styles.notesInput]}
        placeholder="Included services (one per line)..."
        value={form.includedServices}
        onChangeText={(includedServices) => setForm((prev) => ({ ...prev, includedServices }))}
        multiline
      />

      <View style={styles.rowInputs}>
        <View style={styles.halfInput}>
          <Text style={styles.label}>Price (LKR)</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. 2500"
            value={form.price}
            onChangeText={(price) => setForm((prev) => ({ ...prev, price }))}
            keyboardType="decimal-pad"
          />
        </View>
        <View style={styles.halfInput}>
          <Text style={styles.label}>Duration (hours)</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. 1.5"
            value={form.estimatedDuration}
            onChangeText={(estimatedDuration) => setForm((prev) => ({ ...prev, estimatedDuration }))}
            keyboardType="decimal-pad"
          />
        </View>
      </View>

      <View style={styles.discountSection}>
        <Text style={styles.sectionLabel}>Discount/Offer (Optional)</Text>
        <View style={styles.rowInputs}>
          <View style={styles.halfInput}>
            <TextInput
              style={styles.input}
              placeholder="Discount Price LKR"
              value={form.discountPrice}
              onChangeText={(discountPrice) => setForm((prev) => ({ ...prev, discountPrice }))}
              keyboardType="decimal-pad"
            />
          </View>
          <View style={styles.halfInput}>
            <TextInput
              style={styles.input}
              placeholder="Valid Till (YYYY-MM-DD)"
              value={form.discountValidTill}
              onChangeText={(discountValidTill) => setForm((prev) => ({ ...prev, discountValidTill }))}
            />
          </View>
        </View>
      </View>

      <View style={styles.switchRow}>
        <Text style={styles.switchLabel}>Allow in Custom Package Builder</Text>
        <Switch
          value={form.isCustomizable}
          onValueChange={(isCustomizable) => setForm((prev) => ({ ...prev, isCustomizable }))}
          trackColor={{ false: theme.colors.border, true: theme.colors.primary }}
          thumbColor="#fff"
        />
      </View>

      <View style={styles.buttonRow}>
        {editingId && (
          <Pressable style={styles.cancelBtn} onPress={resetForm}>
            <Text style={styles.cancelBtnText}>Cancel</Text>
          </Pressable>
        )}
        <Pressable style={styles.primaryBtn} onPress={saveService}>
          <Text style={styles.primaryBtnText}>{editingId ? 'Update' : 'Add Package'}</Text>
        </Pressable>
      </View>

      <Text style={styles.sectionTitle}>My Service Packages ({services.length})</Text>
      <FlatList
        scrollEnabled={false}
        data={services}
        keyExtractor={(item) => item._id}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={styles.cardTopRow}>
              <View style={[styles.categoryBadge, { backgroundColor: CATEGORY_COLORS[item.category] || CATEGORY_COLORS.Basic }]}>
                <Text style={styles.categoryBadgeText}>{item.category || 'Basic'}</Text>
              </View>
              {item.discountPrice && isDiscountActive(item.discountValidTill) && (
                <View style={styles.discountBadge}>
                  <Text style={styles.discountBadgeText}>
                    {Math.round((1 - item.discountPrice / item.price) * 100)}% OFF
                  </Text>
                </View>
              )}
            </View>
            <View style={styles.cardHeader}>
              <Text style={styles.serviceName}>{item.serviceName}</Text>
              <View style={styles.priceContainer}>
                {item.discountPrice && isDiscountActive(item.discountValidTill) ? (
                  <>
                    <Text style={styles.discountedPrice}>LKR {item.discountPrice.toFixed(0)}</Text>
                    <Text style={styles.originalPrice}>LKR {item.price.toFixed(0)}</Text>
                  </>
                ) : (
                  <Text style={styles.price}>LKR {item.price.toFixed(0)}</Text>
                )}
              </View>
            </View>
            
            <View style={styles.metaRow}>
              {item.estimatedDuration && (
                <Text style={styles.metaText}>⏱️ {formatDuration(item.estimatedDuration)}</Text>
              )}
              {item.isCustomizable && (
                <Text style={styles.customizableBadge}>🔧 Customizable</Text>
              )}
            </View>

            {item.includedServices && item.includedServices.length > 0 && (
              <View style={styles.includedServicesContainer}>
                <Text style={styles.includedTitle}>Included Services:</Text>
                {item.includedServices.map((service, index) => (
                  <Text key={index} style={styles.includedItem}>• {service}</Text>
                ))}
              </View>
            )}
            
            <View style={styles.actions}>
              <Pressable style={styles.editBtn} onPress={() => startEdit(item)}>
                <Text style={styles.btnText}>Edit</Text>
              </Pressable>
              <Pressable
                style={styles.deleteBtn}
                onPress={() => {
                  Alert.alert('Confirm', 'Delete this service package?', [
                    { text: 'Cancel', style: 'cancel' },
                    { text: 'Delete', style: 'destructive', onPress: () => removeService(item._id) }
                  ]);
                }}
              >
                <Text style={styles.btnText}>Delete</Text>
              </Pressable>
            </View>
          </View>
        )}
        ListEmptyComponent={
          <View style={styles.emptyBox}>
            <Text style={styles.emptyText}>No service packages added yet.</Text>
          </View>
        }
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: theme.spacing.lg, backgroundColor: theme.colors.bg },
  heading: { fontSize: 22, fontWeight: '700', marginBottom: 12, color: theme.colors.text },
  label: { fontSize: 14, fontWeight: '600', color: theme.colors.muted, marginBottom: 8, marginTop: 4 },
  sectionLabel: { fontSize: 14, fontWeight: '700', color: theme.colors.text, marginBottom: 10 },
  input: {
    backgroundColor: theme.colors.card,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.lg,
    padding: 12,
    marginBottom: 10,
    ...theme.shadow.soft
  },
  notesInput: { minHeight: 80, textAlignVertical: 'top' },
  
  categoryRow: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  categoryPill: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: theme.radius.md,
    backgroundColor: theme.colors.card,
    borderWidth: 1,
    borderColor: theme.colors.border,
    alignItems: 'center'
  },
  categoryText: { fontWeight: '600', color: theme.colors.muted, fontSize: 13 },
  categoryTextActive: { color: '#fff' },

  rowInputs: { flexDirection: 'row', gap: 10 },
  halfInput: { flex: 1 },

  discountSection: {
    backgroundColor: theme.colors.bg2,
    padding: 12,
    borderRadius: theme.radius.lg,
    marginBottom: 12
  },

  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: theme.colors.card,
    padding: 14,
    borderRadius: theme.radius.lg,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: theme.colors.border
  },
  switchLabel: { fontWeight: '600', color: theme.colors.text, fontSize: 14 },

  buttonRow: { flexDirection: 'row', gap: 10, marginBottom: 16 },
  primaryBtn: {
    flex: 1,
    backgroundColor: theme.colors.primary,
    borderRadius: theme.radius.lg,
    padding: 14,
    ...theme.shadow.soft
  },
  primaryBtnText: { color: '#fff', fontWeight: '600', textAlign: 'center' },
  cancelBtn: {
    flex: 1,
    backgroundColor: theme.colors.muted,
    borderRadius: theme.radius.lg,
    padding: 14,
    ...theme.shadow.soft
  },
  cancelBtnText: { color: '#fff', fontWeight: '600', textAlign: 'center' },
  sectionTitle: { fontSize: 18, fontWeight: '700', marginBottom: 10, marginTop: 8, color: theme.colors.text },
  
  card: {
    backgroundColor: theme.colors.card,
    padding: theme.spacing.md,
    borderRadius: theme.radius.lg,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: theme.colors.border,
    ...theme.shadow.soft
  },
  cardTopRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  categoryBadge: {
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: theme.radius.pill
  },
  categoryBadgeText: { color: '#fff', fontWeight: '700', fontSize: 11, textTransform: 'uppercase' },
  discountBadge: {
    backgroundColor: '#EF4444',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: theme.radius.pill
  },
  discountBadgeText: { color: '#fff', fontWeight: '700', fontSize: 11 },
  
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  serviceName: { fontSize: 16, fontWeight: '700', color: theme.colors.text, flex: 1, marginRight: 8 },
  priceContainer: { alignItems: 'flex-end' },
  price: { fontSize: 16, fontWeight: '700', color: theme.colors.primary },
  discountedPrice: { fontSize: 16, fontWeight: '700', color: '#10B981' },
  originalPrice: { fontSize: 12, color: theme.colors.muted, textDecorationLine: 'line-through' },
  
  metaRow: { flexDirection: 'row', gap: 12, marginBottom: 6 },
  metaText: { fontSize: 13, color: theme.colors.muted, fontWeight: '600' },
  customizableBadge: { fontSize: 12, color: theme.colors.primary, fontWeight: '600' },

  includedServicesContainer: { 
    backgroundColor: theme.colors.bg, 
    padding: 10, 
    borderRadius: theme.radius.md, 
    marginBottom: 10 
  },
  includedTitle: { fontSize: 14, fontWeight: '600', color: theme.colors.text, marginBottom: 6 },
  includedItem: { fontSize: 13, color: theme.colors.muted, marginBottom: 3, marginLeft: 8 },
  actions: { flexDirection: 'row', gap: 8 },
  editBtn: {
    flex: 1,
    backgroundColor: theme.colors.primary2,
    padding: 10,
    borderRadius: theme.radius.md,
    ...theme.shadow.soft
  },
  deleteBtn: {
    flex: 1,
    backgroundColor: theme.colors.danger,
    padding: 10,
    borderRadius: theme.radius.md,
    ...theme.shadow.soft
  },
  btnText: { color: '#fff', fontWeight: '600', textAlign: 'center' },
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
