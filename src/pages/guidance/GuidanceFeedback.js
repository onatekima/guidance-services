import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { Typography, Tabs, List, Card, Tag, Input, Button, Space, Empty, Spin, Alert, message, Rate } from 'antd';
import { SendOutlined, ReloadOutlined, CheckCircleOutlined } from '@ant-design/icons';
import { 
  getAllFeedbackInquiries, 
  getFeedbackInquiriesByType, 
  getUnreadFeedbackInquiries,
  addResponseToItem,
  markItemAsRead
} from '../../firebase/feedbackInquiries';
import moment from 'moment';
import { db } from '../../firebase/config';
import { doc } from 'firebase/firestore';

const { Title, Text, Paragraph } = Typography;
const { TabPane } = Tabs;
const { TextArea } = Input;

const PageContainer = styled.div`
  width: 100%;
`;

const PageTitle = styled(Title)`
  margin-bottom: 24px !important;
`;

const FeedbackCard = styled(Card)`
  margin-bottom: 16px;
`;

const ResponseSection = styled.div`
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid #f0f0f0;
`;

const LoadingContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 40px;
`;

const MessageContainer = styled.div`
  padding: 12px;
  background-color: #e6f7ff;
  border-left: 4px solid #1677ff;
  border-radius: 4px;
  margin-bottom: 16px;
`;

const ReplyContainer = styled.div`
  padding: 12px;
  background-color: #e6f7ff;
  border-left: 4px solid #1677ff;
  border-radius: 4px;
  margin-bottom: 8px;
`;

const RefreshButton = styled(Button)`
  margin-bottom: 16px;
