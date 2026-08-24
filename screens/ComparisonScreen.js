import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import {
  ArrowLeft,
  Share2,
  CheckCircle2,
  AlertTriangle,
  FileSpreadsheet,
  Briefcase,
  Award,
  Clock,
  Sparkles,
  ChevronRight,
  TrendingUp,
} from 'lucide-react-native';

import MonochromeBackground from '../components/landing/MonochromeBackground';
import MonochromeGetStartedButton from '../components/landing/MonochromeGetStartedButton';

const { width } = Dimensions.get('window');

const CANDIDATES_TO_COMPARE = [
  {
    id: '1',
    candidate_name: 'Sarah Chen',
    role: 'Sr. Full-Stack',
    match_score: 94,
    experience: '6+ Years',
    education: 'UC Berkeley (B.S.)',
    badgeColor: '#10B981',
    skills: {
      'React Native & Mobile': 96,
      'Node.js Microservices': 92,
      'System Architecture': 95,
      'FastAPI & Python': 68,
      'Vector DB & ChromaDB': 54,
      'Cloud Infra & AWS': 86,
    },
    topStrength: 'Production mobile performance & leadership',
    redFlag: 'Limited Python & vector search experience',
  },
  {
    id: '2',
    candidate_name: 'Priya Patel',
    role: 'AI / ML Specialist',
    match_score: 92,
    experience: '4+ Years',
    education: 'Stanford Univ (M.S.)',
    badgeColor: '#10B981',
    skills: {
      'React Native & Mobile': 72,
      'Node.js Microservices': 80,
      'System Architecture': 88,
      'FastAPI & Python': 98,
      'Vector DB & ChromaDB': 96,
      'Cloud Infra & AWS': 84,
    },
    topStrength: 'Deep PyTorch NLP & LangChain vector pipelines',
    redFlag: 'Lower React Native mobile UI depth',
  },
  {
    id: '3',
    candidate_name: 'Marcus Johnson',
    role: 'Backend Architect',
    match_score: 88,
    experience: '8+ Years',
    education: 'Georgia Tech (B.S.)',
    badgeColor: '#A78BFA',
    skills: {
      'React Native & Mobile': 60,
      'Node.js Microservices': 94,
      'System Architecture': 96,
      'FastAPI & Python': 90,
      'Vector DB & ChromaDB': 70,
      'Cloud Infra & AWS': 94,
    },
    topStrength: 'Distributed database scaling & architecture',
    redFlag: 'Minimal client-side mobile experience',
  },
];

const SKILL_CRITERIA = [
  { key: 'React Native & Mobile', required: 90 },
  { key: 'Node.js Microservices', required: 85 },
  { key: 'System Architecture', required: 85 },
  { key: 'FastAPI & Python', required: 80 },
  { key: 'Vector DB & ChromaDB', required: 75 },
  { key: 'Cloud Infra & AWS', required: 80 },
];

