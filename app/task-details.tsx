import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { MaterialIcons, Feather } from '@expo/vector-icons';
import { getAuth } from 'firebase/auth';
import { getFirestore, collection, addDoc, doc, getDoc, serverTimestamp } from 'firebase/firestore';

const ChecklistItem = ({ item, onToggle, onTextChange, onRemove }) => (
    <View style={styles.checklistItem}>
        <TouchableOpacity onPress={onToggle} style={[styles.checkbox, item.completed && styles.checkboxCompleted]}>
            {item.completed && <Feather name="check" size={14} color="#fff" />}
        </TouchableOpacity>
        <TextInput
            style={[styles.checklistInput, item.completed && styles.checklistInputCompleted]}
            value={item.text}
            onChangeText={onTextChange}
            placeholder="Add a checklist item..."
            placeholderTextColor="#9CA3AF"
        />
        <TouchableOpacity onPress={onRemove} style={styles.removeButton}>
            <MaterialIcons name="close" size={20} color="#9CA3AF" />
        </TouchableOpacity>
    </View>
);

const StepItem = ({ item, onTextChange, index, onRemove }) => (
     <View style={styles.stepItem}>
        <Text style={styles.stepNumber}>{index + 1}.</Text>
        <TextInput
            style={styles.stepInput}
            value={item.text}
            onChangeText={onTextChange}
            placeholder="Describe this step"
            placeholderTextColor="#9CA3AF"
            multiline
        />
        <TouchableOpacity onPress={onRemove} style={styles.removeButton}>
            <MaterialIcons name="close" size={20} color="#9CA3AF" />
        </TouchableOpacity>
    </View>
)


