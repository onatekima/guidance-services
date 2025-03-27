import React from 'react';
import styled from 'styled-components';
import { Typography, Row, Col, Card, Statistic, List, Button, Calendar, Badge } from 'antd';
import { 
  CalendarOutlined, 
  MessageOutlined, 
  FileTextOutlined,
  RightOutlined,
  UserOutlined,
  ClockCircleOutlined
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

const ResourceItem = styled(List.Item)`
  padding: 12px 0 !important;
`;

const WelcomeCard = styled(Card)`
  background: linear-gradient(135deg, ${props => props.theme.colors.primary} 0%, #36cfc9 100%);
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

const Dashboard = () => {
  const navigate = useNavigate();
  
  // Mock data for upcoming appointments
  const upcomingAppointments = [
    {
      id: 1,
      counselorType: 'Academic Counselor',
      counselorName: 'Dr. Jane Smith',
      date: '2023-06-15',
      timeSlot: '10:00 AM - 11:00 AM'
    },
    {
      id: 2,
      counselorType: 'Mental Health Counselor',
      counselorName: 'Dr. Michael Johnson',
      date: '2023-06-20',
      timeSlot: '2:00 PM - 3:00 PM'
    }
  ];
  
  // Mock data for recent resources
  const recentResources = [
    {
      id: 1,
      title: 'Coping with Exam Stress',
      type: 'article'
    },
    {
      id: 2,
      title: 'Mindfulness Meditation Guide',
      type: 'guide'
    },
    {
      id: 3,
      title: 'Understanding Anxiety',
      type: 'video'
    }
  ];
  
  // Mock data for calendar events
  const calendarEvents = [
    {
      date: '2023-06-15',
      type: 'appointment',
      content: 'Academic Counseling'
    },
    {
      date: '2023-06-20',
      type: 'appointment',
      content: 'Mental Health Counseling'
    },
    {
      date: '2023-06-25',
      type: 'event',
      content: 'Wellness Workshop'
    }
  ];
  
  const dateCellRender = (value) => {
    const dateString = value.format('YYYY-MM-DD');
    const events = calendarEvents.filter(event => event.date === dateString);
    
    return (
      <ul style={{ listStyle: 'none' }}>
        {events.map(event => (
          <li key={event.id}>{event.content}</li>
        ))}
      </ul>
    );
  };

  return (
    <PageContainer>
      <PageTitle level={2}>Dashboard</PageTitle>
      
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} lg={8}>
          <StyledCard>
            <Statistic 
              title="Upcoming Appointments" 
              value={5} 
              prefix={<CalendarOutlined />} 
            />
          </StyledCard>
        </Col>
        <Col xs={24} sm={12} lg={8}>
          <StyledCard>
            <Statistic 
              title="Resources Available" 
              value={24} 
              prefix={<FileTextOutlined />} 
            />
          </StyledCard>
        </Col>
        <Col xs={24} sm={12} lg={8}>
          <StyledCard>
            <Statistic 
              title="Active Users" 
              value={125} 
              prefix={<UserOutlined />} 
            />
          </StyledCard>
        </Col>
      </Row>
      
      <Row gutter={[16, 16]} style={{ marginTop: '24px' }}>
        <Col xs={24} lg={16}>
          <StyledCard title="Recent Activity">
            <List
              itemLayout="horizontal"
              dataSource={recentResources}
              renderItem={(item) => (
                <ResourceItem>
                  <List.Item.Meta
                    title={item.title}
                    description={item.type}
                  />
                </ResourceItem>
              )}
            />
            <ViewAllButton type="primary" onClick={() => navigate('/resources')}>
              View All
            </ViewAllButton>
          </StyledCard>
        </Col>
        <Col xs={24} lg={8}>
          <StyledCard title="Quick Actions">
            <p>Schedule an appointment</p>
            <p>Browse resources</p>
            <p>Contact support</p>
          </StyledCard>
        </Col>
      </Row>
    </PageContainer>
  );
};

export default Dashboard;
