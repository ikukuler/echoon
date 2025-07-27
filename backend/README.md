# EchoWall Backend

Минимальный backend на Node.js с Express для приложения EchoWall с поддержкой Firebase Admin SDK и Supabase.

## Возможности

- 📱 Отправка push-уведомлений через Firebase Admin SDK
- 🗄️ Работа с базой данных через Supabase
- ⏰ Отложенные задания для отправки напоминаний
- 🛡️ Валидация входных данных
- 🔧 Конфигурация через переменные окружения

## Установка

1. Клонируйте репозиторий и установите зависимости:
```bash
npm install
```

2. Создайте файл `.env` и заполните его:
```bash
cp .env.example .env
```

## Конфигурация

### Переменные окружения (.env)

```env
# Server Configuration
PORT=3000

# Firebase Admin SDK Configuration
# Поместите весь JSON из Firebase service account ключа в одну строку
FIREBASE_CREDENTIALS='{"type":"service_account","project_id":"your-project-id","private_key_id":"your-private-key-id","private_key":"-----BEGIN PRIVATE KEY-----\nyour-private-key\n-----END PRIVATE KEY-----\n","client_email":"your-service-account@your-project.iam.gserviceaccount.com","client_id":"your-client-id","auth_uri":"https://accounts.google.com/o/oauth2/auth","token_uri":"https://oauth2.googleapis.com/token","auth_provider_x509_cert_url":"https://www.googleapis.com/oauth2/v1/certs","client_x509_cert_url":"https://www.googleapis.com/robot/v1/metadata/x509/your-service-account%40your-project.iam.gserviceaccount.com"}'

# Supabase Configuration
SUPABASE_URL=your-supabase-url
SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key

# Redis Configuration (для BullMQ)
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=your-redis-password
```

### Настройка Firebase