const TaskDetailsScreen = () => {
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const { memberName, memberId, teamId } = useLocalSearchParams();
    
    const [taskName, setTaskName] = useState('');
    const [description, setDescription] = useState('');
    const [steps, setSteps] = useState([{ id: 1, text: ''}]);
    const [checklist, setChecklist] = useState([{ id: 1, text: '', completed: false }]);
    const [priority, setPriority] = useState(5);

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
                steps,
                checklist,
                priority,
                assignedToId: memberId,
                assignedToName: memberName,
                assignedById: user.uid,
                assignedByName,
                teamId: teamId, 
                createdAt: serverTimestamp(),
                status: 'pending',
            });

            Alert.alert("Success", "Task created successfully!");
            router.back();
        } catch (error) {
            console.error("Error creating task: ", error);
            Alert.alert("Error", "An error occurred while creating the task.");
        }
    };
    

    return (
        <KeyboardAvoidingView 
            style={{ flex: 1, backgroundColor: '#f8f6f6' }} 
            behavior={Platform.OS === "ios" ? "padding" : "height"}
        >
            <View style={[styles.header, { paddingTop: insets.top }]}>
                <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
                    <MaterialIcons name="arrow-back" size={24} color="#1F2937" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>New Task</Text>
                <TouchableOpacity style={styles.closeButton} onPress={() => router.back()}>
                    <MaterialIcons name="close" size={24} color="#1F2937" />
                </TouchableOpacity>
            </View>

            <ScrollView style={styles.contentContainer} keyboardShouldPersistTaps="handled">
                <View style={styles.assigneeContainer}>
                    <Text style={styles.label}>Assigning to</Text>
                    <View style={styles.assigneePill}>
                         <View style={styles.avatar}>
                            <Text style={styles.avatarText}>{memberName?.charAt(0).toUpperCase()}</Text>
                        </View>
                        <Text style={styles.assigneeName}>{memberName}</Text>
                    </View>
                </View>

                <View style={styles.inputGroup}>
                    <Text style={styles.label}>Name of Task</Text>
                    <TextInput
                        style={styles.input}
                        value={taskName}
                        onChangeText={setTaskName}
                        placeholder="e.g., Design the new homepage"
                        placeholderTextColor="#9CA3AF"
                    />
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
                    <Text style={styles.label}>Steps</Text>
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
                         <MaterialIcons name="add" size={16} color="#4B5563" />
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
                         <MaterialIcons name="add" size={16} color="#4B5563" />
                        <Text style={styles.addText}>Add Item</Text>
                    </TouchableOpacity>
                </View>

                <View style={styles.inputGroup}>
                    <Text style={styles.label}>Priority</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                        {[...Array(10)].map((_, i) => (
                            <TouchableOpacity
                                key={i}
                                style={[
                                    styles.priorityButton,
                                    priority === i + 1 && styles.priorityButtonSelected,
                                ]}
                                onPress={() => setPriority(i + 1)}>
                                <Text style={[
                                    styles.priorityButtonText,
                                    priority === i + 1 && styles.priorityButtonTextSelected
                                ]}>
                                    {i + 1}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>
                </View>
            </ScrollView>

            <View style={[styles.footer, { paddingBottom: insets.bottom > 0 ? insets.bottom : 20 }]}>
                <TouchableOpacity style={styles.createButton} onPress={handleSaveTask}>
                    <Text style={styles.createButtonText}>Create Task</Text>
                </TouchableOpacity>
            </View>
        </KeyboardAvoidingView>
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
        top: 10, 
        padding: 4,
        zIndex: 1,
    },
    closeButton: {
        position: 'absolute',
        right: 16,
        top: 10,
        padding: 4,
        zIndex: 1,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#1F2937',
    },
    contentContainer: {
        flex: 1,
        paddingHorizontal: 20,
    },
    assigneeContainer: {
        paddingVertical: 20, 
        borderBottomWidth: 1,
        borderBottomColor: '#E5E7EB',
        marginBottom: 20,
    },
    assigneePill: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        borderRadius: 99,
        padding: 6,
        alignSelf: 'flex-start',
        borderWidth: 1,
        borderColor: '#E5E7EB',
    },
    avatar: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: 'rgba(37, 99, 235, 0.1)',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 10,
    },
    avatarText: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#2563EB',
    },
    assigneeName: {
        fontSize: 16,
        fontWeight: '600',
        color: '#1F2937',
        marginRight: 6,
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
        color: '#374151',
        marginBottom: 12,
    },
    inputGroup: {
        marginBottom: 24,
    },
    input: {
        backgroundColor: '#fff',
        borderRadius: 10,
        padding: 14,
        fontSize: 16,
        color: '#1F2937',
        borderWidth: 1,
        borderColor: '#E5E7EB',
    },
    textarea: {
        height: 100,
        textAlignVertical: 'top',
    },
    stepItem: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 10,
    },
    stepNumber: {
        fontSize: 16,
        lineHeight: 24, 
        fontWeight: '600',
        color: '#6B7280',
        marginRight: 8,
    },
    stepInput: {
        flex: 1,
        fontSize: 16,
        color: '#374151',
        borderBottomWidth: 1,
        borderBottomColor: '#E5E7EB',
        paddingVertical: 8,
    },
    checklistItem: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 10,
    },
    checkbox: {
        width: 20,
        height: 20,
        borderRadius: 5,
        borderWidth: 2,
        borderColor: '#D1D5DB',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
        backgroundColor: '#fff'
    },
    checkboxCompleted: {
        backgroundColor: '#2563EB',
        borderColor: '#2563EB',
    },
    checklistInput: {
        flex: 1,
        fontSize: 16,
        color: '#374151',
        borderBottomWidth: 1,
        borderBottomColor: '#E5E7EB',
        paddingVertical: 4,
    },
    checklistInputCompleted: {
        textDecorationLine: 'line-through',
        color: '#9CA3AF',
    },
    addButton: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 10,
        padding: 6,
    },
    addText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#4B5563',
        marginLeft: 6
    },
    removeButton: {
        padding: 4,
        marginLeft: 8,
    },
    priorityButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#D1D5DB',
        marginRight: 10,
    },
    priorityButtonSelected: {
        backgroundColor: '#2563EB',
        borderColor: '#2563EB',
    },
    priorityButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#374151',
    },
    priorityButtonTextSelected: {
        color: '#fff',
    },
    footer: {
        backgroundColor: '#fff',
        paddingHorizontal: 20,
        paddingTop: 10,
        borderTopWidth: 1,
        borderTopColor: '#E5E7EB',
    },
    createButton: {
        backgroundColor: '#2563EB',
        padding: 16,
        borderRadius: 12,
        alignItems: 'center',
    },
    createButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
});

export default TaskDetailsScreen;