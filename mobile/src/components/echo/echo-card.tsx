import React, { useState } from "react";
import { Image, Pressable, Text, View } from "react-native";
import { HugeiconsIcon } from "@hugeicons/react-native";
import { Link01Icon } from "@hugeicons/core-free-icons";
import { Echo } from "../../types";
import { formatDate, isFutureDate } from "../../utils/dateUtils";
import { AudioPlayer } from "../AudioPlayer";
import { AppButton, AppCard, StatusBadge } from "../ui";
import { colors, fontFamilies, radii, sizes, spacing } from "../../theme";

interface EchoCardProps {
  echo: Echo;
  onOpen: () => void;
  onOpenLink: (url: string) => void;
}

export const EchoCard = React.memo(function EchoCard({
  echo,
  onOpen,
  onOpenLink,
}: EchoCardProps) {
  const [imageFailed, setImageFailed] = useState(false);
  const imagePart = echo.parts?.find((part) => part.type === "image");
  const textPart = echo.parts?.find((part) => part.type === "text");
  const interactiveParts = echo.parts?.filter(
    (part) => part.type === "audio" || part.type === "link",
  );
  const pending = isFutureDate(echo.return_at);

  return (
    <AppCard style={{ padding: 0, overflow: "hidden" }}>
      {imagePart && !imageFailed && (
        <View style={{ height: 176, backgroundColor: colors.surfaceElevated }}>
          <Image
            accessible
            accessibilityLabel="Echo attachment"
            source={{ uri: imagePart.content }}
            resizeMode="cover"
            onError={() => setImageFailed(true)}
            style={{ width: "100%", height: "100%" }}
          />
          <View
            pointerEvents="none"
            style={{
              position: "absolute",
              inset: 0,
              justifyContent: "flex-end",
              padding: spacing.lg,
              backgroundColor: "rgba(0, 0, 0, 0.34)",
            }}
          >
            {textPart && (
              <Text
                numberOfLines={2}
                style={{
                  color: colors.contentOnAccent,
                  fontFamily: fontFamilies.displayBold,
                  fontSize: 22,
                  lineHeight: 29,
                }}
              >
                {textPart.content}
              </Text>
            )}
          </View>
        </View>
      )}

      <View style={{ padding: spacing.lg, gap: spacing.md }}>
        <View
          style={{
            flexDirection: "row",
            alignItems: "flex-start",
            justifyContent: "space-between",
            gap: spacing.md,
          }}
        >
          <View style={{ flex: 1, gap: spacing.xs }}>
            <Text
              style={{
                color: colors.contentMuted,
                fontFamily: fontFamilies.body,
                fontSize: 13,
              }}
            >
              Arrives {formatDate(echo.return_at)}
            </Text>
            {!imagePart && textPart && (
              <Text
                numberOfLines={3}
                style={{
                  color: colors.content,
                  fontFamily: fontFamilies.displayBold,
                  fontSize: 21,
                  lineHeight: 29,
                }}
              >
                {textPart.content}
              </Text>
            )}
            {imageFailed && (
              <Text
                accessibilityLiveRegion="polite"
                style={{
                  color: colors.danger,
                  fontFamily: fontFamilies.bodySemibold,
                  fontSize: 13,
                }}
              >
                Image unavailable
              </Text>
            )}
          </View>
          <StatusBadge
            label={pending ? "Pending" : "Delivered"}
            tone={pending ? "pending" : "delivered"}
          />
        </View>

        {interactiveParts?.map((part) =>
          part.type === "audio" ? (
            <AudioPlayer key={part.id} audioUri={part.content} />
          ) : (
            <Pressable
              key={part.id}
              accessibilityRole="link"
              accessibilityLabel={`Open link ${part.content}`}
              onPress={() => onOpenLink(part.content)}
              style={({ pressed }) => ({
                minHeight: 48,
                flexDirection: "row",
                alignItems: "center",
                gap: spacing.sm,
                paddingHorizontal: spacing.md,
                paddingVertical: spacing.sm,
                borderRadius: radii.sm,
                borderCurve: "continuous",
                backgroundColor: pressed
                  ? colors.accentPressed
                  : colors.accent,
              })}
            >
              <HugeiconsIcon
                icon={Link01Icon}
                size={sizes.icon}
                color={colors.content}
                strokeWidth={1.5}
              />
              <Text
                numberOfLines={1}
                style={{
                  flex: 1,
                  color: colors.content,
                  fontFamily: fontFamilies.bodySemibold,
                  fontSize: 14,
                  textDecorationLine: "underline",
                }}
              >
                {part.content}
              </Text>
            </Pressable>
          ),
        )}

        <AppButton
          label="Open Echo"
          variant="secondary"
          onPress={onOpen}
          accessibilityHint="Opens the complete echo"
        />
        <Text
          style={{
            color: colors.contentMuted,
            fontFamily: fontFamilies.body,
            fontSize: 12,
            textAlign: "center",
          }}
        >
          Created {formatDate(echo.created_at)}
        </Text>
      </View>
    </AppCard>
  );
});
