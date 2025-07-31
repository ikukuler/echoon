import { createClient, SupabaseClient } from "@supabase/supabase-js";

let supabaseClient: SupabaseClient | null = null;

interface ClientInfo {
  url: string;
  hasServiceRole: boolean;
  authSettings: {
    autoRefreshToken: boolean;
    persistSession: boolean;
  };
}

function initializeSupabaseClient(): SupabaseClient {
  // Проверяем, что клиент уже не инициализирован
  if (supabaseClient) {
    console.log("Supabase client already initialized");
    return supabaseClient;
  }

  // Проверяем наличие необходимых переменных окружения
  if (!process.env.SUPABASE_URL) {
    console.error("SUPABASE_URL environment variable is not set");
    throw new Error("SUPABASE_URL environment variable is required");
  }

  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.error("SUPABASE_SERVICE_ROLE_KEY environment variable is not set");
    throw new Error(
      "SUPABASE_SERVICE_ROLE_KEY environment variable is required",
    );
  }

  try {
    // Валидируем URL
    const supabaseUrl = process.env.SUPABASE_URL;
    if (
      !supabaseUrl.startsWith("https://") ||
      !supabaseUrl.includes("supabase.co")
    ) {
      throw new Error(
        "Invalid SUPABASE_URL format. Expected format: https://your-project.supabase.co",
      );
    }

    // Валидируем ключ
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!serviceRoleKey.startsWith("eyJ") || serviceRoleKey.length < 100) {
      throw new Error(
        "Invalid SUPABASE_SERVICE_ROLE_KEY format. Expected a valid JWT token",
      );
    }

    // Создаем Supabase клиент с Service Role ключом
    supabaseClient = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
      // Дополнительные опции для серверной среды
      global: {
        headers: {
          "x-application-name": "echoon-backend",
          // "x-role": "service_role",
          // Authorization: `Bearer ${serviceRoleKey}`,
        },
        fetch: async (url, options) => {
          console.log("📤 Supabase Request:");
          console.log("URL:", url);
          console.log("Method:", options?.method);
          console.log("Headers:", options?.headers);
          if (options?.body) {
            console.log("Body:", options.body.toString());
          }

          const res = await fetch(url, options);

          console.log("📥 Supabase Response:", res.status, res.statusText);
          return res;
        },
      },
    });

    console.log("Supabase client initialized successfully");
    console.log(
      `Connected to: ${supabaseUrl.replace(/https:\/\//, "").split(".")[0]}`,
    );

    return supabaseClient;
  } catch (error: unknown) {
    console.error(
      "Supabase client initialization error:",
      error instanceof Error ? error.message : "Unknown error",
    );
    throw error;
  }
}

// Функция для загрузки файла в Supabase Storage
async function uploadFileToStorage(
  fileBuffer: Buffer,
  fileName: string,
  contentType: string,
  userId: string,
): Promise<{ url: string; path: string }> {
  try {
    const client = supabase;

    // Создаем уникальный путь для файла
    const fileExtension = fileName.split(".").pop();
    const uniqueFileName = `${userId}/${Date.now()}-${Math.random()
      .toString(36)
      .substring(7)}.${fileExtension}`;

    console.log(
      `Attempting to upload file to bucket 'media': ${uniqueFileName}`,
    );

    // Загружаем файл в Supabase Storage
    const { data, error } = await client.storage
      .from("media")
      .upload(uniqueFileName, fileBuffer, {
        contentType: contentType,
        upsert: false,
      });

    if (error) {
      console.error("Supabase Storage upload error:", error);
      throw new Error(`Failed to upload file: ${error.message}`);
    }

    // Получаем публичный URL
    const { data: urlData } = client.storage
      .from("media")
      .getPublicUrl(uniqueFileName);

    console.log(`File uploaded successfully: ${uniqueFileName}`);
    console.log(`Public URL: ${urlData.publicUrl}`);

    console.log(`File uploaded successfully: ${uniqueFileName}`);

    return {
      url: urlData.publicUrl,
      path: uniqueFileName,
    };
  } catch (error) {
    console.error("Upload file error:", error);
    throw error;
  }
}

// Функция для тестирования подключения
async function testSupabaseConnection(): Promise<boolean> {
  try {
    if (!supabaseClient) {
      throw new Error("Supabase client not initialized");
    }

    // Простой запрос для проверки подключения
    const { data, error } = await supabaseClient
      .from("echoes")
      .select("count", { count: "exact", head: true });

    if (error) {
      console.warn("Supabase connection test failed:", error.message);
      return false;
    }

    console.log("✅ Supabase connection test successful");
    return true;
  } catch (error: unknown) {
    console.warn(
      "Supabase connection test error:",
      error instanceof Error ? error.message : "Unknown error",
    );
    return false;
  }
}

// Функция для получения информации о клиенте
function getClientInfo(): ClientInfo | null {
  if (!supabaseClient) {
    return null;
  }

  return {
    url: process.env.SUPABASE_URL || "unknown",
    hasServiceRole: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
    authSettings: {
      autoRefreshToken: false,
      persistSession: false,
    },
  };
}

// Инициализируем клиент при импорте модуля
const client = initializeSupabaseClient();

export const supabase = client;
export const testConnection = async () => {
  console.log("🧪 TEST CONNECTION");
  const supabaseOk = await testSupabaseConnection();
  const clientInfo = getClientInfo();
  console.log("🧪 CLIENT INFO", clientInfo);
  return {
    supabase: supabaseOk,
    clientInfo: clientInfo,
  };
};
export { getClientInfo, uploadFileToStorage };
