import React, { useState } from 'react';
import styled from 'styled-components';
import { Form, Input, Button, Alert } from 'antd';
import { UserOutlined, LockOutlined, MailOutlined, IdcardOutlined } from '@ant-design/icons';
import { registerStudent } from '../../firebase/auth';
import { useNavigate } from 'react-router-dom';
import { Link } from 'react-router-dom';

const RegisterContainer = styled.div`
  max-width: 400px;
  margin: 0 auto;
  padding: 2rem;
  background: ${props => props.theme.colors.white};
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
`;

const RegisterTitle = styled.h1`
  text-align: center;
  margin-bottom: 2rem;
  color: ${props => props.theme.colors.text};
`;

const RegisterButton = styled(Button)`
  width: 100%;
`;

const RegisterForm = () => {
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const onFinish = async (values) => {
    try {
      setError('');
      setLoading(true);
      
      await registerStudent({
        studentId: values.studentId,
        firstName: values.firstName,
        lastName: values.lastName,
        email: values.email,
        password: values.password
      });

      navigate('/login');
    } catch (error) {
      console.error("Registration error:", error);
      setError(error.message || 'Failed to register. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <RegisterContainer>
      <RegisterTitle>Student Registration</RegisterTitle>
      
      {error && <Alert message={error} type="error" showIcon style={{ marginBottom: '1rem' }} />}
      
      <Form
        name="register"
        onFinish={onFinish}
        layout="vertical"
      >
        <Form.Item
          name="studentId"
          rules={[
            { required: true, message: 'Please input your Student ID!' },
            { 
              pattern: /^\d{5}MN-\d{6}$/,
              message: 'Please enter a valid Student ID (e.g., 11718MN-012140)'
            }
          ]}
        >
          <Input 
            prefix={<IdcardOutlined />} 
            placeholder="Student ID (e.g., 11718MN-012140)" 
          />
        </Form.Item>

        <Form.Item
          name="firstName"
          rules={[{ required: true, message: 'Please input your First Name!' }]}
        >
          <Input prefix={<UserOutlined />} placeholder="First Name" />
        </Form.Item>

        <Form.Item
          name="lastName"
          rules={[{ required: true, message: 'Please input your Last Name!' }]}
        >
          <Input prefix={<UserOutlined />} placeholder="Last Name" />
        </Form.Item>

        <Form.Item
          name="email"
          rules={[
            { required: true, message: 'Please input your Email!' },
            { type: 'email', message: 'Please enter a valid email!' }
          ]}
        >
          <Input prefix={<MailOutlined />} placeholder="Email" />
        </Form.Item>
        
        <Form.Item
          name="password"
          rules={[
            { required: true, message: 'Please input your Password!' },
            { min: 6, message: 'Password must be at least 6 characters!' }
          ]}
        >
          <Input.Password prefix={<LockOutlined />} placeholder="Password" />
        </Form.Item>
        
        <Form.Item
          name="confirmPassword"
          dependencies={['password']}
          rules={[
            { required: true, message: 'Please confirm your password!' },
            ({ getFieldValue }) => ({
              validator(_, value) {
                if (!value || getFieldValue('password') === value) {
                  return Promise.resolve();
                }
                return Promise.reject(new Error('The two passwords do not match!'));
              },
            }),
          ]}
        >
          <Input.Password prefix={<LockOutlined />} placeholder="Confirm Password" />
        </Form.Item>
        
        <Form.Item>
          <RegisterButton type="primary" htmlType="submit" loading={loading}>
            Register
          </RegisterButton>
          Already have an account? <Link to="/login">Login now!</Link>
        </Form.Item>
      </Form>
    </RegisterContainer>
  );
};

export default RegisterForm;
