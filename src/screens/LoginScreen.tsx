import React, { useState } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  StyleSheet, 
  SafeAreaView, 
  KeyboardAvoidingView, 
  Platform,
  Alert,
  Keyboard // Added this import
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Brain } from 'lucide-react-native';
import CustomButton from '../components/CustomButton';
// UPDATED: Ensure clearAuthData is imported to fix the data leak issue
import { loginUser, registerUser, clearAuthData } from '../services/api';
// NEW: Import the global settings hook
import { useSettings } from '../context/SettingsContext';

const LoginScreen = ({ navigation }: any) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState(''); 
  const [loading, setLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);

  // NEW: Get global theme and language
  const { isDarkMode, language } = useSettings();

  const handleAuth = async () => {
    // 1. DISMISS KEYBOARD IMMEDIATELY 
    Keyboard.dismiss();

    if (!email || !password || (isSignUp && !name)) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    setLoading(true);
    try {
      // --- CRITICAL FIX: CLEAR OLD DATA ---
      // This wipes the previous user's token and cache before starting the new session.
      // This prevents "Old User Data" from appearing on the Dashboard.
      await clearAuthData();

      if (isSignUp) {
        // Calls PostgreSQL register route
        await registerUser(email, password, name);
      } else {
        // Calls PostgreSQL login route
        await loginUser(email, password);
      }
      
      // 2. STABLE NAVIGATION
      // Using reset ensures the user cannot 'swipe back' to the login screen
      navigation.reset({
        index: 0,
        routes: [{ name: 'MainApp' }],
      });
      
    } catch (error: any) {
      console.error("Auth Error:", error);
      
      // Handle FastAPI/PostgreSQL error responses
      let msg = "Authentication failed. Is the server running?";
      
      if (error.response?.data?.detail) {
          msg = error.response.data.detail;
      } else if (error.message === "Network Error") {
          msg = "Cannot connect to laptop. Check WiFi and IP Address.";
      }
      
      Alert.alert('Error', typeof msg === 'string' ? msg : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  // Safe toggle helper
  const toggleMode = async () => {
    Keyboard.dismiss();
    // Clear old data even when switching modes to be safe
    await clearAuthData();
    setIsSignUp(!isSignUp);
  };

  return (
    <View style={styles.container}>
      {/* Updated Gradient for Dark Mode */}
      <LinearGradient
        colors={isDarkMode ? ['#0f172a', '#1e293b', '#0f172a'] : ['#ffffff', '#eff6ff', '#e0e7ff']}
        style={styles.gradient}
      />
      <SafeAreaView style={styles.safeArea}>
        <KeyboardAvoidingView 
          // 'padding' on iOS and undefined on Android stops the jumping issue
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.content}
        >
          <View style={styles.header}>
            <View style={[styles.logoContainer, isDarkMode && { backgroundColor: 'rgba(99, 102, 241, 0.2)' }]}>
              <Brain size={40} color="#6366f1" />
            </View>
            <Text style={[styles.title, isDarkMode && { color: '#ffffff' }]}>
              {isSignUp ? (language === 'Urdu' ? 'اکاؤنٹ بنائیں' : 'Create Account') : (language === 'Urdu' ? 'خوش آمدید' : 'Welcome Back')}
            </Text>
            <Text style={[styles.subtitle, isDarkMode && { color: '#94a3b8' }]}>
              {isSignUp ? 'Start monitoring your health' : 'Sign in to access your EEG results'}
            </Text>
          </View>

          <View style={styles.form}>
            {isSignUp && (
              <View style={styles.inputGroup}>
                <Text style={[styles.label, isDarkMode && { color: '#cbd5e1' }]}>Full Name</Text>
                <TextInput
                  style={[styles.input, isDarkMode && styles.darkInput]}
                  placeholder="Dr. John Doe"
                  value={name}
                  onChangeText={setName}
                  placeholderTextColor={isDarkMode ? "#475569" : "#94a3b8"}
                />
              </View>
            )}

            <View style={styles.inputGroup}>
              <Text style={[styles.label, isDarkMode && { color: '#cbd5e1' }]}>Email</Text>
              <TextInput
                style={[styles.input, isDarkMode && styles.darkInput]}
                placeholder="doctor@example.com"
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                keyboardType="email-address"
                placeholderTextColor={isDarkMode ? "#475569" : "#94a3b8"}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.label, isDarkMode && { color: '#cbd5e1' }]}>Password</Text>
              <TextInput
                style={[styles.input, isDarkMode && styles.darkInput]}
                placeholder="••••••••"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                placeholderTextColor={isDarkMode ? "#475569" : "#94a3b8"}
              />
            </View>

            <CustomButton 
              title={isSignUp ? "Sign Up" : "Sign In"} 
              onPress={handleAuth} 
              isLoading={loading}
            />

            <CustomButton 
              title={isSignUp ? "Already have an account? Sign In" : "Don't have an account? Sign Up"} 
              onPress={toggleMode} 
              variant="ghost"
            />
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  gradient: { position: 'absolute', left: 0, right: 0, top: 0, bottom: 0 },
  safeArea: { flex: 1 },
  content: { flex: 1, justifyContent: 'center', padding: 24 },
  header: { alignItems: 'center', marginBottom: 40 },
  logoContainer: {
    width: 80, height: 80, backgroundColor: 'rgba(99, 102, 241, 0.1)',
    borderRadius: 24, alignItems: 'center', justifyContent: 'center', marginBottom: 24,
  },
  title: { fontSize: 28, fontWeight: 'bold', color: '#0f172a', marginBottom: 8 },
  subtitle: { fontSize: 16, color: '#64748b', textAlign: 'center' },
  form: { width: '100%' },
  inputGroup: { marginBottom: 20 },
  label: { fontSize: 14, fontWeight: '500', color: '#334155', marginBottom: 8 },
  input: {
    backgroundColor: '#ffffff', borderWidth: 1, borderColor: '#e2e8f0',
    borderRadius: 12, padding: 16, fontSize: 16, color: '#0f172a',
  },
  // NEW: Dark Mode specific input styles
  darkInput: {
    backgroundColor: '#1e293b',
    borderColor: '#334155',
    color: '#ffffff',
  },
});

export default LoginScreen;