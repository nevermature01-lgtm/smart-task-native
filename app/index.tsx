
import React, { useState } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons, MaterialIcons } from '@expo/vector-icons';
import SignUp from './signup';
import LogIn from './login';

const App = () => {
    const [screen, setScreen] = useState('welcome'); // welcome, signup, or login

    const colors = {
        primary: "#ec5b13",
        backgroundLight: "#f8f6f6",
        textDark: "#221610",
        textMuted: "rgba(34, 22, 16, 0.6)",
    };

    if (screen === 'signup') {
        return <SignUp onBack={() => setScreen('welcome')} onLogIn={() => setScreen('login')} />;
    }

    if (screen === 'login') {
        return <LogIn onBack={() => setScreen('welcome')} onSignUp={() => setScreen('signup')} />;
    }

    return (
        <SafeAreaView style={[styles.body, { backgroundColor: colors.backgroundLight }]}>
            <StatusBar hidden />
            <View style={styles.mainContainer}>
                {/* Navigation */}
                <View style={styles.nav}>
                    <View style={styles.logoContainer}>
                        <View style={[styles.logoIconBg, { backgroundColor: 'rgba(236, 91, 19, 0.1)' }]}>
                            <MaterialCommunityIcons name="check-circle-outline" size={24} color={colors.primary} />
                        </View>
                        <Text style={[styles.logoText, { color: colors.textDark }]}>Smart Task</Text>
                    </View>
                    <TouchableOpacity>
                        <MaterialCommunityIcons name="help-circle-outline" size={24} color={colors.textMuted} />
                    </TouchableOpacity>
                </View>

                {/* Hero Content */}
                <View style={styles.heroSection}>
                    <View style={styles.iconWrapper}>
                        <View style={[styles.mainIconContainer, { backgroundColor: 'white', borderColor: 'rgba(236, 91, 19, 0.2)' }]}>
                            <MaterialCommunityIcons name="layers-outline" size={60} color={colors.primary} />
                        </View>
                        <View style={[styles.accentIcon1, { backgroundColor: colors.primary }]}>
                            <MaterialCommunityIcons name="check-all" size={16} color="white" />
                        </View>
                        <View style={[styles.accentIcon2, { backgroundColor: colors.backgroundLight, borderColor: 'rgba(236, 91, 19, 0.2)' }]}>
                            <MaterialIcons name="priority-high" size={12} color={colors.primary} />
                        </View>
                    </View>

                    <View style={styles.textContent}>
                        <Text style={[styles.title, { color: colors.textDark }]}>
                            Master Your Day<Text style={{ color: colors.primary }}>.</Text>
                        </Text>
                        <Text style={[styles.subtitle, { color: colors.textMuted }]}>
                            Organize tasks, set priorities, and achieve your goals with ease in one minimalist workspace.
                        </Text>
                    </View>
                </View>

                {/* Action Buttons */}
                <View style={styles.actionGroup}>
                    <TouchableOpacity 
                        style={[styles.primaryButton, { backgroundColor: colors.primary }]}
                        onPress={() => setScreen('signup')}
                    >
                        <Text style={styles.primaryButtonText}>Start Planning</Text>
                        <MaterialCommunityIcons name="arrow-right" size={20} color="white" />
                    </TouchableOpacity>
                    <TouchableOpacity 
                        style={[styles.secondaryButton, { borderColor: 'rgba(236, 91, 19, 0.2)' }]}
                        onPress={() => setScreen('login')}
                    >
                        <Text style={[styles.secondaryButtonText, { color: colors.textDark }]}>Log In</Text>
                    </TouchableOpacity>
                    <Text style={[styles.footerText, { color: 'rgba(34, 22, 16, 0.4)'}]}>
                        Focused • Productive • Simple
                    </Text>
                </View>
            </View>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    body: {
        flex: 1,
    },
    mainContainer: {
        flex: 1,
        paddingHorizontal: 24,
    },
    nav: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingTop: 16,
        paddingBottom: 16,
    },
    logoContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    logoIconBg: {
        padding: 8,
        borderRadius: 8,
    },
    logoText: {
        fontSize: 20,
        fontWeight: 'bold',
        letterSpacing: -0.5,
    },
    heroSection: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    iconWrapper: {
        width: 128,
        height: 128,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 48,
    },
    mainIconContainer: {
        width: 128,
        height: 128,
        borderWidth: 1,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: "#000",
        shadowOffset: {
            width: 0,
            height: 10,
        },
        shadowOpacity: 0.1,
        shadowRadius: 20,
        elevation: 15,
    },
    accentIcon1: {
        position: 'absolute',
        top: -16,
        right: -16,
        width: 40,
        height: 40,
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 5,
        elevation: 10,
    },
    accentIcon2: {
        position: 'absolute',
        bottom: -8,
        left: -24,
        width: 32,
        height: 32,
        borderRadius: 16,
        borderWidth: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    textContent: {
        maxWidth: 350,
        marginHorizontal: 'auto',
        gap: 16,
    },
    title: {
        fontSize: 40,
        fontWeight: '800',
        textAlign: 'center',
        lineHeight: 44,
    },
    subtitle: {
        fontSize: 18,
        fontWeight: '400',
        textAlign: 'center',
        lineHeight: 28,
    },
    actionGroup: {
        paddingBottom: 24,
        gap: 16,
    },
    primaryButton: {
        height: 56,
        borderRadius: 12,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        shadowColor: "#ec5b13",
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.3,
        shadowRadius: 30,
        elevation: 10,
    },
    primaryButtonText: {
        color: 'white',
        fontSize: 18,
        fontWeight: 'bold',
    },
    secondaryButton: {
        height: 56,
        borderRadius: 12,
        borderWidth: 2,
        alignItems: 'center',
        justifyContent: 'center',
    },
    secondaryButtonText: {
        fontSize: 18,
        fontWeight: '600',
    },
    footerText: {
        textAlign: 'center',
        fontSize: 10,
        textTransform: 'uppercase',
        letterSpacing: 2,
        paddingTop: 16,
    }
});

export default App;
