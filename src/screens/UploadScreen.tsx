import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  SafeAreaView, 
  TouchableOpacity,
  Alert,
  ActivityIndicator
} from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import { LinearGradient } from 'expo-linear-gradient';
import { CloudUpload, FileText, X, CheckCircle, Upload as UploadIcon, Info } from 'lucide-react-native';
// NEW: Import the global settings hook
import { useSettings } from '../context/SettingsContext';
import CustomButton from '../components/CustomButton';
import { analyzeEEG } from '../services/api'; 

const UploadScreen = ({ navigation }: any) => {
  const [selectedFile, setSelectedFile] = useState<DocumentPicker.DocumentPickerAsset | null>(null);
  const [status, setStatus] = useState<'idle' | 'uploading' | 'analyzing' | 'done'>('idle');
  const [progress, setProgress] = useState(0);

  // GLOBAL SETTINGS: Listen to theme and language changes
  const { isDarkMode, language } = useSettings();

  const pickDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: '*/*',
        copyToCacheDirectory: true,
        multiple: false,
      });

      if (result.canceled) return;

      const file = result.assets[0];
      if (!file) {
        Alert.alert('Error', 'No file selected');
        return;
      }
      
      const fileName = file.name?.toLowerCase() || '';
      
      // Validate file extension
      if (!fileName.endsWith('.edf') && !fileName.endsWith('.csv')) {
        Alert.alert(
          'Invalid File', 
          'Please select an EDF file (.edf) for AI analysis.\n\nSelected: ' + file.name
        );
        return;
      }

      setSelectedFile(file);
      setProgress(0);
      setStatus('idle');
    } catch (err: any) {
      console.error('Document picker error:', err);
      Alert.alert('Error', 'Failed to pick file: ' + (err.message || 'Unknown error'));
    }
  };

  const handleProcess = async () => {
    if (!selectedFile) return;

    setStatus('uploading');
    
    const uploadInterval = setInterval(() => {
      setProgress((prev) => (prev >= 90 ? prev : prev + 10));
    }, 150);

    try {
      // Backend Communication (FastAPI/PostgreSQL)
      const result = await analyzeEEG(selectedFile.uri, selectedFile.name);
      
      clearInterval(uploadInterval);
      setProgress(100);
      
      setStatus('analyzing');
      
      setTimeout(() => {
        setStatus('done');
        
        setTimeout(() => {
          setStatus('idle');
          setSelectedFile(null); 
          
          // Passing PostgreSQL data to ResultScreen
          navigation.navigate('Result', { result: result });
        }, 800);
      }, 2000);

    } catch (error: any) {
      clearInterval(uploadInterval);
      setStatus('idle');
      console.error("Backend Error Detail:", error);
      
      Alert.alert(
        'Processing Failed', 
        'Could not reach the AI model. Check your Laptop IP and ensure FastAPI is running.'
      );
    }
  };

  const isProcessing = status === 'uploading' || status === 'analyzing';

  return (
    <View style={[styles.container, isDarkMode && { backgroundColor: '#0f172a' }]}>
      <LinearGradient
        colors={['#6366f1', '#4f46e5']}
        style={styles.header}
      >
        <SafeAreaView>
          <Text style={styles.headerTitle}>
              {language === 'Urdu' ? 'ای ای جی تجزیہ' : 'Analyze EEG'}
          </Text>
          <Text style={styles.headerSub}>
              {language === 'Urdu' ? 'پوسٹ گری ایس کیو ایل میں محفوظ کریں' : 'Upload recording for PostgreSQL storage'}
          </Text>
        </SafeAreaView>
      </LinearGradient>

      <View style={styles.content}>
        
        {/* Info Card */}
        <View style={[styles.infoCard, isDarkMode && { backgroundColor: '#1e293b', borderLeftColor: '#0ea5e9' }]}>
          <Info size={20} color="#0ea5e9" />
          <View style={styles.infoTextContainer}>
            <Text style={[styles.infoTitle, isDarkMode && { color: '#ffffff' }]}>AI-Powered Analysis</Text>
            <Text style={styles.infoText}>Upload EDF files for CNN+LSTM seizure detection.</Text>
          </View>
        </View>

        {/* Upload Area */}
        <View style={[styles.uploadCard, isDarkMode && { backgroundColor: '#1e293b' }]}>
          {!selectedFile ? (
            <TouchableOpacity 
                style={[styles.dropZone, isDarkMode && { borderColor: '#334155' }]} 
                onPress={pickDocument}
            >
              <View style={styles.iconCircle}>
                <CloudUpload size={40} color="#6366f1" />
              </View>
              <Text style={[styles.dropTitle, isDarkMode && { color: '#ffffff' }]}>Tap to select file</Text>
              <Text style={styles.dropSub}>From your device storage</Text>
              <Text style={styles.dropFormat}>EDF files up to 50MB</Text>
            </TouchableOpacity>
          ) : (
            <View style={styles.filePreview}>
              <View style={[styles.fileRow, isDarkMode && { backgroundColor: '#0f172a' }]}>
                <View style={styles.fileIcon}>
                  <FileText size={24} color="#6366f1" />
                </View>
                <View style={styles.fileInfo}>
                  <Text style={[styles.fileName, isDarkMode && { color: '#ffffff' }]} numberOfLines={1}>
                      {selectedFile.name}
                  </Text>
                  <Text style={styles.fileSize}>
                    {(selectedFile.size ? selectedFile.size / 1024 : 0).toFixed(2)} KB
                  </Text>
                </View>
                {!isProcessing && status !== 'done' && (
                  <TouchableOpacity onPress={() => setSelectedFile(null)}>
                    <X size={20} color="#94a3b8" />
                  </TouchableOpacity>
                )}
                {status === 'done' && (
                  <CheckCircle size={24} color="#10b981" />
                )}
              </View>

              {status === 'uploading' && (
                <View style={styles.progressContainer}>
                  <View style={styles.progressBar}>
                    <View style={[styles.progressFill, { width: `${progress}%` }]} />
                  </View>
                  <Text style={styles.progressText}>Uploading... {progress}%</Text>
                </View>
              )}

              {status === 'analyzing' && (
                <View style={styles.analyzingContainer}>
                  <ActivityIndicator size="small" color="#6366f1" />
                  <Text style={styles.analyzingText}>Backend Processing...</Text>
                </View>
              )}

              {!isProcessing && status !== 'done' && (
                <CustomButton 
                  title="Start Analysis"
                  onPress={handleProcess}
                  icon={<UploadIcon size={20} color="#fff" />}
                  style={{ marginTop: 20 }}
                />
              )}
            </View>
          )}
        </View>

        {/* Tips Section */}
        <View style={[styles.tipsCard, isDarkMode && { backgroundColor: '#1e293b' }]}>
          <Text style={[styles.tipsTitle, isDarkMode && { color: '#ffffff' }]}>Troubleshooting Tips</Text>
          <View style={styles.tipRow}>
            <View style={styles.bullet} />
            <Text style={styles.tipText}>Check your Laptop IPv4 (ipconfig)</Text>
          </View>
          <View style={styles.tipRow}>
            <View style={styles.bullet} />
            <Text style={styles.tipText}>Ensure FastAPI is listening on 0.0.0.0</Text>
          </View>
        </View>

      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  header: { paddingTop: 60, paddingBottom: 30, paddingHorizontal: 24, borderBottomLeftRadius: 30, borderBottomRightRadius: 30 },
  headerTitle: { fontSize: 24, fontWeight: 'bold', color: '#fff' },
  headerSub: { fontSize: 14, color: 'rgba(255,255,255,0.8)', marginTop: 4 },
  content: { padding: 24, marginTop: -20 },
  infoCard: { flexDirection: 'row', backgroundColor: '#fff', padding: 16, borderRadius: 12, borderLeftWidth: 4, borderLeftColor: '#0ea5e9', marginBottom: 16, elevation: 2 },
  infoTextContainer: { marginLeft: 12 },
  infoTitle: { fontSize: 14, fontWeight: '600', color: '#1e293b' },
  infoText: { fontSize: 12, color: '#64748b', marginTop: 2 },
  uploadCard: { backgroundColor: '#fff', borderRadius: 16, padding: 24, marginBottom: 16, elevation: 4, minHeight: 250, justifyContent: 'center' },
  dropZone: { alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: '#e2e8f0', borderStyle: 'dashed', borderRadius: 16, padding: 32, width: '100%' },
  iconCircle: { width: 80, height: 80, borderRadius: 40, backgroundColor: 'rgba(99, 102, 241, 0.1)', alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  dropTitle: { fontSize: 16, fontWeight: '600', color: '#1e293b' },
  dropSub: { fontSize: 14, color: '#64748b', marginTop: 4 },
  dropFormat: { fontSize: 12, color: '#94a3b8', marginTop: 12 },
  filePreview: { width: '100%' },
  fileRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f1f5f9', padding: 16, borderRadius: 12 },
  fileIcon: { width: 48, height: 48, backgroundColor: 'rgba(99, 102, 241, 0.1)', borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  fileInfo: { flex: 1 },
  fileName: { fontSize: 14, fontWeight: '600', color: '#1e293b' },
  fileSize: { fontSize: 12, color: '#64748b', marginTop: 2 },
  progressContainer: { marginTop: 24 },
  progressBar: { height: 8, backgroundColor: '#e2e8f0', borderRadius: 4, overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: '#6366f1' },
  progressText: { fontSize: 12, color: '#64748b', textAlign: 'right', marginTop: 8 },
  analyzingContainer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: 24, gap: 10 },
  analyzingText: { color: '#6366f1', fontWeight: '600' },
  tipsCard: { backgroundColor: '#fff', borderRadius: 16, padding: 20, elevation: 2 },
  tipsTitle: { fontSize: 14, fontWeight: '600', color: '#1e293b', marginBottom: 12 },
  tipRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  bullet: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#6366f1', marginRight: 8 },
  tipText: { fontSize: 13, color: '#64748b' },
});

export default UploadScreen;