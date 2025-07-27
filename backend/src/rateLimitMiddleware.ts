import rateLimit, { RateLimitRequestHandler } from "express-rate-limit";
import { Request, Response } from "express";
import { AuthenticatedRequest, ApiError } from "./types";

// Общий rate limiter для всех запросов
const globalLimiter: RateLimitRequestHandler = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 минут
  max: 1000, // 1000 запросов на IP за 15 минут
  message: {
    error: "Too many requests from this IP, please try again later",
    code: "RATE_LIMIT_EXCEEDED",
    retryAfter: "15 minutes",
  } satisfies ApiError,
  standardHeaders: true, // Возвращает rate limit info в заголовках `RateLimit-*`
  legacyHeaders: false, // Отключает заголовки `X-RateLimit-*`

  // Кастомизация ключа для идентификации клиента
  keyGenerator: (req: Request) => {
    // Если пользователь аутентифицирован, используем его ID
    const authReq = req as AuthenticatedRequest;
    if (authReq.user?.id) {
      return `user:${authReq.user.id}`;
    }
    // Иначе используем IP
    return req.ip || "unknown";
  },

  // Кастомная обработка превышения лимита
  skip: (req: Request) => false, // Не пропускаем никого
  skipSuccessfulRequests: false,
  skipFailedRequests: false,
});

// Строгий лимит для создания echoes (защита от спама)
const createEchoLimiter: RateLimitRequestHandler = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 час
  max: 50, // 50 echoes в час на пользователя
  message: {
    error: "Too many echoes created, please wait before creating more",
    code: "ECHO_CREATION_LIMIT_EXCEEDED",
    retryAfter: "1 hour",
  } satisfies ApiError,
  keyGenerator: (req: Request) => {
    // Лимит по пользователю, а не по IP
    const authReq = req as AuthenticatedRequest;
    return authReq.user?.id || req.ip || "unknown";
  },
  skip: (req: Request) => false, // Не пропускаем никого
});

// Лимит для регистрации FCM токенов
const tokenRegistrationLimiter: RateLimitRequestHandler = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 минут
  max: 10, // 10 регистраций токенов за 5 минут
  message: {
    error:
      "Too many token registrations, please wait before registering more devices",
    code: "TOKEN_REGISTRATION_LIMIT_EXCEEDED",
    retryAfter: "5 minutes",
  } satisfies ApiError,
  keyGenerator: (req: Request) => {
    const authReq = req as AuthenticatedRequest;
    return authReq.user?.id || req.ip || "unknown";
  },
});

// Мягкий лимит для чтения данных
const readLimiter: RateLimitRequestHandler = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 минут
  max: 200, // 200 запросов за 5 минут
  message: {
    error: "Too many read requests, please slow down",
    code: "READ_LIMIT_EXCEEDED",
    retryAfter: "5 minutes",
  } satisfies ApiError,
  keyGenerator: (req: Request) => {
    const authReq = req as AuthenticatedRequest;
    return authReq.user?.id || req.ip || "unknown";
  },
});

// Лимит для обновления профиля
const profileUpdateLimiter: RateLimitRequestHandler = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 минут
  max: 10, // 10 обновлений профиля за 15 минут
  message: {
    error: "Too many profile updates, please wait before updating again",
    code: "PROFILE_UPDATE_LIMIT_EXCEEDED",
    retryAfter: "15 minutes",
  } satisfies ApiError,
  keyGenerator: (req: Request) => {
    const authReq = req as AuthenticatedRequest;
    return authReq.user?.id || req.ip || "unknown";
  },
});

// Очень строгий лимит для health check (защита от мониторинга ботов)
const healthCheckLimiter: RateLimitRequestHandler = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 минута
  max: 30, // 30 запросов в минуту
  message: {
    error: "Too many health check requests",
    code: "HEALTH_CHECK_LIMIT_EXCEEDED",
    retryAfter: "1 minute",
  } satisfies ApiError,
});

interface RateLimitConfig {
  windowMs: number;
  max: number;
  message: ApiError;
}

// Middleware для аутентифицированных пользователей vs анонимных
const createAuthAwareLimiter = (
  authenticatedLimits: RateLimitConfig,
  anonymousLimits: RateLimitConfig,
): RateLimitRequestHandler[] => {
  const authenticatedLimiter = rateLimit({
    ...authenticatedLimits,
    keyGenerator: (req: Request) => {
      const authReq = req as AuthenticatedRequest;
      return authReq.user?.id || `anon:${req.ip}`;
    },
    skip: (req: Request) => {
      const authReq = req as AuthenticatedRequest;
      return !authReq.user; // Пропускаем если пользователь не аутентифицирован
    },
  });

  const anonymousLimiter = rateLimit({
    ...anonymousLimits,
    keyGenerator: (req: Request) => `anon:${req.ip}`,
    skip: (req: Request) => {
      const authReq = req as AuthenticatedRequest;
      return !!authReq.user; // Пропускаем если пользователь аутентифицирован
    },
  });

  return [authenticatedLimiter, anonymousLimiter];
};

// Интеллектуальный лимитер с разными лимитами для auth/anon пользователей
const smartGlobalLimiter = createAuthAwareLimiter(
  // Для аутентифицированных пользователей - более мягкие лимиты
  {
    windowMs: 15 * 60 * 1000,
    max: 1000,
    message: {
      error: "Rate limit exceeded for authenticated user",
      code: "AUTH_USER_RATE_LIMIT_EXCEEDED",
    } satisfies ApiError,
  },
  // Для анонимных пользователей - более строгие лимиты
  {
    windowMs: 15 * 60 * 1000,
    max: 100,
    message: {
      error:
        "Rate limit exceeded for anonymous user. Consider signing in for higher limits.",
      code: "ANON_USER_RATE_LIMIT_EXCEEDED",
    } satisfies ApiError,
  },
);

export {
  globalLimiter,
  createEchoLimiter,
  tokenRegistrationLimiter,
  readLimiter,
  profileUpdateLimiter,
  healthCheckLimiter,
  smartGlobalLimiter,
  createAuthAwareLimiter,
};
