import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import {
  ArrowLeft,
  FileSpreadsheet,
  CheckCircle2,
  Share2,
  Award,
  TrendingUp,
  Users,
  ShieldCheck,
} from 'lucide-react-native';

import MonochromeBackground from '../components/landing/MonochromeBackground';
import MonochromeGetStartedButton from '../components/landing/MonochromeGetStartedButton';

const TOP_CANDIDATES = [
  {
    rank: 1,
    name: 'Maya Lin',
    role: 'Senior Staff Engineer',
    score: 97,
    status: 'Shortlisted',
    highlight: '8+ yrs React Native, Node.js & distributed AI',
  },
  {
    rank: 2,
    name: 'Samantha Wu',
    role: 'Principal Software Engineer',
    score: 96,
    status: 'Shortlisted',
    highlight: 'Deep distributed systems and AI infrastructure',
  },
  {
    rank: 3,
    name: 'Sarah Chen',
    role: 'Senior Full-Stack Engineer',
    score: 94,
    status: 'Offer Pending',
    highlight: 'Led 2 production releases, mobile performance lead',
  },
  {
    rank: 4,
    name: 'Priya Patel',
    role: 'AI / ML Specialist',
    score: 92,
    status: 'Shortlisted',
    highlight: '4 yrs PyTorch NLP models & vector search pipelines',
  },
  {
    rank: 5,
    name: 'Nina Sharma',
    role: 'AI Application Developer',
    score: 91,
    status: 'Interviewed',
    highlight: 'LLM API integration & RAG pipeline architectures',
  },
];

