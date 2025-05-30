import { collection, addDoc, getDocs, query, where, orderBy, Timestamp, doc, getDoc, updateDoc, onSnapshot } from "firebase/firestore";
import { db } from "./config";
import { getAuth } from 'firebase/auth';

/**
 * Create a notification for a specific user
 * @param {string} userId - The user ID
 * @param {Object} notificationData - The notification data
 * @returns {Promise<string>} - The notification ID
 */
export const createNotification = async (userId, notificationData) => {
  try {
    const notificationWithTimestamp = {
      ...notificationData,
      userId,
      createdAt: Timestamp.now(),
      unread: true
    };
    
    const docRef = await addDoc(collection(db, 'notifications'), notificationWithTimestamp);
    return docRef.id;
  } catch (error) {
    console.error("Error creating notification:", error);
    throw error;
  }
};

/**
 * Get notifications for the current user
 * @returns {Promise<Array>} - Array of notifications
 */
export const getUserNotifications = async () => {
  try {
    const auth = getAuth();
    const currentUser = auth.currentUser;
    
    if (!currentUser) {
      return [];
    }
    
    const notificationsQuery = query(
      collection(db, 'notifications'),
      where('userId', '==', currentUser.uid),
      orderBy('createdAt', 'desc')
    );
    
    const notificationsSnapshot = await getDocs(notificationsQuery);
    const notifications = [];
    
    notificationsSnapshot.forEach(doc => {
      notifications.push({
        id: doc.id,
        ...doc.data(),
        time: doc.data().createdAt.toDate().toISOString()
      });
    });
    
    return notifications;
  } catch (error) {
    console.error("Error getting notifications:", error);
    return [];
  }
};

/**
 * Mark a notification as read
 * @param {string} notificationId - The notification ID
 * @returns {Promise<void>}
 */
export const markNotificationAsRead = async (notificationId) => {
  try {
    const notificationRef = doc(db, 'notifications', notificationId);
    await updateDoc(notificationRef, {
      unread: false
    });
  } catch (error) {
    console.error("Error marking notification as read:", error);
    throw error;
  }
};

/**
 * Mark all notifications as read for the current user
 * @returns {Promise<void>}
 */
export const markAllNotificationsAsRead = async () => {
  try {
    const auth = getAuth();
    const currentUser = auth.currentUser;
    
    if (!currentUser) {
      return;
    }
    
    const notificationsQuery = query(
      collection(db, 'notifications'),
      where('userId', '==', currentUser.uid),
      where('unread', '==', true)
    );
    
    const notificationsSnapshot = await getDocs(notificationsQuery);
    
    const updatePromises = [];
    notificationsSnapshot.forEach(doc => {
      updatePromises.push(updateDoc(doc.ref, { unread: false }));
    });
    
    await Promise.all(updatePromises);
  } catch (error) {
    console.error("Error marking all notifications as read:", error);
    throw error;
  }
};

/**
 * Create notification for anonymous post reply
 * @param {string} userId - The user ID
 * @param {string} postId - The post ID
 * @param {string} replyContent - The reply content
 */
export const createAnonymousReplyNotification = async (userId, postId, replyContent) => {
  try {
    const replyPreview = replyContent.length > 50 
      ? replyContent.substring(0, 50) + '...' 
      : replyContent;
      
    await createNotification(userId, {
      type: 'anonymous_reply',
      title: 'New Response to Your Consultation',
      message: `A counselor has replied: "${replyPreview}"`,
      postId: postId
    });
  } catch (error) {
    console.error("Error creating anonymous reply notification:", error);
  }
};

/**
 * Create notification for appointment status change
 * @param {string} studentId - The student ID
 * @param {Object} appointment - The appointment data
 * @param {string} status - The new status (confirmed, rejected)
 */
