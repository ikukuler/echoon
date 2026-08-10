import React, { useEffect, useState } from "react";
import { Alert, ScrollView, Switch, Text, View } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useAuth } from "../hooks/useAuth";
import {
  AppButton,
  AppCard,
  FeedbackState,
  ScreenHeader,
  SectionHeading,
} from "../components/ui";
import { colors, fontFamilies, radii, spacing } from "../theme";

interface UserSettingsScreenProps {
  navigation: {
    goBack: () => void;
  };
}

const SETTINGS_KEY = "user_settings";

interface UserSettings {
  enableDateSelection: boolean;
}

const defaultSettings: UserSettings = {
  enableDateSelection: false,
};

export const UserSettingsScreen: React.FC<UserSettingsScreenProps> = ({
  navigation,
}) => {
  const { user, logout } = useAuth();
  const [settings, setSettings] = useState<UserSettings>(defaultSettings);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  const loadSettings = async () => {
    setIsLoading(true);
    setLoadError(null);

    try {
      const savedSettings = await AsyncStorage.getItem(SETTINGS_KEY);

      if (!savedSettings) {
        setSettings(defaultSettings);
        return;
      }

      const parsedSettings: unknown = JSON.parse(savedSettings);
      if (
        typeof parsedSettings !== "object" ||
        parsedSettings === null ||
        typeof (parsedSettings as UserSettings).enableDateSelection !== "boolean"
      ) {
        throw new Error("Stored settings have an invalid shape");
      }

      setSettings(parsedSettings as UserSettings);
    } catch (error) {
      console.error("Error loading settings:", error);
      setLoadError("Your settings could not be loaded. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadSettings();
  }, []);

  const saveSettings = async (newSettings: UserSettings) => {
    if (isSaving) return;

    const previousSettings = settings;
    setSettings(newSettings);
    setIsSaving(true);

    try {
      await AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(newSettings));
    } catch (error) {
      console.error("Error saving settings:", error);
      setSettings(previousSettings);
      Alert.alert("Could not save settings", "Your previous setting was restored.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggleDateSelection = (value: boolean) => {
    saveSettings({ ...settings, enableDateSelection: value });
  };

  const handleSignOut = () => {
    Alert.alert("Sign Out", "Are you sure you want to sign out?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Sign Out",
        style: "destructive",
        onPress: logout,
      },
    ]);
  };

  if (isLoading) {
    return <FeedbackState title="Loading settings" loading />;
  }

  if (loadError) {
    return (
      <FeedbackState
        title="Settings unavailable"
        message={loadError}
        actionLabel="Try Again"
        onAction={loadSettings}
      />
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <ScreenHeader title="Settings" onBack={navigation.goBack} />

      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        contentContainerStyle={{
          padding: spacing.xl,
          paddingBottom: spacing["3xl"],
          gap: spacing["2xl"],
        }}
      >
        <AppCard style={{ gap: spacing.lg }}>
          <SectionHeading>Echo Creation</SectionHeading>

          <View
            style={{
              minHeight: 56,
              flexDirection: "row",
              alignItems: "center",
              gap: spacing.lg,
            }}
          >
            <View style={{ flex: 1, gap: spacing.xs }}>
              <Text
                style={{
                  color: colors.content,
                  fontFamily: fontFamilies.bodyBold,
                  fontSize: 16,
                }}
              >
                Choose Return Date
              </Text>
              <Text
                style={{
                  color: colors.contentMuted,
                  fontFamily: fontFamilies.body,
                  fontSize: 14,
                  lineHeight: 20,
                }}
              >
                When creating an echo, let me choose when it should be delivered
              </Text>
            </View>
            <Switch
              accessibilityLabel="Choose Return Date"
              accessibilityHint="Controls whether you choose a delivery date when creating an echo"
              value={settings.enableDateSelection}
              onValueChange={handleToggleDateSelection}
              disabled={isSaving}
              trackColor={{
                false: colors.disabledSurface,
                true: colors.content,
              }}
              thumbColor={colors.surfaceElevated}
            />
          </View>

          <View
            accessibilityLiveRegion="polite"
            style={{
              padding: spacing.md,
              borderRadius: radii.sm,
              borderCurve: "continuous",
              backgroundColor: colors.accent,
            }}
          >
            <Text
              style={{
                color: colors.content,
                fontFamily: fontFamilies.body,
                fontSize: 14,
                lineHeight: 20,
              }}
            >
              {isSaving
                ? "Saving your preference…"
                : settings.enableDateSelection
                  ? "You will choose when each echo should be delivered."
                  : "Each echo will arrive at a random time within the next year."}
            </Text>
          </View>
        </AppCard>

        <AppCard style={{ gap: spacing.lg }}>
          <SectionHeading>Account</SectionHeading>

          <AccountField label="Email" value={user?.email ?? "Unknown"} />
          <AccountField label="Name" value={user?.name || "Not set"} />
          <AccountField
            label="Member since"
            value={
              user?.created_at
                ? new Date(user.created_at).toLocaleDateString()
                : "Unknown"
            }
          />
        </AppCard>

        <AppButton
          label="Sign Out"
          variant="danger"
          onPress={handleSignOut}
          accessibilityHint="Signs you out after confirmation"
        />
      </ScrollView>
    </View>
  );
};

function AccountField({ label, value }: { label: string; value: string }) {
  return (
    <View style={{ gap: spacing.xs }}>
      <Text
        style={{
          color: colors.contentMuted,
          fontFamily: fontFamilies.body,
          fontSize: 14,
        }}
      >
        {label}
      </Text>
      <Text
        selectable
        style={{
          color: colors.content,
          fontFamily: fontFamilies.bodyBold,
          fontSize: 16,
        }}
      >
        {value}
      </Text>
    </View>
  );
}
