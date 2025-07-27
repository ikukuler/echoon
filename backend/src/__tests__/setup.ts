/**
 * Jest setup file - выполняется перед каждым тестом
 */

import dotenv from "dotenv";

// Загружаем тестовые переменные окружения
dotenv.config({ path: ".env.test" });

// Устанавливаем тестовое окружение
process.env.NODE_ENV = "test";

// Отключаем логирование в тестах (кроме ошибок)
const originalConsoleLog = console.log;
const originalConsoleInfo = console.info;
const originalConsoleWarn = console.warn;

console.log = jest.fn();
console.info = jest.fn();
console.warn = jest.fn();

// Глобальные моки для часто используемых модулей
jest.setTimeout(30000);

// Мок для Firebase Admin SDK
jest.mock("../firebase-admin-init", () => ({
  __esModule: true,
  default: {
    messaging: () => ({
      send: jest.fn().mockResolvedValue({ messageId: "test-message-id" }),
      sendToDevice: jest.fn().mockResolvedValue({
        results: [{ messageId: "test-message-id" }],
        canonicalRegistrationTokenCount: 0,
        failureCount: 0,
        successCount: 1,
      }),
    }),
    auth: () => ({
      verifyIdToken: jest.fn().mockResolvedValue({
        uid: "test-firebase-uid",
        email: "test@example.com",
        name: "Test User",
        picture: "https://example.com/photo.jpg",
        email_verified: true,
      }),
    }),
  },
}));

// Мок для Supabase
jest.mock("../supabaseClient", () => ({
  __esModule: true,
  supabase: {
    from: jest.fn(() => ({
      select: jest.fn().mockReturnThis(),
      insert: jest.fn().mockReturnThis(),
      update: jest.fn().mockReturnThis(),
      delete: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({ data: null, error: null }),
      then: jest.fn().mockResolvedValue({ data: [], error: null }),
    })),
    auth: {
      signInWithPassword: jest.fn(),
      signOut: jest.fn(),
    },
  },
  testConnection: jest.fn().mockResolvedValue(true),
  getClientInfo: jest.fn().mockReturnValue({
    url: "https://test-supabase-url.supabase.co",
    anonKey: "test-anon-key",
  }),
}));

// Мок для Redis/BullMQ
jest.mock("ioredis", () => {
  return jest.fn().mockImplementation(() => ({
    ping: jest.fn().mockResolvedValue("PONG"),
    get: jest.fn().mockResolvedValue(null),
    set: jest.fn().mockResolvedValue("OK"),
    del: jest.fn().mockResolvedValue(1),
    disconnect: jest.fn().mockResolvedValue(undefined),
    on: jest.fn(),
    once: jest.fn(),
    emit: jest.fn(),
  }));
});

jest.mock("bullmq", () => ({
  Queue: jest.fn().mockImplementation(() => ({
    add: jest.fn().mockResolvedValue({ id: "test-job-id" }),
    close: jest.fn().mockResolvedValue(undefined),
    getJobs: jest.fn().mockResolvedValue([]),
    getJob: jest.fn().mockResolvedValue(null),
    remove: jest.fn().mockResolvedValue(undefined),
  })),
  Worker: jest.fn().mockImplementation(() => ({
    close: jest.fn().mockResolvedValue(undefined),
    on: jest.fn(),
  })),
  Job: jest.fn(),
}));

// Восстанавливаем console.error для отображения ошибок
afterEach(() => {
  jest.clearAllMocks();
});

// Глобальная очистка после всех тестов
afterAll(() => {
  console.log = originalConsoleLog;
  console.info = originalConsoleInfo;
  console.warn = originalConsoleWarn;
});
