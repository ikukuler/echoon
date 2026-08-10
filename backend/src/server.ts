import "dotenv/config";
import crypto from "crypto";
import express, { Request, Response, NextFunction } from "express";
import cors from "cors";
import multer from "multer";
import { createBullBoard } from "@bull-board/api";
import { BullMQAdapter } from "@bull-board/api/bullMQAdapter";
import { ExpressAdapter } from "@bull-board/express";
import {
  supabase,
  testConnection as testSupabaseConnection,
  uploadFileToStorage,
} from "./supabaseClient";
import { scheduleEchoNotification, queuePromise } from "./echoQueue";
import {
  authenticateUser,
  verifyTokenOnly,
  AuthenticatedRequest,
} from "./authMiddleware";
import { authService } from "./authService";
import {
  globalLimiter,
  createEchoLimiter,
  tokenRegistrationLimiter,
  readLimiter,
  profileUpdateLimiter,
  healthCheckLimiter,
} from "./rateLimitMiddleware";
import {
  CreateEchoRequest,
  CreateEchoResponse,
  UserProfileResponse,
  UpdateProfileRequest,
  RegisterTokenRequest,
  RegisterTokenResponse,
  GetEchoesQuery,
  GetEchoesResponse,
  HealthCheckResponse,
  ApiError,
  EchoPartType,
  User,
  Echo,
  EchoPart,
  EchoJobData,
} from "./types";

const app = express();
const PORT = process.env.PORT || 3000;

// Настройка multer для обработки файлов в памяти
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    // Разрешаем только изображения и аудио
    if (
      file.mimetype.startsWith("image/") ||
      file.mimetype.startsWith("audio/")
    ) {
      cb(null, true);
    } else {
      cb(new Error("Only images and audio files are allowed"));
    }
  },
});

// Bull Board setup - асинхронная инициализация
const serverAdapter = new ExpressAdapter();
serverAdapter.setBasePath("/admin/queues");

// Инициализируем Bull Board после создания очереди
let bullBoardInitialized = false;
queuePromise
  .then((echoQueue: any) => {
    createBullBoard({
      queues: [new BullMQAdapter(echoQueue)],
      serverAdapter: serverAdapter,
    });
    bullBoardInitialized = true;
    console.log("📊 Bull Board initialized successfully");
  })
  .catch((error: Error) => {
    console.error("❌ Failed to initialize Bull Board:", error.message);
  });

// Middleware
app.use(cors());
app.use(express.json());

// Trust proxy for accurate IP addresses (важно для rate limiting)
app.set("trust proxy", 1);

// Basic Auth для Bull Board UI - без учётных данных в env доступ полностью закрыт
function timingSafeStringEqual(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) {
    // Сравниваем с буфером той же длины, чтобы не выдавать длину секрета через тайминг
    crypto.timingSafeEqual(bufA, bufA);
    return false;
  }
  return crypto.timingSafeEqual(bufA, bufB);
}

function bullBoardAuth(req: Request, res: Response, next: NextFunction): void {
  const adminUser = process.env.BULL_BOARD_USER;
  const adminPassword = process.env.BULL_BOARD_PASSWORD;

  if (!adminUser || !adminPassword) {
    console.error(
      "❌ BULL_BOARD_USER/BULL_BOARD_PASSWORD not set - blocking access to /admin/queues",
    );
    res.status(503).json({ error: "Bull Board is not configured" });
    return;
  }

  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Basic ")) {
    res.set("WWW-Authenticate", 'Basic realm="Bull Board"');
    res.status(401).json({ error: "Authentication required" });
    return;
  }

  const decoded = Buffer.from(authHeader.substring(6), "base64").toString(
    "utf-8",
  );
  const separatorIndex = decoded.indexOf(":");
  const user = decoded.substring(0, separatorIndex);
  const password = decoded.substring(separatorIndex + 1);

  if (
    !timingSafeStringEqual(user, adminUser) ||
    !timingSafeStringEqual(password, adminPassword)
  ) {
    res.set("WWW-Authenticate", 'Basic realm="Bull Board"');
    res.status(401).json({ error: "Invalid credentials" });
    return;
  }

  next();
}

