import React, { useState, useEffect, useCallback } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import {
  User,
  Sparkles,
  CheckCircle2,
  XCircle,
  FileText,
  Layers,
  LogOut,
  RotateCw,
  AlertCircle,
  Clock,
  Activity,
} from 'lucide-react-native';

import MonochromeBackground from '../components/landing/MonochromeBackground';
import { API_URL } from '../constants/api';
import { useAppStore } from '../store/useAppStore';

function getInitials(name, email) {
  if (name && name.trim()) {
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  }
  if (email && email.trim()) {
    return email.slice(0, 2).toUpperCase();
  }
  return 'FA';
}

function formatCompactTime(isoString) {
  if (!isoString) return '';
  try {
    const date = new Date(isoString);
    if (isNaN(date.getTime())) return isoString;

    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24 && date.getDate() === now.getDate()) return `${diffHours}h ago`;

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

    if (isYesterday) return `Yesterday, ${timeString}`;

    const monthNames = [
      'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
      'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
    ];
    const month = monthNames[date.getMonth()];
    const day = date.getDate();
    return `${month} ${day} · ${timeString}`;
  } catch {
    return isoString;
  }
}

function getActionConfig(actionType) {
  switch (actionType) {
    case 'batch_analyzed':
      return {
        label: 'Analyzed',
        icon: Sparkles,
        color: '#8B5CF6',
        bgColor: 'rgba(139, 92, 246, 0.15)',
        borderColor: 'rgba(139, 92, 246, 0.35)',
      };
    case 'offer_sent':
      return {
        label: 'Offer',
        icon: CheckCircle2,
        color: '#10B981',
        bgColor: 'rgba(16, 185, 129, 0.15)',
        borderColor: 'rgba(16, 185, 129, 0.35)',
      };
    case 'rejection_sent':
      return {
        label: 'Rejection',
        icon: XCircle,
        color: '#EF4444',
        bgColor: 'rgba(239, 68, 68, 0.15)',
        borderColor: 'rgba(239, 68, 68, 0.35)',
      };
    default:
      return {
        label: 'Activity',
        icon: Activity,
        color: '#60A5FA',
        bgColor: 'rgba(96, 165, 250, 0.15)',
        borderColor: 'rgba(96, 165, 250, 0.35)',
      };
  }
}

