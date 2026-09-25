import React, { useState, useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { View, ActivityIndicator, StyleSheet, NativeModules } from 'react-native';
import { requireOptionalNativeModule } from 'expo';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { getToken, clearAuth, getLocalUser } from './src/api/client';
import { getCurrentUser, logout, User } from './src/api/auth';
import { Colors } from './src/constants/theme';
import { AuthContext } from './src/context/AuthContext';
import { RootStackParamList, TabParamList } from './src/types/navigation';

// Screens
import LoginScreen from './src/screens/LoginScreen';
import RegisterScreen from './src/screens/RegisterScreen';
import HomeScreen from './src/screens/HomeScreen';
import AppointmentsScreen from './src/screens/AppointmentsScreen';
import BookAppointmentScreen from './src/screens/BookAppointmentScreen';
import RecordsScreen from './src/screens/RecordsScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import AppointmentDetailScreen from './src/screens/AppointmentDetailScreen';
import RecordDetailScreen from './src/screens/RecordDetailScreen';
import HospitalListScreen from './src/screens/HospitalListScreen';

import { ErrorBoundary } from './src/components/ErrorBoundary';

// Re-export for any external consumers
export { useAuthContext } from './src/context/AuthContext';
export type { RootStackParamList, TabParamList } from './src/types/navigation';

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<TabParamList>();

// ─── Bottom Tab Navigator ────────────────────────────────────────────
function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: Colors.primary,
        tabBarInactiveTintColor: Colors.textMuted,
        tabBarStyle: {
          backgroundColor: Colors.white,
          borderTopColor: Colors.border,
          borderTopWidth: 1,
          elevation: 8,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.08,
          shadowRadius: 8,
          height: 60,
          paddingBottom: 6,
          paddingTop: 4,
        },
        tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: keyof typeof Ionicons.glyphMap = 'home';
          if (route.name === 'Home') iconName = focused ? 'home' : 'home-outline';
          else if (route.name === 'Appointments') iconName = focused ? 'calendar' : 'calendar-outline';
          else if (route.name === 'Records') iconName = focused ? 'document-text' : 'document-text-outline';
          else if (route.name === 'Profile') iconName = focused ? 'person' : 'person-outline';
          return <Ionicons name={iconName} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} options={{ title: 'Home' }} />
      <Tab.Screen name="Appointments" component={AppointmentsScreen} options={{ title: 'Appointments' }} />
      <Tab.Screen name="Records" component={RecordsScreen} options={{ title: 'Records' }} />
      <Tab.Screen name="Profile" component={ProfileScreen} options={{ title: 'Profile' }} />
    </Tab.Navigator>
  );
}

// ─── Root App ────────────────────────────────────────────────────────
export default function App() {
  const [initializing, setInitializing] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    // Automatically hide Expo Dev Menu floating action button
    try {
      const DevMenuPreferences = requireOptionalNativeModule('DevMenuPreferences');
      DevMenuPreferences?.setPreferencesAsync?.({ showFloatingActionButton: false });
      if (NativeModules.DevMenuPreferences?.setPreferencesAsync) {
        NativeModules.DevMenuPreferences.setPreferencesAsync({ showFloatingActionButton: false });
      }
    } catch {}

    (async () => {
      try {
        const token = await getToken();
        if (token) {
          // Immediately load cached user profile so the UI renders instantly without white screen
          const cachedUser = await getLocalUser();
          if (cachedUser) {
            setUser(cachedUser);
            setIsLoggedIn(true);
            setInitializing(false);
          }

          // Then refresh user profile with a 3.5s timeout
          try {
            const u = await Promise.race([
              getCurrentUser(),
              new Promise<null>((_, reject) =>
                setTimeout(() => reject(new Error('Auth check timed out')), 3500)
              ),
            ]);
            if (u) {
              setUser(u);
              setIsLoggedIn(true);
            }
          } catch {
            if (!cachedUser) {
              setIsLoggedIn(false);
            }
          }
        } else {
          setIsLoggedIn(false);
        }
      } catch {
        setIsLoggedIn(false);
      } finally {
        setInitializing(false);
      }
    })();
  }, []);

  const handleLogout = async () => {
    await logout();
    setUser(null);
    setIsLoggedIn(false);
  };

  if (initializing) {
    return (
      <SafeAreaProvider>
        <View style={styles.loading}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <StatusBar style="dark" />
        </View>
      </SafeAreaProvider>
    );
  }

  return (
    <ErrorBoundary>
      <SafeAreaProvider>
        <AuthContext.Provider value={{ user, setUser, handleLogout }}>
          <NavigationContainer>
            <StatusBar style="dark" />
            <Stack.Navigator screenOptions={{ headerShown: false, animation: 'slide_from_right' }}>
              {!isLoggedIn ? (
                <>
                  <Stack.Screen name="Login">
                    {(props) => (
                      <LoginScreen
                        {...props}
                        onLogin={(u) => {
                          setUser(u);
                          setIsLoggedIn(true);
                        }}
                      />
                    )}
                  </Stack.Screen>
                  <Stack.Screen name="Register">
                    {(props) => (
                      <RegisterScreen
                        {...props}
                        onRegister={() => props.navigation.navigate('Login')}
                      />
                    )}
                  </Stack.Screen>
                </>
              ) : (
                <>
                  <Stack.Screen name="Main" component={MainTabs} />
                  <Stack.Screen name="BookAppointment" component={BookAppointmentScreen} />
                  <Stack.Screen name="AppointmentDetail" component={AppointmentDetailScreen} />
                  <Stack.Screen name="RecordDetail" component={RecordDetailScreen} />
                  <Stack.Screen name="HospitalList" component={HospitalListScreen} />
                </>
              )}
            </Stack.Navigator>
          </NavigationContainer>
        </AuthContext.Provider>
      </SafeAreaProvider>
    </ErrorBoundary>
  );
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.background,
  },
});
