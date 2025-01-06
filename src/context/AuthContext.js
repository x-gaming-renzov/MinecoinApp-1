import React, { createContext, useState, useContext, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  auth,
  configureGoogleSignIn,
  signInWithGoogle as firebaseSignInWithGoogle,
  signOutUser as firebaseSignOutUser,
  saveUserToFirestore,
  getUserData,
  updateFCMToken
} from "../config/firebase";

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

  // NEW: Enhanced restoreUser function with better error handling
  const restoreUser = async () => {
    try {
      console.log("Attempting to restore user session");
      const userData = await AsyncStorage.getItem("user");
      if (userData) {
        console.log("Found stored user data");
        const parsedUser = JSON.parse(userData);
        
        // NEW: Added additional validation
        if (!parsedUser.email) {
          console.error("Invalid stored user data");
          await AsyncStorage.removeItem("user");
          return;
        }
        
        console.log("Fetching fresh data from Firestore for:", parsedUser.email);
        const firestoreData = await getUserData(parsedUser.email);
        
        if (firestoreData) {
          const updatedUser = {
            ...parsedUser,
            ...firestoreData
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
      // NEW: Clear storage on error
      await AsyncStorage.removeItem("user");
    }
  };

  const signInWithGoogle = async () => {
    try {
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
      const firestoreData = await getUserData(userData.email);
      
      if (!firestoreData) {
        console.log("New user - creating Firestore record");
        await saveUserToFirestore(userData);
      } else {
        console.log("Existing user found in Firestore");
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

  // NEW: Enhanced signOut function with cleanup
  const signOut = async () => {
    try {
      console.log("Starting sign out process");
      await firebaseSignOutUser();
      
      // NEW: Clear all user-related data
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