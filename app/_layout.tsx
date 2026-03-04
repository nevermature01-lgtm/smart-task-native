
import React, { useState, useEffect } from 'react';
import { Slot, useRouter, useSegments } from 'expo-router';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../firebase';
import { View, ActivityIndicator } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

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

        if (user && isPublicRoute) {
            router.replace('/home');
        } else if (!user && !isPublicRoute) {
            router.replace('/');
        }
    }, [user, segments, initializing]);

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
    return (
        <GestureHandlerRootView style={{ flex: 1 }}>
            <InitialLayout />
        </GestureHandlerRootView>
    );
}
