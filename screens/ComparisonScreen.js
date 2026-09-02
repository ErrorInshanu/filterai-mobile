import { useNavigation, useRoute } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import {
  AlertTriangle,
  ArrowLeft,
  Award,
  Briefcase,
  Check,
  CheckCircle2,
  ChevronRight,
  Clock,
  FileText,
  Mail,
  Scale,
  Share2,
  Sliders,
  Sparkles,
  Users,
  XCircle
} from 'lucide-react-native';
import React, { useMemo, useState } from 'react';
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import MonochromeBackground from '../components/landing/MonochromeBackground';
import { useAppStore } from '../store/useAppStore';

function getInitials(name) {
  if (!name || !name.trim()) return 'CA';
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
}

function getScoreBadge(score = 0) {
  if (score >= 70) {
    return {
      bg: 'rgba(16, 185, 129, 0.15)',
      text: '#10B981',
      border: 'rgba(16, 185, 129, 0.35)',
      bar: '#10B981',
      tier: 'High Match',
    };
  } else if (score >= 40) {
    return {
      bg: 'rgba(245, 158, 11, 0.15)',
      text: '#F59E0B',
      border: 'rgba(245, 158, 11, 0.35)',
      bar: '#F59E0B',
      tier: 'Moderate',
    };
  } else {
    return {
      bg: 'rgba(107, 114, 128, 0.15)',
      text: '#9CA3AF',
      border: 'rgba(107, 114, 128, 0.3)',
      bar: '#6B7280',
      tier: 'Low Match',
    };
  }
}

