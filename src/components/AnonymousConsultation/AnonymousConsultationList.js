import React, { useState, useEffect, useRef } from 'react';
import styled from 'styled-components';
import { Typography, List, Card, Tag, Empty, Alert, Spin, Button, Input } from 'antd';
import { SendOutlined } from '@ant-design/icons';
import { 
  subscribeToAnonymousPost,
  addStudentReplyToPost,
  subscribeToUserAnonymousPosts
} from '../../firebase/anonymousPosts';
import moment from 'moment';
import { getAuth } from 'firebase/auth';
import { useMediaQuery } from 'react-responsive';

const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;

const ListContainer = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  padding: 24px;
  
  @media (max-width: ${props => props.theme.breakpoints.md}) {
    padding: 16px;
  }
  
  @media (max-width: ${props => props.theme.breakpoints.sm}) {
    padding: 12px;
  }
`;

const ConsultationLayout = styled.div`
  display: flex;
  gap: 16px;
  
  @media (max-width: ${props => props.theme.breakpoints.md}) {
    flex-direction: column;
  }
`;

const SidebarContainer = styled.div`
  width: 30%;
  border-right: 1px solid #f0f0f0;
  padding-right: 16px;
  
  @media (max-width: ${props => props.theme.breakpoints.md}) {
    width: 100%;
    border-right: none;
    padding-right: 0;
    border-bottom: 1px solid #f0f0f0;
    padding-bottom: 16px;
    margin-bottom: 16px;
  }
`;

const MainContainer = styled.div`
  width: 70%;
  
  @media (max-width: ${props => props.theme.breakpoints.md}) {
    width: 100%;
  }
`;

const StyledList = styled(List)`
  .ant-list-item {
    padding: 12px !important;
    cursor: pointer;
    border-radius: 4px;
    transition: background-color 0.3s;
    
    &:hover {
      background-color: #f5f5f5;
    }
    
    @media (max-width: ${props => props.theme.breakpoints.sm}) {
      padding: 8px !important;
    }
  }
`;

const ReplyContainer = styled.div`
  margin-top: 16px;
  padding: 12px;
  background-color: ${props => props.theme.colors.light};
  border-radius: 4px;
`;

const CounselorReply = styled(ReplyContainer)`
  background-color: #e6f7ff;
  border-left: 4px solid ${props => props.theme.colors.primary};
`;

const UserMessage = styled(ReplyContainer)`
  background-color: #f6ffed;
  border-left: 4px solid ${props => props.theme.colors.secondary};
`;

const LoadingContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 40px;
`;

const NoResultsContainer = styled.div`
  text-align: center;
  padding: 40px 0;
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

const ReplyForm = styled.div`
  margin-top: 16px;
  border-top: 1px solid #f0f0f0;
  padding-top: 16px;
