import React, { useState } from 'react';
import styled from 'styled-components';
import { Form, Input, Button, Typography, Card, message, Alert } from 'antd';
import { MailOutlined, ArrowLeftOutlined } from '@ant-design/icons';
import { Link, useNavigate } from 'react-router-dom';
import { sendPasswordResetEmail } from '../firebase/auth';

const { Title, Text } = Typography;

const ForgotPasswordContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  background-color: ${props => props.theme.colors.background};
`;

const ForgotPasswordCard = styled(Card)`
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

const BackLink = styled(Link)`
  display: flex;
  align-items: center;
  margin-bottom: 24px;
  
  svg {
    margin-right: 8px;
  }
`;

const ErrorContainer = styled.div`
  margin-bottom: 16px;
`;

const SuccessContainer = styled.div`
  margin-bottom: 16px;
`;

const ForgotPasswordPage = () => {
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const onFinish = async (values) => {
    setLoading(true);
    setError('');
    setSuccess(false);
    
    try {
      await sendPasswordResetEmail(values.email);
      setSuccess(true);
      form.resetFields();
    } catch (error) {
      console.error("Password reset error:", error);
      setError(error.message || 'Failed to send password reset email. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ForgotPasswordContainer>
      <ForgotPasswordCard>
        <LogoContainer>
          <Logo>Mental Health App</Logo>
          <Text>Student Support Platform</Text>
        </LogoContainer>
        
        <BackLink to="/login">
          <ArrowLeftOutlined /> Back to Login
        </BackLink>
        
        <Title level={4} style={{ textAlign: 'center', marginBottom: 24 }}>
          Reset Your Password
        </Title>
        
        {error && (
          <ErrorContainer>
            <Alert message={error} type="error" showIcon />
          </ErrorContainer>
        )}
        
        {success && (
          <SuccessContainer>
            <Alert 
              message="Password Reset Email Sent" 
              description="Please check your email for instructions to reset your password." 
              type="success" 
              showIcon 
            />
          </SuccessContainer>
        )}
        
        {!success && (
          <StyledForm
            form={form}
            name="forgotPassword"
            layout="vertical"
            onFinish={onFinish}
          >
            <Form.Item
              name="email"
              label="Email Address"
              rules={[
                { required: true, message: 'Please enter your email address' },
                { type: 'email', message: 'Please enter a valid email address' }
              ]}
            >
              <Input 
                prefix={<MailOutlined />} 
                placeholder="Enter your email address" 
                size="large" 
              />
            </Form.Item>
            
            <Form.Item>
              <SubmitButton type="primary" htmlType="submit" size="large" loading={loading}>
                Send Reset Link
              </SubmitButton>
            </Form.Item>
          </StyledForm>
        )}
        
        {success && (
          <Button 
            block 
            size="large" 
            onClick={() => navigate('/login')}
            style={{ marginTop: '16px' }}
          >
            Return to Login
          </Button>
        )}
      </ForgotPasswordCard>
    </ForgotPasswordContainer>
  );
};

export default ForgotPasswordPage;
