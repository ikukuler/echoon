import React, { useState } from "react";
import { Image, Pressable, Text, View } from "react-native";
import { HugeiconsIcon } from "@hugeicons/react-native";
import { Link01Icon } from "@hugeicons/core-free-icons";
import { EchoPart } from "../../types";
import { AudioPlayer } from "../AudioPlayer";
import { AppCard } from "../ui";
import { colors, fontFamilies, radii, sizes, spacing } from "../../theme";

interface EchoPartRendererProps {
  part: EchoPart;
  imageHeight: number;
  onOpenImage: (url: string) => void;
  onOpenLink: (url: string) => void;
}

export function EchoPartRenderer({
  part,
  imageHeight,
  onOpenImage,
  onOpenLink,
}: EchoPartRendererProps) {
  switch (part.type) {
    case "text":
      return (
        <AppCard>
          <Text
            selectable
            style={{
              color: colors.content,
              fontFamily: fontFamilies.displayBold,
              fontSize: 22,
              lineHeight: 31,
            }}
          >
            {part.content}
          </Text>
        </AppCard>
      );

    case "image":
      return (
        <EchoImagePart
          uri={part.content}
          height={imageHeight}
          onPress={() => onOpenImage(part.content)}
        />
      );

    case "audio":
      return (
        <AudioPlayer audioUri={part.content} fileName="Audio Recording" />
      );

    case "link":
      return (
        <Pressable
          accessibilityRole="link"
          accessibilityLabel={`Open link ${part.content}`}
          onPress={() => onOpenLink(part.content)}
          style={({ pressed }) => ({
            minHeight: 56,
            flexDirection: "row",
            alignItems: "center",
            gap: spacing.md,
            padding: spacing.lg,
            borderWidth: 1,
            borderColor: colors.border,
            borderRadius: radii.md,
            borderCurve: "continuous",
            backgroundColor: pressed ? colors.surfaceElevated : colors.surface,
          })}
        >
          <HugeiconsIcon
            icon={Link01Icon}
            size={sizes.icon}
            color={colors.content}
            strokeWidth={1.5}
          />
          <Text
            numberOfLines={2}
            style={{
              flex: 1,
              color: colors.content,
              fontFamily: fontFamilies.bodySemibold,
              fontSize: 16,
              textDecorationLine: "underline",
            }}
          >
            {part.content}
          </Text>
        </Pressable>
      );

    default:
      return null;
  }
}

function EchoImagePart({
  uri,
  height,
  onPress,
}: {
  uri: string;
  height: number;
  onPress: () => void;
}) {
  const [failed, setFailed] = useState(false);

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={
        failed ? "Echo image unavailable" : "View echo image full screen"
      }
      accessibilityState={{ disabled: failed }}
      disabled={failed}
      onPress={onPress}
      style={({ pressed }) => ({
        overflow: "hidden",
        padding: spacing.sm,
        borderWidth: 1,
        borderColor: failed ? colors.danger : colors.border,
        borderRadius: radii.md,
        borderCurve: "continuous",
        backgroundColor: pressed ? colors.surfaceElevated : colors.surface,
        opacity: pressed ? 0.92 : 1,
      })}
    >
      {failed ? (
        <View
          style={{
            height,
            alignItems: "center",
            justifyContent: "center",
            padding: spacing.xl,
          }}
        >
          <Text
            accessibilityLiveRegion="polite"
            style={{
              color: colors.danger,
              fontFamily: fontFamilies.bodySemibold,
              fontSize: 15,
              textAlign: "center",
            }}
          >
            This image could not be loaded.
          </Text>
        </View>
      ) : (
        <Image
          accessible={false}
          source={{ uri }}
          resizeMode="contain"
          onError={() => setFailed(true)}
          style={{
            width: "100%",
            height,
            borderRadius: radii.sm,
          }}
        />
      )}
    </Pressable>
  );
}
