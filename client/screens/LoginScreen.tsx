import React, { useState } from "react";
import { View, Text, TextInput, Pressable, Alert } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

export default function LoginScreen({ navigation }: any) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = async () => {
    try {
      //FIXME: replace with real api call
      const response = await fetch("http://localhost/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      if (!response.ok) {
        Alert.alert("Login failed", "Please check the username or password.");
        return;
      }

      const data = await response.json();
      await AsyncStorage.setItem("jwt", data.token);

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
        placeholder="username"
        value={username}
        onChangeText={setUsername}
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
    </View>
  );
}
