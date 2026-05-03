import React, { useState } from 'react';
import { Alert, Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import InputField from '../components/InputField';
import { useAuth } from '../context/AuthContext';
import { theme } from '../theme';

export default function LoginScreen({ navigation }) {
  const { login } = useAuth();
  const [form, setForm] = useState({ email: '', password: '' });
  const [submitting, setSubmitting] = useState(false);

  const handleLogin = async () => {
    try {
      setSubmitting(true);
      await login(form);
    } catch (error) {
      Alert.alert('Login Failed', error?.response?.data?.message || 'Unable to login');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
      <View style={styles.header}>
        <Image source={require('../../assets/Logo2.png')} style={styles.heroImage} resizeMode="contain" />
        <Text style={styles.title}>MOTO HUB</Text>
        <Text style={styles.subtitle}>All Your Vehicle Needs in One Place.</Text>
      </View>
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
        placeholder="Enter password"
        secureTextEntry
      />
      <Pressable style={styles.button} onPress={handleLogin} disabled={submitting}>
        <Text style={styles.buttonText}>{submitting ? 'Please wait...' : 'Login'}</Text>
      </Pressable>
      <Pressable onPress={() => navigation.navigate('Register')}>
        <Text style={styles.link}>Create a user or service center account</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, padding: theme.spacing.lg, justifyContent: 'center', backgroundColor: theme.colors.bg },
  header: { alignItems: 'center', marginBottom: theme.spacing.lg },
  heroImage: { width: 150, height: 150, marginBottom: theme.spacing.md, borderRadius: 100, overflow: 'hidden', },
  title: { fontSize: 30, fontWeight: '900', marginBottom: 8, textAlign: 'center', color: theme.colors.primary },
  subtitle: { color: theme.colors.muted, textAlign: 'center', marginBottom: theme.spacing.md, fontWeight: '700' },
  button: { backgroundColor: theme.colors.primary, borderRadius: theme.radius.lg, padding: 14, marginTop: 8, ...theme.shadow.soft },
  buttonText: { color: '#fff', fontWeight: '900', textAlign: 'center' },
  link: { color: theme.colors.primary2, textAlign: 'center', marginTop: 14, fontWeight: '900' }
});
