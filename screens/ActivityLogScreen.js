import React, { useState, useMemo } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  FlatList,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeInUp } from 'react-native-reanimated';

import MonochromeBackground from '../components/landing/MonochromeBackground';

const FILTER_CHIPS = [
  { id: 'all', label: 'All' },
  { id: 'screening', label: 'Screening' },
  { id: 'shortlist', label: 'Shortlist' },
  { id: 'rejected', label: 'Rejected' },
  { id: 'emails', label: 'Emails' },
];

const INITIAL_ACTIVITIES = [
  {
    id: '1',
    member_name: 'Priya Patel',
    action_type: 'screening',
    candidate_name: 'Sarah Chen',
    description: 'analyzed resume for',
    timestamp: 'Just now',
  },
  {
    id: '2',
    member_name: 'Marcus Johnson',
    action_type: 'shortlist',
    candidate_name: 'Alex Rivera',
    description: 'shortlisted',
    timestamp: '1h ago',
  },
  {
    id: '3',
    member_name: 'Sarah Chen',
    action_type: 'rejected',
    candidate_name: 'Michael Brown',
    description: 'rejected',
    timestamp: '2h ago',
  },
  {
    id: '4',
    member_name: 'You',
    action_type: 'emails',
    candidate_name: 'Samantha Wu',
    description: 'sent offer letter to',
    timestamp: '4h ago',
  },
  {
    id: '5',
    member_name: 'Priya Patel',
    action_type: 'screening',
    candidate_name: 'David Kim',
    description: 'analyzed resume for',
    timestamp: '6h ago',
  },
  {
    id: '6',
    member_name: 'Marcus Johnson',
    action_type: 'shortlist',
    candidate_name: 'Aisha Khan',
    description: 'shortlisted',
    timestamp: '8h ago',
  },
  {
    id: '7',
    member_name: 'You',
    action_type: 'emails',
    candidate_name: 'Maya Lin',
    description: 'sent interview invite to',
    timestamp: 'Yesterday',
  },
  {
    id: '8',
    member_name: 'Sarah Chen',
    action_type: 'rejected',
    candidate_name: 'Emily Watson',
    description: 'rejected',
    timestamp: 'Yesterday',
  },
  {
    id: '9',
    member_name: 'Priya Patel',
    action_type: 'shortlist',
    candidate_name: 'Rohan Gupta',
    description: 'shortlisted',
    timestamp: 'Yesterday',
  },
  {
    id: '10',
    member_name: 'Marcus Johnson',
    action_type: 'screening',
    candidate_name: 'Liam O\'Connor',
    description: 'analyzed batch including',
    timestamp: 'Yesterday',
  },
  {
    id: '11',
    member_name: 'You',
    action_type: 'emails',
    candidate_name: 'Elena Rostova',
    description: 'sent rejection email to',
    timestamp: '2 days ago',
  },
  {
    id: '12',
    member_name: 'Sarah Chen',
    action_type: 'screening',
    candidate_name: 'Vikram Malhotra',
    description: 'analyzed resume for',
    timestamp: '2 days ago',
  },
  {
    id: '13',
    member_name: 'Priya Patel',
    action_type: 'emails',
    candidate_name: 'Nina Sharma',
    description: 'sent offer letter to',
    timestamp: '2 days ago',
  },
  {
    id: '14',
    member_name: 'Marcus Johnson',
    action_type: 'rejected',
    candidate_name: 'James Wilson',
    description: 'rejected',
    timestamp: '3 days ago',
  },
  {
    id: '15',
    member_name: 'You',
    action_type: 'shortlist',
    candidate_name: 'Jordan Taylor',
    description: 'shortlisted',
    timestamp: '3 days ago',
  },
  {
    id: '16',
    member_name: 'Priya Patel',
    action_type: 'screening',
    candidate_name: 'Carlos Gomez',
    description: 'analyzed batch including',
    timestamp: '4 days ago',
  },
  {
    id: '17',
    member_name: 'Sarah Chen',
    action_type: 'emails',
    candidate_name: 'Chloe Bennett',
    description: 'sent assessment to',
    timestamp: '4 days ago',
  },
  {
    id: '18',
    member_name: 'Marcus Johnson',
    action_type: 'rejected',
    candidate_name: 'Hannah Schmidt',
    description: 'rejected',
    timestamp: '5 days ago',
  },
  {
    id: '19',
    member_name: 'You',
    action_type: 'screening',
    candidate_name: 'Full Stack Batch #4',
    description: 'processed 15 resumes for',
    timestamp: '5 days ago',
  },
  {
    id: '20',
    member_name: 'Priya Patel',
    action_type: 'shortlist',
    candidate_name: 'David Kim',
    description: 'flagged for technical review',
    timestamp: '6 days ago',
  },
];

export default function ActivityLogScreen() {
  const [selectedFilter, setSelectedFilter] = useState('all');

  const filteredActivities = useMemo(() => {
    if (selectedFilter === 'all') return INITIAL_ACTIVITIES;
    return INITIAL_ACTIVITIES.filter(
      (item) => item.action_type === selectedFilter
    );
  }, [selectedFilter]);

  const getActionDotColor = (actionType) => {
    switch (actionType) {
      case 'screening':
        return '#8B5CF6';
      case 'shortlist':
        return '#10B981';
      case 'rejected':
        return '#EF4444';
      case 'emails':
        return '#3B82F6';
      default:
        return '#8B5CF6';
    }
  };

  const renderActivityCard = ({ item, index }) => {
    const dotColor = getActionDotColor(item.action_type);
    const delay = Math.min(index * 40, 300);

    return (
      <Animated.View entering={FadeInUp.delay(delay).duration(450)}>
        <View style={styles.activityCard}>
          <View style={[styles.statusDot, { backgroundColor: dotColor }]} />
          <Text style={styles.activityText}>
            <Text style={styles.memberName}>{item.member_name} </Text>
            {item.description} <Text style={styles.candidateName}>{item.candidate_name}</Text>
          </Text>
          <Text style={styles.timestampText}>{item.timestamp}</Text>
        </View>
      </Animated.View>
    );
  };

  const renderHeader = () => (
    <View style={styles.headerContainer}>
      <Text style={styles.headerTitle}>Activity Log</Text>
      <Text style={styles.headerSubtitle}>Full audit trail</Text>

      {/* Horizontal Filter Chips Row */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.chipsContainer}
      >
        {FILTER_CHIPS.map((chip) => {
          const isActive = selectedFilter === chip.id;
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
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyText}>No activity found</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <MonochromeBackground />

      <SafeAreaView style={styles.safeArea}>
        <FlatList
          data={filteredActivities}
          keyExtractor={(item) => item.id}
          renderItem={renderActivityCard}
          ListHeaderComponent={renderHeader}
          ListEmptyComponent={renderEmptyState}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
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
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 36,
  },
  headerContainer: {
    marginBottom: 20,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.5,
  },
  headerSubtitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#9CA3AF',
    marginTop: 4,
    marginBottom: 20,
  },
  chipsContainer: {
    gap: 8,
    paddingRight: 12,
  },
  chipButton: {
    paddingHorizontal: 16,
    paddingVertical: 9,
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
  activityCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(15, 20, 36, 0.75)',
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: 'rgba(99, 102, 241, 0.25)',
    marginBottom: 10,
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
  candidateName: {
    color: '#FFFFFF',
    fontWeight: '500',
  },
  timestampText: {
    fontSize: 12,
    color: '#6B7280',
  },
  emptyContainer: {
    paddingVertical: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    fontSize: 15,
    color: '#6B7280',
    fontWeight: '500',
  },
});
