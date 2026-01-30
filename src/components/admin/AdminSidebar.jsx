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
      "fixed left-0 top-0 h-screen bg-gradient-to-br from-[#1a1614] via-[#22201d] to-[#1a1614] text-white transition-all duration-500 z-40 shadow-2xl border-r border-stone-700/30",
      collapsed ? "w-16" : "w-56"
    )}>
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="p-5 border-b border-stone-700/30 bg-stone-900/30">
          <div className="flex items-center justify-between mb-3">
            <div className="w-12 h-12 rounded-xl bg-white flex items-center justify-center shadow-lg p-1.5">
              <img 
                src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/695506be843687b2f61b8758/ca1c58c7c_93c9f5a3c_944BDCD3-BD5F-45A8-A0F7-F73EB7F7BE9B2.PNG" 
                alt="Logo" 
                className="w-full h-full object-contain"
              />
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setCollapsed(!collapsed)}
              className="text-white hover:bg-white/10 transition-all duration-300"
            >
              {collapsed ? <Menu className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
            </Button>
          </div>
          {!collapsed && (
            <div className="ml-1">
              <h2 className="font-serif font-bold text-lg text-white tracking-wide">Admin Panel</h2>
              <p className="text-xs text-stone-400 font-medium">Quinta da Horta</p>
            </div>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-2 overflow-y-auto custom-scrollbar">
          {menuItems.map((item) => (
            <Link
              key={item.page}
              to={createPageUrl(item.page)}
              className={cn(
                "flex items-center gap-4 px-4 py-3.5 rounded-xl transition-all duration-300 group",
                currentPage === item.page
                  ? "bg-gradient-to-r from-[#B8956A] to-[#8B7355] text-white shadow-lg shadow-[#B8956A]/20 scale-[1.02]"
                  : "text-stone-300 hover:bg-stone-800/40 hover:text-white hover:translate-x-1"
              )}
            >
              <item.icon className={cn(
                "w-5 h-5 flex-shrink-0",
                currentPage !== item.page && "group-hover:scale-110 transition-transform duration-300"
              )} />
              {!collapsed && <span className="text-sm font-medium tracking-wide">{item.label}</span>}
            </Link>
          ))}
        </nav>
        
        <style>{`
          .custom-scrollbar::-webkit-scrollbar {
            width: 8px;
          }
          .custom-scrollbar::-webkit-scrollbar-track {
            background: rgba(255, 255, 255, 0.03);
            border-radius: 4px;
          }
          .custom-scrollbar::-webkit-scrollbar-thumb {
            background: linear-gradient(135deg, rgba(184, 149, 106, 0.4), rgba(139, 115, 85, 0.4));
            border-radius: 4px;
            transition: all 0.3s ease;
          }
          .custom-scrollbar::-webkit-scrollbar-thumb:hover {
            background: linear-gradient(135deg, rgba(184, 149, 106, 0.6), rgba(139, 115, 85, 0.6));
          }
        `}</style>

        {/* Footer */}
        <div className="p-5 border-t border-stone-700/30 space-y-2 bg-stone-900/30">
          <Link
            to={createPageUrl('Home')}
            className="flex items-center gap-4 px-4 py-3 rounded-xl text-stone-300 
                       hover:bg-stone-800/40 hover:text-white transition-all duration-300 hover:translate-x-1 group"
          >
            <Home className="w-5 h-5 group-hover:scale-110 transition-transform duration-300" />
            {!collapsed && <span className="text-sm font-medium">Ver Site</span>}
          </Link>
          <button
            onClick={() => {
              import('@/api/base44Client').then(({ base44 }) => {
                base44.auth.logout();
              });
            }}
            className="flex items-center gap-4 px-4 py-3 rounded-xl text-red-400 
                       hover:bg-red-500/10 hover:text-red-300 transition-all duration-300 hover:translate-x-1 group w-full"
          >
            <LogOut className="w-5 h-5 group-hover:scale-110 transition-transform duration-300" />
            {!collapsed && <span className="text-sm font-medium">Terminar Sessão</span>}
          </button>
        </div>
      </div>
    </aside>
  );
}