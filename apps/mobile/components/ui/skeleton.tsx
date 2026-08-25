import React, { useEffect, useRef } from "react"
import { Animated, ViewStyle, StyleProp } from "react-native"
import { useThemeColor } from "@/hooks/use-theme-color"

interface SkeletonProps {
  style?: StyleProp<ViewStyle>
  width?: number | string
  height?: number | string
  borderRadius?: number
}

export function Skeleton({
  style,
  width,
  height,
  borderRadius = 8,
}: SkeletonProps) {
  const { colors } = useThemeColor()
  const opacity = useRef(new Animated.Value(0.35)).current

  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 0.8,
          duration: 750,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0.35,
          duration: 750,
          useNativeDriver: true,
        }),
      ])
    )
    pulse.start()

    return () => pulse.stop()
  }, [opacity])

  return (
    <Animated.View
      style={[
        {
          backgroundColor: colors.surface,
          borderRadius,
          width: width as any,
          height: height as any,
          opacity,
        },
        style,
      ]}
    />
  )
}
