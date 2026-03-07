import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, ActivityIndicator, FlatList, Linking, Alert, Modal } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { db, auth } from '../firebase';
import { collection, onSnapshot, query, orderBy, doc, deleteDoc, updateDoc, where, getDocs } from 'firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';

const LeadsScreen = () => {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { stage: stageParam } = useLocalSearchParams();

  const [leads, setLeads] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredLeads, setFilteredLeads] = useState([]);
  const [isMenuVisible, setMenuVisible] = useState(false);
  const [selectedLead, setSelectedLead] = useState(null);
  const [isSortModalVisible, setSortModalVisible] = useState(false);
  const [availableMonths, setAvailableMonths] = useState([]);
  const [selectedMonth, setSelectedMonth] = useState(null);
  const [teamId, setTeamId] = useState(null);
  const [user, setUser] = useState(null);
  const [stages, setStages] = useState([]);
  const [nextStage, setNextStage] = useState(null);

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

    const queryConstraints = [where("teamId", "==", teamId)];
    if (stageParam) {
      queryConstraints.push(where("stage", "==", stageParam));
    }
    queryConstraints.push(orderBy("followUpDate", "desc"));

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

    const stagesQuery = query(collection(db, "stages"), where("teamId", "==", teamId), orderBy("order", "asc"));
    const unsubscribeStages = onSnapshot(stagesQuery, (snapshot) => {
      setStages(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    return () => {
      unsubscribeLeads();
      unsubscribeStages();
    };
  }, [teamId, user, stageParam, selectedMonth]);

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

  const openMenu = (lead) => {
    const currentStage = lead.stage;
    let nextStageObj = null;

    if (stages.length > 0) {
        const currentStageIndex = stages.findIndex(s => s.name === currentStage);
        if (currentStageIndex === -1) {
            nextStageObj = stages[0];
        } else if (currentStageIndex < stages.length - 1) {
            nextStageObj = stages[currentStageIndex + 1];
        }
    } else {
        if (!currentStage) {
            nextStageObj = { name: 'Stage 1' };
        } else {
            const stageNumMatch = currentStage.match(/Stage (\d+)/);
            if (stageNumMatch) {
                const currentNum = parseInt(stageNumMatch[1], 10);
                nextStageObj = { name: `Stage ${currentNum + 1}` };
            } else {
                nextStageObj = { name: 'Stage 1' };
            }
        }
    }

    setNextStage(nextStageObj);
    setSelectedLead(lead);
    setMenuVisible(true);
  };

  const closeMenu = () => {
    setMenuVisible(false);
    setSelectedLead(null);
    setNextStage(null);
  }

  const handleRemoveLead = () => {
    if (!selectedLead) return;
    Alert.alert("Remove Lead", `Are you sure you want to remove ${selectedLead.customerName}?`,
        [
            { text: "Cancel", style: "cancel", onPress: closeMenu },
            { text: "Remove", style: "destructive", onPress: async () => {
                try {
                    await deleteDoc(doc(db, 'leads', selectedLead.id));
                    Alert.alert("Success", "Lead has been removed.");
                    closeMenu();
                } catch (error) {
                    Alert.alert("Error", "Failed to remove lead.");
                }
            }}
        ]
    );
  };

  const handleMoveToNextStage = async () => {
    if (!selectedLead || !nextStage) return;
    try {
        await updateDoc(doc(db, 'leads', selectedLead.id), { stage: nextStage.name });
        Alert.alert("Success", `Lead has been forwarded to ${nextStage.name}.`);
        closeMenu();
    } catch (error) {
        Alert.alert("Error", "Failed to update lead.");
    }
  }
  
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
                <View style={styles.leadCardFooter}>
                    <View style={styles.assigneeInfo}>
                        <Text style={styles.assigneeLabel}>Assigned to:</Text>
                        <Text style={styles.assigneeName} numberOfLines={1}>{item.assignedTo ? item.assignedTo.map(u => u.name).join(', ') : 'N/A'}</Text>
                    </View>
                    <View style={styles.leadActions}>
                        <TouchableOpacity style={[styles.leadActionButton, { backgroundColor: 'rgba(10, 126, 164, 0.1)' }]} onPress={() => handleCall(item.contactNumber)}>
                            <Feather name="phone" size={18} color="#0a7ea4" />
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.leadActionButton} onPress={() => openMenu(item)}>
                            <Feather name="more-vertical" size={18} color="#4B5563" />
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
        <Text style={styles.headerTitle}>{stageParam === 'Stage 1' ? 'Leads' : (stageParam ? `(${stageParam}) Leads` : (user && user.role !== 'admin' ? 'My Leads' : 'All Leads'))}</Text>
        <View style={{width: 36}} />
      </View>
      <View style={styles.mainContent}>
          <View style={styles.searchSection}>
              <View style={styles.searchInputContainer}>
                  <Feather name="search" size={20} color="#9CA3AF" style={styles.searchIcon} />
                  <TextInput
                      placeholder="Search leads..."
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
                  <Text style={styles.leadsListTitle}>{stageParam === 'Stage 1' ? 'Leads' : (stageParam ? `Leads in ${stageParam}` : 'All Leads')} ({filteredLeads.length})</Text>
                  {(user && user.role === 'admin') && (
                    <TouchableOpacity style={styles.createLeadButton} onPress={() => router.push('/create-lead')}>
                        <Feather name="plus-circle" size={16} color="#0a7ea4" />
                        <Text style={styles.createLeadButtonText}>Create Lead</Text>
                    </TouchableOpacity>
                  )}
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
                                <Feather name={user && user.role !== 'admin' ? "user-check" : "briefcase"} size={40} color="#9CA3AF" />
                                <Text style={styles.emptyStateText}>
                                    {user && user.role !== 'admin' ? 'No Leads Assigned to You' : 'No Leads Found'}
                                </Text>
                                <Text style={styles.emptyStateSubText}>
                                    {user && user.role !== 'admin'
                                        ? 'When a new lead is assigned to you, it will appear here.'
                                        : 'There are currently no leads to display for this team or filter.'}
                                </Text>
                          </View>
                      )}
                  />
              )}
          </View>
      </View>
      <Modal animationType="fade" transparent={true} visible={isMenuVisible} onRequestClose={closeMenu}>
        <TouchableOpacity style={styles.modalOverlay} onPress={closeMenu} activeOpacity={1}>
            <View style={styles.menuContainer}>
                 {nextStage && (
                    <TouchableOpacity style={styles.menuItem} onPress={handleMoveToNextStage}>
                        <Feather name="send" size={20} color="#4B5563" />
                        <Text style={styles.menuItemText}>Forward to {nextStage.name}</Text>
                    </TouchableOpacity>
                )}
                <TouchableOpacity style={styles.menuItem} onPress={() => { router.push(`/edit-lead?id=${selectedLead.id}`); closeMenu(); }}>
                    <Feather name="edit" size={20} color="#4B5563" />
                    <Text style={styles.menuItemText}>Edit Details</Text>
                </TouchableOpacity>
                <View style={styles.menuDivider} />
                <TouchableOpacity style={[styles.menuItem]} onPress={handleRemoveLead}>
                    <Feather name="trash-2" size={20} color="#DC2626" />
                    <Text style={[styles.menuItemText, {color: '#DC2626'}]}>Remove Lead</Text>
                </TouchableOpacity>
            </View>
        </TouchableOpacity>
      </Modal>
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
                            <Text style={styles.sortOptionText}>{month.label}</Text
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
  createLeadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(10, 126, 164, 0.1)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
  },
  createLeadButtonText: {
    color: '#0a7ea4',
    fontWeight: 'bold',
    fontSize: 12,
  },
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
  menuContainer: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 10,
    width: '70%',
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    paddingHorizontal: 10
  },
  menuItemText: {
      fontSize: 16,
      color: '#374151',
      marginLeft: 15,
      fontWeight: '500'
  },
  menuDivider: {
      height: 1,
      backgroundColor: '#F3F4F6',
      marginHorizontal: 10,
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

export default LeadsScreen;
