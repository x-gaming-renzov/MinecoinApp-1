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
          <Text style={styles.emptyStateText}>Please sign in to view your transactions</Text>
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
    const title = transaction.type === 'purchase'
      ? `Purchase: ${transaction.details?.title || 'Game Asset'}`
      : 'Added Coins';
    const amount = transaction.type === 'purchase'
      ? `-${Math.abs(transaction.amount)}`
      : `+${transaction.amount}`;
    const date = format(new Date(transaction.timestamp), 'MMM dd, yyyy');
    return { title, amount, date, type: transaction.type };
  };

  return (
    <View style={styles.container}>
      <Text style={styles.heading}>Transaction History</Text>
      <ScrollView showsVerticalScrollIndicator={false}>
        {transactions.map((transaction, index) => {
          const { title, amount, date, type } = formatTransaction(transaction);
          return (
            <Animated.View key={transaction.id || index} style={styles.transactionCard}>
              <View style={styles.transactionContent}>
                <View style={[
                  styles.iconContainer,
                  type === 'purchase' ? styles.redIconBg : styles.greenIconBg
                ]}>
                  {type === 'purchase' ? (
                    <MinusCircle size={24} color="#EF4444" />
                  ) : (
                    <PlusCircle size={24} color="#10B981" />
                  )}
                </View>
                <View style={styles.detailsContainer}>
                  <Text style={styles.transactionTitle}>{title}</Text>
                  <Text style={styles.transactionDate}>{date}</Text>
                </View>
                <Text style={[
                  styles.amount,
                  type === 'purchase' ? styles.debitAmount : styles.creditAmount
                ]}>
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
  },
  heading: {
    fontSize: 28,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 24,
    marginHorizontal: 16,
  },
  transactionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  transactionContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
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
    marginLeft: 12,
  },
  transactionTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1F2937',
    marginBottom: 4,
  },
  transactionDate: {
    fontSize: 14,
    color: '#6B7280',
  },
  amount: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
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
  }
});

export default TransactionList;