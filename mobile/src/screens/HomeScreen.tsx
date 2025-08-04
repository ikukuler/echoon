import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Alert,
  Image,
  ActivityIndicator,
  Linking,
} from "react-native";
import { useAuth } from "../hooks/useAuth";
import { apiService } from "../services/api";
import { Echo } from "../types";
import { LoadingSpinner } from "../components/LoadingSpinner";
import { formatDate, isFutureDate } from "../utils/dateUtils";
import { AudioPlayer } from "../components/AudioPlayer";
import { pushNotificationService } from "../services/pushNotifications";
import {
  SchoolBell02FreeIcons,
  Settings02Icon,
  Link01Icon,
  CheckmarkCircle03Icon,
  Clock05Icon,
  ArrowLeft01Icon,
  ArrowRight01Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react-native";

interface HomeScreenProps {
  navigation: any;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({ navigation }) => {
  const { user } = useAuth();

  const [echoes, setEchoes] = useState<Echo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [loadingImages, setLoadingImages] = useState<Set<string>>(new Set());

  // Load more state
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const limit = 10; // Количество эхов на страницу

  // Функция для проверки, есть ли у эхо изображения
  const hasImageAttachment = (echo: Echo): boolean => {
    return echo.parts?.some((part) => part.type === "image") || false;
  };

  // Функция для получения первого изображения эхо
  const getFirstImage = (echo: Echo): string | null => {
    const imagePart = echo.parts?.find((part) => part.type === "image");
    return imagePart?.content || null;
  };

  // Функция для получения текстового контента эхо
  const getTextContent = (echo: Echo): string => {
    const textPart = echo.parts?.find((part) => part.type === "text");
    return textPart?.content || "";
  };

  const loadEchoes = useCallback(
    async (isRefresh = false) => {
      try {
        console.log("Loading echoes...", { isRefresh });
        if (isRefresh) {
          setIsRefreshing(true);
          setEchoes([]); // Очищаем список при обновлении
        } else if (echoes.length === 0) {
          setIsLoading(true);
        } else {
          setIsLoadingMore(true);
        }

        const offset = isRefresh ? 0 : echoes.length;
        console.log("API call params:", { offset, limit });
        const response = await apiService.getUserEchoes(offset, limit);

        if (response.success && response.data) {
          const newEchoes = response.data.echoes || [];
          const pagination = response.data.pagination;

          console.log(
            "Loaded echoes:",
            newEchoes.length,
            "Total:",
            pagination?.total,
          );
          console.log("Pagination info:", pagination);

          if (isRefresh) {
            setEchoes(newEchoes);
          } else {
            setEchoes((prev) => [...prev, ...newEchoes]);
          }

          // Проверяем, есть ли еще данные для загрузки
          setHasMore(offset + limit < (pagination?.total || 0));
        } else {
          console.error("API response error:", response.error);
          Alert.alert("Error", response.error || "Failed to load echoes");
        }
      } catch (error) {
        console.error("Error loading echoes:", error);
        Alert.alert("Error", "Failed to load echoes");
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
        setIsLoadingMore(false);
      }
    },
    [echoes.length],
  );

  // Функция для загрузки следующей страницы
  const handleLoadMore = useCallback(() => {
    if (hasMore && !isLoadingMore && !isRefreshing) {
      console.log("Loading more echoes...");
      loadEchoes(false);
    }
  }, [hasMore, isLoadingMore, isRefreshing, loadEchoes]);

  useEffect(() => {
    loadEchoes(true); // Загружаем первую страницу при монтировании
  }, []);

  if (isLoading) {
    return <LoadingSpinner text="Loading your echoes..." />;
  }

  return (
    <View className="flex-1 bg-background">
      {/* Header */}
      <View className="bg-header px-5 pt-16 pb-5 shadow-sm ">
        <View className="flex-row justify-between items-center">
          <View>
            <Text className="text-3xl text-textDark font-playfair-bold">
              {user?.name || user?.email}
            </Text>
          </View>
          <TouchableOpacity
            onPress={() => navigation.navigate("UserSettings")}
            className="py-2 px-3 rounded-lg bg-echo"
          >
            <Text className="text-textDark font-medium">
              <HugeiconsIcon
                icon={Settings02Icon}
                size={24}
                color="black"
                strokeWidth={1.5}
              />
            </Text>
          </TouchableOpacity>
        </View>

        {/* Refresh Button */}
        {/* <TouchableOpacity
          onPress={() => loadEchoes(true)}
          className="mt-3 py-2 px-4 rounded-lg bg-echo self-end"
          disabled={isRefreshing}
        >
          <Text className="text-textDark font-medium">
            {isRefreshing ? "Refreshing..." : "Refresh"}
          </Text>
        </TouchableOpacity> */}
      </View>

      {/* Content */}
      <ScrollView
        className="flex-1"
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={() => loadEchoes(true)}
          />
        }
      >
        <View className="p-5">
          {/* Create Button */}
          <TouchableOpacity
            className="bg-primary py-6 px-6 rounded-xl mb-6 shadow-sm"
            onPress={() => navigation.navigate("CreateEcho")}
          >
            <Text className="text-white font-bold font-inter-bold text-xl text-center">
              + Create New Echo
            </Text>
          </TouchableOpacity>

          {/* Test Notification Button */}
          {
            // <TouchableOpacity
            //   className="bg-accentSecondary py-3 px-6 rounded-xl mb-8 shadow-sm"
            //   onPress={async () => {
            //     await pushNotificationService.sendDemoNotification(
            //       "demo-echo-id",
            //       "This is a demo echo reminder! 🎉",
            //     );
            //   }}
            // >
            //   <Text className="text-white text-base font-bold text-center">
            //     <HugeiconsIcon
            //       icon={SchoolBell02FreeIcons}
            //       size={24}
            //       color="white"
            //       strokeWidth={1.5}
            //     />{" "}
            //     Test Push Notification
            //   </Text>
            // </TouchableOpacity>
          }

          {/* Force Register Token Button */}
          {/* <TouchableOpacity
            className="bg-primary py-3 px-6 rounded-xl mb-8 shadow-sm"
            onPress={async () => {
              try {
                console.log("🔄 Force registering push token...");
                const token = await pushNotificationService.initialize();
                if (token && user?.id) {
                  const result = await pushNotificationService.registerToken(
                    user.id,
                  );
                  console.log("🔄 Force registration result:", result);
                  Alert.alert(
                    "Token Registration",
                    result ? "Success!" : "Failed!",
                  );
                } else {
                  Alert.alert("Token Registration", "No token or user ID!");
                }
              } catch (error) {
                console.error("Force registration error:", error);
                Alert.alert("Error", "Registration failed!");
              }
            }}
          >
            <Text className="text-white text-base font-bold text-center">
              🔄 Force Register Token
            </Text>
          </TouchableOpacity> */}

          {/* Echoes List */}
          <View>
            <Text className="text-3xl text-textDark mb-4 font-playfair-bold">
              Your Echoes ({echoes.length})
            </Text>

            {echoes.length === 0 ? (
              <View className="bg-card rounded-xl p-8 items-center shadow-sm border ">
                <Text className="text-xl text-textDark mb-2 font-playfair-bold">
                  No echoes yet
                </Text>
                <Text className="text-accentSecondary text-center font-inter-bold font-bold">
                  Create your first echo to get started!
                </Text>
              </View>
            ) : (
              echoes.map((echo) => {
                const hasImage = hasImageAttachment(echo);
                const imageUrl = getFirstImage(echo);
                const textContent = getTextContent(echo);

                return (
                  <TouchableOpacity
                    key={echo.id}
                    className={`rounded-xl mb-8 shadow-sm overflow-hidden ${
                      hasImage ? "h-48" : "bg-card p-4"
                    }`}
                    onPress={() => {
                      console.log(
                        "Navigating to EchoDetail with echo:",
                        echo.id,
                      );
                      try {
                        navigation.navigate("EchoDetail", { echoId: echo.id });
                      } catch (error) {
                        console.error("Navigation error:", error);
                        Alert.alert("Error", "Failed to open echo details");
                      }
                    }}
                    activeOpacity={0.7}
                  >
                    {hasImage && imageUrl ? (
                      // Blog card стиль для эхо с изображениями
                      <View className="relative h-full">
                        {/* Фоновое изображение */}
                        {loadingImages.has(imageUrl) && (
                          <View className="absolute inset-0 justify-center items-center bg-white/80 z-10">
                            <ActivityIndicator size="small" color="#0ea5e9" />
                            <Text className="text-accentSecondary text-xs mt-2 font-inter-bold">
                              Loading...
                            </Text>
                          </View>
                        )}
                        <Image
                          source={{ uri: imageUrl }}
                          className="w-full h-full"
                          resizeMode="cover"
                          onLoadStart={() => {
                            setLoadingImages((prev) =>
                              new Set(prev).add(imageUrl),
                            );
                          }}
                          onLoad={() => {
                            setLoadingImages((prev) => {
                              const newSet = new Set(prev);
                              newSet.delete(imageUrl);
                              return newSet;
                            });
                          }}
                          onError={() => {
                            console.log(`Failed to load image: ${imageUrl}`);
                            setLoadingImages((prev) => {
                              const newSet = new Set(prev);
                              newSet.delete(imageUrl);
                              return newSet;
                            });
                          }}
                        />

                        {/* Темный прозрачный оверлей */}
                        <View className="absolute inset-0 bg-black/40" />

                        {/* Контент поверх изображения */}
                        <View className="absolute inset-0 p-4 flex-col justify-between">
                          {/* Верхняя часть с датой и статусом */}
                          <View className="flex-row justify-between items-center">
                            <Text className="text-white/90 text-sm font-inter-bold">
                              Will arrive: {formatDate(echo.return_at)}
                            </Text>
                            <View
                              className={`px-3 py-1 rounded-full ${
                                isFutureDate(echo.return_at)
                                  ? "bg-white/20"
                                  : "bg-accentSecondary/80"
                              }`}
                            >
                              <Text
                                className={`text-xs font-semibold ${
                                  isFutureDate(echo.return_at)
                                    ? "text-white"
                                    : "text-white"
                                }`}
                              >
                                {isFutureDate(echo.return_at) ? (
                                  <HugeiconsIcon
                                    icon={Clock05Icon}
                                    size={24}
                                    color="white"
                                    strokeWidth={1.5}
                                  />
                                ) : (
                                  <HugeiconsIcon
                                    icon={CheckmarkCircle03Icon}
                                    size={24}
                                    color="white"
                                    strokeWidth={1.5}
                                  />
                                )}
                              </Text>
                            </View>
                          </View>

                          {/* Нижняя часть с текстом и ссылками */}
                          <View>
                            {textContent && (
                              <Text
                                className="text-white text-xl font-playfair-bold mb-2"
                                numberOfLines={2}
                              >
                                {textContent}
                              </Text>
                            )}

                            {/* Ссылки */}
                            {echo.parts?.map((part) => (
                              <View key={part.id}>
                                {part.type === "link" && (
                                  <TouchableOpacity
                                    onPress={async (e) => {
                                      e.stopPropagation();
                                      try {
                                        const supported =
                                          await Linking.canOpenURL(
                                            part.content,
                                          );
                                        if (supported) {
                                          await Linking.openURL(part.content);
                                        } else {
                                          Alert.alert(
                                            "Error",
                                            "Cannot open this URL",
                                          );
                                        }
                                      } catch (error) {
                                        Alert.alert(
                                          "Error",
                                          "Failed to open link",
                                        );
                                      }
                                    }}
                                    activeOpacity={0.7}
                                  >
                                    <View className="bg-white/20 rounded-lg p-2 mb-1 flex-row items-center gap-2">
                                      <HugeiconsIcon
                                        icon={Link01Icon}
                                        size={24}
                                        color="white"
                                        strokeWidth={1.5}
                                      />
                                      <Text className="text-white text-sm">
                                        {part.content}
                                      </Text>
                                    </View>
                                  </TouchableOpacity>
                                )}
                              </View>
                            ))}

                            <Text className="text-white/70 text-xs mt-2 font-inter-bold">
                              Created: {formatDate(echo.created_at)}
                            </Text>
                          </View>
                        </View>
                      </View>
                    ) : (
                      // Обычная карточка для эхо без изображений
                      <View>
                        <View className="flex-row justify-between items-center mb-3">
                          <Text className="text-sm text-accentSecondary">
                            Will arrive: {formatDate(echo.return_at)}
                          </Text>
                          <View
                            className={`px-3 py-1 rounded-full ${
                              isFutureDate(echo.return_at)
                                ? "bg-echo"
                                : "bg-accentSecondary"
                            }`}
                          >
                            <Text
                              className={`text-xs font-semibold ${
                                isFutureDate(echo.return_at)
                                  ? "text-textDark"
                                  : "text-white"
                              }`}
                            >
                              {isFutureDate(echo.return_at) ? (
                                <HugeiconsIcon
                                  icon={Clock05Icon}
                                  size={24}
                                  color="white"
                                  strokeWidth={1.5}
                                />
                              ) : (
                                <HugeiconsIcon
                                  icon={CheckmarkCircle03Icon}
                                  size={24}
                                  color="white"
                                  strokeWidth={1.5}
                                />
                              )}
                            </Text>
                          </View>
                        </View>

                        {echo.parts?.map((part) => (
                          <View key={part.id} className="mb-2">
                            {part.type === "text" && (
                              <Text
                                className="text-textDark leading-1 text-xl font-playfair-bold"
                                numberOfLines={3}
                              >
                                {part.content}
                              </Text>
                            )}
                            {part.type === "audio" && (
                              <AudioPlayer audioUri={part.content} />
                            )}
                            {part.type === "link" && (
                              <TouchableOpacity
                                onPress={async () => {
                                  try {
                                    const supported = await Linking.canOpenURL(
                                      part.content,
                                    );
                                    if (supported) {
                                      await Linking.openURL(part.content);
                                    } else {
                                      Alert.alert(
                                        "Error",
                                        "Cannot open this URL",
                                      );
                                    }
                                  } catch (error) {
                                    Alert.alert("Error", "Failed to open link");
                                  }
                                }}
                                activeOpacity={0.7}
                              >
                                <View className="bg-echo rounded-lg p-3 flex-row items-center gap-2">
                                  <HugeiconsIcon
                                    icon={Link01Icon}
                                    size={24}
                                    color="white"
                                    strokeWidth={1.5}
                                  />
                                  <Text className="text-textDark">
                                    {part.content}
                                  </Text>
                                </View>
                              </TouchableOpacity>
                            )}
                          </View>
                        ))}

                        <Text className="text-xs text-accentSecondary mt-3 font-inter-bold">
                          Created: {formatDate(echo.created_at)}
                        </Text>
                      </View>
                    )}
                  </TouchableOpacity>
                );
              })
            )}

            {/* Load More Button */}
            {hasMore && (
              <View className="mt-8 mb-4">
                <TouchableOpacity
                  onPress={handleLoadMore}
                  disabled={isLoadingMore || isRefreshing}
                  className={`px-6 py-4 rounded-xl flex-row justify-center items-center gap-3 ${
                    isLoadingMore || isRefreshing
                      ? "bg-gray-300 opacity-50"
                      : "bg-echo shadow-sm"
                  }`}
                  activeOpacity={0.7}
                >
                  {isLoadingMore ? (
                    <>
                      <ActivityIndicator size="small" color="#0EA5E9" />
                      <Text className="text-accentSecondary text-base font-inter-bold">
                        Loading more echoes...
                      </Text>
                    </>
                  ) : (
                    <>
                      <Text className="text-black text-base font-inter-bold">
                        Load More Echoes
                      </Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>
      </ScrollView>
    </View>
  );
};
