import React from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { theme } from '../theme';

const CATEGORY_COLORS = {
  Basic: '#3B82F6',
  Premium: '#F59E0B',
  Comprehensive: '#8B5CF6'
};

const formatDuration = (hours) => {
  if (!hours) return '-';
  if (hours < 1) return `${Math.round(hours * 60)} mins`;
  if (hours === 1) return '1 hour';
  return `${hours} hours`;
};

const isDiscountActive = (validTill) => {
  if (!validTill) return false;
  return new Date(validTill) > new Date();
};

export default function PackageCompareModal({ 
  visible, 
  packages, 
  onClose, 
  onBook,
  onRemove 
}) {
  if (!packages || packages.length === 0) return null;

  const allServices = [...new Set(packages.flatMap(pkg => pkg.includedServices || []))];

  const getEffectivePrice = (pkg) => {
    if (pkg.discountPrice && isDiscountActive(pkg.discountValidTill)) {
      return pkg.discountPrice;
    }
    return pkg.price;
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modalContainer}>
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Compare Packages ({packages.length}/3)</Text>
            <Pressable onPress={onClose} style={styles.closeBtn}>
              <Text style={styles.closeBtnText}>✕</Text>
            </Pressable>
          </View>

          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View>
                <View style={styles.headerRow}>
                  <View style={styles.labelCell} />
                  {packages.map((pkg) => (
                    <View key={pkg._id} style={styles.packageHeaderCell}>
                      <View style={[styles.categoryBadge, { backgroundColor: CATEGORY_COLORS[pkg.category] || CATEGORY_COLORS.Basic }]}>
                        <Text style={styles.categoryText}>{pkg.category || 'Basic'}</Text>
                      </View>
                      <Text style={styles.packageName} numberOfLines={2}>{pkg.serviceName}</Text>
                      <Pressable 
                        style={styles.removeBtn}
                        onPress={() => onRemove(pkg)}
                      >
                        <Text style={styles.removeBtnText}>Remove</Text>
                      </Pressable>
                    </View>
                  ))}
                </View>

                <View style={styles.compareRow}>
                  <View style={styles.labelCell}>
                    <Text style={styles.labelText}>Price</Text>
                  </View>
                  {packages.map((pkg) => (
                    <View key={pkg._id} style={styles.valueCell}>
                      {pkg.discountPrice && isDiscountActive(pkg.discountValidTill) ? (
                        <>
                          <Text style={styles.discountedPrice}>LKR {pkg.discountPrice.toFixed(0)}</Text>
                          <Text style={styles.originalPrice}>LKR {pkg.price.toFixed(0)}</Text>
                        </>
                      ) : (
                        <Text style={styles.priceText}>LKR {pkg.price.toFixed(0)}</Text>
                      )}
                    </View>
                  ))}
                </View>

                <View style={styles.compareRow}>
                  <View style={styles.labelCell}>
                    <Text style={styles.labelText}>Duration</Text>
                  </View>
                  {packages.map((pkg) => (
                    <View key={pkg._id} style={styles.valueCell}>
                      <Text style={styles.valueText}>{formatDuration(pkg.estimatedDuration)}</Text>
                    </View>
                  ))}
                </View>

                <View style={styles.compareRow}>
                  <View style={styles.labelCell}>
                    <Text style={styles.labelText}>Vehicle Types</Text>
                  </View>
                  {packages.map((pkg) => (
                    <View key={pkg._id} style={styles.valueCell}>
                      <Text style={styles.valueText}>
                        {pkg.vehicleTypes?.length ? pkg.vehicleTypes.join(', ') : 'All types'}
                      </Text>
                    </View>
                  ))}
                </View>

                <View style={styles.servicesHeader}>
                  <Text style={styles.servicesHeaderText}>Included Services</Text>
                </View>

                {allServices.map((service, index) => (
                  <View key={index} style={styles.serviceRow}>
                    <View style={styles.labelCell}>
                      <Text style={styles.serviceLabelText}>{service}</Text>
                    </View>
                    {packages.map((pkg) => (
                      <View key={pkg._id} style={styles.valueCell}>
                        {pkg.includedServices?.includes(service) ? (
                          <Text style={styles.checkMark}>✓</Text>
                        ) : (
                          <Text style={styles.crossMark}>✕</Text>
                        )}
                      </View>
                    ))}
                  </View>
                ))}

                <View style={styles.bookRow}>
                  <View style={styles.labelCell} />
                  {packages.map((pkg) => (
                    <View key={pkg._id} style={styles.valueCell}>
                      <Pressable 
                        style={styles.bookBtn}
                        onPress={() => onBook(pkg)}
                      >
                        <Text style={styles.bookBtnText}>Book</Text>
                      </Pressable>
                    </View>
                  ))}
                </View>
              </View>
            </ScrollView>
          </ScrollView>

          <View style={styles.footer}>
            <Pressable style={styles.clearBtn} onPress={onClose}>
              <Text style={styles.clearBtnText}>Close</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end'
  },
  modalContainer: {
    backgroundColor: theme.colors.card,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '90%',
    minHeight: '60%'
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: theme.spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.colors.text
  },
  closeBtn: {
    padding: 8
  },
  closeBtnText: {
    fontSize: 20,
    color: theme.colors.muted
  },
  content: {
    padding: theme.spacing.md
  },
  headerRow: {
    flexDirection: 'row',
    marginBottom: 12
  },
  labelCell: {
    width: 100,
    paddingRight: 8,
    justifyContent: 'center'
  },
  packageHeaderCell: {
    width: 130,
    alignItems: 'center',
    paddingHorizontal: 8
  },
  categoryBadge: {
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: theme.radius.pill,
    marginBottom: 6
  },
  categoryText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 10,
    textTransform: 'uppercase'
  },
  packageName: {
    fontSize: 14,
    fontWeight: '700',
    color: theme.colors.text,
    textAlign: 'center',
    marginBottom: 6
  },
  removeBtn: {
    paddingVertical: 4,
    paddingHorizontal: 8
  },
  removeBtnText: {
    fontSize: 11,
    color: theme.colors.danger,
    fontWeight: '600'
  },
  compareRow: {
    flexDirection: 'row',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border
  },
  labelText: {
    fontSize: 13,
    fontWeight: '600',
    color: theme.colors.muted
  },
  valueCell: {
    width: 130,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8
  },
  valueText: {
    fontSize: 13,
    color: theme.colors.text,
    textAlign: 'center'
  },
  priceText: {
    fontSize: 15,
    fontWeight: '700',
    color: theme.colors.primary
  },
  discountedPrice: {
    fontSize: 15,
    fontWeight: '700',
    color: theme.colors.success
  },
  originalPrice: {
    fontSize: 11,
    color: theme.colors.muted,
    textDecorationLine: 'line-through'
  },
  servicesHeader: {
    paddingVertical: 12,
    backgroundColor: theme.colors.bg,
    marginHorizontal: -theme.spacing.md,
    paddingHorizontal: theme.spacing.md,
    marginTop: 12
  },
  servicesHeaderText: {
    fontSize: 14,
    fontWeight: '700',
    color: theme.colors.text
  },
  serviceRow: {
    flexDirection: 'row',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border
  },
  serviceLabelText: {
    fontSize: 12,
    color: theme.colors.text
  },
  checkMark: {
    fontSize: 16,
    color: theme.colors.success,
    fontWeight: '700'
  },
  crossMark: {
    fontSize: 14,
    color: theme.colors.muted
  },
  bookRow: {
    flexDirection: 'row',
    paddingVertical: 16,
    marginTop: 8
  },
  bookBtn: {
    backgroundColor: theme.colors.primary,
    paddingVertical: 10,
    paddingHorizontal: 24,
    borderRadius: theme.radius.md
  },
  bookBtnText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 13
  },
  footer: {
    padding: theme.spacing.lg,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border
  },
  clearBtn: {
    backgroundColor: theme.colors.bg,
    padding: 14,
    borderRadius: theme.radius.lg,
    alignItems: 'center'
  },
  clearBtnText: {
    color: theme.colors.text,
    fontWeight: '600'
  }
});
