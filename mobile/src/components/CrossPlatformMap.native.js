import React, { forwardRef, useImperativeHandle, useRef } from 'react';
import { StyleSheet } from 'react-native';
import MapView, { Marker, Circle } from 'react-native-maps';

const CrossPlatformMap = forwardRef(({
  style,
  initialRegion,
  onPress,
  onMarkerPress,
  showsUserLocation = true,
  showsMyLocationButton = true,
  markers = [],
  circles = [],
  selectedMarkerId,
  children
}, ref) => {
  const mapRef = useRef(null);

  useImperativeHandle(ref, () => ({
    animateToRegion: (region) => {
      mapRef.current?.animateToRegion(region);
    }
  }));

  return (
    <MapView
      ref={mapRef}
      style={[styles.map, style]}
      initialRegion={initialRegion}
      onPress={onPress}
      showsUserLocation={showsUserLocation}
      showsMyLocationButton={showsMyLocationButton}
    >
      {circles.map((circle, index) => (
        <Circle
          key={`circle-${index}`}
          center={circle.center}
          radius={circle.radius}
          strokeColor={circle.strokeColor}
          strokeWidth={circle.strokeWidth || 2}
          fillColor={circle.fillColor}
        />
      ))}

      {markers.map((marker) => (
        <Marker
          key={marker.id}
          coordinate={marker.coordinate}
          title={marker.title}
          description={marker.description}
          pinColor={selectedMarkerId === marker.id ? '#DC2626' : '#1E63D9'}
          draggable={marker.draggable}
          onPress={() => onMarkerPress?.(marker)}
          onDragEnd={marker.onDragEnd}
        />
      ))}

      {children}
    </MapView>
  );
});

const styles = StyleSheet.create({
  map: {
    flex: 1
  }
});

export default CrossPlatformMap;
