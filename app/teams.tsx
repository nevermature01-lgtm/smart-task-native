
import React, { useState } from 'react';
import { StyleSheet, Text, View, StatusBar, TouchableOpacity, ScrollView, Modal, TextInput, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { supabase } from '../utils/supabase';

const TeamsScreen = () => {
    const [createModalVisible, setCreateModalVisible] = useState(false);
    const [joinModalVisible, setJoinModalVisible] = useState(false);
    const [teamName, setTeamName] = useState('');

    const colors = {
        primary: "#ec5b13",
        backgroundLight: "#f8f6f6",
        textDark: "#221610",
        textMuted: "rgba(34, 22, 16, 0.6)",
    };

    const teams = [
        { name: 'Product Design', members: 12, priority: false },
        { name: 'Sales West', members: 8, priority: false },
        { name: 'Q3 Project', members: 5, priority: true },
        { name: 'Mobile App', members: 7, priority: false },
        { name: 'Marketing', members: 10, priority: false },
        { name: 'Engineering', members: 15, priority: true },
    ];

    const handleCreateTeam = async () => {
        if (!teamName.trim()) {
            Alert.alert('Error', 'Please enter a team name.');
            return;
        }

        const { data: { user } } = await supabase.auth.getUser();

        if (user) {
            let newTeam = null;
            let attempts = 0;
            const maxAttempts = 5;

            while (attempts < maxAttempts) {
                const generatedCode = Math.floor(100000 + Math.random() * 900000).toString();
                
                const { data, error } = await supabase
                    .from('teams')
                    .insert([{ name: teamName, code: generatedCode, creator_id: user.id }])
                    .select()
                    .single();

                if (error) {
                    if (error.code === '23505') { // Unique violation
                        attempts++;
                        continue; // Try again
                    }
                    // For other errors, show a message and exit
                    console.error('Error creating team:', error);
                    Alert.alert('Error', 'Failed to create team. Please try again.');
                    return;
                }

                if (data) {
                    newTeam = data;
                    break; // Success!
                }
            }

            if (!newTeam) {
                Alert.alert('Error', 'Could not create a unique team code. Please try again later.');
                return;
            }

            const { error: memberError } = await supabase
                .from('team_members')
                .insert([{ team_id: newTeam.id, user_id: user.id }]);

            if (memberError) {
                console.error('Error adding team member:', memberError);
                Alert.alert('Error', 'Team created, but failed to add you as a member.');
            } else {
                Alert.alert('Success', `Team "${teamName}" created successfully! Your team code is ${newTeam.code}`);
                setTeamName('');
                setCreateModalVisible(false);
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
                        <TouchableOpacity key={index} style={[styles.teamCard, team.priority && styles.priorityTeamCard]}>
                            <MaterialCommunityIcons name="account-group" size={32} color={colors.primary} />
                            <Text style={styles.teamName}>{team.name}</Text>
                            <Text style={styles.teamMembers}>{team.members} Members</Text>
                            {team.priority && <Text style={styles.priorityLabel}>Priority</Text>}
                        </TouchableOpacity>
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
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingTop: 16,
    },
    teamCard: {
        width: '30%', 
        aspectRatio: 1, 
        backgroundColor: 'white',
        borderRadius: 16,
        marginBottom: 16,
        padding: 12, 
        alignItems: 'center',
        justifyContent: 'center',
    },
    priorityTeamCard: {
        borderLeftWidth: 4,
        borderLeftColor: '#ec5b13',
    },
    teamName: {
        fontSize: 14,
        fontWeight: 'bold',
        textAlign: 'center',
        marginTop: 8,
    },
    teamMembers: {
        fontSize: 12,
        color: '#ec5b13',
        textAlign: 'center',
        marginTop: 4,
    },
    priorityLabel: {
        marginTop: 8,
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 12,
        backgroundColor: '#ec5b13',
        color: 'white',
        fontSize: 10,
        fontWeight: 'bold',
        overflow: 'hidden',
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
