
import React, { useState } from 'react';
import { StyleSheet, Text, View, StatusBar, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { supabase } from '../utils/supabase';

const HomeScreen = () => {
    const [loading, setLoading] = useState(false);

    const colors = {
        primary: "#ec5b13",
        backgroundLight: "#f8f6f6",
        textDark: "#221610",
        textMuted: "rgba(34, 22, 16, 0.6)",
    };

    const handleLogout = async () => {
        setLoading(true);
        const { error } = await supabase.auth.signOut();
        if (error) {
            Alert.alert('Error', error.message);
        }
        setLoading(false);
    };

    return (
        <SafeAreaView style={[styles.body, { backgroundColor: colors.backgroundLight }]}>
            <StatusBar hidden />
            <View style={styles.mainContainer}>
                <Text style={[styles.title, { color: colors.textDark }]}>Welcome Home</Text>
                <TouchableOpacity style={styles.logoutButton} onPress={handleLogout} disabled={loading}>
                    <MaterialCommunityIcons name="logout" size={24} color={colors.textMuted} />
                </TouchableOpacity>
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
        justifyContent: 'center',
        alignItems: 'center',
    },
    title: {
        fontSize: 32,
        fontWeight: 'bold',
    },
    logoutButton: {
        position: 'absolute',
        top: 20,
        right: 20,
    },
});

export default HomeScreen;
