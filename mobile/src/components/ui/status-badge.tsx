import React from "react";
import { Text, View } from "react-native";
import { colors, fontFamilies, radii, spacing } from "../../theme";

type StatusTone = "pending" | "delivered";

interface StatusBadgeProps {
  label: string;
  tone: StatusTone;
}

const tones: Record<StatusTone, { background: string; content: string }> = {
  pending: {
    background: colors.warningSurface,
    content: colors.warning,
  },
  delivered: {
    background: colors.successSurface,
    content: colors.success,
  },
};

export function StatusBadge({ label, tone }: StatusBadgeProps) {
  const palette = tones[tone];

  return (
    <View
      accessible
      accessibilityLabel={`Status: ${label}`}
      style={{
        alignSelf: "flex-start",
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.xs,
        borderRadius: radii.pill,
        backgroundColor: palette.background,
      }}
    >
      <Text
        style={{
          color: palette.content,
          fontFamily: fontFamilies.bodyBold,
          fontSize: 13,
        }}
      >
        {label}
      </Text>
    </View>
  );
}
