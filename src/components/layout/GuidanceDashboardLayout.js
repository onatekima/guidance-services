import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { Layout, Menu, Button, Avatar, Badge, Drawer, Dropdown } from 'antd';
import {
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  UserOutlined,
  DashboardOutlined,
  CalendarOutlined,
  FileTextOutlined,
  CommentOutlined,
  SecurityScanOutlined,
  MessageOutlined,
  LogoutOutlined,
  SettingOutlined
} from '@ant-design/icons';
import { useNavigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import NotificationPopup from '../Notifications/NotificationPopup';

const { Header, Sider, Content } = Layout;

const StyledLayout = styled(Layout)`
  min-height: 100vh;
`;

const StyledSider = styled(Sider)`
  position: fixed;
  left: 0;
  height: 100vh;
  z-index: 10;
  overflow: auto;
  box-shadow: 2px 0 8px rgba(0,0,0,0.15);
  background-color: #f9f9f9 !important;
  
  .ant-layout-sider-children {
    display: flex;
    flex-direction: column;
    height: 100%;
  }
  
  /* Custom scrollbar for better appearance */
  &::-webkit-scrollbar {
    width: 6px;
  }
  
  &::-webkit-scrollbar-thumb {
    background-color: rgba(0, 0, 0, 0.2);
    border-radius: 3px;
  }
  
  &::-webkit-scrollbar-track {
    background-color: rgba(0, 0, 0, 0.05);
  }
  
  /* Override ant design menu styles */
  .ant-menu {
    background-color: #f9f9f9 !important;
    color: #333;
    border-right: none;
    display: flex;
    flex-direction: column;
    align-items: center;
  }
  
  .ant-menu-item {
    color: #333333; 
    margin: 0;
    height: 50px;
    line-height: 50px;
    display: flex;
    
    &:hover {
      background-color: #e5e5e5;
    }
  }
  
  .ant-menu-item-selected {
    background-color: #d0d0d0 !important;
    color: #001529; 
    font-weight: 500;
  }
  
  .ant-menu-item .anticon {
    color: #333333; 
  }
`;

const MainContentLayout = styled(Layout)`
  margin-left: ${props => props.siderwidth};
  transition: margin-left 0.2s;
`;

const Logo = styled.div`
  height: 64px;
  padding: 16px;
  color: white;
  font-size: 18px;
  font-weight: bold;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #001529;
  margin-bottom: 1px;
`;

const StyledHeader = styled(Header)`
  background: #fff;
  padding: 0 16px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.1);
  position: sticky;
  top: 0;
  z-index: 1;
  width: 100%;
`;

const HeaderLeft = styled.div`
  display: flex;
  height: 100%;
  align-items: center;
`;

const HeaderRight = styled.div`
  display: flex;
  align-items: center;
  gap: 16px;
`;

const ContentWrapper = styled(Content)`
  margin: 24px;
  padding: 24px;
  background: #fff;
  min-height: 280px;
  border-radius: 4px;
  
  @media (max-width: ${props => props.theme.breakpoints.md}) {
    margin: 16px;
    padding: 16px;
  }
  
  @media (max-width: ${props => props.theme.breakpoints.sm}) {
    margin: 8px;
    padding: 12px;
  }
`;

const MobileMenuButton = styled(Button)`
  margin-right: 16px;
  display: none;
  
  @media (max-width: ${props => props.theme.breakpoints.lg}) {
    display: block;
  }
`;

const StyledMenu = styled(Menu)`
  flex: 1;
  overflow-y: auto;
  
  /* Custom scrollbar for menu */
  &::-webkit-scrollbar {
    width: 4px;
  }
  
  &::-webkit-scrollbar-thumb {
    background-color: rgba(0, 0, 0, 0.2);
    border-radius: 2px;
  }
  
  &::-webkit-scrollbar-track {
    background-color: transparent;
  }
  
  .ant-menu-title-content {
    white-space: normal;
    line-height: 1.4;
    padding: 8px 0;
  }
`;

const UserInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
`;

const UserName = styled.span`
  @media (max-width: ${props => props.theme.breakpoints.md}) {
    display: none;
  }
`;

const UserRole = styled.span`
  font-size: 12px;
  color: rgba(0, 0, 0, 0.45);
  display: block;
  line-height: 1;
`;

const GuidanceDashboardLayout = () => {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileView, setMobileView] = useState(false);
  const [mobileDrawerVisible, setMobileDrawerVisible] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { currentUser, logout } = useAuth();
  
  const SIDEBAR_WIDTH = 250;
  const COLLAPSED_WIDTH = 80;
  
  const siderWidth = collapsed ? `${COLLAPSED_WIDTH}px` : `${SIDEBAR_WIDTH}px`;
  
  useEffect(() => {
    const handleResize = () => {
      const isMobile = window.innerWidth < 992;
      setMobileView(isMobile);
      if (isMobile) {
        setCollapsed(true);
      }
      if (window.innerWidth >= 992) {
        setMobileDrawerVisible(false);
      }
    };
    
    window.addEventListener('resize', handleResize);
    handleResize();
    
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const getUserInitials = () => {
    if (!currentUser?.name) return '';
    
    const nameParts = currentUser.name.split(' ');
    if (nameParts.length >= 2) {
      return `${nameParts[0][0]}${nameParts[1][0]}`.toUpperCase();
    }
    return nameParts[0][0].toUpperCase();
  };
  
  const getSelectedKey = () => {
    const path = location.pathname;
    if (path === '/guidance') return '1';
    if (path.includes('appointments')) return '2';
    if (path.includes('anonymous-consultations')) return '3';
    if (path.includes('resources')) return '4';
    if (path.includes('feedback')) return '5';
    if (path.includes('news-feed')) return '6';
    return '1';
  };

  const menuItems = [
    {
      key: '1',
      icon: <MessageOutlined />,
      label: 'News Feed',
      onClick: () => {
        navigate('/guidance');
        if (mobileView) setMobileDrawerVisible(false);
      }
    },
    {
      key: '2',
      icon: <CalendarOutlined />,
      label: 'Manage Appointments',
      onClick: () => {
        navigate('/guidance/appointments');
        if (mobileView) setMobileDrawerVisible(false);
      }
    },
    {
      key: '3',
      icon: <SecurityScanOutlined />,
      label: 'Anonymous Consultations',
      onClick: () => {
        navigate('/guidance/anonymous-consultations');
        if (mobileView) setMobileDrawerVisible(false);
      }
    },
    {
      key: '4',
      icon: <FileTextOutlined />,
      label: 'Manage Resources',
      onClick: () => {
        navigate('/guidance/resources');
        if (mobileView) setMobileDrawerVisible(false);
      }
    },
    {
      key: '5',
      icon: <CommentOutlined />,
      label: 'Review Feedback',
      onClick: () => {
        navigate('/guidance/feedback');
        if (mobileView) setMobileDrawerVisible(false);
      }
    },
  ];

  const renderSidebar = () => (
    <StyledMenu
      mode="inline"
      selectedKeys={[getSelectedKey()]}
      items={menuItems}
    />
  );

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const userMenuItems = [
    {
      key: '1',
      icon: <UserOutlined />,
      label: (
        <div>
          <div style={{ fontWeight: 'bold' }}>{currentUser?.name || 'User'}</div>
          <div style={{ fontSize: '12px', color: 'rgba(0, 0, 0, 0.45)' }}>{currentUser?.email || 'No email'}</div>
        </div>
      ),
      disabled: true
    },
    {
      key: '2',
      icon: <SettingOutlined />,
      label: 'Settings',
      onClick: () => navigate('/guidance/settings')
    },
    {
      key: '3',
      type: 'divider'
    },
    {
      key: '4',
      icon: <LogoutOutlined />,
      label: 'Logout',
      onClick: handleLogout
    }
  ];

  return (
    <StyledLayout>
      {!mobileView ? (
        <StyledSider 
          trigger={null} 
          collapsible 
          collapsed={collapsed}
          width={SIDEBAR_WIDTH}
          collapsedWidth={COLLAPSED_WIDTH}
        >
          <Logo>
            {!collapsed && 'Guidance Dashboard'}
            {collapsed && 'GD'}
          </Logo>
          {renderSidebar()}
        </StyledSider>
      ) : (
        <Drawer
          placement="left"
          closable={false}
          onClose={() => setMobileDrawerVisible(false)}
          open={mobileDrawerVisible}
          bodyStyle={{ padding: 0, background: '#f9f9f9', height: '100%' }}
          width={SIDEBAR_WIDTH}
        >
          <Logo>Guidance Dashboard</Logo>
          {renderSidebar()}
        </Drawer>
      )}
      
      <MainContentLayout siderwidth={!mobileView ? siderWidth : '0px'}>
        <StyledHeader>
          <HeaderLeft>
            {!mobileView ? (
              <Button
                type="text"
                icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
                onClick={() => setCollapsed(!collapsed)}
                style={{ fontSize: '16px', display: 'flex' }}
              />
            ) : (
              <MobileMenuButton
                type="text"
                icon={<MenuUnfoldOutlined />}
                onClick={() => setMobileDrawerVisible(true)}
                style={{ fontSize: '16px', display: 'flex' }}
              />
            )}
          </HeaderLeft>
          <HeaderRight>
            <Dropdown menu={{ items: userMenuItems }} placement="bottomRight">
              <UserInfo>
                <Avatar style={{ backgroundColor: '#1890ff' }}>
                  {currentUser?.photoURL ? null : getUserInitials()}
                </Avatar>
              </UserInfo>
            </Dropdown>
          </HeaderRight>
        </StyledHeader>
        <ContentWrapper>
          <Outlet />
        </ContentWrapper>
      </MainContentLayout>
    </StyledLayout>
  );
};

export default GuidanceDashboardLayout;
