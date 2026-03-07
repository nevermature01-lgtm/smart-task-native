import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput, KeyboardAvoidingView, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { MaterialIcons, FontAwesome } from '@expo/vector-icons';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';

const TaskDetailsScreen = () => {
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const { taskId } = useLocalSearchParams();
    const [task, setTask] = useState(null);
    const [taskSteps, setTaskSteps] = useState([]);

    useEffect(() => {
        const fetchTask = async () => {
            const docRef = doc(db, 'tasks', taskId);
            const docSnap = await getDoc(docRef);
            if (docSnap.exists()) {
                const taskData = docSnap.data();
                setTask({ id: docSnap.id, ...taskData });
                if (taskData.steps) {
                    setTaskSteps(taskData.steps.map(step => ({ ...step, completed: step.completed || false })));
                }
            }
        };

        if (taskId) {
            fetchTask();
        }
    }, [taskId]);

    const toggleStepCompletion = async (index) => {
        const newSteps = [...taskSteps];
        newSteps[index].completed = !newSteps[index].completed;
        setTaskSteps(newSteps);

        const taskRef = doc(db, 'tasks', taskId);
        await updateDoc(taskRef, {
            steps: newSteps
        });
    };

    if (!task) {
        return null; // Or a loading indicator
    }

    const handleBack = () => {
        if (router.canGoBack()) {
            router.back();
        } else {
            router.replace('/home');
        }
    };

    const taskCreationDate = task.createdAt?.toDate();
    let formattedTaskDateTime = '';
    let formattedTaskDateOnly = '';

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
        formattedTaskDateOnly = `${day}-${month}-${year}`;
    }

    return (
        <View style={{ flex: 1, backgroundColor: '#fff' }}>
            <View style={[styles.header, { paddingTop: insets.top }]}>
                <TouchableOpacity style={styles.backButton} onPress={handleBack}>
                    <MaterialIcons name="arrow-back" size={24} color="#1F2937" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Task details</Text>
            </View>
            <KeyboardAvoidingView
                style={{ flex: 1 }}
                behavior={Platform.OS === "ios" ? "padding" : "height"}
                keyboardVerticalOffset={0}
            >
                <ScrollView
                    style={styles.container}
                    showsVerticalScrollIndicator={false}
                    bounces={true}
                    overScrollMode="never"
                    scrollEventThrottle={16}
                    decelerationRate="fast"
                    contentContainerStyle={{ flexGrow: 1, paddingBottom: 40 }}
                    keyboardShouldPersistTaps="handled"
                >
                    <View style={styles.taskInfoContainer}>
                        <View style={styles.taskTitleContainer}>
                            <Text style={styles.taskTitle}>• {task.name}</Text>
                            <View style={styles.priorityContainer}>
                                <TouchableOpacity style={[styles.actionButton, styles.deleteButton]}>
                                    <MaterialIcons name="delete" size={24} color="#fff" />
                                </TouchableOpacity>
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
                        <Text style={styles.assignedToTitle}>Assigned to:</Text>
                        <View style={styles.assigneeContainer}>
                            <View style={styles.assignee}>
                                <Text style={styles.assigneeName}>{task.assignedByName}</Text>
                            </View>
                            <MaterialIcons name="arrow-downward" size={24} color="#6B7280" style={styles.arrow} />
                            <View style={styles.assignee}>
                                <Text style={styles.assigneeName}>{task.assignedToName}</Text>
                            </View>
                        </View>
                    </View>

                    {taskSteps.length > 0 && (
                        <View style={styles.stepsContainer}>
                            <Text style={styles.stepsTitle}>Steps</Text>
                            {taskSteps.map((step, index) => (
                                <TouchableOpacity
                                    key={index}
                                    style={styles.stepItem}
                                    onPress={() => toggleStepCompletion(index)}
                                >
                                    <Text style={[styles.stepText, step.completed && styles.stepTextCompleted]}>
                                        {index + 1}. {step.text}
                                    </Text>
                                    <View style={[styles.checkbox, step.completed && styles.checkboxCompleted]}>
                                        {step.completed && (
                                            <MaterialIcons name="check" size={18} color="white" />
                                        )}
                                    </View>
                                </TouchableOpacity>
                            ))}
                        </View>
                    )}

                    <View style={styles.seenByContainer}>
                        <Text style={styles.seenByTitle}>Seen by:-</Text>
                        <Text style={styles.seenByEmpty}>-- Empty --</Text>
                    </View>

                    <TouchableOpacity style={styles.swipeToCompleteButton}>
                        <Text style={styles.swipeToCompleteText}>Swipe to Complete</Text>
                    </TouchableOpacity>
                </ScrollView>

                <View style={[styles.footer, { paddingBottom: insets.bottom }]}>
                    <TextInput style={styles.messageInput} placeholder="Message" />
                    <TouchableOpacity>
                        <MaterialIcons name="send" size={24} color="#000" />
                    </TouchableOpacity>
                </View>
            </KeyboardAvoidingView>
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
    assignedToTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        marginBottom: 8,
    },
    assigneeContainer: {
        alignItems: 'flex-start',
    },
    assignee: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 4,
        width: '100%',
    },
    assigneeName: {
        fontSize: 16,
        marginLeft: 16,
    },
    assigneeDate: {
        fontSize: 14,
        color: '#6B7280',
    },
    arrow: {
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
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 12,
        marginLeft: 16,
    },
    stepText: {
        fontSize: 16,
        color: '#374151',
        flex: 1,
    },
    stepTextCompleted: {
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
    seenByContainer: {
        marginBottom: 16,
    },
    seenByTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        marginBottom: 8,
    },
    seenByEmpty: {
        fontStyle: 'italic',
        color: '#6B7280',
    },
    swipeToCompleteButton: {
        backgroundColor: '#E5E7EB',
        padding: 16,
        borderRadius: 5,
        alignItems: 'center',
        marginBottom: 16,
    },
    swipeToCompleteText: {
        fontSize: 16,
        fontWeight: 'bold',
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

export default TaskDetailsScreen;
