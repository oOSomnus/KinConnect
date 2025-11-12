import React, { useCallback, useMemo, useRef, useState } from "react";
import {
  View,
  Text,
  Pressable,
  ActivityIndicator,
  Alert,
  TextInput,
  ScrollView,
  Switch,
  NativeScrollEvent,
  NativeSyntheticEvent,
} from "react-native";
import {
  useFocusEffect,
  useRoute,
  useNavigation,
} from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { API_ENDPOINTS } from "../config/api";
import { useLocale } from "../context/LocaleContext";
import { MessageDto, UserSimple } from "../types/api";
import {
  Frequency,
  cronToSchedule,
  defaultSchedule,
  describeSchedule,
  scheduleToCron,
} from "../utils/cron";

type RouteParams = {
  oldUser: UserSimple;
  readonly?: boolean;
};

type MessageForm = {
  id?: string;
  text: string;
  isOneTime: boolean;
  localId: string;
  hour: number;
  minute: number;
  frequency: Frequency;
  daysOfWeek: number[];
};

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const ITEM_HEIGHT = 42;
const HOUR_OPTIONS = Array.from({ length: 24 }, (_, i) => i);
const MINUTE_OPTIONS = Array.from({ length: 60 }, (_, i) => i);

const pad = (val: number) => val.toString().padStart(2, "0");

