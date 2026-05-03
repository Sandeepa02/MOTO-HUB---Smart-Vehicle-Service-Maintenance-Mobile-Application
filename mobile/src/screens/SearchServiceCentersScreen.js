import React, { useCallback, useState } from 'react';
import { Alert, FlatList, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import api from '../api/client';
import { theme } from '../theme';

export default function SearchServiceCentersScreen({ navigation }) {
    const [centers, setCenters] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');

    const fetchCenters = async () => {
        try {
            const { data } = await api.get('/service-centers');
            // alphabetical sort
            const sorted = (data || []).sort((a, b) => a.centerName.localeCompare(b.centerName));
            setCenters(sorted);
        } catch (error) {
            Alert.alert('Error', error?.response?.data?.message || 'Failed loading service centers');
        }
    };

    useFocusEffect(
        useCallback(() => {
            fetchCenters();
        }, [])
    );

    const filteredCenters = centers.filter((c) => {
        if (!searchQuery) return true;
        const lowerQ = searchQuery.toLowerCase();
        // match by location (district) or name
        return (
            (c.location && c.location.toLowerCase().includes(lowerQ)) ||
            (c.centerName && c.centerName.toLowerCase().includes(lowerQ))
        );
    });

    return (
        <View style={styles.container}>
            <Text style={styles.heading}>Search Service Centers</Text>

            <Pressable
                style={styles.nearbyBanner}
                onPress={() => navigation.navigate('NearbyServiceCenters')}
            >
                <View style={styles.nearbyBannerContent}>
                    <Ionicons name="location" size={24} color={theme.colors.primary} />
                    <View style={styles.nearbyBannerText}>
                        <Text style={styles.nearbyBannerTitle}>Find Nearby Centers</Text>
                        <Text style={styles.nearbyBannerSubtitle}>Use GPS to find service centers near you</Text>
                    </View>
                </View>
                <Ionicons name="chevron-forward" size={20} color={theme.colors.primary} />
            </Pressable>

            <TextInput
                style={styles.searchInput}
                placeholder="Filter by District or Name..."
                value={searchQuery}
                onChangeText={setSearchQuery}
            />

            <Text style={styles.subText}>Showing {filteredCenters.length} alphabetically sorted results</Text>

            <FlatList
                data={filteredCenters}
                keyExtractor={(item) => item._id}
                contentContainerStyle={styles.listContent}
                renderItem={({ item }) => (
                    <View style={styles.centerCard}>
                        <Text style={styles.centerName}>{item.centerName}</Text>
                        <Text style={styles.centerMeta}>📍: {item.location}</Text>
                        <Text style={styles.centerMeta}>📞: {item.contactNumber}</Text>
                        <Pressable
                            style={styles.viewMoreBtn}
                            onPress={() => navigation.navigate('ServiceCenterDetails', { serviceCenterId: item._id })}
                        >
                            <Text style={styles.viewMoreText}>View Services & Book</Text>
                        </Pressable>
                    </View>
                )}
                ListEmptyComponent={
                    <View style={styles.emptyBox}>
                        <Text style={styles.emptyText}>No service centers found.</Text>
                    </View>
                }
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.colors.bg, padding: theme.spacing.lg },
    heading: { fontSize: 20, fontWeight: '700', marginBottom: 12, color: theme.colors.text, marginTop: 4 },
    nearbyBanner: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: theme.colors.bg2,
        borderRadius: theme.radius.lg,
        padding: theme.spacing.md,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: theme.colors.primary,
        ...theme.shadow.soft
    },
    nearbyBannerContent: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        flex: 1
    },
    nearbyBannerText: {
        flex: 1
    },
    nearbyBannerTitle: {
        fontSize: 14,
        fontWeight: '700',
        color: theme.colors.text
    },
    nearbyBannerSubtitle: {
        fontSize: 12,
        color: theme.colors.muted,
        fontWeight: '600',
        marginTop: 2
    },
    subText: { fontSize: 13, color: theme.colors.muted, fontWeight: '600', marginBottom: 10 },
    searchInput: {
        backgroundColor: theme.colors.card,
        borderWidth: 1,
        borderColor: theme.colors.primary,
        borderRadius: theme.radius.lg,
        padding: 12,
        marginBottom: 8,
        ...theme.shadow.soft
    },
    listContent: { paddingBottom: 24 },
    centerCard: {
        backgroundColor: theme.colors.card,
        borderRadius: theme.radius.lg,
        padding: theme.spacing.md,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: theme.colors.border,
        ...theme.shadow.soft
    },
    centerName: { fontSize: 16, fontWeight: '800', color: theme.colors.text, marginBottom: 6 },
    centerMeta: { color: theme.colors.text, fontWeight: '600', marginBottom: 2 },
    viewMoreBtn: {
        marginTop: 10,
        backgroundColor: theme.colors.primary,
        paddingVertical: 10,
        borderRadius: theme.radius.md
    },
    viewMoreText: { color: '#fff', fontWeight: '700', textAlign: 'center' },
    emptyBox: {
        padding: theme.spacing.md,
        alignItems: 'center',
        marginTop: 20
    },
    emptyText: { color: theme.colors.muted, fontWeight: '800' }
});
