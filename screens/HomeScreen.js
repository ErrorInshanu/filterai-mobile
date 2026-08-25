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
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeInUp, FadeIn } from 'react-native-reanimated';
import { FileText, Upload, User, X, AlertCircle } from 'lucide-react-native';
import * as DocumentPicker from 'expo-document-picker';
import { useNavigation } from '@react-navigation/native';

import MonochromeBackground from '../components/landing/MonochromeBackground';
import { API_URL } from '../constants/api';
import { useAppStore } from '../store/useAppStore';

export default function HomeScreen() {
  const navigation = useNavigation();

  // Zustand Store
  const uploadedResumes = useAppStore((state) => state.uploadedResumes);
  const setUploadedResumes = useAppStore((state) => state.setUploadedResumes);
  const jobDescription = useAppStore((state) => state.jobDescription);
  const setJobDescription = useAppStore((state) => state.setJobDescription);
  const setBatchUploadResults = useAppStore((state) => state.setBatchUploadResults);

  // Local state
  const [isUploading, setIsUploading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Handle picking PDF documents
  const handlePickDocuments = async () => {
    try {
      setErrorMessage('');
      const result = await DocumentPicker.getDocumentAsync({
        type: 'application/pdf',
        multiple: true,
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const newFiles = result.assets.map((asset, index) => {
          const sizeFormatted = asset.size
            ? `${(asset.size / (1024 * 1024)).toFixed(1)} MB`
            : 'PDF Document';
          return {
            id: `${Date.now()}_${index}`,
            name: asset.name,
            size: sizeFormatted,
            uri: asset.uri,
            mimeType: asset.mimeType || 'application/pdf',
          };
        });

        setUploadedResumes([...uploadedResumes, ...newFiles]);
      }
    } catch (err) {
      console.log('Document picker error:', err);
      setErrorMessage('Failed to pick documents. Please try again.');
    }
  };

  // Remove a selected file
  const handleRemoveFile = (fileId) => {
    setUploadedResumes(uploadedResumes.filter((file) => file.id !== fileId));
  };

  // Handle submit / analyze
  const handleAnalyze = async () => {
    if (isUploading) return;

    if (uploadedResumes.length === 0) {
      setErrorMessage('Please upload at least one PDF resume to proceed.');
      return;
    }

    setErrorMessage('');
    setIsUploading(true);

    try {
      const formData = new FormData();
      formData.append('job_description', jobDescription || '');

      uploadedResumes.forEach((file) => {
        const fileUri =
          Platform.OS === 'ios' ? file.uri.replace('file://', '') : file.uri;
        formData.append('files', {
          uri: fileUri,
          name: file.name || 'resume.pdf',
          type: 'application/pdf',
        });
      });

      const response = await fetch(`${API_URL}/api/upload`, {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        setIsUploading(false);
        const detail =
          data && data.detail ? data.detail : 'Upload failed. Please try again.';
        setErrorMessage(
          typeof detail === 'string' ? detail : 'Upload failed'
        );
        return;
      }

      // Success: Save batch_id, candidate emails, and candidate names to Zustand
      if (data && data.batch_id && Array.isArray(data.files)) {
        setBatchUploadResults(data.batch_id, data.files);
      }

      setIsUploading(false);
      navigation.replace('MainTabs');
    } catch (err) {
      console.log('Resume upload fetch error:', err);
      setIsUploading(false);
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
                onPress={handlePickDocuments}
              >
                <View style={styles.uploadIconBadge}>
                  <Upload size={24} color="#6366F1" />
                </View>
                <Text style={styles.dropzoneTitle}>Tap to upload resumes</Text>
                <Text style={styles.dropzoneSubtext}>
                  Supports PDF resume files (up to 100)
                </Text>
              </TouchableOpacity>
            </Animated.View>

            {/* Uploaded Files Section */}
            {uploadedResumes.length > 0 && (
              <>
                <View style={styles.sectionHeaderRow}>
                  <Text style={styles.sectionTitle}>
                    Uploaded Resumes ({uploadedResumes.length})
                  </Text>
                </View>

                <View style={styles.fileListContainer}>
                  {uploadedResumes.map((file, index) => (
                    <Animated.View
                      key={file.id || index}
                      entering={FadeInUp.delay(100 + index * 50).duration(400)}
                    >
                      <View style={styles.fileCard}>
                        <View style={styles.fileIconBadge}>
                          <FileText size={20} color="#A78BFA" />
                        </View>
                        <View style={styles.fileInfo}>
                          <Text style={styles.fileName} numberOfLines={1}>
                            {file.name}
                          </Text>
                          <Text style={styles.fileMeta}>
                            {file.size} • Ready for analysis
                          </Text>
                        </View>
                        <TouchableOpacity
                          onPress={() => handleRemoveFile(file.id)}
                          style={styles.removeFileBtn}
                          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                        >
                          <X size={16} color="#9CA3AF" />
                        </TouchableOpacity>
                      </View>
                    </Animated.View>
                  ))}
                </View>
              </>
            )}

            {/* Job Description Input */}
            <Animated.View entering={FadeInUp.delay(300).duration(600)}>
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

            {/* Error Message Box */}
            {errorMessage ? (
              <Animated.View entering={FadeIn.duration(300)} style={styles.serverErrorBox}>
                <AlertCircle size={16} color="#EF4444" style={{ marginRight: 6 }} />
                <Text style={styles.serverErrorText}>{errorMessage}</Text>
              </Animated.View>
            ) : null}

            {/* Action Section */}
            <View style={styles.actionSection}>
              <TouchableOpacity
                style={[
                  styles.analyzeBtn,
                  (uploadedResumes.length === 0 || isUploading) && styles.analyzeBtnDisabled,
                ]}
                activeOpacity={0.85}
                onPress={handleAnalyze}
                disabled={isUploading}
              >
                {isUploading ? (
                  <View style={styles.loadingRow}>
                    <ActivityIndicator size="small" color="#FFFFFF" style={{ marginRight: 8 }} />
                    <Text style={styles.analyzeBtnText}>Ingesting Resumes...</Text>
                  </View>
                ) : (
                  <Text
                    style={[
                      styles.analyzeBtnText,
                      uploadedResumes.length === 0 && styles.analyzeBtnTextDisabled,
                    ]}
                  >
                    Analyze ({uploadedResumes.length} {uploadedResumes.length === 1 ? 'file' : 'files'})
                  </Text>
                )}
              </TouchableOpacity>
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
  removeFileBtn: {
    padding: 6,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
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
  serverErrorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
    marginBottom: 16,
  },
  serverErrorText: {
    fontSize: 13,
    color: '#F87171',
    fontWeight: '600',
    flex: 1,
  },
  actionSection: {
    alignItems: 'center',
    width: '100%',
  },
  analyzeBtn: {
    width: '100%',
    backgroundColor: '#6366F1',
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#6366F1',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 6,
    minHeight: 54,
  },
  analyzeBtnDisabled: {
    backgroundColor: 'rgba(99, 102, 241, 0.25)',
    shadowOpacity: 0,
    elevation: 0,
  },
  analyzeBtnText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  analyzeBtnTextDisabled: {
    color: '#6B7280',
  },
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
});

