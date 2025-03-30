import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut,
  sendPasswordResetEmail as firebaseSendPasswordResetEmail 
} from "firebase/auth";
import { doc, setDoc, query, where, collection, getDocs } from "firebase/firestore";
import { auth, db } from "./config";

// Validate student ID format
const isValidStudentId = (studentId) => {
  const pattern = /^\d{5}MN-\d{6}$/;
  return pattern.test(studentId);
};

// Register new student
export const registerStudent = async (studentData) => {
  const { email, password, studentId, firstName, lastName } = studentData;

  if (!isValidStudentId(studentId)) {
    throw new Error("Invalid student ID format. Please use: 11718MN-012140");
  }

  try {
    // Check if student ID already exists
    const studentQuery = query(collection(db, "users"), where("studentId", "==", studentId));
    const studentSnapshot = await getDocs(studentQuery);
    
    if (!studentSnapshot.empty) {
      throw new Error("Student ID already registered");
    }

    // Create authentication record
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    // Create user profile in Firestore
    await setDoc(doc(db, "users", user.uid), {
      studentId,
      firstName,
      lastName,
      email,
      role: "student",
      createdAt: new Date().toISOString()
    });

    return user;
  } catch (error) {
    console.error("Registration error:", error);
    
    // Provide more specific error messages
    if (error.code === 'auth/email-already-in-use') {
      throw new Error('Email address is already in use');
    } else if (error.code === 'auth/invalid-email') {
      throw new Error('Invalid email address format');
    } else if (error.code === 'auth/weak-password') {
      throw new Error('Password is too weak. Please use at least 6 characters');
    } else if (error.message) {
      throw error;
    } else {
      throw new Error('Failed to register. Please try again.');
    }
  }
};

// Login user with student ID
export const loginUser = async (studentId, password) => {
  try {
    // Special case for guidance counselor login
    if (studentId === 'guidance') {
      const guidanceQuery = query(collection(db, "users"), where("role", "==", "guidance"));
      const guidanceSnapshot = await getDocs(guidanceQuery);
      
      if (guidanceSnapshot.empty) {
        throw new Error("Guidance counselor account not found");
      }
      
      const guidanceData = guidanceSnapshot.docs[0].data();
      const email = guidanceData.email;
      
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      
      return {
        user: userCredential.user,
        profile: guidanceData
      };
    }
    
    // Regular student login
    const studentQuery = query(collection(db, "users"), where("studentId", "==", studentId));
    const studentSnapshot = await getDocs(studentQuery);
    
    if (studentSnapshot.empty) {
      throw new Error("Student ID not found");
    }
    
    // Get the user's email from their profile
    const userDoc = studentSnapshot.docs[0];
    const userData = userDoc.data();
    const email = userData.email;
    
    if (!email) {
      throw new Error("User email not found. Please contact support.");
    }
    
    try {
      // Now login with email/password
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      
      return {
        user: userCredential.user,
        profile: userData
      };
    } catch (authError) {
      console.error("Authentication error:", authError);
      
      if (authError.code === 'auth/wrong-password') {
        throw new Error('Incorrect password');
      } else if (authError.code === 'auth/too-many-requests') {
        throw new Error('Too many failed login attempts. Please try again later.');
      } else {
        throw new Error('Login failed. Please check your credentials.');
      }
    }
  } catch (error) {
    console.error("Login error:", error);
    throw error;
  }
};

// Logout user
export const logoutUser = async () => {
  try {
    await signOut(auth);
    return true;
  } catch (error) {
    console.error("Logout error:", error);
    throw error;
  }
};

// Create guidance counselor account (admin function)
export const createGuidanceCounselor = async (counselorData) => {
  const { email, password, firstName, lastName } = counselorData;

  try {
    // Create authentication record
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    // Create counselor profile in Firestore
    await setDoc(doc(db, "users", user.uid), {
      firstName,
      lastName,
      email,
      role: "guidance",
      createdAt: new Date().toISOString()
    });

    return user;
  } catch (error) {
    console.error("Create guidance counselor error:", error);
    throw error;
  }
};

// Send password reset email
export const sendPasswordResetEmail = async (email) => {
  try {
    await firebaseSendPasswordResetEmail(auth, email);
    return true;
  } catch (error) {
    console.error("Password reset error:", error);
    
    if (error.code === 'auth/user-not-found') {
      throw new Error('No account found with this email address');
    } else if (error.code === 'auth/invalid-email') {
      throw new Error('Invalid email address format');
    } else {
      throw new Error('Failed to send password reset email. Please try again.');
    }
  }
};
