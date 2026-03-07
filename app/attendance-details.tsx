import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, TouchableOpacity, Image } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Calendar } from 'react-native-calendars';
import { db, auth } from '../firebase';
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import ImageViewing from 'react-native-image-viewing';

const AttendanceDetailsScreen = () => {
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const [user, setUser] = useState(null);
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
    const [markedDates, setMarkedDates] = useState({});
    const [attendanceData, setAttendanceData] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isImageViewerVisible, setImageViewerVisible] = useState(false);
    const [currentImageIndex, setCurrentImageIndex] = useState(0);


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
            fetchAttendanceData(selectedDate);
            const newMarkedDates = {
                [selectedDate]: { selected: true, selectedColor: '#8B5CF6' },
            };
            setMarkedDates(newMarkedDates);
        }
    }, [user, selectedDate]);

    const fetchAttendanceData = async (date) => {
        setIsLoading(true);
        setAttendanceData([]);
        try {
            const attendanceQuery = query(
                collection(db, 'attendance'),
                where('date', '==', date)
            );
            const querySnapshot = await getDocs(attendanceQuery);
            const attendanceRecords = [];
            querySnapshot.forEach(doc => {
                attendanceRecords.push({ id: doc.id, ...doc.data() });
            });

            if (attendanceRecords.length === 0) {
                setIsLoading(false);
                return;
            }

            const userPromises = attendanceRecords.map(record => getDoc(doc(db, 'users', record.userId)));
            const userDocs = await Promise.all(userPromises);

            const populatedData = attendanceRecords.map((record, index) => {
                const userDoc = userDocs[index];
                const userData = userDoc.exists() ? userDoc.data() : {};
                return {
                    ...record,
                    userName: userData.firstName || userData.name || 'Unknown User',
                    userPhoto: userData.photoURL || null,
                };
            });

            setAttendanceData(populatedData);

        } catch (error) {
            console.error("Error fetching attendance data: ", error);
        } finally {
            setIsLoading(false);
        }
    };

    const onDayPress = (day) => {
        setSelectedDate(day.dateString);
    };
    
    const openImageViewer = (index) => {
        setCurrentImageIndex(index);
        setImageViewerVisible(true);
    };

    const renderAttendanceItem = ({ item, index }) => (
        <View style={styles.itemContainer}>
            {item.userPhoto ? (
                <Image source={{ uri: item.userPhoto }} style={styles.avatar} />
            ) : (
                <View style={styles.avatar}>
                    <Text style={styles.avatarInitial}>{item.userName ? item.userName[0].toUpperCase() : 'U'}</Text>
                </View>
            )}
            <View style={{flex: 1}}>
                <Text style={styles.itemName}>{item.userName}</Text>
                <Text style={styles.itemTime}>
                    {item.timestamp ? new Date(item.timestamp.toDate()).toLocaleTimeString() : ''}
                </Text>
            </View>
            <TouchableOpacity onPress={() => openImageViewer(index)}>
                <Image source={{uri: item.photoURL}} style={styles.attendanceImage} />
            </TouchableOpacity>
        </View>
    );

    const images = attendanceData.map(item => ({ uri: item.photoURL }));

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
             <View style={[styles.header, { paddingTop: insets.top }]}>
                <TouchableOpacity style={styles.headerButton} onPress={() => router.back()}>
                    <Feather name="chevron-left" size={24} color="#1F2937" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Attendance Details</Text>
                <View style={{width: 36}} />
            </View>
            <Calendar
                onDayPress={onDayPress}
                markedDates={markedDates}
                theme={{
                    selectedDayBackgroundColor: '#8B5CF6',
                    todayTextColor: '#8B5CF6',
                    arrowColor: '#8B5CF6',
                }}
                style={styles.calendar}
            />
            <View style={styles.listContainer}>
                {isLoading ? (
                    <ActivityIndicator size="large" color="#8B5CF6" style={{marginTop: 20}}/>
                ) : (
                    <FlatList
                        data={attendanceData}
                        renderItem={renderAttendanceItem}
                        keyExtractor={(item) => item.id}
                        ListHeaderComponent={
                            !!attendanceData.length && (
                                <View style={styles.listHeader}>
                                    <Text style={styles.listHeaderText}>
                                        {attendanceData.length} {attendanceData.length === 1 ? 'member' : 'members'} attended
                                    </Text>
                                </View>
                            )
                        }
                        ListEmptyComponent={<View style={styles.emptyContainer}><Text style={styles.emptyText}>No attendance records for this date.</Text></View>}
                        contentContainerStyle={{padding: 20}}
                    />
                )}
            </View>
            <ImageViewing
                images={images}
                imageIndex={currentImageIndex}
                visible={isImageViewerVisible}
                onRequestClose={() => setImageViewerVisible(false)}
                FooterComponent={({ imageIndex }) => (
                    <View style={styles.footer}>
                        <Text style={styles.footerText}>{attendanceData[imageIndex]?.userName}</Text>
                        <Text style={styles.footerSubText}>{selectedDate}</Text>
                    </View>
                )}
            />
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F3F4F6',
    },
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
    calendar: {
        borderBottomWidth: 1,
        borderBottomColor: '#E5E7EB',
    },
    listContainer: {
        flex: 1,
    },
    listHeader: {
        paddingBottom: 10,
        marginBottom: 10,
        borderBottomWidth: 1,
        borderBottomColor: '#E5E7EB',
    },
    listHeaderText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#4B5563',
    },
    itemContainer: {
        backgroundColor: 'white',
        padding: 15,
        borderRadius: 12,
        marginBottom: 12,
        flexDirection: 'row',
        alignItems: 'center',
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 2,
    },
    avatar: {
        width: 40,
        height: 40,
        borderRadius: 20,
        marginRight: 15,
        backgroundColor: '#E5E7EB',
        justifyContent: 'center',
        alignItems: 'center',
    },
    avatarInitial: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#4B5563',
    },
    itemName: {
        fontSize: 16,
        fontWeight: '600',
        color: '#1F2937',
    },
    itemTime: {
        fontSize: 13,
        color: '#6B7280',
        marginTop: 2,
    },
    attendanceImage: {
        width: 50,
        height: 50,
        borderRadius: 8,
        marginLeft: 15,
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 50,
    },
    emptyText: {
        fontSize: 16,
        color: '#6B7280',
    },
    footer: {
        width: '100%',
        backgroundColor: 'rgba(0,0,0,0.5)',
        padding: 20,
        alignItems: 'center',
    },
    footerText: {
        color: 'white',
        fontSize: 16,
        fontWeight: 'bold',
    },
    footerSubText: {
        color: 'white',
        fontSize: 14,
        marginTop: 5,
    },
});

export default AttendanceDetailsScreen;
