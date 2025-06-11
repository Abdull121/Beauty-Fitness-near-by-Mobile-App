import { Stack } from "expo-router";


export default function RootLayout() {
  return <Stack>
      <Stack.Screen name="index" options={{ headerShown: false}} />
      <Stack.Screen name="(auth)" options={{ headerShown: false }} />
      <Stack.Screen name="(admin)" options={{ headerShown: false }} />
      <Stack.Screen name="(user)" options={{ headerShown: false, animation:'slide_from_right' }} />
    
    </Stack>
}
