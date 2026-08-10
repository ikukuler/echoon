import React, { ReactNode } from "react";
import { Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ArrowLeftIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react-native";
import { colors, fontFamilies, sizes, spacing } from "../../theme";
import { IconButton } from "./icon-button";

interface ScreenHeaderProps {
  title: string;
  onBack?: () => void;
  backLabel?: string;
  rightAction?: ReactNode;
}

export function ScreenHeader({
  title,
  onBack,
  backLabel = "Go back",
  rightAction,
}: ScreenHeaderProps) {
  const insets = useSafeAreaInsets();

  return (
    <View
      style={{
        minHeight: insets.top + 72,
        paddingTop: insets.top + spacing.sm,
        paddingBottom: spacing.md,
        paddingHorizontal: spacing.xl,
        backgroundColor: colors.surfaceElevated,
        flexDirection: "row",
        alignItems: "center",
        gap: spacing.md,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
      }}
    >
      <View style={{ width: sizes.minimumTouchTarget }}>
        {onBack && (
          <IconButton
            accessibilityLabel={backLabel}
            onPress={onBack}
            icon={
              <HugeiconsIcon
                icon={ArrowLeftIcon}
                size={sizes.icon}
                color={colors.content}
                strokeWidth={1.5}
              />
            }
          />
        )}
      </View>
      <Text
        accessibilityRole="header"
        numberOfLines={2}
        style={{
          flex: 1,
          color: colors.content,
          fontFamily: fontFamilies.displayBold,
          fontSize: 32,
          lineHeight: 38,
          textAlign: "center",
        }}
      >
        {title}
      </Text>
      <View
        style={{
          width: sizes.minimumTouchTarget,
          alignItems: "flex-end",
        }}
      >
        {rightAction}
      </View>
    </View>
  );
}
