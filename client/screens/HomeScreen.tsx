import React from "react";
import { View, Text, Pressable } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

export default function HomeScreen({ navigation }: any) {
  const handleLogout = async () => {
    await AsyncStorage.removeItem("jwt");
    navigation.reset({
      index: 0,
      routes: [{ name: "Login" }],
    });
  };

  return (
    <View className="flex-1 bg-background p-safe justify-center items-center">
      <Text className="text-title font-bold text-gray-800 mb-6">
        欢迎回来！
      </Text>

      <Pressable
        className="bg-warning w-4/5 py-4 rounded-xl"
        onPress={handleLogout}
      >
        <Text className="text-subtitle text-white font-semibold text-center">
          退出登录
        </Text>
      </Pressable>
    </View>
  );
}