`;

const AnonymousConsultationList = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [consultations, setConsultations] = useState([]);
  const [activeConsultation, setActiveConsultation] = useState(null);
  const [replyText, setReplyText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const chatContainerRef = useRef(null);
  const unsubscribeRefs = useRef({});
  const activeConsultationIdRef = useRef(null);

  const isMobile = useMediaQuery({ maxWidth: 768 });

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
    setLoading(true);
    setError('');
    
    const unsubscribe = subscribeToUserAnonymousPosts((posts) => {
      const sortedPosts = sortConsultationsByLatestActivity(posts);
      setConsultations(sortedPosts);
      setLoading(false);
      
      if (activeConsultationIdRef.current) {
        const updatedActive = sortedPosts.find(p => p.id === activeConsultationIdRef.current);
        if (updatedActive) {
          setActiveConsultation(updatedActive);
        }
      }
    });
    
    return () => {
      if (unsubscribe) unsubscribe();
      
      Object.values(unsubscribeRefs.current).forEach(unsub => {
        if (typeof unsub === 'function') {
          unsub();
        }
      });
    };
  }, []);

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
    
    const unsubscribe = subscribeToAnonymousPost(consultationId, (updatedConsultation) => {
      if (updatedConsultation) {
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
    });
    
    unsubscribeRefs.current[consultationId] = unsubscribe;
  };

  const handleConsultationClick = (consultation) => {
    setActiveConsultation(consultation);
    activeConsultationIdRef.current = consultation.id;
    
    if (isMobile) {
      setTimeout(() => {
        document.getElementById('chat-view')?.scrollIntoView({ 
          behavior: 'smooth' 
        });
      }, 100);
    }
  };

  const handleReplySubmit = async () => {
    if (!replyText.trim() || !activeConsultation) return;
    
    try {
      setSubmitting(true);
      await addStudentReplyToPost(activeConsultation.id, replyText);
      setReplyText('');
    } catch (error) {
      console.error("Error sending reply:", error);
      setError('Failed to send your reply. Please try again.');
    } finally {
      setSubmitting(false);
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
    <StyledList
      dataSource={consultations}
      renderItem={item => (
        <List.Item 
          key={item.id}
          onClick={() => {
            setActiveConsultation(item);
            if (isMobile) {
              setTimeout(() => {
                document.getElementById('chat-view')?.scrollIntoView({ 
                  behavior: 'smooth' 
                });
              }, 100);
            }
          }}
          style={{ 
            backgroundColor: activeConsultation?.id === item.id 
              ? '#f0f0f0' 
              : 'transparent'
          }}
        >
          <List.Item.Meta
            title={
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span>#{item.id.substring(0, 6)}</span>
                {getStatusTag(item.status)}
              </div>
            }
            description={
              <Text type="secondary">
                {moment(item.createdAt.toDate()).format('MMM D, h:mm A')}
              </Text>
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
          {getStatusTag(activeConsultation.status)}
        </div>
        
        <Paragraph>
          <Text type="secondary">Category: {activeConsultation.concernCategory}</Text>
          <br />
          <Text type="secondary">
            Date: {activeConsultation.createdAt ? moment(activeConsultation.createdAt.toDate()).format('YYYY-MM-DD HH:mm') : 'Unknown'}
          </Text>
        </Paragraph>
        
        <ChatContainer ref={chatContainerRef}>
          <UserMessage>
            <Text strong>Your initial message:</Text>
            <Paragraph style={{ marginTop: 8, whiteSpace: 'pre-wrap' }}>{activeConsultation.details}</Paragraph>
          </UserMessage>
          
          {activeConsultation.replies && activeConsultation.replies.map((reply, index) => (
            reply.isFromCounselor ? (
              <CounselorReply key={index}>
                <Text strong>Guidance Counselor:</Text>
                <Paragraph style={{ marginTop: 8, whiteSpace: 'pre-wrap' }}>{reply.content}</Paragraph>
                <Text type="secondary">
                  {reply.timestamp ? moment(reply.timestamp.toDate()).format('YYYY-MM-DD HH:mm') : ''}
                </Text>
              </CounselorReply>
            ) : (
              <UserMessage key={index}>
                <Text strong>You:</Text>
                <Paragraph style={{ marginTop: 8, whiteSpace: 'pre-wrap' }}>{reply.content}</Paragraph>
                <Text type="secondary">
                  {reply.timestamp ? moment(reply.timestamp.toDate()).format('YYYY-MM-DD HH:mm') : ''}
                </Text>
              </UserMessage>
            )
          ))}
        </ChatContainer>
        
        {activeConsultation.status !== 'resolved' && (
          <ReplyForm>
            <TextArea
              rows={3}
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              placeholder="Type your reply here..."
            />
            <Button
              type="primary"
              icon={<SendOutlined />}
              loading={submitting}
              onClick={handleReplySubmit}
              style={{ marginTop: '8px', float: 'right' }}
              disabled={!replyText.trim()}
            >
              Send Reply
            </Button>
          </ReplyForm>
        )}
      </>
    );
  };

  return (
    <ListContainer>
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
      ) : consultations.length === 0 ? (
        <NoResultsContainer>
          <Empty 
            description="You haven't submitted any consultations yet" 
            image={Empty.PRESENTED_IMAGE_SIMPLE} 
          />
        </NoResultsContainer>
      ) : (
        <ConsultationLayout>
          <SidebarContainer>
            {renderConsultationList()}
          </SidebarContainer>
          
          <MainContainer id="chat-view">
            {renderChatView()}
          </MainContainer>
        </ConsultationLayout>
      )}
    </ListContainer>
  );
};

export default AnonymousConsultationList;
