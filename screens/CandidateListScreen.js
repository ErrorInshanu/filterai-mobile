import React, { useState, useMemo, useRef } from 'react';
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
import Animated, { FadeInUp } from 'react-native-reanimated';
import Swipeable from 'react-native-gesture-handler/Swipeable';
import { Search, Star, Scale } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';

import MonochromeBackground from '../components/landing/MonochromeBackground';

const INITIAL_CANDIDATES = [
  {
    id: '1',
    candidate_name: 'Sarah Chen',
    match_score: 94,
    summary: 'Strong full-stack background with 6 years in React and Node, led two production launches.',
    shortlisted: false,
  },
  {
    id: '2',
    candidate_name: 'Marcus Johnson',
    match_score: 88,
    summary: 'Senior Backend Engineer with extensive Python, FastAPI, and PostgreSQL architecture experience.',
    shortlisted: false,
  },
  {
    id: '3',
    candidate_name: 'Priya Patel',
    match_score: 92,
    summary: 'AI/ML specialist with 4 years building PyTorch NLP models and vector search systems.',
    shortlisted: false,
  },
  {
    id: '4',
    candidate_name: 'David Kim',
    match_score: 85,
    summary: 'Frontend lead specializing in React Native, Expo, and performance optimization.',
    shortlisted: false,
  },
  {
    id: '5',
    candidate_name: 'Elena Rostova',
    match_score: 78,
    summary: 'Full-stack developer with solid TypeScript and GraphQL experience across mobile and web.',
    shortlisted: false,
  },
  {
    id: '6',
    candidate_name: 'Alex Rivera',
    match_score: 74,
    summary: 'Backend developer focused on Microservices, Docker, and REST API design.',
    shortlisted: false,
  },
  {
    id: '7',
    candidate_name: 'Jordan Taylor',
    match_score: 81,
    summary: 'Product engineer with 5 years in React Native, Zustand state management, and Tailwind.',
    shortlisted: false,
  },
  {
    id: '8',
    candidate_name: 'Samantha Wu',
    match_score: 96,
    summary: 'Principal Software Engineer with deep expertise in distributed systems and AI infrastructure.',
    shortlisted: false,
  },
  {
    id: '9',
    candidate_name: 'Michael Brown',
    match_score: 68,
    summary: 'Junior developer with basic React experience, transitioning from frontend web to mobile.',
    shortlisted: false,
  },
  {
    id: '10',
    candidate_name: 'Aisha Khan',
    match_score: 89,
    summary: 'Senior Mobile Architect with published iOS and Android apps using React Native.',
    shortlisted: false,
  },
  {
    id: '11',
    candidate_name: 'Carlos Gomez',
    match_score: 72,
    summary: 'DevOps & Cloud Engineer with AWS, Kubernetes, and FastAPI deployment expertise.',
    shortlisted: false,
  },
  {
    id: '12',
    candidate_name: 'Emily Watson',
    match_score: 63,
    summary: 'Data analyst with Python scripting background, looking for junior ML engineer roles.',
    shortlisted: false,
  },
  {
    id: '13',
    candidate_name: 'Liam O\'Connor',
    match_score: 86,
    summary: 'Full-stack engineer with strong background in PyMuPDF, LangChain, and vector databases.',
    shortlisted: false,
  },
  {
    id: '14',
    candidate_name: 'Nina Sharma',
    match_score: 91,
    summary: 'AI Application Developer with proven track record integrating LLM APIs and RAG pipelines.',
    shortlisted: false,
  },
  {
    id: '15',
    candidate_name: 'James Wilson',
    match_score: 65,
    summary: 'QA Automation Engineer with Python testing experience, limited direct mobile development.',
    shortlisted: false,
  },
  {
    id: '16',
    candidate_name: 'Maya Lin',
    match_score: 97,
    summary: 'Senior Staff Engineer with 8+ years across React Native, Node.js, and AI systems.',
    shortlisted: false,
  },
  {
    id: '17',
    candidate_name: 'Vikram Malhotra',
    match_score: 83,
    summary: 'Mobile engineer with expertise in Expo Router, Reanimated, and native iOS modules.',
    shortlisted: false,
  },
  {
    id: '18',
    candidate_name: 'Hannah Schmidt',
    match_score: 67,
    summary: 'Web developer proficient in HTML/CSS and JavaScript, beginner in React Native.',
    shortlisted: false,
  },
  {
    id: '19',
    candidate_name: 'Rohan Gupta',
    match_score: 90,
    summary: 'Backend engineer specialized in Python, MongoDB, and high-concurrency API services.',
    shortlisted: false,
  },
  {
    id: '20',
    candidate_name: 'Chloe Bennett',
    match_score: 79,
    summary: 'UI/UX focused Mobile Developer with strong React Native styling and component architecture skills.',
    shortlisted: false,
  },
];