export default function ReportScreen() {
  const navigation = useNavigation();
  const [downloadingFormat, setDownloadingFormat] = useState(null); // 'pdf' | 'excel' | null
  const [downloadSuccess, setDownloadSuccess] = useState(null);

  const handleDownload = (format) => {
    setDownloadingFormat(format);
    setDownloadSuccess(null);

    setTimeout(() => {
      setDownloadingFormat(null);
      setDownloadSuccess(
        format === 'pdf'
          ? 'FilterAI_Candidate_Report.pdf generated and saved.'
          : 'FilterAI_Candidate_Export.xlsx downloaded successfully.'
      );
      setTimeout(() => setDownloadSuccess(null), 4000);
    }, 1500);
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

          <Text style={styles.topBarTitle}>Candidate Report</Text>

          <TouchableOpacity
            style={styles.iconButton}
            activeOpacity={0.7}
            onPress={() => handleDownload('pdf')}
          >
            <Share2 size={20} color="#FFFFFF" />
          </TouchableOpacity>
        </View>

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Executive Report Summary Header Card */}
          <Animated.View entering={FadeInDown.duration(500)} style={styles.headerCard}>
            <View style={styles.reportBadge}>
              <Award size={14} color="#C084FC" style={{ marginRight: 6 }} />
              <Text style={styles.reportBadgeText}>Official AI Screening Report</Text>
            </View>

            <Text style={styles.reportTitle}>Batch Executive Summary</Text>
            <Text style={styles.reportSubtitle}>
              Generated for Role: <Text style={{ color: '#FFFFFF', fontWeight: '700' }}>Senior Full-Stack Engineer</Text>
            </Text>

            {/* Quick Metrics 3-Col Row */}
            <View style={styles.metricsRow}>
              <View style={styles.metricItem}>
                <Text style={styles.metricNumber}>247</Text>
                <Text style={styles.metricLabel}>Total Screened</Text>
              </View>
              <View style={styles.metricDivider} />
              <View style={styles.metricItem}>
                <Text style={styles.metricNumber}>38</Text>
                <Text style={styles.metricLabel}>Shortlisted</Text>
              </View>
              <View style={styles.metricDivider} />
              <View style={styles.metricItem}>
                <Text style={styles.metricNumber}>94.2%</Text>
                <Text style={styles.metricLabel}>Top 5 Avg</Text>
              </View>
            </View>
          </Animated.View>

          {/* Match Score Distribution Chart Card */}
          <Animated.View entering={FadeInDown.delay(150).duration(600)} style={styles.card}>
            <View style={styles.cardHeader}>
              <TrendingUp size={18} color="#A78BFA" style={{ marginRight: 8 }} />
              <Text style={styles.cardTitle}>Top Candidates Match Accuracy</Text>
            </View>

            <View style={styles.chartContainer}>
              {TOP_CANDIDATES.map((candidate) => (
                <View key={candidate.rank} style={styles.chartRow}>
                  <View style={styles.chartLabelCol}>
                    <Text style={styles.chartRank}>#{candidate.rank}</Text>
                    <Text style={styles.chartName} numberOfLines={1}>
                      {candidate.name}
                    </Text>
                  </View>

                  <View style={styles.chartBarCol}>
                    <View style={styles.chartBarTrack}>
                      <View
                        style={[
                          styles.chartBarFill,
                          {
                            width: `${candidate.score}%`,
                            backgroundColor:
                              candidate.score >= 95
                                ? '#10B981'
                                : candidate.score >= 90
                                ? '#8B5CF6'
                                : '#6366F1',
                          },
                        ]}
                      />
                    </View>
                  </View>

                  <Text style={styles.chartScoreText}>{candidate.score}%</Text>
                </View>
              ))}
            </View>
          </Animated.View>

          {/* Top 5 Ranked Candidates Table */}
          <Animated.View entering={FadeInDown.delay(250).duration(600)} style={styles.card}>
            <View style={styles.cardHeader}>
              <Users size={18} color="#A78BFA" style={{ marginRight: 8 }} />
              <Text style={styles.cardTitle}>Top 5 Shortlisted Breakdown</Text>
            </View>

            <View style={styles.candidateList}>
              {TOP_CANDIDATES.map((candidate, idx) => (
                <View
                  key={candidate.rank}
                  style={[
                    styles.candidateItem,
                    idx !== TOP_CANDIDATES.length - 1 && styles.candidateItemDivider,
                  ]}
                >
                  <View style={styles.candidateItemHeader}>
                    <View style={styles.rankPill}>
                      <Text style={styles.rankPillText}>#{candidate.rank}</Text>
                    </View>
                    <View style={{ flex: 1, marginLeft: 10 }}>
                      <Text style={styles.candidateItemName}>{candidate.name}</Text>
                      <Text style={styles.candidateItemRole}>{candidate.role}</Text>
                    </View>
                    <View style={styles.scorePillBadge}>
                      <Text style={styles.scorePillText}>{candidate.score}% Match</Text>
                    </View>
                  </View>
                  <Text style={styles.candidateHighlight}>• {candidate.highlight}</Text>
                </View>
              ))}
            </View>
          </Animated.View>

          {/* Security & Verification Guarantee Card */}
          <Animated.View entering={FadeInDown.delay(350).duration(600)} style={styles.securityCard}>
            <ShieldCheck size={20} color="#10B981" style={{ marginRight: 12 }} />
            <View style={{ flex: 1 }}>
              <Text style={styles.securityTitle}>ReportLab & OpenPyXL Pipeline</Text>
              <Text style={styles.securitySubtext}>
                Verified against ChromaDB cosine vectors and LangChain chunking. Ready for hiring stakeholder review.
              </Text>
            </View>
          </Animated.View>

          {/* Download Notification Toast */}
          {downloadSuccess && (
            <Animated.View entering={FadeInDown.duration(400)} style={styles.successBanner}>
              <CheckCircle2 size={18} color="#10B981" style={{ marginRight: 8 }} />
              <Text style={styles.successText}>{downloadSuccess}</Text>
            </Animated.View>
          )}

          {/* Download Action CTAs */}
          <Animated.View entering={FadeInUp.delay(400).duration(600)} style={styles.actionSection}>
            <MonochromeGetStartedButton
              title={downloadingFormat === 'pdf' ? 'Generating PDF...' : 'Download PDF Report'}
              onPress={() => handleDownload('pdf')}
              delay={0}
            />

            <TouchableOpacity
              style={styles.excelDownloadBtn}
              activeOpacity={0.8}
              onPress={() => handleDownload('excel')}
            >
              <FileSpreadsheet size={18} color="#10B981" style={{ marginRight: 8 }} />
              <Text style={styles.excelDownloadText}>
                {downloadingFormat === 'excel' ? 'Exporting...' : 'Download Excel Data (.xlsx)'}
              </Text>
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
  headerCard: {
    backgroundColor: 'rgba(15, 20, 36, 0.85)',
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(99, 102, 241, 0.3)',
    marginBottom: 18,
    shadowColor: '#8B5CF6',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 6,
  },
  reportBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(167, 139, 250, 0.15)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    alignSelf: 'flex-start',
    marginBottom: 10,
  },
  reportBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#C084FC',
    textTransform: 'uppercase',
  },
  reportTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.5,
    marginBottom: 4,
  },
  reportSubtitle: {
    fontSize: 13,
    color: '#9CA3AF',
    marginBottom: 18,
  },
  metricsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(10, 14, 26, 0.65)',
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
  },
  metricItem: {
    alignItems: 'center',
    flex: 1,
  },
  metricNumber: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 2,
  },
  metricLabel: {
    fontSize: 11,
    color: '#9CA3AF',
    fontWeight: '500',
  },
  metricDivider: {
    width: 1,
    height: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  card: {
    backgroundColor: 'rgba(15, 20, 36, 0.75)',
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: 'rgba(99, 102, 241, 0.25)',
    marginBottom: 18,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  chartContainer: {
    gap: 12,
  },
  chartRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  chartLabelCol: {
    flexDirection: 'row',
    alignItems: 'center',
    width: 110,
  },
  chartRank: {
    fontSize: 12,
    fontWeight: '700',
    color: '#A78BFA',
    width: 24,
  },
  chartName: {
    fontSize: 13,
    fontWeight: '600',
    color: '#FFFFFF',
    flex: 1,
  },
  chartBarCol: {
    flex: 1,
    marginHorizontal: 10,
  },
  chartBarTrack: {
    height: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 4,
    overflow: 'hidden',
  },
  chartBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  chartScoreText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
    width: 36,
    textAlign: 'right',
  },
  candidateList: {
    gap: 12,
  },
  candidateItem: {
    paddingBottom: 10,
  },
  candidateItemDivider: {
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
  },
  candidateItemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  rankPill: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(167, 139, 250, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  rankPillText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#C084FC',
  },
  candidateItemName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  candidateItemRole: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  scorePillBadge: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.3)',
  },
  scorePillText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#10B981',
  },
  candidateHighlight: {
    fontSize: 12,
    color: '#D1D5DB',
    lineHeight: 18,
    paddingLeft: 38,
  },
  securityCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(15, 20, 36, 0.65)',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.25)',
    marginBottom: 20,
  },
  securityTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 2,
  },
  securitySubtext: {
    fontSize: 12,
    color: '#9CA3AF',
    lineHeight: 16,
  },
  successBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.3)',
    marginBottom: 16,
  },
  successText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#10B981',
  },
  actionSection: {
    alignItems: 'center',
    gap: 12,
  },
  excelDownloadBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    backgroundColor: 'rgba(15, 20, 36, 0.75)',
    borderRadius: 16,
    paddingVertical: 15,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.35)',
  },
  excelDownloadText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#10B981',
  },
});
