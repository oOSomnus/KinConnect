import AsyncStorage from "@react-native-async-storage/async-storage";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import "./index.css";

import { StatusBar } from "expo-status-bar";
import { useEffect, useState } from "react";
import { StyleSheet } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import LoginScreen from "./screens/LoginScreen";
import HomeScreen from "./screens/HomeScreen";
import RegistrationScreen from "./screens/RegistrationScreen";
import SettingsScreen from "./screens/SettingsScreen";
import AddOldScreen from "./screens/AddOldScreen";
import RemindersScreen from "./screens/RemindersScreen";

const Stack = createNativeStackNavigator();

export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState<boolean | null>(null);
  
  useEffect(() => {
    const checkLogin = async () => {
      const token = await AsyncStorage.getItem("jwt");
      setIsLoggedIn(!!token);
    };
    checkLogin();
  }, []);

  if (isLoggedIn === null) {
    return null; // loading page is an option
  }
  return (
    <SafeAreaProvider>
      <NavigationContainer>
      <Stack.Navigator initialRouteName={isLoggedIn ? "Home" : "Login"}>
        <Stack.Screen
          name="Login"
          component={LoginScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="Register"
          component={RegistrationScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen 
          name="Home" 
          component={HomeScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="Settings"
          component={SettingsScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="AddOld"
          component={AddOldScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="Reminders"
          component={RemindersScreen}
          options={{ headerShown: false }}
        />
      </Stack.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}

// const styles = StyleSheet.create({
//   // container: {
//   //   flex: 1,
//   //   backgroundColor: "#fff",
//   //   alignItems: "center",
//   //   justifyContent: "center",
//   // },
// });
