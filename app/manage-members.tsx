import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator, Modal } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { db, auth } from '../firebase';
import { collection, getDocs, query, where, doc, getDoc, updateDoc, deleteDoc } from 'firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';

const MemberCard = ({ member, onMorePress, currentUserId }) => (
    <View style={styles.memberCard}>
        <View style={{flexDirection: 'row', alignItems: 'center', flex: 1}}>
            <View style={styles.avatar}>
                <Text style={styles.avatarText}>{member.name.charAt(0).toUpperCase()}</Text>
            </View>
            <Text style={styles.memberName}>{member.name}</Text>
        </View>
        {member.role === 'admin' && (
            <MaterialCommunityIcons name="crown" size={24} color="#FFD700" style={{marginRight: 8}} />
        )}
        {onMorePress && member.id !== currentUserId && (
             <TouchableOpacity onPress={() => onMorePress(member)} style={styles.moreButton}>
                <Feather name="more-vertical" size={24} color="#6B7280" />
            </TouchableOpacity>
        )}
    </View>
);

const ConfirmationModal = ({ visible, onCancel, onConfirm, title, description, confirmText, confirmColor }) => {
    if(!visible) return null;
    return (
        <Modal
            animationType="fade"
            transparent={true}
            visible={visible}
            onRequestClose={onCancel}
        >
            <View style={styles.confirmationOverlay}>
                <View style={styles.confirmationView}>
                    <Text style={styles.confirmationTitle}>{title}</Text>
                    <Text style={styles.confirmationDescription}>{description}</Text>
                    <View style={styles.confirmationButtons}>
                        <TouchableOpacity style={[styles.confirmationButton, styles.cancelButton]} onPress={onCancel}>
                            <Text style={styles.cancelButtonText}>Cancel</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={[styles.confirmationButton, {backgroundColor: confirmColor || '#EF4444'}]} onPress={onConfirm}>
                            <Text style={styles.confirmButtonText}>{confirmText}</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </Modal>
    )
}