// Bull Board UI (before global rate limiter to avoid limiting admin access)
app.use("/admin/queues", bullBoardAuth, (req, res, next) => {
  if (!bullBoardInitialized) {
    return res.status(503).json({
      error: "Bull Board is initializing",
      message: "Please wait for Redis and queue initialization",
    });
  }
  return serverAdapter.getRouter()(req, res, next);
});

// Глобальный rate limiter для всех запросов
app.use(globalLimiter);

// ===== AUTH ENDPOINTS =====

// POST /api/auth/register - регистрация нового пользователя
app.post(
  "/api/auth/register",
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { email, password, name } = req.body;

      // Валидация
      if (!email || !password) {
        res.status(400).json({
          error: "Email and password are required",
          code: "MISSING_CREDENTIALS",
        });
        return;
      }

      if (password.length < 6) {
        res.status(400).json({
          error: "Password must be at least 6 characters long",
          code: "WEAK_PASSWORD",
        });
        return;
      }

      const result = await authService.register(email, password, name);

      if (result.success) {
        res.status(201).json({
          message: "User registered successfully",
          user: result.user,
          token: result.token,
        });
      } else {
        res.status(400).json({
          error: result.error,
          code: "REGISTRATION_FAILED",
        });
      }
    } catch (error) {
      console.error("Registration error:", error);
      res.status(500).json({
        error: "Internal server error",
        code: "INTERNAL_ERROR",
      });
    }
  },
);

// POST /api/auth/login - вход пользователя
app.post(
  "/api/auth/login",
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { email, password } = req.body;

      // Валидация
      if (!email || !password) {
        res.status(400).json({
          error: "Email and password are required",
          code: "MISSING_CREDENTIALS",
        });
        return;
      }

      const result = await authService.login(email, password);

      if (result.success) {
        res.json({
          message: "Login successful",
          user: result.user,
          token: result.token,
        });
      } else {
        res.status(401).json({
          error: result.error,
          code: "LOGIN_FAILED",
        });
      }
    } catch (error) {
      console.error("Login error:", error);
      res.status(500).json({
        error: "Internal server error",
        code: "INTERNAL_ERROR",
      });
    }
  },
);

// GET /api/auth/me - получить текущего пользователя
app.get(
  "/api/auth/me",
  authenticateUser,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const authReq = req as AuthenticatedRequest;
      const user = await authService.getUserById(authReq.user!.userId);

      if (!user) {
        res.status(404).json({
          error: "User not found",
          code: "USER_NOT_FOUND",
        });
        return;
      }

      res.json({
        user,
      });
    } catch (error) {
      console.error("Get current user error:", error);
      res.status(500).json({
        error: "Internal server error",
        code: "INTERNAL_ERROR",
      });
    }
  },
);

