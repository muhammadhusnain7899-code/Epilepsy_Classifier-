import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Animated,
  Dimensions,
} from 'react-native';
import { MessageCircle, X, Send, Bot } from 'lucide-react-native';
import { useSettings } from '../context/SettingsContext';
import { sendChatMessage, ChatMessage } from '../services/api';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const ChatAssistant: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      text: "Hello! I'm your epilepsy assistant. I can help answer questions about seizure types, EEG readings, and general epilepsy information. How can I help you today?",
      isUser: false,
      timestamp: new Date(),
    },
  ]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);
  const pulseAnim = useRef(new Animated.Value(1)).current;

  const { isDarkMode } = useSettings();

  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    );
    pulse.start();
    return () => pulse.stop();
  }, []);

  const handleSend = async () => {
    if (!inputText.trim() || isLoading) return;

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      text: inputText.trim(),
      isUser: true,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputText('');
    setIsLoading(true);

    try {
      const reply = await sendChatMessage(userMessage.text);
      
      const aiMessage: ChatMessage = {
        id: `ai-${Date.now()}`,
        text: reply,
        isUser: false,
        timestamp: new Date(),
      };
      
      setMessages((prev) => [...prev, aiMessage]);
    } catch (error) {
      const errorMessage: ChatMessage = {
        id: `error-${Date.now()}`,
        text: "I'm sorry, I couldn't process your request. Please try again.",
        isUser: false,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const scrollToBottom = () => {
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const renderMessage = (message: ChatMessage) => {
    if (message.isUser) {
      return (
        <View key={message.id} style={styles.userMessageRow}>
          <View style={styles.userBubble}>
            <Text style={styles.userText}>{message.text}</Text>
          </View>
        </View>
      );
    }

    return (
      <View key={message.id} style={styles.aiMessageRow}>
        <View style={styles.aiAvatarContainer}>
          <View style={styles.aiAvatar}>
            <Bot size={16} color="#6366f1" />
          </View>
        </View>
        <View style={[styles.aiBubble, isDarkMode && styles.aiBubbleDark]}>
          <Text style={[styles.aiText, isDarkMode && styles.aiTextDark]}>
            {message.text}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <>
      {/* Floating Action Button */}
      <Animated.View style={[styles.fab, { transform: [{ scale: pulseAnim }] }]}>
        <TouchableOpacity
          style={styles.fabButton}
          onPress={() => setIsOpen(true)}
          activeOpacity={0.8}
        >
          <MessageCircle size={28} color="#fff" />
        </TouchableOpacity>
      </Animated.View>

      {/* Chat Modal */}
      <Modal
        visible={isOpen}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setIsOpen(false)}
      >
        <View style={styles.modalOverlay}>
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.keyboardView}
          >
            <View style={[styles.chatContainer, isDarkMode && styles.chatContainerDark]}>
              {/* Header */}
              <View style={[styles.header, isDarkMode && styles.headerDark]}>
                <View style={styles.headerLeft}>
                  <View style={styles.botIcon}>
                    <Bot size={20} color="#fff" />
                  </View>
                  <View style={styles.headerTextContainer}>
                    <Text style={[styles.headerTitle, isDarkMode && styles.headerTitleDark]}>
                      Epilepsy Assistant
                    </Text>
                    <Text style={styles.headerSubtitle}>Powered by AI</Text>
                  </View>
                </View>
                <TouchableOpacity onPress={() => setIsOpen(false)} style={styles.closeButton}>
                  <X size={24} color={isDarkMode ? '#fff' : '#64748b'} />
                </TouchableOpacity>
              </View>

              {/* Messages */}
              <ScrollView
                ref={scrollViewRef}
                style={styles.messagesContainer}
                contentContainerStyle={styles.messagesContent}
                showsVerticalScrollIndicator={false}
              >
                {messages.map(renderMessage)}
                
                {isLoading && (
                  <View style={styles.aiMessageRow}>
                    <View style={styles.aiAvatarContainer}>
                      <View style={styles.aiAvatar}>
                        <Bot size={16} color="#6366f1" />
                      </View>
                    </View>
                    <View style={[styles.aiBubble, styles.loadingBubble, isDarkMode && styles.aiBubbleDark]}>
                      <ActivityIndicator size="small" color="#6366f1" />
                      <Text style={[styles.loadingText, isDarkMode && styles.aiTextDark]}>
                        Getting response...
                      </Text>
                    </View>
                  </View>
                )}
              </ScrollView>

              {/* Input Area */}
              <View style={[styles.inputContainer, isDarkMode && styles.inputContainerDark]}>
                <TextInput
                  style={[styles.input, isDarkMode && styles.inputDark]}
                  placeholder="Ask about epilepsy..."
                  placeholderTextColor={isDarkMode ? '#64748b' : '#94a3b8'}
                  value={inputText}
                  onChangeText={setInputText}
                  multiline
                  maxLength={500}
                  editable={!isLoading}
                />
                <TouchableOpacity
                  style={[
                    styles.sendButton,
                    (!inputText.trim() || isLoading) && styles.sendButtonDisabled,
                  ]}
                  onPress={handleSend}
                  disabled={!inputText.trim() || isLoading}
                >
                  <Send size={20} color="#fff" />
                </TouchableOpacity>
              </View>

              {/* Disclaimer */}
              <View style={[styles.disclaimer, isDarkMode && styles.disclaimerDark]}>
                <Text style={[styles.disclaimerText, isDarkMode && styles.disclaimerTextDark]}>
                  For educational purposes only. Not a substitute for medical advice.
                </Text>
              </View>
            </View>
          </KeyboardAvoidingView>
        </View>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  fab: {
    position: 'absolute',
    bottom: 100,
    right: 20,
    zIndex: 1000,
  },
  fabButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#6366f1',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#6366f1',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  keyboardView: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  chatContainer: {
    height: '90%',
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    overflow: 'hidden',
  },
  chatContainerDark: {
    backgroundColor: '#0f172a',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    backgroundColor: '#fff',
  },
  headerDark: {
    backgroundColor: '#1e293b',
    borderBottomColor: '#334155',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  botIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#6366f1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTextContainer: {
    marginLeft: 12,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#0f172a',
  },
  headerTitleDark: {
    color: '#fff',
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#64748b',
  },
  closeButton: {
    padding: 8,
  },
  messagesContainer: {
    flex: 1,
  },
  messagesContent: {
    padding: 16,
    paddingBottom: 8,
  },
  // User message styles
  userMessageRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginBottom: 16,
  },
  userBubble: {
    maxWidth: SCREEN_WIDTH * 0.75,
    backgroundColor: '#6366f1',
    borderRadius: 18,
    borderBottomRightRadius: 4,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  userText: {
    fontSize: 15,
    lineHeight: 22,
    color: '#fff',
  },
  // AI message styles
  aiMessageRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  aiAvatarContainer: {
    marginRight: 10,
    marginTop: 2,
  },
  aiAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(99, 102, 241, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  aiBubble: {
    flex: 1,
    maxWidth: SCREEN_WIDTH * 0.72,
    backgroundColor: '#f1f5f9',
    borderRadius: 18,
    borderBottomLeftRadius: 4,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  aiBubbleDark: {
    backgroundColor: '#1e293b',
  },
  aiText: {
    fontSize: 15,
    lineHeight: 24,
    color: '#1e293b',
  },
  aiTextDark: {
    color: '#e2e8f0',
  },
  loadingBubble: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
  },
  loadingText: {
    fontSize: 14,
    color: '#64748b',
    marginLeft: 10,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: 12,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
    backgroundColor: '#fff',
  },
  inputContainerDark: {
    backgroundColor: '#1e293b',
    borderTopColor: '#334155',
  },
  input: {
    flex: 1,
    minHeight: 44,
    maxHeight: 120,
    backgroundColor: '#f1f5f9',
    borderRadius: 22,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 15,
    color: '#0f172a',
  },
  inputDark: {
    backgroundColor: '#0f172a',
    color: '#fff',
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#6366f1',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 10,
  },
  sendButtonDisabled: {
    backgroundColor: '#94a3b8',
  },
  disclaimer: {
    padding: 10,
    backgroundColor: '#fef3c7',
    alignItems: 'center',
  },
  disclaimerDark: {
    backgroundColor: '#1e293b',
  },
  disclaimerText: {
    fontSize: 11,
    color: '#92400e',
    textAlign: 'center',
  },
  disclaimerTextDark: {
    color: '#94a3b8',
  },
});

export default ChatAssistant;