1. Создайте проект в [Firebase Console](https://console.firebase.google.com/)
2. Включите **Authentication** и настройте **Google Sign-In**
3. Перейдите в Project Settings > Service Accounts
4. Нажмите "Generate new private key" и скачайте JSON файл
5. Скопируйте **весь содержимый** JSON файла в переменную `FIREBASE_CREDENTIALS` в `.env`

**Важно**: JSON должен быть в одной строке и обернут в одинарные кавычки:
```env
FIREBASE_CREDENTIALS='{"type":"service_account","project_id":"your-project",...}'
```

**Для клиентского приложения:**
1. Добавьте ваше приложение в Firebase проект
2. Скачайте `google-services.json` (Android) или `GoogleService-Info.plist` (iOS)
3. Настройте Firebase SDK на клиенте для Google Sign-In

### Настройка Supabase

1. Создайте проект в [Supabase](https://supabase.com/)
2. Перейдите в Settings > API
3. Скопируйте URL и ключи в переменные окружения
4. Выполните SQL из файла `database.sql` в SQL Editor

## Структура базы данных

Выполните следующий SQL в Supabase SQL Editor:

```sql
-- См. файл database.sql для полной схемы
```

Основные таблицы:
- `users` - пользователи с информацией из Firebase Auth (email, имя, фото)
- `echoes` - основная таблица для хранения echo
- `echo_parts` - части echo с полями `type`, `content` и возможностью упорядочивания
- `user_tokens` - FCM токены пользователей для push-уведомлений
- `notification_logs` - логи отправленных уведомлений

## Запуск

### Режим разработки
```bash
npm run dev
```

### Сборка TypeScript
```bash
npm run build
```

### Продакшн
```bash
npm start
```

### Тестирование подключений
```bash
npm run test-connections
```

### Мониторинг очередей (Bull Board)
```bash
# Запустите сервер
npm run dev

# Откройте в браузере
open http://localhost:3000/admin/queues
```

Или используйте команду:
```bash
npm run queue:monitor
```

Сервер будет доступен на `http://localhost:3000`

## 📊 Bull Board - Мониторинг очередей

Красивый веб-интерфейс для мониторинга BullMQ очередей в реальном времени:

**URL:** `http://localhost:3000/admin/queues`

### Возможности Bull Board:
- 📈 **Real-time мониторинг** очередей и заданий
- 🔍 **Детальный просмотр** каждого задания и его данных  
- ⚡ **Управление заданиями** - retry, pause, resume, delete
- 📊 **Статистика** - completed, failed, waiting, active jobs
- 🔄 **Auto-refresh** - автоматическое обновление данных
- 🎨 **Современный UI** - удобный и интуитивный интерфейс
- 🔍 **Поиск и фильтрация** заданий по статусу
- 📝 **Логи ошибок** - детальная информация о неудачных заданиях

### Функциональность:
- **Queues Tab** - список всех очередей (`echoQueue`) и их статус
- **Jobs Tab** - список заданий с возможностью управления
- **Job Details** - детальная информация о задании, данные, ошибки
- **Statistics** - графики и метрики производительности

### Тестирование Bull Board:
Чтобы увидеть Bull Board в действии, создайте несколько echo через API:
```bash
# Запустите сервер
npm run dev

# В другом терминале создайте echo (требует Firebase токен)
curl -X POST http://localhost:3000/api/echoes \
  -H "Authorization: Bearer YOUR_FIREBASE_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "returnAt": "2024-12-25T10:00:00Z",
    "parts": [{"type": "text", "content": "Test echo for Bull Board"}]
  }'

# Откройте Bull Board
open http://localhost:3000/admin/queues
```

## API Endpoints

### Аутентификация

Все защищенные endpoints требуют Firebase ID токен в заголовке:
```
Authorization: Bearer <firebase-id-token>
```

При первом запросе с новым Firebase UID автоматически создается запись пользователя в таблице `users` с данными из Google аккаунта.

### POST /api/echoes (🔒 Protected)

Создает новый echo с отложенной отправкой.

**Headers:**
```
Authorization: Bearer <firebase-id-token>
```

**Request Body:**
```json
{
  "returnAt": "2024-12-25T10:00:00Z",
  "parts": [
    {
      "type": "text", 
      "content": "Первая часть сообщения"
    },
    {
      "type": "image",
      "content": "https://example.com/image.jpg"
    },
    {
      "type": "link",
      "content": "https://example.com"
    }
  ]
}
```

**Примечание:** `userId` берется автоматически из Firebase токена

**Поддерживаемые типы частей:**
- `text` - текстовое сообщение
- `image` - ссылка на изображение
- `audio` - ссылка на аудио файл
- `video` - ссылка на видео файл
- `link` - веб-ссылка
- `location` - координаты местоположения

**Response:**
```json
{
  "message": "Echo created successfully",
  "echo": {
    "id": "uuid",
    "userId": "uuid",
    "returnAt": "2024-12-25T10:00:00Z",
    "partsCount": 3,
    "parts": [
      {
        "id": "uuid",
        "type": "text",
        "content": "Первая часть сообщения",
        "orderIndex": 0
      },
      {
        "id": "uuid",
        "type": "image",
        "content": "https://example.com/image.jpg",
        "orderIndex": 1
      },
      {
        "id": "uuid",
        "type": "link",
        "content": "https://example.com",
        "orderIndex": 2
      }
    ]
  }
}
```

**Error Responses:**
```json
{
  "error": "Missing required field: userId",
  "code": "MISSING_USER_ID"
}
```

```json
{
  "error": "Part at index 0 has invalid type \"unknown\". Allowed types: text, image, audio, video, link, location",
  "code": "INVALID_PART_TYPE"
}
```

```json
{
  "error": "Internal server error",
  "code": "INTERNAL_ERROR",
  "requestId": "req_1699123456789_abc123def"
}
```

### GET /api/user/profile (🔒 Protected)

Получает профиль текущего пользователя.

**Headers:**
```
Authorization: Bearer <firebase-id-token>
```

**Response:**
```json
{
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "displayName": "John Doe",
    "photoUrl": "https://example.com/photo.jpg",
    "emailVerified": true,
    "provider": "google",
    "isActive": true,
    "lastLoginAt": "2024-01-15T10:30:00Z",
    "createdAt": "2024-01-01T10:00:00Z"
  },
  "stats": {
    "totalEchoes": 15,
    "activeTokens": 2
  }
}
```

### PUT /api/user/profile (🔒 Protected)

Обновляет профиль пользователя.

**Headers:**
```
Authorization: Bearer <firebase-id-token>
```

**Request Body:**
```json
{
  "displayName": "New Display Name"
}
```

### POST /api/user/tokens (🔒 Protected)

Регистрирует FCM токен для push-уведомлений.

**Headers:**
```
Authorization: Bearer <firebase-id-token>
```

**Request Body:**
```json
{
  "fcmToken": "firebase-cloud-messaging-token",
  "deviceId": "device-unique-id",
  "deviceType": "ios"
}
```

**Response:**
```json
{
  "message": "FCM token registered successfully",
  "token": {
    "id": "uuid",
    "deviceId": "device-unique-id", 
    "deviceType": "ios",
    "isActive": true
  }
}
```

### GET /api/user/echoes (🔒 Protected)

Получает список echoes пользователя.

**Headers:**
```
Authorization: Bearer <firebase-id-token>
```

**Query Parameters:**
- `limit` (optional): количество записей (по умолчанию 20)
- `offset` (optional): смещение для пагинации (по умолчанию 0)

**Response:**
```json
{
  "echoes": [
    {
      "id": "uuid",
      "returnAt": "2024-12-25T10:00:00Z",
      "createdAt": "2024-01-15T10:30:00Z",
      "parts": [
        {
          "id": "uuid",
          "type": "text",
          "content": "Напоминание",
          "orderIndex": 0
        }
      ]
    }
  ],
  "pagination": {
    "limit": 20,
    "offset": 0,
    "total": 1
  }
}
```

### GET /health

Проверка состояния сервера и подключения к сервисам.

**Response:**
```json
{
  "status": "OK",
  "timestamp": "2024-01-15T10:30:00Z",
  "services": {
    "firebase": "initialized",
    "supabase": "connected",
    "redis": "connected",
    "queue": "active"
  }
}
```

**Error Response:**
```json
{
  "status": "Service Unavailable",
  "timestamp": "2024-01-15T10:30:00Z",
  "error": "Connection error details"
}
```

## Технологии

### TypeScript

Весь проект написан на **TypeScript** с полной типобезопасностью:

- **Строгие типы** - `strict: true` в tsconfig.json
- **Интерфейсы без префиксов** - `User`, `Echo`, `ApiError` (не `IUser`)  
- **Type-safe API** - все endpoint'ы типизированы
- **Валидация времени компиляции** - ошибки отлавливаются на этапе разработки
- **Intellisense** - полная поддержка автодополнения в IDE

#### Структура типов:
```typescript
// Database entities
interface User {
  id: string;
  firebase_uid: string;
  email: string;
  display_name: string | null;
  photo_url: string | null;
  email_verified: boolean;
  provider: string;
  is_active: boolean;
  last_login_at: string | null;
  created_at: string;
  updated_at: string;
}

// API contracts  
interface CreateEchoRequest {
  returnAt: string;
  parts: Array<{
    type: EchoPartType;
    content: string;
  }>;
}

interface CreateEchoResponse {
  message: string;
  echo: {
    id: string;
    userId: string;
    returnAt: string;
    partsCount: number;
    parts: Array<{
      id: string;
      type: EchoPartType;
      content: string;
      orderIndex: number;
    }>;
  };
}

// Extended Express types
interface AuthenticatedRequest extends Request {
  firebaseUser?: FirebaseUser;
  user?: User;
  userId?: string;
}

// Type-safe enums
type EchoPartType = 'text' | 'image' | 'audio' | 'video' | 'link' | 'location';
type DeviceType = 'ios' | 'android' | 'web' | 'unknown';
type NotificationStatus = 'sent' | 'failed' | 'pending';
```

#### Файловая структура:
```
src/
├── types/
│   └── index.ts           # Все типы и интерфейсы
├── server.ts              # Основной Express сервер
├── firebase-admin-init.ts # Инициализация Firebase Admin
├── supabaseClient.ts      # Инициализация Supabase
├── authMiddleware.ts      # Middleware аутентификации
├── rateLimitMiddleware.ts # Middleware rate limiting
├── echoQueue.ts           # BullMQ очереди и обработка
├── test-connections.ts    # Скрипт тестирования
└── rate-limit-test.ts     # Скрипт тестирования лимитов

dist/                      # Скомпилированный JavaScript
├── server.js
├── *.d.ts                 # TypeScript декларации
└── *.js.map              # Source maps
```

## Архитектура

### Firebase Admin SDK

Инициализация Firebase вынесена в отдельный модуль `firebase-admin-init.js` со следующими возможностями:

- **Защита от двойной инициализации** - проверяет, что SDK не инициализирован повторно
- **JSON конфигурация** - читает credentials из переменной `FIREBASE_CREDENTIALS` как JSON строку
- **Валидация** - проверяет наличие обязательных полей в credentials
- **Обработка ошибок** - подробные сообщения об ошибках конфигурации
- **Экспорт admin объекта** - готовый к использованию объект Firebase Admin

### Firebase Auth Integration

Система аутентификации интегрирована с Firebase Auth:

- **Middleware аутентификации** - автоматическая верификация ID токенов
- **Автоматическое создание пользователей** - при первом входе создается запись в таблице `users`
- **Синхронизация данных** - email, имя и фото автоматически обновляются из Google профиля
- **Row Level Security** - доступ к данным ограничен владельцем через Firebase UID
- **Извлечение email** - email из Google аккаунта сохраняется для будущих email-рассылок

### API Endpoints и Логирование

Все API endpoints включают детальное логирование с уникальными идентификаторами запросов:

- **Request ID** - каждый запрос получает уникальный ID для трассировки
- **Детальная валидация** - пошаговая проверка всех входных данных
- **Структурированные логи** - JSON формат для удобного парсинга
- **Error codes** - стандартизированные коды ошибок для клиентов
- **Транзакционность** - эмуляция транзакций с откатом изменений при ошибках

### Supabase Client

Инициализация Supabase вынесена в отдельный модуль `supabaseClient.js` с возможностями:

- **Service Role подключение** - использует `SUPABASE_SERVICE_ROLE_KEY` для серверных операций
- **Валидация конфигурации** - проверяет формат URL и ключей
- **Тестирование подключения** - функция `testConnection()` для проверки доступности БД
- **Серверные настройки** - отключена автоматическая авторизация и сессии
- **Защита от повторной инициализации** - singleton паттерн
- **Информация о клиенте** - функция `getClientInfo()` для отладки

### Отложенные задания с BullMQ

Система использует **BullMQ** для надежной обработки отложенных push-уведомлений:

- **Очередь `echoQueue`** - обрабатывает отложенные задания для отправки уведомлений
- **Redis backend** - хранение и управление заданиями
- **Автоматические повторы** - 3 попытки выполнения с экспоненциальной задержкой
- **Graceful shutdown** - корректное завершение работы при остановке сервера
- **Rate limiting** - до 10 заданий в секунду
- **Concurrency** - до 5 одновременных заданий

#### Workflow обработки:
1. При создании echo задание планируется на дату `returnAt`
2. Worker получает задание и ищет пользователя и его FCM токены
3. Формируется push-уведомление из частей echo
4. Отправка через Firebase Cloud Messaging
5. Логирование результата в `notification_logs`
6. Деактивация недействительных токенов

### Push-уведомления

Полнофункциональная система push-уведомлений через Firebase Cloud Messaging:

#### Возможности:
- **Мультиплатформенность** - поддержка iOS, Android, Web
- **Множественные устройства** - один пользователь может иметь несколько активных токенов  
- **Автоматическая очистка** - деактивация недействительных токенов
- **Детальное логирование** - статистика доставки по устройствам
- **Retry механизм** - повторные попытки при временных сбоях
- **Rich notifications** - поддержка звуков, бейджей, custom data

#### Управление токенами:
Для начала получения уведомлений клиент должен:
1. Авторизоваться через Firebase Auth (Google)
2. Получить Firebase ID токен
3. Зарегистрировать FCM токен через `POST /api/user/tokens`
4. Указать `device_id` и `device_type` для идентификации устройства

## Развертывание

### Зависимости инфраструктуры:
- **Node.js** 16+ 
- **Redis** для BullMQ очередей
- **PostgreSQL** (Supabase)
- **Firebase Project** с Admin SDK

### Рекомендуемые платформы:
- **Railway** - простое развертывание с встроенной поддержкой Redis
- **Render** - с Redis addon для BullMQ  
- **DigitalOcean App Platform** - с управляемым Redis
- **Heroku** - с Redis addon (Heroku Redis)
- **AWS ECS/Lambda** - с ElastiCache Redis

### Docker развертывание:
```bash
# Быстрый запуск с Docker Compose
npm run docker:up

# Или ручная сборка
docker build -t echowall-backend .
docker run -p 3000:3000 --env-file .env echowall-backend
```

### Production готовые образы:
- **Multi-stage build** - оптимизированный размер образа
- **Non-root user** - безопасность контейнера  
- **Health checks** - мониторинг состояния
- **Alpine Linux** - минимальный базовый образ

## Безопасность

- ✅ Переменные окружения для конфиденциальных данных
- ✅ CORS настроен
- ✅ Row Level Security в Supabase
- ✅ Валидация входных данных
- ✅ Firebase Auth аутентификация пользователей
- ✅ **Rate Limiting** - защита от спама и DDoS атак

### Rate Limiting

Система защиты от злоупотреблений с умными лимитами:

#### Глобальные лимиты:
- **1000 запросов за 15 минут** для аутентифицированных пользователей
- **100 запросов за 15 минут** для анонимных пользователей

#### Специфичные лимиты по операциям:
- **Создание echo**: 50 запросов в час (защита от спама)
- **Регистрация FCM токенов**: 10 запросов за 5 минут
- **Чтение данных**: 200 запросов за 5 минут
- **Обновление профиля**: 10 запросов за 15 минут
- **Health check**: 30 запросов в минуту

#### Возвращаемые заголовки:
```
RateLimit-Limit: 50
RateLimit-Remaining: 49
RateLimit-Reset: 1640995200
```

#### Error Response при превышении лимита:
```json
{
  "error": "Too many echoes created, please wait before creating more",
  "code": "ECHO_CREATION_LIMIT_EXCEEDED", 
  "retryAfter": "1 hour"
}
```

## 🧪 Тестирование

EchoWall включает полнофункциональную систему тестирования с Jest и TypeScript:

### Запуск тестов:
```bash
# Все тесты
npm test

# Unit тесты
npm run test:unit

# Интеграционные тесты  
npm run test:integration

# End-to-end тесты
npm run test:e2e

# Тесты с покрытием кода
npm run test:coverage

# Тесты в watch режиме
npm run test:watch
```

### Структура тестов:
```
src/__tests__/
├── unit/                    # Unit тесты модулей
│   ├── firebase-admin-init.test.ts
│   ├── supabaseClient.test.ts
│   ├── authMiddleware.test.ts
│   └── echoQueue.test.ts
├── integration/             # Интеграционные тесты API
│   └── api.test.ts
├── e2e/                     # End-to-end тесты
│   └── health.test.ts
├── utils/                   # Тестовые утилиты
│   ├── testHelpers.ts       # Helper функции
│   └── mockData.ts          # Моковые данные
├── setup.ts                 # Jest setup
├── globalSetup.ts          # Глобальная настройка
└── globalTeardown.ts       # Глобальная очистка
```

### Возможности тестирования:
- ✅ **Unit тесты** - Firebase Admin, Supabase, middleware, очереди
- ✅ **Integration тесты** - API endpoints с полной аутентификацией
- ✅ **E2E тесты** - тестирование реального приложения
- ✅ **Моки** - Firebase, Supabase, Redis, BullMQ
- ✅ **Coverage** - детальное покрытие кода
- ✅ **TypeScript** - полная типобезопасность в тестах
- ✅ **Custom matchers** - дополнительные Jest matchers
- ✅ **Test helpers** - утилиты для создания mock данных

### Примеры тестов:
```typescript
// Unit тест
test('should verify valid Firebase token', async () => {
  const validToken = generateMockFirebaseToken();
  await verifyFirebaseToken(mockRequest, mockResponse, mockNext);
  expect(mockRequest.firebaseUser).toEqual(mockFirebaseUser);
});

// Integration тест
test('should create echo with valid data', async () => {
  const response = await request(app)
    .post('/api/echoes')
    .set('Authorization', `Bearer ${validToken}`)
    .send(mockCreateEchoRequest)
    .expect(201);
});

// E2E тест
test('should respond to health check', async () => {
  const response = await request('http://localhost:3000')
    .get('/health')
    .timeout(10000);
  expect([200, 503]).toContain(response.status);
});
```

## Следующие шаги

- [x] ✅ Интеграция с BullMQ для надежной обработки очередей
- [x] ✅ Система push-уведомлений через Firebase
- [x] ✅ Логирование и мониторинг уведомлений
- [x] ✅ Добавление аутентификации пользователей (Firebase Auth + Google)
- [x] ✅ Реализация rate limiting для API endpoints
- [x] ✅ Миграция на TypeScript с типобезопасностью
- [x] ✅ Веб-интерфейс для управления очередями (Bull Board)
- [x] ✅ Docker контейнеризация (Dockerfile + docker-compose)
- [x] ✅ Unit и интеграционные тесты (Jest + Supertest)
- [ ] Metrics и alerting (Prometheus/Grafana) - для продакшна
- [ ] Backup стратегия для Redis - для продакшна 