# EchoOn Mobile App

React Native мобильное приложение для EchoOn с Firebase Google Auth и NativeWind.

## 🚀 Установка и настройка

### 1. Установка зависимостей

```bash
cd mobile

# Основные зависимости
npm install @react-native-firebase/app @react-native-firebase/auth @react-native-google-signin/google-signin nativewind

# Навигация
npm install @react-navigation/native @react-navigation/native-stack react-native-screens react-native-safe-area-context

# Dev зависимости
npm install -D tailwindcss
```

### 2. Инициализация TailwindCSS

```bash
npx tailwindcss init
```

### 3. Настройка Firebase

1. Перейдите в [Firebase Console](https://console.firebase.google.com/)
2. Создайте новый проект или используйте существующий
3. Добавьте Android/iOS приложения
4. Скачайте `google-services.json` (Android) и `GoogleService-Info.plist` (iOS)
5. Поместите файлы в соответствующие папки:
   - Android: `android/app/google-services.json`
   - iOS: `ios/YourAppName/GoogleService-Info.plist`

### 4. Обновите Firebase конфигурацию

Отредактируйте `src/services/firebase.ts`:

```typescript
const firebaseConfig = {
  apiKey: "your-actual-api-key",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-actual-project-id",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "123456789",
  appId: "your-actual-app-id",
};

// Google Sign-In Web Client ID из Firebase Console
GoogleSignin.configure({
  webClientId: 'your-actual-web-client-id.googleusercontent.com',
  offlineAccess: true,
});
```

### 5. Настройка API endpoints

Обновите `src/services/api.ts`:

```typescript
const API_BASE_URL = __DEV__ 
  ? 'http://YOUR_LOCAL_IP:3000/api'  // Замените на ваш IP
  : 'https://your-production-api.com/api';
```

## 📱 Запуск приложения

```bash
# Запуск Expo сервера
npx expo start

# Для Android
npx expo start --android

# Для iOS
npx expo start --ios
```

## 🏗️ Архитектура приложения

```
src/
├── components/           # Переиспользуемые компоненты
│   └── LoadingSpinner.tsx
├── screens/             # Экраны приложения
│   ├── LoginScreen.tsx
│   └── HomeScreen.tsx
├── hooks/               # React хуки
│   └── useAuth.tsx
├── services/            # API и внешние сервисы
│   ├── firebase.ts
│   └── api.ts
├── types/               # TypeScript типы
│   └── index.ts
└── utils/               # Утилиты
```

## 🎨 Стилизация (NativeWind)

Приложение использует NativeWind (TailwindCSS для React Native):

```tsx
<View className="flex-1 bg-gray-50 justify-center items-center">
  <Text className="text-2xl font-bold text-gray-800">Hello World</Text>
</View>
```

Основная цветовая схема:
- Primary: `#0ea5e9` (blue-500)
- Backgrounds: `gray-50`, `white`
- Text: `gray-800`, `gray-600`, `gray-500`

## 🔐 Авторизация

Приложение использует:
- **Firebase Authentication** для управления пользователями
- **Google Sign-In** для входа
- **JWT токены** для API запросов к бэкенду

Поток авторизации:
1. Пользователь нажимает "Continue with Google"
2. Открывается Google OAuth
3. Получается Firebase ID Token
4. Токен отправляется в бэкенд для создания/обновления пользователя
5. Пользователь авторизован в приложении

## 🌐 API Integration

API сервис автоматически:
- Добавляет Bearer токен к запросам
- Обрабатывает ошибки
- Форматирует ответы

Доступные методы:
- `apiService.healthCheck()`
- `apiService.getUserProfile()`
- `apiService.createEcho(data)`
- `apiService.getUserEchoes()`
- `apiService.updateFCMToken(token)`

## 📋 TODO

### ✅ Готово:
- [x] Базовая структура приложения
- [x] Firebase Auth настройка
- [x] Google Sign-In интеграция
- [x] NativeWind конфигурация
- [x] API сервис
- [x] Экраны Login и Home
- [x] TypeScript типы
- [x] Авторизация middleware

### 🔄 В планах:
- [ ] Экран создания Echo
- [ ] Push notifications (FCM)
- [ ] Offline режим
- [ ] Валидация форм
- [ ] Загрузка изображений
- [ ] Анимации
- [ ] Unit тесты

## 🛠️ Отладка

### Распространенные проблемы:

1. **Metro bundler ошибки**:
   ```bash
   npx expo start --clear
   ```

2. **Firebase Auth не работает**:
   - Проверьте SHA1/SHA256 отпечатки в Firebase Console
   - Убедитесь что google-services.json актуален

3. **API недоступен**:
   - Используйте ваш локальный IP вместо localhost
   - Убедитесь что бэкенд запущен

4. **NativeWind стили не применяются**:
   - Перезапустите Metro bundler
   - Проверьте babel.config.js

## 📦 Сборка для продакшна

```bash
# Android
npx expo build:android

# iOS
npx expo build:ios
```

## 🔗 Полезные ссылки

- [Expo Documentation](https://docs.expo.dev/)
- [React Navigation](https://reactnavigation.org/)
- [NativeWind](https://www.nativewind.dev/)
- [Firebase React Native](https://rnfirebase.io/)
- [Google Sign-In](https://github.com/react-native-google-signin/google-signin) 