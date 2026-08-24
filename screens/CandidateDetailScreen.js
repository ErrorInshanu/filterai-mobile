import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import Animated, { FadeInDown, FadeIn } from 'react-native-reanimated';
import Svg, { Circle, Defs, LinearGradient as SvgLinearGradient, Stop } from 'react-native-svg';
import {
  ArrowLeft,
  Star,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  Lightbulb,
  Mail,
  ChevronRight,
  TrendingUp,
  XCircle,
  Briefcase,
  MapPin,
  Clock,
  Send,
  Scale,
  Award,
} from 'lucide-react-native';

import MonochromeBackground from '../components/landing/MonochromeBackground';

const TABS = [
  { id: 'overview', label: 'Overview' },
  { id: 'skill_gap', label: 'Skill Gap' },
  { id: 'questions', label: 'Questions' },
  { id: 'actions', label: 'Actions' },
];

const DEFAULT_CANDIDATE = {
  id: '1',
  candidate_name: 'Sarah Chen',
  role: 'Senior Full-Stack Engineer',
  match_score: 94,
  shortlisted: true,
  summary:
    'Exceptional full-stack candidate with 6+ years experience architecting scalable React Native and Node.js microservices. Led two high-traffic production launches with strong engineering leadership and code quality discipline.',
  breakdown: {
    technical: 96,
    experience: 92,
    education: 90,
  },
  contact: {
    email: 'sarah.chen@example.com',
    location: 'San Francisco, CA (Remote)',
    experience: '6+ Years',
    education: 'B.S. Computer Science — UC Berkeley',
  },
  strengths: [
    'React Native & Web Architecture',
    'Node.js & High-Throughput APIs',
    'Distributed Systems Design',
    'Engineering Team Mentorship',
    'Performance Optimization (60fps)',
    'CI/CD & Automated Testing',
  ],
  skillGaps: [
    {
      skill: 'React Native & Mobile Performance',
      candidateScore: 96,
      requiredScore: 90,
      status: 'exceeds',
    },
    {
      skill: 'Node.js & Backend Architecture',
      candidateScore: 92,
      requiredScore: 85,
      status: 'exceeds',
    },
    {
      skill: 'Cloud Infra & AWS',
      candidateScore: 86,
      requiredScore: 80,
      status: 'meets',
    },
    {
      skill: 'FastAPI & Python Microservices',
      candidateScore: 68,
      requiredScore: 80,
      status: 'gap',
    },
    {
      skill: 'Vector DB & AI Embeddings (ChromaDB)',
      candidateScore: 54,
      requiredScore: 75,
      status: 'gap',
    },
  ],
  redFlags: [
    'Limited hands-on production experience with Python FastAPI and ChromaDB pipelines.',
    'Short tenure (<10 months) at first early-stage startup (2019).',
  ],
  interviewQuestions: [
    {
      id: 'q1',
      category: 'System Architecture',
      question:
        'How would you optimize complex state management and re-rendering loops in a high-concurrency React Native dashboard?',
      tip: 'Look for deep understanding of memoization, worklets, and Zustand architecture.',
    },
    {
      id: 'q2',
      category: 'AI Pipeline Integration (Skill Gap)',
      question:
        'FilterAI handles large-scale resume embeddings via ChromaDB. Given your Python gap, how would you design an async ingestion queue?',
      tip: 'Gauge problem-solving ability and speed of adapting to new backend stacks.',
    },
    {
      id: 'q3',
      category: 'Leadership & Culture',
      question:
        'Describe a time you resolved a major technical disagreement regarding architectural trade-offs within your team.',
      tip: 'Evaluate empathy, data-driven reasoning, and collaboration clarity.',
    },
  ],
};

