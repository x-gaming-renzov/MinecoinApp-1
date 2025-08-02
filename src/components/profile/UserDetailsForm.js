import React from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Text,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../../context/AuthContext';
import CalendarCard from './CalendarCard';
import AppEventsCard from './AppEventsCard';
import { LogOut } from 'lucide-react-native';
import { colors } from '../../screens/theme'; // Import theme colors
    // src/screens/MainScreen.js
    // ...other imports
import RocketRideGame from '../games/RocketRideGame';
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
      contentContainerStyle={styles.contentContainer}
    >
      {/* Lucky Box Game Section */}
      <View style={styles.cardContainer}>
        <CalendarCard />
      </View>

      {/* Gift Card & Claim Section */}
      <View style={styles.cardContainer}>
        <AppEventsCard />
      </View>
<View style={styles.cardContainer}>
<RocketRideGame />
      </View>

      {/* Logout Button */}
      <TouchableOpacity
        style={styles.logoutButton}
        onPress={handleLogout}
        activeOpacity={0.7}
      >
        <LogOut size={22} color="#FFFFFF" style={styles.logoutIcon} />
        <Text style={styles.logoutText}>Logout</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  contentContainer: {
    paddingVertical: 20,
  },
  cardContainer: {
    marginBottom: 20,
    borderRadius: 20,
    backgroundColor: colors.backgroundLight,
    shadowColor: colors.accent,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 8,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.accent,
  },
  logoutButton: {
    backgroundColor: colors.error,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 16,
    marginTop: 10,
    shadowColor: colors.error,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 6,
  },
  logoutIcon: {
    marginRight: 12,
  },
  logoutText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
  },
});

export default UserDetailsForm;