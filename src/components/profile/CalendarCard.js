import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal } from 'react-native';
import { Calendar } from 'react-native-calendars';
import { Calendar as CalendarIcon, X, Gift } from 'lucide-react-native';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '../../config/firebase';

const CalendarCard = () => {
  const [selectedDate, setSelectedDate] = useState('');
  const [showEventDetails, setShowEventDetails] = useState(false);
  const [markedDates, setMarkedDates] = useState({});
  const [events, setEvents] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState(null);

// Real-time listener code
useEffect(() => {
  console.log("Setting up real-time event listener...");
  // Create listener for game events
  const unsubscribe = onSnapshot(collection(db, "gameEvents"), (snapshot) => {
    const gameEvents = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    // Transform events into marked dates format
    const marked = {};
    gameEvents.forEach(event => {
      if (event.isActive) {
        const dateStr = new Date(event.date.seconds * 1000 + event.date.nanoseconds/1000000).toLocaleDateString('en-CA');
        marked[dateStr] = {
          marked: true,
          dotColor: '#7C3AED',
          selected: selectedDate === dateStr,
          selectedColor: 'rgba(124, 58, 237, 0.1)',
        };
      }
    });

    console.log("Real-time update received:", gameEvents);
    setMarkedDates(marked);
    setEvents(gameEvents);
  });

  // Cleanup listener on unmount
  return () => unsubscribe();
}, [selectedDate]);

  const handleDateSelect = (day) => {
    console.log("Date selected:", day.dateString);
    setSelectedDate(day.dateString);
    
    // Find event for selected date
    const selectedEvent = events.find(event => {
      const eventDate = new Date(event.date.seconds * 1000 + event.date.nanoseconds/1000000).toLocaleDateString('en-CA');
      return eventDate === day.dateString && event.isActive;
    });

    if (selectedEvent) {
      console.log("Event found for selected date:", selectedEvent);
      setSelectedEvent(selectedEvent);
      setShowEventDetails(true);
    } else {
      console.log("No event found for selected date");
      setSelectedEvent(null);
    }
  };

  const formatEventTime = (timestamp) => {
    return timestamp || '8:00 PM'; // Fallback time if not specified
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
        visible={showEventDetails && selectedEvent !== null}
        animationType="fade"
        onRequestClose={() => setShowEventDetails(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{selectedEvent?.title}</Text>
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
              <Text style={styles.time}>{selectedEvent?.time}</Text>
            </View>

            {/* Event Description */}
            <Text style={styles.description}>{selectedEvent?.description}</Text>

            {/* Event Rewards */}
            <View style={styles.rewardContainer}>
              <Gift size={20} color="#7C3AED" />
              <View style={styles.rewardContent}>
                <Text style={styles.rewardLabel}>Event Rewards</Text>
                <Text style={styles.rewardValue}>{selectedEvent?.rewards} Coins</Text>
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