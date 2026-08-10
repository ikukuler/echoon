import React, { forwardRef } from "react";
import {
  StyleProp,
  Text,
  TextInput,
  TextInputProps,
  View,
  ViewStyle,
} from "react-native";
import { colors, fontFamilies, radii, spacing } from "../../theme";

interface FormFieldProps extends TextInputProps {
  label: string;
  hint?: string;
  error?: string;
  containerStyle?: StyleProp<ViewStyle>;
}

export const FormField = forwardRef<TextInput, FormFieldProps>(
  function FormField(
    {
      label,
      hint,
      error,
      editable = true,
      containerStyle,
      style,
      accessibilityHint,
      ...textInputProps
    },
    ref,
  ) {
    return (
      <View style={[{ gap: spacing.sm }, containerStyle]}>
        <Text
          style={{
            color: colors.content,
            fontFamily: fontFamilies.bodyBold,
            fontSize: 15,
          }}
        >
          {label}
        </Text>
        <TextInput
          {...textInputProps}
          ref={ref}
          accessibilityLabel={label}
          accessibilityHint={error ?? accessibilityHint ?? hint}
          accessibilityState={{ disabled: !editable }}
          editable={editable}
          placeholderTextColor={colors.contentMuted}
          selectionColor={colors.content}
          style={[
            {
              minHeight: 52,
              paddingHorizontal: spacing.lg,
              paddingVertical: spacing.md,
              borderWidth: 1,
              borderColor: error ? colors.danger : colors.border,
              borderRadius: radii.md,
              borderCurve: "continuous",
              backgroundColor: editable
                ? colors.surface
                : colors.disabledSurface,
              color: colors.content,
              fontFamily: fontFamilies.body,
              fontSize: 16,
            },
            style,
          ]}
        />
        {error ? (
          <Text
            accessibilityLiveRegion="polite"
            selectable
            style={{
              color: colors.danger,
              fontFamily: fontFamilies.bodySemibold,
              fontSize: 13,
              lineHeight: 18,
            }}
          >
            {error}
          </Text>
        ) : hint ? (
          <Text
            style={{
              color: colors.contentMuted,
              fontFamily: fontFamilies.body,
              fontSize: 13,
              lineHeight: 18,
            }}
          >
            {hint}
          </Text>
        ) : null}
      </View>
    );
  },
);
