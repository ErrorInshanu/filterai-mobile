import { useNavigation, useRoute } from '@react-navigation/native';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import {
  AlertCircle,
  ArrowLeft,
  Award,
  Briefcase,
  CheckCircle2,
  Download,
  FileText,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  Users,
} from 'lucide-react-native';
import React, { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import Animated, { FadeIn, FadeInDown, FadeInUp } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import MonochromeBackground from '../components/landing/MonochromeBackground';
import { API_URL } from '../constants/api';
import { useAppStore } from '../store/useAppStore';

function getScoreBadge(score = 0) {
  if (score >= 70) {
    return {
      bg: 'rgba(16, 185, 129, 0.15)',
      text: '#10B981',
      border: 'rgba(16, 185, 129, 0.35)',
      tier: 'High Match',
    };
  } else if (score >= 40) {
    return {
      bg: 'rgba(245, 158, 11, 0.15)',
      text: '#F59E0B',
      border: 'rgba(245, 158, 11, 0.35)',
      tier: 'Moderate',
    };
  } else {
    return {
      bg: 'rgba(107, 114, 128, 0.15)',
      text: '#9CA3AF',
      border: 'rgba(107, 114, 128, 0.3)',
      tier: 'Low Match',
    };
  }
}

export default function ReportScreen() {
  const navigation = useNavigation();
  const route = useRoute();

  // Auth & Store Data
  const token = useAppStore((state) => state.token);
  const storeCandidates = useAppStore((state) => state.candidates) || [];
  const currentBatchId = useAppStore((state) => state.currentBatchId);
  const activeBatch = useAppStore((state) => state.activeBatch);
  const jobDescription = useAppStore((state) => state.jobDescription);

  const effectiveBatchId =
    route.params?.batch_id ||
    currentBatchId ||
    activeBatch?.batch_id ||
    activeBatch?.id ||
    null;

  // UI state
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState(null);
  const [errorMessage, setErrorMessage] = useState(null);

  // Compute stats for summary preview from candidates in store
  const sortedCandidates = useMemo(() => {
    if (!Array.isArray(storeCandidates)) return [];
    return [...storeCandidates].sort(
      (a, b) => (b.match_score || 0) - (a.match_score || 0)
    );
  }, [storeCandidates]);

  const stats = useMemo(() => {
    const total = sortedCandidates.length;
    if (total === 0) {
      return {
        total: 0,
        avg: '0.0',
        high: '0.0',
        low: '0.0',
        highCount: 0,
        moderateCount: 0,
        lowCount: 0,
      };
    }

    const scores = sortedCandidates.map((c) =>
      typeof c.match_score === 'number' ? c.match_score : 0
    );
    const sum = scores.reduce((acc, s) => acc + s, 0);
    const avg = (sum / total).toFixed(1);
    const high = Math.max(...scores).toFixed(1);
    const low = Math.min(...scores).toFixed(1);

    const highCount = scores.filter((s) => s >= 70).length;
    const moderateCount = scores.filter((s) => s >= 40 && s < 70).length;
    const lowCount = scores.filter((s) => s < 40).length;

    return {
      total,
      avg,
      high,
      low,
      highCount,
      moderateCount,
      lowCount,
    };
  }, [sortedCandidates]);

  const handleDownloadPdf = async () => {
    if (!effectiveBatchId) {
      setErrorMessage(
        'No active batch ID found. Please analyze a batch first to generate an official PDF report.'
      );
      return;
    }

    setIsDownloading(true);
    setErrorMessage(null);
    setDownloadSuccess(null);

    try {
      const headers = {};
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const fileUri = `${
        FileSystem.documentDirectory || FileSystem.cacheDirectory
      }FilterAI_Report_${effectiveBatchId}.pdf`;

      const downloadResult = await FileSystem.downloadAsync(
        `${API_URL}/api/generate-report/${effectiveBatchId}`,
        fileUri,
        { headers }
      );

      if (downloadResult.status !== 200) {
        throw new Error(
          `Server returned status ${downloadResult.status} when generating PDF report.`
        );
      }

      const isShareAvailable = await Sharing.isAvailableAsync();
      if (isShareAvailable) {
        await Sharing.shareAsync(downloadResult.uri, {
          mimeType: 'application/pdf',
          dialogTitle: `FilterAI Report - Batch ${effectiveBatchId}`,
          UTI: 'com.adobe.pdf',
        });
      }

      setDownloadSuccess('PDF report generated and exported successfully.');
      setTimeout(() => setDownloadSuccess(null), 5000);
    } catch (err) {
      console.log('PDF generation / download error:', err);
      setErrorMessage(
        err.message ||
          'Failed to generate or download the PDF report. Please verify your connection.'
      );
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <View style={styles.container}>
      <MonochromeBackground />

      <SafeAreaView style={styles.safeArea}>
        {/* Top App Bar */}
        <View style={styles.topBar}>
          <TouchableOpacity
            style={styles.backButton}
            activeOpacity={0.7}
            onPress={() => navigation.goBack()}
          >
            <ArrowLeft size={22} color="#FFFFFF" />
          </TouchableOpacity>

          <View style={styles.titleWrap}>
            <Text style={styles.topBarTitle}>Screening Report</Text>
            <Text style={styles.topBarSubtitle}>Official PDF Export</Text>
          </View>

          <View style={{ width: 40 }} />
        </View>

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Status / Success Toast */}
          {downloadSuccess && (
            <Animated.View entering={FadeInDown.duration(300)} style={styles.successBanner}>
              <CheckCircle2 size={16} color="#10B981" style={{ marginRight: 8 }} />
              <Text style={styles.successText}>{downloadSuccess}</Text>
            </Animated.View>
          )}

          {/* Error Banner */}
          {errorMessage && (
            <Animated.View entering={FadeInDown.duration(300)} style={styles.errorBanner}>
              <AlertCircle size={16} color="#EF4444" style={{ marginRight: 8 }} />
              <Text style={styles.errorText}>{errorMessage}</Text>
            </Animated.View>
          )}

          {/* If no candidates exist in store */}
          {sortedCandidates.length === 0 ? (
            <Animated.View entering={FadeIn.duration(400)} style={styles.emptyContainer}>
              <View style={styles.emptyIconCircle}>
                <FileText size={40} color="#8B5CF6" />
              </View>
              <Text style={styles.emptyTitle}>No Batch Data to Report</Text>
              <Text style={styles.emptySubtitle}>
                Upload and analyze a batch of resumes to unlock automated score
                summaries, distribution charts, and PDF exports.
              </Text>
              <TouchableOpacity
                style={styles.primaryCtaBtn}
                activeOpacity={0.85}
                onPress={() => navigation.navigate('Candidates')}
              >
                <Users size={18} color="#FFFFFF" style={{ marginRight: 8 }} />
                <Text style={styles.primaryCtaBtnText}>Go to Candidate List</Text>
              </TouchableOpacity>
            </Animated.View>
          ) : (
            <>
              {/* Executive Report Summary Header Card */}
              <Animated.View entering={FadeInDown.duration(500)} style={styles.headerCard}>
                <View style={styles.reportBadge}>
                  <Award size={14} color="#C084FC" style={{ marginRight: 6 }} />
                  <Text style={styles.reportBadgeText}>Official PDF Screening Report</Text>
                </View>

                <Text style={styles.reportTitle}>Batch Executive Summary</Text>
                <Text style={styles.reportSubtitle} numberOfLines={2}>
                  Target Role:{' '}
                  <Text style={{ color: '#FFFFFF', fontWeight: '700' }}>
                    {jobDescription || 'General Candidate Screening'}
                  </Text>
                </Text>

                {effectiveBatchId && (
                  <View style={styles.batchMetaRow}>
                    <Briefcase size={12} color="#9CA3AF" style={{ marginRight: 4 }} />
                    <Text style={styles.batchMetaText}>
                      Batch ID: <Text style={{ color: '#C4B5FD' }}>{effectiveBatchId}</Text>
                    </Text>
                  </View>
                )}

                {/* Quick Metrics 3-Col Row */}
                <View style={styles.metricsRow}>
                  <View style={styles.metricItem}>
                    <Text style={styles.metricNumber}>{stats.total}</Text>
                    <Text style={styles.metricLabel}>Total Ranked</Text>
                  </View>
                  <View style={styles.metricDivider} />
                  <View style={styles.metricItem}>
                    <Text style={styles.metricNumber}>{stats.avg}%</Text>
                    <Text style={styles.metricLabel}>Average Match</Text>
                  </View>
                  <View style={styles.metricDivider} />
                  <View style={styles.metricItem}>
                    <Text style={styles.metricNumber}>{stats.high}%</Text>
                    <Text style={styles.metricLabel}>Top Score</Text>
                  </View>
                </View>
              </Animated.View>

              {/* Score Tier Distribution Cards */}
              <Animated.View entering={FadeInDown.delay(150).duration(500)} style={styles.sectionWrapper}>
                <View style={styles.sectionHeaderRow}>
                  <TrendingUp size={16} color="#A78BFA" style={{ marginRight: 8 }} />
                  <Text style={styles.sectionTitle}>Match Score Breakdown</Text>
                </View>

                <View style={styles.tierGrid}>
                  <View style={styles.tierCard}>
                    <View style={[styles.tierDot, { backgroundColor: '#10B981' }]} />
                    <Text style={styles.tierNumber}>{stats.highCount}</Text>
                    <Text style={styles.tierLabel}>High Match (≥70%)</Text>
                  </View>

                  <View style={styles.tierCard}>
                    <View style={[styles.tierDot, { backgroundColor: '#F59E0B' }]} />
                    <Text style={styles.tierNumber}>{stats.moderateCount}</Text>
                    <Text style={styles.tierLabel}>Moderate (40-69%)</Text>
                  </View>

                  <View style={styles.tierCard}>
                    <View style={[styles.tierDot, { backgroundColor: '#9CA3AF' }]} />
                    <Text style={styles.tierNumber}>{stats.lowCount}</Text>
                    <Text style={styles.tierLabel}>Low Match (&lt;40%)</Text>
                  </View>
                </View>
              </Animated.View>

              {/* Candidate Roster Preview */}
              <Animated.View entering={FadeInDown.delay(250).duration(500)} style={styles.sectionWrapper}>
                <View style={styles.sectionHeaderRow}>
                  <Users size={16} color="#A78BFA" style={{ marginRight: 8 }} />
                  <Text style={styles.sectionTitle}>
                    Ranked Candidates Roster ({stats.total})
                  </Text>
                </View>

                <View style={styles.candidateListCard}>
                  {sortedCandidates.slice(0, 5).map((candidate, idx) => {
                    const displayName =
                      candidate.candidate_name ||
                      candidate.name ||
                      (candidate.file_name
                        ? candidate.file_name.replace(/\.pdf$/i, '')
                        : `Candidate #${idx + 1}`);
                    const score = Math.round(candidate.match_score || 0);
                    const badge = getScoreBadge(score);
                    const email =
                      candidate.extracted_email || candidate.email || 'No email';

                    return (
                      <View
                        key={candidate.candidate_id || candidate.id || idx}
                        style={[
                          styles.candidateRow,
                          idx !== 4 &&
                            idx !== sortedCandidates.length - 1 &&
                            styles.candidateRowDivider,
                        ]}
                      >
                        <View style={styles.rankBadge}>
                          <Text style={styles.rankText}>#{idx + 1}</Text>
                        </View>

                        <View style={styles.candidateInfoCol}>
                          <Text style={styles.candidateName} numberOfLines={1}>
                            {displayName}
                          </Text>
                          <Text style={styles.candidateEmail} numberOfLines={1}>
                            {email}
                          </Text>
                        </View>

                        <View
                          style={[
                            styles.scoreBadge,
                            {
                              backgroundColor: badge.bg,
                              borderColor: badge.border,
                            },
                          ]}
                        >
                          <Sparkles
                            size={11}
                            color={badge.text}
                            style={{ marginRight: 4 }}
                          />
                          <Text
                            style={[
                              styles.scoreBadgeText,
                              { color: badge.text },
                            ]}
                          >
                            {score}%
                          </Text>
                        </View>
                      </View>
                    );
                  })}

                  {sortedCandidates.length > 5 && (
                    <View style={styles.moreCandidatesFooter}>
                      <Text style={styles.moreCandidatesText}>
                        + {sortedCandidates.length - 5} more candidate
                        {sortedCandidates.length - 5 === 1 ? '' : 's'} included
                        in the full PDF export
                      </Text>
                    </View>
                  )}
                </View>
              </Animated.View>

              {/* PDF Guarantee Info */}
              <Animated.View entering={FadeInDown.delay(350).duration(500)} style={styles.securityCard}>
                <ShieldCheck size={20} color="#10B981" style={{ marginRight: 12 }} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.securityTitle}>
                    ReportLab PDF Engine & Vector Accuracy
                  </Text>
                  <Text style={styles.securitySubtext}>
                    Generated using ReportLab charts and MongoDB batch records.
                    Includes full candidate scores, metadata, and parsing yield.
                  </Text>
                </View>
              </Animated.View>

              {/* Download Action CTAs */}
              <Animated.View entering={FadeInUp.delay(400).duration(500)} style={styles.actionSection}>
                <TouchableOpacity
                  style={[
                    styles.downloadBtn,
                    isDownloading && styles.downloadBtnDisabled,
                  ]}
                  activeOpacity={0.85}
                  onPress={handleDownloadPdf}
                  disabled={isDownloading}
                >
                  {isDownloading ? (
                    <>
                      <ActivityIndicator
                        size="small"
                        color="#FFFFFF"
                        style={{ marginRight: 8 }}
                      />
                      <Text style={styles.downloadBtnText}>
                        Generating PDF Report...
                      </Text>
                    </>
                  ) : (
                    <>
                      <Download
                        size={18}
                        color="#FFFFFF"
                        style={{ marginRight: 8 }}
                      />
                      <Text style={styles.downloadBtnText}>
                        Download PDF Report
                      </Text>
                    </>
                  )}
                </TouchableOpacity>
              </Animated.View>
            </>
          )}
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
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 40,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.06)',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(15, 20, 36, 0.75)',
    borderWidth: 1,
    borderColor: 'rgba(99, 102, 241, 0.25)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleWrap: {
    alignItems: 'center',
    flex: 1,
  },
  topBarTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.3,
  },
  topBarSubtitle: {
    fontSize: 12,
    color: '#9CA3AF',
    fontWeight: '500',
    marginTop: 2,
  },
  successBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    borderColor: 'rgba(16, 185, 129, 0.35)',
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: 14,
  },
  successText: {
    fontSize: 13,
    color: '#34D399',
    fontWeight: '600',
    flex: 1,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    borderColor: 'rgba(239, 68, 68, 0.35)',
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: 14,
  },
  errorText: {
    fontSize: 13,
    color: '#FCA5A5',
    fontWeight: '600',
    flex: 1,
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
    borderWidth: 1,
    borderColor: 'rgba(167, 139, 250, 0.3)',
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
    marginBottom: 10,
  },
  batchMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  batchMetaText: {
    fontSize: 12,
    color: '#9CA3AF',
    fontWeight: '500',
  },
  metricsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(10, 14, 26, 0.65)',
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
  },
  metricItem: {
    alignItems: 'center',
    flex: 1,
  },
  metricNumber: {
    fontSize: 20,
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
    height: 26,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  sectionWrapper: {
    marginBottom: 18,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  tierGrid: {
    flexDirection: 'row',
    gap: 8,
  },
  tierCard: {
    flex: 1,
    backgroundColor: 'rgba(15, 20, 36, 0.75)',
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(99, 102, 241, 0.2)',
    alignItems: 'center',
  },
  tierDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginBottom: 6,
  },
  tierNumber: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 2,
  },
  tierLabel: {
    fontSize: 10,
    color: '#9CA3AF',
    fontWeight: '500',
    textAlign: 'center',
  },
  candidateListCard: {
    backgroundColor: 'rgba(15, 20, 36, 0.75)',
    borderRadius: 20,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(99, 102, 241, 0.25)',
  },
  candidateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
  },
  candidateRowDivider: {
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.06)',
  },
  rankBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(167, 139, 250, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  rankText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#C084FC',
  },
  candidateInfoCol: {
    flex: 1,
    marginRight: 8,
  },
  candidateName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#F9FAFB',
    marginBottom: 2,
  },
  candidateEmail: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  scoreBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
  },
  scoreBadgeText: {
    fontSize: 12,
    fontWeight: '800',
  },
  moreCandidatesFooter: {
    paddingTop: 10,
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.06)',
    marginTop: 4,
  },
  moreCandidatesText: {
    fontSize: 11,
    color: '#A78BFA',
    fontWeight: '500',
  },
  securityCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(15, 20, 36, 0.65)',
    borderRadius: 16,
    padding: 14,
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
    fontSize: 11,
    color: '#9CA3AF',
    lineHeight: 15,
  },
  actionSection: {
    marginBottom: 10,
  },
  downloadBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#8B5CF6',
    borderRadius: 16,
    paddingVertical: 16,
    shadowColor: '#8B5CF6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 6,
  },
  downloadBtnDisabled: {
    opacity: 0.7,
  },
  downloadBtnText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  emptyContainer: {
    paddingVertical: 60,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  emptyIconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(139, 92, 246, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(139, 92, 246, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 18,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#9CA3AF',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  primaryCtaBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#8B5CF6',
    borderRadius: 14,
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  primaryCtaBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});

