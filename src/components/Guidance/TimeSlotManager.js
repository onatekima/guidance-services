import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { 
  Card, Typography, DatePicker, Button, Checkbox, 
  Row, Col, Spin, message, Alert, Tabs, Modal, Form, Select
} from 'antd';
import { 
  SaveOutlined, CalendarOutlined, ClockCircleOutlined, 
  ReloadOutlined, ExclamationCircleOutlined, LockOutlined
} from '@ant-design/icons';
import moment from 'moment';
import { db } from '../../firebase/config';
import { collection, doc, getDoc, setDoc, query, where, getDocs } from 'firebase/firestore';

const { Title, Text } = Typography;
const { TabPane } = Tabs;
const { Option } = Select;
const { MonthPicker } = DatePicker;

const Container = styled.div`
  margin-bottom: 24px;
`;

const StyledCard = styled(Card)`
  margin-bottom: 16px;
`;

const TimeSlotGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  gap: 12px;
  margin-top: 16px;
`;

const TimeSlotItem = styled.div`
  padding: 8px;
  border: 1px solid ${props => props.theme.colors.border};
  border-radius: 4px;
  background-color: ${props => props.isBlocked ? '#f5f5f5' : 'white'};
  display: flex;
  align-items: center;
`;

const LoadingContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 40px;
`;

const ActionButtons = styled.div`
  display: flex;
  justify-content: flex-end;
  margin-top: 16px;
  gap: 8px;
`;

const defaultTimeSlots = [
  "9:00 AM", "10:00 AM", "11:00 AM", "12:00 PM",
  "1:00 PM", "2:00 PM", "3:00 PM", "4:00 PM"
];

