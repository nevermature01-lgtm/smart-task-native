import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput, ActivityIndicator, Modal, KeyboardAvoidingView, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { doc, deleteDoc, updateDoc, onSnapshot, collection, query, where, getDocs, addDoc, serverTimestamp, orderBy, getDoc } from 'firebase/firestore';
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
    const [messages, setMessages] = useState([]);
    const [messageText, setMessageText] = useState('');
    const [currentUserName, setCurrentUserName] = useState('');
    const [currentUserRole, setCurrentUserRole] = useState('member');
    const [isCompleted, setIsCompleted] = useState(false);
    const [reopenModalVisible, setReopenModalVisible] = useState(false);
    const [deleteModalVisible, setDeleteModalVisible] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const scrollViewRef = useRef(null);

    useEffect(() => {
        const fetchUserData = async () => {
            const currentUser = auth.currentUser;
            if (!currentUser) return;

            const userDocRef = doc(db, 'users', currentUser.uid);
            const userDocSnap = await getDoc(userDocRef);
            if (userDocSnap.exists()) {
                setCurrentUserName(userDocSnap.data().firstName);
            }

            try {
                const activeAccountString = await AsyncStorage.getItem('activeAccount');
                if (activeAccountString) {
                    const activeAccount = JSON.parse(activeAccountString);
                    if (activeAccount.type === 'team') {
                        const teamMembersRef = collection(db, 'team_members');
                        const q = query(teamMembersRef, where("teamId", "==", activeAccount.id), where("userId", "==", currentUser.uid));
                        const querySnapshot = await getDocs(q);
                        setCurrentUserRole(!querySnapshot.empty ? querySnapshot.docs[0].data().role : 'member');
                    } else {
                        setCurrentUserRole('admin');
                    }
                }
            } catch (error) {
                console.error("Error fetching user role: ", error);
                setCurrentUserRole('member');
            }
        };

        fetchUserData();
    }, []);

    useEffect(() => {
        if (!taskId) return;

        const taskRef = doc(db, 'tasks', taskId);
        const unsubscribeTask = onSnapshot(taskRef, (docSnap) => {
            if (docSnap.exists()) {
                const taskData = docSnap.data();
                setTask({ id: docSnap.id, ...taskData });
                setTaskSteps(taskData.steps || []);
                setChecklist((taskData.checklist || []).map(item => ({ ...item, completed: item.completed || false })));
                setIsCompleted(taskData.status === 'completed');
            } else {
                console.log("No such task!");
                router.back();
            }
        });

        const messagesQuery = query(collection(db, 'tasks', taskId, 'messages'), orderBy('createdAt', 'asc'));
        const unsubscribeMessages = onSnapshot(messagesQuery, (querySnapshot) => {
            const fetchedMessages = [];
            querySnapshot.forEach((doc) => {
                fetchedMessages.push({ id: doc.id, ...doc.data() });
            });
            setMessages(fetchedMessages);
        });

        return () => {
            unsubscribeTask();
            unsubscribeMessages();
        };
    }, [taskId]);

    const handleSendMessage = async () => {
        if (messageText.trim() === '' || !taskId || !currentUserName) return;
        const currentUser = auth.currentUser;
        if (!currentUser) return;
    
        try {
            await addDoc(collection(db, 'tasks', taskId, 'messages'), {
                text: messageText,
                senderId: currentUser.uid,
                senderName: currentUserName,
                createdAt: serverTimestamp(),
                type: 'text'
            });
            setMessageText('');
        } catch (error) {
            console.error("Error sending message: ", error);
        }
    };

    const toggleChecklistItemCompletion = async (index) => {
        const newChecklist = [...checklist];
        newChecklist[index].completed = !newChecklist[index].completed;
        setChecklist(newChecklist);
        await updateDoc(doc(db, 'tasks', taskId), { checklist: newChecklist });
    };
    
    const handleReassign = () => {
        router.push({ pathname: '/assign-task', params: { taskId: task.id } });
    };

    const onComplete = async () => {
        await updateDoc(doc(db, 'tasks', taskId), { status: 'completed' });
    };

    const handleReopenTask = async () => {
        await updateDoc(doc(db, 'tasks', taskId), { status: 'pending' });
        setReopenModalVisible(false);
    };

    const handleDeleteTask = async () => {
        setIsDeleting(true);
        try {
            await deleteDoc(doc(db, 'tasks', taskId));
            router.back();
        } catch (error) {
            console.error("Error deleting task: ", error);
            setIsDeleting(false);
        }
    };

    const SWIPE_THRESHOLD = 150;
    const translateX = useSharedValue(0);
    const animatedStyle = useAnimatedStyle(() => ({ transform: [{ translateX: translateX.value }] }));
    const gesture = Gesture.Pan()
        .onUpdate((event) => { translateX.value = Math.max(0, Math.min(event.translationX, 240)); })
        .onEnd(() => {
            if (translateX.value > SWIPE_THRESHOLD) {
                runOnJS(onComplete)();
            } else {
                translateX.value = withSpring(0);
            }
        });

    if (!task) {
        return <ActivityIndicator style={{flex: 1}} size="large" color="#999999" />;
    }

    const taskCreationDate = task.createdAt?.toDate();
    const formattedTaskDateTime = taskCreationDate ? `${taskCreationDate.getDate()}-${taskCreationDate.toLocaleString('default', { month: 'short' })}-${taskCreationDate.getFullYear()}, ${taskCreationDate.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}` : '';


    return (
        <View style={{ flex: 1, backgroundColor: '#fff' }}>
             <View style={[styles.header, { paddingTop: insets.top }]}>
                <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
                    <MaterialIcons name="arrow-back" size={24} color="#1F2937" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Details</Text>
            </View>

            <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'} keyboardVerticalOffset={100}>
                <View style={{ flex: 1, position: 'relative' }}>
                    <ScrollView 
                        ref={scrollViewRef}
                        style={styles.container}
                        onContentSizeChange={() => scrollViewRef.current.scrollToEnd({ animated: true })}
                    >
                        {/* Task Details */}
                        <View style={styles.taskInfoContainer}>
                            <View style={styles.taskTitleContainer}>
                                <Text style={styles.taskTitle}>• {task.name}</Text>
                                <View style={styles.priorityContainer}>
                                    {currentUserRole === 'admin' && !isCompleted && (
                                        <TouchableOpacity style={[styles.actionButton, styles.deleteButton]} onPress={() => setDeleteModalVisible(true)}>
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

                        {/* Assignment Chain */}
                        <View style={styles.assignedToContainer}>
                            <View style={styles.assignedToHeader}>
                                <Text style={styles.assignedToTitle}>Assigned to:</Text>
                                {currentUserRole === 'admin' && !isCompleted && (
                                    <TouchableOpacity style={styles.reassignButton} onPress={handleReassign}>
                                        <Text style={styles.reassignButtonText}>Reassign</Text>
                                    </TouchableOpacity>
                                )}
                            </View>
                            {/* Assignment details... */}
                        </View>

                        {/* Steps */}
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

                        {/* Checklist */}
                        {checklist.length > 0 && (
                            <View style={styles.checklistContainer}>
                                <Text style={styles.checklistTitle}>Checklist</Text>
                                {checklist.map((item, index) => (
                                    <TouchableOpacity key={index} style={styles.checklistItem} onPress={() => toggleChecklistItemCompletion(index)} disabled={isCompleted}>
                                        <Text style={[styles.checklistText, item.completed && styles.checklistTextCompleted]}>{item.text}</Text>
                                        <View style={[styles.checkbox, item.completed && styles.checkboxCompleted]}>
                                            {item.completed && <MaterialIcons name="check" size={18} color="white" />}
                                        </View>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        )}
                        
                        {/* Messages */}
                         <View style={styles.messagesContainer}>
                             <Text style={styles.messagesTitle}>Messages</Text>
                             {messages.map((msg) => (
                                 <View key={msg.id} style={[
                                     styles.messageBubble,
                                     msg.senderId === auth.currentUser.uid ? styles.myMessageBubble : styles.theirMessageBubble
                                 ]}>
                                     <Text style={styles.messageSender}>{msg.senderName}</Text>
                                     {msg.type === 'text' && <Text style={styles.messageText}>{msg.text}</Text>}
                                 </View>
                             ))}
                        </View>

                        {!isCompleted && (
                            <View style={{height: 100}}/> // Spacer for swipe button
                        )}
                    </ScrollView>
                    
                    {isCompleted && <CompletedScreen />} 
                </View>

                {!isCompleted && (
                    <View style={styles.footerContainer}>
                         <View style={styles.swipeToCompleteButton}>
                            <GestureDetector gesture={gesture}>
                                <Animated.View style={[styles.swipeableCircle, animatedStyle]} />
                            </GestureDetector>
                            <Text style={styles.swipeToCompleteText}>Swipe to Complete</Text>
                        </View>
                        <View style={[styles.footer, { paddingBottom: insets.bottom }]}>
                            <TextInput 
                                style={styles.messageInput} 
                                placeholder="Message..." 
                                value={messageText}
                                onChangeText={setMessageText}
                            />
                            <TouchableOpacity onPress={handleSendMessage}>
                                <MaterialIcons name="send" size={24} color={messageText.trim() === '' ? '#999' : '#000'} />
                            </TouchableOpacity>
                        </View>
                    </View>
                )}
            </KeyboardAvoidingView>

            {/* Modals */}
             <Modal transparent={true} visible={reopenModalVisible} onRequestClose={() => setReopenModalVisible(false)}>
                <View style={styles.modalContainer}>
                    <View style={styles.modalView}>
                        <Text style={styles.modalText}>Reopen Task?</Text>
                        <View style={styles.modalButtons}>
                            <TouchableOpacity style={[styles.modalButton, {backgroundColor: '#999'}]} onPress={() => setReopenModalVisible(false)}><Text style={styles.modalButtonText}>No</Text></TouchableOpacity>
                            <TouchableOpacity style={[styles.modalButton, {backgroundColor: '#4CAF50'}]} onPress={handleReopenTask}><Text style={styles.modalButtonText}>Yes</Text></TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
            <Modal transparent={true} visible={deleteModalVisible} onRequestClose={() => setDeleteModalVisible(false)}>
                <View style={styles.modalContainer}>
                    <View style={styles.modalView}>
                        <Text style={styles.modalText}>Are you sure you want to delete this task?</Text>
                        <View style={styles.modalButtons}>
                            <TouchableOpacity style={[styles.modalButton, {backgroundColor: '#999'}]} onPress={() => setDeleteModalVisible(false)} disabled={isDeleting}><Text style={styles.modalButtonText}>Cancel</Text></TouchableOpacity>
                            <TouchableOpacity style={[styles.modalButton, {backgroundColor: '#F44336'}]} onPress={handleDeleteTask} disabled={isDeleting}>
                                {isDeleting ? <ActivityIndicator size="small" color="#fff" /> : <Text style={styles.modalButtonText}>Delete</Text>}
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </View>
    );
};

const styles = StyleSheet.create({
    // Header, Container, Task Info, etc.
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 16, paddingBottom: 12, backgroundColor: 'white', borderBottomWidth: 1, borderBottomColor: '#E5E7EB', marginTop: 20 },
    backButton: { position: 'absolute', left: 16, padding: 4, zIndex: 1 },
    headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#1F2937' },
    container: { flex: 1, paddingHorizontal: 16, },
    taskInfoContainer: { marginBottom: 16 },
    taskTitleContainer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4, },
    taskTitle: { fontSize: 20, fontWeight: 'bold', flex: 1, marginRight: 16, },
    priorityContainer: { alignItems: 'center', },
    priorityText: { fontSize: 14, fontWeight: 'bold', color: '#EF4444', marginTop: 4, },
    taskSubtitle: { fontSize: 16, color: '#6B7280', marginBottom: 4, },
    taskDate: { fontSize: 14, color: '#6B7280', },
    actionButton: { padding: 8, },
    deleteButton: { backgroundColor: 'red', borderRadius: 5, },
    assignedToContainer: { marginBottom: 16, },
    assignedToHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8, },
    assignedToTitle: { fontSize: 16, fontWeight: 'bold', },
    reassignButton: { backgroundColor: '#E5E7EB', paddingVertical: 6, paddingHorizontal: 12, borderRadius: 5, },
    reassignButtonText: { fontSize: 14, fontWeight: '600', color: '#1F2937', },
    stepsContainer: { marginBottom: 16, },
    stepsTitle: { fontSize: 16, fontWeight: 'bold', marginBottom: 8, },
    stepItem: { padding: 12, backgroundColor: '#f3f4f6', borderRadius: 8, },
    stepText: { fontSize: 16, color: '#374151', },
    arrow: { marginHorizontal: 8, },
    checklistContainer: { marginBottom: 16, },
    checklistTitle: { fontSize: 16, fontWeight: 'bold', marginBottom: 8, },
    checklistItem: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12, marginLeft: 16, },
    checklistText: { fontSize: 16, color: '#374151', flex: 1, },
    checklistTextCompleted: { textDecorationLine: 'line-through', color: '#9CA3AF', },
    checkbox: { width: 24, height: 24, borderRadius: 6, borderWidth: 2, borderColor: '#D1D5DB', justifyContent: 'center', alignItems: 'center', marginLeft: 16, },
    checkboxCompleted: { backgroundColor: '#2563EB', borderColor: '#2563EB', },
    
    // Messages
    messagesContainer: { marginTop: 20, },
    messagesTitle: { fontSize: 16, fontWeight: 'bold', marginBottom: 12, },
    messageBubble: { padding: 12, borderRadius: 12, marginBottom: 8, maxWidth: '80%', },
    myMessageBubble: { backgroundColor: '#d1e7ff', alignSelf: 'flex-end', },
    theirMessageBubble: { backgroundColor: '#f1f0f0', alignSelf: 'flex-start', },
    messageSender: { fontWeight: 'bold', marginBottom: 4, fontSize: 12, color: '#555' },
    messageText: { fontSize: 16, color: '#333' },
    playButton: { justifyContent: 'center', alignItems: 'center', width: 40, height: 40, },

    // Footer & Swipe
    footerContainer: { position: 'absolute', bottom: 0, left: 0, right: 0, },
    swipeToCompleteButton: { backgroundColor: '#E5E7EB', height: 60, borderRadius: 30, justifyContent: 'center', marginHorizontal: 20, marginBottom: 10, },
    swipeableCircle: { width: 50, height: 50, borderRadius: 25, backgroundColor: '#2563EB', position: 'absolute', left: 5, top: 5, justifyContent: 'center', alignItems: 'center', zIndex: 2, },
    swipeToCompleteText: { fontSize: 16, fontWeight: 'bold', color: '#374151', alignSelf: 'center', zIndex: 1, },
    footer: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingTop: 10, borderTopWidth: 1, borderTopColor: '#E5E7EB', backgroundColor: '#fff', },
    messageInput: { flex: 1, borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 20, paddingVertical: 8, paddingHorizontal: 12, marginRight: 8, backgroundColor: '#f1f0f0' },

    // Overlays & Modals
    completedOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0, 0, 0, 0.7)', justifyContent: 'center', alignItems: 'center', zIndex: 10, },
    completedOverlayText: { color: 'white', fontSize: 24, fontWeight: 'bold', marginTop: 16, },
    unlockText: { color: 'white', fontSize: 16, marginTop: 8, },
    modalContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0, 0, 0, 0.5)', },
    modalView: { margin: 20, backgroundColor: 'white', borderRadius: 20, padding: 35, alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2, }, shadowOpacity: 0.25, shadowRadius: 4, elevation: 5, },
    modalText: { marginBottom: 15, textAlign: 'center', fontSize: 18, fontWeight: 'bold', },
    modalButtons: { flexDirection: 'row', justifyContent: 'space-around', width: '100%', },
    modalButton: { borderRadius: 10, paddingVertical: 10, paddingHorizontal: 20, elevation: 2, marginHorizontal: 5, minWidth: 100, alignItems: 'center' },
    modalButtonText: { color: 'white', fontWeight: 'bold', textAlign: 'center', fontSize: 16, }
});

export default DetailsScreen;
