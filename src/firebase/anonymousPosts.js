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
  updateDoc,
  onSnapshot
} from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { createAnonymousReplyNotification } from './notifications';

/**
 * Creates an anonymous post
 * @param {Object} postData - The anonymous post data
 * @returns {Promise<Object>} - Promise resolving to the post data with ID
 */
export const createAnonymousPost = async (postData) => {
  try {
    const auth = getAuth();
    const currentUser = auth.currentUser;
    
    if (!currentUser) {
      throw new Error("You must be logged in to submit a consultation");
    }
    
    // Add timestamp, user ID, and initialize replies array
    const postWithTimestamp = {
      ...postData,
      userId: currentUser.uid,
      status: "pending",
      createdAt: Timestamp.now(),
      replies: []
    };
    
    // Add to Firestore
    const docRef = await addDoc(collection(db, 'anonymousPosts'), postWithTimestamp);
    
    // Return the data with ID
    return {
      id: docRef.id,
      ...postWithTimestamp
    };
  } catch (error) {
    console.error("Error creating anonymous post:", error);
    throw error;
  }
};

/**
 * Gets anonymous post by ID
 * @param {string} postId - The ID of the anonymous post
 * @returns {Promise<Object|null>} - Promise resolving to the post or null if not found
 */
export const getAnonymousPostById = async (postId) => {
  try {
    const postRef = doc(db, 'anonymousPosts', postId);
    const postDoc = await getDoc(postRef);
    
    if (!postDoc.exists()) {
      return null;
    }
    
    return {
      id: postDoc.id,
      ...postDoc.data()
    };
  } catch (error) {
    console.error("Error fetching anonymous post:", error);
    throw error;
  }
};

/**
 * Subscribe to real-time updates for all anonymous posts
 * @param {Function} callback - Function to call when posts change
 * @returns {Function} - Unsubscribe function
 */
export const subscribeToAllAnonymousPosts = (callback) => {
  try {
    const postsQuery = query(
      collection(db, 'anonymousPosts'),
      orderBy("createdAt", "desc")
    );
    
    const unsubscribe = onSnapshot(postsQuery, (snapshot) => {
      const posts = [];
      snapshot.forEach(doc => {
        posts.push({
          id: doc.id,
          ...doc.data()
        });
      });
      callback(posts);
    }, (error) => {
      console.error("Error in posts subscription:", error);
      callback([]);
    });
    
    return unsubscribe;
  } catch (error) {
    console.error("Error setting up posts subscription:", error);
    return null;
  }
};

/**
 * Subscribe to real-time updates for current user's anonymous posts
 * @param {Function} callback - Function to call when user's posts change
 * @returns {Function} - Unsubscribe function
 */
export const subscribeToUserAnonymousPosts = (callback) => {
  try {
    const auth = getAuth();
    const currentUser = auth.currentUser;
    
    if (!currentUser) {
      callback([]);
      return null;
    }
    
    const postsQuery = query(
      collection(db, 'anonymousPosts'),
      where("userId", "==", currentUser.uid)
    );
    
    const unsubscribe = onSnapshot(postsQuery, (snapshot) => {
      const posts = [];
      snapshot.forEach(doc => {
        posts.push({
          id: doc.id,
          ...doc.data()
        });
      });
      
      // Sort in memory by latest activity (most recent reply or creation date)
      posts.sort((a, b) => {
        // Get the timestamp of the most recent reply or creation date
        const getLatestTimestamp = (post) => {
          if (post.replies && post.replies.length > 0) {
            return post.replies[post.replies.length - 1].timestamp;
          }
          return post.createdAt;
        };
        
        const aTimestamp = getLatestTimestamp(a);
        const bTimestamp = getLatestTimestamp(b);
        
        const dateA = aTimestamp ? aTimestamp.toDate() : new Date(0);
        const dateB = bTimestamp ? bTimestamp.toDate() : new Date(0);
        
        return dateB - dateA; // Descending order (newest first)
      });
      
      callback(posts);
    }, (error) => {
      console.error("Error in user posts subscription:", error);
      callback([]);
    });
    
    return unsubscribe;
  } catch (error) {
    console.error("Error setting up user posts subscription:", error);
    return null;
  }
};

/**
 * Add reply to anonymous post
 * @param {string} postId - The post ID
 * @param {string} replyContent - The reply content
 * @returns {Promise<void>}
 */
export const addReplyToPost = async (postId, replyContent) => {
  try {
    const postRef = doc(db, 'anonymousPosts', postId);
    const postDoc = await getDoc(postRef);
    
    if (!postDoc.exists()) {
      throw new Error("Post not found");
    }
    
    const postData = postDoc.data();
    const replies = postData.replies || [];
    
    const newReply = {
      content: replyContent,
      timestamp: Timestamp.now(),
      isFromCounselor: true
    };
    
    await updateDoc(postRef, {
      replies: [...replies, newReply],
      status: "in-progress"
    });
    
    // Create notification for the post owner
    if (postData.userId) {
      await createAnonymousReplyNotification(postData.userId, postId, replyContent);
    }
  } catch (error) {
    console.error("Error adding reply to post:", error);
    throw error;
  }
};

/**
 * Mark anonymous post as resolved
 * @param {string} postId - The post ID
 * @returns {Promise<void>}
 */
