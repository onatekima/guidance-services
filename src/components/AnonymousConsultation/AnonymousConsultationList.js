import React, { useState, useEffect, useRef } from 'react';
import styled from 'styled-components';
import { Typography, List, Card, Tag, Empty, Alert, Spin, Button, Input, Space } from 'antd';
import { SendOutlined, EditOutlined, SaveOutlined, CloseOutlined } from '@ant-design/icons';
import { 
  subscribeToAnonymousPost,
  addStudentReplyToPost,
  subscribeToUserAnonymousPosts,
  editReplyInPost
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

const MessageBubble = styled.div`
  max-width: 80%;
  padding: 10px 16px;
  border-radius: 18px;
  margin-bottom: 8px;
  position: relative;
  word-wrap: break-word;
`;

const UserMessage = styled(MessageBubble)`
  align-self: flex-end;
  background-color: #1677ff;
  color: white;
  border-bottom-right-radius: 4px;
  position: relative;
  
  &:hover {
    .edit-button {
      display: flex !important;
    }
  }
`;

const CounselorMessage = styled(MessageBubble)`
  align-self: flex-start;
  background-color: #f0f0f0;
  color: #000;
  border-bottom-left-radius: 4px;
`;

const MessageTime = styled(Text)`
  display: block;
  font-size: 11px;
  margin-top: 4px;
  opacity: 0.7;
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

const ReplyForm = styled.div`
  margin-top: 16px;
  border-top: 1px solid #f0f0f0;
  padding-top: 16px;
`;

const EditActions = styled(Space)`
  margin-top: 8px;
`;

const AnonymousConsultationList = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [consultations, setConsultations] = useState([]);
  const [activeConsultation, setActiveConsultation] = useState(null);
  const [replyText, setReplyText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [editingReplyIndex, setEditingReplyIndex] = useState(-1);
  const [editReplyContent, setEditReplyContent] = useState('');
  const [editingSubmitting, setEditingSubmitting] = useState(false);
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

  const handleEditReply = (replyIndex, content) => {
    setEditingReplyIndex(replyIndex);
    setEditReplyContent(content);
  };

  const handleCancelEdit = () => {
    setEditingReplyIndex(-1);
    setEditReplyContent('');
  };

  const handleSaveEdit = async () => {
    if (!editReplyContent.trim() || !activeConsultation) return;
    
    try {
      setEditingSubmitting(true);
      await editReplyInPost(activeConsultation.id, editingReplyIndex, editReplyContent);
      setEditingReplyIndex(-1);
      setEditReplyContent('');
    } catch (error) {
      console.error("Error editing reply:", error);
      setError('Failed to edit your reply. Please try again.');
    } finally {
      setEditingSubmitting(false);
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
          onClick={() => handleConsultationClick(item)}
          style={{ 
            backgroundColor: activeConsultation?.id === item.id 
              ? '#f0f0f0' 
              : 'transparent'
          }}
        >
          <List.Item.Meta
            title={
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span>{item.nickname || 'Anonymous'}</span>
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
          <Title level={4}>{activeConsultation.nickname || 'Anonymous'}</Title>
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
            {activeConsultation.details}
            <MessageTime style={{ color: 'white' }}>
              {moment(activeConsultation.createdAt.toDate()).format('h:mm A')}
            </MessageTime>
          </UserMessage>
          
          {activeConsultation.replies && activeConsultation.replies.map((reply, index) => (
            reply.isFromCounselor ? (
              <CounselorMessage key={index}>
                {reply.content}
                <MessageTime>
                  {reply.timestamp ? moment(reply.timestamp.toDate()).format('h:mm A') : ''}
                  {reply.edited && ' (edited)'}
                </MessageTime>
              </CounselorMessage>
            ) : (
              editingReplyIndex === index ? (
                <div key={index} style={{ alignSelf: 'flex-end', maxWidth: '80%' }}>
                  <TextArea
                    value={editReplyContent}
                    onChange={(e) => setEditReplyContent(e.target.value)}
                    rows={3}
                    style={{ marginBottom: 8 }}
                  />
                  <EditActions>
                    <Button
                      type="primary"
                      icon={<SaveOutlined />}
                      size="small"
                      onClick={handleSaveEdit}
                      loading={editingSubmitting}
                    >
                      Save
                    </Button>
                    <Button
                      icon={<CloseOutlined />}
                      size="small"
                      onClick={handleCancelEdit}
                    >
                      Cancel
                    </Button>
                  </EditActions>
                </div>
              ) : (
                <UserMessage key={index}>
                  {reply.content}
                  <MessageTime style={{ color: 'white' }}>
                    {reply.timestamp ? moment(reply.timestamp.toDate()).format('h:mm A') : ''}
                    {reply.edited && ' (edited)'}
                  </MessageTime>
                  <Button
                    type="text"
                    icon={<EditOutlined />}
                    size="small"
                    onClick={() => handleEditReply(index, reply.content)}
                    style={{ 
                      position: 'absolute', 
                      left: '-30px', 
                      top: '50%', 
                      transform: 'translateY(-50%)',
                      color: '#fff',
                      background: 'rgba(0,0,0,0.1)',
                      borderRadius: '50%',
                      padding: '2px'
                    }}
                    className="edit-button"
                  />
                </UserMessage>
              )
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
