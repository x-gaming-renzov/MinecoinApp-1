import React, { useState, useEffect } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Modal, KeyboardAvoidingView, Platform, ActivityIndicator } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useNavigation } from "@react-navigation/native";
import { Check, User, Lock, AlertCircle } from "lucide-react-native";
import { useAuth } from "../../context/AuthContext";
import { useUser } from "../../context/UserContext";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../../config/firebase";

const SuccessModal = ({ visible, onClose, isUpdating = false }) => (
  <Modal transparent visible={visible} animationType="fade">
    <View style={styles.modalOverlay}>
      <View style={styles.modalContent}>
        <View style={styles.successIcon}>
          <Check size={28} color="#FFFFFF" />
        </View>
        <Text style={styles.modalTitle}>
          {isUpdating ? "Update Successful!" : "Verification Successful!"}
        </Text>
        <Text style={styles.modalDescription}>
          {isUpdating
            ? "Your Minecraft account has been successfully updated"
            : "Your Minecraft account has been successfully verified"}
        </Text>
        <TouchableOpacity style={styles.modalButton} onPress={onClose}>
          <Text style={styles.modalButtonText}>Continue</Text>
        </TouchableOpacity>
      </View>
    </View>
  </Modal>
);

const ValidationMessage = ({ message, type }) => (
  <View style={styles.validationContainer}>
    <AlertCircle size={16} color={type === 'error' ? '#EF4444' : '#10B981'} />
    <Text style={[
      styles.validationText,
      type === 'error' ? styles.errorText : styles.successText
    ]}>
      {message}
    </Text>
  </View>
);

