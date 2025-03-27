import React from 'react';
import styled from 'styled-components';
import { Typography, Tabs } from 'antd';
import AnonymousConsultationForm from '../components/AnonymousConsultation/AnonymousConsultationForm';
import AnonymousConsultationList from '../components/AnonymousConsultation/AnonymousConsultationList';

const { Title } = Typography;

const PageContainer = styled.div`
  width: 100%;
`;

const PageTitle = styled(Title)`
  margin-bottom: 24px !important;
`;

const AnonymousConsultationPage = () => {
  return (
    <PageContainer>
      <PageTitle level={2}>Anonymous Consultation</PageTitle>
      
      <Tabs 
        defaultActiveKey="submit"
        items={[
          {
            key: 'submit',
            label: 'Submit Consultation',
            children: <AnonymousConsultationForm />
          },
          {
            key: 'view',
            label: 'View Responses',
            children: <AnonymousConsultationList />
          }
        ]}
      />
    </PageContainer>
  );
};

export default AnonymousConsultationPage;
