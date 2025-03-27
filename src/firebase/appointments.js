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

export const getFormattedAppointmentDetails = (appointment) => {
  if (!appointment) return null;
  
  return {
    ...appointment,
    formattedDate: appointment.date,
    formattedTime: appointment.timeSlot,
    formattedStatus: appointment.status ? appointment.status.toUpperCase() : 'UNKNOWN',
    formattedCreatedAt: appointment.createdAt ? 
      (appointment.createdAt.toDate ? 
        moment(appointment.createdAt.toDate()).format('YYYY-MM-DD HH:mm') : 
        moment(appointment.createdAt).format('YYYY-MM-DD HH:mm')) : 
      'Unknown',
    statusColor: 
      appointment.status === 'pending' ? 'gold' :
      appointment.status === 'confirmed' ? 'blue' :
      appointment.status === 'completed' ? 'green' :
      appointment.status === 'rejected' || appointment.status === 'cancelled' ? 'red' :
      'default',
    counselorTypeLabel: getCounselorTypeLabel(appointment.counselorType)
  };
};

export const getCounselorTypeLabel = (type) => {
  switch(type) {
    case 'academic':
      return 'Academic Counselor';
    case 'career':
      return 'Career Counselor';
    case 'mental_health':
      return 'Mental Health Counselor';
    case 'general':
      return 'General Guidance Counselor';
    default:
      return type || 'Unknown';
  }
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
      status: status,
      updatedAt: Timestamp.now()
    });
    
    if (appointmentData.studentId) {
      try {
        await createAppointmentStatusNotification(
          appointmentData.studentId,
          appointmentData,
          status
        );
      } catch (notificationError) {
        console.error("Error creating notification:", notificationError);
      }
    }
    
    return appointmentData;
  } catch (error) {
    console.error("Error updating appointment status:", error);
    throw error;
  }
};

const getNotificationTitle = (status) => {
  switch(status) {
    case 'confirmed':
      return 'Appointment Confirmed';
    case 'rejected':
      return 'Appointment Rejected';
    case 'completed':
      return 'Appointment Completed';
    case 'cancelled':
      return 'Appointment Cancelled';
    default:
      return `Appointment ${status.charAt(0).toUpperCase() + status.slice(1)}`;
  }
};

const getNotificationMessage = (status, appointment) => {
  const date = appointment.date;
  const time = appointment.timeSlot;
  
  switch(status) {
    case 'confirmed':
      return `Your appointment on ${date} at ${time} has been confirmed.`;
    case 'rejected':
      return `Your appointment on ${date} at ${time} has been rejected. Please book another time slot.`;
    case 'completed':
      return `Your appointment on ${date} at ${time} has been marked as completed.`;
    case 'cancelled':
      return `Your appointment on ${date} at ${time} has been cancelled.`;
    default:
      return `Your appointment status has been updated to ${status}.`;
  }
};

export const checkUpcomingAppointments = async (appointments, userId) => {
  try {
    if (!appointments || !Array.isArray(appointments) || appointments.length === 0 || !userId) {
      console.log("No appointments to check or missing userId");
      return false;
    }
    
    console.log("Checking upcoming appointments for user:", userId);
    console.log("Total appointments to check:", appointments.length);
    
    const now = new Date();
    console.log("Current time:", now.toLocaleString());
    
    const thirtyMinutesFromNow = new Date(now.getTime() + 30 * 60 * 1000);
    console.log("Checking appointments until:", thirtyMinutesFromNow.toLocaleString());
    
    const notifiedAppointmentsRef = doc(db, 'notifiedAppointments', userId);
    const notifiedAppointmentsDoc = await getDoc(notifiedAppointmentsRef);
    
    const notifiedAppointments = notifiedAppointmentsDoc.exists() 
      ? notifiedAppointmentsDoc.data().appointments || []
      : [];
    
    console.log("Previously notified appointments:", notifiedAppointments);
    
    const newNotifiedAppointments = [...notifiedAppointments];
    let notificationsCreated = false;
    
    for (const appointment of appointments) {
      console.log("Checking appointment:", appointment.id, "Status:", appointment.status);
      
      if (appointment.status !== 'confirmed' || notifiedAppointments.includes(appointment.id)) {
        console.log("Skipping - not confirmed or already notified");
        continue;
      }
      
      const appointmentDateTime = parseAppointmentDateTime(appointment.date, appointment.timeSlot);
      
      if (!appointmentDateTime) {
        console.log("Skipping - could not parse date/time");
        continue;
      }
      
      console.log("Appointment date/time:", appointmentDateTime.toLocaleString());
      
      if (appointmentDateTime > now && appointmentDateTime <= thirtyMinutesFromNow) {
        console.log("Creating notification for appointment:", appointment.id);
        
        try {
          await createAppointmentReminderNotification(userId, appointment);
          console.log("Notification created successfully");
          
          newNotifiedAppointments.push(appointment.id);
          notificationsCreated = true;
        } catch (notificationError) {
          console.error("Error creating notification:", notificationError);
        }
      } else {
        console.log("Appointment not within time window");
      }
    }
    
    if (notificationsCreated) {
      console.log("Updating notified appointments list");
      await setDoc(notifiedAppointmentsRef, {
        appointments: newNotifiedAppointments
      }, { merge: true });
    }
    
    return notificationsCreated;
  } catch (error) {
    console.error("Error checking upcoming appointments:", error);
    return false;
  }
};

const parseAppointmentDateTime = (date, timeSlot) => {
  try {
    if (!date || !timeSlot) {
      console.log("Missing date or timeSlot");
      return null;
    }
    
    console.log("Parsing date:", date, "timeSlot:", timeSlot);
    
    let dateStr = date;
    if (typeof date === 'object' && date.toDate) {
      dateStr = moment(date.toDate()).format('YYYY-MM-DD');
    }
    
    console.log("Formatted date string:", dateStr);
    
    const startTime = timeSlot.split(' - ')[0];
    console.log("Start time:", startTime);
    
    const parsedDateTime = moment(`${dateStr} ${startTime}`, 'YYYY-MM-DD h:mm A').toDate();
    console.log("Parsed date/time:", parsedDateTime.toLocaleString());
    
    return parsedDateTime;
  } catch (error) {
    console.error("Error parsing appointment date and time:", error);
    return null;
  }
};

export const forceCheckUpcomingAppointments = async (studentId) => {
  try {
    if (!studentId) {
      console.error("No studentId provided");
      throw new Error("Student ID is required");
    }
    
    console.log("Force checking upcoming appointments for student:", studentId);
    
    // Get the user's appointments
    const appointmentsQuery = query(
      collection(db, 'appointments'),
      where("studentId", "==", studentId)
    );
    
    const appointmentsSnapshot = await getDocs(appointmentsQuery);
    const appointments = [];
    
    appointmentsSnapshot.forEach(doc => {
      appointments.push({
        id: doc.id,
        ...doc.data()
      });
    });
    
    console.log("Found", appointments.length, "appointments for student");
    
    if (appointments.length === 0) {
      console.log("No appointments found for student");
      return false;
    }
    
    // Check for upcoming appointments
    // Use studentId as the userId for notifications
    const result = await checkUpcomingAppointments(appointments, studentId);
    console.log("Check result:", result);
    return result;
  } catch (error) {
    console.error("Error force checking upcoming appointments:", error);
    throw error;
  }
};
