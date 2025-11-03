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
    <View className="flex-1 bg-background p-safe">
      {/* Header with Settings Button */}
      <View className="flex-row items-center justify-between mb-8 mt-12 px-4">
        <Text className="text-title font-bold text-gray-800">KinConnect</Text>
        <Pressable
          onPress={() => navigation.navigate("Settings")}
          className="bg-gray-100 px-4 py-3 rounded-lg active:bg-gray-200"
        >
          <Text className="text-gray-700 text-base font-semibold">Settings</Text>
        </Pressable>
      </View>

      {/* Main Content */}
      <View className="flex-1 justify-center items-center">
        <Text className="text-subtitle text-gray-600 mb-8 text-center px-4">
          Welcome to your dashboard! Use the settings button to customize your experience.
        </Text>

        <Pressable
          className="bg-warning w-4/5 py-4 rounded-xl"
          onPress={handleLogout}
        >
          <Text className="text-subtitle text-white font-semibold text-center">
            Logout
          </Text>
        </Pressable>
      </View>
    </View>
  );
}
