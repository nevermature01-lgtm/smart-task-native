import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { db, auth } from '../firebase';
import { collection, query, where, onSnapshot, getDocs, doc, getDoc } from 'firebase/firestore';
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

const ManageTasksScreen = () => {
  const router = useRouter();
  const [completedTasks, setCompletedTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentUserRole, setCurrentUserRole] = useState('member');

  useEffect(() => {
    const fetchCompletedTasks = async () => {
        try {
            const activeAccountString = await AsyncStorage.getItem('activeAccount');
            const currentUser = auth.currentUser;

            if (activeAccountString && currentUser) {
                const activeAccount = JSON.parse(activeAccountString);
                const tasksCollectionRef = collection(db, 'tasks');
                let tasksQuery;

                if (activeAccount.type === 'team') {
                    const teamMembersRef = collection(db, 'team_members');
                    const memberQuery = query(teamMembersRef, where('teamId', '==', activeAccount.id), where('userId', '==', currentUser.uid));
                    const memberSnapshot = await getDocs(memberQuery);
                    let userRole = 'member';
                    if (!memberSnapshot.empty) {
                        userRole = memberSnapshot.docs[0].data().role;
                    }
                    setCurrentUserRole(userRole);

                    if (userRole === 'admin') {
                        tasksQuery = query(tasksCollectionRef, where('teamId', '==', activeAccount.id), where('status', '==', 'completed'));
                    } else {
                        tasksQuery = query(tasksCollectionRef, where('teamId', '==', activeAccount.id), where('assignedToId', '==', currentUser.uid), where('status', '==', 'completed'));
                    }
                } else {
                     setCurrentUserRole('admin');
                    tasksQuery = query(tasksCollectionRef, where('assignedToId', '==', currentUser.uid), where('teamId', '==', null), where('status', '==', 'completed'));
                }

                if (tasksQuery) {
                    const unsubscribe = onSnapshot(tasksQuery, (snapshot) => {
                        const tasksData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                        tasksData.sort((a, b) => b.createdAt.toDate() - a.createdAt.toDate());
                        setCompletedTasks(tasksData);
                        setLoading(false);
                    });
                    return () => unsubscribe();
                }
            }
        } catch (error) {
            console.error("Error fetching completed tasks: ", error);
            setLoading(false);
        }
    };

    fetchCompletedTasks();
  }, []);

  const handleTaskPress = (taskId) => {
    router.push(`/details?taskId=${taskId}`);
  };

  if (loading) {
      return <ActivityIndicator style={{flex: 1}} size="large" color="#2563EB" />;
  }

  if (currentUserRole !== 'admin') {
      return (
          <SafeAreaView style={styles.body}>
            <View style={styles.header}>
                <TouchableOpacity style={styles.headerButton} onPress={() => router.back()}>
                    <Feather name="chevron-left" size={24} color="#1F2937" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Completed Tasks</Text>
                <View style={{width: 36}} />
            </View>
            <View style={styles.lockedContainer}>
                <Feather name="lock" size={64} color="#9CA3AF" />
                <Text style={styles.lockedTitle}>Permission Denied</Text>
                <Text style={styles.lockedSubtitle}>You don't have the required permissions to view completed tasks.</Text>
            </View>
          </SafeAreaView>
      );
  }

  return (
    <SafeAreaView style={styles.body}>
        <View style={styles.header}>
            <TouchableOpacity style={styles.headerButton} onPress={() => router.back()}>
                <Feather name="chevron-left" size={24} color="#1F2937" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Completed Tasks</Text>
            <View style={{width: 36}} />
        </View>
        <FlatList
            data={completedTasks}
            keyExtractor={(item) => item.id}
            showsVerticalScrollIndicator={false}
            style={{ flex: 1, marginTop: 20 }}
            contentContainerStyle={{ flexGrow: 1, paddingBottom: 20 }}
            ListEmptyComponent={() => (
                <View style={styles.emptyContainer}>
                    <Text style={styles.emptyText}>No completed tasks found.</Text>
                </View>
            )}
            renderItem={({ item }) => (
                <TaskCard task={item} onPress={() => handleTaskPress(item.id)} />
            )}
        />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  body: { flex: 1, backgroundColor: '#f9fafb' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
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
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
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
  emptyContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
  },
  emptyText: {
      fontSize: 16,
      color: '#6B7280',
  },
  lockedContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#F9FAFB'
  },
  lockedTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#1F2937',
    marginTop: 16,
    textAlign: 'center'
  },
  lockedSubtitle: {
    fontSize: 16,
    color: '#6B7280',
    marginTop: 8,
    textAlign: 'center',
    lineHeight: 24,
  },
});

export default ManageTasksScreen;