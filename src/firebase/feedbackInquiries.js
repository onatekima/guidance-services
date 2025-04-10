import { db } from './config';
import { 
  collection, 
  addDoc, 
  query, 
  where, 
  getDocs, 
  Timestamp,
  orderBy,
  doc,
  getDoc,
  updateDoc
} from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { createNotification } from './notifications';

/**
 * Creates a feedback submission
 * @param {Object} feedbackData - The feedback data
 * @returns {Promise<Object>} - Promise resolving to the feedback data with ID
 */
export const createFeedback = async (feedbackData) => {
  try {
    const auth = getAuth();
    const currentUser = auth.currentUser;
    
    if (!currentUser) {
      throw new Error("You must be logged in to submit feedback");
    }
    
    // Add timestamp, user ID, and initialize replies array
    const feedbackWithTimestamp = {
      ...feedbackData,
      userId: currentUser.uid,
      isAnonymous: feedbackData.isAnonymous || false,
      type: 'feedback',
      status: 'unread',
      createdAt: Timestamp.now(),
      responses: []
    };
    
    // Add to Firestore
    const docRef = await addDoc(collection(db, 'feedbackInquiries'), feedbackWithTimestamp);
    
    // Return the data with ID
    return {
      id: docRef.id,
      ...feedbackWithTimestamp
    };
  } catch (error) {
    console.error("Error creating feedback:", error);
    throw error;
  }
};

/**
 * Creates an inquiry submission
 * @param {Object} inquiryData - The inquiry data
 * @returns {Promise<Object>} - Promise resolving to the inquiry data with ID
 */
export const createInquiry = async (inquiryData) => {
  try {
    const auth = getAuth();
    const currentUser = auth.currentUser;
    
    if (!currentUser) {
      throw new Error("You must be logged in to submit an inquiry");
    }
    
    // Add timestamp, user ID, and initialize replies array
    const inquiryWithTimestamp = {
      ...inquiryData,
      userId: currentUser.uid,
      isAnonymous: inquiryData.isAnonymous || false,
      type: 'inquiry',
      status: 'unread',
      createdAt: Timestamp.now(),
      responses: []
    };
    
    // Add to Firestore
    const docRef = await addDoc(collection(db, 'feedbackInquiries'), inquiryWithTimestamp);
    
    // Return the data with ID
    return {
      id: docRef.id,
      ...inquiryWithTimestamp
    };
  } catch (error) {
    console.error("Error creating inquiry:", error);
    throw error;
  }
};

/**
 * Gets all feedback and inquiries
 * @returns {Promise<Array>} - Array of all feedback and inquiries
 */
export const getAllFeedbackInquiries = async () => {
  try {
    const itemsQuery = query(
      collection(db, 'feedbackInquiries'),
      orderBy("createdAt", "desc")
    );
    
    const itemsSnapshot = await getDocs(itemsQuery);
    const items = [];
    
    itemsSnapshot.forEach(doc => {
      items.push({
        id: doc.id,
        ...doc.data()
      });
    });
    
    return items;
  } catch (error) {
    console.error("Error getting feedback and inquiries:", error);
    throw error;
  }
};

/**
 * Gets feedback and inquiries by type
 * @param {string} type - The type ('feedback' or 'inquiry')
 * @returns {Promise<Array>} - Array of feedback or inquiries
 */
export const getFeedbackInquiriesByType = async (type) => {
  try {
    const itemsQuery = query(
      collection(db, 'feedbackInquiries'),
      where("type", "==", type),
      orderBy("createdAt", "desc")
    );
    
    const itemsSnapshot = await getDocs(itemsQuery);
    const items = [];
    
    itemsSnapshot.forEach(doc => {
      items.push({
        id: doc.id,
        ...doc.data()
      });
    });
    
    return items;
  } catch (error) {
    console.error(`Error getting ${type}:`, error);
    throw error;
  }
};

/**
 * Gets unread feedback and inquiries
 * @returns {Promise<Array>} - Array of unread feedback and inquiries
 */
export const getUnreadFeedbackInquiries = async () => {
  try {
    const itemsQuery = query(
      collection(db, 'feedbackInquiries'),
      where("status", "==", "unread"),
      orderBy("createdAt", "desc")
    );
    
    const itemsSnapshot = await getDocs(itemsQuery);
    const items = [];
    
    itemsSnapshot.forEach(doc => {
      items.push({
        id: doc.id,
        ...doc.data()
      });
    });
    
    return items;
  } catch (error) {
    console.error("Error getting unread feedback and inquiries:", error);
    throw error;
  }
};

/**
 * Add response to feedback or inquiry
 * @param {string} itemId - The item ID
 * @param {string} responseContent - The response content
 * @returns {Promise<void>}
 */
export const addResponseToItem = async (itemId, responseContent) => {
  try {
    const itemRef = doc(db, 'feedbackInquiries', itemId);
    const itemDoc = await getDoc(itemRef);
    
    if (!itemDoc.exists()) {
      throw new Error("Item not found");
    }
    
    const itemData = itemDoc.data();
    const responses = itemData.responses || [];
    
    const newResponse = {
      content: responseContent,
      timestamp: Timestamp.now(),
      isFromCounselor: true
    };
    
    await updateDoc(itemRef, {
      responses: [...responses, newResponse],
      status: "read"
    });
    
    // Create notification for the item owner
    if (itemData.userId) {
      await createNotification(
        itemData.userId, 
        itemData.type === 'feedback' ? 'feedback_response' : 'inquiry_response',
        itemData.type === 'feedback' ? 'Response to your feedback' : 'Response to your inquiry',
        responseContent.substring(0, 100) + (responseContent.length > 100 ? '...' : ''),
        itemId
      );
    }
  } catch (error) {
    console.error("Error adding response:", error);
    throw error;
  }
};

/**
 * Mark feedback or inquiry as read
 * @param {string} itemId - The item ID
 * @returns {Promise<void>}
 */
export const markItemAsRead = async (itemId) => {
  try {
    const itemRef = doc(db, 'feedbackInquiries', itemId);
    await updateDoc(itemRef, {
      status: "read"
    });
  } catch (error) {
    console.error("Error marking item as read:", error);
    throw error;
  }
};

/**
 * Gets feedback and inquiries for the current user
 * @returns {Promise<Array>} - Array of user's feedback and inquiries
 */
export const getCurrentUserFeedbackInquiries = async () => {
  try {
    const auth = getAuth();
    const currentUser = auth.currentUser;
    
    if (!currentUser) {
      throw new Error("You must be logged in to view your submissions");
    }
    
    const itemsQuery = query(
      collection(db, 'feedbackInquiries'),
      where("userId", "==", currentUser.uid),
      orderBy("createdAt", "desc")
    );
    
    const itemsSnapshot = await getDocs(itemsQuery);
    const items = [];
    
    itemsSnapshot.forEach(doc => {
      items.push({
        id: doc.id,
        ...doc.data()
      });
    });
    
    return items;
  } catch (error) {
    console.error("Error getting user's feedback and inquiries:", error);
    throw error;
  }
};
