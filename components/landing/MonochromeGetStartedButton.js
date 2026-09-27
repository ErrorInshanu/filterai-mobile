import React, { useEffect } from 'react';
import { StyleSheet, Text, Pressable } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withRepeat,
  withTiming,
  Easing,
  FadeInUp,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { ArrowRight } from 'lucide-react-native';

export default function MonochromeGetStartedButton({ onPress, title = 'Get Started', delay = 4200 }) {
  const scale = useSharedValue(1);
  const glowOpacity = useSharedValue(0.35);
  const glowScale = useSharedValue(1);
  const burstScale = useSharedValue(0);
  const burstOpacity = useSharedValue(0);

  useEffect(() => {
    glowOpacity.value = withRepeat(
      withTiming(0.85, { duration: 1800, easing: Easing.inOut(Easing.quad) }),
      -1,
      true
    );

    glowScale.value = withRepeat(
      withTiming(1.08, { duration: 1800, easing: Easing.inOut(Easing.quad) }),
      -1,
      true
    );
  }, [glowOpacity, glowScale]);

  const handlePressIn = () => {
    scale.value = withSpring(0.95, { damping: 15, stiffness: 250 });
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 12, stiffness: 200 });

    burstScale.value = 0.5;
    burstOpacity.value = 0.8;

    burstScale.value = withTiming(1.5, { duration: 450, easing: Easing.out(Easing.quad) });
    burstOpacity.value = withTiming(0, { duration: 450, easing: Easing.out(Easing.quad) });

    if (onPress) {
      onPress();
    }
  };

  const buttonStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const glowStyle = useAnimatedStyle(() => ({
    opacity: glowOpacity.value,
    transform: [{ scale: glowScale.value }],
  }));

  const burstStyle = useAnimatedStyle(() => ({
    transform: [{ scale: burstScale.value }],
    opacity: burstOpacity.value,
  }));

  return (
    <Animated.View entering={FadeInUp.delay(delay).duration(800)} style={styles.outerContainer}>
      {/* Outer Breathing Glow (Multi-layered native diffusion halo) */}
      <Animated.View style={[styles.breathingGlow, glowStyle]}>
        {/* Layer 1: Wide soft outer aura */}
        <LinearGradient
          colors={['rgba(99, 102, 241, 0.35)', 'rgba(139, 92, 246, 0.15)', 'transparent']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.glowLayerOuter}
        />
        {/* Layer 2: Concentrated core illumination */}
        <LinearGradient
          colors={['rgba(99, 102, 241, 0.65)', 'rgba(139, 92, 246, 0.35)', 'transparent']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.glowLayerInner}
        />
      </Animated.View>

      {/* Button Body */}
      <Animated.View style={[styles.buttonWrapper, buttonStyle]}>
        <Pressable
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          style={styles.pressable}
        >
          <LinearGradient
            colors={['#6366F1', '#4F46E5']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.gradientButton}
          >
            {/* Burst Overlay on press release */}
            <Animated.View style={[styles.burstOverlay, burstStyle]} pointerEvents="none">
              <LinearGradient
                colors={['rgba(255, 255, 255, 0.7)', 'rgba(139, 92, 246, 0.3)', 'transparent']}
                start={{ x: 0.5, y: 0.5 }}
                end={{ x: 1, y: 1 }}
                style={styles.burstGradient}
              />
            </Animated.View>

            <Text style={styles.buttonText}>{title}</Text>
            <ArrowRight size={20} color="#FFFFFF" strokeWidth={2.2} />
          </LinearGradient>
        </Pressable>
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  outerContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    marginVertical: 12,
  },
  breathingGlow: {
    position: 'absolute',
    width: '90%',
    maxWidth: 340,
    height: 68,
    borderRadius: 9999,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#6366F1',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 22,
    elevation: 12,
  },
  glowLayerOuter: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    borderRadius: 9999,
  },
  glowLayerInner: {
    position: 'absolute',
    width: '92%',
    height: 56,
    borderRadius: 9999,
  },
  buttonWrapper: {
    width: '85%',
    maxWidth: 320,
    height: 56,
    borderRadius: 9999,
    shadowColor: '#6366F1',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 10,
  },
  pressable: {
    width: '100%',
    height: '100%',
    borderRadius: 9999,
    overflow: 'hidden',
  },
  gradientButton: {
    width: '100%',
    height: '100%',
    borderRadius: 9999,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  burstOverlay: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 9999,
  },
  burstGradient: {
    width: '100%',
    height: '100%',
    borderRadius: 9999,
  },
  buttonText: {
    fontSize: 17,
    fontWeight: '700',
    color: '#FFFFFF',
    marginRight: 10,
    letterSpacing: 0.2,
  },
});

