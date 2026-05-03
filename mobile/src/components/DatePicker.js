import React, { useState } from 'react';
import { Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';

export default function DatePicker({ label, value, onChange, mode = 'date', minimumDate }) {
  const [show, setShow] = useState(false);
  const minDate = minimumDate || new Date();
  const minDateString = minDate.toISOString().split('T')[0];

  if (Platform.OS === 'web') {
    return (
      <View style={styles.container}>
        {label && <Text style={styles.label}>{label}</Text>}
        <TextInput
          style={[styles.input, styles.webInputText]}
          placeholder="Select Date"
          value={value}
          onChangeText={onChange}
          keyboardType="default"
          autoCapitalize="none"
          autoCorrect={false}
          maxLength={10}
          // react-native-web forwards these to the underlying input element.
          type="date"
          min={minDateString}
        />
      </View>
    );
  }

  const handleChange = (event, selectedDate) => {
    if (Platform.OS === 'android') {
      setShow(false);
      if (event.type === 'set' && selectedDate) {
        const formatted = selectedDate.toISOString().split('T')[0];
        onChange(formatted);
      }
    } else {
      if (selectedDate) {
        const formatted = selectedDate.toISOString().split('T')[0];
        onChange(formatted);
      }
    }
  };

  const handlePress = () => {
    setShow(true);
  };

  return (
    <View style={styles.container}>
      {label && <Text style={styles.label}>{label}</Text>}
      <Pressable style={styles.input} onPress={handlePress}>
        <Text style={value ? styles.inputText : styles.placeholderText}>
          {value || 'Select Date'}
        </Text>
      </Pressable>
      {show && (
        <DateTimePicker
          value={value ? new Date(value) : new Date()}
          mode={mode}
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={handleChange}
          minimumDate={minDate}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginBottom: 12 },
  label: { fontSize: 14, fontWeight: '600', color: '#666', marginBottom: 6 },
  input: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
  },
  inputText: { fontSize: 16, color: '#333' },
  webInputText: { fontSize: 16, color: '#333' },
  placeholderText: { fontSize: 16, color: '#999' }
});
