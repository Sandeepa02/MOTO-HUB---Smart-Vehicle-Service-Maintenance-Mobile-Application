import React, { useCallback, useState } from 'react';
import { Alert, FlatList, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';
import { theme } from '../theme';

const SUGGESTIONS_BY_RATING = {
  5: ['Excellent Service', 'Highly Recommended', 'Perfect Experience', 'Friendly Staff', 'Outstanding Quality'],
  4: ['Good Service', 'Quick & Efficient', 'Affordable Price', 'Great Staff'],
  3: ['Average Service', 'Okay Experience', 'Could be better', 'Fair Price'],
  2: ['Poor Service', 'Very Slow', 'Not satisfied', 'Needs improvement'],
  1: ['Terrible Service', 'Unprofessional', 'Too expensive', 'Would not recommend']
};

export default function ReviewsScreen({ navigation, route }) {
  const { authHeaders, user } = useAuth();
  const initialRecord = route.params?.record || null;
  const initialReview = route.params?.review || null;
  const [reviews, setReviews] = useState([]);
  const [editingId, setEditingId] = useState(initialReview?._id || null);
  const [selectedRecord, setSelectedRecord] = useState(initialRecord);
  const [form, setForm] = useState({
    bookingId: initialRecord?.bookingId?._id || '',
    rating: Number(initialReview?.rating || 5),
    comment: initialReview?.comment || ''
  });

  const fetchData = async () => {
    const { data } = await api.get('/reviews');
    const ownReviews = data.filter((review) => review.userId?._id === user?._id);
    setReviews(ownReviews);
  };

  useFocusEffect(
    useCallback(() => {
      fetchData().catch((error) => Alert.alert('Error', error?.response?.data?.message || 'Failed loading feedback'));
    }, [user?._id])
  );

  const saveReview = async () => {
    try {
      if (!form.bookingId) {
        Alert.alert('Missing Booking', 'Please open this screen from a maintenance record card.');
        return;
      }

      const payload = { bookingId: form.bookingId, rating: form.rating, comment: form.comment };

      if (editingId) {
        await api.put(`/reviews/${editingId}`, payload, authHeaders);
      } else {
        await api.post('/reviews', payload, authHeaders);
      }

      await fetchData();
      navigation.goBack();
    } catch (error) {
      Alert.alert('Error', error?.response?.data?.message || 'Save failed');
    }
  };

  const removeReview = async (id) => {
    try {
      await api.delete(`/reviews/${id}`, authHeaders);
      await fetchData();
    } catch (error) {
      Alert.alert('Error', error?.response?.data?.message || 'Delete failed');
    }
  };

  const handleSuggestion = (suggestion) => {
    setForm((prev) => {
      const current = prev.comment.trim();
      const newComment = current ? `${current}, ${suggestion}` : suggestion;
      return { ...prev, comment: newComment };
    });
  };

  const currentSuggestions = SUGGESTIONS_BY_RATING[form.rating] || SUGGESTIONS_BY_RATING[5];

  return (
    <ScrollView style={styles.container}>
      {selectedRecord ? (
        <View style={styles.formCard}>
          <Text style={styles.heading}>{editingId ? 'Update Feedback' : 'Add Feedback'}</Text>
          <Text style={styles.text}>Service Center: {selectedRecord.serviceCenterId?.centerName}</Text>
          <Text style={styles.text}>Vehicle: {selectedRecord.vehicleId?.vehicleName}</Text>
          <Text style={styles.text}>Service Date: {selectedRecord.serviceDate?.slice(0, 10)}</Text>

          <Text style={styles.label}>Rating</Text>
          <View style={styles.starsContainer}>
            {[1, 2, 3, 4, 5].map((star) => (
              <Pressable key={star} onPress={() => setForm((prev) => ({ ...prev, rating: star }))}>
                <Text style={[styles.starIcon, form.rating >= star ? styles.starSelected : styles.starUnselected]}>
                  ★
                </Text>
              </Pressable>
            ))}
          </View>

          <Text style={styles.label}>Suggestions</Text>
          <View style={styles.suggestionsContainer}>
            {currentSuggestions.map((suggestion, index) => (
              <Pressable
                key={index}
                style={styles.suggestionChip}
                onPress={() => handleSuggestion(suggestion)}
              >
                <Text style={styles.suggestionText}>{suggestion}</Text>
              </Pressable>
            ))}
          </View>

          <Text style={styles.label}>Feedback</Text>
          <TextInput
            style={[styles.input, styles.notesInput]}
            placeholder="Write your feedback here..."
            multiline
            value={form.comment}
            onChangeText={(comment) => setForm((prev) => ({ ...prev, comment }))}
          />
          <Pressable style={styles.primaryBtn} onPress={saveReview}>
            <Text style={styles.primaryBtnText}>{editingId ? 'Update Feedback' : 'Submit Feedback'}</Text>
          </Pressable>
        </View>
      ) : null}

      <Text style={styles.heading}>My Feedback</Text>
      <FlatList
        scrollEnabled={false}
        data={reviews}
        keyExtractor={(item) => item._id}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Text style={styles.title}>{item.serviceCenterId?.centerName || 'Service Center'}</Text>
            <Text style={styles.text}>Service: {item.bookingId?.serviceType || 'Maintenance'}</Text>
            <Text style={styles.text}>Date: {item.bookingId?.bookingDate || '-'}</Text>
            <Text style={styles.text}>
              Rating: {Array(item.rating).fill('★').join('')}
              {Array(5 - item.rating).fill('☆').join('')} ({item.rating}/5)
            </Text>
            <Text style={styles.text}>Comment: {item.comment || '-'}</Text>
            <View style={styles.row}>
              <Pressable
                style={[styles.smallBtn, styles.editBtn]}
                onPress={() => {
                  setEditingId(item._id);
                  setSelectedRecord({
                    bookingId: { _id: item.bookingId?._id },
                    serviceCenterId: item.serviceCenterId,
                    vehicleId: item.vehicleId,
                    serviceDate: item.bookingId?._id ? item.bookingId.serviceDate : undefined
                  });
                  setForm({
                    bookingId: item.bookingId?._id || '',
                    rating: Number(item.rating || 5),
                    comment: item.comment || ''
                  });
                }}
              >
                <Text style={styles.smallBtnText}>Edit</Text>
              </Pressable>
              <Pressable style={[styles.smallBtn, styles.deleteBtn]} onPress={() => removeReview(item._id)}>
                <Text style={styles.smallBtnText}>Delete</Text>
              </Pressable>
            </View>
          </View>
        )}
        ListEmptyComponent={<Text style={styles.text}>You haven't added any feedback yet.</Text>}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: theme.spacing.lg, backgroundColor: theme.colors.bg },
  formCard: {
    backgroundColor: theme.colors.card,
    borderRadius: theme.radius.lg,
    padding: theme.spacing.md,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: theme.colors.border,
    ...theme.shadow.card
  },
  heading: { fontSize: 20, fontWeight: '700', marginBottom: 10, marginTop: 4, color: theme.colors.text },
  label: { fontSize: 15, fontWeight: '700', color: theme.colors.text, marginTop: 12, marginBottom: 8 },
  starsContainer: { flexDirection: 'row', gap: 8, marginBottom: 10 },
  starIcon: { fontSize: 36, textShadowRadius: 2, textShadowColor: '#00000030', textShadowOffset: { width: 1, height: 1 } },
  starSelected: { color: '#FFD700' },
  starUnselected: { color: theme.colors.border },
  suggestionsContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 },
  suggestionChip: { paddingHorizontal: 12, paddingVertical: 8, backgroundColor: theme.colors.primary + '15', borderRadius: 20, borderWidth: 1, borderColor: theme.colors.primary },
  suggestionText: { color: theme.colors.primary, fontWeight: '600', fontSize: 13 },
  input: {
    backgroundColor: theme.colors.card,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.lg,
    padding: 12,
    marginBottom: 14,
    ...theme.shadow.soft
  },
  notesInput: { minHeight: 90, textAlignVertical: 'top' },
  primaryBtn: { backgroundColor: theme.colors.primary, borderRadius: theme.radius.lg, padding: 14, marginBottom: 4, ...theme.shadow.soft },
  primaryBtnText: { color: '#fff', fontWeight: '700', textAlign: 'center' },
  card: {
    backgroundColor: theme.colors.card,
    padding: theme.spacing.md,
    borderRadius: theme.radius.lg,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: theme.colors.border,
    ...theme.shadow.soft
  },
  title: { fontWeight: '800', fontSize: 16, color: theme.colors.text, marginBottom: 4 },
  text: { color: theme.colors.muted, fontWeight: '700', marginBottom: 2 },
  row: { flexDirection: 'row', marginTop: 12, gap: 8 },
  smallBtn: { flex: 1, padding: 12, borderRadius: theme.radius.md, ...theme.shadow.soft },
  editBtn: { backgroundColor: theme.colors.primary2 },
  deleteBtn: { backgroundColor: theme.colors.danger },
  smallBtnText: { color: '#fff', fontWeight: '700', textAlign: 'center' }
});
