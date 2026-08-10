import React, { useRef, useState } from "react";
import {
  KeyboardAvoidingView,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { useAuth } from "../hooks/useAuth";
import { LoadingSpinner } from "../components/LoadingSpinner";
import { AppButton, AppCard, FormField } from "../components/ui";
import { colors, fontFamilies, radii, spacing } from "../theme";

interface FieldErrors {
  email?: string;
  password?: string;
}

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const LoginScreen: React.FC = () => {
  const { login, register, isLoading } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoginMode, setIsLoginMode] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);

  const nameInputRef = useRef<TextInput>(null);
  const passwordInputRef = useRef<TextInput>(null);

  const validate = () => {
    const errors: FieldErrors = {};
    const normalizedEmail = email.trim();

    if (!normalizedEmail) {
      errors.email = "Enter your email address.";
    } else if (!emailPattern.test(normalizedEmail)) {
      errors.email = "Enter a valid email address.";
    }

    if (!password) {
      errors.password = "Enter your password.";
    } else if (!isLoginMode && password.length < 6) {
      errors.password = "Use at least 6 characters.";
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async () => {
    setFormError(null);
    if (!validate()) return;

    setIsSubmitting(true);
    try {
      const normalizedEmail = email.trim().toLowerCase();
      const result = isLoginMode
        ? await login(normalizedEmail, password)
        : await register(normalizedEmail, password, name.trim() || undefined);

      if (!result.success) {
        setFormError(
          result.error ||
            (isLoginMode
              ? "Could not sign in. Check your details and try again."
              : "Could not create your account. Please try again."),
        );
      }
    } catch (error) {
      console.error("Authentication submit error:", error);
      setFormError("Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleMode = () => {
    setIsLoginMode((current) => !current);
    setFieldErrors({});
    setFormError(null);
  };

  if (isLoading) {
    return <LoadingSpinner text="Initializing EchoOn" />;
  }

  const submitLabel = isLoginMode ? "Sign In" : "Create Account";

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: colors.background }}
      behavior={process.env.EXPO_OS === "ios" ? "padding" : "height"}
    >
      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{
          flexGrow: 1,
          justifyContent: "center",
          paddingHorizontal: spacing["2xl"],
          paddingVertical: spacing["3xl"],
          gap: spacing["2xl"],
        }}
      >
        <View style={{ alignItems: "center", gap: spacing.md }}>
          <View
            accessibilityElementsHidden
            importantForAccessibility="no-hide-descendants"
            style={{
              width: 88,
              height: 88,
              alignItems: "center",
              justifyContent: "center",
              borderRadius: radii.pill,
              backgroundColor: colors.content,
              boxShadow: "0 6px 16px rgba(88, 56, 31, 0.18)",
            }}
          >
            <Text
              style={{
                color: colors.contentOnAccent,
                fontFamily: fontFamilies.displayBold,
                fontSize: 48,
              }}
            >
              E
            </Text>
          </View>
          <Text
            accessibilityRole="header"
            style={{
              color: colors.content,
              fontFamily: fontFamilies.displayBold,
              fontSize: 34,
            }}
          >
            EchoOn
          </Text>
          <Text
            style={{
              color: colors.contentMuted,
              fontFamily: fontFamilies.bodySemibold,
              fontSize: 17,
              lineHeight: 24,
              textAlign: "center",
            }}
          >
            Send messages to your future self
          </Text>
        </View>

        <AppCard style={{ gap: spacing.lg }}>
          <Text
            accessibilityRole="header"
            style={{
              color: colors.content,
              fontFamily: fontFamilies.displayBold,
              fontSize: 26,
              textAlign: "center",
            }}
          >
            {isLoginMode ? "Welcome Back" : "Create Account"}
          </Text>

          <FormField
            label="Email"
            placeholder="you@example.com"
            value={email}
            onChangeText={(value) => {
              setEmail(value);
              setFieldErrors((current) => ({ ...current, email: undefined }));
              setFormError(null);
            }}
            error={fieldErrors.email}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            autoComplete="email"
            textContentType="emailAddress"
            returnKeyType="next"
            editable={!isSubmitting}
            onSubmitEditing={() =>
              isLoginMode
                ? passwordInputRef.current?.focus()
                : nameInputRef.current?.focus()
            }
          />

          {!isLoginMode && (
            <FormField
              ref={nameInputRef}
              label="Name"
              hint="Optional"
              placeholder="How should we address you?"
              value={name}
              onChangeText={setName}
              autoCapitalize="words"
              autoCorrect={false}
              autoComplete="name"
              textContentType="name"
              returnKeyType="next"
              editable={!isSubmitting}
              onSubmitEditing={() => passwordInputRef.current?.focus()}
            />
          )}

          <FormField
            ref={passwordInputRef}
            label="Password"
            hint={isLoginMode ? undefined : "At least 6 characters"}
            placeholder="Enter your password"
            value={password}
            onChangeText={(value) => {
              setPassword(value);
              setFieldErrors((current) => ({
                ...current,
                password: undefined,
              }));
              setFormError(null);
            }}
            error={fieldErrors.password}
            secureTextEntry
            autoCapitalize="none"
            autoCorrect={false}
            autoComplete={isLoginMode ? "current-password" : "new-password"}
            textContentType={isLoginMode ? "password" : "newPassword"}
            returnKeyType="done"
            editable={!isSubmitting}
            onSubmitEditing={handleSubmit}
          />

          {formError && (
            <View
              accessibilityLiveRegion="assertive"
              style={{
                padding: spacing.md,
                borderRadius: radii.sm,
                borderCurve: "continuous",
                backgroundColor: colors.dangerSurface,
              }}
            >
              <Text
                selectable
                style={{
                  color: colors.danger,
                  fontFamily: fontFamilies.bodySemibold,
                  fontSize: 14,
                  lineHeight: 20,
                }}
              >
                {formError}
              </Text>
            </View>
          )}

          <AppButton
            label={submitLabel}
            loading={isSubmitting}
            onPress={handleSubmit}
          />
          <AppButton
            label={
              isLoginMode
                ? "New to EchoOn? Create an account"
                : "Already have an account? Sign in"
            }
            variant="quiet"
            disabled={isSubmitting}
            onPress={toggleMode}
          />
        </AppCard>

        <View style={{ gap: spacing.md }}>
          {[
            "Write to your future self",
            "Add images, audio, and links",
            "Choose when your echo returns",
          ].map((feature) => (
            <View
              key={feature}
              style={{ flexDirection: "row", alignItems: "center", gap: spacing.md }}
            >
              <View
                accessibilityElementsHidden
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: radii.pill,
                  backgroundColor: colors.content,
                }}
              />
              <Text
                style={{
                  flex: 1,
                  color: colors.content,
                  fontFamily: fontFamilies.body,
                  fontSize: 16,
                }}
              >
                {feature}
              </Text>
            </View>
          ))}
        </View>

        <Text
          style={{
            color: colors.contentMuted,
            fontFamily: fontFamilies.body,
            fontSize: 13,
            lineHeight: 18,
            textAlign: "center",
          }}
        >
          By continuing, you agree to the EchoOn terms and privacy policy.
        </Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};
