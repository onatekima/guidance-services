import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../firebase/config';
import { checkUpcomingAppointments } from '../firebase/appointments';

const NotificationContext = createContext();

export const useNotifications = () => useContext(NotificationContext);

export const NotificationProvider = ({ children }) => {
  const [appointments, setAppointments] = useState([]);
  const auth = useAuth();

  // Fetch user's appointments
  const fetchUserAppointments = async () => {
    if (!auth.currentUser || !auth.currentUser.studentId) {
      return;
    }

    try {
      const appointmentsQuery = query(
        collection(db, 'appointments'),
        where("studentId", "==", auth.currentUser.studentId)
      );
      
      const appointmentsSnapshot = await getDocs(appointmentsQuery);
      const fetchedAppointments = [];
      
      appointmentsSnapshot.forEach(doc => {
        fetchedAppointments.push({
          id: doc.id,
          ...doc.data()
        });
      });
      
      setAppointments(fetchedAppointments);
      
      // Check for upcoming appointments immediately after fetching
      if (auth.currentUser && fetchedAppointments.length > 0) {
        checkUpcomingAppointments(fetchedAppointments, auth.currentUser.studentId);
      }
    } catch (error) {
      console.error("Error fetching appointments for notifications:", error);
    }
  };

  // Set up polling for appointment reminders
  useEffect(() => {
    // Initial fetch
    if (auth.currentUser) {
      fetchUserAppointments();
    }
    
    // Set up interval to check every minute
    const checkInterval = setInterval(() => {
      if (auth.currentUser) {
        fetchUserAppointments();
      }
    }, 60000); // Check every minute
    
    return () => {
      clearInterval(checkInterval);
    };
  }, [auth.currentUser]); // Only depend on auth.currentUser to avoid infinite loops

  return (
    <NotificationContext.Provider value={{ appointments }}>
      {children}
    </NotificationContext.Provider>
  );
};
