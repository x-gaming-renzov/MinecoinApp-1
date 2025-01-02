import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useUser } from '../../context/UserContext';
import { adapty } from 'react-native-adapty';
import { createPaywallView } from '@adapty/react-native-ui';

// Adapty keys, same as before:
const ADAPTY_SDK_KEY = 'YOUR_SDK_KEY'; 
const PLACEMENT_ID = '2233'; 

/* 
  We now expect "bundle" to have properties like:
  bundle.name, bundle.coinAmount, bundle.price, isPopular, etc.

  You can adjust or rename these fields to match your actual data shape.
*/

const CoinBundleCard = ({ bundle, onPurchase }) => {
  const navigation = useNavigation();
  const { hasMcVerified } = useUser();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    initializeAdapty();
  }, []);

  const initializeAdapty = async () => {
    try {
      adapty.activate('public_live_a2ZpIYeH.UBLMWSv1MLfHElcx8N9j');
      setLoading(false);
    } catch (e) {
      console.error('Adapty initialization error:', e);
      setError('Failed to initialize payment system');
      setLoading(false);
    }
  };

  const showPaywall = async () => {
    if (!hasMcVerified) {
      navigation.navigate('Profile', {
        screen: 'MC Verification',
        params: { returnTo: 'GetCoins' }
      });
      return;
    }

    try {
      setLoading(true);

      const paywall = await adapty.getPaywall(PLACEMENT_ID, 'en');
      if (paywall.hasViewConfiguration) {
        const view = await createPaywallView(paywall);

        view.registerEventHandlers({
          onClose: () => {
            console.log('Paywall closed');
          },
          onPurchaseCompleted: (purchaseResult) => {
            console.log('Purchase completed:', purchaseResult);
          },
          onPurchaseCancelled: () => {
            console.log('Purchase cancelled');
          },
          onPurchaseError: (err) => {
            console.error('Purchase error:', err);
            setError('Failed to complete purchase. Please try again.');
          },
        });
        await view.present();
      } else {
        setError('Paywall configuration not available');
      }
    } catch (e) {
      console.error('Error showing paywall:', e);
      setError('Failed to load coin packages');
    } finally {
      setLoading(false);
    }
  };

  // If you’d like to handle a normal purchase flow with `onPurchase(bundle)`, 
  // you could also call onPurchase here. For now, we just do `showPaywall`.

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#7C3AED" />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>{error}</Text>
      </View>
    );
  }

  return (
    <View style={styles.cardContainer}>
      {/* If the bundle is popular, show a small “BEST DEAL” badge */}
      {bundle.isPopular && (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>BEST DEAL</Text>
        </View>
      )}

      {/* Bundle info (name, coin amount, price) */}
      <Text style={styles.bundleName}>
        {bundle.name || 'Default Bundle'}
      </Text>
      <Text style={styles.bundleAmount}>
        {bundle.coinAmount ? `${bundle.coinAmount} Coins` : '??? Coins'}
      </Text>
      {bundle.price && (
        <Text style={styles.bundlePrice}>${bundle.price}</Text>
      )}

      {/* Purchase Button */}
      <TouchableOpacity
        style={styles.purchaseButton}
        onPress={showPaywall}
      >
        <Text style={styles.purchaseButtonText}>Buy Now</Text>
      </TouchableOpacity>
    </View>
  );
};

// ----------------------
//     Styles
// ----------------------
const styles = StyleSheet.create({
  cardContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    // Subtle shadow
    shadowColor: '#7C3AED',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
    position: 'relative',
  },
  loadingContainer: {
    padding: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    padding: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    color: '#EF4444',
    fontSize: 16,
    textAlign: 'center',
  },
  // Badge for a popular/best deal
  badge: {
    position: 'absolute',
    top: 16,
    right: 16,
    backgroundColor: '#10B981',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    zIndex: 10,
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  bundleName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#4B5563',
    marginBottom: 4,
  },
  bundleAmount: {
    fontSize: 16,
    fontWeight: '500',
    color: '#6B7280',
    marginBottom: 4,
  },
  bundlePrice: {
    fontSize: 16,
    fontWeight: '600',
    color: '#7C3AED',
    marginBottom: 16,
  },
  purchaseButton: {
    backgroundColor: '#7C3AED',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  purchaseButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
});

export default CoinBundleCard;