// POST /api/auth/register-token - регистрация FCM токена
app.post(
  "/api/auth/register-token",
  authenticateUser,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const authReq = req as AuthenticatedRequest;
      const { fcmToken, deviceId, deviceType } = req.body;

      if (!fcmToken) {
        res.status(400).json({
          error: "FCM token is required",
          code: "MISSING_FCM_TOKEN",
        });
        return;
      }

      // Проверяем, существует ли уже токен для этого устройства
      const { data: existingToken } = await supabase
        .from("user_tokens")
        .select("id, is_active")
        .eq("user_id", authReq.user!.userId)
        .eq("fcm_token", fcmToken)
        .single();

      console.log("existingToken", existingToken);

      if (existingToken) {
        // Обновляем существующий токен
        const { error: updateError } = await supabase
          .from("user_tokens")
          .update({
            is_active: true,
            updated_at: new Date().toISOString(),
            device_id: deviceId || null,
            device_type: deviceType || "unknown",
          })
          .eq("id", existingToken.id);

        if (updateError) {
          console.error("Error updating FCM token:", updateError);
          res.status(500).json({
            error: "Failed to update FCM token",
            code: "TOKEN_UPDATE_FAILED",
          });
          return;
        }

        res.json({
          message: "FCM token updated successfully",
          token: {
            id: existingToken.id,
            deviceId: deviceId || null,
            deviceType: deviceType || "unknown",
            isActive: true,
          },
        });
      } else {
        // Создаем новый токен
        const { data: newToken, error: insertError } = await supabase
          .from("user_tokens")
          .insert({
            user_id: authReq.user!.userId,
            fcm_token: fcmToken,
            device_id: deviceId || null,
            device_type: deviceType || "unknown",
            is_active: true,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .select()
          .single();

        if (insertError) {
          console.error("Error inserting FCM token:", insertError);
          res.status(500).json({
            error: "Failed to register FCM token",
            code: "TOKEN_INSERT_FAILED",
          });
          return;
        }

        res.status(201).json({
          message: "FCM token registered successfully",
          token: {
            id: newToken.id,
            deviceId: deviceId || null,
            deviceType: deviceType || "unknown",
            isActive: true,
          },
        });
      }
    } catch (error) {
      console.error("Register token error:", error);
      res.status(500).json({
        error: "Internal server error",
        code: "INTERNAL_ERROR",
      });
    }
  },
);

// Helper function to schedule delayed job using BullMQ
async function scheduleDelayedJob(
  echoId: string,
  userId: string,
  returnAt: string,
): Promise<void> {
  try {
    await scheduleEchoNotification(echoId, userId, returnAt);
    console.log(
      `Successfully scheduled echo ${echoId} using BullMQ for ${returnAt}`,
    );
  } catch (error: unknown) {
    console.error(`Failed to schedule echo ${echoId} with BullMQ:`, error);
    // Fallback: можно добавить альтернативную логику
    throw error;
  }
}

// Функция для генерации уникального ID запроса
function generateRequestId(): string {
  return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// Функция генерации случайной даты возврата (не более года от текущего момента)
function generateRandomReturnDate(): string {
  const now = new Date();
  const oneYearFromNow = new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000);

  // Генерируем случайную дату между сейчас и годом вперед
  const randomTime =
    now.getTime() + Math.random() * (oneYearFromNow.getTime() - now.getTime());
  const randomDate = new Date(randomTime);

  // Округляем до минут (убираем секунды и миллисекунды)
  randomDate.setSeconds(0, 0);

  return randomDate.toISOString();
}

