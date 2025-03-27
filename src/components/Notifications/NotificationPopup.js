import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { Badge, Dropdown, List, Typography, Tabs, Button, Empty, message, Spin, Alert } from 'antd';
import { BellOutlined, CheckOutlined, ReloadOutlined } from '@ant-design/icons';
import { 
  getUserNotifications, 
  markAllNotificationsAsRead, 
  markNotificationAsRead,
  subscribeToUserNotifications
} from '../../firebase/notifications';
import moment from 'moment';

const { Text } = Typography;
const { TabPane } = Tabs;

const NotificationBell = styled.div`
  font-size: 20px;
  cursor: pointer;
  padding: 0 12px;
`;

const NotificationContainer = styled.div`
  width: 350px;
  max-height: 400px;
  background: white;
  border-radius: 4px;
  box-shadow: 0 6px 16px -8px rgba(0, 0, 0, 0.08),
              0 9px 28px 0 rgba(0, 0, 0, 0.05),
              0 12px 48px 16px rgba(0, 0, 0, 0.03);
  overflow: hidden;
`;

const NotificationHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  border-bottom: 1px solid #f0f0f0;
`;

const NotificationTitle = styled(Text)`
  font-weight: 500;
  font-size: 16px;
`;

const NotificationItem = styled(List.Item)`
  padding: 12px 16px !important;
  cursor: pointer;
  
  &:hover {
    background-color: ${props => props.theme.colors.light};
  }
  
  ${props => props.unread && `
    background-color: rgba(24, 144, 255, 0.1);
  `}
`;

const NotificationContent = styled.div`
  flex: 1;
`;

const NotificationTime = styled(Text)`
  color: ${props => props.theme.colors.textSecondary};
  font-size: 12px;
`;

const NotificationTabs = styled(Tabs)`
  .ant-tabs-nav {
    margin-bottom: 0;
    padding: 0 16px;
  }
`;

const EmptyContainer = styled.div`
  padding: 24px 0;
`;

const LoadingContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 24px 0;
`;

const MarkAllReadButton = styled(Button)`
  font-size: 12px;
  height: 24px;
  padding: 0 8px;
`;

const RefreshButton = styled(Button)`
  font-size: 12px;
  height: 24px;
  padding: 0 8px;
  margin-left: 8px;
`;

