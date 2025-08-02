import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Clipboard,
  Alert,
} from 'react-native';
import { useUser } from '../../context/UserContext';
import { colors } from '../../screens/theme';
import { Gift, Ticket } from 'lucide-react-native'; // Import professional icons

// Component for generating gift cards
const GiftCardGenerator = () => {
  const { balance, generateGiftCard, subtractBalance } = useUser();

  const [giftAmount, setGiftAmount] = useState('');
  const [generatedCode, setGeneratedCode] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleGenerate = async () => {
    if (isProcessing) return;
    setIsProcessing(true);

    const amount = parseInt(giftAmount);
    if (isNaN(amount) || amount < 50) {
      Alert.alert('Invalid Amount', 'Amount must be 50 coins or more.');
      setIsProcessing(false);
      return;
    }
    if (amount > balance) {
      Alert.alert('Insufficient Balance', 'You do not have enough balance to generate this gift card.');
      setIsProcessing(false);
      return;
    }

    try {
      const result = await generateGiftCard(amount);
      await subtractBalance(amount);
      setGeneratedCode(result);
      setGiftAmount('');
    } catch (error) {
      Alert.alert('Error', error.message || 'Could not generate gift card.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <View style={styles.sectionContainer}>
      <View style={styles.header}>
        <Gift size={22} color={colors.accent} />
        <Text style={styles.title}>Generate Gift Card</Text>
      </View>
      <Text style={styles.subtitle}>
        Create a gift code for a friend (5% tax applies).
      </Text>

      <TextInput
        style={styles.input}
        value={giftAmount}
        onChangeText={setGiftAmount}
        keyboardType="number-pad"
        placeholder="Enter amount (min 50)"
        placeholderTextColor={colors.mutedText}
        editable={!isProcessing}
      />

      <TouchableOpacity
        style={[styles.actionButton, (isProcessing || !giftAmount) && styles.buttonDisabled]}
        onPress={handleGenerate}
        disabled={isProcessing || !giftAmount}
      >
        <Text style={styles.buttonText}>
          {isProcessing ? 'Generating...' : 'Generate Code'}
        </Text>
      </TouchableOpacity>

      {generatedCode && (
        <View style={styles.codeContainer}>
          <Text style={styles.codeText}>
            Code: <Text style={{fontWeight: 'bold'}}>{generatedCode.code}</Text> (Value: {generatedCode.netAmount})
          </Text>
          <TouchableOpacity
            style={styles.copyButton}
            onPress={() => {
              Clipboard.setString(generatedCode.code);
              Alert.alert('Success', 'Gift code copied to clipboard!');
            }}
          >
            <Text style={styles.copyButtonText}>Copy</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

// Component for claiming gift codes
const GiftCodeClaimer = ({ addBalance }) => {
  const [claimCode, setClaimCode] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [claimResult, setClaimResult] = useState(null);
  const { claimGiftCode } = useUser();

  const handleClaim = async () => {
    if (isProcessing || !claimCode.trim()) return;
    setIsProcessing(true);
    setClaimResult(null);

    try {
      const result = await claimGiftCode(claimCode.trim());
      setClaimResult(result);
      if (result.success) {
        addBalance(result.amount);
        setClaimCode('');
      }
    } catch (error) {
      setClaimResult({ success: false, message: error.message || 'An unknown error occurred.' });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <View style={styles.sectionContainer}>
      <View style={styles.header}>
        <Ticket size={22} color={colors.accent} />
        <Text style={styles.title}>Claim Gift Code</Text>
      </View>
      <Text style={styles.subtitle}>Redeem a code to add coins to your balance.</Text>

      <TextInput
        style={styles.input}
        value={claimCode}
        onChangeText={setClaimCode}
        placeholder="Enter gift code"
        placeholderTextColor={colors.mutedText}
        autoCapitalize="characters"
        editable={!isProcessing}
      />

      <TouchableOpacity
        style={[styles.actionButton, (isProcessing || !claimCode.trim()) && styles.buttonDisabled]}
        onPress={handleClaim}
        disabled={isProcessing || !claimCode.trim()}
      >
        <Text style={styles.buttonText}>
          {isProcessing ? 'Claiming...' : 'Claim Code'}
        </Text>
      </TouchableOpacity>

      {claimResult && (
        <View
          style={[
            styles.resultContainer,
            claimResult.success ? styles.successResult : styles.failureResult,
          ]}
        >
          <Text style={[
              styles.resultText,
              claimResult.success ? styles.successText : styles.failureText,
            ]}
          >
            {claimResult.success
              ? `Success! ${claimResult.amount} coins added.`
              : `Failed: ${claimResult.message}`}
          </Text>
        </View>
      )}
    </View>
  );
};

// Main parent component
const AppEventsCard = () => {
  const { balance, addBalance } = useUser();

  return (
    <View style={styles.container}>
      <Text style={styles.balance}>Your Balance: {balance.toLocaleString()}</Text>
      <GiftCardGenerator />
      <GiftCodeClaimer addBalance={addBalance} />
    </View>
  );
};

// Styles updated to match the new theme
const styles = StyleSheet.create({
  container: {
    padding: 16,
  },
  balance: {
    color: colors.accent,
    fontSize: 20,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 24,
  },
  sectionContainer: {
    backgroundColor: colors.backgroundLight,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(58, 237, 118, 0.2)',
    marginBottom: 20, // Replaces the divider
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 8,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
    gap: 10,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.accent,
  },
  subtitle: {
    color: colors.mutedText,
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 16,
  },
  input: {
    backgroundColor: colors.background,
    borderRadius: 12, // Standardized
    borderWidth: 1,
    borderColor: colors.accent,
    color: '#FFFFFF',
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginBottom: 16,
    fontSize: 16,
    textAlign: 'center',
  },
  actionButton: {
    backgroundColor: colors.accent,
    paddingVertical: 14,
    borderRadius: 12, // Standardized
    alignItems: 'center',
    shadowColor: colors.accent,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 4,
    elevation: 5,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: colors.background,
    fontWeight: '600', // Standardized
    fontSize: 16,
  },
  codeContainer: {
    backgroundColor: colors.background,
    padding: 12,
    borderRadius: 12, // Standardized
    marginTop: 16,
    borderColor: colors.accent,
    borderWidth: 1,
    alignItems: 'center'
  },
  codeText: {
    color: colors.accent,
    fontSize: 16,
    marginBottom: 10,
    textAlign: 'center',
  },
  copyButton: {
    backgroundColor: colors.accent,
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  copyButtonText: {
    color: colors.background,
    fontWeight: 'bold',
  },
  resultContainer: {
    padding: 12,
    borderRadius: 12, // Standardized
    marginTop: 16,
    borderWidth: 1,
  },
  resultText: {
    textAlign: 'center',
    fontSize: 15,
    fontWeight: '600',
  },
  successResult: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    borderColor: colors.success,
  },
  failureResult: {
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    borderColor: colors.error,
  },
  successText: {
    color: colors.success,
  },
  failureText: {
    color: colors.error,
  },
});

export default AppEventsCard;