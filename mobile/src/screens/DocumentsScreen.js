import React, { useCallback, useState } from 'react';
import { Alert, FlatList, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import { useFocusEffect } from '@react-navigation/native';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';
import { theme } from '../theme';

export default function DocumentsScreen() {
  const { authHeaders } = useAuth();
  const [documents, setDocuments] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [pickedFile, setPickedFile] = useState(null);
  const [form, setForm] = useState({ documentType: 'Insurance', expiryDate: '' });

  const fetchDocuments = async () => {
    const { data } = await api.get('/documents', authHeaders);
    setDocuments(data);
  };

  useFocusEffect(
    useCallback(() => {
      fetchDocuments().catch((error) => Alert.alert('Error', error?.response?.data?.message || 'Failed loading documents'));
    }, [])
  );

  const pickFile = async () => {
    const result = await DocumentPicker.getDocumentAsync({
      type: ['application/pdf', 'image/*'],
      copyToCacheDirectory: true
    });
    if (!result.canceled && result.assets?.length) {
      setPickedFile(result.assets[0]);
    }
  };

  const saveDocument = async () => {
    try {
      const data = new FormData();
      data.append('documentType', form.documentType);
      data.append('expiryDate', form.expiryDate);

      if (pickedFile) {
        data.append('file', {
          uri: pickedFile.uri,
          name: pickedFile.name || 'document.pdf',
          type: pickedFile.mimeType || 'application/pdf'
        });
      }

      const config = {
        ...authHeaders,
        headers: { ...authHeaders.headers, 'Content-Type': 'multipart/form-data' }
      };

      if (editingId) {
        await api.put(`/documents/${editingId}`, data, config);
      } else {
        await api.post('/documents', data, config);
      }
      setEditingId(null);
      setPickedFile(null);
      setForm({ documentType: 'Insurance', expiryDate: '' });
      await fetchDocuments();
    } catch (error) {
      Alert.alert('Error', error?.response?.data?.message || 'Save failed');
    }
  };

  const removeDocument = async (id) => {
    await api.delete(`/documents/${id}`, authHeaders);
    await fetchDocuments();
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.heading}>Document Form</Text>
      <TextInput
        style={styles.input}
        placeholder="Document Type (Insurance/License/Registration)"
        value={form.documentType}
        onChangeText={(documentType) => setForm((p) => ({ ...p, documentType }))}
      />
      <TextInput
        style={styles.input}
        placeholder="Expiry Date (YYYY-MM-DD)"
        value={form.expiryDate}
        onChangeText={(expiryDate) => setForm((p) => ({ ...p, expiryDate }))}
      />
      <Pressable style={styles.secondaryBtn} onPress={pickFile}>
        <Text style={styles.secondaryBtnText}>{pickedFile ? pickedFile.name : 'Select PDF/Image'}</Text>
      </Pressable>
      <Pressable style={styles.primaryBtn} onPress={saveDocument}>
        <Text style={styles.primaryBtnText}>{editingId ? 'Update Document' : 'Upload Document'}</Text>
      </Pressable>

      <Text style={styles.heading}>My Documents</Text>
      <FlatList
        scrollEnabled={false}
        data={documents}
        keyExtractor={(item) => item._id}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Text style={styles.title}>{item.documentType}</Text>
            <Text style={styles.text}>Expiry: {item.expiryDate?.slice(0, 10)}</Text>
            <Text style={styles.text}>File: {item.file}</Text>
            <View style={styles.row}>
              <Pressable
                style={[styles.smallBtn, styles.editBtn]}
                onPress={() => {
                  setEditingId(item._id);
                  setForm({
                    documentType: item.documentType || 'Insurance',
                    expiryDate: item.expiryDate?.slice(0, 10) || ''
                  });
                }}
              >
                <Text style={styles.smallBtnText}>Edit</Text>
              </Pressable>
              <Pressable style={[styles.smallBtn, styles.deleteBtn]} onPress={() => removeDocument(item._id)}>
                <Text style={styles.smallBtnText}>Delete</Text>
              </Pressable>
            </View>
          </View>
        )}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: theme.spacing.lg, backgroundColor: theme.colors.bg },
  heading: { fontSize: 20, fontWeight: '900', marginBottom: 10, marginTop: 4, color: theme.colors.text },
  input: {
    backgroundColor: theme.colors.card,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.lg,
    padding: 12,
    marginBottom: 10,
    ...theme.shadow.soft
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
  primaryBtn: { backgroundColor: theme.colors.primary, borderRadius: theme.radius.lg, padding: 14, marginBottom: 14, ...theme.shadow.soft },
  primaryBtnText: { color: '#fff', fontWeight: '900', textAlign: 'center' },
  card: {
    backgroundColor: theme.colors.card,
    padding: theme.spacing.md,
    borderRadius: theme.radius.lg,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: theme.colors.border,
    ...theme.shadow.soft
  },
  title: { fontWeight: '900', fontSize: 16, color: theme.colors.text },
  text: { color: theme.colors.muted, fontWeight: '700' },
  row: { flexDirection: 'row', marginTop: 8, gap: 8 },
  smallBtn: { flex: 1, padding: 12, borderRadius: theme.radius.md, ...theme.shadow.soft },
  editBtn: { backgroundColor: theme.colors.primary2 },
  deleteBtn: { backgroundColor: theme.colors.danger },
  smallBtnText: { color: '#fff', fontWeight: '900', textAlign: 'center' }
});
