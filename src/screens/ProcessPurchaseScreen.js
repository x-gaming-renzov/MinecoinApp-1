// ProcessPurchaseScreen.js
import React, { useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const ProcessPurchaseScreen = ({ navigation, route }) => {
  const { bundle } = route.params;

  useEffect(() => {
    const processPurchase = async () => {
      try {
        await new Promise(resolve => setTimeout(resolve, 2000));
        navigation.replace('PaymentSuccess');
      } catch (error) {
        console.error('Purchase failed:', error);
        navigation.goBack();
      }
    };
    processPurchase();
  }, []);

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.content}>
          <ActivityIndicator size="large" color="#7C3AED" />
          <Text style={styles.processingText}>Processing your purchase...</Text>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  processingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#1F2937',
    textAlign: 'center',
    letterSpacing: 0.25,
    fontWeight: '500',
  },
});

export default ProcessPurchaseScreen;