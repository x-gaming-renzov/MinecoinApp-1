import React from 'react';
import { View, Text, ScrollView, StyleSheet, Animated } from 'react-native';
import { useUser } from '../../context/UserContext';
import { useAuth } from '../../context/AuthContext';
import { format } from 'date-fns';
import { PlusCircle, MinusCircle, Wallet, TrendingUp, TrendingDown } from 'lucide-react-native';
import { colors } from '../../screens/theme';

const TransactionList = () => {
  const { transactions } = useUser();
  const { isLoggedIn } = useAuth();

  if (!isLoggedIn) {
    return (
      <View style={styles.container}>
        <View style={styles.emptyStateCard}>
          <Wallet size={48} color={colors.accent} style={styles.emptyIcon} />
          <Text style={styles.emptyStateTitle}>Sign In Required</Text>
          <Text style={styles.emptyStateText}>
            Please sign in to view your transaction history
          </Text>
        </View>
      </View>
    );
  }

  if (!transactions || transactions.length === 0) {
    return (
      <View style={styles.container}>
        <View style={styles.emptyStateCard}>
          <TrendingUp size={48} color={colors.mutedText} style={styles.emptyIcon} />
          <Text style={styles.emptyStateTitle}>No Transactions Yet</Text>
          <Text style={styles.emptyStateText}>
            Your transaction history will appear here once you start playing
          </Text>
        </View>
      </View>
    );
  }

  const formatTransaction = (transaction) => {
    const title =
      transaction.type === 'purchase'
        ? `${transaction.details?.title || 'Game Purchase'}`
        : 'Coins Added';
    const amount =
      transaction.type === 'purchase'
        ? `-${Math.abs(transaction.amount)}`
        : `+${transaction.amount}`;

    let rawDate = transaction.timestamp;
    if (typeof rawDate === 'object' && rawDate?.seconds) {
      rawDate = rawDate.seconds * 1000;
    }
    const date =
      format(new Date(rawDate), 'MMM dd, yyyy') ||
      format(new Date(transaction.timestamp), 'MMM dd, yyyy');

    return { title, amount, date, type: transaction.type };
  };

  return (
    <View style={styles.container}>
      <View style={styles.headerContainer}>
        <Text style={styles.heading}>Transaction History</Text>
        <View style={styles.headerUnderline} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {[...transactions].reverse().map((transaction, index) => {
          const { title, amount, date, type } = formatTransaction(transaction);
          const isCredit = type !== 'purchase';

          return (
            <Animated.View key={transaction.id || index} style={styles.transactionCard}>
              {/* Glow effect for the card */}
              <View style={[
                styles.cardGlow,
                isCredit ? styles.creditGlow : styles.debitGlow
              ]} />

              <View style={styles.transactionContent}>
                {/* Enhanced Icon Container */}
                <View style={[
                  styles.iconContainer,
                  isCredit ? styles.creditIconBg : styles.debitIconBg,
                ]}>
                  <View style={styles.iconInner}>
                    {isCredit ? (
                      <TrendingUp size={20} color={colors.accent} />
                    ) : (
                      <TrendingDown size={20} color={colors.error} />
                    )}
                  </View>
                </View>

                {/* Transaction Details */}
                <View style={styles.detailsContainer}>
                  <Text style={styles.transactionTitle} numberOfLines={1} ellipsizeMode="tail">
                    {title}
                  </Text>
                  <Text style={styles.transactionDate}>{date}</Text>
                </View>

                {/* Amount with enhanced styling */}
                <View style={styles.amountContainer}>
                  <Text style={[
                    styles.amount,
                    isCredit ? styles.creditAmount : styles.debitAmount,
                  ]}>
                    {amount}
                  </Text>
                  <Text style={[
                    styles.coinLabel,
                    isCredit ? styles.creditCoinLabel : styles.debitCoinLabel,
                  ]}>
                    coins
                  </Text>
                </View>
              </View>

              {/* Transaction type indicator */}
              <View style={[
                styles.typeIndicator,
                isCredit ? styles.creditIndicator : styles.debitIndicator
              ]} />
            </Animated.View>
          );
        })}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  headerContainer: {
    marginHorizontal: 16,
    marginBottom: 24,
  },
  heading: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.accent,
    marginBottom: 8,
    textShadowColor: colors.accentGlow,
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 8,
  },
  headerUnderline: {
    height: 3,
    backgroundColor: colors.accent,
    borderRadius: 2,
    width: '40%',
    shadowColor: colors.accent,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 4,
    elevation: 4,
  },
  scrollContent: {
    paddingBottom: 24,
  },
  transactionCard: {
    backgroundColor: colors.backgroundLight,
    borderRadius: 16,
    marginHorizontal: 16,
    marginBottom: 16,
    paddingVertical: 18,
    paddingHorizontal: 20,
    borderWidth: 1,
    borderColor: colors.border,
    position: 'relative',
    overflow: 'hidden',
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 8,
  },
  cardGlow: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 2,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
  },
  creditGlow: {
    backgroundColor: colors.accent,
    shadowColor: colors.accent,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 8,
    elevation: 4,
  },
  debitGlow: {
    backgroundColor: colors.error,
    shadowColor: colors.error,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 8,
    elevation: 4,
  },
  transactionContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    width: 52,
    height: 52,
    borderRadius: 26,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
  },
  creditIconBg: {
    backgroundColor: colors.accentGlow,
    borderColor: colors.accent,
  },
  debitIconBg: {
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    borderColor: colors.error,
  },
  iconInner: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  detailsContainer: {
    flex: 1,
    marginLeft: 16,
  },
  transactionTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  transactionDate: {
    fontSize: 13,
    color: colors.mutedText,
    fontWeight: '500',
  },
  amountContainer: {
    alignItems: 'flex-end',
    minWidth: 100,
  },
  amount: {
    fontSize: 18,
    fontWeight: '700',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  creditAmount: {
    color: colors.accent,
    textShadowColor: colors.accentGlow,
  },
  debitAmount: {
    color: colors.error,
    textShadowColor: 'rgba(239, 68, 68, 0.3)',
  },
  coinLabel: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: 2,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  creditCoinLabel: {
    color: colors.accent,
  },
  debitCoinLabel: {
    color: colors.error,
  },
  typeIndicator: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    width: 4,
    borderTopRightRadius: 16,
    borderBottomRightRadius: 16,
  },
  creditIndicator: {
    backgroundColor: colors.accent,
  },
  debitIndicator: {
    backgroundColor: colors.error,
  },
  emptyStateCard: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
    marginHorizontal: 16,
    backgroundColor: colors.backgroundLight,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
  },
  emptyIcon: {
    marginBottom: 16,
    opacity: 0.8,
  },
  emptyStateTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyStateText: {
    fontSize: 15,
    color: colors.mutedText,
    textAlign: 'center',
    lineHeight: 22,
    fontWeight: '500',
  },
});

export default TransactionList;