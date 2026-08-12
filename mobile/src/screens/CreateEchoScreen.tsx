import React, { useEffect, useRef, useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Linking,
  ScrollView,
  Text,
  View,
} from "react-native";
import DateTimePicker, {
  DateTimePickerEvent,
} from "@react-native-community/datetimepicker";
import * as ImagePicker from "expo-image-picker";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { apiService } from "../services/api";
import { CreateEchoRequest, RootStackParamList } from "../types";
import { AudioRecorder } from "../components/AudioRecorder";
import {
  AttachmentEditor,
  DeliverySection,
  DraftAttachment,
  isValidWebUrl,
} from "../components/create-echo";
import {
  AppButton,
  AppCard,
  FormField,
  ScreenHeader,
  SectionHeading,
} from "../components/ui";
import { colors, fontFamilies, spacing } from "../theme";

type CreateEchoScreenProps = NativeStackScreenProps<
  RootStackParamList,
  "CreateEcho"
>;

interface UserSettings {
  enableDateSelection: boolean;
}

interface FormErrors {
  message?: string;
  date?: string;
}

const SETTINGS_KEY = "user_settings";
const defaultSettings: UserSettings = { enableDateSelection: false };

export const CreateEchoScreen: React.FC<CreateEchoScreenProps> = ({
  navigation,
}) => {
  const [userSettings, setUserSettings] =
    useState<UserSettings>(defaultSettings);
  const [selectedDate, setSelectedDate] = useState(
    () => new Date(Date.now() + 24 * 60 * 60 * 1000),
  );
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [mainMessage, setMainMessage] = useState("");
  const [attachments, setAttachments] = useState<DraftAttachment[]>([]);
  const [formErrors, setFormErrors] = useState<FormErrors>({});
  const [attachmentErrors, setAttachmentErrors] = useState<
    Record<string, string>
  >({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadingAttachmentId, setUploadingAttachmentId] = useState<
    string | null
  >(null);
  const [recordingAttachmentId, setRecordingAttachmentId] = useState<
    string | null
  >(null);

  const draftCounterRef = useRef(0);
  const requestControllerRef = useRef<AbortController | null>(null);
  const mountedRef = useRef(true);

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const stored = await AsyncStorage.getItem(SETTINGS_KEY);
        if (!stored) return;

        const parsed: unknown = JSON.parse(stored);
        if (
          typeof parsed === "object" &&
          parsed !== null &&
          typeof (parsed as UserSettings).enableDateSelection === "boolean"
        ) {
          setUserSettings(parsed as UserSettings);
        }
      } catch (error) {
        console.error("Failed to load create echo settings:", error);
      }
    };

    loadSettings();
    return () => {
      mountedRef.current = false;
      requestControllerRef.current?.abort();
    };
  }, []);

  const createDraftId = () => {
    draftCounterRef.current += 1;
    return `attachment-${Date.now()}-${draftCounterRef.current}`;
  };

  const updateAttachment = (
    draftId: string,
    update: Partial<DraftAttachment>,
  ) => {
    setAttachments((current) =>
      current.map((attachment) =>
        attachment.draftId === draftId
          ? { ...attachment, ...update }
          : attachment,
      ),
    );
    setAttachmentErrors((current) => {
      if (!current[draftId]) return current;
      const next = { ...current };
      delete next[draftId];
      return next;
    });
    setSubmitError(null);
  };

  const addAttachment = (type: DraftAttachment["type"]) => {
    const draftId = createDraftId();
    const attachment: DraftAttachment = {
      draftId,
      type,
      content: "",
    };
    setAttachments((current) => [...current, attachment]);

    if (type === "image") void pickImage(draftId);
    if (type === "audio") setRecordingAttachmentId(draftId);
  };

  const removeAttachment = (draftId: string) => {
    setAttachments((current) =>
      current.filter((attachment) => attachment.draftId !== draftId),
    );
    setAttachmentErrors((current) => {
      const next = { ...current };
      delete next[draftId];
      return next;
    });
  };

  const pickImage = async (draftId: string) => {
    try {
      const permission =
        await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        Alert.alert(
          "Photo access needed",
          "Allow photo access to attach an image to your echo.",
          permission.canAskAgain
            ? [{ text: "OK" }]
            : [
                { text: "Not Now", style: "cancel" },
                { text: "Open Settings", onPress: () => Linking.openSettings() },
              ],
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: false,
        quality: 0.8,
        allowsMultipleSelection: false,
      });

      const asset = !result.canceled ? result.assets?.[0] : undefined;
      if (!asset?.uri) return;

      updateAttachment(draftId, {
        content: asset.uri,
        localUri: asset.uri,
        fileName: asset.fileName || `echo-image-${Date.now()}.jpg`,
        mimeType: asset.mimeType || "image/jpeg",
      });
    } catch (error) {
      console.error("Failed to select image:", error);
      setAttachmentErrors((current) => ({
        ...current,
        [draftId]: "The image could not be selected. Please try again.",
      }));
    }
  };

  const handleRecordingComplete = (uri: string, duration: number) => {
    if (!recordingAttachmentId) return;

    updateAttachment(recordingAttachmentId, {
      content: uri,
      localUri: uri,
      fileName: `echo-recording-${Date.now()}.m4a`,
      mimeType: "audio/m4a",
      duration,
    });
    setRecordingAttachmentId(null);
  };

  const handleDateChange = (
    _event: DateTimePickerEvent,
    date?: Date,
  ) => {
    setShowDatePicker(false);
    if (!date) return;

    const next = new Date(selectedDate);
    next.setFullYear(date.getFullYear(), date.getMonth(), date.getDate());
    setSelectedDate(next);
    setFormErrors((current) => ({ ...current, date: undefined }));
  };

  const handleTimeChange = (
    _event: DateTimePickerEvent,
    time?: Date,
  ) => {
    setShowTimePicker(false);
    if (!time) return;

    const next = new Date(selectedDate);
    next.setHours(time.getHours(), time.getMinutes(), 0, 0);
    setSelectedDate(next);
    setFormErrors((current) => ({ ...current, date: undefined }));
  };

  const validate = () => {
    const nextFormErrors: FormErrors = {};
    const nextAttachmentErrors: Record<string, string> = {};

    if (!mainMessage.trim()) {
      nextFormErrors.message = "Write a message for your future self.";
    }
    if (userSettings.enableDateSelection && selectedDate <= new Date()) {
      nextFormErrors.date = "Choose a delivery time in the future.";
    }

    attachments.forEach((attachment) => {
      if (!attachment.content.trim()) {
        nextAttachmentErrors[attachment.draftId] =
          attachment.type === "image"
            ? "Choose an image or remove this attachment."
            : attachment.type === "audio"
              ? "Record audio or remove this attachment."
              : "Enter a web address or remove this attachment.";
      } else if (
        attachment.type === "link" &&
        !isValidWebUrl(attachment.content)
      ) {
        nextAttachmentErrors[attachment.draftId] =
          "Enter a valid http or https web address.";
      }
    });

    setFormErrors(nextFormErrors);
    setAttachmentErrors(nextAttachmentErrors);
    return (
      Object.keys(nextFormErrors).length === 0 &&
      Object.keys(nextAttachmentErrors).length === 0
    );
  };

  const handleCreateEcho = async () => {
    if (isSubmitting || !validate()) return;

    const controller = new AbortController();
    requestControllerRef.current = controller;
    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const processedAttachments: CreateEchoRequest["parts"] = [];

      for (const [index, attachment] of attachments.entries()) {
        let content = attachment.content.trim();

        if (
          attachment.localUri &&
          (attachment.type === "image" || attachment.type === "audio")
        ) {
          setUploadingAttachmentId(attachment.draftId);
          const uploadResponse = await apiService.uploadFile(
            attachment.localUri,
            attachment.fileName || `echo-file-${Date.now()}`,
            attachment.mimeType ||
              (attachment.type === "image" ? "image/jpeg" : "audio/m4a"),
            controller.signal,
          );

          if (controller.signal.aborted) return;
          if (!uploadResponse.success || !uploadResponse.data?.url) {
            const message =
              uploadResponse.error || `Could not upload ${attachment.type}.`;
            setAttachmentErrors((current) => ({
              ...current,
              [attachment.draftId]: message,
            }));
            setSubmitError("Fix the attachment error and try again.");
            return;
          }
          content = uploadResponse.data.url;
        }

        processedAttachments.push({
          type: attachment.type,
          content,
          order_index: index + 1,
        });
      }

      setUploadingAttachmentId(null);
      const request: CreateEchoRequest = {
        ...(userSettings.enableDateSelection
          ? { return_at: selectedDate.toISOString() }
          : {}),
        parts: [
          { type: "text", content: mainMessage.trim(), order_index: 0 },
          ...processedAttachments,
        ],
      };

      const response = await apiService.createEcho(request, controller.signal);
      if (controller.signal.aborted) return;
      if (!response.success) {
        setSubmitError(response.error || "Your echo could not be created.");
        return;
      }

      navigation.goBack();
    } catch (error) {
      if (!controller.signal.aborted) {
        console.error("Failed to create echo:", error);
        setSubmitError("Your echo could not be created. Please try again.");
      }
    } finally {
      if (mountedRef.current) {
        setIsSubmitting(false);
        setUploadingAttachmentId(null);
      }
      if (requestControllerRef.current === controller) {
        requestControllerRef.current = null;
      }
    }
  };

  const handleBack = () => {
    if (!isSubmitting) {
      navigation.goBack();
      return;
    }

    Alert.alert(
      "Cancel echo creation?",
      "The current upload will stop. Your draft is not saved after leaving this screen.",
      [
        { text: "Keep Working", style: "cancel" },
        {
          text: "Leave",
          style: "destructive",
          onPress: () => {
            requestControllerRef.current?.abort();
            navigation.goBack();
          },
        },
      ],
    );
  };

  const openLink = async (url: string) => {
    if (!isValidWebUrl(url)) return;
    try {
      if (await Linking.canOpenURL(url)) await Linking.openURL(url);
      else Alert.alert("Cannot open link", "No app can open this address.");
    } catch (error) {
      console.error("Failed to open draft link:", error);
      Alert.alert("Cannot open link", "Please check the web address.");
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <ScreenHeader title="Create Echo" onBack={handleBack} />
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={process.env.EXPO_OS === "ios" ? "padding" : "height"}
      >
        <ScrollView
          contentInsetAdjustmentBehavior="automatic"
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{
            padding: spacing.xl,
            paddingBottom: spacing["3xl"],
            gap: spacing["2xl"],
          }}
        >
          <Text
            style={{
              color: colors.contentMuted,
              fontFamily: fontFamilies.bodySemibold,
              fontSize: 16,
              lineHeight: 23,
              textAlign: "center",
            }}
          >
            Send a message to your future self.
          </Text>

          <DeliverySection
            enabled={userSettings.enableDateSelection}
            selectedDate={selectedDate}
            error={formErrors.date}
            onShowDate={() => setShowDatePicker(true)}
            onShowTime={() => setShowTimePicker(true)}
          />

          {showDatePicker && (
            <DateTimePicker
              value={selectedDate}
              mode="date"
              display="default"
              minimumDate={new Date()}
              onChange={handleDateChange}
            />
          )}
          {showTimePicker && (
            <DateTimePicker
              value={selectedDate}
              mode="time"
              display="default"
              minuteInterval={5}
              onChange={handleTimeChange}
            />
          )}

          <View style={{ gap: spacing.md }}>
            <SectionHeading>Your Message</SectionHeading>
            <FormField
              label="Message"
              hint="Write what you want your future self to remember."
              placeholder="Write your message here…"
              value={mainMessage}
              error={formErrors.message}
              editable={!isSubmitting}
              multiline
              numberOfLines={5}
              textAlignVertical="top"
              style={{ minHeight: 132 }}
              onChangeText={(value) => {
                setMainMessage(value);
                setFormErrors((current) => ({
                  ...current,
                  message: undefined,
                }));
                setSubmitError(null);
              }}
            />
          </View>

          <View style={{ gap: spacing.md }}>
            <SectionHeading>Attachments</SectionHeading>
            <Text
              style={{
                color: colors.contentMuted,
                fontFamily: fontFamilies.body,
                fontSize: 15,
                lineHeight: 22,
              }}
            >
              Optional images, audio recordings, and web links.
            </Text>
            <View style={{ flexDirection: "row", gap: spacing.sm }}>
              {(["image", "audio", "link"] as const).map((type) => (
                <AppButton
                  key={type}
                  label={`Add ${type}`}
                  variant="secondary"
                  fullWidth={false}
                  disabled={isSubmitting}
                  onPress={() => addAttachment(type)}
                  style={{ flex: 1, paddingHorizontal: spacing.sm }}
                />
              ))}
            </View>

            {attachments.length === 0 && (
              <AppCard
                style={{
                  alignItems: "center",
                  borderStyle: "dashed",
                  gap: spacing.xs,
                }}
              >
                <Text
                  style={{
                    color: colors.content,
                    fontFamily: fontFamilies.bodyBold,
                    fontSize: 15,
                  }}
                >
                  No attachments
                </Text>
                <Text
                  style={{
                    color: colors.contentMuted,
                    fontFamily: fontFamilies.body,
                    fontSize: 13,
                    textAlign: "center",
                  }}
                >
                  Your echo can contain only the message.
                </Text>
              </AppCard>
            )}

            {attachments.map((attachment, index) => (
              <AttachmentEditor
                key={attachment.draftId}
                attachment={attachment}
                index={index}
                error={attachmentErrors[attachment.draftId]}
                disabled={isSubmitting}
                onRemove={() => removeAttachment(attachment.draftId)}
                onChangeContent={(content) =>
                  updateAttachment(attachment.draftId, { content })
                }
                onPickImage={() => pickImage(attachment.draftId)}
                onRecordAudio={() =>
                  setRecordingAttachmentId(attachment.draftId)
                }
                onOpenLink={() => openLink(attachment.content)}
              />
            ))}
          </View>

          {uploadingAttachmentId && (
            <Text
              accessibilityLiveRegion="polite"
              style={{
                color: colors.contentMuted,
                fontFamily: fontFamilies.bodySemibold,
                fontSize: 14,
                textAlign: "center",
              }}
            >
              {`Uploading attachment ${
                attachments.findIndex(
                  (attachment) =>
                    attachment.draftId === uploadingAttachmentId,
                ) + 1
              }…`}
            </Text>
          )}

          {submitError && (
            <Text
              accessibilityLiveRegion="assertive"
              selectable
              style={{
                color: colors.danger,
                fontFamily: fontFamilies.bodySemibold,
                fontSize: 14,
                lineHeight: 20,
                textAlign: "center",
              }}
            >
              {submitError}
            </Text>
          )}

          <AppButton
            label="Create Echo"
            loading={isSubmitting}
            onPress={handleCreateEcho}
          />
        </ScrollView>
      </KeyboardAvoidingView>

      <AudioRecorder
        visible={Boolean(recordingAttachmentId)}
        onClose={() => setRecordingAttachmentId(null)}
        onRecordingComplete={handleRecordingComplete}
      />
    </View>
  );
};
