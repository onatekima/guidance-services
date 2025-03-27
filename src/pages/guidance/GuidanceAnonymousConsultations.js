import React, { useState, useEffect, useRef } from 'react';
import styled from 'styled-components';
import { Typography, List, Card, Tag, Input, Button, Space, Empty, Spin, Alert, message } from 'antd';
import { SendOutlined, CheckCircleOutlined } from '@ant-design/icons';
import { 
  collection, 
  query, 
  orderBy, 
  getDocs, 
  doc, 
  getDoc, 
  updateDoc, 
  Timestamp,
  arrayUnion,
  onSnapshot
} from 'firebase/firestore';
import { db } from '../../firebase/config';
import { createAnonymousReplyNotification } from '../../firebase/notifications';
import { addReplyToPost, markPostAsResolved } from '../../firebase/anonymousPosts'
import moment from 'moment';

const { Title, Paragraph, Text } = Typography;
const { TextArea } = Input;

const PageContainer = styled.div`
  width: 100%;
`;

const PageTitle = styled(Title)`
  margin-bottom: 24px !important;
`;

const ConsultationCard = styled(Card)`
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
  background-color: #f6ffed;
  border-left: 4px solid #52c41a;
  border-radius: 4px;
  margin-bottom: 16px;
`;

const ReplyContainer = styled.div`
  padding: 12px;
  background-color: #e6f7ff;
  border-left: 4px solid #1890ff;
  border-radius: 4px;
  margin-bottom: 8px;
`;

const StudentReplyContainer = styled.div`
  padding: 12px;
  background-color: #fff7e6;
  border-left: 4px solid #fa8c16;
  border-radius: 4px;
  margin-bottom: 8px;
`;

const ChatContainer = styled.div`
  display: flex;
  flex-direction: column;
  max-height: 400px;
  overflow-y: auto;
  margin-bottom: 16px;
  padding: 8px;
  border: 1px solid #f0f0f0;
  border-radius: 4px;
`;

