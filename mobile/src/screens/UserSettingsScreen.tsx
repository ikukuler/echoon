import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Switch,
  Alert,
  ScrollView,
} from "react-native";
import { useAuth } from "../hooks/useAuth";
import { apiService } from "../services/api";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { HugeiconsIcon } from "@hugeicons/react-native";
import { ArrowLeftIcon } from "@hugeicons/core-free-icons";

interface UserSettingsScreenProps {
  navigation: any;
}

const SETTINGS_KEY = "user_settings";

interface UserSettings {
  enableDateSelection: boolean;
}

export const UserSettingsScreen: React.FC<UserSettingsScreenProps> = ({
  navigation,
}) => {
  const { user, logout } = useAuth();
  const [settings, setSettings] = useState<UserSettings>({
    enableDateSelection: false,
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const savedSettings = await AsyncStorage.getItem(SETTINGS_KEY);
      console.log("Loaded settings from storage:", savedSettings);
      if (savedSettings) {
        const parsedSettings = JSON.parse(savedSettings);
        console.log("Parsed settings:", parsedSettings);
        setSettings(parsedSettings);
      } else {
        console.log("No saved settings found, using defaults");
      }
    } catch (error) {
      console.error("Error loading settings:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const saveSettings = async (newSettings: UserSettings) => {
    try {
      console.log("Saving settings:", newSettings);
      await AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(newSettings));
      setSettings(newSettings);
      console.log("Settings saved successfully");
    } catch (error) {
      console.error("Error saving settings:", error);
      Alert.alert("Error", "Failed to save settings");
    }
  };

  const handleToggleDateSelection = (value: boolean) => {
    console.log("Toggle date selection to:", value);
    saveSettings({ ...settings, enableDateSelection: value });
  };

  const handleSignOut = async () => {
    Alert.alert("Sign Out", "Are you sure you want to sign out?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Sign Out",
        style: "destructive",
        onPress: () => logout(),
      },
    ]);
  };

  if (isLoading) {
    return (
      <View className="flex-1 bg-gray-50 justify-center items-center">
        <Text className="text-accentSecondary font-inter-bold font-bold">
          Loading settings...
        </Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-background">
      {/* Header */}
      <View className="bg-header px-5 pt-16 pb-5 shadow-sm flex-row flex-shrink-0 items-center">
        <View className="flex-row justify-between items-center">
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            className="py-2 px-3 rounded-lg bg-echo"
          >
            <Text className="text-textDark font-medium">
              <HugeiconsIcon
                icon={ArrowLeftIcon}
                size={24}
                color="black"
                strokeWidth={1.5}
              />
            </Text>
          </TouchableOpacity>
        </View>
        <View className="flex-1 items-center flex-shrink-0 py-2">
          <Text className="text-4xl text-textDark leading-10 font-playfair-bold">
            Settings
          </Text>
        </View>
      </View>

      {/* Content */}
      <ScrollView className="flex-1">
        <View className="p-5">
          {/* Echo Creation Settings */}
          <View className="bg-card rounded-xl p-5 mb-6 shadow-sm ">
            <Text className="text-2xl text-textDark mb-4 font-playfair-bold">
              Echo Creation
            </Text>

            {/* Date Selection Toggle */}
            <View className="flex-row justify-between items-center py-3 ">
              <View className="flex-1">
                <Text className="text-base text-textDark font-inter-bold font-bold">
                  Choose Return Date
                </Text>
                <Text className="text-sm text-accentSecondary mt-1">
                  When creating an echo, let me choose when it should be
                  delivered
                </Text>
              </View>
              <Switch
                value={settings.enableDateSelection}
                onValueChange={handleToggleDateSelection}
                trackColor={{ false: "#e5e7eb", true: "#58381f" }}
                thumbColor={
                  settings.enableDateSelection ? "#f8f4f0" : "#f3f4f6"
                }
              />
            </View>

            {/* Explanation */}
            <View className="mt-4 p-3 bg-echo rounded-lg ">
              <Text className="text-sm text-textDark">
                {settings.enableDateSelection
                  ? "✅ You will be able to choose when your echo should be delivered"
                  : "🎲 Your echo will be delivered at a random time within the next year"}
              </Text>
            </View>
          </View>

          {/* Account Settings */}
          <View className="bg-card rounded-xl p-5 mb-6 shadow-sm ">
            <Text className="text-2xl text-textDark mb-4 font-playfair-bold">
              Account
            </Text>

            {/* User Info */}
            <View className="py-3 ">
              <Text className="text-sm text-accentSecondary">Email</Text>
              <Text className="text-base text-textDark font-inter-bold font-bold">
                {user?.email}
              </Text>
            </View>

            <View className="py-3 ">
              <Text className="text-sm text-accentSecondary">Name</Text>
              <Text className="text-base text-textDark font-inter-bold font-bold">
                {user?.name || "Not set"}
              </Text>
            </View>

            <View className="py-3">
              <Text className="text-sm text-accentSecondary">Member since</Text>
              <Text className="text-base text-textDark font-inter-bold font-bold">
                {user?.created_at
                  ? new Date(user.created_at).toLocaleDateString()
                  : "Unknown"}
              </Text>
            </View>
          </View>

          {/* Sign Out Button */}
          <TouchableOpacity
            onPress={handleSignOut}
            className="bg-red-500 py-4 px-6 rounded-xl shadow-sm "
          >
            <Text className="text-white text-lg font-bold text-center">
              Sign Out
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
};
