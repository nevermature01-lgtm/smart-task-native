
import React from 'react';
import { StyleSheet, Text, View, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const HomeScreen = () => {
    const colors = {
        primary: "#ec5b13",
        backgroundLight: "#f8f6f6",
        textDark: "#221610",
    };

    return (
        <SafeAreaView style={[styles.body, { backgroundColor: colors.backgroundLight }]}>
            <StatusBar hidden />
            <View style={styles.mainContainer}>
                <Text style={[styles.title, { color: colors.textDark }]}>Welcome Home</Text>
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
});

export default HomeScreen;
