// PaymentSuccessScreen.js
import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Check } from 'lucide-react-native';

const PaymentSuccessScreen = () => {
  const navigation = useNavigation();

  useEffect(() => {
    const timer = setTimeout(() => {
      navigation.navigate('Main');
    }, 2000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <View style={styles.container}>
      <View style={styles.successIcon}>
        <Check size={32} color="#FFFFFF" />
      </View>
      <Text style={styles.successText}>Payment Successful!</Text>
      <Text style={styles.redirectText}>Redirecting to home...</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0a0a0a',
  },
  successIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#22C55E',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  successText: {
    fontSize: 24,
    fontWeight: '600',
    color: '#22C55E',
    marginBottom: 8,
    letterSpacing: 0.5,
  },
  redirectText: {
    fontSize: 16,
    color: '#6B7280',
    letterSpacing: 0.25,
  },
});

export default PaymentSuccessScreen;
