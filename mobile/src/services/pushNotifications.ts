import React from "react";
import * as Notifications from "expo-notifications";
import * as Device from "expo-device";
import { Platform } from "react-native";
import { apiService } from "./api";
import { authService } from "./authService";

export interface PushNotificationData {
  echoId?: string;
  type?: string;
  partsCount?: string;
  timestamp?: string;
}

class PushNotificationService {
  private expoPushToken: string | null = null;
  private isExpoGo: boolean = false;

  constructor() {
    // Определяем режим Expo Go
    this.isExpoGo = __DEV__ && !Device.isDevice;
    console.log(
      "PushNotificationService initialized, isExpoGo:",
      this.isExpoGo,
    );
  }

  // Инициализация push-уведомлений
  async initialize(): Promise<string | null> {
    try {
      console.log("Initializing push notifications...");

      // Запрашиваем разрешения
      const { status: existingStatus } =
        await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== "granted") {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== "granted") {
        console.log("Failed to get push token for push notification!");
        return null;
      }

      // Настраиваем обработчики уведомлений
      Notifications.setNotificationHandler({
        handleNotification: async () => ({
          shouldPlaySound: true,
          shouldSetBadge: false,
          shouldShowBanner: true,
          shouldShowList: true,
        }),
      });

      // Получаем device push token для FCM
      if (Device.isDevice) {
        console.log("Getting device push token for FCM...");
        console.log("EXPO_PROJECT_ID:", process.env.EXPO_PROJECT_ID);

        const token = await Notifications.getDevicePushTokenAsync();
        this.expoPushToken = token.data;
        console.log("Device push token:", this.expoPushToken);
        return this.expoPushToken;
      } else {
        console.log("Must use physical device for Push Notifications");
        return null;
      }
    } catch (error) {
      console.error("Error initializing push notifications:", error);
      return null;
    }
  }

  // Регистрация FCM токена на сервере
  async registerToken(userId: string): Promise<boolean> {
    try {
      if (!this.expoPushToken) {
        console.log("No push token available");
        return false;
      }

      const deviceType = Platform.OS === "ios" ? "ios" : "android";
      const deviceId = Device.deviceName || "unknown";

      const response = await apiService.registerPushToken({
        fcmToken: this.expoPushToken,
        deviceId: deviceId,
        deviceType: deviceType,
      });

      if (response.success) {
        console.log("Push token registered successfully");
        return true;
      } else {
        console.error("Failed to register push token:", response.error);
        return false;
      }
    } catch (error) {
      console.error("Error registering push token:", error);
      return false;
    }
  }

  // Настройка обработчиков уведомлений
  setupNotificationHandlers(
    navigation: any,
    pendingNotificationRef?: React.MutableRefObject<PushNotificationData | null>,
  ) {
    // Обработчик получения уведомления когда приложение открыто
    const notificationListener = Notifications.addNotificationReceivedListener(
      (notification) => {
        console.log("📨 Notification received (app open):", notification);
        console.log("📱 Notification data:", notification.request.content.data);
      },
    );

    // Обработчик нажатия на уведомление
    const responseListener =
      Notifications.addNotificationResponseReceivedListener(
        async (response) => {
          console.log("🔔 Notification response received:", response);
          console.log(
            "📱 Response notification data:",
            response.notification.request.content.data,
          );

          const data = response.notification.request.content
            .data as PushNotificationData;

          console.log("📋 Parsed notification data:", data);

          // Если это уведомление об эхо, переходим к деталям
          if (data.echoId && data.type === "echo_reminder") {
            console.log("🎯 Navigating to echo details:", data.echoId);

            // Проверяем аутентификацию перед навигацией
            try {
              const token = await authService.getToken();
              console.log("🔑 Auth token available:", !!token);

              if (!token) {
                console.log(
                  "❌ No auth token available, storing notification data",
                );
                // Сохраняем данные уведомления для обработки после авторизации
                if (pendingNotificationRef) {
                  pendingNotificationRef.current = data;
                  console.log(
                    "💾 Stored notification data in pendingNotificationRef",
                  );
                } else {
                  console.log("❌ No pendingNotificationRef available");
                }
                return;
              }
            } catch (error) {
              console.log("❌ Auth error:", error);
              // Сохраняем данные уведомления для обработки после авторизации
              if (pendingNotificationRef) {
                pendingNotificationRef.current = data;
                console.log(
                  "💾 Stored notification data in pendingNotificationRef after auth error",
                );
              } else {
                console.log(
                  "❌ No pendingNotificationRef available after auth error",
                );
              }
              return;
            }

            // Переходим к EchoDetail с ID эхо
            if (navigation && navigation.navigate) {
              console.log("🚀 Calling navigation.navigate with:", {
                echoId: data.echoId,
                fromNotification: true,
              });
              try {
                navigation.navigate("EchoDetail", {
                  echoId: data.echoId,
                  fromNotification: true,
                });
                console.log("✅ Navigation successful from notification");
              } catch (error) {
                console.error("❌ Navigation failed from notification:", error);
              }
            } else {
              console.log("❌ Navigation not available");
            }
          } else {
            console.log(
              "❌ Not an echo reminder notification or missing data:",
              {
                echoId: data.echoId,
                type: data.type,
              },
            );
          }
        },
      );

    return () => {
      notificationListener.remove();
      responseListener.remove();
    };
  }

  // Отправка локального уведомления для тестирования
  async sendDemoNotification(echoId: string, message: string) {
    try {
      console.log("Sending demo notification...");

      // Запрашиваем разрешения если нужно
      const { status: existingStatus } =
        await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== "granted") {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== "granted") {
        console.log("Permission not granted for notifications");
        return false;
      }

      // Отправляем локальное уведомление
      await Notifications.scheduleNotificationAsync({
        content: {
          title: "Echo Reminder",
          body: message,
          data: {
            echoId: echoId,
            type: "echo_reminder",
            timestamp: new Date().toISOString(),
          },
          sound: true,
          priority: Notifications.AndroidNotificationPriority.HIGH,
        },
        trigger: null, // Отправляем сразу
      });

      console.log("Demo notification sent successfully");
      return true;
    } catch (error) {
      console.error("Error sending demo notification:", error);
      return false;
    }
  }

  // Отправка локального уведомления
  async sendLocalNotification(title: string, body: string, data?: any) {
    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: title,
          body: body,
          data: data,
          sound: true,
          priority: Notifications.AndroidNotificationPriority.HIGH,
        },
        trigger: null,
      });
      return true;
    } catch (error) {
      console.error("Error sending local notification:", error);
      return false;
    }
  }

  // Получение текущего токена
  getToken(): string | null {
    return this.expoPushToken;
  }

  // Очистка токена
  clearToken() {
    this.expoPushToken = null;
  }

  // Проверка режима Expo Go
  isExpoGoMode(): boolean {
    return false; // Теперь всегда используем Expo Notifications
  }
}

export const pushNotificationService = new PushNotificationService();
