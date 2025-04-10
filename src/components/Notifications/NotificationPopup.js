import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { Badge, Dropdown, List, Typography, Tabs, Button, Empty, message, Spin, Alert, Tag } from 'antd';
import { BellOutlined, CheckOutlined, InboxOutlined } from '@ant-design/icons';
import { 
  getUserNotifications, 
  markAllNotificationsAsRead, 
  markNotificationAsRead,
  subscribeToUserNotifications,
  acknowledgeNotification
} from '../../firebase/notifications';
import { acknowledgeAppointmentCancellation } from '../../firebase/appointments';
import moment from 'moment';

const { Text } = Typography;
const { TabPane } = Tabs;

const NotificationBell = styled.div`
  font-size: 20px;
  cursor: pointer;
  padding: 0 12px;
  transition: all 0.3s;
  
  &:hover {
    transform: scale(1.05);
  }
`;

const NotificationContainer = styled.div`
  width: 350px;
  max-height: 400px;
  background: white;
  border-radius: 8px;
  overflow: hidden;
  
  @media (max-width: ${props => props.theme.breakpoints.sm}) {
    width: 300px;
  }
  
  @media (max-width: ${props => props.theme.breakpoints.xs}) {
    width: 280px;
  }
`;

const NotificationHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  border-bottom: 1px solid #f0f0f0;
`;

const NotificationTitle = styled(Text)`
  font-weight: 600;
  font-size: 16px;
`;

const NotificationItem = styled(List.Item)`
  padding: 12px 16px !important;
  cursor: pointer;
  transition: background-color 0.2s ease;
  
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
  
  .ant-tabs-tab {
    padding: 12px 0;
    font-size: 14px;
  }
  
  .ant-tabs-tab-active {
    font-weight: 500;
  }
  
  .ant-tabs-ink-bar {
    height: 3px;
    border-radius: 3px 3px 0 0;
  }
`;

const EmptyContainer = styled.div`
  padding: 32px 0;
  
  .ant-empty-image {
    height: 80px;
  }
  
  .ant-empty-description {
    color: ${props => props.theme.colors.textSecondary};
    font-size: 14px;
  }
`;

const LoadingContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 32px 0;
`;

const MarkAllReadButton = styled(Button)`
  font-size: 12px;
  height: 28px;
  padding: 0 12px;
  border-radius: 4px;
`;

const CustomEmpty = styled(Empty)`
  .ant-empty-image {
    color: ${props => props.theme.colors.textSecondary};
  }
`;

const StyledDropdown = styled(Dropdown)`
  .ant-dropdown-menu {
    padding: 0;
    border-radius: 8px;
  }
  
  .ant-dropdown-menu-item .ant-dropdown-menu-item-only-child{
    padding: 0;
    margin: 0;
  }
`;

