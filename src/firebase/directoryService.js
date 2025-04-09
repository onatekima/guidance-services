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

const DIRECTORY_COLLECTION = 'directory';
const STORAGE_BUCKET = 'directory';

// Get all directory entries
export const getDirectoryEntries = async () => {
  try {
    const directoryQuery = query(
      collection(db, DIRECTORY_COLLECTION),
      orderBy('createdAt', 'desc')
    );
    const snapshot = await getDocs(directoryQuery);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error("Error getting directory entries: ", error);
    throw error;
  }
};

// Upload icon to Supabase Storage
export const uploadIcon = async (iconFile, fileName) => {
  try {
    const { data, error } = await supabase.storage
      .from(STORAGE_BUCKET)
      .upload(`icons/${fileName}`, iconFile, {
        cacheControl: '3600',
        upsert: false
      });
      
    if (error) throw error;
    
    // Get public URL for the icon
    const { data: urlData } = supabase.storage
      .from(STORAGE_BUCKET)
      .getPublicUrl(`icons/${fileName}`);
      
    return urlData.publicUrl;
  } catch (error) {
    console.error("Error uploading icon: ", error);
    throw error;
  }
};

// Add a new directory entry
export const addDirectoryEntry = async (entryData, iconFile = null) => {
  try {
    let iconUrl = null;
    
    // If there's an icon, upload it to Supabase Storage
    if (iconFile) {
      const iconName = entryData.iconName;
      iconUrl = await uploadIcon(iconFile, iconName);
    }
    
    // Add directory entry document to Firestore
    const docRef = await addDoc(collection(db, DIRECTORY_COLLECTION), {
      ...entryData,
      iconUrl,
      createdAt: serverTimestamp()
    });
    
    return {
      id: docRef.id,
      ...entryData,
      iconUrl
    };
  } catch (error) {
    console.error("Error adding directory entry: ", error);
    throw error;
  }
};

// Update an existing directory entry
export const updateDirectoryEntry = async (id, entryData, iconFile = null) => {
  try {
    const entryRef = doc(db, DIRECTORY_COLLECTION, id);
    let iconUrl = entryData.iconUrl || null; // Use existing iconUrl or null
    
    // If there's a new icon, upload it to Supabase Storage
    if (iconFile) {
      const iconName = entryData.iconName;
      iconUrl = await uploadIcon(iconFile, iconName);
    }
    
    // Create an update object without undefined values
    const updateData = {
      ...entryData,
      updatedAt: serverTimestamp()
    };
    
    // Only include iconUrl if it's not undefined
    if (iconUrl !== undefined) {
      updateData.iconUrl = iconUrl;
    }
    
    // Update the directory entry document
    await updateDoc(entryRef, updateData);
    
    return {
      id,
      ...entryData,
      iconUrl
    };
  } catch (error) {
    console.error("Error updating directory entry: ", error);
    throw error;
  }
};

// Delete a directory entry
export const deleteDirectoryEntry = async (id, iconName = null) => {
  try {
    // Delete the icon from Supabase Storage if it exists
    if (iconName) {
      const { error } = await supabase.storage
        .from(STORAGE_BUCKET)
        .remove([`icons/${iconName}`]);
        
      if (error) console.error("Error deleting icon: ", error);
    }
    
    // Delete the document from Firestore
    await deleteDoc(doc(db, DIRECTORY_COLLECTION, id));
    return true;
  } catch (error) {
    console.error("Error deleting directory entry: ", error);
    throw error;
  }
};
