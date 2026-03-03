
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Modal, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { db, auth } from '../firebase';
import { collection, getDocs, query, where, doc, deleteDoc } from 'firebase/firestore';

const ManageTeamsScreen = () => {
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const [teams, setTeams] = useState([]);
    const [modalVisible, setModalVisible] = useState(false);
    const [teamToDelete, setTeamToDelete] = useState(null);
    const [isDeleting, setIsDeleting] = useState(false);

    useEffect(() => {
        const fetchTeams = async () => {
            const currentUser = auth.currentUser;
            if (currentUser) {
                const teamsRef = collection(db, 'teams');
                const q = query(teamsRef, where("creatorId", "==", currentUser.uid));
                const querySnapshot = await getDocs(q);
                const userTeams = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                setTeams(userTeams);
            }
        };
        fetchTeams();
    }, []);

    const openDeleteModal = (teamId, teamName) => {
        setTeamToDelete({ id: teamId, name: teamName });
        setModalVisible(true);
    };

    const handleDeleteTeam = async () => {
        if (!teamToDelete) return;
        setIsDeleting(true);
        try {
            await deleteDoc(doc(db, "teams", teamToDelete.id));
            setTeams(prevTeams => prevTeams.filter(team => team.id !== teamToDelete.id));
            setModalVisible(false);
            setTeamToDelete(null);
        } catch (error) {
            console.error("Error deleting team: ", error);
        } finally {
            setIsDeleting(false);
        }
    };

    return (
        <View style={{ flex: 1, backgroundColor: '#F9FAFB' }}>
            <View style={[styles.header, { paddingTop: insets.top }]}>
                <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
                    <MaterialIcons name="arrow-back" size={24} color="#1F2937" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Manage Teams</Text>
            </View>
            <ScrollView 
                style={styles.scrollView}
                contentContainerStyle={{ paddingBottom: insets.bottom + 20 }}
            >
                <View style={styles.teamsList}>
                    {teams.map(team => (
                        <View key={team.id} style={styles.teamListItem}>
                            <View style={styles.teamInfo}>
                                <Text style={styles.teamName}>{team.name}</Text>
                                <Text style={styles.teamCreator}>Created by {team.creator}</Text>
                            </View>
                            <TouchableOpacity 
                                style={styles.deleteButton} 
                                onPress={() => openDeleteModal(team.id, team.name)}
                            >
                                <MaterialIcons name="delete-outline" size={22} color="#EF4444" />
                            </TouchableOpacity>
                        </View>
                    ))}
                </View>
            </ScrollView>

            <Modal
                animationType="fade"
                transparent={true}
                visible={modalVisible}
                onRequestClose={() => setModalVisible(false)}
            >
                <View style={styles.modalBackdrop}>
                    <View style={styles.modalView}>
                        <View style={styles.modalIconContainer}>
                            <MaterialIcons name="delete-forever" size={32} color="#EF4444" />
                        </View>
                        <Text style={styles.modalTitle}>Delete Team</Text>
                        <Text style={styles.modalText}>
                            Are you sure you want to delete the team '{teamToDelete?.name}'? This will permanently delete the team and all its data. This action cannot be undone.
                        </Text>
                        
                        <View style={styles.modalActions}>
                            <TouchableOpacity 
                                style={[styles.button, styles.cancelButton]} 
                                onPress={() => setModalVisible(false)}
                                disabled={isDeleting}
                            >
                                <Text style={[styles.buttonText, styles.cancelButtonText]}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity 
                                style={[styles.button, styles.deleteConfirmButton]} 
                                onPress={handleDeleteTeam}
                                disabled={isDeleting}
                            >
                                {isDeleting ? (
                                    <ActivityIndicator size="small" color="#fff" />
                                ) : (
                                    <Text style={[styles.buttonText, styles.deleteButtonText]}>Delete</Text>
                                )}
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
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
        zIndex: 1,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#1F2937',
    },
    scrollView: {
        flex: 1,
    },
    teamsList: {
        padding: 16,
        gap: 12,
    },
    teamListItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: 'white',
        padding: 16,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#E5E7EB',
    },
    teamInfo: {
        flex: 1,
    },
    teamName: {
        fontSize: 16,
        fontWeight: '600',
        color: '#1F2937',
    },
    teamCreator: {
        fontSize: 13,
        color: '#6B7280',
        marginTop: 4,
    },
    deleteButton: {
        padding: 8,
        marginLeft: 12,
        borderRadius: 20,
        backgroundColor: '#FEE2E2'
    },
    modalBackdrop: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(17, 24, 39, 0.6)',
    },
    modalView: {
        margin: 20,
        backgroundColor: 'white',
        borderRadius: 16,
        padding: 24,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.25,
        shadowRadius: 4,
        elevation: 5,
        width: '90%',
    },
    modalIconContainer: {
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: '#FEE2E2',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: '#1F2937',
        marginBottom: 8,
    },
    modalText: {
        marginBottom: 24,
        textAlign: 'center',
        fontSize: 14,
        lineHeight: 20,
        color: '#4B5563',
    },
    modalActions: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        width: '100%',
    },
    button: {
        borderRadius: 12,
        paddingVertical: 14,
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        marginHorizontal: 6,
    },
    cancelButton: {
        backgroundColor: '#F3F4F6',
        borderWidth: 1,
        borderColor: '#E5E7EB',
    },
    deleteConfirmButton: {
        backgroundColor: '#EF4444',
    },
    buttonText: {
        fontSize: 16,
        fontWeight: '600',
    },
    cancelButtonText: {
        color: '#374151',
    },
    deleteButtonText: {
        color: '#fff',
    },
});

export default ManageTeamsScreen;
