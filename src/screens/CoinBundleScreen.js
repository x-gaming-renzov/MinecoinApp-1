//CoinBundleScreen.js
import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Modal, StyleSheet, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';
import { useUser } from '../context/UserContext';
import { fetchCoinBundles } from '../config/firebase';
import CoinBundleCard from '../components/coins/CoinBundleCard';
import GoogleSignInButton from '../components/common/GoogleSignInButton';
import { ArrowLeft } from "lucide-react-native";

const CoinBundleScreen = () => {
  const navigation = useNavigation();
  const { isLoggedIn, signInWithGoogle } = useAuth();
  const { addCoins } = useUser();

  const [showSignIn, setShowSignIn] = useState(false);
  const [selectedBundle, setSelectedBundle] = useState(null);
  const [loading, setLoading] = useState(true);
  const [bundles, setBundles] = useState([]);

  useEffect(() => {
    loadBundles();
  }, []);

  const loadBundles = async () => {
    try {
      const bundlesData = await fetchCoinBundles();
      setBundles(bundlesData);
    } catch (error) {
      console.error('Failed to load bundles:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePurchase = (bundle) => {
    if (!isLoggedIn) {
      setSelectedBundle(bundle);
      setShowSignIn(true);
    } else {
      navigation.navigate('Checkout', { bundle });
    }
  };

  const handleSignIn = async () => {
    const success = await signInWithGoogle();
    if (success && selectedBundle) {
      setShowSignIn(false);
      navigation.navigate('Checkout', { bundle: selectedBundle });
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <ArrowLeft size={24} color="#7C3AED" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Get Coins</Text>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.contentContainer}>
          <Text style={styles.subtitle}>Select coin bundle to purchase</Text>
          
          {loading ? (
            <ActivityIndicator size="large" color="#7C3AED" style={styles.loader} />
          ) : (
            <View style={styles.bundlesList}>
              {bundles.map((bundle) => (
                <View key={bundle.id}>
                  <CoinBundleCard bundle={bundle} onPurchase={handlePurchase} />
                </View>
              ))}
            </View>
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
        </View>
      </ScrollView>

      <Modal
        visible={showSignIn}
        transparent
        animationType="fade"
        onRequestClose={() => setShowSignIn(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Sign In Required</Text>
            <Text style={styles.modalText}>
              Please sign in to continue your purchase
            </Text>
            <GoogleSignInButton
              onPress={handleSignIn}
              style={styles.signInButton}
            />
            <TouchableOpacity
              onPress={() => setShowSignIn(false)}
              style={styles.cancelButton}
            >
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
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
  },
  subtitle: {
    fontSize: 20,
    fontWeight: '500',
    color: '#1F2937',
    marginBottom: 24,
  },
  bundlesList: {
    gap: 16,
  },
  loader: {
    marginVertical: 32,
  },
  infoContainer: {
    marginTop: 32,
    gap: 12,
  },
  infoText: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 24,
    width: '90%',
    maxWidth: 340,
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 8,
  },
  modalText: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 24,
  },
  signInButton: {
    width: '100%',
    marginBottom: 12,
  },
  cancelButton: {
    padding: 8,
  },
  cancelText: {
    color: '#6B7280',
    fontSize: 16,
  },
});

export default CoinBundleScreen;