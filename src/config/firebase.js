import { GoogleSignin } from "@react-native-google-signin/google-signin";
import { initializeAuth, getReactNativePersistence, GoogleAuthProvider, signInWithCredential, signOut } from "firebase/auth";
import AsyncStorage from '@react-native-async-storage/async-storage';
import { initializeApp } from "firebase/app";
import { getFirestore, doc, setDoc, collection, getDocs, updateDoc, arrayUnion, getDoc, query, orderBy, limit } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyBeRGbmPSSpNvfHSxYvBox8XWWgTE7U7OA",
  authDomain: "minecoinaryan.firebaseapp.com",
  projectId: "minecoinaryan",
  storageBucket: "minecoinaryan.appspot.com",
  messagingSenderId: "488495063024",
  appId: "1:488495063024:web:6a42aa1d523ee45bba99d5"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage)
});
const db = getFirestore(app);

const configureGoogleSignIn = () => {
  console.log("Configuring Google Sign In...");
  GoogleSignin.configure({
    webClientId: "488495063024-sr6ml5ii2cek1nnvo6ca5ttl2ce3225d.apps.googleusercontent.com",
    offlineAccess: true,
    scopes: ["email", "profile"]
  });
  console.log("Google Sign In configured successfully");
};

const signInWithGoogle = async () => {
  try {
    console.log("Starting Google Sign In process");
    
    // Check Play Services
    await GoogleSignin.hasPlayServices();
    
    // Sign in to Google
    const userInfo = await GoogleSignin.signIn();
    console.log("Google Sign In successful, getting tokens");
    
    // Get tokens
    const { accessToken, idToken } = await GoogleSignin.getTokens();
    if (!idToken) {
      throw new Error('No ID token present!');
    }
    
    // Create credential
    const credential = GoogleAuthProvider.credential(idToken, accessToken);
    console.log("Credential created, signing in to Firebase");
    
    // Sign in to Firebase
    const result = await signInWithCredential(auth, credential);
    console.log("Firebase sign in successful:", result.user.email);
    
    return result;
  } catch (error) {
    console.error("Google Sign In error:", {
      code: error.code,
      message: error.message,
      nativeError: error.nativeErrorMessage,
      stack: error.stack
    });
    throw error;
  }
};

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
      transactions: [],
      hasMcVerified: false,
      mcUsername: "",
      fcmToken: user.fcmToken,
      lastRewardTimestamp: 0  // Added this line
    });
    console.log("Firestore save completed");
  } catch (error) {
    console.error("Firestore save error:", error);
    throw error;
  }
};

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
const getRocketRideConfig = async () => {
  try {
    const configDoc = await getDoc(doc(db, "appConfig", "rocketRideConfig"));
    if (configDoc.exists()) {
      return configDoc.data();
    } else {
      console.warn("rocketRideConfig not found in appconfig.");
      return null;
    }
  } catch (error) {
    console.error("Error fetching rocket config:", error);
    return null;
  }
};

