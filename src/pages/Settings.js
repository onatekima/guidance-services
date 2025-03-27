import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { Form, Input, Button, Typography, Card, Divider, message, Tabs } from 'antd';
import { UserOutlined, LockOutlined, MailOutlined, SaveOutlined } from '@ant-design/icons';
import { useAuth } from '../context/AuthContext';
import { doc, updateDoc, getDoc } from 'firebase/firestore';
import { updateEmail, updatePassword, reauthenticateWithCredential, EmailAuthProvider } from 'firebase/auth';
import { db, auth } from '../firebase/config';

const { Title, Text } = Typography;
const { TabPane } = Tabs;

const PageContainer = styled.div`
  max-width: 800px;
  margin: 0 auto;
`;

const StyledCard = styled(Card)`
  margin-bottom: 24px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
`;

const StyledForm = styled(Form)`
  .ant-form-item-label {
    font-weight: 500;
  }
`;

const SubmitButton = styled(Button)`
  min-width: 120px;
`;

const Settings = () => {
  const { currentUser, setCurrentUser } = useAuth();
  const [profileForm] = Form.useForm();
  const [emailForm] = Form.useForm();
  const [passwordForm] = Form.useForm();
  const [loadingProfile, setLoadingProfile] = useState(false);
  const [loadingEmail, setLoadingEmail] = useState(false);
  const [loadingPassword, setLoadingPassword] = useState(false);
  const [userData, setUserData] = useState(null);

  useEffect(() => {
    const fetchUserData = async () => {
      if (currentUser?.id) {
        try {
          const userDoc = await getDoc(doc(db, "users", currentUser.id));
          if (userDoc.exists()) {
            const data = userDoc.data();
            setUserData(data);
            profileForm.setFieldsValue({
              firstName: data.firstName,
              lastName: data.lastName
            });
            emailForm.setFieldsValue({
              email: data.email
            });
          }
        } catch (error) {
          console.error("Error fetching user data:", error);
          message.error("Failed to load user data");
        }
      }
    };

    fetchUserData();
  }, [currentUser, profileForm, emailForm]);

  const updateProfileInfo = async (values) => {
    if (!currentUser?.id) return;
    
    setLoadingProfile(true);
    try {
      const userRef = doc(db, "users", currentUser.id);
      await updateDoc(userRef, {
        firstName: values.firstName,
        lastName: values.lastName
      });
      
      // Update context and localStorage
      const updatedUser = {
        ...currentUser,
        name: `${values.firstName} ${values.lastName}`
      };
      setCurrentUser(updatedUser);
      localStorage.setItem('currentUser', JSON.stringify(updatedUser));
      
      message.success("Profile updated successfully");
    } catch (error) {
      console.error("Error updating profile:", error);
      message.error("Failed to update profile");
    } finally {
      setLoadingProfile(false);
    }
  };

  const updateUserEmail = async (values) => {
    if (!currentUser?.id || !auth.currentUser) return;
    
    setLoadingEmail(true);
    try {
      // Re-authenticate user
      const credential = EmailAuthProvider.credential(
        auth.currentUser.email,
        values.currentPassword
      );
      await reauthenticateWithCredential(auth.currentUser, credential);
      
      // Update email in Firebase Auth
      await updateEmail(auth.currentUser, values.email);
      
      // Update email in Firestore
      const userRef = doc(db, "users", currentUser.id);
      await updateDoc(userRef, {
        email: values.email
      });
      
      // Update context and localStorage
      const updatedUser = {
        ...currentUser,
        email: values.email
      };
      setCurrentUser(updatedUser);
      localStorage.setItem('currentUser', JSON.stringify(updatedUser));
      
      message.success("Email updated successfully");
      emailForm.resetFields(['currentPassword']);
    } catch (error) {
      console.error("Error updating email:", error);
      if (error.code === 'auth/wrong-password') {
        message.error("Incorrect password");
      } else if (error.code === 'auth/requires-recent-login') {
        message.error("Please log out and log back in before changing your email");
      } else {
        message.error("Failed to update email");
      }
    } finally {
      setLoadingEmail(false);
    }
  };

  const updateUserPassword = async (values) => {
    if (!auth.currentUser) return;
    
    setLoadingPassword(true);
    try {
      // Re-authenticate user
      const credential = EmailAuthProvider.credential(
        auth.currentUser.email,
        values.currentPassword
      );
      await reauthenticateWithCredential(auth.currentUser, credential);
      
      // Update password in Firebase Auth
      await updatePassword(auth.currentUser, values.newPassword);
      
      message.success("Password updated successfully");
      passwordForm.resetFields();
    } catch (error) {
      console.error("Error updating password:", error);
      if (error.code === 'auth/wrong-password') {
        message.error("Incorrect current password");
      } else if (error.code === 'auth/requires-recent-login') {
        message.error("Please log out and log back in before changing your password");
      } else {
        message.error("Failed to update password");
      }
    } finally {
      setLoadingPassword(false);
    }
  };

  return (
    <PageContainer>
      <Title level={2}>Account Settings</Title>
      <Text type="secondary">Manage your account information and security settings</Text>
      
      <Divider />
      
      <Tabs defaultActiveKey="profile">
        <TabPane tab="Profile Information" key="profile">
          <StyledCard title="Personal Information">
            <StyledForm
              form={profileForm}
              layout="vertical"
              onFinish={updateProfileInfo}
            >
              <Form.Item
                name="firstName"
                label="First Name"
                rules={[{ required: true, message: 'Please enter your first name' }]}
              >
                <Input 
                  prefix={<UserOutlined />} 
                  placeholder="Enter your first name" 
                />
              </Form.Item>
              
              <Form.Item
                name="lastName"
                label="Last Name"
                rules={[{ required: true, message: 'Please enter your last name' }]}
              >
                <Input 
                  prefix={<UserOutlined />} 
                  placeholder="Enter your last name" 
                />
              </Form.Item>
              
              {currentUser?.role === 'student' && (
                <Form.Item
                  label="Student ID"
                >
                  <Input 
                    value={userData?.studentId || currentUser?.studentId}
                    disabled
                  />
                </Form.Item>
              )}
              
              <Form.Item>
                <SubmitButton 
                  type="primary" 
                  htmlType="submit" 
                  loading={loadingProfile}
                  icon={<SaveOutlined />}
                >
                  Save Changes
                </SubmitButton>
              </Form.Item>
            </StyledForm>
          </StyledCard>
        </TabPane>
        
        <TabPane tab="Email" key="email">
          <StyledCard title="Change Email">
            <StyledForm
              form={emailForm}
              layout="vertical"
              onFinish={updateUserEmail}
            >
              <Form.Item
                name="email"
                label="New Email Address"
                rules={[
                  { required: true, message: 'Please enter your email' },
                  { type: 'email', message: 'Please enter a valid email' }
                ]}
              >
                <Input 
                  prefix={<MailOutlined />} 
                  placeholder="Enter your new email" 
                />
              </Form.Item>
              
              <Form.Item
                name="currentPassword"
                label="Current Password"
                rules={[{ required: true, message: 'Please enter your current password' }]}
              >
                <Input.Password 
                  prefix={<LockOutlined />} 
                  placeholder="Enter your current password" 
                />
              </Form.Item>
              
              <Form.Item>
                <SubmitButton 
                  type="primary" 
                  htmlType="submit" 
                  loading={loadingEmail}
                  icon={<SaveOutlined />}
                >
                  Update Email
                </SubmitButton>
              </Form.Item>
            </StyledForm>
          </StyledCard>
        </TabPane>
        
        <TabPane tab="Password" key="password">
          <StyledCard title="Change Password">
            <StyledForm
              form={passwordForm}
              layout="vertical"
              onFinish={updateUserPassword}
            >
              <Form.Item
                name="currentPassword"
                label="Current Password"
                rules={[{ required: true, message: 'Please enter your current password' }]}
              >
                <Input.Password 
                  prefix={<LockOutlined />} 
                  placeholder="Enter your current password" 
                />
              </Form.Item>
              
              <Form.Item
                name="newPassword"
                label="New Password"
                rules={[
                  { required: true, message: 'Please enter your new password' },
                  { min: 8, message: 'Password must be at least 8 characters' }
                ]}
              >
                <Input.Password 
                  prefix={<LockOutlined />} 
                  placeholder="Enter your new password" 
                />
              </Form.Item>
              
              <Form.Item
                name="confirmPassword"
                label="Confirm New Password"
                dependencies={['newPassword']}
                rules={[
                  { required: true, message: 'Please confirm your new password' },
                  ({ getFieldValue }) => ({
                    validator(_, value) {
                      if (!value || getFieldValue('newPassword') === value) {
                        return Promise.resolve();
                      }
                      return Promise.reject(new Error('The two passwords do not match'));
                    },
                  }),
                ]}
              >
                <Input.Password 
                  prefix={<LockOutlined />} 
                  placeholder="Confirm your new password" 
                />
              </Form.Item>
              
              <Form.Item>
                <SubmitButton 
                  type="primary" 
                  htmlType="submit" 
                  loading={loadingPassword}
                  icon={<SaveOutlined />}
                >
                  Update Password
                </SubmitButton>
              </Form.Item>
            </StyledForm>
          </StyledCard>
        </TabPane>
      </Tabs>
    </PageContainer>
  );
};

export default Settings;
