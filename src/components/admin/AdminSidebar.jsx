import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard, Brain, CalendarDays, Users, UserCog,
  Settings, ShoppingBag, Package, Tag, Image,
  MessageSquare, Euro, LogOut, ChevronLeft, Menu, Home, FileText, BarChart3, UserCheck, Ban, Mail, Bell, BookOpen
} from 'lucide-react';
import { Button } from '@/components/ui/button';

const menuItems = [
  { icon: LayoutDashboard, label: 'Dashboard', page: 'AdminDashboard' },
  { icon: Brain, label: 'IA Assistente', page: 'AdminAI' },
  { icon: Mail, label: 'Emails', page: 'AdminEmails' },
  { icon: Bell, label: 'Notificações IA', page: 'AdminNotifications' },
  { icon: BookOpen, label: 'Blog', page: 'AdminBlog' },
  { icon: FileText, label: 'Conteúdo', page: 'AdminContent' },
  { icon: Users, label: 'Utilizadores', page: 'AdminUsers' },
  { icon: BarChart3, label: 'Relatórios', page: 'AdminReports' },
  { icon: CalendarDays, label: 'Aulas', page: 'AdminLessons' },
  { icon: Users, label: 'Alunos Site', page: 'AdminStudents' },
  { icon: Users, label: 'Alunos Picadeiro', page: 'AdminPicadeiroStudents' },
  { icon: UserCheck, label: 'Alunos Fixos', page: 'AdminStudentSchedules' },
  { icon: UserCog, label: 'Monitores', page: 'AdminInstructors' },
  { icon: Euro, label: 'Pagamentos', page: 'AdminPayments' },
  { icon: ShoppingBag, label: 'Loja', page: 'AdminShop' },
  { icon: Package, label: 'Encomendas', page: 'AdminOrders' },
  { icon: Tag, label: 'Cupões', page: 'AdminCoupons' },
  { icon: Image, label: 'Galeria', page: 'AdminGallery' },
  { icon: MessageSquare, label: 'Mensagens', page: 'AdminMessages' },
  { icon: Ban, label: 'Bloqueios', page: 'AdminBlockedSlots' },
  { icon: FileText, label: 'Regulamentos', page: 'AdminRegulations' },
  { icon: Settings, label: 'Definições', page: 'AdminSettings' },
];

export default function AdminSidebar({ currentPage, collapsed, setCollapsed }) {
  return (
    <aside className={cn(
      "fixed left-0 top-0 h-screen bg-[#1A1A1A] text-white transition-all duration-300 z-40",
      collapsed ? "w-16" : "w-64"
    )}>
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="p-4 border-b border-white/10 flex items-center justify-between">
          {!collapsed && (
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-[#B8956A] rounded-lg flex items-center justify-center">
                <span className="text-white font-bold">PH</span>
              </div>
              <div>
                <h2 className="font-semibold text-sm">Admin Panel</h2>
                <p className="text-xs text-stone-400">Quinta da Horta</p>
              </div>
            </div>
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setCollapsed(!collapsed)}
            className="text-white hover:bg-white/10"
          >
            {collapsed ? <Menu className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
          </Button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {menuItems.map((item) => (
            <Link
              key={item.page}
              to={createPageUrl(item.page)}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all",
                currentPage === item.page
                  ? "bg-[#B8956A] text-white"
                  : "text-stone-300 hover:bg-white/10 hover:text-white"
              )}
            >
              <item.icon className="w-5 h-5 flex-shrink-0" />
              {!collapsed && <span className="text-sm">{item.label}</span>}
            </Link>
          ))}
        </nav>

        {/* Footer */}
        <div className="p-3 border-t border-white/10 space-y-2">
          <Link
            to={createPageUrl('Home')}
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-stone-300 
                       hover:bg-white/10 hover:text-white transition-all"
          >
            <Home className="w-5 h-5" />
            {!collapsed && <span className="text-sm">Ver Site</span>}
          </Link>
          <button
            onClick={() => {
              import('@/api/base44Client').then(({ base44 }) => {
                base44.auth.logout();
              });
            }}
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-red-400 
                       hover:bg-red-500/10 hover:text-red-300 transition-all w-full"
          >
            <LogOut className="w-5 h-5" />
            {!collapsed && <span className="text-sm">Terminar Sessão</span>}
          </button>
        </div>
      </div>
    </aside>
  );
}