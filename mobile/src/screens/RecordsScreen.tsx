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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import { CompositeScreenProps } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, Radius } from '../constants/theme';
import { getMyRecords, MedicalRecord } from '../api/records';
import { ApiError } from '../api/client';
import { TabParamList, RootStackParamList } from '../types/navigation';

type Props = CompositeScreenProps<
  BottomTabScreenProps<TabParamList, 'Records'>,
  NativeStackScreenProps<RootStackParamList>
>;

const GENDER_ICON: Record<string, string> = {
  male: '👨',
  female: '👩',
  other: '🧑',
};

function formatDate(raw: string) {
  if (!raw) return '';
  try {
    const d = new Date(raw);
    return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  } catch {
    return raw;
  }
}

export default function RecordsScreen({ navigation }: Props) {
  const [list, setList] = useState<MedicalRecord[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hospitalFilter, setHospitalFilter] = useState<string>('all');
  const [selectedRecord, setSelectedRecord] = useState<MedicalRecord | null>(null);

  const load = useCallback(async () => {
    try {
      setError(null);
      const data = await getMyRecords();
      setList(data.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
    } catch (e: any) {
      setError(e instanceof ApiError ? e.message : e?.message || 'Failed to load records');
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

  // Unique hospitals for filter
  const hospitals = ['all', ...new Set(list.map((r) => r.hospital).filter(Boolean))];

  const filtered =
    hospitalFilter === 'all'
      ? list
      : list.filter((r) => r.hospital === hospitalFilter);

  const renderRecord = ({ item }: { item: MedicalRecord }) => (
    <TouchableOpacity style={styles.card} onPress={() => setSelectedRecord(item)} activeOpacity={0.8}>
      <View style={styles.cardLeft}>
        <View style={styles.iconBox}>
          <Ionicons name="medical-outline" size={22} color={Colors.primary} />
        </View>
      </View>
      <View style={styles.cardBody}>
        <View style={styles.cardTop}>
          <Text style={styles.diagnosis} numberOfLines={1}>{item.diagnosis}</Text>
          <Text style={styles.date}>{formatDate(item.date)}</Text>
        </View>
        <Text style={styles.hospital} numberOfLines={1}>
          🏥 {item.hospital}
        </Text>
        {item.department && (
          <Text style={styles.dept} numberOfLines={1}>
            {item.department}
          </Text>
        )}
        {item.doctor && (
          <Text style={styles.doctor} numberOfLines={1}>
            👨‍⚕️ Dr. {item.doctor}
          </Text>
        )}
        {item.treatment && (
          <Text style={styles.treatment} numberOfLines={2}>
            💊 {item.treatment}
          </Text>
        )}
        {item.appointment && (
          <View style={styles.aptBadge}>
            <Ionicons name="ticket-outline" size={11} color={Colors.secondary} />
            <Text style={styles.aptBadgeText}>
              {item.appointment.department || 'Appointment'}
              {item.appointment.token_number ? ` · Token #${item.appointment.token_number}` : ''}
            </Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.safe}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Medical Records</Text>
        <View style={styles.countBadge}>
          <Text style={styles.countText}>{list.length}</Text>
        </View>
      </View>

      {/* Hospital Filter */}
      {hospitals.length > 1 && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.filterBar}
          contentContainerStyle={styles.filterContent}
        >
          {hospitals.map((h) => (
            <TouchableOpacity
              key={h}
              style={[styles.filterChip, hospitalFilter === h && styles.filterChipActive]}
              onPress={() => setHospitalFilter(h)}
            >
              <Text style={[styles.filterText, hospitalFilter === h && styles.filterTextActive]}>
                {h === 'all' ? '🏥 All Hospitals' : h}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>Loading your records…</Text>
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[Colors.primary]} />
          }
          ListEmptyComponent={
            <View style={styles.empty}>
              <Ionicons name="folder-open-outline" size={64} color={Colors.border} />
              <Text style={styles.emptyTitle}>{error || 'No records found'}</Text>
              <Text style={styles.emptySub}>
                {error ? 'Pull to retry' : 'Your medical records will appear here after appointments are completed by hospital staff.'}
              </Text>
            </View>
          }
          renderItem={renderRecord}
        />
      )}

      {/* Record Detail Modal */}
      <Modal
        visible={!!selectedRecord}
        animationType="slide"
        transparent
        onRequestClose={() => setSelectedRecord(null)}
      >
        <View style={styles.overlay}>
          <View style={styles.sheet}>
            <View style={styles.handle} />
            {selectedRecord && (
              <ScrollView showsVerticalScrollIndicator={false}>
                {/* Banner */}
                <View style={styles.recordBanner}>
                  <View style={styles.recordIcon}>
                    <Ionicons name="clipboard" size={28} color={Colors.primary} />
                  </View>
                  <Text style={styles.recordBannerTitle}>Medical Record</Text>
                  <Text style={styles.recordBannerDate}>{formatDate(selectedRecord.date)}</Text>
                </View>

                {/* Hospital */}
                <View style={styles.sectionBox}>
                  <Text style={styles.sectionLabel}>Hospital</Text>
                  <Text style={styles.sectionValue}>🏥 {selectedRecord.hospital}</Text>
                </View>

                {/* Patient Info */}
                <View style={styles.sectionBox}>
                  <Text style={styles.sectionLabel}>Patient Details</Text>
                  <View style={styles.infoGrid}>
                    {selectedRecord.age != null && (
                      <View style={styles.infoChip}>
                        <Ionicons name="person-outline" size={14} color={Colors.primary} />
                        <Text style={styles.infoChipText}>Age: {selectedRecord.age}</Text>
                      </View>
                    )}
                    {selectedRecord.gender && (
                      <View style={styles.infoChip}>
                        <Text>{GENDER_ICON[selectedRecord.gender] || '🧑'}</Text>
                        <Text style={styles.infoChipText}>
                          {selectedRecord.gender.charAt(0).toUpperCase() + selectedRecord.gender.slice(1)}
                        </Text>
                      </View>
                    )}
                    {selectedRecord.phone && (
                      <View style={styles.infoChip}>
                        <Ionicons name="call-outline" size={14} color={Colors.primary} />
                        <Text style={styles.infoChipText}>{selectedRecord.phone}</Text>
                      </View>
                    )}
                  </View>
                </View>

                {/* Appointment Info */}
                {selectedRecord.appointment && (
                  <View style={styles.sectionBox}>
                    <Text style={styles.sectionLabel}>Visit Info</Text>
                    {selectedRecord.department && (
                      <View style={styles.infoRow}>
                        <Ionicons name="medkit-outline" size={15} color={Colors.primary} />
                        <Text style={styles.infoRowText}>{selectedRecord.department}</Text>
                      </View>
                    )}
                    {selectedRecord.doctor && (
                      <View style={styles.infoRow}>
                        <Ionicons name="person-outline" size={15} color={Colors.primary} />
                        <Text style={styles.infoRowText}>Dr. {selectedRecord.doctor}</Text>
                      </View>
                    )}
                    {selectedRecord.appointment.token_number && (
                      <View style={styles.tokenBox}>
                        <Text style={styles.tokenLabel}>Appointment Token</Text>
                        <Text style={styles.tokenNumber}>#{selectedRecord.appointment.token_number}</Text>
                      </View>
                    )}
                    {selectedRecord.appointment.date && (
                      <View style={styles.infoRow}>
                        <Ionicons name="calendar-outline" size={15} color={Colors.primary} />
                        <Text style={styles.infoRowText}>{selectedRecord.appointment.date}</Text>
                      </View>
                    )}
                  </View>
                )}

                {/* Diagnosis */}
                <View style={[styles.sectionBox, { backgroundColor: '#F0FDF4', borderColor: '#BBF7D0' }]}>
                  <Text style={[styles.sectionLabel, { color: Colors.primary }]}>Diagnosis</Text>
                  <Text style={styles.clinicalText}>{selectedRecord.diagnosis}</Text>
                </View>

                {/* Treatment */}
                {selectedRecord.treatment && (
                  <View style={[styles.sectionBox, { backgroundColor: '#EFF6FF', borderColor: '#BFDBFE' }]}>
                    <Text style={[styles.sectionLabel, { color: Colors.secondary }]}>Prescribed Treatment</Text>
                    <Text style={styles.clinicalText}>{selectedRecord.treatment}</Text>
                  </View>
                )}

                <TouchableOpacity style={styles.closeBtn} onPress={() => setSelectedRecord(null)}>
                  <Text style={styles.closeBtnText}>Close</Text>
                </TouchableOpacity>
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
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
  countBadge: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: Radius.full,
    minWidth: 28,
    alignItems: 'center',
  },
  countText: { color: Colors.white, fontSize: 13, fontWeight: '700' },
  filterBar: { backgroundColor: Colors.white, borderBottomWidth: 1, borderBottomColor: Colors.border, maxHeight: 54 },
  filterContent: { paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, gap: 8, flexDirection: 'row' },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: Radius.full,
    backgroundColor: Colors.background,
    borderWidth: 1.5,
    borderColor: Colors.border,
  },
  filterChipActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  filterText: { fontSize: 12, fontWeight: '600', color: Colors.textMuted },
  filterTextActive: { color: Colors.white },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { color: Colors.textMuted, marginTop: Spacing.sm, fontSize: 13 },
  list: { padding: Spacing.md, paddingBottom: 40 },
  empty: { alignItems: 'center', paddingTop: 80, paddingHorizontal: Spacing.xl },
  emptyTitle: { fontSize: 17, fontWeight: '700', color: Colors.textMuted, marginTop: 16 },
  emptySub: { fontSize: 13, color: Colors.textMuted, marginTop: 6, textAlign: 'center', lineHeight: 20 },
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
  cardLeft: { padding: Spacing.md, justifyContent: 'flex-start', paddingTop: Spacing.md },
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: Radius.md,
    backgroundColor: Colors.primarySubtle,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardBody: { flex: 1, padding: Spacing.md, paddingLeft: 0 },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 },
  diagnosis: { fontSize: 15, fontWeight: '700', color: Colors.text, flex: 1, marginRight: 8 },
  date: { fontSize: 11, color: Colors.textMuted, fontWeight: '500' },
  hospital: { fontSize: 13, color: Colors.primary, marginBottom: 2 },
  dept: { fontSize: 12, color: Colors.textMuted, marginBottom: 2 },
  doctor: { fontSize: 12, color: Colors.textMuted, marginBottom: 4 },
  treatment: { fontSize: 12, color: Colors.textMuted, fontStyle: 'italic', lineHeight: 17 },
  aptBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 6,
    backgroundColor: Colors.secondaryLight,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: Radius.full,
    alignSelf: 'flex-start',
  },
  aptBadgeText: { fontSize: 11, color: Colors.secondary, fontWeight: '600' },
  // Modal
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: Colors.white,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    maxHeight: '92%',
    paddingHorizontal: Spacing.lg,
    paddingBottom: 40,
    paddingTop: Spacing.md,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.border,
    alignSelf: 'center',
    marginBottom: Spacing.md,
  },
  recordBanner: {
    alignItems: 'center',
    backgroundColor: Colors.primarySubtle,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
  },
  recordIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.white,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 3,
    marginBottom: Spacing.sm,
  },
  recordBannerTitle: { fontSize: 18, fontWeight: '800', color: Colors.text },
  recordBannerDate: { fontSize: 13, color: Colors.textMuted, marginTop: 4 },
  sectionBox: {
    backgroundColor: Colors.background,
    borderRadius: Radius.md,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    color: Colors.textMuted,
    marginBottom: Spacing.sm,
  },
  sectionValue: { fontSize: 15, color: Colors.text, fontWeight: '500' },
  infoGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  infoChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: Colors.white,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  infoChipText: { fontSize: 13, color: Colors.text, fontWeight: '500' },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 },
  infoRowText: { fontSize: 14, color: Colors.text },
  tokenBox: {
    backgroundColor: Colors.white,
    borderRadius: Radius.md,
    padding: Spacing.md,
    alignItems: 'center',
    marginVertical: 6,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  tokenLabel: { fontSize: 11, color: Colors.textMuted, fontWeight: '600', textTransform: 'uppercase' },
  tokenNumber: { fontSize: 24, fontWeight: '800', color: Colors.secondary, marginTop: 4 },
  clinicalText: { fontSize: 14, color: Colors.text, lineHeight: 22 },
  closeBtn: {
    backgroundColor: Colors.primary,
    borderRadius: Radius.md,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: Spacing.md,
  },
  closeBtnText: { color: Colors.white, fontSize: 16, fontWeight: '700' },
});
