import React from "react";
import { View, StyleSheet } from "react-native";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { signupSchema, SignupFormData } from "../schemas/signup.schema";
import { useSignup } from "../hooks/useSignup";
import { Input } from "@/src/shared/ui/Input";
import { Button } from "@/src/shared/ui/Button";
import { Text } from "@/src/shared/ui/Text";
import { useTheme } from "@/src/shared/providers/ThemeProvider";
import { SPACING } from "@/src/shared/constants/spacing";

interface SignupFormProps {
  onSuccess: () => void;
}

export const SignupForm: React.FC<SignupFormProps> = ({ onSuccess }) => {
  const { colors } = useTheme();
  const { mutate: signup, isPending, error, isSuccess } = useSignup();

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<SignupFormData>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      fullname: "",
      email: "",
      password: "",
    },
  });

  const onSubmit = (data: SignupFormData) => {
    signup(data, {
      onSuccess: () => {
        // Allow user to see success message brief moments before redirecting
        setTimeout(() => {
          onSuccess();
        }, 1500);
      },
    });
  };

  return (
    <View style={styles.container}>
      {error && (
        <View style={[styles.alert, { backgroundColor: `${colors.error}15`, borderColor: colors.error }]}>
          <Text variant="sm" color={colors.error} weight="medium">
            {error.message || "Registration failed. Please try again."}
          </Text>
        </View>
      )}

      {isSuccess && (
        <View style={[styles.alert, { backgroundColor: `${colors.success}15`, borderColor: colors.success }]}>
          <Text variant="sm" color={colors.success} weight="medium">
            Registration successful! Redirecting to login...
          </Text>
        </View>
      )}

      <Controller
        control={control}
        name="fullname"
        render={({ field: { onChange, onBlur, value } }) => (
          <Input
            label="Full Name"
            placeholder="John Doe"
            value={value}
            onChangeText={onChange}
            onBlur={onBlur}
            error={errors.fullname?.message}
            leftIcon="person-outline"
          />
        )}
      />

      <Controller
        control={control}
        name="email"
        render={({ field: { onChange, onBlur, value } }) => (
          <Input
            label="Email Address"
            placeholder="john.doe@example.com"
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
        title="Create Account"
        onPress={handleSubmit(onSubmit)}
        loading={isPending}
        disabled={isSuccess}
        style={styles.button}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: "100%",
  },
  alert: {
    padding: SPACING.md,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: SPACING.md,
  },
  button: {
    marginTop: SPACING.sm,
  },
});

export default SignupForm;
