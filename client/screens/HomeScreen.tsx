import React, { useState, useCallback } from "react";
import { View, Text, Pressable } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { API_ENDPOINTS } from "../config/api";

interface UserSimple {
  id: number;
  username: string;
  email: string;
}

interface UserInfo {
  id: number;
  username: string;
  email: string;
  isOld: boolean;
  isVerified: boolean;
  guardian: UserSimple | null;
  olds: UserSimple[];
}

export default function HomeScreen({ navigation }: any) {
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);

  const fetchUserInfo = useCallback(async () => {
    try {
      const token = await AsyncStorage.getItem("jwt");
      if (!token) return;

      const response = await fetch(API_ENDPOINTS.USER_INFO, {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        if (data.data) {
          setUserInfo({
            id: data.data.id,
            username: data.data.username,
            email: data.data.email,
            isOld: data.data.isOld,
            isVerified: data.data.isVerified,
            guardian: data.data.guardian || null,
            olds: data.data.olds || [],
          });
        }
      }
    } catch (error) {
      console.error("Error fetching user info:", error);
    }
  }, []);

  // Refresh user info whenever the screen comes into focus
  useFocusEffect(
    useCallback(() => {
      fetchUserInfo();
    }, [fetchUserInfo])
  );

  const handleLogout = async () => {
    await AsyncStorage.removeItem("jwt");
    navigation.reset({
      index: 0,
      routes: [{ name: "Login" }],
    });
  };

  return (
    <View className="flex-1 bg-background p-safe">
      {/* Header with Settings and Add Old Button */}
      <View className="flex-row items-center justify-between mb-8 mt-12 px-4">
        <Text className="text-title font-bold text-gray-800">KinConnect</Text>
        <View className="flex-row items-center gap-2">
          {/* Show Add Old button only for Adult (Guardian) users */}
          {userInfo && !userInfo.isOld && (
            <Pressable
              onPress={() => navigation.navigate("AddOld")}
              className="bg-primary px-4 py-3 rounded-lg active:bg-primary/80"
            >
              <Text className="text-white text-base font-semibold">Elderly</Text>
            </Pressable>
          )}
          <Pressable
            onPress={() => navigation.navigate("Settings", { onRoleSwitch: fetchUserInfo })}
            className="bg-gray-100 p-3 rounded-lg active:bg-gray-200 items-center justify-center"
          >
            <Text className="text-gray-700 text-xl">⚙️</Text>
          </Pressable>
        </View>
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
