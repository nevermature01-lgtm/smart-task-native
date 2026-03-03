import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { doc, getDoc, updateDoc, onSnapshot, collection, query, where, getDocs } from 'firebase/firestore';
import { db, auth } from '../firebase';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, { useSharedValue, useAnimatedStyle, withSpring, runOnJS } from 'react-native-reanimated';
import AsyncStorage from '@react-native-async-storage/async-storage';

const DetailsScreen = () => {
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const { taskId } = useLocalSearchParams();
    const [task, setTask] = useState(null);
    const [taskSteps, setTaskSteps] = useState([]);
    const [checklist, setChecklist] = useState([]);
    const [currentUserRole, setCurrentUserRole] = useState('member');

    useEffect(() => {
        const fetchUserRole = async () => {
            try {
                const activeAccountString = await AsyncStorage.getItem('activeAccount');
                const currentUser = auth.currentUser;

                if (activeAccountString && currentUser) {
                    const activeAccount = JSON.parse(activeAccountString);
                    if (activeAccount.type === 'team') {
                        const teamMembersRef = collection(db, 'team_members');
                        const q = query(teamMembersRef, where("teamId", "==", activeAccount.id), where("userId", "==", currentUser.uid));
                        const querySnapshot = await getDocs(q);

                        if (!querySnapshot.empty) {
                            const teamMemberDoc = querySnapshot.docs[0];
                            setCurrentUserRole(teamMemberDoc.data().role);
                        } else {
                            setCurrentUserRole('member');
                        }
                    } else {
                        // For personal accounts, user is the admin of their own tasks
                        setCurrentUserRole('admin');
                    }
                }
            } catch (error) {
                console.error("Error fetching user role: ", error);
                setCurrentUserRole('member'); // Default to member on error
            }
        };

        fetchUserRole();
    }, []);

    useEffect(() => {
        if (!taskId) return;

        const taskRef = doc(db, 'tasks', taskId);
        const unsubscribe = onSnapshot(taskRef, (docSnap) => {
            if (docSnap.exists()) {
                const taskData = docSnap.data();
                setTask({ id: docSnap.id, ...taskData });
                if (taskData.steps) {
                    setTaskSteps(taskData.steps);
                }
                if (taskData.checklist) {
                    setChecklist(taskData.checklist.map(item => ({ ...item, completed: item.completed || false })));
                }
            } else {
                console.log("No such document!");
            }
        });

        return () => unsubscribe();
    }, [taskId]);

    const toggleChecklistItemCompletion = async (index) => {
        const newChecklist = [...checklist];
        newChecklist[index].completed = !newChecklist[index].completed;
        setChecklist(newChecklist);

        const taskRef = doc(db, 'tasks', taskId);
        await updateDoc(taskRef, {
            checklist: newChecklist
        });
    };
    
    const handleReassign = () => {
        router.push({
            pathname: '/assign-task',
            params: { taskId: task.id }
        });
    };

    const SWIPE_THRESHOLD = 150;
    const translateX = useSharedValue(0);
    const offsetX = useSharedValue(0);

    const onComplete = () => {
        console.log('Task completed');
        // You can add your logic here to update the task status in Firebase
    };

    const gesture = Gesture.Pan()
        .onBegin(() => {
            offsetX.value = translateX.value;
        })
        .onUpdate((event) => {
            translateX.value = Math.max(0, Math.min(offsetX.value + event.translationX, 240));
        })
        .onEnd(() => {
            if (translateX.value > SWIPE_THRESHOLD) {
                translateX.value = withSpring(240, {}, (finished) => {
                    if (finished) {
                        runOnJS(onComplete)();
                        translateX.value = withSpring(0);
                    }
                });
            } else {
                translateX.value = withSpring(0);
            }
        });

    const animatedStyle = useAnimatedStyle(() => {
        return {
            transform: [{ translateX: translateX.value }],
        };
    });

    if (!task) {
        return null;
    }

    const taskCreationDate = task.createdAt?.toDate();
    let formattedTaskDateTime = '';

    if (taskCreationDate) {
        const day = taskCreationDate.getDate();
        const month = taskCreationDate.toLocaleString('default', { month: 'short' });
        const year = taskCreationDate.getFullYear();
        const time = taskCreationDate.toLocaleTimeString('en-US', {
            hour: 'numeric',
            minute: '2-digit',
            hour12: true,
        });

        formattedTaskDateTime = `${day}-${month}-${year}, ${time}`;
    }

    return (
        <View style={{ flex: 1, backgroundColor: '#fff' }}>
            <View style={[styles.header, { paddingTop: insets.top }]}>
                <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
                    <MaterialIcons name="arrow-back" size={24} color="#1F2937" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Details</Text>
            </View>

            <ScrollView style={styles.container}>
                <View style={styles.taskInfoContainer}>
                    <View style={styles.taskTitleContainer}>
                        <Text style={styles.taskTitle}>• {task.name}</Text>
                        <View style={styles.priorityContainer}>
                            {currentUserRole === 'admin' && (
                                <TouchableOpacity style={[styles.actionButton, styles.deleteButton]}>
                                    <MaterialIcons name="delete" size={24} color="#fff" />
                                </TouchableOpacity>
                            )}
                            <Text style={styles.priorityText}>P{task.priority}</Text>
                        </View>
                    </View>

                    <View style={{flexDirection: 'row', alignItems: 'center', marginBottom: 4}}>
                        <MaterialIcons name="subdirectory-arrow-right" size={16} color="#6B7280" style={{marginRight: 4}}/>
                        <Text style={[styles.taskSubtitle, {marginBottom: 0}]}>{task.description}</Text>
                    </View>

                    <View style={{flexDirection: 'row', alignItems: 'center'}}>
                        <MaterialIcons name="calendar-today" size={14} color="#6B7280" style={{marginRight: 4}}/>
                        <Text style={styles.taskDate}>{formattedTaskDateTime}</Text>
                    </View>
                </View>

                <View style={styles.assignedToContainer}>
                    <View style={styles.assignedToHeader}>
                        <Text style={styles.assignedToTitle}>Assigned to:</Text>
                        {currentUserRole === 'admin' && (
                            <TouchableOpacity style={styles.reassignButton} onPress={handleReassign}>
                                <Text style={styles.reassignButtonText}>Reassign</Text>
                            </TouchableOpacity>
                        )}
                    </View>
                    <View style={styles.assigneeContainer}>
                        <View style={styles.assignee}>
                            <Text style={styles.assigneeName}>{task.assignedByName}</Text>
                        </View>
                        <MaterialIcons name="arrow-downward" size={24} color="#6B7280" style={styles.downArrow} />
                        {task.assignmentChain && task.assignmentChain.map((assignment, index) => (
                            <React.Fragment key={index}>
                                <View style={styles.assignee}>
                                    <Text style={styles.assigneeName}>{assignment.name}</Text>
                                </View>
                                <MaterialIcons name="arrow-downward" size={24} color="#6B7280" style={styles.downArrow} />
                            </React.Fragment>
                        ))}
                        <View style={styles.assignee}>
                            <Text style={styles.assigneeName}>{task.assignedToName}</Text>
                        </View>
                    </View>
                </View>

                 {taskSteps.length > 0 && (
                    <View style={styles.stepsContainer}>
                        <Text style={styles.stepsTitle}>Steps</Text>
                        <ScrollView horizontal={true} showsHorizontalScrollIndicator={false}>
                            <View style={{flexDirection: 'row', alignItems: 'center'}}>
                                {taskSteps.map((step, index) => (
                                    <React.Fragment key={index}>
                                        <View style={styles.stepItem}>
                                            <Text style={styles.stepText}>{step.text}</Text>
                                        </View>
                                        {index < taskSteps.length - 1 && (
                                            <MaterialIcons name="arrow-forward" size={20} color="#6B7280" style={styles.arrow} />
                                        )}
                                    </React.Fragment>
                                ))}
                            </View>
                        </ScrollView>
                    </View>
                )}

                {checklist.length > 0 && (
                    <View style={styles.checklistContainer}>
                        <Text style={styles.checklistTitle}>Checklist</Text>
                        {checklist.map((item, index) => (
                            <TouchableOpacity
                                key={index}
                                style={styles.checklistItem}
                                onPress={() => toggleChecklistItemCompletion(index)}
                            >
                                <Text style={[styles.checklistText, item.completed && styles.checklistTextCompleted]}>
                                    {item.text}
                                </Text>
                                <View style={[styles.checkbox, item.completed && styles.checkboxCompleted]}>
                                    {item.completed && (
                                        <MaterialIcons name="check" size={18} color="white" />
                                    )}
                                </View>
                            </TouchableOpacity>
                        ))}
                    </View>
                )}

                <View style={styles.swipeToCompleteButton}>
                    <GestureDetector gesture={gesture}>
                        <Animated.View style={[styles.swipeableCircle, animatedStyle]}>
                            <MaterialIcons name="chevron-right" size={40} color="white" />
                        </Animated.View>
                    </GestureDetector>
                    <Text style={styles.swipeToCompleteText}>Swipe to Complete</Text>
                </View>
            </ScrollView>

            <View style={[styles.footer, { paddingBottom: insets.bottom }]}>
                <TextInput style={styles.messageInput} placeholder="Message" />
                <TouchableOpacity>
                    <MaterialIcons name="send" size={24} color="#000" />
                </TouchableOpacity>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 16,
        paddingBottom: 12,
        backgroundColor: 'white',
        borderBottomWidth: 1,
        borderBottomColor: '#E5E7EB',
        position: 'relative',
        marginTop: 20
    },
    backButton: {
        position: 'absolute',
        left: 16,
        padding: 4,
        zIndex: 1
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#1F2937'
    },
    container: {
        flex: 1,
        padding: 16,
    },
    taskInfoContainer: {
        marginBottom: 16,
    },
    taskTitleContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 4,
    },
    taskTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        flex: 1,
        marginRight: 16,
    },
    priorityContainer: {
        alignItems: 'center',
    },
    priorityText: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#EF4444',
        marginTop: 4,
    },
    taskSubtitle: {
        fontSize: 16,
        color: '#6B7280',
        marginBottom: 4,
    },
    taskDate: {
        fontSize: 14,
        color: '#6B7280',
    },
    actionButton: {
        padding: 8,
    },
    deleteButton: {
        backgroundColor: 'red',
        borderRadius: 5,
    },
    assignedToContainer: {
        marginBottom: 16,
    },
    assignedToHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    assignedToTitle: {
        fontSize: 16,
        fontWeight: 'bold',
    },
    reassignButton: {
        backgroundColor: '#E5E7EB',
        paddingVertical: 6,
        paddingHorizontal: 12,
        borderRadius: 5,
    },
    reassignButtonText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#1F2937',
    },
    assigneeContainer: {
        alignItems: 'flex-start',
    },
    assignee: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 4,
        width: '100%',
    },
    assigneeName: {
        fontSize: 16,
        marginLeft: 16,
    },
    downArrow: {
        marginVertical: 8,
        marginLeft: 16,
    },
    stepsContainer: {
        marginBottom: 16,
    },
    stepsTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        marginBottom: 8,
    },
    stepItem: {
        padding: 12,
        backgroundColor: '#f3f4f6',
        borderRadius: 8,
    },
    stepText: {
        fontSize: 16,
        color: '#374151',
    },
    arrow: {
        marginHorizontal: 8,
    },
    checklistContainer: {
        marginBottom: 16,
    },
    checklistTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        marginBottom: 8,
    },
    checklistItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 12,
        marginLeft: 16,
    },
    checklistText: {
        fontSize: 16,
        color: '#374151',
        flex: 1,
    },
    checklistTextCompleted: {
        textDecorationLine: 'line-through',
        color: '#9CA3AF',
    },
    checkbox: {
        width: 24,
        height: 24,
        borderRadius: 6,
        borderWidth: 2,
        borderColor: '#D1D5DB',
        justifyContent: 'center',
        alignItems: 'center',
        marginLeft: 16,
    },
    checkboxCompleted: {
        backgroundColor: '#2563EB',
        borderColor: '#2563EB',
    },
    swipeToCompleteButton: {
        backgroundColor: '#E5E7EB',
        height: 60,
        borderRadius: 30,
        justifyContent: 'center',
        alignItems: 'flex-start',
        marginBottom: 16,
        position: 'relative',
        paddingHorizontal: 5,
    },
    swipeableCircle: {
        width: 50,
        height: 50,
        borderRadius: 25,
        backgroundColor: '#2563EB',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 2,
    },
    swipeToCompleteText: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#374151',
        position: 'absolute',
        alignSelf: 'center',
        zIndex: 1,
    },
    footer: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        borderTopWidth: 1,
        borderTopColor: '#E5E7EB',
    },
    messageInput: {
        flex: 1,
        borderWidth: 1,
        borderColor: '#E5E7EB',
        borderRadius: 5,
        padding: 8,
        marginRight: 8,
    },
});

export default DetailsScreen;
