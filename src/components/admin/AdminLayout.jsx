import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { createPageUrl } from '@/utils';
import AdminSidebar from './AdminSidebar';
import { cn } from '@/lib/utils';

export default function AdminLayout({ children, currentPage }) {
  const [user, setUser] = useState(null);
  const [collapsed, setCollapsed] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAdmin = async () => {
      try {
        console.log('Checking admin authentication...');
        const isAuth = await base44.auth.isAuthenticated();
        console.log('Is authenticated:', isAuth);
        if (!isAuth) {
          console.log('Not authenticated, redirecting to AdminLogin');
          window.location.href = createPageUrl('AdminLogin');
          return;
        }
        const userData = await base44.auth.me();
        console.log('User data:', userData);
        if (userData.role !== 'admin') {
          window.location.href = createPageUrl('Home');
          return;
        }
        setUser(userData);
      } catch (e) {
        window.location.href = createPageUrl('AdminLogin');
      } finally {
        setLoading(false);
      }
    };
    checkAdmin();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-stone-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#4A5D23]"></div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-stone-50 via-stone-100 to-stone-50">
      <AdminSidebar 
        currentPage={currentPage} 
        collapsed={collapsed} 
        setCollapsed={setCollapsed} 
      />
      <main className={cn(
        "transition-all duration-500",
        collapsed ? "ml-16" : "ml-52"
      )}>
        <div className="p-6 max-w-[1800px] mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}