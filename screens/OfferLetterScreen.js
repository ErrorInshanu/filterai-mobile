import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import {
  ArrowLeft,
  Sparkles,
  Edit3,
  Eye,
  CheckCircle2,
  Mail,
  User,
  Clock,
  Briefcase,
} from 'lucide-react-native';

import MonochromeBackground from '../components/landing/MonochromeBackground';
import MonochromeGetStartedButton from '../components/landing/MonochromeGetStartedButton';

const DEFAULT_OFFER_TEMPLATE = `Dear Sarah,

We are thrilled to offer you the position of Senior Full-Stack Engineer at FilterAI! 

After thoroughly reviewing your technical background, leadership in production React Native releases, and strong system architecture skills, our team is confident you will make an exceptional impact on our engineering organization.

Offer Details:
• Role: Senior Full-Stack Engineer
• Department: Mobile & Core Platform
• Starting Base Salary: $165,000 / year + Equity Options
• Start Date: September 15, 2026
• Location: Remote (San Francisco HQ access)

We look forward to building the next generation of AI recruitment tools together. Please review and sign the attached agreement by Friday.

Warm regards,
Alex Morgan — Lead Recruiter, FilterAI`;

const DEFAULT_REJECTION_TEMPLATE = `Dear Sarah,

Thank you for taking the time to speak with our engineering team regarding the Senior Full-Stack Engineer role at FilterAI.

We were truly impressed by your extensive experience in mobile engineering and distributed Node.js systems. However, for this particular opening, we have decided to advance candidates whose recent hands-on background more closely aligns with our core Python FastAPI and ChromaDB vector search requirements.

We will keep your resume in our active talent pool for upcoming architecture and full-stack roles that match your strengths. We wish you the very best in your job search!

Warm regards,
Alex Morgan — Lead Recruiter, FilterAI`;

const RECENT_SENDS = [
  {
    id: '1',
    candidate_name: 'David Kim',
    type: 'Offer Letter',
    typeColor: '#10B981',
    time: '2 hours ago',
    status: 'Delivered',
  },
  {
    id: '2',
    candidate_name: 'Elena Rostova',
    type: 'Rejection Note',
    typeColor: '#EF4444',
    time: 'Yesterday',
    status: 'Delivered',
  },
  {
    id: '3',
    candidate_name: 'Michael Brown',
    type: 'Rejection Note',
    typeColor: '#EF4444',
    time: '2 days ago',
    status: 'Delivered',
  },
];

