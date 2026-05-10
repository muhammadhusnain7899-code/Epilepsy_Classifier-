import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  SafeAreaView, 
  FlatList, 
  TouchableOpacity,
  Modal,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  RefreshControl,
  ActivityIndicator
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect } from '@react-navigation/native';
import { Plus, Zap, Pill, Moon, AlertTriangle, Calendar, X, BookOpen } from 'lucide-react-native';
// NEW: Import the global settings hook
import { useSettings } from '../context/SettingsContext';
import CustomButton from '../components/CustomButton';
import { fetchDiaryEntries, addDiaryEntry, DiaryEntry } from '../services/api';

const DiaryScreen = () => {
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedType, setSelectedType] = useState<"seizure" | "medication" | "trigger" | "sleep" | null>(null);
  const [description, setDescription] = useState('');
  const [entries, setEntries] = useState<DiaryEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // GLOBAL SETTINGS: Listen to theme and language changes
  const { isDarkMode, language } = useSettings();

  // Load data on mount
  useEffect(() => {
    loadEntries();
  }, []);

  const loadEntries = async () => {
    setLoading(true);
    try {
      // Calls GET /diary
      const data = await fetchDiaryEntries();
      setEntries(data || []);
    } catch (e: any) {
      console.error("Load error:", e.message);
      if (e.response?.status === 404) {
        Alert.alert("Server Error", "The /diary route was not found on the server.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!selectedType || !description.trim()) {
        Alert.alert("Missing Info", "Please select a type and add a description.");
        return;
    }

    setSaving(true);
    
    // Formatting data for the PostgreSQL backend
    const newEntry = {
        type: selectedType,
        title: `${selectedType.charAt(0).toUpperCase() + selectedType.slice(1)} Event`,
        description: description,
        date: new Date().toISOString().split('T')[0],
        time: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})
    };

    try {
        // Calls POST /diary
        const savedEntry = await addDiaryEntry(newEntry);
        
        // Syncing local state with database UUID
        setEntries([savedEntry, ...entries]); 
        setModalVisible(false);
        resetForm();
    } catch (e: any) {
        console.error("Save error:", e.message);
        Alert.alert("Error", "Could not save entry.");
    } finally {
        setSaving(false);
    }
  };

  const resetForm = () => {
      setSelectedType(null);
      setDescription('');
  };

  // Helper for dynamic colors in dark mode
  const getIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case 'seizure': return <Zap size={16} color="#d97706" />;
      case 'medication': return <Pill size={16} color="#6366f1" />;
      case 'trigger': return <AlertTriangle size={16} color="#ef4444" />;
      case 'sleep': return <Moon size={16} color="#8b5cf6" />;
      default: return <Zap size={16} color="#64748b" />;
    }
  };

  const getBgColor = (type: string) => {
    switch (type.toLowerCase()) {
      case 'seizure': return 'rgba(245, 158, 11, 0.15)';
      case 'medication': return 'rgba(99, 102, 241, 0.15)';
      case 'trigger': return 'rgba(239, 68, 68, 0.15)';
      case 'sleep': return 'rgba(139, 92, 246, 0.15)';
      default: return isDarkMode ? '#334155' : '#f1f5f9';
    }
  };

  const renderEntry = ({ item }: { item: DiaryEntry }) => (
    <View style={[styles.card, isDarkMode && { backgroundColor: '#1e293b' }]}>
      <View style={[styles.iconBox, { backgroundColor: getBgColor(item.type) }]}>
        {getIcon(item.type)}
      </View>
      <View style={styles.entryContent}>
        <View style={styles.entryHeader}>
          <Text style={[styles.entryTitle, isDarkMode && { color: '#ffffff' }]}>{item.title}</Text>
          <Text style={styles.entryTime}>{item.time}</Text>
        </View>
        <Text style={[styles.entryDesc, isDarkMode && { color: '#cbd5e1' }]}>{item.description}</Text>
        <View style={styles.dateRow}>
          <Calendar size={12} color="#94a3b8" />
          <Text style={styles.dateText}>{item.date}</Text>
        </View>
      </View>
    </View>
  );

  return (
    <View style={[styles.container, isDarkMode && { backgroundColor: '#0f172a' }]}>
      <LinearGradient
        colors={['#6366f1', '#4f46e5']}
        style={styles.header}
      >
        <SafeAreaView style={styles.headerSafe}>
          <View style={styles.headerRow}>
            <View>
              <Text style={styles.headerTitle}>
                  {language === 'Urdu' ? 'ڈائری' : 'Seizure Diary'}
              </Text>
              <Text style={styles.headerSub}>
                  {language === 'Urdu' ? 'صحت کے واقعات ٹریک کریں' : 'Track daily health events'}
              </Text>
            </View>
            <TouchableOpacity 
              style={styles.addBtn} 
              onPress={() => setModalVisible(true)}
            >
              <Plus size={20} color="#fff" />
              <Text style={styles.addBtnText}>Add</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </LinearGradient>

      <View style={styles.content}>
        {/* Quick Log Row */}
        <View style={[styles.quickLogCard, isDarkMode && { backgroundColor: '#1e293b' }]}>
            <Text style={[styles.sectionTitle, isDarkMode && { color: '#ffffff' }]}>Quick Log</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.quickRow}>
                {['Seizure', 'Medication', 'Trigger', 'Sleep'].map((item) => (
                    <TouchableOpacity 
                        key={item} 
                        style={[styles.chip, isDarkMode && { backgroundColor: '#334155' }]} 
                        onPress={() => {
                            setSelectedType(item.toLowerCase() as any);
                            setModalVisible(true);
                        }}
                    >
                        <Text style={[styles.chipText, isDarkMode && { color: '#cbd5e1' }]}>{item}</Text>
                    </TouchableOpacity>
                ))}
            </ScrollView>
        </View>

        <Text style={[
            styles.sectionTitle, 
            { marginLeft: 20, marginBottom: 10 },
            isDarkMode && { color: '#94a3b8' }
        ]}>
            {language === 'Urdu' ? 'حالیہ اندراجات' : 'Recent Entries'}
        </Text>
        
        {loading && entries.length === 0 ? (
          <ActivityIndicator size="large" color="#6366f1" style={{ marginTop: 50 }} />
        ) : (
          <FlatList
            data={entries}
            renderItem={renderEntry}
            keyExtractor={item => item.id.toString()}
            contentContainerStyle={styles.list}
            refreshControl={
              <RefreshControl refreshing={loading} onRefresh={loadEntries} tintColor="#6366f1" />
            }
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <BookOpen size={48} color="#cbd5e1" />
                <Text style={[styles.emptyTitle, isDarkMode && { color: '#ffffff' }]}>Empty Diary</Text>
                <Text style={styles.emptySubtitle}>Log your medications or seizure events to monitor patterns.</Text>
              </View>
            }
          />
        )}
      </View>

      {/* Modal for New Entry */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <KeyboardAvoidingView 
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            style={styles.modalOverlay}
        >
          <View style={[styles.modalContent, isDarkMode && { backgroundColor: '#1e293b' }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, isDarkMode && { color: '#ffffff' }]}>New Diary Entry</Text>
              <TouchableOpacity onPress={() => {
                  setModalVisible(false);
                  resetForm();
              }}>
                <X size={24} color={isDarkMode ? "#cbd5e1" : "#64748b"} />
              </TouchableOpacity>
            </View>

            <View style={styles.modalForm}>
              <Text style={[styles.label, isDarkMode && { color: '#94a3b8' }]}>Event Type</Text>
              <View style={styles.typeGrid}>
                {['Seizure', 'Medication', 'Trigger', 'Sleep'].map((type) => (
                    <TouchableOpacity 
                        key={type} 
                        style={[
                            styles.typeBtn, 
                            isDarkMode && { borderColor: '#334155' },
                            selectedType === type.toLowerCase() && styles.typeBtnActive
                        ]}
                        onPress={() => setSelectedType(type.toLowerCase() as any)}
                    >
                        <Text style={[
                            styles.typeText, 
                            isDarkMode && { color: '#94a3b8' },
                            selectedType === type.toLowerCase() && styles.typeTextActive
                        ]}>{type}</Text>
                    </TouchableOpacity>
                ))}
              </View>

              <Text style={[styles.label, isDarkMode && { color: '#94a3b8' }]}>Description</Text>
              <TextInput 
                style={[
                    styles.input, 
                    isDarkMode && { borderColor: '#334155', color: '#fff', backgroundColor: '#0f172a' }
                ]} 
                placeholder="What happened? e.g. 'Took 500mg Keppra'"
                placeholderTextColor={isDarkMode ? "#475569" : "#94a3b8"}
                multiline
                numberOfLines={3}
                value={description}
                onChangeText={setDescription}
              />

              <CustomButton 
                title="Save Entry" 
                onPress={handleSave} 
                isLoading={saving}
              />
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  header: { paddingTop: 60, paddingBottom: 20, paddingHorizontal: 24 },
  headerSafe: {},
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  headerTitle: { fontSize: 24, fontWeight: 'bold', color: '#fff' },
  headerSub: { fontSize: 14, color: 'rgba(255,255,255,0.8)', marginTop: 4 },
  addBtn: { flexDirection: 'row', backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, alignItems: 'center', gap: 4 },
  addBtnText: { color: '#fff', fontWeight: '600', fontSize: 14 },
  content: { flex: 1 },
  quickLogCard: { backgroundColor: '#fff', padding: 16, margin: 20, borderRadius: 16, elevation: 2 },
  sectionTitle: { fontSize: 14, fontWeight: '600', color: '#1e293b', marginBottom: 10 },
  quickRow: { flexDirection: 'row' },
  chip: { backgroundColor: '#f1f5f9', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, marginRight: 8 },
  chipText: { fontSize: 12, color: '#475569', fontWeight: '500' },
  list: { paddingHorizontal: 20, paddingBottom: 20 },
  card: { backgroundColor: '#fff', padding: 16, borderRadius: 16, marginBottom: 12, flexDirection: 'row', elevation: 1 },
  iconBox: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  entryContent: { flex: 1 },
  entryHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  entryTitle: { fontSize: 14, fontWeight: '600', color: '#0f172a' },
  entryTime: { fontSize: 12, color: '#94a3b8' },
  entryDesc: { fontSize: 13, color: '#64748b', marginBottom: 6 },
  dateRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  dateText: { fontSize: 11, color: '#94a3b8' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, minHeight: 450 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  modalTitle: { fontSize: 20, fontWeight: 'bold', color: '#1e293b' },
  modalForm: { gap: 16 },
  label: { fontSize: 14, fontWeight: '600', color: '#475569' },
  typeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  typeBtn: { width: '48%', padding: 12, borderRadius: 12, borderWidth: 1, borderColor: '#e2e8f0', alignItems: 'center' },
  typeBtnActive: { borderColor: '#6366f1', backgroundColor: 'rgba(99, 102, 241, 0.05)' },
  typeText: { fontSize: 14, color: '#64748b' },
  typeTextActive: { color: '#6366f1', fontWeight: '600' },
  input: { borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 12, padding: 12, height: 100, textAlignVertical: 'top', marginBottom: 16 },
  emptyContainer: { alignItems: 'center', marginTop: 80, paddingHorizontal: 40 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: '#1e293b', marginTop: 16 },
  emptySubtitle: { fontSize: 14, color: '#64748b', textAlign: 'center', marginTop: 8, lineHeight: 20 },
});

export default DiaryScreen;