export default function ComparisonScreen() {
  const navigation = useNavigation();
  const [candidates] = useState(CANDIDATES_TO_COMPARE);
  const [shortlistSuccess, setShortlistSuccess] = useState(false);

  const getScoreColor = (score) => {
    if (score >= 85) return '#10B981';
    if (score >= 70) return '#A78BFA';
    return '#EF4444';
  };

  const handleShortlistAll = () => {
    setShortlistSuccess(true);
    setTimeout(() => setShortlistSuccess(false), 3000);
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

          <Text style={styles.topBarTitle}>Candidate Comparison</Text>

          <TouchableOpacity
            style={styles.iconButton}
            activeOpacity={0.7}
            onPress={() => {
              // Export comparison trigger
            }}
          >
            <Share2 size={20} color="#FFFFFF" />
          </TouchableOpacity>
        </View>

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Job Role Banner */}
          <Animated.View entering={FadeInDown.duration(500)} style={styles.roleBanner}>
            <View style={styles.roleBannerLeft}>
              <Briefcase size={16} color="#A78BFA" style={{ marginRight: 8 }} />
              <Text style={styles.roleBannerTitle}>Full-Stack AI Mobile Lead</Text>
            </View>
            <View style={styles.thresholdBadge}>
              <Text style={styles.thresholdText}>Threshold: 85%+</Text>
            </View>
          </Animated.View>

          {/* Top Candidates Horizontal Mini-Cards */}
          <Animated.View entering={FadeInDown.delay(100).duration(600)}>
            <Text style={styles.sectionHeading}>Selected for Comparison (3)</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.miniCardsContainer}
            >
              {candidates.map((c, idx) => (
                <TouchableOpacity
                  key={c.id}
                  style={styles.miniCard}
                  activeOpacity={0.85}
                  onPress={() =>
                    navigation.navigate('CandidateDetail', { candidate: c })
                  }
                >
                  <View style={styles.miniCardHeader}>
                    <View style={styles.avatarPill}>
                      <Text style={styles.avatarInitials}>
                        {c.candidate_name
                          .split(' ')
                          .map((n) => n[0])
                          .join('')}
                      </Text>
                    </View>
                    <View
                      style={[
                        styles.scoreBadge,
                        { borderColor: `${c.badgeColor}55`, backgroundColor: `${c.badgeColor}15` },
                      ]}
                    >
                      <Text style={[styles.scoreBadgeText, { color: c.badgeColor }]}>
                        {c.match_score}%
                      </Text>
                    </View>
                  </View>

                  <Text style={styles.miniCardName} numberOfLines={1}>
                    {c.candidate_name}
                  </Text>
                  <Text style={styles.miniCardRole} numberOfLines={1}>
                    {c.role}
                  </Text>

                  <View style={styles.miniCardFooter}>
                    <Text style={styles.viewDetailText}>View Profile</Text>
                    <ChevronRight size={14} color="#A78BFA" />
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </Animated.View>

          {/* Side-by-Side Comparison Matrix Card */}
          <Animated.View entering={FadeInDown.delay(200).duration(600)} style={styles.card}>
            <View style={styles.matrixCardHeader}>
              <TrendingUp size={18} color="#A78BFA" style={{ marginRight: 8 }} />
              <Text style={styles.cardTitle}>Skill-by-Skill Matrix</Text>
            </View>

            {/* Matrix Column Headers */}
            <View style={styles.matrixHeaderRow}>
              <Text style={[styles.matrixHeaderCol, styles.matrixColSkill]}>
                Requirement
              </Text>
              {candidates.map((c) => (
                <Text
                  key={c.id}
                  style={[styles.matrixHeaderCol, styles.matrixColCandidate]}
                  numberOfLines={1}
                >
                  {c.candidate_name.split(' ')[0]}
                </Text>
              ))}
            </View>

            {/* Skill Rows */}
            {SKILL_CRITERIA.map((criterion, idx) => (
              <View
                key={criterion.key}
                style={[
                  styles.matrixRow,
                  idx % 2 === 1 && styles.matrixRowAlt,
                ]}
              >
                <View style={styles.matrixColSkill}>
                  <Text style={styles.skillRowName}>{criterion.key}</Text>
                  <Text style={styles.skillRowReq}>Req: {criterion.required}%</Text>
                </View>

                {candidates.map((c) => {
                  const score = c.skills[criterion.key] || 0;
                  const color = getScoreColor(score);
                  return (
                    <View key={c.id} style={styles.matrixColCandidate}>
                      <View
                        style={[
                          styles.skillScorePill,
                          {
                            backgroundColor: `${color}15`,
                            borderColor: `${color}40`,
                          },
                        ]}
                      >
                        <Text style={[styles.skillScoreVal, { color }]}>
                          {score}%
                        </Text>
                      </View>
                    </View>
                  );
                })}
              </View>
            ))}
          </Animated.View>

          {/* Background & Metrics Comparison */}
          <Animated.View entering={FadeInDown.delay(300).duration(600)} style={styles.card}>
            <View style={styles.matrixCardHeader}>
              <Award size={18} color="#A78BFA" style={{ marginRight: 8 }} />
              <Text style={styles.cardTitle}>Experience & Background</Text>
            </View>

            {/* Experience Row */}
            <View style={styles.backgroundRow}>
              <View style={styles.bgIconCol}>
                <Clock size={16} color="#9CA3AF" />
                <Text style={styles.bgLabel}>Experience</Text>
              </View>
              <View style={styles.bgValuesRow}>
                {candidates.map((c) => (
                  <View key={c.id} style={styles.bgValueCol}>
                    <Text style={styles.bgCandidateName}>{c.candidate_name.split(' ')[0]}</Text>
                    <Text style={styles.bgValueText}>{c.experience}</Text>
                  </View>
                ))}
              </View>
            </View>

            {/* Education Row */}
            <View style={[styles.backgroundRow, { borderBottomWidth: 0 }]}>
              <View style={styles.bgIconCol}>
                <Award size={16} color="#9CA3AF" />
                <Text style={styles.bgLabel}>Education</Text>
              </View>
              <View style={styles.bgValuesRow}>
                {candidates.map((c) => (
                  <View key={c.id} style={styles.bgValueCol}>
                    <Text style={styles.bgCandidateName}>{c.candidate_name.split(' ')[0]}</Text>
                    <Text style={styles.bgValueText} numberOfLines={2}>
                      {c.education}
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          </Animated.View>

          {/* Qualitative Strengths & Red Flags Comparison */}
          <Animated.View entering={FadeInDown.delay(400).duration(600)} style={styles.card}>
            <View style={styles.matrixCardHeader}>
              <Sparkles size={18} color="#A78BFA" style={{ marginRight: 8 }} />
              <Text style={styles.cardTitle}>Key Strengths vs Identified Gaps</Text>
            </View>

            {candidates.map((c, idx) => (
              <View
                key={c.id}
                style={[
                  styles.candidateSummaryBlock,
                  idx !== candidates.length - 1 && styles.candidateSummaryDivider,
                ]}
              >
                <View style={styles.summaryBlockHeader}>
                  <Text style={styles.summaryBlockName}>{c.candidate_name}</Text>
                  <Text style={[styles.summaryBlockScore, { color: c.badgeColor }]}>
                    {c.match_score}% Match
                  </Text>
                </View>

                {/* Strength */}
                <View style={styles.insightItem}>
                  <CheckCircle2 size={15} color="#10B981" style={{ marginTop: 2, marginRight: 8 }} />
                  <Text style={styles.strengthText}>
                    <Text style={{ fontWeight: '700', color: '#10B981' }}>Strength: </Text>
                    {c.topStrength}
                  </Text>
                </View>

                {/* Red Flag */}
                <View style={styles.insightItem}>
                  <AlertTriangle size={15} color="#EF4444" style={{ marginTop: 2, marginRight: 8 }} />
                  <Text style={styles.redFlagText}>
                    <Text style={{ fontWeight: '700', color: '#EF4444' }}>Risk / Gap: </Text>
                    {c.redFlag}
                  </Text>
                </View>
              </View>
            ))}
          </Animated.View>

          {/* CTA Action Area */}
          <Animated.View entering={FadeInUp.delay(500).duration(600)} style={styles.actionSection}>
            {shortlistSuccess && (
              <View style={styles.successBanner}>
                <CheckCircle2 size={18} color="#10B981" style={{ marginRight: 8 }} />
                <Text style={styles.successText}>All 3 candidates shortlisted successfully!</Text>
              </View>
            )}

            <MonochromeGetStartedButton
              title="Shortlist All Above 85%"
              onPress={handleShortlistAll}
              delay={0}
            />

            <TouchableOpacity
              style={styles.exportBtn}
              activeOpacity={0.7}
              onPress={() => {
                navigation.navigate('Report');
              }}
            >
              <FileSpreadsheet size={16} color="#A78BFA" style={{ marginRight: 6 }} />
              <Text style={styles.exportBtnText}>Export Comparison Report (PDF / Excel)</Text>
            </TouchableOpacity>
          </Animated.View>
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
  roleBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(15, 20, 36, 0.85)',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: 'rgba(99, 102, 241, 0.25)',
    marginBottom: 20,
  },
  roleBannerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  roleBannerTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  thresholdBadge: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.3)',
  },
  thresholdText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#10B981',
  },
  sectionHeading: {
    fontSize: 15,
    fontWeight: '700',
    color: '#9CA3AF',
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  miniCardsContainer: {
    gap: 12,
    paddingBottom: 4,
    marginBottom: 20,
  },
  miniCard: {
    width: width * 0.44,
    backgroundColor: 'rgba(15, 20, 36, 0.85)',
    borderRadius: 20,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(99, 102, 241, 0.3)',
  },
  miniCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  avatarPill: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(167, 139, 250, 0.2)',
    borderWidth: 1,
    borderColor: 'rgba(167, 139, 250, 0.4)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitials: {
    fontSize: 13,
    fontWeight: '800',
    color: '#C084FC',
  },
  scoreBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 1,
  },
  scoreBadgeText: {
    fontSize: 12,
    fontWeight: '800',
  },
  miniCardName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 2,
  },
  miniCardRole: {
    fontSize: 12,
    color: '#9CA3AF',
    marginBottom: 12,
  },
  miniCardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.08)',
    paddingTop: 8,
  },
  viewDetailText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#A78BFA',
  },
  card: {
    backgroundColor: 'rgba(15, 20, 36, 0.75)',
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: 'rgba(99, 102, 241, 0.25)',
    marginBottom: 18,
  },
  matrixCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  matrixHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
    marginBottom: 4,
  },
  matrixHeaderCol: {
    fontSize: 12,
    fontWeight: '700',
    color: '#9CA3AF',
  },
  matrixColSkill: {
    flex: 1.5,
  },
  matrixColCandidate: {
    flex: 1,
    textAlign: 'center',
    alignItems: 'center',
  },
  matrixRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 6,
    borderRadius: 10,
  },
  matrixRowAlt: {
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
  },
  skillRowName: {
    fontSize: 13,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 2,
  },
  skillRowReq: {
    fontSize: 11,
    color: '#6B7280',
  },
  skillScorePill: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    minWidth: 48,
    alignItems: 'center',
  },
  skillScoreVal: {
    fontSize: 12,
    fontWeight: '700',
  },
  backgroundRow: {
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
  },
  bgIconCol: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    gap: 8,
  },
  bgLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#9CA3AF',
  },
  bgValuesRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  bgValueCol: {
    flex: 1,
    backgroundColor: 'rgba(10, 14, 26, 0.65)',
    padding: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
  },
  bgCandidateName: {
    fontSize: 11,
    fontWeight: '700',
    color: '#A78BFA',
    marginBottom: 4,
  },
  bgValueText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  candidateSummaryBlock: {
    paddingVertical: 12,
  },
  candidateSummaryDivider: {
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
  },
  summaryBlockHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  summaryBlockName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  summaryBlockScore: {
    fontSize: 13,
    fontWeight: '800',
  },
  insightItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 6,
  },
  strengthText: {
    fontSize: 12,
    color: '#D1D5DB',
    lineHeight: 18,
    flex: 1,
  },
  redFlagText: {
    fontSize: 12,
    color: '#FCA5A5',
    lineHeight: 18,
    flex: 1,
  },
  actionSection: {
    alignItems: 'center',
    marginTop: 8,
    gap: 14,
  },
  successBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.3)',
    marginBottom: 4,
  },
  successText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#10B981',
  },
  exportBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  exportBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#A78BFA',
    textDecorationLine: 'underline',
  },
});
