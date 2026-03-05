import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, Platform, Modal, ActivityIndicator, Alert, Image } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import DateTimePicker from '@react-native-community/datetimepicker';
import { db, storage } from '../firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import * as ImagePicker from 'expo-image-picker';
import { getDownloadURL, ref, uploadBytesResumable } from 'firebase/storage';

const EditSiteVisitScreen = () => {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams();
  
  const [customerName, setCustomerName] = useState('');
  const [address, setAddress] = useState('');
  const [contactNumber, setContactNumber] = useState('');
  const [date, setDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [remark, setRemark] = useState('');
  const [images, setImages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);

  useEffect(() => {
    (async () => {
      if (Platform.OS !== 'web') {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
          alert('Sorry, we need camera roll permissions to make this work!');
        }
      }
    })();
  }, []);

  useEffect(() => {
    if (id) {
      const visitRef = doc(db, 'leads', id);
      getDoc(visitRef).then(docSnap => {
        if (docSnap.exists()) {
          const data = docSnap.data();
          setCustomerName(data.customerName);
          setAddress(data.address);
          setContactNumber(data.contactNumber);
          setDate(new Date(data.followUpDate));
          setRemark(data.remark);
          setImages(data.measurementImages || []);
        }
        setIsFetching(false);
      });
    }
  }, [id]);

  const handleImagePick = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });

    if (!result.cancelled) {
      setImages([...images, result.uri]);
    }
  };

  const handleCamera = async () => {
    let result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });

    if (!result.cancelled) {
      setImages([...images, result.uri]);
    }
  };

  const handleUpdateDetails = async () => {
    if (!customerName.trim() || !contactNumber.trim()) {
        Alert.alert("Missing Information", "Please fill in both Customer Name and Contact Number.");
        return;
    }

    setIsLoading(true);
    try {
      const imageUrls = await uploadImages(images);
      const visitRef = doc(db, 'leads', id);
      let dataToUpdate = {
        customerName,
        address,
        contactNumber,
        followUpDate: date.toISOString().split('T')[0],
        remark,
        measurementImages: imageUrls,
      };

      await updateDoc(visitRef, dataToUpdate);
      Alert.alert("Success", "Site visit details have been updated successfully.");
      router.back();
    } catch (error) {
      console.error("Error updating document: ", error);
      Alert.alert("Error", "There was an error updating the site visit details. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const uploadImages = async (uris) => {
    const uploadTasks = uris.map(async (uri) => {
      if (uri.startsWith('http')) return uri; // Already uploaded
      const response = await fetch(uri);
      const blob = await response.blob();
      const filename = uri.substring(uri.lastIndexOf('/') + 1);
      const storageRef = ref(storage, `measurement_images/${id}/${filename}`);
      const uploadTask = uploadBytesResumable(storageRef, blob);
      await uploadTask;
      return getDownloadURL(storageRef);
    });
    return Promise.all(uploadTasks);
  }

  const onDateChange = (event, selectedDate) => {
    const currentDate = selectedDate || date;
    setShowDatePicker(Platform.OS === 'ios');
    setDate(currentDate);
  };

  if (isFetching) {
    return <ActivityIndicator style={{flex: 1, justifyContent: 'center', alignItems: 'center'}} size="large" color="#0a7ea4" />
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top }]}>
        <TouchableOpacity style={styles.headerButton} onPress={() => router.back()}>
            <Feather name="chevron-left" size={24} color="#1F2937" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Edit Site Visit</Text>
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
              <Text style={styles.label}>Measurement Photos</Text>
              <View style={styles.imageContainer}>
                {images.map((uri, index) => (
                  <View key={index} style={styles.imageWrapper}>
                    <Image source={{ uri }} style={styles.image} />
                    <TouchableOpacity style={styles.removeImageButton} onPress={() => setImages(images.filter((_, i) => i !== index))}>
                      <Feather name="x" size={18} color="white" />
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
              <View style={styles.imageButtons}>
                <TouchableOpacity style={styles.imageButton} onPress={handleImagePick}>
                  <Feather name="image" size={20} color="#374151" />
                  <Text style={styles.imageButtonText}>Gallery</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.imageButton} onPress={handleCamera}>
                  <Feather name="camera" size={20} color="#374151" />
                  <Text style={styles.imageButtonText}>Camera</Text>
                </TouchableOpacity>
              </View>
            </View>

             <TouchableOpacity style={[styles.saveButton, isLoading && styles.saveButtonDisabled]} onPress={handleUpdateDetails} disabled={isLoading}>
                {isLoading ? <ActivityIndicator color="white" /> : <Text style={styles.saveButtonText}>Update Details</Text>}
            </TouchableOpacity>
        </View>
      </ScrollView>
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
  imageContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 10,
  },
  imageWrapper: {
    position: 'relative',
    marginRight: 10,
    marginBottom: 10,
  },
  image: {
    width: 100,
    height: 100,
    borderRadius: 8,
  },
  removeImageButton: {
    position: 'absolute',
    top: -5,
    right: -5,
    backgroundColor: 'rgba(0,0,0,0.7)',
    borderRadius: 12,
    padding: 3,
  },
  imageButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  imageButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  imageButtonText: {
    marginLeft: 10,
    fontSize: 14,
    color: '#374151',
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
});

export default EditSiteVisitScreen;
