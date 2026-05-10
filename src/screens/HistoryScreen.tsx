import React, { useEffect, useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  SafeAreaView, 
  FlatList, 
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl 
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { ChevronRight, Filter, Calendar, BarChart3, Clock } from 'lucide-react-native';
import { fetchHistory, EEGResult } from '../services/api';
// NEW: Import the global settings hook
import { useSettings } from '../context/SettingsContext';

const HistoryScreen = ({ navigation }: any) => {
  const [results, setResults] = useState<EEGResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // GLOBAL SETTINGS: Listen to theme and language changes
  const { isDarkMode, language } = useSettings();

  // Function to load data from PostgreSQL
  const loadHistory = async () => {
    try {
      const data = await fetchHistory();
      setResults(data || []);
    } catch (error) {
      console.error("Fetch history failed:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadHistory();
  }, []);

  // Triggers when user pulls the list down
  const onRefresh = () => {
    setRefreshing(true);
    loadHistory();
  };

  const renderItem = ({ item }: { item: EEGResult }) => (
    <TouchableOpacity 
      style={[
        styles.historyCard, 
        isDarkMode && { backgroundColor: '#1e293b', borderColor: '#334155' } // Dark Mode card style
      ]}
      onPress={() => navigation.navigate('Result', { result: item })}
    >
      <View style={styles.cardInfo}>
        <View style={styles.titleRow}>
          <Clock size={16} color="#6366f1" style={{ marginRight: 6 }} />
          <Text style={[styles.resultType, isDarkMode && { color: '#ffffff' }]}>
            {/* Maps PostgreSQL names to UI */}
            {item.classification_result || item.type || "Analysis Complete"}
          </Text>
        </View>
        <Text style={[styles.fileName, isDarkMode && { color: '#94a3b8' }]} numberOfLines={1}>
          {item.file_name || item.fileName || "unknown_file.csv"}
        </Text>
      </View>

      <View style={styles.cardMeta}>
        <View style={[styles.badge, styles.badgeHigh]}>
          <Text style={[styles.badgeText, styles.textHigh]}>
            {(item.confidence_score || item.confidence || 0).toFixed(1)}%
          </Text>
        </View>
        <Text style={styles.dateText}>
          {/* Formats standard ISO timestamp from PostgreSQL */}
          {item.created_at ? new Date(item.created_at).toLocaleDateString() : (item.date || "Recent")}
        </Text>
      </View>
      <ChevronRight size={18} color={isDarkMode ? "#64748b" : "#cbd5e1"} style={{ marginLeft: 8 }} />
    </TouchableOpacity>
  );

  return (
    <View style={[styles.container, isDarkMode && { backgroundColor: '#0f172a' }]}>
      <LinearGradient
        colors={['#6366f1', '#4f46e5']}
        style={styles.header}
      >
        <SafeAreaView>
          <Text style={styles.headerTitle}>
            {language === 'Urdu' ? 'تجزیہ کی تاریخ' : 'Analysis History'}
          </Text>
          <Text style={styles.headerSub}>
            {language === 'Urdu' ? 'آپ کے ای ای جی تجزیہ کی ٹائم لائن' : 'Your EEG analysis timeline'}
          </Text>
        </SafeAreaView>
      </LinearGradient>

      <View style={styles.content}>
        {/* Stats Summary - Now dynamic based on theme */}
        <View style={[styles.statsCard, isDarkMode && { backgroundColor: '#1e293b' }]}>
          <View style={styles.statItem}>
            <Text style={[styles.statNum, { color: '#6366f1' }]}>{results.length}</Text>
            <Text style={[styles.statLabel, isDarkMode && { color: '#94a3b8' }]}>Total</Text>
          </View>
          <View style={[styles.divider, isDarkMode && { backgroundColor: '#334155' }]} />
          <View style={styles.statItem}>
            <Text style={[styles.statNum, { color: '#f59e0b' }]}>
              {results.filter(r => r.created_at && new Date(r.created_at).getMonth() === new Date().getMonth()).length}
            </Text>
            <Text style={[styles.statLabel, isDarkMode && { color: '#94a3b8' }]}>Month</Text>
          </View>
          <View style={[styles.divider, isDarkMode && { backgroundColor: '#334155' }]} />
          <View style={styles.statItem}>
            <Text style={[styles.statNum, { color: '#10b981' }]}>
              {results.length > 0 
                ? (results.reduce((acc, curr) => acc + (curr.confidence_score || curr.confidence || 0), 0) / results.length).toFixed(0)
                : 0}%
            </Text>
            <Text style={[styles.statLabel, isDarkMode && { color: '#94a3b8' }]}>Avg Conf.</Text>
          </View>
        </View>

        {/* Filters - Updated for Dark Mode */}
        <View style={styles.filterRow}>
          <TouchableOpacity style={[styles.filterBtn, isDarkMode && { backgroundColor: '#1e293b', borderColor: '#334155' }]}>
            <Filter size={14} color={isDarkMode ? "#cbd5e1" : "#0f172a"} />
            <Text style={[styles.filterText, isDarkMode && { color: '#cbd5e1' }]}>Filter</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.filterBtn, isDarkMode && { backgroundColor: '#1e293b', borderColor: '#334155' }]}>
            <Calendar size={14} color={isDarkMode ? "#cbd5e1" : "#0f172a"} />
            <Text style={[styles.filterText, isDarkMode && { color: '#cbd5e1' }]}>Date Range</Text>
          </TouchableOpacity>
        </View>

        {loading && !refreshing ? (
          <ActivityIndicator size="large" color="#6366f1" style={{ marginTop: 50 }} />
        ) : (
          <FlatList
            data={results}
            renderItem={renderItem}
            keyExtractor={item => item.id.toString()}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#6366f1" />
            }
            ListEmptyComponent={
              <View style={{ alignItems: 'center', marginTop: 40 }}>
                <BarChart3 size={40} color={isDarkMode ? "#475569" : "#cbd5e1"} />
                <Text style={{ color: '#94a3b8', marginTop: 12 }}>No records found in database.</Text>
              </View>
            }
          />
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  header: { paddingTop: 60, paddingBottom: 40, paddingHorizontal: 24, borderBottomLeftRadius: 30, borderBottomRightRadius: 30 },
  headerTitle: { fontSize: 24, fontWeight: 'bold', color: '#fff' },
  headerSub: { fontSize: 14, color: 'rgba(255,255,255,0.8)', marginTop: 4 },
  content: { flex: 1, marginTop: -30 },
  statsCard: { flexDirection: 'row', backgroundColor: '#fff', marginHorizontal: 20, padding: 16, borderRadius: 20, shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 15, elevation: 4, justifyContent: 'space-between', marginBottom: 20 },
  statItem: { alignItems: 'center', flex: 1 },
  statNum: { fontSize: 20, fontWeight: 'bold' },
  statLabel: { fontSize: 11, color: '#64748b', marginTop: 2, textTransform: 'uppercase', letterSpacing: 0.5 },
  divider: { width: 1, height: '80%', backgroundColor: '#f1f5f9', alignSelf: 'center' },
  filterRow: { flexDirection: 'row', marginHorizontal: 20, marginBottom: 16, gap: 10 },
  filterBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderWidth: 1, borderColor: '#e2e8f0', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10, gap: 8 },
  filterText: { fontSize: 13, fontWeight: '500', color: '#334155' },
  listContent: { paddingHorizontal: 20, paddingBottom: 30 },
  historyCard: { backgroundColor: '#fff', borderRadius: 16, padding: 16, marginBottom: 12, flexDirection: 'row', alignItems: 'center', elevation: 2, borderWidth: 1, borderColor: '#f1f5f9' },
  cardInfo: { flex: 1 },
  titleRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
  resultType: { fontSize: 15, fontWeight: '700', color: '#0f172a' },
  fileName: { fontSize: 12, color: '#64748b', marginLeft: 22 },
  cardMeta: { alignItems: 'flex-end', justifyContent: 'center' },
  badge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, marginBottom: 4 },
  badgeHigh: { backgroundColor: 'rgba(16, 185, 129, 0.1)' },
  badgeText: { fontSize: 11, fontWeight: 'bold' },
  textHigh: { color: '#059669' },
  dateText: { fontSize: 11, color: '#94a3b8', fontWeight: '500' },
});

export default HistoryScreen;