import React, { useEffect, useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  SafeAreaView, 
  TouchableOpacity, 
  Alert, 
  ActivityIndicator,
  ScrollView,
  Modal, 
  Pressable,
  Switch 
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
// IMPORTANT: Import your new context hook
import { useSettings } from '../context/SettingsContext';
import { 
  LogOut, 
  ChevronRight, 
  User as UserIcon, 
  Settings, 
  Shield, 
  X, 
  Mail, 
  Calendar, 
  Moon, 
  Globe 
} from 'lucide-react-native';
import { logoutUser, getCurrentUser, User } from '../services/api';

const ProfileScreen = ({ navigation }: any) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  
  // GLOBAL SETTINGS: Replaces local useState
  const { isDarkMode, toggleDarkMode, language, changeLanguage } = useSettings();
  
  const [accountModal, setAccountModal] = useState(false);
  const [languageModal, setLanguageModal] = useState(false);

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const userData = await getCurrentUser();
        setUser(userData);
      } catch (error) {
        console.error("Profile load error:", error);
      } finally {
        setLoading(false);
      }
    };
    loadProfile();
  }, []);

  const handleLogout = async () => {
    Alert.alert(
      "Logout",
      "Are you sure you want to sign out?",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Logout", 
          style: "destructive", 
          onPress: async () => {
            await logoutUser();
            navigation.reset({
              index: 0,
              routes: [{ name: 'Login' }],
            });
          } 
        }
      ]
    );
  };

  const languages = ['English', 'Urdu', 'Spanish', 'French', 'Arabic'];

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#6366f1" />
      </View>
    );
  }

  // Dynamic Styles
  const themeContainer = isDarkMode ? styles.darkContainer : styles.container;
  const themeCard = isDarkMode ? styles.darkCard : styles.card;
  const themeText = isDarkMode ? styles.darkText : styles.menuText;

  return (
    <View style={themeContainer}>
      <LinearGradient colors={['#6366f1', '#4f46e5']} style={styles.header}>
        <SafeAreaView>
          <Text style={styles.headerTitle}>Profile</Text>
        </SafeAreaView>
      </LinearGradient>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={[styles.profileCard, isDarkMode && { backgroundColor: '#1e293b' }]}>
            <View style={styles.avatar}>
                <Text style={styles.avatarText}>
                    {user?.full_name?.charAt(0) || user?.email?.charAt(0).toUpperCase() || 'U'}
                </Text>
            </View>
            <Text style={[styles.name, isDarkMode && { color: '#fff' }]}>{user?.full_name || 'User'}</Text>
            <Text style={styles.email}>{user?.email || 'user@example.com'}</Text>
        </View>

        <Text style={styles.sectionLabel}>Account</Text>
        <View style={themeCard}>
            <TouchableOpacity style={styles.menuItem} onPress={() => setAccountModal(true)}>
                <View style={styles.menuLeft}>
                    <UserIcon size={20} color="#6366f1" />
                    <Text style={themeText}>Account Information</Text>
                </View>
                <ChevronRight size={20} color="#cbd5e1" />
            </TouchableOpacity>
        </View>

        <Text style={styles.sectionLabel}>Preferences</Text>
        <View style={themeCard}>
            <View style={styles.menuItem}>
                <View style={styles.menuLeft}>
                    <Moon size={20} color="#6366f1" />
                    <Text style={themeText}>Dark Mode</Text>
                </View>
                <Switch 
                  value={isDarkMode} 
                  onValueChange={toggleDarkMode} // USES GLOBAL TOGGLE
                  trackColor={{ false: '#cbd5e1', true: '#6366f1' }}
                />
            </View>
            
            <View style={styles.divider} />

            <TouchableOpacity style={styles.menuItem} onPress={() => setLanguageModal(true)}>
                <View style={styles.menuLeft}>
                    <Globe size={20} color="#6366f1" />
                    <View>
                        <Text style={themeText}>Language</Text>
                        <Text style={styles.subText}>{language}</Text>
                    </View>
                </View>
                <ChevronRight size={20} color="#cbd5e1" />
            </TouchableOpacity>
        </View>

        <Text style={styles.sectionLabel}>Security</Text>
        <View style={themeCard}>
            <TouchableOpacity style={styles.menuItem}>
                <View style={styles.menuLeft}>
                    <Shield size={20} color="#6366f1" />
                    <Text style={themeText}>Security & Privacy</Text>
                </View>
                <ChevronRight size={20} color="#cbd5e1" />
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.menuItem, { borderBottomWidth: 0 }]} 
              onPress={handleLogout}
            >
                <View style={styles.menuLeft}>
                    <LogOut size={20} color="#ef4444" />
                    <Text style={styles.menuTextLogout}>Log Out</Text>
                </View>
            </TouchableOpacity>
        </View>

        <Text style={styles.footerText}>App Version 1.0.0</Text>
      </ScrollView>

      {/* MODALS REMAIN THE SAME BUT USE GLOBAL changeLanguage */}
      <Modal visible={accountModal} transparent animationType="fade">
        <Pressable style={styles.modalOverlay} onPress={() => setAccountModal(false)}>
          <View style={styles.popupCard}>
            <View style={styles.popupHeader}>
              <Text style={styles.popupTitle}>Account Details</Text>
              <TouchableOpacity onPress={() => setAccountModal(false)}>
                <X size={20} color="#94a3b8" />
              </TouchableOpacity>
            </View>
            <View style={styles.popupBody}>
              <View style={styles.infoRow}>
                <UserIcon size={18} color="#6366f1" />
                <View><Text style={styles.infoLabel}>Full Name</Text><Text style={styles.infoValue}>{user?.full_name}</Text></View>
              </View>
              <View style={styles.infoRow}>
                <Mail size={18} color="#6366f1" />
                <View><Text style={styles.infoLabel}>Email</Text><Text style={styles.infoValue}>{user?.email}</Text></View>
              </View>
            </View>
          </View>
        </Pressable>
      </Modal>

      <Modal visible={languageModal} transparent animationType="slide">
        <Pressable style={styles.modalOverlay} onPress={() => setLanguageModal(false)}>
          <View style={styles.popupCard}>
            <View style={styles.popupHeader}>
              <Text style={styles.popupTitle}>Select Language</Text>
              <TouchableOpacity onPress={() => setLanguageModal(false)}>
                <X size={20} color="#94a3b8" />
              </TouchableOpacity>
            </View>
            <View style={styles.popupBody}>
              {languages.map((lang) => (
                <TouchableOpacity 
                  key={lang} 
                  style={styles.langItem}
                  onPress={() => {
                    changeLanguage(lang); // USES GLOBAL CHANGE
                    setLanguageModal(false);
                  }}
                >
                  <Text style={[styles.infoValue, language === lang && { color: '#6366f1' }]}>{lang}</Text>
                  {language === lang && <View style={styles.activeDot} />}
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </Pressable>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  darkContainer: { flex: 1, backgroundColor: '#0f172a' }, 
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { paddingTop: 60, paddingBottom: 40, paddingHorizontal: 24, borderBottomLeftRadius: 30, borderBottomRightRadius: 30 },
  headerTitle: { fontSize: 24, fontWeight: 'bold', color: '#fff' },
  content: { padding: 20, marginTop: -30 },
  profileCard: { backgroundColor: '#fff', borderRadius: 20, padding: 24, alignItems: 'center', marginBottom: 20, elevation: 4 },
  avatar: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#e0e7ff', alignItems: 'center', justifyContent: 'center', marginBottom: 12, borderWidth: 2, borderColor: '#6366f1' },
  avatarText: { fontSize: 28, fontWeight: 'bold', color: '#6366f1' },
  name: { fontSize: 20, fontWeight: 'bold', color: '#1e293b' },
  email: { fontSize: 14, color: '#64748b', marginTop: 4 },
  sectionLabel: { fontSize: 12, fontWeight: 'bold', color: '#94a3b8', textTransform: 'uppercase', marginLeft: 10, marginBottom: 8, marginTop: 10 },
  card: { backgroundColor: '#fff', borderRadius: 20, padding: 8, elevation: 2, marginBottom: 20 },
  darkCard: { backgroundColor: '#1e293b', borderRadius: 20, padding: 8, elevation: 2, marginBottom: 20 }, 
  menuItem: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16 },
  menuLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  menuText: { fontSize: 16, color: '#334155', fontWeight: '500' },
  darkText: { fontSize: 16, color: '#f8fafc', fontWeight: '500' }, 
  menuTextLogout: { fontSize: 16, color: '#ef4444', fontWeight: '600' },
  subText: { fontSize: 12, color: '#94a3b8', marginTop: 2 },
  divider: { height: 1, backgroundColor: '#f1f5f9', marginHorizontal: 16 },
  footerText: { textAlign: 'center', marginTop: 30, color: '#94a3b8', fontSize: 12, marginBottom: 40 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  popupCard: { backgroundColor: '#fff', borderRadius: 24, width: '90%', padding: 24, elevation: 10 },
  popupHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  popupTitle: { fontSize: 18, fontWeight: 'bold', color: '#1e293b' },
  popupBody: { gap: 15 },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: 15 },
  infoLabel: { fontSize: 12, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 0.5 },
  infoValue: { fontSize: 15, color: '#1e293b', fontWeight: '600' },
  langItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  activeDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#6366f1' }
});

export default ProfileScreen;