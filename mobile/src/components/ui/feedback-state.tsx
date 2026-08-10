import React from "react";
import { ActivityIndicator, Text, View } from "react-native";
import { colors, fontFamilies, spacing } from "../../theme";
import { AppButton } from "./app-button";

interface FeedbackStateProps {
  title: string;
  message?: string;
  loading?: boolean;
  actionLabel?: string;
  onAction?: () => void;
}

export function FeedbackState({
  title,
  message,
  loading = false,
  actionLabel,
  onAction,
}: FeedbackStateProps) {
  return (
    <View
      accessibilityLiveRegion="polite"
      accessibilityState={{ busy: loading }}
      style={{
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        gap: spacing.md,
        padding: spacing["2xl"],
        backgroundColor: colors.background,
      }}
    >
      {loading && <ActivityIndicator size="large" color={colors.content} />}
      <Text
        accessibilityRole="header"
        style={{
          color: colors.content,
          fontFamily: fontFamilies.displayBold,
          fontSize: 24,
          textAlign: "center",
        }}
      >
        {title}
      </Text>
      {message && (
        <Text
          selectable
          style={{
            color: colors.contentMuted,
            fontFamily: fontFamilies.body,
            fontSize: 16,
            lineHeight: 22,
            textAlign: "center",
          }}
        >
          {message}
        </Text>
      )}
      {actionLabel && onAction && (
        <AppButton
          label={actionLabel}
          onPress={onAction}
          fullWidth={false}
        />
      )}
    </View>
  );
}
