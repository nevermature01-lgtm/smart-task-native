import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, TouchableOpacity } from 'react-native';
import { collection, query, where, getDocs, orderBy, doc, getDoc } from 'firebase/firestore';
import { db, auth } from '../firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';

const TaskCard = ({ name, dueDate, priority, stage, onPress, createdAt }) => {
    const formatDate = (dueDate, createdAt) => {
        const date = dueDate ? dueDate.toDate() : (createdAt ? createdAt.toDate() : null);
        if (!date) return 'No date';
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    };

    const getPriorityStyles = (p) => {
        switch (p) {
            case 1: return { badge: { backgroundColor: 'rgba(239, 68, 68, 0.1)' }, text: { color: '#ef4444' } };
            case 2: return { badge: { backgroundColor: 'rgba(251, 146, 60, 0.1)' }, text: { color: '#f97316' } };
            case 3: return { badge: { backgroundColor: 'rgba(96, 165, 250, 0.1)' }, text: { color: '#3b82f6' } };
            case 4: return { badge: { backgroundColor: 'rgba(16, 185, 129, 0.1)' }, text: { color: '#10b981' } };
            default: return { badge: { backgroundColor: '#F3F4F6' }, text: { color: '#4B5563' } };
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
    const insets = useSafeAreaInsets();

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            setUser(user);
            if (user) {
                const account = await AsyncStorage.getItem('activeAccount');
                setActiveAccount(JSON.parse(account));
            }
        });
        return () => unsubscribe();
    }, []);

    useEffect(() => {
        if (user && activeAccount) {
            fetchCompletedTasks();
        }
    }, [user, activeAccount]);

    const fetchCompletedTasks = async () => {
        setLoading(true);
        try {
            let tasksQuery;
            if (activeAccount.type === 'personal') {
                tasksQuery = query(
                    collection(db, 'tasks'), 
                    where('userId', '==', user.uid), 
                    where('status', '==', 'completed')
                );
            } else if (activeAccount.type === 'team') {
                tasksQuery = query(
                    collection(db, 'tasks'), 
                    where('teamId', '==', activeAccount.id),
                    where('status', '==', 'completed')
                );
            }

            if (tasksQuery) {
                const querySnapshot = await getDocs(tasksQuery);
                const tasks = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                tasks.sort((a, b) => {
                    const timeA = a.completedAt ? a.completedAt.toMillis() : 0;
                    const timeB = b.completedAt ? b.completedAt.toMillis() : 0;
                    return timeB - timeA;
                });
                setCompletedTasks(tasks);
            }
        } catch (error) {
            console.error("Error fetching completed tasks: ", error);
        } finally {
            setLoading(false);
        }
    };

    const handleTaskPress = (taskId) => {
        router.push({ pathname: '/new-task-details', params: { taskId } });
    };

    return (
        <View style={[styles.container, { paddingTop: insets.top }]}>
             <View style={styles.header}>
                <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
                    <MaterialIcons name="arrow-back" size={24} color="#1F2937" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Completed Tasks</Text>
                <View style={styles.headerRight} />
            </View>

            {loading ? (
                <ActivityIndicator style={{ marginTop: 20 }} size="large" color="#2563EB" />
            ) : completedTasks.length === 0 ? (
                <View style={styles.emptyContainer}>
                    <Text style={styles.emptyText}>No completed tasks yet.</Text>
                </View>
            ) : (
                <FlatList
                    data={completedTasks}
                    keyExtractor={(item) => item.id}
                    renderItem={({ item }) => (
                        <TaskCard
                            name={item.name}
                            dueDate={item.dueDate}
                            priority={item.priority}
                            stage={item.stage}
                            createdAt={item.createdAt}
                            onPress={() => handleTaskPress(item.id)}
                        />
                    )}
                    contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 16 }}
                />
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f8f9fa',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingBottom: 12,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#E5E7EB',
    },
    backButton: {
        padding: 8,
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#1F2937',
    },
    headerRight: {
        width: 32, // to balance the header
    },
    taskCard: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: '#E5E7EB',
    },
    taskInfoContainer: {
        flex: 1,
        marginRight: 10,
    },
    taskName: {
        fontSize: 16,
        fontWeight: '600',
        color: '#1F2937',
        marginBottom: 4
    },
    taskDueDate: {
        fontSize: 12,
        color: '#6B7280',
    },
    stageBadge: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 999,
    },
    stageText: {
        fontSize: 12,
        fontWeight: 'bold',
        textTransform: 'uppercase',
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    emptyText: {
        fontSize: 16,
        color: '#6B7280',
    },
});

export default CompletedTasksScreen;
