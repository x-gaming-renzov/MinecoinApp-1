import React from 'react';
import { View, Text, ScrollView, StyleSheet, Animated } from 'react-native';
import { useUser } from '../../context/UserContext';
import { useAuth } from '../../context/AuthContext';
import { format } from 'date-fns';
import { PlusCircle, MinusCircle } from 'lucide-react-native';

const TransactionList = () => {
  const { transactions } = useUser();
  const { isLoggedIn } = useAuth();

  if (!isLoggedIn) {
    return (
      <View style={styles.container}>
        <View style={styles.emptyStateCard}>
          <Text style={styles.emptyStateText}>
            Please sign in to view your transactions
          </Text>
        </View>
      </View>
    );
  }

  if (!transactions || transactions.length === 0) {
    return (
      <View style={styles.container}>
        <View style={styles.emptyStateCard}>
          <Text style={styles.emptyStateText}>No transactions yet</Text>
        </View>
      </View>
    );
  }

  const formatTransaction = (transaction) => {
    const title =
      transaction.type === 'purchase'
        ? `Purchase: ${transaction.details?.title || 'Game Asset'}`
        : 'Added Coins';
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
      <Text style={styles.heading}>Transaction History</Text>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {[...transactions].reverse().map((transaction, index) => {
          const { title, amount, date, type } = formatTransaction(transaction);
          return (
            <Animated.View key={transaction.id || index} style={styles.transactionCard}>
              <View style={styles.transactionContent}>
                <View
                  style={[
                    styles.iconContainer,
                    type === 'purchase' ? styles.redIconBg : styles.greenIconBg,
                  ]}
                >
                  {type === 'purchase' ? (
                    <MinusCircle size={24} color="#EF4444" />
                  ) : (
                    <PlusCircle size={24} color="#10B981" />
                  )}
                </View>
                <View style={styles.detailsContainer}>
                  <Text style={styles.transactionTitle} numberOfLines={1} ellipsizeMode="tail">
                    {title}
                  </Text>
                  <Text style={styles.transactionDate}>{date}</Text>
                </View>
                <Text
                  style={[
                    styles.amount,
                    type === 'purchase' ? styles.debitAmount : styles.creditAmount,
                  ]}
                >
                  {amount} coins
                </Text>
              </View>
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
    backgroundColor: '#0a0a0a',
  },
  heading: {
    fontSize: 28,
    fontWeight: '700',
    color: '#3aed76',
    marginBottom: 24,
    marginHorizontal: 16,
  },
  scrollContent: {
    paddingBottom: 24,
  },
  transactionCard: {
    backgroundColor: '#121212',
    borderRadius: 16,
    marginHorizontal: 16,
    marginBottom: 16,
    paddingVertical: 16,
    paddingHorizontal: 20,
    shadowColor: '#3aed76',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 6,
  },
  transactionContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  redIconBg: {
    backgroundColor: '#FEE2E2',
  },
  greenIconBg: {
    backgroundColor: '#D1FAE5',
  },
  detailsContainer: {
    flex: 1,
    marginLeft: 16,
  },
  transactionTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#E0E0E0',
    marginBottom: 4,
  },
  transactionDate: {
    fontSize: 14,
    color: '#9CA3AF',
  },
  amount: {
    fontSize: 17,
    fontWeight: '700',
    marginLeft: 12,
    minWidth: 90,
    textAlign: 'right',
  },
  debitAmount: {
    color: '#EF4444',
  },
  creditAmount: {
    color: '#10B981',
  },
  emptyStateCard: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  emptyStateText: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
  },
});

export default TransactionList;