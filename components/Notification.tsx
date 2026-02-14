
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

const Notification = ({ message, onHide, type }) => {
    const colors = {
        primary: "#ec5b13",
        backgroundLight: "#f8f6f6",
        textDark: "#221610",
        textMuted: "rgba(34, 22, 16, 0.6)",
        success: "#28a745",
        error: "#dc3545",
    };

    const notificationStyle = {
        ...styles.notification,
        backgroundColor: type === 'success' ? colors.success : colors.error,
    };

    return (
        <View style={notificationStyle}>
            <Text style={styles.notificationText}>{message}</Text>
            <TouchableOpacity onPress={onHide} style={styles.closeButton}>
                <MaterialCommunityIcons name="close" size={20} color="white" />
            </TouchableOpacity>
        </View>
    );
};

const styles = StyleSheet.create({
    notification: {
        position: 'absolute',
        top: 50,
        left: 20,
        right: 20,
        padding: 15,
        borderRadius: 10,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        zIndex: 1000,
        elevation: 5,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
    },
    notificationText: {
        color: 'white',
        fontSize: 16,
        fontWeight: 'bold',
    },
    closeButton: {
        padding: 5,
    },
});

export default Notification;
