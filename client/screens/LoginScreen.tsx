import React, { useState } from "react";
import { View, Text, TextInput, Pressable, Alert } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

export default function LoginScreen({ navigation }: any) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = async () => {
    try {
      const response = await fetch("http://localhost/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      if (!response.ok) {
        Alert.alert("登录失败", "请检查用户名或密码");
        return;
      }

      const data = await response.json();
      await AsyncStorage.setItem("jwt", data.token);

      navigation.reset({
        index: 0,
        routes: [{ name: "Home" }],
      });
    } catch (error) {
      Alert.alert("错误", "无法连接服务器");
    }
  };

  return (
    <View className="flex-1 bg-background p-safe justify-center items-center">
      <Text className="text-title font-bold text-gray-800 mb-8">
        家庭提醒登录
      </Text>

      <TextInput
        className="w-4/5 mb-4 px-4 py-3 border border-gray-300 rounded-xl text-body bg-white"
        placeholder="用户名"
        value={username}
        onChangeText={setUsername}
      />
      <TextInput
        className="w-4/5 mb-6 px-4 py-3 border border-gray-300 rounded-xl text-body bg-white"
        placeholder="密码"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />

      <Pressable
        className="bg-primary w-4/5 py-4 rounded-xl mb-3"
        onPress={handleLogin}
      >
        <Text className="text-subtitle text-white font-semibold text-center">
          登录
        </Text>
      </Pressable>
    </View>
  );
}
