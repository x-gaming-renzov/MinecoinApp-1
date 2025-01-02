import messaging from '@react-native-firebase/messaging';
import 'react-native-gesture-handler';
import { registerRootComponent } from 'expo';
import { PermissionsAndroid, Platform } from 'react-native';

// Add background message handler
messaging().setBackgroundMessageHandler(async remoteMessage => {
  console.log('Message handled in the background!', remoteMessage);
});

// Function to request permissions
const requestAllPermissions = async () => {
  try {
    if (Platform.OS === 'android') {
      const granted = await PermissionsAndroid.requestMultiple([
        PermissionsAndroid.PERMISSIONS.CAMERA,
        PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
        PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE,
        PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE,
        PermissionsAndroid.PERMISSIONS.INTERNET,
      ]);

      // Log the result or handle denied permissions
      console.log('Permissions status:', granted);
      if (
        granted['android.permission.CAMERA'] === PermissionsAndroid.RESULTS.GRANTED &&
        granted['android.permission.ACCESS_FINE_LOCATION'] === PermissionsAndroid.RESULTS.GRANTED
      ) {
        console.log('All required permissions granted!');
      } else {
        console.log('Some permissions are denied!');
      }
    }
  } catch (err) {
    console.warn('Permission request error:', err);
  }
};

// Call the permission request function at app start
requestAllPermissions();

// Register the main App component
import App from './App';
registerRootComponent(App);
