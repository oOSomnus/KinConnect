import React, { useState, useCallback } from "react";
import { View, Text, Pressable, Alert, ScrollView } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { API_ENDPOINTS } from "../config/api";
import { UserInfo, UserSimple } from "../types/api";

export default function HomeScreen({ navigation }: any) {
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const fetchUserInfo = useCallback(async () => {
    setIsLoading(true);
    try {
      const token = await AsyncStorage.getItem("jwt");
      if (!token) {
        navigation.reset({ index: 0, routes: [{ name: "Login" }] });
        return;
      }

      const response = await fetch(API_ENDPOINTS.USER_INFO, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
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
        } else {
          setUserInfo(null);
        }
      } else if (response.status === 401) {
        Alert.alert("Session expired", "Please log in again.");
        await AsyncStorage.removeItem("jwt");
        navigation.reset({ index: 0, routes: [{ name: "Login" }] });
      } else {
        Alert.alert("Error", "Failed to load user information.");
      }
    } catch (error) {
      Alert.alert("Error", "Could not fetch user info. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }, [navigation]);

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

  const navigateToReminders = (oldUser: UserSimple, readonly = false) => {
    navigation.navigate("Reminders", { oldUser, readonly });
  };

  const renderGuardianView = () => (
    <View className="flex-1 px-4 pb-6">
      <Text className="text-subtitle font-semibold text-gray-800 mb-2">
        My Elderly Connections
      </Text>
      <ScrollView className="flex-1" contentContainerStyle={{ paddingBottom: 24 }}>
        {userInfo?.olds?.length ? (
          userInfo.olds.map((old) => (
            <Pressable
              key={old.id}
              className="bg-white border border-gray-200 rounded-2xl p-4 mb-3 shadow-sm"
              onPress={() => navigateToReminders(old)}
            >
              <Text className="text-body font-semibold text-gray-900 mb-1">
                {old.username}
              </Text>
              <Text className="text-body text-gray-600 mb-2">{old.email}</Text>
              <Text className="text-caption text-gray-500 mb-4">
                Tap to review reminders
              </Text>
              <View className="bg-primary/10 rounded-lg py-2 px-3 self-start">
                <Text className="text-primary font-semibold text-sm">
                  Manage Reminders
                </Text>
              </View>
            </Pressable>
          ))
        ) : (
          <View className="bg-gray-50 border border-dashed border-gray-300 rounded-2xl p-6 items-center">
            <Text className="text-body text-gray-600 text-center">
              No elderly users linked yet.
            </Text>
            <Text className="text-body text-gray-500 text-center mt-2">
              Tap "Elderly" above to add someone you care for.
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
  );

  const renderElderView = () => (
    <View className="flex-1 px-4 pb-6 items-center justify-center">
      <Text className="text-subtitle text-center text-gray-700 mb-6 px-4">
        Let your family know you're doing well.
      </Text>
      <Pressable
        className="bg-green-500 w-4/5 py-12 rounded-full items-center justify-center shadow-lg"
        onPress={() =>
          Alert.alert("I'm OK", "Daily check-ins will be connected soon.")
        }
      >
        <Text className="text-title text-white font-bold">I'm OK</Text>
      </Pressable>

      <Pressable
        className="bg-primary w-4/5 py-4 rounded-2xl mt-6"
        onPress={() =>
          userInfo &&
          navigateToReminders(
            {
              id: userInfo.id,
              username: userInfo.username,
              email: userInfo.email,
            },
            true
          )
        }
      >
        <Text className="text-subtitle text-white font-semibold text-center">
          View My Reminders
        </Text>
      </Pressable>

      {userInfo?.guardian && (
        <View className="mt-10 w-full bg-white border border-gray-200 rounded-2xl p-4">
          <Text className="text-body text-gray-500 mb-2">Guardian</Text>
          <Text className="text-subtitle font-semibold text-gray-900">
            {userInfo.guardian.username}
          </Text>
          <Text className="text-body text-gray-600">
            {userInfo.guardian.email}
          </Text>
        </View>
      )}
    </View>
  );

  return (
    <View className="flex-1 bg-background p-safe">
      <View className="flex-row items-center justify-between mb-8 mt-12 px-4">
        <Text className="text-title font-bold text-gray-800">KinConnect</Text>
        <View className="flex-row items-center gap-2">
          {userInfo && !userInfo.isOld && (
            <Pressable
              onPress={() => navigation.navigate("AddOld")}
              className="bg-primary px-4 py-3 rounded-lg active:bg-primary/80"
            >
              <Text className="text-white text-base font-semibold">Elderly</Text>
            </Pressable>
          )}
          <Pressable
            onPress={() =>
              navigation.navigate("Settings", { onRoleSwitch: fetchUserInfo })
            }
            className="bg-gray-100 p-3 rounded-lg active:bg-gray-200 items-center justify-center"
          >
            <Text className="text-gray-700 text-xl">⚙️</Text>
          </Pressable>
        </View>
      </View>

      {isLoading ? (
        <View className="flex-1 items-center justify-center">
          <Text className="text-body text-gray-600">Loading dashboard...</Text>
        </View>
      ) : userInfo ? (
        userInfo.isOld ? (
          renderElderView()
        ) : (
          renderGuardianView()
        )
      ) : (
        <View className="flex-1 items-center justify-center px-6">
          <Text className="text-body text-center text-gray-600 mb-4">
            We couldn't load your profile. Please try again later.
          </Text>
          <Pressable
            className="bg-primary px-5 py-3 rounded-xl"
            onPress={fetchUserInfo}
          >
            <Text className="text-white font-semibold">Retry</Text>
          </Pressable>
        </View>
      )}

      <View className="px-4 pb-8">
        <Pressable
          className="bg-warning w-full py-4 rounded-xl"
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
