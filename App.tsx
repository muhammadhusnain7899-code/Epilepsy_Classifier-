import React from 'react';
import { View, StyleSheet } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Home, Upload, History, BookOpen, User } from 'lucide-react-native';
import { StatusBar } from 'expo-status-bar';

// Context Wrapper
import { SettingsProvider, useSettings } from './src/context/SettingsContext';

// Screens
import LoginScreen from './src/screens/LoginScreen';
import DashboardScreen from './src/screens/DashboardScreen';
import UploadScreen from './src/screens/UploadScreen';
import ResultScreen from './src/screens/ResultScreen';
import HistoryScreen from './src/screens/HistoryScreen';
import DiaryScreen from './src/screens/DiaryScreen';
import ProfileScreen from './src/screens/ProfileScreen';

// Components
import ChatAssistant from './src/components/ChatAssistant';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

// Bottom Tab Navigation (Main App)
const MainApp = () => {
  const { isDarkMode } = useSettings(); // Listen to global theme

  return (
    <View style={styles.container}>
      <Tab.Navigator
        id="MainTabNavigator"
        screenOptions={{
          headerShown: false,
          tabBarStyle: {
            backgroundColor: isDarkMode ? '#1e293b' : '#ffffff', // Dynamic background
            borderTopWidth: 0,
            elevation: 10,
            height: 60,
            paddingBottom: 10,
          },
          tabBarActiveTintColor: '#6366f1',
          tabBarInactiveTintColor: isDarkMode ? '#94a3b8' : '#64748b',
        }}
      >
        <Tab.Screen 
          name="Dashboard" 
          component={DashboardScreen}
          options={{
            tabBarIcon: ({ color }) => <Home size={24} color={color} />,
            tabBarLabel: 'Home'
          }}
        />
        <Tab.Screen 
          name="Upload" 
          component={UploadScreen}
          options={{
            tabBarIcon: ({ color }) => <Upload size={24} color={color} />,
            tabBarLabel: 'Analyze'
          }}
        />
        <Tab.Screen 
          name="History" 
          component={HistoryScreen}
          options={{
            tabBarIcon: ({ color }) => <History size={24} color={color} />,
            tabBarLabel: 'History'
          }}
        />
        <Tab.Screen 
          name="Diary" 
          component={DiaryScreen}
          options={{
            tabBarIcon: ({ color }) => <BookOpen size={24} color={color} />,
            tabBarLabel: 'Diary'
          }}
        />
        <Tab.Screen 
          name="Profile" 
          component={ProfileScreen}
          options={{
            tabBarIcon: ({ color }) => <User size={24} color={color} />,
            tabBarLabel: 'Profile'
          }}
        />
      </Tab.Navigator>
      
      {/* Floating Chat Assistant */}
      <ChatAssistant />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

export default function App() {
  return (
    <SettingsProvider> 
      <NavigationContainer>
        <StatusBar style="auto" />
        <Stack.Navigator 
          id="RootStackNavigator"
          initialRouteName="Login"
          screenOptions={{ headerShown: false }}
        >
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="MainApp" component={MainApp} />
          <Stack.Screen name="Result" component={ResultScreen} />
        </Stack.Navigator>
      </NavigationContainer>
    </SettingsProvider>
  );
}