import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard, Brain, CalendarDays, Users, UserCog,
  Settings, Euro, LogOut, ChevronLeft, Menu, Home, FileText, BarChart3, UserCheck, Ban, Mail, Bell, Image
} from 'lucide-react';
import { Button } from '@/components/ui/button';

const menuItems = [
  { icon: LayoutDashboard, label: 'Dashboard', page: 'AdminDashboard' },
  { icon: Brain, label: 'IA Assistente', page: 'AdminAI' },
  { icon: Mail, label: 'Emails', page: 'AdminEmails' },
  { icon: Bell, label: 'Notificações', page: 'AdminNotifications' },
  { icon: FileText, label: 'Conteúdo', page: 'AdminContent' },
  { icon: Users, label: 'Utilizadores', page: 'AdminUsers' },
  { icon: BarChart3, label: 'Relatórios', page: 'AdminReports' },
  { icon: CalendarDays, label: 'Aulas', page: 'AdminLessons' },
  { icon: Users, label: 'Alunos Site', page: 'AdminStudents' },
  { icon: Users, label: 'Alunos Picadeiro', page: 'AdminPicadeiroStudents' },
  { icon: UserCheck, label: 'Alunos Fixos', page: 'AdminStudentSchedules' },
  { icon: UserCog, label: 'Monitores', page: 'AdminInstructors' },
  { icon: Euro, label: 'Pagamentos', page: 'AdminPayments' },
  { icon: Ban, label: 'Bloqueios', page: 'AdminBlockedSlots' },
  { icon: FileText, label: 'Regulamentos', page: 'AdminRegulations' },
  { icon: Image, label: 'Galeria', page: 'AdminGallery' },
  { icon: Settings, label: 'Definições', page: 'AdminSettings' },
];

export default function AdminSidebar({ currentPage, collapsed, setCollapsed }) {
  return (
    <aside className={cn(
      "fixed left-0 top-0 h-screen bg-gradient-to-br from-[#2C3E1F] via-[#36451D] to-[#2C3E1F] text-white transition-all duration-500 z-40 shadow-2xl border-r border-[#4A5D23]/20",
      collapsed ? "w-16" : "w-52"
    )}>
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="p-4 border-b border-white/10 bg-black/20">
          <div className="flex items-center justify-between">
            {!collapsed && (
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-full bg-white flex items-center justify-center shadow-md p-0.5">
                  <img 
                    src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/695506be843687b2f61b8758/8b9c42396_944BDCD3-BD5F-45A8-A0F7-F73EB7F7BE9B2.PNG" 
                    alt="Logo" 
                    className="w-full h-full object-cover rounded-full"
                  />
                </div>
                <div>
                  <h2 className="font-serif font-bold text-sm text-white">Admin Panel</h2>
                  <p className="text-[10px] text-stone-400">Quinta da Horta</p>
                </div>
              </div>
            )}
            {collapsed && (
              <div className="w-9 h-9 rounded-full bg-white flex items-center justify-center shadow-md p-0.5 mx-auto">
                <img 
                  src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/695506be843687b2f61b8758/8b9c42396_944BDCD3-BD5F-45A8-A0F7-F73EB7F7BE9B2.PNG" 
                  alt="Logo" 
                  className="w-full h-full object-cover rounded-full"
                />
              </div>
            )}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setCollapsed(!collapsed)}
              className={cn(
                "text-white hover:bg-white/10 transition-all duration-300 h-7 w-7",
                collapsed && "mx-auto mt-2"
              )}
            >
              {collapsed ? <Menu className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
            </Button>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto custom-scrollbar">
          {menuItems.map((item) => (
            <Link
              key={item.page}
              to={createPageUrl(item.page)}
              className={cn(
                "flex items-center gap-3 px-3 py-3 rounded-lg transition-all duration-200 group relative",
                currentPage === item.page
                  ? "bg-gradient-to-r from-[#B8956A] to-[#8B7355] text-white shadow-lg border border-white/10"
                  : "text-white/75 hover:bg-white/10 hover:text-white hover:shadow-md"
              )}
            >
              <item.icon className="w-4 h-4 flex-shrink-0" />
              {!collapsed && <span className="text-sm font-medium">{item.label}</span>}
              {collapsed && (
                <div className="absolute left-full ml-2 px-2 py-1 bg-stone-900 text-white text-xs rounded-md whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50 shadow-lg">
                  {item.label}
                </div>
              )}
            </Link>
          ))}
        </nav>
        
        <style>{`
          .custom-scrollbar::-webkit-scrollbar {
            width: 5px;
          }
          .custom-scrollbar::-webkit-scrollbar-track {
            background: rgba(255, 255, 255, 0.02);
            border-radius: 3px;
          }
          .custom-scrollbar::-webkit-scrollbar-thumb {
            background: linear-gradient(135deg, rgba(184, 149, 106, 0.3), rgba(139, 115, 85, 0.3));
            border-radius: 3px;
            transition: all 0.3s ease;
          }
          .custom-scrollbar::-webkit-scrollbar-thumb:hover {
            background: linear-gradient(135deg, rgba(184, 149, 106, 0.5), rgba(139, 115, 85, 0.5));
          }
        `}</style>

        {/* Footer */}
        <div className="p-3 border-t border-white/10 space-y-1 bg-black/20">
          <Link
            to={createPageUrl('Home')}
            className="flex items-center gap-3 px-3 py-3 rounded-lg text-white/75 
                       hover:bg-white/10 hover:text-white transition-all duration-200 group relative hover:shadow-md"
          >
            <Home className="w-4 h-4" />
            {!collapsed && <span className="text-sm font-medium">Ver Site</span>}
            {collapsed && (
              <div className="absolute left-full ml-2 px-2 py-1 bg-stone-900 text-white text-xs rounded-md whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50 shadow-lg">
                Ver Site
              </div>
            )}
          </Link>
          <button
            onClick={() => {
              import('@/api/base44Client').then(({ base44 }) => {
                base44.auth.logout();
              });
            }}
            className="flex items-center gap-3 px-3 py-3 rounded-lg text-red-300 
                       hover:bg-red-500/20 hover:text-red-100 transition-all duration-200 group w-full relative hover:shadow-md"
          >
            <LogOut className="w-4 h-4" />
            {!collapsed && <span className="text-sm font-medium">Terminar Sessão</span>}
            {collapsed && (
              <div className="absolute left-full ml-2 px-2 py-1 bg-stone-900 text-white text-xs rounded-md whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50 shadow-lg">
                Terminar Sessão
              </div>
            )}
          </button>
        </div>
      </div>
    </aside>
  );
}