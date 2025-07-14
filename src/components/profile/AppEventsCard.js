// AppEventsCard.js
import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity } from 'react-native';
import { HelpCircle, Send } from 'lucide-react-native';

const AppEventsCard = () => {
  const [answer, setAnswer] = useState('');

  // TODO: Replace with actual question from API
  const questionData = {
    question: "What's your favorite feature of our game?",
    reward: "50 Coins",
  };

  const handleSubmit = () => {
    // TODO: Implement submission logic with API
    console.log('Answer submitted:', answer);
    setAnswer('');
  };

  return (
    <View style={styles.container}>
      {/* Header with Icon */}
      <View style={styles.header}>
        <HelpCircle size={24} color="#7C3AED" />
        <Text style={styles.title}>Daily Question</Text>
      </View>
      
      {/* Question Box */}
      <View style={styles.questionContainer}>
        <Text style={styles.question}>{questionData.question}</Text>
        <View style={styles.rewardBadge}>
          <Text style={styles.rewardText}>Reward: {questionData.reward}</Text>
        </View>
      </View>

      {/* Answer Input */}
      <View style={styles.inputWrapper}>
        <TextInput
          style={styles.input}
          value={answer}
          onChangeText={setAnswer}
          placeholder="Type your answer here..."
          multiline
          placeholderTextColor="#6B7280"
        />
        
        {/* Submit Button */}
        <TouchableOpacity
          style={[
            styles.submitButton,
            !answer && styles.submitButtonDisabled
          ]}
          onPress={handleSubmit}
          disabled={!answer}
        >
          <Send 
            size={20} 
            color={answer ? "#FFFFFF" : "#9CA3AF"} 
          />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1F2937',
    marginLeft: 8,
  },
  questionContainer: {
    backgroundColor: 'rgba(124, 58, 237, 0.1)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  question: {
    fontSize: 16,
    color: '#1F2937',
    marginBottom: 12,
    lineHeight: 24,
  },
  rewardBadge: {
    backgroundColor: '#7C3AED',
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 20,
  },
  rewardText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '500',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    padding: 12,
    minHeight: 100,
    maxHeight: 150,
    textAlignVertical: 'top',
    fontSize: 16,
    color: '#1F2937',
    backgroundColor: '#F9FAFB',
  },
  submitButton: {
    backgroundColor: '#7C3AED',
    padding: 12,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitButtonDisabled: {
    backgroundColor: '#E5E7EB',
  },
});

export default AppEventsCard;
//