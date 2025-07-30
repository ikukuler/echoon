import AsyncStorage from "@react-native-async-storage/async-storage";
import { apiService } from "./api";

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

class AuthService {
  private readonly TOKEN_KEY = "auth_token";
  private readonly USER_KEY = "auth_user";

  // Сохранение токена и пользователя
  private async saveAuthData(token: string, user: User): Promise<void> {
    try {
      await AsyncStorage.setItem(this.TOKEN_KEY, token);
      await AsyncStorage.setItem(this.USER_KEY, JSON.stringify(user));
    } catch (error) {
      console.error("Error saving auth data:", error);
    }
  }

  // Получение токена
  async getToken(): Promise<string | null> {
    try {
      return await AsyncStorage.getItem(this.TOKEN_KEY);
    } catch (error) {
      console.error("Error getting token:", error);
      return null;
    }
  }

  // Получение пользователя
  async getUser(): Promise<User | null> {
    try {
      const userData = await AsyncStorage.getItem(this.USER_KEY);
      return userData ? JSON.parse(userData) : null;
    } catch (error) {
      console.error("Error getting user:", error);
      return null;
    }
  }

  // Регистрация
  async register(
    email: string,
    password: string,
    name?: string,
  ): Promise<AuthResponse> {
    try {
      const response = await apiService.register({ email, password, name });

      if (response.success && response.data) {
        const { user, token } = response.data;
        await this.saveAuthData(token, user);
        return { success: true, user, token };
      } else {
        return { success: false, error: response.error };
      }
    } catch (error) {
      console.error("Registration error:", error);
      return { success: false, error: "Registration failed" };
    }
  }

  // Вход
  async login(email: string, password: string): Promise<AuthResponse> {
    try {
      const response = await apiService.login({ email, password });

      if (response.success && response.data) {
        const { user, token } = response.data;
        await this.saveAuthData(token, user);
        return { success: true, user, token };
      } else {
        return { success: false, error: response.error };
      }
    } catch (error) {
      console.error("Login error:", error);
      return { success: false, error: "Login failed" };
    }
  }

  // Выход
  async logout(): Promise<void> {
    try {
      await AsyncStorage.removeItem(this.TOKEN_KEY);
      await AsyncStorage.removeItem(this.USER_KEY);
    } catch (error) {
      console.error("Logout error:", error);
    }
  }

  // Проверка авторизации
  async isAuthenticated(): Promise<boolean> {
    const token = await this.getToken();
    return !!token;
  }
}

export const authService = new AuthService();
 