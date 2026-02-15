import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard, Brain, CalendarDays, Users, UserCog,
  Settings, Euro, LogOut, ChevronLeft, Menu, Home, FileText, BarChart3, UserCheck, Ban, Mail, Bell, Image, MessageSquare, Trophy
} from 'lucide-react';
import { Button } from '@/components/ui/button';

const menuItems = [
  { icon: LayoutDashboard, label: 'Dashboard', page: 'AdminDashboard' },
  { icon: Brain, label: 'IA Assistente', page: 'AdminAI' },
  { icon: Mail, label: 'Emails', page: 'AdminEmails' },
  { icon: MessageSquare, label: 'Mensagens', page: 'AdminMessages' },
  { icon: MessageSquare, label: 'Feedbacks', page: 'AdminFeedback' },
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
  { icon: Trophy, label: 'Competições', page: 'AdminCompetitions' },
  { icon: FileText, label: 'Inscrições Provas', page: 'AdminCompetitionEntries' },
  { icon: Trophy, label: 'Modalidades', page: 'AdminCompetitionModalities' },
  { icon: FileText, label: 'Ordem de Entrada', page: 'AdminCompetitionOrder' },
  { icon: FileText, label: 'Relatórios IA', page: 'AdminCompetitionReports' },
  { icon: BarChart3, label: 'Rankings', page: 'AdminCompetitionRankings' },
  { icon: Euro, label: 'Rel. Financeiro', page: 'AdminFinancialReport' },
  { icon: Settings, label: 'Definições', page: 'AdminSettings' },
];

export default function AdminSidebar({ currentPage, collapsed, setCollapsed }) {
  return (
    <aside className={cn(
      "fixed left-0 top-0 h-screen bg-gradient-to-br from-[#1a1614] via-[#22201d] to-[#1a1614] text-white transition-all duration-500 z-40 shadow-2xl border-r border-stone-700/30",
      collapsed ? "w-16" : "w-52"
    )}>
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="p-3 border-b border-stone-700/30 bg-stone-900/30">
          <div className="flex items-center justify-between">
            {!collapsed && (
              <div className="flex items-center gap-2">
                <div className="w-11 h-11 rounded-full bg-white flex items-center justify-center shadow-md p-0.5">
                  <img 
                    src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/695506be843687b2f61b8758/8b9c42396_944BDCD3-BD5F-45A8-A0F7-F73EB7F7BE9B2.PNG" 
                    alt="Logo" 
                    className="w-full h-full object-cover rounded-full"
                  />
                </div>
                <div>
                  <h2 className="font-serif font-bold text-base text-white">Picadeiro</h2>
                  <p className="text-xs text-stone-400">Quinta da Horta</p>
                </div>
              </div>
            )}
            {collapsed && (
              <div className="w-11 h-11 rounded-full bg-white flex items-center justify-center shadow-md p-0.5 mx-auto">
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
        <nav className="flex-1 p-2 space-y-0.5 overflow-y-auto custom-scrollbar">
          {menuItems.map((item) => (
            <Link
              key={item.page}
              to={createPageUrl(item.page)}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group relative",
                currentPage === item.page
                  ? "bg-gradient-to-r from-[#B8956A] to-[#8B7355] text-white shadow-md"
                  : "text-stone-300 hover:bg-stone-800/40 hover:text-white"
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
        <div className="p-2 border-t border-stone-700/30 space-y-0.5 bg-stone-900/30">
          <Link
            to={createPageUrl('Home')}
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-stone-300 
                       hover:bg-stone-800/40 hover:text-white transition-all duration-200 group relative"
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
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-red-400 
                       hover:bg-red-500/10 hover:text-red-300 transition-all duration-200 group w-full relative"
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