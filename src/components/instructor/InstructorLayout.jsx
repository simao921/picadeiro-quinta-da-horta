import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { createPageUrl } from '@/utils';
import InstructorSidebar from './InstructorSidebar';

export default function InstructorLayout({ children, currentPage }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const isAuth = await base44.auth.isAuthenticated();
        if (!isAuth) {
          window.location.href = createPageUrl('Home');
          return;
        }
        const userData = await base44.auth.me();
        setUser(userData);
      } catch (error) {
        console.error('Auth error:', error);
        window.location.href = createPageUrl('Home');
      } finally {
        setLoading(false);
      }
    };
    checkAuth();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-stone-50">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-[#B8956A] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-stone-600">A carregar...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-stone-50">
      <InstructorSidebar currentPage={currentPage} collapsed={collapsed} setCollapsed={setCollapsed} />
      <main className={`flex-1 overflow-auto transition-all duration-500 ${collapsed ? 'ml-16' : 'ml-52'}`}>
        {children}
      </main>
    </div>
  );
}