const MCVerificationForm = () => {
  const navigation = useNavigation();
  const { user } = useAuth();
  const { updateMcCredentials, loadFirestoreData } = useUser();
  const [isLoading, setIsLoading] = useState(true);

  const [formState, setFormState] = useState({
    credentials: {
      username: "",
      password: "",
    },
    uiState: {
      isEditing: false,
      showSuccess: false,
      isSubmitting: false,
      secureTextEntry: true,
      hasStoredCredentials: false,
      verificationComplete: false
    },
    validation: {
      errors: {},
      messages: {}
    }
  });

  useEffect(() => {
    const checkStoredCredentials = async () => {
      setIsLoading(true);
      try {
        const userRef = doc(db, "users", user.email);
        const userDoc = await getDoc(userRef);
        
        if (userDoc.exists() && userDoc.data().mcUsername) {
          setFormState(prev => ({
            ...prev,
            credentials: {
              username: userDoc.data().mcUsername,
              password: userDoc.data().mcPassword
            },
            uiState: {
              ...prev.uiState,
              hasStoredCredentials: true,
              isEditing: false,
              verificationComplete: true
            }
          }));
        }
      } catch (error) {
        console.error("Error checking credentials:", error);
      } finally {
        setIsLoading(false);
      }
    };

    checkStoredCredentials();
  }, [user.email]);

  const verifyPlayerCredentials = async (username, password, isEditing = false) => {
    try {
      const playerRef = doc(db, "players", username);
      const playerDoc = await getDoc(playerRef);

      if (isEditing) {
        return playerDoc.exists() ? { id: username, ...playerDoc.data() } : null;
      }

      if (playerDoc.exists() && playerDoc.data().password === password) {
        return { id: username, ...playerDoc.data() };
      }
      return null;
    } catch (error) {
      console.error("Error verifying player:", error);
      return null;
    }
  };

  const handleSubmit = async () => {
    if (formState.uiState.isSubmitting) return;

    setFormState(prev => ({
      ...prev,
      uiState: { ...prev.uiState, isSubmitting: true }
    }));

    try {
      const { username, password } = formState.credentials;

      const playerData = await verifyPlayerCredentials(
        username.trim(),
        password.trim(),
        formState.uiState.isEditing
      );

      if (!playerData) {
        setFormState(prev => ({
          ...prev,
          validation: {
            ...prev.validation,
            errors: { submit: "Invalid credentials. Please try again." }
          },
          uiState: { ...prev.uiState, isSubmitting: false }
        }));
        return;
      }

      const success = await updateMcCredentials(
        username.trim(),
        password.trim(),
        playerData.coinBalance || 0
      );

      if (success) {
        setFormState(prev => ({
          ...prev,
          uiState: {
            ...prev.uiState,
            showSuccess: true,
            hasStoredCredentials: true,
            verificationComplete: true,
            isSubmitting: false
          }
        }));

        await loadFirestoreData();
      } else {
        setFormState(prev => ({
          ...prev,
          validation: {
            ...prev.validation,
            errors: { submit: "Update failed. Please try again." }
          },
          uiState: { ...prev.uiState, isSubmitting: false }
        }));
      }
    } catch (error) {
      setFormState(prev => ({
        ...prev,
        validation: {
          ...prev.validation,
          errors: { submit: "An error occurred. Please try again." }
        },
        uiState: { ...prev.uiState, isSubmitting: false }
      }));
    }
  };

  const handleModalClose = () => {
    setFormState(prev => ({
      ...prev,
      uiState: {
        ...prev.uiState,
        showSuccess: false,
        hasStoredCredentials: true,
        verificationComplete: true,
        isEditing: false
      }
    }));
  };

  if (isLoading) {
    return (
      <View style={[styles.container, styles.loadingContainer]}>
        <ActivityIndicator size="large" color="#7C3AED" />
      </View>
    );
  }

  if (formState.uiState.verificationComplete && !formState.uiState.isEditing) {
    return (
      <View style={styles.container}>
        <View style={styles.verifiedCard}>
          <View style={styles.verifiedIcon}>
            <Check size={28} color="#FFFFFF" />
          </View>
          <Text style={styles.verifiedTitle}>Account Verified</Text>
          <Text style={styles.verifiedUsername}>{formState.credentials.username}</Text>
          <Text style={styles.verifiedDescription}>
            Your Minecraft account has been verified and is ready to use
          </Text>
          <TouchableOpacity 
            style={styles.editButton}
            onPress={() => setFormState(prev => ({
              ...prev,
              uiState: { ...prev.uiState, isEditing: true }
            }))}
          >
            <Text style={styles.editButtonText}>Edit Account Details</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const editableUsername = !formState.uiState.hasStoredCredentials;

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.container}
    >
      <SuccessModal
        visible={formState.uiState.showSuccess}
        onClose={handleModalClose}
        isUpdating={formState.uiState.isEditing}
      />

      <View style={styles.formContent}>
        <Text style={styles.title}>Minecraft Account</Text>
        <Text style={styles.subtitle}>
          {formState.uiState.isEditing 
            ? "Update your account details" 
            : "Enter your account details"}
        </Text>

        <View style={styles.formGroup}>
          <View style={[
            styles.inputWrapper,
            formState.validation.errors.username && styles.inputError
          ]}>
            <View style={styles.inputContent}>
              <User size={20} color="#7C3AED" />
              <TextInput
                style={styles.input}
                placeholder="Minecraft username"
                placeholderTextColor="#6B7280"
                value={formState.credentials.username}
                onChangeText={(text) => setFormState(prev => ({
                  ...prev,
                  credentials: { ...prev.credentials, username: text },
                  validation: {
                    ...prev.validation,
                    errors: { ...prev.validation.errors, username: "" }
                  }
                }))}
                editable={editableUsername}
                autoCapitalize="none"
              />
              {!editableUsername && (
                <Lock size={20} color="#9CA3AF" style={styles.lockIcon} />
              )}
            </View>
          </View>

          {formState.validation.errors.username && (
            <ValidationMessage 
              message={formState.validation.errors.username} 
              type="error" 
            />
          )}

          <View style={[
            styles.inputWrapper,
            formState.validation.errors.password && styles.inputError
          ]}>
            <View style={styles.inputContent}>
              <Lock size={20} color="#7C3AED" />
              <TextInput
                style={styles.input}
                placeholder="Minecraft password"
                placeholderTextColor="#6B7280"
                secureTextEntry={formState.uiState.secureTextEntry}
                value={formState.credentials.password}
                onChangeText={(text) => setFormState(prev => ({
                  ...prev,
                  credentials: { ...prev.credentials, password: text },
                  validation: {
                    ...prev.validation,
                    errors: { ...prev.validation.errors, password: "" }
                  }
                }))}
              />
              <TouchableOpacity 
                onPress={() => setFormState(prev => ({
                  ...prev,
                  uiState: {
                    ...prev.uiState,
                    secureTextEntry: !prev.uiState.secureTextEntry
                  }
                }))}
                style={styles.showButton}
              >
                <Text style={styles.showButtonText}>
                  {formState.uiState.secureTextEntry ? "Show" : "Hide"}
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {formState.validation.errors.password && (
            <ValidationMessage 
              message={formState.validation.errors.password} 
              type="error" 
            />
          )}
        </View>

        {formState.validation.errors.submit && (
          <ValidationMessage 
            message={formState.validation.errors.submit} 
            type="error" 
          />
        )}

        <TouchableOpacity
          style={[
            styles.submitButton, 
            formState.uiState.isSubmitting && styles.submitButtonDisabled
          ]}
          onPress={handleSubmit}
          disabled={formState.uiState.isSubmitting}
        >
          <Text style={styles.submitButtonText}>
            {formState.uiState.isSubmitting 
              ? "Processing..." 
              : formState.uiState.isEditing 
                ? "Update Account" 
                : "Verify Account"}
          </Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  formContent: {
    padding: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#6B7280',
    marginBottom: 32,
  },
  formGroup: {
    gap: 16,
    marginBottom: 24,
  },
  inputWrapper: {
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    overflow: 'hidden',
  },
  inputContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#1F2937',
    padding: 0,
  },
  showButton: {
    paddingHorizontal: 8,
  },
  showButtonText: {
    color: '#7C3AED',
    fontSize: 14,
    fontWeight: '500',
  },
  
  submitButton: {
    backgroundColor: '#7C3AED',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  submitButtonDisabled: {
    opacity: 0.7,
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  inputError: {
    borderWidth: 1,
    borderColor: '#EF4444',
  },
  verifiedCard: {
    margin: 24,
    padding: 32,
    borderRadius: 20,
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    elevation: 2,
    shadowColor: '#7C3AED',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  verifiedIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#10B981',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  verifiedTitle: {
    fontSize: 24,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 8,
  },
  verifiedUsername: {
    fontSize: 18,
    color: '#4B5563',
    marginBottom: 16,
  },
  verifiedDescription: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 24,
  },
  editButton: {
    width: '100%',
    borderWidth: 1,
    borderColor: '#7C3AED',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  editButtonText: {
    color: '#7C3AED',
    fontSize: 16,
    fontWeight: '500',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 24,
    width: '100%',
    maxWidth: 320,
    alignItems: 'center',
  },
  successIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#10B981',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 8,
    textAlign: 'center',
  },
  modalDescription: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 24,
  },
  modalButton: {
    width: '100%',
    backgroundColor: '#7C3AED',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  modalButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '500',
  },
  validationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    gap: 8,
  },
  validationText: {
    fontSize: 14,
  },
  errorText: {
    color: '#EF4444',
  },
  successText: {
    color: '#10B981',
  },
});

export default MCVerificationForm