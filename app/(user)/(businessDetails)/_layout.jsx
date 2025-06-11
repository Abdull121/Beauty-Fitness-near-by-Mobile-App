import { Stack } from 'expo-router';
const BusinessLayout = () => {
  return (
    <Stack screenOptions={{
      headerShown: false
    }}>
      <Stack.Screen name="[id]" options={{headerShown:false,animation:'slide_from_right'}} />
    </Stack>
  );
  
}

export default BusinessLayout