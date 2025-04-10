import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { Typography, Tabs, List, Card, Tag, Button, Space, Empty, Spin, Alert, Modal, message, Collapse, Table, Form, Input } from 'antd';
import { CheckOutlined, CloseOutlined, ReloadOutlined, EyeOutlined, BugOutlined, ExclamationCircleOutlined, CalendarOutlined } from '@ant-design/icons';
import { collection, query, where, getDocs, doc, getDoc, orderBy } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { updateAppointmentStatus, getCounselorTypeLabel } from '../../firebase/appointments';
import moment from 'moment';
import TimeSlotManager from '../../components/Guidance/TimeSlotManager';

const { Title, Text } = Typography;
const { TabPane } = Tabs;
const { Panel } = Collapse;

const PageContainer = styled.div`
  width: 100%;
`;

const PageTitle = styled(Title)`
  margin-bottom: 24px !important;
  
  @media (max-width: ${props => props.theme.breakpoints.sm}) {
    font-size: 24px !important;
    margin-bottom: 16px !important;
  }
`;

const LoadingContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 40px;
`;

const DebugContainer = styled.div`
  margin-bottom: 16px;
  padding: 12px;
  background-color: #f5f5f5;
  border-radius: 4px;
  border: 1px solid #d9d9d9;
  
  @media (max-width: ${props => props.theme.breakpoints.md}) {
    padding: 8px;
  }
`;

const ActionButton = styled(Button)`
  @media (max-width: ${props => props.theme.breakpoints.sm}) {
    padding: 4px 8px;
    height: auto;
    
    &.ant-btn-sm {
      font-size: 12px;
    }
  }
`;

const ResponsiveTable = styled(Table)`
  .ant-table {
    overflow-x: auto;
  }
  
  @media (max-width: ${props => props.theme.breakpoints.md}) {
    .ant-table-cell {
      padding: 8px;
      white-space: nowrap;
    }
    
    .ant-table-thead > tr > th,
    .ant-table-tbody > tr > td {
      padding: 8px;
    }
  }
`;

const ResponsiveTabs = styled(Tabs)`
  @media (max-width: ${props => props.theme.breakpoints.sm}) {
    .ant-tabs-nav-list {
      flex-wrap: wrap;
    }
    
    .ant-tabs-tab {
      margin: 0 8px 8px 0;
      padding: 6px 10px;
    }
  }
