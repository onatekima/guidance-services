import React, { useState } from 'react';
import styled from 'styled-components';
import { Typography, Tabs, Button } from 'antd';
import AppointmentForm from '../components/AppointmentScheduling/AppointmentForm';
import AppointmentList from '../components/AppointmentScheduling/AppointmentList';
import { useAuth } from '../context/AuthContext';

const { Title } = Typography;
const { TabPane } = Tabs;

const PageContainer = styled.div`
  padding: 24px;
  
  @media (max-width: ${props => props.theme.breakpoints.md}) {
    padding: 16px;
  }
`;

const PageHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  
  @media (max-width: ${props => props.theme.breakpoints.sm}) {
    flex-direction: column;
    align-items: flex-start;
    gap: 16px;
  }
`;

const Appointments = () => {
  const [activeTab, setActiveTab] = useState('1');
  const auth = useAuth();

  const handleTabChange = (key) => {
    setActiveTab(key);
  };

  return (
    <PageContainer>
      <PageHeader>
        <Title level={2}>Appointments</Title>
      </PageHeader>
      
      <Tabs activeKey={activeTab} onChange={handleTabChange}>
        <TabPane tab="Book Appointment" key="1">
          <AppointmentForm />
        </TabPane>
        <TabPane tab="My Appointments" key="2">
          <AppointmentList />
        </TabPane>
      </Tabs>
    </PageContainer>
  );
};

export default Appointments;
