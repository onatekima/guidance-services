import { collection, addDoc, getDocs, query, where, orderBy, Timestamp, doc, getDoc, updateDoc, setDoc } from "firebase/firestore";
import { db } from "./config";
import moment from "moment";
import { createAppointmentStatusNotification, createAppointmentReminderNotification, createAppointmentScheduledNotification, createAppointmentCancelledByStudentNotification } from './notifications';

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
  const formattedDate = moment(date).format('YYYY-MM-DD');
  
  // First check if we have a custom availability document for this date
  const availabilityRef = doc(db, 'availableTimeSlots', formattedDate);
  const availabilityDoc = await getDoc(availabilityRef);
  
  let availableSlots = [];
  
  if (availabilityDoc.exists()) {
    // Use the custom availability settings
    const slotsData = availabilityDoc.data().slots || [];
    availableSlots = slotsData
      .filter(slot => slot.available)
      .map(slot => slot.time);
  } else {
    // Fall back to default time slots
    availableSlots = [
      "9:00 AM", "10:00 AM", "11:00 AM", "12:00 PM", 
      "1:00 PM", "2:00 PM", "3:00 PM", "4:00 PM"
    ];
  }
  
  // Now check which slots are already booked
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
  
  // Filter out booked slots
  const finalAvailableSlots = availableSlots.filter(
    timeSlot => !bookedTimeSlots.includes(timeSlot)
  );
  
  return finalAvailableSlots;
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
  const formattedDate = moment(date).format('YYYY-MM-DD');
  
  // First check if we have a custom availability document for this date
  const availabilityRef = doc(db, 'availableTimeSlots', formattedDate);
  const availabilityDoc = await getDoc(availabilityRef);
  
  let allSlots = [];
  
  if (availabilityDoc.exists()) {
    // Use the custom availability settings
    allSlots = availabilityDoc.data().slots || [];
  } else {
    // Fall back to default time slots
    const defaultSlots = [
      "9:00 AM", "10:00 AM", "11:00 AM", "12:00 PM",
      "1:00 PM", "2:00 PM", "3:00 PM", "4:00 PM"
    ];
    
    allSlots = defaultSlots.map(time => ({
      time,
      available: true
    }));
  }
  
  // Now check which slots are already booked
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
  
  // Mark booked slots
  return allSlots.map(slot => ({
    ...slot,
    booked: bookedTimeSlots.includes(slot.time)
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
      return 'Academic Counselling';
    case 'career':
      return 'Career Counselling';
    case 'mental_health':
      return 'Mental Health Counselling';
    case 'family':
      return 'Family Counselling';
    case 'crisis':
      return 'Crisis Counselling';
    case 'gender_sexuality':
      return 'Gender and Sexuality Counselling';
    default:
      return type || 'Unknown';
  }
};

export const updateAppointmentStatus = async (appointmentId, status, reason = null) => {
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
    
    const updateData = {
      status: status,
      updatedAt: Timestamp.now()
    };
    
    if (reason) {
      updateData.cancellationReason = reason;
      updateData.cancellationBy = appointmentData.studentId === 'guidance' ? 'guidance' : 'student';
      updateData.acknowledged = false;

      await createAppointmentCancelledByStudentNotification({
        id: appointmentId,
        ...appointmentData
      }, reason);
    }
    
    await updateDoc(appointmentRef, updateData);
    
    if (appointmentData.studentId) {
      try {
        await createAppointmentStatusNotification(
          appointmentData.studentId,
          appointmentData,
          status,
          reason
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
      return false;
    }
    
    const now = new Date();
    const thirtyMinutesFromNow = new Date(now.getTime() + 30 * 60 * 1000);
    
    const notifiedAppointmentsRef = doc(db, 'notifiedAppointments', userId);
    const notifiedAppointmentsDoc = await getDoc(notifiedAppointmentsRef);
    
    const notifiedAppointments = notifiedAppointmentsDoc.exists() 
      ? notifiedAppointmentsDoc.data().appointments || []
      : [];
    
    const newNotifiedAppointments = [...notifiedAppointments];
    let notificationsCreated = false;
    
    for (const appointment of appointments) {
      if (appointment.status !== 'confirmed' || notifiedAppointments.includes(appointment.id)) {
        continue;
      }
      
      const appointmentDateTime = parseAppointmentDateTime(appointment.date, appointment.timeSlot);
      
      if (!appointmentDateTime) {
        continue;
      }
      
      if (appointmentDateTime > now && appointmentDateTime <= thirtyMinutesFromNow) {
        try {
          await createAppointmentReminderNotification(userId, appointment);
          newNotifiedAppointments.push(appointment.id);
          notificationsCreated = true;
        } catch (notificationError) {
          console.error("Error creating notification:", notificationError);
        }
      }
    }
    
    if (notificationsCreated) {
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
      return null;
    }
    
    let dateStr = date;
    if (typeof date === 'object' && date.toDate) {
      dateStr = moment(date.toDate()).format('YYYY-MM-DD');
    }
    
    const startTime = timeSlot.split(' - ')[0];
    const parsedDateTime = moment(`${dateStr} ${startTime}`, 'YYYY-MM-DD h:mm A').toDate();
    
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
    
    if (appointments.length === 0) {
      return false;
    }
    
    const result = await checkUpcomingAppointments(appointments, studentId);
    return result;
  } catch (error) {
    console.error("Error force checking upcoming appointments:", error);
    throw error;
  }
};

export const acknowledgeAppointmentCancellation = async (appointmentId) => {
  try {
    const appointmentRef = doc(db, "appointments", appointmentId);
    
    await updateDoc(appointmentRef, {
      acknowledged: true,
      acknowledgedAt: Timestamp.now()
    });
    
    return true;
  } catch (error) {
    console.error("Error acknowledging appointment cancellation:", error);
    throw error;
  }
};

export const cancelAppointment = async (appointmentId, reason = null) => {
  try {
    const appointmentRef = doc(db, 'appointments', appointmentId);
    const appointmentSnap = await getDoc(appointmentRef);
    
    if (!appointmentSnap.exists()) {
      throw new Error('Appointment not found');
    }
    
    const appointmentData = appointmentSnap.data();
    
    // Update the appointment status
    await updateDoc(appointmentRef, {
      status: 'cancelled',
      cancellationReason: reason || null,
      cancellationBy: 'student',
      requiresAcknowledgment: true,
      acknowledged: false,
      updatedAt: Timestamp.now()
    });
    
    // Create notification for guidance counselors
    await createAppointmentCancelledByStudentNotification({
      id: appointmentId,
      ...appointmentData
    }, reason);
    
    return true;
  } catch (error) {
    console.error("Error cancelling appointment:", error);
    throw error;
  }
};

export const createAppointment = async (appointmentData) => {
  try {
    const appointmentWithTimestamp = {
      ...appointmentData,
      createdAt: Timestamp.now()
    };
    
    const docRef = await addDoc(collection(db, 'appointments'), appointmentWithTimestamp);
    
    // Create notification for guidance counselors
    await createAppointmentScheduledNotification({
      id: docRef.id,
      ...appointmentWithTimestamp
    });
    
    return docRef.id;
  } catch (error) {
    console.error("Error creating appointment:", error);
    throw error;
  }
};
