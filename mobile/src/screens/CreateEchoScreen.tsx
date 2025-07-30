import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Modal,
  Image,
  Linking,
  Keyboard,
} from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import * as ImagePicker from "expo-image-picker";
import * as MediaLibrary from "expo-media-library";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useAuth } from "../hooks/useAuth";
import { apiService } from "../services/api";
import { CreateEchoRequest, EchoPart, LocalEchoPart } from "../types";
import { LoadingSpinner } from "../components/LoadingSpinner";
import { AudioRecorder } from "../components/AudioRecorder";
import {
  ArrowLeftIcon,
  DiceFaces03Icon,
  Image01Icon,
  Link01Icon,
  MusicNote03FreeIcons,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react-native";

interface CreateEchoScreenProps {
  navigation: any;
  route?: any;
}

export const CreateEchoScreen: React.FC<CreateEchoScreenProps> = ({
  navigation,
  route,
}) => {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [userSettings, setUserSettings] = useState<{
    enableDateSelection: boolean;
  }>({
    enableDateSelection: false,
  });

  // Form state
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [mainMessage, setMainMessage] = useState("");
  const [attachments, setAttachments] = useState<LocalEchoPart[]>([]);
  const [showAudioRecorder, setShowAudioRecorder] = useState(false);
  const [recordingAttachmentIndex, setRecordingAttachmentIndex] = useState<
    number | null
  >(null);
  const [imageLoadErrors, setImageLoadErrors] = useState<Set<number>>(
    new Set(),
  );

  // Ref для ScrollView
  const scrollViewRef = useRef<ScrollView>(null);

  // Функция прокрутки к вложению
  const scrollToAttachment = (index: number) => {
    setTimeout(() => {
      // Более точная прокрутка с учетом высоты заголовков и других элементов
      const baseOffset = 400; // Высота заголовка и других элементов
      const attachmentHeight = 350; // Примерная высота каждого вложения
      const targetY = baseOffset + index * attachmentHeight;

      scrollViewRef.current?.scrollTo({
        y: targetY,
        animated: true,
      });
    }, 200); // Увеличиваем задержку для полного обновления UI
  };

  // Функция прокрутки к полю ввода
  const scrollToInput = (inputType: "main" | "link", index?: number) => {
    setTimeout(() => {
      let targetY = 0;

      if (inputType === "main") {
        targetY = 150; // Прокручиваем выше, чтобы поле было видно над клавиатурой
      } else if (inputType === "link" && index !== undefined) {
        const baseOffset = 150; // Уменьшаем базовый отступ
        const attachmentHeight = 350;
        targetY = baseOffset + index * attachmentHeight + 50; // Меньший отступ для поля ввода
      }

      console.log(`Scrolling to input ${inputType}, targetY: ${targetY}`);

      scrollViewRef.current?.scrollTo({
        y: targetY,
        animated: true,
      });
    }, 500); // Увеличиваем задержку для появления клавиатуры
  };

  // Загружаем настройки пользователя
  useEffect(() => {
    loadUserSettings();
  }, []);

  // Логируем изменения настроек
  useEffect(() => {
    console.log("userSettings changed:", userSettings);
  }, [userSettings]);

  // Обработчики клавиатуры
  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener(
      "keyboardDidShow",
      (event) => {
        console.log("Keyboard shown, height:", event.endCoordinates.height);

        // Автоматически прокручиваем к активному полю ввода
        setTimeout(() => {
          scrollViewRef.current?.scrollTo({
            y: 100, // Прокручиваем выше для видимости полей
            animated: true,
          });
        }, 100);
      },
    );
    const keyboardDidHideListener = Keyboard.addListener(
      "keyboardDidHide",
      () => {
        console.log("Keyboard hidden");
      },
    );

    return () => {
      keyboardDidShowListener?.remove();
      keyboardDidHideListener?.remove();
    };
  }, []);

  const loadUserSettings = async () => {
    try {
      const savedSettings = await AsyncStorage.getItem("user_settings");
      console.log("Loaded user settings:", savedSettings);
      if (savedSettings) {
        const parsedSettings = JSON.parse(savedSettings);
        console.log("Parsed user settings:", parsedSettings);
        setUserSettings(parsedSettings);
      } else {
        console.log("No saved settings found, using defaults");
      }
    } catch (error) {
      console.error("Error loading user settings:", error);
    }
  };

  // Запрос разрешений для медиа
  const requestMediaPermissions = async () => {
    const { status } = await MediaLibrary.requestPermissionsAsync();
    if (status !== "granted") {
      Alert.alert(
        "Permission needed",
        "Please grant media library permissions to select files.",
      );
      return false;
    }
    return true;
  };

  const addAttachment = () => {
    const newIndex = attachments.length;
    setAttachments([
      ...attachments,
      {
        type: "image",
        content: "",
        localUri: "",
        fileName: "",
      },
    ]);

    // Прокручиваем к новому вложению
    scrollToAttachment(newIndex);
  };

  const pickImage = async (index: number) => {
    const hasPermission = await requestMediaPermissions();
    if (!hasPermission) return;

    try {
      console.log("Starting image picker for attachment index:", index);

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: false,
        quality: 0.8,
        allowsMultipleSelection: false,
      });

      console.log("Image picker result:", result);

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        console.log("Selected asset:", asset);

        // Проверяем, что URI существует
        if (!asset.uri) {
          console.error("Asset URI is missing:", asset);
          Alert.alert("Error", "Selected image has no URI");
          return;
        }

        // Обновляем все поля сразу
        const newAttachments = [...attachments];
        newAttachments[index] = {
          ...newAttachments[index],
          content: asset.uri,
          localUri: asset.uri,
          fileName: asset.fileName || `image_${Date.now()}.jpg`,
        };
        setAttachments(newAttachments);

        // Очищаем ошибку загрузки для этого индекса
        setImageLoadErrors((prev) => {
          const newSet = new Set(prev);
          newSet.delete(index);
          return newSet;
        });

        console.log("Updated attachments after image pick:", newAttachments);
        console.log("New attachment URI:", newAttachments[index].localUri);
      } else {
        console.log("Image picker was canceled or no assets selected");
      }
    } catch (error) {
      console.error("Error picking image:", error);
      Alert.alert("Error", "Failed to pick image. Please try again.");
    }
  };

  const startAudioRecording = (index: number) => {
    setRecordingAttachmentIndex(index);
    setShowAudioRecorder(true);
  };

  const handleAudioRecordingComplete = (uri: string, duration: number) => {
    if (recordingAttachmentIndex !== null) {
      const newAttachments = [...attachments];
      newAttachments[recordingAttachmentIndex] = {
        ...newAttachments[recordingAttachmentIndex],
        content: uri,
        localUri: uri,
        fileName: `audio_recording_${Date.now()}.m4a`,
        duration: duration,
      };
      setAttachments(newAttachments);
      console.log("Updated attachments after audio recording:", newAttachments);
    }
    setShowAudioRecorder(false);
    setRecordingAttachmentIndex(null);
  };

  const closeAudioRecorder = () => {
    setShowAudioRecorder(false);
    setRecordingAttachmentIndex(null);
  };

  const isValidUrl = (url: string): boolean => {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  };

  const openLink = async (url: string) => {
    try {
      // Проверяем, что URL валидный
      const supported = await Linking.canOpenURL(url);

      if (supported) {
        await Linking.openURL(url);
      } else {
        Alert.alert("Error", "Cannot open this URL");
      }
    } catch (error) {
      console.error("Error opening URL:", error);
      Alert.alert("Error", "Failed to open link");
    }
  };

  const removeAttachment = (index: number) => {
    setAttachments(attachments.filter((_, i) => i !== index));
  };

  const updateAttachment = (
    index: number,
    field: keyof LocalEchoPart,
    value: string | number,
  ) => {
    console.log(
      `Updating attachment ${index}, field: ${field}, value: ${value}`,
    );
    const newAttachments = [...attachments];
    newAttachments[index] = { ...newAttachments[index], [field]: value };
    setAttachments(newAttachments);
    console.log("Updated attachments:", newAttachments);
  };

  const addAttachmentType = (index: number, type: EchoPart["type"]) => {
    console.log(`Adding attachment of type ${type} for index ${index}`);

    // Если текущее вложение пустое, меняем его тип и сразу открываем соответствующий пикер
    if (!attachments[index].content && !attachments[index].localUri) {
      console.log(
        "Current attachment is empty, changing type and opening picker",
      );

      const newAttachments = [...attachments];
      newAttachments[index] = {
        type: type,
        content: "",
        localUri: "",
        fileName: "",
      };
      setAttachments(newAttachments);

      // Открываем соответствующий пикер
      if (type === "image") {
        pickImage(index);
      } else if (type === "audio") {
        startAudioRecording(index);
      }
      // Для link ничего не делаем, пользователь сам введет URL
    } else {
      // Если вложение уже заполнено, добавляем новое
      console.log("Current attachment has content, adding new attachment");

      const newAttachment: LocalEchoPart = {
        type: type,
        content: "",
        localUri: "",
        fileName: "",
      };

      const newIndex = attachments.length;
      setAttachments([...attachments, newAttachment]);
      console.log("Added new attachment:", newAttachment);

      // Прокручиваем к новому вложению
      scrollToAttachment(newIndex);
    }
  };

  const handleDateChange = (event: any, date?: Date) => {
    setShowDatePicker(false);
    if (date) {
      setSelectedDate(date);
    }
  };

  const handleTimeChange = (event: any, time?: Date) => {
    setShowTimePicker(false);
    if (time) {
      // Combine current date with new time
      const newDateTime = new Date(selectedDate);
      newDateTime.setHours(time.getHours());
      newDateTime.setMinutes(time.getMinutes());
      setSelectedDate(newDateTime);
    }
  };

  const handleCreateEcho = async () => {
    // Validation
    if (!mainMessage.trim()) {
      Alert.alert("Error", "Please write your main message");
      return;
    }

    // Check if date is in the future (only if user enabled date selection)
    if (userSettings.enableDateSelection && selectedDate <= new Date()) {
      Alert.alert("Error", "Return date must be in the future");
      return;
    }

    try {
      setIsLoading(true);

      // Upload files first
      const processedAttachments = await Promise.all(
        attachments
          .filter((attachment) => attachment.content.trim())
          .map(async (attachment, index) => {
            // If it's a local file (image or audio), upload it first
            if (
              attachment.localUri &&
              (attachment.type === "image" || attachment.type === "audio")
            ) {
              console.log(
                `Uploading ${attachment.type}: ${attachment.fileName}`,
              );

              const uploadResponse = await apiService.uploadFile(
                attachment.localUri,
                attachment.fileName || `file_${Date.now()}`,
                attachment.type === "image" ? "image/jpeg" : "audio/m4a",
              );

              if (uploadResponse.success && uploadResponse.data) {
                console.log(
                  `File uploaded successfully: ${uploadResponse.data.url}`,
                );
                return {
                  type: attachment.type,
                  content: uploadResponse.data.url, // Use the uploaded URL
                  order_index: index + 1,
                };
              } else {
                console.error(`Failed to upload file: ${uploadResponse.error}`);
                Alert.alert(
                  "Error",
                  `Failed to upload ${attachment.type}: ${uploadResponse.error}`,
                );
                throw new Error(`Upload failed for ${attachment.type}`);
              }
            } else {
              // For text, video, and link types, use content as is
              return {
                type: attachment.type,
                content: attachment.content.trim(),
                order_index: index + 1,
              };
            }
          }),
      );

      // Create parts array: main message first, then attachments
      const allParts = [
        { type: "text" as const, content: mainMessage.trim(), order_index: 0 },
        ...processedAttachments,
      ];

      const request: CreateEchoRequest = {
        // Если пользователь включил выбор даты, отправляем выбранную дату
        // Если нет - не отправляем return_at, и бэкенд сгенерирует случайную дату
        ...(userSettings.enableDateSelection && {
          return_at: selectedDate.toISOString(),
        }),
        parts: allParts,
      };

      const response = await apiService.createEcho(request);

      if (response.success) {
        // Reset form
        setSelectedDate(new Date());
        setMainMessage("");
        setAttachments([]);

        // Navigate back to Home screen
        navigation.goBack();

        // Show success message after navigation
        setTimeout(() => {
          Alert.alert(
            "Success!",
            "Your echo has been created and will be delivered at the specified time.",
          );
        }, 100);
      } else {
        Alert.alert("Error", response.error || "Failed to create echo");
      }
    } catch (error) {
      Alert.alert("Error", "Failed to create echo. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return <LoadingSpinner text="Creating your echo..." />;
  }

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-background"
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 20}
      style={{ flex: 1 }}
    >
      <ScrollView
        ref={scrollViewRef}
        className="flex-1"
        contentContainerStyle={{
          paddingHorizontal: 24,
          paddingVertical: 48,
          paddingBottom: 100, // Дополнительный отступ снизу для клавиатуры
        }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        onScrollBeginDrag={() => Keyboard.dismiss()}
      >
        {/* Header */}
        <View className="mb-8">
          <View className="flex-row items-center pt-4 mb-4">
            <TouchableOpacity
              onPress={() => navigation.goBack()}
              className="p-2 rounded-lg bg-echo"
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
            <View className="flex-1 items-center">
              <Text className="text-4xl text-textDark mb-2 font-playfair-bold">
                Create New Echo
              </Text>
              <Text className="text-lg text-textDark font-inter-bold ">
                Send a message to your future self
              </Text>
            </View>
          </View>
        </View>

        {/* Return Date & Time - показывается только если пользователь включил выбор даты */}
        {userSettings.enableDateSelection && (
          <View className="mb-8">
            <Text className="text-2xl text-textDark mb-2 font-playfair-bold">
              When should it arrive?
            </Text>
            <Text className="text-lg text-textDark mb-4 font-inter-bold ">
              Choose when you want to receive this message
            </Text>

            <View className="flex-row gap-3">
              <TouchableOpacity
                className="flex-1 bg-card rounded-lg p-4 border border-gray-300"
                onPress={() => setShowDatePicker(true)}
              >
                <Text className="text-base text-textDark mb-1 font-inter-bold ">
                  Date
                </Text>
                <Text className="text-xl text-textDark font-inter-bold ">
                  {selectedDate.toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "short",
                    day: "numeric",
                  })}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                className="flex-1 bg-card rounded-lg p-4 border border-gray-300"
                onPress={() => setShowTimePicker(true)}
              >
                <Text className="text-base text-textDark mb-1 font-inter-bold ">
                  Time
                </Text>
                <Text className="text-xl text-textDark font-inter-bold ">
                  {selectedDate.toLocaleTimeString("en-US", {
                    hour: "2-digit",
                    minute: "2-digit",
                    hour12: true,
                  })}
                </Text>
              </TouchableOpacity>
            </View>

            {showDatePicker && (
              <DateTimePicker
                value={selectedDate}
                mode="date"
                display="default"
                onChange={handleDateChange}
                minimumDate={new Date()}
              />
            )}
            {showTimePicker && (
              <DateTimePicker
                value={selectedDate}
                mode="time"
                display="default"
                onChange={handleTimeChange}
              />
            )}
          </View>
        )}

        {/* Информация о случайной дате если выбор даты отключен */}
        {!userSettings.enableDateSelection && (
          <View className="mb-8 p-4 bg-echo rounded-lg border border-sepiaGold">
            <Text className="text-lg text-textDark mb-2 font-playfair-bold">
              🎲 Random Delivery
            </Text>
            <Text className="text-textDark font-inter-bold ">
              Your echo will be delivered at a random time within the next year.
              You can enable date selection in Settings.
            </Text>
          </View>
        )}

        {/* Main Message */}
        <View className="mb-8">
          <Text className="text-2xl text-textDark mb-2 font-playfair-bold">
            Your Message
          </Text>
          <Text className="text-lg text-textDark mb-4 font-inter-bold">
            Write the main message you want to send to your future self
          </Text>

          <TextInput
            className="bg-card rounded-lg p-4 text-base shadow  min-h-[120px] text-textDark placeholder:text-accentSecondary"
            placeholder="Write your message here..."
            value={mainMessage}
            onChangeText={setMainMessage}
            multiline
            textAlignVertical="top"
            placeholderTextColor="#8AB6D6"
            onFocus={() => scrollToInput("main")}
          />
        </View>

        {/* Attachments */}
        <View className="mb-8">
          <View className="flex-row justify-between items-center mb-4">
            <Text className="text-2xl text-textDark font-playfair-bold">
              Attachments (Optional)
            </Text>
            <TouchableOpacity
              onPress={addAttachment}
              className="bg-primary rounded-lg px-4 py-2"
            >
              <Text className="text-white text-base font-medium">
                + Add Attachment
              </Text>
            </TouchableOpacity>
          </View>
          <Text className="text-lg text-textDark mb-4 font-inter-bold ">
            Add images, audio, or other files to your message
          </Text>

          {attachments.length === 0 && (
            <View className="bg-card rounded-lg p-6 border border-dashed border-gray-300">
              <Text className="text-base text-textDark mb-2 font-inter-bold ">
                No attachments yet
              </Text>
              <Text className="text-sm text-textDark font-inter-bold ">
                Tap "Add" to attach files
              </Text>
            </View>
          )}

          {attachments.map((attachment, index) => (
            <View
              key={index}
              className="bg-card rounded-lg p-4 border border-gray-300 mb-4"
            >
              <View className="flex-row justify-between items-center mb-4">
                <Text className="text-xl text-textDark font-inter-bold ">
                  Attachment {index + 1}
                </Text>
                <TouchableOpacity
                  onPress={() => removeAttachment(index)}
                  className="bg-red-200 rounded-md px-3 py-1"
                >
                  <Text className="text-red-700 text-sm font-medium">
                    Remove
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Attachment Type Selector */}
              <View className="flex-row flex-wrap gap-2 mb-4">
                <Text className="text-base text-textDark font-inter-bold mb-2">
                  Current:{" "}
                  {attachment.type.charAt(0).toUpperCase() +
                    attachment.type.slice(1)}
                </Text>
                <View className="flex-row flex-wrap gap-2">
                  {(["image", "audio", "link"] as const).map((type) => (
                    <TouchableOpacity
                      key={type}
                      onPress={() => addAttachmentType(index, type)}
                      className="bg-echo rounded-lg px-4 py-2"
                    >
                      <Text className="text-base font-medium text-gray-700">
                        {!attachments[index].content &&
                        !attachments[index].localUri
                          ? `Add ${
                              type.charAt(0).toUpperCase() + type.slice(1)
                            }`
                          : `+ Add ${
                              type.charAt(0).toUpperCase() + type.slice(1)
                            }`}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Content Input */}
              {attachment.type === "image" && (
                <View className="mt-4">
                  {attachment.localUri ? (
                    <View className="flex-col items-center mb-4">
                      {!imageLoadErrors.has(index) ? (
                        <Image
                          source={{ uri: attachment.localUri }}
                          className="w-32 h-24 rounded-lg mb-2"
                          resizeMode="cover"
                          onError={(error) => {
                            console.error(
                              "Image loading error for index",
                              index,
                              ":",
                              error,
                            );
                            setImageLoadErrors((prev) =>
                              new Set(prev).add(index),
                            );
                          }}
                          onLoad={() => {
                            console.log(
                              "Image loaded successfully for index",
                              index,
                              ":",
                              attachment.localUri,
                            );
                            setImageLoadErrors((prev) => {
                              const newSet = new Set(prev);
                              newSet.delete(index);
                              return newSet;
                            });
                          }}
                        />
                      ) : (
                        <View className="w-32 h-24 rounded-lg mb-2 bg-card justify-center items-center">
                          <Text className="text-2xl">
                            <HugeiconsIcon
                              icon={Image01Icon}
                              size={24}
                              color="black"
                              strokeWidth={1.5}
                            />
                          </Text>
                          <Text className="text-xs text-gray-500 mt-1">
                            Failed to load
                          </Text>
                        </View>
                      )}
                      <Text className="text-sm text-textDark text-center font-inter-bold ">
                        {attachment.fileName}
                      </Text>
                      <Text className="text-xs text-textDark mt-1 font-inter-bold ">
                        URI: {attachment.localUri.substring(0, 50)}...
                      </Text>
                      <Text className="text-xs text-textDark font-inter-bold ">
                        Content: {attachment.content.substring(0, 50)}...
                      </Text>
                    </View>
                  ) : (
                    <View className="flex-col items-center p-5 bg-card rounded-lg mb-4">
                      <Text className="text-base text-textDark font-inter-bold ">
                        No image selected
                      </Text>
                    </View>
                  )}
                  <TouchableOpacity
                    className="bg-primary rounded-lg px-6 py-3"
                    onPress={() => pickImage(index)}
                  >
                    <Text className="text-white text-base font-medium">
                      {attachment.localUri ? "Change Image" : "Pick Image"}
                    </Text>
                  </TouchableOpacity>
                </View>
              )}

              {attachment.type === "audio" && (
                <View className="mt-4">
                  {attachment.localUri ? (
                    <View className="flex-col items-center mb-4">
                      <Text className="text-4xl text-textDark mb-2">
                        <HugeiconsIcon
                          icon={MusicNote03FreeIcons}
                          size={24}
                          color="black"
                          strokeWidth={1.5}
                        />
                      </Text>
                      <Text className="text-sm text-textDark text-center font-inter-bold ">
                        {attachment.fileName}
                      </Text>
                    </View>
                  ) : (
                    <View className="flex-col items-center p-5 bg-card rounded-lg mb-4">
                      <Text className="text-base text-textDark font-inter-bold ">
                        No audio selected
                      </Text>
                    </View>
                  )}
                  <TouchableOpacity
                    className="bg-primary rounded-lg px-6 py-3"
                    onPress={() => startAudioRecording(index)}
                  >
                    <Text className="text-white text-base font-medium">
                      {attachment.localUri ? "Re-record Audio" : "Record Audio"}
                    </Text>
                  </TouchableOpacity>
                </View>
              )}

              {attachment.type === "link" && (
                <View>
                  <TextInput
                    className={`rounded-lg p-3 text-base border h-12 mb-3 ${
                      attachment.content
                        ? isValidUrl(attachment.content)
                          ? "bg-green-50 border-green-300"
                          : "bg-red-50 border-red-300"
                        : "bg-card border-gray-300"
                    }`}
                    placeholder="Link URL..."
                    value={attachment.content}
                    onChangeText={(text) =>
                      updateAttachment(index, "content", text)
                    }
                    autoCapitalize="none"
                    onFocus={() => scrollToInput("link", index)}
                  />
                  {attachment.content && (
                    <View className="flex-row gap-2">
                      <TouchableOpacity
                        className={`flex-1 rounded-lg px-4 py-3 ${
                          isValidUrl(attachment.content)
                            ? "bg-primary"
                            : "bg-echo"
                        }`}
                        onPress={() => openLink(attachment.content)}
                        disabled={!isValidUrl(attachment.content)}
                      >
                        <Text className="text-white text-center font-medium">
                          <HugeiconsIcon
                            icon={Link01Icon}
                            size={24}
                            color="white"
                            strokeWidth={1.5}
                          />{" "}
                          Open Link
                        </Text>
                      </TouchableOpacity>
                      {!isValidUrl(attachment.content) && (
                        <View className="flex-1 bg-red-100 rounded-lg px-4 py-3 justify-center">
                          <Text className="text-red-700 text-center text-sm">
                            Invalid URL
                          </Text>
                        </View>
                      )}
                    </View>
                  )}
                </View>
              )}
            </View>
          ))}
        </View>

        {/* Create Button */}
        <TouchableOpacity
          onPress={handleCreateEcho}
          className="bg-primary rounded-lg px-12 py-4 mt-6 shadow-lg shadow-primary/50"
          disabled={isLoading}
        >
          <Text className="text-white text-2xl text-center font-inter-bold ">
            {isLoading ? "Creating..." : "Create Echo"}
          </Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Audio Recorder Modal */}
      <AudioRecorder
        visible={showAudioRecorder}
        onClose={closeAudioRecorder}
        onRecordingComplete={handleAudioRecordingComplete}
      />
    </KeyboardAvoidingView>
  );
};
