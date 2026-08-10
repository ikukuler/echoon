import React, { useEffect, useRef, useState } from "react";
import { Text, View } from "react-native";
import { Audio, AVPlaybackStatus } from "expo-av";
import { HugeiconsIcon } from "@hugeicons/react-native";
import {
  MusicNote03FreeIcons,
  PauseIcon,
  PlayIcon,
  StopIcon,
} from "@hugeicons/core-free-icons";
import { AppButton, AppCard, IconButton } from "./ui";
import { colors, fontFamilies, radii, sizes, spacing } from "../theme";

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
  const soundRef = useRef<Audio.Sound | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isReady, setIsReady] = useState(false);
  const [currentPosition, setCurrentPosition] = useState(0);
  const [totalDuration, setTotalDuration] = useState(duration);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let active = true;
    setIsLoading(true);
    setIsReady(false);
    setIsPlaying(false);
    setCurrentPosition(0);
    setTotalDuration(duration);
    setError(null);

    const handlePlaybackStatus = (status: AVPlaybackStatus) => {
      if (!active) return;

      if (!status.isLoaded) {
        if (status.error) {
          setError("This audio recording is unavailable.");
          setIsReady(false);
        }
        return;
      }

      setIsPlaying(status.isPlaying);
      setCurrentPosition((status.positionMillis ?? 0) / 1000);
      setTotalDuration((status.durationMillis ?? duration * 1000) / 1000);
      if (status.didJustFinish) {
        setCurrentPosition(0);
        setIsPlaying(false);
      }
    };

    const loadAudio = async () => {
      try {
        const previousSound = soundRef.current;
        soundRef.current = null;
        if (previousSound) await previousSound.unloadAsync();

        const { sound, status } = await Audio.Sound.createAsync(
          { uri: audioUri },
          { shouldPlay: false, progressUpdateIntervalMillis: 250 },
          handlePlaybackStatus,
        );

        if (!active) {
          await sound.unloadAsync();
          return;
        }

        soundRef.current = sound;
        if (status.isLoaded) {
          setTotalDuration((status.durationMillis ?? duration * 1000) / 1000);
          setIsReady(true);
        } else {
          setError("This audio recording is unavailable.");
        }
      } catch (loadError) {
        console.error("Failed to load audio:", loadError);
        if (active) setError("This audio recording could not be loaded.");
      } finally {
        if (active) setIsLoading(false);
      }
    };

    loadAudio();

    return () => {
      active = false;
      const sound = soundRef.current;
      soundRef.current = null;
      if (sound) {
        sound.unloadAsync().catch((unloadError) => {
          console.error("Failed to unload audio:", unloadError);
        });
      }
    };
  }, [audioUri, duration, reloadKey]);

  const playAudio = async () => {
    const sound = soundRef.current;
    if (!sound) return;

    try {
      const status = await sound.getStatusAsync();
      if (
        status.isLoaded &&
        status.durationMillis &&
        status.positionMillis >= status.durationMillis
      ) {
        await sound.setPositionAsync(0);
      }
      await sound.playAsync();
    } catch (playError) {
      console.error("Failed to play audio:", playError);
      setError("Playback failed. Please try again.");
    }
  };

  const pauseAudio = async () => {
    try {
      await soundRef.current?.pauseAsync();
    } catch (pauseError) {
      console.error("Failed to pause audio:", pauseError);
      setError("Playback could not be paused.");
    }
  };

  const stopAudio = async () => {
    try {
      const sound = soundRef.current;
      if (!sound) return;
      await sound.stopAsync();
      await sound.setPositionAsync(0);
      setCurrentPosition(0);
      setIsPlaying(false);
    } catch (stopError) {
      console.error("Failed to stop audio:", stopError);
      setError("Playback could not be stopped.");
    }
  };

  const visibleDuration = totalDuration || duration;
  const progress = visibleDuration
    ? Math.min(Math.max(currentPosition / visibleDuration, 0), 1)
    : 0;
  const controlsDisabled = isLoading || !isReady || Boolean(error);

  return (
    <AppCard style={{ gap: spacing.md }}>
      <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.md }}>
        <HugeiconsIcon
          icon={MusicNote03FreeIcons}
          size={sizes.icon}
          color={colors.content}
          strokeWidth={1.5}
        />
        <View style={{ flex: 1, gap: spacing.xs }}>
          <Text
            numberOfLines={1}
            style={{
              color: colors.content,
              fontFamily: fontFamilies.bodyBold,
              fontSize: 15,
            }}
          >
            {fileName || "Audio Recording"}
          </Text>
          <Text
            accessibilityLiveRegion="polite"
            style={{
              color: colors.contentMuted,
              fontFamily: fontFamilies.body,
              fontSize: 13,
              fontVariant: ["tabular-nums"],
            }}
          >
            {formatTime(currentPosition)} / {formatTime(visibleDuration)}
          </Text>
        </View>
      </View>

      <View
        accessible
        accessibilityRole="progressbar"
        accessibilityLabel="Audio playback progress"
        accessibilityValue={{
          min: 0,
          max: Math.max(Math.round(visibleDuration), 1),
          now: Math.round(currentPosition),
          text: `${formatTime(currentPosition)} of ${formatTime(visibleDuration)}`,
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
            borderRadius: radii.pill,
            backgroundColor: colors.content,
          }}
        />
      </View>

      {error ? (
        <View style={{ gap: spacing.md }}>
          <Text
            accessibilityLiveRegion="polite"
            selectable
            style={{
              color: colors.danger,
              fontFamily: fontFamilies.bodySemibold,
              fontSize: 14,
              textAlign: "center",
            }}
          >
            {error}
          </Text>
          <AppButton
            label="Try Again"
            variant="quiet"
            onPress={() => setReloadKey((key) => key + 1)}
          />
        </View>
      ) : (
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "center",
            gap: spacing.lg,
          }}
        >
          <IconButton
            accessibilityLabel="Stop audio"
            accessibilityHint="Stops playback and returns to the beginning"
            disabled={controlsDisabled || currentPosition === 0}
            onPress={stopAudio}
            icon={
              <HugeiconsIcon
                icon={StopIcon}
                size={sizes.icon}
                color={colors.content}
                strokeWidth={1.5}
              />
            }
          />
          <IconButton
            accessibilityLabel={isPlaying ? "Pause audio" : "Play audio"}
            selected={isPlaying}
            disabled={controlsDisabled}
            onPress={isPlaying ? pauseAudio : playAudio}
            icon={
              <HugeiconsIcon
                icon={isPlaying ? PauseIcon : PlayIcon}
                size={sizes.icon}
                color={colors.content}
                strokeWidth={1.5}
              />
            }
          />
        </View>
      )}

      {isLoading && (
        <Text
          accessibilityLiveRegion="polite"
          style={{
            color: colors.contentMuted,
            fontFamily: fontFamilies.body,
            fontSize: 13,
            textAlign: "center",
          }}
        >
          Loading audio…
        </Text>
      )}
    </AppCard>
  );
};

function formatTime(seconds: number) {
  const safeSeconds = Number.isFinite(seconds) ? Math.max(seconds, 0) : 0;
  const minutes = Math.floor(safeSeconds / 60);
  const remainder = Math.floor(safeSeconds % 60);
  return `${minutes}:${remainder.toString().padStart(2, "0")}`;
}
