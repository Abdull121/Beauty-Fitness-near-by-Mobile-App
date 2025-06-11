import { Stack } from 'expo-router';
const UserLayout = () => {
  return (
    <Stack screenOptions={{
      headerShown: false
    }}>
      <Stack.Screen name="UserBooking" options={{headerShown:false}} />
      <Stack.Screen name="(businessDetails)" options={{headerShown:false, animation:'slide_from_right'}} />
    </Stack>
  );
  
}

export default UserLayout