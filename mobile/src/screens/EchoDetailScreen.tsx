import React, { useCallback, useEffect, useState } from "react";
import {
  Alert,
  Image,
  Linking,
  Modal,
  ScrollView,
  StatusBar,
  Text,
  View,
  useWindowDimensions,
} from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { RootStackParamList, Echo } from "../types";
import { formatDate, isFutureDate } from "../utils/dateUtils";
import { apiService } from "../services/api";
import { EchoPartRenderer } from "../components/echo/echo-part-renderer";
import {
  AppCard,
  FeedbackState,
  IconButton,
  ScreenHeader,
  StatusBadge,
} from "../components/ui";
import { colors, fontFamilies, spacing } from "../theme";

type EchoDetailScreenProps = NativeStackScreenProps<
  RootStackParamList,
  "EchoDetail"
>;

export const EchoDetailScreen: React.FC<EchoDetailScreenProps> = ({
  navigation,
  route,
}) => {
  const params = route.params ?? {};
  const { width, height } = useWindowDimensions();
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [echo, setEcho] = useState<Echo | null>(params.echo ?? null);
  const [isLoading, setIsLoading] = useState(Boolean(params.echoId && !params.echo));
  const [loadError, setLoadError] = useState<string | null>(null);

  const loadEcho = useCallback(async () => {
    if (!params.echoId) return;

    setIsLoading(true);
    setLoadError(null);
    try {
      const response = await apiService.getEcho(params.echoId);
      if (response.success && response.data) {
        setEcho(response.data);
      } else {
        setEcho(null);
        setLoadError(response.error || "This echo could not be loaded.");
      }
    } catch (error) {
      console.error("Error loading echo:", error);
      setEcho(null);
      setLoadError("This echo could not be loaded. Check your connection.");
    } finally {
      setIsLoading(false);
    }
  }, [params.echoId]);

  useEffect(() => {
    if (params.echo) {
      setEcho(params.echo);
      setLoadError(null);
      setIsLoading(false);
    } else if (params.echoId) {
      loadEcho();
    }
  }, [loadEcho, params.echo]);

  const handleLinkPress = async (url: string) => {
    try {
      const parsedUrl = new URL(url);
      if (parsedUrl.protocol !== "https:" && parsedUrl.protocol !== "http:") {
        Alert.alert("Unsupported link", "Only web links can be opened.");
        return;
      }

      const supported = await Linking.canOpenURL(url);
      if (!supported) {
        Alert.alert("Cannot open link", parsedUrl.hostname);
        return;
      }

      await Linking.openURL(url);
    } catch (error) {
      console.error("Could not open echo link:", error);
      Alert.alert("Invalid link", "This link is not a valid web address.");
    }
  };

  if (!params.echo && !params.echoId) {
    return (
      <DetailStateFrame title="Echo unavailable" onBack={navigation.goBack}>
        <FeedbackState
          title="No echo selected"
          message="Return to your echoes and choose one to view."
          actionLabel="Go Back"
          onAction={navigation.goBack}
        />
      </DetailStateFrame>
    );
  }

  if (isLoading) {
    return (
      <DetailStateFrame title="Echo Details" onBack={navigation.goBack}>
        <FeedbackState title="Loading echo" loading />
      </DetailStateFrame>
    );
  }

  if (loadError || !echo) {
    return (
      <DetailStateFrame title="Echo unavailable" onBack={navigation.goBack}>
        <FeedbackState
          title="Could not load echo"
          message={loadError ?? "This echo was not found."}
          actionLabel={params.echoId ? "Try Again" : "Go Back"}
          onAction={params.echoId ? loadEcho : navigation.goBack}
        />
      </DetailStateFrame>
    );
  }

  const pending = isFutureDate(echo.return_at);
  const imageHeight = Math.min(Math.max(width - 56, 240) * 0.75, 420);

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <ScreenHeader title="Echo Details" onBack={navigation.goBack} />

      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        contentContainerStyle={{
          padding: spacing.xl,
          paddingBottom: spacing["3xl"],
          gap: spacing.lg,
        }}
      >
        <AppCard style={{ gap: spacing.sm }}>
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
                  fontSize: 14,
                }}
              >
                Will arrive
              </Text>
              <Text
                selectable
                style={{
                  color: colors.content,
                  fontFamily: fontFamilies.bodyBold,
                  fontSize: 18,
                }}
              >
                {formatDate(echo.return_at)}
              </Text>
            </View>
            <StatusBadge
              label={pending ? "Pending" : "Delivered"}
              tone={pending ? "pending" : "delivered"}
            />
          </View>
        </AppCard>

        {echo.parts?.map((part) => (
          <EchoPartRenderer
            key={part.id}
            part={part}
            imageHeight={imageHeight}
            onOpenImage={setSelectedImage}
            onOpenLink={handleLinkPress}
          />
        ))}

        <Text
          selectable
          style={{
            paddingTop: spacing.sm,
            color: colors.contentMuted,
            fontFamily: fontFamilies.body,
            fontSize: 13,
            textAlign: "center",
          }}
        >
          Created {formatDate(echo.created_at)}
        </Text>
      </ScrollView>

      <Modal
        visible={Boolean(selectedImage)}
        transparent
        animationType="fade"
        onRequestClose={() => setSelectedImage(null)}
      >
        <StatusBar hidden />
        <View
          style={{
            flex: 1,
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: "rgba(0, 0, 0, 0.92)",
          }}
        >
          <IconButton
            accessibilityLabel="Close full-screen image"
            onPress={() => setSelectedImage(null)}
            icon={
              <Text
                style={{
                  color: colors.contentOnAccent,
                  fontFamily: fontFamilies.bodyBold,
                  fontSize: 22,
                }}
              >
                ×
              </Text>
            }
            style={{
              position: "absolute",
              top: spacing["2xl"],
              right: spacing.xl,
              zIndex: 1,
              backgroundColor: "rgba(255, 255, 255, 0.2)",
            }}
          />
          {selectedImage && (
            <Image
              accessibilityLabel="Full-screen echo image"
              source={{ uri: selectedImage }}
              resizeMode="contain"
              style={{ width, height }}
            />
          )}
        </View>
      </Modal>
    </View>
  );
};

function DetailStateFrame({
  title,
  onBack,
  children,
}: {
  title: string;
  onBack: () => void;
  children: React.ReactNode;
}) {
  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <ScreenHeader title={title} onBack={onBack} />
      {children}
    </View>
  );
}
