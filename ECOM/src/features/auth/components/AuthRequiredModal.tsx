import React from "react";
import { Modal, StyleSheet, TouchableOpacity, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useTheme } from "@/src/shared/providers/ThemeProvider";
import { Text } from "@/src/shared/ui/Text";
import { Button } from "@/src/shared/ui/Button";
import { BORDER_RADIUS, SPACING } from "@/src/shared/constants/spacing";

interface AuthRequiredModalProps {
  visible: boolean;
  onClose: () => void;
}

export const AuthRequiredModal: React.FC<AuthRequiredModalProps> = ({ visible, onClose }) => {
  const router = useRouter();
  const { colors } = useTheme();

  const goTo = (route: "/login" | "/signup") => {
    onClose();
    router.push(route);
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={[styles.modal, { backgroundColor: colors.surface }]}>
          <TouchableOpacity
            onPress={onClose}
            style={[styles.closeButton, { backgroundColor: colors.inputBg }]}
            activeOpacity={0.8}
          >
            <Ionicons name="close" size={20} color={colors.text} />
          </TouchableOpacity>

          <View style={[styles.iconBadge, { backgroundColor: colors.primaryLight }]}>
            <Ionicons name="cart-outline" size={30} color={colors.primary} />
          </View>

          <Text variant="xl" weight="bold" align="center" style={styles.title}>
            Please sign in or register
          </Text>
          <Text variant="sm" color={colors.textMuted} align="center" style={styles.message}>
            You need an account before adding products to your cart.
          </Text>

          <Button title="Sign In" onPress={() => goTo("/login")} icon="log-in-outline" />
          <Button title="Register" onPress={() => goTo("/signup")} variant="outline" icon="person-add-outline" />
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(15, 23, 42, 0.55)",
    justifyContent: "center",
    padding: SPACING.xl,
  },
  modal: {
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.xl,
    alignItems: "center",
  },
  closeButton: {
    position: "absolute",
    top: SPACING.md,
    right: SPACING.md,
    width: 34,
    height: 34,
    borderRadius: BORDER_RADIUS.sm,
    alignItems: "center",
    justifyContent: "center",
  },
  iconBadge: {
    width: 64,
    height: 64,
    borderRadius: BORDER_RADIUS.lg,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: SPACING.lg,
  },
  title: {
    marginBottom: SPACING.sm,
  },
  message: {
    lineHeight: 20,
    marginBottom: SPACING.lg,
  },
});

export default AuthRequiredModal;
