import React, { useRef } from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { StatusBar } from "expo-status-bar";
import { AuthProvider, useAuth } from "./src/hooks/useAuth";
import { HomeScreen } from "./src/screens/HomeScreen";
import { LoginScreen } from "./src/screens/LoginScreen";
import { CreateEchoScreen } from "./src/screens/CreateEchoScreen";
import { EchoDetailScreen } from "./src/screens/EchoDetailScreen";
import { UserSettingsScreen } from "./src/screens/UserSettingsScreen";
import { LoadingSpinner } from "./src/components/LoadingSpinner";
import { useFonts } from "./src/hooks/useFonts";
import { pushNotificationService } from "./src/services/pushNotifications";

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

  // Настраиваем обработчики push-уведомлений
  React.useEffect(() => {
    if (user && navigationRef.current) {
      const cleanup = pushNotificationService.setupNotificationHandlers(
        navigationRef.current,
      );
      return cleanup;
    }
  }, [user]);

  if (isLoading || !fontsLoaded) {
    return <LoadingSpinner />;
  }

  return (
    <NavigationContainer ref={navigationRef}>
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
    <AuthProvider>
      <AppNavigator />
    </AuthProvider>
  );
};

export default App;