export default function ProfileScreen() {
  const navigation = useNavigation();

  // Zustand state and actions
  const token = useAppStore((state) => state.token);
  const currentUser = useAppStore((state) => state.user);
  const logout = useAppStore((state) => state.logout);
  const resetAll = useAppStore((state) => state.resetAll);

  // Local state for fetched data
  const [activities, setActivities] = useState([]);
  const [dashboardStats, setDashboardStats] = useState({
    total_resumes_screened: 0,
    total_batches_analyzed: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [activityError, setActivityError] = useState(null);
  const [statsError, setStatsError] = useState(null);

  const fetchProfileData = useCallback(
    async (isPullToRefresh = false) => {
      if (isPullToRefresh) {
        setIsRefreshing(true);
      } else {
        setIsLoading(true);
      }
      setActivityError(null);
      setStatsError(null);

      const headers = { 'Content-Type': 'application/json' };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      // 1. Fetch Activity Log
      const activityPromise = fetch(`${API_URL}/api/activity-log`, {
        method: 'GET',
        headers,
      })
        .then(async (res) => {
          if (!res.ok) {
            const errData = await res.json().catch(() => ({}));
            throw new Error(errData?.detail || `Error (${res.status})`);
          }
          return res.json();
        })
        .then((data) => {
          setActivities(Array.isArray(data) ? data : []);
        })
        .catch((err) => {
          console.log('Profile activity-log fetch error:', err);
          setActivityError('Failed to load activity metrics.');
        });

      // 2. Fetch Dashboard Stats
      const statsPromise = fetch(`${API_URL}/api/dashboard-stats`, {
        method: 'GET',
        headers,
      })
        .then(async (res) => {
          if (!res.ok) {
            const errData = await res.json().catch(() => ({}));
            throw new Error(errData?.detail || `Error (${res.status})`);
          }
          return res.json();
        })
        .then((data) => {
          setDashboardStats({
            total_resumes_screened: data.total_resumes_screened || 0,
            total_batches_analyzed: data.total_batches_analyzed || 0,
          });
        })
        .catch((err) => {
          console.log('Profile dashboard-stats fetch error:', err);
          setStatsError('Failed to load team totals.');
        });

      await Promise.allSettled([activityPromise, statsPromise]);
      setIsLoading(false);
      setIsRefreshing(false);
    },
    [token]
  );

  useEffect(() => {
    fetchProfileData();
  }, [fetchProfileData]);

  // Derive initials, display name, and email
  const userInitials = getInitials(currentUser?.name, currentUser?.email);
  const displayName =
    currentUser?.name ||
    (currentUser?.email ? currentUser.email.split('@')[0] : 'Team Member');
  const displayEmail = currentUser?.email || 'Authenticated User';

  // Client-side filter for "Your Activity"
  // Activity entries store user_name as current_user["email"] (or user_id/name)
  const userEmailLower = (currentUser?.email || '').toLowerCase();
  const userNameLower = (currentUser?.name || '').toLowerCase();
  const userId = currentUser?.id || currentUser?._id;

  const yourActivities = activities.filter((item) => {
    const itemUser = (item.user_name || '').toLowerCase();
    const itemUserId = item.user_id;
    return (
      (userEmailLower && itemUser === userEmailLower) ||
      (userNameLower && itemUser === userNameLower) ||
      (userId && itemUserId === userId)
    );
  });

  const yourBatchesAnalyzed = yourActivities.filter(
    (a) => a.action_type === 'batch_analyzed'
  ).length;
  const yourOffersSent = yourActivities.filter(
    (a) => a.action_type === 'offer_sent'
  ).length;
  const yourRejectionsSent = yourActivities.filter(
    (a) => a.action_type === 'rejection_sent'
  ).length;

  // Mini-feed: 5 most recent activities across the team
  const recentTeamActivities = activities.slice(0, 5);

  const handleLogOut = () => {
    logout();
    resetAll();
    navigation.reset({
      index: 0,
      routes: [{ name: 'Login' }],
    });
  };

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
              onRefresh={() => fetchProfileData(true)}
              tintColor="#8B5CF6"
              colors={['#8B5CF6']}
            />
          }
        >
          {/* Header Bar with Title & Refresh */}
          <View style={styles.headerBar}>
            <Text style={styles.headerTitle}>Profile</Text>
            <TouchableOpacity
              style={styles.refreshBtn}
              activeOpacity={0.7}
              onPress={() => fetchProfileData(false)}
              disabled={isLoading || isRefreshing}
            >
              {isRefreshing ? (
                <ActivityIndicator size="small" color="#8B5CF6" />
              ) : (
                <RotateCw size={18} color="#A78BFA" />
              )}
            </TouchableOpacity>
          </View>

          {/* User Identity & Avatar Section */}
          <View style={styles.identitySection}>
            <LinearGradient
              colors={['#8B5CF6', '#6366F1']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.avatarGradient}
            >
              <Text style={styles.avatarInitials}>{userInitials}</Text>
            </LinearGradient>
            <Text style={styles.userName}>{displayName}</Text>
            <Text style={styles.userEmail}>{displayEmail}</Text>
          </View>

          {/* Loading Indicator for Initial Fetch */}
          {isLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#8B5CF6" />
              <Text style={styles.loadingText}>Loading profile metrics...</Text>
            </View>
          ) : (
            <>
              {/* Section 1: "Your Activity" Stats Grid */}
              <Animated.View
                entering={FadeInDown.delay(100).duration(500)}
                style={styles.sectionWrapper}
              >
                <View style={styles.sectionHeaderRow}>
                  <View style={styles.sectionTitleWrap}>
                    <User size={16} color="#8B5CF6" style={{ marginRight: 6 }} />
                    <Text style={styles.sectionTitle}>Your Activity</Text>
                  </View>
                  <Text style={styles.sectionSubCount}>
                    {yourActivities.length} total action{yourActivities.length === 1 ? '' : 's'}
                  </Text>
                </View>

                {activityError && (
                  <View style={styles.inlineErrorNote}>
                    <AlertCircle size={14} color="#EF4444" style={{ marginRight: 6 }} />
                    <Text style={styles.inlineErrorText}>{activityError}</Text>
                  </View>
                )}

                <View style={styles.statsGrid}>
                  <View style={styles.statGridItem}>
                    <View style={styles.statCard}>
                      <View style={styles.statIconBadge}>
                        <Sparkles size={18} color="#8B5CF6" />
                      </View>
                      <Text style={styles.statNumber}>{yourBatchesAnalyzed}</Text>
                      <Text style={styles.statLabel}>Batches Analyzed</Text>
                    </View>
                  </View>

                  <View style={styles.statGridItem}>
                    <View style={styles.statCard}>
                      <View style={[styles.statIconBadge, styles.statIconBadgeOffer]}>
                        <CheckCircle2 size={18} color="#10B981" />
                      </View>
                      <Text style={styles.statNumber}>{yourOffersSent}</Text>
                      <Text style={styles.statLabel}>Offers Sent</Text>
                    </View>
                  </View>

                  <View style={styles.statGridItem}>
                    <View style={styles.statCard}>
                      <View style={[styles.statIconBadge, styles.statIconBadgeRejection]}>
                        <XCircle size={18} color="#EF4444" />
                      </View>
                      <Text style={styles.statNumber}>{yourRejectionsSent}</Text>
                      <Text style={styles.statLabel}>Rejections Sent</Text>
                    </View>
                  </View>
                </View>
              </Animated.View>

              {/* Section 2: "Overall Stats" (Team Totals) */}
              <Animated.View
                entering={FadeInDown.delay(200).duration(500)}
                style={styles.sectionWrapper}
              >
                <View style={styles.sectionHeaderRow}>
                  <View style={styles.sectionTitleWrap}>
                    <Layers size={16} color="#A78BFA" style={{ marginRight: 6 }} />
                    <Text style={styles.sectionTitle}>Overall Team Totals</Text>
                  </View>
                </View>

                {statsError && (
                  <View style={styles.inlineErrorNote}>
                    <AlertCircle size={14} color="#EF4444" style={{ marginRight: 6 }} />
                    <Text style={styles.inlineErrorText}>{statsError}</Text>
                  </View>
                )}

                <View style={styles.overallStatsRow}>
                  <View style={styles.overallStatCard}>
                    <View style={styles.overallIconHeader}>
                      <FileText size={18} color="#A78BFA" />
                    </View>
                    <Text style={styles.overallStatNumber}>
                      {dashboardStats.total_resumes_screened}
                    </Text>
                    <Text style={styles.overallStatLabel}>Resumes Screened</Text>
                  </View>

                  <View style={styles.overallStatCard}>
                    <View style={styles.overallIconHeader}>
                      <Sparkles size={18} color="#6366F1" />
                    </View>
                    <Text style={styles.overallStatNumber}>
                      {dashboardStats.total_batches_analyzed}
                    </Text>
                    <Text style={styles.overallStatLabel}>Batches Analyzed</Text>
                  </View>
                </View>
              </Animated.View>

              {/* Section 3: "Team Activity" (Compact Mini-Feed) */}
              <Animated.View
                entering={FadeInUp.delay(300).duration(500)}
                style={styles.sectionWrapper}
              >
                <View style={styles.sectionHeaderRow}>
                  <View style={styles.sectionTitleWrap}>
                    <Activity size={16} color="#8B5CF6" style={{ marginRight: 6 }} />
                    <Text style={styles.sectionTitle}>Recent Team Activity</Text>
                  </View>
                  <TouchableOpacity
                    onPress={() => navigation.navigate('Activity')}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.viewAllText}>View All →</Text>
                  </TouchableOpacity>
                </View>

                {recentTeamActivities.length === 0 ? (
                  <View style={styles.emptyFeedCard}>
                    <Text style={styles.emptyFeedText}>No team activity yet.</Text>
                  </View>
                ) : (
                  <View style={styles.miniFeedList}>
                    {recentTeamActivities.map((item, idx) => {
                      const config = getActionConfig(item.action_type);
                      const IconComponent = config.icon;
                      const formattedTime = formatCompactTime(item.timestamp);
                      const isItemUser =
                        (userEmailLower &&
                          (item.user_name || '').toLowerCase() === userEmailLower) ||
                        (userNameLower &&
                          (item.user_name || '').toLowerCase() === userNameLower);

                      return (
                        <View
                          key={item.id || item._id || idx}
                          style={styles.feedCard}
                        >
                          <View
                            style={[
                              styles.feedIconBadge,
                              {
                                backgroundColor: config.bgColor,
                                borderColor: config.borderColor,
                              },
                            ]}
                          >
                            <IconComponent size={14} color={config.color} />
                          </View>

                          <View style={styles.feedContent}>
                            <View style={styles.feedTopRow}>
                              <Text style={styles.feedUserName} numberOfLines={1}>
                                {item.user_name || 'Team Member'}
                                {isItemUser ? ' (You)' : ''}
                              </Text>
                              <Text style={styles.feedTime}>{formattedTime}</Text>
                            </View>
                            <Text style={styles.feedDetails} numberOfLines={2}>
                              {item.details || config.label}
                            </Text>
                          </View>
                        </View>
                      );
                    })}
                  </View>
                )}
              </Animated.View>

              {/* Section 4: Log Out Button */}
              <Animated.View
                entering={FadeInUp.delay(400).duration(500)}
                style={styles.logoutWrapper}
              >
                <TouchableOpacity
                  style={styles.logOutBtn}
                  activeOpacity={0.8}
                  onPress={handleLogOut}
                >
                  <LogOut size={18} color="#EF4444" style={styles.logOutIcon} />
                  <Text style={styles.logOutText}>Log Out</Text>
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
    paddingTop: 16,
    paddingBottom: 40,
  },
  headerBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  headerTitle: {
    fontSize: 30,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.5,
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
  },
  identitySection: {
    alignItems: 'center',
    marginBottom: 24,
  },
  avatarGradient: {
    width: 88,
    height: 88,
    borderRadius: 44,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    borderWidth: 2,
    borderColor: 'rgba(167, 139, 250, 0.4)',
    shadowColor: '#8B5CF6',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 8,
  },
  avatarInitials: {
    fontSize: 32,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  userName: {
    fontSize: 22,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 2,
  },
  userEmail: {
    fontSize: 14,
    color: '#9CA3AF',
    fontWeight: '500',
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
  sectionWrapper: {
    marginBottom: 22,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitleWrap: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  sectionSubCount: {
    fontSize: 12,
    color: '#9CA3AF',
    fontWeight: '500',
  },
  viewAllText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#A78BFA',
  },
  inlineErrorNote: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginBottom: 10,
  },
  inlineErrorText: {
    fontSize: 12,
    color: '#FCA5A5',
    fontWeight: '500',
  },
  statsGrid: {
    flexDirection: 'row',
    marginHorizontal: -4,
  },
  statGridItem: {
    flex: 1,
    paddingHorizontal: 4,
  },
  statCard: {
    backgroundColor: 'rgba(15, 20, 36, 0.75)',
    borderRadius: 18,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(99, 102, 241, 0.25)',
    alignItems: 'center',
  },
  statIconBadge: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: 'rgba(139, 92, 246, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(139, 92, 246, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  statIconBadgeOffer: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    borderColor: 'rgba(16, 185, 129, 0.3)',
  },
  statIconBadgeRejection: {
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    borderColor: 'rgba(239, 68, 68, 0.3)',
  },
  statNumber: {
    fontSize: 20,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 11,
    color: '#9CA3AF',
    fontWeight: '500',
    textAlign: 'center',
  },
  overallStatsRow: {
    flexDirection: 'row',
    marginHorizontal: -5,
  },
  overallStatCard: {
    flex: 1,
    marginHorizontal: 5,
    backgroundColor: 'rgba(15, 20, 36, 0.75)',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(99, 102, 241, 0.25)',
  },
  overallIconHeader: {
    marginBottom: 8,
  },
  overallStatNumber: {
    fontSize: 22,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 2,
  },
  overallStatLabel: {
    fontSize: 12,
    color: '#9CA3AF',
    fontWeight: '500',
  },
  miniFeedList: {
    gap: 8,
  },
  feedCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(15, 20, 36, 0.75)',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(99, 102, 241, 0.2)',
  },
  feedIconBadge: {
    width: 28,
    height: 28,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  feedContent: {
    flex: 1,
  },
  feedTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 2,
  },
  feedUserName: {
    fontSize: 13,
    fontWeight: '700',
    color: '#F9FAFB',
    flex: 1,
    marginRight: 6,
  },
  feedTime: {
    fontSize: 11,
    color: '#6B7280',
    fontWeight: '500',
  },
  feedDetails: {
    fontSize: 12,
    color: '#9CA3AF',
    lineHeight: 16,
  },
  emptyFeedCard: {
    backgroundColor: 'rgba(15, 20, 36, 0.75)',
    borderRadius: 14,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(99, 102, 241, 0.2)',
  },
  emptyFeedText: {
    fontSize: 13,
    color: '#6B7280',
  },
  logoutWrapper: {
    marginTop: 8,
    marginBottom: 16,
  },
  logOutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(239, 68, 68, 0.08)',
    borderRadius: 16,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.35)',
  },
  logOutIcon: {
    marginRight: 8,
  },
  logOutText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#EF4444',
  },
});