// POST /api/echoes endpoint (protected + rate limited)
app.post(
  "/api/echoes",
  createEchoLimiter,
  authenticateUser,
  async (req: Request, res: Response): Promise<void> => {
    const requestId = generateRequestId();

    try {
      const authReq = req as AuthenticatedRequest;
      console.log(
        `[${requestId}] POST /api/echoes - Starting request processing for user ${authReq.user?.email}`,
      );

      const { return_at: returnAt, parts }: CreateEchoRequest = req.body;
      const userId = authReq.user!.userId; // Берем userId из middleware аутентификации

      // Определяем дату возврата: если не предоставлена, генерируем случайную
      const finalReturnAt = returnAt || generateRandomReturnDate();

      console.log(
        `[${requestId}] Return date: ${
          returnAt ? "user-provided" : "auto-generated"
        } - ${finalReturnAt}`,
      );

      if (!Array.isArray(parts) || parts.length === 0) {
        console.log(
          `[${requestId}] Validation error: parts must be non-empty array`,
        );
        res.status(400).json({
          error: 'Field "parts" must be a non-empty array',
          code: "INVALID_PARTS",
        } satisfies ApiError);
        return;
      }

      // Валидация структуры parts - каждый элемент должен иметь type и content
      for (let i = 0; i < parts.length; i++) {
        const part = parts[i];
        if (!part || typeof part !== "object") {
          console.log(
            `[${requestId}] Validation error: part[${i}] must be an object`,
          );
          res.status(400).json({
            error: `Part at index ${i} must be an object`,
            code: "INVALID_PART_STRUCTURE",
          } satisfies ApiError);
          return;
        }

        if (!part.type || typeof part.type !== "string") {
          console.log(
            `[${requestId}] Validation error: part[${i}].type is required`,
          );
          res.status(400).json({
            error: `Part at index ${i} must have a "type" field`,
            code: "MISSING_PART_TYPE",
          } satisfies ApiError);
          return;
        }

        if (!part.content || typeof part.content !== "string") {
          console.log(
            `[${requestId}] Validation error: part[${i}].content is required`,
          );
          res.status(400).json({
            error: `Part at index ${i} must have a "content" field`,
            code: "MISSING_PART_CONTENT",
          } satisfies ApiError);
          return;
        }

        // Валидация допустимых типов
        const allowedTypes: EchoPartType[] = ["text", "image", "audio", "link"];
        if (!allowedTypes.includes(part.type as EchoPartType)) {
          console.log(
            `[${requestId}] Validation error: part[${i}].type invalid - ${part.type}`,
          );
          res.status(400).json({
            error: `Part at index ${i} has invalid type "${
              part.type
            }". Allowed types: ${allowedTypes.join(", ")}`,
            code: "INVALID_PART_TYPE",
          } satisfies ApiError);
          return;
        }
      }

      // Проверяем, что finalReturnAt - валидная дата в будущем
      const returnDate = new Date(finalReturnAt);
      if (isNaN(returnDate.getTime())) {
        console.log(
          `[${requestId}] Validation error: returnAt invalid date format`,
        );
        res.status(400).json({
          error: "returnAt must be a valid ISO date string",
          code: "INVALID_DATE_FORMAT",
        } satisfies ApiError);
        return;
      }

      if (returnDate <= new Date()) {
        console.log(`[${requestId}] Validation error: returnAt is in the past`);
        res.status(400).json({
          error: "returnAt must be a future date",
          code: "PAST_DATE",
        } satisfies ApiError);
        return;
      }

      console.log(
        `[${requestId}] Validation passed - creating echo for user ${userId} with ${parts.length} parts`,
      );

      // Начинаем транзакционное создание (эмуляция транзакции)
      let createdEchoId: string | null = null;

      try {
        // Сохраняем echo в базу данных
        const { data: echo, error: echoError } = await supabase
          .from("echoes")
          .insert({
            user_id: userId,
            return_at: finalReturnAt,
            created_at: new Date().toISOString(),
          })
          .select()
          .single();

        if (echoError) {
          console.error(`[${requestId}] Database error creating echo:`, {
            error: echoError,
            userId,
            finalReturnAt,
          });
          res.status(500).json({
            error: "Failed to create echo",
            code: "DB_ECHO_INSERT_FAILED",
          } satisfies ApiError);
          return;
        }

        const createdEcho = echo as Echo;
        createdEchoId = createdEcho.id;
        console.log(
          `[${requestId}] Echo created successfully with ID: ${createdEchoId}`,
        );

        // Подготавливаем данные для echo_parts
        const echoParts = parts.map((part, index) => ({
          echo_id: createdEcho.id,
          type: part.type,
          content: part.content,
          order_index: index,
          created_at: new Date().toISOString(),
        }));

        console.log(`[${requestId}] Inserting ${echoParts.length} echo parts`);

        // Сохраняем части echo
        const { data: insertedParts, error: partsError } = await supabase
          .from("echo_parts")
          .insert(echoParts)
          .select();

        if (partsError) {
          console.error(`[${requestId}] Database error creating echo parts:`, {
            error: partsError,
            echoId: createdEcho.id,
            partsCount: echoParts.length,
          });

          // Откат: удаляем созданный echo
          console.log(
            `[${requestId}] Rolling back - deleting echo ${createdEcho.id}`,
          );
          const { error: deleteError } = await supabase
            .from("echoes")
            .delete()
            .eq("id", createdEcho.id);

          if (deleteError) {
            console.error(
              `[${requestId}] Failed to rollback echo deletion:`,
              deleteError,
            );
          }

          res.status(500).json({
            error: "Failed to create echo parts",
            code: "DB_PARTS_INSERT_FAILED",
          } satisfies ApiError);
          return;
        }

        const typedInsertedParts = insertedParts as EchoPart[];
        console.log(
          `[${requestId}] Successfully inserted ${typedInsertedParts.length} echo parts`,
        );

        // Ставим отложенное задание в очередь BullMQ
        console.log(
          `[${requestId}] Scheduling delayed job for ${finalReturnAt}`,
        );
        await scheduleDelayedJob(createdEcho.id, userId, finalReturnAt);

        console.log(`[${requestId}] Echo creation completed successfully`);

        const response: CreateEchoResponse = {
          message: "Echo created successfully",
          echo: {
            id: createdEcho.id,
            user_id: userId,
            return_at: createdEcho.return_at,
            parts_count: parts.length,
            parts: typedInsertedParts.map((part) => ({
              id: part.id,
              type: part.type,
              content: part.content,
              order_index: part.order_index,
            })),
          },
        };

        res.status(201).json(response);
      } catch (dbError: unknown) {
        console.error(`[${requestId}] Unexpected database error:`, dbError);

        // Попытка отката, если echo был создан
        if (createdEchoId) {
          console.log(
            `[${requestId}] Attempting cleanup of echo ${createdEchoId}`,
          );
          try {
            await supabase.from("echoes").delete().eq("id", createdEchoId);
            console.log(`[${requestId}] Cleanup completed`);
          } catch (cleanupError: unknown) {
            console.error(`[${requestId}] Cleanup failed:`, cleanupError);
          }
        }

        throw dbError;
      }
    } catch (error: unknown) {
      console.error(`[${requestId}] Unhandled error in /api/echoes:`, {
        error: error instanceof Error ? error.message : "Unknown error",
        stack: error instanceof Error ? error.stack : undefined,
        partsCount: Array.isArray(req.body?.parts)
          ? req.body.parts.length
          : undefined,
      });

      res.status(500).json({
        error: "Internal server error",
        code: "INTERNAL_ERROR",
        requestId,
      } satisfies ApiError);
    }
  },
);

