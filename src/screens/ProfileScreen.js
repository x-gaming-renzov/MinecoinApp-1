import React, { useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Image } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { useAuth } from "../context/AuthContext";
import MCVerificationForm from "../components/profile/MCVerificationForm";
import TransactionList from "../components/profile/TransactionList";
import UserDetailsForm from "../components/profile/UserDetailsForm";
import GoogleSignInButton from "../components/common/GoogleSignInButton";
import { ArrowLeft } from "lucide-react-native";

const ProfileScreen = () => {
  const navigation = useNavigation();
  const { isLoggedIn, signInWithGoogle, user } = useAuth();
  const [activeTab, setActiveTab] = useState("MC Verification");
  const tabs = ["MC Verification", "Transaction History", "User Details"];

  const renderContent = () => {
    switch (activeTab) {
      case "MC Verification":
        return <MCVerificationForm />;
      case "Transaction History":
        return <TransactionList />;
      case "User Details":
        return <UserDetailsForm />;
      default:
        return null;
    }
  };

  if (!isLoggedIn) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backButton}
          >
            <ArrowLeft size={24} color="#7C3AED" />
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
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <ArrowLeft size={24} color="#7C3AED" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Profile</Text>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.userInfoCard}>
          <View style={styles.userInfoContent}>
            <View style={styles.avatarContainer}>
              {user?.photoURL ? (
                <Image 
                  source={{ uri: user.photoURL }} 
                  style={styles.avatar}
                />
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
              {user?.email && (
                <Text style={styles.emailText}>{user.email}</Text>
              )}
            </View>
          </View>
        </View>

        <View style={styles.tabContainer}>
          {tabs.map((tab) => (
            <TouchableOpacity
              key={tab}
              style={[
                styles.tab,
                activeTab === tab && styles.activeTab,
              ]}
              onPress={() => setActiveTab(tab)}
            >
              <Text
                style={[
                  styles.tabText,
                  activeTab === tab && styles.activeTabText,
                ]}
              >
                {tab}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.content}>
          {renderContent()}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f2feff",
  },
  scrollView: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    backgroundColor: "#f2feff",
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  backButton: {
    padding: 8,
    marginRight: 12,
    borderRadius: 12,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: "#1F2937",
  },
  userInfoCard: {
    margin: 16,
    backgroundColor: "#7C3AED",
    borderRadius: 20,
    shadowColor: "#7C3AED",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 4,
  },
  userInfoContent: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
  },
  avatarContainer: {
    marginRight: 12,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 2,
    borderColor: "#FFFFFF",
  },
  avatarPlaceholder: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    justifyContent: "center",
    alignItems: "center",
  },
  avatarText: {
    fontSize: 20,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  userTextInfo: {
    flex: 1,
  },
  welcomeText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#FFFFFF",
    marginBottom: 4,
  },
  emailText: {
    fontSize: 14,
    color: "#FFFFFF",
    opacity: 0.9,
  },
  signInContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 24,
  },
  message: {
    fontSize: 16,
    color: "#1F2937",
    marginBottom: 24,
    textAlign: "center",
  },
  tabContainer: {
    flexDirection: "row",
    backgroundColor: "rgba(124, 58, 237, 0.1)",
    marginHorizontal: 16,
    borderRadius: 16,
    padding: 4,
    marginBottom: 16,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 12,
  },
  activeTab: {
    backgroundColor: "#7C3AED",
  },
  tabText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#7C3AED",
    textAlign: "center",
  },
  activeTabText: {
    color: "#FFFFFF",
    fontWeight: "600",
  },
  content: {
    flex: 1,
    marginHorizontal: 16,
  },
});

export default ProfileScreen;