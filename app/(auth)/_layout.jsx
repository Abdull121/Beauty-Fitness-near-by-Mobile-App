import { Stack, } from "expo-router";

const AuthLayout = () => {
  return (
    <>
      <Stack>
        <Stack.Screen name="UserLoginScreen" options={{ headerShown: false }} />
        <Stack.Screen name="AdminLoginScreen" options={{ headerShown: false }} />
        <Stack.Screen name="SignUp" options={{ headerShown: false }} />
        <Stack.Screen name="AdminBusinessInfo" options={{ headerShown: false }} />
        
      </Stack>
      
    </>
  )
}

export default AuthLayout