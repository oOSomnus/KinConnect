import React, { useState, useEffect } from "react";
import { View, Text, Pressable, Alert, ActivityIndicator } from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { API_ENDPOINTS } from "../config/api";
import { useLocale } from "../context/LocaleContext";
import { LANGUAGE_OPTIONS } from "../i18n/translations";

interface UserInfo {
  id: number;
  username: string;
  email: string;
  isOld: boolean;
  isVerified: boolean;
}

export default function SettingsScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const onRoleSwitch = (route.params as any)?.onRoleSwitch;
  const [isLoading, setIsLoading] = useState(false);
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [isLoadingUserInfo, setIsLoadingUserInfo] = useState(true);
  const { t, language, setLanguage } = useLocale();

  // Fetch user info on component mount
  useEffect(() => {
    fetchUserInfo();
  }, []);

  const fetchUserInfo = async () => {
    try {
      const token = await AsyncStorage.getItem("jwt");
      if (!token) {
        Alert.alert(t("home.alertNetworkTitle"), t("home.alertLoginBody"));
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
        Alert.alert(t("home.alertNetworkTitle"), t("settings.failedUser"));
      }
    } catch (error) {
      Alert.alert(t("home.alertNetworkTitle"), t("settings.failedUser"));
    } finally {
      setIsLoadingUserInfo(false);
    }
  };

  const handleSwitchRole = async () => {
    setIsLoading(true);
    try {
      const token = await AsyncStorage.getItem("jwt");
      if (!token) {
        Alert.alert(t("home.alertNetworkTitle"), t("home.alertLoginBody"));
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
        Alert.alert(
          t("settings.switchRole"),
          data.message || t("settings.switchRoleError")
        );
        setIsLoading(false);
        return;
      }

      // Silently refresh user info to show updated role
      await fetchUserInfo();
      
      // Notify HomeScreen to refresh immediately
      if (onRoleSwitch) {
        onRoleSwitch();
      }

    } catch (error) {
      Alert.alert(
        t("home.alertNetworkTitle"),
        t("settings.switchRoleError")
      );
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
      <View className="flex-row items-center justify-between mb-8 mt-12 px-4">
        <Pressable
          onPress={() => navigation.goBack()}
          className="bg-gray-100 px-4 py-3 rounded-lg active:bg-gray-200"
        >
          <Text className="text-gray-700 text-base font-semibold">← Back</Text>
        </Pressable>
        <Text className="text-title font-bold text-gray-800">
          {t("settings.title")}
        </Text>
        <View className="w-20" />
      </View>

      {/* Role Selection Section */}
      <View className="mb-8">
        <Text className="text-subtitle font-semibold text-gray-800 mb-4">
          {t("settings.userRole")}
        </Text>
        
        {isLoadingUserInfo ? (
          <View className="py-8 items-center">
            <ActivityIndicator size="small" color="#666" />
            <Text className="text-body text-gray-600 mt-2">
              {t("settings.loadingUser")}
            </Text>
          </View>
        ) : userInfo ? (
          <View>
            <View className="bg-gray-100 p-4 rounded-xl mb-4">
              <Text className="text-body text-gray-600 mb-1">
                {t("settings.userRole")}
              </Text>
              <Text className="text-subtitle font-semibold text-gray-800">
                {userInfo.isOld
                  ? t("settings.currentRoleElder")
                  : t("settings.currentRoleGuardian")}
              </Text>
            </View>
            
            <Pressable
              className="bg-primary w-full py-4 rounded-xl flex-row items-center justify-center"
              onPress={handleSwitchRole}
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <ActivityIndicator size="small" color="#FFFFFF" className="mr-2" />
                  <Text className="text-subtitle text-white font-semibold">
                    {t("settings.switching")}
                  </Text>
                </>
              ) : (
                <Text className="text-subtitle text-white font-semibold text-center">
                  {t("settings.switchRole")}
                </Text>
              )}
            </Pressable>
          </View>
        ) : (
          <View className="py-8 items-center">
            <Text className="text-body text-gray-600">
              {t("settings.failedUser")}
            </Text>
            <Pressable
              className="bg-primary px-4 py-2 rounded-lg mt-2"
              onPress={fetchUserInfo}
            >
              <Text className="text-white font-semibold">{t("settings.retry")}</Text>
            </Pressable>
          </View>
        )}
      </View>

      <View className="mb-8 px-1">
        <Text className="text-subtitle font-semibold text-gray-800 mb-1">
          {t("settings.languageTitle")}
        </Text>
        <Text className="text-body text-gray-500 mb-4">
          {t("settings.languageSubtitle")}
        </Text>
        {LANGUAGE_OPTIONS.map((option) => {
          const isActive = option.code === language;
          return (
            <Pressable
              key={option.code}
              className={`flex-row items-center justify-between px-4 py-3 rounded-xl mb-2 border ${
                isActive ? "border-primary bg-primary/10" : "border-gray-200 bg-white"
              }`}
              onPress={() => setLanguage(option.code)}
            >
              <Text
                className={`text-body font-semibold ${
                  isActive ? "text-primary" : "text-gray-800"
                }`}
              >
                {option.label}
              </Text>
              {isActive && <Text className="text-primary text-lg">✓</Text>}
            </Pressable>
          );
        })}
      </View>

      {/* Other Settings */}
      <View className="mb-8">
        <Text className="text-subtitle font-semibold text-gray-800 mb-4">
          {t("settings.accountTitle")}
        </Text>
        
        <Pressable
          className="bg-warning w-full py-4 rounded-xl"
          onPress={handleLogout}
          disabled={isLoading}
        >
          <Text className="text-subtitle text-white font-semibold text-center">
            {t("settings.logout")}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}
