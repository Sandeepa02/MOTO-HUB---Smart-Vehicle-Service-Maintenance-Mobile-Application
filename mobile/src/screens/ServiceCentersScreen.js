import React, { useCallback, useState } from 'react';
import { ActivityIndicator, Alert, Image, Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import CrossPlatformMap from '../components/CrossPlatformMap';
import InputField from '../components/InputField';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';
import { theme } from '../theme';
import { API_BASE_URL } from '../config';

const baseUrl = API_BASE_URL.replace(/\/api\/?$/, '');

export default function ServiceCentersScreen({ navigation }) {
  const { authHeaders, refreshSession, user } = useAuth();
  const [image, setImage] = useState(null);
  const [center, setCenter] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [showMapPicker, setShowMapPicker] = useState(false);
  const [gettingLocation, setGettingLocation] = useState(false);
  const [form, setForm] = useState({
    centerId: '',
    centerName: '',
    address: '',
    email: user?.email || '',
    telephone: '',
    latitude: null,
    longitude: null
  });

  const fetchCenter = async () => {
    const { data } = await api.get('/service-centers/me', authHeaders);
    setCenter(data);
    const coords = data.coordinates?.coordinates;
    setForm({
      centerId: data.centerId || '',
      centerName: data.centerName || '',
      address: data.location || '',
      email: user?.email || '',
      telephone: data.contactNumber || '',
      latitude: coords ? coords[1] : null,
      longitude: coords ? coords[0] : null
    });
  };

  useFocusEffect(
    useCallback(() => {
      fetchCenter().catch((error) => Alert.alert('Error', error?.response?.data?.message || 'Failed loading service center'));
    }, [])
  );

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8
    });

    if (!result.canceled) {
      setImage(result.assets[0]);
    }
  };

  const getCurrentLocation = async () => {
    try {
      setGettingLocation(true);
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Location permission is required to set your center location.');
        return;
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High
      });

      setForm((prev) => ({
        ...prev,
        latitude: location.coords.latitude,
        longitude: location.coords.longitude
      }));

      Alert.alert('Location Set', 'Your current location has been saved. You can also adjust it on the map.');
    } catch (error) {
      Alert.alert('Error', 'Failed to get current location. Please try again.');
    } finally {
      setGettingLocation(false);
    }
  };

  const handleMapPress = (event) => {
    const { latitude, longitude } = event.nativeEvent.coordinate;
    setForm((prev) => ({
      ...prev,
      latitude,
      longitude
    }));
  };

  const saveCenter = async () => {
    if (submitting) return;
    
    try {
      setSubmitting(true);
      const data = new FormData();
      data.append('centerName', form.centerName);
      data.append('location', form.address);
      data.append('contactNumber', form.telephone);

      if (form.latitude && form.longitude) {
        data.append('latitude', form.latitude.toString());
        data.append('longitude', form.longitude.toString());
      }

      if (image) {
        data.append('image', {
          uri: image.uri,
          name: image.fileName || 'center.jpg',
          type: image.mimeType || 'image/jpeg'
        });
      }

      const headers = {
        ...(authHeaders?.headers || {}),
        'Content-Type': 'multipart/form-data'
      };

      await api.put('/service-centers/me', data, { headers });
      await refreshSession();
      Alert.alert('Saved', 'Service center profile updated', [{ text: 'OK', onPress: () => navigation?.goBack?.() }]);
    } catch (error) {
      console.log('Save center error:', error);
      Alert.alert('Error', error?.response?.data?.message || 'Save failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const imageUrl = image?.uri ? image.uri : center?.image ? `${baseUrl}${center.image}` : '';

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.heading}>Service Center Details</Text>

      <View style={styles.avatarWrap}>
        {imageUrl ? (
          <Image source={{ uri: imageUrl }} style={styles.avatar} />
        ) : (
          <View style={[styles.avatar, styles.avatarPlaceholder]}>
            <Text style={styles.avatarText}>{(form.centerName || user?.name || 'S').slice(0, 1).toUpperCase()}</Text>
          </View>
        )}
      </View>

      <InputField label="Center ID" value={form.centerId} editable={false} />
      <InputField
        label="Name"
        value={form.centerName}
        onChangeText={(centerName) => setForm((prev) => ({ ...prev, centerName }))}
        autoCapitalize="words"
      />
      <InputField
        label="Address"
        value={form.address}
        onChangeText={(address) => setForm((prev) => ({ ...prev, address }))}
        autoCapitalize="sentences"
      />
      <InputField label="Email" value={form.email} editable={false} keyboardType="email-address" />
      <InputField
        label="Telephone Number"
        value={form.telephone}
        onChangeText={(telephone) => setForm((prev) => ({ ...prev, telephone }))}
        keyboardType="phone-pad"
      />

      <View style={styles.locationSection}>
        <Text style={styles.locationLabel}>Center Location (for Maps)</Text>
        {form.latitude && form.longitude ? (
          <View style={styles.coordsDisplay}>
            <Ionicons name="checkmark-circle" size={18} color={theme.colors.primary} />
            <Text style={styles.coordsText}>
              Location set: {form.latitude.toFixed(5)}, {form.longitude.toFixed(5)}
            </Text>
          </View>
        ) : (
          <View style={styles.coordsDisplay}>
            <Ionicons name="alert-circle-outline" size={18} color={theme.colors.muted} />
            <Text style={styles.coordsTextMuted}>No location set yet</Text>
          </View>
        )}
        <View style={styles.locationBtns}>
          <Pressable
            style={[styles.locationBtn, gettingLocation && styles.locationBtnDisabled]}
            onPress={getCurrentLocation}
            disabled={gettingLocation}
          >
            {gettingLocation ? (
              <ActivityIndicator size="small" color={theme.colors.primary} />
            ) : (
              <Ionicons name="locate" size={18} color={theme.colors.primary} />
            )}
            <Text style={styles.locationBtnText}>
              {gettingLocation ? 'Getting...' : 'Use Current'}
            </Text>
          </Pressable>
          <Pressable style={styles.locationBtn} onPress={() => setShowMapPicker(true)}>
            <Ionicons name="map" size={18} color={theme.colors.primary} />
            <Text style={styles.locationBtnText}>Pick on Map</Text>
          </Pressable>
        </View>
      </View>

      <Pressable style={styles.secondaryBtn} onPress={pickImage}>
        <Text style={styles.secondaryBtnText}>Select Profile Picture</Text>
      </Pressable>
      <Pressable 
        style={({ pressed }) => [styles.primaryBtn, pressed && styles.primaryBtnPressed, submitting && styles.primaryBtnDisabled]} 
        onPress={saveCenter} 
        disabled={submitting}
      >
        <Text style={styles.primaryBtnText}>{submitting ? 'Saving...' : 'Save Profile'}</Text>
      </Pressable>

      <Modal visible={showMapPicker} animationType="slide" onRequestClose={() => setShowMapPicker(false)}>
        <View style={styles.mapModal}>
          <View style={styles.mapHeader}>
            <Text style={styles.mapTitle}>Set Your Location</Text>
            <Pressable onPress={() => setShowMapPicker(false)}>
              <Ionicons name="close" size={28} color={theme.colors.text} />
            </Pressable>
          </View>
          <Text style={styles.mapInstructions}>Tap on the map to set your service center location</Text>
          <CrossPlatformMap
            style={styles.mapPicker}
            initialRegion={{
              latitude: form.latitude || 20.5937,
              longitude: form.longitude || 78.9629,
              latitudeDelta: form.latitude ? 0.01 : 20,
              longitudeDelta: form.longitude ? 0.01 : 20
            }}
            onPress={handleMapPress}
            showsUserLocation
            showsMyLocationButton
            markers={
              form.latitude && form.longitude
                ? [
                    {
                      id: 'center-location',
                      coordinate: { latitude: form.latitude, longitude: form.longitude },
                      title: 'Your Service Center',
                      draggable: true,
                      onDragEnd: handleMapPress
                    }
                  ]
                : []
            }
          />
          {form.latitude && form.longitude && (
            <View style={styles.mapCoords}>
              <Ionicons name="location" size={16} color={theme.colors.primary} />
              <Text style={styles.mapCoordsText}>
                {form.latitude.toFixed(6)}, {form.longitude.toFixed(6)}
              </Text>
            </View>
          )}
          <View style={styles.mapActions}>
            <Pressable style={styles.mapCancelBtn} onPress={() => setShowMapPicker(false)}>
              <Text style={styles.mapCancelBtnText}>Cancel</Text>
            </Pressable>
            <Pressable
              style={[styles.mapConfirmBtn, (!form.latitude || !form.longitude) && styles.mapConfirmBtnDisabled]}
              onPress={() => setShowMapPicker(false)}
              disabled={!form.latitude || !form.longitude}
            >
              <Text style={styles.mapConfirmBtnText}>Confirm Location</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: theme.spacing.lg, backgroundColor: theme.colors.bg, flexGrow: 1 },
  heading: { fontSize: 22, fontWeight: '900', marginBottom: 12, color: theme.colors.text },
  avatarWrap: { alignItems: 'center', marginBottom: 14 },
  avatar: { width: 96, height: 96, borderRadius: 48, backgroundColor: theme.colors.card, borderWidth: 1, borderColor: theme.colors.border },
  avatarPlaceholder: { justifyContent: 'center', alignItems: 'center' },
  avatarText: { fontSize: 34, fontWeight: '900', color: theme.colors.text },
  locationSection: {
    backgroundColor: theme.colors.card,
    borderRadius: theme.radius.lg,
    padding: theme.spacing.md,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: theme.colors.border,
    ...theme.shadow.soft
  },
  locationLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: theme.colors.text,
    marginBottom: 10
  },
  coordsDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
    backgroundColor: theme.colors.bg,
    padding: 10,
    borderRadius: theme.radius.md
  },
  coordsText: {
    fontSize: 13,
    color: theme.colors.text,
    fontWeight: '600'
  },
  coordsTextMuted: {
    fontSize: 13,
    color: theme.colors.muted,
    fontWeight: '600'
  },
  locationBtns: {
    flexDirection: 'row',
    gap: 10
  },
  locationBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    backgroundColor: theme.colors.bg2,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.colors.primary
  },
  locationBtnDisabled: {
    opacity: 0.6
  },
  locationBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: theme.colors.primary
  },
  mapModal: {
    flex: 1,
    backgroundColor: theme.colors.bg
  },
  mapHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: theme.spacing.lg,
    paddingTop: 50,
    backgroundColor: theme.colors.card,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border
  },
  mapTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: theme.colors.text
  },
  mapInstructions: {
    textAlign: 'center',
    padding: theme.spacing.sm,
    fontSize: 13,
    color: theme.colors.muted,
    fontWeight: '600',
    backgroundColor: theme.colors.bg2
  },
  mapPicker: {
    flex: 1
  },
  mapCoords: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    backgroundColor: theme.colors.card,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border
  },
  mapCoordsText: {
    fontSize: 13,
    fontWeight: '600',
    color: theme.colors.text
  },
  mapActions: {
    flexDirection: 'row',
    gap: 12,
    padding: theme.spacing.lg,
    paddingBottom: 30,
    backgroundColor: theme.colors.card
  },
  mapCancelBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.bg
  },
  mapCancelBtnText: {
    textAlign: 'center',
    fontWeight: '700',
    color: theme.colors.text
  },
  mapConfirmBtn: {
    flex: 2,
    paddingVertical: 14,
    borderRadius: theme.radius.lg,
    backgroundColor: theme.colors.primary
  },
  mapConfirmBtnDisabled: {
    backgroundColor: theme.colors.muted
  },
  mapConfirmBtnText: {
    textAlign: 'center',
    fontWeight: '700',
    color: '#fff'
  },
  secondaryBtn: {
    backgroundColor: theme.colors.card,
    borderRadius: theme.radius.lg,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: theme.colors.border,
    ...theme.shadow.soft
  },
  secondaryBtnText: { textAlign: 'center', fontWeight: '900', color: theme.colors.text },
  primaryBtn: { backgroundColor: theme.colors.primary, borderRadius: theme.radius.lg, padding: 14, ...theme.shadow.soft },
  primaryBtnPressed: { opacity: 0.7, transform: [{ scale: 0.98 }] },
  primaryBtnDisabled: { opacity: 0.6 },
  primaryBtnText: { color: '#fff', fontWeight: '900', textAlign: 'center' }
});
