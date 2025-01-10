// CalendarCard.js
import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal } from 'react-native';
import { Calendar } from 'react-native-calendars';
import { Calendar as CalendarIcon, X, Gift } from 'lucide-react-native';

const CalendarCard = () => {
  const [selectedDate, setSelectedDate] = useState('');
  const [showEventDetails, setShowEventDetails] = useState(false);

  // TODO: Replace with actual event dates from API
  const markedDates = {
    '2025-01-15': {
      marked: true,
      dotColor: '#7C3AED',
      selected: selectedDate === '2025-01-15',
      selectedColor: 'rgba(124, 58, 237, 0.1)',
    },
    // Add more dates here when API is ready
  };

  // TODO: Replace with actual event details from API
  const eventDetails = {
    title: 'Special Event',
    description: 'Join us for an exciting gaming event!',
    time: '8:00 PM',
    rewards: '100 Coins',
  };

  const handleDateSelect = (day) => {
    setSelectedDate(day.dateString);
    if (markedDates[day.dateString]) {
      setShowEventDetails(true);
    }
  };

  return (
    <View style={styles.container}>
      {/* Calendar Header */}
      <View style={styles.header}>
        <CalendarIcon size={24} color="#7C3AED" />
        <Text style={styles.title}>Game Events</Text>
      </View>

      {/* Calendar */}
      <Calendar
        style={styles.calendar}
        theme={{
          calendarBackground: '#FFFFFF',
          textSectionTitleColor: '#7C3AED',
          selectedDayBackgroundColor: '#7C3AED',
          selectedDayTextColor: '#FFFFFF',
          todayTextColor: '#7C3AED',
          dayTextColor: '#1F2937',
          textDisabledColor: '#C4C4C4',
          dotColor: '#7C3AED',
          monthTextColor: '#1F2937',
          textMonthFontWeight: 'bold',
          arrowColor: '#7C3AED',
        }}
        markedDates={markedDates}
        onDayPress={handleDateSelect}
        enableSwipeMonths={true}
      />

      {/* Event Details Modal */}
      <Modal
        transparent
        visible={showEventDetails}
        animationType="fade"
        onRequestClose={() => setShowEventDetails(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{eventDetails.title}</Text>
              <TouchableOpacity 
                onPress={() => setShowEventDetails(false)}
                style={styles.closeButton}
              >
                <X size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>

            {/* Event Date & Time */}
            <View style={styles.dateTimeContainer}>
              <Text style={styles.date}>{selectedDate}</Text>
              <Text style={styles.time}>{eventDetails.time}</Text>
            </View>

            {/* Event Description */}
            <Text style={styles.description}>{eventDetails.description}</Text>

            {/* Event Rewards */}
            <View style={styles.rewardContainer}>
              <Gift size={20} color="#7C3AED" />
              <View style={styles.rewardContent}>
                <Text style={styles.rewardLabel}>Event Rewards</Text>
                <Text style={styles.rewardValue}>{eventDetails.rewards}</Text>
              </View>
            </View>
          </View>
        </View>
      </Modal>
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
  calendar: {
    borderRadius: 12,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    width: '90%',
    maxWidth: 400,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1F2937',
  },
  closeButton: {
    padding: 4,
  },
  dateTimeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  date: {
    fontSize: 16,
    color: '#7C3AED',
    fontWeight: '500',
    marginRight: 12,
  },
  time: {
    fontSize: 14,
    color: '#6B7280',
  },
  description: {
    fontSize: 16,
    color: '#1F2937',
    lineHeight: 24,
    marginBottom: 16,
  },
  rewardContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(124, 58, 237, 0.1)',
    padding: 16,
    borderRadius: 12,
  },
  rewardContent: {
    marginLeft: 12,
  },
  rewardLabel: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 4,
  },
  rewardValue: {
    fontSize: 16,
    color: '#7C3AED',
    fontWeight: '600',
  },
});

export default CalendarCard;