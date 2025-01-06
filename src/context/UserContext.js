import React, {
  createContext,
  useState,
  useContext,
  useCallback,
  useEffect,
} from "react";
import { useAuth } from "./AuthContext";
import { doc, updateDoc, getDoc, arrayUnion, onSnapshot } from "firebase/firestore";
import { db } from "../config/firebase";

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

  // NEW: Added real-time player data sync
  useEffect(() => {
    if (isLoggedIn && user && mcCredentials.username) {
      console.log("Setting up real-time player data sync");
      const playerRef = doc(db, "players", mcCredentials.username);
      
      const unsubscribe = onSnapshot(playerRef, (doc) => {
        if (doc.exists()) {
          const playerData = doc.data();
          setLinkedPlayer(prev => ({
            ...prev,
            kills: playerData.kills,
            deaths: playerData.deaths,
            kdRatio: playerData.kdRatio,
            leaderboardPosition: playerData.leaderboardPosition,
            imgUrl: playerData.imgUrl,
            coinBalance: playerData.coinBalance,
            ip: playerData.ip,
            UUID: playerData.UUID,
          }));
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

  const recordPurchaseTransaction = async (amount, productDetails) => {
    try {
      const transaction = {
        type: "purchase",
        amount: amount,
        timestamp: new Date().toISOString(),
        productId: productDetails.productId || productDetails.vendorProductId,
        description: `Purchased ${productDetails.name || 'Unknown Bundle'}`,
        id: Date.now().toString(),
      };
  
      const userRef = doc(db, "users", user.email);
      await updateDoc(userRef, {
        transactions: arrayUnion(transaction)
      });
  
      setTransactions(prev => [...prev, transaction]);
      console.log("Purchase transaction recorded successfully");
    } catch (error) {
      console.error("Error recording purchase transaction:", error);
      throw error;
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
          ...playerData
        });
      }
    } catch (error) {
      console.error("Error syncing player data:", error);
      throw error;
    }
  };

  const updateMcCredentials = async (username, password, playerBalance = 0) => {
    try {
      console.log("Updating MC credentials for:", user.email);
      const userRef = doc(db, "users", user.email);
      const playerRef = doc(db, "players", username);
      
      const playerDoc = await getDoc(playerRef);
      if (!playerDoc.exists()) {
        throw new Error("Player not found");
      }
  
      await updateDoc(userRef, {
        mcUsername: username,
        mcPassword: password,
        hasMcVerified: true,
        coinBalance: playerBalance
      });
  
      await updateDoc(playerRef, {
        password: password
      });
  
      setMcCredentials({ username, password });
      setHasMcVerified(true);
      setBalance(playerBalance);
      await loadFirestoreData();

      const updatedPlayerDoc = await getDoc(playerRef);
      const playerData = updatedPlayerDoc.data();
      setLinkedPlayer({
        id: updatedPlayerDoc.id,
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
  async (amount, productDetails = null) => {
    try {
      const newBalance = balance + amount;
      const transaction = {
        type: "credit",
        amount: amount,
        id: Date.now().toString(),
        timestamp: new Date().toISOString(),
        ...(productDetails && {
          productId: productDetails.productId || productDetails.vendorProductId,
          description: `Purchased ${productDetails.name || 'Coin Bundle'}`
        })
      };

      const userRef = doc(db, "users", user.email);
      await Promise.all([
        updateDoc(userRef, {
          coinBalance: newBalance,
          transactions: arrayUnion(transaction),
        }),
        mcCredentials.username && syncPlayerData(mcCredentials.username, {
          coinBalance: newBalance
        })
      ]);

      setBalance(newBalance);
      setTransactions((prev) => [...prev, transaction]);
      
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
        loadFirestoreData,
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