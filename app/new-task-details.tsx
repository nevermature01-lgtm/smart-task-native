import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput, Image, ActivityIndicator, Dimensions, KeyboardAvoidingView, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { doc, getDoc, updateDoc, collection, addDoc, serverTimestamp, query, orderBy, onSnapshot } from 'firebase/firestore';
import { db, auth } from '../firebase';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, { useSharedValue, useAnimatedStyle, withSpring, runOnJS } from 'react-native-reanimated';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const SWIPE_THRESHOLD = SCREEN_WIDTH * 0.7;

const NewTaskDetailsScreen = () => {
    const insets = useSafeAreaInsets();
    const router = useRouter();
    const { taskId } = useLocalSearchParams();
    const [task, setTask] = useState(null);
    const [loading, setLoading] = useState(true);
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');

    const translateX = useSharedValue(0);

    useEffect(() => {
        let unsubscribe = () => {};
        const fetchTask = async () => {
            if (taskId) {
                const docRef = doc(db, 'tasks', taskId);
                const docSnap = await getDoc(docRef);
                if (docSnap.exists()) {
                    setTask({ id: docSnap.id, ...docSnap.data() });
                } else {
                    console.log("No such document!");
                }

                const messagesRef = collection(db, 'tasks', taskId, 'messages');
                const q = query(messagesRef, orderBy('createdAt', 'asc'));
                unsubscribe = onSnapshot(q, (snapshot) => {
                    const msgs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                    setMessages(msgs);
                });

            }
            setLoading(false);
        };

        fetchTask();
        return () => unsubscribe();
    }, [taskId]);

    const handleCompleteTask = async () => {
        try {
            const taskRef = doc(db, 'tasks', taskId);
            await updateDoc(taskRef, {
                status: 'completed',
                completedAt: serverTimestamp()
            });
            router.back();
        } catch (error) {
            console.error("Error completing task: ", error);
        }
    };

    const pan = Gesture.Pan()
        .onUpdate((event) => {
            translateX.value = event.translationX;
        })
        .onEnd(() => {
            if (translateX.value > SWIPE_THRESHOLD) {
                runOnJS(handleCompleteTask)();
            } else {
                translateX.value = withSpring(0);
            }
        });

    const animatedStyle = useAnimatedStyle(() => ({
        transform: [{ translateX: translateX.value }],
    }));


    const handleToggleStep = async (stepIndex) => {
        const newSteps = [...task.steps];
        newSteps[stepIndex].completed = !newSteps[stepIndex].completed;

        const taskRef = doc(db, 'tasks', taskId);
        await updateDoc(taskRef, { steps: newSteps });
        
        setTask(prevTask => ({ ...prevTask, steps: newSteps }));
    };

    const handleSendMessage = async () => {
        if (newMessage.trim() === '' || !auth.currentUser) return;

        const { uid, displayName, photoURL } = auth.currentUser;
        const messagesRef = collection(db, 'tasks', taskId, 'messages');
        
        await addDoc(messagesRef, {
            text: newMessage,
            createdAt: serverTimestamp(),
            userId: uid,
            userName: displayName || 'User',
            userPhotoURL: photoURL || 'https://via.placeholder.com/40'
        });

        setNewMessage('');
    };

    const handleReassignPress = () => {
        router.push({ pathname: '/assign-task', params: { taskId: task.id } });
    };

    if (loading) {
        return <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}><ActivityIndicator size="large" color="#2563EB" /></View>;
    }

    if (!task) {
        return <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}><Text>Task not found.</Text></View>;
    }

    const getPriorityStyles = (p) => {
        switch (p) {
            case 1: return { badge: { backgroundColor: 'rgba(239, 68, 68, 0.1)' }, text: { color: '#ef4444' }, icon: 'priority-high' };
            case 2: return { badge: { backgroundColor: 'rgba(251, 146, 60, 0.1)' }, text: { color: '#f97316' }, icon: 'arrow-upward' };
            case 3: return { badge: { backgroundColor: 'rgba(96, 165, 250, 0.1)' }, text: { color: '#3b82f6' }, icon: 'arrow-downward' };
            case 4: return { badge: { backgroundColor: 'rgba(16, 185, 129, 0.1)' }, text: { color: '#10b981' }, icon: 'low-priority' };
            default: return { badge: { backgroundColor: '#F3F4F6' }, text: { color: '#4B5563' }, icon: 'remove' };
        }
    };
    
    const priorityDetails = getPriorityStyles(task.priority);

    const formatDate = (timestamp) => {
        if (!timestamp || !timestamp.toDate) return 'N/A';
        const date = timestamp.toDate();
        return date.toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true });
    }

    const currentStepIndex = task.steps ? task.steps.findIndex(step => !step.completed) : -1;

    return (
        <KeyboardAvoidingView
            style={{ flex: 1, backgroundColor: '#f9fafb' }}
            behavior={Platform.OS === "ios" ? "padding" : "height"}
        >
            <View style={[styles.header, { paddingTop: insets.top }]}>
                <TouchableOpacity style={styles.headerButton} onPress={() => router.back()}>
                    <MaterialIcons name="arrow-back" size={24} color="#1F2937" />
                </TouchableOpacity>
                <Text style={styles.headerTitle} numberOfLines={1}>{task.name}</Text>
                <TouchableOpacity style={styles.headerButton}>
                    <MaterialIcons name="delete" size={24} color="#1F2937" />
                </TouchableOpacity>
            </View>

            <ScrollView
                style={{ flex: 1 }}
                contentContainerStyle={styles.scrollContainer}
                keyboardShouldPersistTaps="handled"
            >
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Description</Text>
                    <Text style={styles.descriptionText}>{task.description}</Text>
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Steps Flow</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                        {task.steps && task.steps.map((step, index) => {
                            const isActive = index === currentStepIndex;
                            const isCompleted = currentStepIndex === -1 || index < currentStepIndex;
                            const iconName = isActive ? 'architecture' : isCompleted ? 'check-circle' : 'arrow-forward';
                            
                            return (
                                <View key={index} style={[styles.step, isActive && styles.activeStep]}>
                                    <MaterialIcons name={iconName} size={20} color={isActive ? "white" : (isCompleted ? '#10B981' : '#6B7280')} />
                                    <Text style={isActive ? styles.activeStepText : styles.stepText}>{step.text}</Text>
                                </View>
                            );
                        })}
                    </ScrollView>
                </View>

                <View style={styles.section}>
                    <View style={styles.assignmentContainer}>
                        <View style={{flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start'}}>
                            <View>
                                <View style={styles.assignee}>
                                    <Image source={{ uri: task.assignedByPhotoURL || 'https://via.placeholder.com/40' }} style={styles.avatar} />
                                    <View>
                                        <Text style={styles.assigneeLabel}>Assigned By</Text>
                                        <Text style={styles.assigneeName}>{task.assignedByName}</Text>
                                    </View>
                                </View>
                                <View style={{alignItems: 'center', paddingVertical: 8}}>
                                   <MaterialIcons name="arrow-downward" size={24} color="#6B7280" />
                                </View>
                                <View style={styles.assignee}>
                                    <Image source={{ uri: task.assignedToPhotoURL || 'https://via.placeholder.com/40' }} style={styles.avatar} />
                                    <View>
                                        <Text style={styles.assigneeLabel}>Assigned To</Text>
                                        <Text style={styles.assigneeName}>{task.assignedToName}</Text>
                                    </View>
                                </View>
                            </View>

                            <TouchableOpacity style={styles.reassignButton} onPress={handleReassignPress}>
                                <MaterialIcons name="cached" size={16} color="#2563EB" />
                                <Text style={styles.reassignButtonText}>Reassign</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>

                <View style={styles.grid}>
                    <View style={styles.gridItem}>
                        <Text style={styles.gridLabel}>Priority</Text>
                        <View style={[styles.priorityBadge, priorityDetails.badge]}>
                            <MaterialIcons name={priorityDetails.icon} size={16} color={priorityDetails.text.color} />
                            <Text style={[styles.priorityText, priorityDetails.text]}>P{task.priority}</Text>
                        </View>
                    </View>
                    <View style={styles.gridItem}>
                        <Text style={styles.gridLabel}>Created At</Text>
                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                            <MaterialIcons name="calendar-today" size={16} color="#1F2937" />
                            <Text style={styles.deadlineText}>{formatDate(task.createdAt)}</Text>
                        </View>
                    </View>
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Task Checklist</Text>
                    {task.steps && task.steps.map((step, index) => (
                        <TouchableOpacity key={index} onPress={() => handleToggleStep(index)} style={styles.checklistItem}>
                            <View style={[styles.checkbox, step.completed && styles.checkboxCompleted]}>
                                {step.completed && <MaterialIcons name="check" size={16} color="white" />}
                            </View>
                            <Text style={[styles.checklistText, step.completed && styles.completedChecklistText]}>{step.text}</Text>
                        </TouchableOpacity>
                    ))}
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Messages</Text>
                    {messages.map((msg) => (
                        <View key={msg.id} style={styles.messageContainer}>
                            <Image source={{ uri: msg.userPhotoURL }} style={styles.avatar} />
                            <View style={styles.messageBubble}>
                                <Text style={styles.messageUser}>{msg.userName}</Text>
                                <Text style={styles.messageText}>{msg.text}</Text>
                                <Text style={styles.messageTimestamp}>{formatDate(msg.createdAt)}</Text>
                            </View>
                        </View>
                    ))}
                </View>
                 <View style={styles.swipeSection}>
                     <View style={styles.swipeContainer}>
                        <GestureDetector gesture={pan}>
                            <Animated.View style={[styles.swipeButton, animatedStyle]}>
                                <MaterialIcons name="double-arrow" size={24} color="white" />
                            </Animated.View>
                        </GestureDetector>
                        <Text style={styles.swipeText}>Swipe to complete</Text>
                    </View>
                </View>
            </ScrollView>

            <View style={[styles.bottomBar, { paddingBottom: insets.bottom }]}>
                <View style={styles.messageBar}>
                    <TouchableOpacity>
                        <MaterialIcons name="attach-file" size={24} color="#6B7280" />
                    </TouchableOpacity>
                    <TextInput style={styles.messageInput} placeholder="Add a comment..." value={newMessage} onChangeText={setNewMessage} />
                    <TouchableOpacity onPress={handleSendMessage}>
                        <MaterialIcons name="send" size={24} color="#2563EB" />
                    </TouchableOpacity>
                </View>
            </View>
        </KeyboardAvoidingView>
    );
};

const styles = StyleSheet.create({
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingBottom: 12,
        backgroundColor: 'rgba(249, 250, 251, 0.8)',
        borderBottomWidth: 1,
        borderBottomColor: '#E5E7EB',
    },
    headerButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#1F2937',
        flex: 1,
        textAlign: 'center',
        marginHorizontal: 8
    },
    scrollContainer: {
        flexGrow: 1,
    },
    section: {
        paddingHorizontal: 16,
        paddingTop: 24,
    },
    sectionTitle: {
        fontSize: 12,
        fontWeight: 'bold',
        color: '#6B7280',
        textTransform: 'uppercase',
        marginBottom: 12,
    },
    descriptionText: {
        fontSize: 16,
        color: '#374151',
        lineHeight: 24,
    },
    step: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 12,
        borderRadius: 999,
        backgroundColor: 'white',
        borderWidth: 1,
        borderColor: '#E5E7EB',
        marginRight: 8,
    },
    activeStep: {
        backgroundColor: '#2563EB',
        borderColor: '#2563EB',
    },
    stepText: {
        marginLeft: 8,
        fontSize: 14,
        fontWeight: '500',
        color: '#374151',
    },
    activeStepText: {
        marginLeft: 8,
        fontSize: 14,
        fontWeight: '600',
        color: 'white',
    },
    assignmentContainer: {
        backgroundColor: 'white',
        borderRadius: 12,
        padding: 20,
        borderWidth: 1,
        borderColor: '#F3F4F6',
    },
    assignmentRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    assignee: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    avatar: {
        width: 40,
        height: 40,
        borderRadius: 20,
        marginRight: 12,
    },
    assigneeLabel: {
        fontSize: 10,
        fontWeight: 'bold',
        color: '#6B7280',
        textTransform: 'uppercase',
    },
    assigneeName: {
        fontSize: 14,
        fontWeight: '600',
        color: '#1F2937',
    },
    reassignButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(37, 99, 235, 0.1)',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderRadius: 999,
    },
    reassignButtonText: {
        marginLeft: 8,
        fontSize: 12,
        fontWeight: 'bold',
        color: '#2563EB',
    },
    grid: {
        flexDirection: 'row',
        paddingHorizontal: 16,
        paddingTop: 32,
        gap: 16,
    },
    gridItem: {
        flex: 1,
        backgroundColor: 'white',
        borderRadius: 12,
        padding: 16,
        borderWidth: 1,
        borderColor: '#F3F4F6',
    },
    gridLabel: {
        fontSize: 10,
        fontWeight: 'bold',
        color: '#6B7280',
        textTransform: 'uppercase',
        marginBottom: 8,
    },
    priorityBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 999,
        alignSelf: 'flex-start',
    },
    priorityText: {
        marginLeft: 8,
        fontSize: 12,
        fontWeight: 'bold',
        textTransform: 'uppercase',
    },
    deadlineText: {
        marginLeft: 8,
        fontSize: 12,
        fontWeight: 'bold',
        color: '#1F2937',
    },
    checklistItem: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'white',
        borderRadius: 12,
        padding: 12,
        borderWidth: 1,
        borderColor: '#F3F4F6',
        marginBottom: 8,
    },
    checkbox: {
        width: 24,
        height: 24,
        borderRadius: 12,
        borderWidth: 2,
        borderColor: '#D1D5DB',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
    },
    checkboxCompleted: {
        backgroundColor: '#2563EB',
        borderColor: '#2563EB',
    },
    checklistText: {
        fontSize: 14,
        color: '#374151',
    },
    completedChecklistText: {
        fontSize: 14,
        color: '#6B7280',
        textDecorationLine: 'line-through',
    },
    bottomBar: {
        backgroundColor: 'rgba(249, 250, 251, 0.9)',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderTopWidth: 1,
        borderTopColor: '#E5E7EB',
    },
    swipeSection: {
        paddingHorizontal: 16,
        paddingVertical: 24,
    },
    swipeContainer: {
        position: 'relative',
        height: 56,
        width: '100%',
        backgroundColor: '#E5E7EB',
        borderRadius: 999,
        justifyContent: 'center',
        alignItems: 'center',
    },
    swipeButton: {
        position: 'absolute',
        left: 4,
        height: 48,
        width: 48,
        backgroundColor: '#2563EB',
        borderRadius: 24,
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 10,
    },
    swipeText: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#6B7280',
        textTransform: 'uppercase',
        letterSpacing: 1.5,
    },
    messageBar: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    messageInput: {
        flex: 1,
        backgroundColor: 'white',
        borderWidth: 1,
        borderColor: '#E5E7EB',
        borderRadius: 999,
        paddingHorizontal: 16,
        height: 44,
        fontSize: 14,
    },
    messageContainer: {
        flexDirection: 'row',
        marginBottom: 12,
        alignItems: 'flex-start',
    },
    messageBubble: {
        backgroundColor: 'white',
        borderRadius: 12,
        padding: 12,
        flex: 1,
        borderWidth: 1,
        borderColor: '#F3F4F6',
    },
    messageUser: {
        fontWeight: 'bold',
        fontSize: 12,
        color: '#1F2937',
        marginBottom: 4,
    },
    messageText: {
        fontSize: 14,
        color: '#374151',
    },
    messageTimestamp: {
        fontSize: 10,
        color: '#9CA3AF',
        marginTop: 8,
        textAlign: 'right',
    }
});

export default NewTaskDetailsScreen;
