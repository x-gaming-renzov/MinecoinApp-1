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

// Component for each section header
const SectionHeader = ({ title }) => (
  <Text style={styles.title}>{title}</Text>
);

const GiftCardGenerator = () => {
  const { balance, generateGiftCard, subtractBalance } = useUser();

  const [giftAmount, setGiftAmount] = useState('');
  const [generatedCode, setGeneratedCode] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleGenerate = async () => {
    if (isProcessing) return;
    setIsProcessing(true);

    const amount = parseInt(giftAmount);
    if (!amount || isNaN(amount) || amount < 1) {
      Alert.alert('Invalid Amount', 'Please enter a valid amount');
      setIsProcessing(false);
      return;
    }
    if (amount < 50) {
      Alert.alert('Amount must be 50 or greater than 50 coins !!');
      setIsProcessing(false);
      return;
    }
    if (amount > balance) {
      Alert.alert('Insufficient Balance', 'You do not have enough balance');
      setIsProcessing(false);
      return;
    }

    setIsGenerating(true);
    try {
      const result = await generateGiftCard(amount);
      await subtractBalance(amount);
      setGeneratedCode(result);
      setGiftAmount('');
    } catch (error) {
      Alert.alert('Error', error.message);
    } finally {
      setIsGenerating(false);
      setIsProcessing(false);
    }
  };

  return (
    <View style={styles.sectionContainer}>
      <SectionHeader title="🎁 Generate Gift Card" />
      <Text style={styles.subtitle}>
        Create gift code (5% tax deducted). Example: 100 → 95
      </Text>

      <TextInput
        style={styles.input}
        value={giftAmount}
        onChangeText={setGiftAmount}
        keyboardType="number-pad"
        placeholder="Enter amount"
        placeholderTextColor="#6B7280"
        editable={!isGenerating && !isProcessing}
      />

      <TouchableOpacity
        style={[styles.actionButton, (isGenerating || isProcessing) && styles.buttonDisabled]}
        onPress={handleGenerate}
        disabled={isGenerating || isProcessing || !giftAmount}
      >
        <Text style={styles.actionButtonText}>
          {isGenerating ? 'Generating...' : 'Generate Gift Code'}
        </Text>
      </TouchableOpacity>

      {generatedCode && (
        <View style={styles.codeContainer}>
          <Text style={styles.codeText}>
            Gift Code: {generatedCode.code} (Amount: {generatedCode.netAmount})
          </Text>
          <TouchableOpacity
            style={styles.copyButton}
            onPress={() => {
              Clipboard.setString(generatedCode.code);
              Alert.alert('Success', 'Copied to clipboard!');
            }}
          >
            <Text style={styles.copyButtonText}>Copy</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

const GiftCodeClaimer = ({ addBalance }) => {
  const [claimCode, setClaimCode] = useState('');
  const [isClaiming, setIsClaiming] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [claimResult, setClaimResult] = useState(null);
  const { claimGiftCode } = useUser();

  const handleClaim = async () => {
    if (isProcessing) return;
    setIsProcessing(true);

    if (!claimCode.trim()) {
      Alert.alert('Invalid Code', 'Please enter a valid gift code');
      setIsProcessing(false);
      return;
    }

    setIsClaiming(true);
    try {
      const result = await claimGiftCode(claimCode.trim());
      setClaimResult(result);
      if (result.success) {
        setClaimCode('');
        addBalance(result.amount);
      }
    } catch (error) {
      setClaimResult({ success: false, message: error.message });
    } finally {
      setIsClaiming(false);
      setIsProcessing(false);
    }
  };

  return (
    <View style={styles.sectionContainer}>
      <SectionHeader title="🎟️ Claim Gift Code" />
      <Text style={styles.subtitle}>Redeem a gift code to add balance</Text>

      <TextInput
        style={styles.input}
        value={claimCode}
        onChangeText={setClaimCode}
        placeholder="Enter gift code"
        placeholderTextColor="#6B7280"
        autoCapitalize="characters"
        editable={!isClaiming && !isProcessing}
      />

      <TouchableOpacity
        style={[styles.actionButton, (isClaiming || isProcessing) && styles.buttonDisabled]}
        onPress={handleClaim}
        disabled={isClaiming || isProcessing || !claimCode.trim()}
      >
        <Text style={styles.actionButtonText}>
          {isClaiming ? 'Claiming...' : 'Claim Gift Code'}
        </Text>
      </TouchableOpacity>

      {claimResult && (
        <View
          style={[
            styles.resultContainer,
            claimResult.success ? styles.successResult : styles.failureResult,
          ]}
        >
          <Text style={styles.resultText}>
            {claimResult.success
              ? `🎉 Success! ${claimResult.amount} added.`
              : `❌ Failed: ${claimResult.message}`}
          </Text>
        </View>
      )}
    </View>
  );
};

const AppEventsCard = () => {
  const { balance, subtractBalance, addBalance, user = {} } = useUser();

  return (
    <View style={styles.container}>
      <Text style={styles.balance}>Balance: {balance}</Text>

      <GiftCardGenerator
        balance={balance}
        subtractBalance={subtractBalance}
        user={user}
      />

      <View style={styles.divider} />

      <GiftCodeClaimer
        addBalance={addBalance}
        user={user}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#000000',
    borderRadius: 20,
    padding: 20,
    margin: 16,
    borderWidth: 2,
    borderColor: '#3aed76',
    shadowColor: '#3aed76',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 12,
    elevation: 10,
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#3aed76',
    textAlign: 'center',
    marginBottom: 10,
    letterSpacing: 1.2,
  },
  balance: {
    color: '#3aed76',
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 20,
  },
  subtitle: {
    color: '#6B7280',
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 12,
  },
  sectionContainer: {
    marginBottom: 24,
    backgroundColor: '#0a0a0a',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: '#3aed76',
  },
  input: {
    backgroundColor: '#121212',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#3aed76',
    color: '#ffffff',
    padding: 12,
    marginBottom: 14,
    fontSize: 16,
  },
  actionButton: {
    backgroundColor: '#3aed76',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 10,
  },
  buttonDisabled: {
    backgroundColor: '#3aed76aa',
  },
  actionButtonText: {
    color: '#000000',
    fontWeight: 'bold',
    fontSize: 16,
  },
  divider: {
    height: 1,
    backgroundColor: '#3aed76',
    marginVertical: 20,
    opacity: 0.4,
  },
  codeContainer: {
    backgroundColor: '#121212',
    padding: 12,
    borderRadius: 8,
    marginTop: 14,
    borderColor: '#3aed76',
    borderWidth: 1,
  },
  codeText: {
    color: '#3aed76',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
    textAlign: 'center',
  },
  copyButton: {
    backgroundColor: '#3aed76',
    borderRadius: 8,
    paddingVertical: 8,
    alignItems: 'center',
  },
  copyButtonText: {
    color: '#000000',
    fontWeight: 'bold',
  },
  resultContainer: {
    padding: 12,
    borderRadius: 8,
    marginTop: 10,
  },
  successResult: {
    backgroundColor: '#1e4023',
    borderColor: '#3aed76',
    borderWidth: 1,
  },
  failureResult: {
    backgroundColor: '#401e1e',
    borderColor: '#ff4c4c',
    borderWidth: 1,
  },
  resultText: {
    textAlign: 'center',
    fontSize: 18,
    fontWeight: '600',
    color: '#3aed76',
    marginTop: 10,
  },
});

export default AppEventsCard;