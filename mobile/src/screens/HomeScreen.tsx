import React, { useCallback, useRef, useState } from "react";
import {
  Alert,
  FlatList,
  Linking,
  RefreshControl,
  Text,
  View,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { HugeiconsIcon } from "@hugeicons/react-native";
import { Settings02Icon } from "@hugeicons/core-free-icons";
import { useAuth } from "../hooks/useAuth";
import { apiService } from "../services/api";
import { Echo } from "../types";
import { pushNotificationService } from "../services/pushNotifications";
import { EchoCard } from "../components/echo/echo-card";
import {
  AppButton,
  AppCard,
  FeedbackState,
  IconButton,
  ScreenHeader,
  SectionHeading,
} from "../components/ui";
import { colors, fontFamilies, sizes, spacing } from "../theme";

interface HomeScreenProps {
  navigation: {
    navigate: (screen: string, params?: Record<string, unknown>) => void;
  };
}

type LoadMode = "initial" | "refresh" | "more";
const PAGE_SIZE = 10;

export const HomeScreen: React.FC<HomeScreenProps> = ({ navigation }) => {
  const { user } = useAuth();
  const [echoes, setEchoes] = useState<Echo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [initialError, setInitialError] = useState<string | null>(null);
  const [footerError, setFooterError] = useState<string | null>(null);
  const echoesRef = useRef<Echo[]>([]);
  const requestInFlightRef = useRef(false);

  const commitEchoes = (next: Echo[]) => {
    echoesRef.current = next;
    setEchoes(next);
  };

  const loadEchoes = useCallback(async (mode: LoadMode) => {
    if (requestInFlightRef.current) return;
    requestInFlightRef.current = true;

    const isRefresh = mode === "refresh";
    const isMore = mode === "more";
    const offset = isMore ? echoesRef.current.length : 0;

    if (isRefresh) setIsRefreshing(true);
    else if (isMore) setIsLoadingMore(true);
    else setIsLoading(true);

    if (!isMore) setInitialError(null);
    setFooterError(null);

    try {
      const response = await apiService.getUserEchoes(offset, PAGE_SIZE);
      if (!response.success || !response.data) {
        throw new Error(response.error || "Failed to load echoes");
      }

      const incoming = response.data.echoes ?? [];
      const base = isMore ? echoesRef.current : [];
      const byId = new Map(base.map((echo) => [echo.id, echo]));
      incoming.forEach((echo) => byId.set(echo.id, echo));
      const next = Array.from(byId.values());
      commitEchoes(next);

      const total = response.data.pagination?.total ?? next.length;
      setHasMore(offset + incoming.length < total);
    } catch (error) {
      console.error("Error loading echoes:", error);
      const message =
        error instanceof Error ? error.message : "Failed to load echoes";
      if (isMore) setFooterError(message);
      else if (echoesRef.current.length === 0) setInitialError(message);
      else Alert.alert("Could not refresh", "Your existing echoes are still available.");
    } finally {
      requestInFlightRef.current = false;
      setIsLoading(false);
      setIsRefreshing(false);
      setIsLoadingMore(false);
    }
  }, []);

  // Preserve the existing behavior: refresh after returning from Create Echo.
  useFocusEffect(
    useCallback(() => {
      loadEchoes("refresh");
    }, [loadEchoes]),
  );

  const handleOpenLink = useCallback(async (url: string) => {
    try {
      const parsedUrl = new URL(url);
      if (parsedUrl.protocol !== "https:" && parsedUrl.protocol !== "http:") {
        Alert.alert("Unsupported link", "Only web links can be opened.");
        return;
      }
      if (!(await Linking.canOpenURL(url))) {
        Alert.alert("Cannot open link", parsedUrl.hostname);
        return;
      }
      await Linking.openURL(url);
    } catch (error) {
      console.error("Failed to open echo link:", error);
      Alert.alert("Invalid link", "This link is not a valid web address.");
    }
  }, []);

  const renderEcho = useCallback(
    ({ item }: { item: Echo }) => (
      <EchoCard
        echo={item}
        onOpen={() => navigation.navigate("EchoDetail", { echoId: item.id })}
        onOpenLink={handleOpenLink}
      />
    ),
    [handleOpenLink, navigation],
  );

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <ScreenHeader
        title={user?.name || user?.email || "Your Echoes"}
        rightAction={
          <IconButton
            accessibilityLabel="Open settings"
            onPress={() => navigation.navigate("UserSettings")}
            icon={
              <HugeiconsIcon
                icon={Settings02Icon}
                size={sizes.icon}
                color={colors.content}
                strokeWidth={1.5}
              />
            }
          />
        }
      />

      {isLoading && echoes.length === 0 ? (
        <FeedbackState title="Loading your echoes" loading />
      ) : initialError && echoes.length === 0 ? (
        <FeedbackState
          title="Could not load echoes"
          message={initialError}
          actionLabel="Try Again"
          onAction={() => loadEchoes("initial")}
        />
      ) : (
        <FlatList
          data={echoes}
          keyExtractor={(item) => item.id}
          renderItem={renderEcho}
          contentInsetAdjustmentBehavior="automatic"
          contentContainerStyle={{
            padding: spacing.xl,
            paddingBottom: spacing["3xl"],
            gap: spacing.xl,
          }}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={() => loadEchoes("refresh")}
              tintColor={colors.content}
              colors={[colors.content]}
            />
          }
          onEndReached={() => {
            if (hasMore && !isLoadingMore) loadEchoes("more");
          }}
          onEndReachedThreshold={0.35}
          ListHeaderComponent={
            <HomeListHeader
              count={echoes.length}
              onCreate={() => navigation.navigate("CreateEcho")}
              onTestNotification={() =>
                pushNotificationService.sendDemoNotification(
                  "demo-echo-id",
                  "This is a demo echo reminder!",
                )
              }
            />
          }
          ListEmptyComponent={
            <AppCard style={{ alignItems: "center", gap: spacing.sm }}>
              <SectionHeading>No echoes yet</SectionHeading>
              <Text
                style={{
                  color: colors.contentMuted,
                  fontFamily: fontFamilies.body,
                  fontSize: 15,
                  textAlign: "center",
                }}
              >
                Create your first echo to start writing to your future self.
              </Text>
            </AppCard>
          }
          ListFooterComponent={
            <HomeListFooter
              hasMore={hasMore}
              isLoading={isLoadingMore}
              error={footerError}
              onRetry={() => loadEchoes("more")}
            />
          }
        />
      )}
    </View>
  );
};

