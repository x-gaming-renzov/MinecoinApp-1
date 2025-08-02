import React from 'react';
import { View, Text, SafeAreaView, StyleSheet, ActivityIndicator } from 'react-native';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../../config/firebase';
import Video from 'react-native-video';


const MaintenanceCheck = ({ children }) => {
  const [isInMaintenance, setIsInMaintenance] = React.useState(false);
  const [message, setMessage] = React.useState('');
  const [loading, setLoading] = React.useState(true);

  const CURRENT_APP_VERSION = '1.0.0'; // Your app's actual version

  React.useEffect(() => {
    try {
      const maintenanceRef = doc(db, 'appConfig', 'maintenance');

      const unsubscribe = onSnapshot(maintenanceRef, (doc) => {
        if (doc.exists()) {
          const data = doc.data();
          const {
            isMaintenanceMode,
            message,
            appVersion,
            currentAppVersion
          } = data;
          setIsInMaintenance(false);
//
//          // Global maintenance mode
//          if (isMaintenanceMode) {
//            setIsInMaintenance(true);
//            setMessage(message || 'App is under maintenance. Please try again later.');
//          }
//          // Version mismatch maintenance mode
//          else if (appVersion !== CURRENT_APP_VERSION ) {
//            setIsInMaintenance(true);
//            setMessage('A new version is available or under maintenance.');
//          }
//          else {
//            setIsInMaintenance(false);
//          }
        } else {
          setIsInMaintenance(false);
        }

        setLoading(false);
      }, (error) => {
        console.error('Maintenance check error:', error);
        setLoading(false);
      });

      return () => unsubscribe();
    } catch (error) {
      console.error('Setup maintenance check error:', error);
      setLoading(false);
    }
  }, []);


  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.loadingBox}>
          <ActivityIndicator size="large" color="#3aed76" />
          <Text style={styles.loadingText}>Loading app...</Text>
        </View>
      </View>
    );
  }

  if (isInMaintenance) {
    return (
      <View style={styles.videoContainer}>
        <Video
                  source={{uri: 'https://ik.imagekit.io/ypvwcoywn3/maintaince.mp4'}}
                  repeat
                  resizeMode="cover"
                  style={StyleSheet.absoluteFill}
                  muted={false}
                  volume={10}
                  rate={1.0}
                  ignoreSilentSwitch="obey"
                />
        <View style={styles.overlay}>
          <Text style={styles.title}>Maintenance Mode</Text>
          <Text style={styles.message}>{message}</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.wrapper}>
      {typeof children === 'string' ? <Text>{children}</Text> : children}
    </View>
    );
  };

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    backgroundColor: '#0a0a0a'
  },
  videoContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'black',
    overflow: 'hidden'
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    zIndex: 2
  },

  container: {
    flex: 1,
    backgroundColor: '#0a0a0a',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20
  },
  loadingBox: {
    alignItems: 'center',
    justifyContent: 'center'
  },
  loadingText: {
    fontSize: 16,
    color: '#3aed76',
    marginTop: 8
  },
  messageBox: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 12,
    width: '90%',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#3aed76',
    marginBottom: 12
  },
  message: {
    fontSize: 16,
    color: '#3aed76',
    textAlign: 'center'
  }
});

export default MaintenanceCheck;