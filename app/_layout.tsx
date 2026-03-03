
import { Stack } from 'expo-router';
import { useFonts, Inter_400Regular, Inter_700Bold } from '@expo-google-fonts/inter';

export default function RootLayout() {
  let [fontsLoaded] = useFonts({
    Inter_400Regular,
    Inter_700Bold,
  });

  if (!fontsLoaded) {
    return null;
  }

  return (
    <Stack>
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="home" options={{ headerShown: false }} />
        <Stack.Screen name="menu" options={{ headerShown: false }} />
        <Stack.Screen name="switch-account" options={{ headerShown: false }} />
        <Stack.Screen name="manage-teams" options={{ headerShown: false }} />
    </Stack>
  );
}
