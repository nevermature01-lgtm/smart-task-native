import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, Image, ActivityIndicator, ScrollView } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Calendar } from 'react-native-calendars';
import * as ImagePicker from 'expo-image-picker';
import { db, storage, auth } from '../firebase';
import { collection, addDoc, query, where, getDocs, serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { onAuthStateChanged } from 'firebase/auth';

const AttendanceScreen = () => {
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const [user, setUser] = useState(null);
    const [selectedDate, setSelectedDate] = useState('');
    const [markedDates, setMarkedDates] = useState({});
    const [image, setImage] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [attendanceRecord, setAttendanceRecord] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
            if (currentUser) {
                setUser(currentUser);
            } else {
                router.replace('/login');
            }
        });
        return () => unsubscribe();
    }, []);

    useEffect(() => {
        if (user) {
            const today = new Date().toISOString().split('T')[0];
            const newMarkedDates = {
                [today]: { selected: true, selectedColor: '#8B5CF6', disableTouchEvent: true },
            };
            setMarkedDates(newMarkedDates);
            setSelectedDate(today);
            checkAttendance(today);
        }
    }, [user]);

    const checkAttendance = async (date) => {
        if (!user) return;
        setIsLoading(true);
        try {
            const attendanceQuery = query(
                collection(db, 'attendance'),
                where('userId', '==', user.uid),
                where('date', '==', date)
            );
            const querySnapshot = await getDocs(attendanceQuery);
            if (!querySnapshot.empty) {
                const docData = querySnapshot.docs[0].data();
                setAttendanceRecord(docData);
                setImage(docData.photoURL);
            } else {
                setAttendanceRecord(null);
                setImage(null);
            }
        } catch (error) {
            console.error("Error checking attendance: ", error);
            Alert.alert("Error", "Could not check attendance status.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleTakePhoto = async () => {
        const { status } = await ImagePicker.requestCameraPermissionsAsync();
        if (status !== 'granted') {
            Alert.alert('Permission Denied', 'Sorry, we need camera permissions to mark your attendance.');
            return;
        }

        let result = await ImagePicker.launchCameraAsync({
            allowsEditing: false,
            quality: 0.5,
        });

        if (!result.canceled) {
            setImage(result.assets[0].uri);
        }
    };

    const uploadImage = async (uri) => {
        const response = await fetch(uri);
        const blob = await response.blob();
        const storageRef = ref(storage, `attendance/${user.uid}/${selectedDate}.jpg`);
        await uploadBytes(storageRef, blob);
        return await getDownloadURL(storageRef);
    };

    const handleSubmitAttendance = async () => {
        if (!image) {
            Alert.alert('No Photo', 'Please take a photo to mark your attendance.');
            return;
        }
        if (attendanceRecord) {
            Alert.alert('Already Marked', 'You have already marked your attendance for today.');
            return;
        }

        setIsSubmitting(true);
        try {
            const photoURL = await uploadImage(image);
            await addDoc(collection(db, 'attendance'), {
                userId: user.uid,
                date: selectedDate,
                photoURL,
                timestamp: serverTimestamp(),
            });
            Alert.alert('Success', 'Your attendance has been marked successfully.');
            checkAttendance(selectedDate);
        } catch (error) {
            console.error("Error submitting attendance: ", error);
            Alert.alert('Error', 'There was an error submitting your attendance. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };
    
    const today = new Date().toISOString().split('T')[0];

    return (
        <SafeAreaView style={styles.container}>
            <View style={[styles.header, { paddingTop: insets.top }]}>
                <TouchableOpacity style={styles.headerButton} onPress={() => router.back()}>
                    <Feather name="chevron-left" size={24} color="#1F2937" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Mark Attendance</Text>
                <View style={{width: 36}} />
            </View>
            <ScrollView contentContainerStyle={styles.mainContent}>
                <View style={styles.calendarContainer}>
                    <Calendar
                        current={today}
                        markedDates={markedDates}
                        minDate={today}
                        maxDate={today}
                        onDayPress={(day) => {
                            if (day.dateString === today) {
                                setSelectedDate(day.dateString);
                                checkAttendance(day.dateString)
                            }
                        }}
                        theme={{
                            selectedDayBackgroundColor: '#8B5CF6',
                            todayTextColor: '#8B5CF6',
                            arrowColor: '#8B5CF6',
                            dotColor: '#8B5CF6',
                            selectedDotColor: '#ffffff'
                        }}
                    />
                </View>
                {isLoading ? (
                    <ActivityIndicator size="large" color="#8B5CF6" style={{marginTop: 50}}/>
                ) : (
                    <View style={styles.card}>
                        <Text style={styles.cardTitle}>Attendance for {selectedDate}</Text>
                        {attendanceRecord ? (
                             <View style={styles.previewContainer}>
                                <Text style={styles.recordText}>Attendance marked at: {new Date(attendanceRecord.timestamp?.toDate()).toLocaleTimeString()}</Text>
                                <Image source={{ uri: image }} style={styles.imagePreview} />
                                <View style={styles.doneButton}>
                                    <Text style={styles.submitButtonText}>Attendance Marked</Text>
                                </View>
                            </View>
                        ) : (
                            <View style={styles.uploadSection}>
                                {image ? (
                                    <View style={styles.previewContainer}>
                                        <Image source={{ uri: image }} style={styles.imagePreview} />
                                        <View style={styles.retakeButtonContainer}>
                                            <TouchableOpacity style={styles.retakeButton} onPress={() => setImage(null)}>
                                                 <Feather name="x" size={20} color="#EF4444" />
                                                 <Text style={[styles.retakeButtonText, {color: '#EF4444'}]}>Remove</Text>
                                            </TouchableOpacity>
                                            <TouchableOpacity style={styles.retakeButton} onPress={handleTakePhoto}>
                                                 <Feather name="camera" size={20} color="#3B82F6" />
                                                 <Text style={[styles.retakeButtonText, {color: '#3B82F6'}]}>Retake</Text>
                                            </TouchableOpacity>
                                        </View>
                                    </View>
                                ) : (
                                    <TouchableOpacity style={styles.uploadButton} onPress={handleTakePhoto}>
                                        <Feather name="camera" size={30} color="#8B5CF6" />
                                        <Text style={styles.uploadButtonText}>Take a Photo</Text>
                                    </TouchableOpacity>
                                )}

                                <TouchableOpacity
                                    style={[styles.submitButton, (!image || isSubmitting) && styles.submitButtonDisabled]}
                                    onPress={handleSubmitAttendance}
                                    disabled={!image || isSubmitting}
                                >
                                    {isSubmitting ? (
                                        <ActivityIndicator color="white" />
                                    ) : (
                                        <Text style={styles.submitButtonText}>Mark Attendance</Text>
                                    )}
                                </TouchableOpacity>
                            </View>
                        )}
                    </View>
                )}
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
      padding: 20,
  },
  calendarContainer: {
      backgroundColor: 'white',
      borderRadius: 12,
      marginBottom: 20,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.05,
      shadowRadius: 5,
      elevation: 3,
  },
  card: {
      backgroundColor: 'white',
      borderRadius: 12,
      padding: 20,
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
      textAlign: 'center',
  },
  uploadSection: {
      alignItems: 'center',
  },
  uploadButton: {
      width: 150,
      height: 150,
      borderRadius: 75,
      backgroundColor: '#F3F4F6',
      justifyContent: 'center',
      alignItems: 'center',
      borderWidth: 2,
      borderColor: '#E5E7EB',
      borderStyle: 'dashed',
      marginBottom: 20,
  },
  uploadButtonText: {
      marginTop: 10,
      fontSize: 14,
      color: '#6B7280',
      fontWeight: '500',
  },
  previewContainer: {
      alignItems: 'center',
      marginBottom: 20,
  },
  imagePreview: {
      width: '100%',
      height: 250,
      borderRadius: 12,
      marginBottom: 10,
  },
  retakeButtonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
  },
  retakeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
  },
  retakeButtonText: {
      marginLeft: 5,
      fontSize: 16,
      fontWeight: '600'
  },
  submitButton: {
      backgroundColor: '#8B5CF6',
      paddingVertical: 16,
      borderRadius: 12,
      alignItems: 'center',
      width: '100%',
  },
  submitButtonDisabled: {
      backgroundColor: '#C4B5FD',
  },
  doneButton: {
    backgroundColor: '#10B981',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    width: '100%',
},
  submitButtonText: {
      color: 'white',
      fontSize: 16,
      fontWeight: 'bold',
  },
  recordText: {
    fontSize: 14,
    color: '#4B5563',
    marginBottom: 10,
    fontWeight: '500',
  }
});

export default AttendanceScreen;
