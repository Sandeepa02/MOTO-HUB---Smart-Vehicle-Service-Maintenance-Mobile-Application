import React, { useCallback, useMemo, useState } from 'react';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';
import DistrictSelect from '../components/DistrictSelect';
import { SRI_LANKA_DISTRICTS } from '../constants/sriLankaDistricts';
import { theme } from '../theme';

export default function SearchServiceCentersScreen({ navigation }) {
  const { user } = useAuth();
  const [centers, setCenters] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [districtFilter, setDistrictFilter] = useState(() => user?.district || '');

  const districtOptions = useMemo(
    () => [{ label: 'All districts', value: '' }, ...SRI_LANKA_DISTRICTS.map((d) => ({ label: d, value: d }))],
    []
  );

  const fetchCenters = async (district) => {
    try {
      const { data } = await api.get('/service-centers', {
        params: district ? { district } : {}
      });
      const sorted = (data || []).sort((a, b) => a.centerName.localeCompare(b.centerName));
      setCenters(sorted);
    } catch (error) {
      Alert.alert('Error', error?.response?.data?.message || 'Failed loading service centers');
    }
  };

  useFocusEffect(
    useCallback(() => {
      const initial = user?.district || '';
      setDistrictFilter(initial);
      fetchCenters(initial);
    }, [user?.district])
  );

  const onDistrictChange = (value) => {
    setDistrictFilter(value);
    fetchCenters(value);
  };

  const filteredCenters = centers.filter((c) => {
    if (!searchQuery) return true;
    const lowerQ = searchQuery.toLowerCase();
    return (
      (c.location && c.location.toLowerCase().includes(lowerQ)) ||
      (c.centerName && c.centerName.toLowerCase().includes(lowerQ)) ||
      (c.district && c.district.toLowerCase().includes(lowerQ))
    );
  });

  return (
    <View style={styles.container}>
      <Text style={styles.heading}>Search within District</Text>

      <DistrictSelect
        label="District"
        value={districtFilter}
        onChange={onDistrictChange}
        placeholder="All districts"
        options={districtOptions}
      />

      <TextInput
        style={styles.searchInput}
        placeholder="Filter by center name or address..."
        value={searchQuery}
        onChangeText={setSearchQuery}
      />

      <Text style={styles.subText}>Showing {filteredCenters.length} alphabetically sorted results</Text>

      <FlatList
        data={filteredCenters}
        keyExtractor={(item) => item._id}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => (
          <View style={styles.centerCard}>
            <Text style={styles.centerName}>{item.centerName}</Text>
            {item.district ? <Text style={styles.centerMeta}>District: {item.district}</Text> : null}
            <Text style={styles.centerMeta}>📍: {item.location}</Text>
            <Text style={styles.centerMeta}>📞: {item.contactNumber}</Text>
            <Pressable
              style={styles.viewMoreBtn}
              onPress={() => navigation.navigate('ServiceCenterDetails', { serviceCenterId: item._id })}
            >
              <Text style={styles.viewMoreText}>View Services & Book</Text>
            </Pressable>
          </View>
        )}
        ListEmptyComponent={
          <View style={styles.emptyBox}>
            <Text style={styles.emptyText}>No service centers found.</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.bg, padding: theme.spacing.lg },
  heading: { fontSize: 20, fontWeight: '700', marginBottom: 12, color: theme.colors.text, marginTop: 4 },
  subText: { fontSize: 13, color: theme.colors.muted, fontWeight: '600', marginBottom: 10 },
  searchInput: {
    backgroundColor: theme.colors.card,
    borderWidth: 1,
    borderColor: theme.colors.primary,
    borderRadius: theme.radius.lg,
    padding: 12,
    marginBottom: 8,
    ...theme.shadow.soft
  },
  listContent: { paddingBottom: 24 },
  centerCard: {
    backgroundColor: theme.colors.card,
    borderRadius: theme.radius.lg,
    padding: theme.spacing.md,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: theme.colors.border,
    ...theme.shadow.soft
  },
  centerName: { fontSize: 16, fontWeight: '800', color: theme.colors.text, marginBottom: 6 },
  centerMeta: { color: theme.colors.text, fontWeight: '600', marginBottom: 2 },
  viewMoreBtn: {
    marginTop: 10,
    backgroundColor: theme.colors.primary,
    paddingVertical: 10,
    borderRadius: theme.radius.md
  },
  viewMoreText: { color: '#fff', fontWeight: '700', textAlign: 'center' },
  emptyBox: {
    padding: theme.spacing.md,
    alignItems: 'center',
    marginTop: 20
  },
  emptyText: { color: theme.colors.muted, fontWeight: '800' }
});
