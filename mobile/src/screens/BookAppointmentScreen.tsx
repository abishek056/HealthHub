import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, Radius } from '../constants/theme';
import { bookAppointment, getDoctors } from '../api/appointments';
import { ApiError } from '../api/client';
import { RootStackParamList } from '../types/navigation';

type Props = NativeStackScreenProps<RootStackParamList, 'BookAppointment'>;

const DEPARTMENTS = [
  'General Medicine', 'Cardiology', 'Orthopedics', 'Pediatrics',
  'Dermatology', 'ENT', 'Gynecology', 'Ophthalmology',
  'Neurology', 'Psychiatry', 'Oncology', 'Urology',
];

const TIMES = [
  '09:00 AM', '09:30 AM', '10:00 AM', '10:30 AM',
  '11:00 AM', '11:30 AM', '12:00 PM', '12:30 PM',
  '02:00 PM', '02:30 PM', '03:00 PM', '03:30 PM',
  '04:00 PM', '04:30 PM', '05:00 PM',
];

function todayString() {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export default function BookAppointmentScreen({ navigation, route }: Props) {
  const { hospitalId, hospitalName } = route.params || {};

  const [department, setDepartment] = useState('');
  const [doctor, setDoctor] = useState('');
  const [doctors, setDoctors] = useState<string[]>([]);
  const [loadingDoctors, setLoadingDoctors] = useState(false);
  const [date, setDate] = useState(todayString());
  const [time, setTime] = useState('');
  const [symptoms, setSymptoms] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!department) {
      setDoctors([]);
      setDoctor('');
      return;
    }
    setLoadingDoctors(true);
    getDoctors(department)
      .then((list) => {
        setDoctors(list.map((d) => d.name).filter(Boolean));
      })
      .catch(() => setDoctors([]))
      .finally(() => setLoadingDoctors(false));
  }, [department]);

  const handleBook = async () => {
    if (!department) {
      Alert.alert('Select Department', 'Please choose a department to continue.');
      return;
    }
    if (!date) {
      Alert.alert('Select Date', 'Please enter the appointment date.');
      return;
    }
    if (!time) {
      Alert.alert('Select Time', 'Please choose a preferred time slot.');
      return;
    }
    if (!hospitalId) {
      Alert.alert('Error', 'No hospital selected. Please go back and select a hospital.');
      return;
    }

    // Validate date format
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(date)) {
      Alert.alert('Invalid Date', 'Please enter the date in YYYY-MM-DD format (e.g., 2026-10-15).');
      return;
    }

    setLoading(true);
    try {
      const apt = await bookAppointment({
        hospital_id: hospitalId,
        department,
        doctor_name: doctor || undefined,
        date,
        time,
        symptoms: symptoms.trim() || undefined,
      });
      Alert.alert(
        '✅ Appointment Booked!',
        `Your appointment at ${hospitalName || 'the hospital'} has been successfully booked.\n\nDepartment: ${department}\nDate: ${date}\nTime: ${time}`,
        [
          {
            text: 'View Appointments',
            onPress: () => {
              navigation.goBack();
              navigation.navigate('Main');
            },
          },
        ]
      );
    } catch (e: any) {
      const msg = e instanceof ApiError ? e.message : e?.message || 'Booking failed. Please try again.';
      Alert.alert('Booking Failed', msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={Colors.text} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>Book Appointment</Text>
          {hospitalName && (
            <Text style={styles.headerSub} numberOfLines={1}>🏥 {hospitalName}</Text>
          )}
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Department */}
        <Text style={styles.label}>Department *</Text>
        <View style={styles.chips}>
          {DEPARTMENTS.map((d) => (
            <TouchableOpacity
              key={d}
              style={[styles.chip, department === d && styles.chipActive]}
              onPress={() => {
                setDepartment(d);
                setDoctor('');
              }}
            >
              <Text style={[styles.chipText, department === d && styles.chipTextActive]}>{d}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Doctor (optional if available) */}
        {department && (
          <>
            <Text style={styles.label}>Doctor (Optional)</Text>
            {loadingDoctors ? (
              <ActivityIndicator color={Colors.primary} style={{ marginVertical: 8 }} />
            ) : doctors.length > 0 ? (
              <View style={styles.chips}>
                {doctors.map((doc) => (
                  <TouchableOpacity
                    key={doc}
                    style={[styles.chip, doctor === doc && styles.chipActive]}
                    onPress={() => setDoctor(doctor === doc ? '' : doc)}
                  >
                    <Text style={[styles.chipText, doctor === doc && styles.chipTextActive]}>
                      Dr. {doc}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            ) : (
              <View style={styles.inputWrap}>
                <Ionicons name="person-outline" size={18} color={Colors.textMuted} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Doctor name (optional)"
                  placeholderTextColor={Colors.textMuted}
                  value={doctor}
                  onChangeText={setDoctor}
                />
              </View>
            )}
          </>
        )}

        {/* Date */}
        <Text style={styles.label}>Date * (YYYY-MM-DD)</Text>
        <View style={styles.inputWrap}>
          <Ionicons name="calendar-outline" size={18} color={Colors.textMuted} style={styles.inputIcon} />
          <TextInput
            style={styles.input}
            placeholder="2026-10-15"
            placeholderTextColor={Colors.textMuted}
            value={date}
            onChangeText={setDate}
            keyboardType="numeric"
          />
        </View>

        {/* Time */}
        <Text style={styles.label}>Time Slot *</Text>
        <View style={styles.chips}>
          {TIMES.map((t) => (
            <TouchableOpacity
              key={t}
              style={[styles.chip, time === t && styles.chipActive]}
              onPress={() => setTime(t)}
            >
              <Text style={[styles.chipText, time === t && styles.chipTextActive]}>{t}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Symptoms */}
        <Text style={styles.label}>Symptoms / Reason</Text>
        <TextInput
          style={[styles.inputWrap, styles.textarea]}
          placeholder="Describe your symptoms or reason for visit..."
          placeholderTextColor={Colors.textMuted}
          value={symptoms}
          onChangeText={setSymptoms}
          multiline
          numberOfLines={4}
          textAlignVertical="top"
        />

        {/* Summary */}
        {department && date && time && (
          <View style={styles.summaryBox}>
            <Text style={styles.summaryTitle}>Booking Summary</Text>
            <View style={styles.summaryRow}>
              <Ionicons name="business-outline" size={15} color={Colors.primary} />
              <Text style={styles.summaryText}>{hospitalName || 'Hospital'}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Ionicons name="medkit-outline" size={15} color={Colors.primary} />
              <Text style={styles.summaryText}>{department}</Text>
            </View>
            {doctor && (
              <View style={styles.summaryRow}>
                <Ionicons name="person-outline" size={15} color={Colors.primary} />
                <Text style={styles.summaryText}>Dr. {doctor}</Text>
              </View>
            )}
            <View style={styles.summaryRow}>
              <Ionicons name="calendar-outline" size={15} color={Colors.primary} />
              <Text style={styles.summaryText}>{date} at {time}</Text>
            </View>
          </View>
        )}

        {/* Book Button */}
        <TouchableOpacity
          style={[styles.btn, loading && styles.btnDisabled]}
          onPress={handleBook}
          disabled={loading}
          activeOpacity={0.85}
        >
          {loading ? (
            <ActivityIndicator color={Colors.white} />
          ) : (
            <>
              <Ionicons name="checkmark-circle" size={22} color={Colors.white} style={{ marginRight: 8 }} />
              <Text style={styles.btnText}>Confirm Appointment</Text>
            </>
          )}
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    backgroundColor: Colors.white,
    elevation: 2,
    gap: 8,
  },
  backBtn: { width: 40, height: 40, justifyContent: 'center' },
  headerTitle: { fontSize: 17, fontWeight: '700', color: Colors.text },
  headerSub: { fontSize: 12, color: Colors.primary, marginTop: 2 },
  content: { padding: Spacing.lg, paddingBottom: 60 },
  label: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: Spacing.sm,
    marginTop: Spacing.md,
  },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: Radius.full,
    backgroundColor: Colors.white,
    borderWidth: 1.5,
    borderColor: Colors.border,
    elevation: 1,
  },
  chipActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  chipText: { fontSize: 13, color: Colors.text, fontWeight: '500' },
  chipTextActive: { color: Colors.white, fontWeight: '700' },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.md,
    height: 50,
  },
  inputIcon: { marginRight: 10 },
  input: { flex: 1, fontSize: 15, color: Colors.text },
  textarea: {
    height: 90,
    alignItems: 'flex-start',
    paddingTop: 12,
    paddingBottom: 12,
  },
  summaryBox: {
    backgroundColor: Colors.primarySubtle,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    marginTop: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  summaryTitle: { fontSize: 14, fontWeight: '800', color: Colors.primary, marginBottom: Spacing.sm },
  summaryRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 },
  summaryText: { fontSize: 13, color: Colors.text },
  btn: {
    flexDirection: 'row',
    backgroundColor: Colors.primary,
    height: 56,
    borderRadius: Radius.md,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: Spacing.xl,
    elevation: 4,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  btnDisabled: { opacity: 0.7 },
  btnText: { color: Colors.white, fontSize: 17, fontWeight: '700' },
});
