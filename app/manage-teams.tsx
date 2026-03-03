
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Modal, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { db, auth } from '../firebase';
import { collection, getDocs, query, where, doc, deleteDoc, getDoc } from 'firebase/firestore';

const ManageTeamsScreen = () => {
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const [teams, setTeams] = useState([]);
    const [deleteModalVisible, setDeleteModalVisible] = useState(false);
    const [leaveModalVisible, setLeaveModalVisible] = useState(false);
    const [teamToAction, setTeamToAction] = useState(null);
    const [isDeleting, setIsDeleting] = useState(false);
    const [isLeaving, setIsLeaving] = useState(false);

    useEffect(() => {
        const fetchTeams = async () => {
            const currentUser = auth.currentUser;
            if (currentUser) {
                const teamMembersRef = collection(db, 'team_members');
                const q = query(teamMembersRef, where("userId", "==", currentUser.uid));
                const querySnapshot = await getDocs(q);
                
                const teamPromises = querySnapshot.docs.map(async (memberDoc) => {
                    const teamId = memberDoc.data().teamId;
                    const teamDocRef = doc(db, 'teams', teamId);
                    const teamDoc = await getDoc(teamDocRef);
                    if (teamDoc.exists()) {
                        return { id: teamDoc.id, ...teamDoc.data() };
                    }
                    return null;
                });

                const userTeams = (await Promise.all(teamPromises)).filter(team => team !== null);
                setTeams(userTeams);
            }
        };
        fetchTeams();
    }, []);

    const openDeleteModal = (team) => {
        setTeamToAction(team);
        setDeleteModalVisible(true);
    };

    const openLeaveModal = (team) => {
        setTeamToAction(team);
        setLeaveModalVisible(true);
    };

    const handleDeleteTeam = async () => {
        if (!teamToAction) return;
        setIsDeleting(true);
        try {
            const teamId = teamToAction.id;
            const membersRef = collection(db, 'team_members');
            const q = query(membersRef, where("teamId", "==", teamId));
            const membersSnapshot = await getDocs(q);
            const deletePromises = membersSnapshot.docs.map(d => deleteDoc(d.ref));
            await Promise.all(deletePromises);

            await deleteDoc(doc(db, "teams", teamId));
            setTeams(prevTeams => prevTeams.filter(team => team.id !== teamId));
            setDeleteModalVisible(false);
            setTeamToAction(null);
        } catch (error) {
            console.error("Error deleting team: ", error);
        } finally {
            setIsDeleting(false);
        }
    };

    const handleLeaveTeam = async () => {
        if (!teamToAction) return;
        setIsLeaving(true);
        const currentUser = auth.currentUser;
        try {
            const teamId = teamToAction.id;
            const membersRef = collection(db, 'team_members');
            const q = query(membersRef, where("teamId", "==", teamId), where("userId", "==", currentUser.uid));
            const memberSnapshot = await getDocs(q);

            if (!memberSnapshot.empty) {
                const memberDocId = memberSnapshot.docs[0].id;
                await deleteDoc(doc(db, "team_members", memberDocId));
                setTeams(prevTeams => prevTeams.filter(team => team.id !== teamId));
            }
            
            setLeaveModalVisible(false);
            setTeamToAction(null);
        } catch (error) {
            console.error("Error leaving team: ", error);
        } finally {
            setIsLeaving(false);
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
                            {team.creatorId === auth.currentUser.uid ? (
                                <TouchableOpacity 
                                    style={styles.deleteButton} 
                                    onPress={() => openDeleteModal(team)}
                                >
                                    <MaterialIcons name="delete-outline" size={22} color="#EF4444" />
                                </TouchableOpacity>
                            ) : (
                                <TouchableOpacity 
                                    style={styles.leaveButton} 
                                    onPress={() => openLeaveModal(team)}
                                >
                                    <MaterialIcons name="exit-to-app" size={22} color="#4B5563" />
                                </TouchableOpacity>
                            )}
                        </View>
                    ))}
                </View>
            </ScrollView>

            {/* Delete Team Modal */}
            <Modal
                animationType="fade"
                transparent={true}
                visible={deleteModalVisible}
                onRequestClose={() => setDeleteModalVisible(false)}
            >
                <View style={styles.modalBackdrop}>
                    <View style={styles.modalView}>
                        <View style={styles.modalIconContainer}>
                            <MaterialIcons name="delete-forever" size={32} color="#EF4444" />
                        </View>
                        <Text style={styles.modalTitle}>Delete Team</Text>
                        <Text style={styles.modalText}>
                            Are you sure you want to delete the team '{teamToAction?.name}'? This action cannot be undone.
                        </Text>
                        <View style={styles.modalActions}>
                            <TouchableOpacity 
                                style={[styles.button, styles.cancelButton]} 
                                onPress={() => setDeleteModalVisible(false)}
                                disabled={isDeleting}
                            >
                                <Text style={[styles.buttonText, styles.cancelButtonText]}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity 
                                style={[styles.button, styles.deleteConfirmButton]} 
                                onPress={handleDeleteTeam}
                                disabled={isDeleting}
                            >
                                {isDeleting ? <ActivityIndicator size="small" color="#fff" /> : <Text style={[styles.buttonText, styles.deleteButtonText]}>Delete</Text>}
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>

            {/* Leave Team Modal */}
            <Modal
                animationType="fade"
                transparent={true}
                visible={leaveModalVisible}
                onRequestClose={() => setLeaveModalVisible(false)}
            >
                <View style={styles.modalBackdrop}>
                    <View style={styles.modalView}>
                        <View style={[styles.modalIconContainer, {backgroundColor: '#E5E7EB'}]}>
                            <MaterialIcons name="exit-to-app" size={32} color="#4B5563" />
                        </View>
                        <Text style={styles.modalTitle}>Leave Team</Text>
                        <Text style={styles.modalText}>
                            Are you sure you want to leave the team '{teamToAction?.name}'?
                        </Text>
                        <View style={styles.modalActions}>
                            <TouchableOpacity 
                                style={[styles.button, styles.cancelButton]} 
                                onPress={() => setLeaveModalVisible(false)}
                                disabled={isLeaving}
                            >
                                <Text style={[styles.buttonText, styles.cancelButtonText]}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity 
                                style={[styles.button, styles.leaveConfirmButton]} 
                                onPress={handleLeaveTeam}
                                disabled={isLeaving}
                            >
                                {isLeaving ? <ActivityIndicator size="small" color="#fff" /> : <Text style={[styles.buttonText, styles.deleteButtonText]}>Leave</Text>}
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
    leaveButton: {
        padding: 8,
        marginLeft: 12,
        borderRadius: 20,
        backgroundColor: '#E5E7EB'
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
    leaveConfirmButton: {
        backgroundColor: '#374151',
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
