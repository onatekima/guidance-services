import React, { createContext, useState, useContext, useEffect } from 'react';
import { auth } from '../firebase/config';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase/config';
import { logoutUser } from '../firebase/auth';

// Create the authentication context
const AuthContext = createContext();

// Custom hook to use the auth context
export const useAuth = () => useContext(AuthContext);

// Provider component
export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Listen for auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        // Get user profile from Firestore
        const userDoc = await getDoc(doc(db, "users", user.uid));
        
        if (userDoc.exists()) {
          const userData = userDoc.data();
          
          // Create user object with combined auth and profile data
          const userObject = {
            id: user.uid,
            name: `${userData.firstName} ${userData.lastName}`,
            role: userData.role,
            email: userData.email,
            studentId: userData.studentId
          };
          
          setCurrentUser(userObject);
          localStorage.setItem('currentUser', JSON.stringify(userObject));
        } else {
          // If no profile exists, log the user out
          await logoutUser();
          setCurrentUser(null);
          localStorage.removeItem('currentUser');
        }
      } else {
        setCurrentUser(null);
        localStorage.removeItem('currentUser');
      }
      
      setLoading(false);
    });
    
    return unsubscribe;
  }, []);

  // Logout function
  const logout = async () => {
    await logoutUser();
    localStorage.removeItem('currentUser');
    setCurrentUser(null);
  };

  const value = {
    currentUser,
    setCurrentUser,
    logout,
    isStudent: currentUser?.role === 'student',
    isGuidance: currentUser?.role === 'guidance'
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
