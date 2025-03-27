import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { Typography, Form, Input, Button, Select, Rate, Radio, Tabs, List, Card, Tag, Empty, Spin, Alert, message } from 'antd';
import { SendOutlined, QuestionCircleOutlined, ReloadOutlined } from '@ant-design/icons';
import { createFeedback, createInquiry, getCurrentUserFeedbackInquiries } from '../firebase/feedbackInquiries';
import moment from 'moment';

const { Title, Paragraph, Text } = Typography;
const { TextArea } = Input;
const { Option } = Select;
const { TabPane } = Tabs;

const PageContainer = styled.div`
  width: 100%;
`;

const PageTitle = styled(Title)`
  margin-bottom: 24px !important;
`;

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

const SuccessMessage = styled(Alert)`
  margin-top: 1.5rem;
`;

const FeedbackCard = styled(Card)`
  margin-bottom: 16px;
`;

const ResponseContainer = styled.div`
  margin-top: 16px;
  padding: 12px;
  background-color: #e6f7ff;
  border-left: 4px solid #1890ff;
  border-radius: 4px;
`;

const LoadingContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 40px;
`;

const RefreshButton = styled(Button)`
  margin-bottom: 16px;
`;

const FeedbackPage = () => {
  const [feedbackForm] = Form.useForm();
  const [inquiryForm] = Form.useForm();
  const [submittingFeedback, setSubmittingFeedback] = useState(false);
  const [submittingInquiry, setSubmittingInquiry] = useState(false);
  const [feedbackSuccess, setFeedbackSuccess] = useState(false);
  const [inquirySuccess, setInquirySuccess] = useState(false);
  const [userSubmissions, setUserSubmissions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchUserSubmissions();
  }, []);

  const fetchUserSubmissions = async () => {
    try {
      setLoading(true);
      setError('');
      
      const submissions = await getCurrentUserFeedbackInquiries();
      setUserSubmissions(submissions);
    } catch (error) {
      console.error("Error fetching submissions:", error);
      setError('Failed to fetch your submissions. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleFeedbackSubmit = async (values) => {
    try {
      setSubmittingFeedback(true);
      setFeedbackSuccess(false);
      
      // Clean up the values object to handle empty fields
      const cleanValues = { ...values };
      
      // Convert undefined values to empty strings or remove them
      if (cleanValues.improvements === undefined) {
        cleanValues.improvements = ""; // Or you can use: delete cleanValues.improvements;
      }
      
      await createFeedback(cleanValues);
      
      message.success('Thank you for your feedback!');
      feedbackForm.resetFields();
      setFeedbackSuccess(true);
      
      // Refresh the user submissions list
      fetchUserSubmissions();
    } catch (error) {
      console.error("Error submitting feedback:", error);
      message.error('Failed to submit feedback. Please try again.');
    } finally {
      setSubmittingFeedback(false);
    }
  };

  const handleInquirySubmit = async (values) => {
    try {
      setSubmittingInquiry(true);
      setInquirySuccess(false);
      
      await createInquiry(values);
      
      message.success('Your inquiry has been submitted. We will respond shortly.');
      inquiryForm.resetFields();
      setInquirySuccess(true);
      
      // Refresh the user submissions list
      fetchUserSubmissions();
    } catch (error) {
      console.error("Error submitting inquiry:", error);
      message.error('Failed to submit inquiry. Please try again.');
    } finally {
      setSubmittingInquiry(false);
    }
  };

  const renderSubmissionItem = (item) => (
    <FeedbackCard>
      <Card.Meta
        title={
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>
              {item.type === 'feedback' 
                ? `Feedback: ${item.serviceType}` 
                : `Inquiry: ${item.subject}`}
            </span>
            <Tag color={item.status === 'unread' ? 'blue' : 'green'}>
              {item.status === 'unread' ? 'Pending Response' : 'Responded'}
            </Tag>
          </div>
        }
        description={
          <>
            <Text type="secondary">
              Submitted: {item.createdAt ? moment(item.createdAt.toDate()).format('YYYY-MM-DD HH:mm') : 'Unknown'}
            </Text>
            
            {item.type === 'feedback' ? (
              <>
                <div style={{ margin: '16px 0' }}>
                  <Text>Satisfaction: </Text>
                  <Rate disabled value={item.satisfaction} />
                </div>
                <Paragraph>
                  <strong>Your Feedback:</strong><br />
                  {item.feedback}
                </Paragraph>
                {item.improvements && (
                  <Paragraph>
                    <strong>Suggested Improvements:</strong><br />
                    {item.improvements}
                  </Paragraph>
                )}
              </>
            ) : (
              <Paragraph style={{ margin: '16px 0' }}>
                <strong>Your Question:</strong><br />
                {item.question}
              </Paragraph>
            )}
            
            {item.responses && item.responses.length > 0 ? (
              <div>
                <Text strong>Responses:</Text>
                {item.responses.map((response, index) => (
                  <ResponseContainer key={index}>
                    <Paragraph style={{ whiteSpace: 'pre-wrap' }}>{response.content}</Paragraph>
                    <Text type="secondary">
                      {response.timestamp ? moment(response.timestamp.toDate()).format('YYYY-MM-DD HH:mm') : ''}
                    </Text>
                  </ResponseContainer>
                ))}
              </div>
            ) : null}
          </>
        }
      />
    </FeedbackCard>
  );

  return (
    <PageContainer>
      <PageTitle level={2}>Feedback & Inquiries</PageTitle>
      
      <Tabs defaultActiveKey="feedback">
        <TabPane tab="Submit Feedback" key="feedback">
          <FormContainer>
            <FormSubtitle>
              Your feedback helps us improve our services. Please share your thoughts and experiences with the guidance services.
            </FormSubtitle>
            
            {error && (
              <Alert 
                message={error} 
                type="error" 
                showIcon 
                style={{ marginBottom: '1rem' }} 
              />
            )}
            
            <Form
              form={feedbackForm}
              layout="vertical"
              onFinish={handleFeedbackSubmit}
            >
              <Form.Item
                name="serviceType"
                label="Which service are you providing feedback for?"
                rules={[{ required: true, message: 'Please select a service' }]}
              >
                <Select placeholder="Select a service">
                  <Option value="Counseling Services">Counseling Services</Option>
                  <Option value="Appointment System">Appointment System</Option>
                  <Option value="Mental Health Resources">Mental Health Resources</Option>
                  <Option value="Anonymous Consultation">Anonymous Consultation</Option>
                  <Option value="Mobile Application">Mobile Application</Option>
                  <Option value="Other">Other</Option>
                </Select>
              </Form.Item>
              
              <Form.Item
                name="satisfaction"
                label="How satisfied were you with the service?"
                rules={[{ required: true, message: 'Please rate your satisfaction' }]}
              >
                <Rate allowHalf />
              </Form.Item>
              
              <Form.Item
                name="experience"
                label="How would you rate your overall experience?"
              >
                <Radio.Group>
                  <Radio value="excellent">Excellent</Radio>
                  <Radio value="good">Good</Radio>
                  <Radio value="average">Average</Radio>
                  <Radio value="poor">Poor</Radio>
                  <Radio value="very_poor">Very Poor</Radio>
                </Radio.Group>
              </Form.Item>
              
              <Form.Item
                name="feedback"
                label="Your Feedback"
                rules={[{ required: true, message: 'Please provide your feedback' }]}
              >
                <TextArea 
                  rows={6} 
                  placeholder="Please share your thoughts, suggestions, or concerns..."
                />
              </Form.Item>
              
              <Form.Item
                name="improvements"
                label="How can we improve our services?"
                // No validation rules means this field is optional
              >
                <TextArea 
                  rows={4} 
                  placeholder="Optional: Any suggestions for improvement..."
                />
              </Form.Item>
              
              <Form.Item>
                <SubmitButton 
                  type="primary" 
                  htmlType="submit" 
                  loading={submittingFeedback}
                  icon={<SendOutlined />}
                >
                  Submit Feedback
                </SubmitButton>
              </Form.Item>
            </Form>
            
            {feedbackSuccess && (
              <SuccessMessage
                message="Feedback Submitted Successfully"
                description="Thank you for your feedback. Your input helps us improve our services."
                type="success"
                showIcon
              />
            )}
          </FormContainer>
        </TabPane>
        
        <TabPane tab="Ask a Question" key="inquiry">
          <FormContainer>
            <FormSubtitle>
              Have a question about our guidance services? Submit your inquiry and we'll get back to you as soon as possible.
            </FormSubtitle>
            
            {error && (
              <Alert 
                message={error} 
                type="error" 
                showIcon 
                style={{ marginBottom: '1rem' }} 
              />
            )}
            
            <Form
              form={inquiryForm}
              layout="vertical"
              onFinish={handleInquirySubmit}
            >
              <Form.Item
                name="subject"
                label="Subject"
                rules={[{ required: true, message: 'Please enter a subject' }]}
              >
                <Input placeholder="Enter the subject of your inquiry" />
              </Form.Item>
              
              <Form.Item
                name="question"
                label="Your Question"
                rules={[{ required: true, message: 'Please enter your question' }]}
              >
                <TextArea 
                  rows={6} 
                  placeholder="Please provide details about your question or inquiry..."
                />
              </Form.Item>
              
              <Form.Item>
                <SubmitButton 
                  type="primary" 
                  htmlType="submit" 
                  loading={submittingInquiry}
                  icon={<QuestionCircleOutlined />}
                >
                  Submit Question
                </SubmitButton>
              </Form.Item>
            </Form>
            
            {inquirySuccess && (
              <SuccessMessage
                message="Inquiry Submitted Successfully"
                description="Your question has been submitted. We will respond to your inquiry as soon as possible."
                type="success"
                showIcon
              />
            )}
          </FormContainer>
        </TabPane>
        
        <TabPane tab="My Submissions" key="submissions">
          <FormContainer>
            <RefreshButton 
              type="primary" 
              icon={<ReloadOutlined />} 
              onClick={fetchUserSubmissions}
            >
              Refresh
            </RefreshButton>
            
            {error && (
              <Alert 
                message={error} 
                type="error" 
                showIcon 
                style={{ marginBottom: '1rem' }} 
              />
            )}
            
            {loading ? (
              <LoadingContainer>
                <Spin size="large" />
              </LoadingContainer>
            ) : userSubmissions.length === 0 ? (
              <Empty 
                description="You haven't submitted any feedback or inquiries yet" 
                image={Empty.PRESENTED_IMAGE_SIMPLE} 
              />
            ) : (
              <List
                dataSource={userSubmissions}
                renderItem={renderSubmissionItem}
              />
            )}
          </FormContainer>
        </TabPane>
      </Tabs>
    </PageContainer>
  );
};

export default FeedbackPage;
