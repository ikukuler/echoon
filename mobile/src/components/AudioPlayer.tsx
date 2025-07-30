import React, { useState, useEffect } from "react";
import { View, Text, TouchableOpacity, Alert } from "react-native";
import { Audio } from "expo-av";
import { HugeiconsIcon } from "@hugeicons/react-native";
import {
  MusicNote03FreeIcons,
  PauseIcon,
  PlayIcon,
  StopIcon,
} from "@hugeicons/core-free-icons";

interface AudioPlayerProps {
  audioUri: string;
  duration?: number;
  fileName?: string;
}

export const AudioPlayer: React.FC<AudioPlayerProps> = ({
  audioUri,
  duration = 0,
  fileName,
}) => {
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [currentPosition, setCurrentPosition] = useState(0);
  const [totalDuration, setTotalDuration] = useState(0);

  useEffect(() => {
    loadAudio();
    return () => {
      if (sound) {
        sound.unloadAsync();
      }
    };
  }, [audioUri]);

  const loadAudio = async () => {
    try {
      setIsLoading(true);

      if (sound) {
        await sound.unloadAsync();
      }

      const { sound: newSound } = await Audio.Sound.createAsync(
        { uri: audioUri },
        { shouldPlay: false },
        onPlaybackStatusUpdate,
      );

      setSound(newSound);

      // Get duration
      const status = await newSound.getStatusAsync();
      if (status.isLoaded) {
        setTotalDuration(
          status.durationMillis ? status.durationMillis / 1000 : 0,
        );
      }
    } catch (error) {
      console.error("Failed to load audio:", error);
      Alert.alert("Error", "Failed to load audio file");
    } finally {
      setIsLoading(false);
    }
  };

  const onPlaybackStatusUpdate = (status: any) => {
    if (status.isLoaded) {
      setIsPlaying(status.isPlaying);
      setCurrentPosition(
        status.positionMillis ? status.positionMillis / 1000 : 0,
      );
      setTotalDuration(
        status.durationMillis ? status.durationMillis / 1000 : 0,
      );
    }
  };

  const playAudio = async () => {
    try {
      if (sound) {
        await sound.playAsync();
      }
    } catch (error) {
      console.error("Failed to play audio:", error);
      Alert.alert("Error", "Failed to play audio");
    }
  };

  const pauseAudio = async () => {
    try {
      if (sound) {
        await sound.pauseAsync();
      }
    } catch (error) {
      console.error("Failed to pause audio:", error);
    }
  };

  const stopAudio = async () => {
    try {
      if (sound) {
        await sound.stopAsync();
        await sound.setPositionAsync(0);
      }
    } catch (error) {
      console.error("Failed to stop audio:", error);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const getProgressPercentage = () => {
    if (totalDuration === 0) return 0;
    return (currentPosition / totalDuration) * 100;
  };

  const seekTo = async (percentage: number) => {
    try {
      if (sound && totalDuration > 0) {
        const newPosition = (percentage / 100) * totalDuration;
        await sound.setPositionAsync(newPosition * 1000);
      }
    } catch (error) {
      console.error("Failed to seek audio:", error);
    }
  };

  return (
    <View className="bg-card rounded-xl p-4 border border-gray-200">
      {/* File Info */}
      <View className="flex-row items-center mb-3">
        <Text className="text-2xl mr-2">
          <HugeiconsIcon
            icon={MusicNote03FreeIcons}
            size={24}
            color="black"
            strokeWidth={1.5}
          />
        </Text>
        <View className="flex-1">
          <Text className="text-sm font-medium text-gray-900" numberOfLines={1}>
            {fileName || "Audio Recording"}
          </Text>
          <Text className="text-xs text-gray-500">
            {formatTime(currentPosition)} /{" "}
            {formatTime(totalDuration || duration)}
          </Text>
        </View>
      </View>

      {/* Progress Bar */}
      <View className="bg-gray-200 rounded-full h-2 mb-3">
        <View
          className="bg-blue-500 h-2 rounded-full"
          style={{ width: `${getProgressPercentage()}%` }}
        />
      </View>

      {/* Controls */}
      <View className="flex-row justify-center items-center space-x-4 gap-4">
        <TouchableOpacity
          className="bg-echo rounded-full w-12 h-12 justify-center items-center"
          onPress={stopAudio}
          disabled={isLoading}
        >
          <Text className="text-gray-700 text-lg">
            <HugeiconsIcon
              icon={StopIcon}
              size={24}
              color="white"
              strokeWidth={1.5}
            />
          </Text>
        </TouchableOpacity>

        {isPlaying ? (
          <TouchableOpacity
            className="bg-echo rounded-full w-12 h-12 justify-center items-center"
            onPress={pauseAudio}
            disabled={isLoading}
            activeOpacity={0.7}
          >
            <Text className="text-white text-lg">
              <HugeiconsIcon
                icon={PauseIcon}
                size={24}
                color="white"
                strokeWidth={1.5}
              />
            </Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            className="bg-echo rounded-full w-12 h-12 justify-center items-center"
            onPress={playAudio}
            disabled={isLoading}
            activeOpacity={0.7}
          >
            <Text className="text-white text-lg">
              <HugeiconsIcon
                icon={PlayIcon}
                size={24}
                color="white"
                strokeWidth={1.5}
                activeOpacity={0.7}
              />
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {isLoading && (
        <View className="absolute inset-0 bg-white/80 justify-center items-center rounded-xl">
          <Text className="text-gray-600">Loading...</Text>
        </View>
      )}
    </View>
  );
};
