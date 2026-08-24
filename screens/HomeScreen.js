import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeInUp } from 'react-native-reanimated';
import { FileText, Upload, User, CheckCircle2 } from 'lucide-react-native';

import { useNavigation } from '@react-navigation/native';

import MonochromeBackground from '../components/landing/MonochromeBackground';
import MonochromeGetStartedButton from '../components/landing/MonochromeGetStartedButton';

export default function HomeScreen() {
  const navigation = useNavigation();
  const [jobDescription, setJobDescription] = useState('');

  const dummyFiles = [
    { id: '1', name: 'sarah_chen_resume.pdf', size: '1.2 MB' },
    { id: '2', name: 'marcus_johnson_resume.pdf', size: '980 KB' },
    { id: '3', name: 'priya_patel_resume.pdf', size: '1.4 MB' },
  ];

  const handleAnalyze = () => {
    navigation.replace('MainTabs');
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
            {/* Header */}
            <View style={styles.headerRow}>
              <View>
                <Text style={styles.headerTitle}>Welcome back</Text>
                <Text style={styles.headerSubtitle}>Ready to screen candidates</Text>
              </View>

              <TouchableOpacity style={styles.userAvatarBtn} activeOpacity={0.8}>
                <User size={20} color="#A78BFA" />
              </TouchableOpacity>
            </View>

            {/* Dashed-Border Upload Dropzone Card */}
            <Animated.View entering={FadeInUp.delay(100).duration(600)}>
              <TouchableOpacity
                style={styles.dropzoneCard}
                activeOpacity={0.75}
              >
                <View style={styles.uploadIconBadge}>
                  <Upload size={24} color="#6366F1" />
                </View>
                <Text style={styles.dropzoneTitle}>Tap to upload resumes</Text>
                <Text style={styles.dropzoneSubtext}>Supports PDF resume files (up to 100)</Text>
              </TouchableOpacity>
            </Animated.View>

            {/* Uploaded Files Section */}
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionTitle}>Uploaded Resumes ({dummyFiles.length})</Text>
            </View>

            <View style={styles.fileListContainer}>
              {dummyFiles.map((file, index) => (
                <Animated.View
                  key={file.id}
                  entering={FadeInUp.delay(200 + index * 100).duration(500)}
                >
                  <View style={styles.fileCard}>
                    <View style={styles.fileIconBadge}>
                      <FileText size={20} color="#A78BFA" />
                    </View>
                    <View style={styles.fileInfo}>
                      <Text style={styles.fileName}>{file.name}</Text>
                      <Text style={styles.fileMeta}>{file.size} • Ready for analysis</Text>
                    </View>
                    <CheckCircle2 size={18} color="#10B981" />
                  </View>
                </Animated.View>
              ))}
            </View>

            {/* Job Description Input */}
            <Animated.View entering={FadeInUp.delay(500).duration(600)}>
              <Text style={styles.sectionTitle}>Job Description</Text>
              <View style={styles.inputCard}>
                <TextInput
                  style={styles.multilineInput}
                  placeholder="Paste job description here..."
                  placeholderTextColor="#6B7280"
                  value={jobDescription}
                  onChangeText={setJobDescription}
                  multiline
                  numberOfLines={5}
                  textAlignVertical="top"
                />
              </View>
            </Animated.View>

            {/* Analyze Button */}
            <View style={styles.actionSection}>
              <MonochromeGetStartedButton
                title="Analyze"
                onPress={handleAnalyze}
                delay={600}
              />
            </View>
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
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 36,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  headerTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.5,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#9CA3AF',
    marginTop: 2,
  },
  userAvatarBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(15, 20, 36, 0.85)',
    borderWidth: 1,
    borderColor: 'rgba(167, 139, 250, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dropzoneCard: {
    backgroundColor: 'rgba(15, 20, 36, 0.75)',
    borderRadius: 24,
    paddingVertical: 28,
    paddingHorizontal: 20,
    borderWidth: 2,
    borderColor: 'rgba(99, 102, 241, 0.4)',
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  uploadIconBadge: {
    width: 52,
    height: 52,
    borderRadius: 16,
    backgroundColor: 'rgba(99, 102, 241, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  dropzoneTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  dropzoneSubtext: {
    fontSize: 13,
    color: '#9CA3AF',
  },
  sectionHeaderRow: {
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 12,
  },
  fileListContainer: {
    gap: 10,
    marginBottom: 24,
  },
  fileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(15, 20, 36, 0.6)',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  fileIconBadge: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(167, 139, 250, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  fileInfo: {
    flex: 1,
  },
  fileName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 2,
  },
  fileMeta: {
    fontSize: 12,
    color: '#6B7280',
  },
  inputCard: {
    backgroundColor: 'rgba(15, 20, 36, 0.75)',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    marginBottom: 16,
  },
  multilineInput: {
    fontSize: 15,
    color: '#FFFFFF',
    minHeight: 120,
  },
  actionSection: {
    alignItems: 'center',
    width: '100%',
  },
});
