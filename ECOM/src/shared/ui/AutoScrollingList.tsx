import React, { useRef, useEffect, useState } from "react";
import { ScrollView, View, StyleSheet, NativeSyntheticEvent, NativeScrollEvent } from "react-native";

interface AutoScrollingListProps<T> {
  data: T[];
  renderItem: (item: T, index: number) => React.ReactElement;
  speed?: number; // pixels per step (slow crawl)
  stepInterval?: number; // ms per step (e.g. 16ms for ~60fps)
  resumeDelay?: number; // ms to wait before resuming auto-scroll after user interaction
  contentContainerStyle?: any;
}

export function AutoScrollingList<T>({
  data,
  renderItem,
  speed = 0.4,
  stepInterval = 16,
  resumeDelay = 2000,
  contentContainerStyle,
}: AutoScrollingListProps<T>) {
  const scrollViewRef = useRef<ScrollView>(null);
  const [setWidth, setSetWidth] = useState(0);
  const [containerWidth, setContainerWidth] = useState(0);
  const scrollX = useRef(0);
  const isInteracting = useRef(false);
  const isAnimatingBack = useRef(false);
  const autoScrollTimer = useRef<ReturnType<typeof setInterval> | null>(null);
  const resumeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const dataString = JSON.stringify(data);

  // Reset scroll offset if data changes
  useEffect(() => {
    scrollX.current = 0;
    scrollViewRef.current?.scrollTo({ x: 0, animated: false });
  }, [dataString]);

  // Determine if we actually need to scroll (content width > container width)
  const shouldScroll = setWidth > 0 && containerWidth > 0 && setWidth > containerWidth;
  const maxScroll = shouldScroll ? setWidth - containerWidth : 0;

  // Initialize/start scroll when setWidth is determined and scrolling is needed
  useEffect(() => {
    if (shouldScroll) {
      scrollX.current = 0;
      scrollViewRef.current?.scrollTo({ x: 0, animated: false });
      startAutoScroll();
    } else {
      stopAutoScroll();
    }
    return () => {
      stopAutoScroll();
      if (resumeTimer.current) clearTimeout(resumeTimer.current);
    };
  }, [setWidth, shouldScroll]);

  const startAutoScroll = () => {
    if (!shouldScroll) return;
    stopAutoScroll();
    autoScrollTimer.current = setInterval(() => {
      if (isInteracting.current || isAnimatingBack.current || setWidth === 0) return;

      scrollX.current += speed;
      if (scrollX.current >= maxScroll) {
        // Animate back to the start smoothly
        isAnimatingBack.current = true;
        scrollViewRef.current?.scrollTo({ x: 0, animated: true });
        scrollX.current = 0;

        // Pause briefly during the animation, then reset and continue
        setTimeout(() => {
          isAnimatingBack.current = false;
        }, 1000);
      } else {
        scrollViewRef.current?.scrollTo({ x: scrollX.current, animated: false });
      }
    }, stepInterval);
  };

  const stopAutoScroll = () => {
    if (autoScrollTimer.current) {
      clearInterval(autoScrollTimer.current);
      autoScrollTimer.current = null;
    }
  };

  const handleScrollBeginDrag = () => {
    if (!shouldScroll) return;
    isInteracting.current = true;
    isAnimatingBack.current = false; // Abort scroll-back state immediately if user drags
    stopAutoScroll();
    if (resumeTimer.current) clearTimeout(resumeTimer.current);
  };

  const handleScrollEndDrag = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    if (!shouldScroll) return;
    const x = event.nativeEvent.contentOffset.x;
    scrollX.current = Math.max(0, Math.min(maxScroll, x)); // Clamp offset to valid bounds

    if (resumeTimer.current) clearTimeout(resumeTimer.current);
    resumeTimer.current = setTimeout(() => {
      isInteracting.current = false;
      startAutoScroll();
    }, resumeDelay);
  };

  const handleMomentumScrollBegin = () => {
    if (!shouldScroll) return;
    isInteracting.current = true;
    isAnimatingBack.current = false; // Abort scroll-back state immediately if momentum starts
    stopAutoScroll();
    if (resumeTimer.current) clearTimeout(resumeTimer.current);
  };

  const handleMomentumScrollEnd = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    if (!shouldScroll) return;
    const x = event.nativeEvent.contentOffset.x;
    scrollX.current = Math.max(0, Math.min(maxScroll, x)); // Clamp offset to valid bounds
    isInteracting.current = false;

    if (resumeTimer.current) clearTimeout(resumeTimer.current);
    resumeTimer.current = setTimeout(() => {
      startAutoScroll();
    }, resumeDelay);
  };

  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    if (!shouldScroll) return;
    const x = event.nativeEvent.contentOffset.x;
    if (!isAnimatingBack.current) {
      scrollX.current = Math.max(0, Math.min(maxScroll, x)); // Clamp offset to valid bounds
    }
  };

  if (!data || data.length === 0) return null;

  return (
    <ScrollView
      ref={scrollViewRef}
      horizontal
      showsHorizontalScrollIndicator={false}
      scrollEnabled={shouldScroll}
      onScrollBeginDrag={shouldScroll ? handleScrollBeginDrag : undefined}
      onScrollEndDrag={shouldScroll ? handleScrollEndDrag : undefined}
      onMomentumScrollBegin={shouldScroll ? handleMomentumScrollBegin : undefined}
      onMomentumScrollEnd={shouldScroll ? handleMomentumScrollEnd : undefined}
      onScroll={shouldScroll ? handleScroll : undefined}
      scrollEventThrottle={16}
      onLayout={(e) => setContainerWidth(e.nativeEvent.layout.width)}
      contentContainerStyle={[contentContainerStyle, { flexDirection: "row" }]}
    >
      <View
        style={styles.setContainer}
        onLayout={(e) => setSetWidth(e.nativeEvent.layout.width)}
      >
        {data.map((item, index) => (
          <View key={index} style={styles.itemWrapper}>
            {renderItem(item, index)}
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  setContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  itemWrapper: {
    flexDirection: "row",
    alignItems: "center",
  },
});
