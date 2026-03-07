import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, Platform, Modal, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import DateTimePicker from '@react-native-community/datetimepicker';
import { db } from '../firebase';
import { addDoc, collection, onSnapshot, query, where, orderBy, doc, getDocs, getDoc } from 'firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';

const sources = ["Social Media", "Walk-in", "Random"];

const CreateLeadScreen = () => {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  
  const [customerName, setCustomerName] = useState('');
  const [address, setAddress] = useState('');
  const [contactNumber, setContactNumber] = useState('');
  const [date, setDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [remark, setRemark] = useState('');
  const [source, setSource] = useState('Social Media');
  const [isSourceModalVisible, setSourceModalVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [users, setUsers] = useState([]);
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [isUserModalVisible, setUserModalVisible] = useState(false);
  const [teamId, setTeamId] = useState(null);
  const [stages, setStages] = useState([]);
  const [isFetchingUsers, setIsFetchingUsers] = useState(false);

  useEffect(() => {
    let unsubscribeStages = () => {};

    const fetchData = async () => {
      try {
        const activeAccountString = await AsyncStorage.getItem('activeAccount');
        if (activeAccountString) {
            const activeAccount = JSON.parse(activeAccountString);
            setTeamId(activeAccount.id);

            // Fetch stages
            const stagesQuery = query(collection(db, "stages"), where("teamId", "==", activeAccount.id), orderBy("order", "asc"));
            unsubscribeStages = onSnapshot(stagesQuery, (snapshot) => {
                const stagesData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                setStages(stagesData);
            }, (error) => console.error("Error fetching stages:", error));
        }
      } catch (error) {
        console.error("Error fetching team data: ", error);
        Alert.alert("Error", "There was an error loading team data.");
      }
    };

    fetchData();

    return () => {
      unsubscribeStages();
    };
  }, []);

  const fetchTeamMembers = async () => {
    if (!teamId) return;
    setIsFetchingUsers(true);
    try {
      const teamMembersQuery = query(collection(db, 'team_members'), where('teamId', '==', teamId));
      const teamMembersSnapshot = await getDocs(teamMembersQuery);

      const memberPromises = teamMembersSnapshot.docs.map(async (memberDoc) => {
        const memberData = memberDoc.data();
        if (!memberData.userId) return null;

        const userDocRef = doc(db, 'users', memberData.userId);
        const userDoc = await getDoc(userDocRef);

        if (userDoc.exists()) {
          const userData = userDoc.data();
          return { 
            id: userDoc.id, 
            name: `${userData.firstName} ${userData.lastName || ''}`.trim(),
            ...userData
          };
        }
        return null;
      });
      
      const usersData = (await Promise.all(memberPromises)).filter(user => user !== null);
      setUsers(usersData);
    } catch (error) {
      console.error("Error fetching team members: ", error);
      Alert.alert("Error", "There was an error loading team members.");
    } finally {
      setIsFetchingUsers(false);
    }
  };

  const handleOpenUserPicker = () => {
      if(users.length === 0) { // Fetch only if not already fetched
          fetchTeamMembers();
      }
      setUserModalVisible(true);
  }

  const handleSaveLead = async () => {
    if (!customerName.trim() || !contactNumber.trim()) {
        Alert.alert("Missing Information", "Please fill in both Customer Name and Contact Number.");
        return;
    }
    if (selectedUsers.length === 0) {
        Alert.alert("Missing Information", "Please assign the lead to at least one user.");
        return;
    }

    setIsLoading(true);
    try {
      const initialStage = stages.length > 0 ? stages[0].name : 'Stage 1';
      await addDoc(collection(db, "leads"), {
        customerName,
        address,
        contactNumber,
        followUpDate: date.toISOString().split('T')[0],
        remark,
        source,
        createdAt: new Date(),
        assignedTo: selectedUsers.map(user => ({ id: user.id, name: user.name})),
        stage: initialStage,
        teamId,
      });
      Alert.alert("Success", "Lead has been saved successfully.");
      router.back();
    } catch (error) {
      console.error("Error adding document: ", error);
      Alert.alert("Error", "There was an error saving the lead. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const onDateChange = (event, selectedDate) => {
    const currentDate = selectedDate || date;
    setShowDatePicker(Platform.OS === 'ios');
    setDate(currentDate);
  };

  const handleSelectSource = (selectedSource) => {
      setSource(selectedSource);
      setSourceModalVisible(false);
  }

  const handleSelectUser = (user) => {
      setSelectedUsers(prevSelectedUsers => {
          const isSelected = prevSelectedUsers.some(u => u.id === user.id);
          if (isSelected) {
              return prevSelectedUsers.filter(u => u.id !== user.id);
          } else {
              return [...prevSelectedUsers, user];
          }
      });
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top }]}>
        <TouchableOpacity style={styles.headerButton} onPress={() => router.back()}>
            <Feather name="chevron-left" size={24} color="#1F2937" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Create Lead</Text>
        <View style={{width: 36}} />
      </View>
      <ScrollView contentContainerStyle={styles.mainContent}>
        <View style={styles.form}>
            <View style={styles.inputGroup}>
                <Text style={styles.label}>Assign To</Text>
                 <TouchableOpacity style={styles.pickerButton} onPress={handleOpenUserPicker}>
                    <Text style={styles.pickerButtonText} numberOfLines={1}>{selectedUsers.length > 0 ? selectedUsers.map(u => u.name).join(', ') : 'Select users'}</Text>
                    <Feather name="chevron-down" size={20} color="#9CA3AF" />
                </TouchableOpacity>
            </View>
            <View style={styles.inputGroup}>
                <Text style={styles.label}>Customer Name</Text>
                <TextInput
                    style={styles.input}
                    value={customerName}
                    onChangeText={setCustomerName}
                    placeholder="Enter customer's full name"
                />
            </View>
            <View style={styles.inputGroup}>
                <Text style={styles.label}>Address</Text>
                <TextInput
                    style={styles.input}
                    value={address}
                    onChangeText={setAddress}
                    placeholder="Enter customer's address"
                />
            </View>
            <View style={styles.inputGroup}>
                <Text style={styles.label}>Contact Number</Text>
                <TextInput
                    style={styles.input}
                    value={contactNumber}
                    onChangeText={setContactNumber}
                    placeholder="Enter contact number"
                    keyboardType="phone-pad"
                />
            </View>
            <View style={styles.inputGroup}>
                <Text style={styles.label}>Follow-up Date</Text>
                <TouchableOpacity onPress={() => setShowDatePicker(true)} style={styles.datePickerInput}>
                    <Text style={{fontSize: 14, color: '#374151'}}>{date.toLocaleDateString()}</Text>
                    <Feather name="calendar" size={20} color="#9CA3AF" />
                </TouchableOpacity>
                {showDatePicker && (
                    <DateTimePicker
                        testID="dateTimePicker"
                        value={date}
                        mode="date"
                        display="default"
                        onChange={onDateChange}
                        minimumDate={new Date()}
                    />
                )}
            </View>
            <View style={styles.inputGroup}>
                <Text style={styles.label}>Remark</Text>
                <TextInput
                    style={[styles.input, styles.textarea]}
                    value={remark}
                    onChangeText={setRemark}
                    placeholder="Add any relevant notes or remarks"
                    multiline
                />
            </View>
            <View style={styles.inputGroup}>
                <Text style={styles.label}>Source</Text>
                 <TouchableOpacity style={styles.pickerButton} onPress={() => setSourceModalVisible(true)}>
                    <Text style={styles.pickerButtonText}>{source}</Text>
                    <Feather name="chevron-down" size={20} color="#9CA3AF" />
                </TouchableOpacity>
            </View>

             <TouchableOpacity style={[styles.saveButton, isLoading && styles.saveButtonDisabled]} onPress={handleSaveLead} disabled={isLoading}>
                {isLoading ? <ActivityIndicator color="white" /> : <Text style={styles.saveButtonText}>Save Lead</Text>}
            </TouchableOpacity>
        </View>
      </ScrollView>

       <Modal
            animationType="fade"
            transparent={true}
            visible={isSourceModalVisible}
            onRequestClose={() => setSourceModalVisible(false)}
        >
            <TouchableOpacity style={styles.modalOverlay} onPress={() => setSourceModalVisible(false)} activeOpacity={1}>
                <View style={styles.modalContent}>
                    <Text style={styles.modalTitle}>Select a Source</Text>
                    {sources.map((item, index) => (
                        <TouchableOpacity key={index} style={styles.modalItem} onPress={() => handleSelectSource(item)}>
                            <Text style={styles.modalItemText}>{item}</Text>
                            {source === item && <Feather name="check" size={20} color="#0a7ea4" />} 
                        </TouchableOpacity>
                    ))}
                </View>
            </TouchableOpacity>
        </Modal>

        <Modal
            animationType="fade"
            transparent={true}
            visible={isUserModalVisible}
            onRequestClose={() => setUserModalVisible(false)}
        >
            <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPressOut={() => setUserModalVisible(false)}>
                <View style={styles.modalContent}>
                    <Text style={styles.modalTitle}>Assign to</Text>
                    {isFetchingUsers ? (
                        <ActivityIndicator size="large" color="#0a7ea4" style={{paddingVertical: 20}}/>
                    ) : (
                        <ScrollView>
                            {users.length === 0 ? (
                                <Text style={{textAlign: 'center', paddingVertical: 20, color: '#6B7280'}}>No members found in this team.</Text>
                            ) : users.map((item, index) => (
                                <TouchableOpacity key={index} style={styles.modalItem} onPress={() => handleSelectUser(item)}>
                                    <Text style={styles.modalItemText}>{item.name}</Text>
                                    {selectedUsers.find(u => u.id === item.id) && <Feather name="check" size={20} color="#0a7ea4" />} 
                                </TouchableOpacity>
                            ))}
                        </ScrollView>
                    )}
                     <TouchableOpacity style={styles.doneButton} onPress={() => setUserModalVisible(false)}>
                        <Text style={styles.doneButtonText}>Done</Text>
                    </TouchableOpacity>
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
  mainContent: { 
    paddingHorizontal: 20, 
    paddingTop: 16, 
    paddingBottom: 40,
  },
  form: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    borderWidth: 1,
    borderColor: '#F3F4F6',
    shadowColor: "#000",
    shadowOffset: {
        width: 0,
        height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 3,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    fontSize: 14,
    color: '#374151',
  },
  datePickerInput: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  textarea: {
      height: 100,
      textAlignVertical: 'top'
  },
  pickerButton: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      backgroundColor: '#F9FAFB',
      borderWidth: 1,
      borderColor: '#E5E7EB',
      borderRadius: 8,
      paddingVertical: 12,
      paddingHorizontal: 16,
  },
  pickerButtonText: {
      fontSize: 14,
      color: '#374151',
      flex: 1,
  },
  saveButton: {
    backgroundColor: '#0a7ea4',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 16,
  },
  saveButtonDisabled: {
      backgroundColor: '#a7d8e8',
  },
  saveButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.5)',
      justifyContent: 'center',
      alignItems: 'center',
  },
  modalContent: {
      backgroundColor: 'white',
      borderRadius: 12,
      padding: 20,
      width: '90%',
      maxHeight: '80%',
      shadowColor: "#000",
      shadowOffset: {
          width: 0,
          height: 2,
      },
      shadowOpacity: 0.25,
      shadowRadius: 4,
      elevation: 5,
  },
  modalTitle: {
      fontSize: 18,
      fontWeight: 'bold',
      color: '#1F2937',
      marginBottom: 20,
      textAlign: 'center',
  },
  modalItem: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: 15,
      borderBottomWidth: 1,
      borderBottomColor: '#F3F4F6',
  },
  modalItemText: {
      fontSize: 16,
      color: '#374151',
  },
   doneButton: {
        backgroundColor: '#0a7ea4',
        paddingVertical: 14,
        borderRadius: 12,
        alignItems: 'center',
        marginTop: 20,
    },
    doneButtonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: 'bold',
    },
});

export default CreateLeadScreen;
