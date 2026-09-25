import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, Radius } from '../constants/theme';
import { getHospitals, Hospital } from '../api/hospitals';
import { RootStackParamList } from '../types/navigation';

type Props = NativeStackScreenProps<RootStackParamList, 'HospitalList'>;

export default function HospitalListScreen({ navigation }: Props) {
  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [filtered, setFiltered] = useState<Hospital[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const list = await getHospitals();
        setHospitals(list);
        setFiltered(list);
      } catch (e: any) {
        setError(e?.message || 'Failed to load hospitals');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  useEffect(() => {
    if (!search.trim()) {
      setFiltered(hospitals);
    } else {
      const q = search.toLowerCase();
      setFiltered(hospitals.filter((h) =>
        h.name.toLowerCase().includes(q) || h.address?.toLowerCase().includes(q)
      ));
    }
  }, [search, hospitals]);

  const renderHospital = ({ item }: { item: Hospital }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() =>
        navigation.navigate('BookAppointment', {
          hospitalId: item.id,
          hospitalName: item.name,
        })
      }
      activeOpacity={0.8}
    >
      <View style={styles.cardLeft}>
        <View style={styles.iconBox}>
          <Ionicons name="business" size={24} color={Colors.primary} />
        </View>
      </View>
      <View style={styles.cardBody}>
        <Text style={styles.hospitalName}>{item.name}</Text>
        {item.address && (
          <View style={styles.infoRow}>
            <Ionicons name="location-outline" size={13} color={Colors.textMuted} />
            <Text style={styles.infoText} numberOfLines={2}>{item.address}</Text>
          </View>
        )}
        {item.phone && (
          <View style={styles.infoRow}>
            <Ionicons name="call-outline" size={13} color={Colors.textMuted} />
            <Text style={styles.infoText}>{item.phone}</Text>
          </View>
        )}
        {item.services && item.services.length > 0 && (
          <View style={styles.serviceChips}>
            {item.services.slice(0, 3).map((s, i) => (
              <View key={i} style={styles.serviceChip}>
                <Text style={styles.serviceText}>{s}</Text>
              </View>
            ))}
            {item.services.length > 3 && (
              <View style={styles.serviceChip}>
                <Text style={styles.serviceText}>+{item.services.length - 3}</Text>
              </View>
            )}
          </View>
        )}
      </View>
      <View style={styles.cardArrow}>
        <Ionicons name="chevron-forward" size={20} color={Colors.primary} />
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.safe}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Choose Hospital</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Search */}
      <View style={styles.searchWrap}>
        <Ionicons name="search-outline" size={18} color={Colors.textMuted} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search hospitals..."
          placeholderTextColor={Colors.textMuted}
          value={search}
          onChangeText={setSearch}
        />
        {search.length > 0 && (
          <TouchableOpacity onPress={() => setSearch('')}>
            <Ionicons name="close-circle" size={18} color={Colors.textMuted} />
          </TouchableOpacity>
        )}
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>Loading hospitals…</Text>
        </View>
      ) : error ? (
        <View style={styles.center}>
          <Ionicons name="cloud-offline-outline" size={48} color={Colors.border} />
          <Text style={styles.errorText}>{error}</Text>
          <Text style={styles.errorSub}>Ensure the backend is running on port 8000</Text>
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <View style={styles.center}>
              <Ionicons name="business-outline" size={48} color={Colors.border} />
              <Text style={styles.errorText}>No hospitals found</Text>
            </View>
          }
          renderItem={renderHospital}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    backgroundColor: Colors.white,
    elevation: 2,
  },
  backBtn: { width: 40, height: 40, justifyContent: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '700', color: Colors.text },
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    marginHorizontal: Spacing.md,
    marginVertical: Spacing.sm,
    borderRadius: Radius.lg,
    paddingHorizontal: Spacing.md,
    borderWidth: 1.5,
    borderColor: Colors.border,
    elevation: 1,
    gap: 10,
  },
  searchInput: { flex: 1, height: 46, fontSize: 15, color: Colors.text },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xl,
  },
  loadingText: { color: Colors.textMuted, marginTop: Spacing.sm, fontSize: 13 },
  errorText: { fontSize: 16, fontWeight: '600', color: Colors.textMuted, marginTop: 12, textAlign: 'center' },
  errorSub: { fontSize: 13, color: Colors.textMuted, marginTop: 6, textAlign: 'center' },
  list: { padding: Spacing.md, paddingBottom: 40 },
  card: {
    backgroundColor: Colors.white,
    borderRadius: Radius.lg,
    marginBottom: Spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    overflow: 'hidden',
  },
  cardLeft: { padding: Spacing.md },
  iconBox: {
    width: 48,
    height: 48,
    borderRadius: Radius.md,
    backgroundColor: Colors.primarySubtle,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardBody: { flex: 1, paddingVertical: Spacing.md, paddingRight: 4 },
  hospitalName: { fontSize: 15, fontWeight: '700', color: Colors.text, marginBottom: 4 },
  infoRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 5, marginBottom: 3 },
  infoText: { fontSize: 12, color: Colors.textMuted, flex: 1 },
  serviceChips: { flexDirection: 'row', flexWrap: 'wrap', gap: 4, marginTop: 4 },
  serviceChip: {
    backgroundColor: Colors.primarySubtle,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Radius.full,
  },
  serviceText: { fontSize: 10, color: Colors.primary, fontWeight: '600' },
  cardArrow: { paddingRight: Spacing.md },
});
