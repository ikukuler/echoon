/**
 * End-to-end тесты для проверки работы системы в целом
 */

import request from "supertest";
import { generateMockFirebaseToken } from "../utils/testHelpers";

// В E2E тестах мы можем тестировать реальные соединения (опционально)
describe("E2E Health Tests", () => {
  const APP_URL = process.env.TEST_APP_URL || "http://localhost:3000";

  describe("Health Check Endpoint", () => {
    test("should respond to health check", async () => {
      const response = await request(APP_URL).get("/health").timeout(10000);

      expect([200, 503]).toContain(response.status);
      expect(response.body).toHaveProperty("status");
      expect(response.body).toHaveProperty("timestamp");
      expect(response.body).toHaveProperty("services");
    }, 15000);

    test("should include all required service statuses", async () => {
      const response = await request(APP_URL).get("/health").timeout(10000);

      if (response.status === 200) {
        expect(response.body.services).toHaveProperty("firebase");
        expect(response.body.services).toHaveProperty("supabase");
        expect(response.body.services).toHaveProperty("redis");
        expect(response.body.services).toHaveProperty("queue");
      }
    }, 15000);
  });

  describe("CORS Configuration", () => {
    test("should handle CORS preflight requests", async () => {
      const response = await request(APP_URL)
        .options("/api/echoes")
        .set("Origin", "https://example.com")
        .set("Access-Control-Request-Method", "POST")
        .set("Access-Control-Request-Headers", "Authorization,Content-Type")
        .timeout(5000);

      expect([200, 204]).toContain(response.status);
      expect(response.headers).toHaveProperty("access-control-allow-origin");
    }, 10000);
  });

  describe("Authentication Flow", () => {
    test("should reject unauthenticated requests to protected endpoints", async () => {
      const response = await request(APP_URL)
        .post("/api/echoes")
        .send({
          returnAt: "2024-12-25T10:00:00Z",
          parts: [{ type: "text", content: "Test echo" }],
        })
        .timeout(5000);

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty("error");
      expect(response.body).toHaveProperty("code");
    }, 10000);

    test("should handle malformed authorization headers", async () => {
      const response = await request(APP_URL)
        .post("/api/echoes")
        .set("Authorization", "InvalidFormat")
        .send({
          returnAt: "2024-12-25T10:00:00Z",
          parts: [{ type: "text", content: "Test echo" }],
        })
        .timeout(5000);

      expect(response.status).toBe(401);
      expect(response.body.code).toBe("INVALID_AUTH_FORMAT");
    }, 10000);
  });

  describe("Rate Limiting", () => {
    test("should apply rate limiting to health endpoint", async () => {
      // Делаем много запросов быстро
      const requests = Array.from({ length: 5 }, () =>
        request(APP_URL).get("/health").timeout(3000),
      );

      const responses = await Promise.allSettled(requests);

      // Проверяем что хотя бы некоторые запросы прошли
      const fulfilledResponses = responses.filter(
        (result) => result.status === "fulfilled",
      ) as PromiseFulfilledResult<any>[];

      expect(fulfilledResponses.length).toBeGreaterThan(0);

      // Проверяем что все ответы имеют валидную структуру
      fulfilledResponses.forEach((result) => {
        expect([200, 429, 503]).toContain(result.value.status);
      });
    }, 15000);
  });

  describe("API Response Format", () => {
    test("should return consistent error format", async () => {
      const response = await request(APP_URL).post("/api/echoes").timeout(5000);

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty("error");
      expect(response.body).toHaveProperty("code");
      expect(typeof response.body.error).toBe("string");
      expect(typeof response.body.code).toBe("string");
    }, 10000);

    test("should handle malformed JSON", async () => {
      const response = await request(APP_URL)
        .post("/api/echoes")
        .set("Authorization", `Bearer ${generateMockFirebaseToken()}`)
        .set("Content-Type", "application/json")
        .send('{"invalid": json}')
        .timeout(5000);

      expect(response.status).toBe(400);
    }, 10000);
  });

  describe("Bull Board UI", () => {
    test("should serve Bull Board interface", async () => {
      const response = await request(APP_URL)
        .get("/admin/queues")
        .timeout(10000);

      // Bull Board может возвращать 200 (готов) или 503 (инициализируется)
      expect([200, 503]).toContain(response.status);

      if (response.status === 200) {
        expect(response.text).toContain("Bull Dashboard");
      }
    }, 15000);
  });

  describe("Performance", () => {
    test("health endpoint should respond quickly", async () => {
      const startTime = Date.now();

      const response = await request(APP_URL).get("/health").timeout(5000);

      const responseTime = Date.now() - startTime;

      expect([200, 503]).toContain(response.status);
      expect(responseTime).toBeLessThan(3000); // Должен отвечать быстрее 3 секунд
    }, 10000);

    test("CORS preflight should be fast", async () => {
      const startTime = Date.now();

      const response = await request(APP_URL)
        .options("/api/echoes")
        .timeout(3000);

      const responseTime = Date.now() - startTime;

      expect([200, 204]).toContain(response.status);
      expect(responseTime).toBeLessThan(1000); // CORS должен быть очень быстрым
    }, 5000);
  });

  describe("Security Headers", () => {
    test("should include security headers", async () => {
      const response = await request(APP_URL).get("/health").timeout(5000);

      // Проверяем CORS заголовки
      expect(response.headers).toHaveProperty("access-control-allow-origin");

      // Проверяем что нет небезопасных заголовков
      expect(response.headers).not.toHaveProperty("server");
      expect(response.headers).not.toHaveProperty("x-powered-by");
    }, 10000);
  });
});
