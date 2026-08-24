import React from 'react';
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
  User,
  FileText,
  Star,
  Settings,
  Bell,
  ChevronRight,
  LogOut,
} from 'lucide-react-native';

import MonochromeBackground from '../components/landing/MonochromeBackground';

export default function ProfileScreen() {
  const navigation = useNavigation();

  const handleLogOut = () => {
    // Reset navigation stack to Landing
    navigation.reset({
      index: 0,
      routes: [{ name: 'Landing' }],
    });
  };

  return (
    <View style={styles.container}>
      <MonochromeBackground />

      <SafeAreaView style={styles.safeArea}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <Text style={styles.headerTitle}>Profile</Text>

          {/* Avatar + Identity Section */}
          <View style={styles.identitySection}>
            <View style={styles.avatarCircle}>
              <User size={40} color="#8B5CF6" />
            </View>
            <Text style={styles.userName}>Alex Morgan</Text>
            <Text style={styles.userRole}>Recruiter</Text>
          </View>

          {/* Personal Stat Cards Section */}
          <View style={styles.statsRow}>
            <Animated.View
              entering={FadeInDown.delay(100).duration(600)}
              style={styles.statCardWrapper}
            >
              <View style={styles.statCard}>
                <View style={styles.cardIconHeader}>
                  <FileText size={20} color="#A78BFA" />
                </View>
                <Text style={styles.statNumber}>156</Text>
                <Text style={styles.statLabel}>Resumes Screened</Text>
              </View>
            </Animated.View>

            <Animated.View
              entering={FadeInDown.delay(200).duration(600)}
              style={styles.statCardWrapper}
            >
              <View style={styles.statCard}>
                <View style={styles.cardIconHeader}>
                  <Star size={20} color="#F59E0B" />
                </View>
                <Text style={styles.statNumber}>24</Text>
                <Text style={styles.statLabel}>Shortlisted</Text>
              </View>
            </Animated.View>
          </View>

          {/* Settings List */}
          <Animated.View entering={FadeInUp.delay(300).duration(500)}>
            <TouchableOpacity style={styles.settingRow} activeOpacity={0.75}>
              <View style={styles.settingIconBadge}>
                <Settings size={20} color="#A78BFA" />
              </View>
              <Text style={styles.settingLabel}>Account Settings</Text>
              <ChevronRight size={18} color="#6B7280" />
            </TouchableOpacity>
          </Animated.View>

          <Animated.View entering={FadeInUp.delay(400).duration(500)}>
            <TouchableOpacity style={styles.settingRow} activeOpacity={0.75}>
              <View style={styles.settingIconBadge}>
                <Bell size={20} color="#A78BFA" />
              </View>
              <Text style={styles.settingLabel}>Notifications</Text>
              <ChevronRight size={18} color="#6B7280" />
            </TouchableOpacity>
          </Animated.View>

          {/* Log Out Button */}
          <Animated.View entering={FadeInUp.delay(500).duration(500)}>
            <TouchableOpacity
              style={styles.logOutBtn}
              activeOpacity={0.8}
              onPress={handleLogOut}
            >
              <LogOut size={20} color="#EF4444" style={styles.logOutIcon} />
              <Text style={styles.logOutText}>Log Out</Text>
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
  scrollContent: {
    paddingHorizontal: 28,
    paddingTop: 16,
    paddingBottom: 36,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.5,
    marginBottom: 20,
  },
  identitySection: {
    alignItems: 'center',
    marginBottom: 28,
  },
  avatarCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: 'rgba(15, 20, 36, 0.75)',
    borderWidth: 1,
    borderColor: 'rgba(99, 102, 241, 0.25)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
    shadowColor: '#8B5CF6',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 8,
  },
  userName: {
    fontSize: 22,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 2,
  },
  userRole: {
    fontSize: 14,
    color: '#9CA3AF',
    fontWeight: '500',
  },
  statsRow: {
    flexDirection: 'row',
    marginHorizontal: -6,
    marginBottom: 24,
  },
  statCardWrapper: {
    flex: 1,
    paddingHorizontal: 6,
  },
  statCard: {
    backgroundColor: 'rgba(15, 20, 36, 0.75)',
    borderRadius: 24,
    padding: 18,
    borderWidth: 1,
    borderColor: 'rgba(99, 102, 241, 0.25)',
  },
  cardIconHeader: {
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
  settingRow: {
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
  settingIconBadge: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: 'rgba(167, 139, 250, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  settingLabel: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  logOutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(15, 20, 36, 0.75)',
    borderRadius: 16,
    paddingVertical: 16,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.35)',
    marginTop: 14,
  },
  logOutIcon: {
    marginRight: 8,
  },
  logOutText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#EF4444',
  },
});
