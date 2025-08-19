import { Client, Functions } from 'react-native-appwrite';
import Constants from 'expo-constants';

const appwriteUrl = Constants.expoConfig.extra.APPWRITE_URL;
const appwriteProjectId = Constants.expoConfig.extra.APPWRITE_PROJECT_ID;
const appwriteFunctionId = Constants.expoConfig.extra.EMAIL_NOTIFICATION_FUNCTION_ID;

console.log("Appwrite URL:", appwriteUrl);
console.log("Appwrite Project ID:", appwriteProjectId);
console.log("Appwrite Function ID:", appwriteFunctionId);

// Initialize Appwrite client
const client = new Client()
  .setEndpoint(appwriteUrl)
  .setProject(appwriteProjectId);

const functions = new Functions(client);

export const sendEmail = async (payload) => {
  try {
    console.log('Sending email with payload:', payload);
    
    // Set the third parameter to false for synchronous execution
    const execution = await functions.createExecution(
      appwriteFunctionId,
      JSON.stringify(payload),
      false // Set to false for synchronous execution
    );

    console.log('Execution status:', execution.status);
    console.log('Execution response:', execution.response);
    console.log('Execution stderr:', execution.stderr);

    // Handle different execution states
    if (execution.status === 'completed') {
      if (execution.response) {
        try {
          return typeof execution.response === 'string' 
            ? JSON.parse(execution.response) 
            : execution.response;
        } catch (error) {
          console.warn('Response parse warning:', error);
          return {
            success: false,
            message: `Invalid response format: ${execution.response}`
          };
        }
      }
      return {
        success: false,
        message: 'Function executed but returned empty response'
      };
    } 
    
    if (execution.status === 'failed') {
      return {
        success: false,
        message: execution.stderr || execution.response || 'Function execution failed'
      };
    }

    return {
      success: false,
      message: `Unexpected execution status: ${execution.status}`
    };
    
  } catch (error) {
    console.error('Email service error:', error);
    return {
      success: false,
      message: error.message || 'Failed to execute email function'
    };
  }
};