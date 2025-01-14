import React from 'react';
import { View, Text, SafeAreaView, StyleSheet, ActivityIndicator } from 'react-native';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../../config/firebase';

const MaintenanceCheck = ({ children }) => {
  const [isInMaintenance, setIsInMaintenance] = React.useState(false);
  const [message, setMessage] = React.useState('');
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    try {
      const maintenanceRef = doc(db, 'appConfig', 'maintenance');
      const unsubscribe = onSnapshot(maintenanceRef, (doc) => {
        if (doc.exists()) {
          const data = doc.data();
          setIsInMaintenance(data.isMaintenanceMode || false);  // Changed this line
          setMessage(data.message || 'App is under maintenance. Please try again later.');
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
          <ActivityIndicator size="large" color="#7C3AED" />
          <Text style={styles.loadingText}>Loading app...</Text>
        </View>
      </View>
    );
  }

  if (isInMaintenance) {
    return (
      <View style={styles.container}>
        <View style={styles.messageBox}>
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
    backgroundColor: '#f2feff'
  },
  container: {
    flex: 1,
    backgroundColor: '#f2feff',
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
    color: '#7C3AED',
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
    color: '#7C3AED',
    marginBottom: 12
  },
  message: {
    fontSize: 16,
    color: '#4B5563',
    textAlign: 'center'
  }
});

export default MaintenanceCheck;