
import React from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, Image } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

const LeadsScreen = () => {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  return (
    <SafeAreaView style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top }]}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <MaterialIcons name="arrow-back" size={24} color="#1F2937" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Leads</Text>
      </View>
      <ScrollView>
        <View style={styles.mainContent}>
          <View style={styles.searchSection}>
            <View style={styles.searchInputContainer}>
              <Ionicons name="search" size={20} color="#9CA3AF" style={styles.searchIcon} />
              <TextInput
                placeholder="Search name, company, email..."
                style={styles.searchInput}
              />
            </View>
            <TouchableOpacity style={styles.filterButton}>
              <Ionicons name="options-outline" size={24} color="#4B5563" />
            </TouchableOpacity>
          </View>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.quickFilters}>
            <TouchableOpacity style={[styles.filterChip, styles.activeFilterChip]}>
              <Text style={[styles.filterChipText, styles.activeFilterChipText]}>All</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.filterChip}>
              <Text style={styles.filterChipText}>New</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.filterChip}>
              <Text style={styles.filterChipText}>Contacted</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.filterChip}>
              <Text style={styles.filterChipText}>In Progress</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.filterChip}>
              <Text style={styles.filterChipText}>Qualified</Text>
            </TouchableOpacity>
          </ScrollView>

          <View style={styles.leadsListSection}>
            <View style={styles.leadsListHeader}>
              <Text style={styles.leadsListTitle}>Recent Leads (24)</Text>
              <TouchableOpacity style={styles.createLeadButton}>
                <Ionicons name="add-circle-outline" size={16} color="#fc6027" />
                <Text style={styles.createLeadButtonText}>Create Lead</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.leadCard}>
              <View style={styles.leadCardHeader}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <View style={[styles.leadAvatar, { backgroundColor: '#FFEDD5'}]}>
                    <Text style={[styles.leadAvatarText, { color: '#F97316'}]}>AK</Text>
                  </View>
                  <View>
                    <Text style={styles.leadName}>Alex Karev</Text>
                    <Text style={styles.leadCompany}>Grey-Sloan Memorial</Text>
                  </View>
                </View>
                <Text style={[styles.leadStatus, { backgroundColor: '#FEF3C7', color: '#D97706'}]}>In Progress</Text>
              </View>
              <View style={styles.leadCardBody}>
                <View style={styles.leadStat}>
                  <Text style={styles.leadStatLabel}>Deal Value</Text>
                  <Text style={styles.leadStatValue}>$12,500</Text>
                </View>
                <View style={styles.leadStat}>
                  <Text style={styles.leadStatLabel}>Source</Text>
                  <Text style={styles.leadStatValue}><Ionicons name="globe-outline" size={12} /> Website</Text>
                </View>
              </View>
              <View style={styles.leadCardFooter}>
                <View style={{flexDirection: 'row', gap: 6}}>
                  <Text style={[styles.leadTag, { backgroundColor: '#FEE2E2', color: '#DC2626'}]}>🔥 Hot</Text>
                  <Text style={[styles.leadTag, { backgroundColor: '#DBEAFE', color: '#2563EB'}]}>Enterprise</Text>
                </View>
                <View style={styles.leadActions}>
                  <TouchableOpacity style={styles.leadActionButton}>
                    <Ionicons name="chatbubble-ellipses-outline" size={18} color="#4B5563" />
                  </TouchableOpacity>
                  <TouchableOpacity style={[styles.leadActionButton, { backgroundColor: 'rgba(252, 96, 39, 0.1)' }]}>
                    <Ionicons name="call-outline" size={18} color="#fc6027" />
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.leadActionButton}>
                    <Ionicons name="ellipsis-vertical" size={18} color="#4B5563" />
                  </TouchableOpacity>
                </View>
              </View>
            </View>
            
            <View style={styles.leadCard}>
              <View style={styles.leadCardHeader}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <View style={[styles.leadAvatar, { backgroundColor: '#E0E7FF'}]}>
                    <Text style={[styles.leadAvatarText, { color: '#4F46E5'}]}>CY</Text>
                  </View>
                  <View>
                    <Text style={styles.leadName}>Christina Yang</Text>
                    <Text style={styles.leadCompany}>Cardio Innovate Inc.</Text>
                  </View>
                </View>
                <Text style={[styles.leadStatus, { backgroundColor: '#D1FAE5', color: '#059669'}]}>Qualified</Text>
              </View>
              <View style={styles.leadCardBody}>
                 <View style={styles.leadStat}>
                  <Text style={styles.leadStatLabel}>Deal Value</Text>
                  <Text style={styles.leadStatValue}>$48,000</Text>
                </View>
                <View style={styles.leadStat}>
                  <Text style={styles.leadStatLabel}>Source</Text>
                  <Text style={styles.leadStatValue}><Ionicons name="mail-outline" size={12} /> LinkedIn</Text>
                </View>
              </View>
              <View style={styles.leadCardFooter}>
                <View style={{flexDirection: 'row', gap: 6}}>
                  <Text style={[styles.leadTag, { backgroundColor: '#F3F4F6', color: '#4B5563'}]}>New Account</Text>
                </View>
                <View style={styles.leadActions}>
                   <TouchableOpacity style={styles.leadActionButton}>
                    <Ionicons name="chatbubble-ellipses-outline" size={18} color="#4B5563" />
                  </TouchableOpacity>
                  <TouchableOpacity style={[styles.leadActionButton, { backgroundColor: 'rgba(252, 96, 39, 0.1)' }]}>
                    <Ionicons name="call-outline" size={18} color="#fc6027" />
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.leadActionButton}>
                    <Ionicons name="ellipsis-vertical" size={18} color="#4B5563" />
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f6f5' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingBottom: 12,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    position: 'relative',
  },
  backButton: {
      position: 'absolute',
      left: 16,
      top: 45,
      padding: 4,
      zIndex: 1,
  },
  headerTitle: {
      fontSize: 18,
      fontWeight: 'bold',
      color: '#1F2937',
      marginTop: 20
  },
  mainContent: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 100 },
  searchSection: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  searchInputContainer: { flex: 1, position: 'relative' },
  searchIcon: { position: 'absolute', left: 12, top: 12, zIndex: 1 },
  searchInput: { backgroundColor: 'white', borderWidth: 1, borderColor: '#F3F4F6', borderRadius: 12, paddingVertical: 12, paddingLeft: 40, paddingRight: 16, fontSize: 14 },
  filterButton: { backgroundColor: 'white', padding: 12, borderRadius: 12, borderWidth: 1, borderColor: '#F3F4F6' },
  quickFilters: { marginVertical: 16, flexDirection: 'row', gap: 8 },
  filterChip: { backgroundColor: 'white', paddingHorizontal: 20, paddingVertical: 8, borderRadius: 999, borderWidth: 1, borderColor: '#E5E7EB' },
  activeFilterChip: { backgroundColor: '#fc6027', borderColor: '#fc6027' },
  filterChipText: { fontSize: 14, fontWeight: '500', color: '#4B5563' },
  activeFilterChipText: { color: 'white' },
  leadsListSection: { marginTop: 24 },
  leadsListHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  leadsListTitle: { color: '#6B7280', fontSize: 12, fontWeight: 'bold', textTransform: 'uppercase' },
  createLeadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(252, 96, 39, 0.1)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
  },
  createLeadButtonText: {
    color: '#fc6027',
    fontWeight: 'bold',
    fontSize: 12,
  },
  leadCard: { backgroundColor: 'white', borderRadius: 16, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: '#F3F4F6' },
  leadCardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 },
  leadAvatar: { width: 48, height: 48, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  leadAvatarText: { fontSize: 18, fontWeight: 'bold' },
  leadName: { fontWeight: 'bold', color: '#111827', lineHeight: 20 },
  leadCompany: { fontSize: 12, color: '#6B7280' },
  leadStatus: { fontSize: 10, fontWeight: 'bold', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 999, textTransform: 'uppercase' },
  leadCardBody: { flexDirection: 'row', gap: 16, paddingVertical: 12, borderTopWidth: 1, borderBottomWidth: 1, borderColor: '#F9FAFB' },
  leadStat: { flex: 1 },
  leadStatLabel: { fontSize: 10, color: '#9CA3AF', textTransform: 'uppercase', marginBottom: 2 },
  leadStatValue: { fontSize: 14, fontWeight: 'bold', color: '#374151' },
  leadCardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 12 },
  leadTag: { fontSize: 10, fontWeight: 'bold', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 999 },
  leadActions: { flexDirection: 'row', gap: 8 },
  leadActionButton: { width: 32, height: 32, borderRadius: 12, backgroundColor: '#F9FAFB', alignItems: 'center', justifyContent: 'center' },
});

export default LeadsScreen;
