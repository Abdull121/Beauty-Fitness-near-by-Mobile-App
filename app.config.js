export default {
  expo: {
    name: "beautyfitness",
    slug: "beautyfitness",
    version: "1.0.0",
    orientation: "portrait",
    icon: "./assets/images/icon.png",
    scheme: "beautyfitness",
    userInterfaceStyle: "automatic",
    newArchEnabled: true,
    ios: {
      supportsTablet: true
    },
    android: {
      adaptiveIcon: {
        foregroundImage: "./assets/images/adaptive-icon.png",
        backgroundColor: "#ffffff"
      },
      edgeToEdgeEnabled: true,
      package: "com.abdulldev.beautyfitness"
    },
    web: {
      bundler: "metro",
      output: "static",
      favicon: "./assets/images/favicon.png"
    },
    plugins: [
      "expo-router",
      [
        "expo-splash-screen",
        {
          "image": "./assets/images/splash-icon.png",
          "imageWidth": 200,
          "resizeMode": "contain",
          "backgroundColor": "#ffffff"
        }
      ],
      [
        "expo-location",
        {
          "locationAlwaysAndWhenInUsePermission": "Allow beauty Fitness to use your location."
        }
      ],
       [
    "expo-secure-store"
  ],
    ],
    experiments: {
      typedRoutes: true
    },
    extra: {
      APPWRITE_URL: process.env.APPWRITE_URL,
      APPWRITE_PROJECT_ID : process.env.APPWRITE_PROJECT_ID,
      DATABSE_ID: process.env.DATABSE_ID,
      SALON_GYM_COLLECTION : process.env.SALON_GYM_COLLECTION,
      USERBOOKING_COLLECTION: process.env.USERBOOKING_COLLECTION,
      ADMIN_COLLECTION: process.env.ADMIN_COLLECTION,
      USER_REGESTRATION_COLLECTION: process.env.USER_REGESTRATION_COLLECTION,
      SALONGYM_API_KEY: process.env.SALONGYM_API_KEY,
      
      
      

    },
  }
};