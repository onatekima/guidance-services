import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { 
  Typography, 
  Card, 
  Avatar, 
  Button, 
  Input, 
  Upload, 
  message, 
  Tabs,
  Modal,
  Space,
  Spin,
  Tag,
  Drawer
} from 'antd';
import { 
  UserOutlined, 
  PictureOutlined,
  SendOutlined,
  EditOutlined,
  DeleteOutlined,
  MenuOutlined
} from '@ant-design/icons';
import { getAuth } from 'firebase/auth';
import { subscribeToPosts, subscribeToUserPosts, addPost, updatePost, deletePost, getUserProfile } from '../../firebase/postsService';
import moment from 'moment';
import MoodTracker from '../../components/MoodTracker/MoodTracker';

const { Title, Paragraph, Text } = Typography;
const { TextArea } = Input;
const { TabPane } = Tabs;

const PageContainer = styled.div`
  width: 100%;
  max-width: 800px;
  margin: 0 auto;
`;

const PageTitle = styled(Title)`
  margin-bottom: 24px !important;
`;

const PostCard = styled(Card)`
  margin-bottom: 24px;
`;

const GuidancePostCard = styled(PostCard)`
  border-left: 4px solid ${props => props.theme.colors.primary};
  background-color: rgba(24, 144, 255, 0.05);
`;

const CreatePostCard = styled(Card)`
  margin-bottom: 24px;
`;

const PostImage = styled.img`
  width: 100%;
  max-height: 400px;
  object-fit: cover;
  border-radius: 8px;
  margin: 16px 0;
`;

const PostHeader = styled.div`
  display: flex;
  align-items: center;
  margin-bottom: 16px;
`;

const PostAuthor = styled.div`
  margin-left: 12px;
`;

const PostTime = styled(Text)`
  color: ${props => props.theme.colors.textSecondary};
  font-size: 12px;
`;

const LoadingContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 40px;
`;

const ActionButton = styled(Button)`
  margin-left: 8px;
`;

const FeedLayout = styled.div`
  display: grid;
  grid-template-columns: 1fr 350px;
  gap: 24px;
  max-width: 1200px;
  margin: 0 auto;
  
  @media (max-width: ${props => props.theme.breakpoints.lg}) {
    grid-template-columns: 1fr;
  }
`;

const FeedContainer = styled.div`
  width: 100%;
`;

const MoodTrackerContainer = styled.div`
  position: sticky;
  top: 24px;
  height: fit-content;
  
  @media (max-width: ${props => props.theme.breakpoints.lg}) {
    display: none;
  }
`;

const MobileActionButton = styled(Button)`
  position: fixed;
  bottom: 20px;
  right: 20px;
  z-index: 100;
  width: 50px;
  height: 50px;
  border-radius: 50%;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  display: none;
  
  @media (max-width: ${props => props.theme.breakpoints.lg}) {
    display: flex;
    align-items: center;
    justify-content: center;
  }