export default function CandidateListScreen() {
  const navigation = useNavigation();
  const [searchQuery, setSearchQuery] = useState('');
  const [candidates, setCandidates] = useState(INITIAL_CANDIDATES);
  const swipeableRefs = useRef({});

  const filteredCandidates = useMemo(() => {
    if (!searchQuery.trim()) return candidates;
    const query = searchQuery.toLowerCase().trim();
    return candidates.filter((item) =>
      item.candidate_name.toLowerCase().includes(query)
    );
  }, [searchQuery, candidates]);

  const toggleShortlist = (id) => {
    setCandidates((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, shortlisted: !item.shortlisted } : item
      )
    );
    if (swipeableRefs.current[id]) {
      swipeableRefs.current[id].close();
    }
  };

  const getScoreBadgeStyle = (score) => {
    if (score >= 85) {
      return {
        bg: 'rgba(16, 185, 129, 0.15)',
        text: '#10B981',
        border: 'rgba(16, 185, 129, 0.3)',
      };
    } else if (score >= 70) {
      return {
        bg: 'rgba(139, 92, 246, 0.15)',
        text: '#A78BFA',
        border: 'rgba(139, 92, 246, 0.3)',
      };
    } else {
      return {
        bg: 'rgba(107, 114, 128, 0.15)',
        text: '#9CA3AF',
        border: 'rgba(107, 114, 128, 0.3)',
      };
    }
  };

  const renderRightActions = (item) => {
    return (
      <TouchableOpacity
        style={styles.rightActionBtn}
        onPress={() => toggleShortlist(item.id)}
        activeOpacity={0.8}
      >
        <Star
          size={22}
          color="#FFFFFF"
          fill={item.shortlisted ? '#FFFFFF' : 'none'}
        />
        <Text style={styles.rightActionText}>
          {item.shortlisted ? 'Unstar' : 'Shortlist'}
        </Text>
      </TouchableOpacity>
    );
  };

  const renderCandidateCard = ({ item, index }) => {
    const badge = getScoreBadgeStyle(item.match_score);
    // Cap staggered delay to 450ms max
    const animationDelay = Math.min(index * 60, 450);

    return (
      <Animated.View entering={FadeInUp.delay(animationDelay).duration(500)}>
        <Swipeable
          ref={(ref) => (swipeableRefs.current[item.id] = ref)}
          renderRightActions={() => renderRightActions(item)}
          onSwipeableOpen={() => toggleShortlist(item.id)}
          friction={2}
          rightThreshold={40}
        >
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={() => navigation.navigate('CandidateDetail', { candidate: item })}
            style={[
              styles.candidateCard,
              item.shortlisted && styles.candidateCardShortlisted,
            ]}
          >
            <View style={styles.cardHeaderRow}>
              <View style={styles.nameRow}>
                {item.shortlisted && (
                  <View style={styles.starBadge}>
                    <Star size={16} color="#A78BFA" fill="#A78BFA" />
                  </View>
                )}
                <Text style={styles.candidateName}>{item.candidate_name}</Text>
              </View>

              {/* Match Score Pill Badge */}
              <View
                style={[
                  styles.scorePill,
                  {
                    backgroundColor: badge.bg,
                    borderColor: badge.border,
                  },
                ]}
              >
                <Text style={[styles.scoreText, { color: badge.text }]}>
                  {item.match_score}% Match
                </Text>
              </View>
            </View>

            {/* Summary */}
            <Text style={styles.summaryText} numberOfLines={2}>
              {item.summary}
            </Text>
          </TouchableOpacity>
        </Swipeable>
      </Animated.View>
    );
  };

  const renderHeader = () => (
    <View style={styles.headerContainer}>
      <View style={styles.headerTopRow}>
        <View>
          <Text style={styles.headerTitle}>Candidates</Text>
          <Text style={styles.headerSubtitle}>
            {filteredCandidates.length} candidates ranked
          </Text>
        </View>

        <TouchableOpacity
          style={styles.compareHeaderBtn}
          activeOpacity={0.8}
          onPress={() => navigation.navigate('Comparison')}
        >
          <Scale size={16} color="#C084FC" style={{ marginRight: 6 }} />
          <Text style={styles.compareHeaderBtnText}>Compare (3)</Text>
        </TouchableOpacity>
      </View>

      {/* Search Input Bar */}
      <View style={styles.searchBar}>
        <Search size={20} color="#9CA3AF" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search candidates..."
          placeholderTextColor="#6B7280"
          value={searchQuery}
          onChangeText={setSearchQuery}
          autoCapitalize="none"
          autoCorrect={false}
        />
      </View>
    </View>
  );

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
            keyExtractor={(item) => item.id}
            renderItem={renderCandidateCard}
            ListHeaderComponent={renderHeader}
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
  compareHeaderBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(167, 139, 250, 0.15)',
    paddingHorizontal: 14,
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
    marginTop: 2,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(10, 14, 26, 0.85)',
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: '#FFFFFF',
  },
  candidateCard: {
    backgroundColor: 'rgba(15, 20, 36, 0.75)',
    borderRadius: 24,
    padding: 18,
    borderWidth: 1,
    borderColor: 'rgba(99, 102, 241, 0.25)',
    marginBottom: 12,
  },
  candidateCardShortlisted: {
    borderColor: 'rgba(167, 139, 250, 0.55)',
    backgroundColor: 'rgba(22, 26, 52, 0.85)',
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 10,
  },
  starBadge: {
    marginRight: 8,
  },
  candidateName: {
    fontSize: 17,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  scorePill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
  },
  scoreText: {
    fontSize: 12,
    fontWeight: '700',
  },
  summaryText: {
    fontSize: 13,
    color: '#9CA3AF',
    lineHeight: 18,
  },
  rightActionBtn: {
    backgroundColor: '#6366F1',
    justifyContent: 'center',
    alignItems: 'center',
    width: 90,
    borderRadius: 24,
    marginBottom: 12,
    marginLeft: 8,
  },
  rightActionText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
    marginTop: 4,
  },
});
