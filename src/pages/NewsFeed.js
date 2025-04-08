import React, { useState, useEffect, useRef, useCallback } from 'react';
import styled from 'styled-components';
import { Typography, Card, Avatar, Button, Input, Upload, message, Tabs, Modal, Space, Spin, Drawer, Tag } from 'antd';
import { UserOutlined, PictureOutlined, SendOutlined, EditOutlined, DeleteOutlined, MenuOutlined } from '@ant-design/icons';
import { getAuth } from 'firebase/auth';
import { 
  subscribeToPosts, 
  subscribeToUserPosts, 
  addPost, 
  updatePost, 
  deletePost, 
  getUserProfile,
  getMorePosts,
  getMoreUserPosts
} from '../firebase/postsService';
import moment from 'moment';
import MoodTracker from '../components/MoodTracker/MoodTracker';

const { Title, Paragraph, Text } = Typography;
const { TextArea } = Input;
const { TabPane } = Tabs;

const PageContainer = styled.div`
  width: 100%;
  padding: 16px;
`;

const PageTitle = styled(Title)`
  margin-bottom: 24px !important;
`;

const PostCard = styled(Card)`
  margin-bottom: 24px;
`;

const CreatePostCard = styled(Card)`
  margin-bottom: 24px;
`;

const PostImage = styled.img`
  width: 100%;
  max-width: 400px;
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
  grid-template-columns: 70% 30%;
  gap: 24px;
  
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
  height: calc(100vh - 48px);
  overflow-y: auto;
  
  @media (max-width: ${props => props.theme.breakpoints.lg}) {
    display: none;
  }
`;

const MobileActionButton = styled(Button)`
  position: fixed;
  bottom: 20px;
  right: 20px;
  z-index: 100;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  display: none;
  
  @media (max-width: ${props => props.theme.breakpoints.lg}) {
    display: flex;
    align-items: center;
    justify-content: center;
  }
`;

const GuidancePostCard = styled(PostCard)`
  border-left: 4px solid ${props => props.theme.colors.primary};
  background-color: rgba(24, 144, 255, 0.05);
`;

const LoadMoreContainer = styled.div`
  display: flex;
  justify-content: center;
  padding: 20px 0;
`;