// In your firebase config file (e.g., firebase.js)
const initRocketRideConfig = async () => {
  console.log("🚀 Starting initRocketRideConfig...");

  const configRef = doc(db, "appConfig", "rocketRideConfig");

  const defaultConfig = {
    minBet: 50,
    maxBet: 7000,
    maxMultiplier: 7.0,
    houseEdge: 0.08,
    clickProtectionDelay: 600,
    minGameDuration: 1200,
    starCount: 90
  };

  try {
    console.log("📖 Checking if config exists...");
    const configSnap = await getDoc(configRef);

    if (!configSnap.exists()) {
      console.log("❌ Config doesn't exist, creating...");
      await setDoc(configRef, defaultConfig);
      console.log("✅ rocketRideConfig created with default values:", defaultConfig);
    } else {
      console.log("✅ Config exists:", configSnap.data());
      const existingData = configSnap.data();
      const updates = {};

      for (const key in defaultConfig) {
        if (!(key in existingData)) {
          updates[key] = defaultConfig[key];
        }
      }

      if (Object.keys(updates).length > 0) {
        await updateDoc(configRef, updates);
        console.log("🔄 Updated missing fields:", updates);
      } else {
        console.log("✅ All fields already exist");
      }
    }
  } catch (error) {
    console.error("❌ Error initializing rocketRideConfig:", error);
    console.error("Error details:", error.message);
  }
};
const fetchGameAssets = async () => {
  try {
    console.log("Fetching game assets...");
    const gameAssetsRef = collection(db, "gamesAssets");
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

const fetchCoinBundles = async () => {
  try {
    console.log("Fetching coin bundles...");
    const bundlesRef = collection(db, "coinBundles");
    const snapshot = await getDocs(bundlesRef);
    
    if (snapshot.empty) {
      console.log("No coin bundles found");
      return [];
    }

    const bundles = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    console.log(`Successfully fetched ${bundles.length} coin bundles`);
    return bundles;
  } catch (error) {
    console.error("Error fetching coin bundles:", error);
    throw error;
  }
};

const syncPlayerUserBalance = async (email, username, amount) => {
  try {
    console.log("Syncing balance for:", email, username);
    
    const userRef = doc(db, "users", email);
    const playerRef = doc(db, "players", username);
    
    await Promise.all([
      updateDoc(playerRef, { coinBalance: amount }),
      updateDoc(userRef, { coinBalance: amount })
    ]);
    
    console.log("Balance sync successful");
    return amount;
  } catch (error) {
    console.error("Error syncing balance:", error);
    throw error;
  }
};

const updateUserBalance = async (email, amount) => {
  try {
    const userRef = doc(db, "users", email);
    await updateDoc(userRef, { coinBalance: amount });
    console.log("Balance updated successfully");
  } catch (error) {
    console.error("Error updating balance:", error);
    throw error;
  }
};

const updateMcUsername = async (email, username, password) => {
  try {
    console.log("Updating MC credentials for:", email);
    const userRef = doc(db, "users", email);

    await updateDoc(userRef, {
      mcUsername: username,
      mcPassword: password,
      hasMcVerified: true,
    });

    console.log("MC credentials updated successfully");
    return true;
  } catch (error) {
    console.error("Error updating MC credentials:", error);
    throw error;
  }
};
const getGameConfig = async () => {
  try {
    console.log("Fetching game config...");
    const configRef = doc(db, "appConfig", "gameConfig");
    const configDoc = await getDoc(configRef);

    if (configDoc.exists()) {
      console.log("Game config fetched successfully");
      return configDoc.data();
    } else {
      console.log("Game config not found, creating with default values...");

      // Default game config structure
      const defaultGameConfig = {
        sections: {
          survival: {
            gradient: ["#059669", "#10B981"],
            shadowColor: "#10B981",
            borderColor: "rgba(16, 185, 129, 0.6)",
            bgColor: "rgba(16, 185, 129, 0.15)",
            icon: "🌲",
            name: "SURVIVAL"
          },
          lifesteal: {
            gradient: ["#EF4444", "#DC2626"],
            shadowColor: "#EF4444",
            borderColor: "rgba(239, 68, 68, 0.6)",
            bgColor: "rgba(239, 68, 68, 0.15)",
            icon: "⚔️",
            name: "LIFESTEAL"
          },
          creative: {
            gradient: ["#3B82F6", "#1D4ED8"],
            shadowColor: "#3B82F6",
            borderColor: "rgba(59, 130, 246, 0.6)",
            bgColor: "rgba(59, 130, 246, 0.15)",
            icon: "🎨",
            name: "CREATIVE"
          },
          pvp: {
            gradient: ["#F59E0B", "#D97706"],
            shadowColor: "#F59E0B",
            borderColor: "rgba(245, 158, 11, 0.6)",
            bgColor: "rgba(245, 158, 11, 0.15)",
            icon: "⚡",
            name: "PVP"
          },
          skyblock: {
            gradient: ["#8B5CF6", "#7C3AED"],
            shadowColor: "#8B5CF6",
            borderColor: "rgba(139, 92, 246, 0.6)",
            bgColor: "rgba(139, 92, 246, 0.15)",
            icon: "☁️",
            name: "SKYBLOCK"
          },
          prison: {
            gradient: ["#6B7280", "#4B5563"],
            shadowColor: "#6B7280",
            borderColor: "rgba(107, 114, 128, 0.6)",
            bgColor: "rgba(107, 114, 128, 0.15)",
            icon: "🔒",
            name: "PRISON"
          },
          default: {
            gradient: ["#059669", "#10B981"],
            shadowColor: "#10B981",
            borderColor: "rgba(16, 185, 129, 0.6)",
            bgColor: "rgba(58, 237, 118, 0.15)",
            icon: "🎮",
            name: "GAME"
          }
        }
      };

      // Create the document with default values
      await setDoc(configRef, defaultGameConfig);
      console.log("Game config created successfully with default values");
      return defaultGameConfig;
    }
  } catch (error) {
    console.error("Error fetching/creating game config:", error);
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
    console.log("Starting sign out process");
    await GoogleSignin.revokeAccess();
    await GoogleSignin.signOut();
    await signOut(auth);
    console.log("Sign out successful");
  } catch (error) {
    console.error("Sign out error:", error);
    throw error;
  }
};

const getLatestNotification = async () => {
  try {
    console.log("Fetching latest notification...");
    const notificationsRef = collection(db, "bannerNotifications");
    const q = query(notificationsRef, orderBy("timestamp", "desc"), limit(1));
    const snapshot = await getDocs(q);
    if (!snapshot.empty) {
      return {
        id: snapshot.docs[0].id,
        ...snapshot.docs[0].data()
      };
    }
    return null;
  } catch (error) {
    console.error("Error fetching notification:", error);
    throw error;
  }
};

// NEW: Add maintenance check function
const checkMaintenanceMode = async () => {
  try {
    const maintenanceRef = doc(db, "appConfig", "maintenance");
    const maintenanceDoc = await getDoc(maintenanceRef);
    return { isMaintenanceMode: false };
  } catch (error) {
    console.error("Error checking maintenance mode:", error);
    return { isMaintenanceMode: false };
  }
};

// Fetch all game events from Firebase
const fetchGameEvents = async () => {
  try {
    console.log("Fetching game events...");
    const eventsRef = collection(db, "gameEvents");
    const snapshot = await getDocs(eventsRef);
    
    if (snapshot.empty) {
      console.log("No game events found");
      return [];
    }

    const events = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    console.log(`Successfully fetched ${events.length} game events`);
    return events;
  } catch (error) {
    console.error("Error fetching game events:", error);
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
  getGameConfig,
  syncPlayerUserBalance,
  savePurchaseHistory,
  updateMcUsername,
  getUserData,
  fetchCoinBundles,
  updateUserBalance,
  updateFCMToken,
  getLatestNotification, // Add new export
  checkMaintenanceMode,  // NEW: Export maintenance check
  fetchGameEvents,
  initRocketRideConfig,
  getRocketRideConfig,// Add this new export
};