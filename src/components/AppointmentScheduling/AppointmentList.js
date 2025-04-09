import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { List, Tag, Button, Empty, Modal, message, Spin, Alert, Input, Form } from 'antd';
import { CalendarOutlined, ClockCircleOutlined, UserOutlined, EyeOutlined, CloseOutlined, ExclamationCircleOutlined, CheckCircleOutlined } from '@ant-design/icons';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { useAuth } from '../../context/AuthContext';
import moment from 'moment';
import { getCounselorTypeLabel, updateAppointmentStatus, acknowledgeAppointmentCancellation } from '../../firebase/appointments';
import { acknowledgeNotification } from '../../firebase/notifications';

const ListContainer = styled.div`
  margin-top: 16px;
`;

const AppointmentItem = styled(List.Item)`
  background-color: white;
  margin-bottom: 16px;
  padding: 16px !important;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  
  @media (max-width: ${props => props.theme.breakpoints.sm}) {
    padding: 12px !important;
  }
`;

const AppointmentMeta = styled.div`
  display: flex;
  flex-wrap: wrap;
  margin-bottom: 8px;
`;

const MetaItem = styled.div`
  margin-right: 16px;
  margin-bottom: 4px;
  display: flex;
  align-items: center;
  
  svg {
    margin-right: 4px;
  }
`;

const LoadingContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 40px;
`;

const AcknowledgeButton = styled(Button)`
  margin-top: 16px;
