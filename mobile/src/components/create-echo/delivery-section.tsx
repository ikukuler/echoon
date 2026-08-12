import React from "react";
import { Pressable, Text, View } from "react-native";
import { AppCard, SectionHeading } from "../ui";
import { colors, fontFamilies, radii, spacing } from "../../theme";

interface DeliverySectionProps {
  enabled: boolean;
  selectedDate: Date;
  error?: string;
  onShowDate: () => void;
  onShowTime: () => void;
}

export function DeliverySection({
  enabled,
  selectedDate,
  error,
  onShowDate,
  onShowTime,
}: DeliverySectionProps) {
  if (!enabled) {
    return (
      <AppCard
        style={{
          gap: spacing.sm,
          backgroundColor: colors.warningSurface,
          borderColor: colors.warning,
        }}
      >
        <SectionHeading>Random Delivery</SectionHeading>
        <Text
          style={{
            color: colors.content,
            fontFamily: fontFamilies.body,
            fontSize: 15,
            lineHeight: 22,
          }}
        >
          Your echo will return at a random time within the next year. Date
          selection can be enabled in Settings.
        </Text>
      </AppCard>
    );
  }

  return (
    <View style={{ gap: spacing.md }}>
      <SectionHeading>When should it arrive?</SectionHeading>
      <Text
        style={{
          color: colors.contentMuted,
          fontFamily: fontFamilies.body,
          fontSize: 15,
          lineHeight: 22,
        }}
      >
        Choose when you want to receive this message.
      </Text>
      <View style={{ flexDirection: "row", gap: spacing.md }}>
        <DateValueButton
          label="Date"
          value={selectedDate.toLocaleDateString("en-US", {
            year: "numeric",
            month: "short",
            day: "numeric",
          })}
          onPress={onShowDate}
        />
        <DateValueButton
          label="Time"
          value={selectedDate.toLocaleTimeString("en-US", {
            hour: "2-digit",
            minute: "2-digit",
          })}
          onPress={onShowTime}
        />
      </View>
      {error && (
        <Text
          accessibilityLiveRegion="polite"
          selectable
          style={{
            color: colors.danger,
            fontFamily: fontFamilies.bodySemibold,
            fontSize: 13,
          }}
        >
          {error}
        </Text>
      )}
    </View>
  );
}

function DateValueButton({
  label,
  value,
  onPress,
}: {
  label: string;
  value: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${label}: ${value}`}
      onPress={onPress}
      style={({ pressed }) => ({
        flex: 1,
        minHeight: 72,
        justifyContent: "center",
        gap: spacing.xs,
        padding: spacing.md,
        borderWidth: 1,
        borderColor: colors.border,
        borderRadius: radii.md,
        borderCurve: "continuous",
        backgroundColor: pressed ? colors.surfaceElevated : colors.surface,
      })}
    >
      <Text
        style={{
          color: colors.contentMuted,
          fontFamily: fontFamilies.body,
          fontSize: 13,
        }}
      >
        {label}
      </Text>
      <Text
        style={{
          color: colors.content,
          fontFamily: fontFamilies.bodyBold,
          fontSize: 16,
        }}
      >
        {value}
      </Text>
    </Pressable>
  );
}
