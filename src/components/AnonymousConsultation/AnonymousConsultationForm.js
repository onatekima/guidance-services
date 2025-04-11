import React, { useState } from 'react';
import styled from 'styled-components';
import { Form, Select, Button, Alert, message, Input } from 'antd';
import { SecurityScanOutlined, SendOutlined } from '@ant-design/icons';
import { createAnonymousPost } from '../../firebase/anonymousPosts';
import { getAuth } from 'firebase/auth';

const { Option } = Select;
const { TextArea } = Input;

const FormContainer = styled.div`
  max-width: 800px;
  margin: 0 auto;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  padding: 24px;
  
  @media (max-width: ${props => props.theme.breakpoints.md}) {
    padding: 16px;
  }
`;

const FormSubtitle = styled.p`
  margin-bottom: 2rem;
  color: ${props => props.theme.colors.textSecondary};
`;

const SubmitButton = styled(Button)`
  width: 100%;
`;

const AnonymityNotice = styled.div`
  background-color: ${props => props.theme.colors.light};
  border-left: 4px solid ${props => props.theme.colors.accent};
  padding: 1rem;
  margin-bottom: 1.5rem;
  border-radius: 4px;
`;

const SuccessMessage = styled(Alert)`
  margin-top: 1.5rem;
`;

const AnonymousConsultationForm = () => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const onFinish = async (values) => {
    try {
      setLoading(true);
      setError('');
      setSuccess(false);

      // Get current user ID
      const auth = getAuth();
      const currentUser = auth.currentUser;

      console.log(currentUser)
      
      if (!currentUser) {
        setError('You must be logged in to submit a consultation');
        return;
      }

      // Prepare consultation data
      const consultationData = {
        concernCategory: values.concernCategory,
        details: values.details,
        userId: currentUser.uid,
        nickname: values.nickname || 'Anonymous',
        gender: currentUser.gender || null // Include gender from user data
      };
      
      // Submit to Firebase
      const result = await createAnonymousPost(consultationData);
      
      setSuccess(true);
      message.success('Your anonymous consultation has been submitted successfully!');
      form.resetFields();
    } catch (error) {
      console.error("Error submitting anonymous consultation:", error);
      setError('Failed to submit your consultation. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <FormContainer>
      <FormSubtitle>Share your concerns anonymously and receive guidance</FormSubtitle>

      <AnonymityNotice>
        <p><SecurityScanOutlined /> <strong>Your privacy is protected</strong></p>
      </AnonymityNotice>

      {error && (
        <Alert 
          message={error} 
          type="error" 
          showIcon 
          style={{ marginBottom: '1rem' }} 
        />
      )}

      <Form
        form={form}
        layout="vertical"
        onFinish={onFinish}
      >
        <Form.Item
          name="nickname"
          label="Your Nickname"
          rules={[{ required: true, message: 'Please enter a nickname' }]}
        >
          <Input 
            placeholder="Enter a nickname for this consultation" 
          />
        </Form.Item>

        <Form.Item
          name="concernCategory"
          label="Type of Concern"
          rules={[{ required: true, message: 'Please select a category' }]}
        >
          <Select placeholder="Select the type of concern">
            <Option value="academic">Academic Issues</Option>
            <Option value="personal">Personal Problems</Option>
            <Option value="mental_health">Mental Health</Option>
            <Option value="bullying">Bullying or Harassment</Option>
            <Option value="other">Other</Option>
          </Select>
        </Form.Item>

        <Form.Item
          name="details"
          label="Details of Your Concern"
          rules={[{ required: true, message: 'Please provide some details about your concern' }]}
        >
          <TextArea 
            rows={6} 
            placeholder="Please describe your concern in detail. Our guidance counselors will review and respond to your post."
          />
        </Form.Item>

        <Form.Item>
          <SubmitButton 
            type="primary" 
            htmlType="submit" 
            loading={loading}
            icon={<SendOutlined />}
          >
            Submit Anonymous Consultation
          </SubmitButton>
        </Form.Item>
      </Form>

      {success && (
        <SuccessMessage
          message="Consultation Submitted Successfully"
          description="Your consultation has been submitted anonymously. You can view responses in the 'View Responses' tab."
          type="success"
          showIcon
        />
      )}
    </FormContainer>
  );
};

export default AnonymousConsultationForm;
