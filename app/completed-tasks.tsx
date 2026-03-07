import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { auth, db } from '../firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, collection, query, where, onSnapshot, getDocs } from 'firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';

const TaskCard = ({ task, onPress }) => {
    const { name, dueDate, createdAt, priority } = task;

    const formatDate = (dueTimestamp, createdTimestamp) => {
        const timestamp = dueTimestamp || createdTimestamp;
        if (!timestamp || !timestamp.toDate) return 'No date specified';

        const date = timestamp.toDate();

        const dateString = date.toLocaleDateString('en-US', {
            month: 'long',
            day: 'numeric',
            year: 'numeric'
        });
        const timeString = date.toLocaleTimeString('en-US', {
            hour: 'numeric',
            minute: '2-digit',
            hour12: true,
        });

        return `${dateString} at ${timeString}`;
    };

    const getPriorityStyles = (p) => {
        switch (p) {
            case 1:
                return { badge: { backgroundColor: '#FEE2E2' }, text: { color: '#EF4444' } };
            case 2:
                return { badge: { backgroundColor: '#FFF7ED' }, text: { color: '#FB923C' } };
            case 3:
                return { badge: { backgroundColor: '#EFF6FF' }, text: { color: '#60A5FA' } };
            case 4:
                return { badge: { backgroundColor: '#D1FAE5' }, text: { color: '#10B981' } };
            default:
                return { badge: { backgroundColor: '#F3F4F6' }, text: { color: '#4B5563' } };
        }
    };

    const priorityStyles = getPriorityStyles(priority);

    return (
        <TouchableOpacity style={styles.taskCard} onPress={onPress}>
            <View style={styles.taskInfoContainer}>
                <Text style={styles.taskName} numberOfLines={1}>{name}</Text>
                <Text style={styles.taskDueDate}>{formatDate(dueDate, createdAt)}</Text>
            </View>
            <View style={[styles.stageBadge, priorityStyles.badge]}>
                <Text style={[styles.stageText, priorityStyles.text]}>
                    {priority ? `P${priority}` : 'N/A'}
                </Text>
            </View>
        </TouchableOpacity>
    );
};


const CompletedTasksScreen = () => {
    const router = useRouter();
    const [completedTasks, setCompletedTasks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [user, setUser] = useState(null);
    const [activeAccount, setActiveAccount] = useState(null);


    useEffect(() => {
        const unsubscribeAuth = onAuthStateChanged(auth, async (currentUser) => {
            if (currentUser) {
                setUser(currentUser);
                const storedActiveAccount = await AsyncStorage.getItem('activeAccount');
                const account = storedActiveAccount ? JSON.parse(storedActiveAccount) : { type: 'personal' };
                setActiveAccount(account);
            } else {
                setUser(null);
                setActiveAccount(null);
                setCompletedTasks([]);
                setLoading(false);
            }
        });

        return () => unsubscribeAuth();
    }, []);

    useEffect(() => {
        if (user && activeAccount) {
            setLoading(true);
            const tasksCollectionRef = collection(db, 'tasks');
            let tasksQuery;

            if (activeAccount.type === 'team') {
                tasksQuery = query(tasksCollectionRef, where('teamId', '==', activeAccount.id), where('status', '==', 'completed'));
            } else {
                tasksQuery = query(tasksCollectionRef, where('assignedToId', '==', user.uid), where('teamId', '==', null), where('status', '==', 'completed'));
            }

            const unsubscribeTasks = onSnapshot(tasksQuery, (snapshot) => {
                const tasksData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                setCompletedTasks(tasksData);
                setLoading(false);
            }, (error) => {
                console.error("Error fetching completed tasks: ", error);
                setLoading(false);
            });

            return () => unsubscribeTasks();
        }
    }, [user, activeAccount]);

    const handleTaskPress = (taskId) => {
        router.push(`/task-details?taskId=${taskId}`);
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <Feather name="chevron-left" size={24} color="#1F2937" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Completed Tasks</Text>
                <View style={{ width: 24 }} />
            </View>
            {loading ? (
                <ActivityIndicator style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }} size="large" color="#0a7ea4" />
            ) : (
                <FlatList
                    data={completedTasks}
                    keyExtractor={(item) => item.id}
                    renderItem={({ item }) => <TaskCard task={item} onPress={() => handleTaskPress(item.id)} />}
                    ListEmptyComponent={
                        <View style={styles.emptyContainer}>
                            <Text style={styles.emptyText}>No completed tasks found.</Text>
                        </View>
                    }
                    contentContainerStyle={styles.listContainer}
                />
            )}
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f9fafb',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 12,
        backgroundColor: 'white',
        borderBottomWidth: 1,
        borderBottomColor: '#E5E7EB',
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#1F2937',
    },
    backButton: {
        padding: 4,
    },
    listContainer: {
        paddingVertical: 16,
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
    taskCard: {
        backgroundColor: '#FFFFFF',
        padding: 16,
        borderRadius: 12,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(0, 0, 0, 0.05)',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 5,
        elevation: 2,
        marginHorizontal: 24,
        marginBottom: 12,
    },
    taskInfoContainer: {
        flexShrink: 1,
        marginRight: 10
    },
    taskName: {
        fontSize: 15,
        fontWeight: '600',
        color: '#1F2937',
        marginBottom: 4,
    },
    taskDueDate: {
        fontSize: 13,
        color: '#6B7280',
    },
    stageBadge: {
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 8,
        justifyContent: 'center',
        alignItems: 'center',
    },
    stageText: {
        fontSize: 12,
        fontWeight: '700',
    },
});

export default CompletedTasksScreen;
