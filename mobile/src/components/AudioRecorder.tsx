import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Alert,
  Modal,
  ActivityIndicator,
} from "react-native";
import { Audio } from "expo-av";
import * as MediaLibrary from "expo-media-library";
import { HugeiconsIcon } from "@hugeicons/react-native";
import { Mic02Icon, StopIcon } from "@hugeicons/core-free-icons";

interface AudioRecorderProps {
  visible: boolean;
  onClose: () => void;
  onRecordingComplete: (uri: string, duration: number) => void;
}

export const AudioRecorder: React.FC<AudioRecorderProps> = ({
  visible,
  onClose,
  onRecordingComplete,
}) => {
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [hasPermission, setHasPermission] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const MAX_RECORDING_TIME = 30; // 30 seconds

  useEffect(() => {
    requestPermissions();
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, []);

  const requestPermissions = async () => {
    const { status: audioStatus } = await Audio.requestPermissionsAsync();
    const { status: mediaStatus } =
      await MediaLibrary.requestPermissionsAsync();

    if (audioStatus === "granted" && mediaStatus === "granted") {
      setHasPermission(true);
    } else {
      Alert.alert(
        "Permissions Required",
        "Audio and media library permissions are required to record audio.",
      );
    }
  };

  const startRecording = async () => {
    try {
      if (!hasPermission) {
        await requestPermissions();
        return;
      }

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY,
      );

      setRecording(recording);
      setIsRecording(true);
      setRecordingTime(0);

      // Start timer
      timerRef.current = setInterval(() => {
        setRecordingTime((prev) => {
          if (prev >= MAX_RECORDING_TIME) {
            stopRecording();
            return prev;
          }
          return prev + 1;
        });
      }, 1000);
    } catch (error) {
      console.error("Failed to start recording:", error);
      Alert.alert("Error", "Failed to start recording");
    }
  };

  const stopRecording = async () => {
    try {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }

      if (!recording) return;

      setIsRecording(false);
      await recording.stopAndUnloadAsync();
      const uri = recording.getURI();

      if (uri) {
        // Save to media library
        await MediaLibrary.saveToLibraryAsync(uri);

        // Get recording duration
        const status = await recording.getStatusAsync();
        const duration = status.durationMillis
          ? status.durationMillis / 1000
          : 0;

        onRecordingComplete(uri, duration);
      }

      setRecording(null);
      setRecordingTime(0);
    } catch (error) {
      console.error("Failed to stop recording:", error);
      Alert.alert("Error", "Failed to stop recording");
    }
  };

  const cancelRecording = async () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    if (recording) {
      await recording.stopAndUnloadAsync();
      setRecording(null);
    }

    setIsRecording(false);
    setRecordingTime(0);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const getProgressPercentage = () => {
    return (recordingTime / MAX_RECORDING_TIME) * 100;
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      onRequestClose={onClose}
    >
      <View className="flex-1 bg-black/50 justify-center items-center">
        <View className="bg-card rounded-2xl p-6 w-80 max-w-sm">
          <Text className="text-2xl font-bold text-gray-900 text-center mb-6">
            Record Audio
          </Text>

          {!hasPermission && (
            <View className="mb-6">
              <Text className="text-red-600 text-center mb-4">
                Audio permissions required
              </Text>
              <TouchableOpacity
                className="bg-blue-500 rounded-lg py-3 px-4"
                onPress={requestPermissions}
              >
                <Text className="text-white text-center font-medium">
                  Grant Permissions
                </Text>
              </TouchableOpacity>
            </View>
          )}

          {hasPermission && (
            <>
              {/* Recording Timer */}
              <View className="items-center mb-6">
                <Text className="text-4xl font-mono text-gray-900 mb-2">
                  {formatTime(recordingTime)}
                </Text>
                <Text className="text-sm text-gray-500">
                  Max: {formatTime(MAX_RECORDING_TIME)}
                </Text>
              </View>

              {/* Progress Bar */}
              <View className="bg-gray-200 rounded-full h-2 mb-6">
                <View
                  className="bg-blue-500 h-2 rounded-full"
                  style={{ width: `${getProgressPercentage()}%` }}
                />
              </View>

              {/* Recording Status */}
              {isRecording && (
                <View className="items-center mb-6">
                  <View className="w-4 h-4 bg-red-500 rounded-full animate-pulse mb-2" />
                  <Text className="text-red-600 font-medium">Recording...</Text>
                </View>
              )}

              {/* Controls */}
              <View className="flex-row justify-center space-x-4">
                {!isRecording ? (
                  <TouchableOpacity
                    className="bg-red-500 rounded-full w-16 h-16 justify-center items-center"
                    onPress={startRecording}
                    disabled={isLoading}
                  >
                    <Text className="text-white text-2xl">
                      <HugeiconsIcon
                        icon={Mic02Icon}
                        size={24}
                        color="white"
                        strokeWidth={1.5}
                      />
                    </Text>
                  </TouchableOpacity>
                ) : (
                  <TouchableOpacity
                    className="bg-gray-500 rounded-full w-16 h-16 justify-center items-center"
                    onPress={stopRecording}
                    disabled={isLoading}
                  >
                    <Text className="text-white text-2xl">
                      <HugeiconsIcon
                        icon={StopIcon}
                        size={24}
                        color="white"
                        strokeWidth={1.5}
                      />
                    </Text>
                  </TouchableOpacity>
                )}
              </View>

              {/* Action Buttons */}
              <View className="flex-row justify-between mt-6">
                <TouchableOpacity
                  className="bg-gray-300 rounded-lg py-3 px-4 flex-1 mr-2"
                  onPress={cancelRecording}
                  disabled={isLoading}
                >
                  <Text className="text-gray-700 text-center font-medium">
                    Cancel
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  className="bg-gray-300 rounded-lg py-3 px-4 flex-1 ml-2"
                  onPress={onClose}
                  disabled={isLoading}
                >
                  <Text className="text-gray-700 text-center font-medium">
                    Close
                  </Text>
                </TouchableOpacity>
              </View>
            </>
          )}

          {isLoading && (
            <View className="absolute inset-0 bg-white/80 justify-center items-center rounded-2xl">
              <ActivityIndicator size="large" color="#0ea5e9" />
              <Text className="text-gray-600 mt-2">Processing...</Text>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
};
