import React, { useState } from "react";
import { View, Text, TextInput, Pressable, Alert } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { API_ENDPOINTS } from "../config/api";
import { useLocale } from "../context/LocaleContext";

export default function LoginScreen({ navigation }: any) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const { t } = useLocale();

  const handleLogin = async () => {
    // Validate input fields before making API call
    if (!email.trim()) {
      Alert.alert("Missing Information", "Please enter your email address.");
      return;
    }
    
    if (!password.trim()) {
      Alert.alert("Missing Information", "Please enter your password.");
      return;
    }
    
    // Basic email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      Alert.alert("Invalid Email", "Please enter a valid email address.");
      return;
    }

    try {
      const response = await fetch(API_ENDPOINTS.LOGIN, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim(),
          password: password,
        }),
      });

      if (!response.ok) {
        const data = await response.json();

        if (response.status === 401) {
          Alert.alert(
            "Login Failed",
            "Invalid email or password. Please check your credentials and try again."
          );
        } else if (response.status === 403) {
          Alert.alert(
            "Email Not Verified",
            "Please verify your email address before logging in. Check your inbox for verification instructions."
          );
        } else if (response.status === 404) {
          Alert.alert(
            "Account Not Found",
            "No account found with this email address. Please register first or check your email."
          );
        } else {
          Alert.alert("Login Failed", data.message || "Please try again.");
        }
        return;
      }

      const data = await response.json();
      await AsyncStorage.setItem("jwt", data.data.token);

      navigation.reset({
        index: 0,
        routes: [{ name: "Home" }],
      });
    } catch (error) {
      Alert.alert("Error,", "Failed to connect to the server.");
    }
  };

  return (
    <View className="flex-1 bg-background p-safe justify-center items-center">
      <Text className="text-title font-bold text-gray-800 mb-8">
        {t("login.title")}
      </Text>

      <TextInput
        className="w-4/5 mb-4 px-4 py-3 border border-gray-300 rounded-xl text-body bg-white"
        placeholder={t("login.emailPlaceholder")}
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
        autoCorrect={false}
      />
      <TextInput
        className="w-4/5 mb-6 px-4 py-3 border border-gray-300 rounded-xl text-body bg-white"
        placeholder={t("login.passwordPlaceholder")}
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />

      <Pressable
        className="bg-primary w-4/5 py-4 rounded-xl mb-3"
        onPress={handleLogin}
      >
        <Text className="text-subtitle text-white font-semibold text-center">
          {t("login.loginButton")}
        </Text>
      </Pressable>

      <Pressable
        className="w-4/5 py-3"
        onPress={() => navigation.navigate("Register")}
      >
        <Text className="text-body text-primary text-center">
          {t("login.signupLink")}
        </Text>
      </Pressable>
    </View>
  );
}
