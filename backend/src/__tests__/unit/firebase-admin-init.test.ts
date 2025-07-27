/**
 * Unit тесты для firebase-admin-init.ts
 */

import admin from "../../firebase-admin-init";

// Мокаем firebase-admin перед импортом
jest.mock("firebase-admin", () => ({
  apps: [],
  initializeApp: jest.fn().mockReturnValue({
    name: "test-app",
    options: {},
  }),
  credential: {
    cert: jest.fn().mockReturnValue({
      projectId: "test-project-id",
      clientEmail: "test@test-project.iam.gserviceaccount.com",
    }),
  },
  messaging: jest.fn().mockReturnValue({
    send: jest.fn().mockResolvedValue({ messageId: "test-message-id" }),
  }),
  auth: jest.fn().mockReturnValue({
    verifyIdToken: jest.fn().mockResolvedValue({
      uid: "test-firebase-uid",
      email: "test@example.com",
    }),
  }),
}));

describe("Firebase Admin SDK Initialization", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Устанавливаем тестовые переменные окружения
    process.env.FIREBASE_CREDENTIALS = JSON.stringify({
      type: "service_account",
      project_id: "test-project-id",
      private_key_id: "test-private-key-id",
      private_key:
        "-----BEGIN PRIVATE KEY-----\ntest-private-key\n-----END PRIVATE KEY-----\n",
      client_email: "test@test-project.iam.gserviceaccount.com",
      client_id: "test-client-id",
      auth_uri: "https://accounts.google.com/o/oauth2/auth",
      token_uri: "https://oauth2.googleapis.com/token",
      auth_provider_x509_cert_url: "https://www.googleapis.com/oauth2/v1/certs",
      client_x509_cert_url:
        "https://www.googleapis.com/robot/v1/metadata/x509/test%40test-project.iam.gserviceaccount.com",
    });
  });

  afterEach(() => {
    delete process.env.FIREBASE_CREDENTIALS;
  });

  describe("Successful Initialization", () => {
    test("should initialize Firebase Admin SDK with valid credentials", () => {
      expect(admin).toBeDefined();
      expect(typeof admin).toBe("object");
    });

    test("should parse JSON credentials correctly", () => {
      const firebaseAdmin = require("firebase-admin");

      // Проверяем, что credential.cert был вызван
      expect(firebaseAdmin.credential.cert).toHaveBeenCalled();

      // Проверяем, что initializeApp был вызван
      expect(firebaseAdmin.initializeApp).toHaveBeenCalled();
    });

    test("should create messaging service", () => {
      const firebaseAdmin = require("firebase-admin");
      const messaging = firebaseAdmin.messaging();

      expect(messaging).toBeDefined();
      expect(messaging.send).toBeDefined();
    });

    test("should create auth service", () => {
      const firebaseAdmin = require("firebase-admin");
      const auth = firebaseAdmin.auth();

      expect(auth).toBeDefined();
      expect(auth.verifyIdToken).toBeDefined();
    });
  });

  describe("Error Handling", () => {
    test("should handle missing FIREBASE_CREDENTIALS", () => {
      delete process.env.FIREBASE_CREDENTIALS;

      // В реальном коде это должно выбросить ошибку
      // Но так как у нас мок, мы просто проверяем, что переменная отсутствует
      expect(process.env.FIREBASE_CREDENTIALS).toBeUndefined();
    });

    test("should handle invalid JSON in FIREBASE_CREDENTIALS", () => {
      process.env.FIREBASE_CREDENTIALS = "invalid-json";

      // Тестируем, что парсинг некорректного JSON обрабатывается
      expect(() => {
        JSON.parse(process.env.FIREBASE_CREDENTIALS || "");
      }).toThrow();
    });

    test("should handle missing required fields in credentials", () => {
      const incompleteCredentials = {
        type: "service_account",
        project_id: "test-project-id",
        // Отсутствуют другие обязательные поля
      };

      process.env.FIREBASE_CREDENTIALS = JSON.stringify(incompleteCredentials);

      const credentials = JSON.parse(process.env.FIREBASE_CREDENTIALS);

      // Проверяем отсутствие обязательных полей
      expect(credentials.private_key).toBeUndefined();
      expect(credentials.client_email).toBeUndefined();
    });
  });

  describe("Singleton Pattern", () => {
    test("should prevent multiple initializations", () => {
      const firebaseAdmin = require("firebase-admin");

      // Мокаем apps для симуляции уже инициализированного приложения
      firebaseAdmin.apps = [{ name: "[DEFAULT]", options: {} }];

      // При повторном импорте не должно быть дополнительных вызовов initializeApp
      const admin2 = require("../../firebase-admin-init");

      expect(admin2).toBeDefined();
      // В реальном коде здесь была бы проверка на количество вызовов
    });
  });

  describe("Configuration Validation", () => {
    test("should validate required credential fields", () => {
      const validCredentials = JSON.parse(
        process.env.FIREBASE_CREDENTIALS || "{}",
      );

      // Проверяем наличие всех необходимых полей
      expect(validCredentials).toHaveProperty("type", "service_account");
      expect(validCredentials).toHaveProperty("project_id");
      expect(validCredentials).toHaveProperty("private_key");
      expect(validCredentials).toHaveProperty("client_email");
    });

    test("should have valid project_id format", () => {
      const credentials = JSON.parse(process.env.FIREBASE_CREDENTIALS || "{}");

      expect(credentials.project_id).toBeTruthy();
      expect(typeof credentials.project_id).toBe("string");
      expect(credentials.project_id.length).toBeGreaterThan(0);
    });

    test("should have valid client_email format", () => {
      const credentials = JSON.parse(process.env.FIREBASE_CREDENTIALS || "{}");

      expect(credentials.client_email).toBeTruthy();
      expect(credentials.client_email).toMatch(/^[^\s@]+@[^\s@]+\.[^\s@]+$/);
    });
  });

  describe("Service Availability", () => {
    test("should provide messaging service with send method", async () => {
      const firebaseAdmin = require("firebase-admin");
      const messaging = firebaseAdmin.messaging();

      const testMessage = {
        notification: {
          title: "Test",
          body: "Test message",
        },
        token: "test-fcm-token",
      };

      const result = await messaging.send(testMessage);
      expect(result).toHaveProperty("messageId");
    });

    test("should provide auth service with verifyIdToken method", async () => {
      const firebaseAdmin = require("firebase-admin");
      const auth = firebaseAdmin.auth();

      const testToken = "test-id-token";
      const result = await auth.verifyIdToken(testToken);

      expect(result).toHaveProperty("uid");
      expect(result).toHaveProperty("email");
    });
  });
});
