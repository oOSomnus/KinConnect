import React, { useCallback, useMemo, useState } from "react";
import {
  View,
  Text,
  Pressable,
  ActivityIndicator,
  Alert,
  TextInput,
  ScrollView,
  Switch,
} from "react-native";
import { useFocusEffect, useRoute, useNavigation } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { API_ENDPOINTS } from "../config/api";
import { MessageDto, UserSimple } from "../types/api";

type RouteParams = {
  oldUser: UserSimple;
};

type MessageForm = MessageDto & { localId: string };

const createEmptyMessage = (): MessageForm => ({
  id: undefined,
  text: "",
  execTime: "",
  isOneTime: false,
  localId: `tmp-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
});

export default function RemindersScreen() {
  const route = useRoute();
  const navigation = useNavigation();
  const { oldUser } = route.params as RouteParams;

  const [messages, setMessages] = useState<MessageForm[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const fetchMessages = useCallback(async () => {
    setIsLoading(true);
    try {
      const token = await AsyncStorage.getItem("jwt");
      if (!token) {
        Alert.alert("Session expired", "Please log in again.");
        (navigation as any).reset({ index: 0, routes: [{ name: "Login" }] });
        return;
      }

      const response = await fetch(API_ENDPOINTS.MESSAGE_LIST(oldUser.id), {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        const list: MessageDto[] = data.data || [];
        setMessages(
          list.map((msg) => ({
            ...msg,
            localId: msg.id ?? `tmp-${msg.execTime}-${Math.random()}`,
          }))
        );
      } else if (response.status === 401) {
        Alert.alert("Session expired", "Please log in again.");
        await AsyncStorage.removeItem("jwt");
        (navigation as any).reset({ index: 0, routes: [{ name: "Login" }] });
      } else if (response.status === 404) {
        Alert.alert("Unavailable", "We could not load reminders for this user.");
      } else {
        Alert.alert("Error", "Failed to fetch reminder list.");
      }
    } catch (error) {
      Alert.alert("Error", "Unable to reach the server. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }, [navigation, oldUser.id]);

  useFocusEffect(
    useCallback(() => {
      fetchMessages();
    }, [fetchMessages])
  );

  const updateMessage = (localId: string, patch: Partial<MessageForm>) => {
    setMessages((prev) =>
      prev.map((msg) => (msg.localId === localId ? { ...msg, ...patch } : msg))
    );
  };

  const handleAddMessage = () => {
    setMessages((prev) => [...prev, createEmptyMessage()]);
  };

  const handleRemoveMessage = (localId: string) => {
    setMessages((prev) => prev.filter((msg) => msg.localId !== localId));
  };

  const handleSave = async () => {
    if (!messages.length) {
      Alert.alert("Nothing to save", "Please add at least one reminder.");
      return;
    }

    for (const msg of messages) {
      if (!msg.text.trim()) {
        Alert.alert("Missing text", "Every reminder needs a description.");
        return;
      }
      if (!msg.execTime.trim()) {
        Alert.alert("Missing schedule", "Please enter a valid cron expression.");
        return;
      }
    }

    setIsSaving(true);
    try {
      const token = await AsyncStorage.getItem("jwt");
      if (!token) {
        Alert.alert("Session expired", "Please log in again.");
        return;
      }

      const payload = messages.map(({ id, text, execTime, isOneTime }) => ({
        id,
        text: text.trim(),
        execTime: execTime.trim(),
        isOneTime,
      }));

      const response = await fetch(API_ENDPOINTS.MESSAGE_UPDATE(oldUser.id), {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (response.ok || response.status === 201) {
        Alert.alert("Saved", "Reminders updated successfully.");
        fetchMessages();
      } else if (response.status === 400) {
        const data = await response.json().catch(() => ({}));
        Alert.alert("Invalid data", data.message || "Please check your entries.");
      } else if (response.status === 403) {
        Alert.alert("Permission denied", "You can't edit reminders for this user.");
      } else {
        Alert.alert("Failed", "Unable to update reminders. Try again later.");
      }
    } catch (error) {
      Alert.alert("Error", "Network issue while saving reminders.");
    } finally {
      setIsSaving(false);
    }
  };

  const headerSubtitle = useMemo(
    () => `${oldUser.username} · ${oldUser.email}`,
    [oldUser.username, oldUser.email]
  );

  return (
    <View className="flex-1 bg-background p-safe">
      <View className="flex-row items-center justify-between mb-6 mt-12 px-4">
        <Pressable
          onPress={() => navigation.goBack()}
          className="bg-gray-100 px-4 py-3 rounded-lg active:bg-gray-200"
        >
          <Text className="text-gray-700 text-base font-semibold">← Back</Text>
        </Pressable>
        <Text className="text-title font-bold text-gray-800">Reminders</Text>
        <View className="w-20" />
      </View>

      <View className="px-4 mb-4">
        <Text className="text-subtitle font-semibold text-gray-900">
          {oldUser.username}
        </Text>
        <Text className="text-body text-gray-600">{headerSubtitle}</Text>
        <Text className="text-caption text-gray-500 mt-2">
          Use cron format (e.g., "0 0 9 * * ?") to schedule reminders.
        </Text>
      </View>

      {isLoading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#0F172A" />
          <Text className="text-body text-gray-600 mt-3">Loading reminders...</Text>
        </View>
      ) : (
        <ScrollView className="flex-1 px-4" contentContainerStyle={{ paddingBottom: 120 }}>
          {messages.map((message) => (
            <View
              key={message.localId}
              className="bg-white border border-gray-200 rounded-2xl p-4 mb-4"
            >
              <Text className="text-body font-semibold text-gray-900 mb-3">
                Reminder
              </Text>

              <Text className="text-caption text-gray-500 mb-1">Message</Text>
              <TextInput
                className="border border-gray-200 rounded-xl px-3 py-2 mb-3 bg-gray-50"
                placeholder="Take medication"
                value={message.text}
                onChangeText={(value) => updateMessage(message.localId, { text: value })}
                multiline
              />

              <Text className="text-caption text-gray-500 mb-1">Cron schedule</Text>
              <TextInput
                className="border border-gray-200 rounded-xl px-3 py-2 mb-3 bg-gray-50"
                placeholder="0 0 9 * * ?"
                value={message.execTime}
                onChangeText={(value) =>
                  updateMessage(message.localId, { execTime: value })
                }
              />

              <View className="flex-row items-center justify-between mb-3">
                <Text className="text-body text-gray-700">One-time reminder</Text>
                <Switch
                  value={message.isOneTime}
                  onValueChange={(value) =>
                    updateMessage(message.localId, { isOneTime: value })
                  }
                />
              </View>

              <Pressable
                className="bg-red-50 border border-red-200 rounded-xl py-2"
                onPress={() => handleRemoveMessage(message.localId)}
              >
                <Text className="text-center text-red-600 font-semibold">
                  Remove
                </Text>
              </Pressable>
            </View>
          ))}

          <Pressable
            className="border border-dashed border-primary rounded-2xl py-4 items-center justify-center mb-4"
            onPress={handleAddMessage}
          >
            <Text className="text-primary font-semibold">+ Add Reminder</Text>
          </Pressable>
        </ScrollView>
      )}

      <View className="px-4 pb-8">
        <Pressable
          className={`w-full py-4 rounded-xl ${
            isSaving ? "bg-gray-400" : "bg-primary"
          }`}
          onPress={handleSave}
          disabled={isSaving}
        >
          {isSaving ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text className="text-subtitle text-white font-semibold text-center">
              Save Reminders
            </Text>
          )}
        </Pressable>
      </View>
    </View>
  );
}
