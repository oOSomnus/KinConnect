import React, { useState } from "react";
import { View, Text, TextInput, Pressable, Alert } from "react-native";

export default function RegistrationScreen({ navigation }: any) {
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [verificationCode, setVerificationCode] = useState("");
  const [isVerificationSent, setIsVerificationSent] = useState(false);

  const handleSendVerification = async () => {
    try {
      const params = new URLSearchParams();
      params.append('email', email);
      params.append('username', username);
      params.append('password', password);

      const response = await fetch('http://localhost:8080/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: params.toString(),
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
    try {
      const params = new URLSearchParams();
      params.append('email', email);
      params.append('code', verificationCode);

      const response = await fetch('http://localhost:8080/auth/verify-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: params.toString(),
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
        Create Account
      </Text>
      
      <TextInput
        className="w-4/5 mb-4 px-4 py-3 border border-gray-300 rounded-xl text-body bg-white"
        placeholder="email"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
        autoCorrect={false}
      />

      <TextInput
        className="w-4/5 mb-4 px-4 py-3 border border-gray-300 rounded-xl text-body bg-white"
        placeholder="username"
        value={username}
        onChangeText={setUsername}
        autoCapitalize="none"
        autoCorrect={false}
      />

      <TextInput
        className="w-4/5 mb-4 px-4 py-3 border border-gray-300 rounded-xl text-body bg-white"
        placeholder="password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />

      <View className="w-4/5 mb-6 flex-row">
        <TextInput
          className="flex-1 mr-2 px-4 py-3 border border-gray-300 rounded-xl text-body bg-white"
          placeholder="verification code"
          value={verificationCode}
          onChangeText={setVerificationCode}
          keyboardType="number-pad"
        />
        <Pressable
          className="bg-secondary px-6 py-3 rounded-xl"
          onPress={handleSendVerification}
        >
          <Text className="text-body text-white font-semibold">
            {isVerificationSent ? 'Resend' : 'Send Verification'}
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
            Submit
          </Text>
        </Pressable>
      )}

      <Pressable
        className="w-4/5 py-3"
        onPress={() => navigation.navigate('Login')}
      >
        <Text className="text-body text-primary text-center">
          Already have an account? Sign In
        </Text>
      </Pressable>
    </View>
  );
}