export const markPostAsResolved = async (postId) => {
  try {
    const postRef = doc(db, 'anonymousPosts', postId);
    await updateDoc(postRef, {
      status: "resolved"
    });
  } catch (error) {
    console.error("Error marking post as resolved:", error);
    throw error;
  }
};

/**
 * Create notification for anonymous post reply
 * @param {string} postId - The post ID
 * @param {string} replyContent - The reply content
 */
export const createNotificationForAnonymousPostReply = (postId, replyContent) => {
  try {
    // Create a notification in localStorage for the current device
    const storedPostIds = JSON.parse(localStorage.getItem('anonymousPosts') || '[]');
    
    // Check if this post belongs to the current user
    if (storedPostIds.includes(postId)) {
      const replyPreview = replyContent.length > 50 
        ? replyContent.substring(0, 50) + '...' 
        : replyContent;
        
      const notification = {
        id: 'notification_' + Date.now(),
        type: 'anonymous_reply',
        title: 'New Response to Your Consultation',
        message: `A counselor has replied: "${replyPreview}"`,
        postId: postId,
        time: new Date().toISOString(),
        unread: true
      };
      
      // Store in localStorage
      const notifications = JSON.parse(localStorage.getItem('notifications') || '[]');
      localStorage.setItem('notifications', JSON.stringify([notification, ...notifications]));
    }
  } catch (error) {
    console.error("Error creating notification:", error);
  }
};

/**
 * Mark notification as read
 * @param {string} notificationId - The notification ID
 * @returns {Array} - Updated notifications array
 */
export const markNotificationAsRead = (notificationId) => {
  try {
    const notifications = JSON.parse(localStorage.getItem('notifications') || '[]');
    const updatedNotifications = notifications.map(notification => {
      if (notification.id === notificationId) {
        return { ...notification, unread: false };
      }
      return notification;
    });
    
    localStorage.setItem('notifications', JSON.stringify(updatedNotifications));
    return updatedNotifications;
  } catch (error) {
    console.error("Error marking notification as read:", error);
    return [];
  }
};

/**
 * Mark all notifications as read
 * @returns {Array} - Updated notifications array
 */
export const markAllNotificationsAsRead = () => {
  try {
    const notifications = JSON.parse(localStorage.getItem('notifications') || '[]');
    const updatedNotifications = notifications.map(notification => ({
      ...notification,
      unread: false
    }));
    
    localStorage.setItem('notifications', JSON.stringify(updatedNotifications));
    return updatedNotifications;
  } catch (error) {
    console.error("Error marking all notifications as read:", error);
    return [];
  }
};

/**
 * Add student reply to anonymous post
 * @param {string} postId - The post ID
 * @param {string} replyContent - The reply content
 * @returns {Promise<void>}
 */
export const addStudentReplyToPost = async (postId, replyContent) => {
  try {
    const postRef = doc(db, 'anonymousPosts', postId);
    const postDoc = await getDoc(postRef);
    
    if (!postDoc.exists()) {
      throw new Error("Post not found");
    }
    
    const postData = postDoc.data();
    const replies = postData.replies || [];
    
    const newReply = {
      content: replyContent,
      timestamp: Timestamp.now(),
      isFromCounselor: false
    };
    
    await updateDoc(postRef, {
      replies: [...replies, newReply],
      status: "in-progress"
    });
    
    // Store the post ID in localStorage to track user's posts
    const storedPostIds = JSON.parse(localStorage.getItem('anonymousPosts') || '[]');
    if (!storedPostIds.includes(postId)) {
      localStorage.setItem('anonymousPosts', JSON.stringify([...storedPostIds, postId]));
    }
    
    // Create notification for counselors (this would require a separate function)
    await createCounselorNotification(postId, replyContent);
  } catch (error) {
    console.error("Error adding student reply to post:", error);
    throw error;
  }
};

/**
 * Create notification for counselors when a student replies
 * @param {string} postId - The post ID
 * @param {string} replyContent - The reply content
 */
export const createCounselorNotification = async (postId, replyContent) => {
  try {
    // In a real implementation, you would query for users with counselor role
    // and create notifications for them
    console.log("Creating counselor notification for post:", postId);
    
    // For now, we'll just add to a counselor_notifications collection
    const replyPreview = replyContent.length > 50 
      ? replyContent.substring(0, 50) + '...' 
      : replyContent;
      
    await addDoc(collection(db, 'counselor_notifications'), {
      type: 'student_reply',
      title: 'New Student Reply',
      message: `A student has replied to consultation #${postId.substring(0, 6)}: "${replyPreview}"`,
      postId: postId,
      createdAt: Timestamp.now(),
      unread: true
    });
  } catch (error) {
    console.error("Error creating counselor notification:", error);
  }
};

/**
 * Subscribe to real-time updates for an anonymous post
 * @param {string} postId - The post ID
 * @param {Function} callback - Function to call when the post changes
 * @returns {Function} - Unsubscribe function
 */
export const subscribeToAnonymousPost = (postId, callback) => {
  try {
    const postRef = doc(db, 'anonymousPosts', postId);
    
    const unsubscribe = onSnapshot(postRef, (doc) => {
      if (doc.exists()) {
        const postData = {
          id: doc.id,
          ...doc.data()
        };
        callback(postData);
      } else {
        callback(null);
      }
    }, (error) => {
      console.error("Error in post subscription:", error);
    });
    
    return unsubscribe;
  } catch (error) {
    console.error("Error setting up post subscription:", error);
    return null;
  }
};