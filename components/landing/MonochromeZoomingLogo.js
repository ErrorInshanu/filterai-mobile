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
      {/* Background Soft Purple Glow Halo (Multi-layered native diffusion) */}
      <Animated.View style={[styles.haloRing, haloAnimatedStyle]}>
        {/* Layer 1: Wide soft outer aura */}
        <LinearGradient
          colors={['rgba(139, 92, 246, 0.35)', 'rgba(99, 102, 241, 0.12)', 'transparent']}
          style={styles.haloLayerOuter}
        />
        {/* Layer 2: Concentrated inner glow */}
        <LinearGradient
          colors={['rgba(139, 92, 246, 0.6)', 'rgba(99, 102, 241, 0.25)', 'transparent']}
          style={styles.haloLayerInner}
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
    width: 130,
    height: 130,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#8B5CF6',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.85,
    shadowRadius: 24,
    elevation: 12,
  },
  haloLayerOuter: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    borderRadius: 40,
  },
  haloLayerInner: {
    position: 'absolute',
    width: '84%',
    height: '84%',
    borderRadius: 32,
  },
  logoWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});

