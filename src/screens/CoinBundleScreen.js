import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { adapty } from 'react-native-adapty';
import { createPaywallView } from '@adapty/react-native-ui';
import { useAuth } from '../context/AuthContext';
import { useUser } from '../context/UserContext';
import { ArrowLeft } from "lucide-react-native";
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../config/firebase';
import Animated, { 
  withSpring, 
  useAnimatedStyle, 
  useSharedValue,
  withTiming
} from 'react-native-reanimated';

const PLACEMENT_ID = '2233';

const Toast = ({ message, visible, onHide, onComplete }) => {
  const translateY = useSharedValue(-100);
  const opacity = useSharedValue(0);

  useEffect(() => {
    if (visible) {
      translateY.value = withSpring(0);
      opacity.value = withSpring(1);
      
      const timer = setTimeout(() => {
        translateY.value = withTiming(-100);
        opacity.value = withTiming(0);
        onHide();
        onComplete?.();
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, [visible]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
    opacity: opacity.value,
  }));

  if (!visible) return null;

  return (
    <Animated.View style={[{
      position: 'absolute',
      top: 60,
      left: '5%',
      right: '5%',
      backgroundColor: '#1B1D2E',
      borderRadius: 12,
      padding: 16,
      alignItems: 'center',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.25,
      shadowRadius: 4,
      elevation: 5,
      zIndex: 1000,
    }, animatedStyle]}>
      <Text style={{
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '600',
        textAlign: 'center'
      }}>
        {message}
      </Text>
    </Animated.View>
  );
};

const CoinBundleScreen = () => {
  const navigation = useNavigation();
  const { isLoggedIn } = useAuth();
  const { hasMcVerified, addCoins } = useUser();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [coinBundles, setCoinBundles] = useState([]);
  const [selectedProductId, setSelectedProductId] = useState(null);
  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  useEffect(() => {
    const fetchCoinBundles = async () => {
      try {
        const bundlesRef = collection(db, "coinBundles");
        const snapshot = await getDocs(bundlesRef);
        const bundles = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setCoinBundles(bundles);
      } catch (error) {
        console.error("Error fetching coin bundles:", error);
        setError("Failed to load coin bundle information");
      }
    };

    fetchCoinBundles();
  }, []);

  const handlePurchaseSuccess = async (coinBundle) => {
    await addCoins(coinBundle.coinAmount, coinBundle);
    setToastMessage(`${coinBundle.coinAmount} coins have been added to your account!`);
    setToastVisible(true);
  };

  const handlePurchase = async () => {
    if (!hasMcVerified) {
      setError('Minecraft verification required to proceed.');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const paywall = await adapty.getPaywall(PLACEMENT_ID, 'en');

      if (paywall.hasViewConfiguration) {
        const view = await createPaywallView(paywall);

        view.registerEventHandlers({
          onClose: () => {
            setSelectedProductId(null);
          },
          onProductSelected: (product) => {
            setSelectedProductId(product.vendorProductId);
          },
          onPurchaseCompleted: async (purchaseResult) => {
            // // Move error check outside try block
            // if (purchaseResult.error || purchaseResult.status === 'error' || purchaseResult.errorCode === 'ALREADY_OWNED') {
            //   setError('You already own this item.');
            //   setSelectedProductId(null);
            //   return; // This properly stops execution
            // }            
              try {
              const nonSubscriptions = purchaseResult?.nonSubscriptions;
          
              if (!nonSubscriptions || Object.keys(nonSubscriptions).length === 0) {
                throw new Error('No non-subscription purchases found.');
              }
          
              let latestPurchase = null;
          
              for (const [productId, purchases] of Object.entries(nonSubscriptions)) {
                purchases.forEach((purchase) => {
                  const purchaseTime = new Date(purchase.purchasedAt).getTime();
                  if (!latestPurchase || purchaseTime > new Date(latestPurchase.purchasedAt).getTime()) {
                    latestPurchase = purchase;
                  }
                });
              }
          
              if (!latestPurchase) {
                throw new Error('No valid purchases found.');
              }
          
              const productId = latestPurchase.vendorProductId;
              const bundlesRef = collection(db, "coinBundles");
              const snapshot = await getDocs(bundlesRef);
          
              if (snapshot.empty) {
                throw new Error('No coin bundles found.');
              }
          
              const coinBundles = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
              }));
          
              const coinBundle = coinBundles.find(bundle => bundle.productId === productId);
          
              if (!coinBundle) {
                throw new Error('Product not found in bundles');
              }
          
              await handlePurchaseSuccess(coinBundle);
            } catch (error) {
              console.error('Error processing purchase:', error);
              setError('Failed to credit coins. Please try again.');
            }
          },             
          onPurchaseCancelled: () => {
            setSelectedProductId(null);
          },
          onPurchaseError: (err) => {
            setError('Purchase could not be completed. Please try again.');
            setSelectedProductId(null);
          },
        });

        await view.present();
      } else {
        setError('No coin bundles available at the moment.');
      }
    } catch (e) {
      setError('Failed to load coin bundles. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <Toast 
        message={toastMessage}
        visible={toastVisible}
        onHide={() => setToastVisible(false)}
        onComplete={() => navigation.navigate('Main')}
      />
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <ArrowLeft size={24} color="#6C47FF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Get Coins</Text>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.contentContainer}>
          <Text style={styles.subtitle}>Select coin bundle to purchase</Text>

          {loading ? (
            <ActivityIndicator size="large" color="#6C47FF" style={styles.loader} />
          ) : (
            <TouchableOpacity style={styles.bundleButton} onPress={handlePurchase}>
              <Text style={styles.bundleButtonText}>View Coin Bundles</Text>
            </TouchableOpacity>
          )}

          <View style={styles.infoContainer}>
            <Text style={styles.infoText}>
              • Purchases will be added to your account immediately
            </Text>
            <Text style={styles.infoText}>
              • All purchases are final and non-refundable
            </Text>
            <Text style={styles.infoText}>
              • For any issues, please contact support
            </Text>
          </View>

          {error && (
            <Text style={styles.errorText}>{error}</Text>
          )}
        </View>
      </ScrollView>
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
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  backButton: {
    marginRight: 16,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1F2937',
  },
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
    alignItems: 'center',
  },
  subtitle: {
    fontSize: 20,
    fontWeight: '500',
    color: '#1F2937',
    marginBottom: 24,
    textAlign: 'center',
  },
  bundleButton: {
    backgroundColor: '#6C47FF',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 12,
    marginBottom: 32,
    width: '90%',
    alignItems: 'center',
  },
  bundleButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  loader: {
    marginVertical: 20,
  },
  infoContainer: {
    width: '90%',
    marginTop: 24,
    backgroundColor: '#2A2D3F',
    padding: 20,
    borderRadius: 12,
  },
  infoText: {
    fontSize: 14,
    color: '#94A3B8',
    marginBottom: 16,
    lineHeight: 20,
  },
  errorText: {
    color: '#EF4444',
    fontSize: 14,
    marginTop: 20,
  },
});

export default CoinBundleScreen;