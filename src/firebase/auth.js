import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut,
  sendPasswordResetEmail as firebaseSendPasswordResetEmail 
} from "firebase/auth";
import { doc, setDoc, query, where, collection, getDocs, Timestamp } from "firebase/firestore";
import { auth, db } from "./config";
import { createNewStudentAccountNotification } from './notifications';

const isValidStudentId = (studentId) => {
  const pattern = /^\d{5}MN-\d{6}$/;
  return pattern.test(studentId);
};

// Register new student
export const registerStudent = async (studentData) => {
  const { email, password, studentId, firstName, lastName, gender } = studentData;

  if (!isValidStudentId(studentId)) {
    throw new Error("Invalid student ID format. Please use: 11718MN-012140");
  }

  try {
    const studentQuery = query(collection(db, "users"), where("studentId", "==", studentId));
    const studentSnapshot = await getDocs(studentQuery);
    
    if (!studentSnapshot.empty) {
      throw new Error("Student ID already registered");
    }

    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    // Create user profile in Firestore
    await setDoc(doc(db, "users", user.uid), {
      studentId,
      firstName,
      lastName,
      email,
      gender,
      role: "student",
      createdAt: new Date().toISOString()
    });
    
    await createNewStudentAccountNotification({
      name: `${studentData.firstName} ${studentData.lastName}`,
      email: studentData.email,
      studentId: studentData.studentId
    });
    
    return userCredential.user;
  } catch (error) {
    console.error("Error registering user:", error);
    
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

export const loginUser = async (studentId, password) => {
  try {
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
    
    const studentQuery = query(collection(db, "users"), where("studentId", "==", studentId));
    const studentSnapshot = await getDocs(studentQuery);
    
    if (studentSnapshot.empty) {
      throw new Error("Student ID not found");
    }
    
    const userDoc = studentSnapshot.docs[0];
    const userData = userDoc.data();
    const email = userData.email;
    
    if (!email) {
      throw new Error("User email not found. Please contact support.");
    }
    
    try {
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

export const logoutUser = async () => {
  try {
    await signOut(auth);
    return true;
  } catch (error) {
    console.error("Logout error:", error);
    throw error;
  }
};

export const createGuidanceCounselor = async (counselorData) => {
  const { email, password, firstName, lastName } = counselorData;

  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    
    await setDoc(doc(db, "users", userCredential.user.uid), {
      firstName,
      lastName,
      email,
      role: "guidance",
      createdAt: new Date().toISOString()
    });

    return userCredential.user;
  } catch (error) {
    console.error("Create guidance counselor error:", error);
    throw error;
  }
};

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