// GET /api/user/echoes/:echoId - получить конкретное эхо по ID
// app.get(
//   "/api/user/echoes/:echoId",
//   // readLimiter, // ВРЕМЕННО ОТКЛЮЧЕНО
//   authenticateUser,
//   async (req: Request, res: Response): Promise<void> => {
//     try {
//       const authReq = req as AuthenticatedRequest;
//       const userId = authReq.user!.userId;
//       const echoId = req.params.echoId;

//       const { data: echo, error: echoError } = await supabase
//         .from("echoes")
//         .select(
//           `
//           id,
//           user_id,
//           return_at,
//           created_at,
//           echo_parts (
//             id,
//             type,
//             content,
//             order_index
//           )
//         `,
//         )
//         .eq("id", echoId)
//         .eq("user_id", userId)
//         .single();

//       if (echoError) {
//         console.error("Error fetching echo:", echoError);
//         res.status(404).json({ error: "Echo not found" });
//         return;
//       }

//       res.json(echo);
//     } catch (error) {
//       console.error("Error in /api/echoes/:echoId:", error);
//       res.status(500).json({ error: "Internal server error" });
//     }
//   },
// );

// User profile endpoints

// GET /api/user/profile - получить профиль текущего пользователя
app.get(
  "/api/user/profile",
  readLimiter,
  authenticateUser,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const authReq = req as AuthenticatedRequest;
      const user = await authService.getUserById(authReq.user!.userId);

      if (!user) {
        res
          .status(404)
          .json({ error: "User not found", code: "USER_NOT_FOUND" });
        return;
      }

      // Получаем статистику пользователя
      const { data: echoStats, error: statsError } = await supabase
        .from("echoes")
        .select("id", { count: "exact" })
        .eq("user_id", user.id);

      const { data: tokenStats, error: tokenError } = await supabase
        .from("user_tokens")
        .select("id", { count: "exact" })
        .eq("user_id", user.id)
        .eq("is_active", true);

      const response: UserProfileResponse = {
        user: {
          id: user.id,
          email: user.email,
          displayName: user.name || null,
          photoUrl: null, // Not available in new schema
          emailVerified: true, // Email/password users are verified
          provider: "email",
          isActive: true,
          lastLoginAt: user.updated_at,
          createdAt: user.created_at,
        },
        stats: {
          totalEchoes: echoStats?.length || 0,
          activeTokens: tokenStats?.length || 0,
        },
      };

      res.json(response);
    } catch (error: unknown) {
      console.error("Error fetching user profile:", error);
      res.status(500).json({
        error: "Failed to fetch user profile",
        code: "PROFILE_FETCH_FAILED",
      } satisfies ApiError);
    }
  },
);

