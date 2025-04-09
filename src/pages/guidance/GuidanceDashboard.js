import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { Typography, Row, Col, Card, Statistic, Table, Tag, Progress, Spin, Empty, Tabs } from 'antd';
import { CalendarOutlined, CheckCircleOutlined, CloseCircleOutlined, UserOutlined, FileTextOutlined, CommentOutlined, SecurityScanOutlined, StarOutlined, BarChartOutlined, ClockCircleOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { getAllAppointments } from '../../firebase/appointments';
import { getAllFeedbackInquiries } from '../../firebase/feedbackInquiries';
import moment from 'moment';

const { Title, Text, Paragraph } = Typography;
const { TabPane } = Tabs;

const PageContainer = styled.div`
  width: 100%;
`;

const PageTitle = styled(Title)`
  margin-bottom: 24px !important;
`;

const StyledCard = styled(Card)`
  height: 100%;
  
  .ant-card-head-title {
    display: flex;
    align-items: center;
    
    svg {
      margin-right: 8px;
    }
  }
`;

const MetricCard = styled(Card)`
  .ant-statistic-title {
    font-size: 16px;
  }
  
  .ant-statistic-content-value {
    font-size: 28px;
    font-weight: bold;
  }
`;

const LoadingContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 40px;
`;

const SatisfactionIndicator = styled.div`
  display: flex;
  align-items: center;
  
  .ant-progress {
    margin-right: 8px;
  }
`;

const GuidanceDashboard = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [appointments, setAppointments] = useState([]);
  const [feedback, setFeedback] = useState([]);
  
  useEffect(() => {
    fetchData();
  }, []);
  
  const fetchData = async () => {
    try {
      setLoading(true);
      
      const allAppointments = await getAllAppointments();
      setAppointments(allAppointments);
      
      const allFeedback = await getAllFeedbackInquiries();
      setFeedback(allFeedback);
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };
  
  const calculateMetrics = () => {
    const totalAppointments = appointments.length;
    const completedAppointments = appointments.filter(app => app.status === 'completed').length;
    const pendingAppointments = appointments.filter(app => app.status === 'pending').length;
    const confirmedAppointments = appointments.filter(app => app.status === 'confirmed').length;
    const cancelledAppointments = appointments.filter(app => app.status === 'cancelled' || app.status === 'rejected').length;
    
    const completionRate = totalAppointments > 0 
      ? Math.round((completedAppointments / totalAppointments) * 100) 
      : 0;
    
    const appointmentTypes = {};
    appointments.forEach(app => {
      const type = app.counselorType || 'unknown';
      appointmentTypes[type] = (appointmentTypes[type] || 0) + 1;
    });
    
    const concernCategories = {};
    appointments.forEach(app => {
      if (app.purpose) {
        const purpose = app.purpose.toLowerCase();
        if (purpose.includes('academic')) {
          concernCategories['academic'] = (concernCategories['academic'] || 0) + 1;
        } else if (purpose.includes('career')) {
          concernCategories['career'] = (concernCategories['career'] || 0) + 1;
        } else if (purpose.includes('mental') || purpose.includes('health') || purpose.includes('stress')) {
          concernCategories['mental_health'] = (concernCategories['mental_health'] || 0) + 1;
        } else if (purpose.includes('personal')) {
          concernCategories['personal'] = (concernCategories['personal'] || 0) + 1;
        } else {
          concernCategories['other'] = (concernCategories['other'] || 0) + 1;
        }
      }
    });
    
    const anonymousConsultations = feedback.filter(item => item.type === 'anonymous').length;
    
    const feedbackItems = feedback.filter(item => item.type === 'feedback');
    
    const satisfactionScores = feedbackItems
      .map(item => item.satisfaction)
    
    const satisfactionScore = satisfactionScores.length > 0
      ? (satisfactionScores.reduce((sum, score) => sum + score, 0) / satisfactionScores.length).toFixed(1)
      : '0.0';
    
    return {
      totalAppointments,
      completedAppointments,
      pendingAppointments,
      confirmedAppointments,
      cancelledAppointments,
      completionRate,
      appointmentTypes,
      concernCategories,
      anonymousConsultations,
      feedbackCount: feedbackItems.length,
      satisfactionScore
    };
  };
  
  const metrics = calculateMetrics();
  
  const appointmentStatusData = [
    { status: 'Completed', count: metrics.completedAppointments, color: '#52c41a' },
    { status: 'Confirmed', count: metrics.confirmedAppointments, color: '#1890ff' },
    { status: 'Pending', count: metrics.pendingAppointments, color: '#faad14' },
    { status: 'Cancelled / Rejected', count: metrics.cancelledAppointments, color: '#f5222d' }
  ];
  
  const appointmentTypesData = Object.entries(metrics.appointmentTypes).map(([type, count]) => ({
    type: formatAppointmentType(type),
    count
  }));
  
  const concernCategoriesData = Object.entries(metrics.concernCategories).map(([category, count]) => ({
    category: formatConcernCategory(category),
    count
  }));
  
  function formatAppointmentType(type) {
    switch(type) {
      case 'academic':
        return 'Academic';
      case 'career':
        return 'Career';
      case 'mental_health':
        return 'Mental Health';
      case 'family':
        return 'Family';
      case 'crisis':
        return 'Crisis';
      case 'gender_sexuality':
        return 'Gender & Sexuality';
      default:
        return type.charAt(0).toUpperCase() + type.slice(1);
    }
  }
  
  function formatConcernCategory(category) {
    switch(category) {
      case 'academic':
        return 'Academic Issues';
      case 'career':
        return 'Career Guidance';
      case 'mental_health':
        return 'Mental Health';
      case 'personal':
        return 'Personal Issues';
      default:
        return 'Other Concerns';
    }
  }
  
  const getStatusColor = (status) => {
    switch(status) {
      case 'completed':
        return 'success';
      case 'confirmed':
        return 'processing';
      case 'pending':
        return 'warning';
      case 'cancelled':
      case 'rejected':
        return 'error';
      default:
        return 'default';
    }
  };
  
  const appointmentsColumns = [
    {
      title: 'Student ID',
      dataIndex: 'studentId',
      key: 'studentId',
    },
    {
      title: 'Date',
      dataIndex: 'date',
      key: 'date',
    },
    {
      title: 'Time',
      dataIndex: 'timeSlot',
      key: 'timeSlot',
    },
    {
      title: 'Type',
      dataIndex: 'counselorType',
      key: 'counselorType',
      render: (type) => formatAppointmentType(type)
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status) => (
        <Tag color={getStatusColor(status)}>
          {status.toUpperCase()}
        </Tag>
      )
    }
  ];
  
  if (loading) {
    return (
      <LoadingContainer>
        <Spin size="large" />
      </LoadingContainer>
    );
  }

  return (
    <PageContainer>
      <PageTitle level={2}>Guidance Dashboard</PageTitle>
      
      <Row gutter={[24, 24]}>
        <Col xs={24} sm={12} lg={8}>
          <MetricCard>
            <Statistic 
              title="Total Appointments" 
              value={metrics.totalAppointments} 
              prefix={<CalendarOutlined />} 
            />
          </MetricCard>
        </Col>
        <Col xs={24} sm={12} lg={8}>
          <MetricCard>
            <Statistic 
              title="Completion Rate" 
              value={metrics.completionRate} 
              suffix="%" 
              prefix={<CheckCircleOutlined />} 
              valueStyle={{ color: '#3f8600' }}
            />
          </MetricCard>
        </Col>
        <Col xs={24} sm={12} lg={8}>
          <MetricCard>
            <Statistic 
              title="Student Satisfaction" 
              value={metrics.satisfactionScore} 
              prefix={<StarOutlined />} 
              suffix="/5"
              valueStyle={{ color: '#3f8600' }}
            />
          </MetricCard>
        </Col>
      </Row>
      
      <Row gutter={[24, 24]} style={{ marginTop: '24px' }}>
        <Col xs={24}>
          <StyledCard title={<><ClockCircleOutlined /> Recent Appointments</>}>
            <Table 
              dataSource={appointments.slice(0, 5).map(app => ({ ...app, key: app.id }))} 
              columns={appointmentsColumns} 
              pagination={false}
              size="small"
            />
          </StyledCard>
        </Col>
      </Row>
      
      <Row gutter={[24, 24]} style={{ marginTop: '24px' }}>
        <Col xs={24} lg={12}>
          <StyledCard title={<><BarChartOutlined /> Appointment Status</>}>
            {appointmentStatusData.map(item => (
              <div key={item.status} style={{ marginBottom: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <Text>{item.status}</Text>
                  <Text>{item.count}</Text>
                </div>
                <Progress 
                  percent={metrics.totalAppointments > 0 ? Math.round((item.count / metrics.totalAppointments) * 100) : 0} 
                  strokeColor={item.color}
                  showInfo={false}
                />
              </div>
            ))}
          </StyledCard>
        </Col>
        
        <Col xs={24} lg={12}>
          <StyledCard title={<><FileTextOutlined /> Appointment Types</>}>
            {appointmentTypesData.length > 0 ? (
              appointmentTypesData.map(item => (
                <div key={item.type} style={{ marginBottom: '16px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <Text>{item.type}</Text>
                    <Text>{item.count}</Text>
                  </div>
                  <Progress 
                    percent={metrics.totalAppointments > 0 ? Math.round((item.count / metrics.totalAppointments) * 100) : 0} 
                    showInfo={false}
                  />
                </div>
              ))
            ) : (
              <Empty description="No appointment type data available" />
            )}
          </StyledCard>
        </Col>
      </Row>
      
      <Row gutter={[24, 24]} style={{ marginTop: '24px' }}>
      </Row>
    </PageContainer>
  );
};

export default GuidanceDashboard;
