import React, { useState } from 'react';
import { Alert, Image, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';
import { theme } from '../theme';

export default function UpdateProfileScreen({ navigation }) {
    const { user, authHeaders, refreshSession } = useAuth();
    const [submitting, setSubmitting] = useState(false);
    const [image, setImage] = useState(user?.profileImage ? { uri: user.profileImage } : null);

    const [form, setForm] = useState({
        name: user?.name || '',
        address: user?.address || '',
        email: user?.email || '',
        birthday: user?.birthday || '',
        telephoneNumber: user?.contactNumber || user?.telephoneNumber || ''
    });

    const pickImage = async () => {
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            quality: 0.8,
            allowsEditing: true
        });
        if (!result.canceled) {
            setImage(result.assets[0]);
        }
    };

    const handleSave = async () => {
        try {
            setSubmitting(true);
            const data = new FormData();
            Object.entries(form).forEach(([key, value]) => data.append(key, String(value)));

            if (image && !image.uri.startsWith('http')) {
                data.append('profileImage', {
                    uri: image.uri,
                    name: image.fileName || 'profile.jpg',
                    type: image.mimeType || 'image/jpeg'
                });
            }

            const config = {
                ...authHeaders,
                headers: { ...(authHeaders?.headers || {}), 'Content-Type': 'multipart/form-data' }
            };

            // Ensure your backend profile update route matches this. Otherwise, adjust as needed.
            await api.put('/users/profile', data, config);
            Alert.alert('Success', 'Profile updated successfully');
            if (refreshSession) await refreshSession();
            navigation.goBack();
        } catch (error) {
            console.log('Update profile error', error);
            Alert.alert('Error', error?.response?.data?.message || 'Update failed. Check your API route (/users/profile).');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <ScrollView style={styles.container}>
            <View style={styles.imageSection}>
                <Image
                    source={{ uri: image?.uri || 'https://cdn-icons-png.flaticon.com/512/149/149071.png' }}
                    style={styles.previewImage}
                />
                <Pressable style={styles.imagePickerBtn} onPress={pickImage}>
                    <Text style={styles.imagePickerText}>Attach Picture</Text>
                </Pressable>
            </View>

            <View style={styles.formSection}>
                <Text style={styles.label}>User ID (Read-only)</Text>
                <TextInput style={[styles.input, styles.readonly]} value={user?.publicId || user?._id || '-'} editable={false} />

                <Text style={styles.label}>Name</Text>
                <TextInput style={styles.input} value={form.name} onChangeText={(val) => setForm(prev => ({ ...prev, name: val }))} />

                <Text style={styles.label}>Email</Text>
                <TextInput style={styles.input} keyboardType="email-address" value={form.email} onChangeText={(val) => setForm(prev => ({ ...prev, email: val }))} />

                <Text style={styles.label}>Address</Text>
                <TextInput style={styles.input} value={form.address} onChangeText={(val) => setForm(prev => ({ ...prev, address: val }))} />

                <Text style={styles.label}>Telephone Number</Text>
                <TextInput style={styles.input} keyboardType="phone-pad" value={form.telephoneNumber} onChangeText={(val) => setForm(prev => ({ ...prev, telephoneNumber: val }))} />

                <Text style={styles.label}>Birthday</Text>
                <TextInput style={styles.input} placeholder="YYYY-MM-DD" value={form.birthday} onChangeText={(val) => setForm(prev => ({ ...prev, birthday: val }))} />

                <Pressable style={styles.primaryBtn} onPress={handleSave} disabled={submitting}>
                    <Text style={styles.primaryBtnText}>{submitting ? 'Saving...' : 'Save Profile'}</Text>
                </Pressable>
            </View>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.colors.bg, padding: theme.spacing.lg },
    imageSection: { alignItems: 'center', marginVertical: 20 },
    previewImage: { width: 120, height: 120, borderRadius: 60, marginBottom: 14, borderWidth: 3, borderColor: theme.colors.primary },
    imagePickerBtn: { backgroundColor: theme.colors.primary2 + '20', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20 },
    imagePickerText: { color: theme.colors.primary2, fontWeight: '700' },
    formSection: { paddingBottom: 40 },
    label: { fontSize: 13, fontWeight: '700', color: theme.colors.muted, marginBottom: 6, marginLeft: 4 },
    input: { backgroundColor: theme.colors.card, borderWidth: 1, borderColor: theme.colors.border, borderRadius: theme.radius.lg, padding: 14, marginBottom: 16, ...theme.shadow.soft },
    readonly: { backgroundColor: '#f0f0f0', color: '#888' },
    primaryBtn: { backgroundColor: theme.colors.primary, borderRadius: theme.radius.lg, padding: 16, marginTop: 10, ...theme.shadow.soft },
    primaryBtnText: { color: '#fff', fontWeight: '800', textAlign: 'center', fontSize: 16 }
});
