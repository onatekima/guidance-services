import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { List, Tag, Button, Empty, Modal, message, Spin, Alert } from 'antd';
import { CalendarOutlined, ClockCircleOutlined, UserOutlined } from '@ant-design/icons';
import { collection, query, where, getDocs, doc, updateDoc } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { useAuth } from '../../context/AuthContext';

const ListContainer = styled.div`
  max-width: 800px;
  margin: 0 auto;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  padding: 24px;
  
  @media (max-width: ${props => props.theme.breakpoints.md}) {
    padding: 16px;
  }
`;

const AppointmentItem = styled(List.Item)`
  padding: 16px !important;
  
  &:hover {
    background-color: ${props => props.theme.colors.light};
  }
`;

const AppointmentMeta = styled.div`
  display: flex;
  gap: 16px;
  margin-bottom: 8px;
  flex-wrap: wrap;
  
  @media (max-width: ${props => props.theme.breakpoints.sm}) {
    flex-direction: column;
    gap: 8px;
  }
`;

const MetaItem = styled.span`
  display: flex;
  align-items: center;
  gap: 8px;
  color: ${props => props.theme.colors.textSecondary};
`;

const LoadingContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 40px;
`;

const AppointmentList = () => {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const auth = useAuth();
  
  useEffect(() => {
    const fetchAppointments = async () => {
      try {
        setLoading(true);
        setError(null);
        
        if (!auth || !auth.currentUser) {
          console.log("No authenticated user found");
          setAppointments([]);
          setError("Please log in to view your appointments");
          return;
        }
        
        const studentId = auth.currentUser.studentId;
        if (!studentId) {
          console.log("User has no studentId");
          setAppointments([]);
          setError("User profile is incomplete. Please update your profile with your student ID.");
          return;
        }
        
        console.log("Fetching appointments for student:", studentId);
        
        const appointmentsRef = collection(db, "appointments");
        const q = query(appointmentsRef, where("studentId", "==", studentId));
        const querySnapshot = await getDocs(q);
        
        const fetchedAppointments = [];
        querySnapshot.forEach((doc) => {
          fetchedAppointments.push({
            id: doc.id,
            ...doc.data()
          });
        });
        
        fetchedAppointments.sort((a, b) => {
          const dateComparison = a.date.localeCompare(b.date);
          if (dateComparison !== 0) return dateComparison;
          return a.timeSlot.localeCompare(b.timeSlot);
        });
        
        setAppointments(fetchedAppointments);
      } catch (error) {
        console.error("Error fetching appointments:", error);
        setError("Failed to load appointments. Please try again later.");
      } finally {
        setLoading(false);
      }
    };
    
    fetchAppointments();
  }, [auth]);

  const handleCancelAppointment = async (appointmentId) => {
    Modal.confirm({
      title: 'Cancel Appointment',
      content: 'Are you sure you want to cancel this appointment?',
      okText: 'Yes',
      okType: 'danger',
      cancelText: 'No',
      onOk: async () => {
        try {
          const appointmentRef = doc(db, "appointments", appointmentId);
          await updateDoc(appointmentRef, {
            status: 'cancelled'
          });
          
          setAppointments(appointments.map(app => 
            app.id === appointmentId ? { ...app, status: 'cancelled' } : app
          ));
          
          message.success('Appointment cancelled successfully');
        } catch (error) {
          console.error("Error cancelling appointment:", error);
          message.error('Failed to cancel appointment');
        }
      }
    });
  };

  const getStatusTag = (status) => {
    switch(status) {
      case 'pending':
        return <Tag color="gold">Pending</Tag>;
      case 'confirmed':
        return <Tag color="blue">Confirmed</Tag>;
      case 'completed':
        return <Tag color="green">Completed</Tag>;
      case 'cancelled':
        return <Tag color="red">Cancelled</Tag>;
      default:
        return <Tag color="default">Unknown</Tag>;
    }
  };

  if (loading) {
    return (
      <ListContainer>
        <LoadingContainer>
          <Spin size="large" />
        </LoadingContainer>
      </ListContainer>
    );
  }

  if (error) {
    return (
      <ListContainer>
        <Alert
          message="Error"
          description={error}
          type="error"
          showIcon
        />
      </ListContainer>
    );
  }

  return (
    <ListContainer>
      {appointments.length > 0 ? (
        <List
          itemLayout="vertical"
          dataSource={appointments}
          renderItem={item => (
            <AppointmentItem
              actions={[
                <Button key="view" type="link">View Details</Button>,
                (item.status === 'pending' || item.status === 'confirmed') && 
                <Button 
                  key="cancel" 
                  type="link" 
                  danger
                  onClick={() => handleCancelAppointment(item.id)}
                >
                  Cancel
                </Button>
              ].filter(Boolean)}
            >
              <List.Item.Meta
                title={
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span>{item.counselorType}</span>
                    {getStatusTag(item.status)}
                  </div>
                }
                description={
                  <>
                    <AppointmentMeta>
                      <MetaItem>
                        <CalendarOutlined /> {item.date}
                      </MetaItem>
                      <MetaItem>
                        <ClockCircleOutlined /> {item.timeSlot}
                      </MetaItem>
                    </AppointmentMeta>
                    <div>{item.purpose}</div>
                  </>
                }
              />
            </AppointmentItem>
          )}
        />
      ) : (
        <Empty 
          description="No appointments found" 
          image={Empty.PRESENTED_IMAGE_SIMPLE} 
        />
      )}
    </ListContainer>
  );
};

export default AppointmentList;
