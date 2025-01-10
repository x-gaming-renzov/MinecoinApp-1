// UserDetailsForm.js
import React from 'react';
import { View, ScrollView, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../../context/AuthContext';
import CalendarCard from './CalendarCard';
import AppEventsCard from './AppEventsCard';
import VoteButton from './VoteButton';
import QuestButton from './QuestButton';
import { LogOut } from 'lucide-react-native';
import { TouchableOpacity, Text } from 'react-native';

const UserDetailsForm = () => {
  const navigation = useNavigation();
  const { signOut } = useAuth();

  const handleLogout = async () => {
    try {
      await signOut();
      navigation.reset({
        index: 0,
        routes: [{ name: 'Main' }],
      });
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  return (
    <ScrollView 
      style={styles.container}
      showsVerticalScrollIndicator={false}
    >
      {/* Calendar Section */}
      <View style={styles.cardContainer}>
        <CalendarCard />
      </View>

      {/* Daily Questions Section */}
      <View style={styles.cardContainer}>
        <AppEventsCard />
      </View>

      {/* Vote and Quest Buttons Section */}
      <View style={styles.buttonGroup}>
        <View style={styles.buttonWrapper}>
          <VoteButton />
        </View>
        <View style={styles.buttonWrapper}>
          <QuestButton />
        </View>
      </View>

      {/* Logout Button */}
      <TouchableOpacity
        style={styles.logoutButton}
        onPress={handleLogout}
        activeOpacity={0.8}
      >
        <LogOut size={20} color="#FFFFFF" style={styles.logoutIcon} />
        <Text style={styles.logoutText}>Logout</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f2feff',
    padding: 16,
  },
  cardContainer: {
    marginBottom: 16,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    shadowColor: '#7C3AED',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  buttonGroup: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
    gap: 12, // Space between buttons
  },
  buttonWrapper: {
    flex: 1, // Makes both buttons take equal width
  },
  logoutButton: {
    backgroundColor: '#EF4444',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  logoutIcon: {
    marginRight: 8,
  },
  logoutText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default UserDetailsForm;