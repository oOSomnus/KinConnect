import React, { useState } from "react";
import { View, Text, TextInput, Pressable, Alert } from "react-native";
import { API_ENDPOINTS } from "../config/api";
import { useLocale } from "../context/LocaleContext";

export default function RegistrationScreen({ navigation }: any) {
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [verificationCode, setVerificationCode] = useState("");
  const [isVerificationSent, setIsVerificationSent] = useState(false);
  const { t } = useLocale();

  const handleSendVerification = async () => {
    // Validate input fields before making API call
    if (!email.trim()) {
      Alert.alert("Missing Information", "Please enter your email address.");
      return;
    }
    
    if (!username.trim()) {
      Alert.alert("Missing Information", "Please enter a username.");
      return;
    }
    
    if (!password.trim()) {
      Alert.alert("Missing Information", "Please enter a password.");
      return;
    }
    
    // Basic email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      Alert.alert("Invalid Email", "Please enter a valid email address.");
      return;
    }
    
    // Password length validation
    if (password.length < 8) {
      Alert.alert("Invalid Password", "Password must be at least 8 characters long.");
      return;
    }
    
    // Username length validation
    if (username.trim().length < 3) {
      Alert.alert("Invalid Username", "Username must be at least 3 characters long.");
      return;
    }

    try {
      const response = await fetch(API_ENDPOINTS.REGISTER, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: email.trim(),
          username: username.trim(),
          password: password
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setIsVerificationSent(true);
        Alert.alert(
          'Verification Code Sent', 
          'Please check your email for the verification code.',
          [{ text: 'OK' }]
        );
      } else if (response.status === 400) {
        Alert.alert('Invalid Input', 'Please check your email, username, and password. Make sure all fields are filled correctly.');
      } else if (response.status === 409) {
        // Email already registered
        Alert.alert(
          'Email Already Registered', 
          'This email address is already registered. Please try logging in or use a different email.',
          [
            {
              text: 'Go to Login',
              onPress: () => navigation.navigate('Login')
            },
            {
              text: 'Try Again',
              style: 'cancel'
            }
          ]
        );
      } else {
        Alert.alert('Registration Failed', data.message || 'Please try again');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to connect to server. Please try again.');
    }
  };

  const handleSubmit = async () => {
    // Validate verification code before making API call
    if (!verificationCode.trim()) {
      Alert.alert("Missing Information", "Please enter the verification code.");
      return;
    }
    
    if (verificationCode.trim().length < 4) {
      Alert.alert("Invalid Code", "Please enter a valid verification code.");
      return;
    }

    try {
      const response = await fetch(API_ENDPOINTS.VERIFY_EMAIL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: email.trim(),
          code: verificationCode.trim()
        }),
      });

      const data = await response.json();

      if (response.ok) {
        Alert.alert(
          'Registration Complete', 
          'Your email has been verified successfully!',
          [
            {
              text: 'OK',
              onPress: () => navigation.navigate('Login')
            }
          ]
        );
      } else if (response.status === 400) {
        Alert.alert('Invalid Verification Code', 'The verification code is incorrect or has expired. Please check your email and try again.');
      } else if (response.status === 404) {
        Alert.alert('Email Not Found', 'No registration found for this email address. Please register first.');
      } else {
        Alert.alert('Verification Failed', data.message || 'Please check your verification code and try again.');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to connect to server. Please try again.');
    }
  };

  return (
    <View className="flex-1 bg-background p-safe justify-center items-center">
      <Text className="text-title font-bold text-gray-800 mb-8">
        {t("register.title")}
      </Text>
      
      <TextInput
        className="w-4/5 mb-4 px-4 py-3 border border-gray-300 rounded-xl text-body bg-white"
        placeholder={t("register.emailPlaceholder")}
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
        autoCorrect={false}
      />

      <TextInput
        className="w-4/5 mb-4 px-4 py-3 border border-gray-300 rounded-xl text-body bg-white"
        placeholder={t("register.usernamePlaceholder")}
        value={username}
        onChangeText={setUsername}
        autoCapitalize="none"
        autoCorrect={false}
      />

      <TextInput
        className="w-4/5 mb-4 px-4 py-3 border border-gray-300 rounded-xl text-body bg-white"
        placeholder={t("register.passwordPlaceholder")}
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />

      <View className="w-4/5 mb-6 flex-row">
                <TextInput
                  className="flex-1 mr-2 px-4 py-3 border border-gray-300 rounded-xl text-body bg-white"
                  placeholder={t("register.verificationPlaceholder")}
                  value={verificationCode}
                  onChangeText={setVerificationCode}
                  autoCapitalize="none"
                  autoCorrect={false}
                />
        <Pressable
          className="bg-secondary px-6 py-3 rounded-xl"
          onPress={handleSendVerification}
        >
          <Text className="text-body text-white font-semibold">
            {isVerificationSent
              ? t("register.resendCode")
              : t("register.sendCode")}
          </Text>
        </Pressable>
      </View>

      {isVerificationSent && (
        <Pressable
          className={`w-4/5 py-4 rounded-xl mb-3 ${
            !verificationCode ? 'bg-gray-400' : 'bg-primary'
          }`}
          onPress={handleSubmit}
          disabled={!verificationCode}
        >
          <Text className="text-subtitle text-white font-semibold text-center">
            {t("register.submit")}
          </Text>
        </Pressable>
      )}

      <Pressable
        className="w-4/5 py-3"
        onPress={() => navigation.navigate('Login')}
      >
        <Text className="text-body text-primary text-center">
          {t("register.haveAccount")}
        </Text>
      </Pressable>
    </View>
  );
}