`;

const GuidanceNewsFeed = () => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [postText, setPostText] = useState('');
  const [fileList, setFileList] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [editingPost, setEditingPost] = useState(null);
  const [activeTab, setActiveTab] = useState('all');
  const [userProfile, setUserProfile] = useState(null);
  const [moodDrawerVisible, setMoodDrawerVisible] = useState(false);
  
  const auth = getAuth();
  const currentUser = auth.currentUser;

  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const profile = await getUserProfile(currentUser.uid);
        setUserProfile(profile);
      } catch (error) {
        console.error("Error fetching user profile:", error);
      }
    };
    
    fetchUserProfile();
  }, [currentUser.uid]);

  useEffect(() => {
    let unsubscribe;
    
    if (activeTab === 'all') {
      unsubscribe = subscribeToPosts((newPosts) => {
        setPosts(newPosts);
        setLoading(false);
      });
    } else {
      unsubscribe = subscribeToUserPosts(currentUser.uid, (newPosts) => {
        setPosts(newPosts);
        setLoading(false);
      });
    }
    
    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [activeTab, currentUser.uid]);

  const handlePostSubmit = async () => {
    if (!postText.trim() && fileList.length === 0) {
      message.warning('Please add some text or an image to your post');
      return;
    }
    
    try {
      setSubmitting(true);
      
      let authorName = currentUser.displayName || '';
      
      if (userProfile) {
        if (userProfile.firstName && userProfile.lastName) {
          authorName = `${userProfile.firstName} ${userProfile.lastName}`;
        } else if (userProfile.fullName) {
          authorName = userProfile.fullName;
        }
      }
      
      if (!authorName) {
        authorName = currentUser.email.split('@')[0];
      }
      
      const postData = {
        content: postText,
        authorId: currentUser.uid,
        authorName: authorName,
        authorEmail: currentUser.email,
        userRole: 'guidance' // Always set role as guidance for this component
      };
      
      const imageFile = fileList.length > 0 ? fileList[0].originFileObj : null;
      await addPost(postData, imageFile);
      
      message.success('Post created successfully!');
      setPostText('');
      setFileList([]);
    } catch (error) {
      console.error("Error creating post:", error);
      message.error('Failed to create post. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditSubmit = async () => {
    if (!editingPost.content.trim() && !editingPost.imageUrl && fileList.length === 0) {
      message.warning('Please add some text or an image to your post');
      return;
    }
    
    try {
      setSubmitting(true);
      
      const imageFile = fileList.length > 0 && fileList[0].originFileObj ? fileList[0].originFileObj : null;
      
      await updatePost(editingPost.id, {
        content: editingPost.content,
        authorId: editingPost.authorId,
        authorName: editingPost.authorName,
        authorEmail: editingPost.authorEmail,
        imageUrl: editingPost.imageUrl,
        userRole: 'guidance' // Ensure role stays as guidance
      }, imageFile);
      
      message.success('Post updated successfully!');
      setEditingPost(null);
      setFileList([]);
    } catch (error) {
      console.error("Error updating post:", error);
      message.error('Failed to update post. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (postId) => {
    try {
      await deletePost(postId);
      message.success('Post deleted successfully!');
    } catch (error) {
      console.error("Error deleting post:", error);
      message.error('Failed to delete post. Please try again.');
    }
  };

  const uploadProps = {
    onRemove: file => {
      setFileList([]);
    },
    beforeUpload: file => {
      const isImage = file.type.startsWith('image/');
      if (!isImage) {
        message.error('You can only upload image files!');
        return Upload.LIST_IGNORE;
      }
      
      const isLt5M = file.size / 1024 / 1024 < 5;
      if (!isLt5M) {
        message.error('Image must be smaller than 5MB!');
        return Upload.LIST_IGNORE;
      }
      
      setFileList([{
        uid: '-1',
        name: file.name,
        status: 'done',
        originFileObj: file,
      }]);
      return false;
    },
    fileList,
  };

  const renderPost = (post) => {
    const isGuidancePost = post.userRole === 'guidance';
    const PostCardComponent = isGuidancePost ? GuidancePostCard : PostCard;
    
    return (
      <PostCardComponent 
        key={post.id}
        actions={post.authorId === currentUser.uid ? [
          <ActionButton 
            type="text" 
            icon={<EditOutlined />}
            onClick={() => handleEdit(post)}
          >
            Edit
          </ActionButton>,
          <ActionButton 
            type="text" 
            danger 
            icon={<DeleteOutlined />}
            onClick={() => handleDelete(post.id)}
          >
            Delete
          </ActionButton>
        ] : undefined}
      >
        <PostHeader>
          <Avatar size={40} icon={<UserOutlined />} />
          <PostAuthor>
            <Text strong>
              {post.authorName}
              {isGuidancePost && (
                <Tag color="blue" style={{ marginLeft: 8 }}>
                  Guidance Counselor
                </Tag>
              )}
            </Text>
            <br />
            <PostTime>
              {moment(post.createdAt?.toDate()).fromNow()}
            </PostTime>
          </PostAuthor>
        </PostHeader>
        
        <Paragraph>{post.content}</Paragraph>
        
        {post.imageUrl && <PostImage src={post.imageUrl} alt="Post image" />}
      </PostCardComponent>
    );
  };

  const handleEdit = (post) => {
    setEditingPost(post);
    
    if (post.imageUrl) {
      setFileList([{
        uid: '-1',
        name: 'Current Image',
        status: 'done',
        url: post.imageUrl
      }]);
    } else {
      setFileList([]);
    }
  };

  return (
    <PageContainer>
      <PageTitle level={2}>News Feed</PageTitle>
      
      <FeedLayout>
        <FeedContainer>
          <CreatePostCard>
            <PostHeader>
              <Avatar size={40} icon={<UserOutlined />} />
              <PostAuthor>
                <Text strong>Share an announcement or update...</Text>
              </PostAuthor>
            </PostHeader>
            
            <TextArea
              placeholder="Share important announcements, updates, or resources..."
              autoSize={{ minRows: 3, maxRows: 6 }}
              value={postText}
              onChange={e => setPostText(e.target.value)}
            />
            
            <Space direction="vertical" style={{ width: '100%', marginTop: 16 }}>
              <Upload
                listType="picture"
                maxCount={1}
                {...uploadProps}
              >
                <Button icon={<PictureOutlined />}>Add Image</Button>
              </Upload>
              
              <Button 
                type="primary" 
                block 
                onClick={handlePostSubmit} 
                loading={submitting}
                icon={<SendOutlined />}
              >
                Post Announcement
              </Button>
            </Space>
          </CreatePostCard>
          
          <Tabs activeKey={activeTab} onChange={setActiveTab}>
            <TabPane tab="All Posts" key="all">
              {loading ? (
                <LoadingContainer>
                  <Spin size="large" />
                </LoadingContainer>
              ) : (
                posts.map(post => renderPost(post))
              )}
            </TabPane>
            <TabPane tab="My Posts" key="my">
              {loading ? (
                <LoadingContainer>
                  <Spin size="large" />
                </LoadingContainer>
              ) : (
                posts.map(post => renderPost(post))
              )}
            </TabPane>
          </Tabs>
        </FeedContainer>
        
        <MoodTrackerContainer>
          <MoodTracker currentUser={currentUser} />
        </MoodTrackerContainer>
      </FeedLayout>
      
      <MobileActionButton 
        type="primary"
        icon={<MenuOutlined />}
        onClick={() => setMoodDrawerVisible(true)}
      />
      
      <Drawer
        title="Today's Moods"
        placement="right"
        closable={true}
        onClose={() => setMoodDrawerVisible(false)}
        open={moodDrawerVisible}
        width={300}
      >
        <MoodTracker currentUser={currentUser} />
      </Drawer>
      
      <Modal
        title="Edit Post"
        open={!!editingPost}
        onOk={handleEditSubmit}
        onCancel={() => {
          setEditingPost(null);
          setFileList([]);
        }}
        confirmLoading={submitting}
      >
        <TextArea
          value={editingPost?.content}
          onChange={e => setEditingPost({ ...editingPost, content: e.target.value })}
          autoSize={{ minRows: 3, maxRows: 6 }}
          style={{ marginBottom: 16 }}
        />
        
        <Upload
          listType="picture"
          maxCount={1}
          {...uploadProps}
        >
          <Button icon={<PictureOutlined />}>
            {editingPost?.imageUrl ? 'Change Image' : 'Add Image'}
          </Button>
        </Upload>
      </Modal>
    </PageContainer>
  );
};

export default GuidanceNewsFeed;
