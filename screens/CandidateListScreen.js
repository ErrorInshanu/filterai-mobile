import React, { useState, useMemo } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  FlatList,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeInUp, FadeIn } from 'react-native-reanimated';
import { Search, Mail, FileText, ChevronRight, Users, Sparkles, Scale, FileSpreadsheet } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';

import MonochromeBackground from '../components/landing/MonochromeBackground';
import { useAppStore } from '../store/useAppStore';

export default function CandidateListScreen() {
  const navigation = useNavigation();
  const [searchQuery, setSearchQuery] = useState('');

  // Read candidates and currentBatchId from Zustand store
  const storeCandidates = useAppStore((state) => state.candidates);
  const currentBatchId = useAppStore((state) => state.currentBatchId);


  // Defensively sort candidates by match_score descending
  const sortedCandidates = useMemo(() => {
    if (!Array.isArray(storeCandidates)) return [];
    return [...storeCandidates].sort(
      (a, b) => (b.match_score || 0) - (a.match_score || 0)
    );
  }, [storeCandidates]);

  // Filter candidates by search query (name, email, or filename)
  const filteredCandidates = useMemo(() => {
    if (!searchQuery.trim()) return sortedCandidates;
    const query = searchQuery.toLowerCase().trim();
    return sortedCandidates.filter((item) => {
      const name = (item.candidate_name || item.name || '').toLowerCase();
      const email = (item.extracted_email || item.email || '').toLowerCase();
      const fileName = (item.file_name || '').toLowerCase();
      return name.includes(query) || email.includes(query) || fileName.includes(query);
    });
  }, [searchQuery, sortedCandidates]);

  // Visual distinction for score ranges
  const getScoreBadge = (score = 0) => {
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
  };

  const handleCandidatePress = (candidate) => {
    navigation.navigate('CandidateDetail', { candidate });
  };

  const renderCandidateCard = ({ item, index }) => {
    const rawScore = typeof item.match_score === 'number' ? item.match_score : 0;
    const score = Math.min(100, Math.max(0, Math.round(rawScore)));
    const badge = getScoreBadge(score);

    // Fallback name: candidate_name -> name -> filename (without .pdf) -> "Candidate"
    const displayName =
      item.candidate_name ||
      item.name ||
      (item.file_name ? item.file_name.replace(/\.pdf$/i, '') : `Candidate #${index + 1}`);

    const email = item.extracted_email || item.email;
    const animationDelay = Math.min(index * 60, 450);

    return (
      <Animated.View entering={FadeInUp.delay(animationDelay).duration(400)}>
        <TouchableOpacity
          activeOpacity={0.85}
          onPress={() => handleCandidatePress(item)}
          style={styles.candidateCard}
        >
          {/* Card Header: Candidate Name & Match Score Badge */}
          <View style={styles.cardHeaderRow}>
            <View style={styles.nameContainer}>
              <Text style={styles.candidateName} numberOfLines={1}>
                {displayName}
              </Text>
              {item.file_name ? (
                <View style={styles.fileMetaRow}>
                  <FileText size={12} color="#6B7280" style={{ marginRight: 4 }} />
                  <Text style={styles.fileMetaText} numberOfLines={1}>
                    {item.file_name}
                  </Text>
                </View>
              ) : null}
            </View>

            {/* Score Badge Pill */}
            <View
              style={[
                styles.scorePill,
                {
                  backgroundColor: badge.bg,
                  borderColor: badge.border,
                },
              ]}
            >
              <Sparkles size={12} color={badge.text} style={{ marginRight: 4 }} />
              <Text style={[styles.scoreText, { color: badge.text }]}>
                {score}%
              </Text>
            </View>
          </View>

          {/* Match Score Progress Bar */}
          <View style={styles.progressContainer}>
            <View style={styles.progressBarTrack}>
              <View
                style={[
                  styles.progressBarFill,
                  {
                    width: `${score}%`,
                    backgroundColor: badge.bar,
                  },
                ]}
              />
            </View>
            <Text style={[styles.scoreTierText, { color: badge.text }]}>
              {badge.tier}
            </Text>
          </View>

          {/* Bottom Row: Extracted Email & Chevron */}
          <View style={styles.cardFooterRow}>
            <View style={styles.emailContainer}>
              <Mail size={13} color={email ? '#A78BFA' : '#6B7280'} style={{ marginRight: 6 }} />
              <Text style={email ? styles.emailText : styles.noEmailText} numberOfLines={1}>
                {email || 'No email found'}
              </Text>
            </View>

            <View style={styles.arrowSlot}>
              <ChevronRight size={18} color="#6366F1" />
            </View>
          </View>
        </TouchableOpacity>
      </Animated.View>
    );
  };

  const renderHeader = () => (
    <View style={styles.headerContainer}>
      <View style={styles.headerTopRow}>
        <View>
          <Text style={styles.headerTitle}>Candidates</Text>
          <Text style={styles.headerSubtitle}>
            {sortedCandidates.length} {sortedCandidates.length === 1 ? 'candidate' : 'candidates'} ranked
          </Text>
        </View>

        <View style={styles.headerButtonsRow}>
          {sortedCandidates.length > 1 && (
            <TouchableOpacity
              style={styles.compareHeaderBtn}
              activeOpacity={0.8}
              onPress={() => navigation.navigate('Comparison')}
            >
              <Scale size={15} color="#C084FC" style={{ marginRight: 6 }} />
              <Text style={styles.compareHeaderBtnText}>Compare</Text>
            </TouchableOpacity>
          )}

          {sortedCandidates.length > 0 && (
            <TouchableOpacity
              style={styles.reportHeaderBtn}
              activeOpacity={0.8}
              onPress={() =>
                navigation.navigate('Report', { batch_id: currentBatchId })
              }
            >
              <FileSpreadsheet size={15} color="#818CF8" style={{ marginRight: 6 }} />
              <Text style={styles.reportHeaderBtnText}>Report</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Search Input Bar */}
      {sortedCandidates.length > 0 && (
        <View style={styles.searchBar}>
          <Search size={18} color="#9CA3AF" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search candidates by name, email, or file..."
            placeholderTextColor="#6B7280"
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoCapitalize="none"
            autoCorrect={false}
          />
        </View>
      )}
    </View>
  );

  const renderEmptyState = () => {
    // If search had no matches
    if (sortedCandidates.length > 0 && filteredCandidates.length === 0) {
      return (
        <Animated.View entering={FadeIn.duration(300)} style={styles.emptyContainer}>
          <View style={styles.emptyIconBadge}>
            <Search size={32} color="#6366F1" />
          </View>
          <Text style={styles.emptyTitle}>No matching candidates</Text>
          <Text style={styles.emptySubtitle}>
            No candidates match your search for &ldquo;{searchQuery}&rdquo;.
          </Text>
        </Animated.View>
      );
    }

    // Default empty store state
    return (
      <Animated.View entering={FadeIn.duration(400)} style={styles.emptyContainer}>
        <View style={styles.emptyIconBadge}>
          <Users size={36} color="#6366F1" />
        </View>
        <Text style={styles.emptyTitle}>No candidates yet</Text>
        <Text style={styles.emptySubtitle}>
          Upload resumes from the Home screen to get started with AI candidate ranking.
        </Text>
        <TouchableOpacity
          style={styles.uploadCtaBtn}
          onPress={() => navigation.navigate('Home')}
          activeOpacity={0.85}
        >
          <Text style={styles.uploadCtaBtnText}>Go to Upload</Text>
        </TouchableOpacity>
      </Animated.View>
    );
  };

  return (
    <View style={styles.container}>
      <MonochromeBackground />

      <SafeAreaView style={styles.safeArea}>
        <KeyboardAvoidingView
          style={styles.keyboardView}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <FlatList
            data={filteredCandidates}
            keyExtractor={(item, index) => item.candidate_id || item.id || `cand_${index}`}
            renderItem={renderCandidateCard}
            ListHeaderComponent={renderHeader}
            ListEmptyComponent={renderEmptyState}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          />
        </KeyboardAvoidingView>
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
  keyboardView: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 36,
    flexGrow: 1,
  },
  headerContainer: {
    marginBottom: 20,
  },
  headerTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.5,
  },
  headerSubtitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#9CA3AF',
    marginTop: 2,
  },
  headerButtonsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  compareHeaderBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(167, 139, 250, 0.15)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(167, 139, 250, 0.35)',
  },
  compareHeaderBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#C084FC',
  },
  reportHeaderBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(99, 102, 241, 0.15)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(99, 102, 241, 0.35)',
  },
  reportHeaderBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#818CF8',
  },

  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(10, 14, 26, 0.85)',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: '#FFFFFF',
  },
  candidateCard: {
    backgroundColor: 'rgba(15, 20, 36, 0.75)',
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(99, 102, 241, 0.25)',
    marginBottom: 14,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 4,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  nameContainer: {
    flex: 1,
    marginRight: 12,
  },
  candidateName: {
    fontSize: 17,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  fileMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  fileMetaText: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
  },
  scorePill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    borderWidth: 1,
  },
  scoreText: {
    fontSize: 13,
    fontWeight: '800',
  },
  progressContainer: {
    marginBottom: 14,
  },
  progressBarTrack: {
    height: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 6,
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  scoreTierText: {
    fontSize: 11,
    fontWeight: '600',
    textAlign: 'right',
  },
  cardFooterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.06)',
  },
  emailContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 10,
  },
  emailText: {
    fontSize: 13,
    color: '#D1D5DB',
    fontWeight: '500',
  },
  noEmailText: {
    fontSize: 13,
    color: '#6B7280',
    fontStyle: 'italic',
  },
  arrowSlot: {
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: 24,
  },
  emptyIconBadge: {
    width: 72,
    height: 72,
    borderRadius: 24,
    backgroundColor: 'rgba(99, 102, 241, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 18,
    borderWidth: 1,
    borderColor: 'rgba(99, 102, 241, 0.3)',
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
    maxWidth: 280,
  },
  uploadCtaBtn: {
    backgroundColor: '#6366F1',
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
    shadowColor: '#6366F1',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 4,
  },
  uploadCtaBtnText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#FFFFFF',
  },
});

