import React from 'react';
import { View, Text, Modal, TouchableOpacity, StyleSheet } from 'react-native';

const PermissionsDialog = ({ visible, onRequestPermissions }) => (
  <Modal transparent visible={visible} animationType="fade">
    <View style={styles.overlay}>
      <View style={styles.dialog}>
        <Text style={styles.title}>Permissions Required</Text>
        <Text style={styles.message}>
          This app requires camera, location, microphone, and storage permissions to function properly.
        </Text>
        <TouchableOpacity style={styles.button} onPress={onRequestPermissions}>
          <Text style={styles.buttonText}>Grant Permissions</Text>
        </TouchableOpacity>
      </View>
    </View>
  </Modal>
);

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  dialog: {
    backgroundColor: '#121212',
    padding: 24,
    borderRadius: 16,
    width: '80%',
    alignItems: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#3aed76',
    marginBottom: 12,
  },
  message: {
    fontSize: 16,
    color: '#A1A1AA',
    marginBottom: 24,
    textAlign: 'center',
  },
  button: {
    backgroundColor: '#3aed76',
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 12,
  },
  buttonText: {
    color: '#0a0a0a',
    fontWeight: '700',
    fontSize: 16,
  },
});

export default PermissionsDialog;