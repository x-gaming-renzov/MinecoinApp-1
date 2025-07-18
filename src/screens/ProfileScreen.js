import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Image,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { useAuth } from "../context/AuthContext";
import MCVerificationForm from "../components/profile/MCVerificationForm";
import TransactionList from "../components/profile/TransactionList";
import UserDetailsForm from "../components/profile/UserDetailsForm";
import GoogleSignInButton from "../components/common/GoogleSignInButton";
import { ArrowLeft } from "lucide-react-native";
import { colors } from "./theme";

// Import LinearGradient from expo-linear-gradient or react-native-linear-gradient
import { LinearGradient } from "expo-linear-gradient";

const ProfileScreen = () => {
  const navigation = useNavigation();
  const { isLoggedIn, signInWithGoogle, user } = useAuth();
  const [activeTab, setActiveTab] = useState("MC Verification");

  const tabs = [
    { id: "MC Verification", component: <MCVerificationForm /> },
    { id: "Transactions", component: <TransactionList /> },
    { id: "Events", component: <UserDetailsForm /> },
  ];

  if (!isLoggedIn) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backButton}
          >
            <ArrowLeft size={24} color={colors.accent} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Profile</Text>
        </View>

        <View style={styles.signInContainer}>
          <Text style={styles.message}>Please sign in to continue</Text>
          <GoogleSignInButton onPress={signInWithGoogle} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <LinearGradient
      colors={[colors.backgroundLight, colors.background]} // Replace with your gradient colors
      style={styles.gradient}
    >
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backButton}
          >
            <ArrowLeft size={24} color={colors.accent} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Profile</Text>
        </View>

        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          <View style={styles.userInfoCard}>
            <View style={styles.userInfoContent}>
              <View style={styles.avatarContainer}>
                {user?.photoURL ? (
                  <Image source={{ uri: user.photoURL }} style={styles.avatar} />
                ) : (
                  <View style={styles.avatarPlaceholder}>
                    <Text style={styles.avatarText}>
                      {user?.displayName?.charAt(0) || "U"}
                    </Text>
                  </View>
                )}
              </View>
              <View style={styles.userTextInfo}>
                <Text style={styles.welcomeText}>
                  Welcome, {user?.displayName || "User"}
                </Text>
                {user?.email && <Text style={styles.emailText}>{user.email}</Text>}
              </View>
            </View>
          </View>

          <View style={styles.tabContainer}>
            {tabs.map((tab) => (
              <TouchableOpacity
                key={tab.id}
                style={[styles.tab, activeTab === tab.id && styles.activeTab]}
                onPress={() => setActiveTab(tab.id)}
                activeOpacity={0.8}
              >
                <Text
                  style={[styles.tabText, activeTab === tab.id && styles.activeTabText]}
                >
                  {tab.id}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <View style={styles.content}>
            {tabs.map((tab) => (
              <View key={tab.id} style={{ display: activeTab === tab.id ? "flex" : "none" }}>
                {tab.component}
              </View>
            ))}
          </View>
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  gradient: {
    flex: 1,
  },
  container: {
    flex: 1,
    backgroundColor: "transparent", // Important to keep transparent to show gradient
  },
  scrollView: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    backgroundColor: "transparent",
    borderBottomWidth: 1,
    borderBottomColor: colors.accent,
  },
  backButton: {
    padding: 8,
    marginRight: 12,
    borderRadius: 12,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: colors.accent,
  },
  userInfoCard: {
    margin: 16,
    backgroundColor: colors.backgroundLight,
    borderRadius: 20,
    shadowColor: colors.accent,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 14,
    elevation: 6,
    borderWidth: 1,
    borderColor: colors.accent,
  },
  userInfoContent: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
  },
  avatarContainer: {
    marginRight: 16,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    borderWidth: 2,
    borderColor: colors.accent,
  },
  avatarPlaceholder: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.accentGlow,
    justifyContent: "center",
    alignItems: "center",
  },
  avatarText: {
    fontSize: 24,
    fontWeight: "700",
    color: colors.accent,
  },
  userTextInfo: {
    flex: 1,
  },
  welcomeText: {
    fontSize: 20,
    fontWeight: "700",
    color: colors.accent,
    marginBottom: 6,
  },
  emailText: {
    fontSize: 15,
    color: colors.mutedText,
  },
  signInContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 24,
  },
  message: {
    fontSize: 17,
    color: colors.mutedText,
    marginBottom: 24,
    textAlign: "center",
  },
  tabContainer: {
    flexDirection: "row",
    backgroundColor: colors.backgroundLight,
    marginHorizontal: 16,
    borderRadius: 16,
    padding: 4,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: colors.accent,
  },
  tab: {
    flex: 1,
    paddingVertical: 14,
    paddingHorizontal: 10,
    borderRadius: 12,
    alignItems: "center",
  },
  activeTab: {
    backgroundColor: colors.accent,
  },
  tabText: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.accent,
    textAlign: "center",
  },
  activeTabText: {
    color: colors.background,
    fontWeight: "700",
  },
  content: {
    flex: 1,
    marginHorizontal: 16,
  },
});

export default ProfileScreen;