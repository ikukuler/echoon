import { Request, Response, NextFunction } from "express";
import { authService } from "./authService";

export interface AuthenticatedRequest extends Request {
  user?: {
    userId: string;
    email: string;
  };
}

// Middleware для аутентификации пользователя
export const authenticateUser = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    console.log("🔐 Auth middleware - URL:", req.url);
    console.log(
      "🔐 Auth middleware - Authorization header:",
      authHeader ? "present" : "missing",
    );

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      console.log("❌ Auth middleware - Invalid authorization header");
      res.status(401).json({
        error: "Missing or invalid Authorization header",
        code: "MISSING_AUTH_TOKEN",
      });
      return;
    }

    const token = authHeader.substring(7); // Убираем 'Bearer '
    const decoded = authService.verifyToken(token);

    if (!decoded) {
      res.status(401).json({
        error: "Invalid or expired token",
        code: "INVALID_TOKEN",
      });
      return;
    }

    // Проверяем, что пользователь существует
    const user = await authService.getUserById(decoded.userId);
    if (!user) {
      res.status(401).json({
        error: "User not found",
        code: "USER_NOT_FOUND",
      });
      return;
    }

    req.user = decoded;
    next();
  } catch (error) {
    console.error("Authentication error:", error);
    res.status(500).json({
      error: "Authentication failed",
      code: "AUTH_ERROR",
    });
  }
};

// Middleware только для проверки токена (без проверки существования пользователя)
export const verifyTokenOnly = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): void => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      res.status(401).json({
        error: "Missing or invalid Authorization header",
        code: "MISSING_AUTH_TOKEN",
      });
      return;
    }

    const token = authHeader.substring(7);
    const decoded = authService.verifyToken(token);

    if (!decoded) {
      res.status(401).json({
        error: "Invalid or expired token",
        code: "INVALID_TOKEN",
      });
      return;
    }

    req.user = decoded;
    next();
  } catch (error) {
    console.error("Token verification error:", error);
    res.status(500).json({
      error: "Token verification failed",
      code: "TOKEN_ERROR",
    });
  }
};
