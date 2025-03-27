import React from 'react';
import styled from 'styled-components';
import { Typography, List, Badge, Button, Empty, Tabs, Tag, Space } from 'antd';
import { 
  BellOutlined, 
  CalendarOutlined, 
  MessageOutlined, 
  NotificationOutlined,
  CheckOutlined
} from '@ant-design/icons';

const { Title, Text } = Typography;
const { TabPane } = Tabs;

const PageContainer = styled.div`
  width: 100%;
`;

const PageTitle = styled(Title)`
  margin-bottom: 24px !important;
`;

const NotificationItem = styled(List.Item)`
  padding: 16px !important;
  
  &:hover {
    background-color: ${props => props.theme.colors.light};
  }
  
  ${props => props.unread && `
    background-color: rgba(24, 144, 255, 0.1);
  `}
`;

const NotificationIcon = styled.div`
  font-size: 24px;
  color: ${props => props.theme.colors.primary};
  margin-right: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const NotificationContent = styled.div`
  flex: 1;
`;

const NotificationTime = styled(Text)`
  color: ${props => props.theme.colors.textSecondary};
  font-size: 12px;
`;

const ActionButtons = styled.div`
  display: flex;
  justify-content: space-between;
  margin-top: 16px;
`;

const GuidanceNotifications = () => {
  const notifications = [
    {
      id: 1,
      type: 'appointment',
      title: 'New Appointment Request',
      message: 'John Doe (11718MN-012140) has requested an appointment for tomorrow at 10:00 AM.',
      time: '2 hours ago',
      unread: true
    },
    {
      id: 2,
      type: 'consultation',
      title: 'New Anonymous Consultation',
      message: 'A new anonymous consultation has been submitted (Ref: ANO-X7Y2Z9).',
      time: '5 hours ago',
      unread: true
    },
    {
      id: 3,
      type: 'feedback',
      title: 'New Feedback Received',
      message: 'A student has submitted feedback about the counseling services.',
      time: 'Yesterday',
      unread: false
    }
  ];

  const getNotificationIcon = (type) => {
    switch(type) {
      case 'appointment':
        return <CalendarOutlined />;
      case 'consultation':
        return <MessageOutlined />;
      case 'feedback':
        return <NotificationOutlined />;
      default:
        return <BellOutlined />;
    }
  };

  const getNotificationTag = (type) => {
    switch(type) {
      case 'appointment':
        return <Tag color="blue">Appointment</Tag>;
      case 'consultation':
        return <Tag color="purple">Consultation</Tag>;
      case 'feedback':
        return <Tag color="green">Feedback</Tag>;
      default:
        return <Tag color="default">General</Tag>;
    }
  };

  return (
    <PageContainer>
      <PageTitle level={2}>Notifications</PageTitle>
      
      <Tabs defaultActiveKey="all">
        <TabPane tab={`All (${notifications.length})`} key="all">
          {notifications.length > 0 ? (
            <>
              <ActionButtons>
                <Button type="primary" icon={<CheckOutlined />}>
                  Mark All as Read
                </Button>
              </ActionButtons>
              
              <List
                itemLayout="horizontal"
                dataSource={notifications}
                renderItem={item => (
                  <NotificationItem unread={item.unread}>
                    <NotificationIcon>
                      {getNotificationIcon(item.type)}
                    </NotificationIcon>
                    <NotificationContent>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Space>
                          <Text strong>{item.title}</Text>
                          {getNotificationTag(item.type)}
                        </Space>
                        {item.unread && <Badge color="blue" />}
                      </div>
                      <Text>{item.message}</Text>
                      <div>
                        <NotificationTime>{item.time}</NotificationTime>
                      </div>
                    </NotificationContent>
                  </NotificationItem>
                )}
              />
            </>
          ) : (
            <Empty 
              description="No notifications" 
              image={Empty.PRESENTED_IMAGE_SIMPLE} 
            />
          )}
        </TabPane>
        
        <TabPane tab="Unread" key="unread">
          <List
            itemLayout="horizontal"
            dataSource={notifications.filter(n => n.unread)}
            renderItem={item => (
              <NotificationItem unread={true}>
                <NotificationIcon>
                  {getNotificationIcon(item.type)}
                </NotificationIcon>
                <NotificationContent>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Space>
                      <Text strong>{item.title}</Text>
                      {getNotificationTag(item.type)}
                    </Space>
                    <Badge color="blue" />
                  </div>
                  <Text>{item.message}</Text>
                  <div>
                    <NotificationTime>{item.time}</NotificationTime>
                  </div>
                </NotificationContent>
              </NotificationItem>
            )}
          />
        </TabPane>
      </Tabs>
    </PageContainer>
  );
};

export default GuidanceNotifications;
