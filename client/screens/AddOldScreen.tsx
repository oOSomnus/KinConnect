import React, { useState, useCallback } from "react";
import { View, Text, Pressable, TextInput, Alert, ActivityIndicator, ScrollView } from "react-native";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { API_ENDPOINTS } from "../config/api";
import { UserInfo, UserSimple } from "../types/api";

export default function AddOldScreen() {
  const navigation = useNavigation();
  const [addEmail, setAddEmail] = useState("");
  const [isAdding, setIsAdding] = useState(false);
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

  // Refresh user info when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      fetchUserInfo();
    }, [fetchUserInfo])
  );

  const handleAdd = async () => {
    if (!addEmail.trim()) {
      Alert.alert("Missing Information", "Please enter an email address or ID.");
      return;
    }

    // Check if input is numeric (ID) or email
    const isNumeric = /^\d+$/.test(addEmail.trim());
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!isNumeric && !emailRegex.test(addEmail.trim())) {
      Alert.alert("Invalid Input", "Please enter a valid email address or user ID.");
      return;
    }

    setIsAdding(true);

    try {
      const token = await AsyncStorage.getItem("jwt");
      if (!token) {
        Alert.alert("Error", "Authentication token not found. Please log in again.");
        setIsAdding(false);
        return;
      }

      // Prepare request body - use oldId if numeric, otherwise oldEmail
      const requestBody = isNumeric
        ? { oldId: parseInt(addEmail.trim()) }
        : { oldEmail: addEmail.trim() };

      const response = await fetch(API_ENDPOINTS.ADD_OLDS, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify(requestBody),
      });

      if (response.ok || response.status === 201) {
        Alert.alert("Success", "Elderly user added successfully!");
        setAddEmail("");
        // Refresh the list
        await fetchUserInfo();
      } else if (response.status === 404) {
        Alert.alert("User Not Found", "No user found with the provided email or ID.");
      } else if (response.status === 409) {
        Alert.alert("Already Added", "This elderly user is already associated with your account.");
      } else if (response.status === 403) {
        Alert.alert("Permission Denied", "You don't have permission to add elderly users.");
      } else {
        const errorData = await response.json().catch(() => ({ message: "Unknown error" }));
        Alert.alert("Add Failed", errorData.message || "Failed to add elderly user. Please try again.");
      }
    } catch (error) {
      Alert.alert("Error", "Failed to add elderly user. Please check your connection and try again.");
    } finally {
      setIsAdding(false);
    }
  };

  return (
    <View className="flex-1 bg-background p-safe">
      {/* Header */}
      <View className="flex-row items-center justify-between mb-8 mt-12 px-4">
        <Pressable
          onPress={() => navigation.goBack()}
          className="bg-gray-100 px-4 py-3 rounded-lg active:bg-gray-200"
        >
          <Text className="text-gray-700 text-base font-semibold">← Back</Text>
        </Pressable>
        <Text className="text-title font-bold text-gray-800">Elderly</Text>
        <View className="w-20" />
      </View>

      {/* Add Section */}
      <View className="px-4 mb-6">
        <Text className="text-subtitle font-semibold text-gray-800 mb-4">
          Add Elderly by Email or ID
        </Text>
        <View className="flex-row gap-2">
          <TextInput
            className="flex-1 px-4 py-3 border border-gray-300 rounded-xl text-body bg-white"
            placeholder="Enter email or user ID"
            placeholderTextColor="#9CA3AF"
            value={addEmail}
            onChangeText={setAddEmail}
            keyboardType="default"
            autoCapitalize="none"
            autoCorrect={false}
            editable={!isAdding}
          />
          <Pressable
            onPress={handleAdd}
            disabled={isAdding}
            className="bg-primary px-6 py-3 rounded-lg active:bg-primary/80"
          >
            {isAdding ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Text className="text-white text-base font-semibold">Add</Text>
            )}
          </Pressable>
        </View>
      </View>

      {/* List of Elderly Users */}
      <View className="flex-1 px-4">
        <Text className="text-subtitle font-semibold text-gray-800 mb-4">
          Associated Elderly Users
        </Text>
        <ScrollView>
          {userInfo && userInfo.olds.length > 0 ? (
            userInfo.olds.map((old) => (
              <View key={old.id} className="bg-white border border-gray-200 rounded-lg p-4 mb-3">
                <View className="mb-2">
                  <Text className="text-body text-gray-600">Username:</Text>
                  <Text className="text-body font-semibold text-gray-800">{old.username}</Text>
                </View>
                <View className="mb-2">
                  <Text className="text-body text-gray-600">Email:</Text>
                  <Text className="text-body font-semibold text-gray-800">{old.email}</Text>
                </View>
                <View>
                  <Text className="text-body text-gray-600">ID:</Text>
                  <Text className="text-body font-semibold text-gray-800">{old.id}</Text>
                </View>
              </View>
            ))
          ) : (
            <View className="bg-gray-50 border border-gray-200 rounded-lg p-6 items-center">
              <Text className="text-body text-gray-600 text-center">
                No elderly users associated yet.
              </Text>
              <Text className="text-body text-gray-500 text-center mt-2">
                Use the search box above to add elderly users.
              </Text>
            </View>
          )}
        </ScrollView>
      </View>
    </View>
  );
}
