import React, { useEffect, useState } from 'react';
import { Platform, PermissionsAndroid, Alert } from 'react-native';
import PermissionsDialog from './PermissionsDialog'; // adjust path
import messaging from '@react-native-firebase/messaging';
import { StatusBar } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { AuthProvider } from './src/context/AuthContext';
import { UserProvider } from './src/context/UserContext';
import AppNavigator from './src/navigation/AppNavigator';
import MaintenanceCheck from './src/components/common/MaintenanceCheck';
import { adapty } from 'react-native-adapty';

adapty.activate('public_live_a2ZpIYeH.UBLMWSv1MLfHElcx8N9j');

const App = () => {
  const [showPermissionsDialog, setShowPermissionsDialog] = useState(false);

  useEffect(() => {
    const requestPermissions = async () => {
      if (Platform.OS === 'android') {
        try {
          const granted = await PermissionsAndroid.request(
            PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS
          );

          console.log('Notification permission status:', granted);

          if (granted === PermissionsAndroid.RESULTS.DENIED) {
            setShowPermissionsDialog(true);
          }
        } catch (err) {
          console.warn('Permission request error:', err);
          setShowPermissionsDialog(true);
        }
      }
    };

    requestPermissions();

    // Setup background message handler
    messaging().setBackgroundMessageHandler(async remoteMessage => {
      console.log('Message handled in the background!', remoteMessage);
    });
  }, []);

  const handleRequestPermissions = async () => {
    if (Platform.OS === 'android') {
      try {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS
        );

        console.log('Notification permission status after button click:', granted);

        if (granted === PermissionsAndroid.RESULTS.DENIED) {
          setShowPermissionsDialog(true);
        } else {
          setShowPermissionsDialog(false);
        }
      } catch (err) {
        console.warn('Permission request error:', err);
      }
    }
  };

  return (
    <>
      <PermissionsDialog
        visible={showPermissionsDialog}
        onRequestPermissions={handleRequestPermissions}
      />
      <AuthProvider>
        <UserProvider>
          <MaintenanceCheck>
            <GestureHandlerRootView style={{ flex: 1 }}>
              <SafeAreaProvider>
                <StatusBar
                  barStyle={Platform.OS === 'ios' ? 'dark-content' : 'light-content'}
                  backgroundColor="#0a0a0a"
                  translucent
                />
                <NavigationContainer>
                  <AppNavigator />
                </NavigationContainer>
              </SafeAreaProvider>
            </GestureHandlerRootView>
          </MaintenanceCheck>
        </UserProvider>
      </AuthProvider>
    </>
  );
};

export default App;