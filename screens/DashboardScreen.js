import {
  FileText,
  Mail,
  Star,
  User,
  XCircle,
} from 'lucide-react-native';
import React from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import MonochromeBackground from '../components/landing/MonochromeBackground';

export default function DashboardScreen() {
  const statCards = [
    {
      id: '1',
      number: '247',
      label: 'Resumes Screened',
      icon: FileText,
      iconColor: '#A78BFA',
      delay: 100,
    },
    {
      id: '2',
      number: '38',
      label: 'Shortlisted',
      icon: Star,
      iconColor: '#F59E0B',
      delay: 200,
    },
    {
      id: '3',
      number: '12',
      label: 'Offers Sent',
      icon: Mail,
      iconColor: '#10B981',
      delay: 300,
    },
    {
      id: '4',
      number: '195',
      label: 'Rejected',
      icon: XCircle,
      iconColor: '#EF4444',
      delay: 400,
    },
  ];

  const teamActivities = [
    {
      id: '1',
      name: 'Srushti',
      action: 'analyzed 12 resumes',
      time: '2h ago',
      dotColor: '#8B5CF6',
    },
    {
      id: '2',
      name: 'Madhura',
      action: 'shortlisted 4 candidates',
      time: '5h ago',
      dotColor: '#8B5CF6',
    },
    {
      id: '3',
      name: 'Sarang',
      action: 'rejected 3 candidates',
      time: 'Yesterday',
      dotColor: '#EF4444',
    },
    {
      id: '4',
      name: 'You',
      action: 'sent 2 offer letters',
      time: 'Yesterday',
      dotColor: '#10B981',
    },
    {
      id: '5',
      name: 'Samarth',
      action: 'uploaded a new batch',
      time: '2 days ago',
      dotColor: '#8B5CF6',
    },
  ];

  return (
    <View style={styles.container}>
      <MonochromeBackground />

      <SafeAreaView style={styles.safeArea}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Header Row */}
          <View style={styles.headerRow}>
            <Text style={styles.headerTitle}>Dashboard</Text>
            <TouchableOpacity style={styles.userAvatarBtn} activeOpacity={0.8}>
              <User size={20} color="#A78BFA" />
            </TouchableOpacity>
          </View>

          {/* Stat Cards 2x2 Grid */}
          <View style={styles.statsGrid}>
            {statCards.map((card) => {
              const IconComponent = card.icon;
              return (
                <Animated.View
                  key={card.id}
                  entering={FadeInDown.delay(card.delay).duration(600)}
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

          {/* Team Activity Section */}
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>Team Activity</Text>
          </View>

          <View style={styles.activityList}>
            {teamActivities.map((item, index) => (
              <Animated.View
                key={item.id}
                entering={FadeInUp.delay(500 + index * 100).duration(500)}
              >
                <View style={styles.activityCard}>
                  <View
                    style={[
                      styles.statusDot,
                      { backgroundColor: item.dotColor },
                    ]}
                  />
                  <Text style={styles.activityText}>
                    <Text style={styles.memberName}>{item.name} </Text>
                    {item.action}
                  </Text>
                  <Text style={styles.timestampText}>{item.time}</Text>
                </View>
              </Animated.View>
            ))}
          </View>

          {/* Activity Log Link */}
          <TouchableOpacity
            style={styles.activityLinkBtn}
            activeOpacity={0.7}
            onPress={() => {
              // TODO: navigate to Activity tab
            }}
          >
            <Text style={styles.activityLinkText}>
              View full activity log →
            </Text>
          </TouchableOpacity>
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
    paddingHorizontal: 28,
    paddingTop: 16,
    paddingBottom: 36,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.5,
  },
  userAvatarBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(15, 20, 36, 0.85)',
    borderWidth: 1,
    borderColor: 'rgba(167, 139, 250, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -6,
    marginBottom: 28,
  },
  gridItem: {
    width: '50%',
    padding: 6,
  },
  statCard: {
    backgroundColor: 'rgba(15, 20, 36, 0.75)',
    borderRadius: 24,
    padding: 18,
    borderWidth: 1,
    borderColor: 'rgba(99, 102, 241, 0.25)',
  },
  cardHeader: {
    marginBottom: 12,
  },
  statNumber: {
    fontSize: 26,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 13,
    color: '#9CA3AF',
    fontWeight: '500',
  },
  sectionHeaderRow: {
    marginBottom: 14,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  activityList: {
    gap: 10,
    marginBottom: 16,
  },
  activityCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(15, 20, 36, 0.75)',
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: 'rgba(99, 102, 241, 0.25)',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 12,
  },
  activityText: {
    flex: 1,
    fontSize: 14,
    color: '#9CA3AF',
    marginRight: 8,
  },
  memberName: {
    fontWeight: '700',
    color: '#FFFFFF',
  },
  timestampText: {
    fontSize: 12,
    color: '#6B7280',
  },
  activityLinkBtn: {
    paddingVertical: 8,
    alignSelf: 'flex-start',
  },
  activityLinkText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#A78BFA',
  },
});
