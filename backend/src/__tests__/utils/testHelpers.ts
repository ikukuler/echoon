/**
 * Test utilities и helper functions
 */

import { Express } from "express";
import request from "supertest";
import { User, Echo, EchoPart, UserToken } from "../../types";

// Моковые данные для тестов
export const mockUser: User = {
  id: "test-user-id",
  firebase_uid: "test-firebase-uid",
  email: "test@example.com",
  display_name: "Test User",
  photo_url: "https://example.com/photo.jpg",
  email_verified: true,
  provider: "google",
  is_active: true,
  last_login_at: "2024-01-15T10:30:00Z",
  created_at: "2024-01-01T10:00:00Z",
  updated_at: "2024-01-15T10:30:00Z",
};

export const mockEcho: Echo = {
  id: "test-echo-id",
  user_id: "test-user-id",
  return_at: "2024-12-25T10:00:00Z",
  created_at: "2024-01-15T10:30:00Z",
  updated_at: "2024-01-15T10:30:00Z",
};

export const mockEchoParts: EchoPart[] = [
  {
    id: "test-part-1",
    echo_id: "test-echo-id",
    type: "text",
    content: "Test echo content",
    order_index: 0,
    created_at: "2024-01-15T10:30:00Z",
  },
  {
    id: "test-part-2",
    echo_id: "test-echo-id",
    type: "image",
    content: "https://example.com/image.jpg",
    order_index: 1,
    created_at: "2024-01-15T10:30:00Z",
  },
];

export const mockUserToken: UserToken = {
  id: "test-token-id",
  user_id: "test-user-id",
  fcm_token: "test-fcm-token",
  device_id: "test-device-id",
  device_type: "ios",
  is_active: true,
  created_at: "2024-01-15T10:30:00Z",
  updated_at: "2024-01-15T10:30:00Z",
};

// Генераторы Firebase токенов для тестов
export const generateMockFirebaseToken = (
  userOverrides: Partial<any> = {},
): string => {
  const mockPayload = {
    uid: "test-firebase-uid",
    email: "test@example.com",
    name: "Test User",
    picture: "https://example.com/photo.jpg",
    email_verified: true,
    iss: "https://securetoken.google.com/test-project-id",
    exp: Math.floor(Date.now() / 1000) + 3600, // 1 hour from now
    iat: Math.floor(Date.now() / 1000),
    ...userOverrides,
  };

  // В реальных тестах это должен быть валидный JWT, но для моков достаточно строки
  return `mock-firebase-token-${Buffer.from(
    JSON.stringify(mockPayload),
  ).toString("base64")}`;
};

// Helper для создания API запросов с авторизацией
export const authenticatedRequest = (
  app: Express,
  method: "get" | "post" | "put" | "delete",
  url: string,
  token?: string,
) => {
  const req = request(app)[method](url);
  if (token) {
    req.set("Authorization", `Bearer ${token}`);
  }
  return req;
};

// Helper для генерации дат
export const generateFutureDate = (hoursFromNow: number = 24): string => {
  const date = new Date();
  date.setHours(date.getHours() + hoursFromNow);
  return date.toISOString();
};

export const generatePastDate = (hoursAgo: number = 24): string => {
  const date = new Date();
  date.setHours(date.getHours() - hoursAgo);
  return date.toISOString();
};

// Helper для валидации структуры ответов API
export const expectApiError = (
  response: any,
  code: string,
  status: number = 400,
) => {
  expect(response.status).toBe(status);
  expect(response.body).toHaveProperty("error");
  expect(response.body).toHaveProperty("code", code);
};

export const expectApiSuccess = (response: any, status: number = 200) => {
  expect(response.status).toBe(status);
  expect(response.body).not.toHaveProperty("error");
};

// Helper для создания mock Express app
export const createMockApp = (): Express => {
  const express = require("express");
  const app = express();
  app.use(express.json());
  return app;
};

// Sleep utility для async тестов
export const sleep = (ms: number): Promise<void> => {
  return new Promise((resolve) => setTimeout(resolve, ms));
};

// Utility для генерации UUID для тестов
export const generateTestId = (prefix: string = "test"): string => {
  return `${prefix}-${Math.random().toString(36).substr(2, 9)}`;
};

// Helper для очистки временных данных
export const cleanupTestData = async (
  userIds: string[] = [],
): Promise<void> => {
  // В реальных тестах здесь была бы очистка БД
  // Пока просто заглушка
  console.log(`Cleaning up test data for users: ${userIds.join(", ")}`);
};

// Matcher для проверки валидности UUID
export const isValidUUID = (uuid: string): boolean => {
  const uuidRegex =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
};

// Matcher для проверки валидности ISO даты
export const isValidISODate = (dateString: string): boolean => {
  const date = new Date(dateString);
  return (
    date instanceof Date &&
    !isNaN(date.getTime()) &&
    dateString === date.toISOString()
  );
};

// Custom Jest matchers
declare global {
  namespace jest {
    interface Matchers<R> {
      toBeValidUUID(): R;
      toBeValidISODate(): R;
      toBeValidApiResponse(): R;
    }
  }
}

// Добавляем custom matchers для Jest
if (typeof expect !== "undefined") {
  expect.extend({
    toBeValidUUID(received) {
      const pass = isValidUUID(received);
      return {
        message: () => `expected ${received} to be a valid UUID`,
        pass,
      };
    },

    toBeValidISODate(received) {
      const pass = isValidISODate(received);
      return {
        message: () => `expected ${received} to be a valid ISO date`,
        pass,
      };
    },

    toBeValidApiResponse(received) {
      const hasStatus = typeof received.status === "number";
      const hasBody = typeof received.body === "object";
      const pass = hasStatus && hasBody;

      return {
        message: () => `expected response to have status and body properties`,
        pass,
      };
    },
  });
}
