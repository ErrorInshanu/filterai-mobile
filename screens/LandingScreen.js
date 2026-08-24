import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';

// Custom Components
import MonochromeBackground from '../components/landing/MonochromeBackground';
import MonochromeGetStartedButton from '../components/landing/MonochromeGetStartedButton';
import MonochromeZoomingLogo from '../components/landing/MonochromeZoomingLogo';

export default function LandingScreen() {
  const navigation = useNavigation();

  const handleGetStarted = () => {
    navigation.navigate('Login');
  };

  return (
    <View style={styles.container}>
      {/* Background with subtle wave contours */}
      <MonochromeBackground />

      <SafeAreaView style={styles.safeArea}>
        <View style={styles.contentContainer}>
          {/* Hero Section */}
          <View style={styles.heroSection}>
            {/* 3.5s 3D Flipping Squircle Funnel Logo */}
            <MonochromeZoomingLogo />

            {/* Wordmark Title: FilterAI */}
            <Animated.View entering={FadeInDown.delay(2000).duration(800)}>
              <Text style={styles.wordmarkTitle}>
                Filter<Text style={styles.accentText}>AI</Text>
              </Text>
            </Animated.View>

            {/* Subtitle */}
            <Animated.View entering={FadeInDown.delay(2000).duration(800)}>
              <Text style={styles.subtitleText}>
                AI-Powered Recruitment Screening
              </Text>
            </Animated.View>

            {/* Tagline */}
            <Animated.View entering={FadeInDown.delay(2000).duration(800)}>
              <Text style={styles.taglineText}>
                Smarter screening.{'\n'}Better hiring.
              </Text>
            </Animated.View>
          </View>

          {/* Action Section */}
          <View style={styles.actionSection}>
            <MonochromeGetStartedButton onPress={handleGetStarted} delay={2000} />
          </View>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#090C16',
  },
  safeArea: {
    flex: 1,
  },
  contentContainer: {
    flex: 1,
    paddingHorizontal: 28,
    justifyContent: 'space-between',
    paddingTop: 32,
    paddingBottom: 28,
  },
  heroSection: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  wordmarkTitle: {
    fontSize: 40,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: -0.5,
    textAlign: 'center',
    marginTop: 12,
    marginBottom: 8,
  },
  accentText: {
    color: '#A78BFA',
  },
  subtitleText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#9CA3AF',
    textAlign: 'center',
    letterSpacing: -0.2,
    marginBottom: 24,
  },
  taglineText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 20,
  },
  actionSection: {
    alignItems: 'center',
    width: '100%',
  },
});
