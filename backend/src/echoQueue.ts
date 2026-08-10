import { Queue, Worker, Job } from "bullmq";
import Redis from "ioredis";
import admin from "./firebase-admin-init";
import { supabase } from "./supabaseClient";
import {
  EchoJobData,
  EchoJobResult,
  FCMTokenInfo,
  PushNotificationResult,
  Echo,
  EchoPart,
  UserToken,
  EchoPartType,
} from "./types";

// Настройка Redis подключения для Docker и локальной разработки
const redisOptions: any = {
  // host: process.env.REDIS_HOST || "localhost",
  // port: parseInt(process.env.REDIS_PORT || "6379"),
  maxRetriesPerRequest: null, // BullMQ требует null
  connectTimeout: 30000, // Увеличено для Docker
  commandTimeout: 30000, // Увеличено для Docker
  lazyConnect: true, // Не подключаться до первой команды
  keepAlive: 30000, // Keep-alive для стабильного соединения
  retryStrategy: (times: number) => {
    const delay = Math.min(times * 200, 10000);
    console.log(`🔄 Redis retry attempt ${times}, waiting ${delay}ms`);
    return times > 15 ? null : delay; // Прекратить после 15 попыток
  },
  reconnectOnError: (err: Error) => {
    console.log("🔌 Redis reconnecting due to error:", err.message);
    return true;
  },
};

// Если есть REDIS_URL, используем его, иначе используем host/port
// TLS включаем только для rediss:// (например, Aiven) - локальный Redis/Valkey его не поддерживает
if (process.env.REDIS_URL) {
  if (process.env.REDIS_URL.startsWith("rediss://")) {
    redisOptions.tls = {};
  }
  console.log("🐳 Using REDIS_URL for connection");
}

const redisConnection = new Redis(process.env.REDIS_URL!, redisOptions);

// Обработчики событий Redis с улучшенным логированием
redisConnection.on("connect", () => {
  console.log(
    `✅ Redis connected to ${process.env.REDIS_HOST || "localhost"}:${
      process.env.REDIS_PORT || "6379"
    }`,
  );
});

redisConnection.on("ready", () => {
  console.log("🚀 Redis ready for commands");
});

redisConnection.on("error", (err: Error) => {
  console.error("❌ Redis connection error:", err.message);
  console.error(
    `🔍 Trying to connect to: ${process.env.REDIS_HOST || "localhost"}:${
      process.env.REDIS_PORT || "6379"
    }`,
  );

  if (err.message.includes("ECONNREFUSED")) {
    console.error("💡 Hint: Check if Redis container is running");
  }
  if (err.message.includes("timeout")) {
    console.error("⏰ Hint: Redis might be slow to respond, retrying...");
  }
});

redisConnection.on("close", () => {
  console.log("🔌 Redis connection closed");
});

redisConnection.on("reconnecting", () => {
  console.log("🔄 Redis reconnecting...");
});

// Создание очереди для echo заданий с задержкой для Docker
const createQueue = async (): Promise<Queue<EchoJobData>> => {
  // Ждем готовности Redis в Docker окружении
  if (process.env.REDIS_HOST && process.env.REDIS_HOST !== "localhost") {
    console.log("🐳 Docker environment detected, waiting for Redis...");
    let retries = 0;
    const maxRetries = 15;

    while (retries < maxRetries) {
      try {
        await redisConnection.ping();
        console.log("✅ Redis ping successful, creating queue...");
        break;
      } catch (error) {
        retries++;
        console.log(`⏳ Waiting for Redis... attempt ${retries}/${maxRetries}`);
        if (retries < maxRetries) {
          await new Promise((resolve) => setTimeout(resolve, 1000));
        }
      }
    }

    if (retries === maxRetries) {
      console.error("❌ Failed to connect to Redis after multiple attempts");
      throw new Error("Redis connection timeout");
    }
  }

  return new Queue<EchoJobData>("echoQueue", {
    connection: redisConnection,
    defaultJobOptions: {
      removeOnComplete: 100, // Оставляем 100 завершенных заданий
      removeOnFail: 50, // Оставляем 50 неудачных заданий
      attempts: 3, // 3 попытки выполнения
      backoff: {
        type: "exponential",
        delay: 2000,
      },
    },
  });
};

// Создаем очередь асинхронно
let echoQueue: Queue<EchoJobData>;
const queuePromise = createQueue()
  .then((queue) => {
    echoQueue = queue;
    console.log("🎯 Echo queue created successfully");
    return queue;
  })
  .catch((error) => {
    console.error("❌ Failed to create queue:", error.message);
    throw error;
  });

// Расширенный тип Echo с частями
interface EchoWithParts extends Echo {
  echo_parts: EchoPart[];
}