// PUT /api/user/profile - обновить профиль пользователя
app.put(
  "/api/user/profile",
  profileUpdateLimiter,
  authenticateUser,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const authReq = req as AuthenticatedRequest;
      const userId = authReq.user!.userId;
      const { displayName }: UpdateProfileRequest = req.body;

      const updateData: Partial<Pick<User, "display_name">> = {};

      if (displayName !== undefined) {
        updateData.display_name = displayName;
      }

      if (Object.keys(updateData).length === 0) {
        res.status(400).json({
          error: "No valid fields to update",
          code: "NO_UPDATE_FIELDS",
        } satisfies ApiError);
        return;
      }

      const { data: updatedUser, error } = await supabase
        .from("users")
        .update(updateData)
        .eq("id", userId)
        .select()
        .single();

      if (error) {
        console.error("Error updating user profile:", error);
        res.status(500).json({
          error: "Failed to update user profile",
          code: "PROFILE_UPDATE_FAILED",
        } satisfies ApiError);
        return;
      }

      const typedUser = updatedUser as User;
      res.json({
        message: "Profile updated successfully",
        user: {
          id: typedUser.id,
          email: typedUser.email,
          displayName: typedUser.display_name,
          photoUrl: typedUser.photo_url,
          emailVerified: typedUser.email_verified,
          provider: typedUser.provider,
        },
      });
    } catch (error: unknown) {
      console.error("Error in profile update:", error);
      res.status(500).json({
        error: "Internal server error",
        code: "INTERNAL_ERROR",
      } satisfies ApiError);
    }
  },
);

