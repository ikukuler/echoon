import React, { useState } from "react";
import { Image, Text, View } from "react-native";
import { AudioPlayer } from "../AudioPlayer";
import { AppButton, AppCard, FormField } from "../ui";
import { colors, fontFamilies, radii, spacing } from "../../theme";
import { DraftAttachment } from "./types";
import { isValidWebUrl } from "./validation";

interface AttachmentEditorProps {
  attachment: DraftAttachment;
  index: number;
  error?: string;
  disabled?: boolean;
  onRemove: () => void;
  onChangeContent: (value: string) => void;
  onPickImage: () => void;
  onRecordAudio: () => void;
  onOpenLink: () => void;
}

export function AttachmentEditor({
  attachment,
  index,
  error,
  disabled = false,
  onRemove,
  onChangeContent,
  onPickImage,
  onRecordAudio,
  onOpenLink,
}: AttachmentEditorProps) {
  const [imageFailed, setImageFailed] = useState(false);
  const typeLabel =
    attachment.type.charAt(0).toUpperCase() + attachment.type.slice(1);
  const linkError =
    attachment.type === "link" &&
    attachment.content.length > 0 &&
    !isValidWebUrl(attachment.content)
      ? "Enter a valid http or https web address."
      : error;

  return (
    <AppCard style={{ gap: spacing.lg }}>
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          gap: spacing.md,
        }}
      >
        <View style={{ flex: 1, gap: spacing.xs }}>
          <Text
            style={{
              color: colors.content,
              fontFamily: fontFamilies.bodyBold,
              fontSize: 17,
            }}
          >
            {`Attachment ${index + 1}`}
          </Text>
          <Text
            style={{
              color: colors.contentMuted,
              fontFamily: fontFamilies.body,
              fontSize: 13,
            }}
          >
            {typeLabel}
          </Text>
        </View>
        <AppButton
          label="Remove"
          variant="quiet"
          fullWidth={false}
          disabled={disabled}
          onPress={onRemove}
          accessibilityLabel={`Remove attachment ${index + 1}`}
        />
      </View>

      {attachment.type === "image" && (
        <View style={{ gap: spacing.md }}>
          {attachment.localUri && !imageFailed ? (
            <Image
              accessibilityLabel={attachment.fileName || "Selected image"}
              source={{ uri: attachment.localUri }}
              resizeMode="cover"
              onError={() => setImageFailed(true)}
              style={{
                width: "100%",
                height: 180,
                borderRadius: radii.md,
              }}
            />
          ) : (
            <View
              style={{
                minHeight: 120,
                alignItems: "center",
                justifyContent: "center",
                padding: spacing.lg,
                borderWidth: 1,
                borderStyle: "dashed",
                borderColor: imageFailed ? colors.danger : colors.border,
                borderRadius: radii.md,
              }}
            >
              <Text
                style={{
                  color: imageFailed ? colors.danger : colors.contentMuted,
                  fontFamily: fontFamilies.bodySemibold,
                  textAlign: "center",
                }}
              >
                {imageFailed ? "Image preview unavailable" : "No image selected"}
              </Text>
            </View>
          )}
          {attachment.fileName && (
            <Text
              numberOfLines={1}
              style={{
                color: colors.contentMuted,
                fontFamily: fontFamilies.body,
                fontSize: 13,
              }}
            >
              {attachment.fileName}
            </Text>
          )}
          <AppButton
            label={attachment.localUri ? "Change Image" : "Choose Image"}
            disabled={disabled}
            onPress={onPickImage}
          />
        </View>
      )}

      {attachment.type === "audio" && (
        <View style={{ gap: spacing.md }}>
          {attachment.localUri ? (
            <AudioPlayer
              audioUri={attachment.localUri}
              duration={attachment.duration}
              fileName={attachment.fileName}
            />
          ) : (
            <View
              style={{
                minHeight: 88,
                alignItems: "center",
                justifyContent: "center",
                borderWidth: 1,
                borderStyle: "dashed",
                borderColor: colors.border,
                borderRadius: radii.md,
              }}
            >
              <Text
                style={{
                  color: colors.contentMuted,
                  fontFamily: fontFamilies.bodySemibold,
                }}
              >
                No audio recorded
              </Text>
            </View>
          )}
          <AppButton
            label={attachment.localUri ? "Record Again" : "Record Audio"}
            disabled={disabled}
            onPress={onRecordAudio}
          />
        </View>
      )}

      {attachment.type === "link" && (
        <View style={{ gap: spacing.md }}>
          <FormField
            label="Web address"
            placeholder="https://example.com"
            value={attachment.content}
            error={linkError}
            editable={!disabled}
            keyboardType="url"
            autoCapitalize="none"
            autoCorrect={false}
            onChangeText={onChangeContent}
          />
          {attachment.content.length > 0 && !linkError && (
            <AppButton
              label="Open Link"
              variant="secondary"
              disabled={disabled}
              onPress={onOpenLink}
            />
          )}
        </View>
      )}

      {error && attachment.type !== "link" && (
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
    </AppCard>
  );
}
