import React from 'react';
import { Image, ScrollView, StyleSheet, Text, View, Alert } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { theme } from '../theme';
import ListItem from '../components/ListItem';

const menuItems = [
  { id: 'profile', title: 'Your Profile', icon: 'person-outline', target: 'UpdateProfile' },
  { id: 'vehicles', title: 'My Vehicles', icon: 'car-sport-outline', target: 'Vehicles' },
  { id: 'maintenance', title: 'Maintenance History', icon: 'build-outline', target: 'MaintenanceHistory' },
  { id: 'feedbacks', title: 'My Feedbacks', icon: 'chatbubbles-outline',  target: 'Reviews' },
  { id: 'payments', title: 'Recent Payments', icon: 'card-outline', comingSoon: true },
  { id: 'browsing', title: 'Browsing History', icon: 'time-outline', comingSoon: true },
];

export default function UserProfileScreen({ navigation }) {
  const { user, logout } = useAuth();

  const handlePress = (item) => {
    if (item.comingSoon) {
      Alert.alert('Coming Soon', 'This feature is currently under development.');
      return;
    }
    if (item.targetTab) {
      navigation.navigate(item.targetTab, { screen: item.targetScreen });
    } else if (item.target) {
      navigation.navigate(item.target);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Image source={{ uri: user?.profileImage || 'https://cdn-icons-png.flaticon.com/512/149/149071.png' }} style={styles.profileImage} />
        <View style={{ flex: 1 }}>
          <Text style={styles.name}>{user?.name || 'User'}</Text>
          <Text style={styles.email}>{user?.email || 'No email provided'}</Text>
          <Text style={styles.subEmail}>ID: {user?.publicId || user?._id || '-'}</Text>
        </View>
      </View>

      <View style={styles.section}>
        {menuItems.map((item, idx) => (
          <ListItem
            key={item.id}
            icon={item.icon}
            title={item.title}
            subtitle={item.comingSoon ? 'Coming soon' : undefined}
            onPress={() => handlePress(item)}
            disabled={!!item.comingSoon}
            onDisabledPress={() => Alert.alert('Coming Soon', 'This feature is currently under development.')}
            showDivider={idx !== menuItems.length - 1}
          />
        ))}
      </View>

      <View style={styles.section}>
        <ListItem icon="log-out-outline" title="Sign Out" danger onPress={logout} />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.bg },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    padding: theme.spacing.lg,
    backgroundColor: theme.colors.card,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.lg,
    margin: theme.spacing.lg,
    marginBottom: 12,
    ...theme.shadow.soft
  },
  profileImage: { width: 70, height: 70, borderRadius: 35, borderWidth: 2, borderColor: theme.colors.primary },
  name: { fontSize: 20, fontWeight: '800', color: theme.colors.text },
  email: { fontSize: 14, color: theme.colors.muted, fontWeight: '600', marginTop: 2 },
  subEmail: { fontSize: 13, color: theme.colors.muted },

  section: {
    backgroundColor: theme.colors.card,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    overflow: 'hidden',
    ...theme.shadow.soft,
    marginHorizontal: theme.spacing.lg,
    marginBottom: 12
  }
});