`;

const GuidanceAppointments = () => {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState(null);
  const [detailsModalVisible, setDetailsModalVisible] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [rejectModalVisible, setRejectModalVisible] = useState(false);
  const [appointmentToReject, setAppointmentToReject] = useState(null);
  const [indexUrl, setIndexUrl] = useState(null);
  const [showDebug, setShowDebug] = useState(false);
  const [cancelModalVisible, setCancelModalVisible] = useState(false);
  const [appointmentToCancel, setAppointmentToCancel] = useState(null);
  const [cancellationReason, setCancellationReason] = useState('');
  const [showTimeSlotManager, setShowTimeSlotManager] = useState(false);

  useEffect(() => {
    fetchAppointments();
  }, []);

  const fetchAppointments = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const appointmentsQuery = query(
        collection(db, 'appointments'),
        orderBy("createdAt", "desc")
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
    } catch (error) {
      console.error("Error fetching appointments:", error);
      setError("Failed to load appointments. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  const handleApproveAppointment = async (appointmentId) => {
    try {
      setActionLoading(true);
      
      await updateAppointmentStatus(appointmentId, 'confirmed');
      
      setAppointments(appointments.map(app => 
        app.id === appointmentId ? { ...app, status: 'confirmed' } : app
      ));
      
      message.success('Appointment confirmed successfully');
    } catch (error) {
      console.error("Error confirming appointment:", error);
      message.error('Failed to confirm appointment');
    } finally {
      setActionLoading(false);
    }
  };

  const showRejectConfirmation = (appointmentId) => {
    const appointment = appointments.find(app => app.id === appointmentId);
    if (appointment) {
      setAppointmentToReject(appointment);
      setRejectModalVisible(true);
    }
  };

  const handleRejectModalClose = () => {
    setRejectModalVisible(false);
    setAppointmentToReject(null);
  };

  const handleRejectAppointment = async () => {
    if (!appointmentToReject) return;
    
    try {
      setActionLoading(true);
      
      await updateAppointmentStatus(appointmentToReject.id, 'rejected');
      
      setAppointments(appointments.map(app => 
        app.id === appointmentToReject.id ? { ...app, status: 'rejected' } : app
      ));
      
      message.success('Appointment rejected successfully');
      
      setRejectModalVisible(false);
      
      if (selectedAppointment && selectedAppointment.id === appointmentToReject.id) {
        setDetailsModalVisible(false);
        setSelectedAppointment(null);
      }
    } catch (error) {
      console.error("Error rejecting appointment:", error);
      message.error('Failed to reject appointment');
    } finally {
      setActionLoading(false);
      setAppointmentToReject(null);
    }
  };

  const handleCompleteAppointment = async (appointmentId) => {
    try {
      setActionLoading(true);
      
      await updateAppointmentStatus(appointmentId, 'completed');
      
      setAppointments(appointments.map(app => 
        app.id === appointmentId ? { ...app, status: 'completed' } : app
      ));
      
      message.success('Appointment marked as completed');
    } catch (error) {
      console.error("Error completing appointment:", error);
      message.error('Failed to complete appointment');
    } finally {
      setActionLoading(false);
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
          cancellationBy: 'guidance',
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

  const getColumns = () => {
    const baseColumns = [
      {
        title: 'Student Name',
        dataIndex: 'studentName',
        key: 'studentName',
      },
      {
        title: 'Date',
        dataIndex: 'date',
        key: 'date',
      },
      {
        title: 'Status',
        dataIndex: 'status',
        key: 'status',
        render: (status) => (
          <Tag color={
            status === 'pending' ? 'gold' :
            status === 'confirmed' ? 'blue' :
            status === 'completed' ? 'green' :
            status === 'rejected' || status === 'cancelled' ? 'red' :
            'default'
          }>
            {status?.toUpperCase() || 'UNKNOWN'}
          </Tag>
        ),
      },
      {
        title: 'Action',
        key: 'action',
        render: (_, record) => (
          <Space size="small" wrap>
            {record.status === 'pending' && (
              <>
                <ActionButton 
                  type="primary" 
                  size="small" 
                  icon={<CheckOutlined />}
                  onClick={() => handleApproveAppointment(record.id)}
                  loading={actionLoading}
                >
                  {window.innerWidth > 576 ? 'Approve' : ''}
                </ActionButton>
                <ActionButton 
                  danger 
                  size="small" 
                  icon={<CloseOutlined />}
                  onClick={() => showRejectConfirmation(record.id)}
                  loading={actionLoading}
                >
                  {window.innerWidth > 576 ? 'Reject' : ''}
                </ActionButton>
              </>
            )}
            {record.status === 'confirmed' && (
              <>
                <ActionButton 
                  type="primary" 
                  size="small" 
                  icon={<CheckOutlined />}
                  onClick={() => handleCompleteAppointment(record.id)}
                  loading={actionLoading}
                >
                  {window.innerWidth > 576 ? 'Complete' : ''}
                </ActionButton>
                <ActionButton 
                  danger 
                  size="small" 
                  icon={<CloseOutlined />}
                  onClick={() => showCancelConfirmation(record.id)}
                  loading={actionLoading}
                >
                  {window.innerWidth > 576 ? 'Cancel' : ''}
                </ActionButton>
              </>
            )}
            <ActionButton 
              type="link" 
              size="small" 
              icon={<EyeOutlined />}
              onClick={(e) => {
                e.stopPropagation();
                handleViewDetails(record);
              }}
            >
              {window.innerWidth > 576 ? 'Details' : ''}
            </ActionButton>
          </Space>
        ),
      },
    ];

    if (window.innerWidth >= 768) {
      return [
        {
          title: 'Student ID',
          dataIndex: 'studentId',
          key: 'studentId',
        },
        ...baseColumns.slice(0, 1),
        {
          title: 'Time',
          dataIndex: 'timeSlot',
          key: 'timeSlot',
        },
        ...baseColumns.slice(1)
      ];
    }

    return baseColumns;
  };

  const extractIndexUrlFromError = (errorMessage) => {
    const urlMatch = errorMessage.match(/https:\/\/console\.firebase\.google\.com[^\s]*/);
    return urlMatch ? urlMatch[0] : null;
  };

  const handleCreateIndex = () => {
    if (indexUrl) {
      window.open(indexUrl, '_blank');
    }
  };

  const renderContent = () => {
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
          message={indexUrl ? "Index Required" : "Error Loading Appointments"}
          description={error}
          type={indexUrl ? "warning" : "error"}
          showIcon
          action={
            <Space>
              {indexUrl && (
                <Button type="primary" onClick={handleCreateIndex}>
                  Create Index
                </Button>
              )}
              <Button onClick={fetchAppointments}>
                Retry
              </Button>
            </Space>
          }
        />
      );
    }

    if (appointments.length === 0) {
      return (
        <Empty 
          description="No appointments found" 
          image={Empty.PRESENTED_IMAGE_SIMPLE}
        >
          <Button type="primary" onClick={fetchAppointments} icon={<ReloadOutlined />}>
            Refresh
          </Button>
        </Empty>
      );
    }

    const columns = getColumns();

    return (
      <ResponsiveTabs defaultActiveKey="all">
        <TabPane tab={`All (${appointments.length})`} key="all">
          <ResponsiveTable 
            columns={columns} 
            dataSource={appointments}
            pagination={{ 
              responsive: true,
              pageSize: window.innerWidth < 768 ? 5 : 10
            }}
            scroll={{ x: 'max-content' }}
          />
        </TabPane>
        <TabPane tab={`Pending (${appointments.filter(a => a.status === 'pending').length})`} key="pending">
          <ResponsiveTable 
            columns={columns} 
            dataSource={appointments.filter(a => a.status === 'pending')}
            pagination={{ 
              responsive: true,
              pageSize: window.innerWidth < 768 ? 5 : 10
            }}
            scroll={{ x: 'max-content' }}
          />
        </TabPane>
        <TabPane tab={`Confirmed (${appointments.filter(a => a.status === 'confirmed').length})`} key="confirmed">
          <ResponsiveTable 
            columns={columns} 
            dataSource={appointments.filter(a => a.status === 'confirmed')}
            pagination={{ 
              responsive: true,
              pageSize: window.innerWidth < 768 ? 5 : 10
            }}
            scroll={{ x: 'max-content' }}
          />
        </TabPane>
        <TabPane tab={`Completed (${appointments.filter(a => a.status === 'completed').length})`} key="completed">
          <ResponsiveTable 
            columns={columns} 
            dataSource={appointments.filter(a => a.status === 'completed')}
            pagination={{ 
              responsive: true,
              pageSize: window.innerWidth < 768 ? 5 : 10
            }}
            scroll={{ x: 'max-content' }}
          />
        </TabPane>
        <TabPane tab={`Cancelled/Rejected (${appointments.filter(a => a.status === 'cancelled' || a.status === 'rejected').length})`} key="cancelled">
          <ResponsiveTable 
            columns={columns} 
            dataSource={appointments.filter(a => a.status === 'cancelled' || a.status === 'rejected')}
            pagination={{ 
              responsive: true,
              pageSize: window.innerWidth < 768 ? 5 : 10
            }}
            scroll={{ x: 'max-content' }}
          />
        </TabPane>
      </ResponsiveTabs>
    );
  };

  const getCounselorTypeLabel = (type) => {
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
        return type;
    }
  };

  return (
    <PageContainer>
      <PageTitle level={2}>Appointments</PageTitle>
      
      <Space style={{ marginBottom: 16 }}>
        <Button 
          type="primary" 
          icon={<ReloadOutlined />} 
          onClick={fetchAppointments}
        >
          Refresh
        </Button>
        <Button 
          icon={<CalendarOutlined />} 
          onClick={() => setShowTimeSlotManager(!showTimeSlotManager)}
        >
          {showTimeSlotManager ? 'Hide Time Slot Manager' : 'Manage Time Slots'}
        </Button>
      </Space>
      
      {showTimeSlotManager && <TimeSlotManager />}
      
      {renderContent()}
      
      <Modal
        title="Appointment Details"
        open={detailsModalVisible}
        onCancel={handleCloseDetailsModal}
        footer={[
          <Button key="close" onClick={handleCloseDetailsModal}>
            Close
          </Button>,
          selectedAppointment?.status === 'pending' && (
            <>
              <Button 
                key="approve" 
                type="primary"
                onClick={() => {
                  handleCloseDetailsModal();
                  handleApproveAppointment(selectedAppointment.id);
                }}
              >
                Approve
              </Button>
              <Button 
                key="reject" 
                danger
                onClick={() => {
                  handleCloseDetailsModal();
                  showRejectConfirmation(selectedAppointment.id);
                }}
              >
                Reject
              </Button>
            </>
          ),
          selectedAppointment?.status === 'confirmed' && (
            <Button 
              key="complete" 
              type="primary"
              onClick={() => {
                handleCloseDetailsModal();
                handleCompleteAppointment(selectedAppointment.id);
              }}
            >
              Mark as Completed
            </Button>
          )
        ].filter(Boolean)}
      >
        {selectedAppointment && (
          <div style={{ maxHeight: '60vh', overflow: 'auto' }}>
            <div style={{ marginBottom: '16px', padding: '12px', background: '#f5f5f5', borderRadius: '4px' }}>
              <h4 style={{ margin: '0 0 8px 0' }}>Student Information</h4>
              <p style={{ margin: '4px 0' }}><strong>Student ID:</strong> {selectedAppointment.studentId}</p>
              <p style={{ margin: '4px 0' }}><strong>Name:</strong> {selectedAppointment.studentName}</p>
              <p style={{ margin: '4px 0' }}><strong>Email:</strong> {selectedAppointment.email || 'Not provided'}</p>
            </div>
            
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
              <p style={{ margin: '4px 0' }}><strong>Created:</strong> {selectedAppointment.createdAt ? moment(selectedAppointment.createdAt.toDate()).format('YYYY-MM-DD HH:mm') : 'Unknown'}</p>
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
        title={<><ExclamationCircleOutlined style={{ color: '#ff4d4f', marginRight: '8px' }} /> Reject Appointment</>}
        open={rejectModalVisible}
        onCancel={handleRejectModalClose}
        footer={[
          <Button key="back" onClick={handleRejectModalClose}>
            No
          </Button>,
          <Button
            key="submit"
            type="primary"
            danger
            loading={actionLoading}
            onClick={handleRejectAppointment}
          >
            Yes, Reject Appointment
          </Button>,
        ]}
      >
        <p>Are you sure you want to reject this appointment? This will free up the time slot for other students.</p>
        {appointmentToReject && (
          <div style={{ marginTop: '16px', background: '#f5f5f5', padding: '12px', borderRadius: '4px' }}>
            <p style={{ margin: '4px 0' }}><strong>Student:</strong> {appointmentToReject.studentName}</p>
            <p style={{ margin: '4px 0' }}><strong>Date:</strong> {appointmentToReject.date}</p>
            <p style={{ margin: '4px 0' }}><strong>Time:</strong> {appointmentToReject.timeSlot}</p>
            <p style={{ margin: '4px 0' }}><strong>Counselor Type:</strong> {getCounselorTypeLabel(appointmentToReject.counselorType)}</p>
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
        <p>Are you sure you want to cancel this appointment? This will notify the student.</p>
        {appointmentToCancel && (
          <div style={{ marginTop: '16px', background: '#f5f5f5', padding: '12px', borderRadius: '4px' }}>
            <p style={{ margin: '4px 0' }}><strong>Student:</strong> {appointmentToCancel.studentName}</p>
            <p style={{ margin: '4px 0' }}><strong>Date:</strong> {appointmentToCancel.date}</p>
            <p style={{ margin: '4px 0' }}><strong>Time:</strong> {appointmentToCancel.timeSlot}</p>
            <p style={{ margin: '4px 0' }}><strong>Counselor Type:</strong> {getCounselorTypeLabel(appointmentToCancel.counselorType)}</p>
          </div>
        )}
        
        <div style={{ marginTop: '16px' }}>
          <Form.Item
            label="Reason for Cancellation"
            required
            help="This reason will be sent to the student"
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
    </PageContainer>
  );
};

export default GuidanceAppointments;
