import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  Linking,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as WebBrowser from 'expo-web-browser';
import { Colors, Spacing, Radius } from '../constants/theme';
import { getCurrentUser, User } from '../api/auth';
import { WEB_PORTAL_URL } from '../api/config';
import { useAuthContext } from '../context/AuthContext';
import { TabParamList } from '../types/navigation';

type Props = BottomTabScreenProps<TabParamList, 'Profile'>;

const BLOOD_GROUP_COLOR: Record<string, string> = {
  'A+': '#EF4444', 'A-': '#DC2626',
  'B+': '#F59E0B', 'B-': '#D97706',
  'AB+': '#8B5CF6', 'AB-': '#7C3AED',
  'O+': '#10B981', 'O-': '#059669',
};

export default function ProfileScreen({ navigation }: Props) {
  const { user, handleLogout } = useAuthContext();
  const [loading, setLoading] = useState(false);

  const handleLogoutPress = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out of your account?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: handleLogout,
        },
      ]
    );
  };

  const getInitials = (name: string) => {
    const parts = name.trim().split(' ');
    if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    return name.slice(0, 2).toUpperCase();
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return 'N/A';
    try {
      return new Date(dateStr).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    } catch {
      return dateStr;
    }
  };

  const handleOpenWebPortal = async () => {
    try {
      await WebBrowser.openBrowserAsync(WEB_PORTAL_URL, {
        presentationStyle: WebBrowser.WebBrowserPresentationStyle.PAGE_SHEET,
        toolbarColor: '#0b4d3c',
        controlsColor: '#ffffff',
      });
    } catch {
      try {
        await Linking.openURL(WEB_PORTAL_URL);
      } catch (e: any) {
        Alert.alert(
          'Web Portal Connection',
          `Ensure client server is running with 'npm run dev' inside client directory.\n\nURL: ${WEB_PORTAL_URL}`
        );
      }
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header Banner */}
        <LinearGradient colors={['#0b4d3c', '#167a68']} style={styles.banner}>
          {/* Avatar */}
          <View style={styles.avatarRing}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>
                {user?.name ? getInitials(user.name) : '?'}
              </Text>
            </View>
          </View>
          <Text style={styles.name}>{user?.name || 'Patient'}</Text>
          <View style={styles.roleBadge}>
            <Ionicons name="shield-checkmark" size={12} color={Colors.primary} />
            <Text style={styles.roleText}>Verified Patient</Text>
          </View>
        </LinearGradient>

        {/* Blood Group Banner */}
        {user?.blood_group && (
          <View style={[styles.bloodBadge, { backgroundColor: (BLOOD_GROUP_COLOR[user.blood_group] || Colors.primary) + '18' }]}>
            <Text style={{ fontSize: 20 }}>🩸</Text>
            <Text style={[styles.bloodText, { color: BLOOD_GROUP_COLOR[user.blood_group] || Colors.primary }]}>
              Blood Group: <Text style={{ fontWeight: '800' }}>{user.blood_group}</Text>
            </Text>
          </View>
        )}

        <View style={styles.body}>
          {/* Account Info */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Account Information</Text>
            <InfoRow icon="person-outline" label="Full Name" value={user?.name || '–'} />
            <InfoRow icon="mail-outline" label="Email" value={user?.email || '–'} />
            <InfoRow icon="call-outline" label="Phone" value={user?.phone || 'Not provided'} />
            {user?.age != null && (
              <InfoRow icon="calendar-outline" label="Age" value={`${user.age} years`} />
            )}
            <InfoRow
              icon="calendar-outline"
              label="Member Since"
              value={formatDate(user?.created_at)}
            />
          </View>

          {/* App Settings */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Help & Support</Text>
            <SettingRow
              icon="call-outline"
              label="Emergency Helpline"
              value="Call 108"
              onPress={() => Linking.openURL('tel:108')}
              color={Colors.error}
            />
            <SettingRow
              icon="globe-outline"
              label="Web Patient Portal"
              value="Open in browser"
              onPress={handleOpenWebPortal}
            />
            <SettingRow
              icon="information-circle-outline"
              label="About HealthHub"
              value="Patient Mobile App v1.0"
            />
          </View>

          {/* Logout */}
          <TouchableOpacity style={styles.logoutBtn} onPress={handleLogoutPress} activeOpacity={0.85}>
            <Ionicons name="log-out-outline" size={20} color={Colors.error} />
            <Text style={styles.logoutText}>Sign Out</Text>
          </TouchableOpacity>

          <Text style={styles.footer}>
            HealthHub Patient Mobile App{'\n'}
            Connected to HMS Server · All rights reserved
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function InfoRow({ icon, label, value }: { icon: string; label: string; value: string }) {
  return (
    <View style={styles.infoRow}>
      <View style={styles.infoIconBox}>
        <Ionicons name={icon as any} size={16} color={Colors.primary} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.infoLabel}>{label}</Text>
        <Text style={styles.infoValue}>{value}</Text>
      </View>
    </View>
  );
}

function SettingRow({
  icon,
  label,
  value,
  onPress,
  color,
}: {
  icon: string;
  label: string;
  value?: string;
  onPress?: () => void;
  color?: string;
}) {
  const Inner = (
    <View style={styles.settingRow}>
      <View style={[styles.settingIconBox, { backgroundColor: (color || Colors.primary) + '18' }]}>
        <Ionicons name={icon as any} size={18} color={color || Colors.primary} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={[styles.settingLabel, color ? { color } : {}]}>{label}</Text>
        {value && <Text style={styles.settingValue}>{value}</Text>}
      </View>
      {onPress && <Ionicons name="chevron-forward" size={16} color={Colors.border} />}
    </View>
  );
  if (onPress) {
    return (
      <TouchableOpacity onPress={onPress} activeOpacity={0.7}>
        {Inner}
      </TouchableOpacity>
    );
  }
  return Inner;
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  banner: {
    alignItems: 'center',
    paddingTop: 60,
    paddingBottom: Spacing.xl,
    paddingHorizontal: Spacing.lg,
  },
  avatarRing: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.white,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 6,
  },
  avatarText: { fontSize: 28, fontWeight: '800', color: Colors.primary },
  name: { fontSize: 22, fontWeight: '800', color: Colors.white, marginBottom: 8 },
  roleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: Colors.white,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: Radius.full,
  },
  roleText: { fontSize: 12, fontWeight: '700', color: Colors.primary },
  bloodBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 14,
    paddingHorizontal: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  bloodText: { fontSize: 15, fontWeight: '600' },
  body: { padding: Spacing.lg },
  card: {
    backgroundColor: Colors.white,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
  },
  cardTitle: { fontSize: 14, fontWeight: '700', color: Colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: Spacing.md },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: Colors.background,
  },
  infoIconBox: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.primarySubtle,
    justifyContent: 'center',
    alignItems: 'center',
  },
  infoLabel: { fontSize: 11, color: Colors.textMuted, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.4 },
  infoValue: { fontSize: 14, color: Colors.text, fontWeight: '500', marginTop: 2 },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.background,
  },
  settingIconBox: {
    width: 36,
    height: 36,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  settingLabel: { fontSize: 14, color: Colors.text, fontWeight: '600' },
  settingValue: { fontSize: 12, color: Colors.textMuted, marginTop: 2 },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    borderWidth: 2,
    borderColor: Colors.error,
    borderRadius: Radius.lg,
    paddingVertical: 14,
    marginBottom: Spacing.lg,
  },
  logoutText: { color: Colors.error, fontSize: 16, fontWeight: '700' },
  footer: { textAlign: 'center', color: Colors.textMuted, fontSize: 12, lineHeight: 18 },
});
