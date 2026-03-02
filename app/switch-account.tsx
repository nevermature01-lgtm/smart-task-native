import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Image, TextInput, ActivityIndicator, KeyboardAvoidingView, Platform, Clipboard } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons, MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { collection, addDoc, getDocs, query, where, doc, updateDoc, arrayUnion, getDoc } from 'firebase/firestore';
import { auth, db } from '../firebase';

const generateTeamCode = () => {
  return Math.random().toString(36).substring(2, 6).toUpperCase();
};

const TeamListItem = ({ title, creator, avatars, isPriority, onPress, isActive, teamCode, onCopyCode }) => (
    <TouchableOpacity onPress={onPress} style={[styles.teamListItem, isPriority && styles.priorityTeamCard, isActive && styles.activeItem]}>
        <View style={styles.teamListItemContent}>
            <View style={{ flex: 1, marginRight: 8 }}>
                <Text style={styles.teamListTitle}>{title}</Text>
                <Text style={styles.teamListMembers}>Created by {creator}</Text>
                {teamCode &&
                    <TouchableOpacity onPress={(e) => { e.stopPropagation(); onCopyCode(teamCode); }} style={styles.teamCodeWrapper}>
                        <View style={styles.teamCodeContainer}>
                            <Text style={styles.teamCodeLabel}>Team Code</Text>
                            <Text style={styles.teamCode}>{teamCode}</Text>
                            <MaterialIcons name="content-copy" size={14} color="#6B7280" />
                        </View>
                    </TouchableOpacity>
                }
            </View>
            <View style={{flexDirection: 'row', alignItems: 'center', gap: 10}}>
                <View style={styles.avatarStack}>
                    {avatars.map((avatar, index) => (
                        avatar.uri ?
                        <Image key={index} source={{ uri: avatar.uri }} style={styles.avatar} /> :
                        <View key={index} style={[styles.avatar, styles.avatarMore]}><Text style={styles.avatarMoreText}>{avatar.text}</Text></View>
                    ))}
                </View>
                {isActive && (
                    <View style={styles.activeBadge}>
                        <Text style={styles.activeBadgeText}>Active</Text>
                    </View>
                )}
            </View>
        </View>
    </TouchableOpacity>
);

const PersonalAccountCard = ({ user, onPress, isActive }) => (
    <TouchableOpacity onPress={onPress} style={[styles.personalAccountCard, isActive && styles.activeItem]}>
        <View style={styles.teamListItemContent}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                 <View style={styles.personalAvatar}>
                    <Text style={styles.personalAvatarText}>{user?.firstName?.charAt(0).toUpperCase()}</Text>
                </View>
                <View>
                    <Text style={styles.teamListTitle}>{user?.firstName} {user?.lastName}</Text>
                    <Text style={styles.teamListMembers}>Personal Account</Text>
                </View>
            </View>
            {isActive && (
                <View style={styles.activeBadge}>
                    <Text style={styles.activeBadgeText}>Active</Text>
                </View>
            )}
        </View>
    </TouchableOpacity>
);


