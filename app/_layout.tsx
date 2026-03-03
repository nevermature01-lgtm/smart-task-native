
import { Stack, router } from 'expo-router';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useEffect } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../firebase';
import { StatusBar } from 'expo-status-bar';
import { View } from 'react-native';

export default function RootLayout() {

  useEffect(() => {
    onAuthStateChanged(auth, (user) => {
      if (user) {
        router.replace('/home');
      } else {
        router.replace('/login');
      }
    });
  }, []);

  return (
    <SafeAreaProvider>
      <View style={{ flex: 1, backgroundColor: '#F5F5F5' }}>
        <StatusBar translucent backgroundColor="transparent" style="dark" />
        <Stack
          screenOptions={{
            headerShown: false,
          }}
        />
      </View>
    </SafeAreaProvider>
  );
}
