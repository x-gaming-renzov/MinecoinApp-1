import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../../context/AuthContext';
import { useUser } from '../../context/UserContext';
import { LogOut } from 'lucide-react-native';
import VoteButton from './VoteButton';

const UserDetailsForm = () => {
  const navigation = useNavigation();
  const { user, signOut } = useAuth();
  const { linkedPlayer, mcCredentials } = useUser();

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
    <View style={styles.container}>
      <View style={styles.statsCard}>
        <View style={styles.header}>
          <Image
            source={{
              uri: linkedPlayer?.imgUrl || 'https://via.placeholder.com/60',
            }}
            style={styles.playerHead}
          />
          <View style={styles.usernameBox}>
            <Text style={styles.usernameLabel}>Minecraft Username</Text>
            <Text style={styles.username}>{mcCredentials?.username || 'Default ALEX'}</Text>
          </View>
        </View>

        <View style={styles.statsBox}>
          <View style={styles.statRow}>
            <Text style={styles.statLabel}>Kill :-</Text>
            <Text style={styles.statValue}>{linkedPlayer?.kills || 0}</Text>
          </View>

          <View style={styles.statRow}>
            <Text style={styles.statLabel}>Death :-</Text>
            <Text style={styles.statValue}>{linkedPlayer?.deaths || 0}</Text>
          </View>

          <View style={styles.statRow}>
            <Text style={styles.statLabel}>K/D Ratio :-</Text>
            <Text style={styles.statValue}>{linkedPlayer?.kdRatio || 0}</Text>
          </View>

          <View style={styles.statRow}>
            <Text style={styles.statLabel}>Leaderboard Position :-</Text>
            <Text style={styles.statValue}>
              {linkedPlayer?.leaderboardPosition > 0
                ? `#${linkedPlayer.leaderboardPosition}`
                : 'Not Ranked'}
            </Text>
          </View>
        </View>
      </View>

      <TouchableOpacity
        style={styles.logoutButton}
        onPress={handleLogout}
        activeOpacity={0.8}
      >
        <LogOut size={20} color="#FFFFFF" style={styles.logoutIcon} />
        <Text style={styles.logoutText}>Logout</Text>
      </TouchableOpacity>

      <VoteButton username={mcCredentials?.username} ip={linkedPlayer?.ip} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f2feff',
    paddingHorizontal: 16,
  },
  statsCard: {
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    overflow: 'hidden',
    marginTop: 16,
    marginBottom: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
    backgroundColor: '#FFFFFF',
  },
  playerHead: {
    width: 44,
    height: 44,
    borderRadius: 8,
    marginRight: 12,
  },
  usernameBox: {
    flex: 1,
  },
  usernameLabel: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 4,
  },
  username: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
  },
  statsBox: {
    backgroundColor: '#FFFFFF',
    paddingBottom: 8,
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  statLabel: {
    fontSize: 16,
    color: '#1F2937',
  },
  statValue: {
    fontSize: 16,
    color: '#7C3AED',
    fontWeight: '500',
  },
  logoutButton: {
    backgroundColor: '#EF4444',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  logoutIcon: {
    marginRight: 8,
  },
  logoutText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  }
});
export default UserDetailsForm;