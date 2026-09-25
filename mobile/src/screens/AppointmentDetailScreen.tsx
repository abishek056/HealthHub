import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert,
  Linking,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, Radius } from '../constants/theme';
import { RootStackParamList } from '../types/navigation';
import { getAppointment, cancelAppointment, Appointment } from '../api/appointments';

type Props = NativeStackScreenProps<RootStackParamList, 'AppointmentDetail'>;

const STATUS_META: Record<string, { label: string; color: string; icon: keyof typeof Ionicons.glyphMap }> = {
  pending: { label: 'Pending', color: '#F59E0B', icon: 'time-outline' },
  confirmed: { label: 'Confirmed', color: '#10B981', icon: 'checkmark-circle-outline' },
  completed: { label: 'Completed', color: '#6366F1', icon: 'checkmark-done-circle-outline' },
  cancelled: { label: 'Cancelled', color: '#EF4444', icon: 'close-circle-outline' },
};

export default function AppointmentDetailScreen({ navigation, route }: Props) {
  const { appointmentId } = route.params;
  const [appointment, setAppointment] = useState<Appointment | null>(null);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const apt = await getAppointment(appointmentId);
        setAppointment(apt);
      } catch (err: any) {
        Alert.alert('Error', err?.message || 'Failed to load appointment details');
      } finally {
        setLoading(false);
      }
    })();
  }, [appointmentId]);

  const handleCancel = () => {
    if (!appointment) return;
    Alert.alert(
      'Cancel Appointment',
      `Are you sure you want to cancel your appointment with ${appointment.doctor ? 'Dr. ' + appointment.doctor : appointment.department}?`,
      [
        { text: 'Keep It', style: 'cancel' },
        {
          text: 'Yes, Cancel',
          style: 'destructive',
          onPress: async () => {
            setCancelling(true);
            try {
              await cancelAppointment(appointment.id);
              setAppointment((prev) => (prev ? { ...prev, status: 'cancelled' } : prev));
              Alert.alert('Cancelled', 'Your appointment has been cancelled.');
            } catch (e: any) {
              Alert.alert('Error', e?.message || 'Could not cancel appointment.');
            } finally {
              setCancelling(false);
            }
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingCenter}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loadingText}>Loading appointment pass...</Text>
      </View>
    );
  }

  if (!appointment) {
    return (
      <View style={styles.container}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.errorText}>Appointment not found.</Text>
      </View>
    );
  }

  const meta = STATUS_META[appointment.status.toLowerCase()] || {
    label: appointment.status,
    color: Colors.textMuted,
    icon: 'help-circle-outline',
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Appointment Details</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Ticket Pass Container */}
        <View style={styles.passCard}>
          {/* Pass Top */}
          <View style={[styles.passTop, { backgroundColor: meta.color + '18' }]}>
            <View style={styles.passTopRow}>
              <View style={styles.passIconWrap}>
                <Ionicons name="ticket-outline" size={28} color={meta.color} />
              </View>
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={styles.passLabel}>Digital OPD Pass</Text>
                <Text style={styles.passAptId}>#{appointment.id}</Text>
              </View>
              {appointment.token_number ? (
                <View style={styles.tokenBadge}>
                  <Text style={styles.tokenBadgeLabel}>Token</Text>
                  <Text style={styles.tokenBadgeNum}>#{appointment.token_number}</Text>
                </View>
              ) : null}
            </View>

            <View style={[styles.statusTag, { backgroundColor: meta.color + '25' }]}>
              <Ionicons name={meta.icon} size={16} color={meta.color} />
              <Text style={[styles.statusTagText, { color: meta.color }]}>{meta.label}</Text>
            </View>
          </View>

          {/* Pass Body */}
          <View style={styles.passBody}>
            {/* Hospital Info */}
            {appointment.hospital && (
              <View style={styles.sectionRow}>
                <View style={styles.iconCircle}>
                  <Ionicons name="business" size={18} color={Colors.primary} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.fieldLabel}>Hospital</Text>
                  <Text style={styles.hospitalName}>{appointment.hospital.name}</Text>
                  {appointment.hospital.address && (
                    <Text style={styles.fieldSub}>{appointment.hospital.address}</Text>
                  )}
                  {appointment.hospital.phone && (
                    <TouchableOpacity
                      style={styles.callRow}
                      onPress={() => Linking.openURL(`tel:${appointment.hospital!.phone}`)}
                    >
                      <Ionicons name="call" size={14} color={Colors.secondary} />
                      <Text style={styles.callText}>{appointment.hospital.phone}</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            )}

            <View style={styles.divider} />

            {/* Department & Doctor */}
            <View style={styles.sectionRow}>
              <View style={styles.iconCircle}>
                <Ionicons name="medkit" size={18} color={Colors.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.fieldLabel}>Department & Doctor</Text>
                <Text style={styles.fieldValue}>
                  {appointment.doctor ? `Dr. ${appointment.doctor}` : 'General Consultant'}
                </Text>
                <Text style={styles.deptBadge}>{appointment.department} OPD</Text>
              </View>
            </View>

            <View style={styles.divider} />

            {/* Date & Time */}
            <View style={styles.gridTwo}>
              <View style={styles.sectionRow}>
                <View style={styles.iconCircle}>
                  <Ionicons name="calendar" size={18} color={Colors.primary} />
                </View>
                <View>
                  <Text style={styles.fieldLabel}>Date</Text>
                  <Text style={styles.fieldValue}>{appointment.date}</Text>
                </View>
              </View>

              <View style={styles.sectionRow}>
                <View style={styles.iconCircle}>
                  <Ionicons name="time" size={18} color={Colors.primary} />
                </View>
                <View>
                  <Text style={styles.fieldLabel}>Time Slot</Text>
                  <Text style={styles.fieldValue}>{appointment.time}</Text>
                </View>
              </View>
            </View>

            {appointment.reason ? (
              <>
                <View style={styles.divider} />
                <View style={styles.sectionRow}>
                  <View style={styles.iconCircle}>
                    <Ionicons name="document-text" size={18} color={Colors.primary} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.fieldLabel}>Reason / Symptoms</Text>
                    <Text style={styles.fieldValue}>{appointment.reason}</Text>
                  </View>
                </View>
              </>
            ) : null}

            {/* Clinical Diagnosis if completed */}
            {appointment.status === 'completed' && appointment.patient_record && (
              <View style={styles.clinicalBox}>
                <View style={styles.clinicalHeader}>
                  <Ionicons name="clipboard-outline" size={18} color={Colors.primary} />
                  <Text style={styles.clinicalTitle}>Clinical Visit Findings</Text>
                </View>
                {appointment.patient_record.diagnosis && (
                  <View style={{ marginBottom: 8 }}>
                    <Text style={styles.clinicalSub}>Problem Diagnosis</Text>
                    <Text style={styles.clinicalContent}>
                      {appointment.patient_record.diagnosis}
                    </Text>
                  </View>
                )}
                {appointment.patient_record.treatment && (
                  <View>
                    <Text style={styles.clinicalSub}>Prescribed Treatment</Text>
                    <Text style={styles.clinicalContent}>
                      {appointment.patient_record.treatment}
                    </Text>
                  </View>
                )}
              </View>
            )}
          </View>
        </View>

        {/* Action Buttons */}
        {(appointment.status === 'pending' || appointment.status === 'confirmed') && (
          <TouchableOpacity
            style={styles.cancelBtn}
            onPress={handleCancel}
            disabled={cancelling}
            activeOpacity={0.8}
          >
            {cancelling ? (
              <ActivityIndicator color={Colors.error} />
            ) : (
              <>
                <Ionicons name="close-circle-outline" size={20} color={Colors.error} />
                <Text style={styles.cancelBtnText}>Cancel Appointment</Text>
              </>
            )}
          </TouchableOpacity>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  loadingCenter: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.background },
  loadingText: { marginTop: Spacing.sm, color: Colors.textMuted, fontSize: 13 },
  errorText: { textAlign: 'center', color: Colors.error, marginTop: 40, fontSize: 15 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingTop: 54,
    paddingBottom: Spacing.md,
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  headerTitle: { fontSize: 17, fontWeight: '700', color: Colors.text },
  backBtn: { padding: 4 },
  scroll: { flex: 1, padding: Spacing.md },
  passCard: {
    backgroundColor: Colors.white,
    borderRadius: Radius.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.border,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  passTop: { padding: Spacing.lg },
  passTopRow: { flexDirection: 'row', alignItems: 'center' },
  passIconWrap: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: Colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  passLabel: { fontSize: 11, fontWeight: '700', textTransform: 'uppercase', color: Colors.textMuted, letterSpacing: 0.5 },
  passAptId: { fontSize: 18, fontWeight: '800', color: Colors.text },
  tokenBadge: {
    backgroundColor: Colors.white,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: Radius.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  tokenBadgeLabel: { fontSize: 9, fontWeight: '700', color: Colors.textMuted, textTransform: 'uppercase' },
  tokenBadgeNum: { fontSize: 16, fontWeight: '900', color: Colors.primary },
  statusTag: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: Radius.full,
    marginTop: 12,
  },
  statusTagText: { fontSize: 12, fontWeight: '700' },
  passBody: { padding: Spacing.lg },
  sectionRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#dff5ea',
    alignItems: 'center',
    justifyContent: 'center',
  },
  fieldLabel: { fontSize: 11, fontWeight: '600', color: Colors.textMuted, textTransform: 'uppercase' },
  hospitalName: { fontSize: 15, fontWeight: '700', color: Colors.text, marginTop: 2 },
  fieldValue: { fontSize: 14, fontWeight: '700', color: Colors.text, marginTop: 2 },
  fieldSub: { fontSize: 12, color: Colors.textMuted, marginTop: 2 },
  callRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 6 },
  callText: { fontSize: 13, fontWeight: '600', color: Colors.secondary },
  deptBadge: {
    alignSelf: 'flex-start',
    marginTop: 4,
    fontSize: 11,
    fontWeight: '700',
    color: Colors.primary,
    backgroundColor: '#dff5ea',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: Radius.sm,
  },
  divider: { height: 1, backgroundColor: Colors.border, marginVertical: Spacing.md },
  gridTwo: { flexDirection: 'row', justifyContent: 'space-between' },
  clinicalBox: {
    marginTop: Spacing.md,
    backgroundColor: '#f4fbf7',
    borderWidth: 1,
    borderColor: '#c2ebd5',
    borderRadius: Radius.md,
    padding: Spacing.md,
  },
  clinicalHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 },
  clinicalTitle: { fontSize: 13, fontWeight: '700', color: Colors.primary },
  clinicalSub: { fontSize: 11, fontWeight: '600', color: Colors.textMuted },
  clinicalContent: { fontSize: 13, color: Colors.text, marginTop: 2, fontWeight: '500' },
  cancelBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.white,
    borderWidth: 1.5,
    borderColor: Colors.error,
    borderRadius: Radius.md,
    paddingVertical: Spacing.md,
    marginTop: Spacing.lg,
  },
  cancelBtnText: { fontSize: 14, fontWeight: '700', color: Colors.error },
});
