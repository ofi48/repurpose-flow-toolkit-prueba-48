
import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from './Sidebar';
import UserMenu from './UserMenu';
import { useAuth } from '@/contexts/AuthContext';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  
  useEffect(() => {
    // If the user is not authenticated and we've checked the auth state, redirect to login
    if (!loading && !user) {
      navigate('/auth');
    }
  }, [user, loading, navigate]);
  
  // If still loading, show a minimal loading state
  if (loading) {
    return (
      <div className="flex h-screen bg-app-dark text-white items-center justify-center">
        <div className="text-center">
          <p className="text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-app-dark text-white">
      <Sidebar />
      <div className="flex-1 overflow-auto flex flex-col">
        <div className="p-4 border-b border-gray-800 flex justify-end">
          <UserMenu />
        </div>
        <div className="flex-1 overflow-auto">
          {children}
        </div>
      </div>
    </div>
  );
};

export default Layout;
