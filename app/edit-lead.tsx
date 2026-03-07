import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, Platform, Modal, ActivityIndicator, Alert, Image } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import DateTimePicker from '@react-native-community/datetimepicker';
import { db } from '../firebase';
import { doc, getDoc, updateDoc, collection, onSnapshot, query, where } from 'firebase/firestore';
import * as ImagePicker from 'expo-image-picker';
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";

const sources = ["Social Media", "Walk-in", "Random"];

const EditLeadScreen = () => {
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
  const [users, setUsers] = useState([]);
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [isUserModalVisible, setUserModalVisible] = useState(false);
  const [measurementImages, setMeasurementImages] = useState([]);
  const [customerApprovalForms, setCustomerApprovalForms] = useState([]);
  const [leadStage, setLeadStage] = useState('');
  const [tokenAmount, setTokenAmount] = useState('');
  const [totalAmount, setTotalAmount] = useState('');
  const [runningPayment, setRunningPayment] = useState('');
  const [projectImages, setProjectImages] = useState([]);
  const [dispatchImages, setDispatchImages] = useState([]);
  const [workComplete, setWorkComplete] = useState(false);
  const [fullPayment, setFullPayment] = useState('');

  useEffect(() => {
    let unsubscribe = () => {};
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
          setLeadStage(data.stage);
          setTokenAmount(data.tokenAmount || '');
          setTotalAmount(data.totalAmount || '');
          setRunningPayment(data.runningPayment || '');
          setWorkComplete(data.workComplete || false);
          setFullPayment(data.fullPayment || '');
          if (data.measurementImages) {
            setMeasurementImages(data.measurementImages);
          }
          if (data.customerApprovalForms) {
            setCustomerApprovalForms(data.customerApprovalForms);
          }
          if (data.projectImages) {
            setProjectImages(data.projectImages);
          }
          if (data.dispatchImages) {
            setDispatchImages(data.dispatchImages);
          }
          if (data.assignedTo) {
            const assignedUsers = data.assignedTo.map(assigned => ({
                id: assigned.id,
                firstName: assigned.name.split(' ')[0],
                lastName: assigned.name.split(' ').slice(1).join(' ')
            }));
            setSelectedUsers(assignedUsers);
          }

          if (data.teamId) {
            const teamMembersQuery = query(collection(db, 'team_members'), where("teamId", "==", data.teamId));
            unsubscribe = onSnapshot(teamMembersQuery, async (snapshot) => {
              const memberPromises = snapshot.docs.map(async (teamMemberDoc) => {
                const memberData = teamMemberDoc.data();
                const userDocRef = doc(db, 'users', memberData.userId);
                const userDoc = await getDoc(userDocRef);
                if (userDoc.exists()) {
                  return { ...userDoc.data(), id: userDoc.id };
                }
                return null;
              });
              const usersData = (await Promise.all(memberPromises)).filter(u => u !== null);
              setUsers(usersData);
            });
          } else {
            setUsers([]);
          }
        }
        setIsFetching(false);
      });
    }

    return () => {
      unsubscribe();
    };
  }, [id]);

  const handleMeasurementImagePicker = async (useCamera) => {
    const action = useCamera ? ImagePicker.launchCameraAsync : ImagePicker.launchImageLibraryAsync;
    const options = {
      mediaTypes: 'Images',      allowsEditing: false,
      quality: 1,
    };

    let result;
    try {
      if (useCamera) {
          const permission = await ImagePicker.requestCameraPermissionsAsync();
          if (permission.granted === false) {
              Alert.alert("Permission Required", "Camera permission is required to take photos.");
              return;
          }
          result = await action(options);
      } else {
          const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
          if (permission.granted === false) {
              Alert.alert("Permission Required", "Media library permission is required to choose photos.");
              return;
          }
          result = await action(options);
      }

      if (!result.canceled) {
        setMeasurementImages(prev => [...prev, result.assets[0].uri]);
      }
    } catch (error) {
      Alert.alert("Error", "Failed to pick image.");
    }
  };

  const handleApprovalImagePicker = async (useCamera) => {
    const action = useCamera ? ImagePicker.launchCameraAsync : ImagePicker.launchImageLibraryAsync;
    const options = {
      mediaTypes: 'Images',      allowsEditing: false,
      quality: 1,
    };
    let result;
    try {
      if (useCamera) {
          const permission = await ImagePicker.requestCameraPermissionsAsync();
          if (!permission.granted) {
              Alert.alert("Permission Required", "Camera permission is required.");
              return;
          }
          result = await action(options);
      } else {
          const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
          if (!permission.granted) {
              Alert.alert("Permission Required", "Media library permission is required.");
              return;
          }
          result = await action(options);
      }

      if (!result.canceled) {
        const uri = result.assets[0].uri;
        const name = uri.split('/').pop();
        setCustomerApprovalForms(prev => [...prev, { uri, name, type: 'image' }]);
      }
    } catch (error) {
       Alert.alert("Error", "Failed to pick image.");
    }
  };

  const handleProjectImagePicker = async (useCamera) => {
    const action = useCamera ? ImagePicker.launchCameraAsync : ImagePicker.launchImageLibraryAsync;
    const options = {
      mediaTypes: 'Images',      allowsEditing: false,
      quality: 1,
    };

    let result;
    try {
      if (useCamera) {
          const permission = await ImagePicker.requestCameraPermissionsAsync();
          if (permission.granted === false) {
              Alert.alert("Permission Required", "Camera permission is required to take photos.");
              return;
          }
          result = await action(options);
      } else {
          const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
          if (permission.granted === false) {
              Alert.alert("Permission Required", "Media library permission is required to choose photos.");
              return;
          }
          result = await action(options);
      }

      if (!result.canceled) {
        setProjectImages(prev => [...prev, result.assets[0].uri]);
      }
    } catch (error) {
      Alert.alert("Error", "Failed to pick image.");
    }
  };

  const handleDispatchImagePicker = async (useCamera) => {
    const action = useCamera ? ImagePicker.launchCameraAsync : ImagePicker.launchImageLibraryAsync;
    const options = {
      mediaTypes: 'Images',      allowsEditing: false,
      quality: 1,
    };

    let result;
    try {
      if (useCamera) {
          const permission = await ImagePicker.requestCameraPermissionsAsync();
          if (permission.granted === false) {
              Alert.alert("Permission Required", "Camera permission is required to take photos.");
              return;
          }
          result = await action(options);
      } else {
          const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
          if (permission.granted === false) {
              Alert.alert("Permission Required", "Media library permission is required to choose photos.");
              return;
          }
          result = await action(options);
      }

      if (!result.canceled) {
        setDispatchImages(prev => [...prev, result.assets[0].uri]);
      }
    } catch (error) {
      Alert.alert("Error", "Failed to pick image.");
    }
  };

  const uriToBlob = (uri) => {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.onload = function () {
        resolve(xhr.response);
      };
      xhr.onerror = function () {
        reject(new Error("Blob conversion failed"));
      };
      xhr.responseType = "blob";
      xhr.open("GET", uri, true);
      xhr.send(null);
    });
  };

  const uploadImage = async (fileUri) => {
    const storage = getStorage(undefined, "gs://smart-task-app-84eef.firebasestorage.app");
    try {
        const blob = await uriToBlob(fileUri);
        const fileName = `images/${Date.now()}.jpg`;
        const storageRef = ref(storage, fileName);
        await uploadBytes(storageRef, blob, { contentType: "image/jpeg" });
        blob.close();
        return await getDownloadURL(storageRef);
    } catch(error){
        console.error("Image upload error:", error);
        throw error;
    }
  };

  const uploadApprovalFile = async (file) => {
    const storage = getStorage(undefined, "gs://smart-task-app-84eef.firebasestorage.app");
    try {
        const blob = await uriToBlob(file.uri);
        const contentType = 'image/jpeg';
        const fileName = `customer_approvals/${id}/${Date.now()}_${file.name}`;
        const storageRef = ref(storage, fileName);

        await uploadBytes(storageRef, blob, { contentType });
        blob.close();

        const downloadURL = await getDownloadURL(storageRef);
        return { url: downloadURL, name: file.name, type: 'image' };
    } catch (error) {
        console.error("Approval file upload error:", error);
        throw error;
    }
  };

  const handleUpdateDetails = async () => {
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
      const imageUrls = await Promise.all(
          measurementImages.map(img => img.startsWith('http') ? Promise.resolve(img) : uploadImage(img))
      );
      
      const approvalFormUrls = await Promise.all(
          customerApprovalForms.map(form => form.url ? Promise.resolve(form) : uploadApprovalFile(form))
      );
      
      const projectImageUrls = await Promise.all(
        projectImages.map(img => img.startsWith('http') ? Promise.resolve(img) : uploadImage(img))
      );

      const dispatchImageUrls = await Promise.all(
        dispatchImages.map(img => img.startsWith('http') ? Promise.resolve(img) : uploadImage(img))
      );

      const leadRef = doc(db, 'leads', id);
      let dataToUpdate = {
        customerName,
        address,
        contactNumber,
        followUpDate: date.toISOString().split('T')[0],
        remark,
        source,
        assignedTo: selectedUsers.map(user => ({ id: user.id, name: `${user.firstName} ${user.lastName}`})),
        measurementImages: imageUrls,
        customerApprovalForms: approvalFormUrls,
      };

      if(leadStage === 'Stage 4'){
          dataToUpdate.tokenAmount = tokenAmount;
          dataToUpdate.totalAmount = totalAmount;
      }

      if(leadStage === 'Stage 5'){
          dataToUpdate.runningPayment = runningPayment;
          dataToUpdate.projectImages = projectImageUrls;
      }

      if(leadStage === 'Stage 6'){
          dataToUpdate.dispatchImages = dispatchImageUrls;
      }

      if(leadStage === 'Stage 7'){
        dataToUpdate.workComplete = workComplete;
        dataToUpdate.fullPayment = fullPayment;
      }

      await updateDoc(leadRef, dataToUpdate);
      Alert.alert("Success", "Lead details have been updated successfully.");
      router.back();
    } catch (error) {
      console.error("Update error:", error);
      Alert.alert("Error", "There was an error updating the lead details. Please try again.");
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
        const isSelected = prevSelectedUsers.find(u => u.id === user.id);
        if (isSelected) {
            return prevSelectedUsers.filter(u => u.id !== user.id);
        } else {
            return [...prevSelectedUsers, user];
        }
    });
  }

  const handleRemoveImage = (indexToRemove) => {
    setMeasurementImages(prevImages => prevImages.filter((_, index) => index !== indexToRemove));
  };

  const handleRemoveApprovalForm = (indexToRemove) => {
    setCustomerApprovalForms(prevForms => prevForms.filter((_, index) => index !== indexToRemove));
  };

  const handleRemoveProjectImage = (indexToRemove) => {
    setProjectImages(prevImages => prevImages.filter((_, index) => index !== indexToRemove));
  };

  const handleRemoveDispatchImage = (indexToRemove) => {
    setDispatchImages(prevImages => prevImages.filter((_, index) => index !== indexToRemove));
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
        <Text style={styles.headerTitle}>Edit Lead</Text>
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

            {leadStage && leadStage === 'Stage 3' && (
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Measurements</Text>
                <View style={styles.imageButtonsContainer}>
                  <TouchableOpacity style={styles.imageButton} onPress={() => handleMeasurementImagePicker(false)}>
                    <Feather name="image" size={20} color="#374151" />
                    <Text style={styles.imageButtonText}>Gallery</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.imageButton} onPress={() => handleMeasurementImagePicker(true)}>
                    <Feather name="camera" size={20} color="#374151" />
                    <Text style={styles.imageButtonText}>Camera</Text>
                  </TouchableOpacity>
                </View>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.imagePreviewContainer}>
                  {measurementImages.map((uri, index) => (
                    <View key={index} style={styles.imagePreview}>
                      <Image source={{ uri }} style={styles.image} />
                      <TouchableOpacity 
                        style={styles.removeImageButton} 
                        onPress={() => handleRemoveImage(index)}
                      >
                        <Feather name="x" size={16} color="white" />
                      </TouchableOpacity>
                    </View>
                  ))}
                </ScrollView>
              </View>
            )}

            {leadStage && leadStage === 'Stage 4' && (
              <>
                <View style={styles.inputGroup}>
                    <Text style={styles.label}>Token Amount</Text>
                    <TextInput
                        style={styles.input}
                        value={tokenAmount}
                        onChangeText={setTokenAmount}
                        placeholder="Enter token amount"
                        keyboardType="numeric"
                    />
                </View>
                <View style={styles.inputGroup}>
                    <Text style={styles.label}>Total Amount</Text>
                    <TextInput
                        style={styles.input}
                        value={totalAmount}
                        onChangeText={setTotalAmount}
                        placeholder="Enter total amount"
                        keyboardType="numeric"
                    />
                </View>
                <View style={styles.inputGroup}>
                    <Text style={styles.label}>Customer Approval Form</Text>
                    <View style={styles.imageButtonsContainer}>
                    <TouchableOpacity style={styles.imageButton} onPress={() => handleApprovalImagePicker(false)}>
                        <Feather name="image" size={20} color="#374151" />
                        <Text style={styles.imageButtonText}>Gallery</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.imageButton} onPress={() => handleApprovalImagePicker(true)}>
                        <Feather name="camera" size={20} color="#374151" />
                        <Text style={styles.imageButtonText}>Camera</Text>
                    </TouchableOpacity>
                    </View>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.imagePreviewContainer}>
                    {customerApprovalForms.map((form, index) => (
                        <View key={index} style={styles.imagePreview}>
                            <Image source={{ uri: form.uri || form.url }} style={styles.image} />
                        <TouchableOpacity 
                            style={styles.removeImageButton} 
                            onPress={() => handleRemoveApprovalForm(index)}
                        >
                            <Feather name="x" size={16} color="white" />
                        </TouchableOpacity>
                        </View>
                    ))}
                    </ScrollView>
                </View>
              </>
            )}

            {leadStage && leadStage === 'Stage 5' && (
              <>
                <View style={styles.inputGroup}>
                    <Text style={styles.label}>Running Payment</Text>
                    <TextInput
                        style={styles.input}
                        value={runningPayment}
                        onChangeText={setRunningPayment}
                        placeholder="Enter running payment"
                        keyboardType="numeric"
                    />
                </View>
                <View style={styles.inputGroup}>
                    <Text style={styles.label}>Project Details Form</Text>
                    <View style={styles.imageButtonsContainer}>
                        <TouchableOpacity style={styles.imageButton} onPress={() => handleProjectImagePicker(false)}>
                            <Feather name="image" size={20} color="#374151" />
                            <Text style={styles.imageButtonText}>Gallery</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.imageButton} onPress={() => handleProjectImagePicker(true)}>
                            <Feather name="camera" size={20} color="#374151" />
                            <Text style={styles.imageButtonText}>Camera</Text>
                        </TouchableOpacity>
                    </View>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.imagePreviewContainer}>
                        {projectImages.map((uri, index) => (
                            <View key={index} style={styles.imagePreview}>
                                <Image source={{ uri: uri.url || uri }} style={styles.image} />
                                <TouchableOpacity
                                    style={styles.removeImageButton}
                                    onPress={() => handleRemoveProjectImage(index)}>
                                    <Feather name="x" size={16} color="white" />
                                </TouchableOpacity>
                            </View>
                        ))}
                    </ScrollView>
                </View>
              </>
            )}

            {leadStage && leadStage === 'Stage 6' && (
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Dispatch</Text>
                <View style={styles.imageButtonsContainer}>
                  <TouchableOpacity style={styles.imageButton} onPress={() => handleDispatchImagePicker(false)}>
                    <Feather name="image" size={20} color="#374151" />
                    <Text style={styles.imageButtonText}>Gallery</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.imageButton} onPress={() => handleDispatchImagePicker(true)}>
                    <Feather name="camera" size={20} color="#374151" />
                    <Text style={styles.imageButtonText}>Camera</Text>
                  </TouchableOpacity>
                </View>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.imagePreviewContainer}>
                  {dispatchImages.map((uri, index) => (
                    <View key={index} style={styles.imagePreview}>
                      <Image source={{ uri: uri.url || uri }} style={styles.image} />
                      <TouchableOpacity 
                        style={styles.removeImageButton} 
                        onPress={() => handleRemoveDispatchImage(index)}
                      >
                        <Feather name="x" size={16} color="white" />
                      </TouchableOpacity>
                    </View>
                  ))}
                </ScrollView>
              </View>
            )}

            {leadStage && leadStage === 'Stage 7' && (
              <>
                <View style={styles.inputGroup}>
                    <Text style={styles.label}>Work Complete</Text>
                    <View style={styles.imageButtonsContainer}>
                        <TouchableOpacity 
                            style={[styles.imageButton, workComplete && styles.activeButton]} 
                            onPress={() => setWorkComplete(true)}>
                            <Text style={[styles.imageButtonText, workComplete && styles.activeButtonText]}>Yes</Text>
                        </TouchableOpacity>
                        <TouchableOpacity 
                            style={[styles.imageButton, !workComplete && styles.activeButton]} 
                            onPress={() => setWorkComplete(false)}>
                            <Text style={[styles.imageButtonText, !workComplete && styles.activeButtonText]}>No</Text>
                        </TouchableOpacity>
                    </View>
                </View>
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Full Payment</Text>
                  <TextInput
                      style={styles.input}
                      value={fullPayment}
                      onChangeText={setFullPayment}
                      placeholder="Enter full payment"
                      keyboardType="numeric"
                  />
                </View>
              </>
            )}

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
                                {selectedUsers.find(u => u.id === item.id) && <Feather name="check" size={20} color="#0a7ea4" />} 
                            </TouchableOpacity>
                        ))}
                    </ScrollView>
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
  imageButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 16,
  },
  imageButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    flex: 1,
    marginHorizontal: 4,
    justifyContent: 'center'
  },
  imageButtonText: {
    marginLeft: 10,
    fontSize: 14,
    color: '#374151',
    fontWeight: '600'
  },
  imagePreviewContainer: {
    flexDirection: 'row',
  },
  imagePreview: {
    position: 'relative',
    marginRight: 10,
  },
  image: {
    width: 100,
    height: 100,
    borderRadius: 8,
  },
  removeImageButton: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderRadius: 12,
    padding: 2,
  },
  activeButton: {
    backgroundColor: '#0a7ea4',
  },
  activeButtonText: {
    color: 'white',
  }
});

export default EditLeadScreen;