export const createAppointmentStatusNotification = async (studentId, appointment, status, reason = null) => {
  try {
    // Get the user document to find the user's UID
    const usersRef = collection(db, 'users');
    const q = query(usersRef, where('studentId', '==', studentId));
    const querySnapshot = await getDocs(q);
    
    if (querySnapshot.empty) {
      console.warn(`No user found with studentId: ${studentId}`);
      return;
    }
    
    const userDoc = querySnapshot.docs[0];
    const userId = userDoc.id;
    
    // Create the notification
    let message = `Your appointment on ${appointment.date} at ${appointment.timeSlot} has been ${status}.`;
    
    if (reason && (status === 'cancelled' || status === 'rejected')) {
      message = `Your appointment on ${appointment.date} at ${appointment.timeSlot} has been ${status}. Reason: ${reason}`;
    }
    
    const notificationData = {
      userId: userId,
      type: 'appointment_status',
      title: `Appointment ${status.charAt(0).toUpperCase() + status.slice(1)}`,
      message: message,
      appointmentId: appointment.id,
      createdAt: Timestamp.now(),
      unread: true,
      requiresAcknowledgment: status === 'cancelled',
      acknowledged: false,
      reason: reason || null
    };
    
    await addDoc(collection(db, 'notifications'), notificationData);
    console.log(`Appointment status notification created for user: ${userId}`);
    
    return notificationData;
  } catch (error) {
    console.error("Error creating appointment status notification:", error);
    throw error;
  }
};

/**
 * Create notification for upcoming appointment
 * @param {string} userId - The user ID
 * @param {Object} appointment - The appointment data
 */
export const createAppointmentReminderNotification = async (userId, appointment) => {
  try {
    console.log("Creating appointment reminder notification for user:", userId);
    
    // Check if userId is a studentId or a uid
    let actualUserId = userId;
    
    // If it looks like a studentId (contains "-"), try to find the corresponding user
    if (userId.includes("-")) {
      console.log("userId appears to be a studentId, looking up corresponding user");
      const usersRef = collection(db, 'users');
      const q = query(usersRef, where('studentId', '==', userId));
      const querySnapshot = await getDocs(q);
      
      if (!querySnapshot.empty) {
        const userDoc = querySnapshot.docs[0];
        actualUserId = userDoc.id; // Use the actual uid
        console.log("Found corresponding user with uid:", actualUserId);
      } else {
        console.log("No user found with studentId:", userId, "using as is");
      }
    }
    
    // Create the notification data
    const notificationData = {
      userId: actualUserId, // Use the actual uid if found, otherwise use the provided userId
      type: 'appointment_reminder',
      title: 'Upcoming Appointment',
      message: `You have an appointment scheduled within 30 minutes: ${appointment.purpose || ''}`,
      appointmentId: appointment.id,
      createdAt: Timestamp.now(),
      unread: true
    };
    
    console.log("Notification data:", notificationData);
    
    // Add the notification to Firestore
    const docRef = await addDoc(collection(db, 'notifications'), notificationData);
    console.log("Notification created with ID:", docRef.id);
    
    return true;
  } catch (error) {
    console.error("Error creating appointment reminder notification:", error);
    throw error;
  }
};

/**
 * Subscribe to real-time notifications for the current user
 * @param {Function} callback - Function to call when notifications change
 * @returns {Function} - Unsubscribe function
 */
export const subscribeToUserNotifications = (callback) => {
  try {
    const auth = getAuth();
    const currentUser = auth.currentUser;
    
    if (!currentUser) {
      return null;
    }
    
    // Check if we need to use studentId instead of uid
    const userId = currentUser.uid;
    const studentId = currentUser.studentId;
    
    // If the notification is using studentId as userId, we need to query both
    let notificationsQuery;
    
    if (studentId) {
      // Query for notifications with either uid or studentId
      notificationsQuery = query(
        collection(db, 'notifications'),
        where('userId', 'in', [userId, studentId]),
        orderBy('createdAt', 'desc')
      );
    } else {
      notificationsQuery = query(
        collection(db, 'notifications'),
        where('userId', '==', userId),
        orderBy('createdAt', 'desc')
      );
    }
    
    const unsubscribe = onSnapshot(notificationsQuery, (snapshot) => {
      const notifications = [];
      
      snapshot.forEach(doc => {
        const data = doc.data();
        
        notifications.push({
          id: doc.id,
          ...data,
          time: data.createdAt.toDate().toISOString()
        });
      });
      
      callback(notifications);
    }, (error) => {
      console.error("Error in notification subscription:", error);
    });
    
    return unsubscribe;
  } catch (error) {
    console.error("Error setting up notification subscription:", error);
    return null;
  }
};

/**
 * Acknowledge a notification
 * @param {string} notificationId - The notification ID
 * @returns {Promise<void>}
 */
