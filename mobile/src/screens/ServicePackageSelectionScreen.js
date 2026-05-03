import React, { useCallback, useState } from 'react';
import { Alert, FlatList, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import api from '../api/client';
import { theme } from '../theme';
import PackageCard from '../components/PackageCard';
import PackageCompareModal from '../components/PackageCompareModal';
import CustomPackageBuilder from '../components/CustomPackageBuilder';

const CATEGORIES = ['All', 'Basic', 'Premium', 'Comprehensive'];
const VEHICLE_TYPES = ['Motorcycle', 'Scooter', 'Sport Bike', 'Cruiser', 'Electric'];

const CATEGORY_COLORS = {
  All: theme.colors.primary,
  Basic: '#3B82F6',
  Premium: '#F59E0B',
  Comprehensive: '#8B5CF6'
};

export default function ServicePackageSelectionScreen({ route, navigation }) {
  const serviceCenterId = route.params?.serviceCenterId || null;
  const serviceCenterName = route.params?.serviceCenterName || null;
  
  const [packages, setPackages] = useState([]);
  const [filteredPackages, setFilteredPackages] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedVehicleType, setSelectedVehicleType] = useState(null);
  const [compareList, setCompareList] = useState([]);
  const [showCompareModal, setShowCompareModal] = useState(false);
  const [showCustomBuilder, setShowCustomBuilder] = useState(false);

  const fetchPackages = async () => {
    try {
      const params = new URLSearchParams();
      if (serviceCenterId) params.append('serviceCenterId', serviceCenterId);
      if (selectedCategory !== 'All') params.append('category', selectedCategory);
      if (selectedVehicleType) params.append('vehicleType', selectedVehicleType);

      const url = `/service-packages${params.toString() ? `?${params.toString()}` : ''}`;
      const { data } = await api.get(url);
      setPackages(data);
      applyFilters(data, searchQuery);
    } catch (error) {
      Alert.alert('Error', 'Failed to load packages');
    }
  };

  const applyFilters = (data, query) => {
    let filtered = [...data];
    
    if (query.trim()) {
      const q = query.toLowerCase();
      filtered = filtered.filter(pkg => {
        const matchesName = pkg.serviceName.toLowerCase().includes(q);
        const matchesCenter = pkg.centerId?.centerName?.toLowerCase().includes(q);
        const matchesServices = pkg.includedServices?.some(s => s.toLowerCase().includes(q));
        return matchesName || matchesCenter || matchesServices;
      });
    }

    setFilteredPackages(filtered);
  };

  useFocusEffect(
    useCallback(() => {
      fetchPackages();
    }, [serviceCenterId, selectedCategory, selectedVehicleType])
  );

  const handleSearch = (query) => {
    setSearchQuery(query);
    applyFilters(packages, query);
  };

  const handleCategoryChange = (category) => {
    setSelectedCategory(category);
  };

  const handleVehicleTypeChange = (type) => {
    setSelectedVehicleType(prev => prev === type ? null : type);
  };

  const toggleCompare = (pkg) => {
    setCompareList(prev => {
      const exists = prev.find(p => p._id === pkg._id);
      if (exists) {
        return prev.filter(p => p._id !== pkg._id);
      }
      if (prev.length >= 3) {
        Alert.alert('Limit Reached', 'You can compare up to 3 packages at a time.');
        return prev;
      }
      return [...prev, pkg];
    });
  };

  const selectPackage = (pkg) => {
    navigation.navigate('Bookings', {
      serviceCenterId: serviceCenterId || pkg.centerId?._id,
      serviceCenterName: serviceCenterName || pkg.centerId?.centerName,
      selectedPackageId: pkg._id,
      selectedPackageName: pkg.serviceName,
      selectedPackagePrice: pkg.discountPrice && new Date(pkg.discountValidTill) > new Date() 
        ? pkg.discountPrice 
        : pkg.price,
      selectedPackageDuration: pkg.estimatedDuration || 1,
      packageCenterId: pkg.centerId?._id
    });
  };

  const handleCustomBuild = (customPackage) => {
    setShowCustomBuilder(false);
    navigation.navigate('Bookings', {
      serviceCenterId: customPackage.serviceCenterId || serviceCenterId,
      serviceCenterName: customPackage.serviceCenterName || serviceCenterName,
      selectedPackageId: 'custom',
      selectedPackageName: `Custom: ${customPackage.includedServices.slice(0, 2).join(', ')}${customPackage.includedServices.length > 2 ? '...' : ''}`,
      selectedPackagePrice: customPackage.price,
      selectedPackageDuration: customPackage.estimatedDuration || 1,
      customServices: customPackage.includedServices
    });
  };

  const hasCustomizablePackages = packages.some(pkg => pkg.isCustomizable);
  const categoryCounts = {
    All: packages.length,
    Basic: packages.filter(p => p.category === 'Basic').length,
    Premium: packages.filter(p => p.category === 'Premium').length,
    Comprehensive: packages.filter(p => p.category === 'Comprehensive').length
  };

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <Text style={styles.heading}>
          {serviceCenterName ? 'Select Service Package' : 'Browse All Services'}
        </Text>
        {serviceCenterName && <Text style={styles.subheading}>{serviceCenterName}</Text>}

        <TextInput
          style={styles.searchInput}
          placeholder="Search packages, services..."
          value={searchQuery}
          onChangeText={handleSearch}
          placeholderTextColor={theme.colors.muted}
        />

        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false} 
          style={styles.categoryScroll}
          contentContainerStyle={styles.categoryContent}
        >
          {CATEGORIES.map((cat) => (
            <Pressable
              key={cat}
              style={[
                styles.categoryTab,
                selectedCategory === cat && { backgroundColor: CATEGORY_COLORS[cat] }
              ]}
              onPress={() => handleCategoryChange(cat)}
            >
              <Text style={[
                styles.categoryTabText,
                selectedCategory === cat && styles.categoryTabTextActive
              ]}>
                {cat} {categoryCounts[cat] > 0 ? `(${categoryCounts[cat]})` : ''}
              </Text>
            </Pressable>
          ))}
        </ScrollView>

        <View style={styles.vehicleFilterSection}>
          <Text style={styles.filterLabel}>Filter by vehicle type:</Text>
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.vehicleTypeContent}
          >
            {VEHICLE_TYPES.map((type) => (
              <Pressable
                key={type}
                style={[
                  styles.vehicleTypeChip,
                  selectedVehicleType === type && styles.vehicleTypeChipActive
                ]}
                onPress={() => handleVehicleTypeChange(type)}
              >
                <Text style={[
                  styles.vehicleTypeText,
                  selectedVehicleType === type && styles.vehicleTypeTextActive
                ]}>
                  {type}
                </Text>
              </Pressable>
            ))}
          </ScrollView>
        </View>

        {hasCustomizablePackages && (
          <Pressable 
            style={styles.customBuilderBtn}
            onPress={() => setShowCustomBuilder(true)}
          >
            <Text style={styles.customBuilderIcon}>🔧</Text>
            <View style={styles.customBuilderTextContainer}>
              <Text style={styles.customBuilderTitle}>Build Custom Package</Text>
              <Text style={styles.customBuilderSubtitle}>Select only the services you need</Text>
            </View>
            <Text style={styles.customBuilderArrow}>→</Text>
          </Pressable>
        )}

        <FlatList
          scrollEnabled={false}
          data={filteredPackages}
          keyExtractor={(item) => item._id}
          contentContainerStyle={styles.packageList}
          renderItem={({ item }) => (
            <PackageCard
              item={item}
              onPress={() => selectPackage(item)}
              onCompareToggle={toggleCompare}
              isComparing={compareList.some(p => p._id === item._id)}
              showCenterName={!serviceCenterId}
            />
          )}
          ListEmptyComponent={
            <View style={styles.emptyBox}>
              <Text style={styles.emptyIcon}>📦</Text>
              <Text style={styles.emptyTitle}>No Packages Found</Text>
              <Text style={styles.emptyText}>
                {searchQuery 
                  ? 'Try a different search term'
                  : selectedVehicleType 
                    ? `No packages available for ${selectedVehicleType}`
                    : 'No service packages available'}
              </Text>
            </View>
          }
        />
      </ScrollView>

      {compareList.length > 0 && (
        <Pressable 
          style={styles.compareFloatingBtn}
          onPress={() => setShowCompareModal(true)}
        >
          <Text style={styles.compareFloatingText}>
            Compare ({compareList.length})
          </Text>
        </Pressable>
      )}

      <PackageCompareModal
        visible={showCompareModal}
        packages={compareList}
        onClose={() => setShowCompareModal(false)}
        onBook={(pkg) => {
          setShowCompareModal(false);
          selectPackage(pkg);
        }}
        onRemove={(pkg) => toggleCompare(pkg)}
      />

      <CustomPackageBuilder
        visible={showCustomBuilder}
        packages={packages}
        onClose={() => setShowCustomBuilder(false)}
        onBuild={handleCustomBuild}
        serviceCenterId={serviceCenterId}
        serviceCenterName={serviceCenterName}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: theme.colors.bg 
  },
  heading: { 
    fontSize: 24, 
    fontWeight: '700', 
    marginBottom: 6, 
    color: theme.colors.text,
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.lg
  },
  subheading: { 
    fontSize: 15, 
    color: theme.colors.muted, 
    marginBottom: 16, 
    fontWeight: '600',
    paddingHorizontal: theme.spacing.lg
  },
  searchInput: {
    backgroundColor: theme.colors.card,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.lg,
    padding: 14,
    marginHorizontal: theme.spacing.lg,
    marginBottom: 16,
    fontSize: 15,
    color: theme.colors.text,
    ...theme.shadow.soft
  },
  categoryScroll: {
    marginBottom: 12
  },
  categoryContent: {
    paddingHorizontal: theme.spacing.lg,
    gap: 8
  },
  categoryTab: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: theme.radius.pill,
    backgroundColor: theme.colors.card,
    borderWidth: 1,
    borderColor: theme.colors.border,
    marginRight: 8
  },
  categoryTabText: {
    fontWeight: '600',
    color: theme.colors.muted,
    fontSize: 14
  },
  categoryTabTextActive: {
    color: '#fff'
  },
  vehicleFilterSection: {
    paddingHorizontal: theme.spacing.lg,
    marginBottom: 16
  },
  filterLabel: {
    fontSize: 13,
    color: theme.colors.muted,
    marginBottom: 8,
    fontWeight: '600'
  },
  vehicleTypeContent: {
    gap: 8
  },
  vehicleTypeChip: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: theme.radius.pill,
    backgroundColor: theme.colors.card,
    borderWidth: 1,
    borderColor: theme.colors.border,
    marginRight: 8
  },
  vehicleTypeChipActive: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary
  },
  vehicleTypeText: {
    fontSize: 13,
    fontWeight: '600',
    color: theme.colors.muted
  },
  vehicleTypeTextActive: {
    color: '#fff'
  },
  customBuilderBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.card,
    marginHorizontal: theme.spacing.lg,
    marginBottom: 16,
    padding: 16,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: theme.colors.primary,
    borderStyle: 'dashed',
    ...theme.shadow.soft
  },
  customBuilderIcon: {
    fontSize: 28,
    marginRight: 12
  },
  customBuilderTextContainer: {
    flex: 1
  },
  customBuilderTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.colors.text
  },
  customBuilderSubtitle: {
    fontSize: 13,
    color: theme.colors.muted,
    marginTop: 2
  },
  customBuilderArrow: {
    fontSize: 20,
    color: theme.colors.primary,
    fontWeight: '700'
  },
  packageList: {
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: 100
  },
  emptyBox: {
    padding: theme.spacing.xl,
    backgroundColor: theme.colors.card,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    alignItems: 'center',
    marginHorizontal: theme.spacing.lg,
    marginTop: 20
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 12
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.colors.text,
    marginBottom: 6
  },
  emptyText: { 
    color: theme.colors.muted, 
    fontWeight: '600',
    textAlign: 'center'
  },
  compareFloatingBtn: {
    position: 'absolute',
    bottom: 24,
    left: theme.spacing.lg,
    right: theme.spacing.lg,
    backgroundColor: theme.colors.primary,
    paddingVertical: 16,
    borderRadius: theme.radius.lg,
    alignItems: 'center',
    ...theme.shadow.card
  },
  compareFloatingText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 16
  }
});
