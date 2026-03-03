
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { db, auth } from '../firebase';
import { collection, getDocs, query, where, doc, deleteDoc } from 'firebase/firestore';

const ManageTeamsScreen = () => {
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const [teams, setTeams] = useState([]);

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

    const handleDeleteTeam = async (teamId, teamName) => {
        Alert.alert(
            `Delete ${teamName}`,
            `Are you sure you want to delete the team '${teamName}'? This action cannot be undone.`,
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Delete",
                    style: "destructive",
                    onPress: async () => {
                        try {
                            await deleteDoc(doc(db, "teams", teamId));
                            setTeams(prevTeams => prevTeams.filter(team => team.id !== teamId));
                        } catch (error) {
                            console.error("Error deleting team: ", error);
                            Alert.alert("Error", "Failed to delete team. Please try again.");
                        }
                    },
                },
            ]
        );
    };

    return (
        <View style={{ flex: 1, backgroundColor: '#f8f6f6' }}>
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
                                onPress={() => handleDeleteTeam(team.id, team.name)}
                            >
                                <MaterialIcons name="delete-outline" size={24} color="#EF4444" />
                            </TouchableOpacity>
                        </View>
                    ))}
                </View>
            </ScrollView>
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
        fontWeight: 'bold',
        color: '#1F2937',
    },
    teamCreator: {
        fontSize: 12,
        color: '#6B7280',
        marginTop: 2,
    },
    deleteButton: {
        padding: 8,
    },
});

export default ManageTeamsScreen;
