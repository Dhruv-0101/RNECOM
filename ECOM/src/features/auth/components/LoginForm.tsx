import React from "react";
import { View, StyleSheet } from "react-native";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { loginSchema, LoginFormData } from "../schemas/login.schema";
import { useLogin } from "../hooks/useLogin";
import { Input } from "@/src/shared/ui/Input";
import { Button } from "@/src/shared/ui/Button";
import { Text } from "@/src/shared/ui/Text";
import { useTheme } from "@/src/shared/providers/ThemeProvider";
import { SPACING } from "@/src/shared/constants/spacing";

interface LoginFormProps {
  onSuccess: () => void;
}

export const LoginForm: React.FC<LoginFormProps> = ({ onSuccess }) => {
  const { colors } = useTheme();
  const { mutate: login, isPending, error } = useLogin();

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSubmit = (data: LoginFormData) => {
    login(data, {
      onSuccess: () => {
        onSuccess();
      },
    });
  };

  return (
    <View style={styles.container}>
      {error && (
        <View style={[styles.errorAlert, { backgroundColor: `${colors.error}15`, borderColor: colors.error }]}>
          <Text variant="sm" color={colors.error} weight="medium">
            {error.message || "Invalid credentials. Please try again."}
          </Text>
        </View>
      )}

      <Controller
        control={control}
        name="email"
        render={({ field: { onChange, onBlur, value } }) => (
          <Input
            label="Email Address"
            placeholder="name@example.com"
            keyboardType="email-address"
            autoComplete="email"
            value={value}
            onChangeText={onChange}
            onBlur={onBlur}
            error={errors.email?.message}
            leftIcon="mail-outline"
          />
        )}
      />

      <Controller
        control={control}
        name="password"
        render={({ field: { onChange, onBlur, value } }) => (
          <Input
            label="Password"
            placeholder="••••••••"
            secureTextEntry
            autoComplete="password"
            value={value}
            onChangeText={onChange}
            onBlur={onBlur}
            error={errors.password?.message}
            leftIcon="lock-closed-outline"
          />
        )}
      />

      <Button
        title="Sign In"
        onPress={handleSubmit(onSubmit)}
        loading={isPending}
        style={styles.button}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: "100%",
  },
  errorAlert: {
    padding: SPACING.md,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: SPACING.md,
  },
  button: {
    marginTop: SPACING.sm,
  },
});

export default LoginForm;
