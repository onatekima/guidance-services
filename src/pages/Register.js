import React, { useState } from 'react';
import styled from 'styled-components';
import { Form, Input, Button, Typography, Card, Divider, message } from 'antd';
import { UserOutlined, LockOutlined, MailOutlined, IdcardOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { registerStudent } from '../firebase/auth';

const { Title, Text } = Typography;

const RegisterContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  background-color: ${props => props.theme.colors.background};
  padding: 24px;
`;

const RegisterCard = styled(Card)`
  width: 100%;
  max-width: 500px;
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

const RegisterPage = () => {
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);

  const onFinish = async (values) => {
    setLoading(true);
    
    try {
      await registerStudent({
        studentId: values.studentId,
        firstName: values.firstName,
        lastName: values.lastName,
        email: values.email,
        password: values.password
      });
      
      message.success('Registration successful! Please log in.');
      navigate('/login');
    } catch (error) {
      message.error(error.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <RegisterContainer>
      <RegisterCard>
        <LogoContainer>
          <Logo>Mental Health App</Logo>
          <Text>Student Support Platform</Text>
        </LogoContainer>
        
        <Title level={4} style={{ textAlign: 'center', marginBottom: 24 }}>
          Create Your Account
        </Title>
        
        <StyledForm
          form={form}
          name="register"
          layout="vertical"
          onFinish={onFinish}
        >
          <Form.Item
            name="studentId"
            label="Student ID"
            rules={[
              { required: true, message: 'Please enter your student ID' },
              { pattern: /^\d{5}MN-\d{6}$/, message: 'Please use format: 11718MN-012140' }
            ]}
          >
            <Input 
              prefix={<IdcardOutlined />} 
              placeholder="Enter your student ID (e.g., 11718MN-012140)" 
              size="large" 
            />
          </Form.Item>
          
          <Form.Item
            name="firstName"
            label="First Name"
            rules={[{ required: true, message: 'Please enter your first name' }]}
          >
            <Input 
              prefix={<UserOutlined />} 
              placeholder="Enter your first name" 
              size="large" 
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
              size="large" 
            />
          </Form.Item>
          
          <Form.Item
            name="email"
            label="Email"
            rules={[
              { required: true, message: 'Please enter your email' },
              { type: 'email', message: 'Please enter a valid email' }
            ]}
          >
            <Input 
              prefix={<MailOutlined />} 
              placeholder="Enter your email" 
              size="large" 
            />
          </Form.Item>
          
          <Form.Item
            name="password"
            label="Password"
            rules={[
              { required: true, message: 'Please enter your password' },
              { min: 8, message: 'Password must be at least 8 characters' }
            ]}
          >
            <Input.Password 
              prefix={<LockOutlined />} 
              placeholder="Create a password" 
              size="large" 
            />
          </Form.Item>
          
          <Form.Item
            name="confirmPassword"
            label="Confirm Password"
            dependencies={['password']}
            rules={[
              { required: true, message: 'Please confirm your password' },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || getFieldValue('password') === value) {
                    return Promise.resolve();
                  }
                  return Promise.reject(new Error('The two passwords do not match'));
                },
              }),
            ]}
          >
            <Input.Password 
              prefix={<LockOutlined />} 
              placeholder="Confirm your password" 
              size="large" 
            />
          </Form.Item>
          
          <Form.Item>
            <SubmitButton type="primary" htmlType="submit" size="large" loading={loading}>
              Create Account
            </SubmitButton>
          </Form.Item>
        </StyledForm>
        
        <Divider>Already have an account?</Divider>
        
        <Button 
          block 
          size="large" 
          onClick={() => navigate('/login')}
        >
          Log In
        </Button>
        
        <FooterText type="secondary">
          By creating an account, you agree to our Terms of Service and Privacy Policy.
        </FooterText>
      </RegisterCard>
    </RegisterContainer>
  );
};

export default RegisterPage;
