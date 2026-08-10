import React, { useEffect, useRef, useState } from "react";
import { Alert, AppState, Linking, Modal, Text, View } from "react-native";
import { Audio } from "expo-av";
import { AppButton, AppCard } from "./ui";
import { colors, fontFamilies, radii, spacing } from "../theme";

interface AudioRecorderProps {
  visible: boolean;
  onClose: () => void;
  onRecordingComplete: (uri: string, duration: number) => void;
}

type PermissionState = "unknown" | "requesting" | "granted" | "denied";

const MAX_RECORDING_TIME = 30;

export const AudioRecorder: React.FC<AudioRecorderProps> = ({
  visible,
  onClose,
  onRecordingComplete,
}) => {
  const recordingRef = useRef<Audio.Recording | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const processingRef = useRef(false);
  const [permissionState, setPermissionState] =
    useState<PermissionState>("unknown");
  const [canAskAgain, setCanAskAgain] = useState(true);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const clearTimer = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  const requestPermission = async () => {
    setPermissionState("requesting");
    setError(null);
    try {
      const permission = await Audio.requestPermissionsAsync();
      setCanAskAgain(permission.canAskAgain);
      setPermissionState(permission.granted ? "granted" : "denied");
    } catch (permissionError) {
      console.error("Failed to request audio permission:", permissionError);
      setPermissionState("denied");
      setError("Microphone access could not be requested.");
    }
  };

  const finishRecording = async (complete: boolean) => {
    if (processingRef.current) return;

    const recording = recordingRef.current;
    if (!recording) return;

    processingRef.current = true;
    setIsProcessing(true);
    setIsRecording(false);
    clearTimer();

    try {
      const status = await recording.getStatusAsync();
      const duration = status.isRecording
        ? status.durationMillis / 1000
        : recordingTime;
      await recording.stopAndUnloadAsync();
      const uri = recording.getURI();

      recordingRef.current = null;
      setRecordingTime(0);

      if (complete) {
        if (!uri) throw new Error("Recording finished without a file URI");
        onRecordingComplete(uri, duration);
      }
    } catch (recordingError) {
      console.error("Failed to finish recording:", recordingError);
      recordingRef.current = null;
      setError(
        complete
          ? "The recording could not be completed. Please try again."
          : "The recording could not be discarded safely.",
      );
    } finally {
      processingRef.current = false;
      setIsProcessing(false);
    }
  };

  const startRecording = async () => {
    if (permissionState !== "granted" || processingRef.current) return;

    setError(null);
    setIsProcessing(true);
    processingRef.current = true;
    try {
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY,
      );
      recordingRef.current = recording;
      setRecordingTime(0);
      setIsRecording(true);

      timerRef.current = setInterval(() => {
        setRecordingTime((current) => {
          const next = Math.min(current + 1, MAX_RECORDING_TIME);
          if (next >= MAX_RECORDING_TIME) void finishRecording(true);
          return next;
        });
      }, 1000);
    } catch (recordingError) {
      console.error("Failed to start recording:", recordingError);
      recordingRef.current = null;
      setError("Recording could not be started. Please try again.");
    } finally {
      processingRef.current = false;
      setIsProcessing(false);
    }
  };

  const requestClose = () => {
    if (isProcessing) return;

    if (!isRecording) {
      onClose();
      return;
    }

    Alert.alert(
      "Discard recording?",
      "Your current recording will not be attached to this echo.",
      [
        { text: "Keep Recording", style: "cancel" },
        {
          text: "Discard",
          style: "destructive",
          onPress: async () => {
            await finishRecording(false);
            onClose();
          },
        },
      ],
    );
  };

  useEffect(() => {
    if (visible && permissionState === "unknown") {
      requestPermission();
    }
  }, [visible, permissionState]);

  useEffect(() => {
    if (!visible) return;

    const refreshPermission = async () => {
      try {
        const permission = await Audio.getPermissionsAsync();
        setCanAskAgain(permission.canAskAgain);
        if (permission.granted) setPermissionState("granted");
      } catch (permissionError) {
        console.error("Failed to refresh audio permission:", permissionError);
      }
    };

    const subscription = AppState.addEventListener("change", (nextState) => {
      if (nextState === "active") refreshPermission();
    });

    return () => subscription.remove();
  }, [visible]);

  useEffect(() => {
    return () => {
      clearTimer();
      const recording = recordingRef.current;
      recordingRef.current = null;
      if (recording) {
        recording.stopAndUnloadAsync().catch((cleanupError) => {
          console.error("Failed to clean up recording:", cleanupError);
        });
      }
    };
  }, []);

  const progress = Math.min(recordingTime / MAX_RECORDING_TIME, 1);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={requestClose}
    >
      <View
        accessibilityViewIsModal
        style={{
          flex: 1,
          alignItems: "center",
          justifyContent: "center",
          padding: spacing.xl,
          backgroundColor: colors.scrim,
        }}
      >
        <AppCard style={{ width: "100%", maxWidth: 380, gap: spacing.xl }}>
          <Text
            accessibilityRole="header"
            style={{
              color: colors.content,
              fontFamily: fontFamilies.displayBold,
              fontSize: 26,
              textAlign: "center",
            }}
          >
            Record Audio
          </Text>

          {permissionState !== "granted" ? (
            <PermissionContent
              state={permissionState}
              canAskAgain={canAskAgain}
              error={error}
              onRequestPermission={requestPermission}
              onClose={onClose}
            />
          ) : (
            <>
              <View style={{ alignItems: "center", gap: spacing.xs }}>
                <Text
                  accessibilityLiveRegion="polite"
                  style={{
                    color: colors.content,
                    fontFamily: fontFamilies.bodyBold,
                    fontSize: 42,
                    fontVariant: ["tabular-nums"],
                  }}
                >
                  {formatTime(recordingTime)}
                </Text>
                <Text
                  style={{
                    color: colors.contentMuted,
                    fontFamily: fontFamilies.body,
                    fontSize: 14,
                  }}
                >
                  Maximum {formatTime(MAX_RECORDING_TIME)}
                </Text>
              </View>

              <View
                accessible
                accessibilityRole="progressbar"
                accessibilityLabel="Recording time"
                accessibilityValue={{
                  min: 0,
                  max: MAX_RECORDING_TIME,
                  now: recordingTime,
                  text: `${recordingTime} of ${MAX_RECORDING_TIME} seconds`,
                }}
                style={{
                  height: 8,
                  overflow: "hidden",
                  borderRadius: radii.pill,
                  backgroundColor: colors.disabledSurface,
                }}
              >
                <View
                  style={{
                    width: `${progress * 100}%`,
                    height: "100%",
                    backgroundColor: isRecording
                      ? colors.danger
                      : colors.content,
                  }}
                />
              </View>

              <Text
                accessibilityLiveRegion="polite"
                style={{
                  color: isRecording ? colors.danger : colors.contentMuted,
                  fontFamily: fontFamilies.bodySemibold,
                  fontSize: 15,
                  textAlign: "center",
                }}
              >
                {isProcessing
                  ? "Processing recording…"
                  : isRecording
                    ? "Recording in progress"
                    : "Ready to record"}
              </Text>

              {error && (
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
                  {error}
                </Text>
              )}

              <AppButton
                label={isRecording ? "Finish Recording" : "Start Recording"}
                variant={isRecording ? "danger" : "primary"}
                loading={isProcessing}
                onPress={
                  isRecording ? () => finishRecording(true) : startRecording
                }
              />
              <AppButton
                label={isRecording ? "Discard or Close" : "Close"}
                variant="quiet"
                disabled={isProcessing}
                onPress={requestClose}
              />
            </>
          )}
        </AppCard>
      </View>
    </Modal>
  );
};

function PermissionContent({
  state,
  canAskAgain,
  error,
  onRequestPermission,
  onClose,
}: {
  state: PermissionState;
  canAskAgain: boolean;
  error: string | null;
  onRequestPermission: () => void;
  onClose: () => void;
}) {
  const requesting = state === "requesting";

  return (
    <View style={{ gap: spacing.lg }}>
      <Text
        selectable
        style={{
          color: error ? colors.danger : colors.contentMuted,
          fontFamily: fontFamilies.body,
          fontSize: 15,
          lineHeight: 22,
          textAlign: "center",
        }}
      >
        {error ??
          (requesting
            ? "Requesting microphone access…"
            : "Microphone access is required to record an echo.")}
      </Text>
      <AppButton
        label={canAskAgain ? "Allow Microphone" : "Open Settings"}
        loading={requesting}
        onPress={
          canAskAgain ? onRequestPermission : () => Linking.openSettings()
        }
      />
      <AppButton label="Not Now" variant="quiet" onPress={onClose} />
    </View>
  );
}

function formatTime(seconds: number) {
  const minutes = Math.floor(seconds / 60);
  const remainder = seconds % 60;
  return `${minutes}:${remainder.toString().padStart(2, "0")}`;
}
