import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  FlatList,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View
} from 'react-native';
import * as Location from 'expo-location';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import CrossPlatformMap from '../components/CrossPlatformMap';
import api from '../api/client';
import { theme } from '../theme';

const { width } = Dimensions.get('window');
const ASPECT_RATIO = width / 300;
const LATITUDE_DELTA = 0.15;
const LONGITUDE_DELTA = LATITUDE_DELTA * ASPECT_RATIO;

const DISTANCE_OPTIONS = [
  { label: '5 km', value: 5000 },
  { label: '10 km', value: 10000 },
  { label: '15 km', value: 15000 },
  { label: '25 km', value: 25000 },
  { label: '50 km', value: 50000 }
];

export default function NearbyServiceCentersScreen({ navigation }) {
  const [userLocation, setUserLocation] = useState(null);
  const [centers, setCenters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedRadius, setSelectedRadius] = useState(15000);
  const [viewMode, setViewMode] = useState('map');
  const [selectedCenter, setSelectedCenter] = useState(null);
  const mapRef = React.useRef(null);

  const getUserLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Permission Required',
          'Location access is needed to find nearby service centers. Please enable it in settings.',
          [{ text: 'OK' }]
        );
        setLoading(false);
        return null;
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced
      });

      return {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude
      };
    } catch (error) {
      Alert.alert('Location Error', 'Unable to get your location. Please try again.');
      setLoading(false);
      return null;
    }
  };

  const fetchNearbyCenters = async (location, radius) => {
    if (!location) return;

    try {
      setLoading(true);
      const { data } = await api.get('/service-centers/nearby', {
        params: {
          latitude: location.latitude,
          longitude: location.longitude,
          maxDistance: radius
        }
      });
      setCenters(data || []);
    } catch (error) {
      if (error?.response?.status === 400) {
        setCenters([]);
      } else {
        Alert.alert('Error', error?.response?.data?.message || 'Failed to fetch nearby centers');
      }
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      const initLocation = async () => {
        const location = await getUserLocation();
        if (location) {
          setUserLocation(location);
          fetchNearbyCenters(location, selectedRadius);
        }
      };
      initLocation();
    }, [])
  );

  useEffect(() => {
    if (userLocation) {
      fetchNearbyCenters(userLocation, selectedRadius);
    }
  }, [selectedRadius]);

  const handleMarkerPress = (center) => {
    setSelectedCenter(center);
  };

  const handleCenterSelect = (center) => {
    setSelectedCenter(center);
    if (mapRef.current && center.coordinates?.coordinates) {
      mapRef.current.animateToRegion({
        latitude: center.coordinates.coordinates[1],
        longitude: center.coordinates.coordinates[0],
        latitudeDelta: 0.02,
        longitudeDelta: 0.02 * ASPECT_RATIO
      });
    }
    setViewMode('map');
  };

  const navigateToDetails = (center) => {
    navigation.navigate('ServiceCenterDetails', { serviceCenterId: center._id });
  };

  const renderDistanceSelector = () => (
    <View style={styles.distanceContainer}>
      <Text style={styles.distanceLabel}>Search Radius:</Text>
      <View style={styles.distanceButtons}>
        {DISTANCE_OPTIONS.map((option) => (
          <Pressable
            key={option.value}
            style={[
              styles.distanceBtn,
              selectedRadius === option.value && styles.distanceBtnActive
            ]}
            onPress={() => setSelectedRadius(option.value)}
          >
            <Text
              style={[
                styles.distanceBtnText,
                selectedRadius === option.value && styles.distanceBtnTextActive
              ]}
            >
              {option.label}
            </Text>
          </Pressable>
        ))}
      </View>
    </View>
  );

  const renderCenterCard = ({ item }) => (
    <Pressable
      style={[styles.centerCard, selectedCenter?._id === item._id && styles.centerCardSelected]}
      onPress={() => handleCenterSelect(item)}
    >
      <View style={styles.centerCardHeader}>
        <Text style={styles.centerName} numberOfLines={1}>
          {item.centerName}
        </Text>
        {item.distanceKm !== undefined && (
          <View style={styles.distanceBadge}>
            <Ionicons name="navigate" size={12} color={theme.colors.primary} />
            <Text style={styles.distanceText}>{item.distanceKm} km</Text>
          </View>
        )}
      </View>
      <Text style={styles.centerLocation} numberOfLines={1}>
        <Ionicons name="location-outline" size={14} color={theme.colors.muted} /> {item.location}
      </Text>
      <Text style={styles.centerPhone}>
        <Ionicons name="call-outline" size={14} color={theme.colors.muted} /> {item.contactNumber}
      </Text>
      <Pressable style={styles.viewDetailsBtn} onPress={() => navigateToDetails(item)}>
        <Text style={styles.viewDetailsBtnText}>View & Book</Text>
        <Ionicons name="arrow-forward" size={16} color="#fff" />
      </Pressable>
    </Pressable>
  );

  if (loading && !userLocation) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={styles.loadingText}>Getting your location...</Text>
      </View>
    );
  }

  if (!userLocation) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="location-outline" size={64} color={theme.colors.muted} />
        <Text style={styles.errorTitle}>Location Required</Text>
        <Text style={styles.errorText}>
          We need your location to find nearby service centers.
        </Text>
        <Pressable
          style={styles.retryBtn}
          onPress={async () => {
            const location = await getUserLocation();
            if (location) {
              setUserLocation(location);
              fetchNearbyCenters(location, selectedRadius);
            }
          }}
        >
          <Text style={styles.retryBtnText}>Enable Location</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.heading}>Nearby Service Centers</Text>
        <View style={styles.viewToggle}>
          <Pressable
            style={[styles.toggleBtn, viewMode === 'map' && styles.toggleBtnActive]}
            onPress={() => setViewMode('map')}
          >
            <Ionicons
              name="map"
              size={18}
              color={viewMode === 'map' ? '#fff' : theme.colors.text}
            />
          </Pressable>
          <Pressable
            style={[styles.toggleBtn, viewMode === 'list' && styles.toggleBtnActive]}
            onPress={() => setViewMode('list')}
          >
            <Ionicons
              name="list"
              size={18}
              color={viewMode === 'list' ? '#fff' : theme.colors.text}
            />
          </Pressable>
        </View>
      </View>

      {renderDistanceSelector()}

      {loading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="small" color={theme.colors.primary} />
        </View>
      )}

      {viewMode === 'map' ? (
        <View style={styles.mapContainer}>
          <CrossPlatformMap
            ref={mapRef}
            style={styles.map}
            initialRegion={{
              latitude: userLocation.latitude,
              longitude: userLocation.longitude,
              latitudeDelta: LATITUDE_DELTA,
              longitudeDelta: LONGITUDE_DELTA
            }}
            showsUserLocation
            showsMyLocationButton
            circles={[
              {
                center: userLocation,
                radius: selectedRadius,
                strokeColor: theme.colors.primary,
                strokeWidth: 2,
                fillColor: 'rgba(30, 99, 217, 0.1)'
              }
            ]}
            markers={centers
              .filter((center) => center.coordinates?.coordinates)
              .map((center) => ({
                id: center._id,
                coordinate: {
                  latitude: center.coordinates.coordinates[1],
                  longitude: center.coordinates.coordinates[0]
                },
                title: center.centerName,
                description: `${center.distanceKm || '?'} km away`,
                data: center
              }))}
            selectedMarkerId={selectedCenter?._id}
            onMarkerPress={(marker) => handleMarkerPress(marker.data)}
          />

          {selectedCenter && (
            <View style={styles.selectedCenterCard}>
              <View style={styles.selectedCardHeader}>
                <Text style={styles.selectedCenterName}>{selectedCenter.centerName}</Text>
                <Pressable onPress={() => setSelectedCenter(null)}>
                  <Ionicons name="close-circle" size={24} color={theme.colors.muted} />
                </Pressable>
              </View>
              <Text style={styles.selectedCenterInfo}>
                <Ionicons name="location" size={14} color={theme.colors.primary} /> {selectedCenter.location}
              </Text>
              {selectedCenter.distanceKm !== undefined && (
                <Text style={styles.selectedCenterDistance}>
                  <Ionicons name="navigate" size={14} color={theme.colors.primary} /> {selectedCenter.distanceKm} km away
                </Text>
              )}
              <Pressable
                style={styles.selectedBookBtn}
                onPress={() => navigateToDetails(selectedCenter)}
              >
                <Text style={styles.selectedBookBtnText}>View Services & Book</Text>
              </Pressable>
            </View>
          )}

          <View style={styles.resultsCount}>
            <Text style={styles.resultsCountText}>
              {centers.length} center{centers.length !== 1 ? 's' : ''} found within {selectedRadius / 1000} km
            </Text>
          </View>
        </View>
      ) : (
        <FlatList
          data={centers}
          keyExtractor={(item) => item._id}
          renderItem={renderCenterCard}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="business-outline" size={48} color={theme.colors.muted} />
              <Text style={styles.emptyTitle}>No Centers Found</Text>
              <Text style={styles.emptyText}>
                No service centers found within {selectedRadius / 1000} km. Try increasing the search radius.
              </Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.bg
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.md,
    paddingBottom: theme.spacing.sm
  },
  heading: {
    fontSize: 20,
    fontWeight: '700',
    color: theme.colors.text
  },
  viewToggle: {
    flexDirection: 'row',
    backgroundColor: theme.colors.card,
    borderRadius: theme.radius.md,
    padding: 4,
    ...theme.shadow.soft
  },
  toggleBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: theme.radius.sm
  },
  toggleBtnActive: {
    backgroundColor: theme.colors.primary
  },
  distanceContainer: {
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: theme.spacing.sm
  },
  distanceLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: theme.colors.muted,
    marginBottom: 8
  },
  distanceButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8
  },
  distanceBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: theme.radius.pill,
    backgroundColor: theme.colors.card,
    borderWidth: 1,
    borderColor: theme.colors.border
  },
  distanceBtnActive: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary
  },
  distanceBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: theme.colors.text
  },
  distanceBtnTextActive: {
    color: '#fff'
  },
  mapContainer: {
    flex: 1,
    position: 'relative'
  },
  map: {
    flex: 1
  },
  resultsCount: {
    position: 'absolute',
    top: 10,
    alignSelf: 'center',
    backgroundColor: theme.colors.card,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: theme.radius.pill,
    ...theme.shadow.soft
  },
  resultsCountText: {
    fontSize: 12,
    fontWeight: '700',
    color: theme.colors.text
  },
  selectedCenterCard: {
    position: 'absolute',
    bottom: 16,
    left: 16,
    right: 16,
    backgroundColor: theme.colors.card,
    borderRadius: theme.radius.lg,
    padding: theme.spacing.md,
    ...theme.shadow.card
  },
  selectedCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8
  },
  selectedCenterName: {
    fontSize: 16,
    fontWeight: '800',
    color: theme.colors.text,
    flex: 1
  },
  selectedCenterInfo: {
    fontSize: 13,
    color: theme.colors.text,
    marginBottom: 4
  },
  selectedCenterDistance: {
    fontSize: 13,
    color: theme.colors.primary,
    fontWeight: '600',
    marginBottom: 12
  },
  selectedBookBtn: {
    backgroundColor: theme.colors.primary,
    paddingVertical: 12,
    borderRadius: theme.radius.md,
    alignItems: 'center'
  },
  selectedBookBtnText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 14
  },
  listContent: {
    padding: theme.spacing.lg,
    paddingTop: theme.spacing.sm
  },
  centerCard: {
    backgroundColor: theme.colors.card,
    borderRadius: theme.radius.lg,
    padding: theme.spacing.md,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: theme.colors.border,
    ...theme.shadow.soft
  },
  centerCardSelected: {
    borderColor: theme.colors.primary,
    borderWidth: 2
  },
  centerCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6
  },
  centerName: {
    fontSize: 16,
    fontWeight: '800',
    color: theme.colors.text,
    flex: 1,
    marginRight: 8
  },
  distanceBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.bg2,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: theme.radius.pill,
    gap: 4
  },
  distanceText: {
    fontSize: 12,
    fontWeight: '700',
    color: theme.colors.primary
  },
  centerLocation: {
    fontSize: 13,
    color: theme.colors.muted,
    marginBottom: 4
  },
  centerPhone: {
    fontSize: 13,
    color: theme.colors.muted,
    marginBottom: 12
  },
  viewDetailsBtn: {
    backgroundColor: theme.colors.primary,
    paddingVertical: 10,
    borderRadius: theme.radius.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6
  },
  viewDetailsBtnText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 14
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.bg
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: theme.colors.muted,
    fontWeight: '600'
  },
  loadingOverlay: {
    position: 'absolute',
    top: 100,
    alignSelf: 'center',
    zIndex: 10
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing.xl,
    backgroundColor: theme.colors.bg
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.colors.text,
    marginTop: 16,
    marginBottom: 8
  },
  errorText: {
    fontSize: 14,
    color: theme.colors.muted,
    textAlign: 'center',
    marginBottom: 20
  },
  retryBtn: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: theme.radius.md
  },
  retryBtnText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 14
  },
  emptyContainer: {
    alignItems: 'center',
    padding: theme.spacing.xl,
    marginTop: 40
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.colors.text,
    marginTop: 16,
    marginBottom: 8
  },
  emptyText: {
    fontSize: 14,
    color: theme.colors.muted,
    textAlign: 'center'
  }
});
