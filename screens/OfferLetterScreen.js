import React, { useState, useEffect, useCallback } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import {
  ArrowLeft,
  Sparkles,
  Edit3,
  Eye,
  CheckCircle2,
  Mail,
  User,
  AlertCircle,
  RefreshCw,
  Send,
  ShieldCheck,
} from 'lucide-react-native';

import MonochromeBackground from '../components/landing/MonochromeBackground';
import { API_URL } from '../constants/api';
import { useAppStore } from '../store/useAppStore';

export default function OfferLetterScreen() {
  const navigation = useNavigation();
  const route = useRoute();

  const currentBatchId = useAppStore((state) => state.currentBatchId);
  const token = useAppStore((state) => state.token);
  const rawCandidate = route.params?.candidate || {};

  const displayName =
    rawCandidate.candidate_name ||
    rawCandidate.name ||
    (rawCandidate.file_name ? rawCandidate.file_name.replace(/\.pdf$/i, '') : 'Candidate');

  const recipientEmail =
    rawCandidate.extracted_email ||
    rawCandidate.email ||
    rawCandidate.contact?.email ||
    '';

  const fileName = rawCandidate.file_name || '';
  const candidateId = rawCandidate.candidate_id || rawCandidate.id || '';
  const batchId = rawCandidate.batch_id || currentBatchId || '';
  const matchScore = typeof rawCandidate.match_score === 'number' ? rawCandidate.match_score : 0;

  const initialTab = route.params?.initialTab === 'rejection' ? 'rejection' : 'offer';
  const [activeTab, setActiveTab] = useState(initialTab); // 'offer' | 'rejection'

  // Letter state
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [isEditing, setIsEditing] = useState(false);

  // Status & loading states
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [alreadySentInfo, setAlreadySentInfo] = useState(null);

  const isOffer = activeTab === 'offer';

  // 1. Generate Letter Preview via Groq
  const generateLetter = useCallback(
    async (typeToGenerate) => {
      if (alreadySentInfo?.sent) return;

      setIsGenerating(true);
      setErrorMessage('');
      setSuccessMessage('');

      try {
        const response = await fetch(`${API_URL}/api/generate-letter`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            batch_id: batchId || undefined,
            candidate_id: candidateId || undefined,
            file_name: fileName || undefined,
            letter_type: typeToGenerate,
          }),
        });

        const data = await response.json();

        if (!response.ok) {
          const detail = data?.detail || 'Failed to generate letter preview.';
          if (typeof detail === 'string' && detail.toLowerCase().includes('already been sent')) {
            setAlreadySentInfo({
              sent: true,
              type: typeToGenerate,
              recipient: recipientEmail,
            });
          } else {
            setErrorMessage(typeof detail === 'string' ? detail : 'Generation error');
          }
          setIsGenerating(false);
          return;
        }

        if (data.subject) setSubject(data.subject);
        if (data.body) setBody(data.body);
        setIsGenerating(false);
      } catch (err) {
        console.log('Generate letter fetch error:', err);
        setErrorMessage('Unable to connect to AI letter generation service.');
        setIsGenerating(false);
      }
    },
    [alreadySentInfo?.sent, batchId, candidateId, fileName, recipientEmail]
  );

  // 2. Check on mount if email was already sent
  const checkInitialStatus = useCallback(async () => {
    try {
      const response = await fetch(`${API_URL}/api/candidate-email-status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          batch_id: batchId || undefined,
          candidate_id: candidateId || undefined,
          file_name: fileName || undefined,
        }),
      });

      const data = await response.json();
      if (response.ok && data?.email_status === 'sent') {
        setAlreadySentInfo({
          sent: true,
          sent_at: data.email_sent_at,
          type: data.email_type_sent,
          recipient: data.to_email || recipientEmail,
          subject: data.subject,
        });
        if (data.subject) setSubject(data.subject);
      } else {
        generateLetter(initialTab);
      }
    } catch (err) {
      console.log('Error checking email status:', err);
      generateLetter(initialTab);
    }
  }, [batchId, candidateId, fileName, initialTab, recipientEmail, generateLetter]);

  useEffect(() => {
    checkInitialStatus();
  }, [checkInitialStatus]);

  // Handle Tab Switch
  const handleTabSwitch = (newTab) => {
    if (newTab === activeTab || alreadySentInfo?.sent) return;
    setActiveTab(newTab);
    setIsEditing(false);
    generateLetter(newTab);
  };

  // 3. Send Letter via Gmail SMTP
  const handleSend = async () => {
    if (isSending || alreadySentInfo?.sent) return;

    if (!recipientEmail) {
      setErrorMessage('Candidate has no extracted email address. Cannot dispatch email.');
      return;
    }

    if (!body.trim() || !subject.trim()) {
      setErrorMessage('Subject and letter body cannot be empty.');
      return;
    }

    setIsSending(true);
    setErrorMessage('');
    setSuccessMessage('');

    try {
      const headers = { 'Content-Type': 'application/json' };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch(`${API_URL}/api/send-letter`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          batch_id: batchId || undefined,
          candidate_id: candidateId || undefined,
          file_name: fileName || undefined,
          letter_type: activeTab,
          to_email: recipientEmail,
          subject: subject.trim(),
          body: body.trim(),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        const detail = data?.detail || 'Failed to dispatch email.';
        setErrorMessage(typeof detail === 'string' ? detail : 'Email sending failed');
        setIsSending(false);
        return;
      }

      setAlreadySentInfo({
        sent: true,
        sent_at: data.sent_at,
        type: data.letter_type || activeTab,
        recipient: data.recipient || recipientEmail,
        subject: subject.trim(),
      });
      setSuccessMessage(data.message || 'Email successfully dispatched via Gmail SMTP!');
      setIsSending(false);
    } catch (err) {
      console.log('Send letter fetch error:', err);
      setErrorMessage('Network connection error while sending email.');
      setIsSending(false);
    }
  };

  const getInitials = (name) => {
    if (!name) return 'CA';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    return name.slice(0, 2).toUpperCase();
  };

  return (
    <View style={styles.container}>
      <MonochromeBackground />

      <SafeAreaView style={styles.safeArea}>
        {/* Top App Bar */}
        <View style={styles.topBar}>
          <TouchableOpacity
            style={styles.iconButton}
            activeOpacity={0.7}
            onPress={() => navigation.goBack()}
          >
            <ArrowLeft size={22} color="#FFFFFF" />
          </TouchableOpacity>

          <Text style={styles.topBarTitle}>Email Dispatcher</Text>

          <View style={styles.avatarMiniBadge}>
            <User size={18} color="#A78BFA" />
          </View>
        </View>

        <KeyboardAvoidingView
          style={styles.keyboardView}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {/* Segmented Tab Toggle (Offer / Rejection) */}
            <Animated.View entering={FadeInDown.duration(500)} style={styles.tabToggleRow}>
              <TouchableOpacity
                style={[
                  styles.tabButton,
                  isOffer && styles.tabButtonActiveOffer,
                  alreadySentInfo?.sent && styles.tabButtonDisabled,
                ]}
                onPress={() => handleTabSwitch('offer')}
                activeOpacity={0.8}
                disabled={alreadySentInfo?.sent}
              >
                <Text
                  style={[
                    styles.tabButtonText,
                    isOffer && styles.tabButtonTextActive,
                  ]}
                >
                  Offer Letter
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.tabButton,
                  !isOffer && styles.tabButtonActiveRejection,
                  alreadySentInfo?.sent && styles.tabButtonDisabled,
                ]}
                onPress={() => handleTabSwitch('rejection')}
                activeOpacity={0.8}
                disabled={alreadySentInfo?.sent}
              >
                <Text
                  style={[
                    styles.tabButtonText,
                    !isOffer && styles.tabButtonTextActive,
                  ]}
                >
                  Rejection Letter
                </Text>
              </TouchableOpacity>
            </Animated.View>

            {/* Recipient Candidate Card */}
            <Animated.View entering={FadeInDown.delay(100).duration(600)} style={styles.recipientCard}>
              <View style={styles.recipientLeft}>
                <View style={styles.recipientAvatar}>
                  <Text style={styles.recipientInitials}>{getInitials(displayName)}</Text>
                </View>
                <View style={styles.recipientMeta}>
                  <Text style={styles.recipientName} numberOfLines={1}>{displayName}</Text>
                  <View style={styles.emailRow}>
                    <Mail size={12} color="#9CA3AF" style={{ marginRight: 4 }} />
                    <Text style={recipientEmail ? styles.recipientEmail : styles.recipientEmailMissing} numberOfLines={1}>
                      {recipientEmail || 'No email found in resume'}
                    </Text>
                  </View>
                </View>
              </View>

              <View style={styles.matchBadge}>
                <Text style={styles.matchBadgeText}>{Math.round(matchScore)}% Match</Text>
              </View>
            </Animated.View>

            {/* Hard Block Banner: If already sent */}
            {alreadySentInfo?.sent && (
              <Animated.View entering={FadeInDown.duration(400)} style={styles.alreadySentCard}>
                <View style={styles.alreadySentHeader}>
                  <ShieldCheck size={22} color="#10B981" style={{ marginRight: 8 }} />
                  <Text style={styles.alreadySentTitle}>Email Already Dispatched</Text>
                </View>
                <Text style={styles.alreadySentDesc}>
                  An {alreadySentInfo.type || 'email'} letter was successfully dispatched to{' '}
                  <Text style={{ fontWeight: '700', color: '#FFFFFF' }}>
                    {alreadySentInfo.recipient || recipientEmail}
                  </Text>
                  {alreadySentInfo.sent_at
                    ? ` on ${new Date(alreadySentInfo.sent_at).toLocaleDateString()}`
                    : ''}
                  . Duplicate sends are permanently blocked to protect candidate communication integrity.
                </Text>
              </Animated.View>
            )}

            {/* AI Generator & Editable Letter Box */}
            <Animated.View entering={FadeInDown.delay(200).duration(600)} style={styles.letterCard}>
              <View style={styles.letterHeader}>
                <View style={styles.aiBadge}>
                  <Sparkles size={14} color="#C084FC" style={{ marginRight: 6 }} />
                  <Text style={styles.aiBadgeText}>Groq LLaMA 3.3 70B</Text>
                </View>

                {!alreadySentInfo?.sent && (
                  <View style={styles.headerActionRow}>
                    {/* Regenerate Button */}
                    <TouchableOpacity
                      style={styles.regenerateBtn}
                      activeOpacity={0.8}
                      onPress={() => generateLetter(activeTab)}
                      disabled={isGenerating}
                    >
                      <RefreshCw size={13} color="#A78BFA" style={{ marginRight: 4 }} />
                      <Text style={styles.regenerateBtnText}>Regenerate</Text>
                    </TouchableOpacity>

                    {/* Edit / Preview Toggle */}
                    <TouchableOpacity
                      style={styles.editToggleBtn}
                      activeOpacity={0.8}
                      onPress={() => setIsEditing(!isEditing)}
                    >
                      {isEditing ? (
                        <>
                          <Eye size={13} color="#10B981" style={{ marginRight: 4 }} />
                          <Text style={[styles.editToggleText, { color: '#10B981' }]}>Preview</Text>
                        </>
                      ) : (
                        <>
                          <Edit3 size={13} color="#A78BFA" style={{ marginRight: 4 }} />
                          <Text style={styles.editToggleText}>Edit</Text>
                        </>
                      )}
                    </TouchableOpacity>
                  </View>
                )}
              </View>

              {/* Subject Input */}
              <View style={styles.subjectContainer}>
                <Text style={styles.subjectLabel}>Subject:</Text>
                {isEditing ? (
                  <TextInput
                    style={styles.subjectInput}
                    value={subject}
                    onChangeText={setSubject}
                    placeholder="Enter email subject..."
                    placeholderTextColor="#6B7280"
                  />
                ) : (
                  <Text style={styles.subjectText} numberOfLines={2}>
                    {subject || (isGenerating ? 'Generating subject...' : 'No subject')}
                  </Text>
                )}
              </View>

              {/* Letter Body */}
              {isGenerating ? (
                <View style={styles.loadingBox}>
                  <ActivityIndicator size="small" color="#8B5CF6" style={{ marginBottom: 12 }} />
                  <Text style={styles.loadingTitle}>
                    Drafting {isOffer ? 'Job Offer' : 'Rejection Letter'} with AI...
                  </Text>
                  <Text style={styles.loadingSubtext}>
                    Personalizing communication based on candidate resume and job requirements.
                  </Text>
                </View>
              ) : isEditing ? (
                <TextInput
                  style={styles.editableInput}
                  value={body}
                  onChangeText={setBody}
                  multiline
                  textAlignVertical="top"
                  placeholder="Letter content..."
                  placeholderTextColor="#6B7280"
                />
              ) : (
                <View style={styles.letterBodyContainer}>
                  <Text style={styles.letterBodyText}>
                    {body || 'Letter preview will appear here once generated.'}
                  </Text>
                </View>
              )}
            </Animated.View>

            {/* Error Message Display */}
            {errorMessage ? (
              <Animated.View entering={FadeInDown.duration(300)} style={styles.errorBanner}>
                <AlertCircle size={18} color="#EF4444" style={{ marginRight: 8 }} />
                <Text style={styles.errorText}>{errorMessage}</Text>
              </Animated.View>
            ) : null}

            {/* Success Toast */}
            {successMessage ? (
              <Animated.View entering={FadeInDown.duration(400)} style={styles.successBanner}>
                <CheckCircle2 size={20} color="#10B981" style={{ marginRight: 8 }} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.successTitle}>
                    {isOffer ? 'Offer Letter Dispatched!' : 'Rejection Email Sent!'}
                  </Text>
                  <Text style={styles.successSubtext}>{successMessage}</Text>
                </View>
              </Animated.View>
            ) : null}

            {/* Missing email alert */}
            {!recipientEmail && (
              <View style={styles.warningNotice}>
                <AlertCircle size={16} color="#F59E0B" style={{ marginRight: 6 }} />
                <Text style={styles.warningNoticeText}>
                  No email address was found on this resume. Please check candidate details.
                </Text>
              </View>
            )}

            {/* Send CTA Button */}
            {!alreadySentInfo?.sent && (
              <View style={styles.actionBtnWrapper}>
                <TouchableOpacity
                  style={[
                    styles.sendButton,
                    isOffer ? styles.sendButtonOffer : styles.sendButtonRejection,
                    (!recipientEmail || isSending || isGenerating) && styles.sendButtonDisabled,
                  ]}
                  activeOpacity={0.8}
                  onPress={handleSend}
                  disabled={!recipientEmail || isSending || isGenerating}
                >
                  {isSending ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <>
                      <Send size={18} color="#FFFFFF" style={{ marginRight: 8 }} />
                      <Text style={styles.sendButtonText}>
                        {isOffer ? 'Send Offer Letter' : 'Send Rejection Email'}
                      </Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>
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
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  iconButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: 'rgba(15, 20, 36, 0.75)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  topBarTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: -0.3,
  },
  avatarMiniBadge: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(167, 139, 250, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(167, 139, 250, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 40,
  },
  tabToggleRow: {
    flexDirection: 'row',
    backgroundColor: 'rgba(10, 14, 26, 0.85)',
    borderRadius: 16,
    padding: 4,
    marginBottom: 18,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  tabButton: {
    flex: 1,
    paddingVertical: 11,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabButtonActiveOffer: {
    backgroundColor: '#6366F1',
    shadowColor: '#6366F1',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.35,
    shadowRadius: 6,
    elevation: 4,
  },
  tabButtonActiveRejection: {
    backgroundColor: '#EF4444',
    shadowColor: '#EF4444',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.35,
    shadowRadius: 6,
    elevation: 4,
  },
  tabButtonDisabled: {
    opacity: 0.5,
  },
  tabButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#9CA3AF',
  },
  tabButtonTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  recipientCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(15, 20, 36, 0.85)',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(99, 102, 241, 0.25)',
    marginBottom: 16,
  },
  recipientLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 10,
  },
  recipientAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(167, 139, 250, 0.2)',
    borderWidth: 1,
    borderColor: 'rgba(167, 139, 250, 0.4)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  recipientInitials: {
    fontSize: 15,
    fontWeight: '800',
    color: '#C084FC',
  },
  recipientMeta: {
    flex: 1,
  },
  recipientName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 2,
  },
  emailRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  recipientEmail: {
    fontSize: 12,
    color: '#9CA3AF',
    flex: 1,
  },
  recipientEmailMissing: {
    fontSize: 12,
    color: '#EF4444',
    fontStyle: 'italic',
    flex: 1,
  },
  matchBadge: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.3)',
  },
  matchBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#10B981',
  },
  alreadySentCard: {
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.35)',
    marginBottom: 16,
  },
  alreadySentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  alreadySentTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#10B981',
  },
  alreadySentDesc: {
    fontSize: 13,
    color: '#D1D5DB',
    lineHeight: 20,
  },
  letterCard: {
    backgroundColor: 'rgba(15, 20, 36, 0.75)',
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: 'rgba(99, 102, 241, 0.25)',
    marginBottom: 16,
  },
  letterHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
    marginBottom: 14,
  },
  headerActionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  aiBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(167, 139, 250, 0.12)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  aiBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#C084FC',
  },
  regenerateBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  regenerateBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#A78BFA',
  },
  editToggleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  editToggleText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#A78BFA',
  },
  subjectContainer: {
    marginBottom: 14,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.06)',
  },
  subjectLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#9CA3AF',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  subjectInput: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
    backgroundColor: 'rgba(10, 14, 26, 0.65)',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
  },
  subjectText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
    lineHeight: 20,
  },
  loadingBox: {
    paddingVertical: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 6,
  },
  loadingSubtext: {
    fontSize: 12,
    color: '#9CA3AF',
    textAlign: 'center',
    maxWidth: 280,
  },
  letterBodyContainer: {
    minHeight: 220,
  },
  letterBodyText: {
    fontSize: 14,
    color: '#E5E7EB',
    lineHeight: 22,
  },
  editableInput: {
    fontSize: 14,
    color: '#FFFFFF',
    lineHeight: 22,
    minHeight: 220,
    backgroundColor: 'rgba(10, 14, 26, 0.65)',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
    marginBottom: 16,
  },
  errorText: {
    fontSize: 13,
    color: '#F87171',
    flex: 1,
    lineHeight: 18,
  },
  successBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.3)',
    marginBottom: 16,
  },
  successTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#10B981',
    marginBottom: 2,
  },
  successSubtext: {
    fontSize: 12,
    color: '#9CA3AF',
    lineHeight: 16,
  },
  warningNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(245, 158, 11, 0.12)',
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.25)',
    marginBottom: 16,
  },
  warningNoticeText: {
    fontSize: 12,
    color: '#FCD34D',
    flex: 1,
  },
  actionBtnWrapper: {
    alignItems: 'center',
    width: '100%',
    marginBottom: 24,
  },
  sendButton: {
    width: '100%',
    height: 52,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  sendButtonOffer: {
    backgroundColor: '#6366F1',
    shadowColor: '#6366F1',
  },
  sendButtonRejection: {
    backgroundColor: '#EF4444',
    shadowColor: '#EF4444',
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },
  sendButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});

