import React, { ReactNode } from "react";
import { StyleProp, View, ViewStyle } from "react-native";
import { colors, radii, spacing } from "../../theme";

interface AppCardProps {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
}

export function AppCard({ children, style }: AppCardProps) {
  return (
    <View
      style={[
        {
          padding: spacing.xl,
          borderRadius: radii.md,
          borderCurve: "continuous",
          borderWidth: 1,
          borderColor: colors.border,
          backgroundColor: colors.surface,
          boxShadow: "0 1px 2px rgba(88, 56, 31, 0.08)",
        },
        style,
      ]}
    >
      {children}
    </View>
  );
}
