
import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, Text, View, StatusBar, TouchableOpacity, ScrollView, Image, Animated, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { supabase } from '../utils/supabase';

const HomeScreen = () => {
    const [loading, setLoading] = useState(false);
    const [drawerOpen, setDrawerOpen] = useState(false);
    const [userName, setUserName] = useState('');
    const slideAnim = useRef(new Animated.Value(-300)).current;

    const colors = {
        primary: "#ec5b13",
        backgroundLight: "#f8f6f6",
        textDark: "#221610",
        textMuted: "rgba(34, 22, 16, 0.6)",
        purple: "#b794f4",
        orange: "#fbd38d",
    };

    useEffect(() => {
        const fetchUser = async () => {
            const { data, error } = await supabase.auth.getUser();
            if (error) {
                console.error('Error fetching user:', error.message);
            } else {
                setUserName(data.user?.user_metadata.full_name || 'J.Snow');
            }
        };
        fetchUser();
    }, []);

    useEffect(() => {
        Animated.timing(slideAnim, {
            toValue: drawerOpen ? 0 : -300,
            duration: 300,
            useNativeDriver: true,
        }).start();
    }, [drawerOpen]);

    const handleLogout = async () => {
        setLoading(true);
        const { error } = await supabase.auth.signOut();
        if (error) {
            console.error('Error logging out:', error.message);
        }
        setLoading(false);
    };

    const actions = [
        { icon: 'notebook-outline', label: 'Notebook', color: '#f472b6' },
        { icon: 'camera-outline', label: 'Camera', color: '#a78bfa' },
        { icon: 'microphone-outline', label: 'Audio', color: '#60a5fa' },
        { icon: 'calendar-outline', label: 'Event', color: '#fb923c' },
    ];

    const HamburgerIcon = () => (
        <TouchableOpacity onPress={() => setDrawerOpen(!drawerOpen)} style={styles.hamburgerContainer}>
            <View style={[styles.hamburgerLine, drawerOpen && styles.hamburgerLine1Open]} />
            <View style={[styles.hamburgerLine, drawerOpen && styles.hamburgerLine2Open]} />
            <View style={[styles.hamburgerLine, drawerOpen && styles.hamburgerLine3Open]} />
        </TouchableOpacity>
    );

    const Drawer = () => (
        <Animated.View style={[styles.drawerContainer, { transform: [{ translateX: slideAnim }] }]}>
            <View style={styles.drawerHeader}>
                <Image
                    source={{ uri: `https://api.dicebear.com/7.x/miniavs/png?seed=${userName}` }}
                    style={styles.drawerAvatar}
                />
                <Text style={styles.drawerUserName}>{userName}</Text>
            </View>
            <View style={styles.menuContainer}>
                <TouchableOpacity style={styles.menuItem}>
                    <MaterialCommunityIcons name="home-outline" size={24} color="white" />
                    <Text style={styles.menuItemText}>Home</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.menuItem}>
                    <MaterialCommunityIcons name="account-circle-outline" size={24} color="white" />
                    <Text style={styles.menuItemText}>Profile</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.menuItem}>
                    <MaterialCommunityIcons name="cog-outline" size={24} color="white" />
                    <Text style={styles.menuItemText}>Settings</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.menuItem}>
                    <MaterialCommunityIcons name="help-circle-outline" size={24} color="white" />
                    <Text style={styles.menuItemText}>Help</Text>
                </TouchableOpacity>
            </View>
            <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
                <MaterialCommunityIcons name="logout" size={24} color="white" />
                <Text style={styles.logoutButtonText}>Logout</Text>
            </TouchableOpacity>
        </Animated.View>
    );

    return (
        <SafeAreaView style={[styles.body, { backgroundColor: colors.backgroundLight }]}>
            <StatusBar hidden />
            {drawerOpen && <Pressable style={styles.overlay} onPress={() => setDrawerOpen(false)} />}
            <Drawer />
            <ScrollView style={styles.mainContainer}>
                {/* Header */}
                <View style={styles.header}>
                    <View style={styles.headerLeft}>
                        <HamburgerIcon />
                        <Text style={styles.userName}>Hi, {userName} 👋</Text>
                    </View>
                    <View style={styles.headerActions}>
                        <TouchableOpacity style={styles.actionButton}>
                            <MaterialCommunityIcons name="magnify" size={24} color={colors.textDark} />
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.actionButton} onPress={handleLogout}>
                            <MaterialCommunityIcons name="logout" size={24} color={colors.textDark} />
                            <View style={styles.notificationBadge} />
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Greeting */}
                <View style={styles.greetingSection}>
                    <Text style={styles.greetingTitle}>My Evernote</Text>
                    <Text style={styles.greetingDate}>Today January 11, 2027</Text>
                </View>

                {/* Quick Actions */}
                <View style={styles.quickActions}>
                    <TouchableOpacity style={[styles.quickActionCard, { backgroundColor: colors.purple }]}>
                        <View style={styles.quickActionIcon}>
                            <MaterialCommunityIcons name="plus" size={24} color="white" />
                        </View>
                        <View>
                            <Text style={styles.quickActionText}>Create</Text>
                            <Text style={styles.quickActionTitle}>New Note</Text>
                        </View>
                    </TouchableOpacity>
                    <TouchableOpacity style={[styles.quickActionCard, { backgroundColor: colors.orange }]}>
                        <View style={styles.quickActionIcon}>
                            <MaterialCommunityIcons name="plus" size={24} color="white" />
                        </View>
                        <View>
                            <Text style={styles.quickActionText}>Create</Text>
                            <Text style={styles.quickActionTitle}>New Task</Text>
                        </View>
                    </TouchableOpacity>
                </View>

                {/* Progress */}
                <View style={styles.progressSection}>
                    <View style={styles.progressCard}>
                        <View style={styles.progressInfo}>
                            <Text style={styles.progressTitle}>Complete Your <Text style={styles.progressSubtitle}>Profile Setup</Text></Text>
                            <Text style={styles.progressPercentage}>80% Done</Text>
                        </View>
                        <View style={styles.progressBar}>
                            <View style={[styles.progress, { width: '80%' }]} />
                        </View>
                    </View>
                </View>

                {/* Actions */}
                <View style={styles.actionsSection}>
                    <Text style={styles.actionsTitle}>Actions</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.actionsScroller}>
                        {actions.map((action, index) => (
                            <TouchableOpacity key={index} style={styles.actionItem}>
                                <View style={[styles.actionIconContainer, { backgroundColor: `${action.color}20` }]}>
                                    <MaterialCommunityIcons name={action.icon} size={32} color={action.color} />
                                </View>
                                <Text style={styles.actionLabel}>{action.label}</Text>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>
                </View>

                {/* Scratch Pad */}
                <View style={styles.scratchPadSection}>
                    <View style={styles.scratchPadHeader}>
                        <MaterialCommunityIcons name="pencil-outline" size={20} color={colors.textMuted} />
                        <Text style={styles.scratchPadTitle}>Scratch pad</Text>
                    </View>
                    <View style={styles.scratchPadContent} />
                </View>
            </ScrollView>

            {/* Floating Nav */}
            <View style={styles.floatingNav}>
                <TouchableOpacity style={styles.createButton}>
                    <View style={styles.createButtonIcon}>
                        <MaterialCommunityIcons name="plus" size={24} color="white" />
                    </View>
                    <Text style={styles.createButtonText}>Create</Text>
                </TouchableOpacity>
                <View style={styles.navActions}>
                    <TouchableOpacity>
                        <MaterialCommunityIcons name="note-text-outline" size={24} color="#9ca3af" />
                    </TouchableOpacity>
                    <TouchableOpacity>
                        <MaterialCommunityIcons name="folder-outline" size={24} color="#9ca3af" />
                    </TouchableOpacity>
                    <TouchableOpacity>
                        <MaterialCommunityIcons name="clipboard-check-outline" size={24} color="#9ca3af" />
                    </TouchableOpacity>
                    <TouchableOpacity>
                        <MaterialCommunityIcons name="calendar-month-outline" size={24} color="#9ca3af" />
                    </TouchableOpacity>
                </View>
            </View>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    body: {
        flex: 1,
    },
    overlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.5)',
        zIndex: 1,
    },
    drawerContainer: {
        position: 'absolute',
        top: 90,
        left: 20,
        width: 260,
        backgroundColor: '#252525',
        zIndex: 2,
        padding: 20,
        borderRadius: 24,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 8,
        },
        shadowOpacity: 0.25,
        shadowRadius: 10,
        elevation: 10,
    },
    drawerHeader: {
        alignItems: 'center',
        marginBottom: 20,
    },
    drawerAvatar: {
        width: 60,
        height: 60,
        borderRadius: 30,
        marginBottom: 10,
    },
    drawerUserName: {
        color: 'white',
        fontSize: 18,
        fontWeight: 'bold',
    },
    menuContainer: {},
    menuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 15,
    },
    menuItemText: {
        color: 'white',
        fontSize: 16,
        marginLeft: 15,
    },
    logoutButton: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 15,
        backgroundColor: '#333',
        borderRadius: 10,
        marginTop: 20,
    },
    logoutButtonText: {
        color: 'white',
        fontSize: 16,
        marginLeft: 15,
    },
    mainContainer: {
        flex: 1,
        paddingHorizontal: 24,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 16,
    },
    headerLeft: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    hamburgerContainer: {
        width: 48,
        height: 48,
        justifyContent: 'center',
        alignItems: 'center',
    },
    hamburgerLine: {
        width: 24,
        height: 2,
        backgroundColor: '#221610',
        borderRadius: 1,
        marginVertical: 3,
    },
    hamburgerLine1Open: {
        transform: [{ rotate: '45deg' }, { translateY: 8 }],
    },
    hamburgerLine2Open: {
        opacity: 0,
    },
    hamburgerLine3Open: {
        transform: [{ rotate: '-45deg' }, { translateY: -8 }],
    },
    userName: {
        fontSize: 16,
        fontWeight: 'bold',
        marginLeft: 8,
    },
    headerActions: {
        flexDirection: 'row',
        gap: 8,
    },
    actionButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'white',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#f3f4f6',
    },
    notificationBadge: {
        position: 'absolute',
        top: 10,
        right: 12,
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: '#ef4444',
        borderWidth: 1,
        borderColor: 'white',
    },
    greetingSection: {
        paddingTop: 16,
        paddingBottom: 24,
    },
    greetingTitle: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#1e293b',
    },
    greetingDate: {
        fontSize: 14,
        color: '#64748b',
        marginTop: 4,
    },
    quickActions: {
        flexDirection: 'row',
        gap: 16,
    },
    quickActionCard: {
        flex: 1,
        aspectRatio: 1,
        borderRadius: 32,
        padding: 20,
        justifyContent: 'space-between',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 10,
    },
    quickActionIcon: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    quickActionText: {
        fontSize: 14,
        color: 'white',
        opacity: 0.9,
    },
    quickActionTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: 'white',
    },
    progressSection: {
        marginTop: 32,
    },
    progressCard: {
        backgroundColor: 'white',
        borderRadius: 24,
        padding: 20,
        borderWidth: 1,
        borderColor: '#f3f4f6',
        gap: 12,
    },
    progressInfo: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    progressTitle: {
        fontWeight: 'bold',
        color: '#334155',
    },
    progressSubtitle: {
        display: 'flex',
        color: '#64748b',
        fontSize: 12,
        fontWeight: 'normal',
    },
    progressPercentage: {
        fontSize: 12,
        fontWeight: 'bold',
        color: '#475569',
    },
    progressBar: {
        width: '100%',
        height: 12,
        backgroundColor: '#f1f5f9',
        borderRadius: 6,
        overflow: 'hidden',
    },
    progress: {
        height: '100%',
        backgroundColor: '#b794f4',
        borderRadius: 6,
    },
    actionsSection: {
        marginTop: 32,
    },
    actionsTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#334155',
        marginBottom: 16,
    },
    actionsScroller: {
        paddingBottom: 16,
    },
    actionItem: {
        width: 96,
        alignItems: 'center',
        gap: 8,
        marginRight: 16,
    },
    actionIconContainer: {
        width: 80,
        height: 80,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
    },
    actionLabel: {
        fontSize: 14,
        fontWeight: '500',
        color: '#475569',
    },
    scratchPadSection: {
        marginTop: 24,
        paddingBottom: 80,
    },
    scratchPadHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 12,
    },
    scratchPadTitle: {
        fontWeight: 'bold',
        color: '#94a3b8',
        fontSize: 12,
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    scratchPadContent: {
        minHeight: 100,
        borderBottomWidth: 1,
        borderColor: '#f1f5f9',
    },
    floatingNav: {
        position: 'absolute',
        bottom: 24,
        left: '5%',
        right: '5%',
        height: 64,
        backgroundColor: '#0a051f',
        borderRadius: 32,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.2,
        shadowRadius: 20,
    },
    createButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'white',
        borderRadius: 24,
        paddingLeft: 4,
        paddingRight: 24,
        height: '100%',
    },
    createButtonIcon: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#d6bcfa',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    createButtonText: {
        fontWeight: 'bold',
        color: '#0a051f',
        fontSize: 14,
    },
    navActions: {
        flexDirection: 'row',
        gap: 16,
        paddingRight: 16,
    },
});

export default HomeScreen;
