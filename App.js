import React from "react";
import { StatusBar, Platform } from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { AuthProvider } from "./src/context/AuthContext";
import { UserProvider } from "./src/context/UserContext";
import AppNavigator from "./src/navigation/AppNavigator";
import { adapty } from 'react-native-adapty';
import MaintenanceCheck from "./src/components/common/MaintenanceCheck";

adapty.activate('public_live_a2ZpIYeH.UBLMWSv1MLfHElcx8N9j');

const App = () => {
  return (
    <AuthProvider>
      <UserProvider>
      <MaintenanceCheck>  
        <GestureHandlerRootView style={{ flex: 1 }}>
          <SafeAreaProvider>
            <StatusBar
              barStyle={Platform.OS === "ios" ? "dark-content" : "light-content"}
              backgroundColor="#f2feff"
              translucent
            />
            <NavigationContainer>
              <AppNavigator />
            </NavigationContainer>
          </SafeAreaProvider>
        </GestureHandlerRootView>
        </MaintenanceCheck>  {/* Add this */}
      </UserProvider>
    </AuthProvider>
  );
};

export default App;