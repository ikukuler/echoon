import React, { createContext, useContext, useState, useEffect } from "react";
import { authService, User } from "../services/authService";
import { pushNotificationService } from "../services/pushNotifications";

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (
    email: string,
    password: string,
  ) => Promise<{ success: boolean; error?: string }>;
  register: (
    email: string,
    password: string,
    name?: string,
  ) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      setIsLoading(true);
      const isAuthenticated = await authService.isAuthenticated();

      if (isAuthenticated) {
        const currentUser = await authService.getUser();
        setUser(currentUser);
      }
    } catch (error) {
      console.error("Auth status check error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const initializePushNotifications = async (userId: string) => {
    try {
      console.log("🔔 Initializing push notifications...");
      const token = await pushNotificationService.initialize();
      console.log("🔔 Push token received:", token ? "Yes" : "No");

      if (token && userId) {
        console.log("🔔 Registering push token on server...");
        const registerResult = await pushNotificationService.registerToken(
          userId,
        );
        console.log("🔔 Push token registration result:", registerResult);
      } else {
        console.log("🔔 No token or user ID for push registration");
      }
    } catch (pushError) {
      console.error("Push notification setup error:", pushError);
    }
  };

  const login = async (email: string, password: string) => {
    try {
      const result = await authService.login(email, password);

      if (result.success && result.user) {
        setUser(result.user);

        // Инициализируем push-уведомления после успешного входа
        await initializePushNotifications(result.user.id);

        return { success: true };
      } else {
        return { success: false, error: result.error };
      }
    } catch (error) {
      console.error("Login error:", error);
      return { success: false, error: "Login failed" };
    }
  };

  const register = async (email: string, password: string, name?: string) => {
    try {
      const result = await authService.register(email, password, name);

      if (result.success && result.user) {
        setUser(result.user);

        // Инициализируем push-уведомления после успешной регистрации
        await initializePushNotifications(result.user.id);

        return { success: true };
      } else {
        return { success: false, error: result.error };
      }
    } catch (error) {
      console.error("Registration error:", error);
      return { success: false, error: "Registration failed" };
    }
  };

  const logout = async () => {
    try {
      await authService.logout();
      setUser(null);
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  const value: AuthContextType = {
    user,
    isLoading,
    login,
    register,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
