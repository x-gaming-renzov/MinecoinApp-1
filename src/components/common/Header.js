import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useUser } from '../../context/UserContext';
import { useAuth } from '../../context/AuthContext';

const Header = () => {
  const navigation = useNavigation();
  const { balance } = useUser();
  const { user, isLoggedIn } = useAuth();

  const getInitials = () => {
    if (user?.displayName) {
      return user.displayName.split(' ')[0].charAt(0).toUpperCase();
    }
    return 'U';
  };

  return (
    <View style={styles.mainContainer}>
      <View style={styles.container}>
        <TouchableOpacity
          style={styles.profileContainer}
          onPress={() => navigation.navigate('Profile')}
          activeOpacity={0.8}
        >
          {isLoggedIn && user?.photoURL ? (
            <Image source={{ uri: user.photoURL }} style={styles.profileImage} />
          ) : (
            <View style={styles.initialsContainer}>
              <Text style={styles.initialsText}>{getInitials()}</Text>
            </View>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.balanceContainer}
          onPress={() => {
            if (!isLoggedIn) {
              navigation.navigate('Profile');
            } else {
              navigation.navigate('CoinBundle');
            }
          }}
          activeOpacity={0.9}
        >
          <View style={styles.balanceContent}>
            <Image source={require('../../../assets/rupee.png')} style={styles.coinIcon} />
            <Text style={styles.balanceText}>{balance?.toLocaleString() || '4,480'}</Text>
            <View style={styles.addButton}>
              <Text style={styles.addButtonText}>+</Text>
            </View>
          </View>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  mainContainer: {
    backgroundColor: '#f2feff',
    paddingTop: 8,
  },
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  profileContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    overflow: 'hidden',
    backgroundColor: '#FFFFFF',
    elevation: 2,
    shadowColor: '#7C3AED',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
  },
  profileImage: {
    width: '100%',
    height: '100%',
    borderRadius: 18,
  },
  initialsContainer: {
    width: '100%',
    height: '100%',
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  initialsText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#7C3AED',
  },
  balanceContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    elevation: 2,
    shadowColor: '#7C3AED',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
  },
  balanceContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 6,
  },
  coinIcon: {
    width: 20,
    height: 20,
    resizeMode: 'contain',
  },
  balanceText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  addButton: {
    backgroundColor: '#7C3AED',
    width: 22,
    height: 22,
    borderRadius: 11,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    lineHeight: 22,
  },
});

export default Header;