const TimeSlotManager = () => {
  const [selectedDate, setSelectedDate] = useState(moment());
  const [timeSlots, setTimeSlots] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('daily');
  const [bulkModalVisible, setBulkModalVisible] = useState(false);
  const [bulkForm] = Form.useForm();

  useEffect(() => {
    if (selectedDate) {
      fetchTimeSlots(selectedDate);
    }
  }, [selectedDate]);

  const fetchTimeSlots = async (date) => {
    try {
      setLoading(true);
      setError(null);
      
      const formattedDate = date.format('YYYY-MM-DD');
      const timeSlotsRef = doc(db, 'availableTimeSlots', formattedDate);
      const timeSlotsDoc = await getDoc(timeSlotsRef);
      
      if (timeSlotsDoc.exists()) {
        setTimeSlots(timeSlotsDoc.data().slots || []);
      } else {
        // If no document exists for this date, use default time slots
        setTimeSlots(defaultTimeSlots.map(time => ({
          time,
          available: true
        })));
      }
    } catch (err) {
      console.error("Error fetching time slots:", err);
      setError("Failed to load time slots. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleDateChange = (date) => {
    if (date) {
      setSelectedDate(date);
    }
  };

  const toggleTimeSlot = (index) => {
    const updatedSlots = [...timeSlots];
    // Only allow blocking (making unavailable)
    if (updatedSlots[index].available) {
      updatedSlots[index].available = false;
      setTimeSlots(updatedSlots);
    }
  };

  const saveTimeSlots = async () => {
    try {
      setSaving(true);
      
      const formattedDate = selectedDate.format('YYYY-MM-DD');
      const timeSlotsRef = doc(db, 'availableTimeSlots', formattedDate);
      
      await setDoc(timeSlotsRef, {
        date: formattedDate,
        slots: timeSlots,
        updatedAt: new Date()
      });
      
      message.success('Time slots saved successfully');
    } catch (err) {
      console.error("Error saving time slots:", err);
      message.error('Failed to save time slots');
    } finally {
      setSaving(false);
    }
  };

  const handleBulkUpdate = () => {
    setBulkModalVisible(true);
    bulkForm.resetFields();
  };

  const handleBulkModalCancel = () => {
    setBulkModalVisible(false);
  };

  const getDatesInMonth = (year, month) => {
    const daysInMonth = moment(`${year}-${month+1}`, 'YYYY-M').daysInMonth();
    const dates = [];
    
    for (let day = 1; day <= daysInMonth; day++) {
      const date = moment(`${year}-${month+1}-${day}`, 'YYYY-M-D');
      dates.push(date.format('YYYY-MM-DD'));
    }
    
    return dates;
  };

  const handleBulkModalSubmit = async () => {
    try {
      const values = await bulkForm.validateFields();
      
      const { selectedMonth, specificTimeSlots } = values;
      const year = selectedMonth.year();
      const month = selectedMonth.month(); // 0-indexed
      
      // Generate all dates in the selected month
      const dates = getDatesInMonth(year, month);
      
      // Process each date
      setSaving(true);
      
      for (const date of dates) {
        const timeSlotsRef = doc(db, 'availableTimeSlots', date);
        
        // Always create new time slots (override existing)
        let slots = defaultTimeSlots.map(time => ({
          time,
          available: true
        }));
        
        // Update slots - only block selected time slots
        if (specificTimeSlots && specificTimeSlots.length > 0) {
          // Only block specific time slots
          slots = slots.map(slot => {
            if (specificTimeSlots.includes(slot.time)) {
              return { ...slot, available: false };
            }
            return slot;
          });
        } else {
          // Block all time slots
          slots = slots.map(slot => ({
            ...slot,
            available: false
          }));
        }
        
        await setDoc(timeSlotsRef, {
          date,
          slots,
          updatedAt: new Date()
        });
      }
      
      message.success(`Successfully blocked time slots for ${dates.length} days in ${selectedMonth.format('MMMM YYYY')}`);
      setBulkModalVisible(false);
      
      // Refresh current view
      if (selectedDate) {
        fetchTimeSlots(selectedDate);
      }
    } catch (err) {
      console.error("Error in bulk update:", err);
      message.error('Failed to update time slots');
    } finally {
      setSaving(false);
    }
  };

  const renderTimeSlots = () => {
    if (loading) {
      return (
        <LoadingContainer>
          <Spin size="large" />
        </LoadingContainer>
      );
    }

    if (error) {
      return (
        <Alert
          message="Error"
          description={error}
          type="error"
          showIcon
          action={
            <Button onClick={() => fetchTimeSlots(selectedDate)}>
              Retry
            </Button>
          }
        />
      );
    }

    return (
      <TimeSlotGrid>
        {timeSlots.map((slot, index) => (
          <TimeSlotItem 
            key={index} 
            isBlocked={!slot.available}
            onClick={() => toggleTimeSlot(index)}
          >
            <Checkbox 
              checked={slot.available}
              onChange={() => toggleTimeSlot(index)}
            />
            <Text style={{ marginLeft: 8 }}>{slot.time}</Text>
            {!slot.available && <LockOutlined style={{ marginLeft: 'auto', color: '#ff4d4f' }} />}
          </TimeSlotItem>
        ))}
      </TimeSlotGrid>
    );
  };

  return (
    <Container>
      <StyledCard
        title={<><CalendarOutlined /> Time Slot Management</>}
        extra={
          <Button 
            type="primary" 
            icon={<ReloadOutlined />} 
            onClick={() => fetchTimeSlots(selectedDate)}
          >
            Refresh
          </Button>
        }
      >
        <Tabs activeKey={activeTab} onChange={setActiveTab}>
          <TabPane tab="Daily Management" key="daily">
            <Row gutter={16} align="middle">
              <Col xs={24} sm={12} md={8} lg={6}>
                <DatePicker 
                  value={selectedDate} 
                  onChange={handleDateChange} 
                  disabledDate={(current) => {
                                return (
                                  current && 
                                  (current < moment().startOf('day') || 
                                  current.day() === 0 || 
                                  current.day() === 6)
                                );
                              }}
                  format="YYYY-MM-DD"
                  style={{ width: '100%' }}
                />
              </Col>
              <Col xs={24} sm={12} md={16} lg={18}>
                <Text>
                  Select a date and click on time slots to block them. Blocked slots won't be available for booking.
                </Text>
              </Col>
            </Row>
            
            {renderTimeSlots()}
            
            <ActionButtons>
              <Button 
                type="primary" 
                icon={<SaveOutlined />} 
                onClick={saveTimeSlots}
                loading={saving}
              >
                Save Changes
              </Button>
              <Button 
                onClick={handleBulkUpdate}
                icon={<ClockCircleOutlined />}
              >
                Bulk Block
              </Button>
            </ActionButtons>
          </TabPane>
        </Tabs>
      </StyledCard>

      <Modal
        title="Bulk Block Time Slots for Month"
        open={bulkModalVisible}
        onCancel={handleBulkModalCancel}
        footer={[
          <Button key="back" onClick={handleBulkModalCancel}>
            Cancel
          </Button>,
          <Button
            key="submit"
            type="primary"
            danger
            loading={saving}
            onClick={handleBulkModalSubmit}
          >
            Block Time Slots
          </Button>,
        ]}
      >
        <Form
          form={bulkForm}
          layout="vertical"
        >
          <Form.Item
            name="selectedMonth"
            label="Select Month"
            rules={[{ required: true, message: 'Please select a month' }]}
          >
            <DatePicker 
              picker="month" 
              style={{ width: '100%' }} 
              format="MMMM YYYY"
            />
          </Form.Item>
          
          <Form.Item
            name="specificTimeSlots"
            label="Specific Time Slots (Optional)"
            help="Leave empty to block all time slots for the selected month"
          >
            <Select mode="multiple" placeholder="Select specific time slots to block">
              {defaultTimeSlots.map(time => (
                <Option key={time} value={time}>{time}</Option>
              ))}
            </Select>
          </Form.Item>
        </Form>
      </Modal>
    </Container>
  );
};

export default TimeSlotManager;
