import React, { useMemo, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { theme } from '../theme';

const DURATION_PER_SERVICE = 0.5;

export default function CustomPackageBuilder({ 
  visible, 
  packages, 
  onClose, 
  onBuild,
  serviceCenterId,
  serviceCenterName
}) {
  const [selectedServices, setSelectedServices] = useState({});

  const customizablePackages = packages?.filter(pkg => pkg.isCustomizable) || [];

  const allServices = useMemo(() => {
    const servicesMap = {};
    customizablePackages.forEach(pkg => {
      (pkg.includedServices || []).forEach(service => {
        if (!servicesMap[service]) {
          const pricePerService = pkg.price / (pkg.includedServices?.length || 1);
          servicesMap[service] = {
            name: service,
            price: Math.round(pricePerService),
            fromPackage: pkg.serviceName
          };
        }
      });
    });
    return Object.values(servicesMap);
  }, [customizablePackages]);

  const toggleService = (serviceName) => {
    setSelectedServices(prev => ({
      ...prev,
      [serviceName]: !prev[serviceName]
    }));
  };

  const selectedCount = Object.values(selectedServices).filter(Boolean).length;
  
  const totalPrice = useMemo(() => {
    return allServices.reduce((sum, service) => {
      if (selectedServices[service.name]) {
        return sum + service.price;
      }
      return sum;
    }, 0);
  }, [selectedServices, allServices]);

  const estimatedDuration = selectedCount * DURATION_PER_SERVICE;

  const formatDuration = (hours) => {
    if (hours < 1) return `${Math.round(hours * 60)} mins`;
    if (hours === 1) return '1 hour';
    return `${hours} hours`;
  };

  const handleBuild = () => {
    const selectedServiceNames = Object.entries(selectedServices)
      .filter(([_, isSelected]) => isSelected)
      .map(([name]) => name);

    onBuild({
      serviceName: 'Custom Package',
      includedServices: selectedServiceNames,
      price: totalPrice,
      estimatedDuration,
      isCustom: true,
      serviceCenterId,
      serviceCenterName
    });
  };

  const handleClose = () => {
    setSelectedServices({});
    onClose();
  };

  if (customizablePackages.length === 0) {
    return (
      <Modal
        visible={visible}
        animationType="slide"
        transparent={true}
        onRequestClose={handleClose}
      >
        <View style={styles.overlay}>
          <View style={styles.modalContainer}>
            <View style={styles.header}>
              <Text style={styles.headerTitle}>Custom Package Builder</Text>
              <Pressable onPress={handleClose} style={styles.closeBtn}>
                <Text style={styles.closeBtnText}>✕</Text>
              </Pressable>
            </View>
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyIcon}>🔧</Text>
              <Text style={styles.emptyTitle}>No Customizable Services</Text>
              <Text style={styles.emptyText}>
                This service center hasn't enabled custom package building yet.
              </Text>
              <Pressable style={styles.closeButton} onPress={handleClose}>
                <Text style={styles.closeButtonText}>Close</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    );
  }

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={handleClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modalContainer}>
          <View style={styles.header}>
            <View>
              <Text style={styles.headerTitle}>Build Your Package</Text>
              {serviceCenterName && (
                <Text style={styles.headerSubtitle}>at {serviceCenterName}</Text>
              )}
            </View>
            <Pressable onPress={handleClose} style={styles.closeBtn}>
              <Text style={styles.closeBtnText}>✕</Text>
            </Pressable>
          </View>

          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            <Text style={styles.instruction}>
              Select the services you need:
            </Text>

            {allServices.map((service, index) => (
              <Pressable
                key={index}
                style={[
                  styles.serviceItem,
                  selectedServices[service.name] && styles.serviceItemSelected
                ]}
                onPress={() => toggleService(service.name)}
              >
                <View style={styles.serviceCheckbox}>
                  {selectedServices[service.name] ? (
                    <View style={styles.checkboxChecked}>
                      <Text style={styles.checkmark}>✓</Text>
                    </View>
                  ) : (
                    <View style={styles.checkboxUnchecked} />
                  )}
                </View>
                <View style={styles.serviceInfo}>
                  <Text style={[
                    styles.serviceName,
                    selectedServices[service.name] && styles.serviceNameSelected
                  ]}>
                    {service.name}
                  </Text>
                </View>
                <Text style={[
                  styles.servicePrice,
                  selectedServices[service.name] && styles.servicePriceSelected
                ]}>
                  + LKR {service.price}
                </Text>
              </Pressable>
            ))}
          </ScrollView>

          <View style={styles.footer}>
            <View style={styles.summaryRow}>
              <View style={styles.summaryItem}>
                <Text style={styles.summaryLabel}>Services</Text>
                <Text style={styles.summaryValue}>{selectedCount}</Text>
              </View>
              <View style={styles.summaryDivider} />
              <View style={styles.summaryItem}>
                <Text style={styles.summaryLabel}>Duration</Text>
                <Text style={styles.summaryValue}>~{formatDuration(estimatedDuration)}</Text>
              </View>
              <View style={styles.summaryDivider} />
              <View style={styles.summaryItem}>
                <Text style={styles.summaryLabel}>Total</Text>
                <Text style={styles.summaryPrice}>LKR {totalPrice}</Text>
              </View>
            </View>

            <Pressable 
              style={[styles.buildBtn, selectedCount === 0 && styles.buildBtnDisabled]}
              onPress={handleBuild}
              disabled={selectedCount === 0}
            >
              <Text style={styles.buildBtnText}>
                {selectedCount === 0 ? 'Select Services' : 'Proceed to Book →'}
              </Text>
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
    maxHeight: '85%',
    minHeight: '50%'
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
    fontSize: 20,
    fontWeight: '700',
    color: theme.colors.text
  },
  headerSubtitle: {
    fontSize: 13,
    color: theme.colors.muted,
    marginTop: 2
  },
  closeBtn: {
    padding: 8
  },
  closeBtnText: {
    fontSize: 20,
    color: theme.colors.muted
  },
  content: {
    padding: theme.spacing.lg
  },
  instruction: {
    fontSize: 15,
    color: theme.colors.muted,
    marginBottom: 16,
    fontWeight: '600'
  },
  serviceItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    backgroundColor: theme.colors.bg,
    borderRadius: theme.radius.lg,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: 'transparent'
  },
  serviceItemSelected: {
    backgroundColor: '#EEF5FF',
    borderColor: theme.colors.primary
  },
  serviceCheckbox: {
    marginRight: 12
  },
  checkboxUnchecked: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: theme.colors.border
  },
  checkboxChecked: {
    width: 24,
    height: 24,
    borderRadius: 6,
    backgroundColor: theme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center'
  },
  checkmark: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 14
  },
  serviceInfo: {
    flex: 1
  },
  serviceName: {
    fontSize: 15,
    color: theme.colors.text,
    fontWeight: '600'
  },
  serviceNameSelected: {
    color: theme.colors.primary
  },
  servicePrice: {
    fontSize: 14,
    fontWeight: '700',
    color: theme.colors.muted
  },
  servicePriceSelected: {
    color: theme.colors.primary
  },
  footer: {
    padding: theme.spacing.lg,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
    backgroundColor: theme.colors.card
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    marginBottom: 16,
    paddingVertical: 12,
    backgroundColor: theme.colors.bg,
    borderRadius: theme.radius.lg
  },
  summaryItem: {
    alignItems: 'center'
  },
  summaryDivider: {
    width: 1,
    height: 30,
    backgroundColor: theme.colors.border
  },
  summaryLabel: {
    fontSize: 12,
    color: theme.colors.muted,
    marginBottom: 4
  },
  summaryValue: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.colors.text
  },
  summaryPrice: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.colors.primary
  },
  buildBtn: {
    backgroundColor: theme.colors.primary,
    padding: 16,
    borderRadius: theme.radius.lg,
    alignItems: 'center'
  },
  buildBtnDisabled: {
    backgroundColor: theme.colors.muted,
    opacity: 0.6
  },
  buildBtnText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 16
  },
  emptyContainer: {
    padding: theme.spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 16
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.colors.text,
    marginBottom: 8
  },
  emptyText: {
    fontSize: 14,
    color: theme.colors.muted,
    textAlign: 'center',
    marginBottom: 24
  },
  closeButton: {
    backgroundColor: theme.colors.bg,
    paddingVertical: 12,
    paddingHorizontal: 32,
    borderRadius: theme.radius.lg
  },
  closeButtonText: {
    color: theme.colors.text,
    fontWeight: '600'
  }
});
