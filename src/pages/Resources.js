import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { 
  Typography, 
  Row, 
  Col, 
  Card, 
  Input, 
  Select, 
  Empty, 
  Tag, 
  Spin, 
  Button,
  message 
} from 'antd';
import { 
  SearchOutlined, 
  FileTextOutlined, 
  FilePdfOutlined, 
  LinkOutlined,
  DownloadOutlined,
  EyeOutlined
} from '@ant-design/icons';
import { getResources } from '../firebase/resourcesService';

const { Title, Paragraph } = Typography;
const { Search } = Input;
const { Option } = Select;

const PageContainer = styled.div`
  width: 100%;
`;

const PageTitle = styled(Title)`
  margin-bottom: 24px !important;
`;

const FilterContainer = styled.div`
  display: flex;
  gap: 16px;
  margin-bottom: 24px;
  flex-wrap: wrap;
  
  @media (max-width: ${props => props.theme.breakpoints.md}) {
    flex-direction: column;
  }
`;

const ResourceCard = styled(Card)`
  height: 100%;
  transition: all 0.3s;
  
  &:hover {
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    transform: translateY(-4px);
  }
`;

const ResourceIcon = styled.div`
  font-size: 24px;
  margin-bottom: 16px;
  color: ${props => props.theme.colors.primary};
`;

const ResourceType = styled(Tag)`
  margin-bottom: 8px;
`;

const LoadingContainer = styled.div`
  text-align: center;
  padding: 50px;
`;

const ResourceImage = styled.img`
  width: 100%;
  height: 140px;
  object-fit: cover;
  border-radius: 4px;
`;

const ResourceContent = styled.div`
  display: flex;
  flex-direction: row;
  gap: 16px;
`;

const ResourceDetails = styled.div`
  flex: 1;
`;

const ResourceImageContainer = styled.div`
  width: 140px;
  
  @media (max-width: ${props => props.theme.breakpoints.sm}) {
    display: none;
  }
`;

const ResourcesPage = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState('all');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [resources, setResources] = useState([]);
  const [loading, setLoading] = useState(true);

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

  const getResourceIcon = (type) => {
    switch(type) {
      case 'article':
        return <LinkOutlined />;
      case 'pdf':
        return <FilePdfOutlined />;
      default:
        return <FileTextOutlined />;
    }
  };

  const getTypeColor = (type) => {
    switch(type) {
      case 'article':
        return 'blue';
      case 'pdf':
        return 'red';
      default:
        return 'default';
    }
  };

  const handleResourceAction = (resource) => {
    if (resource.type === 'article' && resource.url) {
      window.open(resource.url, '_blank');
    } else if (resource.type === 'pdf' && resource.fileUrl) {
      // Open the PDF file from Supabase Storage
      window.open(resource.fileUrl, '_blank');
    }
  };

  const filteredResources = resources.filter(resource => {
    const matchesSearch = resource.title?.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         resource.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = selectedType === 'all' || resource.type === selectedType;
    const matchesCategory = selectedCategory === 'all' || resource.category === selectedCategory;
    
    return matchesSearch && matchesType && matchesCategory;
  });

  const getCategoryLabel = (categoryValue) => {
    const categories = {
      mental_health: 'Mental Health',
      academic: 'Academic',
      career: 'Career',
      relationships: 'Relationships',
      stress: 'Stress',
      anxiety: 'Anxiety',
      depression: 'Depression',
      mindfulness: 'Mindfulness',
      productivity: 'Productivity'
    };
    
    return categories[categoryValue] || categoryValue;
  };

  return (
    <PageContainer>
      <PageTitle level={2}>Mental Health Resources</PageTitle>
      
      <Paragraph>
        Explore our collection of resources designed to support your mental well-being. 
        From articles and videos to comprehensive guides, find the information you need.
      </Paragraph>
      
      <FilterContainer>
        <Search
          placeholder="Search resources"
          allowClear
          enterButton={<SearchOutlined />}
          size="large"
          onSearch={value => setSearchTerm(value)}
          onChange={e => setSearchTerm(e.target.value)}
          style={{ width: '100%', maxWidth: 400 }}
        />
        
        <Select
          placeholder="Resource Type"
          style={{ width: 200 }}
          defaultValue="all"
          onChange={value => setSelectedType(value)}
        >
          <Option value="all">All Types</Option>
          <Option value="article">Articles</Option>
          <Option value="pdf">PDF Documents</Option>
        </Select>
        
        <Select
          placeholder="Category"
          style={{ width: 200 }}
          defaultValue="all"
          onChange={value => setSelectedCategory(value)}
        >
          <Option value="all">All Categories</Option>
          <Option value="mental_health">Mental Health</Option>
          <Option value="academic">Academic</Option>
          <Option value="career">Career</Option>
          <Option value="relationships">Relationships</Option>
          <Option value="stress">Stress</Option>
          <Option value="anxiety">Anxiety</Option>
          <Option value="depression">Depression</Option>
          <Option value="mindfulness">Mindfulness</Option>
          <Option value="productivity">Productivity</Option>
        </Select>
      </FilterContainer>
      
      {loading ? (
        <LoadingContainer>
          <Spin size="large" />
        </LoadingContainer>
      ) : filteredResources.length > 0 ? (
        <Row gutter={[24, 24]}>
          {filteredResources.map(resource => (
            <Col xs={24} sm={12} lg={8} key={resource.id}>
              <ResourceCard
                hoverable
                actions={[
                  <Button 
                    type="link" 
                    icon={resource.type === 'article' ? <EyeOutlined /> : <DownloadOutlined />}
                    onClick={() => handleResourceAction(resource)}
                  >
                    {resource.type === 'article' ? 'View Article' : 'View PDF'}
                  </Button>
                ]}
              >
                <ResourceContent>
                  <ResourceDetails>
                    <ResourceIcon>{getResourceIcon(resource.type)}</ResourceIcon>
                    <ResourceType color={getTypeColor(resource.type)}>
                      {resource.type.charAt(0).toUpperCase() + resource.type.slice(1)}
                    </ResourceType>
                    <Card.Meta
                      title={resource.title}
                      description={
                        <>
                          <div>{resource.description}</div>
                          <Tag color="green" style={{ marginTop: 8 }}>
                            {getCategoryLabel(resource.category)}
                          </Tag>
                        </>
                      }
                    />
                  </ResourceDetails>
                  
                  {resource.imageUrl && (
                    <ResourceImageContainer>
                      <ResourceImage src={resource.imageUrl} alt={resource.title} />
                    </ResourceImageContainer>
                  )}
                </ResourceContent>
              </ResourceCard>
            </Col>
          ))}
        </Row>
      ) : (
        <Empty 
          description="No resources found matching your criteria" 
          image={Empty.PRESENTED_IMAGE_SIMPLE} 
        />
      )}
    </PageContainer>
  );
};

export default ResourcesPage;
