import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  FlatList,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeInUp } from 'react-native-reanimated';
import {
  Sparkles,
  CheckCircle2,
  XCircle,
  Activity,
  RotateCw,
  Clock,
  AlertCircle,
  Inbox,
  User,
} from 'lucide-react-native';

import MonochromeBackground from '../components/landing/MonochromeBackground';
import { API_URL } from '../constants/api';
import { useAppStore } from '../store/useAppStore';

const FILTER_CHIPS = [
  { id: 'all', label: 'All' },
  { id: 'batch_analyzed', label: 'Batch Analyses' },
  { id: 'offer_sent', label: 'Offers Sent' },
  { id: 'rejection_sent', label: 'Rejections Sent' },
];

/**
 * Format ISO UTC timestamp to friendly display:
 * - "Today, 2:38 PM"
 * - "Yesterday, 2:38 PM"
 * - "Aug 31, 2026 · 2:38 PM"
 */
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

    if (isToday) {
      return `Today, ${timeString}`;
    }
    if (isYesterday) {
      return `Yesterday, ${timeString}`;
    }

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
 * Visual styling and metadata helper based on action_type
 */
function getActionConfig(actionType) {
  switch (actionType) {
    case 'batch_analyzed':
      return {
        label: 'Batch Analyzed',
        icon: Sparkles,
        color: '#8B5CF6',
        bgColor: 'rgba(139, 92, 246, 0.15)',
        borderColor: 'rgba(139, 92, 246, 0.35)',
      };
    case 'offer_sent':
      return {
        label: 'Offer Sent',
        icon: CheckCircle2,
        color: '#10B981',
        bgColor: 'rgba(16, 185, 129, 0.15)',
        borderColor: 'rgba(16, 185, 129, 0.35)',
      };
    case 'rejection_sent':
      return {
        label: 'Rejection Sent',
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

export default function ActivityLogScreen() {
  const token = useAppStore((state) => state.token);
  const currentUser = useAppStore((state) => state.user);

  const [activities, setActivities] = useState([]);
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);

  const fetchActivities = useCallback(
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

        const response = await fetch(`${API_URL}/api/activity-log`, {
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
        setActivities(Array.isArray(data) ? data : []);
      } catch (err) {
        console.log('Activity log fetch error:', err);
        setErrorMessage(
          err.message || 'Failed to fetch activity log. Please check your connection.'
        );
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    },
    [token]
  );

  useEffect(() => {
    fetchActivities();
  }, [fetchActivities]);

  const filteredActivities = useMemo(() => {
    if (selectedFilter === 'all') return activities;
    return activities.filter((item) => item.action_type === selectedFilter);
  }, [activities, selectedFilter]);

  const renderActivityCard = ({ item, index }) => {
    const config = getActionConfig(item.action_type);
    const IconComponent = config.icon;
    const formattedDate = formatActivityDate(item.timestamp);
    const delay = Math.min(index * 30, 300);

    // Format user display name
    const displayUser =
      item.user_name || (item.user_id ? `User (${item.user_id})` : 'Team Member');
    const isCurrentUser =
      currentUser &&
      (currentUser.email === item.user_name || currentUser.id === item.user_id);

    return (
      <Animated.View entering={FadeInUp.delay(delay).duration(400)}>
        <View style={styles.activityCard}>
          {/* Action Icon Badge */}
          <View
            style={[
              styles.iconContainer,
              {
                backgroundColor: config.bgColor,
                borderColor: config.borderColor,
              },
            ]}
          >
            <IconComponent size={20} color={config.color} />
          </View>

          {/* Activity Content */}
          <View style={styles.cardContent}>
            {/* Top row: User Identity & Action Pill */}
            <View style={styles.cardTopRow}>
              <View style={styles.userWrapper}>
                <User size={13} color="#9CA3AF" style={styles.userIcon} />
                <Text style={styles.userName} numberOfLines={1}>
                  {displayUser}
                  {isCurrentUser ? ' (You)' : ''}
                </Text>
              </View>

              <View
                style={[
                  styles.actionBadge,
                  {
                    backgroundColor: config.bgColor,
                    borderColor: config.borderColor,
                  },
                ]}
              >
                <Text style={[styles.actionBadgeText, { color: config.color }]}>
                  {config.label}
                </Text>
              </View>
            </View>

            {/* Candidate name highlight if present */}
            {item.candidate_name ? (
              <View style={styles.candidateRow}>
                <Text style={styles.candidateLabel}>Candidate: </Text>
                <Text style={styles.candidateNameText}>
                  {item.candidate_name}
                </Text>
              </View>
            ) : null}

            {/* Details message */}
            <Text style={styles.detailsText}>{item.details || 'No additional details'}</Text>

            {/* Bottom row: timestamp */}
            <View style={styles.timestampRow}>
              <Clock size={12} color="#6B7280" style={styles.clockIcon} />
              <Text style={styles.timestampText}>{formattedDate}</Text>
            </View>
          </View>
        </View>
      </Animated.View>
    );
  };

  const renderHeader = () => (
    <View style={styles.headerContainer}>
      <View style={styles.headerTopRow}>
        <View style={styles.headerTitles}>
          <Text style={styles.headerTitle}>Activity Log</Text>
          <Text style={styles.headerSubtitle}>
            Live audit trail of team hiring actions
          </Text>
        </View>

        {/* Refresh Button */}
        <TouchableOpacity
          style={styles.refreshButton}
          onPress={() => fetchActivities(false)}
          activeOpacity={0.7}
          disabled={isLoading || isRefreshing}
        >
          {isRefreshing ? (
            <ActivityIndicator size="small" color="#8B5CF6" />
          ) : (
            <RotateCw size={18} color="#A78BFA" />
          )}
        </TouchableOpacity>
      </View>

      {/* Filter Chips */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.chipsContainer}
      >
        {FILTER_CHIPS.map((chip) => {
          const isActive = selectedFilter === chip.id;
          const count =
            chip.id === 'all'
              ? activities.length
              : activities.filter((a) => a.action_type === chip.id).length;

          return (
            <TouchableOpacity
              key={chip.id}
              style={[
                styles.chipButton,
                isActive ? styles.chipActive : styles.chipInactive,
              ]}
              onPress={() => setSelectedFilter(chip.id)}
              activeOpacity={0.8}
            >
              <Text
                style={[
                  styles.chipText,
                  isActive ? styles.chipTextActive : styles.chipTextInactive,
                ]}
              >
                {chip.label}
              </Text>
              {count > 0 && (
                <View
                  style={[
                    styles.chipCountBadge,
                    isActive
                      ? styles.chipCountBadgeActive
                      : styles.chipCountBadgeInactive,
                  ]}
                >
                  <Text
                    style={[
                      styles.chipCountText,
                      isActive
                        ? styles.chipCountTextActive
                        : styles.chipCountTextInactive,
                    ]}
                  >
                    {count}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Error Banner */}
      {errorMessage && (
        <View style={styles.errorBanner}>
          <AlertCircle size={16} color="#EF4444" style={{ marginRight: 8 }} />
          <Text style={styles.errorBannerText}>{errorMessage}</Text>
          <TouchableOpacity
            onPress={() => fetchActivities(false)}
            style={styles.retryButton}
          >
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );

  const renderEmptyState = () => {
    if (isLoading) {
      return (
        <View style={styles.emptyContainer}>
          <ActivityIndicator size="large" color="#8B5CF6" />
          <Text style={styles.loadingText}>Loading activity history...</Text>
        </View>
      );
    }

    return (
      <View style={styles.emptyContainer}>
        <View style={styles.emptyIconCircle}>
          <Inbox size={36} color="#6B7280" />
        </View>
        <Text style={styles.emptyTitle}>No activity yet</Text>
        <Text style={styles.emptyText}>
          {selectedFilter === 'all'
            ? 'When your team analyzes batches or sends offer and rejection emails, real-time activity entries will appear here.'
            : 'No actions matching the selected filter were found.'}
        </Text>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <MonochromeBackground />

      <SafeAreaView style={styles.safeArea}>
        <FlatList
          data={filteredActivities}
          keyExtractor={(item, index) =>
            item.id || item._id || `${item.timestamp}_${index}`
          }
          renderItem={renderActivityCard}
          ListHeaderComponent={renderHeader}
          ListEmptyComponent={renderEmptyState}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={() => fetchActivities(true)}
              tintColor="#8B5CF6"
              colors={['#8B5CF6']}
            />
          }
        />
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
  listContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 40,
    flexGrow: 1,
  },
  headerContainer: {
    marginBottom: 16,
  },
  headerTopRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  headerTitles: {
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
  refreshButton: {
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
  chipsContainer: {
    gap: 8,
    paddingVertical: 4,
    paddingRight: 12,
  },
  chipButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  chipActive: {
    backgroundColor: '#8B5CF6',
    borderColor: '#8B5CF6',
  },
  chipInactive: {
    backgroundColor: 'rgba(15, 20, 36, 0.75)',
    borderColor: 'rgba(99, 102, 241, 0.25)',
  },
  chipText: {
    fontSize: 13,
  },
  chipTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  chipTextInactive: {
    color: '#9CA3AF',
    fontWeight: '500',
  },
  chipCountBadge: {
    marginLeft: 6,
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 10,
  },
  chipCountBadgeActive: {
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
  },
  chipCountBadgeInactive: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  chipCountText: {
    fontSize: 11,
    fontWeight: '700',
  },
  chipCountTextActive: {
    color: '#FFFFFF',
  },
  chipCountTextInactive: {
    color: '#9CA3AF',
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
    marginTop: 14,
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
  activityCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: 'rgba(15, 20, 36, 0.75)',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(99, 102, 241, 0.2)',
    marginBottom: 12,
  },
  iconContainer: {
    width: 38,
    height: 38,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    marginTop: 2,
  },
  cardContent: {
    flex: 1,
  },
  cardTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  userWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 8,
  },
  userIcon: {
    marginRight: 4,
  },
  userName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#F9FAFB',
    flexShrink: 1,
  },
  actionBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    borderWidth: 1,
  },
  actionBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  candidateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  candidateLabel: {
    fontSize: 12,
    color: '#9CA3AF',
    fontWeight: '500',
  },
  candidateNameText: {
    fontSize: 13,
    color: '#A78BFA',
    fontWeight: '700',
  },
  detailsText: {
    fontSize: 13,
    color: '#D1D5DB',
    lineHeight: 18,
    marginBottom: 8,
  },
  timestampRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  clockIcon: {
    marginRight: 4,
  },
  timestampText: {
    fontSize: 11,
    color: '#9CA3AF',
    fontWeight: '500',
  },
  emptyContainer: {
    paddingVertical: 60,
    paddingHorizontal: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
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
  },
  loadingText: {
    fontSize: 14,
    color: '#9CA3AF',
    marginTop: 14,
  },
});
