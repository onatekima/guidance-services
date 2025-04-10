import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { Form, Select, DatePicker, Button, Input, message, Spin, Alert, Tag } from 'antd';
import { CalendarOutlined } from '@ant-design/icons';
import { bookAppointment, getAvailableTimeSlots, getAllTimeSlots } from '../../firebase/appointments';
import { useAuth } from '../../context/AuthContext';
import moment from 'moment';
import { useNavigate } from 'react-router-dom';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../firebase/config';

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

const SubmitButton = styled(Button)`
  width: 100%;
`;

const LoadingContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 40px;
`;

const AuthErrorContainer = styled.div`
  margin-bottom: 20px;
`;

const AppointmentForm = () => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [selectedDate, setSelectedDate] = useState(null);
  const [bookedTimeSlots, setBookedTimeSlots] = useState([]);
  const [allTimeSlots, setAllTimeSlots] = useState([]);
  const [fetchingTimeSlots, setFetchingTimeSlots] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);
  const navigate = useNavigate();
  
  const auth = useAuth();

  useEffect(() => {
    const storedUser = localStorage.getItem('currentUser');
    console.log('Stored User:', storedUser);
    if (storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        console.log('Parsed User:', parsedUser);
        if (!auth.currentUser) {
          auth.setCurrentUser && auth.setCurrentUser(parsedUser);
        }
      } catch (error) {
        console.error("Error parsing stored user:", error);
      }
    }
  }, [auth]);

  useEffect(() => {
    console.log('Auth Loading:', auth.loading);
    console.log('Current User:', auth.currentUser);
    
    if (!auth.loading) {
      if (!auth.currentUser) {
        const storedUser = localStorage.getItem('currentUser');
        if (storedUser) {
          try {
            const parsedUser = JSON.parse(storedUser);
            auth.setCurrentUser && auth.setCurrentUser(parsedUser);
          } catch (error) {
            console.error("Error parsing stored user:", error);
            message.error('Authentication error. Please login again.');
            navigate('/login');
          }
        } else {
          console.log("No stored user found, redirecting to login");
          message.error('You must be logged in to book an appointment');
          navigate('/login');
        }
      }
      setAuthChecked(true);
    }
  }, [auth.loading, auth.currentUser, navigate, auth]);

  const handleDateChange = async (date) => {
    if (!date) return;
    
    setSelectedDate(date);
    form.setFieldsValue({ timeSlot: undefined });
    
    try {
      setFetchingTimeSlots(true);
      
      console.log("Selected date:", date.format('YYYY-MM-DD'));
      
      const formattedDate = date.format('YYYY-MM-DD');
      const allSlots = await getAllTimeSlots(formattedDate);
      console.log("All time slots with availability:", allSlots);
      
      setAllTimeSlots(allSlots);
      
      const bookedSlots = allSlots
        .filter(slot => slot.booked)
        .map(slot => slot.time);
      
      setBookedTimeSlots(bookedSlots);
      
    } catch (error) {
      console.error("Error fetching time slots:", error);
      message.error('Failed to fetch time slots');
    } finally {
      setFetchingTimeSlots(false);
    }
  };

  const onFinish = async (values) => {
    if (!auth.currentUser) {
      message.error('You must be logged in to book an appointment');
      navigate('/login');
      return;
    }
    
    try {
      setLoading(true);
      
      const formattedDate = values.date.format('YYYY-MM-DD');
      
      let studentName = 'Guest User';
      
      if (auth.currentUser.name) {
        studentName = auth.currentUser.name;
      } else if (auth.currentUser.email) {
        studentName = auth.currentUser.email;
      }
      
      const appointmentData = {
        studentId: auth.currentUser.studentId || 'guest',
        studentName: studentName,
        counselorType: values.counselorType,
        date: formattedDate,
        timeSlot: values.timeSlot,
        purpose: values.purpose,
        status: 'pending',
        email: auth.currentUser.email || ''
      };
      
      await bookAppointment(appointmentData);
      
      message.success('Appointment booked successfully!');
      form.resetFields();
      setSelectedDate(null);
      setBookedTimeSlots([]);
    } catch (error) {
      console.error("Error booking appointment:", error);
      message.error('Failed to book appointment. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!auth || auth.loading || !authChecked) {
    return (
      <FormContainer>
        <LoadingContainer>
          <Spin size="large" tip={`Loading user data... ${auth?.loading ? '(Auth Loading)' : '(Auth Check)'}`} />
        </LoadingContainer>
      </FormContainer>
    );
  }

  if (!auth.currentUser) {
    return (
      <FormContainer>
        <AuthErrorContainer>
          <Alert
            message="Authentication Required"
            description={
              <p>You need to be logged in to book an appointment.</p>
            }
            type="error"
            showIcon
            action={
              <Button type="primary" onClick={() => navigate('/login')}>
                Log In
              </Button>
            }
          />
        </AuthErrorContainer>
      </FormContainer>
    );
  }

  return (
    <FormContainer>
      <Form
        form={form}
        layout="vertical"
        onFinish={onFinish}
      >
        <Form.Item
          name="counselorType"
          label="Counselling Type"
          rules={[{ required: true, message: 'Please select a counselling type' }]}
        >
          <Select placeholder="Select counselling type">
            <Option value="career">Career</Option>
            <Option value="academic">Academic</Option>
            <Option value="mental_health">Mental Health</Option>
            <Option value="family">Family</Option>
            <Option value="crisis">Crisis</Option>
            <Option value="gender_sexuality">Gender and Sexuality</Option>
          </Select>
        </Form.Item>

        <Form.Item
          name="date"
          label="Appointment Date"
          rules={[{ required: true, message: 'Please select a date' }]}
        >
          <DatePicker 
            style={{ width: '100%' }} 
            format="YYYY-MM-DD" 
            disabledDate={(current) => {
              return (
                current && 
                (current < moment().startOf('day') || 
                current.day() === 0 || 
                current.day() === 6)
              );
            }}
            onChange={handleDateChange}
            placeholder="Select date"
          />
        </Form.Item>

        <Form.Item
          name="timeSlot"
          label="Appointment Time"
          rules={[{ required: true, message: 'Please select a time slot' }]}
        >
          {fetchingTimeSlots ? (
            <LoadingContainer>
              <Spin size="small" /> Loading available time slots...
            </LoadingContainer>
          ) : (
            <Select 
              placeholder="Select time slot" 
              disabled={!selectedDate || allTimeSlots.length === 0}
            >
              {allTimeSlots.map(slot => {
                const isBooked = slot.booked;
                const isAvailable = slot.available;
                
                return (
                  <Option 
                    key={slot.time} 
                    value={slot.time} 
                    disabled={isBooked || !isAvailable}
                  >
                    {slot.time} {
                      isBooked ? <Tag color="red">Booked</Tag> : 
                      !isAvailable ? <Tag color="orange">Unavailable</Tag> : null
                    }
                  </Option>
                );
              })}
            </Select>
          )}
        </Form.Item>

        <Form.Item
          name="purpose"
          label="Additional Information"
        >
          <TextArea 
            rows={4} 
            placeholder="Additional information/request"
          />
        </Form.Item>

        <Form.Item>
          <SubmitButton 
            type="primary" 
            htmlType="submit" 
            loading={loading}
            icon={<CalendarOutlined />}
          >
            Book Appointment
          </SubmitButton>
        </Form.Item>
      </Form>
    </FormContainer>
  );
};

export default AppointmentForm;
