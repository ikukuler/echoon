import React from "react";
import {
  ActivityIndicator,
  Pressable,
  PressableProps,
  StyleProp,
  Text,
  ViewStyle,
} from "react-native";
import { colors, fontFamilies, radii, spacing } from "../../theme";

type ButtonVariant = "primary" | "secondary" | "danger" | "quiet";

interface AppButtonProps extends Omit<PressableProps, "children" | "style"> {
  label: string;
  variant?: ButtonVariant;
  loading?: boolean;
  fullWidth?: boolean;
  style?: StyleProp<ViewStyle>;
}

const variantStyles: Record<
  ButtonVariant,
  { background: string; pressed: string; content: string; border?: string }
> = {
  primary: {
    background: colors.content,
    pressed: "#3f2816",
    content: colors.contentOnAccent,
  },
  secondary: {
    background: colors.accent,
    pressed: colors.accentPressed,
    content: colors.content,
  },
  danger: {
    background: colors.danger,
    pressed: colors.dangerPressed,
    content: colors.contentOnAccent,
  },
  quiet: {
    background: "transparent",
    pressed: colors.dangerSurface,
    content: colors.content,
    border: colors.border,
  },
};

export function AppButton({
  label,
  variant = "primary",
  loading = false,
  fullWidth = true,
  disabled,
  accessibilityLabel,
  style,
  ...pressableProps
}: AppButtonProps) {
  const palette = variantStyles[variant];
  const isDisabled = Boolean(disabled || loading);

  return (
    <Pressable
      {...pressableProps}
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityRole="button"
      accessibilityState={{ disabled: isDisabled, busy: loading }}
      disabled={isDisabled}
      style={({ pressed }) => [
        {
          minHeight: 48,
          width: fullWidth ? "100%" : undefined,
          alignItems: "center",
          justifyContent: "center",
          flexDirection: "row",
          gap: spacing.sm,
          paddingHorizontal: spacing.xl,
          paddingVertical: spacing.md,
          borderRadius: radii.md,
          borderCurve: "continuous",
          borderWidth: palette.border ? 1 : 0,
          borderColor: palette.border,
          backgroundColor: isDisabled
            ? colors.disabledSurface
            : pressed
              ? palette.pressed
              : palette.background,
        },
        style,
      ]}
    >
      {loading && (
        <ActivityIndicator
          color={isDisabled ? colors.disabledContent : palette.content}
        />
      )}
      <Text
        style={{
          color: isDisabled ? colors.disabledContent : palette.content,
          fontFamily: fontFamilies.bodyBold,
          fontSize: 17,
        }}
      >
        {label}
      </Text>
    </Pressable>
  );
}
