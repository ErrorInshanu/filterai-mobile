import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeInDown, FadeIn } from 'react-native-reanimated';
import { CheckCircle2, Eye, EyeOff, AlertCircle } from 'lucide-react-native';

import MonochromeBackground from '../components/landing/MonochromeBackground';
import MonochromeFunnelLogo from '../components/landing/MonochromeFunnelLogo';
import { useAppStore } from '../store/useAppStore';
import { API_URL } from '../constants/api';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function LoginScreen() {
  const navigation = useNavigation();
  const setAuth = useAppStore((state) => state.setAuth);

  const [activeTab, setActiveTab] = useState('login'); // 'login' | 'signup'
  const [fullName, setFullName] = useState('');
  const [workEmail, setWorkEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Field touched/evaluated states
  const [nameTouched, setNameTouched] = useState(false);
  const [emailTouched, setEmailTouched] = useState(false);
  const [passwordTouched, setPasswordTouched] = useState(false);

  // Loading and error states
  const [isSubmitting, setIsSubmitting] = useState(false); // In-flight network request
  const [isSuccessLoading, setIsSuccessLoading] = useState(false); // 3-second post-success spinner
  const [errorMessage, setErrorMessage] = useState('');

  const isSignUp = activeTab === 'signup';

  // Debounce timers for typing validation (3 seconds of inactivity)
  const nameTimerRef = useRef(null);
  const emailTimerRef = useRef(null);
  const passwordTimerRef = useRef(null);

  // Name debouncing
  useEffect(() => {
    if (fullName) {
      if (nameTimerRef.current) clearTimeout(nameTimerRef.current);
      nameTimerRef.current = setTimeout(() => {
        setNameTouched(true);
      }, 3000);
    }
    return () => {
      if (nameTimerRef.current) clearTimeout(nameTimerRef.current);
    };
  }, [fullName]);

  // Email debouncing
  useEffect(() => {
    if (workEmail) {
      if (emailTimerRef.current) clearTimeout(emailTimerRef.current);
      emailTimerRef.current = setTimeout(() => {
        setEmailTouched(true);
      }, 3000);
    }
    return () => {
      if (emailTimerRef.current) clearTimeout(emailTimerRef.current);
    };
  }, [workEmail]);

  // Password debouncing
  useEffect(() => {
    if (password) {
      if (passwordTimerRef.current) clearTimeout(passwordTimerRef.current);
      passwordTimerRef.current = setTimeout(() => {
        setPasswordTouched(true);
      }, 3000);
    }
    return () => {
      if (passwordTimerRef.current) clearTimeout(passwordTimerRef.current);
    };
  }, [password]);

  // Validation rules
  const isNameValid = fullName.trim().length > 0;
  const isEmailValid = EMAIL_REGEX.test(workEmail.trim());
  const isPasswordValid = password.length >= 8;

  // Form validity for submit button
  const isFormValid = isSignUp
    ? isNameValid && isEmailValid && isPasswordValid
    : isEmailValid && isPasswordValid;

  const handleTabSwitch = (tab) => {
    setActiveTab(tab);
    setErrorMessage('');
    setNameTouched(false);
    setEmailTouched(false);
    setPasswordTouched(false);
  };

  const handleSubmit = async () => {
    if (!isFormValid || isSubmitting || isSuccessLoading) return;

    setErrorMessage('');
    setIsSubmitting(true);

    const endpoint = isSignUp ? `${API_URL}/auth/signup` : `${API_URL}/auth/login`;
    const payload = isSignUp
      ? { email: workEmail.trim(), password, name: fullName.trim() }
      : { email: workEmail.trim(), password };

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        setIsSubmitting(false);
        if (response.status === 401) {
          setErrorMessage('Invalid email or password');
        } else if (data && data.detail) {
          setErrorMessage(
            typeof data.detail === 'string' ? data.detail : 'Registration failed'
          );
        } else {
          setErrorMessage('Authentication failed. Please try again.');
        }
        return;
      }

      // API success: save to Zustand store
      if (data && data.token && data.user) {
        setAuth(data.user, data.token);
      }

      // Transition to separate 3-second post-success loading state
      setIsSubmitting(false);
      setIsSuccessLoading(true);

      setTimeout(() => {
        navigation.replace('Home');
      }, 3000);
    } catch (_err) {
      setIsSubmitting(false);
      setErrorMessage(
        'Unable to reach the server. Please check your network connection.'
      );
    }
  };

  return (
    <View style={styles.container}>
      <MonochromeBackground />

      <SafeAreaView style={styles.safeArea}>
        <KeyboardAvoidingView
          style={styles.keyboardView}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {/* Header with Squircle Funnel Logo & Title */}
            <Animated.View
              entering={FadeInDown.duration(600)}
              style={styles.headerContainer}
            >
              <View style={styles.logoBadge}>
                <MonochromeFunnelLogo size={64} />
              </View>
              <Text style={styles.title}>
                {isSignUp ? 'Create Account' : 'Welcome Back'}
              </Text>
            </Animated.View>

            {/* Post-Success State (Separate 3-Second Centered Spinner) */}
            {isSuccessLoading ? (
              <Animated.View entering={FadeIn.duration(400)} style={styles.successCard}>
                <ActivityIndicator size="large" color="#8B5CF6" style={styles.successSpinner} />
                <Text style={styles.successTitle}>
                  {isSignUp ? 'Account created successfully!' : 'Signed in successfully!'}
                </Text>
                <Text style={styles.successSubtitle}>Taking you to dashboard...</Text>
              </Animated.View>
            ) : (
              /* Main Form Card */
              <Animated.View
                entering={FadeInDown.delay(150).duration(600)}
                style={styles.formCard}
              >
                {/* Segmented Pill Control Tab Toggle */}
                <View style={styles.tabToggleContainer}>
                  <TouchableOpacity
                    style={[styles.tabButton, !isSignUp && styles.tabButtonActive]}
                    onPress={() => handleTabSwitch('login')}
                    activeOpacity={0.8}
                  >
                    <Text style={[styles.tabText, !isSignUp && styles.tabTextActive]}>
                      Log In
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.tabButton, isSignUp && styles.tabButtonActive]}
                    onPress={() => handleTabSwitch('signup')}
                    activeOpacity={0.8}
                  >
                    <Text style={[styles.tabText, isSignUp && styles.tabTextActive]}>
                      Create Account
                    </Text>
                  </TouchableOpacity>
                </View>

                {/* Full Name Input (Signup only) */}
                {isSignUp && (
                  <View style={styles.inputGroup}>
                    <View
                      style={[
                        styles.inputWrapper,
                        nameTouched && (isNameValid ? styles.inputValid : styles.inputInvalid),
                      ]}
                    >
                      <TextInput
                        style={styles.input}
                        placeholder="Full Name"
                        placeholderTextColor="#6B7280"
                        value={fullName}
                        onChangeText={(text) => {
                          setFullName(text);
                          if (errorMessage) setErrorMessage('');
                        }}
                        onBlur={() => setNameTouched(true)}
                        autoCapitalize="words"
                      />
                      {nameTouched && isNameValid && (
                        <View style={styles.iconSlot}>
                          <CheckCircle2 size={18} color="#10B981" />
                        </View>
                      )}
                    </View>
                    {nameTouched && !isNameValid && (
                      <Text style={styles.errorText}>Name is required</Text>
                    )}
                  </View>
                )}

                {/* Work Email Input */}
                <View style={styles.inputGroup}>
                  <View
                    style={[
                      styles.inputWrapper,
                      emailTouched && (isEmailValid ? styles.inputValid : styles.inputInvalid),
                    ]}
                  >
                    <TextInput
                      style={styles.input}
                      placeholder="Work Email"
                      placeholderTextColor="#6B7280"
                      value={workEmail}
                      onChangeText={(text) => {
                        setWorkEmail(text);
                        if (errorMessage) setErrorMessage('');
                      }}
                      onBlur={() => setEmailTouched(true)}
                      keyboardType="email-address"
                      autoCapitalize="none"
                    />
                    {emailTouched && isEmailValid && (
                      <View style={styles.iconSlot}>
                        <CheckCircle2 size={18} color="#10B981" />
                      </View>
                    )}
                  </View>
                  {emailTouched && !isEmailValid && (
                    <Text style={styles.errorText}>Enter a valid email</Text>
                  )}
                </View>

                {/* Password Input */}
                <View style={styles.inputGroup}>
                  <View
                    style={[
                      styles.inputWrapper,
                      passwordTouched && (isPasswordValid ? styles.inputValid : styles.inputInvalid),
                    ]}
                  >
                    <TextInput
                      style={styles.input}
                      placeholder="Password"
                      placeholderTextColor="#6B7280"
                      value={password}
                      onChangeText={(text) => {
                        setPassword(text);
                        if (errorMessage) setErrorMessage('');
                      }}
                      onBlur={() => setPasswordTouched(true)}
                      secureTextEntry={!showPassword}
                    />

                    {/* Right Icons: Checkmark and Eye Toggle */}
                    <View style={styles.passwordIconsRow}>
                      {passwordTouched && isPasswordValid && (
                        <CheckCircle2 size={18} color="#10B981" style={{ marginRight: 8 }} />
                      )}
                      <TouchableOpacity
                        onPress={() => setShowPassword(!showPassword)}
                        activeOpacity={0.7}
                        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                      >
                        {showPassword ? (
                          <EyeOff size={18} color="#9CA3AF" />
                        ) : (
                          <Eye size={18} color="#9CA3AF" />
                        )}
                      </TouchableOpacity>
                    </View>
                  </View>
                  {passwordTouched && !isPasswordValid && (
                    <Text style={styles.errorText}>Password must be at least 8 characters</Text>
                  )}
                </View>

                {/* Server Error Message */}
                {errorMessage ? (
                  <Animated.View entering={FadeIn.duration(300)} style={styles.serverErrorBox}>
                    <AlertCircle size={16} color="#EF4444" style={{ marginRight: 6 }} />
                    <Text style={styles.serverErrorText}>{errorMessage}</Text>
                  </Animated.View>
                ) : null}

                {/* Action Submit Button */}
                <TouchableOpacity
                  style={[
                    styles.submitBtn,
                    (!isFormValid || isSubmitting) && styles.submitBtnDisabled,
                  ]}
                  activeOpacity={0.85}
                  onPress={handleSubmit}
                  disabled={!isFormValid || isSubmitting}
                >
                  {isSubmitting ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <Text
                      style={[
                        styles.submitBtnText,
                        !isFormValid && styles.submitBtnTextDisabled,
                      ]}
                    >
                      {isSignUp ? 'Create Account' : 'Sign In'}
                    </Text>
                  )}
                </TouchableOpacity>
              </Animated.View>
            )}

            {/* Footer Link (Switches Segmented Tab Toggle) */}
            {!isSuccessLoading && (
              <Animated.View
                entering={FadeInDown.delay(300).duration(600)}
                style={styles.footerRow}
              >
                <Text style={styles.footerText}>
                  {isSignUp ? 'Already have an account? ' : "Don't have an account? "}
                </Text>
                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={() => handleTabSwitch(isSignUp ? 'login' : 'signup')}
                >
                  <Text style={styles.signUpLink}>
                    {isSignUp ? 'Log in' : 'Sign up'}
                  </Text>
                </TouchableOpacity>
              </Animated.View>
            )}
          </ScrollView>
        </KeyboardAvoidingView>
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
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 28,
    paddingVertical: 32,
  },
  headerContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  logoBadge: {
    marginBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.5,
  },
  formCard: {
    backgroundColor: 'rgba(15, 20, 36, 0.75)',
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    borderColor: 'rgba(99, 102, 241, 0.25)',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 10,
  },
  successCard: {
    backgroundColor: 'rgba(15, 20, 36, 0.85)',
    borderRadius: 24,
    paddingVertical: 48,
    paddingHorizontal: 24,
    borderWidth: 1,
    borderColor: 'rgba(139, 92, 246, 0.35)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#8B5CF6',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
    elevation: 10,
  },
  successSpinner: {
    marginBottom: 20,
  },
  successTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 6,
    textAlign: 'center',
  },
  successSubtitle: {
    fontSize: 14,
    color: '#9CA3AF',
    textAlign: 'center',
  },
  tabToggleContainer: {
    flexDirection: 'row',
    backgroundColor: 'rgba(10, 14, 26, 0.85)',
    borderRadius: 14,
    padding: 4,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  tabButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabButtonActive: {
    backgroundColor: '#6366F1',
    shadowColor: '#6366F1',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#9CA3AF',
  },
  tabTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(10, 14, 26, 0.85)',
    borderRadius: 14,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
  },
  inputValid: {
    borderColor: '#10B981',
  },
  inputInvalid: {
    borderColor: '#EF4444',
  },
  input: {
    flex: 1,
    paddingVertical: 16,
    fontSize: 15,
    color: '#FFFFFF',
  },
  iconSlot: {
    marginLeft: 8,
  },
  passwordIconsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 8,
  },
  errorText: {
    fontSize: 12,
    color: '#EF4444',
    marginTop: 5,
    marginLeft: 4,
    fontWeight: '500',
  },
  serverErrorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
    marginBottom: 14,
  },
  serverErrorText: {
    fontSize: 13,
    color: '#F87171',
    fontWeight: '600',
    flex: 1,
  },
  submitBtn: {
    backgroundColor: '#6366F1',
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
    shadowColor: '#6366F1',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 6,
    minHeight: 54,
  },
  submitBtnDisabled: {
    backgroundColor: 'rgba(99, 102, 241, 0.25)',
    shadowOpacity: 0,
    elevation: 0,
  },
  submitBtnText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  submitBtnTextDisabled: {
    color: '#6B7280',
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 24,
  },
  footerText: {
    fontSize: 14,
    color: '#9CA3AF',
  },
  signUpLink: {
    fontSize: 14,
    fontWeight: '800',
    color: '#A78BFA',
    textDecorationLine: 'underline',
  },
});
