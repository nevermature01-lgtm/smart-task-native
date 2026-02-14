
import React from 'react';
import { StyleSheet, Text, View, StatusBar, TouchableOpacity, ScrollView, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { router } from 'expo-router';

const TeamsScreen = () => {
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
    ];

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
                    <TouchableOpacity style={styles.quickActionCard}>
                        <View style={[styles.quickActionIconContainer, { backgroundColor: colors.primary }]}>
                            <MaterialCommunityIcons name="plus-circle-outline" size={24} color="white" />
                        </View>
                        <View>
                            <Text style={styles.quickActionTitle}>Create Team</Text>
                            <Text style={styles.quickActionSubtitle}>Start a workspace</Text>
                        </View>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.quickActionCard}>
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
                        <View key={index} style={[styles.teamCard, team.priority && styles.priorityTeamCard]}>
                            <View style={styles.teamInfo}>
                                <View>
                                    <Text style={styles.teamName}>{team.name}</Text>
                                    <Text style={styles.teamMembers}>{team.members} Members</Text>
                                </View>
                                {team.priority && <Text style={styles.priorityLabel}>Priority</Text>}
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
    },
    priorityTeamCard: {
        borderLeftWidth: 4,
        borderLeftColor: '#ec5b13',
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
        color: '#ec5b13',
    },
    priorityLabel: {
        marginTop: 4,
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 16,
        backgroundColor: '#ec5b13',
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
});

export default TeamsScreen;
