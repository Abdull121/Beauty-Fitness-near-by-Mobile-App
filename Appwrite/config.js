import { Client, ID, Databases,Query, Account } from "react-native-appwrite";
import Constants from 'expo-constants';

import * as FileSystem from 'expo-file-system'; // for converting image to Blob




export class Service{
    

    
    client = new Client();
    databases;
    bucket;

    appwriteConfig = {
        appwriteUrl: Constants.expoConfig.extra.APPWRITE_URL,
        appwriteProjectId: Constants.expoConfig.extra.APPWRITE_PROJECT_ID ,
        appwriteDatabaseId: Constants.expoConfig.extra.DATABSE_ID,
        appwriteSalonGymCollection: Constants.expoConfig.extra.SALON_GYM_COLLECTION,
        appwriteUserBookingCollection: Constants.expoConfig.extra.USERBOOKING_COLLECTION,
        
    };
    
    constructor(){
        this.client
        .setEndpoint(this.appwriteConfig.appwriteUrl)
        .setProject(this.appwriteConfig.appwriteProjectId);
        this.databases = new Databases(this.client);
        // this.avatars = new Avatars(this.client)
        this.account = new Account(this.client);
    }


    //get current Account id
    async  getAccountId() {
        try {
          const currentAccount = await this. account.get();
      
          return currentAccount.$id;
        } catch (error) {
          throw new Error(error);
        }
      }


    // Upload a single image to Cloudinary, return URL
  async uploadToCloudinary(imageUri) {
    try {
      // Convert image to base64
      const base64Data = await FileSystem.readAsStringAsync(imageUri, {
        encoding: FileSystem.EncodingType.Base64,
      });

      // Cloudinary configuration
      const cloudName = 'dunihnlan'; 
      const uploadPreset = 'specialcare_upload'; 

      const response = await fetch(
        `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            file: `data:image/jpeg;base64,${base64Data}`,
            upload_preset: uploadPreset,
          }),
        }
      );

      const data = await response.json();
      if (!response.ok || !data.secure_url) {
        throw new Error(data.error?.message || "Cloudinary upload failed");
      }
      return data.secure_url; // e.g. https://res.cloudinary.com/...
    } catch (error) {
      console.error('Cloudinary upload error:', error);
      throw error;
    }
  }



    

    // Register a salon/gym with multiple images
  async salonGymRegister({
    businessName,
    businessType,
    placeId,
    contactNumber,
    email,
    openTime,
    closeTime,
    services,
    photos, // local image paths e.g. ["file:///..."]
    description,
    offers,
    ownerId 
  }) {
    try {

      ownerId = await this.getAccountId();
      // 1. Upload all photos to Cloudinary and get their URLs
      const uploadedUrls = [];
      for (const uri of photos) {
        const url = await this.uploadToCloudinary(uri);
        if (url) uploadedUrls.push(url);
      }

      // 2. Prepare data for Appwrite
      const jsonString = JSON.stringify(services);

      // 3. Store business in Appwrite (with Cloudinary URLs)
      const setupBusiness = await this.databases.createDocument(
        this.appwriteConfig.appwriteDatabaseId,
        this.appwriteConfig.appwriteSalonGymCollection,
        ID.unique(),
        {
          name: businessName,
          businessType,
          placeId,
          contact: contactNumber,
          email,
          ownerId,
          timingOpen: openTime,
          timingClose: closeTime,
          services: jsonString,
          photos: uploadedUrls, // store Cloudinary URLs array!
          businessDescription: description,
          offers,
        }
      );

      if (!setupBusiness) throw new Error("Failed to create business profile");
      return setupBusiness;
    } catch (error) {
      console.error("Appwrite Service :: setupBusiness :: error", error);
      return null;
    }
  }

  

      //get all gymsalons data for users
    async getAllGymsalon() {
        
        try {

          // Fetch all documents from the gymsalon collection

        
                const response = await this.databases.listDocuments(
                this.appwriteConfig.appwriteDatabaseId,
                this.appwriteConfig.appwriteSalonGymCollection,
                
            );
            return response.documents;
        } catch (error) {
            console.error('Appwrite service :: getAllGymsalonDetails :: error: ', error);
            throw error;
        }

        
        
        
    }




    //create userBooking

      async userBooking({
        serviceId,
        userId,
        businessOwnerId,
        businessId,
        serviceName,
        servicePrice,
        appointmentDate,
        appointmentTime,
        customerName,
        customerEmail,
        customerPhone,
        status,
        businessName,
    
  }) {
    try {

      console.log("Appwrite Service :: setupUserBooking :: data", {
        serviceId,
        userId,
        businessOwnerId,
        businessId,
        serviceName,
        servicePrice,
        appointmentDate,
        appointmentTime,
        customerName,
        customerEmail,
        customerPhone,
        status,
        businessName,
      });
      
      // 1. Validate required fields
      if (!serviceId || !userId || !businessOwnerId || !businessId || !serviceName || !servicePrice || !appointmentDate || !appointmentTime || !customerName || !customerEmail || !customerPhone) {   
        throw new Error("Missing required booking fields");
      }
      

      // 3. Store user booking details in Appwrite document
      const setupBusiness = await this.databases.createDocument(
        this.appwriteConfig.appwriteDatabaseId,
        this.appwriteConfig.appwriteUserBookingCollection,
        ID.unique(),
        {
          serviceId,
          userId,
          businessOwnerId,
          businessId,
          serviceName,
          price: servicePrice,
          appointmentDate,
          appointmentTime,
          customerName,
          customerEmail,
          customerPhone,
          status,
          businessName

        }
      );

      if (!setupBusiness) throw new Error("Failed to create userBookin Deatails");
      return setupBusiness;
    } catch (error) {
      console.error("Appwrite Service :: setupUserBooking :: error", error);
      return null;
    }
  }

  //get all user booking details for Admin Dashboard
   
    async getAllUserBookingDetails() {
        //console.log(taskId)
        
           const getId = await this.getAccountId();

            try {
                const response = await this.databases.listDocuments(
                this.appwriteConfig.appwriteDatabaseId,
                this.appwriteConfig.appwriteUserBookingCollection,
                [Query.equal("businessOwnerId", getId )] 
                
                );
                return response.documents;
            } catch (error) {
                console.error('Appwrite service :: getAllUserDetails :: error: ', error);
                throw error;
            }
            
            
        
        
    }
    


    //update user booking status
    async updateBookingStatus (documentId, newStatus )  {
            console.log(documentId, newStatus)
                try {
                    const response = await this.databases.updateDocument(
                        this.appwriteConfig.appwriteDatabaseId,
                        this.appwriteConfig.appwriteUserBookingCollection,
                        documentId,
                        { status: newStatus }
                    );
                    return response;
                } catch (error) {
                    console.error('Appwrite service :: updateTaskStatus :: error: ', error);
                    throw error;
                }
            }


       // fetch user booking details by userId
    async getUserBookingDetailsByUserId() {

        const userId = await this.getAccountId();
        console.log("Fetching booking details for userId:", userId); 
        try {
            const response = await this.databases.listDocuments(
                this.appwriteConfig.appwriteDatabaseId,
                this.appwriteConfig.appwriteUserBookingCollection,
                [Query.equal("userId", userId)] 
            );
            return response.documents;
        } catch (error) {
            console.error('Appwrite service :: getUserBookingDetailsByUserId :: error: ', error);
            throw error;
        }
      }

      
            
    
}


const service = new Service()

export default service