`;

const GuidanceFeedback = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('all');
  const [replyText, setReplyText] = useState({});
  const [submitting, setSubmitting] = useState({});

  useEffect(() => {
    fetchItems(activeTab);
  }, [activeTab]);

  const fetchItems = async (tab) => {
    try {
      setLoading(true);
      setError(null);
      
      let fetchedItems = [];
      
      switch(tab) {
        case 'feedback':
          fetchedItems = await getFeedbackInquiriesByType('feedback');
          break;
        case 'inquiries':
          fetchedItems = await getFeedbackInquiriesByType('inquiry');
          break;
        case 'unread':
          fetchedItems = await getUnreadFeedbackInquiries();
          break;
        default:
          fetchedItems = await getAllFeedbackInquiries();
      }
      
      setItems(fetchedItems);
    } catch (error) {
      console.error("Error fetching items:", error);
      setError("Failed to load data. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  const handleReplyChange = (id, value) => {
    setReplyText(prev => ({ ...prev, [id]: value }));
  };

  const handleSendReply = async (id) => {
    if (!replyText[id] || replyText[id].trim() === '') {
      message.error('Please enter a reply');
      return;
    }

    try {
      setSubmitting(prev => ({ ...prev, [id]: true }));
      
      await addResponseToItem(id, replyText[id]);
      
      setItems(items.map(item => {
        if (item.id === id) {
          const newResponses = [...(item.responses || []), {
            content: replyText[id],
            timestamp: { toDate: () => new Date() },
            isFromCounselor: true
          }];
          
          return {
            ...item,
            responses: newResponses,
            status: 'read'
          };
        }
        return item;
      }));
      
      setReplyText(prev => ({ ...prev, [id]: '' }));
      message.success('Response sent successfully');
    } catch (error) {
      console.error("Error sending response:", error);
      message.error('Failed to send response');
    } finally {
      setSubmitting(prev => ({ ...prev, [id]: false }));
    }
  };

  const handleMarkAsRead = async (id) => {
    try {
      await markItemAsRead(id);
      
      setItems(items.map(item => {
        if (item.id === id) {
          return {
            ...item,
            status: 'read'
          };
        }
        return item;
      }));
      
      message.success('Marked as read');
    } catch (error) {
      console.error("Error marking as read:", error);
      message.error('Failed to mark as read');
    }
  };

  const renderFeedbackItem = (item) => (
    <FeedbackCard>
      <Card.Meta
        title={
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>{item.type === 'feedback' ? item.serviceType : item.subject}</span>
            <Tag color={item.status === 'unread' ? 'blue' : 'green'}>
              {item.status === 'unread' ? 'New' : 'Read'}
            </Tag>
          </div>
        }
        description={
          <>
            <div style={{ marginBottom: '8px' }}>
              <Text type="secondary">
                Date: {item.createdAt ? moment(item.createdAt.toDate()).format('YYYY-MM-DD HH:mm') : 'Unknown'}
              </Text>
            </div>
            
            {item.type === 'feedback' ? (
              <>
                <div style={{ margin: '16px 0' }}>
                  <Text>Satisfaction: </Text>
                  <Rate disabled value={item.satisfaction} />
                </div>
                <MessageContainer>
                  <strong>Feedback:</strong><br />
                  {item.feedback}
                </MessageContainer>
                {item.improvements && (
                  <MessageContainer>
                    <strong>Suggested Improvements:</strong><br />
                    {item.improvements}
                  </MessageContainer>
                )}
              </>
            ) : (
              <MessageContainer style={{ margin: '16px 0' }}>
                <strong>Question:</strong><br />
                {item.question}
              </MessageContainer>
            )}
            
            {item.responses && item.responses.length > 0 && (
              <div style={{ marginBottom: 16 }}>
                <Text strong>Previous Responses:</Text>
                {item.responses.map((response, index) => (
                  <ReplyContainer key={index}>
                    <Paragraph style={{ whiteSpace: 'pre-wrap' }}>{response.content}</Paragraph>
                    <Text type="secondary">
                      {response.timestamp ? moment(response.timestamp.toDate()).format('YYYY-MM-DD HH:mm') : ''}
                    </Text>
                  </ReplyContainer>
                ))}
              </div>
            )}
            
            <ResponseSection>
              <TextArea 
                rows={4} 
                placeholder="Type your response here..." 
                value={replyText[item.id] || ''}
                onChange={(e) => handleReplyChange(item.id, e.target.value)}
              />
              <Space style={{ marginTop: '16px' }}>
                <Button 
                  type="primary" 
                  icon={<SendOutlined />}
                  loading={submitting[item.id]}
                  onClick={() => handleSendReply(item.id)}
                >
                  Send Response
                </Button>
                {item.status === 'unread' && (
                  <Button 
                    icon={<CheckCircleOutlined />}
                    onClick={() => handleMarkAsRead(item.id)}
                  >
                    Mark as Read
                  </Button>
                )}
              </Space>
            </ResponseSection>
          </>
        }
      />
    </FeedbackCard>
  );

  return (
    <PageContainer>
      <PageTitle level={2}>Feedback & Inquiries</PageTitle>
      
      <RefreshButton 
        type="primary" 
        icon={<ReloadOutlined />} 
        onClick={() => fetchItems(activeTab)}
        style={{ backgroundColor: '#1677ff', borderColor: '#1677ff' }}
      >
        Refresh
      </RefreshButton>
      
      <Tabs 
        defaultActiveKey="all" 
        onChange={setActiveTab}
      >
        <TabPane tab="All" key="all">
          {error && <Alert message={error} type="error" showIcon style={{ marginBottom: '1rem' }} />}
          
          {loading ? (
            <LoadingContainer>
              <Spin size="large" />
            </LoadingContainer>
          ) : items.length === 0 ? (
            <Empty description="No feedback or inquiries found" />
          ) : (
            <List
              dataSource={items}
              renderItem={renderFeedbackItem}
            />
          )}
        </TabPane>
        
        <TabPane tab="Feedback" key="feedback">
          {error && <Alert message={error} type="error" showIcon style={{ marginBottom: '1rem' }} />}
          
          {loading ? (
            <LoadingContainer>
              <Spin size="large" />
            </LoadingContainer>
          ) : items.length === 0 ? (
            <Empty description="No feedback found" />
          ) : (
            <List
              dataSource={items}
              renderItem={renderFeedbackItem}
            />
          )}
        </TabPane>
        
        <TabPane tab="Inquiries" key="inquiries">
          {error && <Alert message={error} type="error" showIcon style={{ marginBottom: '1rem' }} />}
          
          {loading ? (
            <LoadingContainer>
              <Spin size="large" />
            </LoadingContainer>
          ) : items.length === 0 ? (
            <Empty description="No inquiries found" />
          ) : (
            <List
              dataSource={items}
              renderItem={renderFeedbackItem}
            />
          )}
        </TabPane>
        
        <TabPane tab="Unread" key="unread">
          {error && <Alert message={error} type="error" showIcon style={{ marginBottom: '1rem' }} />}
          
          {loading ? (
            <LoadingContainer>
              <Spin size="large" />
            </LoadingContainer>
          ) : items.length === 0 ? (
            <Empty description="No unread items found" />
          ) : (
            <List
              dataSource={items}
              renderItem={renderFeedbackItem}
            />
          )}
        </TabPane>
      </Tabs>
    </PageContainer>
  );
};

export default GuidanceFeedback;
