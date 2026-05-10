import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  SafeAreaView, 
  ScrollView, 
  TouchableOpacity,
  RefreshControl 
} from 'react-native';

import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect } from '@react-navigation/native';
import { Upload, ArrowRight, Pill, Sparkles, TrendingUp, Lightbulb } from 'lucide-react-native';
import { fetchDashboardStats, DashboardStats, getCurrentUser, User } from '../services/api';
// NEW: Import the global settings hook
import { useSettings } from '../context/SettingsContext';

const DashboardScreen = ({ navigation }: any) => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  // NEW: Get global theme and language
  const { isDarkMode, language } = useSettings();

  const loadData = async () => {
    setLoading(true);
    try {
      // 1. Fetching both stats and user info from PostgreSQL
      const [statsData, userData] = await Promise.all([
        fetchDashboardStats(),
        getCurrentUser()
      ]);
      setStats(statsData);
      setCurrentUser(userData);
    } catch (error) {
      console.error("Failed to load dashboard data", error);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    React.useCallback(() => {
      loadData(); // Refreshes stats on screen focus
    }, [])
  );

  // Translation Helper for Greetings
  const getGreeting = () => {
    switch (language) {
      case 'Urdu': return 'صبح بخیر،';
      case 'Spanish': return 'Buenos días,';
      case 'French': return 'Bon matin,';
      case 'Arabic': return 'صباح الخير،';
      default: return 'Good morning,';
    }
  };

  const displayName = currentUser?.full_name || currentUser?.email?.split('@')[0] || 'Doctor';

  return (
    // Dynamic background color based on theme
    <View style={[styles.container, isDarkMode && { backgroundColor: '#0f172a' }]}>
      {/* Header Gradient */}
      <LinearGradient
        colors={['#6366f1', '#4f46e5']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        <SafeAreaView>
          <View style={styles.headerContent}>
            <Text style={styles.greeting}>{getGreeting()}</Text>
            <Text style={styles.username}>{displayName}</Text>
            <Text style={styles.headerSub}>
                {language === 'Urdu' ? 'آپ کا دماغی صحت کا ساتھی' : 'Your brain health companion'}
            </Text>
          </View>
        </SafeAreaView>
      </LinearGradient>

      <ScrollView 
        style={styles.content} 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
            <RefreshControl refreshing={loading} onRefresh={loadData} tintColor="#6366f1" />
        }
      >
        {/* Upload CTA */}
        <TouchableOpacity 
          style={styles.uploadCard}
          onPress={() => navigation.navigate('Upload')}
          activeOpacity={0.9}
        >
          <LinearGradient
            colors={['#6366f1', '#818cf8']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.uploadGradient}
          >
            <View style={styles.uploadContent}>
              <View style={styles.iconBox}>
                <Upload size={24} color="#6366f1" />
              </View>
              <View style={styles.uploadTextContainer}>
                <Text style={styles.uploadTitle}>
                    {language === 'Urdu' ? 'نیا ای ای جی تجزیہ کریں' : 'Analyze New EEG'}
                </Text>
                <Text style={styles.uploadSub}>Upload your recording</Text>
              </View>
              <ArrowRight size={20} color="#fff" />
            </View>
          </LinearGradient>
        </TouchableOpacity>

        {/* Reminder Card */}
        <View style={[
            styles.reminderCard, 
            isDarkMode && { backgroundColor: '#1e293b', borderColor: '#334155' }
        ]}>
          <View style={styles.reminderIconBox}>
            <Pill size={20} color="#f59e0b" />
          </View>
          <View style={styles.reminderContent}>
            <Text style={[styles.reminderTitle, isDarkMode && { color: '#fff' }]}>Daily Reminder</Text>
            <Text style={styles.reminderText}>Log your medication in your diary.</Text>
          </View>
          <TouchableOpacity onPress={() => navigation.navigate('Diary')}>
            <Text style={styles.logNowText}>Log now</Text>
          </TouchableOpacity>
        </View>

        {/* Latest Analysis Section */}
        {stats?.latestResult && (
          <View style={[styles.sectionCard, isDarkMode && { backgroundColor: '#1e293b' }]}>
            <View style={styles.cardHeader}>
              <View style={styles.cardHeaderLeft}>
                <Sparkles size={16} color="#6366f1" />
                <Text style={[styles.cardTitle, isDarkMode && { color: '#fff' }]}>Latest Analysis</Text>
              </View>
              <Text style={styles.cardDate}>
                {stats.latestResult.created_at ? new Date(stats.latestResult.created_at).toLocaleDateString() : (stats.latestResult.date || "Today")}
              </Text>
            </View>

            {/* Mini Mock EEG Visualization */}
            <View style={[styles.miniEEG, isDarkMode && { backgroundColor: '#0f172a' }]}>
              <View style={styles.waveformPath} />
              <View style={[styles.waveformPath, { left: 40, height: 20 }]} />
              <View style={[styles.waveformPath, { left: 80, height: 35, borderColor: '#f43f5e' }]} />
              <View style={[styles.waveformPath, { left: 120, height: 15 }]} />
            </View>

            <TouchableOpacity 
              style={styles.resultRow}
              onPress={() => navigation.navigate('Result', { result: stats.latestResult })}
            >
              <View>
                <Text style={[styles.resultType, isDarkMode && { color: '#fff' }]}>
                  {stats.latestResult.classification_result || stats.latestResult.type || "Normal Activity"}
                </Text>
                <Text style={styles.resultLabel}>Classification result</Text>
              </View>
              <View style={styles.confidenceBadge}>
                <Text style={styles.confidenceText}>
                  {(stats.latestResult.confidence_score || stats.latestResult.confidence || 0).toFixed(1)}%
                </Text>
              </View>
            </TouchableOpacity>
          </View>
        )}

        {/* Stats Grid */}
        <View style={styles.statsGrid}>
          <View style={[styles.statCard, isDarkMode && { backgroundColor: '#1e293b' }]}>
            <View style={styles.statHeader}>
              <Text style={styles.statNumber}>{stats?.totalAnalyses || 0}</Text>
              <Lightbulb size={16} color="#6366f1" />
            </View>
            <Text style={styles.statLabel}>Total Analyses</Text>
          </View>

          <View style={[styles.statCard, isDarkMode && { backgroundColor: '#1e293b' }]}>
            <View style={styles.statHeader}>
              <Text style={[styles.statNumber, { color: '#06b6d4' }]}>{stats?.monthlyAnalyses || 0}</Text>
              <View style={styles.trendBadge}>
                <TrendingUp size={12} color="#06b6d4" />
                <Text style={styles.trendText}>+{stats?.trend || 0}</Text>
              </View>
            </View>
            <Text style={styles.statLabel}>This Month</Text>
          </View>
        </View>

      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    paddingTop: 60,
    paddingBottom: 40,
    paddingHorizontal: 24,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  headerContent: {
    marginBottom: 20,
  },
  greeting: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 14,
    fontWeight: '500',
  },
  username: {
    color: '#ffffff',
    fontSize: 28,
    fontWeight: 'bold',
    marginVertical: 4,
  },
  headerSub: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 14,
  },
  content: {
    flex: 1,
    marginTop: -30,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 100,
  },
  uploadCard: {
    marginBottom: 16,
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#6366f1',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 8,
  },
  uploadGradient: {
    padding: 24,
  },
  uploadContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconBox: {
    width: 48,
    height: 48,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  uploadTextContainer: {
    flex: 1,
  },
  uploadTitle: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  uploadSub: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 14,
  },
  reminderCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fffbeb', 
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.2)',
    padding: 16,
    borderRadius: 16,
    marginBottom: 16,
  },
  reminderIconBox: {
    width: 36,
    height: 36,
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  reminderContent: {
    flex: 1,
  },
  reminderTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1e293b',
  },
  reminderText: {
    fontSize: 12,
    color: '#64748b',
  },
  logNowText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#d97706',
  },
  sectionCard: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  cardHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
  },
  cardDate: {
    fontSize: 12,
    color: '#94a3b8',
  },
  miniEEG: {
    height: 40,
    backgroundColor: '#f1f5f9',
    borderRadius: 8,
    marginBottom: 16,
    position: 'relative',
    overflow: 'hidden',
  },
  waveformPath: {
    position: 'absolute',
    bottom: 10,
    left: 10,
    width: 20,
    height: 20,
    borderTopWidth: 2,
    borderRightWidth: 2,
    borderColor: '#6366f1',
    transform: [{ rotate: '45deg' }],
  },
  resultRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  resultType: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1e293b',
  },
  resultLabel: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 2,
  },
  confidenceBadge: {
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  confidenceText: {
    color: '#059669',
    fontWeight: 'bold',
    fontSize: 14,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  statHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#6366f1',
  },
  statLabel: {
    fontSize: 12,
    color: '#64748b',
  },
  trendBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(6, 182, 212, 0.1)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 12,
    gap: 2,
  },
  trendText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#06b6d4',
  },
});

export default DashboardScreen;