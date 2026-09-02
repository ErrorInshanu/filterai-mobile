import React, { useState, useEffect, useCallback } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  useWindowDimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import Svg, {
  Path,
  Circle,
  Defs,
  LinearGradient as SvgGradient,
  Stop,
  Line,
} from 'react-native-svg';
import {
  FileText,
  Sparkles,
  CheckCircle2,
  XCircle,
  TrendingUp,
  RotateCw,
  Plus,
  ArrowRight,
  AlertCircle,
  Briefcase,
  Users,
  Clock,
  Layers,
} from 'lucide-react-native';

import MonochromeBackground from '../components/landing/MonochromeBackground';
import { API_URL } from '../constants/api';
import { useAppStore } from '../store/useAppStore';

function formatActivityDate(isoString) {
  if (!isoString) return '';
  try {
    const date = new Date(isoString);
    if (isNaN(date.getTime())) return isoString;

    const now = new Date();
    const isToday =
      date.getDate() === now.getDate() &&
      date.getMonth() === now.getMonth() &&
      date.getFullYear() === now.getFullYear();

    const yesterday = new Date();
    yesterday.setDate(now.getDate() - 1);
    const isYesterday =
      date.getDate() === yesterday.getDate() &&
      date.getMonth() === yesterday.getMonth() &&
      date.getFullYear() === yesterday.getFullYear();

    const timeString = date.toLocaleTimeString([], {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });

    if (isToday) return `Today, ${timeString}`;
    if (isYesterday) return `Yesterday, ${timeString}`;

    const monthNames = [
      'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
      'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
    ];
    const month = monthNames[date.getMonth()];
    const day = date.getDate();
    const year = date.getFullYear();

    return `${month} ${day}, ${year} · ${timeString}`;
  } catch {
    return isoString;
  }
}

/**
 * Minimal custom SVG Sparkline Chart for Match Score Trend
 */
function SparklineChart({ data, width }) {
  const chartHeight = 110;
  const paddingH = 24;
  const paddingV = 20;

  if (!data || data.length === 0) {
    return (
      <View style={styles.chartEmptyContainer}>
        <TrendingUp size={24} color="#6B7280" style={{ marginBottom: 6 }} />
        <Text style={styles.chartEmptyText}>
          No match trend data available yet.
        </Text>
      </View>
    );
  }

  const scores = data.map((d) => d.average_score);
  const minScore = Math.max(0, Math.min(...scores) - 5);
  const maxScore = Math.min(100, Math.max(...scores) + 5);
  const range = maxScore - minScore || 10;

  const points = data.map((item, idx) => {
    const x =
      data.length === 1
        ? width / 2
        : paddingH +
          (idx / (data.length - 1)) * (width - paddingH * 2);
    const y =
      paddingV +
      (1 - (item.average_score - minScore) / range) *
        (chartHeight - paddingV * 2);
    return { ...item, x, y };
  });

  if (data.length === 1) {
    const p = points[0];
    return (
      <View style={styles.chartWrapper}>
        <Svg width={width} height={chartHeight}>
          <Defs>
            <SvgGradient id="singlePointGrad" x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0%" stopColor="#8B5CF6" stopOpacity="0.4" />
              <Stop offset="100%" stopColor="#8B5CF6" stopOpacity="0.0" />
            </SvgGradient>
          </Defs>
          <Line
            x1={paddingH}
            y1={p.y}
            x2={width - paddingH}
            y2={p.y}
            stroke="rgba(139, 92, 246, 0.3)"
            strokeWidth="1.5"
            strokeDasharray="4, 4"
          />
          <Circle
            cx={p.x}
            cy={p.y}
            r={6}
            fill="#8B5CF6"
            stroke="#FFFFFF"
            strokeWidth="2"
          />
        </Svg>
        <View style={styles.trendPointsLabels}>
          <Text style={styles.singlePointLabel}>
            {p.job_description || 'Batch 1'}: {p.average_score}%
          </Text>
        </View>
      </View>
    );
  }

  let linePath = `M ${points[0].x} ${points[0].y}`;
  for (let i = 1; i < points.length; i++) {
    linePath += ` L ${points[i].x} ${points[i].y}`;
  }

  const areaPath = `${linePath} L ${points[points.length - 1].x} ${chartHeight} L ${points[0].x} ${chartHeight} Z`;

  return (
    <View style={styles.chartWrapper}>
      <Svg width={width} height={chartHeight}>
        <Defs>
          <SvgGradient id="trendGradient" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0%" stopColor="#8B5CF6" stopOpacity="0.35" />
            <Stop offset="100%" stopColor="#8B5CF6" stopOpacity="0.0" />
          </SvgGradient>
        </Defs>

        {/* Shaded Area Under Curve */}
        <Path d={areaPath} fill="url(#trendGradient)" />

        {/* Stroke Line */}
        <Path
          d={linePath}
          fill="none"
          stroke="#8B5CF6"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Data Point Circles */}
        {points.map((p, idx) => (
          <Circle
            key={`point-${idx}`}
            cx={p.x}
            cy={p.y}
            r={idx === points.length - 1 ? 5 : 4}
            fill={idx === points.length - 1 ? '#A78BFA' : '#8B5CF6'}
            stroke="#FFFFFF"
            strokeWidth="1.5"
          />
        ))}
      </Svg>

      {/* Axis Footer / Recent batches date labels */}
      <View style={styles.trendFooterRow}>
        <Text style={styles.trendFooterText} numberOfLines={1}>
          Oldest ({points[0].average_score}%)
        </Text>
        <Text style={styles.trendFooterText} numberOfLines={1}>
          Latest ({points[points.length - 1].average_score}%)
        </Text>
      </View>
    </View>
  );
}

