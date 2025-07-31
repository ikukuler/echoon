#!/usr/bin/env tsx

/**
 * Скрипт для тестирования подключений к Firebase и Supabase
 * Запуск: tsx src/test-connections.ts
 */

import "dotenv/config";

async function testConnections(): Promise<void> {
  console.log("🔧 Тестирование подключений EchoOn Backend\n");

  // Тестируем Firebase
  console.log("🔥 Тестирование Firebase Admin SDK...");
  try {
    const admin = await import("./firebase-admin-init");
    const app = admin.default;
    console.log(
      `✅ Firebase: Успешно подключен к проекту "${
        app.options.projectId || "unknown"
      }"`,
    );
  } catch (error: unknown) {
    console.log(
      `❌ Firebase: Ошибка подключения - ${
        error instanceof Error ? error.message : "Unknown error"
      }`,
    );
  }

  // Тестируем Supabase
  console.log("\n📊 Тестирование Supabase...");
  try {
    const { supabase, testConnection, getClientInfo } = await import(
      "./supabaseClient"
    );

    const clientInfo = getClientInfo();
    console.log(`📡 Supabase URL: ${clientInfo?.url || "не настроен"}`);

    const isConnected = await testConnection();
    if (isConnected) {
      console.log("✅ Supabase: Подключение успешно");

      // Дополнительные проверки
      const { data: tables, error } = await supabase
        .from("information_schema.tables")
        .select("table_name")
        .eq("table_schema", "public")
        .in("table_name", ["echoes", "echo_parts", "users", "user_tokens"]);

      if (!error && tables) {
        const tableNames = tables.map((t: any) => t.table_name);
        console.log(`📋 Найдены таблицы: ${tableNames.join(", ")}`);

        const requiredTables = ["echoes", "echo_parts", "users", "user_tokens"];
        const missingTables = requiredTables.filter(
          (table) => !tableNames.includes(table),
        );

        if (missingTables.length === 0) {
          console.log("✅ Все необходимые таблицы присутствуют");
        } else {
          console.log(
            `⚠️  Отсутствуют таблицы: ${missingTables.join(
              ", ",
            )}. Выполните SQL из database.sql`,
          );
        }
      }
    } else {
      console.log("❌ Supabase: Не удалось подключиться");
    }
  } catch (error: unknown) {
    console.log(
      `❌ Supabase: Ошибка подключения - ${
        error instanceof Error ? error.message : "Unknown error"
      }`,
    );
  }

  // Тестируем Redis/BullMQ
  console.log("\n🔴 Тестирование Redis/BullMQ...");
  try {
    const { echoQueue } = await import("./echoQueue");
    await echoQueue.getWaiting();
    console.log("✅ Redis/BullMQ: Подключение успешно");
  } catch (error: unknown) {
    console.log(
      `❌ Redis/BullMQ: Ошибка подключения - ${
        error instanceof Error ? error.message : "Unknown error"
      }`,
    );
  }

  console.log("\n✨ Тестирование завершено!");
  console.log("\n💡 Для запуска сервера выполните: npm run dev");
}

// Запускаем тесты
testConnections().catch(console.error);
