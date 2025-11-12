import React, { useState, useCallback, useEffect, useRef } from "react";
import { View, Text, Pressable, Alert, ScrollView } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { API_ENDPOINTS } from "../config/api";
import { CheckInStatus, MessageDto, UserInfo, UserSimple } from "../types/api";
import { cronToSchedule } from "../utils/cron";

export default function HomeScreen({ navigation }: any) {
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [elderReminders, setElderReminders] = useState<MessageDto[]>([]);
  const [checkInStatus, setCheckInStatus] = useState<CheckInStatus | null>(null);
  const [isConfirming, setIsConfirming] = useState(false);
  const remindersRef = useRef<MessageDto[]>([]);
  const triggeredRef = useRef<Record<string, string>>({});
  const reminderTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

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

  const fetchElderReminders = useCallback(async () => {
    if (!userInfo?.isOld) {
      setElderReminders([]);
      return;
    }

    try {
      const token = await AsyncStorage.getItem("jwt");
      if (!token) return;

      const response = await fetch(API_ENDPOINTS.MESSAGE_LIST(userInfo.id), {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setElderReminders(Array.isArray(data.data) ? data.data : []);
      } else if (response.status === 401) {
        await AsyncStorage.removeItem("jwt");
        navigation.reset({ index: 0, routes: [{ name: "Login" }] });
      }
    } catch (error) {
      console.warn("Failed to fetch reminders", error);
    }
  }, [navigation, userInfo]);

  useEffect(() => {
    remindersRef.current = elderReminders;
  }, [elderReminders]);

  useEffect(() => {
    if (userInfo?.isOld) {
      fetchElderReminders();
    } else {
      setElderReminders([]);
    }
  }, [fetchElderReminders, userInfo?.isOld]);

  const fetchCheckInStatus = useCallback(async () => {
    if (!userInfo?.isOld) {
      setCheckInStatus(null);
      return;
    }
    try {
      const token = await AsyncStorage.getItem("jwt");
      if (!token) return;
      const response = await fetch(API_ENDPOINTS.CHECKIN_STATUS, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (response.ok) {
        const data = await response.json();
        setCheckInStatus(data.data);
      } else if (response.status === 401) {
        await AsyncStorage.removeItem("jwt");
        navigation.reset({ index: 0, routes: [{ name: "Login" }] });
      }
    } catch (error) {
      console.warn("Failed to fetch check-in status", error);
    }
  }, [navigation, userInfo?.isOld, userInfo?.guardian?.id]);

  useEffect(() => {
    if (userInfo?.isOld) {
      fetchCheckInStatus();
    } else {
      setCheckInStatus(null);
    }
  }, [fetchCheckInStatus, userInfo?.isOld, userInfo?.guardian?.id]);

  const checkAndAlertReminders = useCallback(() => {
    if (!userInfo?.isOld) return;

    const now = new Date();
    const currentMinuteStamp = `${now.getFullYear()}-${now.getMonth()}-${now.getDate()}-${now.getHours()}-${now.getMinutes()}`;
    const dayOfWeek = now.getDay();
    const hour = now.getHours();
    const minute = now.getMinutes();

    remindersRef.current.forEach((reminder, idx) => {
      const schedule = cronToSchedule(reminder.execTime);
      const dayMatch =
        schedule.frequency === "DAILY" ||
        schedule.daysOfWeek.includes(dayOfWeek);
      const timeMatch =
        schedule.hour === hour && schedule.minute === minute;

      if (dayMatch && timeMatch) {
        const reminderKey =
            reminder.id ??
            `${reminder.text}-${schedule.hour}-${schedule.minute}-${idx}`;
        if (triggeredRef.current[reminderKey] === currentMinuteStamp) {
          return;
        }
        triggeredRef.current[reminderKey] = currentMinuteStamp;
        Alert.alert(
          "Reminder",
          reminder.text || "Time for your scheduled check-in."
        );
      }
    });
  }, [userInfo?.isOld]);

  useEffect(() => {
    if (userInfo?.isOld) {
      if (reminderTimerRef.current) {
        clearInterval(reminderTimerRef.current);
      }
      reminderTimerRef.current = setInterval(checkAndAlertReminders, 15000);
      return () => {
        if (reminderTimerRef.current) {
          clearInterval(reminderTimerRef.current);
          reminderTimerRef.current = null;
        }
      };
    }

    if (reminderTimerRef.current) {
      clearInterval(reminderTimerRef.current);
      reminderTimerRef.current = null;
    }
    return undefined;
  }, [checkAndAlertReminders, userInfo?.isOld]);

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
              <Text className="text-body text-gray-600 mb-1">{old.email}</Text>
              <Text
                className={`text-caption font-semibold mb-1 ${
                  old.checkedInToday ? "text-green-600" : "text-red-500"
                }`}
              >
                {old.checkedInToday ? "Checked in today" : "Awaiting check-in"}
              </Text>
              {old.lastCheckInAt && (
                <Text className="text-caption text-gray-500 mb-2">
                  Last: {new Date(old.lastCheckInAt).toLocaleString()}
                </Text>
              )}
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

  const renderElderView = () => {
    const guardianInfo = checkInStatus?.guardian ?? userInfo?.guardian;
    const hasGuardian = Boolean(guardianInfo);
    const checkedInToday = checkInStatus?.checkedInToday ?? false;

    return (
      <View className="flex-1 px-4 pb-6 items-center justify-center">
      <Text className="text-subtitle text-center text-gray-700 mb-6 px-4">
        Let your family know you're doing well.
      </Text>
      <Pressable
        className={`w-4/5 py-12 rounded-full items-center justify-center shadow-lg ${
          hasGuardian
            ? checkedInToday
              ? "bg-green-300"
              : "bg-green-500"
            : "bg-gray-400"
        }`}
        disabled={
          !hasGuardian ||
          checkedInToday ||
          isConfirming
        }
        onPress={async () => {
          setIsConfirming(true);
          try {
            const token = await AsyncStorage.getItem("jwt");
            if (!token) {
              Alert.alert("Error", "Please log in again.");
              return;
            }
            const response = await fetch(API_ENDPOINTS.CHECKIN_CONFIRM, {
              method: "POST",
              headers: {
                Authorization: `Bearer ${token}`,
              },
            });
            if (response.ok || response.status === 201) {
              Alert.alert("Thank you!", "Status confirmed for today.");
              fetchCheckInStatus();
            } else {
              const data = await response.json().catch(() => ({}));
              Alert.alert(
                "Unable to confirm",
                data.message || "Please try again later."
              );
            }
          } catch (error) {
            Alert.alert("Error", "Unable to reach the server.");
          } finally {
            setIsConfirming(false);
          }
        }}
      >
        <Text className="text-title text-white font-bold">
          {hasGuardian
            ? checkedInToday
              ? "Checked In Today"
              : isConfirming
              ? "Confirming..."
              : "I'm OK"
            : "Bind a Guardian"}
        </Text>
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

      {checkInStatus?.lastCheckInAt && (
        <View className="mt-6 w-full bg-white border border-gray-200 rounded-2xl p-4">
          <Text className="text-body text-gray-500 mb-1">
            Last confirmed
          </Text>
          <Text className="text-subtitle font-semibold text-gray-900">
            {new Date(checkInStatus.lastCheckInAt).toLocaleString()}
          </Text>
        </View>
      )}

      {guardianInfo && (
        <View className="mt-10 w-full bg-white border border-gray-200 rounded-2xl p-4">
          <Text className="text-body text-gray-500 mb-2">Guardian</Text>
          <Text className="text-subtitle font-semibold text-gray-900">
            {guardianInfo.username}
          </Text>
          <Text className="text-body text-gray-600">
            {guardianInfo.email}
          </Text>
        </View>
      )}
      </View>
    );
  };

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
