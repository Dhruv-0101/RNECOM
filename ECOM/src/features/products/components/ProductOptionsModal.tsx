import React, { useEffect, useState } from "react";
import { Modal, StyleSheet, TouchableOpacity, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "@/src/shared/providers/ThemeProvider";
import { Text } from "@/src/shared/ui/Text";
import { Button } from "@/src/shared/ui/Button";
import { BORDER_RADIUS, SPACING } from "@/src/shared/constants/spacing";
import { Product } from "../types/product.types";

interface ProductOptionsModalProps {
  visible: boolean;
  product?: Product | null;
  quantity: number;
  onQuantityChange: (quantity: number) => void;
  onClose: () => void;
  onConfirm: (options: { color: string; size: string; quantity: number }) => void;
}

export const ProductOptionsModal: React.FC<ProductOptionsModalProps> = ({
  visible,
  product,
  quantity,
  onQuantityChange,
  onClose,
  onConfirm,
}) => {
  const { colors } = useTheme();
  const [selectedColor, setSelectedColor] = useState("");
  const [selectedSize, setSelectedSize] = useState("");
  const [error, setError] = useState("");

  const qtyLeft = product?.qtyLeft ?? product?.totalQty ?? 1;
  const maxQuantity = Math.max(qtyLeft, 1);

  useEffect(() => {
    if (visible) {
      setSelectedColor("");
      setSelectedSize("");
      setError("");
    }
  }, [visible, product?._id]);

  const decrease = () => onQuantityChange(Math.max(1, quantity - 1));
  const increase = () => onQuantityChange(Math.min(maxQuantity, quantity + 1));

  const confirm = () => {
    if (product?.colors?.length && !selectedColor) {
      setError("Please select product color.");
      return;
    }
    if (product?.sizes?.length && !selectedSize) {
      setError("Please select product size.");
      return;
    }

    onConfirm({
      color: selectedColor || "Default",
      size: selectedSize || "Default",
      quantity,
    });
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={[styles.sheet, { backgroundColor: colors.surface }]}>
          <View style={styles.header}>
            <View style={styles.headerText}>
              <Text variant="lg" weight="bold" numberOfLines={1}>
                {product?.name || "Choose Options"}
              </Text>
              <Text variant="sm" color={colors.textMuted}>
                Select all details before adding to cart.
              </Text>
            </View>
            <TouchableOpacity
              onPress={onClose}
              style={[styles.closeButton, { backgroundColor: colors.inputBg }]}
              activeOpacity={0.8}
            >
              <Ionicons name="close" size={20} color={colors.text} />
            </TouchableOpacity>
          </View>

          {!!product?.colors?.length && (
            <View style={styles.section}>
              <Text variant="sm" weight="semibold" style={styles.sectionTitle}>
                Color
              </Text>
              <View style={styles.optionRow}>
                {product.colors.map((color) => {
                  const selected = selectedColor === color;
                  return (
                    <TouchableOpacity
                      key={color}
                      onPress={() => {
                        setSelectedColor(color);
                        setError("");
                      }}
                      style={[
                        styles.swatchButton,
                        { borderColor: selected ? colors.primary : colors.border },
                      ]}
                      activeOpacity={0.85}
                    >
                      <View style={[styles.swatch, { backgroundColor: color, borderColor: colors.border }]} />
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          )}

          {!!product?.sizes?.length && (
            <View style={styles.section}>
              <Text variant="sm" weight="semibold" style={styles.sectionTitle}>
                Size
              </Text>
              <View style={styles.optionRow}>
                {product.sizes.map((size) => {
                  const selected = selectedSize === size;
                  return (
                    <TouchableOpacity
                      key={size}
                      onPress={() => {
                        setSelectedSize(size);
                        setError("");
                      }}
                      style={[
                        styles.sizeButton,
                        {
                          backgroundColor: selected ? colors.primary : colors.inputBg,
                          borderColor: selected ? colors.primary : colors.border,
                        },
                      ]}
                      activeOpacity={0.85}
                    >
                      <Text variant="sm" weight="semibold" color={selected ? "#ffffff" : colors.text}>
                        {size}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          )}

          <View style={styles.section}>
            <Text variant="sm" weight="semibold" style={styles.sectionTitle}>
              Quantity
            </Text>
            <View style={[styles.stepper, { backgroundColor: colors.inputBg }]}>
              <TouchableOpacity onPress={decrease} style={styles.stepButton} activeOpacity={0.8}>
                <Ionicons name="remove" size={20} color={colors.text} />
              </TouchableOpacity>
              <Text variant="lg" weight="bold" style={styles.quantityText}>
                {quantity}
              </Text>
              <TouchableOpacity onPress={increase} style={styles.stepButton} activeOpacity={0.8}>
                <Ionicons name="add" size={20} color={colors.text} />
              </TouchableOpacity>
            </View>
          </View>

          {!!error && (
            <Text variant="sm" color={colors.error} align="center" style={styles.error}>
              {error}
            </Text>
          )}

          <Button title="Add to Cart" onPress={confirm} icon="cart-outline" />
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(15, 23, 42, 0.55)",
    justifyContent: "flex-end",
  },
  sheet: {
    borderTopLeftRadius: BORDER_RADIUS.xl,
    borderTopRightRadius: BORDER_RADIUS.xl,
    padding: SPACING.xl,
  },
  header: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: SPACING.md,
  },
  headerText: {
    flex: 1,
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: BORDER_RADIUS.sm,
    alignItems: "center",
    justifyContent: "center",
  },
  section: {
    marginTop: SPACING.lg,
  },
  sectionTitle: {
    marginBottom: SPACING.sm,
  },
  optionRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: SPACING.sm,
  },
  swatchButton: {
    width: 42,
    height: 42,
    borderRadius: BORDER_RADIUS.round,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  swatch: {
    width: 28,
    height: 28,
    borderRadius: BORDER_RADIUS.round,
    borderWidth: 1,
  },
  sizeButton: {
    minWidth: 48,
    height: 40,
    borderRadius: BORDER_RADIUS.sm,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: SPACING.md,
  },
  stepper: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.xs,
  },
  stepButton: {
    width: 38,
    height: 38,
    alignItems: "center",
    justifyContent: "center",
  },
  quantityText: {
    minWidth: 44,
    textAlign: "center",
  },
  error: {
    marginVertical: SPACING.md,
  },
});

export default ProductOptionsModal;
