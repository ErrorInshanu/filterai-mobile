import React, { useEffect } from 'react';
import { StyleSheet, View, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Path } from 'react-native-svg';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  Easing,
} from 'react-native-reanimated';

const { width, height } = Dimensions.get('window');

export default function MonochromeBackground() {
  const waveOpacity = useSharedValue(0.3);

  useEffect(() => {
    waveOpacity.value = withRepeat(
      withTiming(0.6, { duration: 4000, easing: Easing.inOut(Easing.sin) }),
      -1,
      true
    );
  }, []);

  const waveStyle = useAnimatedStyle(() => ({
    opacity: waveOpacity.value,
  }));

  return (
    <View style={StyleSheet.absoluteFillObject} pointerEvents="none">
      {/* Dark Midnight Navy Gradient */}
      <LinearGradient
        colors={['#090C16', '#0E1324', '#080A12']}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={StyleSheet.absoluteFillObject}
      />

      {/* Top Subtle Ambient Glow */}
      <View style={styles.topGlow}>
        <LinearGradient
          colors={['rgba(139, 92, 246, 0.15)', 'transparent']}
          style={styles.topGlowGrad}
        />
      </View>

      {/* Bottom Wave Lines matching screenshot */}
      <Animated.View style={[styles.waveContainer, waveStyle]}>
        <Svg width={width} height={height * 0.35} viewBox="0 0 400 200" fill="none">
          <Path
            d="M 0 100 Q 100 40 200 110 T 400 80"
            stroke="rgba(139, 92, 246, 0.25)"
            strokeWidth="1.5"
            fill="none"
          />
          <Path
            d="M 0 130 Q 120 70 240 140 T 400 110"
            stroke="rgba(99, 102, 241, 0.2)"
            strokeWidth="1.5"
            fill="none"
          />
          <Path
            d="M 0 160 Q 140 100 260 170 T 400 140"
            stroke="rgba(167, 139, 250, 0.15)"
            strokeWidth="1.5"
            fill="none"
          />
        </Svg>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  topGlow: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 300,
  },
  topGlowGrad: {
    width: '100%',
    height: '100%',
  },
  waveContainer: {
    position: 'absolute',
    bottom: 40,
    left: 0,
    right: 0,
  },
});
