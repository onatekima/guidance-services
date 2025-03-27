import React from 'react';
import styled from 'styled-components';
import { Typography, Row, Col, Card, Statistic, List, Button, Calendar, Badge } from 'antd';
import { 
  CalendarOutlined, 
  MessageOutlined, 
  FileTextOutlined,
  RightOutlined,
  UserOutlined,
  ClockCircleOutlined,
  SecurityScanOutlined,
  CommentOutlined
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';

const { Title, Text, Paragraph } = Typography;

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

const ViewAllButton = styled(Button)`
  margin-top: 16px;
`;

const AppointmentItem = styled(List.Item)`
  padding: 12px 0 !important;
`;

const ConsultationItem = styled(List.Item)`
  padding: 12px 0 !important;
`;

const WelcomeCard = styled(Card)`
  background: linear-gradient(135deg, #722ed1 0%, #1890ff 100%);
  color: white;
  margin-bottom: 24px;
`;

const WelcomeTitle = styled(Title)`
  color: white !important;
  margin-bottom: 8px !important;
`;

const WelcomeText = styled(Paragraph)`
  color: rgba(255, 255, 255, 0.85);
  margin-bottom: 0;
`;

const StatCard = styled(Card)`
  .ant-statistic-title {
    font-size: 16px;
  }
  
  .ant-statistic-content-value {
    font-size: 28px;
    font-weight: bold;
  }
`;

const GuidanceDashboard = () => {
  const navigate = useNavigate();
  
  // Mock data for pending appointments
  const pendingAppointments = [
    {
      id: 1,
      studentName: 'John Doe',
      studentId: '11718MN-012140',
      date: '2023-06-15',
      timeSlot: '10:00 AM - 11:00 AM',
      purpose: 'Academic counseling'
    },
    {
      id: 2,
      studentName: 'Jane Smith',
      studentId: '11718MN-012141',
      date: '2023-06-15',
      timeSlot: '2:00 PM - 3:00 PM',
      purpose: 'Career guidance'
    },
    {
      id: 3,
      studentName: 'Mike Johnson',
      studentId: '11718MN-012142',
      date: '2023-06-16',
      timeSlot: '11:00 AM - 12:00 PM',
      purpose: 'Personal issues'
    }
  ];
  
  // Mock data for anonymous consultations
  const anonymousConsultations = [
    {
      id: 1,
      referenceCode: 'ANO-X7Y2Z9',
      category: 'Mental Health',
      date: '2023-06-14',
      status: 'Pending'
    },
    {
      id: 2,
      referenceCode: 'ANO-A1B2C3',
      category: 'Bullying',
      date: '2023-06-14',
      status: 'Pending'
    },
    {
      id: 3,
      referenceCode: 'ANO-D4E5F6',
      category: 'Academic Issues',
      date: '2023-06-13',
      status: 'Pending'
    }
  ];
  
  // Mock data for calendar events
  const calendarEvents = [
    {
      date: '2023-06-15',
      type: 'appointment',
      content: '2 Appointments'
    },
    {
      date: '2023-06-16',
      type: 'appointment',
      content: '1 Appointment'
    },
    {
      date: '2023-06-20',
      type: 'event',
      content: 'Mental Health Workshop'
    }
  ];
  
  const dateCellRender = (value) => {
    const dateString = value.format('YYYY-MM-DD');
    const events = calendarEvents.filter(event => event.date === dateString);
    
    return (
      <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
        {events.map((event, index) => (
          <li key={index}>
            <Badge 
              color={event.type === 'appointment' ? 'blue' : 'green'} 
              text={event.content} 
              style={{ fontSize: '12px' }}
            />
          </li>
        ))}
      </ul>
    );
  };

  return (
    <PageContainer>
      <WelcomeCard bordered={false}>
        <WelcomeTitle level={3}>Welcome, Guidance Counselor!</WelcomeTitle>
        <WelcomeText>
          You have 3 pending appointments and 3 anonymous consultations that need your attention.
        </WelcomeText>
      </WelcomeCard>
      
      <Row gutter={[24, 24]}>
        <Col xs={24} sm={12} lg={6}>
          <StatCard>
            <Statistic 
              title="Pending Appointments" 
              value={3} 
              prefix={<CalendarOutlined />} 
            />
          </StatCard>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <StatCard>
            <Statistic 
              title="Anonymous Consultations" 
              value={3} 
              prefix={<SecurityScanOutlined />} 
            />
          </StatCard>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <StatCard>
            <Statistic 
              title="New Feedback" 
              value={2} 
              prefix={<CommentOutlined />} 
            />
          </StatCard>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <StatCard>
            <Statistic 
              title="Total Students" 
              value={150} 
              prefix={<UserOutlined />} 
            />
          </StatCard>
        </Col>
      </Row>
      
      <Row gutter={[24, 24]} style={{ marginTop: '24px' }}>
        <Col xs={24} lg={12}>
          <StyledCard
            title={<><CalendarOutlined /> Pending Appointments</>}
            extra={<Button type="link" onClick={() => navigate('/guidance/appointments')}>View All</Button>}
          >
            <List
              itemLayout="horizontal"
              dataSource={pendingAppointments}
              renderItem={item => (
                <AppointmentItem>
                  <List.Item.Meta
                    title={<Text strong>{item.studentName} ({item.studentId})</Text>}
                    description={
                      <>
                        <Text>{item.date} - {item.timeSlot}</Text>
                        <br />
                        <Text type="secondary">{item.purpose}</Text>
                      </>
                    }
                  />
                  <Button type="link" onClick={() => navigate(`/guidance/appointments/${item.id}`)}>Details</Button>
                </AppointmentItem>
              )}
            />
          </StyledCard>
        </Col>
        <Col xs={24} lg={12}>
          <StyledCard
            title={<><SecurityScanOutlined /> Anonymous Consultations</>}
            extra={<Button type="link" onClick={() => navigate('/guidance/anonymous-consultations')}>View All</Button>}
          >
            <List
              itemLayout="horizontal"
              dataSource={anonymousConsultations}
              renderItem={item => (
                <ConsultationItem>
                  <List.Item.Meta
                    title={<Text strong>Reference Code: {item.referenceCode}</Text>}
                    description={
                      <>
                        <Text>{item.category}</Text>
                        <br />
                        <Text type="secondary">{item.date} - {item.status}</Text>
                      </>
                    }
                  />
                  <Button type="link" onClick={() => navigate(`/guidance/anonymous-consultations/${item.id}`)}>Details</Button>
                </ConsultationItem>
              )}
            />
          </StyledCard>
        </Col>
      </Row>
      
      <Row gutter={[24, 24]} style={{ marginTop: '24px' }}>
        <Col xs={24}>
          <StyledCard
            title={<><CalendarOutlined /> Calendar</>}
          >
            <Calendar dateCellRender={dateCellRender} />
          </StyledCard>
        </Col>
      </Row>
    </PageContainer>
  );
};

export default GuidanceDashboard;
