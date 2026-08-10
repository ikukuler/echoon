import React, { useRef } from "react";
import * as Notifications from "expo-notifications";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { AuthProvider, useAuth } from "./src/hooks/useAuth";
import { HomeScreen } from "./src/screens/HomeScreen";
import { LoginScreen } from "./src/screens/LoginScreen";
import { CreateEchoScreen } from "./src/screens/CreateEchoScreen";
import { EchoDetailScreen } from "./src/screens/EchoDetailScreen";
import { UserSettingsScreen } from "./src/screens/UserSettingsScreen";
import { LoadingSpinner } from "./src/components/LoadingSpinner";
import { useFonts } from "./src/hooks/useFonts";
import {
  PushNotificationData,
  pushNotificationService,
} from "./src/services/pushNotifications";

// Временно отключаем NativeWind для проверки
import "./global.css";

// Наши компоненты
import { RootStackParamList } from "./src/types";

const Stack = createNativeStackNavigator<RootStackParamList>();

// Главный навигатор приложения
const AppNavigator: React.FC = () => {
  const { user, isLoading } = useAuth();
  const navigationRef = useRef<any>(null);
  const fontsLoaded = useFonts();
  const [navigationReady, setNavigationReady] = React.useState(false);

  // Ref для хранения данных уведомления до авторизации
  const pendingNotificationRef = useRef<PushNotificationData | null>(null);

  // Настраиваем обработчики push-уведомлений
  React.useEffect(() => {
    if (navigationRef.current && navigationReady) {
      const cleanup = pushNotificationService.setupNotificationHandlers(
        navigationRef.current,
        pendingNotificationRef,
      );

      // 2. Обрабатываем пуш при холодном старте
      const checkInitialNotification = async () => {
        const lastResponse =
          await Notifications.getLastNotificationResponseAsync();

        if (lastResponse?.notification?.request?.content?.data) {
          const data = lastResponse.notification.request.content
            .data as PushNotificationData;

          console.log("📦 Cold start notification data:", data);

          if (data.echoId && data.type === "echo_reminder") {
            // Если пользователь не авторизован, сохраняем данные
            if (!user) {
              console.log(
                "📦 User not authenticated, storing notification data",
              );
              pendingNotificationRef.current = data;
              return;
            }

            // Если пользователь авторизован, сразу навигируем
            navigationRef.current.navigate("EchoDetail", {
              echoId: data.echoId,
              fromNotification: true,
            });
          }
        }
      };

      checkInitialNotification();
      return cleanup;
    }
  }, [user, navigationReady]);

  // Обрабатываем отложенное уведомление после авторизации
  React.useEffect(() => {
    console.log("🔍 Checking pending notification:", {
      user: !!user,
      navigationRef: !!navigationRef.current,
      navigationReady,
      pendingNotification: !!pendingNotificationRef.current,
    });

    if (
      user &&
      navigationRef.current &&
      navigationReady &&
      pendingNotificationRef.current
    ) {
      const pendingData = pendingNotificationRef.current;
      console.log(
        "📦 Processing pending notification after login:",
        pendingData,
      );

      if (pendingData.echoId && pendingData.type === "echo_reminder") {
        console.log("🚀 Attempting to navigate to EchoDetail with:", {
          echoId: pendingData.echoId,
          fromNotification: true,
        });

        // Добавляем небольшую задержку для обеспечения готовности экрана
        setTimeout(() => {
          try {
            navigationRef.current.navigate("EchoDetail", {
              echoId: pendingData.echoId,
              fromNotification: true,
            });
            console.log("✅ Navigation successful");
          } catch (error) {
            console.error("❌ Navigation failed:", error);
          }
        }, 100);
      }

      // Очищаем отложенные данные
      pendingNotificationRef.current = null;
    }
  }, [user, navigationReady]);

  if (isLoading || !fontsLoaded) {
    return <LoadingSpinner />;
  }

  return (
    <NavigationContainer
      ref={navigationRef}
      onReady={() => setNavigationReady(true)}
    >
      <StatusBar style="auto" />
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
        }}
      >
        {user ? (
          <>
            <Stack.Screen name="Home" component={HomeScreen} />
            <Stack.Screen name="CreateEcho" component={CreateEchoScreen} />
            <Stack.Screen name="EchoDetail" component={EchoDetailScreen} />
            <Stack.Screen name="UserSettings" component={UserSettingsScreen} />
          </>
        ) : (
          <Stack.Screen name="Login" component={LoginScreen} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};

// Главный компонент приложения
const App: React.FC = () => {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <AppNavigator />
      </AuthProvider>
    </SafeAreaProvider>
  );
};

export default App;
