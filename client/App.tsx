import AsyncStorage from "@react-native-async-storage/async-storage";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import "./index.css";

import { useEffect, useState } from "react";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { LocaleProvider } from "./context/LocaleContext";
import AddOldScreen from "./screens/AddOldScreen";
import HomeScreen from "./screens/HomeScreen";
import LoginScreen from "./screens/LoginScreen";
import RegistrationScreen from "./screens/RegistrationScreen";
import RemindersScreen from "./screens/RemindersScreen";
import SettingsScreen from "./screens/SettingsScreen";

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
    <LocaleProvider>
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
    </LocaleProvider>
  );
}
