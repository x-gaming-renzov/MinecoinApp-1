// Header.js
import React, { useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet, Image, ActivityIndicator } from "react-native"; // NEW: Added ActivityIndicator
import { useNavigation } from "@react-navigation/native";
import { useUser } from "../../context/UserContext";
import { useAuth } from "../../context/AuthContext";
import { Server } from "lucide-react-native";
import ServerInfo from "./ServerInfo";

const Header = () => {
  const navigation = useNavigation();
  const { balance, isUpdating } = useUser(); // NEW: Added isUpdating from useUser
  const { user, isLoggedIn } = useAuth();
  const [showServerInfo, setShowServerInfo] = useState(false);

  const getInitials = () => {
    if (user?.displayName) {
      return user.displayName.split(" ")[0].charAt(0).toUpperCase();
    }
    return "U";
  };

  const handleServerPress = () => {
    if (!isLoggedIn) {
      navigation.navigate("Profile");
    } else {
      setShowServerInfo(true);
    }
  };

  return (
    <View style={styles.mainContainer}>
      <View style={styles.container}>
        <TouchableOpacity
          style={styles.profileContainer}
          onPress={() => navigation.navigate("Profile")}
          activeOpacity={0.8}
        >
          {isLoggedIn && user?.photoURL ? (
            <Image
              source={{ uri: user.photoURL }}
              style={styles.profileImage}
            />
          ) : (
            <View style={styles.initialsContainer}>
              <Text style={styles.initialsText}>{getInitials()}</Text>
            </View>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.balanceContainer}
          onPress={() => {
            if (!isLoggedIn) {
              navigation.navigate("Profile");
            } else {
              navigation.navigate("CoinBundle");
            }
          }}
          activeOpacity={0.9}
        >
          <View style={styles.balanceContent}>
            <Image
              source={require("../../../assets/rupee.png")}
              style={styles.coinIcon}
            />
            {/* NEW: Added loading state handling */}
            {isUpdating ? (
              <View style={styles.loaderContainer}>
                <ActivityIndicator size="small" color="#7C3AED" />
              </View>
            ) : (
              <Text style={styles.balanceText}>
                {balance?.toLocaleString() || "0"}
              </Text>
            )}
            <View style={styles.addButton}>
              <Text style={styles.addButtonText}>+</Text>
            </View>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.serverButton, { marginLeft: 8 }]}
          onPress={handleServerPress}
          activeOpacity={0.8}
        >
          <Server size={20} color="#7C3AED" />
        </TouchableOpacity>
      </View>

      <ServerInfo
        visible={showServerInfo}
        onClose={() => setShowServerInfo(false)}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  mainContainer: {
    backgroundColor: "#f2feff",
    paddingTop: 8,
  },
  container: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  profileContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    overflow: "hidden",
    backgroundColor: "#FFFFFF",
    elevation: 2,
    shadowColor: "#7C3AED",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
  },
  serverButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#FFFFFF",
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 12,
    elevation: 2,
    shadowColor: "#7C3AED",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
  },
  profileImage: {
    width: "100%",
    height: "100%",
    borderRadius: 18,
  },
  initialsContainer: {
    width: "100%",
    height: "100%",
    backgroundColor: "#FFFFFF",
    justifyContent: "center",
    alignItems: "center",
  },
  initialsText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#7C3AED",
  },
  balanceContainer: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    elevation: 2,
    shadowColor: "#7C3AED",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    marginLeft: "auto",
  },
  balanceContent: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 6,
  },
  coinIcon: {
    width: 20,
    height: 20,
    resizeMode: "contain",
  },
  // NEW: Added loader container style
  loaderContainer: {
    width: 60, // Match approximate width of balance text
    justifyContent: "center",
    alignItems: "center",
  },
  balanceText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1F2937",
    // minWidth: 60, // Ensure consistent width with loader
  },
  addButton: {
    backgroundColor: "#7C3AED",
    width: 22,
    height: 22,
    borderRadius: 11,
    justifyContent: "center",
    alignItems: "center",
  },
  addButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
    lineHeight: 22,
  },
});

export default Header;