// Функция для получения FCM токенов пользователя
async function getUserFCMTokens(userId: string): Promise<FCMTokenInfo[]> {
  try {
    const { data: tokens, error } = await supabase
      .from("user_tokens")
      .select("fcm_token, device_id, is_active")
      .eq("user_id", userId)
      .eq("is_active", true);

    if (error) {
      console.error("Error fetching user FCM tokens:", error);
      return [];
    }

    return (
      tokens?.map((token: any) => ({
        token: token.fcm_token,
        deviceId: token.device_id,
      })) || []
    );
  } catch (error: unknown) {
    console.error("Unexpected error fetching FCM tokens:", error);
    return [];
  }
}

// Функция для отправки push уведомления
async function sendPushNotification(
  tokens: FCMTokenInfo[],
  title: string,
  body: string,
  data: Record<string, string> = {},
): Promise<PushNotificationResult> {
  if (!tokens || tokens.length === 0) {
    console.log("No FCM tokens provided, skipping notification");
    return { success: false, reason: "no_tokens", totalTokens: 0 };
  }

  try {
    const messages = tokens.map((tokenInfo) => ({
      notification: {
        title,
        body,
      },
      data: {
        ...data,
        timestamp: new Date().toISOString(),
        // Добавляем данные для навигации
        echoId: data.echoId || "",
        type: data.type || "",
        partsCount: data.partsCount || "",
      },
      token: tokenInfo.token,
      android: {
        priority: "high" as const,
        notification: {
          sound: "default",
        },
      },
      apns: {
        payload: {
          aps: {
            sound: "default",
            badge: 1,
          },
        },
      },
    }));

    console.log(`Sending push notifications to ${messages.length} devices`);

    // Отправляем уведомления батчами
    const results = await Promise.allSettled(
      messages.map((message) => admin.messaging().send(message)),
    );

    let successCount = 0;
    let failureCount = 0;
    const failures: Array<{
      deviceId: string | null;
      token: string;
      error: string;
    }> = [];

    results.forEach((result, index) => {
      if (result.status === "fulfilled") {
        console.log(
          `✅ Push sent successfully to device ${tokens[index]?.deviceId}: ${result.value}`,
        );
        successCount++;
      } else {
        console.error(
          `❌ Push failed for device ${tokens[index]?.deviceId}:`,
          result.reason,
        );
        failureCount++;
        failures.push({
          deviceId: tokens[index]?.deviceId || null,
          token: tokens[index]?.token || "",
          error: result.reason?.message || String(result.reason),
        });
      }
    });

    // Деактивируем недействительные токены
    for (const failure of failures) {
      if (
        failure.error.includes("registration-token-not-registered") ||
        failure.error.includes("invalid-registration-token")
      ) {
        console.log(
          `Deactivating invalid token for device ${failure.deviceId}`,
        );
        await supabase
          .from("user_tokens")
          .update({ is_active: false, updated_at: new Date().toISOString() })
          .eq("fcm_token", failure.token);
      }
    }

    return {
      success: successCount > 0,
      successCount,
      failureCount,
      totalTokens: tokens.length,
      failures,
    };
  } catch (error: unknown) {
    console.error("Error sending push notifications:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
      totalTokens: tokens.length,
    };
  }
}

// Функция для форматирования сообщения из частей
function formatMessageFromParts(parts: EchoPart[]): string {
  return parts
    .sort((a, b) => a.order_index - b.order_index)
    .map((part) => {
      if (part.type === "text") {
        return part.content;
      }
      return "";
    })
    .join(" ");
}

