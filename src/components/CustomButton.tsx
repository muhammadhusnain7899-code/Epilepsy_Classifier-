import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator, ViewStyle, TextStyle } from 'react-native';
// NEW: Import the global settings hook to listen for theme changes
import { useSettings } from '../context/SettingsContext';

interface CustomButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'outline' | 'ghost' | 'destructive';
  isLoading?: boolean;
  icon?: React.ReactNode;
  style?: ViewStyle;
}

const CustomButton: React.FC<CustomButtonProps> = ({ 
  title, 
  onPress, 
  variant = 'primary', 
  isLoading = false,
  icon,
  style 
}) => {
  // NEW: Access the global theme state
  const { isDarkMode } = useSettings();

  const getButtonStyle = () => {
    switch (variant) {
      case 'outline': return styles.outlineButton;
      case 'ghost': return styles.ghostButton;
      case 'destructive': return styles.destructiveButton;
      default: return styles.primaryButton;
    }
  };

  const getTextStyle = () => {
    switch (variant) {
      case 'outline': return styles.outlineText;
      case 'ghost': return styles.ghostText;
      case 'destructive': return styles.destructiveText;
      default: return styles.primaryText;
    }
  };

  // Logic to determine the color of the ActivityIndicator (Loader)
  const getLoaderColor = () => {
    if (variant === 'primary') return '#fff';
    if (isDarkMode) return '#fff'; // White loader in dark mode for visibility
    return '#6366f1';
  };

  return (
    <TouchableOpacity 
      style={[
        styles.baseButton, 
        getButtonStyle(), 
        // NEW: Dynamic border for outline buttons in Dark Mode
        variant === 'outline' && isDarkMode && { borderColor: '#334155' },
        style
      ]} 
      onPress={onPress}
      disabled={isLoading}
      activeOpacity={0.8}
    >
      {isLoading ? (
        <ActivityIndicator color={getLoaderColor()} />
      ) : (
        <>
          {icon}
          <Text style={[
            styles.baseText, 
            getTextStyle(), 
            // NEW: Override text color to white if in Dark Mode and using Outline/Ghost variants
            (variant === 'outline' || variant === 'ghost') && isDarkMode && { color: '#ffffff' },
            icon ? { marginLeft: 8 } : {}
          ]}>
            {title}
          </Text>
        </>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  baseButton: {
    height: 50,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    marginVertical: 6,
  },
  primaryButton: {
    backgroundColor: '#6366f1', // Indigo 500
    shadowColor: '#6366f1',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  outlineButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  ghostButton: {
    backgroundColor: 'transparent',
  },
  destructiveButton: {
    backgroundColor: '#fee2e2',
  },
  baseText: {
    fontSize: 16,
    fontWeight: '600',
  },
  primaryText: {
    color: '#ffffff',
  },
  outlineText: {
    color: '#0f172a',
  },
  ghostText: {
    color: '#64748b',
  },
  destructiveText: {
    color: '#ef4444',
  },
});

export default CustomButton;