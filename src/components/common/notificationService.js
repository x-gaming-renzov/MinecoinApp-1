import messaging from "@react-native-firebase/messaging";
// NEW: Add this import
import { updateFCMToken } from '../../config/firebase';

// Request permissions
const requestNotificationPermission = async () => {
  const authStatus = await messaging().requestPermission();
  const enabled =
    authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
    authStatus === messaging.AuthorizationStatus.PROVISIONAL;
  console.log("Authorization status:", authStatus);
  return enabled;
};
// Get FCM token
const getFCMToken = async () => {
  try {
    const token = await messaging().getToken();
    console.log('FCM Token:', token);
    return token;
  } catch (error) {
    console.error('Error getting FCM token:', error);
    return null;
  }
};

// NEW: Added function to handle token refresh
const setupTokenRefreshListener = async (userEmail) => {
  return messaging().onTokenRefresh(async (token) => {
    console.log('FCM Token refreshed:', token);
    if (userEmail) {
      await updateFCMToken(userEmail, token);
    }
  });
};

// Setup all message handlers
const setupNotificationHandlers = (onMessageReceived) => {
  // Foreground handler
  const unsubscribe = messaging().onMessage(async (remoteMessage) => {
    onMessageReceived(remoteMessage);
  });
  // Background opened app handler
  messaging().onNotificationOpenedApp((remoteMessage) => {
    console.log('Background Message:', remoteMessage);
  });
  // Quit state handler
  messaging().getInitialNotification().then((remoteMessage) => {
    if (remoteMessage) {
      console.log('Quit State Message:', remoteMessage.notification);
    }
  });
  // Background handler
  messaging().setBackgroundMessageHandler(async (remoteMessage) => {
    console.log('Background message handled:', remoteMessage);
  });
  return unsubscribe;
};
export {
  requestNotificationPermission,
  getFCMToken,
  setupNotificationHandlers,
  setupTokenRefreshListener,  // NEW: Added to exports
};