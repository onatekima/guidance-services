import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { Avatar, Button, Modal, Input, Tooltip, message } from 'antd';
import { UserOutlined, PlusOutlined } from '@ant-design/icons';
import EmojiPicker from 'emoji-picker-react';
import moment from 'moment';
import { getUserProfile } from '../../firebase/postsService';
import { subscribeMoods, addMood, getUserMood } from '../../firebase/moodService';
import { useAuth } from '../../context/AuthContext';

const MoodTrackerContainer = styled.div`
  padding: 20px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
`;

const Title = styled.h3`
  margin-bottom: 20px;
  font-weight: 600;
`;

const MoodList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
`;

const MoodItem = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px;
  border-radius: 8px;
  transition: background-color 0.2s;
  
  &:hover {
    background-color: ${props => props.theme.colors.light};
  }
`;

const AvatarWrapper = styled.div`
  position: relative;
  cursor: pointer;
  
  &::after {
    content: '';
    position: absolute;
    top: -2px;
    left: -2px;
    right: -2px;
    bottom: -2px;
    border-radius: 50%;
    border: 2px solid ${props => props.active ? props.theme.colors.primary : 'transparent'};
  }
`;

const MoodInfo = styled.div`
  flex: 1;
`;

const UserName = styled.div`
  font-weight: 500;
  font-size: 14px;
`;

const MoodText = styled.div`
  font-size: 12px;
  color: ${props => props.theme.colors.textSecondary};
`;

const TimeAgo = styled.div`
  font-size: 11px;
  color: ${props => props.theme.colors.textSecondary};
`;

const SetMoodButton = styled(Button)`
  width: 100%;
  margin-top: 16px;
`;

const MoodInput = styled(Input)`
  margin-bottom: 16px;
`;

const EmojiPickerContainer = styled.div`
  margin-bottom: 16px;
`;

const MoodTracker = ({ currentUser }) => {
  const [moods, setMoods] = useState([]);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [currentMood, setCurrentMood] = useState('');
  const [selectedEmoji, setSelectedEmoji] = useState(null);
  const [loading, setLoading] = useState(false);
  const [userCurrentMood, setUserCurrentMood] = useState(null);
  const { isGuidance } = useAuth();

  useEffect(() => {
    const unsubscribe = subscribeMoods((newMoods) => {
      setMoods(newMoods);
      
      const userMood = newMoods.find(mood => mood.userId === currentUser.uid);
      if (userMood) {
        setUserCurrentMood(userMood);
      }
    });

    return () => unsubscribe();
  }, [currentUser.uid]);

  const handleOpenModal = async () => {
    try {
      if (userCurrentMood) {
        setCurrentMood(userCurrentMood.mood || '');
        if (userCurrentMood.emoji) {
          setSelectedEmoji({ emoji: userCurrentMood.emoji });
        }
      } else {
        const mood = await getUserMood(currentUser.uid);
        if (mood) {
          setCurrentMood(mood.mood || '');
          if (mood.emoji) {
            setSelectedEmoji({ emoji: mood.emoji });
          }
          setUserCurrentMood(mood);
        }
      }
      
      setIsModalVisible(true);
    } catch (error) {
      console.error('Error getting current mood:', error);
    }
  };

  const handleSetMood = async () => {
    if (!currentMood && !selectedEmoji) {
      message.warning('Please enter a mood or select an emoji');
      return;
    }

    if (currentMood.length > 60) {
      message.warning('Mood text cannot exceed 60 characters');
      return;
    }

    try {
      setLoading(true);
      const userProfile = await getUserProfile(currentUser.uid);
      const moodData = {
        userId: currentUser.uid,
        userName: userProfile?.firstName && userProfile?.lastName 
          ? `${userProfile.firstName} ${userProfile.lastName}`
          : (userProfile?.fullName || currentUser.email.split('@')[0]),
        mood: currentMood,
        emoji: selectedEmoji?.emoji,
        timestamp: new Date(),
      };

      await addMood(moodData);
      message.success('Mood updated successfully!');
      setIsModalVisible(false);
    } catch (error) {
      console.error('Error setting mood:', error);
      message.error('Failed to update mood');
    } finally {
      setLoading(false);
    }
  };

  const onEmojiClick = (emojiObject) => {
    setSelectedEmoji(emojiObject);
  };

  const getButtonText = () => {
    if (userCurrentMood) {
      return 'Update Your Mood';
    }
    return 'Set Your Mood';
  };

  return (
    <MoodTrackerContainer>
      <Title>Today's Moods</Title>
      
      <MoodList>
        {moods.map((mood) => (
          <MoodItem key={mood.id}>
            <AvatarWrapper active={mood.userId === currentUser.uid}>
              <Avatar size={40} icon={<UserOutlined />} />
            </AvatarWrapper>
            <MoodInfo>
              <UserName>{mood.userName}</UserName>
              <MoodText>
                {mood.emoji} {mood.mood}
              </MoodText>
              <TimeAgo>{moment(mood.timestamp?.toDate()).fromNow()}</TimeAgo>
            </MoodInfo>
          </MoodItem>
        ))}
      </MoodList>

      {!isGuidance && (
        <SetMoodButton 
          type="primary" 
          icon={<PlusOutlined />}
          onClick={handleOpenModal}
        >
          {getButtonText()}
        </SetMoodButton>
      )}

      <Modal
        title="How are you feeling today?"
        open={isModalVisible}
        onOk={handleSetMood}
        onCancel={() => {
          setIsModalVisible(false);
          setCurrentMood('');
          setSelectedEmoji(null);
        }}
        confirmLoading={loading}
      >
        <MoodInput
          placeholder="Express your mood... (max 60 characters)"
          value={currentMood}
          onChange={(e) => {
            if (e.target.value.length <= 60) {
              setCurrentMood(e.target.value);
            }
          }}
          prefix={selectedEmoji?.emoji}
          suffix={`${currentMood.length}/60`}
          maxLength={60}
        />
        
        <EmojiPickerContainer>
          <EmojiPicker
            onEmojiClick={onEmojiClick}
            width="100%"
            height={300}
          />
        </EmojiPickerContainer>
      </Modal>
    </MoodTrackerContainer>
  );
};

export default MoodTracker;
