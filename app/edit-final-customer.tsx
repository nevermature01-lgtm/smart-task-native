import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, Platform, Modal, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import DateTimePicker from '@react-native-community/datetimepicker';
import { db } from '../firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';

const sources = ["Social Media", "Walk-in", "Random"];

const EditFinalCustomerScreen = () => {
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
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);

  useEffect(() => {
    if (id) {
      const leadRef = doc(db, 'leads', id);
      getDoc(leadRef).then(docSnap => {
        if (docSnap.exists()) {
          const data = docSnap.data();
          setCustomerName(data.customerName);
          setAddress(data.address);
          setContactNumber(data.contactNumber);
          setDate(new Date(data.followUpDate));
          setRemark(data.remark);
          setSource(data.source);
        }
        setIsFetching(false);
      });
    }
  }, [id]);

  const handleUpdateDetails = async () => {
    if (!customerName.trim() || !contactNumber.trim()) {
        Alert.alert("Missing Information", "Please fill in both Customer Name and Contact Number.");
        return;
    }

    setIsLoading(true);
    try {
      const leadRef = doc(db, 'leads', id);
      let dataToUpdate = {
        customerName,
        address,
        contactNumber,
        followUpDate: date.toISOString().split('T')[0],
        remark,
        source,
      };

      await updateDoc(leadRef, dataToUpdate);
      Alert.alert("Success", "Final customer details have been updated successfully.");
      router.back();
    } catch (error) {
      console.error("Error updating document: ", error);
      Alert.alert("Error", "There was an error updating the final customer details. Please try again.");
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

  if (isFetching) {
    return <ActivityIndicator style={{flex: 1, justifyContent: 'center', alignItems: 'center'}} size="large" color="#0a7ea4" />
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top }]}>
        <TouchableOpacity style={styles.headerButton} onPress={() => router.back()}>
            <Feather name="chevron-left" size={24} color="#1F2937" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Edit Final Customer</Text>
        <View style={{width: 36}} />
      </View>
      <ScrollView contentContainerStyle={styles.mainContent}>
        <View style={styles.form}>
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

             <TouchableOpacity style={[styles.saveButton, isLoading && styles.saveButtonDisabled]} onPress={handleUpdateDetails} disabled={isLoading}>
                {isLoading ? <ActivityIndicator color="white" /> : <Text style={styles.saveButtonText}>Update Details</Text>}
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

export default EditFinalCustomerScreen;
