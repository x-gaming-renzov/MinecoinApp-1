// NotificationBanner.js - Shows temporary or permanent notifications from Firebase
import React, { useEffect, useState, useCallback, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
// Import Firebase database connection and needed functions
import { db } from '../../config/firebase';
import {
  collection,
  query,
  onSnapshot,
  orderBy,
  limit
} from 'firebase/firestore';
import { colors } from '../../screens/theme';

const NotificationBanner = () => {
  const [notification, setNotification] = useState(null);
  const [opacity] = useState(new Animated.Value(0));
  const timeoutRef = useRef(null);

  const fadeIn = useCallback(() => {
    Animated.timing(opacity, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, [opacity]);

  const fadeOut = useCallback(() => {
    Animated.timing(opacity, {
      toValue: 0,
      duration: 300,
      useNativeDriver: true,
    }).start(() => setNotification(null));
  }, [opacity]);

  useEffect(() => {
    try {
      const notificationsRef = collection(db, 'bannerNotifications');
      const q = query(
        notificationsRef,
        orderBy('timestamp', 'desc'),
        limit(1)
      );

      const unsubscribe = onSnapshot(q, (snapshot) => {
        // Always clear the previous timer when a new update arrives
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
        }

        if (!snapshot.empty) {
          const notificationData = snapshot.docs[0].data();

          if (notificationData.isActive) {
            setNotification(notificationData.text);
            fadeIn();

            // Check for a duration field from Firebase
            const duration = notificationData.duration; // e.g., 5000 for 5 seconds

            // If duration is a valid number and greater than 0, set a timer
            if (typeof duration === 'number' && duration > 0) {
              console.log(`Notification will hide in ${duration}ms.`);
              timeoutRef.current = setTimeout(() => {
                fadeOut();
              }, duration);
            } else {
              // If duration is not set or is 0, it's unlimited
              console.log('Notification has unlimited duration. Will hide when isActive is false.');
            }
          } else {
            // If the notification is not active, fade it out
            fadeOut();
          }
        } else {
          fadeOut();
        }
      }, (error) => {
        console.error('Error fetching notifications:', error);
        fadeOut();
      });

      // Cleanup listener and timer when the component unmounts
      return () => {
        unsubscribe();
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
        }
      };
    } catch (error) {
      console.error('Error setting up notification listener:', error);
    }
  }, [fadeIn, fadeOut]);

  // Don't render anything if there's no notification
  if (!notification) {
    return null;
  }

  return (
    <Animated.View style={[styles.container, { opacity }]}>
      <View style={styles.contentWrapper}>
        <Text
          style={styles.text}
          numberOfLines={1}
          ellipsizeMode="tail"
        >
          {notification}
        </Text>
      </View>
    </Animated.View>
  );
};

// Styles using the centralized theme
const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.accent,
    width: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 3,
  },
  contentWrapper: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: 40,
    flexDirection: 'row',
  },
  text: {
    color: colors.background,
    textAlign: 'center',
    fontSize: 14,
    fontWeight: '500',
    letterSpacing: 0.2,
    lineHeight: 18,
  },
});

export default NotificationBanner;