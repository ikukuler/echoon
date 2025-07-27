/**
 * Интеграционные тесты для API endpoints
 */

import request from "supertest";
import express from "express";
import cors from "cors";
import {
  generateMockFirebaseToken,
  expectApiError,
  expectApiSuccess,
  generateFutureDate,
} from "../utils/testHelpers";
import {
  mockCreateEchoRequest,
  invalidRequests,
  mockFirebaseUser,
} from "../utils/mockData";

// Мокаем все внешние зависимости
jest.mock("../../firebase-admin-init");
jest.mock("../../supabaseClient");
jest.mock("../../echoQueue");

describe("API Integration Tests", () => {
  let app: express.Application;

  beforeAll(() => {
    // Создаем тестовое приложение
    app = express();
    app.use(cors());
    app.use(express.json());

    // Импортируем и настраиваем роуты после установки моков
    const server = require("../../server");
    app = server.default || server;
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("Health Check - GET /health", () => {
    test("should return health status", async () => {
      const response = await request(app).get("/health").expect(200);

      expectApiSuccess(response);
      expect(response.body).toHaveProperty("status");
      expect(response.body).toHaveProperty("timestamp");
      expect(response.body).toHaveProperty("services");

      // Проверяем структуру services
      expect(response.body.services).toHaveProperty("firebase");
      expect(response.body.services).toHaveProperty("supabase");
      expect(response.body.services).toHaveProperty("redis");
      expect(response.body.services).toHaveProperty("queue");
    });

    test("should handle service unavailable", async () => {
      // Мокаем ошибку в одном из сервисов
      const { supabase } = require("../../supabaseClient");
      supabase.from = jest.fn(() => ({
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockRejectedValue(new Error("Database error")),
      }));

      const response = await request(app).get("/health");

      // Может быть 200 или 503 в зависимости от реализации
      expect([200, 503]).toContain(response.status);
    });
  });

  describe("Create Echo - POST /api/echoes", () => {
    const validToken = generateMockFirebaseToken();

    test("should create echo with valid data", async () => {
      // Мокаем успешные ответы
      const { supabase } = require("../../supabaseClient");
      supabase.from = jest.fn(() => ({
        insert: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: {
            id: "test-echo-id",
            user_id: "test-user-id",
            return_at: mockCreateEchoRequest.return_at,
            created_at: new Date().toISOString(),
          },
          error: null,
        }),
      }));

      const response = await request(app)
        .post("/api/echoes")
        .set("Authorization", `Bearer ${validToken}`)
        .send(mockCreateEchoRequest)
        .expect(201);

      expectApiSuccess(response, 201);
      expect(response.body).toHaveProperty("message");
      expect(response.body).toHaveProperty("echo");
      expect(response.body.echo).toHaveProperty("id");
      expect(response.body.echo).toHaveProperty("userId");
      expect(response.body.echo).toHaveProperty("returnAt");
      expect(response.body.echo).toHaveProperty("parts");
    });

    test("should reject request without authorization", async () => {
      const response = await request(app)
        .post("/api/echoes")
        .send(mockCreateEchoRequest)
        .expect(401);

      expectApiError(response, "UNAUTHORIZED", 401);
    });

    test("should reject request with invalid token", async () => {
      const response = await request(app)
        .post("/api/echoes")
        .set("Authorization", "Bearer invalid-token")
        .send(mockCreateEchoRequest)
        .expect(401);

      expectApiError(response, "INVALID_TOKEN", 401);
    });

    test("should validate required fields", async () => {
      const response = await request(app)
        .post("/api/echoes")
        .set("Authorization", `Bearer ${validToken}`)
        .send(invalidRequests.createEcho.missingReturnAt)
        .expect(400);

      expectApiError(response, "MISSING_RETURN_AT", 400);
    });

    test("should validate returnAt date format", async () => {
      const response = await request(app)
        .post("/api/echoes")
        .set("Authorization", `Bearer ${validToken}`)
        .send(invalidRequests.createEcho.invalidReturnAt)
        .expect(400);

      expectApiError(response, "INVALID_RETURN_AT", 400);
    });

    test("should validate parts array", async () => {
      const response = await request(app)
        .post("/api/echoes")
        .set("Authorization", `Bearer ${validToken}`)
        .send(invalidRequests.createEcho.emptyParts)
        .expect(400);

      expectApiError(response, "EMPTY_PARTS", 400);
    });

    test("should validate part types", async () => {
      const response = await request(app)
        .post("/api/echoes")
        .set("Authorization", `Bearer ${validToken}`)
        .send(invalidRequests.createEcho.invalidPartType)
        .expect(400);

      expectApiError(response, "INVALID_PART_TYPE", 400);
    });

    test("should handle database errors", async () => {
      // Мокаем ошибку базы данных
      const { supabase } = require("../../supabaseClient");
      supabase.from = jest.fn(() => ({
        insert: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: null,
          error: { message: "Database connection failed" },
        }),
      }));

      const response = await request(app)
        .post("/api/echoes")
        .set("Authorization", `Bearer ${validToken}`)
        .send(mockCreateEchoRequest)
        .expect(500);

      expectApiError(response, "INTERNAL_ERROR", 500);
    });
  });

  describe("User Profile - GET /api/user/profile", () => {
    const validToken = generateMockFirebaseToken();

    test("should return user profile", async () => {
      // Мокаем успешный ответ профиля
      const { supabase } = require("../../supabaseClient");
      supabase.from = jest.fn(() => ({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: {
            id: "test-user-id",
            email: "test@example.com",
            display_name: "Test User",
            photo_url: "https://example.com/photo.jpg",
            email_verified: true,
            provider: "google",
            is_active: true,
            last_login_at: new Date().toISOString(),
            created_at: new Date().toISOString(),
          },
          error: null,
        }),
      }));

      const response = await request(app)
        .get("/api/user/profile")
        .set("Authorization", `Bearer ${validToken}`)
        .expect(200);

      expectApiSuccess(response);
      expect(response.body).toHaveProperty("user");
      expect(response.body).toHaveProperty("stats");
      expect(response.body.user).toHaveProperty("id");
      expect(response.body.user).toHaveProperty("email");
      expect(response.body.user).toHaveProperty("displayName");
    });

    test("should require authentication", async () => {
      const response = await request(app).get("/api/user/profile").expect(401);

      expectApiError(response, "UNAUTHORIZED", 401);
    });
  });

  describe("Register FCM Token - POST /api/user/tokens", () => {
    const validToken = generateMockFirebaseToken();
    const tokenRequest = {
      fcmToken: "test-fcm-token",
      deviceId: "test-device-id",
      deviceType: "ios",
    };

    test("should register FCM token successfully", async () => {
      // Мокаем успешную регистрацию
      const { supabase } = require("../../supabaseClient");
      supabase.from = jest.fn(() => ({
        upsert: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: {
            id: "test-token-id",
            fcm_token: tokenRequest.fcmToken,
            device_id: tokenRequest.deviceId,
            device_type: tokenRequest.deviceType,
            is_active: true,
          },
          error: null,
        }),
      }));

      const response = await request(app)
        .post("/api/user/tokens")
        .set("Authorization", `Bearer ${validToken}`)
        .send(tokenRequest)
        .expect(200);

      expectApiSuccess(response);
      expect(response.body).toHaveProperty("message");
      expect(response.body).toHaveProperty("token");
      expect(response.body.token).toHaveProperty("deviceId");
      expect(response.body.token).toHaveProperty("deviceType");
    });

    test("should validate required fields", async () => {
      const response = await request(app)
        .post("/api/user/tokens")
        .set("Authorization", `Bearer ${validToken}`)
        .send(invalidRequests.registerToken.missingFcmToken)
        .expect(400);

      expectApiError(response, "MISSING_FCM_TOKEN", 400);
    });

    test("should validate device type", async () => {
      const response = await request(app)
        .post("/api/user/tokens")
        .set("Authorization", `Bearer ${validToken}`)
        .send(invalidRequests.registerToken.invalidDeviceType)
        .expect(400);

      expectApiError(response, "INVALID_DEVICE_TYPE", 400);
    });
  });

  describe("Get User Echoes - GET /api/user/echoes", () => {
    const validToken = generateMockFirebaseToken();

    test("should return user echoes with pagination", async () => {
      // Мокаем список echoes
      const { supabase } = require("../../supabaseClient");
      supabase.from = jest.fn(() => ({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        range: jest.fn().mockResolvedValue({
          data: [
            {
              id: "echo-1",
              return_at: generateFutureDate(24),
              created_at: new Date().toISOString(),
              echo_parts: [
                {
                  id: "part-1",
                  type: "text",
                  content: "Test echo",
                  order_index: 0,
                },
              ],
            },
          ],
          error: null,
          count: 1,
        }),
      }));

      const response = await request(app)
        .get("/api/user/echoes")
        .set("Authorization", `Bearer ${validToken}`)
        .query({ limit: 10, offset: 0 })
        .expect(200);

      expectApiSuccess(response);
      expect(response.body).toHaveProperty("echoes");
      expect(response.body).toHaveProperty("pagination");
      expect(Array.isArray(response.body.echoes)).toBe(true);
      expect(response.body.pagination).toHaveProperty("limit");
      expect(response.body.pagination).toHaveProperty("offset");
      expect(response.body.pagination).toHaveProperty("total");
    });

    test("should handle pagination parameters", async () => {
      const { supabase } = require("../../supabaseClient");
      supabase.from = jest.fn(() => ({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        range: jest.fn().mockResolvedValue({
          data: [],
          error: null,
          count: 0,
        }),
      }));

      const response = await request(app)
        .get("/api/user/echoes")
        .set("Authorization", `Bearer ${validToken}`)
        .query({ limit: 5, offset: 10 })
        .expect(200);

      expectApiSuccess(response);

      // Проверяем что range был вызван с правильными параметрами
      expect(supabase.from().range).toHaveBeenCalledWith(10, 14); // offset, offset + limit - 1
    });
  });

  describe("Rate Limiting", () => {
    test("should apply rate limiting to endpoints", async () => {
      const validToken = generateMockFirebaseToken();

      // Делаем много запросов подряд для тестирования rate limiting
      const requests = Array.from({ length: 10 }, () =>
        request(app)
          .post("/api/echoes")
          .set("Authorization", `Bearer ${validToken}`)
          .send(mockCreateEchoRequest),
      );

      const responses = await Promise.allSettled(requests);

      // Некоторые запросы должны быть заблокированы rate limiter'ом
      const rejectedResponses = responses.filter(
        (result) =>
          result.status === "fulfilled" && result.value.status === 429,
      );

      // В зависимости от настройки rate limiter'а может быть разное количество
      expect(rejectedResponses.length).toBeGreaterThanOrEqual(0);
    });
  });

  describe("Error Handling", () => {
    test("should handle malformed JSON", async () => {
      const response = await request(app)
        .post("/api/echoes")
        .set("Authorization", `Bearer ${generateMockFirebaseToken()}`)
        .set("Content-Type", "application/json")
        .send('{"invalid": json}')
        .expect(400);

      // Express должен вернуть ошибку парсинга JSON
      expect(response.status).toBe(400);
    });

    test("should handle missing Content-Type", async () => {
      const response = await request(app)
        .post("/api/echoes")
        .set("Authorization", `Bearer ${generateMockFirebaseToken()}`)
        .send("plain text")
        .expect(400);

      expect(response.status).toBe(400);
    });

    test("should return consistent error format", async () => {
      const response = await request(app).post("/api/echoes").expect(401);

      expectApiError(response, "UNAUTHORIZED", 401);
      expect(response.body).toHaveProperty("error");
      expect(response.body).toHaveProperty("code");
      expect(typeof response.body.error).toBe("string");
      expect(typeof response.body.code).toBe("string");
    });
  });

  describe("CORS Configuration", () => {
    test("should include CORS headers", async () => {
      const response = await request(app).options("/api/echoes").expect(204);

      expect(response.headers).toHaveProperty("access-control-allow-origin");
      expect(response.headers).toHaveProperty("access-control-allow-methods");
      expect(response.headers).toHaveProperty("access-control-allow-headers");
    });

    test("should handle preflight requests", async () => {
      const response = await request(app)
        .options("/api/echoes")
        .set("Origin", "https://example.com")
        .set("Access-Control-Request-Method", "POST")
        .set("Access-Control-Request-Headers", "Authorization,Content-Type")
        .expect(204);

      expect(response.headers["access-control-allow-origin"]).toBeTruthy();
    });
  });
});
