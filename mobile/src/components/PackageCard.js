import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { theme } from '../theme';

const CATEGORY_COLORS = {
  Basic: '#3B82F6',
  Premium: '#F59E0B',
  Comprehensive: '#8B5CF6'
};

const formatDuration = (hours) => {
  if (!hours) return '';
  if (hours < 1) return `${Math.round(hours * 60)} mins`;
  if (hours === 1) return '1 hour';
  return `${hours} hours`;
};

const isDiscountActive = (validTill) => {
  if (!validTill) return false;
  return new Date(validTill) > new Date();
};

const getDaysRemaining = (validTill) => {
  if (!validTill) return 0;
  const diff = new Date(validTill) - new Date();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
};

export default function PackageCard({ 
  item, 
  onPress, 
  onCompareToggle, 
  isComparing = false,
  showCenterName = false,
  compact = false
}) {
  const hasActiveDiscount = item.discountPrice && isDiscountActive(item.discountValidTill);
  const discountPercent = hasActiveDiscount 
    ? Math.round((1 - item.discountPrice / item.price) * 100) 
    : 0;
  const daysRemaining = hasActiveDiscount ? getDaysRemaining(item.discountValidTill) : 0;

  return (
    <Pressable 
      style={[styles.card, isComparing && styles.cardComparing]} 
      onPress={onPress}
    >
      <View style={styles.topRow}>
        <View style={[styles.categoryBadge, { backgroundColor: CATEGORY_COLORS[item.category] || CATEGORY_COLORS.Basic }]}>
          <Text style={styles.categoryText}>{item.category || 'Basic'}</Text>
        </View>
        {hasActiveDiscount && (
          <View style={styles.discountBadge}>
            <Text style={styles.discountText}>{discountPercent}% OFF</Text>
            {daysRemaining <= 7 && (
              <Text style={styles.discountExpiry}>
                {daysRemaining <= 0 ? 'Ends today' : `${daysRemaining}d left`}
              </Text>
            )}
          </View>
        )}
      </View>

      <Text style={styles.packageName}>{item.serviceName}</Text>
      
      {showCenterName && item.centerId?.centerName && (
        <Text style={styles.centerName}>📍 {item.centerId.centerName}</Text>
      )}

      <View style={styles.metaRow}>
        {item.vehicleTypes && item.vehicleTypes.length > 0 && (
          <Text style={styles.metaText}>🏍️ {item.vehicleTypes.slice(0, 2).join(', ')}{item.vehicleTypes.length > 2 ? ` +${item.vehicleTypes.length - 2}` : ''}</Text>
        )}
        {item.estimatedDuration && (
          <Text style={styles.metaText}>⏱️ ~{formatDuration(item.estimatedDuration)}</Text>
        )}
      </View>

      {!compact && item.includedServices && item.includedServices.length > 0 && (
        <View style={styles.servicesContainer}>
          {item.includedServices.slice(0, 4).map((service, index) => (
            <View key={index} style={styles.serviceRow}>
              <Text style={styles.checkIcon}>✓</Text>
              <Text style={styles.serviceText}>{service}</Text>
            </View>
          ))}
          {item.includedServices.length > 4 && (
            <Text style={styles.moreServices}>+{item.includedServices.length - 4} more services</Text>
          )}
        </View>
      )}

      <View style={styles.bottomRow}>
        <View style={styles.priceContainer}>
          {hasActiveDiscount ? (
            <>
              <Text style={styles.discountedPrice}>LKR {item.discountPrice.toFixed(0)}</Text>
              <Text style={styles.originalPrice}>LKR {item.price.toFixed(0)}</Text>
            </>
          ) : (
            <Text style={styles.price}>LKR {item.price.toFixed(0)}</Text>
          )}
        </View>
        
        <View style={styles.actionsRow}>
          {onCompareToggle && (
            <Pressable 
              style={[styles.compareBtn, isComparing && styles.compareBtnActive]}
              onPress={(e) => {
                e.stopPropagation();
                onCompareToggle(item);
              }}
            >
              <Text style={[styles.compareBtnText, isComparing && styles.compareBtnTextActive]}>
                {isComparing ? '✓ Added' : '+ Compare'}
              </Text>
            </Pressable>
          )}
          <Pressable style={styles.bookBtn} onPress={onPress}>
            <Text style={styles.bookBtnText}>Book Now →</Text>
          </Pressable>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: theme.colors.card,
    padding: theme.spacing.md,
    borderRadius: theme.radius.lg,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: theme.colors.border,
    ...theme.shadow.soft
  },
  cardComparing: {
    borderColor: theme.colors.primary,
    borderWidth: 2
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10
  },
  categoryBadge: {
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: theme.radius.pill
  },
  categoryText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 11,
    textTransform: 'uppercase'
  },
  discountBadge: {
    backgroundColor: '#EF4444',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: theme.radius.pill,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6
  },
  discountText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 11
  },
  discountExpiry: {
    color: '#fff',
    fontWeight: '500',
    fontSize: 10,
    opacity: 0.9
  },
  packageName: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.colors.text,
    marginBottom: 6
  },
  centerName: {
    fontSize: 13,
    color: theme.colors.muted,
    fontWeight: '600',
    marginBottom: 8
  },
  metaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 12
  },
  metaText: {
    fontSize: 13,
    color: theme.colors.muted,
    fontWeight: '600'
  },
  servicesContainer: {
    backgroundColor: theme.colors.bg,
    padding: 12,
    borderRadius: theme.radius.md,
    marginBottom: 12
  },
  serviceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6
  },
  checkIcon: {
    color: theme.colors.success,
    fontWeight: '700',
    marginRight: 8,
    fontSize: 14
  },
  serviceText: {
    fontSize: 13,
    color: theme.colors.text,
    flex: 1
  },
  moreServices: {
    fontSize: 12,
    color: theme.colors.primary,
    fontWeight: '600',
    marginTop: 4
  },
  bottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8
  },
  price: {
    fontSize: 20,
    fontWeight: '700',
    color: theme.colors.primary
  },
  discountedPrice: {
    fontSize: 20,
    fontWeight: '700',
    color: theme.colors.success
  },
  originalPrice: {
    fontSize: 14,
    color: theme.colors.muted,
    textDecorationLine: 'line-through'
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 8
  },
  compareBtn: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.card
  },
  compareBtnActive: {
    backgroundColor: theme.colors.bg2,
    borderColor: theme.colors.primary
  },
  compareBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: theme.colors.muted
  },
  compareBtnTextActive: {
    color: theme.colors.primary
  },
  bookBtn: {
    backgroundColor: theme.colors.primary,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: theme.radius.md
  },
  bookBtnText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 13
  }
});
