
import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Image, TextInput, ActivityIndicator, KeyboardAvoidingView, Platform, Animated } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons, MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { db, auth } from '../firebase';
import { collection, addDoc, getDocs, query, where, doc, getDoc, setDoc } from 'firebase/firestore';
import * as Clipboard from 'expo-clipboard';
import AsyncStorage from '@react-native-async-storage/async-storage';

const TeamListItem = ({ title, creator, avatars, isPriority, onPress, isActive, teamCode, onCopyCode }) => (
    <TouchableOpacity onPress={onPress} style={[styles.teamListItem, isPriority && styles.priorityTeamCard, isActive && styles.activeItem]}>
        <View style={styles.teamListItemContent}>
            <View style={{ flex: 1, marginRight: 8 }}>
                <Text style={styles.teamListTitle}>{title}</Text>
                <Text style={styles.teamListMembers}>Created by {creator}</Text>
                {teamCode && (
                    <View style={styles.teamCodeWrapper}>
                        <View style={styles.teamCodeContainer}>
                            <Text style={styles.teamCodeLabel}>Team Code</Text>
                            <Text style={styles.teamCode}>{teamCode}</Text>
                            <TouchableOpacity onPress={(e) => { e.stopPropagation(); onCopyCode(teamCode); }} style={styles.copyIcon}>
                                <MaterialIcons name="content-copy" size={14} color="#6B7280" />
                            </TouchableOpacity>
                        </View>
                    </View>
                )}
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
                    <Text style={styles.personalAvatarText}>{user?.name?.charAt(0).toUpperCase()}</Text>
                </View>
                <View>
                    <Text style={styles.teamListTitle}>{user?.name}</Text>
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

const CustomToast = ({ message, visible, type }) => {
    if (!visible) return null;
    return (
        <Animated.View style={[styles.toast, type === 'success' ? styles.toastSuccess : styles.toastError]}>
            <Text style={styles.toastText}>{message}</Text>
        </Animated.View>
    );
};


const SwitchAccountScreen = () => {
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const [showJoinTeamCard, setShowJoinTeamCard] = useState(false);
    const [showCreateTeamCard, setShowCreateTeamCard] = useState(false);
    const [teamCode, setTeamCode] = useState('');
    const [newTeamName, setNewTeamName] = useState('');
    const [user, setUser] = useState({ name: "John Doe" });
    const [teams, setTeams] = useState([]);
    const [activeAccount, setActiveAccount] = useState(null);
    const [isCreatingTeam, setIsCreatingTeam] = useState(false);
    const [isJoiningTeam, setIsJoiningTeam] = useState(false);
    const [toastConfig, setToastConfig] = useState({ visible: false, message: '', type: 'success' });
    const toastTimeout = useRef(null);

    useEffect(() => {
        const fetchUserDataAndTeams = async () => {
            const currentUser = auth.currentUser;
            if (currentUser) {
                const userDocRef = doc(db, 'users', currentUser.uid);
                const userDoc = await getDoc(userDocRef);
                if (userDoc.exists()) {
                    setUser({ id: currentUser.uid, name: userDoc.data().firstName });
                }

                const teamMembersRef = collection(db, 'team_members');
                const q = query(teamMembersRef, where("userId", "==", currentUser.uid));
                const querySnapshot = await getDocs(q);
                const userTeams = [];
                for (const teamMemberDoc of querySnapshot.docs) {
                    const teamId = teamMemberDoc.data().teamId;
                    const teamDocRef = doc(db, 'teams', teamId);
                    const teamDoc = await getDoc(teamDocRef);
                    if (teamDoc.exists()) {
                        userTeams.push({ id: teamDoc.id, ...teamDoc.data() });
                    }
                }
                setTeams(userTeams);

                const storedActiveAccount = await AsyncStorage.getItem('activeAccount');
                if (storedActiveAccount) {
                    setActiveAccount(JSON.parse(storedActiveAccount));
                } else {
                    setActiveAccount({ type: 'personal' });
                }
            }
        };
        fetchUserDataAndTeams();
    }, []);

    const showToast = (message, type = 'success') => {
        if (toastTimeout.current) {
            clearTimeout(toastTimeout.current);
        }
        setToastConfig({ visible: true, message, type });
        toastTimeout.current = setTimeout(() => {
            setToastConfig({ visible: false, message: '', type: '' });
        }, 3000);
    };

    const handleSetAccount = async (account) => {
        try {
            await AsyncStorage.setItem('activeAccount', JSON.stringify(account));
            setActiveAccount(account);
            showToast(`Switched to ${account.type === 'personal' ? 'Personal Account' : account.name}`, 'success');
        } catch (error) {
            console.error("Error setting active account: ", error);
            showToast('Failed to switch account. Please try again.', 'error');
        }
    };

    const handleCopyCode = async (code) => {
        await Clipboard.setStringAsync(code);
        showToast('Team code copied to clipboard!', 'success');
    };

    const handleCreateTeam = async () => {
        if (!newTeamName.trim()) {
            showToast('Please enter a team name.', 'error');
            return;
        }

        setIsCreatingTeam(true);
        const teamsRef = collection(db, 'teams');

        try {
            let teamCode;
            let isCodeUnique = false;
            while (!isCodeUnique) {
                teamCode = Math.floor(1000 + Math.random() * 9000).toString();
                const codeQuery = query(teamsRef, where("code", "==", teamCode));
                const codeSnapshot = await getDocs(codeQuery);
                if (codeSnapshot.empty) {
                    isCodeUnique = true;
                }
            }

            const currentUser = auth.currentUser;
            if (currentUser) {
                const newTeam = {
                    name: newTeamName.trim(),
                    code: teamCode,
                    creator: user.name,
                    creatorId: currentUser.uid,
                    createdAt: new Date(),
                };
                const docRef = await addDoc(teamsRef, newTeam);

                const teamMembersRef = collection(db, 'team_members');
                await addDoc(teamMembersRef, {
                    teamId: docRef.id,
                    userId: currentUser.uid,
                    role: 'admin',
                    joinedAt: new Date()
                });

                setTeams(prevTeams => [...prevTeams, { id: docRef.id, ...newTeam }]);
                showToast(`Team '${newTeamName.trim()}' created successfully!`, 'success');
                setNewTeamName('');
                setShowCreateTeamCard(false);
            }
        } catch (error) {
            console.error("Error creating team: ", error);
            showToast('Failed to create team. Please try again.', 'error');
        } finally {
            setIsCreatingTeam(false);
        }
    };

    const handleJoinTeam = async () => {
        if (!teamCode.trim() || teamCode.length !== 4) {
            showToast('Please enter a valid 4-digit team code.', 'error');
            return;
        }

        setIsJoiningTeam(true);
        const teamsRef = collection(db, 'teams');
        const q = query(teamsRef, where("code", "==", teamCode));

        try {
            const querySnapshot = await getDocs(q);
            if (querySnapshot.empty) {
                showToast('Invalid team code. Please check and try again.', 'error');
                setIsJoiningTeam(false);
                return;
            }

            const teamDoc = querySnapshot.docs[0];
            const teamId = teamDoc.id;
            const currentUser = auth.currentUser;

            const teamMembersRef = collection(db, 'team_members');
            const memberQuery = query(teamMembersRef, where("teamId", "==", teamId), where("userId", "==", currentUser.uid));
            const memberSnapshot = await getDocs(memberQuery);

            if (!memberSnapshot.empty) {
                showToast("You are already a member of this team.", 'error');
                setIsJoiningTeam(false);
                return;
            }

            if (currentUser) {
                await addDoc(teamMembersRef, {
                    teamId: teamId,
                    userId: currentUser.uid,
                    role: 'member',
                    joinedAt: new Date(),
                });

                setTeams(prevTeams => [...prevTeams, { id: teamDoc.id, ...teamDoc.data() }]);
                showToast(`Successfully joined team '${teamDoc.data().name}'!`, 'success');
                setTeamCode('');
                setShowJoinTeamCard(false);
            }
        } catch (error) {
            console.error("Error joining team: ", error);
            showToast('Failed to join team. Please try again.', 'error');
        } finally {
            setIsJoiningTeam(false);
        }
    };


    return (
        <View style={{ flex: 1, backgroundColor: '#f8f6f6' }}>
            <CustomToast visible={toastConfig.visible} message={toastConfig.message} type={toastConfig.type} />
            <View style={[styles.header, { paddingTop: insets.top }]}>
                <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
                    <MaterialIcons name="arrow-back" size={24} color="#1F2937" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Switch Account</Text>
            </View>
            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
                <ScrollView
                    style={styles.scrollView}
                    keyboardShouldPersistTaps='handled'
                    contentContainerStyle={{ paddingBottom: insets.bottom + 20 }}
                >
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
                         <View style={styles.card}>
                            <View style={styles.cardHeader}>
                                <Text style={styles.cardTitle}>Create a New Team</Text>
                                <TouchableOpacity onPress={() => setShowCreateTeamCard(false)} style={styles.closeButton}>
                                    <MaterialIcons name="close" size={20} color="#fff" />
                                </TouchableOpacity>
                            </View>
                            <TextInput
                                style={styles.input}
                                placeholder="Enter team name"
                                placeholderTextColor="#9CA3AF"
                                value={newTeamName}
                                onChangeText={setNewTeamName}
                            />
                            <TouchableOpacity style={styles.submitButton} onPress={handleCreateTeam} disabled={isCreatingTeam} activeOpacity={1}>
                                {isCreatingTeam ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitButtonText}>Create Team</Text>}
                            </TouchableOpacity>
                        </View>
                    )}

                    {showJoinTeamCard && (
                        <View style={styles.card}>
                            <View style={styles.cardHeader}>
                                <Text style={styles.cardTitle}>Join a Team</Text>
                                <TouchableOpacity style={styles.closeButton} onPress={() => setShowJoinTeamCard(false)}>
                                    <MaterialIcons name="close" size={20} color="#fff" />
                                </TouchableOpacity>
                            </View>
                            <TextInput
                                style={styles.input}
                                placeholder="Enter 4-digit team code"
                                placeholderTextColor="#9CA3AF"
                                value={teamCode}
                                onChangeText={setTeamCode}
                                keyboardType="numeric"
                                maxLength={4}
                            />
                            <TouchableOpacity style={styles.submitButton} onPress={handleJoinTeam} disabled={isJoiningTeam}>
                                {isJoiningTeam ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitButtonText}>Join Team</Text>}
                            </TouchableOpacity>
                        </View>
                    )}

                    <View style={styles.sectionHeader}>
                        <Text style={styles.sectionTitle}>Personal Account</Text>
                    </View>

                    {user && (
                        <PersonalAccountCard
                            user={user}
                            isActive={activeAccount?.type === 'personal'}
                            onPress={() => handleSetAccount({ type: 'personal' })}
                        />
                    )}

                    <View style={styles.sectionHeader}>
                        <Text style={styles.sectionTitle}>Your Teams</Text>
                        <TouchableOpacity style={styles.manageTeamsLink} onPress={() => router.push('/manage-teams')}>
                            <MaterialIcons name="settings" size={16} color="#4B5563" style={{ marginRight: 4 }} />
                            <Text style={styles.manageTeamsLinkText}>Manage teams</Text>
                        </TouchableOpacity>
                    </View>

                    <View style={styles.teamsList}>
                        {teams.length > 0 ? (
                            teams.map(team => (
                                <TeamListItem
                                    key={team.id}
                                    title={team.name}
                                    creator={team.creator}
                                    teamCode={team.code}
                                    avatars={[]}
                                    isPriority={false}
                                    isActive={activeAccount?.id === team.id}
                                    onPress={() => handleSetAccount({ type: 'team', id: team.id, name: team.name })}
                                    onCopyCode={handleCopyCode}
                                />
                            ))
                        ) : (
                            <View style={styles.emptyState}>
                                <MaterialCommunityIcons name="account-group-outline" size={48} color="#D1D5DB" />
                                <Text style={styles.emptyStateText}>You are not part of any teams yet.</Text>
                            </View>
                        )}
                    </View>
                </ScrollView>
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
    toast: {
        position: 'absolute',
        top: 60,
        left: 20,
        right: 20,
        padding: 15,
        borderRadius: 10,
        zIndex: 100,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        elevation: 5,
    },
    toastSuccess: {
        backgroundColor: '#4CAF50',
    },
    toastError: {
        backgroundColor: '#F44336',
    },
    toastText: {
        color: '#fff',
        fontSize: 14,
        fontWeight: '600',
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
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        borderRadius: 8,
        paddingHorizontal: 16,
        fontSize: 14,
        color: '#fff',
        marginBottom: 12,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.2)',
    },
    submitButton: {
        height: 44,
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
    },
    submitButtonText: {
        color: '#1D4ED8',
        fontSize: 14,
        fontWeight: 'bold',
    },
    closeButton: {
        position: 'absolute',
        top: 5,
        right: 10,
        width: 32,
        height: 32,
        borderRadius: 8,
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    sectionHeader: {
        paddingHorizontal: 16,
        paddingTop: 16,
        paddingBottom: 8,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
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
    copyIcon: {
        padding: 4,
    },
    card: {
        backgroundColor: '#1D4ED8',
        borderRadius: 16,
        padding: 20,
        marginHorizontal: 16,
        marginTop: -10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.2,
        shadowRadius: 20,
        elevation: 15,
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    cardTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#fff',
    },
    manageTeamsLink: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    manageTeamsLinkText: {
        color: '#4B5563',
        fontSize: 12,
        fontWeight: '600',
    },
});

export default SwitchAccountScreen;
