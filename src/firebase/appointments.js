import { collection, addDoc, getDocs, query, where, orderBy, Timestamp, doc, getDoc, updateDoc, setDoc } from "firebase/firestore";
import { db } from "./config";
import moment from "moment";
import { createAppointmentStatusNotification, createAppointmentReminderNotification } from './notifications';

const APPOINTMENTS_COLLECTION = "appointments";

export const bookAppointment = async (appointmentData) => {
  try {
    const isAvailable = await checkTimeSlotAvailability(
      appointmentData.date,
      appointmentData.timeSlot
    );
    
    if (!isAvailable) {
      throw new Error("This time slot is no longer available. Please select another time.");
    }
    
    const appointmentRef = await addDoc(collection(db, APPOINTMENTS_COLLECTION), {
      ...appointmentData,
      createdAt: Timestamp.now()
    });
    
    return appointmentRef.id;
  } catch (error) {
    console.error("Error booking appointment:", error);
    throw error;
  }
};

export const checkTimeSlotAvailability = async (date, timeSlot) => {
  try {
    const appointmentsQuery = query(
      collection(db, APPOINTMENTS_COLLECTION),
      where("date", "==", date),
      where("timeSlot", "==", timeSlot),
      where("status", "in", ["pending", "confirmed"])
    );
    
    const appointmentsSnapshot = await getDocs(appointmentsQuery);
    
    return appointmentsSnapshot.empty;
  } catch (error) {
    console.error("Error checking time slot availability:", error);
    throw error;
  }
};

export const getAvailableTimeSlots = async (date) => {
  const allTimeSlots = [
    "9:00 AM", "10:00 AM", "11:00 AM", "12:00 PM", 
    "1:00 PM", "2:00 PM", "3:00 PM", "4:00 PM"
  ];
  
  const formattedDate = moment(date).format('YYYY-MM-DD');
  
  const appointmentsQuery = query(
    collection(db, APPOINTMENTS_COLLECTION),
    where("date", "==", formattedDate),
    where("status", "in", ["pending", "confirmed"])
  );
  
  const appointmentsSnapshot = await getDocs(appointmentsQuery);
  const bookedTimeSlots = [];
  
  appointmentsSnapshot.forEach(doc => {
    bookedTimeSlots.push(doc.data().timeSlot);
  });
  
  console.log("Booked time slots:", bookedTimeSlots);
  
  const availableTimeSlots = allTimeSlots.filter(
    timeSlot => !bookedTimeSlots.includes(timeSlot)
  );
  
  console.log("Available time slots:", availableTimeSlots);
  
  return availableTimeSlots;
};

export const getAllAppointments = async () => {
  try {
    const appointmentsQuery = query(
      collection(db, APPOINTMENTS_COLLECTION),
      orderBy("date", "asc"),
      orderBy("timeSlot", "asc")
    );
    
    const appointmentsSnapshot = await getDocs(appointmentsQuery);
    const appointments = [];
    
    appointmentsSnapshot.forEach(doc => {
      appointments.push({
        id: doc.id,
        ...doc.data()
      });
    });
    
    return appointments;
  } catch (error) {
    console.error("Error getting appointments:", error);
    throw error;
  }
};

export const getStudentAppointments = async (studentId) => {
  try {
    const appointmentsQuery = query(
      collection(db, APPOINTMENTS_COLLECTION),
      where("studentId", "==", studentId),
      orderBy("date", "asc"),
      orderBy("timeSlot", "asc")
    );
    
    const appointmentsSnapshot = await getDocs(appointmentsQuery);
    const appointments = [];
    
    appointmentsSnapshot.forEach(doc => {
      appointments.push({
        id: doc.id,
        ...doc.data()
      });
    });
    
    return appointments;
  } catch (error) {
    console.error("Error getting student appointments:", error);
    throw error;
  }
};

export const getAppointmentById = async (appointmentId) => {
  try {
    const appointmentRef = doc(db, APPOINTMENTS_COLLECTION, appointmentId);
    const appointmentSnap = await getDoc(appointmentRef);
    
    if (appointmentSnap.exists()) {
      return {
        id: appointmentSnap.id,
        ...appointmentSnap.data()
      };
    } else {
      return null;
    }
  } catch (error) {
    console.error("Error getting appointment:", error);
    throw error;
  }
};

export const bookAnonymousConsultation = async (consultationData) => {
  try {
    const consultationWithTimestamp = {
      ...consultationData,
      status: "pending",
      createdAt: Timestamp.now()
    };
    
    const docRef = await addDoc(collection(db, 'anonymousConsultations'), consultationWithTimestamp);
    
    return {
      id: docRef.id,
      referenceCode: consultationData.referenceCode,
      ...consultationWithTimestamp
    };
  } catch (error) {
    console.error("Error booking anonymous consultation:", error);
    throw error;
  }
};

export const getAllTimeSlots = async (date) => {
  const availableSlots = await getAvailableTimeSlots(date);
  
  const allPossibleSlots = [
    "9:00 AM", "10:00 AM", "11:00 AM", "12:00 PM",
    "1:00 PM", "2:00 PM", "3:00 PM", "4:00 PM"
  ];
  
  return allPossibleSlots.map(time => ({
    time,
    available: availableSlots.includes(time)
  }));
};

export const updateAppointmentStatus = async (appointmentId, status) => {
  try {
    const appointmentRef = doc(db, "appointments", appointmentId);
    
    const appointmentDoc = await getDoc(appointmentRef);
    if (!appointmentDoc.exists()) {
      throw new Error('Appointment not found');
    }
    
    const appointmentData = {
      id: appointmentId,
      ...appointmentDoc.data()
    };
    
    await updateDoc(appointmentRef, {
      status: status
    });
    
    if (appointmentData.studentId) {
      await createAppointmentStatusNotification(
        appointmentData.studentId,
        appointmentData,
        status
      );
    }
    
    return appointmentData;
  } catch (error) {
    console.error("Error updating appointment status:", error);
    throw error;
  }
};

export const checkUpcomingAppointments = async (appointments, userId) => {
  try {
    if (!appointments || !Array.isArray(appointments) || appointments.length === 0 || !userId) {
      return;
    }
    
    const now = new Date();
    const thirtyMinutesFromNow = new Date(now.getTime() + 30 * 60 * 1000);
    
    for (const appointment of appointments) {
      if (!appointment.date || appointment.status !== 'confirmed') {
        continue;
      }
      
      const appointmentTime = appointment.date.toDate ? 
        appointment.date.toDate() : 
        new Date(appointment.date);
      
      if (appointmentTime > now && appointmentTime <= thirtyMinutesFromNow) {
        const notifiedAppointmentsRef = doc(db, 'notifiedAppointments', userId);
        const notifiedAppointmentsDoc = await getDoc(notifiedAppointmentsRef);
        
        const notifiedAppointments = notifiedAppointmentsDoc.exists() 
          ? notifiedAppointmentsDoc.data().appointments || []
          : [];
        
        if (!notifiedAppointments.includes(appointment.id)) {
          await createAppointmentReminderNotification(userId, appointment);
          
          await setDoc(notifiedAppointmentsRef, {
            appointments: [...notifiedAppointments, appointment.id]
          }, { merge: true });
        }
      }
    }
  } catch (error) {
    console.error("Error checking upcoming appointments:", error);
  }
};
