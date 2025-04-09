import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { 
  Typography, 
  Button, 
  Table, 
  Space, 
  Modal, 
  Form, 
  Input, 
  Select,
  Upload,
  message,
  Spin,
  Popconfirm,
  Image,
  Tabs
} from 'antd';
import { 
  PlusOutlined, 
  EditOutlined, 
  DeleteOutlined,
  PhoneOutlined,
  UploadOutlined,
  PictureOutlined
} from '@ant-design/icons';
import { 
  getDirectoryEntries, 
  addDirectoryEntry, 
  updateDirectoryEntry, 
  deleteDirectoryEntry 
} from '../../firebase/directoryService';

const { Title } = Typography;
const { Option } = Select;
const { TabPane } = Tabs;

const PageContainer = styled.div`
  width: 100%;
`;

const PageTitle = styled(Title)`
  margin-bottom: 24px !important;
`;

const ActionBar = styled.div`
  margin-bottom: 24px;
  display: flex;
  justify-content: flex-end;
`;

const DirectoryIcon = styled(Image)`
  max-width: 60px;
  max-height: 60px;
  object-fit: cover;
`;

const StyledUpload = styled(Upload)`
  .ant-upload-list-item {
    margin-top: 8px;
  }
`;

const GuidanceDirectory = () => {
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [form] = Form.useForm();
  const [editingEntry, setEditingEntry] = useState(null);
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [iconFileList, setIconFileList] = useState([]);
  const [uploadedIconName, setUploadedIconName] = useState('');

  useEffect(() => {
    fetchEntries();
  }, []);

  const fetchEntries = async () => {
    try {
      setLoading(true);
      const data = await getDirectoryEntries();
      setEntries(data);
    } catch (error) {
      message.error('Failed to fetch directory entries');
    } finally {
      setLoading(false);
    }
  };

  const columns = [
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: 'Phone Number',
      dataIndex: 'phoneNumber',
      key: 'phoneNumber',
    },
    {
      title: 'Category',
      dataIndex: 'category',
      key: 'category',
      render: (category) => getCategoryLabel(category),
    },
    {
      title: 'Description',
      dataIndex: 'description',
      key: 'description',
      ellipsis: true,
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Space>
          <Button 
            icon={<EditOutlined />} 
            onClick={() => handleEdit(record)}
          >
            Edit
          </Button>
          <Popconfirm
            title="Are you sure you want to delete this entry?"
            onConfirm={() => handleDelete(record)}
            okText="Yes"
            cancelText="No"
          >
            <Button 
              danger 
              icon={<DeleteOutlined />}
            >
              Delete
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  const handleAdd = () => {
    setEditingEntry(null);
    form.resetFields();
    setIconFileList([]);
    setUploadedIconName('');
    setIsModalVisible(true);
  };

  const handleEdit = (entry) => {
    setEditingEntry(entry);
    setUploadedIconName(entry.iconName || '');
    
    form.setFieldsValue({
      name: entry.name,
      phoneNumber: entry.phoneNumber,
      category: entry.category,
      description: entry.description,
    });
    
    if (entry.iconUrl) {
      setIconFileList([
        {
          uid: '-1',
          name: entry.iconName || 'icon',
          status: 'done',
          url: entry.iconUrl
        },
      ]);
    } else {
      setIconFileList([]);
    }
    
    setIsModalVisible(true);
  };

  const handleDelete = async (entry) => {
    try {
      await deleteDirectoryEntry(entry.id, entry.iconName);
      message.success('Directory entry deleted successfully');
      fetchEntries();
    } catch (error) {
      message.error('Failed to delete directory entry');
    }
  };

  const handleModalOk = () => {
    form.validateFields().then(async values => {
      try {
        const entryData = {
          name: values.name,
          phoneNumber: values.phoneNumber,
          category: values.category,
          description: values.description
        };
        
        if (uploadedIconName) {
          entryData.iconName = uploadedIconName;
        }
        
        if (editingEntry && editingEntry.iconUrl && !iconFileList[0]?.originFileObj) {
          entryData.iconUrl = editingEntry.iconUrl;
        }
        
        const iconFile = iconFileList.length > 0 && iconFileList[0].originFileObj ? iconFileList[0].originFileObj : null;
        
        if (editingEntry) {
          await updateDirectoryEntry(editingEntry.id, entryData, iconFile);
          message.success('Directory entry updated successfully');
        } else {
          await addDirectoryEntry(entryData, iconFile);
          message.success('Directory entry added successfully');
        }
        
        setIsModalVisible(false);
        fetchEntries();
      } catch (error) {
        console.error("Error saving directory entry:", error);
        message.error('Failed to save directory entry');
      }
    });
  };

  const handleIconChange = info => {
    let newFileList = [...info.fileList];
    
    newFileList = newFileList.slice(-1);
    
    if (newFileList.length > 0 && newFileList[0].status !== 'error') {
      const originalFile = newFileList[0].originFileObj;
      const timestamp = Date.now();
      const uniqueFileName = `directory_icon_${timestamp}_${originalFile.name}`;
      
      setIconFileList([{
        ...newFileList[0],
        status: 'done',
        name: uniqueFileName
      }]);
      setUploadedIconName(uniqueFileName);
    }
    
    setIconFileList(newFileList);
  };

  const iconUploadProps = {
    beforeUpload: file => {
      const isImage = file.type.startsWith('image/');
      if (!isImage) {
        message.error('You can only upload image files!');
        return Upload.LIST_IGNORE;
      }
      
      const isLt2M = file.size / 1024 / 1024 < 2;
      if (!isLt2M) {
        message.error('Image must be smaller than 2MB!');
        return Upload.LIST_IGNORE;
      }
      
      return false;
    },
    onChange: handleIconChange,
    fileList: iconFileList,
    maxCount: 1,
    showUploadList: true
  };

  const getCategoryLabel = (categoryValue) => {
    const categories = {
      mental_health: 'Mental Health',
      crisis: 'Crisis',
      academic: 'Academic',
      career: 'Career',
      family: 'Family',
      gender_sexuality: 'Gender and Sexuality',
      relationships: 'Relationships',
      substance_abuse: 'Substance Abuse',
      suicide_prevention: 'Suicide Prevention',
      general: 'General'
    };
    
    return categories[categoryValue] || categoryValue;
  };

  return (
    <PageContainer>
      
      <ActionBar>
        <Button 
          type="primary" 
          icon={<PlusOutlined />}
          onClick={handleAdd}
        >
          Add Directory Entry
        </Button>
      </ActionBar>
      
      {loading ? (
        <div style={{ textAlign: 'center', padding: '50px' }}>
          <Spin size="large" />
        </div>
      ) : (
        <Table columns={columns} dataSource={entries} rowKey="id" />
      )}
      
      <Modal
        title={editingEntry ? "Edit Directory Entry" : "Add New Directory Entry"}
        open={isModalVisible}
        onOk={handleModalOk}
        onCancel={() => setIsModalVisible(false)}
        width={600}
      >
        <Form
          form={form}
          layout="vertical"
        >
          <Form.Item
            name="name"
            label="Name"
            rules={[{ required: true, message: 'Please enter the name' }]}
          >
            <Input />
          </Form.Item>
          
          <Form.Item
            name="phoneNumber"
            label="Phone Number"
            rules={[{ required: true, message: 'Please enter the phone number' }]}
          >
            <Input prefix={<PhoneOutlined />} />
          </Form.Item>
          
          <Form.Item
            name="category"
            label="Category"
            rules={[{ required: true, message: 'Please select the category' }]}
          >
            <Select>
              <Option value="mental_health">Mental Health</Option>
              <Option value="crisis">Crisis</Option>
              <Option value="academic">Academic</Option>
              <Option value="career">Career</Option>
              <Option value="family">Family</Option>
              <Option value="gender_sexuality">Gender and Sexuality</Option>
              <Option value="relationships">Relationships</Option>
              <Option value="substance_abuse">Substance Abuse</Option>
              <Option value="suicide_prevention">Suicide Prevention</Option>
              <Option value="general">General</Option>
            </Select>
          </Form.Item>
          
          <Form.Item
            name="description"
            label="Description"
            rules={[{ required: true, message: 'Please enter the description' }]}
          >
            <Input.TextArea rows={4} />
          </Form.Item>
        </Form>
      </Modal>
    </PageContainer>
  );
};

export default GuidanceDirectory;