function HomeListHeader({
  count,
  onCreate,
  onTestNotification,
}: {
  count: number;
  onCreate: () => void;
  onTestNotification: () => Promise<unknown>;
}) {
  return (
    <View style={{ gap: spacing.lg, paddingBottom: spacing.xs }}>
      <AppButton label="Create New Echo" onPress={onCreate} />
      {__DEV__ && (
        <AppButton
          label="Send Test Notification"
          variant="quiet"
          onPress={onTestNotification}
        />
      )}
      <SectionHeading>{`Your Echoes (${count})`}</SectionHeading>
    </View>
  );
}

function HomeListFooter({
  hasMore,
  isLoading,
  error,
  onRetry,
}: {
  hasMore: boolean;
  isLoading: boolean;
  error: string | null;
  onRetry: () => void;
}) {
  if (isLoading) {
    return (
      <Text
        accessibilityLiveRegion="polite"
        style={{
          padding: spacing.xl,
          color: colors.contentMuted,
          fontFamily: fontFamilies.bodySemibold,
          textAlign: "center",
        }}
      >
        Loading more echoes…
      </Text>
    );
  }

  if (error) {
    return (
      <View style={{ paddingTop: spacing.lg, gap: spacing.md }}>
        <Text
          accessibilityLiveRegion="polite"
          selectable
          style={{
            color: colors.danger,
            fontFamily: fontFamilies.bodySemibold,
            textAlign: "center",
          }}
        >
          {error}
        </Text>
        <AppButton label="Retry Loading More" variant="quiet" onPress={onRetry} />
      </View>
    );
  }

  if (!hasMore) {
    return (
      <Text
        style={{
          padding: spacing.xl,
          color: colors.contentMuted,
          fontFamily: fontFamilies.body,
          textAlign: "center",
        }}
      >
        You’re all caught up.
      </Text>
    );
  }

  return null;
}