const TimeWheelColumn = ({
  options,
  value,
  onChange,
  disabled,
  labelFormatter,
}: {
  options: number[];
  value: number;
  onChange: (val: number) => void;
  disabled?: boolean;
  labelFormatter?: (val: number) => string;
}) => {
  const scrollRef = useRef<ScrollView>(null);

  const scrollToValue = useCallback(
    (target: number, animated = false) => {
      const index = Math.max(0, options.indexOf(target));
      scrollRef.current?.scrollTo({
        y: index * ITEM_HEIGHT,
        animated,
      });
    },
    [options]
  );

  React.useEffect(() => {
    scrollToValue(value);
  }, [value, scrollToValue]);

  const handleEnd = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const offsetY = event.nativeEvent.contentOffset.y;
    const index = Math.round(offsetY / ITEM_HEIGHT);
    const selected = options[Math.min(options.length - 1, Math.max(0, index))];
    if (selected !== value) {
      onChange(selected);
    }
  };

  return (
    <View style={{ height: ITEM_HEIGHT * 5, position: "relative" }}>
      <ScrollView
        ref={scrollRef}
        snapToInterval={ITEM_HEIGHT}
        snapToAlignment="center"
        decelerationRate="fast"
        showsVerticalScrollIndicator={false}
        scrollEnabled={!disabled}
        contentContainerStyle={{ paddingVertical: ITEM_HEIGHT * 2 }}
        onMomentumScrollEnd={handleEnd}
        style={{ flex: 1 }}
      >
        {options.map((opt) => (
          <View
            key={opt}
            style={{
              height: ITEM_HEIGHT,
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            <Text
              className={`text-lg ${
                opt === value ? "text-gray-900 font-semibold" : "text-gray-400"
              }`}
            >
              {labelFormatter ? labelFormatter(opt) : opt}
            </Text>
          </View>
        ))}
      </ScrollView>
      <View
        pointerEvents="none"
        style={{
          position: "absolute",
          top: ITEM_HEIGHT * 2,
          left: 0,
          right: 0,
          height: ITEM_HEIGHT,
          borderTopWidth: 1,
          borderBottomWidth: 1,
          borderColor: "#E5E7EB",
        }}
      />
    </View>
  );
};

const TimeWheelPicker = ({
  hour,
  minute,
  onChange,
  disabled,
}: {
  hour: number;
  minute: number;
  onChange: (value: { hour: number; minute: number }) => void;
  disabled?: boolean;
}) => (
  <View className="flex-row items-center justify-center rounded-2xl border border-gray-200 bg-white p-2">
    <View className="flex-1">
      <Text className="text-caption text-gray-500 mb-1 text-center">Hour</Text>
      <TimeWheelColumn
      options={HOUR_OPTIONS}
      value={hour}
      onChange={(val) => onChange({ hour: val, minute })}
      disabled={disabled}
      labelFormatter={(val) => pad(val)}
    />
    </View>
    <Text className="text-title font-semibold text-gray-800 px-2">:</Text>
    <View className="flex-1">
      <Text className="text-caption text-gray-500 mb-1 text-center">Minute</Text>
      <TimeWheelColumn
        options={MINUTE_OPTIONS}
        value={minute}
        onChange={(val) => onChange({ hour, minute: val })}
        disabled={disabled}
        labelFormatter={(val) => pad(val)}
      />
    </View>
  </View>
);

const toForm = (dto?: MessageDto): MessageForm => {
  const schedule = cronToSchedule(dto?.execTime);
  return {
    id: dto?.id,
    text: dto?.text ?? "",
    isOneTime: dto?.isOneTime ?? false,
    localId:
      dto?.id ?? `tmp-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    hour: schedule.hour,
    minute: schedule.minute,
    frequency: schedule.frequency,
    daysOfWeek: schedule.daysOfWeek,
  };
};

const createEmptyMessage = (): MessageForm => {
  const schedule = defaultSchedule();
  return {
    id: undefined,
    text: "",
    isOneTime: false,
    localId: `tmp-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    hour: schedule.hour,
    minute: schedule.minute,
    frequency: schedule.frequency,
    daysOfWeek: schedule.daysOfWeek,
  };
};

export default function RemindersScreen() {
  const route = useRoute();
  const navigation = useNavigation();
  const { oldUser, readonly } = route.params as RouteParams;
  const isReadonly = Boolean(readonly);

  const [messages, setMessages] = useState<MessageForm[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const { t } = useLocale();

  const fetchMessages = useCallback(async () => {
    setIsLoading(true);
    try {
      const token = await AsyncStorage.getItem("jwt");
      if (!token) {
        Alert.alert(t("home.alertNetworkTitle"), t("home.alertLoginBody"));
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
        setMessages(list.map((msg) => toForm(msg)));
        setEditingId(null);
      } else if (response.status === 401) {
        Alert.alert(t("home.alertNetworkTitle"), t("home.alertLoginBody"));
        await AsyncStorage.removeItem("jwt");
        (navigation as any).reset({ index: 0, routes: [{ name: "Login" }] });
      } else if (response.status === 404) {
        Alert.alert(
          t("home.alertNetworkTitle"),
          t("reminders.readonlyEmpty")
        );
      } else {
        Alert.alert(t("home.alertNetworkTitle"), t("home.alertNetworkBody"));
      }
    } catch (error) {
      Alert.alert(t("home.alertNetworkTitle"), t("home.alertNetworkBody"));
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
    if (isReadonly) return;
    const newMessage = createEmptyMessage();
    setMessages((prev) => [...prev, newMessage]);
    setEditingId(newMessage.localId);
  };

  const handleRemoveMessage = (localId: string) => {
    if (isReadonly) return;
    setMessages((prev) => prev.filter((msg) => msg.localId !== localId));
    if (editingId === localId) {
      setEditingId(null);
    }
  };

  const handleSave = async () => {
    if (isReadonly) return;

    if (!messages.length) {
      Alert.alert("Nothing to save", "Please add at least one reminder.");
      return;
    }

    for (const msg of messages) {
      if (!msg.text.trim()) {
        Alert.alert("Missing text", "Every reminder needs a description.");
        return;
      }
      if (msg.frequency === "WEEKLY" && !msg.daysOfWeek.length) {
        Alert.alert("Missing days", "Select at least one weekday.");
        return;
      }
    }

    setIsSaving(true);
    try {
      const token = await AsyncStorage.getItem("jwt");
      if (!token) {
        Alert.alert(t("home.alertNetworkTitle"), t("home.alertLoginBody"));
        return;
      }

      const payload = messages.map(
        ({ id, text, hour, minute, frequency, daysOfWeek, isOneTime }) => ({
          id,
          text: text.trim(),
          execTime: scheduleToCron({
            hour,
            minute,
            frequency,
            daysOfWeek,
          }),
          isOneTime,
        })
      );

      const response = await fetch(API_ENDPOINTS.MESSAGE_UPDATE(oldUser.id), {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (response.ok || response.status === 201) {
        Alert.alert(
          t("home.alertThankYouTitle"),
          t("home.alertThankYouBody")
        );
        fetchMessages();
      } else if (response.status === 400) {
        const data = await response.json().catch(() => ({}));
        Alert.alert(t("home.alertFailTitle"), data.message || t("home.alertFailBody"));
      } else if (response.status === 403) {
        Alert.alert(t("home.alertNetworkTitle"), t("reminders.readonlySubtitle"));
      } else {
        Alert.alert(t("home.alertFailTitle"), t("home.alertFailBody"));
      }
    } catch (error) {
      Alert.alert(t("home.alertNetworkTitle"), t("home.alertNetworkBody"));
    } finally {
      setIsSaving(false);
    }
  };

  const headerSubtitle = useMemo(
    () => `${oldUser.username} · ${oldUser.email}`,
    [oldUser.username, oldUser.email]
  );

  const sortedMessages = useMemo(
    () =>
      [...messages].sort(
        (a, b) => a.hour * 60 + a.minute - (b.hour * 60 + b.minute)
      ),
    [messages]
  );

  const renderReadonlyList = () => (
    <ScrollView
      className="flex-1 px-4"
      contentContainerStyle={{ paddingBottom: 120 }}
    >
      {sortedMessages.length === 0 ? (
        <View className="bg-gray-50 border border-dashed border-gray-300 rounded-2xl p-6 items-center">
          <Text className="text-body text-gray-600 text-center">
            {t("reminders.readonlyEmpty")}
          </Text>
        </View>
      ) : (
        sortedMessages.map((message) => (
          <View
            key={message.localId}
            className="bg-white border border-gray-100 rounded-3xl p-5 mb-4 shadow-sm"
          >
            <Text className="text-title font-semibold text-gray-900 mb-2">
              {pad(message.hour)}:{pad(message.minute)}
            </Text>
            <Text className="text-body text-gray-800 mb-3">{message.text}</Text>
            <Text className="text-caption text-gray-500">
              {describeSchedule({
                hour: message.hour,
                minute: message.minute,
                frequency: message.frequency,
                daysOfWeek: message.daysOfWeek,
              })}
            </Text>
            {message.isOneTime && (
              <View className="mt-3 self-start bg-purple-100 px-3 py-1 rounded-full">
                <Text className="text-purple-700 text-caption font-semibold">
                  {t("reminders.oneTimeBadge")}
                </Text>
              </View>
            )}
          </View>
        ))
      )}
    </ScrollView>
  );

  const renderEditableList = () => (
    <ScrollView
      className="flex-1 px-4"
      contentContainerStyle={{ paddingBottom: 140 }}
    >
      {messages.length === 0 && (
        <View className="bg-gray-50 border border-dashed border-gray-300 rounded-2xl p-6 items-center mb-4">
          <Text className="text-body text-gray-600 text-center">
            {t("reminders.noReminders")}
          </Text>
          <Text className="text-body text-gray-500 text-center mt-2">
            {t("reminders.noRemindersAction")}
          </Text>
        </View>
      )}

      {messages.map((message) => {
        const isEditing = editingId === message.localId;
        return (
          <View
            key={message.localId}
            className="bg-white border border-gray-200 rounded-2xl p-4 mb-4"
          >
            {isEditing ? (
              <>
                <Text className="text-body font-semibold text-gray-900 mb-3">
                  {t("reminders.editReminder")}
                </Text>

                <Text className="text-caption text-gray-500 mb-1">
                  {t("reminders.messageLabel")}
                </Text>
                <TextInput
                  className="border border-gray-200 rounded-xl px-3 py-2 mb-3 bg-gray-50"
                  placeholder="Take medication"
                  value={message.text}
                  onChangeText={(value) =>
                    updateMessage(message.localId, { text: value })
                  }
                  multiline
                />

                <Text className="text-caption text-gray-500 mb-2">
                  {t("reminders.timeLabel")}
                </Text>
                <TimeWheelPicker
                  hour={message.hour}
                  minute={message.minute}
                  onChange={(val) => updateMessage(message.localId, val)}
                />

                <View className="mt-4">
                  <Text className="text-caption text-gray-500 mb-2">
                    {t("reminders.frequencyLabel")}
                  </Text>
                  <View className="flex-row gap-2">
                    {(["DAILY", "WEEKLY"] as Frequency[]).map((freq) => (
                      <Pressable
                        key={freq}
                        className={`flex-1 py-3 rounded-2xl border ${
                          message.frequency === freq
                            ? "bg-primary border-primary"
                            : "bg-gray-100 border-gray-200"
                        }`}
                        onPress={() =>
                          updateMessage(message.localId, { frequency: freq })
                        }
                      >
                        <Text
                          className={`text-center font-semibold ${
                            message.frequency === freq
                              ? "text-white"
                              : "text-gray-700"
                          }`}
                        >
                          {freq === "DAILY"
                            ? t("reminders.frequencyDaily")
                            : t("reminders.frequencyWeekly")}
                        </Text>
                      </Pressable>
                    ))}
                  </View>
                </View>

                {message.frequency === "WEEKLY" && (
                  <View className="mt-3">
                  <Text className="text-caption text-gray-500 mb-2">
                    {t("reminders.weekdaysLabel")}
                  </Text>
                    <View className="flex-row flex-wrap gap-2">
                      {DAYS.map((label, index) => {
                        const selected = message.daysOfWeek.includes(index);
                        return (
                          <Pressable
                            key={label}
                            className={`px-3 py-2 rounded-xl border ${
                              selected
                                ? "bg-secondary border-secondary"
                                : "bg-gray-100 border-gray-200"
                            }`}
                            onPress={() => {
                              const nextDays = selected
                                ? message.daysOfWeek.filter((d) => d !== index)
                                : [...message.daysOfWeek, index];
                              updateMessage(message.localId, {
                                daysOfWeek: nextDays,
                              });
                            }}
                          >
                            <Text
                              className={`text-sm font-semibold ${
                                selected ? "text-white" : "text-gray-700"
                              }`}
                            >
                              {label}
                            </Text>
                          </Pressable>
                        );
                      })}
                    </View>
                  </View>
                )}

                <View className="flex-row items-center justify-between mt-4">
                  <Text className="text-body text-gray-700">
                    {t("reminders.oneTimeLabel")}
                  </Text>
                  <Switch
                    value={message.isOneTime}
                    onValueChange={(value) =>
                      updateMessage(message.localId, { isOneTime: value })
                    }
                  />
                </View>

                <View className="mt-4 flex-row gap-2">
                  <Pressable
                    className="flex-1 bg-gray-100 border border-gray-200 rounded-xl py-2"
                    onPress={() => setEditingId(null)}
                  >
                    <Text className="text-center text-gray-700 font-semibold">
                      {t("reminders.done")}
                    </Text>
                  </Pressable>
                  <Pressable
                    className="flex-1 bg-red-50 border border-red-200 rounded-xl py-2"
                    onPress={() => handleRemoveMessage(message.localId)}
                  >
                    <Text className="text-center text-red-600 font-semibold">
                      {t("reminders.remove")}
                    </Text>
                  </Pressable>
                </View>
              </>
            ) : (
              <>
                <View className="flex-row justify-between items-start mb-2">
                  <View>
                    <Text className="text-title font-semibold text-gray-900">
                      {pad(message.hour)}:{pad(message.minute)}
                    </Text>
                    <Text className="text-caption text-gray-500">
                      {describeSchedule({
                        hour: message.hour,
                        minute: message.minute,
                        frequency: message.frequency,
                        daysOfWeek: message.daysOfWeek,
                      })}
                    </Text>
                  </View>
                  <Pressable
                    className="bg-gray-100 px-3 py-1 rounded-full"
                    onPress={() => setEditingId(message.localId)}
                  >
                    <Text className="text-sm font-semibold text-gray-700">
                      Edit
                    </Text>
                  </Pressable>
                </View>
                <Text className="text-body text-gray-800 mb-2">
                  {message.text}
                </Text>
                {message.isOneTime && (
                  <View className="bg-purple-100 self-start px-3 py-1 rounded-full mb-2">
                    <Text className="text-purple-700 text-caption font-semibold">
                      One-time reminder
                    </Text>
                  </View>
                )}
              </>
            )}
          </View>
        );
      })}

      <Pressable
        className="border border-dashed border-primary rounded-2xl py-4 items-center justify-center mb-4"
        onPress={handleAddMessage}
      >
        <Text className="text-primary font-semibold">
          {t("reminders.addButton")}
        </Text>
      </Pressable>
    </ScrollView>
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
        <Text className="text-title font-bold text-gray-800">
          {t("reminders.title")}
        </Text>
        <View className="w-20" />
      </View>

      <View className="px-4 mb-4">
        <Text className="text-subtitle font-semibold text-gray-900">
          {oldUser.username}
        </Text>
        <Text className="text-body text-gray-600">{headerSubtitle}</Text>
        {isReadonly ? (
          <Text className="text-caption text-gray-500 mt-2">
            {t("reminders.readonlySubtitle")}
          </Text>
        ) : (
          <Text className="text-caption text-gray-500 mt-2">
            {t("reminders.editSubtitle")}
          </Text>
        )}
      </View>

      {isLoading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#0F172A" />
          <Text className="text-body text-gray-600 mt-3">
            {t("reminders.loading")}
          </Text>
        </View>
      ) : isReadonly ? (
        renderReadonlyList()
      ) : (
        renderEditableList()
      )}

      {!isReadonly && (
        <View className="px-4 pb-8">
          <Pressable
            className={`w-full py-4 rounded-xl ${
              isSaving ? "bg-gray-400" : "bg-primary"
            }`}
            onPress={handleSave}
            disabled={isSaving}
          >
            {isSaving ? (
              <View className="flex-row items-center justify-center gap-2">
                <ActivityIndicator color="#fff" />
                <Text className="text-subtitle text-white font-semibold text-center">
                  {t("reminders.saveButtonSaving")}
                </Text>
              </View>
            ) : (
              <Text className="text-subtitle text-white font-semibold text-center">
                {t("reminders.saveButton")}
              </Text>
            )}
          </Pressable>
        </View>
      )}
    </View>
  );
}
