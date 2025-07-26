// This page redirects to login - not used in the app structure
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const Index = () => {
  const navigate = useNavigate();
  
  useEffect(() => {
    navigate('/login');
  }, [navigate]);

  return null;
};

export default Index;
