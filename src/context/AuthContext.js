import React, { createContext, useState, useContext, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  auth,
  configureGoogleSignIn,
  signInWithGoogle as firebaseSignInWithGoogle,
  signOutUser as firebaseSignOutUser,
  saveUserToFirestore,
  getUserData,
  updateFCMToken,
  checkMaintenanceMode,
} from "../config/firebase";
import { doc, updateDoc,runTransaction, Timestamp } from 'firebase/firestore';
import { db } from '../config/firebase';

import { 
  requestNotificationPermission, 
  getFCMToken, 
  setupNotificationHandlers, 
  setupTokenRefreshListener 
} from "../components/common/notificationService";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  console.log("AuthProvider initialized");
  
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState(null);
  const [hasMcVerification, setHasMcVerification] = useState(false);
  const [fcmToken, setFcmToken] = useState("");

  const setupNotifications = async (userEmail) => {
    try {
      const hasPermission = await requestNotificationPermission();
      if (hasPermission) {
        const token = await getFCMToken();
        if (token) {
          setFcmToken(token);
          if (userEmail) {
            await updateFCMToken(userEmail, token);
          }
        }

        const notificationUnsubscribe = setupNotificationHandlers();
        const tokenUnsubscribe = await setupTokenRefreshListener(userEmail);

        // NEW: A quick check/log for clarity (or any other logic if needed)
        console.log("Token refresh listener attached for:", userEmail); // <-- NEW

        return () => {
          notificationUnsubscribe();
          if (tokenUnsubscribe) tokenUnsubscribe();
        };
      }
    } catch (error) {
      console.error("Error setting up notifications:", error);
    }
  };

  useEffect(() => {
    console.log("Setting up auth and checking stored user");
    configureGoogleSignIn();
    restoreUser();
  }, []);

  // NEW: Now also call setupNotifications whenever we have a valid user
  useEffect(() => {
    if (user && user.email) {
      setupNotifications(user.email); // <-- NEW
    }
  }, [user]);

  const restoreUser = async () => {
    try {
      console.log("Attempting to restore user session");
      const userData = await AsyncStorage.getItem("user");
      if (userData) {
        console.log("Found stored user data");
        const parsedUser = JSON.parse(userData);

        if (!parsedUser.email) {
          console.error("Invalid stored user data");
          await AsyncStorage.removeItem("user");
          return;
        }

        console.log("Fetching fresh data from Firestore for:", parsedUser.email);
        let firestoreData = await getUserData(parsedUser.email);

        if (firestoreData) {
          // Check and give daily reward based on IST date
          if (firestoreData.hasMcVerified) {
            const toISTDate = (timestamp) =>
              new Date(timestamp).toLocaleDateString("en-GB", {
                timeZone: "Asia/Kolkata",
                year: "numeric",
                month: "2-digit",
                day: "2-digit",
              });

            const now = Date.now();
            const lastReward = firestoreData.lastRewardTimestamp || 0;

            if (toISTDate(now) !== toISTDate(lastReward)) {
              console.log("Giving daily reward");
              const newBalance = (firestoreData.coinBalance || 0) + 20;
              const userRef = doc(db, "users", parsedUser.email);

              await updateDoc(userRef, {
                coinBalance: newBalance,
                lastRewardTimestamp: now,
              });

              firestoreData = {
                ...firestoreData,
                coinBalance: newBalance,
                lastRewardTimestamp: now,
              };

              if (firestoreData.mcUsername) {
                const playerRef = doc(db, "players", firestoreData.mcUsername);
                await updateDoc(playerRef, {
                  coinBalance: newBalance,
                });
              }

              console.log("Daily reward given, new balance:", newBalance);
            }
          }

          const updatedUser = {
            ...parsedUser,
            ...firestoreData,
          };
          console.log("User session restored successfully");

          setUser(updatedUser);
          setIsLoggedIn(true);
          setHasMcVerification(firestoreData.hasMcVerified || false);

          await AsyncStorage.setItem("user", JSON.stringify(updatedUser));
          setupNotifications(updatedUser.email);
        } else {
          console.log("No Firestore data found for user");
          await AsyncStorage.removeItem("user");
        }
      } else {
        console.log("No stored user session found");
      }
    } catch (error) {
      console.error("Error restoring user:", error);
      await AsyncStorage.removeItem("user");
    }
  };



  const signInWithGoogle = async () => {
    try {
      // NEW: Check maintenance mode first
      const { isMaintenanceMode } = false ;
      if (isMaintenanceMode) {
        throw new Error("App is under maintenance");
    }

      console.log("Starting Google Sign In process");
      const userCredential = await firebaseSignInWithGoogle();
      
      const token = await getFCMToken();
      
      const userData = {
        email: userCredential.user.email,
        displayName: userCredential.user.displayName,
        photoURL: userCredential.user.photoURL,
        fcmToken: token
      };
      console.log("Google Sign In successful:", userData.email);

      console.log("Checking existing Firestore data");
      let firestoreData = await getUserData(userData.email);
      
      if (!firestoreData) {
        console.log("New user - creating Firestore record");
        await saveUserToFirestore(userData);
        firestoreData = await getUserData(userData.email);
      } else {
        console.log("Existing user found in Firestore");
      }

      
      // NEW: Check for daily reward on sign in
      if (firestoreData && firestoreData.hasMcVerified) {
        const now = new Date().getTime();
        const lastReward = firestoreData.lastRewardTimestamp || 0;
        const hoursSinceLastReward = (now - lastReward) / (1000 * 60 * 60);
        
        if (hoursSinceLastReward >= 24) {
          console.log("Giving daily reward on sign in");
          const newBalance = (firestoreData.coinBalance || 0) + 15;
          const userRef = doc(db, "users", userData.email);
          
          await updateDoc(userRef, {
            coinBalance: newBalance,
            lastRewardTimestamp: now
          });
          
          firestoreData = {
            ...firestoreData,
            coinBalance: newBalance,
            lastRewardTimestamp: now
          };

          // NEW: Sync with player collection if MC verified
          if (firestoreData.mcUsername) {
            const playerRef = doc(db, "players", firestoreData.mcUsername);
            await updateDoc(playerRef, {
              coinBalance: newBalance
            });
          }

          console.log("Daily reward given on sign in, new balance:", newBalance);
        }
      }

      const completeUserData = {
        ...userData,
        ...firestoreData
      };

      console.log("Saving user data to AsyncStorage");
      await AsyncStorage.setItem("user", JSON.stringify(completeUserData));
      
      setUser(completeUserData);
      setIsLoggedIn(true);
      setHasMcVerification(firestoreData?.hasMcVerified || false);
      
      setupNotifications(userData.email);
      
      console.log("Sign in process completed");
      return true;
    } catch (error) {
      console.error("Google Sign-In error:", error);
      return false;
    }
  };

  const signOut = async () => {
    try {
      console.log("Starting sign out process");
      await firebaseSignOutUser();
      
      await AsyncStorage.clear();
      setUser(null);
      setIsLoggedIn(false);
      setHasMcVerification(false);
      setFcmToken("");
      
      console.log("Sign out completed successfully");
    } catch (error) {
      console.error("Sign-out error:", error);
      throw error;
    }
  };

  return (
    <AuthContext.Provider
      value={{
        isLoggedIn,
        user,
        hasMcVerification,
        signInWithGoogle,
        signOut,
        fcmToken,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export default AuthContext;