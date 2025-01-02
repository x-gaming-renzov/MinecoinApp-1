import React, {
  createContext,
  useState,
  useContext,
  useCallback,
  useEffect,
} from "react";
import { useAuth } from "./AuthContext";
import { doc, updateDoc, getDoc, arrayUnion } from "firebase/firestore";
import { db } from "../config/firebase";
import { onSnapshot } from "firebase/firestore";  // NEW: Added for real-time updates

const UserContext = createContext(null);

export const UserProvider = ({ children }) => {
  console.log("UserProvider initialized");
  
  const { isLoggedIn, user } = useAuth();
  const [balance, setBalance] = useState(0);
  const [transactions, setTransactions] = useState([]);
  const [hasMcVerified, setHasMcVerified] = useState(false);
  const [mcCredentials, setMcCredentials] = useState({
    username: "",
    password: "",
  });
  const [linkedPlayer, setLinkedPlayer] = useState(null);

  useEffect(() => {
    console.log("Auth state changed:", { isLoggedIn, userEmail: user?.email });
    if (isLoggedIn && user) {
      console.log("Loading user data from Firestore...");
      loadFirestoreData();
    } else {
      console.log("User logged out, resetting states");
      setBalance(0);
      setTransactions([]);
      setHasMcVerified(false);
      setMcCredentials({ username: "", password: "" });
      setLinkedPlayer(null);
    }
  }, [isLoggedIn, user]);

  // ADD THIS NEW useEffect right after the existing one
  useEffect(() => {
    // Only start listening if user is logged in and has MC username
    if (isLoggedIn && user && mcCredentials.username) {
      console.log("Setting up real-time listener for player balance");
      
      const playerRef = doc(db, "players", mcCredentials.username);
  
      const userRef = doc(db, "users", user.email);

      // Enhanced real-time listener that updates both app and user data
      const unsubscribe = onSnapshot(playerRef, async (doc) => {
        if (doc.exists()) {
          const playerData = doc.data();
          try {
            // Update both app state and user document atomically
            await updateDoc(userRef, {
              coinBalance: playerData.coinBalance,
              // lastSync: new Date().toISOString()  // Added to track syncs
            });
            setBalance(playerData.coinBalance);
            console.log("Balance synced successfully:", playerData.coinBalance);
            
            // Update linkedPlayer state also
            setLinkedPlayer(prev => ({
              ...prev,
              coinBalance: playerData.coinBalance
            }));
          } catch (error) {
            console.error("Sync error:", error);
            // Optionally retry or show error to user
          }
        }
      });
  
      return () => unsubscribe();
    }
  }, [isLoggedIn, user, mcCredentials.username]);

  const loadFirestoreData = async () => {
    try {
      console.log("Fetching user data for:", user.email);
      const userRef = doc(db, "users", user.email);
      const userDoc = await getDoc(userRef);
      
      if (userDoc.exists()) {
        const userData = userDoc.data();
        console.log("User data loaded", userData);
        
        setBalance(userData.coinBalance || 0);
        setTransactions(userData.transactions || []);
        setHasMcVerified(userData.hasMcVerified || false);
        setMcCredentials({
          username: userData.mcUsername || "",
          password: userData.mcPassword || "",
        });
  
        // Sync user balance with player data
        if (userData.hasMcVerified && userData.mcUsername) {
          const playerRef = doc(db, "players", userData.mcUsername);
          const playerDoc = await getDoc(playerRef);
          
          if (playerDoc.exists()) {
            const playerData = playerDoc.data();
            setLinkedPlayer({
              id: playerDoc.id,
              coinBalance: playerData.coinBalance,
              ...playerData
            });
  
            // Update user balance with player balance
           if (playerData.coinBalance !== userData.coinBalance) {
  setBalance(playerData.coinBalance);
}

          }
        }
      }
    } catch (error) {
      console.error("Error loading Firestore data:", error);
    }
  };
  
  const syncPlayerData = async (username, updates) => {
    try {
      const playerRef = doc(db, "players", username);
      await updateDoc(playerRef, updates);
      
      const playerDoc = await getDoc(playerRef);
      if (playerDoc.exists()) {
        const playerData = playerDoc.data();
        setLinkedPlayer({
          id: playerDoc.id,
          imgUrl: playerData.imgUrl,
          kills: playerData.kills,
          deaths: playerData.deaths,
          kdRatio: playerData.kdRatio,
          leaderboardPosition: playerData.leaderboardPosition,
          coinBalance: playerData.coinBalance,
          lastLogin: playerData.lastLogin,
          ip: playerData.ip,
          UUID: playerData.UUID,
          ...playerData
        });
      }
    } catch (error) {
      console.error("Error syncing player data:", error);
      throw error;
    }
  };

  const updateMcCredentials = async (username, password, playerBalance = 0) => { // NEW: Added playerBalance parameter
    try {
      console.log("Updating MC credentials for:", user.email);
      const userRef = doc(db, "users", user.email);
      const playerRef = doc(db, "players", username);
      
      const playerDoc = await getDoc(playerRef);
      if (!playerDoc.exists()) {
        throw new Error("Player not found");
      }
  
      // NEW: Update user doc with all data at once
      await updateDoc(userRef, {
        mcUsername: username,
        mcPassword: password,
        hasMcVerified: true,
        coinBalance: playerBalance // Updated to sync player balance
      });
  
      await updateDoc(playerRef, {
        password: password
      });
  
      // NEW: Update all states immediately
      setMcCredentials({ username, password });
      setHasMcVerified(true);
      setBalance(playerBalance);  // Sync local state immediately
      await loadFirestoreData();  // Reload data after update

      const updatedPlayerDoc = await getDoc(playerRef);
      const playerData = updatedPlayerDoc.data();
      setLinkedPlayer({
        id: updatedPlayerDoc.id,
        imgUrl: playerData.imgUrl,
        kills: playerData.kills,
        deaths: playerData.deaths,
        kdRatio: playerData.kdRatio,
        leaderboardPosition: playerData.leaderboardPosition,
        coinBalance: playerData.coinBalance,
        lastLogin: playerData.lastLogin,
        ip: playerData.ip,
        UUID: playerData.UUID,
        ...playerData
      });

      return true;
    } catch (error) {
      console.error("Error updating MC credentials:", error);
      return false;
    }
  };

  const updateMcVerificationStatus = async (status) => {
    try {
      console.log("Updating MC verification status:", status);
      const userRef = doc(db, "users", user.email);
      await updateDoc(userRef, {
        hasMcVerified: status,
      });
      setHasMcVerified(status);
      return true;
    } catch (error) {
      console.error("Error updating MC verification status:", error);
      return false;
    }
  };

  const hasSufficientBalance = useCallback(
    (amount) => {
      const sufficient = balance >= amount;
      console.log("Balance check:", { required: amount, current: balance, sufficient });
      return sufficient;
    },
    [balance]
  );

  const processPurchase = useCallback(
    async (amount, itemDetails) => {
      console.log("Processing purchase:", { amount, itemDetails });
      if (!hasMcVerified) {
        throw new Error("Minecraft verification required");
      }
      if (!hasSufficientBalance(amount)) {
        throw new Error("Insufficient balance");
      }

      try {
        const newBalance = balance - amount;
        const newTransaction = {
          type: "purchase",
          amount: -amount,
          details: itemDetails,
          id: Date.now().toString(),
          timestamp: new Date().toISOString(),
        };

        const userRef = doc(db, "users", user.email);
        await Promise.all([
          updateDoc(userRef, {
            coinBalance: newBalance,
            transactions: arrayUnion(newTransaction),
          }),
          syncPlayerData(mcCredentials.username, {
            coinBalance: newBalance
          })
        ]);

        setBalance(newBalance);
        setTransactions((prev) => [...prev, newTransaction]);
        return true;
      } catch (error) {
        console.error("Purchase failed:", error);
        throw error;
      }
    },
    [balance, hasSufficientBalance, hasMcVerified, user, mcCredentials]
  );

  const addCoins = useCallback(
    async (amount) => {
      console.log("Adding coins:", amount);
      try {
        const newBalance = balance + amount;
        const newTransaction = {
          type: "credit",
          amount: amount,
          id: Date.now().toString(),
          timestamp: new Date().toISOString(),
        };

        const userRef = doc(db, "users", user.email);
        await Promise.all([
          updateDoc(userRef, {
            coinBalance: newBalance,
            transactions: arrayUnion(newTransaction),
          }),
          syncPlayerData(mcCredentials.username, {
            coinBalance: newBalance
          })
        ]);

        setBalance(newBalance);
        setTransactions((prev) => [...prev, newTransaction]);
        return true;
      } catch (error) {
        console.error("Failed to add coins:", error);
        throw error;
      }
    },
    [balance, user, mcCredentials]
  );

  return (
    <UserContext.Provider
      value={{
        balance,
        transactions,
        hasSufficientBalance,
        processPurchase,
        addCoins,
        hasMcVerified,
        updateMcVerificationStatus,
        updateMcCredentials,
        mcCredentials,
        linkedPlayer,
        loadFirestoreData,  // NEW: Export this function
      }}
    >
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error("useUser must be used within a UserProvider");
  }
  return context;
};

export default UserContext;