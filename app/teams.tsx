
import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, StatusBar, TouchableOpacity, ScrollView, Modal, TextInput, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { supabase } from '../utils/supabase';

const TeamsScreen = () => {
    const [createModalVisible, setCreateModalVisible] = useState(false);
    const [joinModalVisible, setJoinModalVisible] = useState(false);
    const [teamName, setTeamName] = useState('');
    const [teams, setTeams] = useState([]);

    const colors = {
        primary: "#6F8FAF",
        backgroundLight: "#f8f6f6",
        textDark: "#221610",
        textMuted: "rgba(34, 22, 16, 0.6)",
    };

    useEffect(() => {
        const fetchTeams = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                const { data: teamMembers, error: teamMembersError } = await supabase
                    .from('team_members')
                    .select('team_id')
                    .eq('user_id', user.id);

                if (teamMembersError) {
                    console.error('Error fetching team members:', teamMembersError);
                    return;
                }

                const teamIds = teamMembers.map(member => member.team_id);

                const { data: teamsData, error: teamsError } = await supabase
                    .from('teams')
                    .select('*, profiles!creator_id(full_name)')
                    .in('id', teamIds);

                if (teamsError) {
                    console.error('Error fetching teams:', teamsError);
                } else {
                    setTeams(teamsData);
                }
            }
        };

        fetchTeams();
    }, []);

    const handleCreateTeam = async () => {
        if (!teamName.trim()) {
            Alert.alert('Error', 'Please enter a team name.');
            return;
        }

        const { data: { user } } = await supabase.auth.getUser();

        if (user) {
            const generatedCode = Math.floor(100000 + Math.random() * 900000).toString();

            const { data: newTeam, error } = await supabase
                .from('teams')
                .insert([{ name: teamName, code: generatedCode, creator_id: user.id }])
                .select();

            if (error) {
                console.error('Error creating team:', error);
                Alert.alert('Error', 'Failed to create team. The code might already exist. Please try again.');
                return;
            }

            if (newTeam) {
                const { error: memberError } = await supabase
                    .from('team_members')
                    .insert([{ team_id: newTeam[0].id, user_id: user.id }]);

                if (memberError) {
                    console.error('Error adding team member:', memberError);
                    Alert.alert('Error', 'Team created, but failed to add you as a member.');
                } else {
                    Alert.alert('Success', `Team "${teamName}" created successfully! Your team code is ${generatedCode}`);
                    setTeamName('');
                    setCreateModalVisible(false);
                }
            }
        } else {
            Alert.alert('Error', 'You must be logged in to create a team.');
        }
    };

    return (
        <SafeAreaView style={[styles.body, { backgroundColor: colors.backgroundLight }]}>
            <StatusBar hidden />
            {/* Top Navigation */}
            <View style={styles.topNav}>
                <TouchableOpacity onPress={() => router.back()} style={styles.navButton}>
                    <MaterialCommunityIcons name="arrow-left" size={24} color={colors.primary} />
                </TouchableOpacity>
                <Text style={styles.navTitle}>Switch Account</Text>
            </View>
            {/* Scrollable Content */}
            <ScrollView style={styles.scrollableContent}>
                {/* Quick Actions */}
                <View style={styles.quickActions}>
                    <TouchableOpacity style={styles.quickActionCard} onPress={() => setCreateModalVisible(true)}>
                        <View style={[styles.quickActionIconContainer, { backgroundColor: colors.primary }]}>
                            <MaterialCommunityIcons name="plus-circle-outline" size={24} color="white" />
                        </View>
                        <View>
                            <Text style={styles.quickActionTitle}>Create Team</Text>
                            <Text style={styles.quickActionSubtitle}>Start a workspace</Text>
                        </View>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.quickActionCard} onPress={() => setJoinModalVisible(true)}>
                        <View style={[styles.quickActionIconContainer, { backgroundColor: '#e5e7eb'}]}>
                            <MaterialCommunityIcons name="account-group-outline" size={24} color={colors.primary} />
                        </View>
                        <View>
                            <Text style={styles.quickActionTitle}>Join Team</Text>
                            <Text style={styles.quickActionSubtitle}>Enter a team code</Text>
                        </View>
                    </TouchableOpacity>
                </View>

                {/* Teams List */}
                <View style={styles.teamsList}>
                    {teams.map((team, index) => (
                        <View key={index} style={[styles.teamCard]}>
                            <View style={styles.teamInfo}>
                                <View>
                                    <Text style={styles.teamName}>{team.name}</Text>
                                    <Text style={styles.teamMembers}>Created by {team.profiles.full_name}</Text>
                                </View>
                                <Text style={styles.priorityLabel}>Team Code: {team.code}</Text>
                            </View>
                            <TouchableOpacity style={styles.chevronButton}>
                                <MaterialCommunityIcons name="chevron-right" size={24} color={colors.textMuted} />
                            </TouchableOpacity>
                        </View>
                    ))}
                </View>

                {/* Empty State Illustration */}
                <View style={styles.emptyState}>
                    <MaterialCommunityIcons name="account-group-outline" size={64} color="#e5e7eb" />
                    <Text style={styles.emptyStateText}>Looking for more teams?</Text>
                </View>
            </ScrollView>

            {/* Create Team Modal */}
            <Modal
                animationType="slide"
                transparent={true}
                visible={createModalVisible}
                onRequestClose={() => {
                    setCreateModalVisible(!createModalVisible);
                }}
            >
                <View style={styles.centeredView}>
                    <View style={[styles.modalView, {backgroundColor: colors.primary}]}>
                        <TouchableOpacity
                            style={styles.closeButton}
                            onPress={() => setCreateModalVisible(!createModalVisible)}
                        >
                            <MaterialCommunityIcons name="close" size={24} color="white" />
                        </TouchableOpacity>
                        <Text style={[styles.modalText, {color: 'white'}]}>Create a Team</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="Enter Team Name"
                            placeholderTextColor="white"
                            value={teamName}
                            onChangeText={setTeamName}
                        />
                        <TouchableOpacity
                            style={[styles.button, styles.buttonClose, {backgroundColor: 'white'}]}
                            onPress={handleCreateTeam}
                        >
                            <Text style={[styles.textStyle, {color: colors.primary}]}>Submit</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>

            {/* Join Team Modal */}
            <Modal
                animationType="slide"
                transparent={true}
                visible={joinModalVisible}
                onRequestClose={() => {
                    setJoinModalVisible(!joinModalVisible);
                }}
            >
                <View style={styles.centeredView}>
                    <View style={[styles.modalView, {backgroundColor: colors.primary}]}>
                        <TouchableOpacity
                            style={styles.closeButton}
                            onPress={() => setJoinModalVisible(!joinModalVisible)}
                        >
                            <MaterialCommunityIcons name="close" size={24} color="white" />
                        </TouchableOpacity>
                        <Text style={[styles.modalText, {color: 'white'}]}>Join a Team</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="Enter Team Code"
                            placeholderTextColor="white"
                        />
                        <TouchableOpacity
                            style={[styles.button, styles.buttonClose, {backgroundColor: 'white'}]}
                            onPress={() => setJoinModalVisible(!joinModalVisible)}
                        >
                            <Text style={[styles.textStyle, {color: colors.primary}]}>Submit</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    body: {
        flex: 1,
    },
    topNav: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#f3f4f6',
    },
    navButton: {
        padding: 8,
    },
    navTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        marginLeft: 16,
    },
    scrollableContent: {
        flex: 1,
    },
    quickActions: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        padding: 16,
    },
    quickActionCard: {
        flex: 1,
        alignItems: 'center',
        padding: 16,
        borderRadius: 16,
        backgroundColor: 'white',
        marginHorizontal: 8,
    },
    quickActionIconContainer: {
        width: 48,
        height: 48,
        borderRadius: 24,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 8,
    },
    quickActionTitle: {
        fontSize: 16,
        fontWeight: 'bold',
    },
    quickActionSubtitle: {
        fontSize: 12,
        color: '#6b7280',
    },
    teamsList: {
        padding: 16,
    },
    teamCard: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 16,
        borderRadius: 16,
        backgroundColor: 'white',
        marginBottom: 16,
        borderLeftWidth: 4,
        borderLeftColor: '#6F8FAF',
    },
    teamInfo: {
        flex: 1,
    },
    teamName: {
        fontSize: 16,
        fontWeight: 'bold',
    },
    teamMembers: {
        fontSize: 14,
        color: '#6F8FAF',
    },
    priorityLabel: {
        marginTop: 4,
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 16,
        backgroundColor: '#6F8FAF',
        color: 'white',
        fontSize: 10,
        fontWeight: 'bold',
        alignSelf: 'flex-start',
    },
    chevronButton: {
        padding: 8,
    },
    emptyState: {
        alignItems: 'center',
        padding: 32,
        opacity: 0.5,
    },
    emptyStateText: {
        marginTop: 8,
        fontSize: 14,
        color: '#9ca3af',
    },
    centeredView: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        marginTop: 22
    },
    modalView: {
        margin: 20,
        borderRadius: 20,
        padding: 35,
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
    button: {
        borderRadius: 20,
        padding: 10,
        elevation: 2
    },
    buttonClose: {},
    textStyle: {
        fontWeight: "bold",
        textAlign: "center"
    },
    modalText: {
        marginBottom: 15,
        textAlign: "center",
        fontWeight: 'bold',
        fontSize: 18,

    },
    input: {
        height: 40,
        margin: 12,
        borderWidth: 1,
        borderColor: 'white',
        padding: 10,
        width: 200,
        borderRadius: 5,
        color: 'white',
    },
    closeButton: {
        position: 'absolute',
        top: 10,
        right: 10,
    },
});

export default TeamsScreen;
