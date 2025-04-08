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
  Image
} from 'antd';
import { 
  PlusOutlined, 
  EditOutlined, 
  DeleteOutlined,
  LinkOutlined,
  FileOutlined,
  UploadOutlined,
  PictureOutlined
} from '@ant-design/icons';
import { 
  getResources, 
  addResource, 
  updateResource, 
  deleteResource 
} from '../../firebase/resourcesService';

const { Title } = Typography;
const { Option } = Select;
const { TextArea } = Input;

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

const ResourceTypeTag = styled.span`
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 12px;
  background-color: ${props => props.color || props.theme.colors.primary};
  color: white;
`;

const StyledUpload = styled(Upload)`
  .ant-upload-list-item {
    margin-top: 8px;
  }
`;

const ResourceImage = styled(Image)`
  max-width: 100px;
  max-height: 60px;
  object-fit: cover;
`;

const GuidanceResources = () => {
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [form] = Form.useForm();
  const [editingResource, setEditingResource] = useState(null);
  const [resources, setResources] = useState([]);
  const [loading, setLoading] = useState(true);
  const [resourceType, setResourceType] = useState('article');
  const [fileList, setFileList] = useState([]);
  const [imageFileList, setImageFileList] = useState([]);
  const [uploadedFileName, setUploadedFileName] = useState('');
  const [uploadedImageName, setUploadedImageName] = useState('');

  useEffect(() => {
    fetchResources();
  }, []);

  const fetchResources = async () => {
    try {
      setLoading(true);
      const data = await getResources();
      setResources(data);
    } catch (error) {
      message.error('Failed to fetch resources');
    } finally {
      setLoading(false);
    }
  };

  const columns = [
    {
      title: 'Image',
      dataIndex: 'imageUrl',
      key: 'imageUrl',
      width: 120,
      render: (imageUrl) => imageUrl ? <ResourceImage src={imageUrl} alt="Resource" /> : '-',
    },
    {
      title: 'Title',
      dataIndex: 'title',
      key: 'title',
    },
    {
      title: 'Category',
      dataIndex: 'category',
      key: 'category',
      render: (category) => getCategoryLabel(category),
    },
    {
      title: 'Type',
      dataIndex: 'type',
      key: 'type',
      render: (type) => {
        const color = type === 'article' ? '#1890ff' : '#52c41a';
        const icon = type === 'article' ? <LinkOutlined /> : <FileOutlined />;
        return (
          <ResourceTypeTag color={color}>
            {icon} {type.charAt(0).toUpperCase() + type.slice(1)}
          </ResourceTypeTag>
        );
      }
    },
    {
      title: 'Date Added',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (date) => date ? new Date(date.toDate()).toLocaleDateString() : 'N/A',
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
            title="Are you sure you want to delete this resource?"
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
    setEditingResource(null);
    form.resetFields();
    setFileList([]);
    setImageFileList([]);
    setUploadedFileName('');
    setUploadedImageName('');
    setResourceType('article');
    setIsModalVisible(true);
  };

  const handleEdit = (resource) => {
    setEditingResource(resource);
    setResourceType(resource.type);
    setUploadedFileName(resource.fileName || '');
    setUploadedImageName(resource.imageName || '');
    
    form.setFieldsValue({
      title: resource.title,
      category: resource.category,
      type: resource.type,
      description: resource.description,
      url: resource.url
    });
    
    if (resource.fileName && resource.type === 'pdf') {
      setFileList([
        {
          uid: '-1',
          name: resource.fileName,
          status: 'done',
          url: resource.fileUrl
        },
      ]);
    } else {
      setFileList([]);
    }
    
    if (resource.imageUrl) {
      setImageFileList([
        {
          uid: '-1',
          name: resource.imageName || 'image',
          status: 'done',
          url: resource.imageUrl
        },
      ]);
    } else {
      setImageFileList([]);
    }
    
    setIsModalVisible(true);
  };

  const handleDelete = async (resource) => {
    try {
      await deleteResource(
        resource.id, 
        resource.type === 'pdf' ? resource.fileName : null,
        resource.imageName
      );
      message.success('Resource deleted successfully');
      fetchResources();
    } catch (error) {
      message.error('Failed to delete resource');
    }
  };

  const handleModalOk = () => {
    form.validateFields().then(async values => {
      try {
        const resourceData = {
          title: values.title,
          category: values.category,
          type: values.type,
          description: values.description
        };

        if (values.type === 'article') {
          resourceData.url = values.url;
          resourceData.fileUrl = null;
        } 
        else if (values.type === 'pdf') {
          resourceData.fileName = uploadedFileName;
          if (editingResource && editingResource.fileUrl && !fileList[0]?.originFileObj) {
            resourceData.fileUrl = editingResource.fileUrl;
          }
        }
        
        if (uploadedImageName) {
          resourceData.imageName = uploadedImageName;
        }
        
        if (editingResource && editingResource.imageUrl && !imageFileList[0]?.originFileObj) {
          resourceData.imageUrl = editingResource.imageUrl;
        }
        
        const file = fileList.length > 0 && fileList[0].originFileObj ? fileList[0].originFileObj : null;
        const imageFile = imageFileList.length > 0 && imageFileList[0].originFileObj ? imageFileList[0].originFileObj : null;
        
        if (editingResource) {
          await updateResource(editingResource.id, resourceData, file, imageFile);
          message.success('Resource updated successfully');
        } else {
          await addResource(resourceData, file, imageFile);
          message.success('Resource added successfully');
        }
        
        setIsModalVisible(false);
        fetchResources();
      } catch (error) {
        console.error("Error saving resource:", error);
        message.error('Failed to save resource');
      }
    });
  };

  const handleTypeChange = (value) => {
    setResourceType(value);
    form.setFieldsValue({ url: undefined });
    setFileList([]);
    setUploadedFileName('');
  };

  const getCategoryLabel = (categoryValue) => {
    const categories = {
      mental_health: 'Mental Health',
      academic: 'Academic',
      career: 'Career',
      family: 'Family',
      crisis: 'Crisis',
      gender_sexuality: 'Gender and Sexuality',
      relationships: 'Relationships',
      stress: 'Stress',
      anxiety: 'Anxiety',
      depression: 'Depression',
      mindfulness: 'Mindfulness',
      productivity: 'Productivity'
    };
    
    return categories[categoryValue] || categoryValue;
  };

  const handleFileChange = info => {
    let fileList = [...info.fileList];
    
    fileList = fileList.slice(-1);
    
    if (fileList.length > 0 && fileList[0].status !== 'error') {
      const originalFile = fileList[0].originFileObj;
      const timestamp = Date.now();
      const uniqueFileName = `resource_${timestamp}_${originalFile.name}`;
      
      setFileList([{
        ...fileList[0],
        status: 'done',
        name: uniqueFileName
      }]);
      setUploadedFileName(uniqueFileName);
    }
    
    setFileList(fileList);
  };

  const handleImageChange = info => {
    let newFileList = [...info.fileList];
    
    newFileList = newFileList.slice(-1);
    
    if (newFileList.length > 0 && newFileList[0].status !== 'error') {
      const originalFile = newFileList[0].originFileObj;
      const timestamp = Date.now();
      const uniqueFileName = `resource_image_${timestamp}_${originalFile.name}`;
      
      setImageFileList([{
        ...newFileList[0],
        status: 'done',
        name: uniqueFileName
      }]);
      setUploadedImageName(uniqueFileName);
    }
    
    setImageFileList(newFileList);
  };

  const uploadProps = {
    beforeUpload: file => {
      const isPDF = file.type === 'application/pdf';
      if (!isPDF) {
        message.error('You can only upload PDF files!');
        return Upload.LIST_IGNORE;
      }
      return false;
    },
    onChange: handleFileChange,
    fileList,
    maxCount: 1,
    showUploadList: true
  };

  const imageUploadProps = {
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
      
      return false;
    },
    onChange: handleImageChange,
    fileList: imageFileList,
    maxCount: 1,
    showUploadList: true
  };

  return (
    <PageContainer>
      <PageTitle level={2}>Manage Resources</PageTitle>
      
      <ActionBar>
        <Button 
          type="primary" 
          icon={<PlusOutlined />}
          onClick={handleAdd}
        >
          Add Resource
        </Button>
      </ActionBar>
      
      {loading ? (
        <div style={{ textAlign: 'center', padding: '50px' }}>
          <Spin size="large" />
        </div>
      ) : (
        <Table columns={columns} dataSource={resources} rowKey="id" />
      )}
      
      <Modal
        title={editingResource ? "Edit Resource" : "Add New Resource"}
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
            name="title"
            label="Title"
            rules={[{ required: true, message: 'Please enter the title' }]}
          >
            <Input />
          </Form.Item>
          
          <Form.Item
            name="category"
            label="Category"
            rules={[{ required: true, message: 'Please select the category' }]}
          >
            <Select>
              <Option value="mental_health">Mental Health</Option>
              <Option value="academic">Academic</Option>
              <Option value="career">Career</Option>
              <Option value="family">Family</Option>
              <Option value="crisis">Crisis</Option>
              <Option value="gender_sexuality">Gender and Sexuality</Option>
              <Option value="relationships">Relationships</Option>
              <Option value="stress">Stress</Option>
              <Option value="anxiety">Anxiety</Option>
              <Option value="depression">Depression</Option>
              <Option value="mindfulness">Mindfulness</Option>
              <Option value="productivity">Productivity</Option>
            </Select>
          </Form.Item>
          
          <Form.Item
            name="type"
            label="Type"
            rules={[{ required: true, message: 'Please select the type' }]}
          >
            <Select onChange={handleTypeChange}>
              <Option value="article">Article/External Link</Option>
              <Option value="pdf">PDF Document</Option>
            </Select>
          </Form.Item>
          
          <Form.Item
            name="description"
            label="Description"
            rules={[{ required: true, message: 'Please enter the description' }]}
          >
            <TextArea rows={4} />
          </Form.Item>
          
          {resourceType === 'article' ? (
            <Form.Item
              name="url"
              label="URL"
              rules={[{ required: true, message: 'Please enter the URL' }, { type: 'url', message: 'Please enter a valid URL' }]}
            >
              <Input prefix={<LinkOutlined />} placeholder="https://example.com" />
            </Form.Item>
          ) : (
            <Form.Item
              name="pdfFile"
              label="PDF File"
              rules={[{ required: !editingResource?.fileName, message: 'Please upload a PDF file' }]}
            >
              <StyledUpload {...uploadProps}>
                <Button icon={<UploadOutlined />}>
                  {fileList.length > 0 ? 'Replace File' : 'Upload PDF'}
                </Button>
              </StyledUpload>
            </Form.Item>
          )}
          
          <Form.Item
            name="image"
            label="Resource Image (Optional)"
          >
            <StyledUpload {...imageUploadProps} listType="picture">
              <Button icon={<PictureOutlined />}>
                {imageFileList.length > 0 ? 'Replace Image' : 'Upload Image'}
              </Button>
            </StyledUpload>
          </Form.Item>
        </Form>
      </Modal>
    </PageContainer>
  );
};

export default GuidanceResources;
