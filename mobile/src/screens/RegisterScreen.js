import React, { useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import InputField from '../components/InputField';
import { useAuth } from '../context/AuthContext';
import { theme } from '../theme';

const accountTypes = [
  { label: 'User', value: 'user' },
  { label: 'Service Center', value: 'service-center' }
];

export default function RegisterScreen({ navigation }) {
  const { register } = useAuth();
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    role: 'user',
    location: '',
    contactNumber: ''
  });
  const [submitting, setSubmitting] = useState(false);

  const handleRegister = async () => {
    try {
      setSubmitting(true);
      const payload =
        form.role === 'service-center'
          ? {
              ...form,
              centerName: form.name
            }
          : form;
      const data = await register(payload);
      const userId = data?.publicId ? `User ID: ${data.publicId}` : null;
      const centerId = data?.serviceCenterProfile?.centerId ? `Center ID: ${data.serviceCenterProfile.centerId}` : null;
      const lines = [userId, centerId].filter(Boolean);
      if (lines.length) {
        Alert.alert('Registration Successful', lines.join('\n'));
      }
    } catch (error) {
      // eslint-disable-next-line no-console
      console.log('Registration failed:', {
        message: error?.message,
        status: error?.response?.status,
        data: error?.response?.data
      });
      const status = error?.response?.status;
      const message = error?.response?.data?.message || 'Unable to register';
      Alert.alert('Registration Failed', status ? `${status}: ${message}` : message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Create Account</Text>
      <Text style={styles.label}>Account Type</Text>
      <View style={styles.roleRow}>
        {accountTypes.map((type) => (
          <Pressable
            key={type.value}
            style={[styles.rolePill, form.role === type.value && styles.rolePillActive]}
            onPress={() => setForm((prev) => ({ ...prev, role: type.value }))}
          >
            <Text style={[styles.roleText, form.role === type.value && styles.roleTextActive]}>{type.label}</Text>
          </Pressable>
        ))}
      </View>
      <InputField
        label="Name"
        value={form.name}
        onChangeText={(name) => setForm((prev) => ({ ...prev, name }))}
        placeholder= "Enter Name"
      />
      <InputField

        label="Email"
        value={form.email}
        onChangeText={(email) => setForm((prev) => ({ ...prev, email }))}
        placeholder="you@example.com"
      />
      <InputField
        label="Password"
        value={form.password}
        onChangeText={(password) => setForm((prev) => ({ ...prev, password }))}
        placeholder="Create password"
        secureTextEntry
      />

      {form.role === 'service-center' ? (
        <View>
          <InputField
            label="Location"
            value={form.location}
            onChangeText={(location) => setForm((prev) => ({ ...prev, location }))}
            placeholder="Enter Location"
          />
          <InputField
            label="Contact Number"
            value={form.contactNumber}
            onChangeText={(contactNumber) => setForm((prev) => ({ ...prev, contactNumber }))}
            placeholder="+94..."
          />

        </View>
      ) : null}

      <Pressable style={styles.button} onPress={handleRegister} disabled={submitting}>
        <Text style={styles.buttonText}>{submitting ? 'Please wait...' : 'Register'}</Text>
      </Pressable>
      <Pressable onPress={() => navigation.navigate('Login')}>
        <Text style={styles.link}>Already have an account? Login</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: theme.spacing.lg, backgroundColor: theme.colors.bg, flexGrow: 1, justifyContent: 'center' },
  title: { fontSize: 30, fontWeight: '900', marginBottom: 18, textAlign: 'center', color: theme.colors.primary },
  label: { fontSize: 13, fontWeight: '900', marginBottom: 10, color: theme.colors.muted },
  roleRow: { flexDirection: 'row', gap: 10, marginBottom: 16 },
  rolePill: {
    flex: 1,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.pill,
    paddingVertical: 12,
    backgroundColor: theme.colors.card,
    ...theme.shadow.soft
  },
  rolePillActive: { backgroundColor: theme.colors.primary, borderColor: theme.colors.primary },
  roleText: { textAlign: 'center', fontWeight: '900', color: theme.colors.text },
  roleTextActive: { color: '#fff' },
  button: { backgroundColor: theme.colors.primary, borderRadius: theme.radius.lg, padding: 14, marginTop: 8, ...theme.shadow.soft },
  buttonText: { color: '#fff', fontWeight: '900', textAlign: 'center' },
  link: { color: theme.colors.primary2, textAlign: 'center', marginTop: 14, fontWeight: '900' }
});
