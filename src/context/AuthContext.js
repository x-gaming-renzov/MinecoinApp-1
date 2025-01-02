import React, { createContext, useState, useContext, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  auth,
  configureGoogleSignIn,
  signInWithGoogle as firebaseSignInWithGoogle,
  signOutUser as firebaseSignOutUser,
  saveUserToFirestore,
  getUserData,
  updateFCMToken  // NEW: Import updateFCMToken
} from "../config/firebase";

// NEW: Import notification services
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
  // NEW: Add FCM token state
  const [fcmToken, setFcmToken] = useState("");

  // NEW: Setup notifications function
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

        // Setup notification handlers
        const notificationUnsubscribe = setupNotificationHandlers();
        
        // Setup token refresh listener
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

  // Function to restore user session
  const restoreUser = async () => {
    try {
      console.log("Attempting to restore user session");
      const userData = await AsyncStorage.getItem("user");
      if (userData) {
        console.log("Found stored user data");
        const parsedUser = JSON.parse(userData);
        
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
          
          // NEW: Setup notifications for restored user
          setupNotifications(updatedUser.email);
        }
      } else {
        console.log("No stored user session found");
      }
    } catch (error) {
      console.error("Error restoring user:", error);
    }
  };

  const signInWithGoogle = async () => {
    try {
      console.log("Starting Google Sign In process");
      const userCredential = await firebaseSignInWithGoogle();
      
      // NEW: Get FCM token during sign in
      const token = await getFCMToken();
      
      const userData = {
        email: userCredential.user.email,
        displayName: userCredential.user.displayName,
        photoURL: userCredential.user.photoURL,
        fcmToken: token  // NEW: Include FCM token in user data
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
      
      // NEW: Setup notifications after successful sign in
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
      console.log("Clearing local storage");
      await AsyncStorage.clear();
      
      console.log("Resetting auth states");
      setUser(null);
      setIsLoggedIn(false);
      setHasMcVerification(false);
      setFcmToken(""); // NEW: Clear FCM token state
      
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
        fcmToken,  // NEW: Expose FCM token through context
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