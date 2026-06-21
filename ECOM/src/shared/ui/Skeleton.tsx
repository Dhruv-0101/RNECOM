import React from "react";
import { View, StyleSheet, Dimensions, ViewStyle } from "react-native";
import { useTheme } from "@/src/shared/providers/ThemeProvider";
import { Card } from "@/src/shared/ui/Card";
import { SPACING } from "@/src/shared/constants/spacing";
import { Skeleton as MotiSkeleton } from "moti/skeleton";

interface SkeletonProps {
  width: number | string;
  height: number | string;
  borderRadius?: number;
  style?: ViewStyle;
}

export const Skeleton: React.FC<SkeletonProps> = ({
  width,
  height,
  borderRadius = 4,
  style,
}) => {
  const { isDark } = useTheme();

  return (
    <View style={style}>
      <MotiSkeleton
        width={width as any}
        height={height as any}
        radius={borderRadius}
        colorMode={isDark ? "dark" : "light"}
      />
    </View>
  );
};

const { width: windowWidth } = Dimensions.get("window");
const CARD_WIDTH = (windowWidth - SPACING.lg * 3) / 2;

export const ProductSkeletonCard: React.FC<{ width?: number }> = ({ width = CARD_WIDTH }) => {
  const { colors } = useTheme();

  return (
    <View style={[styles.productWrapper, { width }]}>
      <Card style={[styles.productCard, { borderColor: colors.border, borderRadius: 16 }]}>
        {/* Image Placeholder */}
        <Skeleton width="100%" height={135} borderRadius={0} />

        {/* Info Area */}
        <View style={styles.productInfo}>
          <View>
            {/* Brand */}
            <Skeleton width={60} height={10} style={{ marginBottom: 6 }} />
            {/* Name lines */}
            <Skeleton width="90%" height={13} style={{ marginBottom: 4 }} />
            <Skeleton width="60%" height={13} />
          </View>

          <View style={{ marginTop: 8 }}>
            {/* Rating Row */}
            <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 6 }}>
              <Skeleton width={12} height={12} borderRadius={6} style={{ marginRight: 4 }} />
              <Skeleton width={30} height={10} />
            </View>

            {/* Price & Action Row */}
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
              <Skeleton width={55} height={16} />
              <Skeleton width={22} height={22} borderRadius={11} />
            </View>
          </View>
        </View>
      </Card>
    </View>
  );
};

export const CategorySkeletonItem: React.FC = () => {
  return (
    <View style={styles.categoryItem}>
      <Skeleton width={56} height={56} borderRadius={28} style={{ marginBottom: 6 }} />
      <Skeleton width={44} height={10} />
    </View>
  );
};

export const CouponSkeleton: React.FC = () => {
  const { isDark } = useTheme();

  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: SPACING.md,
        paddingVertical: 6,
        borderRadius: 999,
        backgroundColor: isDark ? "rgba(255,255,255,0.05)" : "#f1f5f9",
        borderColor: isDark ? "rgba(255,255,255,0.1)" : "#e2e8f0",
        borderWidth: 1,
        marginRight: SPACING.sm,
      }}
    >
      <Skeleton width={140} height={12} borderRadius={6} />
    </View>
  );
};

export const AdminCouponSkeleton: React.FC = () => {
  const { colors } = useTheme();

  return (
    <Card style={[styles.orderCard, { borderColor: colors.border, padding: SPACING.md, marginBottom: SPACING.sm }]}>
      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
        <Skeleton width={80} height={24} borderRadius={4} />
        <Skeleton width={60} height={20} />
      </View>
      <Skeleton width={180} height={12} style={{ marginTop: 12 }} />
      <View style={{ flexDirection: "row", gap: SPACING.sm, marginTop: SPACING.md }}>
        <Skeleton width={80} height={32} borderRadius={6} />
        <Skeleton width={80} height={32} borderRadius={6} />
      </View>
    </Card>
  );
};


