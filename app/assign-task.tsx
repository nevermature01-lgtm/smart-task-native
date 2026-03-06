import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator, TextInput } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Feather, MaterialIcons } from '@expo/vector-icons';
import { db, auth } from '../firebase';
import { collection, getDocs, query, where, doc, getDoc, updateDoc, arrayUnion } from 'firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';

const MemberCard = ({ member, onPress }) => (
    <TouchableOpacity onPress={onPress} style={styles.memberCard}>
        <View style={styles.avatar}>
            <Text style={styles.avatarText}>{member.name.charAt(0).toUpperCase()}</Text>
        </View>
        <Text style={styles.memberName}>{member.name}</Text>
    </TouchableOpacity>
);

const LockedView = () => (
    <View style={styles.lockedContainer}>
        <Feather name="lock" size={64} color="#9CA3AF" />
        <Text style={styles.lockedTitle}>Permission Denied</Text>
        <Text style={styles.lockedSubtitle}>You don't have the required permissions to assign tasks.</Text>
    </View>
);

const AssignTaskScreen = () => {
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const { taskId } = useLocalSearchParams();
    const [teamMembers, setTeamMembers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [currentUserRole, setCurrentUserRole] = useState('member');
    const [teamId, setTeamId] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        const fetchTeamData = async () => {
            try {
                const activeAccountString = await AsyncStorage.getItem('activeAccount');
                const currentUser = auth.currentUser;

                if (activeAccountString && currentUser) {
                    const activeAccount = JSON.parse(activeAccountString);
                    if (activeAccount.type === 'team') {
                        setTeamId(activeAccount.id);
                        const teamMembersRef = collection(db, 'team_members');
                        const q = query(teamMembersRef, where("teamId", "==", activeAccount.id));
                        const querySnapshot = await getDocs(q);
                        
                        const members = [];
                        let userRole = 'member';

                        for (const teamMemberDoc of querySnapshot.docs) {
                            const memberData = teamMemberDoc.data();
                            const userId = memberData.userId;

                            if (userId === currentUser.uid) {
                                userRole = memberData.role;
                            }

                            const userDocRef = doc(db, 'users', userId);
                            const userDoc = await getDoc(userDocRef);
                            if (userDoc.exists()) {
                                members.push({ id: userDoc.id, name: userDoc.data().firstName, role: memberData.role });
                            }
                        }
                        
                        members.sort((a, b) => {
                            if (a.role === 'admin' && b.role !== 'admin') return -1;
                            if (a.role !== 'admin' && b.role === 'admin') return 1;
                            return a.name.localeCompare(b.name);
                        });

                        setTeamMembers(members);
                        setCurrentUserRole(userRole);
                    } else {
                        setCurrentUserRole('member'); 
                    }
                }
            } catch (error) {
                console.error("Error fetching team members: ", error);
            } finally {
                setLoading(false);
            }
        };

        fetchTeamData();
    }, []);

    const handleMemberPress = async (member) => {
        if (taskId) {
            const taskRef = doc(db, 'tasks', taskId);
            const taskSnap = await getDoc(taskRef);
            if (taskSnap.exists()) {
                const taskData = taskSnap.data();
                const personBeingReplaced = { id: taskData.assignedToId, name: taskData.assignedToName };
    
                await updateDoc(taskRef, {
                    assignedToId: member.id,
                    assignedToName: member.name,
                    assignmentChain: arrayUnion(personBeingReplaced)
                });
            }
            router.back();
        } else {
            router.push({
                pathname: '/task-details',
                params: { memberId: member.id, memberName: member.name, teamId: teamId }
            });
        }
    };

    const filteredMembers = teamMembers.filter(member =>
        member.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const renderContent = () => {
        if (loading) {
            return <ActivityIndicator size="large" color="#2563EB" style={{ marginTop: 20 }}/>;
        }

        if (currentUserRole !== 'admin') {
            return <LockedView />;
        }

        return (
             <ScrollView style={styles.content} keyboardShouldPersistTaps='handled'>
                <View style={styles.sectionHeader}>
                    <Text style={styles.title}>Assign to:</Text>
                    <TouchableOpacity style={styles.manageMembersLink} onPress={() => router.push('/manage-members')}>
                        <MaterialIcons name="settings" size={16} color="#4B5563" style={{ marginRight: 4 }} />
                        <Text style={styles.manageMembersLinkText}>Manage members</Text>
                    </TouchableOpacity>
                </View>
                <View style={styles.searchContainer}>
                    <Feather name="search" size={20} color="#9CA3AF" style={styles.searchIcon} />
                    <TextInput
                        style={styles.searchInput}
                        placeholder="Search members..."
                        placeholderTextColor="#9CA3AF"
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                    />
                </View>
                {filteredMembers.map(member => (
                    <MemberCard 
                        key={member.id} 
                        member={member} 
                        onPress={() => handleMemberPress(member)}
                    />
                ))}
            </ScrollView>
        );
    };

    return (
        <View style={{ flex: 1, backgroundColor: '#F9FAFB' }}>
            <View style={[styles.header, { paddingTop: insets.top }]}>
                <TouchableOpacity style={styles.headerButton} onPress={() => router.back()}>
                    <Feather name="chevron-left" size={24} color="#1F2937" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Assign Task</Text>
                <View style={{width: 36}} />
            </View>
            {renderContent()}
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
        backgroundColor: '#FFFFFF',
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
        fontSize: 20,
        fontWeight: 'bold',
        color: '#1F2937',
    },
    content: {
        flex: 1,
        padding: 20,
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 10,
    },
    title: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#1F2937',
    },
    manageMembersLink: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    manageMembersLinkText: {
        color: '#4B5563',
        fontSize: 12,
        fontWeight: '600',
    },
    memberCard: {
        flexDirection: 'row',
        alignItems: 'center',
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
    lockedContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
        backgroundColor: '#F9FAFB'
    },
    lockedTitle: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#1F2937',
        marginTop: 16,
        textAlign: 'center'
    },
    lockedSubtitle: {
        fontSize: 16,
        color: '#6B7280',
        marginTop: 8,
        textAlign: 'center',
        lineHeight: 24,
    },
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'white',
        borderRadius: 12,
        paddingHorizontal: 12,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: '#E5E7EB',
    },
    searchIcon: {
        marginRight: 8,
    },
    searchInput: {
        flex: 1,
        height: 44,
        fontSize: 16,
        color: '#1F2937',
    },
});

export default AssignTaskScreen;
