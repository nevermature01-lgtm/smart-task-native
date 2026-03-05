import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Alert, ActivityIndicator, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { auth, db } from '../firebase';
import { onAuthStateChanged, updateProfile, deleteUser } from 'firebase/auth';
import { doc, getDoc, updateDoc, deleteDoc } from 'firebase/firestore';

const ProfileDetailsScreen = () => {
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const [user, setUser] = useState(null);
    const [userName, setUserName] = useState('');
    const [email, setEmail] = useState('');
    const [isEditing, setIsEditing] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [isUpdating, setIsUpdating] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
            if (currentUser) {
                setUser(currentUser);
                setEmail(currentUser.email);
                // Fetch user name from Firestore first
                const userDocRef = doc(db, 'users', currentUser.uid);
                const userDoc = await getDoc(userDocRef);
                if (userDoc.exists()) {
                    setUserName(userDoc.data().firstName + ' ' + userDoc.data().lastName);
                } else {
                    // Fallback to displayName from auth
                    setUserName(currentUser.displayName || '');
                }
            } else {
                router.replace('/login');
            }
            setIsLoading(false);
        });

        return () => unsubscribe();
    }, []);

    const handleUpdateProfile = async () => {
        if (!userName.trim()) {
            Alert.alert('Invalid Name', 'Name cannot be empty.');
            return;
        }

        setIsUpdating(true);
        try {
            // Update Firebase Auth profile
            await updateProfile(user, { displayName: userName });

            // Update Firestore document
            const userDocRef = doc(db, 'users', user.uid);
            const nameParts = userName.split(' ');
            const firstName = nameParts[0];
            const lastName = nameParts.slice(1).join(' ');
            await updateDoc(userDocRef, { 
                firstName: firstName,
                lastName: lastName
            });

            Alert.alert('Success', 'Your profile has been updated.');
            setIsEditing(false);
        } catch (error) {
            console.error("Error updating profile: ", error);
            Alert.alert('Error', 'Failed to update your profile. Please try again.');
        } finally {
            setIsUpdating(false);
        }
    };

    const handleDeleteAccount = () => {
        Alert.alert(
            'Delete Account',
            'Are you sure you want to delete your account? This action is irreversible.',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: async () => {
                        setIsDeleting(true);
                        try {
                            // Delete user document from Firestore
                            await deleteDoc(doc(db, 'users', user.uid));
                            
                            // Delete user from Firebase Auth
                            await deleteUser(user);
                            
                            router.replace('/login');
                        } catch (error) {
                            console.error("Error deleting account: ", error);
                            Alert.alert('Error', 'Failed to delete your account. Please re-authenticate and try again.');
                            setIsDeleting(false);
                        }
                    },
                },
            ]
        );
    };

    if (isLoading) {
        return (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                <ActivityIndicator size="large" color="#6366F1" />
            </View>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
             <KeyboardAvoidingView 
                behavior={Platform.OS === "ios" ? "padding" : "height"} 
                style={{flex: 1}}
            > 
                <View style={[styles.header, { paddingTop: insets.top }]}>
                    <TouchableOpacity style={styles.headerButton} onPress={() => router.back()}>
                        <Feather name="chevron-left" size={24} color="#1F2937" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Profile Details</Text>
                    <View style={{width: 36}} />
                </View>

                <ScrollView contentContainerStyle={styles.mainContent}>
                    <View style={styles.form}>
                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Name</Text>
                            <View style={styles.inputContainer}>
                                <TextInput
                                    style={styles.input}
                                    value={userName}
                                    onChangeText={setUserName}
                                    editable={isEditing}
                                    placeholder="Enter your full name"
                                />
                                <TouchableOpacity onPress={() => setIsEditing(!isEditing)} style={styles.editIcon}>
                                    <Feather name={isEditing ? 'x' : 'edit-2'} size={20} color="#6B7280" />
                                </TouchableOpacity>
                            </View>
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Email Address</Text>
                            <TextInput
                                style={[styles.input, styles.disabledInput]}
                                value={email}
                                editable={false}
                            />
                        </View>

                        {isEditing && (
                            <TouchableOpacity style={[styles.button, styles.updateButton]} onPress={handleUpdateProfile} disabled={isUpdating}>
                                {isUpdating ? (
                                    <ActivityIndicator color="white" />
                                ) : (
                                    <Text style={styles.buttonText}>Update Profile</Text>
                                )}
                            </TouchableOpacity>
                        )}
                    </View>

                    <View style={styles.dangerZone}>
                        <Text style={styles.dangerZoneTitle}>Danger Zone</Text>
                        <TouchableOpacity style={[styles.button, styles.deleteButton]} onPress={handleDeleteAccount} disabled={isDeleting}>
                            {isDeleting ? (
                                <ActivityIndicator color="white" />
                            ) : (
                                <Text style={styles.buttonText}>Delete My Account</Text>
                            )}
                        </TouchableOpacity>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F9FAFB' },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingBottom: 12,
        backgroundColor: 'white',
        borderBottomWidth: 1,
        borderBottomColor: '#E5E7EB',
    },
    headerButton: {
        width: 36, height: 36, borderRadius: 18, justifyContent: 'center',
        alignItems: 'center', borderWidth: 1, borderColor: '#E5E7EB',
    },
    headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#1F2937' },
    mainContent: { padding: 20 },
    form: {
        backgroundColor: 'white',
        borderRadius: 12,
        padding: 20,
        marginBottom: 30,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05, shadowRadius: 5, elevation: 3,
    },
    inputGroup: { marginBottom: 20 },
    label: { fontSize: 14, fontWeight: '600', color: '#374151', marginBottom: 8 },
    inputContainer: { flexDirection: 'row', alignItems: 'center' },
    input: {
        flex: 1,
        backgroundColor: '#F9FAFB', borderWidth: 1, borderColor: '#E5E7EB',
        borderRadius: 8, paddingVertical: 12, paddingHorizontal: 16,
        fontSize: 14, color: '#1F2937',
    },
    disabledInput: { backgroundColor: '#F3F4F6', color: '#6B7280' },
    editIcon: { position: 'absolute', right: 12 },
    button: { paddingVertical: 16, borderRadius: 12, alignItems: 'center' },
    updateButton: { backgroundColor: '#6366F1' },
    deleteButton: { backgroundColor: '#EF4444' },
    buttonText: { color: 'white', fontSize: 16, fontWeight: 'bold' },
    dangerZone: {
        borderTopWidth: 1, borderTopColor: '#E5E7EB', paddingTop: 20,
    },
    dangerZoneTitle: {
        fontSize: 16, fontWeight: 'bold', color: '#EF4444',
        marginBottom: 10, textAlign: 'center',
    },
});

export default ProfileDetailsScreen;