export default function DashboardScreen() {
  const navigation = useNavigation();
  const token = useAppStore((state) => state.token);
  const { width } = useWindowDimensions();
  const chartWidth = Math.max(260, width - 80);

  const [stats, setStats] = useState({
    total_resumes_screened: 0,
    total_batches_analyzed: 0,
    average_match_score: 0.0,
    total_offers_sent: 0,
    total_rejections_sent: 0,
    match_score_trend: [],
    recent_batches: [],
  });

  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);

  const fetchDashboardStats = useCallback(
    async (isPullToRefresh = false) => {
      if (isPullToRefresh) {
        setIsRefreshing(true);
      } else {
        setIsLoading(true);
      }
      setErrorMessage(null);

      try {
        const headers = {
          'Content-Type': 'application/json',
        };
        if (token) {
          headers['Authorization'] = `Bearer ${token}`;
        }

        const response = await fetch(`${API_URL}/api/dashboard-stats`, {
          method: 'GET',
          headers,
        });

        if (!response.ok) {
          const errData = await response.json().catch(() => ({}));
          throw new Error(
            errData?.detail || `Server returned error (${response.status})`
          );
        }

        const data = await response.json();
        setStats({
          total_resumes_screened: data.total_resumes_screened || 0,
          total_batches_analyzed: data.total_batches_analyzed || 0,
          average_match_score: data.average_match_score || 0.0,
          total_offers_sent: data.total_offers_sent || 0,
          total_rejections_sent: data.total_rejections_sent || 0,
          match_score_trend: Array.isArray(data.match_score_trend)
            ? data.match_score_trend
            : [],
          recent_batches: Array.isArray(data.recent_batches)
            ? data.recent_batches
            : [],
        });
      } catch (err) {
        console.log('Dashboard stats fetch error:', err);
        setErrorMessage(
          err.message || 'Failed to load dashboard stats. Please try again.'
        );
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    },
    [token]
  );

  useEffect(() => {
    fetchDashboardStats();
  }, [fetchDashboardStats]);

  const statCards = [
    {
      id: 'screened',
      number: stats.total_resumes_screened,
      label: 'Resumes Screened',
      icon: FileText,
      iconColor: '#A78BFA',
      delay: 50,
    },
    {
      id: 'analyzed',
      number: stats.total_batches_analyzed,
      label: 'Batches Analyzed',
      icon: Sparkles,
      iconColor: '#6366F1',
      delay: 100,
    },
    {
      id: 'offers',
      number: stats.total_offers_sent,
      label: 'Offers Sent',
      icon: CheckCircle2,
      iconColor: '#10B981',
      delay: 150,
    },
    {
      id: 'rejections',
      number: stats.total_rejections_sent,
      label: 'Rejections Sent',
      icon: XCircle,
      iconColor: '#EF4444',
      delay: 200,
    },
  ];

  const hasData =
    stats.total_resumes_screened > 0 ||
    stats.total_batches_analyzed > 0 ||
    stats.recent_batches.length > 0;

  return (
    <View style={styles.container}>
      <MonochromeBackground />

      <SafeAreaView style={styles.safeArea}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={() => fetchDashboardStats(true)}
              tintColor="#8B5CF6"
              colors={['#8B5CF6']}
            />
          }
        >
          {/* Header Row */}
          <View style={styles.headerRow}>
            <View style={styles.headerTitleWrap}>
              <Text style={styles.headerTitle}>Dashboard</Text>
              <Text style={styles.headerSubtitle}>
                Aggregate hiring metrics & overview
              </Text>
            </View>

            <TouchableOpacity
              style={styles.refreshBtn}
              activeOpacity={0.7}
              onPress={() => fetchDashboardStats(false)}
              disabled={isLoading || isRefreshing}
            >
              {isRefreshing ? (
                <ActivityIndicator size="small" color="#8B5CF6" />
              ) : (
                <RotateCw size={18} color="#A78BFA" />
              )}
            </TouchableOpacity>
          </View>

          {/* Error Banner */}
          {errorMessage && (
            <View style={styles.errorBanner}>
              <AlertCircle
                size={16}
                color="#EF4444"
                style={{ marginRight: 8 }}
              />
              <Text style={styles.errorBannerText}>{errorMessage}</Text>
              <TouchableOpacity
                onPress={() => fetchDashboardStats(false)}
                style={styles.retryButton}
              >
                <Text style={styles.retryButtonText}>Retry</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Loading Indicator for Initial Load */}
          {isLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#8B5CF6" />
              <Text style={styles.loadingText}>Loading dashboard metrics...</Text>
            </View>
          ) : !hasData && !errorMessage ? (
            /* Empty State */
            <Animated.View
              entering={FadeInDown.duration(500)}
              style={styles.emptyStateCard}
            >
              <View style={styles.emptyIconCircle}>
                <Layers size={36} color="#8B5CF6" />
              </View>
              <Text style={styles.emptyTitle}>No resumes screened yet</Text>
              <Text style={styles.emptyText}>
                Upload your first batch of resumes to unlock AI scoring, match
                breakdowns, and candidate dispatch tracking.
              </Text>
              <TouchableOpacity
                style={styles.emptyCtaButton}
                activeOpacity={0.8}
                onPress={() => navigation.navigate('Home')}
              >
                <Plus size={18} color="#FFFFFF" style={{ marginRight: 6 }} />
                <Text style={styles.emptyCtaButtonText}>Upload First Batch</Text>
              </TouchableOpacity>
            </Animated.View>
          ) : (
            <>
              {/* Stat Cards 2x2 Grid */}
              <View style={styles.statsGrid}>
                {statCards.map((card) => {
                  const IconComponent = card.icon;
                  return (
                    <Animated.View
                      key={card.id}
                      entering={FadeInDown.delay(card.delay).duration(500)}
                      style={styles.gridItem}
                    >
                      <View style={styles.statCard}>
                        <View style={styles.cardHeader}>
                          <IconComponent size={20} color={card.iconColor} />
                        </View>
                        <Text style={styles.statNumber}>{card.number}</Text>
                        <Text style={styles.statLabel}>{card.label}</Text>
                      </View>
                    </Animated.View>
                  );
                })}
              </View>

              {/* Match Score Trend Section */}
              <Animated.View
                entering={FadeInUp.delay(250).duration(500)}
                style={styles.sectionWrapper}
              >
                <View style={styles.trendCard}>
                  <View style={styles.trendHeader}>
                    <View style={styles.trendHeaderLeft}>
                      <View style={styles.trendIconBadge}>
                        <TrendingUp size={18} color="#8B5CF6" />
                      </View>
                      <View>
                        <Text style={styles.trendTitle}>Match Score Trend</Text>
                        <Text style={styles.trendSubtitle}>
                          Average match quality across recent batches
                        </Text>
                      </View>
                    </View>

                    <View style={styles.avgScorePill}>
                      <Text style={styles.avgScoreNumber}>
                        {stats.average_match_score}%
                      </Text>
                      <Text style={styles.avgScoreLabel}>Avg</Text>
                    </View>
                  </View>

                  {/* Sparkline Line Chart */}
                  <SparklineChart
                    data={stats.match_score_trend}
                    width={chartWidth}
                  />
                </View>
              </Animated.View>

              {/* Recent Job Openings / Batches Section */}
              <Animated.View
                entering={FadeInUp.delay(350).duration(500)}
                style={styles.sectionWrapper}
              >
                <View style={styles.sectionHeaderRow}>
                  <View style={styles.sectionTitleWithIcon}>
                    <Briefcase
                      size={18}
                      color="#A78BFA"
                      style={{ marginRight: 8 }}
                    />
                    <Text style={styles.sectionTitle}>Recent Job Openings</Text>
                  </View>
                  <TouchableOpacity
                    onPress={() => navigation.navigate('Candidates')}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.sectionLinkText}>View Candidates →</Text>
                  </TouchableOpacity>
                </View>

                {stats.recent_batches.length === 0 ? (
                  <View style={styles.emptyRecentCard}>
                    <Text style={styles.emptyRecentText}>
                      No batches uploaded yet.
                    </Text>
                  </View>
                ) : (
                  <View style={styles.batchesList}>
                    {stats.recent_batches.map((batch, idx) => {
                      const isAnalyzed = batch.status === 'analyzed';
                      const formattedDate = formatActivityDate(
                        batch.created_at
                      );

                      return (
                        <View key={batch.batch_id || idx} style={styles.batchCard}>
                          <View style={styles.batchTopRow}>
                            <Text
                              style={styles.batchJobTitle}
                              numberOfLines={2}
                            >
                              {batch.job_description || 'General Candidate Screening'}
                            </Text>
                            <View
                              style={[
                                styles.statusBadge,
                                isAnalyzed
                                  ? styles.statusBadgeAnalyzed
                                  : styles.statusBadgeUploaded,
                              ]}
                            >
                              <Text
                                style={[
                                  styles.statusBadgeText,
                                  isAnalyzed
                                    ? styles.statusBadgeTextAnalyzed
                                    : styles.statusBadgeTextUploaded,
                                ]}
                              >
                                {isAnalyzed ? 'Analyzed' : 'Uploaded'}
                              </Text>
                            </View>
                          </View>

                          <View style={styles.batchMetaRow}>
                            <View style={styles.metaItem}>
                              <Users
                                size={13}
                                color="#9CA3AF"
                                style={{ marginRight: 4 }}
                              />
                              <Text style={styles.metaText}>
                                {batch.candidate_count}{' '}
                                {batch.candidate_count === 1
                                  ? 'Resume'
                                  : 'Resumes'}
                              </Text>
                            </View>

                            <View style={styles.metaItem}>
                              <Clock
                                size={13}
                                color="#6B7280"
                                style={{ marginRight: 4 }}
                              />
                              <Text style={styles.metaDateText}>
                                {formattedDate}
                              </Text>
                            </View>
                          </View>
                        </View>
                      );
                    })}
                  </View>
                )}
              </Animated.View>
            </>
          )}
        </ScrollView>

        {/* Floating Action Button (FAB) -> Start New Batch */}
        <TouchableOpacity
          style={styles.fabButton}
          activeOpacity={0.85}
          onPress={() => navigation.navigate('Home')}
        >
          <Plus size={22} color="#FFFFFF" />
          <Text style={styles.fabText}>New Batch</Text>
        </TouchableOpacity>
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
    paddingTop: 16,
    paddingBottom: 90,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  headerTitleWrap: {
    flex: 1,
    paddingRight: 12,
  },
  headerTitle: {
    fontSize: 30,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.5,
  },
  headerSubtitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#9CA3AF',
    marginTop: 4,
  },
  refreshBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(15, 20, 36, 0.75)',
    borderWidth: 1,
    borderColor: 'rgba(99, 102, 241, 0.25)',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(239, 68, 68, 0.12)',
    borderColor: 'rgba(239, 68, 68, 0.3)',
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: 16,
  },
  errorBannerText: {
    flex: 1,
    fontSize: 13,
    color: '#FCA5A5',
    fontWeight: '500',
  },
  retryButton: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    backgroundColor: 'rgba(239, 68, 68, 0.25)',
    borderRadius: 6,
    marginLeft: 8,
  },
  retryButtonText: {
    fontSize: 12,
    color: '#FFFFFF',
    fontWeight: '700',
  },
  loadingContainer: {
    paddingVertical: 60,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    fontSize: 14,
    color: '#9CA3AF',
    marginTop: 14,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -5,
    marginBottom: 20,
  },
  gridItem: {
    width: '50%',
    padding: 5,
  },
  statCard: {
    backgroundColor: 'rgba(15, 20, 36, 0.75)',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(99, 102, 241, 0.25)',
  },
  cardHeader: {
    marginBottom: 10,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 12,
    color: '#9CA3AF',
    fontWeight: '500',
  },
  sectionWrapper: {
    marginBottom: 22,
  },
  trendCard: {
    backgroundColor: 'rgba(15, 20, 36, 0.75)',
    borderRadius: 24,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(99, 102, 241, 0.25)',
  },
  trendHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  trendHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 10,
  },
  trendIconBadge: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: 'rgba(139, 92, 246, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(139, 92, 246, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  trendTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  trendSubtitle: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 2,
  },
  avgScorePill: {
    backgroundColor: 'rgba(139, 92, 246, 0.2)',
    borderColor: 'rgba(139, 92, 246, 0.4)',
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
    alignItems: 'center',
  },
  avgScoreNumber: {
    fontSize: 16,
    fontWeight: '800',
    color: '#A78BFA',
  },
  avgScoreLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: '#C4B5FD',
    textTransform: 'uppercase',
  },
  chartWrapper: {
    marginTop: 8,
    alignItems: 'center',
  },
  chartEmptyContainer: {
    paddingVertical: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chartEmptyText: {
    fontSize: 13,
    color: '#6B7280',
    textAlign: 'center',
  },
  singlePointLabel: {
    fontSize: 12,
    color: '#A78BFA',
    fontWeight: '600',
    marginTop: 8,
  },
  trendPointsLabels: {
    alignItems: 'center',
  },
  trendFooterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    paddingHorizontal: 8,
    marginTop: 4,
  },
  trendFooterText: {
    fontSize: 11,
    color: '#6B7280',
    fontWeight: '500',
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitleWithIcon: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  sectionLinkText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#A78BFA',
  },
  batchesList: {
    gap: 10,
  },
  batchCard: {
    backgroundColor: 'rgba(15, 20, 36, 0.75)',
    borderRadius: 18,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(99, 102, 241, 0.2)',
  },
  batchTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  batchJobTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#F9FAFB',
    flex: 1,
    marginRight: 10,
    lineHeight: 19,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 1,
  },
  statusBadgeAnalyzed: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    borderColor: 'rgba(16, 185, 129, 0.35)',
  },
  statusBadgeUploaded: {
    backgroundColor: 'rgba(59, 130, 246, 0.15)',
    borderColor: 'rgba(59, 130, 246, 0.35)',
  },
  statusBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  statusBadgeTextAnalyzed: {
    color: '#10B981',
  },
  statusBadgeTextUploaded: {
    color: '#60A5FA',
  },
  batchMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  metaText: {
    fontSize: 12,
    color: '#9CA3AF',
    fontWeight: '600',
  },
  metaDateText: {
    fontSize: 11,
    color: '#6B7280',
    fontWeight: '500',
  },
  emptyRecentCard: {
    backgroundColor: 'rgba(15, 20, 36, 0.75)',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(99, 102, 241, 0.2)',
  },
  emptyRecentText: {
    fontSize: 13,
    color: '#6B7280',
  },
  emptyStateCard: {
    backgroundColor: 'rgba(15, 20, 36, 0.75)',
    borderRadius: 24,
    padding: 28,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(99, 102, 241, 0.25)',
    marginVertical: 12,
  },
  emptyIconCircle: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: 'rgba(139, 92, 246, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(139, 92, 246, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 6,
  },
  emptyText: {
    fontSize: 14,
    color: '#9CA3AF',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 20,
  },
  emptyCtaButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#8B5CF6',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 14,
  },
  emptyCtaButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  fabButton: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#8B5CF6',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 24,
    shadowColor: '#8B5CF6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 6,
  },
  fabText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14,
    marginLeft: 6,
  },
});