const NotificationPopup = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [visible, setVisible] = useState(false);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      setError(null);
      const userNotifications = await getUserNotifications();
      setNotifications(userNotifications);
    } catch (error) {
      console.error("Error fetching notifications:", error);
      setError("Failed to load notifications");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
    
    const unsubscribe = subscribeToUserNotifications((newNotifications) => {
      if (newNotifications) {
        setNotifications(newNotifications);
      }
    });
    
    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, []);

  const handleNotificationClick = async (notification) => {
    try {
      await markNotificationAsRead(notification.id);
      setNotifications(notifications.map(n => 
        n.id === notification.id ? { ...n, unread: false } : n
      ));
      message.info(`${notification.title}: ${notification.message}`);
    } catch (error) {
      console.error("Error marking notification as read:", error);
      message.error("Failed to mark notification as read");
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await markAllNotificationsAsRead();
      setNotifications(notifications.map(n => ({ ...n, unread: false })));
      message.success('All notifications marked as read');
    } catch (error) {
      console.error("Error marking all notifications as read:", error);
      message.error("Failed to mark all notifications as read");
    }
  };

  const getNotificationIcon = (type) => {
    switch(type) {
      case 'anonymous_reply':
        return <span style={{ color: '#1890ff', marginRight: '8px' }}>💬</span>;
      case 'appointment_reminder':
        return <span style={{ color: '#52c41a', marginRight: '8px' }}>📅</span>;
      case 'appointment_status':
        return <span style={{ color: '#722ed1', marginRight: '8px' }}>🔔</span>;
      default:
        return <span style={{ color: '#faad14', marginRight: '8px' }}>📣</span>;
    }
  };

  const unreadCount = notifications.filter(n => n.unread).length;

  const dropdownMenu = {
    items: [{
      key: 'notification-container',
      label: (
        <NotificationContainer>
          <NotificationHeader>
            <NotificationTitle>Notifications</NotificationTitle>
            <div>
              {unreadCount > 0 && (
                <MarkAllReadButton type="text" icon={<CheckOutlined />} onClick={handleMarkAllAsRead}>
                  Mark all as read
                </MarkAllReadButton>
              )}
              <RefreshButton type="text" icon={<ReloadOutlined />} onClick={fetchNotifications}>
                Refresh
              </RefreshButton>
            </div>
          </NotificationHeader>
          
          {error && (
            <Alert 
              message={error} 
              type="error" 
              showIcon 
              style={{ margin: '8px 16px' }}
              action={
                <Button size="small" onClick={fetchNotifications}>
                  Retry
                </Button>
              }
            />
          )}
          
          <NotificationTabs defaultActiveKey="all">
            <TabPane tab="All" key="all">
              {loading ? (
                <LoadingContainer>
                  <Spin size="small" />
                </LoadingContainer>
              ) : notifications.length > 0 ? (
                <List
                  itemLayout="horizontal"
                  dataSource={notifications}
                  style={{ maxHeight: '320px', overflow: 'auto' }}
                  renderItem={item => (
                    <NotificationItem 
                      unread={item.unread} 
                      onClick={() => handleNotificationClick(item)}
                    >
                      <NotificationContent>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          {getNotificationIcon(item.type)}
                          <Text strong>{item.title}</Text>
                          {item.unread && <Badge color="blue" />}
                        </div>
                        <Text>{item.message}</Text>
                        <div>
                          <NotificationTime>
                            {moment(item.time).fromNow()}
                          </NotificationTime>
                        </div>
                      </NotificationContent>
                    </NotificationItem>
                  )}
                />
              ) : (
                <EmptyContainer>
                  <Empty 
                    image={Empty.PRESENTED_IMAGE_SIMPLE} 
                    description="No notifications" 
                  />
                </EmptyContainer>
              )}
            </TabPane>
            
            <TabPane tab="Unread" key="unread">
              {loading ? (
                <LoadingContainer>
                  <Spin size="small" />
                </LoadingContainer>
              ) : notifications.filter(n => n.unread).length > 0 ? (
                <List
                  itemLayout="horizontal"
                  dataSource={notifications.filter(n => n.unread)}
                  style={{ maxHeight: '320px', overflow: 'auto' }}
                  renderItem={item => (
                    <NotificationItem 
                      unread={true} 
                      onClick={() => handleNotificationClick(item)}
                    >
                      <NotificationContent>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          {getNotificationIcon(item.type)}
                          <Text strong>{item.title}</Text>
                          <Badge color="blue" />
                        </div>
                        <Text>{item.message}</Text>
                        <div>
                          <NotificationTime>
                            {moment(item.time).fromNow()}
                          </NotificationTime>
                        </div>
                      </NotificationContent>
                    </NotificationItem>
                  )}
                />
              ) : (
                <EmptyContainer>
                  <Empty 
                    image={Empty.PRESENTED_IMAGE_SIMPLE} 
                    description="No unread notifications" 
                  />
                </EmptyContainer>
              )}
            </TabPane>
          </NotificationTabs>
        </NotificationContainer>
      )
    }]
  };

  return (
    <Dropdown 
      menu={dropdownMenu}
      trigger={['click']} 
      open={visible}
      onOpenChange={setVisible}
      placement="bottomRight"
      arrow
    >
      <NotificationBell>
        <Badge count={unreadCount} size="small">
          <BellOutlined style={{ fontSize: '20px' }} />
        </Badge>
      </NotificationBell>
    </Dropdown>
  );
};

export default NotificationPopup;
