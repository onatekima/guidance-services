import { db } from './config';
import { 
  collection, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  getDocs,
  query,
  where,
  orderBy,
  serverTimestamp,
  onSnapshot,
  getDoc,
  startAfter,
  limit,
} from 'firebase/firestore';
import { uploadImage } from './resourcesService';

const POSTS_COLLECTION = 'posts';
const USERS_COLLECTION = 'users';

// Get user profile data
export const getUserProfile = async (userId) => {
  try {
    const userDoc = await getDoc(doc(db, USERS_COLLECTION, userId));
    if (userDoc.exists()) {
      return userDoc.data();
    }
    return null;
  } catch (error) {
    console.error("Error getting user profile: ", error);
    throw error;
  }
};

// Get all posts with pagination
export const subscribeToPosts = (callback, limitNum = 20) => {
  try {
    const postsQuery = query(
      collection(db, POSTS_COLLECTION),
      orderBy('createdAt', 'desc'),
      limit(limitNum)
    );
    
    return onSnapshot(postsQuery, (snapshot) => {
      const posts = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      callback(posts);
    });
  } catch (error) {
    console.error("Error subscribing to posts: ", error);
    throw error;
  }
};

// Get more posts with pagination
export const getMorePosts = async (lastVisible, limitNum = 20) => {
  try {
    const postsQuery = query(
      collection(db, POSTS_COLLECTION),
      orderBy('createdAt', 'desc'),
      startAfter(lastVisible),
      limit(limitNum)
    );
    
    const snapshot = await getDocs(postsQuery);
    const posts = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    return {
      posts,
      lastVisible: snapshot.docs[snapshot.docs.length - 1] || null,
      hasMore: snapshot.docs.length === limit
    };
  } catch (error) {
    console.error("Error getting more posts: ", error);
    throw error;
  }
};

// Get user's posts with pagination
export const subscribeToUserPosts = (userId, callback, limitNum = 20) => {
  try {
    const postsQuery = query(
      collection(db, POSTS_COLLECTION),
      where('authorId', '==', userId),
      orderBy('createdAt', 'desc'),
      limit(limitNum)
    );
    
    return onSnapshot(postsQuery, (snapshot) => {
      const posts = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      callback(posts);
    });
  } catch (error) {
    console.error("Error subscribing to user posts: ", error);
    throw error;
  }
};

// Get more user posts with pagination
export const getMoreUserPosts = async (userId, lastVisible, limitNum = 20) => {
  try {
    const postsQuery = query(
      collection(db, POSTS_COLLECTION),
      where('authorId', '==', userId),
      orderBy('createdAt', 'desc'),
      startAfter(lastVisible),
      limit(limitNum)
    );
    
    const snapshot = await getDocs(postsQuery);
    const posts = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    return {
      posts,
      lastVisible: snapshot.docs[snapshot.docs.length - 1] || null,
      hasMore: snapshot.docs.length === limit
    };
  } catch (error) {
    console.error("Error getting more user posts: ", error);
    throw error;
  }
};

// Add a new post
export const addPost = async (postData, imageFile = null) => {
  try {
    let imageUrl = null;
    
    if (imageFile) {
      const fileName = `post_${Date.now()}_${imageFile.name}`;
      imageUrl = await uploadImage(imageFile, fileName);
    }
    
    const docRef = await addDoc(collection(db, POSTS_COLLECTION), {
      ...postData,
      imageUrl,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    
    return {
      id: docRef.id,
      ...postData,
      imageUrl
    };
  } catch (error) {
    console.error("Error adding post: ", error);
    throw error;
  }
};

// Update a post
export const updatePost = async (postId, postData, imageFile = null) => {
  try {
    const postRef = doc(db, POSTS_COLLECTION, postId);
    let imageUrl = postData.imageUrl;
    
    if (imageFile) {
      const fileName = `post_${Date.now()}_${imageFile.name}`;
      imageUrl = await uploadImage(imageFile, fileName);
    }
    
    await updateDoc(postRef, {
      ...postData,
      imageUrl,
      updatedAt: serverTimestamp()
    });
    
    return {
      id: postId,
      ...postData,
      imageUrl
    };
  } catch (error) {
    console.error("Error updating post: ", error);
    throw error;
  }
};

// Delete a post
export const deletePost = async (postId) => {
  try {
    await deleteDoc(doc(db, POSTS_COLLECTION, postId));
    return true;
  } catch (error) {
    console.error("Error deleting post: ", error);
    throw error;
  }
};
