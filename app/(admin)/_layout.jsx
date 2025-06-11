import { Stack } from 'expo-router'

const _layout = () => {
  return (
    <>
    <Stack>
            <Stack.Screen name="AdminDashboard" options={{ headerShown: false }} />
            <Stack.Screen name="(booking-details)" options={{ headerShown: false, animation: 'slide_from_right' }} />
          </Stack>
    </>
  )
}

export default _layout