const GuidanceAnonymousConsultations = () => {
  const [consultations, setConsultations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [replyText, setReplyText] = useState({});
  const [submitting, setSubmitting] = useState({});
  const [activeConsultation, setActiveConsultation] = useState(null);
  const chatContainerRef = useRef(null);
  const unsubscribeRefs = useRef({});
  const activeConsultationIdRef = useRef(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    
    const q = query(
      collection(db, 'anonymousPosts'),
      orderBy("createdAt", "desc")
    );
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      let updatedConsultations = [];
      snapshot.forEach(doc => {
        updatedConsultations.push({
          id: doc.id,
          ...doc.data()
        });
      });
      
      updatedConsultations = sortConsultationsByLatestActivity(updatedConsultations);
      
      setConsultations(updatedConsultations);
      setLoading(false);
      
      if (activeConsultationIdRef.current) {
        const updated = updatedConsultations.find(c => c.id === activeConsultationIdRef.current);
        if (updated) {
          setActiveConsultation(updated);
        }
      }
    }, (error) => {
      console.error("Error in consultation subscription:", error);
      setError("Failed to load consultations. Please try again later.");
      setLoading(false);
    });
    
    return () => {
      unsubscribe();
      
      Object.values(unsubscribeRefs.current).forEach(unsub => {
        if (typeof unsub === 'function') {
          unsub();
        }
      });
    };
  }, []);

  const sortConsultationsByLatestActivity = (consultationsArray) => {
    return [...consultationsArray].sort((a, b) => {
      const aLatestReply = a.replies && a.replies.length > 0 
        ? a.replies[a.replies.length - 1].timestamp 
        : null;
      
      const bLatestReply = b.replies && b.replies.length > 0 
        ? b.replies[b.replies.length - 1].timestamp 
        : null;
      
      const aLatestActivity = aLatestReply || a.createdAt;
      const bLatestActivity = bLatestReply || b.createdAt;
      
      const aDate = aLatestActivity ? aLatestActivity.toDate() : new Date(0);
      const bDate = bLatestActivity ? bLatestActivity.toDate() : new Date(0);
      
      return bDate - aDate;
    });
  };

  useEffect(() => {
    if (activeConsultation) {
      activeConsultationIdRef.current = activeConsultation.id;
      subscribeToConsultation(activeConsultation.id);
    }
    
    return () => {
    };
  }, [activeConsultation?.id]);

  useEffect(() => {
    if (chatContainerRef.current && activeConsultation?.replies) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [activeConsultation?.replies?.length]);

  const subscribeToConsultation = (consultationId) => {
    if (unsubscribeRefs.current[consultationId]) {
      unsubscribeRefs.current[consultationId]();
    }
    
    const consultationRef = doc(db, 'anonymousPosts', consultationId);
    const unsubscribe = onSnapshot(consultationRef, (doc) => {
      if (doc.exists()) {
        const updatedConsultation = {
          id: doc.id,
          ...doc.data()
        };
        
        setConsultations(prev => {
          const updated = prev.map(c => 
            c.id === consultationId ? updatedConsultation : c
          );
          return sortConsultationsByLatestActivity(updated);
        });
        
        if (activeConsultationIdRef.current === consultationId) {
          setActiveConsultation(updatedConsultation);
        }
      }
    }, (error) => {
      console.error("Error in consultation subscription:", error);
    });
    
    unsubscribeRefs.current[consultationId] = unsubscribe;
  };

  const handleConsultationClick = (consultation) => {
    setActiveConsultation(consultation);
    activeConsultationIdRef.current = consultation.id;
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
      
      await addReplyToPost(id, replyText[id]);
      
      setReplyText(prev => ({ ...prev, [id]: '' }));
      message.success('Reply sent successfully');
    } catch (error) {
      console.error("Error sending reply:", error);
      message.error('Failed to send reply');
    } finally {
      setSubmitting(prev => ({ ...prev, [id]: false }));
    }
  };

  const handleMarkAsResolved = async (id) => {
    try {
      await markPostAsResolved(id);
      message.success('Consultation marked as resolved');
    } catch (error) {
      console.error("Error marking as resolved:", error);
      message.error('Failed to mark as resolved');
    }
  };

  const getStatusTag = (status) => {
    switch(status) {
      case 'pending':
        return <Tag color="gold">Pending</Tag>;
      case 'in-progress':
        return <Tag color="blue">In Progress</Tag>;
      case 'resolved':
        return <Tag color="green">Resolved</Tag>;
      default:
        return <Tag color="default">Unknown</Tag>;
    }
  };

  const renderConsultationList = () => (
    <List
      dataSource={consultations}
      renderItem={item => (
        <List.Item 
          key={item.id}
          onClick={() => handleConsultationClick(item)}
          style={{ 
            cursor: 'pointer',
            backgroundColor: activeConsultation && activeConsultation.id === item.id ? '#f0f0f0' : 'transparent'
          }}
        >
          <List.Item.Meta
            title={
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span>Consultation #{item.id.substring(0, 6)}</span>
                {getStatusTag(item.status || 'pending')}
              </div>
            }
            description={
              <div>
                <Text type="secondary">Category: {item.concernCategory}</Text>
                <br />
                <Text type="secondary">
                  Date: {item.createdAt ? moment(item.createdAt.toDate()).format('YYYY-MM-DD HH:mm') : 'Unknown'}
                </Text>
                <br />
                <Text type="secondary">
                  Replies: {item.replies ? item.replies.length : 0}
                </Text>
              </div>
            }
          />
        </List.Item>
      )}
    />
  );

  const renderChatView = () => {
    if (!activeConsultation) {
      return (
        <Empty 
          description="Select a consultation to view the conversation" 
          image={Empty.PRESENTED_IMAGE_SIMPLE} 
        />
      );
    }

    return (
      <>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <Title level={4}>Consultation #{activeConsultation.id.substring(0, 6)}</Title>
          {getStatusTag(activeConsultation.status || 'pending')}
        </div>
        
        <Paragraph>
          <Text type="secondary">Category: {activeConsultation.concernCategory}</Text>
          <br />
          <Text type="secondary">
            Date: {activeConsultation.createdAt ? moment(activeConsultation.createdAt.toDate()).format('YYYY-MM-DD HH:mm') : 'Unknown'}
          </Text>
        </Paragraph>
        
        <ChatContainer ref={chatContainerRef}>
          <MessageContainer>
            <Text strong>Student's Concern:</Text>
            <Paragraph style={{ marginTop: 8, whiteSpace: 'pre-wrap' }}>{activeConsultation.details}</Paragraph>
          </MessageContainer>
          
          {activeConsultation.replies && activeConsultation.replies.map((reply, index) => (
            reply.isFromCounselor ? (
              <ReplyContainer key={index}>
                <Text strong>Counselor:</Text>
                <Paragraph style={{ marginTop: 8, whiteSpace: 'pre-wrap' }}>{reply.content}</Paragraph>
                <Text type="secondary">
                  {reply.timestamp ? moment(reply.timestamp.toDate()).format('YYYY-MM-DD HH:mm') : ''}
                </Text>
              </ReplyContainer>
            ) : (
              <StudentReplyContainer key={index}>
                <Text strong>Student:</Text>
                <Paragraph style={{ marginTop: 8, whiteSpace: 'pre-wrap' }}>{reply.content}</Paragraph>
                <Text type="secondary">
                  {reply.timestamp ? moment(reply.timestamp.toDate()).format('YYYY-MM-DD HH:mm') : ''}
                </Text>
              </StudentReplyContainer>
            )
          ))}
        </ChatContainer>
        
        {activeConsultation.status !== 'resolved' && (
          <ResponseSection>
            <TextArea 
              rows={4} 
              placeholder="Type your response here..." 
              value={replyText[activeConsultation.id] || ''}
              onChange={(e) => handleReplyChange(activeConsultation.id, e.target.value)}
            />
            <Space style={{ marginTop: '16px', float: 'right' }}>
              <Button 
                type="primary" 
                icon={<SendOutlined />}
                loading={submitting[activeConsultation.id]}
                onClick={() => handleSendReply(activeConsultation.id)}
                disabled={!replyText[activeConsultation.id] || !replyText[activeConsultation.id].trim()}
              >
                Send Response
              </Button>
              <Button 
                type="default" 
                icon={<CheckCircleOutlined />}
                onClick={() => handleMarkAsResolved(activeConsultation.id)}
              >
                Mark as Resolved
              </Button>
            </Space>
          </ResponseSection>
        )}
      </>
    );
  };

  return (
    <PageContainer>
      <PageTitle level={2}>Anonymous Consultations</PageTitle>
      
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
      ) : (
        <div style={{ display: 'flex', gap: '16px' }}>
          <div style={{ width: '30%', borderRight: '1px solid #f0f0f0', paddingRight: '16px' }}>
            {renderConsultationList()}
          </div>
          <div style={{ width: '70%' }}>
            {renderChatView()}
          </div>
        </div>
      )}
    </PageContainer>
  );
};

export default GuidanceAnonymousConsultations;
