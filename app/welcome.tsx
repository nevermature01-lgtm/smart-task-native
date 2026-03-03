import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { MaterialIcons } from '@expo/vector-icons';
import { router } from 'expo-router';

const COLORS = {
    primary: '#2563EB',
    backgroundLight: '#F8F9FA',
    backgroundDark: '#111827',
    white: '#ffffff',
    textLight: '#1F2937',
    textDark: '#F9FAFB',
};

const WelcomeScreen = () => {

    const styles = StyleSheet.create({
        container: {
            flex: 1,
            backgroundColor: COLORS.backgroundLight,
            paddingTop: 70
        },
        header: {
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            paddingHorizontal: 24,
            paddingBottom: 12,
        },
        logoContainer: {
            flexDirection: 'row',
            alignItems: 'center',
            gap: 12,
        },
        logoIconContainer: {
            backgroundColor: 'rgba(37, 99, 235, 0.1)',
            padding: 8,
            borderRadius: 8,
        },
        logoTextContainer: {

        },
        logoText: {
            color: COLORS.textLight,
            fontWeight: 'bold',
            fontSize: 20,
            letterSpacing: -0.5,
        },
        logoSubtitle: {
            fontSize: 12,
            color: 'rgba(31, 41, 55, 0.6)',
        },
        heroContainer: {
            flex: 1,
            alignItems: 'center',
            justifyContent: 'center',
            paddingHorizontal: 24,
            textAlign: 'center',
        },
        iconBox: {
            width: 128,
            height: 128,
            backgroundColor: COLORS.white,
            borderWidth: 1,
            borderColor: 'rgba(37, 99, 235, 0.2)',
            borderRadius: 12,
            alignItems: 'center',
            justifyContent: 'center',
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 10 },
            shadowOpacity: 0.1,
            shadowRadius: 20,
            elevation: 5,
            marginBottom: 48,
        },
        mainIcon: {
            fontSize: 64,
            color: COLORS.primary,
        },
        textContent: {
            maxWidth: 384,
            marginHorizontal: 'auto',
        },
        title: {
            fontSize: 40,
            fontWeight: '800',
            color: COLORS.textLight,
            lineHeight: 48,
            letterSpacing: -1,
            textAlign: 'center',
        },
        primaryText: {
            color: COLORS.primary,
        },
        subtitle: {
            fontSize: 18,
            color: 'rgba(31, 41, 55, 0.6)',
            fontWeight: '400',
            lineHeight: 28,
            textAlign: 'center',
            marginTop: 16,
        },
        actionContainer: {
            width: '100%',
            maxWidth: 384,
            marginHorizontal: 'auto',
            paddingHorizontal: 24,
            paddingBottom: 48,
            gap: 16,
        },
        primaryButton: {
            height: 56,
            width: '100%',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: 12,
            backgroundColor: COLORS.primary,
            shadowColor: 'rgb(37, 99, 235)',
            shadowOffset: { width: 0, height: 8 },
            shadowOpacity: 0.3,
            shadowRadius: 30,
            elevation: 5,
        },
        primaryButtonText: {
            flexDirection: 'row',
            alignItems: 'center',
            color: COLORS.white,
            fontWeight: 'bold',
            fontSize: 18,
        },
        secondaryButton: {
            height: 56,
            width: '100%',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: 12,
            borderWidth: 2,
            borderColor: 'rgba(37, 99, 235, 0.2)',
        },
        secondaryButtonText: {
            color: COLORS.textLight,
            fontWeight: '600',
            fontSize: 18,
        },
        footerText: {
            textAlign: 'center',
            fontSize: 10,
            color: 'rgba(31, 41, 55, 0.4)',
            paddingTop: 16,
            textTransform: 'uppercase',
            letterSpacing: 3,
        },
    });

    return (
        <View style={{ flex: 1, backgroundColor: '#F8F9FA' }}>
            <StatusBar translucent backgroundColor="transparent" style="dark" />
            <View style={styles.container}>
                <View style={styles.header}>
                    <View style={styles.logoContainer}>
                        <View style={styles.logoIconContainer}>
                            <MaterialIcons name="task-alt" size={24} color={COLORS.primary} />
                        </View>
                        <View style={styles.logoTextContainer}>
                            <Text style={styles.logoText}>Smart Task</Text>
                            <Text style={styles.logoSubtitle}>powered by Smart Decor</Text>
                        </View>
                    </View>
                </View>

                <View style={styles.heroContainer}>
                    <View style={styles.iconBox}>
                        <MaterialIcons name="layers" style={styles.mainIcon} />
                    </View>
                    <View style={styles.textContent}>
                        <Text style={styles.title}>
                            Master Your Day<Text style={styles.primaryText}>.</Text>
                        </Text>
                        <Text style={styles.subtitle}>
                            Organize tasks, set priorities, and achieve your goals with ease in one minimalist workspace.
                        </Text>
                    </View>
                </View>

                <View style={styles.actionContainer}>
                    <TouchableOpacity style={styles.primaryButton} onPress={() => router.push('/signup')}>
                        <Text style={styles.primaryButtonText}>
                            Start Planning <MaterialIcons name="arrow-forward" size={18} />
                        </Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.secondaryButton} onPress={() => router.push('/login')}>
                        <Text style={styles.secondaryButtonText}>Log In</Text>
                    </TouchableOpacity>
                    <Text style={styles.footerText}>Focused • Productive • Simple</Text>
                </View>
            </View>
        </View>
    );
};

export default WelcomeScreen;
