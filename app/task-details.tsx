import React, { useState, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput, KeyboardAvoidingView, Platform, Alert, Dimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { getAuth } from 'firebase/auth';
import { getFirestore, collection, addDoc, doc, getDoc, serverTimestamp } from 'firebase/firestore';
import { LinearGradient } from 'expo-linear-gradient';

const ChecklistItem = ({ item, onToggle, onTextChange, onRemove }) => (
    <View style={styles.checklistItem}>
        <TouchableOpacity onPress={onToggle} style={[styles.checkbox, item.completed && styles.checkboxCompleted]}>
            {item.completed && <Feather name="check" size={16} color="#fff" />}
        </TouchableOpacity>
        <TextInput
            style={[styles.checklistInput, item.completed && styles.checklistInputCompleted]}
            value={item.text}
            onChangeText={onTextChange}
            placeholder="Add a checklist item..."
            placeholderTextColor="#9CA3AF"
        />
        <TouchableOpacity onPress={onRemove} style={styles.removeButton}>
            <Feather name="x" size={20} color="#9CA3AF" />
        </TouchableOpacity>
    </View>
);

const StepItem = ({ item, onTextChange, index, onRemove }) => (
     <View style={styles.stepItem}>
        <Text style={styles.stepNumber}>{index + 1}</Text>
        <TextInput
            style={styles.stepInput}
            value={item.text}
            onChangeText={onTextChange}
            placeholder="Describe this step"
            placeholderTextColor="#9CA3AF"
            multiline
        />
        <TouchableOpacity onPress={onRemove} style={styles.removeButton}>
            <Feather name="x" size={20} color="#9CA3AF" />
        </TouchableOpacity>
    </View>
)

const { width: screenWidth } = Dimensions.get('window');
const priorityButtonWidth = 60;
const spacerWidth = (screenWidth - priorityButtonWidth) / 2;

const TaskDetailsScreen = () => {
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const { memberName, memberId, teamId } = useLocalSearchParams();
    
    const [taskName, setTaskName] = useState('');
    const [description, setDescription] = useState('');
    const [steps, setSteps] = useState([{ id: 1, text: ''}]);
    const [checklist, setChecklist] = useState([{ id: 1, text: '', completed: false }]);
    const [priority, setPriority] = useState(5);
    const scrollViewRef = useRef(null);

    const auth = getAuth();
    const db = getFirestore();

    const addStep = () => {
        setSteps([...steps, { id: Date.now(), text: ''}]);
    };

    const handleStepTextChange = (id, text) => {
        setSteps(steps.map(item => (item.id === id ? { ...item, text } : item)));
    };
    
    const removeStep = (id) => {
        setSteps(steps.filter(item => item.id !== id));
    };

    const addChecklistItem = () => {
        setChecklist([...checklist, { id: Date.now(), text: '', completed: false }]);
    };

    const toggleChecklistItem = (id) => {
        setChecklist(checklist.map(item => (item.id === id ? { ...item, completed: !item.completed } : item)));
    };

    const handleChecklistTextChange = (id, text) => {
        setChecklist(checklist.map(item => (item.id === id ? { ...item, text } : item)));
    };

    const removeChecklistItem = (id) => {
        setChecklist(checklist.filter(item => item.id !== id));
    };

    const handleSaveTask = async () => {
        const user = auth.currentUser;
        if (!user) {
            Alert.alert("Error", "You must be logged in to create a task.");
            return;
        }

        if (!taskName.trim()) {
            Alert.alert("Validation Error", "Task name cannot be empty.");
            return;
        }

        try {
            const userDocRef = doc(db, 'users', user.uid);
            const userDoc = await getDoc(userDocRef);
            const assignedByName = userDoc.exists() ? userDoc.data().firstName : "Unknown User";

            await addDoc(collection(db, "tasks"), {
                name: taskName,
                description,
                steps: steps.filter(s => s.text.trim() !== ''),
                checklist: checklist.filter(c => c.text.trim() !== ''),
                priority,
                assignedToId: memberId,
                assignedToName: memberName,
                assignedById: user.uid,
                assignedByName,
                teamId: teamId, 
                createdAt: serverTimestamp(),
                status: 'pending',
            });

            Alert.alert("Success", "Task assigned successfully!");
            router.back();
        } catch (error) {
            console.error("Error creating task: ", error);
            Alert.alert("Error", "An error occurred while creating the task.");
        }
    };

    const handlePriorityScroll = (event) => {
        const x = event.nativeEvent.contentOffset.x;
        const newPriority = Math.round(x / priorityButtonWidth) + 1;
        if (newPriority >= 1 && newPriority <= 10) {
            setPriority(newPriority);
        }
    };

    return (
        <KeyboardAvoidingView 
            style={{ flex: 1, backgroundColor: '#F9FAFB' }} 
            behavior={Platform.OS === "ios" ? "padding" : "height"}
        >
            <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
                <TouchableOpacity style={styles.headerButton} onPress={() => router.back()}>
                    <Feather name="chevron-left" size={24} color="#1F2937" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>New Task</Text>
                <View style={{width: 40}} />
            </View>

            <ScrollView style={styles.contentContainer} keyboardShouldPersistTaps="handled">
                <View style={styles.inputGroup}>
                    <Text style={styles.label}>Task Name</Text>
                    <TextInput
                        style={styles.input}
                        value={taskName}
                        onChangeText={setTaskName}
                        placeholder="e.g., Develop the new API"
                        placeholderTextColor="#9CA3AF"
                    />
                </View>
                
                 <View style={styles.assigneeContainer}>
                    <Text style={styles.label}>Assign To</Text>
                    <View style={styles.assigneePill}>
                         <View style={styles.avatar}>
                            <Text style={styles.avatarText}>{memberName?.charAt(0).toUpperCase()}</Text>
                        </View>
                        <Text style={styles.assigneeName}>{memberName}</Text>
                    </View>
                </View>

                <View style={styles.inputGroup}>
                    <Text style={styles.label}>Description</Text>
                    <TextInput
                        style={[styles.input, styles.textarea]}
                        value={description}
                        onChangeText={setDescription}
                        placeholder="Add more details about the task..."
                        placeholderTextColor="#9CA3AF"
                        multiline
                    />
                </View>

                 <View style={styles.inputGroup}>
                    <Text style={styles.label}>Steps to Complete</Text>
                    {steps.map((item, index) => (
                        <StepItem 
                            key={item.id}
                            item={item}
                            index={index}
                            onTextChange={(text) => handleStepTextChange(item.id, text)}
                            onRemove={() => removeStep(item.id)}
                        />
                    ))}
                    <TouchableOpacity style={styles.addButton} onPress={addStep}>
                         <Feather name="plus-circle" size={18} color="#6B7280" />
                        <Text style={styles.addText}>Add Step</Text>
                    </TouchableOpacity>
                </View>

                <View style={styles.inputGroup}>
                    <Text style={styles.label}>Checklist</Text>
                    {checklist.map(item => (
                        <ChecklistItem 
                            key={item.id}
                            item={item}
                            onToggle={() => toggleChecklistItem(item.id)}
                            onTextChange={(text) => handleChecklistTextChange(item.id, text)}
                            onRemove={() => removeChecklistItem(item.id)}
                        />
                    ))}
                    <TouchableOpacity style={styles.addButton} onPress={addChecklistItem}>
                         <Feather name="plus-circle" size={18} color="#6B7280" />
                        <Text style={styles.addText}>Add Item</Text>
                    </TouchableOpacity>
                </View>

                <View style={styles.inputGroup}>
                    <Text style={styles.label}>Priority</Text>
                    <ScrollView 
                        ref={scrollViewRef}
                        horizontal 
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={{ paddingHorizontal: spacerWidth }}
                        decelerationRate="fast"
                        snapToInterval={priorityButtonWidth}
                        onMomentumScrollEnd={handlePriorityScroll}
                    >
                        {[...Array(10)].map((_, i) => (
                            <TouchableOpacity
                                key={i}
                                style={[
                                    styles.priorityButton,
                                    {
                                        width: priorityButtonWidth,
                                        backgroundColor: priority === i + 1 ? '#3B82F6' : '#fff',
                                        borderColor: priority === i + 1 ? '#3B82F6' : '#E5E7EB',
                                    }
                                ]}
                                onPress={() => {
                                    setPriority(i + 1);
                                    scrollViewRef.current.scrollTo({ x: i * priorityButtonWidth, animated: true });
                                }}>
                                <Text style={[
                                    styles.priorityButtonText,
                                    { color: priority === i + 1 ? '#fff' : '#374151' }
                                ]}>
                                    {i + 1}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>
                </View>
            </ScrollView>

            <View style={[styles.footer, { paddingBottom: insets.bottom > 0 ? insets.bottom : 20 }]}>
                <TouchableOpacity onPress={handleSaveTask}>
                    <LinearGradient
                        colors={['#3B82F6', '#2563EB']}
                        style={styles.createButton}
                    >
                        <Text style={styles.createButtonText}>Assign Task</Text>
                    </LinearGradient>
                </TouchableOpacity>
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
        paddingBottom: 16,
        backgroundColor: '#FFFFFF',
    },
    headerButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
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
    contentContainer: {
        flex: 1,
        paddingHorizontal: 20,
        paddingTop: 16
    },
    assigneeContainer: {
        marginBottom: 24,
    },
    assigneePill: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#EFF6FF',
        borderRadius: 99,
        paddingVertical: 4,
        paddingHorizontal: 12,
        alignSelf: 'flex-start',
    },
    avatar: {
        width: 28,
        height: 28,
        borderRadius: 14,
        backgroundColor: '#BFDBFE',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 8,
    },
    avatarText: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#2563EB',
    },
    assigneeName: {
        fontSize: 16,
        fontWeight: '600',
        color: '#1E40AF',
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
        color: '#4B5563',
        marginBottom: 8,
    },
    inputGroup: {
        marginBottom: 24,
    },
    input: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 16,
        fontSize: 16,
        color: '#1F2937',
        borderWidth: 1,
        borderColor: '#E5E7EB',
    },
    textarea: {
        height: 120,
        textAlignVertical: 'top',
    },
    stepItem: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        marginBottom: 12,
        backgroundColor: '#fff',
        padding: 12,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: '#E5E7EB'
    },
    stepNumber: {
        fontSize: 14,
        lineHeight: 24, 
        fontWeight: 'bold',
        color: '#3B82F6',
        marginRight: 8,
    },
    stepInput: {
        flex: 1,
        fontSize: 16,
        color: '#374151',
        paddingVertical: 0,
    },
    checklistItem: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
        backgroundColor: '#fff',
        padding: 12,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: '#E5E7EB'
    },
    checkbox: {
        width: 22,
        height: 22,
        borderRadius: 6,
        borderWidth: 2,
        borderColor: '#D1D5DB',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    checkboxCompleted: {
        backgroundColor: '#3B82F6',
        borderColor: '#3B82F6',
    },
    checklistInput: {
        flex: 1,
        fontSize: 16,
        color: '#374151',
    },
    checklistInputCompleted: {
        textDecorationLine: 'line-through',
        color: '#9CA3AF',
    },
    addButton: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 4,
        padding: 8,
        alignSelf: 'flex-start',
    },
    addText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#6B7280',
        marginLeft: 6
    },
    removeButton: {
        padding: 4,
        marginLeft: 8,
    },
    priorityButton: {
        height: 60,
        borderRadius: 30,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        marginHorizontal: 0,
    },
    priorityButtonText: {
        fontSize: 20,
        fontWeight: 'bold',
    },
    footer: {
        backgroundColor: '#FFFFFF',
        paddingHorizontal: 20,
        paddingTop: 10,
        borderTopWidth: 1,
        borderTopColor: '#E5E7EB',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -5 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
    },
    createButton: {
        padding: 16,
        borderRadius: 14,
        alignItems: 'center',
        shadowColor: '#3B82F6',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
    },
    createButtonText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold',
    },
});

export default TaskDetailsScreen;
