import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  RefreshControl,
  ActivityIndicator,
  Modal,
  ScrollView,
  Alert,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import { CompositeScreenProps } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, Radius } from '../constants/theme';
import { getMyAppointments, cancelAppointment, Appointment } from '../api/appointments';
import { ApiError } from '../api/client';
import { TabParamList, RootStackParamList } from '../types/navigation';

type Props = CompositeScreenProps<
  BottomTabScreenProps<TabParamList, 'Appointments'>,
  NativeStackScreenProps<RootStackParamList>
>;

const STATUS_FILTERS = ['all', 'pending', 'confirmed', 'completed', 'cancelled'] as const;

const STATUS_META: Record<string, { label: string; color: string; icon: keyof typeof import('@expo/vector-icons').Ionicons.glyphMap }> = {
  pending: { label: 'Pending', color: '#F59E0B', icon: 'time-outline' },
  confirmed: { label: 'Confirmed', color: '#10B981', icon: 'checkmark-circle-outline' },
  completed: { label: 'Completed', color: '#6366F1', icon: 'checkmark-done-circle-outline' },
  cancelled: { label: 'Cancelled', color: '#EF4444', icon: 'close-circle-outline' },
};

export default function AppointmentsScreen({ navigation }: Props) {
  const [list, setList] = useState<Appointment[]>([]);
  const [filter, setFilter] = useState<string>('all');
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [selectedApt, setSelectedApt] = useState<Appointment | null>(null);

  const load = useCallback(async () => {
    try {
      setError(null);
      const data = await getMyAppointments();
      // Sort newest first
      setList(data.sort((a, b) => b.id.localeCompare(a.id)));
    } catch (e: any) {
      setError(e instanceof ApiError ? e.message : e?.message || 'Failed to load appointments');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  const handleCancel = (apt: Appointment) => {
    Alert.alert(
      'Cancel Appointment',
      `Cancel your appointment with ${apt.doctor ? 'Dr. ' + apt.doctor : apt.department} on ${apt.date}?`,
      [
        { text: 'Keep it', style: 'cancel' },
        {
          text: 'Cancel Appointment',
          style: 'destructive',
          onPress: async () => {
            setCancellingId(apt.id);
            try {
              await cancelAppointment(apt.id);
              setList((prev) =>
                prev.map((a) => (a.id === apt.id ? { ...a, status: 'cancelled' } : a))
              );
              if (selectedApt?.id === apt.id) {
                setSelectedApt({ ...apt, status: 'cancelled' });
              }
              Alert.alert('Cancelled', 'Your appointment has been cancelled.');
            } catch (e: any) {
              Alert.alert('Error', e?.message || 'Could not cancel appointment.');
            } finally {
              setCancellingId(null);
            }
          },
        },
      ]
    );
  };

  const filtered = filter === 'all' ? list : list.filter((a) => a.status.toLowerCase() === filter);

  const renderItem = ({ item }: { item: Appointment }) => {
    const meta = STATUS_META[item.status.toLowerCase()] || { label: item.status, color: Colors.textMuted, icon: 'help-circle-outline' };
    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() => setSelectedApt(item)}
        activeOpacity={0.8}
      >
        {/* Left accent bar */}
        <View style={[styles.accentBar, { backgroundColor: meta.color }]} />
        <View style={styles.cardContent}>
          <View style={styles.cardTop}>
            <View style={{ flex: 1 }}>
              <Text style={styles.cardDoctor}>
                {item.doctor ? `Dr. ${item.doctor}` : item.department || 'Appointment'}
              </Text>
              <Text style={styles.cardDept}>{item.department}</Text>
            </View>
            <View style={[styles.statusBadge, { backgroundColor: meta.color + '22' }]}>
              <Ionicons name={meta.icon as any} size={12} color={meta.color} />
              <Text style={[styles.statusText, { color: meta.color }]}>{meta.label}</Text>
            </View>
          </View>

          {item.hospital && (
            <View style={styles.infoRow}>
              <Ionicons name="business-outline" size={13} color={Colors.textMuted} />
              <Text style={styles.infoText} numberOfLines={1}>{item.hospital.name}</Text>
            </View>
          )}
          <View style={styles.dateRow}>
            <View style={styles.infoRow}>
              <Ionicons name="calendar-outline" size={13} color={Colors.textMuted} />
              <Text style={styles.infoText}>{item.date}</Text>
            </View>
            <View style={styles.infoRow}>
              <Ionicons name="time-outline" size={13} color={Colors.textMuted} />
              <Text style={styles.infoText}>{item.time}</Text>
            </View>
            {item.token_number && (
              <View style={styles.tokenBadge}>
                <Text style={styles.tokenText}>Token #{item.token_number}</Text>
              </View>
            )}
          </View>

          {item.reason ? (
            <Text style={styles.reason} numberOfLines={1}>📋 {item.reason}</Text>
          ) : null}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.safe}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Appointments</Text>
        <TouchableOpacity
          style={styles.addBtn}
          onPress={() => navigation.navigate('HospitalList')}
        >
          <Ionicons name="add" size={22} color={Colors.white} />
        </TouchableOpacity>
      </View>

      {/* Filter Tabs */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.filterBar}
        contentContainerStyle={styles.filterContent}
      >
        {STATUS_FILTERS.map((s) => (
          <TouchableOpacity
            key={s}
            style={[styles.filterChip, filter === s && styles.filterChipActive]}
            onPress={() => setFilter(s)}
          >
            <Text style={[styles.filterText, filter === s && styles.filterTextActive]}>
              {s === 'all' ? `All (${list.length})` : `${STATUS_META[s]?.label || s} (${list.filter(a => a.status.toLowerCase() === s).length})`}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={{ marginTop: 12, color: Colors.textMuted, fontSize: 13, fontWeight: '500' }}>
            Loading appointments…
          </Text>
        </View>
      ) : (
        <FlatList
          style={styles.flatList}
          data={filtered}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[Colors.primary]} />
          }
          ListEmptyComponent={
            <View style={styles.empty}>
              <Ionicons name="calendar-outline" size={64} color={Colors.border} />
              <Text style={styles.emptyTitle}>{error ? 'Error loading' : 'No appointments'}</Text>
              <Text style={styles.emptySub}>
                {error ? error : filter === 'all' ? 'Book your first appointment' : `No ${filter} appointments`}
              </Text>
              {!error && filter === 'all' && (
                <TouchableOpacity
                  style={styles.emptyBtn}
                  onPress={() => navigation.navigate('HospitalList')}
                >
                  <Text style={styles.emptyBtnText}>Book Appointment</Text>
                </TouchableOpacity>
              )}
            </View>
          }
          renderItem={renderItem}
        />
      )}

      {/* Appointment Detail Modal */}
      <Modal
        visible={!!selectedApt}
        animationType="slide"
        transparent
        onRequestClose={() => setSelectedApt(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHandle} />

            {selectedApt && (
              <ScrollView showsVerticalScrollIndicator={false}>
                {/* Pass / Token Header */}
                <View style={[styles.passHeader, { backgroundColor: (STATUS_META[selectedApt.status.toLowerCase()]?.color || Colors.primary) + '15' }]}>
                  <View style={styles.passIcon}>
                    <Ionicons name="ticket-outline" size={28} color={STATUS_META[selectedApt.status.toLowerCase()]?.color || Colors.primary} />
                  </View>
                  <Text style={styles.passTitle}>Appointment Pass</Text>
                  {selectedApt.token_number && (
                    <View style={styles.tokenCircle}>
                      <Text style={styles.tokenCircleLabel}>Token</Text>
                      <Text style={styles.tokenCircleNum}>#{selectedApt.token_number}</Text>
                    </View>
                  )}
                </View>

                {/* Status Badge */}
                {(() => {
                  const meta = STATUS_META[selectedApt.status.toLowerCase()];
                  return (
                    <View style={[styles.statusBanner, { backgroundColor: meta?.color + '22' }]}>
                      <Ionicons name={meta?.icon as any || 'help-circle'} size={16} color={meta?.color} />
                      <Text style={[styles.statusBannerText, { color: meta?.color }]}>
                        {meta?.label || selectedApt.status}
                      </Text>
                    </View>
                  );
                })()}

                {/* Details Grid */}
                <View style={styles.detailsGrid}>
                  {selectedApt.hospital && (
                    <DetailRow icon="business-outline" label="Hospital" value={selectedApt.hospital.name} />
                  )}
                  {selectedApt.department && (
                    <DetailRow icon="medkit-outline" label="Department" value={selectedApt.department} />
                  )}
                  {selectedApt.doctor && (
                    <DetailRow icon="person-outline" label="Doctor" value={`Dr. ${selectedApt.doctor}`} />
                  )}
                  <DetailRow icon="calendar-outline" label="Date" value={selectedApt.date} />
                  <DetailRow icon="time-outline" label="Time" value={selectedApt.time} />
                  {selectedApt.reason && (
                    <DetailRow icon="clipboard-outline" label="Reason" value={selectedApt.reason} />
                  )}
                  {selectedApt.hospital?.address && (
                    <DetailRow icon="location-outline" label="Address" value={selectedApt.hospital.address} />
                  )}
                  {selectedApt.hospital?.phone && (
                    <DetailRow
                      icon="call-outline"
                      label="Hospital Phone"
                      value={selectedApt.hospital.phone}
                      onPress={() => Linking.openURL(`tel:${selectedApt.hospital!.phone}`)}
                    />
                  )}
                </View>

                {/* Completed: Show diagnosis/treatment */}
                {selectedApt.status === 'completed' && selectedApt.patient_record && (
                  <View style={styles.clinicalBox}>
                    <Text style={styles.clinicalTitle}>Clinical Summary</Text>
                    {selectedApt.patient_record.diagnosis && (
                      <>
                        <Text style={styles.clinicalLabel}>Diagnosis</Text>
                        <Text style={styles.clinicalValue}>{selectedApt.patient_record.diagnosis}</Text>
                      </>
                    )}
                    {selectedApt.patient_record.treatment && (
                      <>
                        <Text style={styles.clinicalLabel}>Treatment</Text>
                        <Text style={styles.clinicalValue}>{selectedApt.patient_record.treatment}</Text>
                      </>
                    )}
                  </View>
                )}

                {/* Actions */}
                <View style={styles.modalActions}>
                  {(selectedApt.status === 'pending' || selectedApt.status === 'confirmed') && (
                    <TouchableOpacity
                      style={styles.cancelBtn}
                      onPress={() => {
                        setSelectedApt(null);
                        setTimeout(() => handleCancel(selectedApt), 300);
                      }}
                      disabled={cancellingId === selectedApt.id}
                    >
                      {cancellingId === selectedApt.id ? (
                        <ActivityIndicator color={Colors.error} />
                      ) : (
                        <>
                          <Ionicons name="close-circle-outline" size={18} color={Colors.error} />
                          <Text style={styles.cancelBtnText}>Cancel Appointment</Text>
                        </>
                      )}
                    </TouchableOpacity>
                  )}
                  <TouchableOpacity
                    style={styles.closeBtn}
                    onPress={() => setSelectedApt(null)}
                  >
                    <Text style={styles.closeBtnText}>Close</Text>
                  </TouchableOpacity>
                </View>
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}


function DetailRow({
  icon,
  label,
  value,
  onPress,
}: {
  icon: string;
  label: string;
  value: string;
  onPress?: () => void;
}) {
  const Inner = (
    <View style={styles.detailRow}>
      <View style={styles.detailIconWrap}>
        <Ionicons name={icon as any} size={16} color={Colors.primary} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.detailLabel}>{label}</Text>
        <Text style={[styles.detailValue, onPress && { color: Colors.secondary, textDecorationLine: 'underline' }]}>
          {value}
        </Text>
      </View>
    </View>
  );
  if (onPress) {
    return <TouchableOpacity onPress={onPress}>{Inner}</TouchableOpacity>;
  }
  return Inner;
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingTop: 56,
    paddingBottom: Spacing.md,
    backgroundColor: Colors.white,
    elevation: 2,
  },
  headerTitle: { fontSize: 20, fontWeight: '800', color: Colors.text },
  addBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  filterBar: {
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    flexGrow: 0,
    flexShrink: 0,
  },
  filterContent: {
    paddingHorizontal: Spacing.md,
    paddingVertical: 10,
    gap: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: Radius.full,
    backgroundColor: Colors.background,
    borderWidth: 1.5,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterChipActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  filterText: { fontSize: 12, fontWeight: '600', color: Colors.textMuted },
  filterTextActive: { color: Colors.white, fontWeight: '700' },
  flatList: { flex: 1 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  list: { padding: Spacing.md, paddingBottom: 40 },
  empty: { alignItems: 'center', paddingTop: 80 },
  emptyTitle: { fontSize: 17, fontWeight: '700', color: Colors.textMuted, marginTop: 16 },
  emptySub: { fontSize: 13, color: Colors.textMuted, marginTop: 6, textAlign: 'center' },
  emptyBtn: {
    marginTop: Spacing.lg,
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.lg,
    paddingVertical: 12,
    borderRadius: Radius.full,
  },
  emptyBtnText: { color: Colors.white, fontWeight: '700', fontSize: 14 },
  card: {
    backgroundColor: Colors.white,
    borderRadius: Radius.lg,
    marginBottom: Spacing.sm,
    flexDirection: 'row',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    overflow: 'hidden',
  },
  accentBar: { width: 4, borderRadius: 0 },
  cardContent: { flex: 1, padding: Spacing.md },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 },
  cardDoctor: { fontSize: 15, fontWeight: '700', color: Colors.text },
  cardDept: { fontSize: 12, color: Colors.primary, marginTop: 2 },
  statusBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 4, borderRadius: Radius.full },
  statusText: { fontSize: 11, fontWeight: '700' },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  infoText: { fontSize: 12, color: Colors.textMuted },
  dateRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 6, flexWrap: 'wrap' },
  tokenBadge: {
    backgroundColor: Colors.secondary + '22',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Radius.full,
  },
  tokenText: { fontSize: 11, color: Colors.secondary, fontWeight: '700' },
  reason: { fontSize: 12, color: Colors.textMuted, marginTop: 6, fontStyle: 'italic' },
  // Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' },
  modalSheet: {
    backgroundColor: Colors.white,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    maxHeight: '90%',
    paddingHorizontal: Spacing.lg,
    paddingBottom: 40,
    paddingTop: Spacing.md,
  },
  modalHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.border,
    alignSelf: 'center',
    marginBottom: Spacing.md,
  },
  passHeader: {
    alignItems: 'center',
    padding: Spacing.lg,
    borderRadius: Radius.lg,
    marginBottom: Spacing.md,
  },
  passIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.white,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.sm,
    elevation: 3,
  },
  passTitle: { fontSize: 18, fontWeight: '800', color: Colors.text },
  tokenCircle: {
    marginTop: Spacing.sm,
    backgroundColor: Colors.white,
    borderRadius: Radius.lg,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    alignItems: 'center',
    elevation: 2,
  },
  tokenCircleLabel: { fontSize: 11, color: Colors.textMuted, fontWeight: '600' },
  tokenCircleNum: { fontSize: 22, fontWeight: '800', color: Colors.secondary },
  statusBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 8,
    borderRadius: Radius.md,
    marginBottom: Spacing.md,
  },
  statusBannerText: { fontSize: 14, fontWeight: '700' },
  detailsGrid: { gap: 2 },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: Colors.background,
  },
  detailIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.primarySubtle,
    justifyContent: 'center',
    alignItems: 'center',
  },
  detailLabel: { fontSize: 11, color: Colors.textMuted, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5 },
  detailValue: { fontSize: 14, color: Colors.text, fontWeight: '500', marginTop: 2 },
  clinicalBox: {
    backgroundColor: '#F0FDF4',
    borderRadius: Radius.lg,
    padding: Spacing.md,
    marginTop: Spacing.md,
    borderWidth: 1,
    borderColor: '#BBF7D0',
  },
  clinicalTitle: { fontSize: 15, fontWeight: '800', color: Colors.primary, marginBottom: Spacing.sm },
  clinicalLabel: { fontSize: 11, color: Colors.textMuted, fontWeight: '700', textTransform: 'uppercase', marginBottom: 4 },
  clinicalValue: { fontSize: 14, color: Colors.text, lineHeight: 20, marginBottom: Spacing.sm },
  modalActions: { marginTop: Spacing.lg, gap: 10 },
  cancelBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderWidth: 2,
    borderColor: Colors.error,
    borderRadius: Radius.md,
    paddingVertical: 12,
  },
  cancelBtnText: { color: Colors.error, fontSize: 15, fontWeight: '700' },
  closeBtn: {
    backgroundColor: Colors.primary,
    borderRadius: Radius.md,
    paddingVertical: 14,
    alignItems: 'center',
  },
  closeBtnText: { color: Colors.white, fontSize: 16, fontWeight: '700' },
});
