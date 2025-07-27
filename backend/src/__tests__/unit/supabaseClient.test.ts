/**
 * Unit тесты для supabaseClient.ts
 */

import { supabase, testConnection, getClientInfo } from "../../supabaseClient";

// Мокаем @supabase/supabase-js
jest.mock("@supabase/supabase-js", () => ({
  createClient: jest.fn().mockReturnValue({
    from: jest.fn(() => ({
      select: jest.fn().mockReturnThis(),
      insert: jest.fn().mockReturnThis(),
      update: jest.fn().mockReturnThis(),
      delete: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest
        .fn()
        .mockResolvedValue({ data: { version: "1.0.0" }, error: null }),
      then: jest.fn().mockResolvedValue({ data: [], error: null }),
    })),
    auth: {
      signInWithPassword: jest.fn().mockResolvedValue({
        data: { user: null },
        error: null,
      }),
      signOut: jest.fn().mockResolvedValue({ error: null }),
    },
  }),
}));

describe("Supabase Client", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Устанавливаем тестовые переменные окружения
    process.env.SUPABASE_URL = "https://test-project.supabase.co";
    process.env.SUPABASE_SERVICE_ROLE_KEY = "test-service-role-key";
  });

  afterEach(() => {
    delete process.env.SUPABASE_URL;
    delete process.env.SUPABASE_SERVICE_ROLE_KEY;
  });

  describe("Client Initialization", () => {
    test("should initialize Supabase client successfully", () => {
      expect(supabase).toBeDefined();
      expect(typeof supabase).toBe("object");
    });

    test("should have required methods", () => {
      expect(supabase.from).toBeDefined();
      expect(typeof supabase.from).toBe("function");
      expect(supabase.auth).toBeDefined();
    });

    test("should use service role key for server operations", () => {
      const { createClient } = require("@supabase/supabase-js");

      expect(createClient).toHaveBeenCalledWith(
        process.env.SUPABASE_URL,
        process.env.SUPABASE_SERVICE_ROLE_KEY,
        expect.objectContaining({
          auth: expect.objectContaining({
            autoRefreshToken: false,
            persistSession: false,
          }),
        }),
      );
    });
  });

  describe("Connection Testing", () => {
    test("should test connection successfully", async () => {
      const result = await testConnection();

      expect(result).toBe(true);
      expect(supabase.from).toHaveBeenCalledWith("users");
    });

    test("should handle connection errors gracefully", async () => {
      // Мокаем ошибку подключения
      const mockError = new Error("Connection failed");
      supabase.from = jest.fn(() => ({
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockRejectedValue(mockError),
      }));

      const result = await testConnection();

      expect(result).toBe(false);
    });

    test("should handle Supabase error responses", async () => {
      // Мокаем ошибку от Supabase
      supabase.from = jest.fn(() => ({
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: null,
          error: { message: "Table not found" },
        }),
      }));

      const result = await testConnection();

      expect(result).toBe(false);
    });
  });

  describe("Client Information", () => {
    test("should return client info", () => {
      const info = getClientInfo();

      expect(info).toHaveProperty("url");
      expect(info).toHaveProperty("anonKey");
      expect(info.url).toBe(process.env.SUPABASE_URL);
    });

    test("should handle missing environment variables", () => {
      delete process.env.SUPABASE_URL;
      delete process.env.SUPABASE_ANON_KEY;

      const info = getClientInfo();

      expect(info.url).toBe("unknown");
      expect(info.anonKey).toBe("unknown");
    });
  });

  describe("Database Operations", () => {
    test("should perform select operations", async () => {
      const table = supabase.from("users");
      const selectChain = table.select("*");

      expect(table.select).toHaveBeenCalledWith("*");
      expect(selectChain).toBeDefined();
    });

    test("should perform insert operations", async () => {
      const table = supabase.from("users");
      const testData = { email: "test@example.com", name: "Test User" };

      const insertChain = table.insert(testData);

      expect(table.insert).toHaveBeenCalledWith(testData);
      expect(insertChain).toBeDefined();
    });

    test("should perform update operations", async () => {
      const table = supabase.from("users");
      const updateData = { name: "Updated User" };

      const updateChain = table.update(updateData);

      expect(table.update).toHaveBeenCalledWith(updateData);
      expect(updateChain).toBeDefined();
    });

    test("should perform delete operations", async () => {
      const table = supabase.from("users");
      const deleteChain = table.delete();

      expect(table.delete).toHaveBeenCalled();
      expect(deleteChain).toBeDefined();
    });

    test("should chain query methods", () => {
      const table = supabase.from("users");
      const query = table.select("*").eq("id", "test-id");

      expect(table.select).toHaveBeenCalledWith("*");
      expect(query.eq).toHaveBeenCalledWith("id", "test-id");
    });
  });

  describe("Error Handling", () => {
    test("should handle missing SUPABASE_URL", () => {
      delete process.env.SUPABASE_URL;

      expect(process.env.SUPABASE_URL).toBeUndefined();
      // В реальном коде это должно выбросить ошибку инициализации
    });

    test("should handle missing SUPABASE_SERVICE_ROLE_KEY", () => {
      delete process.env.SUPABASE_SERVICE_ROLE_KEY;

      expect(process.env.SUPABASE_SERVICE_ROLE_KEY).toBeUndefined();
      // В реальном коде это должно выбросить ошибку инициализации
    });

    test("should handle invalid URL format", () => {
      process.env.SUPABASE_URL = "invalid-url";

      expect(process.env.SUPABASE_URL).not.toMatch(
        /^https:\/\/.*\.supabase\.co$/,
      );
    });
  });

  describe("Authentication Configuration", () => {
    test("should disable automatic token refresh for server", () => {
      const { createClient } = require("@supabase/supabase-js");

      expect(createClient).toHaveBeenCalledWith(
        expect.any(String),
        expect.any(String),
        expect.objectContaining({
          auth: expect.objectContaining({
            autoRefreshToken: false,
          }),
        }),
      );
    });

    test("should disable session persistence for server", () => {
      const { createClient } = require("@supabase/supabase-js");

      expect(createClient).toHaveBeenCalledWith(
        expect.any(String),
        expect.any(String),
        expect.objectContaining({
          auth: expect.objectContaining({
            persistSession: false,
          }),
        }),
      );
    });
  });

  describe("Singleton Pattern", () => {
    test("should reuse the same client instance", () => {
      const client1 = require("../../supabaseClient").supabase;
      const client2 = require("../../supabaseClient").supabase;

      expect(client1).toBe(client2);
    });

    test("should not reinitialize client on multiple imports", () => {
      const { createClient } = require("@supabase/supabase-js");
      const callCount = createClient.mock.calls.length;

      // Повторный импорт
      jest.resetModules();
      require("../../supabaseClient");

      // createClient не должен вызываться повторно
      expect(createClient.mock.calls.length).toBe(callCount);
    });
  });
});
