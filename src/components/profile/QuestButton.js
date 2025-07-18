// QuestButton.js
import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';
import { Sword } from 'lucide-react-native';

const QuestButton = ({ style }) => {
  const handleQuestPress = () => {
    // TODO: Implement quest functionality when API is ready
    console.log('Quest button pressed');
  };

  return (
    <TouchableOpacity
      style={[styles.button, style]}
      onPress={handleQuestPress}
      activeOpacity={0.8}
    >
      <Sword size={20} color="#FFFFFF" style={styles.icon} />
      <Text style={styles.text}>Quests</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    backgroundColor: '#3aed76',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
  },
  icon: {
    marginRight: 8,
  },
  text: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default QuestButton;