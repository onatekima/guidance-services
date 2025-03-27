import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { Typography, Tabs, List, Card, Tag, Button, Space, Empty, Spin, Alert, Modal, message, Collapse, Table } from 'antd';
import { CheckOutlined, CloseOutlined, ReloadOutlined, EyeOutlined, BugOutlined } from '@ant-design/icons';
import { collection, query, where, getDocs, doc, getDoc, updateDoc, Timestamp, orderBy } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { updateAppointmentStatus } from '../../firebase/appointments';
import moment from 'moment';

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
  const [debugInfo, setDebugInfo] = useState(null);
  const [indexUrl, setIndexUrl] = useState(null);
  const [showDebug, setShowDebug] = useState(false);

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

  const handleRejectAppointment = async (appointmentId) => {
    Modal.confirm({
      title: 'Reject Appointment',
      content: 'Are you sure you want to reject this appointment?',
      okText: 'Yes',
      okType: 'danger',
      cancelText: 'No',
      onOk: async () => {
        try {
          setActionLoading(true);
          
          await updateAppointmentStatus(appointmentId, 'rejected');
          
          setAppointments(appointments.map(app => 
            app.id === appointmentId ? { ...app, status: 'rejected' } : app
          ));
          
          message.success('Appointment rejected successfully');
        } catch (error) {
          console.error("Error rejecting appointment:", error);
          message.error('Failed to reject appointment');
        } finally {
          setActionLoading(false);
        }
      }
    });
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

  const handleViewDetails = (record) => {
    console.log("View details clicked for record:", record);
    
    if (!record) {
      console.error("Record is undefined or null");
      message.error("Cannot view details: Record not found");
      return;
    }
    
    try {
      Modal.info({
        title: 'Appointment Details',
        width: window.innerWidth < 768 ? '90%' : 600,
        icon: <EyeOutlined />,
        className: 'appointment-details-modal',
        content: (
          <div style={{ maxHeight: '70vh', overflow: 'auto', padding: '8px 0' }}>
            <div style={{ marginBottom: '16px', padding: '12px', background: '#f5f5f5', borderRadius: '4px' }}>
              <h4 style={{ margin: '0 0 8px 0' }}>Student Information</h4>
              <p style={{ margin: '4px 0' }}><strong>Student ID:</strong> {record.studentId}</p>
              <p style={{ margin: '4px 0' }}><strong>Name:</strong> {record.studentName}</p>
              <p style={{ margin: '4px 0' }}><strong>Email:</strong> {record.email || 'Not provided'}</p>
            </div>
            
            <div style={{ marginBottom: '16px', padding: '12px', background: '#f5f5f5', borderRadius: '4px' }}>
              <h4 style={{ margin: '0 0 8px 0' }}>Appointment Information</h4>
              <p style={{ margin: '4px 0' }}><strong>Date:</strong> {record.date}</p>
              <p style={{ margin: '4px 0' }}><strong>Time:</strong> {record.timeSlot}</p>
              <p style={{ margin: '4px 0' }}><strong>Counselor Type:</strong> {record.counselorType}</p>
              <p style={{ margin: '4px 0' }}>
                <strong>Status:</strong> 
                <Tag 
                  style={{ marginLeft: '8px' }}
                  color={
                    record.status === 'pending' ? 'gold' :
                    record.status === 'confirmed' ? 'blue' :
                    record.status === 'completed' ? 'green' :
                    record.status === 'rejected' || record.status === 'cancelled' ? 'red' :
                    'default'
                  }
                >
                  {record.status?.toUpperCase() || 'UNKNOWN'}
                </Tag>
              </p>
            </div>
            
            <div style={{ marginBottom: '16px', padding: '12px', background: '#f5f5f5', borderRadius: '4px' }}>
              <h4 style={{ margin: '0 0 8px 0' }}>Purpose</h4>
              <p style={{ margin: '4px 0', whiteSpace: 'pre-wrap' }}>{record.purpose}</p>
            </div>
            
            {record.notes && (
              <div style={{ padding: '12px', background: '#f5f5f5', borderRadius: '4px' }}>
                <h4 style={{ margin: '0 0 8px 0' }}>Notes</h4>
                <p style={{ margin: '4px 0', whiteSpace: 'pre-wrap' }}>{record.notes}</p>
              </div>
            )}
          </div>
        ),
        okText: 'Close',
        onOk() {},
      });
    } catch (error) {
      console.error("Error displaying appointment details:", error);
      message.error("Failed to display appointment details");
    }
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
                  onClick={() => handleRejectAppointment(record.id)}
                  loading={actionLoading}
                >
                  {window.innerWidth > 576 ? 'Reject' : ''}
                </ActionButton>
              </>
            )}
            {record.status === 'confirmed' && (
              <ActionButton 
                type="primary" 
                size="small" 
                icon={<CheckOutlined />}
                onClick={() => handleCompleteAppointment(record.id)}
                loading={actionLoading}
              >
                {window.innerWidth > 576 ? 'Complete' : ''}
              </ActionButton>
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
      </Space>
      
      {renderContent()}
    </PageContainer>
  );
};

export default GuidanceAppointments;