export const OrderSkeletonCard: React.FC = () => {
  const { colors } = useTheme();

  return (
    <Card style={[styles.orderCard, { borderColor: colors.border }]}>
      {/* Top Header Row */}
      <View style={styles.orderHeader}>
        <View>
          <Skeleton width={130} height={14} style={{ marginBottom: 6 }} />
          <Skeleton width={90} height={10} />
        </View>
        <Skeleton width={70} height={20} borderRadius={10} />
      </View>

      <View style={[styles.orderDivider, { backgroundColor: colors.border }]} />

      {/* Bottom Footer Row */}
      <View style={styles.orderFooter}>
        <Skeleton width={90} height={12} />
        <Skeleton width={20} height={20} borderRadius={10} />
      </View>
    </Card>
  );
};

export const ProductDetailSkeleton: React.FC = () => {
  const { colors } = useTheme();

  return (
    <View style={styles.detailContainer}>
      {/* Hero Image Block */}
      <Skeleton width="100%" height={300} borderRadius={16} style={{ marginBottom: SPACING.md }} />

      {/* Thumbnails Row */}
      <View style={styles.thumbnailsRow}>
        <Skeleton width={56} height={56} borderRadius={8} style={{ marginRight: SPACING.sm }} />
        <Skeleton width={56} height={56} borderRadius={8} style={{ marginRight: SPACING.sm }} />
        <Skeleton width={56} height={56} borderRadius={8} style={{ marginRight: SPACING.sm }} />
      </View>

      {/* Brand & Name */}
      <Skeleton width={70} height={16} style={{ marginBottom: SPACING.sm }} />
      <Skeleton width="85%" height={24} style={{ marginBottom: SPACING.sm }} />
      <Skeleton width="60%" height={24} style={{ marginBottom: SPACING.md }} />

      {/* Rating bar */}
      <View style={{ flexDirection: "row", alignItems: "center", marginBottom: SPACING.lg }}>
        <Skeleton width={14} height={14} borderRadius={7} style={{ marginRight: 4 }} />
        <Skeleton width={40} height={12} style={{ marginRight: 12 }} />
        <Skeleton width={120} height={12} />
      </View>

      {/* Specification Card */}
      <Card style={[styles.orderCard, { borderColor: colors.border, padding: SPACING.md }]}>
        <Skeleton width={140} height={16} style={{ marginBottom: SPACING.md }} />
        <View style={styles.specRow}>
          <Skeleton width={80} height={12} />
          <Skeleton width={100} height={12} />
        </View>
        <View style={styles.specRow}>
          <Skeleton width={60} height={12} />
          <Skeleton width={80} height={12} />
        </View>
        <View style={styles.specRow}>
          <Skeleton width={90} height={12} />
          <Skeleton width={70} height={12} />
        </View>
      </Card>
    </View>
  );
};

export const ProductSkeletonFooter: React.FC<{ count: number; cardWidth?: number }> = ({ count, cardWidth = CARD_WIDTH }) => {
  return (
    <View style={{ flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between", paddingVertical: 12 }}>
      {Array.from({ length: count }).map((_, i) => (
        <ProductSkeletonCard key={`footer-skeleton-${i}`} width={cardWidth} />
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  productWrapper: {
    marginBottom: SPACING.md,
  },
  productCard: {
    padding: 0,
    overflow: "hidden",
    height: 255,
    width: "100%",
    borderWidth: 1,
  },
  productInfo: {
    padding: SPACING.sm,
    flex: 1,
    justifyContent: "space-between",
  },
  categoryItem: {
    alignItems: "center",
    marginRight: 18,
    width: 64,
  },
  orderCard: {
    padding: SPACING.md,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: SPACING.md,
  },
  orderHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  orderDivider: {
    height: 1,
    marginVertical: SPACING.md,
  },
  orderFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  detailContainer: {
    padding: SPACING.lg,
  },
  thumbnailsRow: {
    flexDirection: "row",
    marginBottom: SPACING.lg,
  },
  specRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: SPACING.sm,
    paddingVertical: 4,
  },
});
