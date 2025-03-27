import { createGuidanceCounselor } from '../firebase/auth';

// Function to create the guidance counselor account
const createCounselor = async () => {
  try {
    const counselorData = {
      email: 'guidance-counselor@example.com', // Using an email format since Firebase requires email for auth
      password: 'Guidance1234',
      firstName: 'Guidance',
      lastName: 'Counselor'
    };
    
    const user = await createGuidanceCounselor(counselorData);
    console.log('Guidance counselor created successfully:', user);
    return user;
  } catch (error) {
    console.error('Error creating guidance counselor:', error);
    throw error;
  }
};

// Execute the function
createCounselor();
