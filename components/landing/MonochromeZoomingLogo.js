import { LinearGradient } from 'expo-linear-gradient';
import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import MonochromeFunnelLogo from './MonochromeFunnelLogo';

export default function MonochromeZoomingLogo() {
  const rotateY = useSharedValue(180);
  const rotateX = useSharedValue(25);
  const scale = useSharedValue(1.95);
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(-20);

  const haloScale = useSharedValue(0.5);
  const haloOpacity = useSharedValue(0);

  useEffect(() => {
    // 3.5s 3D Flip & Zoom-out entrance
    rotateY.value = withTiming(0, {
      duration: 2000,
      easing: Easing.bezier(0.16, 1, 0.3, 1),
    });

    rotateX.value = withTiming(0, {
      duration: 2000,
      easing: Easing.bezier(0.16, 1, 0.3, 1),
    });

    scale.value = withTiming(1.0, {
      duration: 2000,
      easing: Easing.bezier(0.16, 1, 0.3, 1),
    });

    opacity.value = withTiming(1.0, {
      duration: 1400,
      easing: Easing.out(Easing.quad),
    });

    translateY.value = withSpring(0, {
      damping: 14,
      stiffness: 70,
    });

    setTimeout(() => {
      haloScale.value = withRepeat(
        withTiming(1.3, { duration: 2600, easing: Easing.inOut(Easing.quad) }),
        -1,
        true
      );

      haloOpacity.value = withRepeat(
        withTiming(0.4, { duration: 2600, easing: Easing.inOut(Easing.quad) }),
        -1,
        true
      );
    }, 1500);
  }, []);

  const logo3DStyle = useAnimatedStyle(() => ({
    transform: [
      { perspective: 1200 },
      { rotateY: `${rotateY.value}deg` },
      { rotateX: `${rotateX.value}deg` },
      { scale: scale.value },
      { translateY: translateY.value },
    ],
    opacity: opacity.value,
  }));

  const haloAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value * haloScale.value }],
    opacity: opacity.value * haloOpacity.value,
  }));

  return (
    <View style={styles.container}>
      {/* Background Soft Purple Glow Halo */}
      <Animated.View style={[styles.haloRing, haloAnimatedStyle]}>
        <LinearGradient
          colors={['rgba(139, 92, 246, 0.45)', 'rgba(99, 102, 241, 0.15)', 'transparent']}
          style={styles.haloGradient}
        />
      </Animated.View>

      {/* Squircle Funnel Logo with 3D Flip */}
      <Animated.View style={[styles.logoWrapper, logo3DStyle]}>
        <MonochromeFunnelLogo size={96} />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 140,
    height: 140,
    marginBottom: 16,
  },
  haloRing: {
    position: 'absolute',
    width: 120,
    height: 120,
    borderRadius: 36,
  },
  haloGradient: {
    width: '100%',
    height: '100%',
    borderRadius: 36,
    filter: 'blur(20px)',
  },
  logoWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
