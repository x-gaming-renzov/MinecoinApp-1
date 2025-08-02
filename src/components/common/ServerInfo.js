import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Clipboard,
  Platform,
  Animated,
} from 'react-native';
import { Copy, Check, X } from 'lucide-react-native';
import { colors } from '../../screens/theme'; // Import theme colors

const SERVER_INFO = {
  ip: 'play.xgaming.club',
  port: '19132',
};

const ServerInfo = ({ visible, onClose }) => {
  const [copiedJava, setCopiedJava] = useState(false);
  const [copiedBedrock, setCopiedBedrock] = useState(false);
  const scale = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.spring(scale, {
        toValue: 1,
        useNativeDriver: true,
        bounciness: 8,
        speed: 12,
      }).start();
    } else {
      Animated.timing(scale, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }).start();
    }
  }, [visible, scale]);

  const handleCopy = async (text, type) => {
    try {
      if (Platform.OS === 'web') {
        await navigator.clipboard.writeText(text);
      } else {
        await Clipboard.setString(text);
      }

      if (type === 'java') {
        setCopiedJava(true);
        setTimeout(() => setCopiedJava(false), 2000);
      } else {
        setCopiedBedrock(true);
        setTimeout(() => setCopiedBedrock(false), 2000);
      }
    } catch (error) {
      console.error('Error copying to clipboard:', error);
    }
  };

  const animatedStyle = {
    transform: [{ scale }],
  };

  return (
    <Modal
      animationType="none"
      transparent
      visible={visible}
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <Animated.View style={[styles.container, animatedStyle]}>
          <View style={styles.header}>
            <Text style={styles.title}>Server Details</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <X size={24} color={colors.mutedText} />
            </TouchableOpacity>
          </View>

          {/* Java Edition */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Java Edition</Text>
            <View style={styles.infoRow}>
              <Text style={styles.label}>IP Address</Text>
              <View style={styles.copyRow}>
                <Text style={styles.value}>{SERVER_INFO.ip}</Text>
                <TouchableOpacity
                  onPress={() => handleCopy(SERVER_INFO.ip, 'java')}
                  style={styles.copyBtn}
                  activeOpacity={0.7}
                >
                  {copiedJava ? (
                    <Check size={20} color={colors.success} />
                  ) : (
                    <Copy size={20} color={colors.accent} />
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </View>

          {/* Bedrock Edition */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>PE / Bedrock Edition</Text>
            <View style={styles.infoRow}>
              <Text style={styles.label}>IP Address</Text>
              <View style={styles.copyRow}>
                <Text style={styles.value}>{SERVER_INFO.ip}</Text>
                <TouchableOpacity
                  onPress={() => handleCopy(SERVER_INFO.ip, 'bedrock')}
                  style={styles.copyBtn}
                  activeOpacity={0.7}
                >
                  {copiedBedrock ? (
                    <Check size={20} color={colors.success} />
                  ) : (
                    <Copy size={20} color={colors.accent} />
                  )}
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.infoRow}>
              <Text style={styles.label}>Port</Text>
              <Text style={styles.value}>{SERVER_INFO.port}</Text>
            </View>
          </View>
          <View style={styles.divider} />
        </Animated.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  container: {
    backgroundColor: colors.backgroundLight,
    borderRadius: 24,
    paddingVertical: 28,
    paddingHorizontal: 32,
    width: '100%',
    maxWidth: 400,
    shadowColor: colors.accent,
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 12,
    borderWidth: 1,
    borderColor: colors.accent,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 28,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: colors.accent,
  },
  closeBtn: {
    padding: 8,
  },
  section: {
    marginBottom: 28,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.accent,
    marginBottom: 18,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.mutedText,
  },
  value: {
    fontSize: 16,
    fontWeight: '600',
    color: '#E0E0E0', // A bright neutral color for readability
  },
  copyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  copyBtn: {
    padding: 8,
  },
  divider: {
    height: 1,
    backgroundColor: colors.accent,
    marginVertical: 14,
    opacity: 0.5,
  },
});

export default ServerInfo;