import React from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  SafeAreaView, 
  ScrollView, 
  TouchableOpacity,
  Share, // Added for Share functionality
  Alert
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BarChart3, Home, Share2, Download, AlertCircle } from 'lucide-react-native';
import * as Print from 'expo-print'; // Added for PDF generation
import * as Sharing from 'expo-sharing'; // Added for file sharing
import CustomButton from '../components/CustomButton';
import { EEGResult } from '../services/api';
// NEW: Import global settings hook
import { useSettings } from '../context/SettingsContext';

const ResultScreen = ({ navigation, route }: any) => {
  // Extract result passed from UploadScreen or HistoryScreen
  const rawResult = route.params?.result;

  // GLOBAL SETTINGS: Listen to theme and language changes
  const { isDarkMode, language } = useSettings();

  // We map the rawResult to the EEGResult structure to ensure 
  // compatibility between Backend (PostgreSQL) and Frontend simulation names.
  const result: EEGResult = {
    // 1. Mapping Backend names to UI names
    id: rawResult?.id || "0",
    
    // Check for backend 'classification_result' or frontend 'type'
    type: rawResult?.classification_result || rawResult?.type || "Normal Activity",
    
    // Check for backend 'confidence_score' or frontend 'confidence'
    confidence: rawResult?.confidence_score || rawResult?.confidence || 0,
    
    // Check for backend 'file_name' or frontend 'fileName'
    fileName: rawResult?.file_name || rawResult?.fileName || "unknown.csv",
    
    // 2. Formatting Date/Time from Backend ISO strings
    date: rawResult?.created_at 
      ? new Date(rawResult.created_at).toLocaleDateString() 
      : (rawResult?.date || new Date().toLocaleDateString()),
    
    time: rawResult?.created_at 
      ? new Date(rawResult.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) 
      : (rawResult?.time || new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })),

    // 3. Keep original fallback values for UI details
    description: rawResult?.description || "The EEG signal analysis indicates stable neurological patterns within the expected parameters.",
    duration: rawResult?.duration || "10s",
    frequency: rawResult?.frequency || "256Hz"
  };

  // --- ADDED: SHARE LOGIC ---
  const handleShare = async () => {
    try {
      await Share.share({
        message: `Epilepsy Classifier Report\nResult: ${result.type}\nConfidence: ${result.confidence}%\nDate: ${result.date}`,
      });
    } catch (error: any) {
      Alert.alert("Error", error.message);
    }
  };

  // --- ADDED: PDF EXPORT LOGIC ---
  const handleExportPDF = async () => {
    const html = `
      <html>
        <body style="font-family: sans-serif; padding: 40px;">
          <h1 style="color: #4f46e5;">EEG Analysis Report</h1>
          <hr />
          <div style="margin: 20px 0;">
            <p><strong>Database ID:</strong> ${result.id}</p>
            <p><strong>Classification:</strong> ${result.type}</p>
            <p><strong>Confidence:</strong> ${result.confidence}%</p>
            <p><strong>File Name:</strong> ${result.fileName}</p>
            <p><strong>Timestamp:</strong> ${result.date} | ${result.time}</p>
          </div>
          <p style="color: #64748b; font-size: 12px; margin-top: 50px;">
            Generated via Epilepsy Classifier AI. Not a replacement for professional medical advice.
          </p>
        </body>
      </html>
    `;

    try {
      const { uri } = await Print.printToFileAsync({ html });
      await Sharing.shareAsync(uri, { UTI: '.pdf', mimeType: 'application/pdf' });
    } catch (error) {
      Alert.alert("Error", "Could not generate PDF report.");
    }
  };

  return (
    <View style={[styles.container, isDarkMode && { backgroundColor: '#0f172a' }]}>
      <LinearGradient
        colors={['#6366f1', '#4f46e5']}
        style={styles.header}
      >
        <SafeAreaView>
          <TouchableOpacity 
            onPress={() => navigation.goBack()} 
            style={{ marginBottom: 10 }}
          >
             <Text style={{ color: 'rgba(255,255,255,0.7)' }}>
                 {language === 'Urdu' ? '← ڈیش بورڈ پر واپس جائیں' : '← Back to Dashboard'}
             </Text>
          </TouchableOpacity>
          <Text style={styles.headerSub}>
              {language === 'Urdu' ? 'تجزیہ مکمل ہو گیا' : 'Analysis Complete'}
          </Text>
          <Text style={styles.headerTitle}>
              {language === 'Urdu' ? 'ای ای جی نتائج' : 'EEG Results'}
          </Text>
        </SafeAreaView>
      </LinearGradient>

      <ScrollView contentContainerStyle={styles.content}>
        
        {/* Main Result Card */}
        <View style={[styles.resultCard, isDarkMode && { backgroundColor: '#1e293b' }]}>
          {/* EEG Visualization Mock */}
          <View style={[styles.vizContainer, isDarkMode && { backgroundColor: '#0f172a' }]}>
            <View style={styles.vizHeader}>
              <Text style={styles.vizTitle}>EEG Signal Pattern</Text>
              <View style={styles.vizBadge}>
                <View style={styles.dot} />
                <Text style={styles.badgeText}>AI Verified</Text>
              </View>
            </View>
            
            <View style={styles.waveformBox}>
              <View style={styles.waveLine} />
              <View style={[styles.waveSpike, { left: '20%', height: 30 }]} />
              <View style={[styles.waveSpike, { left: '30%', height: 45 }]} />
              <View style={[styles.waveSpike, { left: '35%', height: 70, backgroundColor: '#f43f5e' }]} />
              <View style={[styles.waveSpike, { left: '40%', height: 45 }]} />
              <View style={[styles.waveSpike, { left: '55%', height: 35 }]} />
              <View style={styles.waveLine} />
            </View>
            
            <View style={styles.timeLabels}>
              <Text style={styles.timeText}>0:00s</Text>
              <Text style={[styles.timeText, { color: '#f43f5e' }]}>Segment: {result.duration}</Text>
              <Text style={styles.timeText}>Total: {result.duration}</Text>
            </View>
          </View>

          <View style={styles.classificationSection}>
            <View style={{ flex: 1 }}>
              <Text style={styles.label}>AI CLASSIFICATION</Text>
              <Text style={[styles.mainResult, isDarkMode && { color: '#ffffff' }]}>{result.type}</Text>
              <Text style={styles.subResult}>Resolution: {result.frequency}</Text>
            </View>
            <View style={styles.confidenceCircle}>
              <Text style={styles.confidenceNum}>{result.confidence}%</Text>
              <Text style={styles.confidenceLabel}>Confidence</Text>
            </View>
          </View>
        </View>

        {/* Description Section */}
        <View style={[styles.card, isDarkMode && { backgroundColor: '#1e293b' }]}>
          <Text style={[styles.cardTitle, isDarkMode && { color: '#ffffff' }]}>
              {language === 'Urdu' ? 'طبی تشریح' : 'Medical Interpretation'}
          </Text>
          <Text style={[styles.description, isDarkMode && { color: '#cbd5e1' }]}>{result.description}</Text>
        </View>

        {/* Technical Details directly from PostgreSQL */}
        <View style={[styles.card, isDarkMode && { backgroundColor: '#1e293b' }]}>
          <Text style={[styles.cardTitle, isDarkMode && { color: '#ffffff' }]}>
              {language === 'Urdu' ? 'سسٹم میٹا ڈیٹا' : 'System Metadata'}
          </Text>
          <View style={[styles.detailRow, isDarkMode && { borderBottomColor: '#334155' }]}>
            <Text style={styles.detailLabel}>File Reference</Text>
            <Text style={[styles.detailValue, isDarkMode && { color: '#ffffff' }]}>{result.fileName}</Text>
          </View>
          <View style={[styles.detailRow, isDarkMode && { borderBottomColor: '#334155' }]}>
            <Text style={styles.detailLabel}>Database ID (UUID)</Text>
            <Text style={[styles.detailValue, {fontSize: 9, color: isDarkMode ? '#94a3b8' : '#64748b'}]}>{result.id}</Text>
          </View>
          <View style={[styles.detailRow, isDarkMode && { borderBottomColor: '#334155' }]}>
            <Text style={styles.detailLabel}>Processed At</Text>
            <Text style={[styles.detailValue, isDarkMode && { color: '#ffffff' }]}>{result.date} | {result.time}</Text>
          </View>
          <View style={[styles.detailRow, { borderBottomWidth: 0 }]}>
            <Text style={styles.detailLabel}>Signal Duration</Text>
            <Text style={[styles.detailValue, isDarkMode && { color: '#ffffff' }]}>{result.duration}</Text>
          </View>
        </View>

        {/* Disclaimer Card */}
        <View style={[styles.disclaimerCard, isDarkMode && { backgroundColor: '#1e293b', borderColor: '#d97706' }]}>
          <AlertCircle size={20} color="#d97706" />
          <Text style={[styles.disclaimerText, isDarkMode && { color: '#ffffff' }]}>
            This result is generated by an automated computational model and is intended for informational purposes. It does not replace professional clinical diagnosis.
          </Text>
        </View>

        {/* Actions */}
        <View style={styles.actionGrid}>
          <CustomButton 
            title={language === 'Urdu' ? 'تاریخ دیکھیں' : 'View History'} 
            variant="outline" 
            onPress={() => navigation.navigate('MainApp', { screen: 'History' })} 
            icon={<BarChart3 size={18} color={isDarkMode ? "#ffffff" : "#0f172a"} />}
            style={{ flex: 1, marginRight: 8, borderColor: isDarkMode ? "#334155" : "#e2e8f0" }}
          />
          <CustomButton 
            title={language === 'Urdu' ? 'ہوم' : 'Go Home'} 
            onPress={() => navigation.navigate('MainApp', { screen: 'Dashboard' })} 
            icon={<Home size={18} color="#fff" />}
            style={{ flex: 1, marginLeft: 8 }}
          />
        </View>

        <View style={styles.shareRow}>
          <TouchableOpacity style={styles.shareBtn} onPress={handleShare}>
            <Share2 size={16} color={isDarkMode ? "#94a3b8" : "#64748b"} />
            <Text style={[styles.shareText, isDarkMode && { color: '#94a3b8' }]}>
                {language === 'Urdu' ? 'شیئر کریں' : 'Share Result'}
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.shareBtn} onPress={handleExportPDF}>
            <Download size={16} color={isDarkMode ? "#94a3b8" : "#64748b"} />
            <Text style={[styles.shareText, isDarkMode && { color: '#94a3b8' }]}>
                {language === 'Urdu' ? 'ایکسپورٹ' : 'Export Report'}
            </Text>
          </TouchableOpacity>
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
    paddingBottom: 30,
    paddingHorizontal: 24,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  headerSub: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    fontWeight: '500',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginTop: 4,
  },
  content: {
    padding: 24,
    paddingBottom: 40,
  },
  resultCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
    marginBottom: 16,
  },
  vizContainer: {
    backgroundColor: '#1e293b',
    padding: 20,
  },
  vizHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  vizTitle: {
    color: '#fff',
    fontWeight: '600',
  },
  vizBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#f43f5e',
  },
  badgeText: {
    color: '#f43f5e',
    fontSize: 12,
    fontWeight: 'bold',
  },
  waveformBox: {
    height: 80,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  waveLine: {
    height: 2,
    flex: 1,
    backgroundColor: '#475569',
  },
  waveSpike: {
    position: 'absolute',
    width: 2,
    backgroundColor: '#94a3b8',
    bottom: '40%',
  },
  timeLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  timeText: {
    color: '#94a3b8',
    fontSize: 10,
  },
  classificationSection: {
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
  },
  label: {
    fontSize: 10,
    color: '#64748b',
    fontWeight: 'bold',
    letterSpacing: 1,
    marginBottom: 4,
  },
  mainResult: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#0f172a',
  },
  subResult: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 2,
  },
  confidenceCircle: {
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    borderRadius: 16,
    padding: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  confidenceNum: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#059669',
  },
  confidenceLabel: {
    fontSize: 10,
    color: '#059669',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0f172a',
    marginBottom: 12,
  },
  description: {
    fontSize: 14,
    color: '#64748b',
    lineHeight: 22,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  detailLabel: {
    fontSize: 14,
    color: '#64748b',
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#0f172a',
  },
  disclaimerCard: {
    flexDirection: 'row',
    backgroundColor: '#fffbeb',
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
    gap: 12,
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.2)',
  },
  disclaimerText: {
    flex: 1,
    fontSize: 12,
    color: '#1e293b',
    lineHeight: 18,
  },
  actionGrid: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  shareRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 20,
    marginTop: 10,
  },
  shareBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 8,
  },
  shareText: {
    fontSize: 12,
    color: '#64748b',
  },
});

export default ResultScreen;