// POST /api/user/tokens - регистрация FCM токена
app.post(
  "/api/user/tokens",
  tokenRegistrationLimiter,
  authenticateUser,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const authReq = req as AuthenticatedRequest;
      const userId = authReq.user!.userId;
      const { fcmToken, deviceId, deviceType }: RegisterTokenRequest = req.body;

      if (!fcmToken) {
        res.status(400).json({
          error: "Missing required field: fcmToken",
          code: "MISSING_FCM_TOKEN",
        } satisfies ApiError);
        return;
      }

      // Проверяем, есть ли уже такой токен
      const { data: existingToken } = await supabase
        .from("user_tokens")
        .select("*")
        .eq("user_id", userId)
        .eq("fcm_token", fcmToken)
        .single();

      if (existingToken) {
        // Обновляем существующий токен (активируем если был неактивен)
        const { data: updatedToken, error } = await supabase
          .from("user_tokens")
          .update({
            is_active: true,
            device_id: deviceId || existingToken.device_id,
            device_type: deviceType || existingToken.device_type,
            updated_at: new Date().toISOString(),
          })
          .eq("id", existingToken.id)
          .select()
          .single();

        if (error) {
          console.error("Error updating FCM token:", error);
          res.status(500).json({
            error: "Failed to update FCM token",
            code: "TOKEN_UPDATE_FAILED",
          } satisfies ApiError);
          return;
        }

        const response: RegisterTokenResponse = {
          message: "FCM token updated successfully",
          token: {
            id: updatedToken.id,
            deviceId: updatedToken.device_id,
            deviceType: updatedToken.device_type,
            isActive: updatedToken.is_active,
          },
        };

        res.json(response);
        return;
      }

      // Создаем новый токен
      const { data: newToken, error } = await supabase
        .from("user_tokens")
        .insert({
          user_id: userId,
          fcm_token: fcmToken,
          device_id: deviceId,
          device_type: deviceType || "unknown",
        })
        .select()
        .single();

      if (error) {
        console.error("Error creating FCM token:", error);
        res.status(500).json({
          error: "Failed to register FCM token",
          code: "TOKEN_CREATE_FAILED",
        } satisfies ApiError);
        return;
      }

      const response: RegisterTokenResponse = {
        message: "FCM token registered successfully",
        token: {
          id: newToken.id,
          deviceId: newToken.device_id,
          deviceType: newToken.device_type,
          isActive: newToken.is_active,
        },
      };

      res.status(201).json(response);
    } catch (error: unknown) {
      console.error("Error in FCM token registration:", error);
      res.status(500).json({
        error: "Internal server error",
        code: "INTERNAL_ERROR",
      } satisfies ApiError);
    }
  },
);