export default function CandidateDetailScreen() {
  const navigation = useNavigation();
  const route = useRoute();

  const candidate = {
    ...DEFAULT_CANDIDATE,
    ...(route.params?.candidate || {}),
  };

  const [activeTab, setActiveTab] = useState('overview');
  const [isShortlisted, setIsShortlisted] = useState(candidate.shortlisted ?? false);

  // SVG Circle calculations
  const size = 110;
  const strokeWidth = 8;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const progressOffset =
    circumference - (candidate.match_score / 100) * circumference;

  const getStatusBadge = (status) => {
    switch (status) {
      case 'exceeds':
        return { label: 'Exceeds', bg: 'rgba(16, 185, 129, 0.15)', text: '#10B981', border: 'rgba(16, 185, 129, 0.3)' };
      case 'meets':
        return { label: 'Meets', bg: 'rgba(139, 92, 246, 0.15)', text: '#A78BFA', border: 'rgba(139, 92, 246, 0.3)' };
      case 'gap':
      default:
        return { label: 'Skill Gap', bg: 'rgba(239, 68, 68, 0.15)', text: '#EF4444', border: 'rgba(239, 68, 68, 0.3)' };
    }
  };

  const renderOverviewTab = () => (
    <Animated.View entering={FadeIn.duration(400)}>
      {/* AI Summary Card */}
      <View style={styles.card}>
        <View style={styles.cardHeaderRow}>
          <View style={styles.cardHeaderLeft}>
            <View style={styles.sparkleBadge}>
              <Sparkles size={16} color="#A78BFA" />
            </View>
            <Text style={styles.cardTitle}>AI Executive Summary</Text>
          </View>
        </View>
        <Text style={styles.summaryBody}>{candidate.summary}</Text>
      </View>

      {/* Key Strengths */}
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
          {candidate.strengths.map((strength, index) => (
            <View key={index} style={styles.strengthPill}>
              <CheckCircle2 size={14} color="#10B981" style={{ marginRight: 6 }} />
              <Text style={styles.strengthText}>{strength}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* Candidate Background & Details */}
      <View style={styles.card}>
        <Text style={[styles.cardTitle, { marginBottom: 14 }]}>Candidate Information</Text>

        <View style={styles.infoRow}>
          <Mail size={16} color="#9CA3AF" style={styles.infoIcon} />
          <Text style={styles.infoLabel}>Email:</Text>
          <Text style={styles.infoValue}>{candidate.contact?.email || 'candidate@example.com'}</Text>
        </View>

        <View style={styles.infoRow}>
          <MapPin size={16} color="#9CA3AF" style={styles.infoIcon} />
          <Text style={styles.infoLabel}>Location:</Text>
          <Text style={styles.infoValue}>{candidate.contact?.location || 'San Francisco, CA'}</Text>
        </View>

        <View style={styles.infoRow}>
          <Clock size={16} color="#9CA3AF" style={styles.infoIcon} />
          <Text style={styles.infoLabel}>Experience:</Text>
          <Text style={styles.infoValue}>{candidate.contact?.experience || '5+ Years'}</Text>
        </View>

        <View style={styles.infoRow}>
          <Award size={16} color="#9CA3AF" style={styles.infoIcon} />
          <Text style={styles.infoLabel}>Education:</Text>
          <Text style={styles.infoValue}>{candidate.contact?.education || 'B.S. Computer Science'}</Text>
        </View>
      </View>
    </Animated.View>
  );

  const renderSkillGapTab = () => (
    <Animated.View entering={FadeIn.duration(400)}>
      {/* Skill Breakdown Card */}
      <View style={styles.card}>
        <View style={styles.cardHeaderRow}>
          <View style={styles.cardHeaderLeft}>
            <View style={styles.sparkleBadge}>
              <TrendingUp size={16} color="#A78BFA" />
            </View>
            <Text style={styles.cardTitle}>JD Requirements vs Resume</Text>
          </View>
        </View>

        <View style={styles.skillsList}>
          {candidate.skillGaps.map((item, index) => {
            const badge = getStatusBadge(item.status);
            return (
              <View key={index} style={styles.skillItem}>
                <View style={styles.skillHeaderRow}>
                  <Text style={styles.skillName}>{item.skill}</Text>
                  <View
                    style={[
                      styles.statusPill,
                      { backgroundColor: badge.bg, borderColor: badge.border },
                    ]}
                  >
                    <Text style={[styles.statusPillText, { color: badge.text }]}>
                      {badge.label}
                    </Text>
                  </View>
                </View>

                {/* Progress Bar Container */}
                <View style={styles.progressBarBg}>
                  <View
                    style={[
                      styles.progressBarFill,
                      {
                        width: `${item.candidateScore}%`,
                        backgroundColor:
                          item.status === 'exceeds'
                            ? '#10B981'
                            : item.status === 'meets'
                            ? '#8B5CF6'
                            : '#EF4444',
                      },
                    ]}
                  />
                  {/* Required Target Marker */}
                  <View
                    style={[
                      styles.targetMarker,
                      { left: `${item.requiredScore}%` },
                    ]}
                  />
                </View>

                <View style={styles.scoreMetaRow}>
                  <Text style={styles.scoreMetaText}>
                    Candidate: <Text style={{ color: '#FFFFFF', fontWeight: '700' }}>{item.candidateScore}%</Text>
                  </Text>
                  <Text style={styles.scoreMetaText}>
                    Target: <Text style={{ color: '#9CA3AF', fontWeight: '600' }}>{item.requiredScore}%</Text>
                  </Text>
                </View>
              </View>
            );
          })}
        </View>
      </View>

      {/* Red Flags / Risk Factors */}
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
          {candidate.redFlags.map((flag, index) => (
            <View key={index} style={styles.redFlagItem}>
              <View style={styles.redDot} />
              <Text style={styles.redFlagText}>{flag}</Text>
            </View>
          ))}
        </View>
      </View>
    </Animated.View>
  );

  const renderQuestionsTab = () => (
    <Animated.View entering={FadeIn.duration(400)}>
      <View style={styles.tabIntroRow}>
        <Text style={styles.tabIntroTitle}>AI-Generated Interview Questions</Text>
        <Text style={styles.tabIntroSubtitle}>
          Tailored to verify candidate strengths and probe identified resume gaps.
        </Text>
      </View>

      {candidate.interviewQuestions.map((q, index) => (
        <View key={q.id} style={styles.card}>
          <View style={styles.questionCategoryRow}>
            <View style={styles.categoryBadge}>
              <Text style={styles.categoryBadgeText}>Question {index + 1} • {q.category}</Text>
            </View>
          </View>

          <Text style={styles.questionText}>
            {`"${q.question}"`}
          </Text>

          <View style={styles.tipBox}>
            <Lightbulb size={16} color="#F59E0B" style={{ marginTop: 2, marginRight: 8 }} />
            <View style={{ flex: 1 }}>
              <Text style={styles.tipTitle}>Recruiter Evaluation Tip:</Text>
              <Text style={styles.tipText}>{q.tip}</Text>
            </View>
          </View>
        </View>
      ))}
    </Animated.View>
  );

  const renderActionsTab = () => (
    <Animated.View entering={FadeIn.duration(400)}>
      <View style={styles.tabIntroRow}>
        <Text style={styles.tabIntroTitle}>Screening Actions</Text>
        <Text style={styles.tabIntroSubtitle}>
          Quickly progress this candidate to the next hiring stage.
        </Text>
      </View>

      {/* Offer Letter Action */}
      <TouchableOpacity
        style={styles.actionCard}
        activeOpacity={0.8}
        onPress={() => {
          navigation.navigate('OfferLetter', { candidate, initialTab: 'offer' });
        }}
      >
        <View style={[styles.actionIconBadge, { backgroundColor: 'rgba(16, 185, 129, 0.15)' }]}>
          <Send size={22} color="#10B981" />
        </View>
        <View style={styles.actionCardContent}>
          <Text style={styles.actionCardTitle}>Draft AI Offer Letter</Text>
          <Text style={styles.actionCardDesc}>
            Generate an offer letter using Groq LLaMA 3.3 and send via SMTP.
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
          <Text style={styles.actionCardTitle}>Add to Comparison Matrix</Text>
          <Text style={styles.actionCardDesc}>
            Compare side-by-side with top candidates for this role.
          </Text>
        </View>
        <ChevronRight size={20} color="#6B7280" />
      </TouchableOpacity>

      {/* Rejection Letter Action */}
      <TouchableOpacity
        style={styles.actionCard}
        activeOpacity={0.8}
        onPress={() => {
          navigation.navigate('Rejection', { candidate, initialTab: 'rejection' });
        }}
      >
        <View style={[styles.actionIconBadge, { backgroundColor: 'rgba(239, 68, 68, 0.15)' }]}>
          <XCircle size={22} color="#EF4444" />
        </View>
        <View style={styles.actionCardContent}>
          <Text style={styles.actionCardTitle}>Send Rejection Email</Text>
          <Text style={styles.actionCardDesc}>
            Polite, feedback-rich rejection note generated automatically.
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
        {/* Top App Bar */}
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
                  <Text style={styles.roleBadgeText}>Applicant</Text>
                </View>
                <Text style={styles.heroName}>{candidate.candidate_name}</Text>
                <Text style={styles.heroRole}>{candidate.role || 'Full-Stack Engineer'}</Text>
                <Text style={styles.heroMeta}>
                  {(candidate.contact && candidate.contact.location) || 'San Francisco, CA'} • {(candidate.contact && candidate.contact.experience) || '5+ Years'}
                </Text>
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
                  <Text style={styles.gaugeScoreText}>{candidate.match_score}%</Text>
                  <Text style={styles.gaugeLabel}>MATCH</Text>
                </View>
              </View>
            </View>

            {/* Match Categories 3-Col Bar */}
            <View style={styles.breakdownRow}>
              <View style={styles.breakdownItem}>
                <Text style={styles.breakdownVal}>{(candidate.breakdown && candidate.breakdown.technical) || 96}%</Text>
                <Text style={styles.breakdownLbl}>Technical</Text>
              </View>
              <View style={styles.breakdownDivider} />
              <View style={styles.breakdownItem}>
                <Text style={styles.breakdownVal}>{(candidate.breakdown && candidate.breakdown.experience) || 92}%</Text>
                <Text style={styles.breakdownLbl}>Experience</Text>
              </View>
              <View style={styles.breakdownDivider} />
              <View style={styles.breakdownItem}>
                <Text style={styles.breakdownVal}>{(candidate.breakdown && candidate.breakdown.education) || 90}%</Text>
                <Text style={styles.breakdownLbl}>Education</Text>
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
    marginBottom: 2,
  },
  heroRole: {
    fontSize: 14,
    fontWeight: '600',
    color: '#A78BFA',
    marginBottom: 6,
  },
  heroMeta: {
    fontSize: 12,
    color: '#9CA3AF',
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
    fontSize: 15,
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
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  infoIcon: {
    marginRight: 10,
  },
  infoLabel: {
    fontSize: 13,
    color: '#9CA3AF',
    width: 90,
  },
  infoValue: {
    fontSize: 13,
    color: '#FFFFFF',
    fontWeight: '600',
    flex: 1,
  },
  skillsList: {
    gap: 16,
  },
  skillItem: {
    gap: 6,
  },
  skillHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  skillName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  statusPill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 1,
  },
  statusPillText: {
    fontSize: 11,
    fontWeight: '700',
  },
  progressBarBg: {
    height: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 4,
    overflow: 'hidden',
    position: 'relative',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  targetMarker: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 2,
    backgroundColor: '#FFFFFF',
    opacity: 0.6,
  },
  scoreMetaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 2,
  },
  scoreMetaText: {
    fontSize: 11,
    color: '#6B7280',
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
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
    lineHeight: 22,
    marginBottom: 12,
  },
  tipBox: {
    flexDirection: 'row',
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.25)',
  },
  tipTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#F59E0B',
    marginBottom: 2,
  },
  tipText: {
    fontSize: 12,
    color: '#D1D5DB',
    lineHeight: 17,
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