const SwitchAccountScreen = () => {
    const router = useRouter();
    const [showJoinTeamCard, setShowJoinTeamCard] = useState(false);
    const [showCreateTeamCard, setShowCreateTeamCard] = useState(false);
    const [teamCode, setTeamCode] = useState('');
    const [newTeamName, setNewTeamName] = useState('');
    const [user, setUser] = useState(null);
    const [teams, setTeams] = useState([]);
    const [activeAccount, setActiveAccount] = useState({ type: 'personal', id: null });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchData = async () => {
            const currentUser = auth.currentUser;
            if (currentUser) {
                // Fetch user data
                const userDocRef = doc(db, 'users', currentUser.uid);
                const userDocSnap = await getDoc(userDocRef);
                if (userDocSnap.exists()) {
                    const userData = userDocSnap.data();
                    setUser({ ...userData, id: currentUser.uid });
                    setActiveAccount(userData.activeTeamId ? { type: 'team', id: userData.activeTeamId } : { type: 'personal', id: currentUser.uid });
                }

                // Fetch teams
                const teamsQuery = query(collection(db, 'teams'), where('members', 'array-contains', currentUser.uid));
                const teamsSnapshot = await getDocs(teamsQuery);
                const teamsData = await Promise.all(teamsSnapshot.docs.map(async (teamDoc) => {
                    const teamData = teamDoc.data();
                    const creatorDocRef = doc(db, 'users', teamData.creatorId);
                    const creatorDocSnap = await getDoc(creatorDocRef);
                    const creatorName = creatorDocSnap.exists() ? `${creatorDocSnap.data().firstName} ${creatorDocSnap.data().lastName}` : 'Unknown';
                    return { ...teamData, id: teamDoc.id, creatorName };
                }));
                setTeams(teamsData);
            }
            setLoading(false);
        };

        fetchData();
    }, []);

    const handleCreateTeam = async () => {
        if (!newTeamName.trim()) {
            setError('Please enter a team name.');
            return;
        }
        setLoading(true);
        try {
            const currentUser = auth.currentUser;
            const newTeam = {
                name: newTeamName,
                creatorId: currentUser.uid,
                members: [currentUser.uid],
                teamCode: generateTeamCode(),
                createdAt: new Date(),
            };
            const teamDocRef = await addDoc(collection(db, 'teams'), newTeam);
            await updateDoc(doc(db, 'users', currentUser.uid), { activeTeamId: teamDocRef.id });
            setTeams([...teams, { ...newTeam, id: teamDocRef.id, creatorName: `${user.firstName} ${user.lastName}` }]);
            setActiveAccount({ type: 'team', id: teamDocRef.id });
            setNewTeamName('');
            setShowCreateTeamCard(false);
        } catch (e) {
            setError('Could not create team. Please try again.');
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const handleJoinTeam = async () => {
        if (!teamCode.trim() || teamCode.length !== 4) {
            setError('Please enter a valid 4-digit team code.');
            return;
        }
        setLoading(true);
        try {
            const currentUser = auth.currentUser;
            const teamsQuery = query(collection(db, 'teams'), where('teamCode', '==', teamCode.toUpperCase()));
            const teamsSnapshot = await getDocs(teamsQuery);
            if (teamsSnapshot.empty) {
                setError('Invalid team code.');
                setLoading(false);
                return;
            }
            const teamDocRef = teamsSnapshot.docs[0].ref;
            await updateDoc(teamDocRef, { members: arrayUnion(currentUser.uid) });
            await updateDoc(doc(db, 'users', currentUser.uid), { activeTeamId: teamDocRef.id });
            
            // Refetch team to get creator name
            const teamDocSnap = await getDoc(teamDocRef);
            const teamData = teamDocSnap.data();
            const creatorDocSnap = await getDoc(doc(db, 'users', teamData.creatorId));
            const creatorName = creatorDocSnap.exists() ? `${creatorDocSnap.data().firstName} ${creatorDocSnap.data().lastName}` : 'Unknown';

            setTeams([...teams, { ...teamData, id: teamDocRef.id, creatorName}]);
            setActiveAccount({ type: 'team', id: teamDocRef.id });
            setTeamCode('');
            setShowJoinTeamCard(false);
        } catch (e) {
            setError('Could not join team. Please try again.');
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const handleSwitchAccount = async (account) => {
        setLoading(true);
        try {
            const currentUser = auth.currentUser;
            const activeTeamId = account.type === 'team' ? account.id : null;
            await updateDoc(doc(db, 'users', currentUser.uid), { activeTeamId });
            setActiveAccount(account);
            router.back(); // Go back to home screen after switching
        } catch (e) {
            setError('Could not switch account.');
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const handleCopyCode = (code) => {
        Clipboard.setString(code);
        // Optionally, show a toast or message
    };

    if (loading) {
        return <ActivityIndicator style={{flex: 1, justifyContent: 'center', alignItems: 'center'}} size="large" color="#2563EB" />;
    }

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
                    <MaterialIcons name="arrow-back" size={24} color="#1F2937" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Switch Account</Text>
            </View>
            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{flex: 1}}>
                <View style={{flex: 1, backgroundColor: '#f8f6f6'}}>
                    <ScrollView 
                        style={styles.scrollView} 
                        keyboardShouldPersistTaps='handled'
                        contentContainerStyle={{ paddingBottom: 100 }}
                    >
                        {error && <Text style={styles.errorText}>{error}</Text>}
                        <View style={styles.quickActions}>
                            <TouchableOpacity style={styles.actionButton} onPress={() => { setShowCreateTeamCard(true); setShowJoinTeamCard(false); }}>
                                <View style={styles.actionIconContainer}>
                                    <MaterialIcons name="add" size={24} color="white" />
                                </View>
                                <View>
                                    <Text style={styles.actionButtonTitle}>Create Team</Text>
                                    <Text style={styles.actionButtonSubtitle}>Start a new team</Text>
                                </View>
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.actionButtonSecondary} onPress={() => { setShowJoinTeamCard(true); setShowCreateTeamCard(false); }}>
                                <View style={styles.actionIconContainerSecondary}>
                                    <MaterialIcons name="group-add" size={24} color="#2563EB" />
                                </View>
                                <View>
                                    <Text style={styles.actionButtonTitleSecondary}>Join Team</Text>
                                    <Text style={styles.actionButtonSubtitle}>Enter a team code</Text>
                                </View>
                            </TouchableOpacity>
                        </View>

                        {showCreateTeamCard && (
                            <View style={styles.createTeamContainer}>
                                <View style={styles.createTeamCard}>
                                    <Text style={styles.createTeamTitle}>Create a New Team</Text>
                                    <TouchableOpacity style={styles.closeButton} onPress={() => setShowCreateTeamCard(false)}>
                                        <MaterialIcons name="close" size={20} color="#6B7280" />
                                    </TouchableOpacity>
                                    <TextInput
                                        style={styles.input}
                                        placeholder="Enter team name"
                                        placeholderTextColor="#9CA3AF"
                                        value={newTeamName}
                                        onChangeText={setNewTeamName}
                                    />
                                    <TouchableOpacity style={styles.submitButton} onPress={handleCreateTeam} disabled={loading}>
                                        <Text style={styles.submitButtonText}>Create Team</Text>
                                    </TouchableOpacity>
                                </View>
                            </View>
                        )}

                        {showJoinTeamCard && (
                            <View style={styles.createTeamContainer}>
                                <View style={styles.createTeamCard}>
                                    <Text style={styles.createTeamTitle}>Join a Team</Text>
                                    <TouchableOpacity style={styles.closeButton} onPress={() => setShowJoinTeamCard(false)}>
                                        <MaterialIcons name="close" size={20} color="#6B7280" />
                                    </TouchableOpacity>
                                    <TextInput
                                        style={styles.input}
                                        placeholder="Enter 4-digit team code"
                                        placeholderTextColor="#9CA3AF"
                                        value={teamCode}
                                        onChangeText={setTeamCode}
                                        keyboardType="default"
                                        maxLength={4}
                                        autoCapitalize="characters"
                                    />
                                    <TouchableOpacity style={styles.submitButton} onPress={handleJoinTeam} disabled={loading}>
                                        <Text style={styles.submitButtonText}>Submit</Text>
                                    </TouchableOpacity>
                                </View>
                            </View>
                        )}

                        <View style={styles.sectionHeader}>
                            <Text style={styles.sectionTitle}>Personal Account</Text>
                        </View>

                        {user && (
                            <PersonalAccountCard 
                                user={user} 
                                isActive={activeAccount?.type === 'personal'}
                                onPress={() => handleSwitchAccount({ type: 'personal', id: user.id })}
                            />
                        )}

                        <View style={styles.sectionHeader}>
                            <Text style={styles.sectionTitle}>Your Teams</Text>
                        </View>


                        {teams.length > 0 ? (
                            <View style={styles.teamsList}>
                                {teams.map(team => (
                                    <TeamListItem
                                        key={team.id}
                                        title={team.name}
                                        creator={team.creatorName}
                                        teamCode={team.creatorId === user.id ? team.teamCode : null}
                                        avatars={[]}
                                        isPriority={false}
                                        isActive={activeAccount?.type === 'team' && activeAccount?.id === team.id}
                                        onPress={() => handleSwitchAccount({ type: 'team', id: team.id })}
                                        onCopyCode={handleCopyCode}
                                    />
                                ))}
                            </View>
                        ) : (
                            <View style={styles.emptyState}>
                                <MaterialCommunityIcons name="account-group-outline" size={48} color="#D1D5DB" />
                                <Text style={styles.emptyStateText}>You are not part of any teams yet.</Text>
                            </View>
                        )}
                    </ScrollView>
                    {activeAccount?.type === 'team' && (
                        <View style={styles.footer}>
                            <TouchableOpacity style={styles.manageTeamButton}>
                                <MaterialIcons name="settings" size={20} color="#2563EB" />
                                <Text style={styles.manageTeamButtonText}>Manage Team</Text>
                            </TouchableOpacity>
                        </View>
                    )}
                </View>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    errorText: {
        color: 'red',
        textAlign: 'center',
        margin: 10,
    },
    container: {
        flex: 1,
        backgroundColor: '#f8f6f6',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 16,
        paddingVertical: 12,
        backgroundColor: 'white',
        borderBottomWidth: 1,
        borderBottomColor: '#E5E7EB',
        position: 'relative',
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
    quickActions: {
        flexDirection: 'row',
        gap: 12,
        padding: 16,
    },
    actionButton: {
        flex: 1,
        flexDirection: 'column',
        alignItems: 'flex-start',
        gap: 12,
        padding: 16,
        borderRadius: 16,
        backgroundColor: 'white',
        borderWidth: 1,
        borderColor: 'rgba(0, 0, 0, 0.07)',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 5,
        elevation: 3,
    },
    actionButtonSecondary: {
        flex: 1,
        flexDirection: 'column',
        alignItems: 'flex-start',
        gap: 12,
        padding: 16,
        borderRadius: 16,
        backgroundColor: 'white',
        borderWidth: 1,
        borderColor: 'rgba(0, 0, 0, 0.07)',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 5,
        elevation: 3,
    },
    actionIconContainer: {
        width: 40,
        height: 40,
        borderRadius: 8,
        backgroundColor: '#2563EB',
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#2563EB',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
        elevation: 5,
    },
    actionIconContainerSecondary: {
        width: 40,
        height: 40,
        borderRadius: 8,
        backgroundColor: 'rgba(37, 99, 235, 0.1)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    actionButtonTitle: {
        color: '#1F2937',
        fontSize: 14,
        fontWeight: 'bold',
        lineHeight: 18,
    },
    actionButtonTitleSecondary: {
        color: '#1F2937',
        fontSize: 14,
        fontWeight: 'bold',
        lineHeight: 18,
    },
    actionButtonSubtitle: {
        color: '#6B7280',
        fontSize: 12,
        lineHeight: 16,
        marginTop: 2,
    },
    createTeamContainer: {
        paddingHorizontal: 16,
        marginBottom: 12,
    },
    createTeamCard: {
        backgroundColor: 'white',
        borderRadius: 16,
        padding: 16,
        borderWidth: 1,
        borderColor: 'rgba(0, 0, 0, 0.07)',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 5,
        elevation: 3,
        position: 'relative',
    },
    createTeamTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#1F2937',
        marginBottom: 12,
    },
    input: {
        height: 44,
        backgroundColor: '#F3F4F6',
        borderRadius: 8,
        paddingHorizontal: 16,
        fontSize: 14,
        color: '#1F2937',
        marginBottom: 12,
        borderWidth: 1,
        borderColor: '#E5E7EB',
    },
    submitButton: {
        height: 44,
        backgroundColor: '#2563EB',
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
    },
    submitButtonText: {
        color: 'white',
        fontSize: 14,
        fontWeight: 'bold',
    },
    closeButton: {
        position: 'absolute',
        top: 16,
        right: 16,
        width: 32,
        height: 32,
        borderRadius: 8,
        backgroundColor: '#F3F4F6',
        alignItems: 'center',
        justifyContent: 'center',
    },
    sectionHeader: {
        paddingHorizontal: 16,
        paddingTop: 16,
        paddingBottom: 8,
    },
    sectionTitle: {
        fontSize: 10,
        fontWeight: 'bold',
        color: '#6B7280',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    teamsList: {
        paddingHorizontal: 16,
        gap: 12,
    },
    teamListItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 16,
        borderRadius: 16,
        backgroundColor: 'white',
        padding: 16,
        borderWidth: 1,
        borderColor: 'rgba(0, 0, 0, 0.07)',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 5,
        elevation: 3,
    },
    priorityTeamCard: {
        borderLeftWidth: 4,
        borderLeftColor: '#2563EB',
    },
    teamListItemContent: {
        flex: 1,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: 12,
    },
    teamListTitle: {
        color: '#1F2937',
        fontSize: 16,
        fontWeight: 'bold',
    },
    teamListMembers: {
        fontSize: 12,
        color: '#6B7280',
        marginTop: 2,
    },
    avatarStack: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    avatar: {
        width: 28,
        height: 28,
        borderRadius: 14,
        borderWidth: 2,
        borderColor: 'white',
        marginLeft: -8,
        backgroundColor: '#E5E7EB',
    },
    avatarMore: {
        alignItems: 'center',
        justifyContent: 'center',
    },
    avatarMoreText: {
        fontSize: 10,
        color: '#4B5563',
        fontWeight: '600',
    },
    priorityBadge: {
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 999,
        backgroundColor: 'rgba(37, 99, 235, 0.1)',
        borderWidth: 1,
        borderColor: 'rgba(37, 99, 235, 0.2)',
    },
    priorityBadgeText: {
        fontSize: 10,
        fontWeight: 'bold',
        color: '#2563EB',
        textTransform: 'uppercase',
    },
    emptyState: {
        alignItems: 'center',
        justifyContent: 'center',
        padding: 32,
        marginTop: 16,
        opacity: 0.4,
    },
    emptyStateText: {
        color: '#6B7280',
        fontSize: 12,
        marginTop: 8,
        fontWeight: '500',
    },
    personalAccountCard: {
        marginHorizontal: 16,
        marginBottom: 12,
        borderRadius: 16,
        backgroundColor: '#fff',
        padding: 16,
        borderWidth: 1,
        borderColor: 'rgba(0, 0, 0, 0.07)',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 5,
        elevation: 3,
    },
    personalAvatar: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(37, 99, 235, 0.1)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    personalAvatarText: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#2563EB',
    },
    activeBadge: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
        backgroundColor: '#F3F4F6',
    },
    activeBadgeText: {
        fontSize: 12,
        fontWeight: '600',
        color: '#4B5563',
    },
    activeItem: {
        borderWidth: 2,
        borderColor: '#2563EB',
        shadowColor: '#2563EB',
        shadowOffset: { width: 0, height: 5 },
        shadowOpacity: 0.3,
        shadowRadius: 10,
        elevation: 10,
    },
    teamCodeWrapper: {
        marginTop: 10,
    },
    teamCodeContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        backgroundColor: '#F9FAFB',
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#F3F4F6',
        alignSelf: 'flex-start',
    },
    teamCodeLabel: {
        fontSize: 10,
        fontWeight: 'bold',
        color: '#6B7280',
        textTransform: 'uppercase',
    },
    teamCode: {
        fontSize: 12,
        fontWeight: '600',
        color: '#374151',
    },
    footer: {
        position: 'absolute',
        bottom: 24,
        left: 0,
        right: 0,
        alignItems: 'center',
    },
    manageTeamButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 10,
        height: 50,
        paddingHorizontal: 24,
        backgroundColor: 'white',
        borderRadius: 25,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 8,
        borderWidth: 1,
        borderColor: '#E5E7EB'
    },
    manageTeamButtonText: {
        color: '#2563EB',
        fontSize: 16,
        fontWeight: 'bold',
    },
});

export default SwitchAccountScreen;
