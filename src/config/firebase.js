import { GoogleSignin } from "@react-native-google-signin/google-signin";
import { initializeAuth, getReactNativePersistence, GoogleAuthProvider, signInWithCredential, signOut } from "firebase/auth";
import AsyncStorage from '@react-native-async-storage/async-storage';
import { initializeApp } from "firebase/app";
import { getFirestore, doc, setDoc, collection, getDocs, updateDoc, arrayUnion, getDoc } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyBeRGbmPSSpNvfHSxYvBox8XWWgTE7U7OA",
  authDomain: "minecoinaryan.firebaseapp.com",
  projectId: "minecoinaryan",
  storageBucket: "minecoinaryan.appspot.com",
  messagingSenderId: "488495063024",
  appId: "1:488495063024:web:6a42aa1d523ee45bba99d5"
};

const app = initializeApp(firebaseConfig);
const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage)
});
const db = getFirestore(app);

const configureGoogleSignIn = () => {
  console.log("Configuring Google Sign In...");
  GoogleSignin.configure({
    webClientId: "488495063024-sr6ml5ii2cek1nnvo6ca5ttl2ce3225d.apps.googleusercontent.com",
    scopes: ["email", "profile"],
  });
  console.log("Google Sign In configured successfully");
};

const signInWithGoogle = async () => {
  try {
    console.log("Checking Play Services...");
    await GoogleSignin.hasPlayServices();
    console.log("Getting user info from Google Sign In...");
    const userInfo = await GoogleSignin.signIn();
    console.log("User info received:", userInfo);
    console.log("Creating credential...");
    const credential = GoogleAuthProvider.credential(userInfo.data.idToken);
    console.log("Credential created successfully");
    console.log("Signing in with credential...");
    const result = await signInWithCredential(auth, credential);
    console.log("Sign in successful:", result.user.email);
    return result;
  } catch (error) {
    console.error("Detailed sign-in error:", {
      code: error.code,
      message: error.message,
      nativeError: error.nativeErrorMessage,
      stack: error.stack
    });
    throw error;
  }
};

// UPDATED: Initialize new user with transactions array
const saveUserToFirestore = async (user) => {
  try {
    console.log("Starting Firestore save for:", user.email);
    const userRef = doc(db, "users", user.email);
    await setDoc(userRef, {
      email: user.email,
      name: user.displayName,
      photoURL: user.photoURL,
      coinBalance: 0,
      purchasedAssets: [],
      transactions: [], // NEW: Added transactions array
      hasMcVerified: false,
      mcUsername: "",
      fcmToken: user.fcmToken  // NEW: Added FCM token field
    });
    console.log("Firestore save completed");
  } catch (error) {
    console.error("Firestore save error:", error);
    throw error;
  }
};

// NEW: Added function to update FCM token
const updateFCMToken = async (email, token) => {
  try {
    const userRef = doc(db, "users", email);
    await updateDoc(userRef, {
      fcmToken: token
    });
    console.log("FCM token updated successfully");
  } catch (error) {
    console.error("Error updating FCM token:", error);
    throw error;
  }
};

// NEW: Add function to get user data
const getUserData = async (email) => {
  try {
    const userRef = doc(db, "users", email);
    const userDoc = await getDoc(userRef);
    if (userDoc.exists()) {
      return userDoc.data();
    }
    return null;
  } catch (error) {
    console.error("Error getting user data:", error);
    throw error;
  }
};

const fetchGameAssets = async () => {
  try {
    console.log("Fetching game assets...");
    const gameAssetsRef = collection(db, "gameAssets");
    const snapshot = await getDocs(gameAssetsRef);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error("Error fetching game assets:", error);
    throw error;
  }
};

// NEW: Add function to fetch coin bundles
const fetchCoinBundles = async () => {
  try {
    console.log("Fetching coin bundles...");
    const bundlesRef = collection(db, "coinBundles");
    const snapshot = await getDocs(bundlesRef);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error("Error fetching coin bundles:", error);
    throw error;
  }
};

const syncPlayerUserBalance = async (email, username, amount) => {
  try {
    console.log("Syncing balance for user and player:", email, username);
    
    const userRef = doc(db, "users", email);
    const playerRef = doc(db, "players", username);
    
    // Update balance in both users and players collection
    await Promise.all([
      updateDoc(playerRef, { coinBalance: amount }),
      updateDoc(userRef, { coinBalance: amount })  // Sync user balance
    ]);
    
    console.log("Balance synced successfully for user and player");
    return amount;
  } catch (error) {   // ✅ Correct placement inside the function scope
    console.error("Error syncing player and user balance:", error);
    throw error;
  }
};

// Define and export updateUserBalance
const updateUserBalance = async (email, amount) => {
  const userRef = doc(db, "users", email);
  await updateDoc(userRef, { coinBalance: amount });
  console.log("User balance updated successfully.");
};

const updateMcUsername = async (email, username, password) => {
  try {
    console.log("Updating MC username and password for:", email);
    const userRef = doc(db, "users", email);

    await updateDoc(userRef, {
      mcUsername: username,
      mcPassword: password, // NEW: Adding password to Firestore
      hasMcVerified: true,
    });

    console.log("MC username and password updated successfully");
    return true;
  } catch (error) {
    console.error("Error updating MC username and password:", error);
    throw error;
  }
};

const savePurchaseHistory = async (email, purchaseDetails) => {
  try {
    console.log("Saving purchase for:", email);
    const userRef = doc(db, "users", email);
    await updateDoc(userRef, {
      purchasedAssets: arrayUnion({
        ...purchaseDetails,
        purchaseDate: new Date().toISOString()
      })
    });
    console.log("Purchase saved successfully");
  } catch (error) {
    console.error("Error saving purchase:", error);
    throw error;
  }
};

const signOutUser = async () => {
  try {
    console.log("Signing out...");
    await GoogleSignin.signOut();
    await signOut(auth);
    console.log("Sign out successful");
  } catch (error) {
    console.error("Sign-out error:", error);
    throw error;
  }
};

export {
  auth,
  db,
  configureGoogleSignIn,
  signInWithGoogle,
  signOutUser,
  saveUserToFirestore,
  fetchGameAssets,
  syncPlayerUserBalance,
  savePurchaseHistory,
  updateMcUsername, // UPDATED: Updated function to handle password
  getUserData, 
  fetchCoinBundles,
  updateUserBalance,  // Export updateUserBalance
  updateFCMToken,  // NEW: Added to exports
};