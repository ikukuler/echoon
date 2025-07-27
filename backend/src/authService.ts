import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { supabase } from "./supabaseClient";

const JWT_SECRET =
  process.env.JWT_SECRET || "your-super-secret-jwt-key-change-in-production";
const JWT_EXPIRES_IN = "7d";

export interface User {
  id: string;
  email: string;
  name?: string;
  created_at: string;
  updated_at: string;
}

export interface AuthResponse {
  success: boolean;
  user?: User;
  token?: string;
  error?: string;
}

export class AuthService {
  // Регистрация нового пользователя
  async register(
    email: string,
    password: string,
    name?: string,
  ): Promise<AuthResponse> {
    try {
      // Проверяем, существует ли пользователь
      const { data: existingUser } = await supabase
        .from("users")
        .select("id")
        .eq("email", email)
        .single();

      if (existingUser) {
        return {
          success: false,
          error: "User with this email already exists",
        };
      }

      // Хешируем пароль
      const hashedPassword = await bcrypt.hash(password, 12);

      // Создаем пользователя
      const { data: user, error } = await supabase
        .from("users")
        .insert([
          {
            email,
            password_hash: hashedPassword,
            name: name || null,
          },
        ])
        .select("id, email, name, created_at, updated_at")
        .single();

      if (error) {
        console.error("Supabase error during registration:", error);
        return {
          success: false,
          error: "Failed to create user",
        };
      }

      // Генерируем JWT токен
      const token = jwt.sign(
        { userId: user.id, email: user.email },
        JWT_SECRET,
        { expiresIn: JWT_EXPIRES_IN },
      );

      return {
        success: true,
        user,
        token,
      };
    } catch (error) {
      console.error("Registration error:", error);
      return {
        success: false,
        error: "Internal server error",
      };
    }
  }

  // Вход пользователя
  async login(email: string, password: string): Promise<AuthResponse> {
    try {
      // Находим пользователя
      const { data: user, error } = await supabase
        .from("users")
        .select("id, email, name, password_hash, created_at, updated_at")
        .eq("email", email)
        .single();

      if (error || !user) {
        return {
          success: false,
          error: "Invalid email or password",
        };
      }

      // Проверяем пароль
      const isPasswordValid = await bcrypt.compare(
        password,
        user.password_hash,
      );
      if (!isPasswordValid) {
        return {
          success: false,
          error: "Invalid email or password",
        };
      }

      // Генерируем JWT токен
      const token = jwt.sign(
        { userId: user.id, email: user.email },
        JWT_SECRET,
        { expiresIn: JWT_EXPIRES_IN },
      );

      // Убираем password_hash из ответа
      const { password_hash, ...userWithoutPassword } = user;

      return {
        success: true,
        user: userWithoutPassword,
        token,
      };
    } catch (error) {
      console.error("Login error:", error);
      return {
        success: false,
        error: "Internal server error",
      };
    }
  }

  // Верификация JWT токена
  verifyToken(token: string): { userId: string; email: string } | null {
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as {
        userId: string;
        email: string;
      };
      return decoded;
    } catch (error) {
      return null;
    }
  }

  // Получение пользователя по ID
  async getUserById(userId: string): Promise<User | null> {
    try {
      const { data: user, error } = await supabase
        .from("users")
        .select("id, email, name, created_at, updated_at")
        .eq("id", userId)
        .single();

      if (error || !user) {
        return null;
      }

      return user;
    } catch (error) {
      console.error("Get user error:", error);
      return null;
    }
  }
}

export const authService = new AuthService();