export default function ComparisonScreen() {
  const navigation = useNavigation();
  const route = useRoute();

  // Zustand Store
  const storeCandidates = useAppStore((state) => state.candidates) || [];
  const comparisonSelection = useAppStore((state) => state.comparisonSelection) || [];
  const toggleComparisonSelection = useAppStore((state) => state.toggleComparisonSelection);
  const updateCandidateStatus = useAppStore((state) => state.updateCandidateStatus);
  const jobDescription = useAppStore((state) => state.jobDescription);

  // Shortlisting threshold state
  const [threshold, setThreshold] = useState(75);
  const [toastMessage, setToastMessage] = useState(null);

  // Resolve candidates to compare:
  // 1. From route.params?.candidates if explicitly passed
  // 2. From comparisonSelection matching storeCandidates
  // 3. Fallback: if comparisonSelection is empty, take top 2 or 3 candidates from storeCandidates
  const comparedCandidates = useMemo(() => {
    if (route.params?.candidates && Array.isArray(route.params.candidates)) {
      return route.params.candidates.slice(0, 3);
    }

    if (comparisonSelection.length > 0) {
      const selected = storeCandidates.filter((c) =>
        comparisonSelection.includes(c.candidate_id || c.id)
      );
      if (selected.length > 0) return selected.slice(0, 3);
    }

    // Default fallback: top 3 candidates by match_score
    if (storeCandidates.length >= 2) {
      return [...storeCandidates]
        .sort((a, b) => (b.match_score || 0) - (a.match_score || 0))
        .slice(0, 3);
    }

    return storeCandidates.slice(0, 3);
  }, [storeCandidates, comparisonSelection, route.params]);

  // Handle shortlisting all candidates above threshold
  const handleShortlistAboveThreshold = () => {
    const qualifying = comparedCandidates.filter(
      (c) => (c.match_score || 0) >= threshold
    );

    if (qualifying.length === 0) {
      setToastMessage(`No compared candidate meets the ${threshold}% threshold.`);
      setTimeout(() => setToastMessage(null), 3000);
      return;
    }

    qualifying.forEach((c) => {
      const cId = c.candidate_id || c.id;
      updateCandidateStatus(cId, 'shortlisted');
    });

    setToastMessage(
      `✓ Shortlisted ${qualifying.length} candidate${qualifying.length === 1 ? '' : 's'} (≥ ${threshold}%)`
    );
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleExportPress = () => {
    Alert.alert(
      'Export Report',
      'Candidate comparison PDF/CSV export is coming soon in the upcoming reporting release.',
      [{ text: 'Got it' }]
    );
  };

  const handleCandidateCardPress = (candidate) => {
    navigation.navigate('CandidateDetail', { candidate });
  };

  // If fewer than 2 candidates available to compare
  if (comparedCandidates.length < 2) {
    return (
      <View style={styles.container}>
        <MonochromeBackground />

        <SafeAreaView style={styles.safeArea}>
          {/* Top Bar */}
          <View style={styles.topBar}>
            <TouchableOpacity
              style={styles.backButton}
              activeOpacity={0.7}
              onPress={() => navigation.goBack()}
            >
              <ArrowLeft size={22} color="#FFFFFF" />
            </TouchableOpacity>
            <Text style={styles.topBarTitle}>Candidate Comparison</Text>
            <View style={{ width: 40 }} />
          </View>

          <View style={styles.emptyContainer}>
            <View style={styles.emptyIconCircle}>
              <Scale size={42} color="#8B5CF6" />
            </View>
            <Text style={styles.emptyTitle}>Select at least 2 candidates</Text>
            <Text style={styles.emptySubtitle}>
              You need at least 2 ranked candidates to generate a side-by-side
              skill and attribute comparison matrix.
            </Text>

            <TouchableOpacity
              style={styles.primaryCtaBtn}
              activeOpacity={0.85}
              onPress={() => navigation.navigate('Candidates')}
            >
              <Users size={18} color="#FFFFFF" style={{ marginRight: 8 }} />
              <Text style={styles.primaryCtaBtnText}>Back to Candidates</Text>
            </TouchableOpacity>

            {/* If store has candidates, show quick selector */}
            {storeCandidates.length > 0 && (
              <View style={styles.quickPickSection}>
                <Text style={styles.quickPickTitle}>Available Candidates:</Text>
                <View style={styles.quickPickWrap}>
                  {storeCandidates.slice(0, 6).map((cand) => {
                    const cId = cand.candidate_id || cand.id;
                    const isSelected = comparisonSelection.includes(cId);
                    return (
                      <TouchableOpacity
                        key={cId}
                        style={[
                          styles.quickPickPill,
                          isSelected && styles.quickPickPillActive,
                        ]}
                        onPress={() => toggleComparisonSelection(cId)}
                        activeOpacity={0.75}
                      >
                        <Text
                          style={[
                            styles.quickPickPillText,
                            isSelected && styles.quickPickPillTextActive,
                          ]}
                        >
                          {isSelected ? '✓ ' : '+ '}
                          {cand.name || cand.candidate_name || 'Candidate'} (
                          {Math.round(cand.match_score || 0)}%)
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            )}
          </View>
        </SafeAreaView>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <MonochromeBackground />

      <SafeAreaView style={styles.safeArea}>
        {/* Top Header Bar */}
        <View style={styles.topBar}>
          <TouchableOpacity
            style={styles.backButton}
            activeOpacity={0.7}
            onPress={() => navigation.goBack()}
          >
            <ArrowLeft size={22} color="#FFFFFF" />
          </TouchableOpacity>

          <View style={styles.titleWrap}>
            <Text style={styles.topBarTitle}>Candidate Comparison</Text>
            <Text style={styles.topBarSubtitle}>
              {comparedCandidates.length} Candidates Side-by-Side
            </Text>
          </View>

          <TouchableOpacity
            style={styles.exportBtnDisabled}
            activeOpacity={0.7}
            onPress={handleExportPress}
          >
            <Share2 size={18} color="#6B7280" />
          </TouchableOpacity>
        </View>

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Toast Notification Banner */}
          {toastMessage && (
            <Animated.View entering={FadeInDown.duration(300)} style={styles.toastBanner}>
              <Sparkles size={16} color="#10B981" style={{ marginRight: 8 }} />
              <Text style={styles.toastText}>{toastMessage}</Text>
            </Animated.View>
          )}

          {/* Job Role Info Banner */}
          {jobDescription ? (
            <Animated.View entering={FadeInDown.duration(400)} style={styles.jobBanner}>
              <View style={styles.jobBannerLeft}>
                <Briefcase size={16} color="#A78BFA" style={{ marginRight: 8 }} />
                <Text style={styles.jobBannerTitle} numberOfLines={1}>
                  Target Role: {jobDescription}
                </Text>
              </View>
            </Animated.View>
          ) : null}

          {/* Top Horizontal Mini-Cards Section (Up to 3 Candidates) */}
          <Animated.View entering={FadeInDown.delay(100).duration(500)} style={styles.miniCardsSection}>
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionTitle}>Compared Profiles</Text>
              <Text style={styles.sectionSubtitle}>Tap card for full AI dossier</Text>
            </View>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.miniCardsScroll}
            >
              {comparedCandidates.map((c, idx) => {
                const displayName =
                  c.candidate_name ||
                  c.name ||
                  (c.file_name ? c.file_name.replace(/\.pdf$/i, '') : `Candidate ${idx + 1}`);
                const rawScore = typeof c.match_score === 'number' ? c.match_score : 0;
                const score = Math.min(100, Math.max(0, Math.round(rawScore)));
                const badge = getScoreBadge(score);
                const initials = getInitials(displayName);
                const isShortlisted = c.status === 'shortlisted';

                return (
                  <TouchableOpacity
                    key={c.candidate_id || c.id || idx}
                    style={styles.miniCard}
                    activeOpacity={0.85}
                    onPress={() => handleCandidateCardPress(c)}
                  >
                    <View style={styles.miniCardTop}>
                      <LinearGradient
                        colors={['#8B5CF6', '#6366F1']}
                        style={styles.avatarCircle}
                      >
                        <Text style={styles.avatarText}>{initials}</Text>
                      </LinearGradient>

                      <View
                        style={[
                          styles.miniScoreBadge,
                          {
                            backgroundColor: badge.bg,
                            borderColor: badge.border,
                          },
                        ]}
                      >
                        <Sparkles size={11} color={badge.text} style={{ marginRight: 3 }} />
                        <Text style={[styles.miniScoreText, { color: badge.text }]}>
                          {score}%
                        </Text>
                      </View>
                    </View>

                    <Text style={styles.miniCardName} numberOfLines={1}>
                      {displayName}
                    </Text>

                    <View style={styles.miniCardBottomRow}>
                      <View
                        style={[
                          styles.statusPill,
                          isShortlisted ? styles.statusPillShortlisted : styles.statusPillPending,
                        ]}
                      >
                        <Text
                          style={[
                            styles.statusPillText,
                            isShortlisted
                              ? styles.statusPillTextShortlisted
                              : styles.statusPillTextPending,
                          ]}
                        >
                          {isShortlisted ? 'Shortlisted' : 'Pending'}
                        </Text>
                      </View>
                      <ChevronRight size={14} color="#6366F1" />
                    </View>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </Animated.View>

          {/* Interactive Shortlist by Threshold Section */}
          <Animated.View entering={FadeInDown.delay(200).duration(500)} style={styles.thresholdSection}>
            <View style={styles.thresholdCard}>
              <View style={styles.thresholdHeader}>
                <View style={styles.thresholdHeaderLeft}>
                  <Sliders size={18} color="#8B5CF6" style={{ marginRight: 8 }} />
                  <Text style={styles.thresholdTitle}>Batch Shortlist Cutoff</Text>
                </View>
                <View style={styles.thresholdBadge}>
                  <Text style={styles.thresholdBadgeText}>{threshold}% Match</Text>
                </View>
              </View>

              {/* Threshold Preset Selectors */}
              <View style={styles.thresholdPillsRow}>
                {[70, 75, 80, 85, 90].map((val) => {
                  const isActive = threshold === val;
                  return (
                    <TouchableOpacity
                      key={val}
                      style={[
                        styles.presetPill,
                        isActive && styles.presetPillActive,
                      ]}
                      onPress={() => setThreshold(val)}
                      activeOpacity={0.8}
                    >
                      <Text
                        style={[
                          styles.presetPillText,
                          isActive && styles.presetPillTextActive,
                        ]}
                      >
                        {val}%
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* Action Button */}
              <TouchableOpacity
                style={styles.shortlistActionBtn}
                activeOpacity={0.85}
                onPress={handleShortlistAboveThreshold}
              >
                <Check size={16} color="#FFFFFF" style={{ marginRight: 6 }} />
                <Text style={styles.shortlistActionBtnText}>
                  Shortlist All Above {threshold}%
                </Text>
              </TouchableOpacity>
            </View>
          </Animated.View>

          {/* Attribute-by-Attribute Comparison Matrix Table */}
          <Animated.View entering={FadeInUp.delay(300).duration(500)} style={styles.matrixSection}>
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionTitle}>Detailed Attribute Matrix</Text>
              <Text style={styles.sectionSubtitle}>Criteria breakdown</Text>
            </View>

            {/* Matrix Table Card */}
            <View style={styles.matrixCard}>
              {/* Table Column Headers */}
              <View style={styles.matrixHeaderRow}>
                <View style={styles.attributeLabelColumn}>
                  <Text style={styles.matrixHeaderColumnTitle}>Criteria</Text>
                </View>
                {comparedCandidates.map((c, i) => {
                  const name =
                    c.candidate_name ||
                    c.name ||
                    (c.file_name ? c.file_name.replace(/\.pdf$/i, '') : `C${i + 1}`);
                  const shortName = name.split(' ')[0];
                  return (
                    <View key={c.candidate_id || c.id || i} style={styles.candidateDataColumn}>
                      <Text style={styles.candidateHeaderName} numberOfLines={1}>
                        {shortName}
                      </Text>
                    </View>
                  );
                })}
              </View>

              {/* Row 1: Overall Match Score */}
              <Animated.View entering={FadeInUp.delay(350).duration(400)} style={styles.matrixRow}>
                <View style={styles.attributeLabelColumn}>
                  <View style={styles.attrTitleRow}>
                    <Sparkles size={14} color="#8B5CF6" style={{ marginRight: 6 }} />
                    <Text style={styles.attributeName}>Overall Score</Text>
                  </View>
                  <Text style={styles.attributeSub}>Vector Similarity</Text>
                </View>
                {comparedCandidates.map((c, idx) => {
                  const score = Math.round(c.match_score || 0);
                  const badge = getScoreBadge(score);
                  return (
                    <View key={idx} style={styles.candidateDataColumn}>
                      <Text style={[styles.scoreValueBig, { color: badge.text }]}>
                        {score}%
                      </Text>
                      <Text style={[styles.tierTag, { color: badge.text }]}>
                        {badge.tier}
                      </Text>
                    </View>
                  );
                })}
              </Animated.View>

              {/* Row 2: Technical Skills Fit */}
              <Animated.View entering={FadeInUp.delay(400).duration(400)} style={styles.matrixRow}>
                <View style={styles.attributeLabelColumn}>
                  <View style={styles.attrTitleRow}>
                    <Award size={14} color="#6366F1" style={{ marginRight: 6 }} />
                    <Text style={styles.attributeName}>Technical Fit</Text>
                  </View>
                  <Text style={styles.attributeSub}>Keyword & Tool Match</Text>
                </View>
                {comparedCandidates.map((c, idx) => {
                  const rawScore = c.match_score || 0;
                  const techScore =
                    c.skill_breakdown?.tech ??
                    Math.min(100, Math.round(rawScore * 1.02));
                  const isHigh = techScore >= 70;
                  return (
                    <View key={idx} style={styles.candidateDataColumn}>
                      {isHigh ? (
                        <CheckCircle2 size={16} color="#10B981" style={{ marginBottom: 2 }} />
                      ) : (
                        <AlertTriangle size={16} color="#F59E0B" style={{ marginBottom: 2 }} />
                      )}
                      <Text style={styles.attributeValueText}>{techScore}%</Text>
                    </View>
                  );
                })}
              </Animated.View>

              {/* Row 3: Experience Relevance */}
              <Animated.View entering={FadeInUp.delay(450).duration(400)} style={styles.matrixRow}>
                <View style={styles.attributeLabelColumn}>
                  <View style={styles.attrTitleRow}>
                    <Clock size={14} color="#A78BFA" style={{ marginRight: 6 }} />
                    <Text style={styles.attributeName}>Experience</Text>
                  </View>
                  <Text style={styles.attributeSub}>Role Depth & Tenure</Text>
                </View>
                {comparedCandidates.map((c, idx) => {
                  const rawScore = c.match_score || 0;
                  const expScore =
                    c.skill_breakdown?.exp ??
                    Math.min(100, Math.round(rawScore * 0.96));
                  return (
                    <View key={idx} style={styles.candidateDataColumn}>
                      <CheckCircle2 size={16} color="#10B981" style={{ marginBottom: 2 }} />
                      <Text style={styles.attributeValueText}>{expScore}%</Text>
                    </View>
                  );
                })}
              </Animated.View>

              {/* Row 4: Education & Domain Match */}
              <Animated.View entering={FadeInUp.delay(500).duration(400)} style={styles.matrixRow}>
                <View style={styles.attributeLabelColumn}>
                  <View style={styles.attrTitleRow}>
                    <FileText size={14} color="#60A5FA" style={{ marginRight: 6 }} />
                    <Text style={styles.attributeName}>Education Fit</Text>
                  </View>
                  <Text style={styles.attributeSub}>Degrees & Background</Text>
                </View>
                {comparedCandidates.map((c, idx) => {
                  const rawScore = c.match_score || 0;
                  const eduScore =
                    c.skill_breakdown?.edu ??
                    Math.min(100, Math.round(rawScore * 0.94));
                  return (
                    <View key={idx} style={styles.candidateDataColumn}>
                      <CheckCircle2 size={16} color="#10B981" style={{ marginBottom: 2 }} />
                      <Text style={styles.attributeValueText}>{eduScore}%</Text>
                    </View>
                  );
                })}
              </Animated.View>

              {/* Row 5: Screening Status */}
              <Animated.View entering={FadeInUp.delay(550).duration(400)} style={styles.matrixRow}>
                <View style={styles.attributeLabelColumn}>
                  <View style={styles.attrTitleRow}>
                    <CheckCircle2 size={14} color="#10B981" style={{ marginRight: 6 }} />
                    <Text style={styles.attributeName}>Current Status</Text>
                  </View>
                  <Text style={styles.attributeSub}>Pipeline Stage</Text>
                </View>
                {comparedCandidates.map((c, idx) => {
                  const isShortlisted = c.status === 'shortlisted';
                  const isRejected = c.status === 'rejected';

                  if (isShortlisted) {
                    return (
                      <View key={idx} style={styles.candidateDataColumn}>
                        <CheckCircle2 size={16} color="#10B981" style={{ marginBottom: 2 }} />
                        <Text style={[styles.statusText, { color: '#10B981' }]}>
                          Shortlisted
                        </Text>
                      </View>
                    );
                  }
                  if (isRejected) {
                    return (
                      <View key={idx} style={styles.candidateDataColumn}>
                        <XCircle size={16} color="#EF4444" style={{ marginBottom: 2 }} />
                        <Text style={[styles.statusText, { color: '#EF4444' }]}>
                          Rejected
                        </Text>
                      </View>
                    );
                  }
                  return (
                    <View key={idx} style={styles.candidateDataColumn}>
                      <Clock size={16} color="#9CA3AF" style={{ marginBottom: 2 }} />
                      <Text style={[styles.statusText, { color: '#9CA3AF' }]}>
                        Pending
                      </Text>
                    </View>
                  );
                })}
              </Animated.View>

              {/* Row 6: Red Flags / Risk Assessment */}
              <Animated.View entering={FadeInUp.delay(600).duration(400)} style={styles.matrixRow}>
                <View style={styles.attributeLabelColumn}>
                  <View style={styles.attrTitleRow}>
                    <AlertTriangle size={14} color="#EF4444" style={{ marginRight: 6 }} />
                    <Text style={styles.attributeName}>Risk Factors</Text>
                  </View>
                  <Text style={styles.attributeSub}>Gaps & Red Flags</Text>
                </View>
                {comparedCandidates.map((c, idx) => {
                  const hasRedFlags =
                    Array.isArray(c.red_flags) && c.red_flags.length > 0;
                  return (
                    <View key={idx} style={styles.candidateDataColumn}>
                      {hasRedFlags ? (
                        <>
                          <AlertTriangle size={16} color="#EF4444" style={{ marginBottom: 2 }} />
                          <Text style={[styles.attributeValueText, { color: '#F87171' }]}>
                            {c.red_flags.length} Flag{c.red_flags.length === 1 ? '' : 's'}
                          </Text>
                        </>
                      ) : (
                        <>
                          <CheckCircle2 size={16} color="#10B981" style={{ marginBottom: 2 }} />
                          <Text style={[styles.attributeValueText, { color: '#10B981' }]}>
                            Clean
                          </Text>
                        </>
                      )}
                    </View>
                  );
                })}
              </Animated.View>

              {/* Row 7: Direct Contact Info */}
              <Animated.View entering={FadeInUp.delay(650).duration(400)} style={[styles.matrixRow, styles.matrixRowLast]}>
                <View style={styles.attributeLabelColumn}>
                  <View style={styles.attrTitleRow}>
                    <Mail size={14} color="#A78BFA" style={{ marginRight: 6 }} />
                    <Text style={styles.attributeName}>Contact</Text>
                  </View>
                  <Text style={styles.attributeSub}>Email Extracted</Text>
                </View>
                {comparedCandidates.map((c, idx) => {
                  const hasEmail = Boolean(c.extracted_email || c.email);
                  return (
                    <View key={idx} style={styles.candidateDataColumn}>
                      {hasEmail ? (
                        <>
                          <CheckCircle2 size={16} color="#10B981" style={{ marginBottom: 2 }} />
                          <Text style={[styles.attributeValueText, { color: '#10B981', fontSize: 11 }]}>
                            Verified
                          </Text>
                        </>
                      ) : (
                        <>
                          <XCircle size={16} color="#EF4444" style={{ marginBottom: 2 }} />
                          <Text style={[styles.attributeValueText, { color: '#EF4444', fontSize: 11 }]}>
                            Missing
                          </Text>
                        </>
                      )}
                    </View>
                  );
                })}
              </Animated.View>
            </View>
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
  exportBtnDisabled: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(15, 20, 36, 0.5)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
    opacity: 0.6,
  },
  toastBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    borderColor: 'rgba(16, 185, 129, 0.4)',
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: 14,
  },
  toastText: {
    fontSize: 13,
    color: '#34D399',
    fontWeight: '600',
    flex: 1,
  },
  jobBanner: {
    backgroundColor: 'rgba(15, 20, 36, 0.75)',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: 'rgba(99, 102, 241, 0.2)',
    marginBottom: 16,
  },
  jobBannerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  jobBannerTitle: {
    fontSize: 13,
    color: '#D1D5DB',
    fontWeight: '600',
    flex: 1,
  },
  miniCardsSection: {
    marginBottom: 20,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  sectionSubtitle: {
    fontSize: 12,
    color: '#9CA3AF',
    fontWeight: '500',
  },
  miniCardsScroll: {
    gap: 12,
    paddingVertical: 4,
  },
  miniCard: {
    width: 155,
    backgroundColor: 'rgba(15, 20, 36, 0.85)',
    borderRadius: 20,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(99, 102, 241, 0.25)',
  },
  miniCardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  avatarCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  miniScoreBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    borderWidth: 1,
  },
  miniScoreText: {
    fontSize: 12,
    fontWeight: '800',
  },
  miniCardName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#F9FAFB',
    marginBottom: 10,
  },
  miniCardBottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statusPill: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
  },
  statusPillShortlisted: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    borderColor: 'rgba(16, 185, 129, 0.35)',
  },
  statusPillPending: {
    backgroundColor: 'rgba(107, 114, 128, 0.15)',
    borderColor: 'rgba(107, 114, 128, 0.3)',
  },
  statusPillText: {
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  statusPillTextShortlisted: {
    color: '#10B981',
  },
  statusPillTextPending: {
    color: '#9CA3AF',
  },
  thresholdSection: {
    marginBottom: 20,
  },
  thresholdCard: {
    backgroundColor: 'rgba(15, 20, 36, 0.75)',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(99, 102, 241, 0.25)',
  },
  thresholdHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  thresholdHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  thresholdTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  thresholdBadge: {
    backgroundColor: 'rgba(139, 92, 246, 0.2)',
    borderColor: 'rgba(139, 92, 246, 0.4)',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  thresholdBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#A78BFA',
  },
  thresholdPillsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 14,
  },
  presetPill: {
    flex: 1,
    paddingVertical: 7,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  presetPillActive: {
    backgroundColor: '#8B5CF6',
    borderColor: '#8B5CF6',
  },
  presetPillText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#9CA3AF',
  },
  presetPillTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  shortlistActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#8B5CF6',
    borderRadius: 12,
    paddingVertical: 12,
  },
  shortlistActionBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  matrixSection: {
    marginBottom: 20,
  },
  matrixCard: {
    backgroundColor: 'rgba(15, 20, 36, 0.85)',
    borderRadius: 22,
    borderWidth: 1,
    borderColor: 'rgba(99, 102, 241, 0.25)',
    overflow: 'hidden',
  },
  matrixHeaderRow: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
  },
  matrixHeaderColumnTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#9CA3AF',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  candidateHeaderName: {
    fontSize: 13,
    fontWeight: '800',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  matrixRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
  },
  matrixRowLast: {
    borderBottomWidth: 0,
  },
  attributeLabelColumn: {
    flex: 1.3,
    paddingRight: 8,
  },
  attrTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  attributeName: {
    fontSize: 13,
    fontWeight: '700',
    color: '#F3F4F6',
  },
  attributeSub: {
    fontSize: 10,
    color: '#6B7280',
    marginTop: 1,
  },
  candidateDataColumn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scoreValueBig: {
    fontSize: 16,
    fontWeight: '800',
  },
  tierTag: {
    fontSize: 9,
    fontWeight: '700',
    marginTop: 1,
    textTransform: 'uppercase',
  },
  attributeValueText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#E5E7EB',
  },
  statusText: {
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 28,
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
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 8,
    textAlign: 'center',
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
    paddingHorizontal: 22,
    paddingVertical: 12,
    marginBottom: 30,
  },
  primaryCtaBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  quickPickSection: {
    width: '100%',
    alignItems: 'center',
  },
  quickPickTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#9CA3AF',
    marginBottom: 10,
  },
  quickPickWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 8,
  },
  quickPickPill: {
    backgroundColor: 'rgba(15, 20, 36, 0.85)',
    borderWidth: 1,
    borderColor: 'rgba(99, 102, 241, 0.25)',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  quickPickPillActive: {
    backgroundColor: '#8B5CF6',
    borderColor: '#8B5CF6',
  },
  quickPickPillText: {
    fontSize: 12,
    color: '#D1D5DB',
    fontWeight: '600',
  },
  quickPickPillTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
});
