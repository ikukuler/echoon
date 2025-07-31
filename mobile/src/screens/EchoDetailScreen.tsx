import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  Dimensions,
  Alert,
  Modal,
  StatusBar,
  Linking,
} from "react-native";
import { useAuth } from "../hooks/useAuth";
import { Echo, EchoPart } from "../types";
import { formatDate, isFutureDate } from "../utils/dateUtils";
import { AudioPlayer } from "../components/AudioPlayer";
import { HugeiconsIcon } from "@hugeicons/react-native";
import { ArrowLeftIcon, Link01Icon } from "@hugeicons/core-free-icons";
import { apiService } from "../services/api";

interface EchoDetailScreenProps {
  navigation: any;
  route: {
    params: {
      echo?: Echo;
      echoId?: string;
      fromNotification?: boolean;
    };
  };
}

const { width: screenWidth } = Dimensions.get("window");

export const EchoDetailScreen: React.FC<EchoDetailScreenProps> = ({
  navigation,
  route,
}) => {
  console.log("EchoDetailScreen loaded with params:", route.params);

  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isImageModalVisible, setIsImageModalVisible] = useState(false);
  const [echo, setEcho] = useState<Echo | null>(route.params.echo || null);
  const [isLoading, setIsLoading] = useState(!route.params.echo);
  const { user } = useAuth();

  // Загружаем эхо по ID, если он передан
  React.useEffect(() => {
    if (route.params.echoId && !route.params.echo) {
      const loadEcho = async () => {
        try {
          setIsLoading(true);
          console.log("Loading echo with ID:", route.params.echoId);

          const response = await apiService.getEcho(route.params.echoId!);
          if (response.success && response.data) {
            setEcho(response.data);
          } else {
            console.error("Failed to load echo:", response.error);
          }
        } catch (error) {
          console.error("Error loading echo:", error);
        } finally {
          setIsLoading(false);
        }
      };
      loadEcho();
    }
  }, [route.params.echoId]);

  // Проверяем, что params существуют
  if (!route.params || (!route.params.echo && !route.params.echoId)) {
    console.error("No echo data or ID provided to EchoDetailScreen");
    return (
      <View className="flex-1 bg-background">
        <View className="bg-header px-5 pt-16 pb-5 shadow-sm">
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            className="py-2 px-3 rounded-lg bg-echo self-start mb-4"
          >
            <Text className="text-textDark text-base font-medium">
              <HugeiconsIcon
                icon={ArrowLeftIcon}
                size={24}
                color="black"
                strokeWidth={1.5}
              />
            </Text>
          </TouchableOpacity>
        </View>
        <View className="flex-1 justify-center items-center">
          <Text className="text-accentSecondary">No echo data found</Text>
        </View>
      </View>
    );
  }

  if (isLoading) {
    return (
      <View className="flex-1 bg-background justify-center items-center">
        <Text className="text-accentSecondary">Loading echo...</Text>
      </View>
    );
  }

  if (!echo) {
    return (
      <View className="flex-1 bg-background">
        <View className="bg-header px-5 pt-16 pb-5 shadow-sm">
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            className="py-2 px-3 rounded-lg bg-echo self-start mb-4"
          >
            <Text className="text-textDark text-base font-medium">
              <HugeiconsIcon
                icon={ArrowLeftIcon}
                size={24}
                color="black"
                strokeWidth={1.5}
              />
            </Text>
          </TouchableOpacity>
        </View>
        <View className="flex-1 justify-center items-center">
          <Text className="text-accentSecondary">Echo not found</Text>
        </View>
      </View>
    );
  }

  const openImageModal = (imageUrl: string) => {
    setSelectedImage(imageUrl);
    setIsImageModalVisible(true);
  };

  const closeImageModal = () => {
    setIsImageModalVisible(false);
    setSelectedImage(null);
  };

  const handleLinkPress = async (url: string) => {
    const supported = await Linking.canOpenURL(url);
    if (supported) {
      await Linking.openURL(url);
    } else {
      Alert.alert(`Could not open link: ${url}`);
    }
  };

  const renderPart = (part: EchoPart, index: number) => {
    switch (part.type) {
      case "text":
        return (
          <View key={part.id} className="bg-card rounded-xl p-5 shadow-sm">
            <Text className="text-2xl leading-8 text-textDark font-playfair-bold">
              {part.content}
            </Text>
          </View>
        );

      case "image":
        return (
          <TouchableOpacity
            key={part.id}
            className="bg-card rounded-xl p-2 shadow-sm relative"
            onPress={() => openImageModal(part.content)}
            activeOpacity={0.9}
          >
            <Image
              source={{ uri: part.content }}
              className="w-full rounded-lg"
              style={{ height: (screenWidth - 56) * 0.75 }}
              resizeMode="contain"
              onError={() => {
                console.log(`Failed to load image: ${part.content}`);
              }}
            />
            <View className="absolute bottom-2 right-2 bg-black/70 px-2 py-1 rounded-xl">
              <Text className="text-white text-xs font-medium">
                Tap to view full size
              </Text>
            </View>
          </TouchableOpacity>
        );

      case "audio":
        return (
          <View key={part.id} className="bg-card rounded-xl p-4 shadow-sm">
            <AudioPlayer audioUri={part.content} fileName="Audio Recording" />
          </View>
        );

      case "link":
        return (
          <TouchableOpacity
            key={part.id}
            className="bg-card rounded-xl p-5 flex-row items-center shadow-sm"
            onPress={() => handleLinkPress(part.content)}
            activeOpacity={0.8}
          >
            <Text className="text-2xl mr-3">
              <HugeiconsIcon
                icon={Link01Icon}
                size={24}
                strokeWidth={1.5}
                className="mr-2"
              />
            </Text>
            <Text className="text-base text-blue-500 flex-1">
              {part.content}
            </Text>
          </TouchableOpacity>
        );

      default:
        return null;
    }
  };

  return (
    <View className="flex-1 bg-background">
      {/* Header */}
      <View className="bg-header px-5 pt-16 pb-5 shadow-sm flex-row justify-between items-center">
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          className="py-2 px-3 rounded-lg bg-echo self-start mb-4"
        >
          <Text className="text-textDark text-base font-medium">
            <HugeiconsIcon
              icon={ArrowLeftIcon}
              size={24}
              color="black"
              strokeWidth={1.5}
            />
          </Text>
        </TouchableOpacity>

        <View className="flex-row justify-between items-center">
          <Text className="text-4xl text-textDark font-playfair-bold">
            Echo Details
          </Text>
        </View>
        <View
          className={`px-3 py-1.5 rounded-2xl ${
            isFutureDate(echo.return_at) ? "bg-echo" : "bg-accentSecondary"
          }`}
        >
          <Text
            className={`text-sm font-semibold ${
              isFutureDate(echo.return_at) ? "text-textDark" : "text-white"
            }`}
          >
            {isFutureDate(echo.return_at) ? "Pending" : "Delivered"}
          </Text>
        </View>
      </View>

      {/* Content */}
      <ScrollView className="flex-1" contentContainerStyle={{ padding: 20 }}>
        {/* Date Info */}
        <View className="bg-card rounded-xl p-4 mb-5 shadow-sm ">
          <Text className="text-sm text-accentSecondary mb-1">
            Will arrive:
          </Text>
          <Text className="text-lg font-semibold text-textDark">
            {formatDate(echo.return_at)}
          </Text>
        </View>

        {/* Echo Parts */}
        <View className="space-y-4 bg-card">
          {echo.parts?.map((part, index) => renderPart(part, index))}
        </View>

        {/* Created Date */}
        <View className="mt-5 pt-5 ">
          <Text className="text-sm text-accentSecondary text-center">
            Created: {formatDate(echo.created_at)}
          </Text>
        </View>
      </ScrollView>

      {/* Full Screen Image Modal */}
      <Modal
        visible={isImageModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={closeImageModal}
      >
        <StatusBar hidden={true} />
        <View className="flex-1 bg-black/90 justify-center items-center">
          <TouchableOpacity
            className="absolute top-12 right-5 w-10 h-10 rounded-full bg-white/20 justify-center items-center z-10"
            onPress={closeImageModal}
            activeOpacity={0.8}
          >
            <Text className="text-white text-xl font-bold">✕</Text>
          </TouchableOpacity>

          {selectedImage && (
            <Image
              source={{ uri: selectedImage }}
              className="w-full"
              style={{ height: screenWidth * 1.5 }}
              resizeMode="contain"
              onError={() => {
                console.log(`Failed to load modal image: ${selectedImage}`);
              }}
            />
          )}
        </View>
      </Modal>
    </View>
  );
};
