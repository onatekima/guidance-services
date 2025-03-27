import { db } from './config';
import { 
  collection, 
  addDoc, 
  query, 
  orderBy, 
  onSnapshot,
  serverTimestamp,
  where,
  Timestamp,
  getDocs,
  deleteDoc,
  limit
} from 'firebase/firestore';

const MOODS_COLLECTION = 'moods';

export const subscribeMoods = (callback) => {
  try {
    // Get moods from the last 24 hours
    const oneDayAgo = new Date();
    oneDayAgo.setDate(oneDayAgo.getDate() - 1);
    
    const moodsQuery = query(
      collection(db, MOODS_COLLECTION),
      where('timestamp', '>=', Timestamp.fromDate(oneDayAgo)),
      orderBy('timestamp', 'desc')
    );
    
    return onSnapshot(moodsQuery, (snapshot) => {
      // Group moods by userId to ensure only the latest mood per user is shown
      const moodsByUser = {};
      
      snapshot.docs.forEach(doc => {
        const mood = {
          id: doc.id,
          ...doc.data()
        };
        
        // If this user doesn't have a mood yet or this mood is newer, use it
        if (!moodsByUser[mood.userId] || 
            mood.timestamp.toDate() > moodsByUser[mood.userId].timestamp.toDate()) {
          moodsByUser[mood.userId] = mood;
        }
      });
      
      // Convert the object back to an array and sort by timestamp
      const moods = Object.values(moodsByUser).sort((a, b) => 
        b.timestamp.toDate() - a.timestamp.toDate()
      );
      
      callback(moods);
    });
  } catch (error) {
    console.error("Error subscribing to moods: ", error);
    throw error;
  }
};

const deleteExistingMoods = async (userId) => {
  try {
    const userMoodsQuery = query(
      collection(db, MOODS_COLLECTION),
      where('userId', '==', userId)
    );
    
    const snapshot = await getDocs(userMoodsQuery);
    
    const deletePromises = snapshot.docs.map(doc => 
      deleteDoc(doc.ref)
    );
    
    await Promise.all(deletePromises);
  } catch (error) {
    console.error("Error deleting existing moods:", error);
    throw error;
  }
};

export const addMood = async (moodData) => {
  try {
    // First delete any existing moods for this user
    await deleteExistingMoods(moodData.userId);
    
    // Then add the new mood
    const docRef = await addDoc(collection(db, MOODS_COLLECTION), {
      ...moodData,
      timestamp: serverTimestamp()
    });
    
    return {
      id: docRef.id,
      ...moodData
    };
  } catch (error) {
    console.error("Error adding mood: ", error);
    throw error;
  }
};

export const getUserMood = async (userId) => {
  try {
    const userMoodQuery = query(
      collection(db, MOODS_COLLECTION),
      where('userId', '==', userId),
      orderBy('timestamp', 'desc'),
      limit(1)
    );
    
    const snapshot = await getDocs(userMoodQuery);
    
    if (snapshot.empty) {
      return null;
    }
    
    const doc = snapshot.docs[0];
    return {
      id: doc.id,
      ...doc.data()
    };
  } catch (error) {
    console.error("Error getting user mood:", error);
    throw error;
  }
};
