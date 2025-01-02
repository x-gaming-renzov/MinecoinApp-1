import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { ArrowLeft } from "lucide-react-native";
import { useUser } from '../context/UserContext';
import Purchases from 'react-native-purchases';

const CheckoutScreen = ({ route }) => {
  const navigation = useNavigation();
  const { selectedPackage } = route.params;
  const [isProcessing, setIsProcessing] = useState(false);
  const { addCoins } = useUser();

  const getCoinAmount = (identifier) => {
    const coinMapping = {
      'x_coins_5d': 1000,  // Android 1000 coins
      'x_coins_20d': 5000, // Android 5000 coins
      'xcoins5': 1000,     // iOS 1000 coins
      'xcoins20': 5000     // iOS 5000 coins
    };
    return coinMapping[identifier] || 0;
  };

  const handlePayment = async () => {
    setIsProcessing(true);
    try {
      const { customerInfo, productIdentifier } = await Purchases.purchasePackage(selectedPackage);

      // Add coins after successful purchase
      const coinsToAdd = getCoinAmount(productIdentifier);
      await addCoins(coinsToAdd);

      navigation.navigate('PaymentSuccess');
    } catch (e) {
      if (!e.userCancelled) {
        console.error('Payment failed:', e);
        // Handle error appropriately
      }
    } finally {
      setIsProcessing(false);
    }
  };

  if (!selectedPackage) {
    return null;
  }

  const coinAmount = getCoinAmount(selectedPackage.product.identifier);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <ArrowLeft size={24} color="#7C3AED" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Checkout</Text>
      </View>

      <View style={styles.content}>
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Purchase Summary</Text>

          <View style={styles.detailRow}>
            <Text style={styles.label}>Coin Bundle</Text>
            <Text style={styles.value}>{coinAmount} Coins</Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.label}>Price</Text>
            <Text style={styles.value}>{selectedPackage.product.priceString}</Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Total Amount</Text>
            <Text style={styles.totalAmount}>{selectedPackage.product.priceString}</Text>
          </View>
        </View>

        <TouchableOpacity
          style={[styles.payButton, isProcessing && styles.payButtonDisabled]}
          onPress={handlePayment}
          disabled={isProcessing}
          activeOpacity={0.9}
        >
          {isProcessing ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <View style={styles.payButtonContent}>
              <Text style={styles.payButtonText}>Pay Now</Text>
              <Text style={styles.payButtonPrice}>{selectedPackage.product.priceString}</Text>
            </View>
          )}
        </TouchableOpacity>

        <Text style={styles.secureText}>🔒 Secure payment powered by RevenueCat</Text>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f2feff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#f2feff',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  backButton: {
    padding: 8,
    marginRight: 12,
    borderRadius: 12,
    backgroundColor: '#f2feff',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1F2937',
  },
  content: {
    flex: 1,
    padding: 16,
    backgroundColor: '#f2feff',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 20,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  label: {
    fontSize: 16,
    color: '#6B7280',
  },
  value: {
    fontSize: 16,
    color: '#1F2937',
  },
  divider: {
    height: 1,
    backgroundColor: '#E5E7EB',
    marginVertical: 16,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  totalAmount: {
    fontSize: 16,
    fontWeight: '600',
    color: '#7C3AED',
  },
  payButton: {
    backgroundColor: '#7C3AED',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  payButtonDisabled: {
    opacity: 0.7,
  },
  payButtonContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  payButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  payButtonPrice: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  secureText: {
    textAlign: 'center',
    color: '#6B7280',
    fontSize: 14,
  },
});

export default CheckoutScreen;