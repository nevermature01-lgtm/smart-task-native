import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, ActivityIndicator, FlatList, Linking, Alert, Modal } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { db, auth } from '../firebase';
import { collection, onSnapshot, query, orderBy, doc, where, getDocs } from 'firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';

const AllCustomersScreen = () => {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [leads, setLeads] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredLeads, setFilteredLeads] = useState([]);
  const [isSortModalVisible, setSortModalVisible] = useState(false);
  const [availableMonths, setAvailableMonths] = useState([]);
  const [selectedMonth, setSelectedMonth] = useState(null);
  const [teamId, setTeamId] = useState(null);
  const [user, setUser] = useState(null);

  useEffect(() => {
    const getContextAndUserRole = async () => {
      const authUser = auth.currentUser;
      if (!authUser) {
        setIsLoading(false);
        return;
      }

      const accountJson = await AsyncStorage.getItem('activeAccount');
      if (accountJson) {
        const account = JSON.parse(accountJson);
        setTeamId(account.id);

        let userRole = 'member'; // Default role
        if (account.type === 'personal') {
          userRole = 'admin';
        } else if (account.id) {
          const teamMembersQuery = query(
            collection(db, 'team_members'),
            where('teamId', '==', account.id),
            where('userId', '==', authUser.uid)
          );
          const memberSnapshot = await getDocs(teamMembersQuery);
          if (!memberSnapshot.empty) {
            userRole = memberSnapshot.docs[0].data().role;
          }
        }
        setUser({ id: authUser.uid, role: userRole });
      } else {
        setIsLoading(false);
      }
    };

    getContextAndUserRole();
  }, []);

  useEffect(() => {
    if (!teamId || !user) {
      return;
    }

    setIsLoading(true);

    const queryConstraints = [
        where("teamId", "==", teamId),
        where("stage", "==", "Completed"),
        orderBy("followUpDate", "desc")
    ];

    const leadsQuery = query(collection(db, "leads"), ...queryConstraints);

    const unsubscribeLeads = onSnapshot(leadsQuery, (querySnapshot) => {
      const allTeamLeads = querySnapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }));
      let finalLeads = allTeamLeads;

      if (user && user.role !== 'admin') {
        finalLeads = allTeamLeads.filter(lead =>
          Array.isArray(lead.assignedTo) && lead.assignedTo.some(assignee => assignee.id === user.id)
        );
      }

      let monthFilteredLeads = finalLeads;
      if (selectedMonth) {
        const [year, monthStr] = selectedMonth.split('-');
        const month = parseInt(monthStr, 10);
        const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
        const nextMonthDate = new Date(year, month, 1);
        const endDate = `${nextMonthDate.getFullYear()}-${String(nextMonthDate.getMonth() + 1).padStart(2, '0')}-01`;

        monthFilteredLeads = finalLeads.filter(lead => {
          return lead.followUpDate >= startDate && lead.followUpDate < endDate;
        });
      }
      
      setLeads(monthFilteredLeads);
      setIsLoading(false);
    }, (error) => {
      console.error("Fatal error fetching leads: ", error);
      setIsLoading(false);
      Alert.alert("Error", "Could not fetch leads. Please restart the app.");
    });

    return () => unsubscribeLeads();
  }, [teamId, user, selectedMonth]);

  useEffect(() => {
    const currentYear = new Date().getFullYear();
    const allMonths = Array.from({ length: 12 }, (_, i) => {
      const date = new Date(currentYear, i, 1);
      const monthLabel = date.toLocaleString('default', { month: 'long', year: 'numeric' });
      const monthValue = `${currentYear}-${String(i + 1).padStart(2, '0')}`;
      return { label: monthLabel, value: monthValue };
    });
    setAvailableMonths(allMonths);
  }, []);

  useEffect(() => {
    let tempLeads = [...leads];
    if (searchQuery.trim() !== '') {
      tempLeads = tempLeads.filter(lead => 
        (lead.customerName && lead.customerName.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (lead.address && lead.address.toLowerCase().includes(searchQuery.toLowerCase()))
      );
    }
    setFilteredLeads(tempLeads);
  }, [searchQuery, leads]);

  const handleCall = (phoneNumber) => {
    if (phoneNumber) {
      Linking.openURL(`tel:${phoneNumber}`).catch(() => Alert.alert("Error", "Unable to make a phone call."));
    } else {
      Alert.alert("No Contact", "No contact number is available for this lead.");
    }
  };
  
  const getInitials = (name) => {
      if (!name) return '';
      const words = name.split(' ');
      if (words.length > 1 && words[0] && words[1]) {
          return words[0][0] + words[1][0];
      } else if (words.length > 0 && words[0]) {
          return words[0].substring(0, 2);
      }
      return '';
  }

  const LeadCard = ({ item }) => {
    const createdAtDate = item.createdAt?.toDate();
    const formattedCreationDate = createdAtDate ? createdAtDate.toLocaleDateString('en-GB') : 'N/A';

    return (
        <TouchableOpacity onPress={() => router.push(`/lead-details?id=${item.id}`)}>
            <View style={styles.leadCard}>
                <View style={styles.leadCardHeader}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                        <View style={[styles.leadAvatar, { backgroundColor: '#EBF8FF'}]}>
                            <Text style={[styles.leadAvatarText, { color: '#0a7ea4'}]}>{getInitials(item.customerName)}</Text>
                        </View>
                        <View style={{ flex: 1 }}>
                            <Text style={styles.leadName} numberOfLines={1}>{item.customerName}</Text>
                            <Text style={styles.leadCompany} numberOfLines={1}>{item.address}</Text>
                        </View>
                    </View>
                    {item.stage && <Text style={styles.stageBadge}>{item.stage}</Text>}
                </View>
                <View style={styles.leadCardBody}>
                    <View style={styles.leadStat}>
                        <Text style={styles.leadStatLabel}>Follow-up</Text>
                        <Text style={styles.leadStatValue}>{item.followUpDate}</Text>
                    </View>
                    <View style={styles.leadStat}>
                        <Text style={styles.leadStatLabel}>Created On</Text>
                        <Text style={styles.leadStatValue}>{formattedCreationDate}</Text>
                    </View>
                </View>
                 <View style={[styles.leadCardBody, { borderTopWidth: 0, paddingTop: 0 }]}>
                    <View style={styles.leadStat}>
                        <Text style={styles.leadStatLabel}>Feedback</Text>
                        <Text style={styles.leadStatValue} numberOfLines={2}>{item.feedback || '-'}</Text>
                    </View>
                    <View style={styles.leadStat}>
                        <Text style={styles.leadStatLabel}>Complaint</Text>
                        <Text style={styles.leadStatValue} numberOfLines={2}>{item.complaint || '-'}</Text>
                    </View>
                </View>
                <View style={styles.leadCardFooter}>
                    <View style={styles.assigneeInfo}>
                        <Text style={styles.assigneeLabel}>Assigned to:</Text>
                        <Text style={styles.assigneeName} numberOfLines={1}>{item.assignedTo ? item.assignedTo.map(u => u.name).join(', ') : 'N/A'}</Text>
                    </View>
                    <View style={styles.leadActions}>
                        <TouchableOpacity style={[styles.leadActionButton, { backgroundColor: 'rgba(10, 126, 164, 0.1)' }]} onPress={() => handleCall(item.contactNumber)}>
                            <Feather name="phone" size={18} color="#0a7ea4" />
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </TouchableOpacity>
    )
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top }]}>
        <TouchableOpacity style={styles.headerButton} onPress={() => router.canGoBack() ? router.back() : router.replace('/home')}>
            <Feather name="chevron-left" size={24} color="#1F2937" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>All Customers</Text>
        <View style={styles.headerButton}>
            <Feather name="lock" size={20} color="#1F2937" />
        </View>
      </View>
      <View style={styles.mainContent}>
          <View style={styles.searchSection}>
              <View style={styles.searchInputContainer}>
                  <Feather name="search" size={20} color="#9CA3AF" style={styles.searchIcon} />
                  <TextInput
                      placeholder="Search customers..."
                      style={styles.searchInput}
                      value={searchQuery}
                      onChangeText={setSearchQuery}
                  />
              </View>
              <TouchableOpacity style={styles.filterButton} onPress={() => setSortModalVisible(true)}>
                  <Feather name="sliders" size={24} color="#4B5563" />
              </TouchableOpacity>
          </View>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.quickFilters} decelerationRate="fast" scrollEventThrottle={16}>
              <TouchableOpacity style={[styles.filterChip, styles.activeFilterChip]}>
                  <Text style={[styles.filterChipText, styles.activeFilterChipText]}>{selectedMonth ? availableMonths.find(m => m.value === selectedMonth)?.label.split(' ')[0] : 'All'}</Text>
              </TouchableOpacity>
          </ScrollView>

          <View style={styles.leadsListSection}>
              <View style={styles.leadsListHeader}>
                  <Text style={styles.leadsListTitle}>{`All Customers (${filteredLeads.length})`}</Text>
              </View>

              {isLoading ? (
                  <ActivityIndicator size="large" color="#0a7ea4" style={{marginTop: 50}} />
              ) : (
                  <FlatList
                      data={filteredLeads}
                      renderItem={LeadCard}
                      keyExtractor={item => item.id}
                      showsVerticalScrollIndicator={false}
                      contentContainerStyle={{ paddingBottom: 150 }}
                      decelerationRate="fast"
                      scrollEventThrottle={16}
                      removeClippedSubviews={true}
                      windowSize={10}
                      ListEmptyComponent={() => (
                          <View style={styles.emptyStateContainer}>
                                <Feather name={"users"} size={40} color="#9CA3AF" />
                                <Text style={styles.emptyStateText}>No Customers Found</Text>
                                <Text style={styles.emptyStateSubText}>
                                    There are currently no customers to display.
                                </Text>
                          </View>
                      )}
                  />
              )}
          </View>
      </View>
      <Modal animationType="slide" transparent={true} visible={isSortModalVisible} onRequestClose={() => setSortModalVisible(false)}>
        <TouchableOpacity style={styles.modalOverlay} onPress={() => setSortModalVisible(false)} activeOpacity={1}>
            <View style={styles.sortModalContainer}>
                <Text style={styles.sortModalTitle}>Sort by Month</Text>
                <ScrollView
                  showsVerticalScrollIndicator={false}
                  bounces={true}
                  overScrollMode="never"
                  scrollEventThrottle={16}
                  decelerationRate="fast"
                >
                    <TouchableOpacity style={styles.sortOption} onPress={() => { setSelectedMonth(null); setSortModalVisible(false); }}>
                        <Text style={styles.sortOptionText}>All Months</Text>
                    </TouchableOpacity>
                    {availableMonths.map(month => (
                        <TouchableOpacity key={month.value} style={styles.sortOption} onPress={() => { setSelectedMonth(month.value); setSortModalVisible(false); }}>
                            <Text style={styles.sortOptionText}>{month.label}</Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>
            </View>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 12,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerButton: {
      width: 36,
      height: 36,
      borderRadius: 18,
      justifyContent: 'center',
      alignItems: 'center',
      borderWidth: 1,
      borderColor: '#E5E7EB'
  },
  headerTitle: {
      fontSize: 18,
      fontWeight: 'bold',
      color: '#1F2937',
  },
  mainContent: { paddingHorizontal: 20, paddingTop: 16, flex: 1 },
  searchSection: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  searchInputContainer: { flex: 1, position: 'relative' },
  searchIcon: { position: 'absolute', left: 12, top: 12, zIndex: 1 },
  searchInput: { backgroundColor: 'white', borderWidth: 1, borderColor: '#F3F4F6', borderRadius: 12, paddingVertical: 12, paddingLeft: 40, paddingRight: 16, fontSize: 14 },
  filterButton: { backgroundColor: 'white', padding: 12, borderRadius: 12, borderWidth: 1, borderColor: '#F3F4F6' },
  quickFilters: { marginVertical: 16, flexDirection: 'row', gap: 8, flexGrow: 0 },
  filterChip: { backgroundColor: 'white', paddingHorizontal: 20, paddingVertical: 8, borderRadius: 999, borderWidth: 1, borderColor: '#E5E7EB' },
  activeFilterChip: { backgroundColor: '#0a7ea4', borderColor: '#0a7ea4' },
  filterChipText: { fontSize: 14, fontWeight: '500', color: '#4B5563' },
  activeFilterChipText: { color: 'white' },
  leadsListSection: { flex: 1, marginTop: 24 },
  leadsListHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  leadsListTitle: { color: '#6B7280', fontSize: 12, fontWeight: 'bold', textTransform: 'uppercase' },
  leadCard: { backgroundColor: '#FFFFFF', borderRadius: 16, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: '#E5E7EB' },
  leadCardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  leadAvatar: { width: 48, height: 48, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  leadAvatarText: { fontSize: 18, fontWeight: 'bold' },
  leadName: { fontWeight: 'bold', color: '#111827', fontSize: 16 },
  leadCompany: { fontSize: 12, color: '#6B7280' },
  stageBadge: { backgroundColor: '#DBEAFE', color: '#2563EB', fontSize: 10, fontWeight: 'bold', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 999, overflow: 'hidden' },
  leadCardBody: { flexDirection: 'row', gap: 16, paddingVertical: 12, borderTopWidth: 1, borderBottomWidth: 1, borderColor: '#F3F4F6' },
  leadStat: { flex: 1 },
  leadStatLabel: { fontSize: 10, color: '#9CA3AF', textTransform: 'uppercase', marginBottom: 2 },
  leadStatValue: { fontSize: 14, fontWeight: 'bold', color: '#374151' },
  leadCardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 12 },
  assigneeInfo: { flexShrink: 1, marginRight: 10 },
  assigneeLabel: { fontSize: 10, color: '#9CA3AF', textTransform: 'uppercase' },
  assigneeName: { fontSize: 12, fontWeight: 'bold', color: '#374151' },
  leadActions: { flexDirection: 'row', gap: 8 },
  leadActionButton: { width: 32, height: 32, borderRadius: 12, backgroundColor: '#F3F4F6', alignItems: 'center', justifyContent: 'center' },
  emptyStateContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', marginTop: 80, paddingHorizontal: 20 },
  emptyStateText: { fontSize: 18, fontWeight: '600', color: '#4B5563', textAlign: 'center', marginTop: 16 },
  emptyStateSubText: { fontSize: 14, color: '#9CA3AF', marginTop: 8, textAlign: 'center' },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sortModalContainer: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    width: '80%',
    maxHeight: '60%'
  },
  sortModalTitle: {
      fontSize: 18,
      fontWeight: 'bold',
      marginBottom: 15,
      textAlign: 'center'
  },
  sortOption: {
      paddingVertical: 15,
      borderBottomWidth: 1,
      borderBottomColor: '#F3F4F6'
  },
  sortOptionText: {
      fontSize: 16,
      textAlign: 'center'
  },
});

export default AllCustomersScreen;
