import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native";
import { useAuth } from "../hooks/useAuth";
import { LoadingSpinner } from "../components/LoadingSpinner";

export const LoginScreen: React.FC = () => {
  const { login, register, isLoading } = useAuth();
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);
  const [isLoginMode, setIsLoginMode] = useState(true);

  // Form fields
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert("Error", "Please fill in all fields");
      return;
    }

    try {
      setIsSigningIn(true);
      const result = await login(email, password);

      if (!result.success) {
        Alert.alert("Login Error", result.error || "Failed to login");
      }
    } catch (error) {
      Alert.alert("Login Error", "Failed to login. Please try again.");
    } finally {
      setIsSigningIn(false);
    }
  };

  const handleRegister = async () => {
    if (!email || !password) {
      Alert.alert("Error", "Please fill in all fields");
      return;
    }

    if (password.length < 6) {
      Alert.alert("Error", "Password must be at least 6 characters long");
      return;
    }

    try {
      setIsRegistering(true);
      const result = await register(email, password, name || undefined);

      if (!result.success) {
        Alert.alert("Registration Error", result.error || "Failed to register");
      }
    } catch (error) {
      Alert.alert(
        "Registration Error",
        "Failed to register. Please try again.",
      );
    } finally {
      setIsRegistering(false);
    }
  };

  if (isLoading) {
    return <LoadingSpinner text="Initializing..." />;
  }

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-background"
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView
        className="flex-1"
        contentContainerStyle={{
          flexGrow: 1,
          justifyContent: "center",
          alignItems: "center",
          paddingHorizontal: 32,
          paddingVertical: 60,
        }}
      >
        {/* Logo Area */}
        <View className="items-center mb-10">
          <View className="w-24 h-24 bg-primary rounded-full justify-center items-center mb-6 shadow-lg">
            <Text className="text-white text-5xl font-bold">E</Text>
          </View>
          <Text className="text-3xl text-textDark mb-2 font-playfair-bold">
            EchoWall
          </Text>
          <Text className="text-lg text-accentSecondary text-center leading-6 font-inter-semibold font-semibold">
            Send messages to your future self
          </Text>
        </View>

        {/* Form */}
        <View className="w-full mb-10">
          <Text className="text-2xl text-textDark text-center mb-6 font-playfair-bold">
            {isLoginMode ? "Welcome Back" : "Create Account"}
          </Text>

          <TextInput
            className="bg-card rounded-xl px-4 py-4 mb-4 text-base text-textDark"
            placeholder="Email"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            placeholderTextColor="#8AB6D6"
          />

          <TextInput
            className="bg-card rounded-xl px-4 py-4 mb-6 text-base text-textDark"
            placeholder="Password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            autoCapitalize="none"
            autoCorrect={false}
            placeholderTextColor="#8AB6D6"
          />

          <TouchableOpacity
            className={`rounded-xl px-6 py-4 mb-4 shadow-md ${
              isLoading ? "bg-gray-400" : "bg-primary"
            }`}
            onPress={isLoginMode ? handleLogin : handleRegister}
            disabled={isLoading}
          >
            <Text className="text-white text-lg font-semibold text-center">
              {isLoading ? "Loading..." : isLoginMode ? "Sign In" : "Sign Up"}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            className="items-center"
            onPress={() => setIsLoginMode(!isLoginMode)}
          >
            <Text className="text-primary text-base font-medium">
              {isLoginMode
                ? "Don't have an account? Sign Up"
                : "Already have an account? Sign In"}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Features */}
        <View className="w-full mb-10">
          <View className="flex-row items-center mb-4">
            <View className="w-2 h-2 bg-primary rounded-full mr-3"></View>
            <Text className="text-textDark text-base flex-1 font-inter">
              Send messages to your future self
            </Text>
          </View>
          <View className="flex-row items-center mb-4">
            <View className="w-2 h-2 bg-primary rounded-full mr-3"></View>
            <Text className="text-textDark text-base flex-1 font-inter">
              Add images, audio, and links
            </Text>
          </View>
          <View className="flex-row items-center mb-4">
            <View className="w-2 h-2 bg-primary rounded-full mr-3"></View>
            <Text className="text-textDark text-base flex-1 font-inter">
              Schedule delivery for any date
            </Text>
          </View>
        </View>

        {/* Terms */}
        <Text className="text-accentSecondary text-sm text-center leading-5 font-inter-semibold font-semibold">
          By using EchoWall, you agree to our Terms of Service and Privacy
          Policy
        </Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};
