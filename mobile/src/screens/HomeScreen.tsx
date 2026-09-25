import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  Linking,
  RefreshControl,
  ActivityIndicator,
  Image,
} from 'react-native';
import { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import { CompositeScreenProps } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, Radius } from '../constants/theme';
import { getCurrentUser, User } from '../api/auth';
import { getMyAppointments, Appointment } from '../api/appointments';
import { useAuthContext } from '../context/AuthContext';
import { TabParamList, RootStackParamList } from '../types/navigation';

type Props = CompositeScreenProps<
  BottomTabScreenProps<TabParamList, 'Home'>,
  NativeStackScreenProps<RootStackParamList>
>;

export default function HomeScreen({ navigation }: Props) {
  const { user, handleLogout } = useAuthContext();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const apts = await getMyAppointments();
      setAppointments(apts);
    } catch {
      setAppointments([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const handleSOS = () => {
    Alert.alert('🚨 Emergency SOS', 'Call emergency services immediately?', [
      { text: 'Cancel', style: 'cancel' },
      { text: '📞 Call 102', style: 'destructive', onPress: () => Linking.openURL('tel:102') },
      { text: '📞 Call 100', onPress: () => Linking.openURL('tel:100') },
    ]);
  };

  const handleLogoutPress = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign Out', style: 'destructive', onPress: handleLogout },
    ]);
  };

  const upcoming = appointments.filter(
    (a) => a.status === 'pending' || a.status === 'confirmed'
  ).slice(0, 3);

  const stats = {
    total: appointments.length,
    upcoming: appointments.filter((a) => a.status === 'pending' || a.status === 'confirmed').length,
    completed: appointments.filter((a) => a.status === 'completed').length,
  };

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Good Morning';
    if (h < 17) return 'Good Afternoon';
    return 'Good Evening';
  };

  const getStatusColor = (status: string) => {
    const map: Record<string, string> = {
      pending: Colors.warning,
      confirmed: Colors.success,
      completed: Colors.secondary,
      cancelled: Colors.error,
    };
    return map[status.toLowerCase()] || Colors.textMuted;
  };

  return (
    <ScrollView
      style={styles.container}
      showsVerticalScrollIndicator={false}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[Colors.primary]} />}
    >
      {/* Header Banner */}
      <LinearGradient colors={['#0b4d3c', '#167a68']} style={styles.header}>
        <View style={styles.headerTop}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: '#ffffff', alignItems: 'center', justifyContent: 'center' }}>
              <Image
                source={require('../../assets/healthhub-logo.png')}
                style={{ width: 32, height: 32, resizeMode: 'contain' }}
              />
            </View>
            <View>
              <Text style={styles.greeting}>{greeting()},</Text>
              <Text style={styles.userName}>{user?.name?.split(' ')[0] || 'Patient'} 👋</Text>
            </View>
          </View>
          <TouchableOpacity onPress={handleLogoutPress} style={styles.logoutBtn}>
            <Ionicons name="log-out-outline" size={22} color={Colors.white} />
          </TouchableOpacity>
        </View>

        {/* Stats Row */}
        <View style={styles.statsRow}>
          <View style={styles.statBox}>
            <Text style={styles.statNum}>{loading ? '–' : stats.total}</Text>
            <Text style={styles.statLabel}>Total</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statBox}>
            <Text style={styles.statNum}>{loading ? '–' : stats.upcoming}</Text>
            <Text style={styles.statLabel}>Upcoming</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statBox}>
            <Text style={styles.statNum}>{loading ? '–' : stats.completed}</Text>
            <Text style={styles.statLabel}>Completed</Text>
          </View>
        </View>
      </LinearGradient>

      <View style={styles.body}>
        {/* SOS Button */}
        <TouchableOpacity style={styles.sosBtn} onPress={handleSOS} activeOpacity={0.85}>
          <LinearGradient colors={['#e11d48', '#be123c']} style={styles.sosBtnInner}>
            <Ionicons name="warning" size={26} color={Colors.white} />
            <View style={{ marginLeft: 12 }}>
              <Text style={styles.sosTitle}>Emergency SOS</Text>
              <Text style={styles.sosSub}>Call 102 or 100 immediately</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="rgba(255,255,255,0.7)" style={{ marginLeft: 'auto' }} />
          </LinearGradient>
        </TouchableOpacity>

        {/* Quick Actions */}
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.grid}>
          <TouchableOpacity
            style={styles.actionCard}
            onPress={() => navigation.navigate('HospitalList')}
            activeOpacity={0.8}
          >
            <View style={[styles.actionIcon, { backgroundColor: '#CCFBF1' }]}>
              <Ionicons name="calendar-number" size={26} color={Colors.primary} />
            </View>
            <Text style={styles.actionTitle}>Book Visit</Text>
            <Text style={styles.actionSub}>Schedule an appointment</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionCard}
            onPress={() => navigation.navigate('Appointments')}
            activeOpacity={0.8}
          >
            <View style={[styles.actionIcon, { backgroundColor: '#E0F2FE' }]}>
              <Ionicons name="list-circle" size={26} color={Colors.secondary} />
            </View>
            <Text style={styles.actionTitle}>My Bookings</Text>
            <Text style={styles.actionSub}>View all appointments</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionCard}
            onPress={() => navigation.navigate('Records')}
            activeOpacity={0.8}
          >
            <View style={[styles.actionIcon, { backgroundColor: '#FEF3C7' }]}>
              <Ionicons name="document-text" size={26} color="#D97706" />
            </View>
            <Text style={styles.actionTitle}>My Records</Text>
            <Text style={styles.actionSub}>Health history</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionCard}
            onPress={() => navigation.navigate('Profile')}
            activeOpacity={0.8}
          >
            <View style={[styles.actionIcon, { backgroundColor: '#FCE7F3' }]}>
              <Ionicons name="person-circle" size={26} color="#DB2777" />
            </View>
            <Text style={styles.actionTitle}>Profile</Text>
            <Text style={styles.actionSub}>Account details</Text>
          </TouchableOpacity>
        </View>

        {/* Upcoming Appointments */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Upcoming Appointments</Text>
          {upcoming.length > 0 && (
            <TouchableOpacity onPress={() => navigation.navigate('Appointments')}>
              <Text style={styles.seeAll}>See All</Text>
            </TouchableOpacity>
          )}
        </View>

        {loading ? (
          <ActivityIndicator color={Colors.primary} style={{ marginVertical: Spacing.lg }} />
        ) : upcoming.length === 0 ? (
          <View style={styles.emptyCard}>
            <Ionicons name="calendar-outline" size={40} color={Colors.border} />
            <Text style={styles.emptyText}>No upcoming appointments</Text>
            <TouchableOpacity
              style={styles.bookNowBtn}
              onPress={() => navigation.navigate('HospitalList')}
            >
              <Text style={styles.bookNowText}>Book Now</Text>
            </TouchableOpacity>
          </View>
        ) : (
          upcoming.map((apt) => (
            <TouchableOpacity
              key={apt.id}
              style={styles.aptCard}
              onPress={() => navigation.navigate('AppointmentDetail', { appointmentId: apt.id })}
              activeOpacity={0.8}
            >
              <View style={styles.aptLeft}>
                <View style={[styles.aptStatusDot, { backgroundColor: getStatusColor(apt.status) }]} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.aptDoctor}>
                    {apt.doctor ? `Dr. ${apt.doctor}` : apt.department}
                  </Text>
                  <Text style={styles.aptDept}>{apt.department}</Text>
                  {apt.hospital && (
                    <Text style={styles.aptHospital} numberOfLines={1}>
                      🏥 {apt.hospital.name}
                    </Text>
                  )}
                </View>
              </View>
              <View style={styles.aptRight}>
                <Text style={styles.aptDate}>{apt.date}</Text>
                <Text style={styles.aptTime}>{apt.time}</Text>
                <View style={[styles.aptBadge, { backgroundColor: getStatusColor(apt.status) + '22' }]}>
                  <Text style={[styles.aptBadgeText, { color: getStatusColor(apt.status) }]}>
                    {apt.status.charAt(0).toUpperCase() + apt.status.slice(1)}
                  </Text>
                </View>
              </View>
            </TouchableOpacity>
          ))
        )}

        {/* Health Tip */}
        <View style={styles.tipCard}>
          <Ionicons name="bulb-outline" size={22} color="#D97706" />
          <Text style={styles.tipText}>
            💊 Stay hydrated and take prescribed medications on time for better recovery.
          </Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: { paddingTop: 60, paddingBottom: Spacing.xl, paddingHorizontal: Spacing.lg },
  headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: Spacing.lg },
  greeting: { color: 'rgba(255,255,255,0.75)', fontSize: 14 },
  userName: { color: Colors.white, fontSize: 24, fontWeight: '800' },
  logoutBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  statsRow: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderRadius: Radius.lg,
    padding: Spacing.md,
  },
  statBox: { flex: 1, alignItems: 'center' },
  statNum: { color: Colors.white, fontSize: 22, fontWeight: '800' },
  statLabel: { color: 'rgba(255,255,255,0.7)', fontSize: 12, marginTop: 2 },
  statDivider: { width: 1, backgroundColor: 'rgba(255,255,255,0.2)', marginHorizontal: 8 },
  body: { padding: Spacing.lg },
  sosBtn: { marginBottom: Spacing.lg, borderRadius: Radius.lg, overflow: 'hidden', elevation: 4 },
  sosBtnInner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md + 2,
  },
  sosTitle: { color: Colors.white, fontSize: 16, fontWeight: '700' },
  sosSub: { color: 'rgba(255,255,255,0.8)', fontSize: 12, marginTop: 2 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.md },
  sectionTitle: { fontSize: 17, fontWeight: '700', color: Colors.text, marginBottom: Spacing.md, marginTop: Spacing.sm },
  seeAll: { color: Colors.primary, fontSize: 13, fontWeight: '600' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: Spacing.md },
  actionCard: {
    width: '47%',
    backgroundColor: Colors.white,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
  },
  actionIcon: {
    width: 52,
    height: 52,
    borderRadius: Radius.md,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  actionTitle: { fontSize: 14, fontWeight: '700', color: Colors.text },
  actionSub: { fontSize: 12, color: Colors.textMuted, marginTop: 2 },
  emptyCard: {
    backgroundColor: Colors.white,
    borderRadius: Radius.lg,
    padding: Spacing.xl,
    alignItems: 'center',
    marginBottom: Spacing.md,
    elevation: 1,
  },
  emptyText: { color: Colors.textMuted, fontSize: 14, marginTop: 12, marginBottom: 16 },
  bookNowBtn: {
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.lg,
    paddingVertical: 10,
    borderRadius: Radius.full,
  },
  bookNowText: { color: Colors.white, fontWeight: '700', fontSize: 14 },
  aptCard: {
    backgroundColor: Colors.white,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.sm,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
  },
  aptLeft: { flex: 1, flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  aptStatusDot: { width: 8, height: 8, borderRadius: 4, marginTop: 4 },
  aptDoctor: { fontSize: 14, fontWeight: '700', color: Colors.text },
  aptDept: { fontSize: 12, color: Colors.primary, marginTop: 2 },
  aptHospital: { fontSize: 11, color: Colors.textMuted, marginTop: 2 },
  aptRight: { alignItems: 'flex-end', gap: 3 },
  aptDate: { fontSize: 12, fontWeight: '600', color: Colors.text },
  aptTime: { fontSize: 11, color: Colors.textMuted },
  aptBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: Radius.full, marginTop: 2 },
  aptBadgeText: { fontSize: 10, fontWeight: '700' },
  tipCard: {
    flexDirection: 'row',
    backgroundColor: '#FFFBEB',
    borderRadius: Radius.md,
    padding: Spacing.md,
    marginTop: Spacing.sm,
    alignItems: 'flex-start',
    gap: 10,
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  tipText: { flex: 1, fontSize: 13, color: '#92400E', lineHeight: 18 },
});
