import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, ActivityIndicator, FlatList, Linking, Alert, Modal } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { db } from '../firebase';
import { collection, onSnapshot, query, orderBy, doc, deleteDoc, updateDoc, where } from 'firebase/firestore';

const DispatchScreen = () => {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [leads, setLeads] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredLeads, setFilteredLeads] = useState([]);
  const [isMenuVisible, setMenuVisible] = useState(false);
  const [selectedLead, setSelectedLead] = useState(null);
  const [isSortModalVisible, setSortModalVisible] = useState(false);
  const [availableMonths, setAvailableMonths] = useState([]);
  const [selectedMonth, setSelectedMonth] = useState(null);

  useEffect(() => {
    setIsLoading(true);
    const q = query(collection(db, "leads"), where("stage", "==", "Stage 6"));

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const leadsData = [];
      querySnapshot.forEach((doc) => {
        leadsData.push({ ...doc.data(), id: doc.id });
      });

      let monthFilteredLeads = leadsData;
      if (selectedMonth) {
        const [year, monthStr] = selectedMonth.split('-');
        const month = parseInt(monthStr, 10);
        
        const startDate = `${year}-${String(month).padStart(2, '0')}-01`;

        const nextMonth = month === 12 ? 1 : month + 1;
        const nextYear = month === 12 ? parseInt(year, 10) + 1 : parseInt(year, 10);
        const endDate = `${nextYear}-${String(nextMonth).padStart(2, '0')}-01`;

        monthFilteredLeads = leadsData.filter(lead => {
          return lead.followUpDate >= startDate && lead.followUpDate < endDate;
        });
      }
      
      monthFilteredLeads.sort((a,b) => new Date(b.followUpDate) - new Date(a.followUpDate));

      setLeads(monthFilteredLeads);
      setIsLoading(false);
    }, (error) => {
        console.error("Error fetching leads: ", error);
        setIsLoading(false);
        Alert.alert("Error", "Could not fetch leads.");
    });

    return () => unsubscribe();
  }, [selectedMonth]);

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
        lead.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        lead.address.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    setFilteredLeads(tempLeads);
  }, [searchQuery, leads]);

  const handleCall = (phoneNumber) => {
    if (phoneNumber) {
      const url = `tel:${phoneNumber}`;
      Linking.canOpenURL(url)
        .then((supported) => {
          if (supported) {
            return Linking.openURL(url);
          } else {
            Alert.alert("Error", "Unable to make a phone call.");
          }
        })
        .catch(() => Alert.alert("Error", "Unable to make a phone call."));
    } else {
        Alert.alert("No Contact", "No contact number is available for this lead.");
    }
  };

  const openMenu = (lead) => {
      setSelectedLead(lead);
      setMenuVisible(true);
  }

  const closeMenu = () => {
      setMenuVisible(false);
      setSelectedLead(null);
  }

  const handleRemoveLead = () => {
    if (!selectedLead) return;

    Alert.alert(
        "Remove Dispatch",
        `Are you sure you want to remove ${selectedLead.customerName}?`,
        [
            { text: "Cancel", style: "cancel", onPress: closeMenu },
            { 
                text: "Remove", 
                style: "destructive", 
                onPress: async () => {
                    try {
                        await deleteDoc(doc(db, 'leads', selectedLead.id));
                        Alert.alert("Success", "Dispatch has been removed.");
                        closeMenu();
                    } catch (error) {
                        Alert.alert("Error", "Failed to remove dispatch. Please try again.");
                    }
                }
            }
        ]
    );
  };

  const handleForwardToStage7 = async () => {
      if (!selectedLead) return;
      try {
          const leadRef = doc(db, 'leads', selectedLead.id);
          await updateDoc(leadRef, { stage: 'Stage 7' });
          Alert.alert("Success", "Lead has been forwarded to Stage 7.");
          closeMenu();
      } catch (error) {
          Alert.alert("Error", "Failed to update lead. Please try again.");
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
        <TouchableOpacity onPress={() => router.push(`/dispatch-details?id=${item.id}`)}>
            <View style={[styles.leadCard, {backgroundColor: '#D1FAE5', borderColor: '#6EE7B7'}]}>
                <View style={styles.leadCardHeader}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                        <View style={[styles.leadAvatar, { backgroundColor: '#A7F3D0'}]}>
                            <Text style={[styles.leadAvatarText, { color: '#065F46'}]}>{getInitials(item.customerName)}</Text>
                        </View>
                        <View style={{ flex: 1 }}>
                            <Text style={styles.leadName} numberOfLines={1}>{item.customerName}</Text>
                            <Text style={styles.leadCompany} numberOfLines={1}>{item.address}</Text>
                        </View>
                    </View>
                    {item.stage && <Text style={[styles.stageBadge, {backgroundColor: '#6EE7B7', color: '#047857'}]}>{item.stage}</Text>}
                </View>
                <View style={[styles.leadCardBody, {borderColor: '#6EE7B7'}]}>
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
                    <View />
                    <View style={styles.leadActions}>
                        <TouchableOpacity style={[styles.leadActionButton, { backgroundColor: 'rgba(16, 185, 129, 0.1)' }]} onPress={() => handleCall(item.contactNumber)}>
                            <Feather name="phone" size={18} color="#10B981" />
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
        <Text style={styles.headerTitle}>Dispatch</Text>
        <View style={{width: 36}} />
      </View>
      <View style={styles.mainContent}>
          <View style={styles.searchSection}>
              <View style={styles.searchInputContainer}>
                  <Feather name="search" size={20} color="#9CA3AF" style={styles.searchIcon} />
                  <TextInput
                      placeholder="Search by name or address..."
                      style={styles.searchInput}
                      value={searchQuery}
                      onChangeText={setSearchQuery}
                  />
              </View>
              <TouchableOpacity style={styles.filterButton} onPress={() => setSortModalVisible(true)}>
                  <Feather name="sliders" size={24} color="#4B5563" />
              </TouchableOpacity>
          </View>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.quickFilters}>
              <TouchableOpacity style={[styles.filterChip, styles.activeFilterChip, {backgroundColor: '#10B981', borderColor: '#10B981'}]}>
                  <Text style={[styles.filterChipText, styles.activeFilterChipText]}>{selectedMonth ? availableMonths.find(m => m.value === selectedMonth)?.label.split(' ')[0] : 'All'}</Text>
              </TouchableOpacity>
          </ScrollView>

          <View style={styles.leadsListSection}>
              <View style={styles.leadsListHeader}>
                  <Text style={styles.leadsListTitle}>Dispatches ({filteredLeads.length})</Text>
              </View>

              {isLoading ? (
                  <ActivityIndicator size="large" color="#10B981" style={{marginTop: 50}} />
              ) : (
                  <FlatList
                      data={filteredLeads}
                      renderItem={LeadCard}
                      keyExtractor={item => item.id}
                      showsVerticalScrollIndicator={false}
                      contentContainerStyle={{ paddingBottom: 150 }}
                      ListEmptyComponent={() => (
                          <View style={styles.emptyStateContainer}>
                              <Text style={styles.emptyStateText}>No dispatches found for this period.</Text>
                              <Text style={styles.emptyStateSubText}>Try selecting a different month.</Text>
                          </View>
                      )}
                  />
              )}
          </View>
      </View>
      <Modal
        animationType="fade"
        transparent={true}
        visible={isMenuVisible}
        onRequestClose={closeMenu}
      >
        <TouchableOpacity style={styles.modalOverlay} onPress={closeMenu} activeOpacity={1}>
            <View style={styles.menuContainer}>
                <TouchableOpacity style={styles.menuItem} onPress={handleForwardToStage7}>
                    <Feather name="send" size={20} color="#4B5563" />
                    <Text style={styles.menuItemText}>Forward to Stage 7</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.menuItem} onPress={() => { router.push(`/edit-dispatch-details?id=${selectedLead.id}`); closeMenu(); }}>
                    <Feather name="edit" size={20} color="#4B5563" />
                    <Text style={styles.menuItemText}>Edit Details</Text>
                </TouchableOpacity>
                <View style={styles.menuDivider} />
                <TouchableOpacity style={[styles.menuItem, styles.destructiveMenuItem]} onPress={handleRemoveLead}>
                    <Feather name="trash-2" size={20} color="#DC2626" />
                    <Text style={[styles.menuItemText, styles.destructiveMenuItemText]}>Remove Dispatch</Text>
                </TouchableOpacity>
            </View>
        </TouchableOpacity>
      </Modal>
      <Modal
        animationType="slide"
        transparent={true}
        visible={isSortModalVisible}
        onRequestClose={() => setSortModalVisible(false)}
      >
        <TouchableOpacity style={styles.modalOverlay} onPress={() => setSortModalVisible(false)} activeOpacity={1}>
            <View style={styles.sortModalContainer}>
                <Text style={styles.sortModalTitle}>Sort by Month</Text>
                <ScrollView>
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
  activeFilterChip: { backgroundColor: '#10B981', borderColor: '#10B981' },
  filterChipText: { fontSize: 14, fontWeight: '500', color: '#4B5563' },
  activeFilterChipText: { color: 'white' },
  leadsListSection: { flex: 1, marginTop: 24 },
  leadsListHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  leadsListTitle: { color: '#6B7280', fontSize: 12, fontWeight: 'bold', textTransform: 'uppercase' },
  leadCard: { backgroundColor: '#D1FAE5', borderRadius: 16, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: '#6EE7B7' },
  leadCardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  leadAvatar: { width: 48, height: 48, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  leadAvatarText: { fontSize: 18, fontWeight: 'bold' },
  leadName: { fontWeight: 'bold', color: '#111827', fontSize: 16 },
  leadCompany: { fontSize: 12, color: '#6B7280' },
  stageBadge: { backgroundColor: '#6EE7B7', color: '#047857', fontSize: 10, fontWeight: 'bold', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 999, overflow: 'hidden' },
  leadCardBody: { flexDirection: 'row', gap: 16, paddingVertical: 12, borderTopWidth: 1, borderBottomWidth: 1, borderColor: '#6EE7B7' },
  leadStat: { flex: 1 },
  leadStatLabel: { fontSize: 10, color: '#9CA3AF', textTransform: 'uppercase', marginBottom: 2 },
  leadStatValue: { fontSize: 14, fontWeight: 'bold', color: '#374151' },
  leadCardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 12 },
  leadActions: { flexDirection: 'row', gap: 8 },
  leadActionButton: { width: 32, height: 32, borderRadius: 12, backgroundColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center' },
  emptyStateContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', marginTop: 100 },
  emptyStateText: { fontSize: 18, fontWeight: '600', color: '#4B5563' },
  emptyStateSubText: { fontSize: 14, color: '#9CA3AF', marginTop: 8 },
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
  destructiveMenuItemText: {
      color: '#DC2626'
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

export default DispatchScreen;
