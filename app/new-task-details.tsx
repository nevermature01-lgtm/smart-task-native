import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput, Image, ActivityIndicator, Dimensions, KeyboardAvoidingView, Platform, Modal } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons, Feather } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { doc, getDoc, updateDoc, collection, addDoc, serverTimestamp, query, orderBy, onSnapshot } from 'firebase/firestore';
import { db, auth, storage } from '../firebase';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, { useSharedValue, useAnimatedStyle, withSpring, runOnJS } from 'react-native-reanimated';
import * as ImagePicker from 'expo-image-picker';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import ImageView from 'react-native-image-viewing';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const SWIPE_THRESHOLD = SCREEN_WIDTH * 0.7;

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

const NewTaskDetailsScreen = () => {
    const insets = useSafeAreaInsets();
    const router = useRouter();
    const { taskId } = useLocalSearchParams();
    const [task, setTask] = useState(null);
    const [loading, setLoading] = useState(true);
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [currentUserName, setCurrentUserName] = useState('');
    const currentUser = auth.currentUser;
    const [attachmentModalVisible, setAttachmentModalVisible] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [fullScreenImage, setFullScreenImage] = useState(null);

    const translateX = useSharedValue(0);

    useEffect(() => {
        let unsubscribe = () => {};
        const fetchTaskAndMessages = async () => {
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

        const fetchCurrentUserData = async () => {
            if (auth.currentUser) {
                const userDoc = await getDoc(doc(db, 'users', auth.currentUser.uid));
                if (userDoc.exists()) {
                    const userData = userDoc.data();
                    const fullName = `${userData.firstName || ''} ${userData.lastName || ''}`.trim();
                    setCurrentUserName(fullName || auth.currentUser.displayName || 'User');
                } else {
                    setCurrentUserName(auth.currentUser.displayName || 'User');
                }
            }
        };

        fetchTaskAndMessages();
        fetchCurrentUserData();
        
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

    const handleSendMessage = async (imageUrl = null) => {
        if (!currentUser || !currentUserName) return;
        if (newMessage.trim() === '' && !imageUrl) return;

        const { uid, photoURL } = currentUser;
        const messagesRef = collection(db, 'tasks', taskId, 'messages');
        
        const messageData = {
            createdAt: serverTimestamp(),
            userId: uid,
            userName: currentUserName,
            userPhotoURL: photoURL || 'https://via.placeholder.com/40'
        };

        if (imageUrl) {
            messageData.imageUrl = imageUrl;
        } else {
            messageData.text = newMessage;
        }

        await addDoc(messagesRef, messageData);

        setNewMessage('');
    };

    const pickImage = async (useCamera) => {
        const { status } = useCamera 
            ? await ImagePicker.requestCameraPermissionsAsync() 
            : await ImagePicker.requestMediaLibraryPermissionsAsync();

        if (status !== 'granted') {
            alert('Sorry, we need camera roll permissions to make this work!');
            return;
        }

        let result = useCamera
            ? await ImagePicker.launchCameraAsync()
            : await ImagePicker.launchImageLibraryAsync({
                mediaTypes: 'Images',
                quality: 0.7,
            });

        if (!result.canceled && result.assets && result.assets.length > 0) {
            setUploading(true);
            setAttachmentModalVisible(false);
            try {
                const downloadURL = await uploadImage(result.assets[0].uri);
                await handleSendMessage(downloadURL);
            } catch (error) {
                console.error("Error during image upload: ", error);
                alert('Error uploading image.');
            } finally {
                setUploading(false);
            }
        }
    };

    const uploadImage = async (uri) => {
        const blob = await uriToBlob(uri);
        const filename = `images/${Date.now()}.jpg`;
        const storageRef = ref(storage, filename);

        await uploadBytes(storageRef, blob, {
            contentType: "image/jpeg"
        });

        const downloadURL = await getDownloadURL(storageRef);
        return downloadURL;
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
                    {messages.map((msg) => {
                        const isCurrentUser = msg.userId === currentUser?.uid;
                        return (
                            <View 
                                key={msg.id} 
                                style={[
                                    styles.messageContainer, 
                                    isCurrentUser ? styles.sentMessageContainer : styles.receivedMessageContainer
                                ]}
                            >
                                {!isCurrentUser && <Image source={{ uri: msg.userPhotoURL }} style={styles.avatar} />}
                                <View 
                                    style={[
                                        styles.messageBubble,
                                        isCurrentUser ? styles.sentMessageBubble : styles.receivedMessageBubble
                                    ]}
                                >
                                    <Text 
                                        style={[
                                            styles.messageUser,
                                            { color: isCurrentUser ? 'white' : '#1F2937' }
                                        ]}
                                    >
                                        {msg.userName}
                                    </Text>
                                    {msg.text ? (
                                        <Text style={{color: isCurrentUser ? 'white' : '#374151'}}>{msg.text}</Text>
                                    ) : msg.imageUrl ? (
                                        <TouchableOpacity onPress={() => setFullScreenImage({ uri: msg.imageUrl })}>
                                            <Image source={{ uri: msg.imageUrl }} style={styles.messageImage} />
                                        </TouchableOpacity>
                                    ) : null}
                                    <Text style={[styles.messageTimestamp, { color: isCurrentUser ? '#A5B4FC' : '#9CA3AF' }]}>{formatDate(msg.createdAt)}</Text>
                                </View>
                            </View>
                        );
                    })}
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
                    <TouchableOpacity onPress={() => setAttachmentModalVisible(true)}>
                        <MaterialIcons name="attach-file" size={24} color="#6B7280" />
                    </TouchableOpacity>
                    <TextInput style={styles.messageInput} placeholder="Add a comment..." value={newMessage} onChangeText={setNewMessage} />
                    <TouchableOpacity onPress={() => handleSendMessage()}>
                        <MaterialIcons name="send" size={24} color="#2563EB" />
                    </TouchableOpacity>
                </View>
            </View>

            <Modal transparent={true} visible={attachmentModalVisible} onRequestClose={() => setAttachmentModalVisible(false)}>
                <View style={styles.attachmentModalContainer}>
                    <View style={styles.attachmentModalView}>
                        <Text style={styles.modalText}>Send Attachment</Text>
                        {uploading ? (
                            <ActivityIndicator size="large" color="#2563EB" />
                        ) : (
                            <View style={styles.attachmentButtons}>
                                <TouchableOpacity style={styles.attachmentButton} onPress={() => pickImage(true)}>
                                    <Feather name="camera" size={30} color="#2563EB" />
                                    <Text style={styles.attachmentButtonText}>Camera</Text>
                                </TouchableOpacity>
                                <TouchableOpacity style={styles.attachmentButton} onPress={() => pickImage(false)}>
                                    <Feather name="image" size={30} color="#2563EB" />
                                    <Text style={styles.attachmentButtonText}>Gallery</Text>
                                </TouchableOpacity>
                            </View>
                        )}
                        <TouchableOpacity style={{marginTop: 20}} onPress={() => setAttachmentModalVisible(false)}>
                            <Text style={{color: '#2563EB', fontSize: 16}}>Cancel</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>

            {fullScreenImage && (
                 <ImageView
                    images={[fullScreenImage]}
                    imageIndex={0}
                    visible={!!fullScreenImage}
                    onRequestClose={() => setFullScreenImage(null)}
                 />
            )}

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
        alignItems: 'flex-end',
    },
    sentMessageContainer: {
        justifyContent: 'flex-end',
    },
    receivedMessageContainer: {
        justifyContent: 'flex-start',
    },
    messageBubble: {
        borderRadius: 20,
        padding: 12,
        maxWidth: '80%',
    },
    sentMessageBubble: {
        backgroundColor: '#2563EB',
        marginLeft: 'auto',
    },
    receivedMessageBubble: {
        backgroundColor: '#E5E7EB',
        marginRight: 'auto',
    },
    messageUser: {
        fontWeight: 'bold',
        fontSize: 12,
        marginBottom: 4,
    },
    messageTimestamp: {
        fontSize: 10,
        marginTop: 8,
        textAlign: 'right',
    },
    attachmentModalContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.5)',
    },
    attachmentModalView: {
        width: '80%',
        backgroundColor: 'white',
        borderRadius: 20,
        padding: 35,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2
        },
        shadowOpacity: 0.25,
        shadowRadius: 4,
        elevation: 5
    },
    modalText: {
        marginBottom: 15,
        textAlign: 'center',
        fontSize: 18,
        fontWeight: 'bold'
    },
    attachmentButtons: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        width: '100%'
    },
    attachmentButton: {
        alignItems: 'center'
    },
    attachmentButtonText: {
        marginTop: 5,
        fontSize: 12,
        color: '#2563EB'
    },
    messageImage: {
        width: 200,
        height: 200,
        borderRadius: 15,
        marginTop: 5,
    },
});

export default NewTaskDetailsScreen;
