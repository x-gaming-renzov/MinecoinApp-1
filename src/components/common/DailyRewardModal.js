import React, { useEffect, useRef } from 'react';
import { Modal, View, Text, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import { useUser } from '../../context/UserContext';
import { colors } from '../../screens/theme';

const DailyRewardModal = () => {
  const { dailyRewardInfo, dismissDailyReward } = useUser();
  const scaleAnim = useRef(new Animated.Value(0.9)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Jab bhi modal dikhana ho, animation start karein
    if (dailyRewardInfo.show) {
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1,
          useNativeDriver: true,
          tension: 50,
          friction: 7,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [dailyRewardInfo.show]);

  // Modal band karne ka function
  const handleClose = () => {
    Animated.timing(opacityAnim, {
      toValue: 0,
      duration: 200,
      useNativeDriver: true,
    }).start(() => {
      dismissDailyReward(); // Context se state reset karein
      scaleAnim.setValue(0.9); // Animation ko reset karein
    });
  };

  return (
    <Modal
      transparent
      visible={dailyRewardInfo.show}
      onRequestClose={handleClose}
      animationType="none"
    >
      <Animated.View style={[styles.overlay, { opacity: opacityAnim }]}>
        <Animated.View style={[styles.modalContainer, { transform: [{ scale: scaleAnim }] }]}>
          <Text style={styles.icon}>🎉</Text>
          <Text style={styles.title}>Daily Login Reward!</Text>
          <Text style={styles.message}>
            Aapko aaj login karne ke liye <Text style={styles.amountText}>{dailyRewardInfo.amount}</Text> coins mile hain!
          </Text>
          <TouchableOpacity
            style={styles.claimButton}
            onPress={handleClose}
            activeOpacity={0.8}
          >
            <Text style={styles.claimButtonText}>Awesome!</Text>
          </TouchableOpacity>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    backgroundColor: colors.backgroundLight,
    borderRadius: 24,
    padding: 24,
    width: '85%',
    maxWidth: 340,
    alignItems: 'center',
    shadowColor: colors.accent,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 24,
    elevation: 24,
    borderWidth: 1,
    borderColor: colors.accent,
  },
  icon: {
    fontSize: 48,
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.accent,
    marginBottom: 8,
    textAlign: 'center',
  },
  message: {
    fontSize: 16,
    color: colors.mutedText,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 24,
  },
  amountText: {
    fontWeight: 'bold',
    color: colors.accent,
  },
  claimButton: {
    backgroundColor: colors.accent,
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 16,
    width: '100%',
    alignItems: 'center',
    shadowColor: colors.accent,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  claimButtonText: {
    color: colors.background,
    fontSize: 18,
    fontWeight: '600',
  },
});

export default DailyRewardModal;