const ManageMembersScreen = () => {
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const [teamMembers, setTeamMembers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [currentUser, setCurrentUser] = useState(null);
    const [activeTeamId, setActiveTeamId] = useState(null);
    const [modalVisible, setModalVisible] = useState(false);
    const [selectedMember, setSelectedMember] = useState(null);
    const [confirmationVisible, setConfirmationVisible] = useState(false);
    const [actionToConfirm, setActionToConfirm] = useState(null);

    useEffect(() => {
        const fetchCurrentUser = async () => {
            const user = auth.currentUser;
            if (user) {
                const userDocRef = doc(db, 'users', user.uid);
                const userDoc = await getDoc(userDocRef);
                if (userDoc.exists()) {
                    setCurrentUser({id: user.uid, ...userDoc.data()});
                }
            }
        };
        fetchCurrentUser();
        
        const fetchTeamMembers = async () => {
            try {
                const activeAccountString = await AsyncStorage.getItem('activeAccount');
                if (activeAccountString) {
                    const activeAccount = JSON.parse(activeAccountString);
                     if (activeAccount.type === 'team') {
                        setActiveTeamId(activeAccount.id);
                        const teamMembersRef = collection(db, 'team_members');
                        const q = query(teamMembersRef, where("teamId", "==", activeAccount.id));
                        const querySnapshot = await getDocs(q);
                        const members = [];
                        let userRole = 'member';
                        for (const teamMemberDoc of querySnapshot.docs) {
                            const memberData = teamMemberDoc.data();
                            if(memberData.userId === auth.currentUser.uid) {
                                userRole = memberData.role;
                            }
                            const userDocRef = doc(db, 'users', memberData.userId);
                            const userDoc = await getDoc(userDocRef);
                            if (userDoc.exists()) {
                                members.push({ 
                                    id: userDoc.id, 
                                    name: userDoc.data().firstName, 
                                    role: memberData.role 
                                });
                            }
                        }
                        members.sort((a, b) => {
                            if (a.role === 'admin' && b.role !== 'admin') return -1;
                            if (a.role !== 'admin' && b.role === 'admin') return 1;
                            return 0;
                        });
                        setTeamMembers(members);
                         setCurrentUser(prev => ({...prev, role: userRole}));
                    }
                }
            } catch (error) {
                console.error("Error fetching team members: ", error);
            } finally {
                setLoading(false);
            }
        };

        fetchTeamMembers();
    }, []);

    const handleMorePress = (member) => {
        setSelectedMember(member);
        setModalVisible(true);
    };

    const prepareConfirmation = (action) => {
        setActionToConfirm(action);
        setModalVisible(false);
        setConfirmationVisible(true);
    }

    const onConfirmAction = async () => {
        if(actionToConfirm === 'makeAdmin') await handleMakeAdmin();
        if(actionToConfirm === 'removeAdmin') await handleRemoveAdmin();
        if(actionToConfirm === 'removeMember') await handleRemoveMember();
        
        setConfirmationVisible(false);
        setSelectedMember(null);
        setActionToConfirm(null);
    }

    const onCancelConfirmation = () => {
        setConfirmationVisible(false);
        setSelectedMember(null);
        setActionToConfirm(null);
    }

    const handleMakeAdmin = async () => {
        if (!selectedMember) return;
        const membersRef = collection(db, 'team_members');
        const q = query(membersRef, where("teamId", "==", activeTeamId), where("userId", "==", selectedMember.id));
        const memberSnapshot = await getDocs(q);
        if(!memberSnapshot.empty) {
            const memberDocRef = memberSnapshot.docs[0].ref;
            await updateDoc(memberDocRef, { role: 'admin' });
            setTeamMembers(prev => prev.map(m => m.id === selectedMember.id ? {...m, role: 'admin'} : m).sort((a, b) => {
                if (a.role === 'admin' && b.role !== 'admin') return -1;
                if (a.role !== 'admin' && b.role === 'admin') return 1;
                return 0;
            }));
        }
    };

    const handleRemoveAdmin = async () => {
        if (!selectedMember) return;
        const membersRef = collection(db, 'team_members');
        const q = query(membersRef, where("teamId", "==", activeTeamId), where("userId", "==", selectedMember.id));
        const memberSnapshot = await getDocs(q);
        if(!memberSnapshot.empty) {
            const memberDocRef = memberSnapshot.docs[0].ref;
            await updateDoc(memberDocRef, { role: 'member' });
            setTeamMembers(prev => prev.map(m => m.id === selectedMember.id ? {...m, role: 'member'} : m).sort((a, b) => {
                if (a.role === 'admin' && b.role !== 'admin') return -1;
                if (a.role !== 'admin' && b.role === 'admin') return 1;
                return 0;
            }));
        }
    };

    const handleRemoveMember = async () => {
        if (!selectedMember) return;
        const membersRef = collection(db, 'team_members');
        const q = query(membersRef, where("teamId", "==", activeTeamId), where("userId", "==", selectedMember.id));
        const memberSnapshot = await getDocs(q);
        if(!memberSnapshot.empty) {
            const memberDocRef = memberSnapshot.docs[0].ref;
            await deleteDoc(memberDocRef);
            setTeamMembers(prev => prev.filter(m => m.id !== selectedMember.id));
        }
    };

    const getConfirmationConfig = () => {
        if (!actionToConfirm || !selectedMember) return {};
        switch (actionToConfirm) {
            case 'makeAdmin':
                return {
                    title: 'Make Admin',
                    description: `Are you sure you want to make ${selectedMember.name} an admin?`,
                    confirmText: 'Make Admin',
                    confirmColor: '#2563EB'
                }
            case 'removeAdmin':
                 return {
                    title: 'Remove Admin',
                    description: `Are you sure you want to remove ${selectedMember.name} as an admin?`,
                    confirmText: 'Remove Admin',
                    confirmColor: '#EF4444'
                }
            case 'removeMember':
                 return {
                    title: 'Remove Member',
                    description: `Are you sure you want to remove ${selectedMember.name} from the team?`,
                    confirmText: 'Remove',
                    confirmColor: '#EF4444'
                }
            default: 
                return {};
        }
    }

    return (
        <View style={{ flex: 1, backgroundColor: '#f8f6f6' }}>
            <View style={[styles.header, { paddingTop: insets.top }]}>
                <TouchableOpacity style={styles.headerButton} onPress={() => {
                    if (router.canGoBack()) {
                        router.back();
                    } else {
                        router.replace('/home');
                    }
                }}>
                    <Feather name="chevron-left" size={24} color="#1F2937" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Manage Members</Text>
                <View style={{width: 36}} />
            </View>
            <ScrollView style={styles.content}>
                {loading ? (
                    <ActivityIndicator size="large" color="#2563EB" style={{ marginTop: 20 }}/>
                ) : (
                    teamMembers.map(member => (
                        <MemberCard 
                            key={member.id} 
                            member={member} 
                            currentUserId={currentUser?.id}
                            onMorePress={currentUser?.role === 'admin' ? handleMorePress : null}
                        />
                    ))
                )}
            </ScrollView>
            {selectedMember && (
                 <Modal
                    animationType="slide"
                    transparent={true}
                    visible={modalVisible}
                    onRequestClose={() => {
                        setModalVisible(!modalVisible);
                        setSelectedMember(null);
                    }}
                >
                    <TouchableOpacity style={styles.modalOverlay} onPress={() => { setModalVisible(false); setSelectedMember(null); }}>
                        <View style={styles.modalView}>
                            <Text style={styles.modalTitle}>{selectedMember.name}</Text>
                            {selectedMember.role === 'admin' ? (
                                <TouchableOpacity style={styles.modalButton} onPress={() => prepareConfirmation('removeAdmin')}>
                                    <MaterialCommunityIcons name="crown-off" size={22} color="#1F2937" />
                                    <Text style={styles.modalButtonText}>Remove as Admin</Text>
                                </TouchableOpacity>
                            ) : (
                                <TouchableOpacity style={styles.modalButton} onPress={() => prepareConfirmation('makeAdmin')}>
                                    <MaterialCommunityIcons name="crown-outline" size={22} color="#1F2937" />
                                    <Text style={styles.modalButtonText}>Make Admin</Text>
                                </TouchableOpacity>
                            )}
                            <TouchableOpacity style={[styles.modalButton, {marginTop: 10}]} onPress={() => prepareConfirmation('removeMember')}>
                                <Feather name="user-x" size={22} color="#EF4444" />
                                <Text style={[styles.modalButtonText, {color: '#EF4444'}]}>Remove from Team</Text>
                            </TouchableOpacity>
                             <TouchableOpacity style={[styles.modalButton, {marginTop: 20}]} onPress={() => { setModalVisible(false); setSelectedMember(null); }}>
                                <Text style={styles.modalButtonText}>Cancel</Text>
                            </TouchableOpacity>
                        </View>
                    </TouchableOpacity>
                </Modal>
            )}
            <ConfirmationModal 
                visible={confirmationVisible}
                onCancel={onCancelConfirmation}
                onConfirm={onConfirmAction}
                {...getConfirmationConfig()}
            />
        </View>
    );
};

const styles = StyleSheet.create({
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
        width: 36,
        height: 36,
        borderRadius: 18,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#E5E7EB'
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#1F2937',
    },
    content: {
        flex: 1,
        padding: 20,
    },
    memberCard: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: 'white',
        borderRadius: 16,
        padding: 16,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: 'rgba(0, 0, 0, 0.07)',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 5,
        elevation: 3,
    },
    avatar: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(37, 99, 235, 0.1)',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 15,
    },
    avatarText: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#2563EB',
    },
    memberName: {
        fontSize: 16,
        fontWeight: '600',
        color: '#1F2937',
    },
    moreButton: {
        padding: 8,
    },
    modalOverlay: {
        flex: 1,
        justifyContent: 'flex-end',
        backgroundColor: 'rgba(0,0,0,0.5)',
    },
    modalView: {
        backgroundColor: "#f8f6f6",
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        padding: 35,
        paddingBottom: 40, 
        alignItems: "center",
        shadowColor: "#000",
        shadowOffset: {
            width: 0,
            height: -2
        },
        shadowOpacity: 0.25,
        shadowRadius: 4,
        elevation: 5
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        marginBottom: 25
    },
    modalButton: {
        flexDirection: 'row',
        alignItems: 'center',
        width: '100%',
        paddingVertical: 15,
        paddingHorizontal: 20,
        borderRadius: 12,
        backgroundColor: '#fff',
        borderWidth: 1,
        borderColor: 'rgba(0, 0, 0, 0.07)',
    },
    modalButtonText: {
        marginLeft: 15,
        fontSize: 16,
        fontWeight: '600',
        color: '#1F2937'
    },
    confirmationOverlay: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.6)',
    },
    confirmationView: {
        width: '85%',
        maxWidth: 320,
        backgroundColor: "white",
        borderRadius: 20,
        padding: 24,
        alignItems: "center",
        shadowColor: "#000",
        shadowOffset: {
            width: 0,
            height: 2
        },
        shadowOpacity: 0.25,
        shadowRadius: 4,
        elevation: 5
    },
    confirmationTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#1F2937',
        marginBottom: 8,
    },
    confirmationDescription: {
        fontSize: 14,
        color: '#6B7280',
        textAlign: 'center',
        marginBottom: 24,
    },
    confirmationButtons: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        width: '100%',
    },
    confirmationButton: {
        flex: 1,
        paddingVertical: 12,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
    },
    cancelButton: {
        backgroundColor: '#F3F4F6',
        marginRight: 8,
    },
    cancelButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#4B5563'
    },
    confirmButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#fff'
    }
});

export default ManageMembersScreen;
