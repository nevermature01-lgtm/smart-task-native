import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, Platform, Modal, ActivityIndicator, Alert, Image } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import DateTimePicker from '@react-native-community/datetimepicker';
import { db, storage } from '../firebase';
import { doc, getDoc, updateDoc, collection, onSnapshot, query } from 'firebase/firestore';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import { getDownloadURL, ref, uploadBytes } from 'firebase/storage';

const sources = ["Social Media", "Walk-in", "Random"];

const EditProjectDetailFoamScreen = () => {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams();
  
  const [customerName, setCustomerName] = useState('');
  const [address, setAddress] = useState('');
  const [contactNumber, setContactNumber] = useState('');
  const [date, setDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [remark, setRemark] = useState('');
  const [source, setSource] = useState('Social Media');
  const [isSourceModalVisible, setSourceModalVisible] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isFetching, setIsFetching] = useState(true);
  const [users, setUsers] = useState([]);
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [isUserModalVisible, setUserModalVisible] = useState(false);
  const [stage, setStage] = useState('');
  const [projectFoam, setProjectFoam] = useState({ uri: null, name: null, type: null });
  const [existingProjectFoamURL, setExistingProjectFoamURL] = useState(null);


  useEffect(() => {
    const q = query(collection(db, "users"));
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const usersData = [];
      querySnapshot.forEach((doc) => {
        usersData.push({ ...doc.data(), id: doc.id });
      });
      setUsers(usersData);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (id) {
      setIsFetching(true);
      const leadRef = doc(db, 'leads', id);
      getDoc(leadRef).then(docSnap => {
        if (docSnap.exists()) {
          const data = docSnap.data();
          setCustomerName(data.customerName || '');
          setAddress(data.address || '');
          setContactNumber(data.contactNumber || '');
          setDate(data.followUpDate ? new Date(data.followUpDate) : new Date());
          setRemark(data.remark || '');
          setSource(data.source || 'Social Media');
          setStage(data.stage || '');
          setExistingProjectFoamURL(data.projectFoamURL || null);
          if (data.assignedTo) {
            const assignedUsers = data.assignedTo.map(assigned => ({
                id: assigned.id,
                firstName: assigned.name.split(' ')[0],
                lastName: assigned.name.split(' ').slice(1).join(' ')
            }));
            setSelectedUsers(assignedUsers);
          }
        } else {
          Alert.alert("Error", "Lead not found.");
          router.back();
        }
        setIsFetching(false);
      });
    }
  }, [id]);

  const handlePickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: false,
      quality: 1,
    });

    if (!result.canceled) {
      setProjectFoam({ uri: result.assets[0].uri, name: result.assets[0].uri.split('/').pop(), type: 'image' });
    }
  };

  const handleTakePhoto = async () => {
    let result = await ImagePicker.launchCameraAsync({
        allowsEditing: false,
        quality: 1,
    });

    if (!result.canceled) {
        setProjectFoam({ uri: result.assets[0].uri, name: result.assets[0].uri.split('/').pop(), type: 'image' });
    }
  };

  const handlePickDocument = async () => {
    try {
        const result = await DocumentPicker.getDocumentAsync({
            type: 'application/pdf',
        });

        if (result.type === 'success') {
            setProjectFoam({ uri: result.uri, name: result.name, type: 'pdf' });
        }
    } catch (error) {
        Alert.alert("Error", "Failed to pick document.");
    }
  };

  const uploadFile = async (uri, fileName) => {
    const response = await fetch(uri);
    const blob = await response.blob();
    const storageRef = ref(storage, `project_foams/${id}_${fileName}`);
    
    await uploadBytes(storageRef, blob);
    return await getDownloadURL(storageRef);
  };

  const handleUpdateDetails = async () => {
    if (!customerName.trim() || !contactNumber.trim()) {
        Alert.alert("Missing Information", "Please fill in both Customer Name and Contact Number.");
        return;
    }
    if (selectedUsers.length === 0) {
        Alert.alert("Missing Information", "Please assign this to at least one user.");
        return;
    }

    setIsUpdating(true);
    try {
      let projectFoamURL = existingProjectFoamURL;

      if (projectFoam.uri) {
        projectFoamURL = await uploadFile(projectFoam.uri, projectFoam.name);
      }

      const leadRef = doc(db, 'leads', id);
      let dataToUpdate = {
        customerName,
        address,
        contactNumber,
        followUpDate: date.toISOString().split('T')[0],
        remark,
        source,
        stage,
        assignedTo: selectedUsers.map(user => ({ id: user.id, name: `${user.firstName} ${user.lastName}`})),
        projectFoamURL,
      };

      await updateDoc(leadRef, dataToUpdate);
      Alert.alert("Success", "Project detail foam has been updated successfully.");
      router.back();
    } catch (error) {
      console.error("Error updating document: ", error);
      Alert.alert("Error", "There was an error updating the project detail foam. Please try again.");
    } finally {
      setIsUpdating(false);
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
        const isSelected = prevSelectedUsers.find(u => u.id === user.id);
        if (isSelected) {
            return prevSelectedUsers.filter(u => u.id !== user.id);
        } else {
            return [...prevSelectedUsers, user];
        }
    });
  }

  if (isFetching) {
    return <ActivityIndicator style={{flex: 1, justifyContent: 'center', alignItems: 'center'}} size="large" color="#10B981" />
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top }]}>
        <TouchableOpacity style={styles.headerButton} onPress={() => router.back()}>
            <Feather name="chevron-left" size={24} color="#1F2937" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Edit Project Detail Foam</Text>
        <View style={{width: 36}} />
      </View>
      <ScrollView contentContainerStyle={styles.mainContent}>
        <View style={styles.form}>
            <View style={styles.inputGroup}>
                <Text style={styles.label}>Assign To</Text>
                <TouchableOpacity style={styles.pickerButton} onPress={() => setUserModalVisible(true)}>
                    <Text style={styles.pickerButtonText} numberOfLines={1}>{selectedUsers.length > 0 ? selectedUsers.map(u => `${u.firstName} ${u.lastName}`).join(', ') : 'Select users'}</Text>
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
            <View style={styles.inputGroup}>
                <Text style={styles.label}>Stage</Text>
                <TextInput
                    style={styles.input}
                    value={stage}
                    onChangeText={setStage}
                    placeholder="Enter stage"
                />
            </View>
        </View>

        <View style={styles.card}>
            <Text style={styles.cardTitle}>Project Detail Foam</Text>
            <View style={styles.uploadButtonsContainer}>
                <TouchableOpacity style={styles.uploadButton} onPress={handlePickDocument}>
                    <Feather name="file-text" size={20} color="#374151" />
                    <Text style={styles.uploadButtonText}>Upload PDF</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.uploadButton} onPress={handlePickImage}>
                    <Feather name="image" size={20} color="#374151" />
                    <Text style={styles.uploadButtonText}>Gallery</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.uploadButton} onPress={handleTakePhoto}>
                    <Feather name="camera" size={20} color="#374151" />
                    <Text style={styles.uploadButtonText}>Camera</Text>
                </TouchableOpacity>
            </View>
            
            {(projectFoam.uri || existingProjectFoamURL) &&
                <View style={styles.filePreviewContainer}>
                    <Text style={styles.label}>Preview:</Text>
                    { (projectFoam.type === 'image' || (!projectFoam.type && existingProjectFoamURL && existingProjectFoamURL.includes('.jpg'))) ? (
                        <Image source={{ uri: projectFoam.uri || existingProjectFoamURL }} style={styles.image} />
                    ) : (
                        <View style={styles.pdfPreview}>
                            <Feather name="file" size={40} color="#10B981" />
                            <Text style={styles.pdfName} numberOfLines={1}>{projectFoam.name || existingProjectFoamURL?.split('F').pop().split('?')[0]}</Text>
                        </View>
                    )}
                </View>
            }
        </View>

        <TouchableOpacity style={[styles.saveButton, isUpdating && styles.saveButtonDisabled]} onPress={handleUpdateDetails} disabled={isUpdating}>
            {isUpdating ? <ActivityIndicator color="white" /> : <Text style={styles.saveButtonText}>Update Details</Text>}
        </TouchableOpacity>
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
                            {source === item && <Feather name="check" size={20} color="#10B981" />} 
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
            <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setUserModalVisible(false)}>
                <View style={styles.modalContent}>
                    <Text style={styles.modalTitle}>Assign to</Text>
                    <ScrollView>
                        {users.map((item, index) => (
                            <TouchableOpacity key={index} style={styles.modalItem} onPress={() => handleSelectUser(item)}>
                                <Text style={styles.modalItemText}>{`${item.firstName} ${item.lastName}`}</Text>
                                {selectedUsers.find(u => u.id === item.id) && <Feather name="check" size={20} color="#10B981" />} 
                            </TouchableOpacity>
                        ))}
                    </ScrollView>
                     <TouchableOpacity style={[styles.doneButton, {backgroundColor: '#10B981'}]} onPress={() => setUserModalVisible(false)}>
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
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 3,
    marginBottom: 20
  },
  card: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 3,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 16,
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
    backgroundColor: '#10B981',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 16,
  },
  saveButtonDisabled: {
      backgroundColor: '#6EE7B7',
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
      shadowOffset: { width: 0, height: 2 },
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
    backgroundColor: '#10B981',
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
  uploadButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 20,
  },
  uploadButton: {
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    flex: 1,
    marginHorizontal: 4,
  },
  uploadButtonText: {
    fontSize: 12,
    color: '#374151',
    marginTop: 6,
  },
  filePreviewContainer: {
      marginTop: 16
  },
  image: {
    width: '100%',
    height: 200,
    borderRadius: 8,
    marginTop: 8,
  },
  pdfPreview: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: '#F9FAFB',
      padding: 16,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: '#E5E7EB',
      marginTop: 8
  },
  pdfName: {
      marginLeft: 12,
      fontSize: 14,
      flex: 1
  }
});

export default EditProjectDetailFoamScreen;
