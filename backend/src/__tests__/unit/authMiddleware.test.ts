/**
 * Unit тесты для authMiddleware.ts
 */

import { Request, Response, NextFunction } from "express";
import {
  verifyFirebaseToken,
  ensureUserExists,
  authenticateUser,
} from "../../authMiddleware";
import { mockFirebaseUser, mockSupabaseResponses } from "../utils/mockData";
import { generateMockFirebaseToken } from "../utils/testHelpers";

// Расширяем Request для тестов
interface TestRequest extends Request {
  firebaseUser?: any;
  user?: any;
  userId?: string;
}

// Мокаем зависимости
jest.mock("../../firebase-admin-init");
jest.mock("../../supabaseClient");

describe("Auth Middleware", () => {
  let mockRequest: Partial<TestRequest>;
  let mockResponse: Partial<Response>;
  let mockNext: NextFunction;

  beforeEach(() => {
    mockRequest = {
      headers: {},
      firebaseUser: undefined,
      user: undefined,
      userId: undefined,
    };
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
    mockNext = jest.fn();
    jest.clearAllMocks();
  });

  describe("verifyFirebaseToken", () => {
    test("should verify valid Firebase token", async () => {
      const validToken = generateMockFirebaseToken();
      mockRequest.headers = {
        authorization: `Bearer ${validToken}`,
      };

      // Мокаем успешную верификацию
      const admin = require("../../firebase-admin-init").default;
      admin.auth().verifyIdToken.mockResolvedValue(mockFirebaseUser);

      await verifyFirebaseToken(
        mockRequest as Request,
        mockResponse as Response,
        mockNext,
      );

      expect(mockRequest.firebaseUser).toEqual(mockFirebaseUser);
      expect(mockNext).toHaveBeenCalled();
      expect(mockResponse.status).not.toHaveBeenCalled();
    });

    test("should reject request without authorization header", async () => {
      await verifyFirebaseToken(
        mockRequest as Request,
        mockResponse as Response,
        mockNext,
      );

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: "Authorization header required",
        code: "UNAUTHORIZED",
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    test("should reject malformed authorization header", async () => {
      mockRequest.headers = {
        authorization: "InvalidFormat",
      };

      await verifyFirebaseToken(
        mockRequest as Request,
        mockResponse as Response,
        mockNext,
      );

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: "Invalid authorization format. Use: Bearer <token>",
        code: "INVALID_AUTH_FORMAT",
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    test("should handle invalid Firebase token", async () => {
      mockRequest.headers = {
        authorization: "Bearer invalid-token",
      };

      // Мокаем ошибку верификации
      const admin = require("../../firebase-admin-init").default;
      admin
        .auth()
        .verifyIdToken.mockRejectedValue(
          new Error("Firebase ID token has invalid signature"),
        );

      await verifyFirebaseToken(
        mockRequest as Request,
        mockResponse as Response,
        mockNext,
      );

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: "Invalid Firebase token",
        code: "INVALID_TOKEN",
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    test("should handle expired Firebase token", async () => {
      mockRequest.headers = {
        authorization: "Bearer expired-token",
      };

      // Мокаем ошибку истечения токена
      const admin = require("../../firebase-admin-init").default;
      admin
        .auth()
        .verifyIdToken.mockRejectedValue(
          new Error("Firebase ID token has expired"),
        );

      await verifyFirebaseToken(
        mockRequest as Request,
        mockResponse as Response,
        mockNext,
      );

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: "Token expired",
        code: "TOKEN_EXPIRED",
      });
      expect(mockNext).not.toHaveBeenCalled();
    });
  });

  describe("ensureUserExists", () => {
    beforeEach(() => {
      mockRequest.firebaseUser = mockFirebaseUser;
    });

    test("should create new user if not exists", async () => {
      // Мокаем отсутствие пользователя и создание нового
      const { supabase } = require("../../supabaseClient");
      supabase.from = jest.fn(() => ({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest
          .fn()
          .mockResolvedValueOnce({ data: null, error: { code: "PGRST116" } }) // Не найден
          .mockResolvedValueOnce({
            data: mockSupabaseResponses.user.data,
            error: null,
          }), // Создан
        insert: jest.fn().mockReturnThis(),
        update: jest.fn().mockReturnThis(),
      }));

      await ensureUserExists(
        mockRequest as Request,
        mockResponse as Response,
        mockNext,
      );

      expect(mockRequest.user).toEqual(mockSupabaseResponses.user.data);
      expect(mockRequest.userId).toBe(mockSupabaseResponses.user.data.id);
      expect(mockNext).toHaveBeenCalled();
      expect(mockResponse.status).not.toHaveBeenCalled();
    });

    test("should update existing user last_login_at", async () => {
      // Мокаем существующего пользователя
      const { supabase } = require("../../supabaseClient");
      supabase.from = jest.fn(() => ({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: mockSupabaseResponses.user.data,
          error: null,
        }),
        update: jest.fn().mockReturnThis(),
      }));

      await ensureUserExists(
        mockRequest as Request,
        mockResponse as Response,
        mockNext,
      );

      expect(mockRequest.user).toEqual(mockSupabaseResponses.user.data);
      expect(mockNext).toHaveBeenCalled();

      // Проверяем, что update был вызван для обновления last_login_at
      expect(supabase.from().update).toHaveBeenCalled();
    });

    test("should handle database errors", async () => {
      // Мокаем ошибку базы данных
      const { supabase } = require("../../supabaseClient");
      supabase.from = jest.fn(() => ({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: null,
          error: { message: "Database connection failed" },
        }),
      }));

      await ensureUserExists(
        mockRequest as Request,
        mockResponse as Response,
        mockNext,
      );

      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: "Database error while managing user",
        code: "USER_MANAGEMENT_ERROR",
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    test("should handle missing firebaseUser", async () => {
      mockRequest.firebaseUser = undefined;

      await ensureUserExists(
        mockRequest as Request,
        mockResponse as Response,
        mockNext,
      );

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: "Firebase user not verified",
        code: "FIREBASE_USER_MISSING",
      });
      expect(mockNext).not.toHaveBeenCalled();
    });
  });

  describe("authenticateUser", () => {
    test("should complete full authentication flow", async () => {
      const validToken = generateMockFirebaseToken();
      mockRequest.headers = {
        authorization: `Bearer ${validToken}`,
      };

      // Мокаем успешную аутентификацию
      const admin = require("../../firebase-admin-init").default;
      admin.auth().verifyIdToken.mockResolvedValue(mockFirebaseUser);

      const { supabase } = require("../../supabaseClient");
      supabase.from = jest.fn(() => ({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: mockSupabaseResponses.user.data,
          error: null,
        }),
        update: jest.fn().mockReturnThis(),
      }));

      await authenticateUser(
        mockRequest as Request,
        mockResponse as Response,
        mockNext,
      );

      expect(mockRequest.firebaseUser).toEqual(mockFirebaseUser);
      expect(mockRequest.user).toEqual(mockSupabaseResponses.user.data);
      expect(mockRequest.userId).toBe(mockSupabaseResponses.user.data.id);
      expect(mockNext).toHaveBeenCalled();
      expect(mockResponse.status).not.toHaveBeenCalled();
    });

    test("should handle token verification failure", async () => {
      mockRequest.headers = {
        authorization: "Bearer invalid-token",
      };

      const admin = require("../../firebase-admin-init").default;
      admin.auth().verifyIdToken.mockRejectedValue(new Error("Invalid token"));

      await authenticateUser(
        mockRequest as Request,
        mockResponse as Response,
        mockNext,
      );

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockNext).not.toHaveBeenCalled();
    });

    test("should handle user management failure", async () => {
      const validToken = generateMockFirebaseToken();
      mockRequest.headers = {
        authorization: `Bearer ${validToken}`,
      };

      // Успешная верификация токена
      const admin = require("../../firebase-admin-init").default;
      admin.auth().verifyIdToken.mockResolvedValue(mockFirebaseUser);

      // Ошибка при работе с пользователем
      const { supabase } = require("../../supabaseClient");
      supabase.from = jest.fn(() => ({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: null,
          error: { message: "Database error" },
        }),
      }));

      await authenticateUser(
        mockRequest as Request,
        mockResponse as Response,
        mockNext,
      );

      expect(mockRequest.firebaseUser).toEqual(mockFirebaseUser);
      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockNext).not.toHaveBeenCalled();
    });
  });

  describe("Error Message Handling", () => {
    test("should categorize Firebase auth errors correctly", async () => {
      const testCases = [
        {
          error: "Firebase ID token has expired",
          expectedCode: "TOKEN_EXPIRED",
          expectedMessage: "Token expired",
        },
        {
          error: "Firebase ID token has invalid signature",
          expectedCode: "INVALID_TOKEN",
          expectedMessage: "Invalid Firebase token",
        },
        {
          error: "Token used too early",
          expectedCode: "INVALID_TOKEN",
          expectedMessage: "Invalid Firebase token",
        },
        {
          error: "Some other error",
          expectedCode: "AUTH_ERROR",
          expectedMessage: "Authentication failed",
        },
      ];

      for (const testCase of testCases) {
        jest.clearAllMocks();

        mockRequest.headers = {
          authorization: "Bearer test-token",
        };

        const admin = require("../../firebase-admin-init").default;
        admin.auth().verifyIdToken.mockRejectedValue(new Error(testCase.error));

        await verifyFirebaseToken(
          mockRequest as Request,
          mockResponse as Response,
          mockNext,
        );

        expect(mockResponse.json).toHaveBeenCalledWith({
          error: testCase.expectedMessage,
          code: testCase.expectedCode,
        });
      }
    });
  });
});