const Post = ({ post, currentUser, onEdit, onDelete }) => {
  const [expanded, setExpanded] = useState(false);
  const isGuidancePost = post.userRole === 'guidance';
  const PostCardComponent = isGuidancePost ? GuidancePostCard : PostCard;
  const contentIsTruncated = post.content && post.content.length > 300;
  
  return (
    <PostCardComponent 
      key={post.id}
      actions={post.authorId === currentUser.uid ? [
        <ActionButton 
          type="text" 
          icon={<EditOutlined />}
          onClick={() => onEdit(post)}
        >
          Edit
        </ActionButton>,
        <ActionButton 
          type="text" 
          danger 
          icon={<DeleteOutlined />}
          onClick={() => onDelete(post.id)}
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
      
      <Paragraph>
        {expanded || !contentIsTruncated 
          ? post.content 
          : `${post.content.substring(0, 300)}...`}
        &nbsp;
        {contentIsTruncated && (
          <Button 
            type="link" 
            onClick={() => setExpanded(!expanded)} 
            style={{ padding: 0, marginBottom: 16 }}
          >
            {expanded ? 'See Less' : 'See More'}
          </Button>
        )}
      </Paragraph>
      
      {post.imageUrl && <PostImage src={post.imageUrl} alt="Post image" />}
    </PostCardComponent>
  );
};

const NewsFeedPage = () => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [postText, setPostText] = useState('');
  const [fileList, setFileList] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [editingPost, setEditingPost] = useState(null);
  const [activeTab, setActiveTab] = useState('all');
  const [userProfile, setUserProfile] = useState(null);
  const [moodDrawerVisible, setMoodDrawerVisible] = useState(false);
  const [lastVisible, setLastVisible] = useState(null);
  const [hasMore, setHasMore] = useState(true);
  
  const postsEndRef = useRef(null);
  const observerRef = useRef(null);
  
  const auth = getAuth();
  const currentUser = auth.currentUser;
  const POSTS_PER_PAGE = 20;

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
    
    setPosts([]);
    setLoading(true);
    setLastVisible(null);
    setHasMore(true);
    
    if (activeTab === 'all') {
      unsubscribe = subscribeToPosts((newPosts) => {
        setPosts(newPosts);
        setLoading(false);
        if (newPosts.length > 0) {
          setLastVisible(newPosts[newPosts.length - 1].createdAt);
        }
        setHasMore(newPosts.length === POSTS_PER_PAGE);
      }, POSTS_PER_PAGE);
    } else {
      unsubscribe = subscribeToUserPosts(currentUser.uid, (newPosts) => {
        setPosts(newPosts);
        setLoading(false);
        if (newPosts.length > 0) {
          setLastVisible(newPosts[newPosts.length - 1].createdAt);
        }
        setHasMore(newPosts.length === POSTS_PER_PAGE);
      }, POSTS_PER_PAGE);
    }
    
    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [activeTab, currentUser.uid]);

  const lastPostElementRef = useCallback(node => {
    if (loading || loadingMore) return;
    
    if (observerRef.current) observerRef.current.disconnect();
    
    observerRef.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMore) {
        loadMorePosts();
      }
    });
    
    if (node) observerRef.current.observe(node);
  }, [loading, loadingMore, hasMore]);

  const loadMorePosts = async () => {
    if (!lastVisible || !hasMore || loadingMore) return;
    
    try {
      setLoadingMore(true);
      
      let result;
      if (activeTab === 'all') {
        result = await getMorePosts(lastVisible, POSTS_PER_PAGE);
      } else {
        result = await getMoreUserPosts(currentUser.uid, lastVisible, POSTS_PER_PAGE);
      }
      
      setPosts(prevPosts => [...prevPosts, ...result.posts]);
      setLastVisible(result.lastVisible);
      setHasMore(result.hasMore);
    } catch (error) {
      console.error("Error loading more posts:", error);
      message.error("Failed to load more posts");
    } finally {
      setLoadingMore(false);
    }
  };

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
        userRole: userProfile?.role || 'student'
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
        imageUrl: editingPost.imageUrl
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
                <Text strong>What's on your mind?</Text>
              </PostAuthor>
            </PostHeader>
            
            <TextArea
              placeholder="Share your thoughts, questions, or experiences..."
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
                Post
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
                <>
                  {posts.map((post, index) => {
                    if (posts.length === index + 1) {
                      return (
                        <div ref={lastPostElementRef} key={post.id}>
                          <Post 
                            post={post}
                            currentUser={currentUser}
                            onEdit={handleEdit}
                            onDelete={handleDelete}
                          />
                        </div>
                      );
                    } else {
                      return (
                        <Post 
                          key={post.id}
                          post={post}
                          currentUser={currentUser}
                          onEdit={handleEdit}
                          onDelete={handleDelete}
                        />
                      );
                    }
                  })}
                  
                  {loadingMore && (
                    <LoadMoreContainer>
                      <Spin size="default" />
                    </LoadMoreContainer>
                  )}
                  
                  {!hasMore && posts.length > 0 && (
                    <LoadMoreContainer>
                      <Text type="secondary">No more posts to load</Text>
                    </LoadMoreContainer>
                  )}
                </>
              )}
            </TabPane>
            <TabPane tab="My Posts" key="my">
              {loading ? (
                <LoadingContainer>
                  <Spin size="large" />
                </LoadingContainer>
              ) : (
                <>
                  {posts.map((post, index) => {
                    if (posts.length === index + 1) {
                      return (
                        <div ref={lastPostElementRef} key={post.id}>
                          <Post 
                            post={post}
                            currentUser={currentUser}
                            onEdit={handleEdit}
                            onDelete={handleDelete}
                          />
                        </div>
                      );
                    } else {
                      return (
                        <Post 
                          key={post.id}
                          post={post}
                          currentUser={currentUser}
                          onEdit={handleEdit}
                          onDelete={handleDelete}
                        />
                      );
                    }
                  })}
                  
                  {loadingMore && (
                    <LoadMoreContainer>
                      <Spin size="default" />
                    </LoadMoreContainer>
                  )}
                  
                  {!hasMore && posts.length > 0 && (
                    <LoadMoreContainer>
                      <Text type="secondary">No more posts to load</Text>
                    </LoadMoreContainer>
                  )}
                </>
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

export default NewsFeedPage;
