import Constants from "expo-constants";
import * as SecureStore from "expo-secure-store";
import { Account, Client, Databases, ID } from "react-native-appwrite";

export class AuthService {
  appwriteConfig = {
    appwriteUrl: Constants.expoConfig.extra.APPWRITE_URL,
    appwriteProjectId: Constants.expoConfig.extra.APPWRITE_PROJECT_ID,
    appwriteDatabaseId: Constants.expoConfig.extra.DATABSE_ID,
    salongymCollection: Constants.expoConfig.extra.SALON_GYM_COLLECTION,
    userBookingCollection: Constants.expoConfig.extra.USERBOOKING_COLLECTION,
    userRegistrationCollection:
      Constants.expoConfig.extra.USER_REGESTRATION_COLLECTION,
    adminCollection: Constants.expoConfig.extra.ADMIN_COLLECTION,
  };

  client = new Client();
  // avatars = new Avatars(this.client)
  // Create databases instance
  databases = new Databases(this.client);
  account;

  constructor() {
    // console.log(this.appwriteConfig.appwriteUrl)

    if (
      !this.appwriteConfig.appwriteUrl ||
      !this.appwriteConfig.appwriteProjectId
    ) {
      //throw new Error("Appwrite configuration is missing");
      return null;
    }

    this.client
      .setEndpoint(this.appwriteConfig.appwriteUrl)
      .setProject(this.appwriteConfig.appwriteProjectId);

    this.account = new Account(this.client);
  }

  // create new admin account

  async createAdminAccount({ username, email, password }) {
    // Format and validate email
    const formattedEmail = email.trim().toLowerCase();

    console.log(
      "Creating admin account with username:",
      username,
      "email:",
      formattedEmail
    );

    if (!username || !formattedEmail || !password) {
      throw new Error("Missing username, email, or password");
    }

    // Validate email format on the client side too
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(formattedEmail)) {
      throw new Error(
        "Invalid email format. Please use a valid email address."
      );
    }

    try {
      // Step 1: Create the user account in Appwrite Authentication
      console.log("About to create account with:", {
        username,
        email: formattedEmail,
        passwordLength: password.length, // Don't log the actual password
      });

      const userAccount = await this.account.create(
        ID.unique(),
        formattedEmail, // Email should be second parameter
        password, // Password third
        username
      );

      if (!userAccount) {
        throw new Error("Failed to create user account");
      }

      console.log("User account created successfully:", userAccount);

      try {
        // Step 2: Log in with the new account
        const session = await this.login({
          email: formattedEmail, // Use the formatted email
          password,
        });
        console.log("Logged in with new account:", session);

        // Step 3: Store admin user in database
        const newAdmin = await this.databases.createDocument(
          this.appwriteConfig.appwriteDatabaseId,
          this.appwriteConfig.adminCollection,
          ID.unique(),
          {
            accountId: userAccount.$id,
            username: username,
            email: formattedEmail,
          }
        );

        console.log("Admin record created in database:", newAdmin);
        return newAdmin;
      } catch (dbError) {
        console.error("Failed to create admin record:", dbError);
        // Even if the database entry fails, the account was created, so we return the user account
        return userAccount;
      }
    } catch (error) {
      console.error("Admin account creation error:", error);
      if (error.message.includes("email")) {
        throw new Error(
          "Invalid email format. Please use a valid email address."
        );
      } else {
        throw error; // Re-throw to handle in the UI
      }
    }
  }

  //crete a new user account
  async createUserAccount({ username, email, password }) {
    // Format and validate email
    const formattedEmail = email.trim().toLowerCase();

    console.log(
      "Creating user account with username:",
      username,
      "email:",
      formattedEmail
    );

    if (!username || !formattedEmail || !password) {
      throw new Error("Missing username, email, or password");
    }

    // Validate email format on the client side too
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(formattedEmail)) {
      throw new Error(
        "Invalid email format. Please use a valid email address."
      );
    }

    try {
      // Step 1: Create the user account in Appwrite Authentication
      console.log("About to create account with:", {
        username,
        email: formattedEmail,
        passwordLength: password.length,
      });

      const userAccount = await this.account.create(
        ID.unique(),
        formattedEmail, // Email should be second parameter
        password, // Password third
        username
      );

      if (!userAccount) {
        throw new Error("Failed to create user account");
      }

      console.log("User account created successfully:", userAccount);

      try {
        // Step 2: Log in with the new account
        // const session = await this.login({
        //   email: formattedEmail, // Use the formatted email
        //   password
        // });
        // console.log("Logged in with new account:", session);

        // Step 3: Store admin user in database
        const newUser = await this.databases.createDocument(
          this.appwriteConfig.appwriteDatabaseId,
          this.appwriteConfig.userRegistrationCollection,
          ID.unique(),
          {
            accountId: userAccount.$id,
            username: username,
            email: formattedEmail,
          }
        );

        console.log("User record created in database:", newUser);
        return newUser;
      } catch (dbError) {
        console.error("Failed to create user record:", dbError);
        // Even if the database entry fails, the account was created, so we return the user account
        return userAccount;
      }
    } catch (error) {
      console.error("user account creation error:", error);
      if (error.message.includes("email")) {
        throw new Error(
          "Invalid email format. Please use a valid email address."
        );
      } else {
        throw error; // Re-throw to handle in the UI
      }
    }
  }

  async login({ email, password }) {
    try {
      if (!email || !password) {
        throw new Error("Missing email or password");
      }

      // Check for existing session
      try {
        const currentAccount = await this.account.get();
        console.log("Current account:", currentAccount);
        if (currentAccount) {
          // Delete all active sessions
          await this.account.deleteSessions();
        }
      } catch (error) {
        // Ignore "user not logged in" errors
        if (error.code !== 401) {
          console.warn("Session cleanup warning:", error);
        }
      }

      // Create new session
      return await this.account.createEmailPasswordSession(email, password);
    } catch (error) {
      // console.log("Login error:", error);

      // Handle specific session conflict error
      if (error.code === 409) {
        throw new Error("Session already exists. Please logout first.");
      }

      throw error;
    }
  }

  // Get Account
  async getAccount() {
    try {
      const currentAccount = await this.account.get();

      return currentAccount;
    } catch (error) {
      console.log("getAccount error::", error);
      return [];
      // throw new Error(error);
    }
  }

  async logout() {
    //await this.account.deleteSessions();
    try {
      const current = await this.getAccount();
      console.log("Current account:", current);

      //clear all local tokens
      await SecureStore.deleteItemAsync("role");

      //  Finally, clean up Appwrite sessions
      try {
        const currentAccount = await this.account.get();
        console.log("Current account:", currentAccount);
        if (currentAccount) {
          await this.account.deleteSessions();
          console.log("Appwrite account sessions deleted successfully");
          return currentAccount;
        }
      } catch (appwriteError) {
        console.log("No active Appwrite session found:", appwriteError.message);
        return null; // Return null to indicate failure
      }
    } catch (error) {
      // console.error("Logout error:", error);
      //  throw error;
      return null; //
    }
  }
}

const authService = new AuthService();

export default authService;