// GET /api/user/echoes/:echoId - получить конкретное эхо по ID
app.get(
  "/api/user/echoes/:echoId",
  // readLimiter, // ВРЕМЕННО ОТКЛЮЧЕНО
  authenticateUser,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const authReq = req as AuthenticatedRequest;
      const userId = authReq.user!.userId;
      const echoId = req.params.echoId;

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
        .eq("user_id", userId)
        .single();

      if (echoError) {
        console.error("Error fetching echo:", echoError);
        res.status(404).json({ error: "Echo not found" });
        return;
      }

      // Преобразуем echo_parts в parts для совместимости с мобильным приложением
      const formattedEcho = {
        id: echo.id,
        user_id: echo.user_id,
        return_at: echo.return_at,
        created_at: echo.created_at,
        parts: (echo.echo_parts || [])
          .sort((a: any, b: any) => a.order_index - b.order_index)
          .map((part: any) => ({
            id: part.id,
            type: part.type,
            content: part.content,
            order_index: part.order_index,
          })),
      };

      res.json(formattedEcho);
    } catch (error) {
      console.error("Error in /api/user/echoes/:echoId:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  },
);

// GET /api/user/echoes - получить список echoes пользователя
app.get(
  "/api/user/echoes",
  readLimiter,
  authenticateUser,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const authReq = req as AuthenticatedRequest;
      const userId = authReq.user!.userId;
      const { limit = "20", offset = "0" }: GetEchoesQuery = req.query;

      const limitNum = parseInt(limit);
      const offsetNum = parseInt(offset);

      // Получаем общее количество эхов для пагинации
      const { count: totalCount, error: countError } = await supabase
        .from("echoes")
        .select("*", { count: "exact", head: true })
        .eq("user_id", userId);

      if (countError) {
        console.error("Error counting user echoes:", countError);
        res.status(500).json({
          error: "Failed to count echoes",
          code: "ECHOES_COUNT_FAILED",
        } satisfies ApiError);
        return;
      }

      const { data: echoes, error } = await supabase
        .from("echoes")
        .select(
          `
        id,
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
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .range(offsetNum, offsetNum + limitNum - 1);

      if (error) {
        console.error("Error fetching user echoes:", error);
        res.status(500).json({
          error: "Failed to fetch echoes",
          code: "ECHOES_FETCH_FAILED",
        } satisfies ApiError);
        return;
      }

      const formattedEchoes = (echoes || []).map((echo) => ({
        id: echo.id,
        return_at: echo.return_at,
        created_at: echo.created_at,
        parts: (echo.echo_parts || [])
          .sort((a: any, b: any) => a.order_index - b.order_index)
          .map((part: any) => ({
            id: part.id,
            type: part.type,
            content: part.content,
            order_index: part.order_index,
          })),
      }));

      const response: GetEchoesResponse = {
        echoes: formattedEchoes,
        pagination: {
          limit: limitNum,
          offset: offsetNum,
          total: totalCount || 0,
        },
      };

      res.json(response);
    } catch (error: unknown) {
      console.error("Error in echoes fetch:", error);
      res.status(500).json({
        error: "Internal server error",
        code: "INTERNAL_ERROR",
      } satisfies ApiError);
    }
  },
);

// POST /api/upload - загрузка файлов в Supabase Storage
app.post(
  "/api/upload",
  authenticateUser,
  upload.single("file"),
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      if (!req.file) {
        res.status(400).json({
          error: "No file uploaded",
          code: "NO_FILE",
        } satisfies ApiError);
        return;
      }

      const userId = req.user!.userId;
      const { originalname, mimetype, buffer } = req.file;

      console.log(
        `📤 Uploading file: ${originalname} (${mimetype}) for user: ${userId}`,
      );

      // Загружаем файл в Supabase Storage
      const result = await uploadFileToStorage(
        buffer,
        originalname,
        mimetype,
        userId,
      );

      res.json({
        success: true,
        data: {
          url: result.url,
          path: result.path,
          fileName: originalname,
        },
      });
    } catch (error: unknown) {
      console.error("File upload error:", error);
      res.status(500).json({
        error: error instanceof Error ? error.message : "Upload failed",
        code: "UPLOAD_FAILED",
      } satisfies ApiError);
    }
  },
);

// Health check endpoint
app.get(
  "/health",
  healthCheckLimiter,
  async (req: Request, res: Response): Promise<void> => {
    try {
      // Тестируем подключение к Supabase
      const supabaseConnection = await testSupabaseConnection();

      // Проверяем подключение к Redis/BullMQ
      let bullmqOk = false;
      try {
        const { echoQueue } = await import("./echoQueue");
        await echoQueue.getWaiting(); // Простая проверка подключения
        bullmqOk = true;
      } catch (error: unknown) {
        console.warn(
          "BullMQ connection test failed:",
          error instanceof Error ? error.message : "Unknown error",
        );
      }

      const response: HealthCheckResponse = {
        status: "OK",
        timestamp: new Date().toISOString(),
        services: {
          firebase: "initialized",
          supabase: supabaseConnection.supabase
            ? `connected ${supabaseConnection.clientInfo?.url} ${supabaseConnection.clientInfo?.hasServiceRole}`
            : "connection_failed",
          redis: bullmqOk ? "connected" : "connection_failed",
          queue: bullmqOk ? "active" : "inactive",
        },
      };

      res.json(response);
    } catch (error: unknown) {
      console.error("Health check error:", error);
      const errorResponse: HealthCheckResponse = {
        status: "Service Unavailable",
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : "Unknown error",
      };
      res.status(503).json(errorResponse);
    }
  },
);

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server is running on port ${PORT}`);
  console.log(`🏥 Health check: http://localhost:${PORT}/health`);
  console.log(`📊 Bull Board UI: http://localhost:${PORT}/admin/queues`);
  console.log(`📋 Queue monitoring available at the Bull Board URL`);
});

export default app;