export default function OfferLetterScreen() {
  const navigation = useNavigation();
  const route = useRoute();

  const candidate = route.params?.candidate || {
    id: '1',
    candidate_name: 'Sarah Chen',
    role: 'Senior Full-Stack Engineer',
    match_score: 94,
    contact: { email: 'sarah.chen@example.com' },
  };

  const initialTab = route.params?.initialTab || 'offer';
  const [activeTab, setActiveTab] = useState(initialTab); // 'offer' | 'rejection'
  const [isEditing, setIsEditing] = useState(false);
  const [offerText, setOfferText] = useState(DEFAULT_OFFER_TEMPLATE);
  const [rejectionText, setRejectionText] = useState(DEFAULT_REJECTION_TEMPLATE);
  const [isSent, setIsSent] = useState(false);

  const isOffer = activeTab === 'offer';
  const currentLetterText = isOffer ? offerText : rejectionText;
  const setLetterText = isOffer ? setOfferText : setRejectionText;

  const handleSend = () => {
    setIsSent(true);
    setTimeout(() => {
      setIsSent(false);
    }, 4000);
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
                ]}
                onPress={() => {
                  setActiveTab('offer');
                  setIsEditing(false);
                }}
                activeOpacity={0.8}
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
                ]}
                onPress={() => {
                  setActiveTab('rejection');
                  setIsEditing(false);
                }}
                activeOpacity={0.8}
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
                  <Text style={styles.recipientInitials}>
                    {candidate.candidate_name
                      .split(' ')
                      .map((n) => n[0])
                      .join('')}
                  </Text>
                </View>
                <View style={styles.recipientMeta}>
                  <Text style={styles.recipientName}>{candidate.candidate_name}</Text>
                  <View style={styles.emailRow}>
                    <Mail size={12} color="#9CA3AF" style={{ marginRight: 4 }} />
                    <Text style={styles.recipientEmail}>
                      {candidate.contact?.email || 'sarah.chen@example.com'}
                    </Text>
                  </View>
                </View>
              </View>

              <View style={styles.matchBadge}>
                <Text style={styles.matchBadgeText}>{candidate.match_score || 94}% Match</Text>
              </View>
            </Animated.View>

            {/* AI Generator Header Card & Letter Box */}
            <Animated.View entering={FadeInDown.delay(200).duration(600)} style={styles.letterCard}>
              <View style={styles.letterHeader}>
                <View style={styles.aiBadge}>
                  <Sparkles size={14} color="#C084FC" style={{ marginRight: 6 }} />
                  <Text style={styles.aiBadgeText}>Groq LLaMA 3.3 70B</Text>
                </View>

                {/* Edit / Preview Toggle Button */}
                <TouchableOpacity
                  style={styles.editToggleBtn}
                  activeOpacity={0.8}
                  onPress={() => setIsEditing(!isEditing)}
                >
                  {isEditing ? (
                    <>
                      <Eye size={14} color="#10B981" style={{ marginRight: 5 }} />
                      <Text style={[styles.editToggleText, { color: '#10B981' }]}>Preview</Text>
                    </>
                  ) : (
                    <>
                      <Edit3 size={14} color="#A78BFA" style={{ marginRight: 5 }} />
                      <Text style={styles.editToggleText}>Edit Template</Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>

              {/* Letter Content: Text or TextInput */}
              {isEditing ? (
                <TextInput
                  style={styles.editableInput}
                  value={currentLetterText}
                  onChangeText={setLetterText}
                  multiline
                  textAlignVertical="top"
                  placeholderTextColor="#6B7280"
                />
              ) : (
                <View style={styles.letterBodyContainer}>
                  <Text style={styles.letterBodyText}>{currentLetterText}</Text>
                </View>
              )}
            </Animated.View>

            {/* Send Success Toast */}
            {isSent && (
              <Animated.View entering={FadeInDown.duration(400)} style={styles.successBanner}>
                <CheckCircle2 size={20} color="#10B981" style={{ marginRight: 8 }} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.successTitle}>
                    {isOffer ? 'Offer Letter Dispatched!' : 'Rejection Email Sent!'}
                  </Text>
                  <Text style={styles.successSubtext}>
                    Sent via Gmail SMTP and recorded in MongoDB team activity log.
                  </Text>
                </View>
              </Animated.View>
            )}

            {/* Send CTA Button */}
            <View style={styles.actionBtnWrapper}>
              <MonochromeGetStartedButton
                title={isOffer ? 'Send Offer & Log Activity' : 'Send Rejection & Log Activity'}
                onPress={handleSend}
                delay={0}
              />
            </View>

            {/* Recent Sends Section */}
            <Animated.View entering={FadeInUp.delay(300).duration(600)} style={styles.recentSection}>
              <View style={styles.recentHeaderRow}>
                <Clock size={16} color="#9CA3AF" style={{ marginRight: 6 }} />
                <Text style={styles.recentTitle}>Recent Communications</Text>
              </View>

              <View style={styles.recentList}>
                {RECENT_SENDS.map((item) => (
                  <View key={item.id} style={styles.recentCard}>
                    <View style={styles.recentCardLeft}>
                      <Text style={styles.recentCandidateName}>{item.candidate_name}</Text>
                      <View style={styles.recentMetaRow}>
                        <Briefcase size={12} color="#6B7280" style={{ marginRight: 4 }} />
                        <Text style={[styles.recentType, { color: item.typeColor }]}>
                          {item.type}
                        </Text>
                        <Text style={styles.recentDot}>•</Text>
                        <Text style={styles.recentTime}>{item.time}</Text>
                      </View>
                    </View>

                    <View style={styles.statusPill}>
                      <CheckCircle2 size={12} color="#10B981" style={{ marginRight: 4 }} />
                      <Text style={styles.statusPillText}>{item.status}</Text>
                    </View>
                  </View>
                ))}
              </View>
            </Animated.View>
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
  letterCard: {
    backgroundColor: 'rgba(15, 20, 36, 0.75)',
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: 'rgba(99, 102, 241, 0.25)',
    marginBottom: 18,
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
  actionBtnWrapper: {
    alignItems: 'center',
    width: '100%',
    marginBottom: 24,
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
  recentSection: {
    marginTop: 8,
  },
  recentHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  recentTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#9CA3AF',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  recentList: {
    gap: 10,
  },
  recentCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(15, 20, 36, 0.65)',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  recentCardLeft: {
    flex: 1,
  },
  recentCandidateName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  recentMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  recentType: {
    fontSize: 12,
    fontWeight: '600',
  },
  recentDot: {
    color: '#6B7280',
    marginHorizontal: 6,
  },
  recentTime: {
    fontSize: 12,
    color: '#6B7280',
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusPillText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#10B981',
  },
});
