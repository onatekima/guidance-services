import React, { useState } from 'react';
import styled from 'styled-components';
import { 
  Typography, 
  Form, 
  Input, 
  Button, 
  Divider, 
  message,
  Modal,
  Alert
} from 'antd';
import { 
  UserOutlined, 
  LockOutlined,
  MailOutlined,
  IdcardOutlined
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { loginUser, sendPasswordResetEmail, registerStudent } from '../firebase/auth';
import { useAuth } from '../context/AuthContext';
import philscaLogo from '../assets/images/philsca.png';

const { Title, Text, Paragraph } = Typography;

const PageContainer = styled.div`
  width: 100%;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
`;

const HeaderContainer = styled.div`
  display: flex;
  justify-content: space-between;
  padding: 16px;
  border-bottom: 1px solid ${props => props.theme.colors.border};
  align-items: center;
  position: sticky;
  top: 0;
  z-index: 100;
  background-color: white;
  
  @media (max-width: ${props => props.theme.breakpoints.md}) {
    flex-direction: column;
    gap: 16px;
  }
`;

const LogoContainer = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
`;

const LogoImage = styled.img`
  height: 40px;
  width: auto;
`;

const Logo = styled.div`
  font-size: 24px;
  font-weight: bold;
  color: ${props => props.theme.colors.primary};
`;

const LoginFormHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 16px;
  
  @media (max-width: ${props => props.theme.breakpoints.md}) {
    flex-direction: column;
    width: 100%;
  }
`;

const HeaderForm = styled(Form)`
  display: flex;
  align-items: center;
  gap: 8px;
  
  @media (max-width: ${props => props.theme.breakpoints.md}) {
    flex-direction: column;
    width: 100%;
    
    .ant-form-item {
      margin-bottom: 8px;
      width: 100%;
    }
    
    .ant-input-affix-wrapper {
      width: 100%;
    }
  }
`;

const HeaderFormItem = styled(Form.Item)`
  margin-bottom: 0;
`;

const HeaderLinks = styled.div`
  display: flex;
  gap: 16px;
  
  @media (max-width: ${props => props.theme.breakpoints.md}) {
    width: 100%;
    justify-content: space-between;
  }
`;

const LoginLink = styled.a`
  color: ${props => props.theme.colors.primary};
  cursor: pointer;
  
  &:hover {
    text-decoration: underline;
  }
`;

const MainContainer = styled.div`
  display: flex;
  flex: 1;
  height: calc(100vh - 64px);
  
  @media (max-width: ${props => props.theme.breakpoints.md}) {
    flex-direction: column;
    height: auto;
  }
`;

const PhotoSection = styled.div`
  flex: 1;
  position: sticky;
  top: 64px;
  height: calc(100vh - 64px);
  background-image: url('https://placehold.co/800x600/1677ff/ffffff?text=Campus+Photo');
  background-size: cover;
  background-position: center;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1;
  
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.5);
  }
  
  @media (max-width: ${props => props.theme.breakpoints.md}) {
    position: relative;
    top: 0;
    min-height: 50vh;
    height: auto;
  }
`;

const PhotoOverlayText = styled.div`
  position: relative;
  z-index: 1;
  color: white;
  text-align: center;
  padding: 20px;
  max-width: 80%;
`;

const InfoSection = styled.div`
  flex: 1;
  background-color: #f0f0f0;
  padding: 24px;
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow-y: auto;
  
  @media (max-width: ${props => props.theme.breakpoints.md}) {
    height: auto;
  }
`;

const InfoTitle = styled(Title)`
  margin-bottom: 24px !important;
`;

const InfoBlock = styled.div`
  margin-bottom: 24px;
`;

const StyledForm = styled(Form)`
  width: 100%;
`;

const ErrorContainer = styled.div`
  margin-bottom: 16px;
`;

const NewLogin = () => {
  const [loginForm] = Form.useForm();
  const [registerForm] = Form.useForm();
  const [forgotForm] = Form.useForm();
  const navigate = useNavigate();
  const { setCurrentUser } = useAuth();
  
  const [loading, setLoading] = useState(false);
  const [registerModalVisible, setRegisterModalVisible] = useState(false);
  const [forgotModalVisible, setForgotModalVisible] = useState(false);
  const [registerLoading, setRegisterLoading] = useState(false);
  const [forgotLoading, setForgotLoading] = useState(false);
  
  const [loginError, setLoginError] = useState('');
  const [registerError, setRegisterError] = useState('');
  const [forgotError, setForgotError] = useState('');
  const [forgotSuccess, setForgotSuccess] = useState(false);
  
  const handleLogin = async (values) => {
    setLoading(true);
    setLoginError('');
    
    try {
      const result = await loginUser(values.studentId, values.password);
      
      const userObject = {
        uid: result.user.uid,
        studentId: result.profile.studentId,
        firstName: result.profile.firstName,
        lastName: result.profile.lastName,
        email: result.profile.email,
        role: result.profile.role,
        name: `${result.profile.firstName} ${result.profile.lastName}`
      };
      
      localStorage.setItem('currentUser', JSON.stringify(userObject));
      
      if (setCurrentUser) {
        setCurrentUser(userObject);
      }
      
      message.success('Login successful!');
      
      if (result.profile.role === 'guidance') {
        navigate('/guidance');
      } else {
        navigate('/');
      }
    } catch (error) {
      console.error("Login error:", error);
      setLoginError(error.message || 'Invalid student ID or password. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  const handleRegister = async (values) => {
    setRegisterLoading(true);
    setRegisterError('');
    
    try {
      await registerStudent({
        studentId: values.studentId,
        firstName: values.firstName,
        lastName: values.lastName,
        email: values.email,
        password: values.password
      });
      
      message.success('Registration successful! Please log in.');
      setRegisterModalVisible(false);
      registerForm.resetFields();
    } catch (error) {
      console.error("Registration error:", error);
      setRegisterError(error.message || 'Registration failed. Please try again.');
    } finally {
      setRegisterLoading(false);
    }
  };
  
  const handleForgotPassword = async (values) => {
    setForgotLoading(true);
    setForgotError('');
    setForgotSuccess(false);
    
    try {
      await sendPasswordResetEmail(values.email);
      setForgotSuccess(true);
      forgotForm.resetFields();
    } catch (error) {
      console.error("Password reset error:", error);
      setForgotError(error.message || 'Failed to send password reset email. Please try again.');
    } finally {
      setForgotLoading(false);
    }
  };
  
  return (
    <PageContainer>
      <HeaderContainer>
        <LogoContainer>
          <LogoImage src={philscaLogo} alt="PhilSCA Logo" />
          <Logo>GUIDANCE SERVICES</Logo>
        </LogoContainer>
        
        <LoginFormHeader>
          <HeaderForm
            form={loginForm}
            name="headerLogin"
            layout="inline"
            onFinish={handleLogin}
          >
            <HeaderFormItem
              name="studentId"
              rules={[{ required: true, message: 'Required' }]}
            >
              <Input 
                prefix={<UserOutlined />} 
                placeholder="Username" 
              />
            </HeaderFormItem>
            
            <HeaderFormItem
              name="password"
              rules={[{ required: true, message: 'Required' }]}
            >
              <Input.Password 
                prefix={<LockOutlined />} 
                placeholder="Password" 
              />
            </HeaderFormItem>
            
            <HeaderFormItem>
              <Button 
                type="primary" 
                htmlType="submit" 
                loading={loading}
              >
                Log in
              </Button>
            </HeaderFormItem>
          </HeaderForm>
          
          <HeaderLinks>
            <LoginLink onClick={() => setRegisterModalVisible(true)}>
              Register
            </LoginLink>
            <LoginLink onClick={() => setForgotModalVisible(true)}>
              Forgot Password
            </LoginLink>
          </HeaderLinks>
        </LoginFormHeader>
      </HeaderContainer>
      
      {loginError && (
        <Alert 
          message={loginError} 
          type="error" 
          showIcon 
          closable
          style={{ margin: '0 16px' }}
          onClose={() => setLoginError('')}
        />
      )}
      
      <MainContainer>
        <PhotoSection>
          <PhotoOverlayText>
            <Title level={2} style={{ color: 'white' }}>
              GUIDANCE SERVICES MANAGEMENT USING WEB-BASED SYSTEM
            </Title>
          </PhotoOverlayText>
        </PhotoSection>
        
        <InfoSection>
          <InfoBlock>
            <Title level={3}>About Us</Title>
            <Title level={4}>History</Title>
            <Paragraph>
              <Title level={5}>Former Names</Title>
                <p>Basa Air Base Community College (June 1969 to January 26, 1977)</p>
                <p>Philippine Air Force College of Aeronautics (January 26, 1977 to June 3, 1992)</p>
                <p>Philippine State College of Aeronautics (June 3, 1992 - Present)</p>
              <Title level={5}>Campuses</Title>
              <p>PhilSCA - Villamor, Pasay City</p>
              <p>PhilSCA - FAB, Lipa-Batangas</p>
              <p>PhilSCA - BAB, Pampanga</p>
              <p>*With extension campus in Palmayo, Floridablanca</p>
              <p>MBEAB, Mactan-Cebu</p>
              <p>*With extension campus in Medellin, Cebu</p>
            </Paragraph>
            <Paragraph>
              PhilSCA was established as Basa Air Base Community College (BABCC) on 1 April 1968 through AFP Regulation G.168-342 and was approved to operate by the Department of Education and Culture on 23 April 1969 (Founding Anniversary)
            </Paragraph>
            <Paragraph>
              PD 1078 – An Act Converting the Basa Air Base Community College into Philippine
            </Paragraph>
            <Paragraph>
              Air Force College of Aeronautics (PAFCA) signed 26 January 1977.            
            </Paragraph>
            <Paragraph>
              RA 7605 – An Act Converting the Philippine Air Force College of Aeronautics into a
              State College to be known as Philippine State College of Aeronautics signed 3 June
              1992 (Charter Day).
            </Paragraph>
            <Paragraph>
              Initially the college came into existence as a result of an extreme necessity to solve a
              military problem plaguing the 5 Fighter Wing (the premier jet fighter unit of the
              Philippine Air Force) located in the terminal town of Floridablanca, Pampanga. The
              nearest town the community offering the secondary and tertiary level of education at
              that time is located in the town of Guagua, Pampanga which involved travel of
              seventeen (17) kilometers of rough roads from the Air Base. Travel is dangerous then
              because Basa Air Base in the midst of Huklandia (NPA). The 5th Fighter Wing is the
              only unit of the Philippine Air Force (PAF) handling jet fighter aircraft, and its highly
              skilled personnel cannot be transferred to the other Bases of (PAF) where the
              government can use them without wasting heavy investment in their training abroad.
              Request for the transfer and application for discharge among the military personnel
              were frequent because they and their children were desirous of pursuing higher
              education, had to go to elsewhere because there was no secondary available
              education with the vicinity. After repeated request to the DECS, the invitations to
              private sectors to establish a tertiary level education failed. The community pooled
              their resource to comply substantially with the initial requirements of the bureau of
              Public Schools and established a community schools. The base authorities repaired
              a dilapidated building to temporary classrooms, and extended the use of other
              facilities including their training aids and apparatus
            </Paragraph>
            <Paragraph>
              On 1977, President Marcos signed Presidential Decree No. 1078 converting Basa Air
              Base Community College to Philippine Air Force College of Aeronautics with its main
              campus in Villamor Air Base, Pasay City, Metro Manila. Although with state college
              status, its charter did not provide for government subsidy as it was considered as a
              non-profit and non-stock educational institution. Aside from Villamor Air Base and
              Basa Air Base, additional campuses was also created in Sangley Air Base, Fernando
              Air Base, and Mactan Air Base. During this period, it was envisioned by Philippine Air
              Force authorities to be the Philippine Air Force Academy to solve its problem in the
              procurement and training of its officer pilots through the merging of the Philippine
              Air Force Flying School and the Philippine Air Force Regular Officer Procurement
              Program. President Corazon C. Aquino approved the Republic Act No. 7605
              converting Philippine Air Force College of Aeronautics to Philippine State College of
              Aeronautics. In 1994, its Board of Trustees approved the creation of its own flight
              school that will train students for private pilot and commercial pilot.
            </Paragraph>
            <Paragraph>
              In 1997, it acquired its first trainer plane — a Tampico STB9-C aircraft (RP 2200)
              which was donated by Senator Raul Roco from his country-wide development fund
              and another Tampico STB9-C aircraft (RP 2204) was purchased for P10 million from
              PhilSCA Development Fund on June 3, 1992.
            </Paragraph>
            <Paragraph>
              The original location of PhilSCA was located in Manlunas St. in Villamor Air Base,
              Pasay City (currently Newport City) but due to the Bases Conversion Development
              Authority (BCDA), the portion of Villamor Air Base bought to the Megaworld
              Corporation.
            </Paragraph>
            <Paragraph>
              Legal Mandate
            </Paragraph>
            <Paragraph>
              (1987 Philippine Constitution)
            </Paragraph>
            <Paragraph>
              “the STATE shall give priority to education to foster patriotism and nationalism,
              accelerate social progress, and promote total human liberation and development”
            </Paragraph>
            <Paragraph>
              “the STATE shall protect and promote the right of all citizens to quality education at
              all levels and shall take appropriate steps to make such education accessible to all”
            </Paragraph>
            <Paragraph>
              (RA 7605 (Sec 2))
            </Paragraph>
            <Paragraph>
              “The College shall provide professional and advanced technical and technological
              instruction and training in the preparatory field of aeronautics and the liberal arts
              courses.”
            </Paragraph>

          </InfoBlock>
          
          <InfoBlock>
            <Title level={3}>MISSION</Title>
            <Paragraph>
              Philsca continues to produce world-class professionals in the aviation industry
              through quality instruction, research, extension, resource management and industry
              partnership
            </Paragraph>
          </InfoBlock>
          
          <InfoBlock>
            <Title level={3}>VISION</Title>
            <Paragraph>
              A leading higher educational institution in aviation sciences with a balanced liberal
              arts and technology.
            </Paragraph>
          </InfoBlock>

          <InfoBlock>
            <Title level={3}>CORE VALUES</Title>
            <Paragraph>
              <ul>
                <li>Integrity</li>
                <li>Academic Excellence</li>
                <li>Community &</li>
                <li>Industry Centric</li>
              </ul>
            </Paragraph>
          </InfoBlock>

          <InfoBlock>
            <Title level={3}>GOALS & OBJECTIVES</Title>
            <Paragraph>
              The programs and objectives of the College shall be undertaken in such a manner as to reflect its aspiration to be the center for:
              <ul style={{ listStyle: 'none' }}>
                <li>(a) professional and advanced technical training in the field of aeronautics and liberal arts;</li>
                <li>(b) research and advanced studies, and</li>
                <li>(c) progressive leadership in its field of specialization as mandated by its charter</li>
              </ul>
              In view of the above, the college shall strive to implement programs and projects thatshall:
              <ul style={{ listStyle: 'none' }}>
                <li>1. transmit and disseminate knowledge and skills relevant to the manpower needs of the country;</li>
                <li>2. discover and disseminate new knowledge/technology needed for the development of the country; </li>
                <li>3. enhance, preserve and disseminate national culture and sports; and produce progressive leaders, trained,skilled and semi-skilled manpower for national development.</li>
              </ul>
            </Paragraph>
          </InfoBlock>
        </InfoSection>
      </MainContainer>
      
      {/* Registration Modal */}
      <Modal
        title="Create Your Account"
        open={registerModalVisible}
        onCancel={() => {
          setRegisterModalVisible(false);
          setRegisterError('');
        }}
        footer={null}
        width={500}
      >
        {registerError && (
          <ErrorContainer>
            <Alert message={registerError} type="error" showIcon />
          </ErrorContainer>
        )}
        
        <StyledForm
          form={registerForm}
          name="register"
          layout="vertical"
          onFinish={handleRegister}
        >
          <Form.Item
            name="studentId"
            label="Student ID"
            rules={[[{ required: true, message: 'Please enter your student ID' },
              { pattern: /^\d{5}MN-\d{6}$/, message: 'Please use proper format (e.g., 11718MN-012140)' }]]}
          >
            <Input 
              prefix={<IdcardOutlined />} 
              placeholder="Enter your student ID (this will be your username)" 
            />
          </Form.Item>
          
          <Form.Item
            name="firstName"
            label="First Name"
            rules={[{ required: true, message: 'Please enter your first name' }]}
          >
            <Input 
              prefix={<UserOutlined />} 
              placeholder="Enter your first name" 
            />
          </Form.Item>
          
          <Form.Item
            name="lastName"
            label="Last Name"
            rules={[{ required: true, message: 'Please enter your last name' }]}
          >
            <Input 
              prefix={<UserOutlined />} 
              placeholder="Enter your last name" 
            />
          </Form.Item>
          
          <Form.Item
            name="email"
            label="Email"
            rules={[[{ required: true, message: 'Please enter your email' },
              { type: 'email', message: 'Please enter a valid email' }]]}
          >
            <Input 
              prefix={<MailOutlined />} 
              placeholder="Enter your email" 
            />
          </Form.Item>
          
          <Form.Item
            name="password"
            label="Password"
            rules={[[{ required: true, message: 'Please enter your password' },
              { min: 8, message: 'Password must be at least 8 characters' }]]}
          >
            <Input.Password 
              prefix={<LockOutlined />} 
              placeholder="Create a password" 
            />
          </Form.Item>
          
          <Form.Item
            name="confirmPassword"
            label="Confirm Password"
            dependencies={['password']}
            rules={[[{ required: true, message: 'Please confirm your password' },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || getFieldValue('password') === value) {
                    return Promise.resolve();
                  }
                  return Promise.reject(new Error('The two passwords do not match'));
                },
              })]]}
          >
            <Input.Password 
              prefix={<LockOutlined />} 
              placeholder="Confirm your password" 
            />
          </Form.Item>
          
          <Form.Item>
            <Button 
              type="primary" 
              htmlType="submit" 
              loading={registerLoading}
              block
            >
              Create Account
            </Button>
          </Form.Item>
        </StyledForm>
      </Modal>
      
      {/* Forgot Password Modal */}
      <Modal
        title="Reset Your Password"
        open={forgotModalVisible}
        onCancel={() => {
          setForgotModalVisible(false);
          setForgotError('');
          setForgotSuccess(false);
        }}
        footer={null}
      >
        {forgotError && (
          <ErrorContainer>
            <Alert message={forgotError} type="error" showIcon />
          </ErrorContainer>
        )}
        
        {forgotSuccess ? (
          <div>
            <Alert 
              message="Password Reset Email Sent" 
              description="Please check your email for instructions to reset your password." 
              type="success" 
              showIcon 
              style={{ marginBottom: '16px' }}
            />
            <Button 
              type="primary" 
              onClick={() => {
                setForgotModalVisible(false);
                setForgotSuccess(false);
              }}
              block
            >
              Return to Login
            </Button>
          </div>
        ) : (
          <StyledForm
            form={forgotForm}
            name="forgotPassword"
            layout="vertical"
            onFinish={handleForgotPassword}
          >
            <Form.Item
              name="email"
              label="Email Address"
              rules={[[{ required: true, message: 'Please enter your email address' },
                { type: 'email', message: 'Please enter a valid email address' }]]}
            >
              <Input 
                prefix={<MailOutlined />} 
                placeholder="Enter your email address" 
              />
            </Form.Item>
            
            <Form.Item>
              <Button 
                type="primary" 
                htmlType="submit" 
                loading={forgotLoading}
                block
              >
                Send Reset Link
              </Button>
            </Form.Item>
          </StyledForm>
        )}
      </Modal>
    </PageContainer>
  );
};

export default NewLogin;
