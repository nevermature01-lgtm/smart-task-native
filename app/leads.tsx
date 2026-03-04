
import React from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

const LeadsScreen = () => {
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView>
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <View style={styles.headerLeft}>
              <TouchableOpacity style={styles.menuButton}>
                <Ionicons name="menu" size={24} color="#374151" />
              </TouchableOpacity>
              <Text style={styles.headerTitle}>Leads</Text>
            </View>
            <View style={styles.headerRight}>
              <TouchableOpacity style={styles.notificationButton}>
                <Ionicons name="notifications-outline" size={24} color="#374151" />
                <View style={styles.notificationBadge} />
              </TouchableOpacity>
              <View style={styles.profileImageContainer}>
                <Image
                  source={{ uri: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAeHBRWy7alpwuxwXfnBIGG0VRIls2uHvw9E6-N-iKytjhr-sGrEZ8KZbl39XCVCJhJG4Ty-KgYlH2Xnc3RqmB3rWynw2OUSxPRkCrj6de9J_CoMh9dj6R8rnVycxu8mrdzrAzqizVAg9NEFwOVxvSyx7pKbk7iqq_0VBot1XyKq1BA2ergS1mS-4v_8Kh_Px5JemzKBpJPhk1XFagY4fiNw_GjIWThZr7Ibzs1VfhJnP-N1tQzCt6ffafouQFbDG3twJ5rj_tO4AU' }}
                  style={styles.profileImage}
                />
              </View>
            </View>
          </View>
          <View style={styles.statsRow}>
            <View style={[styles.statCard, { backgroundColor: 'rgba(252, 96, 39, 0.05)', borderColor: 'rgba(252, 96, 39, 0.1)' }]}>
              <View style={styles.statHeader}>
                <Ionicons name="person-add-outline" size={18} color="#fc6027" />
                <Text style={styles.statChange}>+12%</Text>
              </View>
              <Text style={styles.statValue}>42</Text>
              <Text style={styles.statLabel}>New Leads</Text>
            </View>
            <View style={styles.statCard}>
              <Ionicons name="cash-outline" size={18} color="#4B5563" />
              <Text style={styles.statValue}>$1.2M</Text>
              <Text style={styles.statLabel}>Pipeline</Text>
            </View>
            <View style={styles.statCard}>
              <Ionicons name="checkmark-done-outline" size={18} color="#4B5563" />
              <Text style={styles.statValue}>18</Text>
              <Text style={styles.statLabel}>Closed</Text>
            </View>
          </View>
        </View>

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

          <View style={styles.pipelineSection}>
            <View style={styles.pipelineHeader}>
              <Text style={styles.pipelineTitle}>Pipeline Progression</Text>
              <Text style={styles.pipelineAction}>View Detail</Text>
            </View>
            <View style={styles.pipelineTracker}>
              <View style={styles.pipelineLine} />
              <View style={[styles.pipelineLine, { width: '75%', backgroundColor: 'rgba(252, 96, 39, 0.4)' }]} />
              <View style={styles.pipelineStep}>
                <Text style={styles.pipelineStepText}>1</Text>
              </View>
              <View style={styles.pipelineStep}>
                <Text style={styles.pipelineStepText}>2</Text>
              </View>
              <View style={styles.pipelineStep}>
                <Text style={styles.pipelineStepText}>3</Text>
              </View>
              <View style={[styles.pipelineStep, { backgroundColor: '#fff', borderWidth: 2, borderColor: '#fc6027' }]}>
                <Text style={[styles.pipelineStepText, { color: '#fc6027' }]}>4</Text>
              </View>
               <View style={[styles.pipelineStep, { backgroundColor: '#fff', borderWidth: 2, borderColor: '#E5E7EB' }]}>
                <Text style={[styles.pipelineStepText, { color: '#9CA3AF' }]}>5</Text>
              </View>
            </View>
             <View style={styles.pipelineLabels}>
                <Text style={styles.pipelineLabel}>New</Text>
                <Text style={styles.pipelineLabel}>Contact</Text>
                <Text style={[styles.pipelineLabel, { color: '#fc6027'}]}>Qualified</Text>
                <Text style={styles.pipelineLabel}>Prop</Text>
                <Text style={styles.pipelineLabel}>Closed</Text>
            </View>
          </View>

          <View style={styles.leadsListSection}>
            <View style={styles.leadsListHeader}>
              <Text style={styles.leadsListTitle}>Recent Leads (24)</Text>
              <Ionicons name="swap-vertical" size={16} color="#9CA3AF" />
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
       <View style={styles.fabContainer}>
         <TouchableOpacity style={styles.fab}>
            <Ionicons name="add" size={32} color="white" />
         </TouchableOpacity>
       </View>
       <View style={styles.bottomNav}>
            <TouchableOpacity style={styles.navItem}>
                <Ionicons name="grid-outline" size={24} color="#9CA3AF" />
                <Text style={styles.navText}>Home</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.navItem}>
                <Ionicons name="checkmark-done-outline" size={24} color="#9CA3AF" />
                <Text style={styles.navText}>Tasks</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.navItem}>
                <Ionicons name="people-outline" size={24} color="#fc6027" />
                <Text style={[styles.navText, { color: '#fc6027', fontWeight: 'bold' }]}>Leads</Text>
            </TouchableOpacity>
             <TouchableOpacity style={styles.navItem}>
                <Ionicons name="albums-outline" size={24} color="#9CA3AF" />
                <Text style={styles.navText}>Teams</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.navItem}>
                <Ionicons name="person-circle-outline" size={24} color="#9CA3AF" />
                <Text style={styles.navText}>Profile</Text>
            </TouchableOpacity>
       </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f6f5' },
  header: { paddingTop: 40, paddingHorizontal: 20, paddingBottom: 16, backgroundColor: 'white', borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  menuButton: { padding: 8, borderRadius: 999, backgroundColor: '#F9FAFB' },
  headerTitle: { fontSize: 24, fontWeight: 'bold', color: '#111827' },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  notificationButton: { padding: 8, borderRadius: 999, backgroundColor: '#F9FAFB' },
  notificationBadge: { position: 'absolute', top: 8, right: 8, width: 8, height: 8, backgroundColor: '#fc6027', borderRadius: 4, borderWidth: 2, borderColor: 'white' },
  profileImageContainer: { width: 40, height: 40, borderRadius: 20, borderWidth: 2, borderColor: 'rgba(252, 96, 39, 0.2)', padding: 2 },
  profileImage: { width: '100%', height: '100%', borderRadius: 18 },
  statsRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 12 },
  statCard: { flex: 1, backgroundColor: '#F9FAFB', padding: 12, borderRadius: 16, borderWidth: 1, borderColor: '#F3F4F6' },
  statHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 },
  statChange: { fontSize: 10, fontWeight: 'bold', color: '#10B981', backgroundColor: '#D1FAE5', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 999 },
  statValue: { fontSize: 20, fontWeight: 'bold', color: '#111827' },
  statLabel: { fontSize: 10, color: '#6B7280', fontWeight: '500', textTransform: 'uppercase' },
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
  pipelineSection: { backgroundColor: 'white', borderRadius: 16, padding: 16, borderWidth: 1, borderColor: '#F3F4F6', marginBottom: 24 },
  pipelineHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  pipelineTitle: { fontWeight: 'bold', fontSize: 14, color: '#374151' },
  pipelineAction: { fontSize: 12, fontWeight: 'bold', color: '#fc6027' },
  pipelineTracker: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', position: 'relative', marginBottom: 8 },
  pipelineLine: { position: 'absolute', top: '50%', left: 0, right: 0, height: 4, backgroundColor: '#F3F4F6', transform: [{ translateY: -2 }] },
  pipelineStep: { zIndex: 1, backgroundColor: '#fc6027', color: 'white', width: 24, height: 24, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center' },
  pipelineStepText: { color: 'white', fontSize: 10, fontWeight: 'bold' },
  pipelineLabels: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 4 },
  pipelineLabel: { fontSize: 10, fontWeight: '600', color: '#6B7280', textTransform: 'uppercase' },
  leadsListSection: { marginTop: 24 },
  leadsListHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  leadsListTitle: { color: '#6B7280', fontSize: 12, fontWeight: 'bold', textTransform: 'uppercase' },
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
  fabContainer: { position: 'absolute', bottom: 80, right: 20, zIndex: 40 },
  fab: { backgroundColor: '#fc6027', width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 4, elevation: 8 },
  bottomNav: { position: 'absolute', bottom: 0, left: 0, right: 0, height: 70, backgroundColor: 'white', borderTopWidth: 1, borderColor: '#F3F4F6', flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center', paddingHorizontal: 24 },
  navItem: { alignItems: 'center', gap: 2 },
  navText: { fontSize: 10, fontWeight: '500', color: '#9CA3AF' },
});

export default LeadsScreen;
