import React, { useEffect } from 'react';
import { StyleSheet, Text, Pressable, View } from 'react-native';
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
      withTiming(0.75, { duration: 1800, easing: Easing.inOut(Easing.quad) }),
      -1,
      true
    );

    glowScale.value = withRepeat(
      withTiming(1.05, { duration: 1800, easing: Easing.inOut(Easing.quad) }),
      -1,
      true
    );
  }, []);

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
      {/* Outer Breathing Glow */}
      <Animated.View style={[styles.breathingGlow, glowStyle]}>
        <LinearGradient
          colors={['rgba(99, 102, 241, 0.6)', 'rgba(139, 92, 246, 0.2)']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.glowGradient}
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
            {/* Burst Overlay */}
            <Animated.View style={[styles.burstOverlay, burstStyle]}>
              <LinearGradient
                colors={['rgba(255, 255, 255, 0.6)', 'rgba(99, 102, 241, 0)']}
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
    width: '85%',
    height: 56,
    borderRadius: 9999,
  },
  glowGradient: {
    width: '100%',
    height: '100%',
    borderRadius: 9999,
    filter: 'blur(16px)',
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
