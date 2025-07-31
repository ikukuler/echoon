import AsyncStorage from "@react-native-async-storage/async-storage";

// Firebase конфигурация для push уведомлений
// 🔍 Найти в: Firebase Console → Project Settings → General → Your apps → Web app
const firebaseConfig = {
  apiKey: "AIzaSyDah0gYtYxsy6Ed3EgxzPTTFPXJHda7s", // 🔑 Firebase Console → Project Settings → General → Web API Key
  authDomain: "echowall-48c39.firebaseapp.com", // 🌐 Должно быть .firebaseapp.com
  projectId: "echowall-48c39", // 📁 Firebase Console → Project Settings → General → Project ID
  storageBucket: "echowall-48c39.appspot.com", // 🗄️ Должно быть .appspot.com
  messagingSenderId: "454728686751", // 📱 Firebase Console → Project Settings → Cloud Messaging → Sender ID
  appId: "1:454728686751:android:e73b04a605768e4b6116aa", // 📲 Firebase Console → Project Settings → General → App ID
};

// Инициализация Firebase (только для push уведомлений)
// Пока что оставляем пустым, так как авторизация теперь через JWT
console.log("Firebase configured for push notifications only");

// Mock функция для получения токена (будет заменена на реальную FCM)
export const getFCMToken = async (): Promise<string | null> => {
  try {
    console.log("Getting FCM token...");
    // TODO: Реальная интеграция с FCM
    return "mock-fcm-token-" + Date.now();
  } catch (error) {
    console.error("Error getting FCM token:", error);
    return null;
  }
};

// Mock функция для получения ID токена (больше не нужна для авторизации)
export const getIdToken = async (): Promise<string | null> => {
  // Эта функция больше не используется для авторизации
  // JWT токен теперь хранится в AsyncStorage
  return null;
};

export default firebaseConfig;
