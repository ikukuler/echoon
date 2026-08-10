import React, { ReactNode } from "react";
import {
  Pressable,
  PressableProps,
  StyleProp,
  ViewStyle,
} from "react-native";
import { colors, radii, sizes } from "../../theme";

interface IconButtonProps extends Omit<PressableProps, "children" | "style"> {
  accessibilityLabel: string;
  icon: ReactNode;
  selected?: boolean;
  style?: StyleProp<ViewStyle>;
}

export function IconButton({
  accessibilityLabel,
  icon,
  selected = false,
  disabled,
  style,
  ...pressableProps
}: IconButtonProps) {
  const isDisabled = Boolean(disabled);

  return (
    <Pressable
      {...pressableProps}
      accessibilityLabel={accessibilityLabel}
      accessibilityRole="button"
      accessibilityState={{ disabled: isDisabled, selected }}
      disabled={isDisabled}
      hitSlop={8}
      style={({ pressed }) => [
        {
          width: sizes.minimumTouchTarget,
          height: sizes.minimumTouchTarget,
          alignItems: "center",
          justifyContent: "center",
          borderRadius: radii.md,
          borderCurve: "continuous",
          backgroundColor: isDisabled
            ? colors.disabledSurface
            : pressed
              ? colors.accentPressed
              : colors.accent,
          opacity: isDisabled ? 0.7 : 1,
        },
        style,
      ]}
    >
      {icon}
    </Pressable>
  );
}
