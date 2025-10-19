import React, { useState, useEffect } from "react";
import { View, Text, Pressable, Alert, ActivityIndicator } from "react-native";
import { useNavigation } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { API_ENDPOINTS } from "../config/api";

interface UserInfo {
  id: number;
  username: string;
  email: string;
  isOld: boolean;
  isVerified: boolean;
}

export default function SettingsScreen() {
  const navigation = useNavigation();
  const [isLoading, setIsLoading] = useState(false);
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [isLoadingUserInfo, setIsLoadingUserInfo] = useState(true);

  // Fetch user info on component mount
  useEffect(() => {
    fetchUserInfo();
  }, []);

  const fetchUserInfo = async () => {
    try {
      const token = await AsyncStorage.getItem("jwt");
      if (!token) {
        Alert.alert("Error", "Authentication token not found. Please log in again.");
        (navigation as any).reset({
          index: 0,
          routes: [{ name: "Login" }],
        });
        return;
      }

      const response = await fetch(API_ENDPOINTS.USER_INFO, {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setUserInfo(data.data);
      } else {
        Alert.alert("Error", "Failed to fetch user information.");
      }
    } catch (error) {
      Alert.alert("Error", "Failed to fetch user information.");
    } finally {
      setIsLoadingUserInfo(false);
    }
  };

  const handleSwitchRole = async () => {
    setIsLoading(true);
    try {
      const token = await AsyncStorage.getItem("jwt");
      if (!token) {
        Alert.alert("Error", "Authentication token not found. Please log in again.");
        setIsLoading(false);
        return;
      }

      const response = await fetch(API_ENDPOINTS.SWITCH_ROLE, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const data = await response.json();
        Alert.alert("Role Switch Failed", data.message || "Failed to switch role. Please try again.");
        setIsLoading(false);
        return;
      }

      // Show success message
      Alert.alert(
        "Role Updated",
        `You are now registered as an ${userInfo?.isOld ? "Adult (Guardian)" : "Elderly"} user.`,
        [{ text: "OK" }]
      );

      // Refresh user info to show updated role
      await fetchUserInfo();

    } catch (error) {
      Alert.alert("Error", "Failed to update role. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    await AsyncStorage.removeItem("jwt");
    (navigation as any).reset({
      index: 0,
      routes: [{ name: "Login" }],
    });
  };

  return (
    <View className="flex-1 bg-background p-safe">
      {/* Header */}
      <View className="flex-row items-center justify-between mb-8 mt-4">
        <Pressable
          onPress={() => navigation.goBack()}
          className="p-2"
        >
          <Text className="text-primary text-lg font-semibold">← Back</Text>
        </Pressable>
        <Text className="text-title font-bold text-gray-800">Settings</Text>
        <View className="w-12" />
      </View>

      {/* Role Selection Section */}
      <View className="mb-8">
        <Text className="text-subtitle font-semibold text-gray-800 mb-4">
          User Role
        </Text>
        
        {isLoadingUserInfo ? (
          <View className="py-8 items-center">
            <ActivityIndicator size="small" color="#666" />
            <Text className="text-body text-gray-600 mt-2">Loading user information...</Text>
          </View>
        ) : userInfo ? (
          <View>
            <View className="bg-gray-100 p-4 rounded-xl mb-4">
              <Text className="text-body text-gray-600 mb-1">Current Role:</Text>
              <Text className="text-subtitle font-semibold text-gray-800">
                {userInfo.isOld ? "Elderly" : "Adult (Guardian)"}
              </Text>
            </View>
            
            <Pressable
              className="bg-primary w-full py-4 rounded-xl"
              onPress={handleSwitchRole}
              disabled={isLoading}
            >
              <Text className="text-subtitle text-white font-semibold text-center">
                Switch Role
              </Text>
            </Pressable>
          </View>
        ) : (
          <View className="py-8 items-center">
            <Text className="text-body text-gray-600">Failed to load user information</Text>
            <Pressable
              className="bg-primary px-4 py-2 rounded-lg mt-2"
              onPress={fetchUserInfo}
            >
              <Text className="text-white font-semibold">Retry</Text>
            </Pressable>
          </View>
        )}
      </View>

      {/* Other Settings */}
      <View className="mb-8">
        <Text className="text-subtitle font-semibold text-gray-800 mb-4">
          Account
        </Text>
        
        <Pressable
          className="bg-warning w-full py-4 rounded-xl"
          onPress={handleLogout}
          disabled={isLoading}
        >
          <Text className="text-subtitle text-white font-semibold text-center">
            Logout
          </Text>
        </Pressable>
      </View>

      {isLoading && (
        <View className="absolute inset-0 bg-black bg-opacity-50 justify-center items-center">
          <ActivityIndicator size="large" color="#FFFFFF" />
          <Text className="text-white mt-2">Processing...</Text>
        </View>
      )}
    </View>
  );
}