export const acknowledgeNotification = async (notificationId) => {
  try {
    const notificationRef = doc(db, 'notifications', notificationId);
    
    await updateDoc(notificationRef, {
      acknowledged: true,
      acknowledgedAt: Timestamp.now()
    });
    
    return true;
  } catch (error) {
    console.error("Error acknowledging notification:", error);
    throw error;
  }
};

/**
 * Create notification for guidance counselors when a student schedules an appointment
 * @param {Object} appointment - The appointment data
 * @returns {Promise<string>} - The notification ID
 */
export const createAppointmentScheduledNotification = async (appointment) => {
  try {
    // Get all users with role 'guidance'
    const usersRef = collection(db, 'users');
    const q = query(usersRef, where('role', '==', 'guidance'));
    const querySnapshot = await getDocs(q);
    
    if (querySnapshot.empty) {
      console.warn('No guidance counselors found to notify');
      return;
    }
    
    const notificationPromises = [];
    
    // Create a notification for each guidance counselor
    querySnapshot.forEach(doc => {
      const guidanceUserId = doc.id;
      
      const notificationData = {
        userId: guidanceUserId,
        type: 'appointment_scheduled',
        title: 'New Appointment Scheduled',
        message: `Student ${appointment.studentName} (${appointment.studentId}) has scheduled an appointment on ${appointment.date} at ${appointment.timeSlot}.`,
        appointmentId: appointment.id,
        createdAt: Timestamp.now(),
        unread: true
      };
      
      notificationPromises.push(addDoc(collection(db, 'notifications'), notificationData));
    });
    
    await Promise.all(notificationPromises);
    return true;
  } catch (error) {
    console.error("Error creating appointment scheduled notification:", error);
    throw error;
  }
};

/**
 * Create notification for guidance counselors when a student cancels an appointment
 * @param {Object} appointment - The appointment data
 * @param {string} reason - The cancellation reason
 * @returns {Promise<string>} - The notification ID
 */
export const createAppointmentCancelledByStudentNotification = async (appointment, reason = null) => {
  try {
    // Get all users with role 'guidance'
    const usersRef = collection(db, 'users');
    const q = query(usersRef, where('role', '==', 'guidance'));
    const querySnapshot = await getDocs(q);
    
    if (querySnapshot.empty) {
      console.warn('No guidance counselors found to notify');
      return;
    }
    
    const notificationPromises = [];
    
    // Create a notification for each guidance counselor
    querySnapshot.forEach(doc => {
      const guidanceUserId = doc.id;
      
      let message = `Student ${appointment.studentName} (${appointment.studentId}) has cancelled their appointment on ${appointment.date} at ${appointment.timeSlot}.`;
      
      if (reason) {
        message += ` Reason: ${reason}`;
      }
      
      const notificationData = {
        userId: guidanceUserId,
        type: 'appointment_cancelled',
        title: 'Appointment Cancelled',
        message: message,
        appointmentId: appointment.id,
        createdAt: Timestamp.now(),
        unread: true,
        requiresAcknowledgment: true,
        acknowledged: false
      };
      
      notificationPromises.push(addDoc(collection(db, 'notifications'), notificationData));
    });
    
    await Promise.all(notificationPromises);
    return true;
  } catch (error) {
    console.error("Error creating appointment cancelled notification:", error);
    throw error;
  }
};

/**
 * Create notification for guidance counselors when a new student account is created
 * @param {Object} user - The user data
 * @returns {Promise<string>} - The notification ID
 */
export const createNewStudentAccountNotification = async (user) => {
  try {
    // Get all users with role 'guidance'
    const usersRef = collection(db, 'users');
    const q = query(usersRef, where('role', '==', 'guidance'));
    const querySnapshot = await getDocs(q);
    
    if (querySnapshot.empty) {
      console.warn('No guidance counselors found to notify');
      return;
    }
    
    const notificationPromises = [];
    
    // Create a notification for each guidance counselor
    querySnapshot.forEach(doc => {
      const guidanceUserId = doc.id;
      
      const notificationData = {
        userId: guidanceUserId,
        type: 'new_student',
        title: 'New Student Account',
        message: `A new student account has been created: ${user.name} (${user.studentId}).`,
        studentId: user.studentId,
        createdAt: Timestamp.now(),
        unread: true
      };
      
      notificationPromises.push(addDoc(collection(db, 'notifications'), notificationData));
    });
    
    await Promise.all(notificationPromises);
    return true;
  } catch (error) {
    console.error("Error creating new student account notification:", error);
    throw error;
  }
};
