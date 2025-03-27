import { db } from './config';
import { 
  collection, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  getDocs,
  serverTimestamp,
  query,
  orderBy
} from 'firebase/firestore';
import supabase from '../supabase/supabaseClient';

const RESOURCES_COLLECTION = 'resources';
const STORAGE_BUCKET = 'resources';

// Get all resources
export const getResources = async () => {
  try {
    const resourcesQuery = query(
      collection(db, RESOURCES_COLLECTION),
      orderBy('createdAt', 'desc')
    );
    const snapshot = await getDocs(resourcesQuery);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error("Error getting resources: ", error);
    throw error;
  }
};

// Upload file to Supabase Storage
export const uploadFile = async (file, fileName) => {
  try {
    const { data, error } = await supabase.storage
      .from(STORAGE_BUCKET)
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: false
      });
      
    if (error) throw error;
    
    // Get public URL for the file
    const { data: urlData } = supabase.storage
      .from(STORAGE_BUCKET)
      .getPublicUrl(fileName);
      
    return urlData.publicUrl;
  } catch (error) {
    console.error("Error uploading file: ", error);
    throw error;
  }
};

// Upload image to Supabase Storage
export const uploadImage = async (imageFile, fileName) => {
  try {
    const { data, error } = await supabase.storage
      .from(STORAGE_BUCKET)
      .upload(`images/${fileName}`, imageFile, {
        cacheControl: '3600',
        upsert: false
      });
      
    if (error) throw error;
    
    // Get public URL for the image
    const { data: urlData } = supabase.storage
      .from(STORAGE_BUCKET)
      .getPublicUrl(`images/${fileName}`);
      
    return urlData.publicUrl;
  } catch (error) {
    console.error("Error uploading image: ", error);
    throw error;
  }
};

// Add a new resource
export const addResource = async (resourceData, file = null, imageFile = null) => {
  try {
    let fileUrl = null;
    let imageUrl = null;
    
    // If there's a file, upload it to Supabase Storage
    if (file && resourceData.type === 'pdf') {
      const fileName = resourceData.fileName;
      fileUrl = await uploadFile(file, fileName);
    }
    
    // If there's an image, upload it to Supabase Storage
    if (imageFile) {
      const imageName = resourceData.imageName;
      imageUrl = await uploadImage(imageFile, imageName);
    }
    
    // Add resource document to Firestore
    const docRef = await addDoc(collection(db, RESOURCES_COLLECTION), {
      ...resourceData,
      fileUrl,
      imageUrl,
      createdAt: serverTimestamp()
    });
    
    return {
      id: docRef.id,
      ...resourceData,
      fileUrl,
      imageUrl
    };
  } catch (error) {
    console.error("Error adding resource: ", error);
    throw error;
  }
};

// Update an existing resource
export const updateResource = async (id, resourceData, file = null, imageFile = null) => {
  try {
    const resourceRef = doc(db, RESOURCES_COLLECTION, id);
    let fileUrl = resourceData.fileUrl || null; // Use existing fileUrl or null
    let imageUrl = resourceData.imageUrl || null; // Use existing imageUrl or null
    
    // If there's a new file, upload it to Supabase Storage
    if (file && resourceData.type === 'pdf') {
      const fileName = resourceData.fileName;
      fileUrl = await uploadFile(file, fileName);
    }
    
    // If there's a new image, upload it to Supabase Storage
    if (imageFile) {
      const imageName = resourceData.imageName;
      imageUrl = await uploadImage(imageFile, imageName);
    }
    
    // Create an update object without undefined values
    const updateData = {
      ...resourceData,
      updatedAt: serverTimestamp()
    };
    
    // Only include fileUrl if it's not undefined
    if (fileUrl !== undefined) {
      updateData.fileUrl = fileUrl;
    }
    
    // Only include imageUrl if it's not undefined
    if (imageUrl !== undefined) {
      updateData.imageUrl = imageUrl;
    }
    
    // Update the resource document
    await updateDoc(resourceRef, updateData);
    
    return {
      id,
      ...resourceData,
      fileUrl,
      imageUrl
    };
  } catch (error) {
    console.error("Error updating resource: ", error);
    throw error;
  }
};

// Delete a resource
export const deleteResource = async (id, fileName = null, imageName = null) => {
  try {
    // Delete the file from Supabase Storage if it exists
    if (fileName) {
      const { error } = await supabase.storage
        .from(STORAGE_BUCKET)
        .remove([fileName]);
        
      if (error) console.error("Error deleting file: ", error);
    }
    
    // Delete the image from Supabase Storage if it exists
    if (imageName) {
      const { error } = await supabase.storage
        .from(STORAGE_BUCKET)
        .remove([`images/${imageName}`]);
        
      if (error) console.error("Error deleting image: ", error);
    }
    
    // Delete the document from Firestore
    await deleteDoc(doc(db, RESOURCES_COLLECTION, id));
    return true;
  } catch (error) {
    console.error("Error deleting resource: ", error);
    throw error;
  }
};