const NotificationPopup = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    setLoading(true);
    console.log("Setting up notification subscription");
    
    const unsubscribe = subscribeToUserNotifications((newNotifications) => {
      console.log("Received notifications update:", newNotifications);
      if (newNotifications) {
        setNotifications(newNotifications);
      }
      setLoading(false);
    });
    
    return () => {
      if (unsubscribe) {
        console.log("Unsubscribing from notifications");
        unsubscribe();
      }
    };
  }, []);

  const handleNotificationClick = async (notification) => {
    try {
      await markNotificationAsRead(notification.id);
      setNotifications(notifications.map(n => 
        n.id === notification.id ? { ...n, unread: false } : n
      ));
      
      if (notification.type === 'appointment_status' && 
          notification.requiresAcknowledgment && 
          !notification.acknowledged) {
        message.info({
          content: (
            <div>
              <p>{notification.title}: {notification.message}</p>
              <Button 
                type="primary" 
                size="small" 
                onClick={(e) => {
                  e.stopPropagation();
                  handleAcknowledgeNotification(notification);
                }}
              >
                Acknowledge
              </Button>
            </div>
          ),
          duration: 0,
          key: `notification-${notification.id}`
        });
      } else {
        message.info(`${notification.title}: ${notification.message}`);
      }
    } catch (error) {
      console.error("Error marking notification as read:", error);
      message.error("Failed to mark notification as read");
    }
  };

  const handleAcknowledgeNotification = async (notification) => {
    try {
      await acknowledgeNotification(notification.id);
      
      if (notification.appointmentId) {
        await acknowledgeAppointmentCancellation(notification.appointmentId);
      }
      
      setNotifications(notifications.map(n => 
        n.id === notification.id ? { ...n, acknowledged: true } : n
      ));
      
      message.success('Notification acknowledged');
      message.destroy(`notification-${notification.id}`);
    } catch (error) {
      console.error("Error acknowledging notification:", error);
      message.error("Failed to acknowledge notification");
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await markAllNotificationsAsRead();
      
      setNotifications(notifications.map(n => ({
        ...n,
        unread: false
      })));
      
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
      case 'appointment_scheduled':
        return <span style={{ color: '#1890ff', marginRight: '8px' }}>📋</span>;
      case 'appointment_cancelled':
        return <span style={{ color: '#f5222d', marginRight: '8px' }}>❌</span>;
      case 'new_student':
        return <span style={{ color: '#52c41a', marginRight: '8px' }}>👤</span>;
      default:
        return <span style={{ color: '#faad14', marginRight: '8px' }}>📣</span>;
    }
  };

  const renderNotificationItem = (item) => (
    <NotificationItem 
      unread={item.unread} 
      onClick={() => handleNotificationClick(item)}
    >
      <NotificationContent>
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          {getNotificationIcon(item.type)}
          <Text style={{ flexGrow: '1' }} strong>{item.title}</Text>
          {item.unread && <Badge color="blue" />}
        </div>
        <Text>{item.message}</Text>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <NotificationTime>
            {moment(item.time).fromNow()}
          </NotificationTime>
          {item.requiresAcknowledgment && !item.acknowledged && (
            <Button 
              type="primary" 
              size="small"
              onClick={(e) => {
                e.stopPropagation();
                handleAcknowledgeNotification(item);
              }}
            >
              Acknowledge
            </Button>
          )}
          {item.requiresAcknowledgment && item.acknowledged && (
            <Tag color="green">Acknowledged</Tag>
          )}
        </div>
      </NotificationContent>
    </NotificationItem>
  );

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
                <MarkAllReadButton type="primary" ghost icon={<CheckOutlined />} onClick={handleMarkAllAsRead}>
                  Mark all as read
                </MarkAllReadButton>
              )}
            </div>
          </NotificationHeader>
          
          {error && (
            <Alert 
              message={error} 
              type="error" 
              showIcon 
              style={{ margin: '8px 16px' }}
              action={
                <Button size="small" onClick={() => {
                  setError(null);
                  setLoading(true);
                }}>
                  Retry
                </Button>
              }
            />
          )}
          
          <NotificationTabs defaultActiveKey="all">
            <TabPane tab="All" key="all">
              {loading ? (
                <LoadingContainer>
                  <Spin size="default" />
                </LoadingContainer>
              ) : notifications.length > 0 ? (
                <List
                  itemLayout="horizontal"
                  dataSource={notifications}
                  style={{ maxHeight: '320px', overflow: 'auto' }}
                  renderItem={renderNotificationItem}
                />
              ) : (
                <EmptyContainer>
                  <CustomEmpty 
                    image={<InboxOutlined style={{ fontSize: 48 }} />}
                    description="No notifications" 
                  />
                </EmptyContainer>
              )}
            </TabPane>
            
            <TabPane tab="Unread" key="unread">
              {loading ? (
                <LoadingContainer>
                  <Spin size="default" />
                </LoadingContainer>
              ) : notifications.filter(n => n.unread).length > 0 ? (
                <List
                  itemLayout="horizontal"
                  dataSource={notifications.filter(n => n.unread)}
                  style={{ maxHeight: '320px', overflow: 'auto' }}
                  renderItem={renderNotificationItem}
                />
              ) : (
                <EmptyContainer>
                  <CustomEmpty 
                    image={<InboxOutlined style={{ fontSize: 48 }} />}
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
    <StyledDropdown 
      menu={dropdownMenu}
      trigger={['click']} 
      open={visible}
      onOpenChange={setVisible}
      placement="bottomRight"
      arrow
      getPopupContainer={triggerNode => triggerNode.parentNode}
    >
      <NotificationBell>
        <Badge count={unreadCount} size="small">
          <BellOutlined style={{ fontSize: '20px' }} />
        </Badge>
      </NotificationBell>
    </StyledDropdown>
  );
};

export default NotificationPopup;
