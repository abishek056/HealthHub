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
import { getMyRecord, MedicalRecord } from '../api/records';

type Props = NativeStackScreenProps<RootStackParamList, 'RecordDetail'>;

export default function RecordDetailScreen({ navigation, route }: Props) {
  const { recordId } = route.params;
  const [record, setRecord] = useState<MedicalRecord | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const r = await getMyRecord(recordId);
        setRecord(r);
      } catch (err: any) {
        Alert.alert('Error', err?.message || 'Failed to load medical record');
      } finally {
        setLoading(false);
      }
    })();
  }, [recordId]);

  if (loading) {
    return (
      <View style={styles.loadingCenter}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loadingText}>Loading medical record...</Text>
      </View>
    );
  }

  if (!record) {
    return (
      <View style={styles.container}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.errorText}>Medical record not found.</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Medical Record</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Main Card */}
        <View style={styles.card}>
          {/* Header Strip */}
          <View style={styles.cardHeader}>
            <View style={styles.recordIconWrap}>
              <Ionicons name="document-text" size={24} color={Colors.primary} />
            </View>
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={styles.recordNum}>Record #{record.id}</Text>
              <Text style={styles.recordDate}>
                {record.date ? new Date(record.date).toLocaleDateString() : 'Recent Visit'}
              </Text>
            </View>
            {record.appointment?.token_number && (
              <View style={styles.tokenBadge}>
                <Text style={styles.tokenBadgeText}>Token #{record.appointment.token_number}</Text>
              </View>
            )}
          </View>

          <View style={styles.cardBody}>
            {/* Hospital Info */}
            <View style={styles.sectionRow}>
              <View style={styles.iconCircle}>
                <Ionicons name="business" size={18} color={Colors.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.fieldLabel}>Hospital Facility</Text>
                <Text style={styles.hospitalName}>{record.hospital}</Text>
                {record.department ? (
                  <Text style={styles.deptBadge}>{record.department} OPD</Text>
                ) : null}
              </View>
            </View>

            <View style={styles.divider} />

            {/* Patient Demographics */}
            <View style={styles.sectionRow}>
              <View style={styles.iconCircle}>
                <Ionicons name="person" size={18} color={Colors.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.fieldLabel}>Patient Information</Text>
                <View style={styles.patientMeta}>
                  {record.age !== undefined && (
                    <Text style={styles.patientMetaText}>{record.age} years old</Text>
                  )}
                  {record.gender && (
                    <>
                      <Text style={styles.dot}>•</Text>
                      <Text style={[styles.patientMetaText, { textTransform: 'capitalize' }]}>
                        {record.gender}
                      </Text>
                    </>
                  )}
                  {record.phone && (
                    <>
                      <Text style={styles.dot}>•</Text>
                      <Text style={styles.patientMetaText}>{record.phone}</Text>
                    </>
                  )}
                </View>
              </View>
            </View>

            <View style={styles.divider} />

            {/* Diagnosis Box */}
            <View style={styles.diagnosisBox}>
              <View style={styles.boxHeader}>
                <Ionicons name="medkit" size={18} color={Colors.primary} />
                <Text style={styles.boxTitle}>Problem Diagnosis</Text>
              </View>
              <Text style={styles.diagnosisText}>{record.diagnosis || 'General Clinical Checkup'}</Text>
            </View>

            {/* Treatment Box */}
            {record.treatment ? (
              <View style={styles.treatmentBox}>
                <View style={styles.boxHeader}>
                  <Ionicons name="clipboard" size={18} color="#0284c7" />
                  <Text style={[styles.boxTitle, { color: '#0284c7' }]}>Prescribed Treatment</Text>
                </View>
                <Text style={styles.treatmentText}>{record.treatment}</Text>
              </View>
            ) : null}

            {/* Doctor / Attended By */}
            {record.doctor ? (
              <View style={[styles.sectionRow, { marginTop: Spacing.md }]}>
                <View style={styles.iconCircle}>
                  <Ionicons name="medkit" size={18} color={Colors.primary} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.fieldLabel}>Attending Doctor / Physician</Text>
                  <Text style={styles.doctorName}>Dr. {record.doctor}</Text>
                </View>
              </View>
            ) : null}
          </View>
        </View>

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
  card: {
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
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.lg,
    backgroundColor: '#dff5ea',
    borderBottomWidth: 1,
    borderBottomColor: '#c2ebd5',
  },
  recordIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  recordNum: { fontSize: 16, fontWeight: '800', color: Colors.text },
  recordDate: { fontSize: 12, color: Colors.textMuted, marginTop: 2 },
  tokenBadge: {
    backgroundColor: Colors.white,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: '#c2ebd5',
  },
  tokenBadgeText: { fontSize: 11, fontWeight: '800', color: Colors.primary },
  cardBody: { padding: Spacing.lg },
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
  patientMeta: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 6, marginTop: 4 },
  patientMetaText: { fontSize: 13, color: Colors.text, fontWeight: '500' },
  dot: { color: Colors.textMuted, fontSize: 10 },
  diagnosisBox: {
    backgroundColor: '#f4fbf7',
    borderWidth: 1,
    borderColor: '#c2ebd5',
    borderRadius: Radius.md,
    padding: Spacing.md,
    marginBottom: Spacing.md,
  },
  treatmentBox: {
    backgroundColor: '#f0f9ff',
    borderWidth: 1,
    borderColor: '#bae6fd',
    borderRadius: Radius.md,
    padding: Spacing.md,
    marginBottom: Spacing.md,
  },
  boxHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 6 },
  boxTitle: { fontSize: 13, fontWeight: '700', color: Colors.primary },
  diagnosisText: { fontSize: 14, fontWeight: '600', color: Colors.text, lineHeight: 20 },
  treatmentText: { fontSize: 13, color: Colors.text, lineHeight: 19 },
  doctorName: { fontSize: 14, fontWeight: '700', color: Colors.text, marginTop: 2 },
});
