// ServerInfo.js
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, Clipboard } from 'react-native';
import { Copy, Check, X } from 'lucide-react-native';

const SERVER_INFO = {
  ip: 'play.xgaming.club',
  port: '19132'
};

const ServerInfo = ({ visible, onClose }) => {
  const [copiedJava, setCopiedJava] = React.useState(false);
  const [copiedBedrock, setCopiedBedrock] = React.useState(false);

  const handleCopy = async (text, type) => {
    try {
      await Clipboard.setString(text);
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

  return (
    <Modal
      animationType="fade"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.mainTitle}>Server Details</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <X size={20} color="#6B7280" />
            </TouchableOpacity>
          </View>

          {/* Java Edition Section */}
          <View style={styles.sectionContainer}>
            <Text style={styles.sectionTitle}>Java Edition</Text>
            <View style={styles.detailsContainer}>
              <View style={styles.detail}>
                <Text style={styles.label}>IP Address</Text>
                <View style={styles.valueContainer}>
                  <Text style={styles.value}>{SERVER_INFO.ip}</Text>
                  <TouchableOpacity 
                    style={styles.copyButton} 
                    onPress={() => handleCopy(SERVER_INFO.ip, 'java')}
                  >
                    {copiedJava ? (
                      <Check size={18} color="#10B981" />
                    ) : (
                      <Copy size={18} color="#7C3AED" />
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </View>

          {/* Bedrock Edition Section */}
          <View style={[styles.sectionContainer, styles.lastSection]}>
            <Text style={styles.sectionTitle}>PE/Bedrock Edition</Text>
            <View style={styles.detailsContainer}>
              <View style={styles.detail}>
                <Text style={styles.label}>IP Address</Text>
                <View style={styles.valueContainer}>
                  <Text style={styles.value}>{SERVER_INFO.ip}</Text>
                  <TouchableOpacity 
                    style={styles.copyButton} 
                    onPress={() => handleCopy(SERVER_INFO.ip, 'bedrock')}
                  >
                    {copiedBedrock ? (
                      <Check size={18} color="#10B981" />
                    ) : (
                      <Copy size={18} color="#7C3AED" />
                    )}
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.divider} />

              <View style={styles.detail}>
                <Text style={styles.label}>Port</Text>
                <Text style={styles.value}>{SERVER_INFO.port}</Text>
              </View>
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.35)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    width: '100%',
    maxWidth: 340,
    shadowColor: '#7C3AED', // Match app theme
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 5,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  closeButton: {
    padding: 4,
  },
  mainTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1F2937',
  },
  sectionContainer: {
    marginBottom: 16,
  },
  lastSection: {
    marginBottom: 0,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#4B5563',
    marginBottom: 8,
  },
  detailsContainer: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 12,
  },
  detail: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  label: {
    fontSize: 14,
    color: '#4B5563',
    fontWeight: '500',
  },
  valueContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  value: {
    fontSize: 14,
    color: '#7C3AED',
    fontWeight: '500',
  },
  copyButton: {
    padding: 4,
  },
  divider: {
    height: 1,
    backgroundColor: '#E5E7EB',
    marginVertical: 8,
  },
});

export default ServerInfo;