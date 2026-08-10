import React from "react";
import { Text } from "react-native";
import { colors, fontFamilies } from "../../theme";

interface SectionHeadingProps {
  children: string;
}

export function SectionHeading({ children }: SectionHeadingProps) {
  return (
    <Text
      accessibilityRole="header"
      style={{
        color: colors.content,
        fontFamily: fontFamilies.displayBold,
        fontSize: 24,
        lineHeight: 30,
      }}
    >
      {children}
    </Text>
  );
}