// Обработчик заданий в очереди
const echoWorker = new Worker<EchoJobData, EchoJobResult>(
  "echoQueue",
  async (job: Job<EchoJobData>) => {
    const { echoId, userId } = job.data;
    const jobId = job.id;

    console.log(
      `[Job ${jobId}] Processing echo notification for echo ${echoId}, user ${userId}`,
    );

    try {
      // 1. Получаем данные echo с частями
      const { data: echo, error: echoError } = await supabase
        .from("echoes")
        .select(
          `
        id,
        user_id,
        return_at,
        created_at,
        echo_parts (
          id,
          type,
          content,
          order_index
        )
      `,
        )
        .eq("id", echoId)
        .single();

      if (echoError || !echo) {
        throw new Error(
          `Echo not found: ${echoError?.message || "Unknown error"}`,
        );
      }

      const echoWithParts = echo as EchoWithParts;
      console.log(
        `[Job ${jobId}] Found echo with ${
          echoWithParts.echo_parts?.length || 0
        } parts`,
      );

      // 2. Получаем FCM токены пользователя
      const userTokens = await getUserFCMTokens(userId);

      if (userTokens.length === 0) {
        console.log(`[Job ${jobId}] No active FCM tokens for user ${userId}`);
        return {
          success: false,
          echoId,
          userId,
          messageContent: "",
          pushResult: {
            success: false,
            reason: "no_active_tokens",
            totalTokens: 0,
          },
        };
      }

      console.log(
        `[Job ${jobId}] Found ${userTokens.length} active FCM tokens`,
      );

      // 3. Формируем сообщение из частей
      const sortedParts = echoWithParts.echo_parts || [];
      const messageContent = formatMessageFromParts(sortedParts);

      // 4. Отправляем push уведомление
      const pushResult = await sendPushNotification(
        userTokens,
        "Echo Reminder", // Заголовок
        messageContent, // Тело сообщения
        {
          echoId: echoWithParts.id,
          type: "echo_reminder",
          partsCount: sortedParts.length.toString(),
        },
      );

      console.log(
        `[Job ${jobId}] Push notification result:`,
        JSON.stringify(pushResult),
      );

      // 5. Логируем результат в базу (опционально)
      // try {
      //   await supabase.from("notification_logs").insert({
      //     echo_id: echoId,
      //     user_id: userId,
      //     notification_type: "push",
      //     status: pushResult.success ? "sent" : "failed",
      //     tokens_targeted: pushResult.totalTokens,
      //     tokens_successful: pushResult.successCount || 0,
      //     error_details: pushResult.error || null,
      //     sent_at: new Date().toISOString(),
      //   });
      // } catch (logError: unknown) {
      //   console.warn(
      //     `[Job ${jobId}] Failed to log notification result:`,
      //     logError,
      //   );
      //   // Не прерываем выполнение из-за ошибки логирования
      // }

      return {
        success: pushResult.success,
        echoId,
        userId,
        messageContent: messageContent.substring(0, 100) + "...",
        pushResult,
      };
    } catch (error: unknown) {
      console.error(
        `[Job ${jobId}] Error processing echo notification:`,
        error,
      );
      throw error; // Повторный запуск задания
    }
  },
  {
    connection: redisConnection,
    concurrency: 5, // Одновременно обрабатываем до 5 заданий
    limiter: {
      max: 10, // Максимум 10 заданий
      duration: 1000, // за 1 секунду
    },
  },
);

// Обработчики событий worker'а
echoWorker.on("completed", (job: Job<EchoJobData>, result: EchoJobResult) => {
  console.log(`✅ Echo job ${job.id} completed successfully:`, result);
});

echoWorker.on("failed", (job: Job<EchoJobData> | undefined, err: Error) => {
  console.error(`❌ Echo job ${job?.id} failed:`, err.message);
});

echoWorker.on("error", (err: Error) => {
  console.error("Echo worker error:", err);
});

// Функция для добавления задания в очередь
async function scheduleEchoNotification(
  echoId: string,
  userId: string,
  returnAt: string,
): Promise<Job<EchoJobData>> {
  try {
    // Ждем готовности очереди
    await queuePromise;

    const delay = new Date(returnAt).getTime() - Date.now();

    if (delay <= 0) {
      console.log(
        `Echo ${echoId} return time is in the past, executing immediately`,
      );
    }

    const job = await echoQueue.add(
      "echo-notification",
      { echoId, userId },
      {
        delay: Math.max(delay, 0),
        jobId: `echo-${echoId}`, // Уникальный ID для избежания дублирования
        removeOnComplete: true,
        removeOnFail: false,
      },
    );

    console.log(
      `📅 Scheduled echo notification job ${job.id} for ${returnAt} (delay: ${delay}ms)`,
    );
    return job;
  } catch (error: unknown) {
    console.error("Error scheduling echo notification:", error);
    throw error;
  }
}

// Функция для отмены задания
async function cancelEchoNotification(echoId: string): Promise<boolean> {
  try {
    const jobId = `echo-${echoId}`;
    const job = await echoQueue.getJob(jobId);

    if (job) {
      await job.remove();
      console.log(`🗑️ Cancelled echo notification job for echo ${echoId}`);
      return true;
    } else {
      console.log(`Job for echo ${echoId} not found`);
      return false;
    }
  } catch (error: unknown) {
    console.error("Error cancelling echo notification:", error);
    throw error;
  }
}

// Graceful shutdown
process.on("SIGINT", async () => {
  console.log("Shutting down echo queue and worker...");
  await echoWorker.close();
  await echoQueue.close();
  await redisConnection.disconnect();
  process.exit(0);
});

export {
  echoQueue,
  queuePromise,
  echoWorker,
  scheduleEchoNotification,
  cancelEchoNotification,
  sendPushNotification,
  getUserFCMTokens,
};
