
import React, { useState } from 'react';
import { StyleSheet, Text, View, StatusBar, TouchableOpacity, ScrollView, Image, Modal, TextInput, Pressable, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { supabase } from '../utils/supabase';

const SwitchAccountsScreen = () => {
    const [createModalVisible, setCreateModalVisible] = useState(false);
    const [joinModalVisible, setJoinModalVisible] = useState(false);
    const [teamName, setTeamName] = useState('');
    const [teamCode, setTeamCode] = useState('');

    const colors = {
        primary: "#ec5b13",
        backgroundLight: "#f8f6f6",
        backgroundDark: "#221610",
        textDark: "#221610",
        textMuted: "rgba(34, 22, 16, 0.6)",
    };

    const teams = [
        {
            name: 'Product Design',
            members: 12,
            avatars: [
                'https://lh3.googleusercontent.com/aida-public/AB6AXuANDOdOIdqAc5ZlDJJtC31HpE3L6z-jGbqQokjrbBTli6TbjB0zkbR7CJS5IQZzrwri6iPFWMyD5Fpbj0jW1IQbONZ1M6cg4bstiF9IAY7UZuVgGQveITYhrvBjKDwpWJnYwXujfw2IZDgNOLlfq0BP18JGn0q7EIdzBEM67WPxgEEnSNMiH4Jd1wd0yhOLH89WaizKmPwISFdp48tPsULAi2OUHNqDge2JIVy1WcmKbcWoHlayR3VR0mLFZHVkabSQrQ40Juo_VNg',
                'https://lh3.googleusercontent.com/aida-public/AB6AXuAnk-oULyiV4X_RNPQ6Vv77qomLwRUiPeY10Y_-2zUY-Kpl-cHEpIAqpxCEYJiVfGBVIXsQC9z86KJSww16aIat73oXSRjDjbYpPYJl5SU7jvNngeZV0-MZjhAgB65JBsqndqwY43viPpsbaPvaSnnEsFCNiXDuO4QTZcsPMPa_iJq2WEP4PhzayCL8ZbbWzzkf4qE9I24pETdObZ3_JmC2XD-4zVvgsVFpxiY-BEnqF2Xo6kPZzLilsNFFB0B3AuFPFibhlNWDRg',
                'https://lh3.googleusercontent.com/aida-public/AB6AXuBw1Epaq4WbgmtrjfQgnU0bTj3ksLRo2AUvkLkScet2tAZGBs-Ka9flXi3fTCusTIGKo2t36iQgDtl_bCWOeqDQ9M2FE9aRIJWjU1eww_Y0EtrAomv0f8_K_JJz-Xlsn8Ni29ZU06B2j0SRGMcTe9U-9NPmJFiQIWlFK-m4k_A3nPgZE_EFQGXJf_voEMCbMjmBW7TbOKsgEZwFRRQgVAh4Yo6AWKBPHvKjhCKzlBPv3iqlHCQjOzw1KmFLSSzadCMxXBuJhwxaOJY'
            ],
            remaining: 9,
        },
        {
            name: 'Sales West',
            members: 8,
            avatars: [
                'https://lh3.googleusercontent.com/aida-public/AB6AXuDX1azn1oz6OQ5zFTeLgURi-LpSlinKsNPS_c-hIgQhtFa4RdCdJU_b0_KISBrMWkHcrHve066ctsIux5cG2wbeegP5jOnjY-PcLOxOTtkXWf1AkqEuiqeCm5jrFc28CVJ7rnVacEkGH1Y8z8s1KCPMTSJIBIEaqH9kiATC8Km7QriN3D_JzBRj1_McFamFOpOGqQgN4pyGL3uQtA68V4qYTKZHO_XIo-O6N0ZdRBc-e97f_DcW0l21OnVElR0NtjkVyRn5uhke74o',
                'https://lh3.googleusercontent.com/aida-public/AB6AXuAd3TN9DtxjTMWrbOCG6Kyr3qJm63VvbpW6tRiIyUzYdBiU_iyxF1-dzX_kWHMYyN2YtFeFTmmNQr39EXXFpsST286E5DRkG2ykM9djp1VTHhXLqbbh0OSFEThDmQ7_VlYUzieCoQAPX_YXVjaEWoZa8lK1Q_Ffz84mMrZ2gozmR8RZ8KHBhCaHEA8mBThscp4qSMeYS6xxGbyRXbEuUi4eT3SvKlmUpnUHEX3LYK66_mIUBBlccGco2vVAsv6iyUKOTkC3X0c2n9w',
            ],
            remaining: 6,
        },
        {
            name: 'Q3 Project',
            members: 5,
            priority: true,
            avatars: [
                'https://lh3.googleusercontent.com/aida-public/AB6AXuBJ3uXIiw41NnwRov4uGbql23pWDnKoSTkmgPpeQVyCVAJ-vlPXNM2PHII2bonNamAw0rI4wSteHumhGX9GUzvZPHTSzTRXvoWZtxYKtKdbhq1ONoVvZ_N_s57qPEeys8j2gjoWJpwfC4KhpZebjaYnjuj192lTT-JZENjgQBSA3GN0HVAj-PO88oJhRlZxEm09Iyyt4UfZeseD-a0foFFSvR487x7jOOXyFzDScU_-8wEPQFGcjCqDS0ceOv-2lU3ppvlzHv3yx2U',
                'https://lh3.googleusercontent.com/aida-public/AB6AXuCIRcO2IRPHO97X-cc5jhZJ8MjxcGJ6_LXNYiusO_NX7y49156NnNuTr8mUmIhk3DXTwPOPyvEGO7WgqXez-XrG-gm0721CbAI-IH4Y069C4ixY6fuWde0tZfoH8gDnRl3LZRkKADdhmDn-xUmoDO1pMSQ5CX0rzDQ5neYYDsE1GSO0JAd6P9sUK8OB_s-YuM7A7AAKuTaXunVBC2zb_HH7TNown8RSb2SKQwK56YmT9ZPLp_GvS0IBGo5N5dN4LHZsoA2ntN9LDx0',
                'https://lh3.googleusercontent.com/aida-public/AB6AXuDja02z6IIzc_-FfNmNc08IM753zL7MFgtuNIhKJCFyDwJ05KZqhBSfoJ0fYM3t8l7Tt-H15poZZQoh8gyQ4YWW9wDQVt-SsJMIFeBdyvmwCB7Lrozkx7MgE4rO8wtjDfmL90FhpjoBGqyTgy-ha1NMHtAsTFjVS09zYrr6j1WAqUpM1EX0naACqeQ-n0w4JxnGFuLtMYHkS3LI4OjTGn4yznuTQoJFQto8qHAVaIvkSPCDQGO4a9NNpUH0nIgPXIpFs2wPwxLnEFY',
                'https://lh3.googleusercontent.com/aida-public/AB6AXuAt9xC1QqGI5g-WgtrWAeRoc4XhyaY2lyMCzEenFnjnCm8xm7qWD2CT_stxuLkPP41MvjvzzOuHv2zuEb0bJX2V6PKD4-MZT5cWUl26MGhov-nVAIKeOqIqo-ZNgmaDbEG6TtA5twPMtytG6HqoSvrFHMzbZVQhFH8mVLHnJUc8lvCiY2wTsOw-FZtiOtZWJpBlCVYB-UPOjJ1_m8HNmGjD8_Tl4TYZW8EVQzMcU5mSHCSjxExyHMwL0Y6dTTpDREzcU6iPQBtGocw',
            ],
            remaining: 1,
        },
    ];

    const handleCreateTeam = async () => {
        if (!teamName.trim()) {
            Alert.alert('Please enter a team name.');
            return;
        }

        const { data: { user } } = await supabase.auth.getUser();

        if (user) {
            const { data: newTeam, error: teamError } = await supabase
                .from('teams')
                .insert({ name: teamName, creator_id: user.id })
                .select()
                .single();

            if (teamError || !newTeam) {
                console.error('Error creating team:', teamError);
                Alert.alert('Failed to create team. Please try again.');
                return;
            }

            const { error: memberError } = await supabase
                .from('team_members')
                .insert({ team_id: newTeam.id, user_id: user.id, role: 'owner' });

            if (memberError) {
                console.error('Error adding owner to team:', memberError);
                Alert.alert('Team created, but failed to make you an owner. Please contact support.');
                await supabase.from('teams').delete().eq('id', newTeam.id);
                return;
            }

            Alert.alert(`Team "${teamName}" created successfully!`);
            setCreateModalVisible(false);
            setTeamName('');
        }
    };

    const handleJoinTeam = async () => {
        if (!teamCode.trim()) {
            Alert.alert('Please enter a team code.');
            return;
        }

        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
            const { data: team, error: findError } = await supabase
                .from('teams')
                .select('id')
                .eq('code', teamCode.trim())
                .single();

            if (findError || !team) {
                console.error('Error finding team:', findError);
                Alert.alert('Invalid team code. Please check the code and try again.');
                return;
            }

            const { error: memberError } = await supabase
                .from('team_members')
                .insert({ team_id: team.id, user_id: user.id });

            if (memberError) {
                if (memberError.code === '23505') { // unique_violation
                    Alert.alert("You are already a member of this team.");
                } else {
                    console.error('Error joining team:', memberError);
                    Alert.alert('Failed to join team. Please try again.');
                }
                return;
            }

            Alert.alert('Successfully joined team!');
            setJoinModalVisible(false);
            setTeamCode('');
        }
    };

    return (
        <SafeAreaView style={[styles.body, { backgroundColor: colors.backgroundLight }]}>
            <StatusBar hidden />
            <ScrollView style={styles.mainContainer}>
                <View style={styles.grid}>
                    <TouchableOpacity style={styles.card} onPress={() => setCreateModalVisible(true)}>
                        <View style={styles.iconContainer}>
                            <MaterialCommunityIcons name="add_circle" size={24} color="white" />
                        </View>
                        <View>
                            <Text style={styles.cardTitle}>Create Team</Text>
                            <Text style={styles.cardSubtitle}>Start a workspace</Text>
                        </View>
                    </TouchableOpacity>
                    <TouchableOpacity style={[styles.card, styles.cardSecondary]} onPress={() => setJoinModalVisible(true)}>
                        <View style={[styles.iconContainer, styles.iconContainerSecondary]}>
                            <MaterialCommunityIcons name="group_add" size={24} color={colors.primary} />
                        </View>
                        <View>
                            <Text style={styles.cardTitle}>Join Team</Text>
                            <Text style={styles.cardSubtitle}>Enter a team code</Text>
                        </View>
                    </TouchableOpacity>
                </View>

                <View style={styles.sectionTitleContainer}>
                    <Text style={styles.sectionTitle}>Your Teams</Text>
                </View>

                <View style={styles.teamsList}>
                    {teams.map((team, index) => (
                        <TouchableOpacity key={index} style={[styles.teamCard, team.priority && styles.priorityCard]}>
                            <View style={styles.teamInfo}>
                                <View style={styles.teamNameContainer}>
                                    <Text style={styles.teamName}>{team.name}</Text>
                                    {team.priority && <Text style={styles.priorityPill}>Priority</Text>}
                                </View>
                                <Text style={styles.teamMembers}>{team.members} Members</Text>
                                <View style={styles.avatarStack}>
                                    {team.avatars.map((avatar, i) => (
                                        <Image key={i} source={{ uri: avatar }} style={styles.avatar} />
                                    ))}
                                    {team.remaining > 0 && (
                                        <View style={styles.avatarRemaining}>
                                            <Text style={styles.avatarRemainingText}>+{team.remaining}</Text>
                                        </View>
                                    )}
                                </View>
                            </View>
                            <View>
                                <MaterialCommunityIcons name="chevron-right" size={20} color="#9ca3af" />
                            </View>
                        </TouchableOpacity>
                    ))}
                </View>

                <View style={styles.emptyState}>
                    <MaterialCommunityIcons name="diversity_3" size={48} color="#d1d5db" />
                    <Text style={styles.emptyStateText}>Looking for more teams?</Text>
                </View>
            </ScrollView>

            <View style={styles.bottomNav}>
                <TouchableOpacity style={styles.navButton} onPress={() => router.push('/home')}>
                    <MaterialCommunityIcons name="assignment" size={24} color="#9ca3af" />
                    <Text style={styles.navText}>Tasks</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.navButton}>
                    <MaterialCommunityIcons name="group" size={24} color={colors.primary} style={{fontVariationSettings: "'FILL' 1"}}/>
                    <Text style={[styles.navText, { color: colors.primary, fontWeight: 'bold' }]}>Teams</Text>
                </TouchableOpacity>
                <View style={styles.fabContainer}>
                    <TouchableOpacity style={styles.fab}>
                        <MaterialCommunityIcons name="plus" size={24} color="white" />
                    </TouchableOpacity>
                </View>
                <TouchableOpacity style={styles.navButton}>
                    <MaterialCommunityIcons name="chat_bubble" size={24} color="#9ca3af" />
                    <Text style={styles.navText}>Chat</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.navButton}>
                    <MaterialCommunityIcons name="settings" size={24} color="#9ca3af" />
                    <Text style={styles.navText}>Settings</Text>
                </TouchableOpacity>
            </View>

            <Modal
                animationType="slide"
                transparent={true}
                visible={createModalVisible}
                onRequestClose={() => {
                    setCreateModalVisible(!createModalVisible);
                }}
            >
                <View style={styles.centeredView}>
                    <View style={styles.modalView}>
                        <Text style={styles.modalText}>Enter Team name</Text>
                        <TextInput
                            style={styles.input}
                            onChangeText={setTeamName}
                            value={teamName}
                            placeholder="Team Name"
                        />
                        <Pressable
                            style={[styles.button, styles.buttonClose]}
                            onPress={handleCreateTeam}
                        >
                            <Text style={styles.textStyle}>Submit</Text>
                        </Pressable>
                    </View>
                </View>
            </Modal>

            <Modal
                animationType="slide"
                transparent={true}
                visible={joinModalVisible}
                onRequestClose={() => {
                    setJoinModalVisible(!joinModalVisible);
                }}
            >
                <View style={styles.centeredView}>
                    <View style={styles.modalView}>
                        <Text style={styles.modalText}>Enter your code</Text>
                        <TextInput
                            style={styles.input}
                            onChangeText={setTeamCode}
                            value={teamCode}
                            placeholder="Team Code"
                        />
                        <Pressable
                            style={[styles.button, styles.buttonClose]}
                            onPress={handleJoinTeam}
                        >
                            <Text style={styles.textStyle}>Submit</Text>
                        </Pressable>
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
    mainContainer: {
        flex: 1,
        paddingHorizontal: 16,
    },
    grid: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 16,
    },
    card: {
        width: '48%',
        backgroundColor: 'white',
        borderRadius: 12,
        padding: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 1,
        borderWidth: 1,
        borderColor: 'rgba(236, 91, 19, 0.2)',
    },
    cardSecondary: {
        borderColor: 'rgba(0, 0, 0, 0.1)',
    },
    iconContainer: {
        width: 40,
        height: 40,
        borderRadius: 8,
        backgroundColor: '#ec5b13',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 12,
        shadowColor: 'rgba(236, 91, 19, 0.2)',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 1,
        shadowRadius: 8,
        elevation: 5,
    },
    iconContainerSecondary: {
        backgroundColor: 'rgba(236, 91, 19, 0.1)',
        shadowColor: 'transparent',
    },
    cardTitle: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#1f2937',
    },
    cardSubtitle: {
        fontSize: 12,
        color: '#6b7280',
        marginTop: 4,
    },
    sectionTitleContainer: {
        paddingHorizontal: 0,
        paddingTop: 24,
        paddingBottom: 8,
    },
    sectionTitle: {
        fontSize: 10,
        fontWeight: 'bold',
        color: '#9ca3af',
        textTransform: 'uppercase',
        letterSpacing: 1.5,
    },
    teamsList: {
        paddingHorizontal: 0,
    },
    teamCard: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: 'white',
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 1,
        borderWidth: 1,
        borderColor: '#e5e7eb',
    },
    priorityCard: {
        borderLeftWidth: 4,
        borderLeftColor: '#ec5b13',
    },
    teamInfo: {
        flex: 1,
    },
    teamNameContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 4,
    },
    teamName: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#111827',
    },
    priorityPill: {
        marginLeft: 8,
        backgroundColor: 'rgba(236, 91, 19, 0.1)',
        color: '#ec5b13',
        fontSize: 10,
        fontWeight: 'bold',
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 9999,
        textTransform: 'uppercase',
    },
    teamMembers: {
        fontSize: 12,
        color: '#6b7280',
    },
    avatarStack: {
        flexDirection: 'row',
        marginTop: 12,
    },
    avatar: {
        width: 28,
        height: 28,
        borderRadius: 14,
        borderWidth: 2,
        borderColor: 'white',
        marginLeft: -8,
    },
    avatarRemaining: {
        width: 28,
        height: 28,
        borderRadius: 14,
        backgroundColor: '#e5e7eb',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: 'white',
        marginLeft: -8,
    },
    avatarRemainingText: {
        fontSize: 10,
        fontWeight: 'bold',
    },
    emptyState: {
        alignItems: 'center',
        justifyContent: 'center',
        padding: 32,
        marginTop: 16,
        opacity: 0.4,
    },
    emptyStateText: {
        fontSize: 12,
        color: '#9ca3af',
        marginTop: 8,
    },
    bottomNav: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 8,
        paddingHorizontal: 24,
        backgroundColor: 'white',
        borderTopWidth: 1,
        borderColor: '#e5e7eb',
    },
    navButton: {
        alignItems: 'center',
    },
    navText: {
        fontSize: 10,
        fontWeight: '500',
        color: '#9ca3af',
    },
    fabContainer: {
        position: 'relative',
        bottom: 24,
    },
    fab: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: '#ec5b13',
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#ec5b13',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.3,
        shadowRadius: 20,
        elevation: 10,
    },
    centeredView: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 22,
    },
    modalView: {
        margin: 20,
        backgroundColor: 'white',
        borderRadius: 20,
        padding: 35,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.25,
        shadowRadius: 4,
        elevation: 5,
    },
    button: {
        borderRadius: 20,
        padding: 10,
        elevation: 2,
    },
    buttonClose: {
        backgroundColor: '#2196F3',
    },
    textStyle: {
        color: 'white',
        fontWeight: 'bold',
        textAlign: 'center',
    },
    modalText: {
        marginBottom: 15,
        textAlign: 'center',
    },
    input: {
        height: 40,
        margin: 12,
        borderWidth: 1,
        padding: 10,
        width: 200,
    },
});

export default SwitchAccountsScreen;
