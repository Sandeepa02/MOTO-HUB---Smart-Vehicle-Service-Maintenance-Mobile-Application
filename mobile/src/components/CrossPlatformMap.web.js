import React, { forwardRef, useEffect, useImperativeHandle, useRef } from 'react';
import { StyleSheet, View } from 'react-native';
import { MapContainer, TileLayer, Marker, Circle, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';

import 'leaflet/dist/leaflet.css';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

const createCustomIcon = (color) => {
  return L.divIcon({
    className: 'custom-marker',
    html: `<div style="
      background-color: ${color};
      width: 24px;
      height: 24px;
      border-radius: 50% 50% 50% 0;
      transform: rotate(-45deg);
      border: 2px solid white;
      box-shadow: 0 2px 5px rgba(0,0,0,0.3);
    "></div>`,
    iconSize: [24, 24],
    iconAnchor: [12, 24],
    popupAnchor: [0, -24]
  });
};

const userLocationIcon = L.divIcon({
  className: 'user-location-marker',
  html: `<div style="
    background-color: #4285F4;
    width: 16px;
    height: 16px;
    border-radius: 50%;
    border: 3px solid white;
    box-shadow: 0 2px 5px rgba(0,0,0,0.3);
  "></div>`,
  iconSize: [16, 16],
  iconAnchor: [8, 8]
});

function MapClickHandler({ onPress }) {
  useMapEvents({
    click: (e) => {
      if (onPress) {
        onPress({
          nativeEvent: {
            coordinate: {
              latitude: e.latlng.lat,
              longitude: e.latlng.lng
            }
          }
        });
      }
    }
  });
  return null;
}

function MapController({ mapRef }) {
  const map = useMap();
  
  useEffect(() => {
    if (mapRef) {
      mapRef.current = {
        animateToRegion: (region) => {
          map.flyTo([region.latitude, region.longitude], 14, {
            duration: 0.5
          });
        }
      };
    }
  }, [map, mapRef]);

  return null;
}

function UserLocationMarker({ showsUserLocation }) {
  const [position, setPosition] = React.useState(null);
  const map = useMap();

  useEffect(() => {
    if (showsUserLocation && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const newPos = [pos.coords.latitude, pos.coords.longitude];
          setPosition(newPos);
        },
        (err) => console.log('Geolocation error:', err),
        { enableHighAccuracy: true }
      );
    }
  }, [showsUserLocation, map]);

  return position ? (
    <Marker position={position} icon={userLocationIcon} />
  ) : null;
}

const CrossPlatformMap = forwardRef(({
  style,
  initialRegion,
  onPress,
  onMarkerPress,
  showsUserLocation = true,
  markers = [],
  circles = [],
  selectedMarkerId,
  children
}, ref) => {
  const internalRef = useRef(null);

  useImperativeHandle(ref, () => ({
    animateToRegion: (region) => {
      internalRef.current?.animateToRegion(region);
    }
  }));

  const center = initialRegion 
    ? [initialRegion.latitude, initialRegion.longitude]
    : [20.5937, 78.9629];

  const zoom = initialRegion?.latitudeDelta 
    ? Math.round(Math.log2(360 / initialRegion.latitudeDelta))
    : 5;

  return (
    <View style={[styles.container, style]}>
      <MapContainer
        center={center}
        zoom={zoom}
        style={{ width: '100%', height: '100%' }}
        scrollWheelZoom={true}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        <MapController mapRef={internalRef} />
        <MapClickHandler onPress={onPress} />
        
        {showsUserLocation && <UserLocationMarker showsUserLocation={showsUserLocation} />}

        {circles.map((circle, index) => (
          <Circle
            key={`circle-${index}`}
            center={[circle.center.latitude, circle.center.longitude]}
            radius={circle.radius}
            pathOptions={{
              color: circle.strokeColor,
              weight: circle.strokeWidth || 2,
              fillColor: circle.fillColor,
              fillOpacity: 0.2
            }}
          />
        ))}

        {markers.map((marker) => (
          <Marker
            key={marker.id}
            position={[marker.coordinate.latitude, marker.coordinate.longitude]}
            icon={createCustomIcon(selectedMarkerId === marker.id ? '#DC2626' : '#1E63D9')}
            draggable={marker.draggable}
            eventHandlers={{
              click: () => onMarkerPress?.(marker),
              dragend: (e) => {
                if (marker.onDragEnd) {
                  marker.onDragEnd({
                    nativeEvent: {
                      coordinate: {
                        latitude: e.target.getLatLng().lat,
                        longitude: e.target.getLatLng().lng
                      }
                    }
                  });
                }
              }
            }}
          />
        ))}
      </MapContainer>
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    overflow: 'hidden'
  }
});

export default CrossPlatformMap;
