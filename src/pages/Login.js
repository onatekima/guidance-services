import React, { useState } from 'react';
import styled from 'styled-components';
import { Form, Input, Button, Typography, Card, Divider, message, Alert } from 'antd';
import { UserOutlined, LockOutlined } from '@ant-design/icons';
import { Link, useNavigate } from 'react-router-dom';
import { loginUser } from '../firebase/auth';
import { useAuth } from '../context/AuthContext';

const { Title, Text } = Typography;

const LoginContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  background-color: ${props => props.theme.colors.background};
`;

const LoginCard = styled(Card)`
  width: 100%;
  max-width: 400px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
`;

const LogoContainer = styled.div`
  text-align: center;
  margin-bottom: 24px;
`;

const Logo = styled.h1`
  color: ${props => props.theme.colors.primary};
  font-size: 24px;
  font-weight: bold;
`;

const StyledForm = styled(Form)`
  .ant-form-item-label {
    font-weight: 500;
  }
`;

const SubmitButton = styled(Button)`
  width: 100%;
  height: 40px;
`;

const FooterText = styled(Text)`
  display: block;
  text-align: center;
  margin-top: 16px;
`;

const ErrorContainer = styled.div`
  margin-bottom: 16px;
`;

const LoginPage = () => {
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { setCurrentUser } = useAuth();

  const onFinish = async (values) => {
    setLoading(true);
    setError('');
    
    try {
      const result = await loginUser(values.studentId, values.password);
      
      const userObject = {
        uid: result.user.uid,
        studentId: result.profile.studentId,
        firstName: result.profile.firstName,
        lastName: result.profile.lastName,
        email: result.profile.email,
        role: result.profile.role,
        name: `${result.profile.firstName} ${result.profile.lastName}`
      };
      
      localStorage.setItem('currentUser', JSON.stringify(userObject));
      
      if (setCurrentUser) {
        setCurrentUser(userObject);
      }
      
      message.success('Login successful!');
      
      if (result.profile.role === 'guidance') {
        navigate('/guidance');
      } else {
        navigate('/');
      }
    } catch (error) {
      console.error("Login error:", error);
      setError(error.message || 'Invalid student ID or password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const createGuidanceCounselor = async () => {
    try {
      const { createGuidanceCounselor } = await import('../firebase/auth');
      
      const counselorData = {
        email: 'guidance-counselor3@example.com',
        password: 'Guidance1234',
        firstName: 'Guidance',
        lastName: 'Counselor'
      };
      
      await createGuidanceCounselor(counselorData);
      message.success('Guidance counselor account created successfully!');
    } catch (error) {
      console.error('Error creating guidance counselor:', error);
      message.error('Failed to create guidance counselor: ' + error.message);
    }
  };

  return (
    <LoginContainer>
      <LoginCard>
        <LogoContainer>
          <Logo>GUIDANCE SERVICES</Logo>
          <Text>Student Support Platform</Text>
        </LogoContainer>
        
        <Title level={4} style={{ textAlign: 'center', marginBottom: 24 }}>
          Log In to Your Account
        </Title>
        
        {error && (
          <ErrorContainer>
            <Alert message={error} type="error" showIcon />
          </ErrorContainer>
        )}
        
        <StyledForm
          form={form}
          name="login"
          layout="vertical"
          onFinish={onFinish}
        >
          <Form.Item
            name="studentId"
            label="Username"
            rules={[{ required: true, message: 'Please enter your username' }]}
          >
            <Input 
              prefix={<UserOutlined />} 
              placeholder="Enter your username" 
              size="large" 
            />
          </Form.Item>
          
          <Form.Item
            name="password"
            label="Password"
            rules={[{ required: true, message: 'Please enter your password' }]}
          >
            <Input.Password 
              prefix={<LockOutlined />} 
              placeholder="Enter your password" 
              size="large" 
            />
          </Form.Item>
          
          <div style={{ textAlign: 'right', marginBottom: '16px' }}>
            <Link to="/forgot-password">Forgot password?</Link>
          </div>
          
          <Form.Item>
            <SubmitButton type="primary" htmlType="submit" size="large" loading={loading}>
              Log In
            </SubmitButton>
          </Form.Item>
          
          {/* <div style={{ textAlign: 'center' }}>
            <Link to="/forgot-password">Forgot password?</Link>
          </div> */}
        </StyledForm>
        
        <Divider>New to the platform?</Divider>
        
        <Button 
          block 
          size="large" 
          onClick={() => navigate('/register')}
        >
          Create an Account
        </Button>
        
        {/* <Button 
          block 
          size="large"
          onClick={createGuidanceCounselor}
          style={{ marginTop: '16px' }}
        >
          Create Guidance Account (Remove in Production)
        </Button> */}
        
        {/* <FooterText type="secondary">
          By logging in, you agree to our Terms of Service and Privacy Policy.
        </FooterText> */}
        
        {/* <FooterText type="secondary" style={{ marginTop: '8px' }}>
          <strong>Demo Accounts:</strong><br />
          Student: 11718MN-012140<br />
          Guidance: guidance
        </FooterText> */}
      </LoginCard>
    </LoginContainer>
  );
};

export default LoginPage;
