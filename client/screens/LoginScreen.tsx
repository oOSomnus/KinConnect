import React, { useState } from "react";
import { View, Text, TextInput, Pressable, Alert } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

export default function LoginScreen({ navigation }: any) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = async () => {
    try {
      const response = await fetch("http://localhost:8080/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: `email=${encodeURIComponent(email)}&password=${encodeURIComponent(password)}`,
      });

      if (!response.ok) {
        const data = await response.json();
        
        if (response.status === 401) {
          Alert.alert("Login Failed", "Invalid email or password. Please check your credentials and try again.");
        } else if (response.status === 403) {
          Alert.alert("Email Not Verified", "Please verify your email address before logging in. Check your inbox for verification instructions.");
        } else if (response.status === 404) {
          Alert.alert("Account Not Found", "No account found with this email address. Please register first or check your email.");
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
        KinConnect Login
      </Text>

      <TextInput
        className="w-4/5 mb-4 px-4 py-3 border border-gray-300 rounded-xl text-body bg-white"
        placeholder="email"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
        autoCorrect={false}
      />
      <TextInput
        className="w-4/5 mb-6 px-4 py-3 border border-gray-300 rounded-xl text-body bg-white"
        placeholder="password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />

      <Pressable
        className="bg-primary w-4/5 py-4 rounded-xl mb-3"
        onPress={handleLogin}
      >
        <Text className="text-subtitle text-white font-semibold text-center">
          Login
        </Text>
      </Pressable>

      <Pressable
        className="w-4/5 py-3"
        onPress={() => navigation.navigate('Register')}
      >
        <Text className="text-body text-primary text-center">
          Don't have an account? Sign Up
        </Text>
      </Pressable>
    </View>
  );
}
