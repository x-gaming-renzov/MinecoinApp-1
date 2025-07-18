import React from "react";
import { TouchableOpacity, Text, StyleSheet, Image, View } from "react-native";
import { useAuth } from "../../context/AuthContext";
import { colors } from "../../screens/theme";

const GoogleSignInButton = ({ style }) => {
  const { signInWithGoogle } = useAuth();

  const handleSignIn = async () => {
    try {
      await signInWithGoogle();
    } catch (error) {
      console.error("Sign-in error:", error);
    }
  };

  return (
    <TouchableOpacity
      style={[styles.button, style]}
      onPress={handleSignIn}
      activeOpacity={0.8}
    >
      <View style={styles.buttonContent}>
        <Image
          source={require("../../../assets/google.png")}
          style={styles.icon}
          resizeMode="contain"
        />
        <Text style={styles.buttonText}>Sign in with Google</Text>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    backgroundColor: colors.background,
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    elevation: 2,
    shadowColor: colors.accent,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  buttonContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  icon: {
    width: 24,
    height: 24,
    marginRight: 8,
  },
  buttonText: {
    color: colors.accent,
    fontSize: 16,
    fontWeight: "500",
  },
});

export default GoogleSignInButton;