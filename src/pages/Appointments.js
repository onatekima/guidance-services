import React, { useEffect, useState } from 'react';
import styled from 'styled-components';
import { Typography, Tabs } from 'antd';
import { getStudentAppointments, checkUpcomingAppointments } from '../firebase/appointments';
import AppointmentForm from '../components/AppointmentScheduling/AppointmentForm';
import AppointmentList from '../components/AppointmentScheduling/AppointmentList';

const { Title } = Typography;
const { TabPane } = Tabs;

const PageContainer = styled.div`
  width: 100%;
`;

const PageTitle = styled(Title)`
  margin-bottom: 24px !important;
`;

const AppointmentsPage = () => {
  const [appointments, setAppointments] = useState([]);

  useEffect(() => {
    fetchAppointments();
    
    const interval = setInterval(() => {
      checkUpcomingAppointments(appointments);
    }, 60000);
    
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (appointments.length > 0) {
      checkUpcomingAppointments(appointments);
    }
  }, [appointments]);

  const fetchAppointments = async () => {
    try {
      const studentId = localStorage.getItem('studentId');
      const fetchedAppointments = await getStudentAppointments(studentId);
      setAppointments(fetchedAppointments);
    } catch (error) {
      console.error("Error fetching appointments:", error);
    }
  };

  return (
    <PageContainer>
      <PageTitle level={2}>Appointments</PageTitle>
      
      <Tabs defaultActiveKey="book">
        <TabPane tab="Book Appointment" key="book">
          <AppointmentForm />
        </TabPane>
        <TabPane tab="My Appointments" key="my">
          <AppointmentList />
        </TabPane>
      </Tabs>
    </PageContainer>
  );
};

export default AppointmentsPage;
