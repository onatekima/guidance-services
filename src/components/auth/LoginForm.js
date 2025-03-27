import React, { useState } from 'react';
import styled from 'styled-components';
import { Form, Input, Button, Checkbox, Alert } from 'antd';
import { UserOutlined, LockOutlined } from '@ant-design/icons';
import { loginUser } from '../../firebase/auth';
import { useNavigate } from 'react-router-dom';
import { Link } from 'react-router-dom';

const LoginContainer = styled.div`
  max-width: 400px;
  margin: 0 auto;
  padding: 2rem;
  background: ${props => props.theme.colors.white};
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
`;

const LoginTitle = styled.h1`
  text-align: center;
  margin-bottom: 2rem;
  color: ${props => props.theme.colors.text};
`;

const LoginButton = styled(Button)`
  width: 100%;
`;

const LoginForm = () => {
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const onFinish = async (values) => {
    try {
      setError('');
      setLoading(true);
      
      const { user, profile } = await loginUser(values.email, values.password);
      
      // Redirect based on user role
      if (profile.role === 'guidance') {
        navigate('/guidance-dashboard');
      } else {
        navigate('/dashboard');
      }
    } catch (error) {
      console.error("Login error:", error);
      setError(error.message || 'Failed to sign in. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <LoginContainer>
      <LoginTitle>Login</LoginTitle>
      
      {error && <Alert message={error} type="error" showIcon style={{ marginBottom: '1rem' }} />}
      
      <Form
        name="login"
        initialValues={{ remember: true }}
        onFinish={onFinish}
        layout="vertical"
      >
        <Form.Item
          name="email"
          rules={[{ required: true, message: 'Please input your Email!' }]}
        >
          <Input prefix={<UserOutlined />} placeholder="Email" />
        </Form.Item>
        
        <Form.Item
          name="password"
          rules={[{ required: true, message: 'Please input your Password!' }]}
        >
          <Input.Password prefix={<LockOutlined />} placeholder="Password" />
        </Form.Item>
        
        <Form.Item>
          <Form.Item name="remember" valuePropName="checked" noStyle>
            <Checkbox>Remember me</Checkbox>
          </Form.Item>
          
          <a href="#forgot" style={{ float: 'right' }}>
            Forgot password
          </a>
        </Form.Item>
        
        <Form.Item>
          <LoginButton type="primary" htmlType="submit" loading={loading}>
            Log in
          </LoginButton>
          Or <Link to="/register">register now!</Link>
        </Form.Item>
      </Form>
    </LoginContainer>
  );
};

export default LoginForm;
