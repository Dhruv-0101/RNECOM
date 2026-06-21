import React, { useState, useMemo } from "react";
import {
  Modal,
  StyleSheet,
  View,
  TouchableOpacity,
  TextInput,
  FlatList,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  Keyboard,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "@/src/shared/providers/ThemeProvider";
import { Text } from "@/src/shared/ui/Text";
import { SPACING, BORDER_RADIUS } from "@/src/shared/constants/spacing";
import { useLocation } from "../hooks/useLocation";
import { CITIES, CitySuggestion } from "../constants/cities";

interface LocationBottomSheetProps {
  visible: boolean;
  onClose: () => void;
}

export function LocationBottomSheet({
  visible,
  onClose,
}: LocationBottomSheetProps) {
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const [searchQuery, setSearchQuery] = useState("");

  const {
    selectedLocation,
    loading: gpsLoading,
    error: gpsError,
    fetchCurrentLocation,
    selectManualLocation,
  } = useLocation();

  // Popular cities for quick selection chips
  const popularCities = useMemo(() => {
    return CITIES.slice(0, 15); // First 6 cities: Ahmedabad, Surat, Vadodara, Rajkot, Gandhinagar, Mumbai
  }, []);

  // Filtered list of cities based on search query
  const filteredCities = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const query = searchQuery.toLowerCase().trim();
    return CITIES.filter(
      (item) =>
        item.city.toLowerCase().includes(query) ||
        item.state.toLowerCase().includes(query),
    );
  }, [searchQuery]);

  const handleUseCurrentLocation = async () => {
    const result = await fetchCurrentLocation();
    if (result.success) {
      onClose();
    }
  };

  const handleSelectCity = (cityItem: CitySuggestion) => {
    selectManualLocation({
      latitude: cityItem.latitude,
      longitude: cityItem.longitude,
      city: cityItem.city,
      state: cityItem.state,
      country: cityItem.country,
    });
    setSearchQuery("");
    onClose();
  };

  /*
  Overlay Modal Touch (Line 86): Click outside modal closure logic explain karne ke liye comment add kiya.
Drag Handle (Line 99): Top indicator bar visual cues design pattern ke liye short explanation comment update kiya.
KeyboardAvoidingView (Line 128): View shift functionality on soft keyboard trigger explain karne ke liye one-liner insert kiya.
  */

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      {/* Dismisses/closes the bottom sheet modal when clicking outside on the dark background overlay */}
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.overlay}>
          <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <View
              style={[
                styles.sheetContainer,
                {
                  backgroundColor: colors.surface,
                  paddingBottom: insets.bottom + SPACING.lg,
                },
              ]}
            >
              {/* Drag Handle Indicator: Visual cue showing that the sheet can be swiped or dragged down */}
              <View
                style={[
                  styles.dragHandle,
                  {
                    backgroundColor: isDark
                      ? "rgba(255,255,255,0.1)"
                      : "#cbd5e1",
                  },
                ]}
              />

              {/* Header */}
              <View style={styles.header}>
                <Text variant="lg" weight="bold" color={colors.text}>
                  Select Location
                </Text>
                <TouchableOpacity
                  onPress={onClose}
                  style={[
                    styles.closeButton,
                    { backgroundColor: colors.inputBg },
                  ]}
                  activeOpacity={0.8}
                >
                  <Ionicons name="close" size={20} color={colors.text} />
                </TouchableOpacity>
              </View>

              {/* Main Content - Wrapped in KeyboardAvoidingView to prevent inputs from being covered by the soft keyboard */}
              <KeyboardAvoidingView
                behavior={Platform.OS === "ios" ? "padding" : undefined}
                style={styles.keyboardContainer}
              >
                {/* 1. GPS Button */}
                <TouchableOpacity
                  onPress={handleUseCurrentLocation}
                  disabled={gpsLoading}
                  style={[
                    styles.gpsButton,
                    {
                      backgroundColor: isDark
                        ? "rgba(99, 102, 241, 0.1)"
                        : "#f5f3ff",
                      borderColor: isDark
                        ? "rgba(99, 102, 241, 0.2)"
                        : "#ddd6fe",
                    },
                  ]}
                  activeOpacity={0.7}
                >
                  {gpsLoading ? (
                    <ActivityIndicator size="small" color={colors.primary} />
                  ) : (
                    <Ionicons name="locate" size={22} color={colors.primary} />
                  )}
                  <View style={styles.gpsTextContainer}>
                    <Text variant="sm" weight="semibold" color={colors.primary}>
                      Use Current Location
                    </Text>
                    <Text variant="xs" color={colors.textMuted}>
                      Using GPS to detect city
                    </Text>
                  </View>
                  <Ionicons
                    name="chevron-forward"
                    size={16}
                    color={colors.primary}
                  />
                </TouchableOpacity>

                {/* GPS Fetch Error */}
                {gpsError && (
                  <View
                    style={[
                      styles.errorContainer,
                      {
                        backgroundColor: isDark
                          ? "rgba(239,68,68,0.1)"
                          : "#fef2f2",
                      },
                    ]}
                  >
                    <Ionicons
                      name="alert-circle"
                      size={16}
                      color={colors.error}
                    />
                    <Text
                      variant="xs"
                      color={colors.error}
                      style={styles.errorText}
                    >
                      {gpsError}
                    </Text>
                  </View>
                )}

                {/* Divider */}
                <View
                  style={[styles.divider, { backgroundColor: colors.border }]}
                />

                {/* 2. Manual Search Input */}
                <View
                  style={[
                    styles.searchBox,
                    {
                      backgroundColor: colors.inputBg,
                      borderColor: colors.border,
                    },
                  ]}
                >
                  <Ionicons
                    name="search"
                    size={18}
                    color={colors.inputPlaceholder}
                    style={styles.searchIcon}
                  />
                  <TextInput
                    placeholder="Search city, state..."
                    placeholderTextColor={colors.inputPlaceholder}
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                    style={[styles.searchInput, { color: colors.text }]}
                    clearButtonMode="while-editing"
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                </View>

                {/* Suggestions / Popular Cities */}
                {searchQuery.trim().length === 0 ? (
                  <View style={styles.popularContainer}>
                    <Text
                      variant="xs"
                      weight="semibold"
                      color={colors.textMuted}
                      style={styles.sectionTitle}
                    >
                      POPULAR CITIES
                    </Text>
                    <View style={styles.chipsContainer}>
                      {popularCities.map((cityItem) => {
                        const isSelected =
                          selectedLocation?.city === cityItem.city;
                        return (
                          <TouchableOpacity
                            key={cityItem.city}
                            onPress={() => handleSelectCity(cityItem)}
                            style={[
                              styles.chip,
                              {
                                backgroundColor: isSelected
                                  ? colors.primary
                                  : isDark
                                    ? "rgba(255, 255, 255, 0.05)"
                                    : "#f1f5f9",
                                borderColor: isSelected
                                  ? colors.primary
                                  : colors.border,
                              },
                            ]}
                          >
                            <Text
                              variant="xs"
                              weight="medium"
                              color={isSelected ? "#ffffff" : colors.text}
                            >
                              {cityItem.city}
                            </Text>
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  </View>
                ) : (
                  <FlatList
                    data={filteredCities}
                    keyExtractor={(item) => `${item.city}-${item.state}`}
                    renderItem={({ item }) => (
                      <TouchableOpacity
                        onPress={() => handleSelectCity(item)}
                        style={[
                          styles.resultItem,
                          { borderBottomColor: colors.border },
                        ]}
                      >
                        <Ionicons
                          name="location-outline"
                          size={18}
                          color={colors.textMuted}
                        />
                        <View style={styles.resultTextContainer}>
                          <Text
                            variant="sm"
                            weight="semibold"
                            color={colors.text}
                          >
                            {item.city}
                          </Text>
                          <Text variant="xs" color={colors.textMuted}>
                            {item.state}, {item.country}
                          </Text>
                        </View>
                        <Ionicons
                          name="chevron-forward"
                          size={14}
                          color={colors.textMuted}
                        />
                      </TouchableOpacity>
                    )}
                    ListEmptyComponent={
                      <View style={styles.emptyContainer}>
                        <Ionicons
                          name="search-outline"
                          size={32}
                          color={colors.textMuted}
                        />
                        <Text
                          variant="sm"
                          color={colors.textMuted}
                          style={{ marginTop: SPACING.xs }}
                        >
                          No cities found matching "{searchQuery}"
                        </Text>
                      </View>
                    }
                    style={styles.resultsList}
                    keyboardShouldPersistTaps="handled"
                  />
                )}
              </KeyboardAvoidingView>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(15, 23, 42, 0.55)",
    justifyContent: "flex-end",
  },
  sheetContainer: {
    borderTopLeftRadius: BORDER_RADIUS.xl,
    borderTopRightRadius: BORDER_RADIUS.xl,
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.md,
    maxHeight: "80%",
  },
  dragHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    alignSelf: "center",
    marginBottom: SPACING.sm,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: SPACING.md,
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: BORDER_RADIUS.sm,
    alignItems: "center",
    justifyContent: "center",
  },
  keyboardContainer: {
    width: "100%",
  },
  gpsButton: {
    flexDirection: "row",
    alignItems: "center",
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    marginBottom: SPACING.sm,
  },
  gpsTextContainer: {
    flex: 1,
    marginLeft: SPACING.md,
  },
  errorContainer: {
    flexDirection: "row",
    alignItems: "center",
    padding: SPACING.sm,
    borderRadius: BORDER_RADIUS.sm,
    marginBottom: SPACING.md,
  },
  errorText: {
    marginLeft: SPACING.xs,
    flex: 1,
  },
  divider: {
    height: 1,
    width: "100%",
    marginVertical: SPACING.md,
  },
  searchBox: {
    flexDirection: "row",
    alignItems: "center",
    height: 44,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    paddingHorizontal: SPACING.sm,
    marginBottom: SPACING.md,
  },
  searchIcon: {
    marginRight: SPACING.xs,
  },
  searchInput: {
    flex: 1,
    height: "100%",
    fontSize: 14,
    padding: 0,
  },
  popularContainer: {
    marginBottom: SPACING.md,
  },
  sectionTitle: {
    marginBottom: SPACING.sm,
    letterSpacing: 0.5,
  },
  chipsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginHorizontal: -SPACING.xs,
  },
  chip: {
    paddingHorizontal: SPACING.md,
    paddingVertical: 8,
    borderRadius: BORDER_RADIUS.round,
    borderWidth: 1,
    marginHorizontal: SPACING.xs,
    marginVertical: SPACING.xs,
  },
  resultsList: {
    maxHeight: 280,
  },
  resultItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
  },
  resultTextContainer: {
    flex: 1,
    marginLeft: SPACING.md,
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: SPACING.xl,
  },
});
