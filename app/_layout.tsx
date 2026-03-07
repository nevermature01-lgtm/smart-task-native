import React, { useState, useEffect, useCallback } from 'react';
import { Slot, useRouter, useSegments } from 'expo-router';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../firebase';
import { View, ActivityIndicator, BackHandler, Alert, Platform } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useFocusEffect } from "@react-navigation/native";
import * as NavigationBar from "expo-navigation-bar";
import * as SystemUI from "expo-system-ui";
import Toast from 'react-native-toast-message';

const InitialLayout = () => {
    const [user, setUser] = useState(null);
    const [initializing, setInitializing] = useState(true);
    const router = useRouter();
    const segments = useSegments();

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
            setUser(currentUser);
            if (initializing) {
                setInitializing(false);
            }
        });

        return () => unsubscribe();
    }, []);

    useEffect(() => {
        if (initializing) return;

        const isPublicRoute = segments.length === 0 || ['login', 'signup', 'forgot-password'].includes(segments[0]);

        if (user && user.emailVerified && isPublicRoute) {
            router.replace('/home');
        } else if (!user && !isPublicRoute) {
            router.replace('/');
        } else if (user && !user.emailVerified && !isPublicRoute) {
            auth.signOut();
            router.replace('/login');
        }
    }, [user, segments, initializing]);

    useEffect(() => {
        if (Platform.OS === 'android') {
            const backAction = () => {
                const isAtRoot = segments.length === 0 || (segments.length === 1 && ['home', 'login', 'signup'].includes(segments[0]));

                if (isAtRoot) {
                    Alert.alert(
                        "Are you sure?",
                        "Are you sure you want to exit?",
                        [
                            { text: "Cancel", style: "cancel", onPress: () => null },
                            { text: "Exit", onPress: () => BackHandler.exitApp() }
                        ]
                    );
                    return true; 
                }

                return false;
            };

            const backHandler = BackHandler.addEventListener(
                "hardwareBackPress",
                backAction
            );

            return () => backHandler.remove();
        }
    }, [segments]);

    if (initializing) {
        return (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                <ActivityIndicator size="large" color="#999999" />
            </View>
        );
    }

    return <Slot />;
};

export default function RootLayout() {
    const lockSystemBars = async () => {
        await NavigationBar.setVisibilityAsync("visible");
        await NavigationBar.setButtonStyleAsync("dark");
        await SystemUI.setBackgroundColorAsync("#f9fafb");
    };

    useEffect(() => {
        lockSystemBars();
    }, []);

    useFocusEffect(
        useCallback(() => {
            lockSystemBars();
        }, [])
    );

    return (
        <GestureHandlerRootView style={{ flex: 1 }}>
            <InitialLayout />
            <Toast />
        </GestureHandlerRootView>
    );
}