`;

const AppointmentList = () => {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [detailsModalVisible, setDetailsModalVisible] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [cancelModalVisible, setCancelModalVisible] = useState(false);
  const [appointmentToCancel, setAppointmentToCancel] = useState(null);
  const [acknowledgeModalVisible, setAcknowledgeModalVisible] = useState(false);
  const [appointmentToAcknowledge, setAppointmentToAcknowledge] = useState(null);
  const [cancellationReason, setCancellationReason] = useState('');

  const auth = useAuth();

  useEffect(() => {
    fetchAppointments();
  }, []);

  const fetchAppointments = async () => {
    if (!auth.currentUser) {
      setError("You must be logged in to view appointments");
      setLoading(false);
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      
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
      
      fetchedAppointments.sort((a, b) => {
        const dateA = moment(`${a.date} ${a.timeSlot.split(' - ')[0]}`, 'YYYY-MM-DD h:mm A');
        const dateB = moment(`${b.date} ${b.timeSlot.split(' - ')[0]}`, 'YYYY-MM-DD h:mm A');
        return dateA - dateB;
      });
      
      setAppointments(fetchedAppointments);
    } catch (error) {
      console.error("Error fetching appointments:", error);
      setError("Failed to load appointments. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  const showCancelConfirmation = (appointmentId) => {
    const appointment = appointments.find(app => app.id === appointmentId);
    if (appointment) {
      setAppointmentToCancel(appointment);
      setCancellationReason('');
      setCancelModalVisible(true);
    }
  };

  const handleCancelModalClose = () => {
    setCancelModalVisible(false);
    setAppointmentToCancel(null);
    setCancellationReason('');
  };

  const handleCancelAppointment = async () => {
    if (!appointmentToCancel) return;
    
    if (!cancellationReason.trim()) {
      message.error('Please provide a reason for cancellation');
      return;
    }
    
    try {
      setActionLoading(true);
      
      await updateAppointmentStatus(appointmentToCancel.id, 'cancelled', cancellationReason);
      
      setAppointments(appointments.map(app => 
        app.id === appointmentToCancel.id ? { 
          ...app, 
          status: 'cancelled',
          cancellationReason,
          cancellationBy: 'student',
          acknowledged: false
        } : app
      ));
      
      message.success('Appointment cancelled successfully');
      
      setCancelModalVisible(false);
      
      if (selectedAppointment && selectedAppointment.id === appointmentToCancel.id) {
        setDetailsModalVisible(false);
        setSelectedAppointment(null);
      }
    } catch (error) {
      console.error("Error cancelling appointment:", error);
      message.error('Failed to cancel appointment');
    } finally {
      setActionLoading(false);
      setAppointmentToCancel(null);
      setCancellationReason('');
    }
  };

  const showAcknowledgeModal = (appointmentId) => {
    const appointment = appointments.find(app => app.id === appointmentId);
    if (appointment) {
      setAppointmentToAcknowledge(appointment);
      setAcknowledgeModalVisible(true);
    }
  };

  const handleAcknowledgeModalClose = () => {
    setAcknowledgeModalVisible(false);
    setAppointmentToAcknowledge(null);
  };

  const handleAcknowledgeCancellation = async () => {
    if (!appointmentToAcknowledge) return;
    
    try {
      setActionLoading(true);
      
      await acknowledgeAppointmentCancellation(appointmentToAcknowledge.id);
      
      const notificationsQuery = query(
        collection(db, 'notifications'),
        where('appointmentId', '==', appointmentToAcknowledge.id),
        where('type', '==', 'appointment_status')
      );
      
      const notificationsSnapshot = await getDocs(notificationsQuery);
      if (!notificationsSnapshot.empty) {
        const notificationDoc = notificationsSnapshot.docs[0];
        await acknowledgeNotification(notificationDoc.id);
      }
      
      setAppointments(appointments.map(app => 
        app.id === appointmentToAcknowledge.id ? { 
          ...app, 
          acknowledged: true
        } : app
      ));
      
      message.success('Cancellation acknowledged');
      
      setAcknowledgeModalVisible(false);
      
      if (selectedAppointment && selectedAppointment.id === appointmentToAcknowledge.id) {
        setSelectedAppointment({
          ...selectedAppointment,
          acknowledged: true
        });
      }
    } catch (error) {
      console.error("Error acknowledging cancellation:", error);
      message.error('Failed to acknowledge cancellation');
    } finally {
      setActionLoading(false);
      setAppointmentToAcknowledge(null);
    }
  };

  const handleViewDetails = (record) => {
    if (!record) {
      console.error("Record is undefined or null");
      message.error("Cannot view details: Record not found");
      return;
    }
    
    setSelectedAppointment(record);
    setDetailsModalVisible(true);
  };

  const handleCloseDetailsModal = () => {
    setDetailsModalVisible(false);
    setSelectedAppointment(null);
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
      case 'rejected':
        return <Tag color="red">Rejected</Tag>;
      default:
        return <Tag color="default">Unknown</Tag>;
    }
  };

  if (loading) {
    return (
      <LoadingContainer>
        <Spin size="large" />
      </LoadingContainer>
    );
  }

  if (error) {
    return (
      <Alert
        message="Error"
        description={error}
        type="error"
        showIcon
        action={
          <Button onClick={fetchAppointments}>
            Retry
          </Button>
        }
      />
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
                <Button 
                  key="view" 
                  type="link" 
                  icon={<EyeOutlined />}
                  onClick={() => handleViewDetails(item)}
                >
                  View Details
                </Button>,
                (item.status === 'pending' || item.status === 'confirmed') && 
                <Button 
                  key="cancel" 
                  type="link" 
                  danger
                  icon={<CloseOutlined />}
                  onClick={() => showCancelConfirmation(item.id)}
                >
                  Cancel
                </Button>,
                (item.status === 'cancelled' && item.cancellationBy === 'guidance' && !item.acknowledged) &&
                <Button
                  key="acknowledge"
                  type="link"
                  icon={<CheckCircleOutlined />}
                  onClick={() => showAcknowledgeModal(item.id)}
                >
                  Acknowledge
                </Button>
              ].filter(Boolean)}
            >
              <List.Item.Meta
                title={
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span>{getCounselorTypeLabel(item.counselorType)}</span>
                    {getStatusTag(item.status)}
                  </div>
                }
                description={
                  <><AppointmentMeta>
                    <MetaItem>
                      <CalendarOutlined /> {item.date}
                    </MetaItem>
                    <MetaItem>
                      <ClockCircleOutlined /> {item.timeSlot}
                    </MetaItem>
                  </AppointmentMeta>
                  <div>{item.purpose.length > 100 ? `${item.purpose.substring(0, 100)}...` : item.purpose}</div>
                  {item.cancellationReason && (
                    <div style={{ marginTop: '8px', color: '#ff4d4f' }}>
                      <strong>Cancellation Reason:</strong> {item.cancellationReason}
                    </div>
                  )}</>
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

      <Modal
        title="Appointment Details"
        open={detailsModalVisible}
        onCancel={handleCloseDetailsModal}
        footer={[
          <Button key="close" onClick={handleCloseDetailsModal}>
            Close
          </Button>,
          (selectedAppointment?.status === 'pending' || selectedAppointment?.status === 'confirmed') && (
            <Button 
              key="cancel" 
              type="primary" 
              danger
              onClick={() => {
                handleCloseDetailsModal();
                showCancelConfirmation(selectedAppointment.id);
              }}
            >
              Cancel Appointment
            </Button>
          ),
          (selectedAppointment?.status === 'cancelled' && 
           selectedAppointment?.cancellationBy === 'guidance' && 
           !selectedAppointment?.acknowledged) && (
            <Button 
              key="acknowledge" 
              type="primary"
              onClick={() => {
                handleCloseDetailsModal();
                showAcknowledgeModal(selectedAppointment.id);
              }}
            >
              Acknowledge Cancellation
            </Button>
          )
        ].filter(Boolean)}
      >
        {selectedAppointment && (
          <div style={{ maxHeight: '60vh', overflow: 'auto' }}>
            <div style={{ marginBottom: '16px', padding: '12px', background: '#f5f5f5', borderRadius: '4px' }}>
              <h4 style={{ margin: '0 0 8px 0' }}>Appointment Information</h4>
              <p style={{ margin: '4px 0' }}><strong>Date:</strong> {selectedAppointment.date}</p>
              <p style={{ margin: '4px 0' }}><strong>Time:</strong> {selectedAppointment.timeSlot}</p>
              <p style={{ margin: '4px 0' }}><strong>Counselor Type:</strong> {getCounselorTypeLabel(selectedAppointment.counselorType)}</p>
              <p style={{ margin: '4px 0' }}><strong>Status:</strong> 
                <Tag 
                  style={{ marginLeft: '8px' }}
                  color={
                    selectedAppointment.status === 'pending' ? 'gold' :
                    selectedAppointment.status === 'confirmed' ? 'blue' :
                    selectedAppointment.status === 'completed' ? 'green' :
                    selectedAppointment.status === 'rejected' || selectedAppointment.status === 'cancelled' ? 'red' :
                    'default'
                  }
                >
                  {selectedAppointment.status?.toUpperCase() || 'UNKNOWN'}
                </Tag>
              </p>
              {selectedAppointment.createdAt && (
                <p style={{ margin: '4px 0' }}><strong>Created:</strong> {
                  selectedAppointment.createdAt.toDate ? 
                  moment(selectedAppointment.createdAt.toDate()).format('YYYY-MM-DD HH:mm') : 
                  moment(selectedAppointment.createdAt).format('YYYY-MM-DD HH:mm')
                }</p>
              )}
            </div>
            
            <div style={{ marginBottom: '16px', padding: '12px', background: '#f5f5f5', borderRadius: '4px' }}>
              <h4 style={{ margin: '0 0 8px 0' }}>Purpose</h4>
              <p style={{ margin: '4px 0', whiteSpace: 'pre-wrap' }}>{selectedAppointment.purpose}</p>
            </div>
            
            {selectedAppointment.notes && (
              <div style={{ padding: '12px', background: '#f5f5f5', borderRadius: '4px' }}>
                <h4 style={{ margin: '0 0 8px 0' }}>Notes</h4>
                <p style={{ margin: '4px 0', whiteSpace: 'pre-wrap' }}>{selectedAppointment.notes}</p>
              </div>
            )}
          </div>
        )}
      </Modal>

      <Modal
        title={<><ExclamationCircleOutlined style={{ color: '#ff4d4f', marginRight: '8px' }} /> Cancel Appointment</>}
        open={cancelModalVisible}
        onCancel={handleCancelModalClose}
        footer={[
          <Button key="back" onClick={handleCancelModalClose}>
            No
          </Button>,
          <Button
            key="submit"
            type="primary"
            danger
            loading={actionLoading}
            onClick={handleCancelAppointment}
          >
            Yes, Cancel Appointment
          </Button>,
        ]}
      >
        <p>Are you sure you want to cancel this appointment? This will free up the time slot for other students.</p>
        {appointmentToCancel && (
          <div style={{ marginTop: '16px', background: '#f5f5f5', padding: '12px', borderRadius: '4px' }}>
            <p style={{ margin: '4px 0' }}><strong>Date:</strong> {appointmentToCancel.date}</p>
            <p style={{ margin: '4px 0' }}><strong>Time:</strong> {appointmentToCancel.timeSlot}</p>
            <p style={{ margin: '4px 0' }}><strong>Counselor Type:</strong> {getCounselorTypeLabel(appointmentToCancel.counselorType)}</p>
          </div>
        )}
        
        <div style={{ marginTop: '16px' }}>
          <Form.Item
            label="Reason for Cancellation"
            required
            help="Please provide a reason for cancellation"
          >
            <Input.TextArea 
              rows={3} 
              value={cancellationReason}
              onChange={(e) => setCancellationReason(e.target.value)}
              placeholder="Please provide a reason for cancellation"
            />
          </Form.Item>
        </div>
      </Modal>

      <Modal
        title="Acknowledge Cancellation"
        open={acknowledgeModalVisible}
        onCancel={handleAcknowledgeModalClose}
        footer={[
          <Button key="close" onClick={handleAcknowledgeModalClose}>
            Close
          </Button>,
          <Button
            key="acknowledge"
            type="primary"
            loading={actionLoading}
            onClick={handleAcknowledgeCancellation}
          >
            Acknowledge Cancellation
          </Button>,
        ]}
      >
        {appointmentToAcknowledge && (
          <>
            <p>Your appointment has been cancelled by the guidance counselor. Please acknowledge that you have read the cancellation reason.</p>
            
            <div style={{ marginTop: '16px', background: '#f5f5f5', padding: '12px', borderRadius: '4px' }}>
              <p style={{ margin: '4px 0' }}><strong>Date:</strong> {appointmentToAcknowledge.date}</p>
              <p style={{ margin: '4px 0' }}><strong>Time:</strong> {appointmentToAcknowledge.timeSlot}</p>
              <p style={{ margin: '4px 0' }}><strong>Counselor Type:</strong> {getCounselorTypeLabel(appointmentToAcknowledge.counselorType)}</p>
              <p style={{ margin: '4px 0', color: '#ff4d4f' }}><strong>Cancellation Reason:</strong> {appointmentToAcknowledge.cancellationReason}</p>
            </div>
            
            <AcknowledgeButton 
              type="primary" 
              block
              icon={<CheckCircleOutlined />}
              onClick={handleAcknowledgeCancellation}
              loading={actionLoading}
            >
              I Acknowledge This Cancellation
            </AcknowledgeButton>
          </>
        )}
      </Modal>
    </ListContainer>
  );
};

export default AppointmentList;
