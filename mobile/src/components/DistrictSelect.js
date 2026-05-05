import React, { useState } from 'react';
import { FlatList, Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../theme';

/**
 * @param {object} props
 * @param {string} props.label
 * @param {string} props.value
 * @param {(v: string) => void} props.onChange
 * @param {string} [props.placeholder]
 * @param {{ label: string, value: string }[]} props.options
 */
export default function DistrictSelect({ label, value, onChange, placeholder = 'Select district', options }) {
  const [open, setOpen] = useState(false);
  const display = value ? options.find((o) => o.value === value)?.label || value : placeholder;

  return (
    <View style={styles.wrap}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <Pressable style={styles.trigger} onPress={() => setOpen(true)}>
        <Text style={[styles.triggerText, !value && styles.placeholder]} numberOfLines={1}>
          {display}
        </Text>
        <Ionicons name="chevron-down" size={20} color={theme.colors.muted} />
      </Pressable>

      <Modal visible={open} animationType="slide" transparent onRequestClose={() => setOpen(false)}>
        <View style={styles.modalRoot}>
          <Pressable style={styles.backdrop} onPress={() => setOpen(false)} />
          <View style={styles.sheet}>
            <View style={styles.sheetHeader}>
              <Text style={styles.sheetTitle}>{label}</Text>
              <Pressable onPress={() => setOpen(false)} hitSlop={12}>
                <Ionicons name="close" size={26} color={theme.colors.text} />
              </Pressable>
            </View>
            <FlatList
              style={styles.optionList}
              data={options}
              keyExtractor={(item) => item.value || '__all__'}
              keyboardShouldPersistTaps="handled"
              renderItem={({ item }) => (
                <Pressable
                  style={[styles.row, item.value === value && styles.rowActive]}
                  onPress={() => {
                    onChange(item.value);
                    setOpen(false);
                  }}
                >
                  <Text style={[styles.rowText, item.value === value && styles.rowTextActive]}>{item.label}</Text>
                  {item.value === value ? <Ionicons name="checkmark" size={20} color={theme.colors.primary} /> : null}
                </Pressable>
              )}
            />
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginBottom: 14 },
  fieldLabel: { fontSize: 13, fontWeight: '800', marginBottom: 8, color: theme.colors.muted },
  trigger: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: theme.colors.card,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.lg,
    paddingHorizontal: 14,
    paddingVertical: 14,
    ...theme.shadow.soft
  },
  triggerText: { flex: 1, fontSize: 16, fontWeight: '600', color: theme.colors.text, marginRight: 8 },
  placeholder: { color: theme.colors.muted, fontWeight: '600' },
  modalRoot: { flex: 1, justifyContent: 'flex-end' },
  backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.35)' },
  sheet: {
    maxHeight: '72%',
    backgroundColor: theme.colors.card,
    borderTopLeftRadius: theme.radius.lg,
    borderTopRightRadius: theme.radius.lg,
    paddingBottom: 24
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border
  },
  sheetTitle: { fontSize: 16, fontWeight: '800', color: theme.colors.text },
  optionList: { maxHeight: 380 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: theme.colors.border
  },
  rowActive: { backgroundColor: theme.colors.bg2 },
  rowText: { fontSize: 15, fontWeight: '600', color: theme.colors.text, flex: 1 },
  rowTextActive: { color: theme.colors.primary, fontWeight: '800' }
});
