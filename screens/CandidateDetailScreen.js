import React, { useState, useEffect, useCallback } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import Animated, { FadeInDown, FadeIn } from 'react-native-reanimated';
import Svg, { Circle, Defs, LinearGradient as SvgLinearGradient, Stop } from 'react-native-svg';
import {
  ArrowLeft,
  Star,
  Sparkles,
  Mail,
  ChevronRight,
  TrendingUp,
  XCircle,
  Briefcase,
  Lightbulb,
  Send,
  Scale,
  FileText,
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  RefreshCw,
} from 'lucide-react-native';

import MonochromeBackground from '../components/landing/MonochromeBackground';
import { API_URL } from '../constants/api';
import { useAppStore } from '../store/useAppStore';

const TABS = [
  { id: 'overview', label: 'Overview' },
  { id: 'skill_gap', label: 'Skill Gap' },
  { id: 'questions', label: 'Questions' },
  { id: 'actions', label: 'Actions' },
];

export default function CandidateDetailScreen() {
  const navigation = useNavigation();
  const route = useRoute();

  // Read real candidate object passed from CandidateListScreen
  const rawCandidate = route.params?.candidate || {};
  const currentBatchId = useAppStore((state) => state.currentBatchId);

  const rawScore = typeof rawCandidate.match_score === 'number' ? rawCandidate.match_score : 0;
  const matchScore = Math.min(100, Math.max(0, Math.round(rawScore)));

  const displayName =
    rawCandidate.candidate_name ||
    rawCandidate.name ||
    (rawCandidate.file_name ? rawCandidate.file_name.replace(/\.pdf$/i, '') : 'Candidate');

  const email = rawCandidate.extracted_email || rawCandidate.email || null;
  const fileName = rawCandidate.file_name || null;
  const candidateId = rawCandidate.candidate_id || rawCandidate.id || 'N/A';
  const candidateStatus = rawCandidate.status || 'pending';

  const [activeTab, setActiveTab] = useState('overview');
  const [isShortlisted, setIsShortlisted] = useState(rawCandidate.shortlisted ?? false);

  // AI Insights State
  const [insights, setInsights] = useState(null);
  const [isLoadingInsights, setIsLoadingInsights] = useState(false);
  const [insightsError, setInsightsError] = useState('');

  // SVG Circular Gauge calculations
  const size = 110;
  const strokeWidth = 8;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const progressOffset =
    circumference - (matchScore / 100) * circumference;

  const fetchInsights = useCallback(async () => {
    setIsLoadingInsights(true);
    setInsightsError('');
    try {
      const response = await fetch(`${API_URL}/api/candidate-insights`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          batch_id: rawCandidate.batch_id || currentBatchId || undefined,
          candidate_id: rawCandidate.candidate_id || candidateId,
          file_name: fileName || undefined,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        const errorDetail = data?.detail || 'Failed to generate candidate insights.';
        setInsightsError(typeof errorDetail === 'string' ? errorDetail : 'AI analysis error');
        setIsLoadingInsights(false);
        return;
      }

      if (data && data.insights) {
        setInsights(data.insights);
      }
      setIsLoadingInsights(false);
    } catch (err) {
      console.log('Candidate insights fetch error:', err);
      setInsightsError('Unable to connect to AI analysis service. Please check your connection.');
      setIsLoadingInsights(false);
    }
  }, [rawCandidate.batch_id, rawCandidate.candidate_id, currentBatchId, candidateId, fileName]);

  useEffect(() => {
    fetchInsights();
  }, [fetchInsights]);

  const renderAILoader = (label = 'Generating AI analysis...') => (
    <View style={styles.emptyPendingBox}>
      <ActivityIndicator size="small" color="#8B5CF6" style={{ marginBottom: 12 }} />
      <Text style={styles.emptyPendingTitle}>{label}</Text>
      <Text style={styles.emptyPendingDesc}>
        Evaluating candidate skills against job requirements using Groq LLaMA...
      </Text>
    </View>
  );

  const renderAIError = () => (
    <View style={styles.emptyPendingBox}>
      <View style={[styles.emptyIconCircle, styles.errorIconCircle]}>
        <AlertCircle size={26} color="#EF4444" />
      </View>
      <Text style={[styles.emptyPendingTitle, { color: '#F87171' }]}>Analysis Unavailable</Text>
      <Text style={styles.emptyPendingDesc}>{insightsError}</Text>
      <TouchableOpacity
        style={styles.retryBtn}
        activeOpacity={0.8}
        onPress={fetchInsights}
      >
        <RefreshCw size={14} color="#FFFFFF" style={{ marginRight: 6 }} />
        <Text style={styles.retryBtnText}>Try Again</Text>
      </TouchableOpacity>
    </View>
  );

  const renderOverviewTab = () => (
    <Animated.View entering={FadeIn.duration(400)}>
      {/* Real Candidate Information Card */}
      <View style={styles.card}>
        <Text style={[styles.cardTitle, { marginBottom: 16 }]}>Candidate Information</Text>

        <View style={styles.infoRow}>
          <Mail size={16} color="#9CA3AF" style={styles.infoIcon} />
          <Text style={styles.infoLabel}>Email:</Text>
          <Text style={email ? styles.infoValue : styles.infoValueMuted} numberOfLines={1}>
            {email || 'No email found in resume'}
          </Text>
        </View>

        {fileName ? (
          <View style={styles.infoRow}>
            <FileText size={16} color="#9CA3AF" style={styles.infoIcon} />
            <Text style={styles.infoLabel}>Resume File:</Text>
            <Text style={styles.infoValue} numberOfLines={1}>
              {fileName}
            </Text>
          </View>
        ) : null}

        <View style={styles.infoRow}>
          <Briefcase size={16} color="#9CA3AF" style={styles.infoIcon} />
          <Text style={styles.infoLabel}>Candidate ID:</Text>
          <Text style={styles.infoValue} numberOfLines={1}>
            {candidateId}
          </Text>
        </View>

        <View style={styles.infoRow}>
          <Sparkles size={16} color="#9CA3AF" style={styles.infoIcon} />
          <Text style={styles.infoLabel}>Match Score:</Text>
          <Text style={[styles.infoValue, { color: '#C084FC', fontWeight: '800' }]}>
            {matchScore}% Similarity Match
          </Text>
        </View>
      </View>

      {/* AI Executive Summary Card */}
      <View style={styles.card}>
        <View style={styles.cardHeaderRow}>
          <View style={styles.cardHeaderLeft}>
            <View style={styles.sparkleBadge}>
              <Sparkles size={16} color="#A78BFA" />
            </View>
            <Text style={styles.cardTitle}>AI Executive Summary</Text>
          </View>
        </View>

        {isLoadingInsights ? (
          renderAILoader('Generating Executive Summary...')
        ) : insightsError ? (
          renderAIError()
        ) : insights?.summary ? (
          <Text style={styles.summaryBody}>{insights.summary}</Text>
        ) : rawCandidate.summary ? (
          <Text style={styles.summaryBody}>{rawCandidate.summary}</Text>
        ) : (
          <Text style={styles.summaryBody}>Candidate profile ready for screening review.</Text>
        )}
      </View>

      {/* Core Strengths Chips */}
      {insights?.strengths && insights.strengths.length > 0 ? (
        <View style={styles.card}>
          <View style={styles.cardHeaderRow}>
            <View style={styles.cardHeaderLeft}>
              <View style={[styles.sparkleBadge, { backgroundColor: 'rgba(16, 185, 129, 0.15)' }]}>
                <CheckCircle2 size={16} color="#10B981" />
              </View>
              <Text style={styles.cardTitle}>Core Strengths & Highlights</Text>
            </View>
          </View>

          <View style={styles.strengthsWrap}>
            {insights.strengths.map((str, idx) => (
              <View key={idx} style={styles.strengthPill}>
                <CheckCircle2 size={14} color="#10B981" style={{ marginRight: 6 }} />
                <Text style={styles.strengthText}>{str}</Text>
              </View>
            ))}
          </View>
        </View>
      ) : null}
    </Animated.View>
  );

  const renderSkillGapTab = () => (
    <Animated.View entering={FadeIn.duration(400)}>
      <View style={styles.card}>
        <View style={styles.cardHeaderRow}>
          <View style={styles.cardHeaderLeft}>
            <View style={styles.sparkleBadge}>
              <TrendingUp size={16} color="#A78BFA" />
            </View>
            <Text style={styles.cardTitle}>Skill Gap Analysis</Text>
          </View>
        </View>

        {isLoadingInsights ? (
          renderAILoader('Analyzing Skill Gaps...')
        ) : insightsError ? (
          renderAIError()
        ) : insights?.skill_gaps && insights.skill_gaps.length > 0 ? (
          <View style={styles.skillsList}>
            {insights.skill_gaps.map((gap, idx) => (
              <View key={idx} style={styles.gapItem}>
                <TrendingUp size={16} color="#A78BFA" style={{ marginTop: 2, marginRight: 10 }} />
                <Text style={styles.gapItemText}>{gap}</Text>
              </View>
            ))}
          </View>
        ) : (
          <View style={styles.emptyPendingBox}>
            <View style={styles.emptyIconCircle}>
              <CheckCircle2 size={28} color="#10B981" />
            </View>
            <Text style={styles.emptyPendingTitle}>No Significant Gaps</Text>
            <Text style={styles.emptyPendingDesc}>
              Candidate demonstrates strong coverage across the key requirements outlined in the job description.
            </Text>
          </View>
        )}
      </View>

      {/* Red Flags / Risk Factors Section (Shown only if present) */}
      {insights?.red_flags && insights.red_flags.length > 0 ? (
        <View style={[styles.card, styles.redFlagCard]}>
          <View style={styles.cardHeaderRow}>
            <View style={styles.cardHeaderLeft}>
              <View style={styles.redFlagIconBadge}>
                <AlertTriangle size={16} color="#EF4444" />
              </View>
              <Text style={[styles.cardTitle, { color: '#F87171' }]}>Identified Red Flags & Gaps</Text>
            </View>
          </View>

          <View style={styles.redFlagsList}>
            {insights.red_flags.map((flag, idx) => (
              <View key={idx} style={styles.redFlagItem}>
                <View style={styles.redDot} />
                <Text style={styles.redFlagText}>{flag}</Text>
              </View>
            ))}
          </View>
        </View>
      ) : null}
    </Animated.View>
  );

  const renderQuestionsTab = () => (
    <Animated.View entering={FadeIn.duration(400)}>
      <View style={styles.tabIntroRow}>
        <Text style={styles.tabIntroTitle}>AI Interview Questions</Text>
        <Text style={styles.tabIntroSubtitle}>
          Tailored to candidate background and targeted skill evaluation.
        </Text>
      </View>

      {isLoadingInsights ? (
        <View style={styles.card}>{renderAILoader('Drafting Interview Questions...')}</View>
      ) : insightsError ? (
        <View style={styles.card}>{renderAIError()}</View>
      ) : insights?.interview_questions && insights.interview_questions.length > 0 ? (
        insights.interview_questions.map((q, idx) => (
          <View key={idx} style={styles.card}>
            <View style={styles.questionCategoryRow}>
              <View style={styles.categoryBadge}>
                <Text style={styles.categoryBadgeText}>Question {idx + 1}</Text>
              </View>
            </View>
            <Text style={styles.questionText}>{`"${q}"`}</Text>
          </View>
        ))
      ) : (
        <View style={styles.card}>
          <View style={styles.emptyPendingBox}>
            <View style={[styles.emptyIconCircle, { backgroundColor: 'rgba(245, 158, 11, 0.15)', borderColor: 'rgba(245, 158, 11, 0.3)' }]}>
              <Lightbulb size={28} color="#F59E0B" />
            </View>
            <Text style={styles.emptyPendingTitle}>Questions Ready Upon Evaluation</Text>
            <Text style={styles.emptyPendingDesc}>
              Interview questions tailored to this candidate will appear once AI evaluation completes.
            </Text>
          </View>
        </View>
      )}
    </Animated.View>
  );

  const renderActionsTab = () => (
    <Animated.View entering={FadeIn.duration(400)}>
      <View style={styles.tabIntroRow}>
        <Text style={styles.tabIntroTitle}>Screening Actions</Text>
        <Text style={styles.tabIntroSubtitle}>
          Progress this candidate through the hiring workflow.
        </Text>
      </View>

      {/* Offer Letter Action */}
      <TouchableOpacity
        style={styles.actionCard}
        activeOpacity={0.8}
        onPress={() => {
          navigation.navigate('OfferLetter', { candidate: rawCandidate, initialTab: 'offer' });
        }}
      >
        <View style={[styles.actionIconBadge, { backgroundColor: 'rgba(16, 185, 129, 0.15)' }]}>
          <Send size={22} color="#10B981" />
        </View>
        <View style={styles.actionCardContent}>
          <Text style={styles.actionCardTitle}>Draft Offer Letter</Text>
          <Text style={styles.actionCardDesc}>
            Generate an offer letter for this candidate.
          </Text>
        </View>
        <ChevronRight size={20} color="#6B7280" />
      </TouchableOpacity>

      {/* Compare Action */}
      <TouchableOpacity
        style={styles.actionCard}
        activeOpacity={0.8}
        onPress={() => {
          navigation.navigate('Comparison');
        }}
      >
        <View style={[styles.actionIconBadge, { backgroundColor: 'rgba(139, 92, 246, 0.15)' }]}>
          <Scale size={22} color="#8B5CF6" />
        </View>
        <View style={styles.actionCardContent}>
          <Text style={styles.actionCardTitle}>Compare with Others</Text>
          <Text style={styles.actionCardDesc}>
            View side-by-side against other ranked candidates.
          </Text>
        </View>
        <ChevronRight size={20} color="#6B7280" />
      </TouchableOpacity>

      {/* Rejection Letter Action */}
      <TouchableOpacity
        style={styles.actionCard}
        activeOpacity={0.8}
        onPress={() => {
          navigation.navigate('Rejection', { candidate: rawCandidate, initialTab: 'rejection' });
        }}
      >
        <View style={[styles.actionIconBadge, { backgroundColor: 'rgba(239, 68, 68, 0.15)' }]}>
          <XCircle size={22} color="#EF4444" />
        </View>
        <View style={styles.actionCardContent}>
          <Text style={styles.actionCardTitle}>Send Rejection Email</Text>
          <Text style={styles.actionCardDesc}>
            Send a polite rejection message.
          </Text>
        </View>
        <ChevronRight size={20} color="#6B7280" />
      </TouchableOpacity>
    </Animated.View>
  );

  return (
    <View style={styles.container}>
      <MonochromeBackground />

      <SafeAreaView style={styles.safeArea}>
        {/* Top App Bar with Working Back Navigation */}
        <View style={styles.topBar}>
          <TouchableOpacity
            style={styles.iconButton}
            activeOpacity={0.7}
            onPress={() => navigation.goBack()}
          >
            <ArrowLeft size={22} color="#FFFFFF" />
          </TouchableOpacity>

          <Text style={styles.topBarTitle}>Candidate Analysis</Text>

          <TouchableOpacity
            style={styles.iconButton}
            activeOpacity={0.7}
            onPress={() => setIsShortlisted(!isShortlisted)}
          >
            <Star
              size={22}
              color={isShortlisted ? '#F59E0B' : '#9CA3AF'}
              fill={isShortlisted ? '#F59E0B' : 'none'}
            />
          </TouchableOpacity>
        </View>

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Hero Candidate Header Card */}
          <Animated.View entering={FadeInDown.duration(600)} style={styles.heroCard}>
            <View style={styles.heroRow}>
              {/* Candidate Info */}
              <View style={styles.heroInfo}>
                <View style={styles.roleBadge}>
                  <Briefcase size={12} color="#A78BFA" style={{ marginRight: 5 }} />
                  <Text style={styles.roleBadgeText}>Candidate Profile</Text>
                </View>
                <Text style={styles.heroName} numberOfLines={2}>{displayName}</Text>
                {fileName ? (
                  <View style={styles.fileRow}>
                    <FileText size={13} color="#9CA3AF" style={{ marginRight: 4 }} />
                    <Text style={styles.heroFileText} numberOfLines={1}>
                      {fileName}
                    </Text>
                  </View>
                ) : null}
              </View>

              {/* Circular Match Gauge */}
              <View style={styles.gaugeContainer}>
                <Svg width={size} height={size} style={styles.svgCircle}>
                  <Defs>
                    <SvgLinearGradient id="scoreGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                      <Stop offset="0%" stopColor="#C084FC" />
                      <Stop offset="50%" stopColor="#A78BFA" />
                      <Stop offset="100%" stopColor="#6366F1" />
                    </SvgLinearGradient>
                  </Defs>
                  {/* Track Circle */}
                  <Circle
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    stroke="rgba(255, 255, 255, 0.08)"
                    strokeWidth={strokeWidth}
                    fill="none"
                  />
                  {/* Active Progress Circle */}
                  <Circle
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    stroke="url(#scoreGrad)"
                    strokeWidth={strokeWidth}
                    strokeDasharray={circumference}
                    strokeDashoffset={progressOffset}
                    strokeLinecap="round"
                    fill="none"
                    rotation="-90"
                    origin={`${size / 2}, ${size / 2}`}
                  />
                </Svg>
                <View style={styles.gaugeCenterText}>
                  <Text style={styles.gaugeScoreText}>{matchScore}%</Text>
                  <Text style={styles.gaugeLabel}>MATCH</Text>
                </View>
              </View>
            </View>

            {/* Candidate Metadata 3-Col Bar */}
            <View style={styles.breakdownRow}>
              <View style={styles.breakdownItem}>
                <Text style={styles.breakdownVal}>{matchScore}%</Text>
                <Text style={styles.breakdownLbl}>Match Score</Text>
              </View>
              <View style={styles.breakdownDivider} />
              <View style={styles.breakdownItem}>
                <Text style={styles.breakdownVal}>{candidateStatus.toUpperCase()}</Text>
                <Text style={styles.breakdownLbl}>Status</Text>
              </View>
              <View style={styles.breakdownDivider} />
              <View style={styles.breakdownItem}>
                <Text style={styles.breakdownVal}>PDF</Text>
                <Text style={styles.breakdownLbl}>Format</Text>
              </View>
            </View>
          </Animated.View>

          {/* Segmented Pill Tabs */}
          <Animated.View entering={FadeInDown.delay(150).duration(600)} style={styles.tabBar}>
            {TABS.map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <TouchableOpacity
                  key={tab.id}
                  style={[styles.tabButton, isActive && styles.tabButtonActive]}
                  onPress={() => setActiveTab(tab.id)}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.tabText, isActive && styles.tabTextActive]}>
                    {tab.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </Animated.View>

          {/* Tab Content Section */}
          {activeTab === 'overview' && renderOverviewTab()}
          {activeTab === 'skill_gap' && renderSkillGapTab()}
          {activeTab === 'questions' && renderQuestionsTab()}
          {activeTab === 'actions' && renderActionsTab()}
        </ScrollView>
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
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 40,
  },
  heroCard: {
    backgroundColor: 'rgba(15, 20, 36, 0.85)',
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(99, 102, 241, 0.3)',
    marginBottom: 20,
    shadowColor: '#8B5CF6',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 6,
  },
  heroRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  heroInfo: {
    flex: 1,
    marginRight: 12,
  },
  roleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(167, 139, 250, 0.15)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    alignSelf: 'flex-start',
    marginBottom: 8,
  },
  roleBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#C084FC',
    textTransform: 'uppercase',
  },
  heroName: {
    fontSize: 22,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.5,
    marginBottom: 4,
  },
  fileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  heroFileText: {
    fontSize: 13,
    color: '#9CA3AF',
    fontWeight: '500',
    flex: 1,
  },
  gaugeContainer: {
    width: 110,
    height: 110,
    alignItems: 'center',
    justifyContent: 'center',
  },
  svgCircle: {
    position: 'absolute',
  },
  gaugeCenterText: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  gaugeScoreText: {
    fontSize: 22,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  gaugeLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#A78BFA',
    letterSpacing: 0.5,
  },
  breakdownRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(10, 14, 26, 0.65)',
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginTop: 18,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
  },
  breakdownItem: {
    alignItems: 'center',
    flex: 1,
  },
  breakdownVal: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 2,
  },
  breakdownLbl: {
    fontSize: 11,
    color: '#9CA3AF',
    fontWeight: '500',
  },
  breakdownDivider: {
    width: 1,
    height: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: 'rgba(10, 14, 26, 0.85)',
    borderRadius: 16,
    padding: 4,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  tabButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabButtonActive: {
    backgroundColor: '#6366F1',
    shadowColor: '#6366F1',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.35,
    shadowRadius: 6,
    elevation: 4,
  },
  tabText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#9CA3AF',
  },
  tabTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  card: {
    backgroundColor: 'rgba(15, 20, 36, 0.75)',
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: 'rgba(99, 102, 241, 0.25)',
    marginBottom: 16,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  cardHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sparkleBadge: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: 'rgba(167, 139, 250, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  summaryBody: {
    fontSize: 14,
    color: '#D1D5DB',
    lineHeight: 22,
  },
  strengthsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  strengthPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.25)',
  },
  strengthText: {
    fontSize: 13,
    color: '#E5E7EB',
    fontWeight: '500',
  },
  skillsList: {
    gap: 12,
  },
  gapItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: 'rgba(139, 92, 246, 0.08)',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(139, 92, 246, 0.2)',
  },
  gapItemText: {
    fontSize: 13,
    color: '#E5E7EB',
    lineHeight: 18,
    flex: 1,
  },
  noGapsText: {
    fontSize: 13,
    color: '#9CA3AF',
    fontStyle: 'italic',
  },
  redFlagCard: {
    borderColor: 'rgba(239, 68, 68, 0.35)',
    backgroundColor: 'rgba(30, 15, 20, 0.6)',
  },
  redFlagIconBadge: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  redFlagsList: {
    gap: 10,
  },
  redFlagItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  redDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#EF4444',
    marginTop: 6,
    marginRight: 10,
  },
  redFlagText: {
    fontSize: 13,
    color: '#FECACA',
    lineHeight: 19,
    flex: 1,
  },
  questionCategoryRow: {
    marginBottom: 8,
  },
  categoryBadge: {
    backgroundColor: 'rgba(167, 139, 250, 0.15)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  categoryBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#C084FC',
  },
  questionText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
    lineHeight: 21,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  infoIcon: {
    marginRight: 10,
  },
  infoLabel: {
    fontSize: 13,
    color: '#9CA3AF',
    width: 100,
  },
  infoValue: {
    fontSize: 13,
    color: '#FFFFFF',
    fontWeight: '600',
    flex: 1,
  },
  infoValueMuted: {
    fontSize: 13,
    color: '#6B7280',
    fontStyle: 'italic',
    flex: 1,
  },
  emptyPendingBox: {
    paddingVertical: 24,
    paddingHorizontal: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyIconCircle: {
    width: 56,
    height: 56,
    borderRadius: 20,
    backgroundColor: 'rgba(139, 92, 246, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(139, 92, 246, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  errorIconCircle: {
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    borderColor: 'rgba(239, 68, 68, 0.3)',
  },
  emptyPendingTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 6,
    textAlign: 'center',
  },
  emptyPendingDesc: {
    fontSize: 13,
    color: '#9CA3AF',
    textAlign: 'center',
    lineHeight: 19,
    maxWidth: 300,
    marginBottom: 12,
  },
  retryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#6366F1',
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 10,
    marginTop: 4,
  },
  retryBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  tabIntroRow: {
    marginBottom: 16,
  },
  tabIntroTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  tabIntroSubtitle: {
    fontSize: 13,
    color: '#9CA3AF',
    lineHeight: 18,
  },
  actionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(15, 20, 36, 0.75)',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(99, 102, 241, 0.25)',
    marginBottom: 12,
  },
  actionIconBadge: {
    width: 46,
    height: 46,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  actionCardContent: {
    flex: 1,
  },
  actionCardTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 3,
  },
  actionCardDesc: {
    fontSize: 12,
    color: '#9CA3AF',
    lineHeight: 16,
  },
});


