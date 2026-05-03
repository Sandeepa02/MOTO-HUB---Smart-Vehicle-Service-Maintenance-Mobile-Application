import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../theme';

export default function ListItem({
  icon,
  title,
  subtitle,
  onPress,
  onDisabledPress,
  danger = false,
  disabled = false,
  showDivider = false,
  badgeText = 'SOON',
  style
}) {
  const iconColor = danger ? theme.colors.danger : theme.colors.primary;
  const iconBg = danger ? theme.colors.danger + '12' : theme.colors.primary + '15';

  return (
    <Pressable
      onPress={disabled ? onDisabledPress : onPress}
      style={({ pressed }) => [styles.row, pressed ? styles.pressed : null, disabled ? styles.disabled : null, style]}
    >
      <View style={[styles.iconCircle, { backgroundColor: iconBg, borderColor: iconColor + '35' }]}>
        <Ionicons name={icon} size={20} color={iconColor} />
      </View>

      <View style={{ flex: 1 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Text style={[styles.title, danger ? styles.dangerTitle : null]}>{title}</Text>
          {disabled ? <Text style={styles.badge}>{badgeText}</Text> : null}
        </View>
        {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      </View>

      <Ionicons name="chevron-forward" size={18} color={theme.colors.muted} />
      {showDivider ? <View style={styles.divider} /> : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 14, paddingVertical: 14 },
  pressed: { opacity: 0.75 },
  disabled: { opacity: 0.6 },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1
  },
  title: { color: theme.colors.text, fontWeight: '900', fontSize: 15 },
  dangerTitle: { color: theme.colors.danger },
  subtitle: { color: theme.colors.muted, fontWeight: '700', fontSize: 12, marginTop: 2 },
  badge: {
    marginLeft: 10,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
    backgroundColor: theme.colors.border,
    color: theme.colors.muted,
    fontWeight: '900',
    fontSize: 10
  },
  divider: {
    position: 'absolute',
    left: 14 + 40 + 12,
    right: 14,
    bottom: 0,
    height: 1,
    backgroundColor: theme.colors.border
  }
});
