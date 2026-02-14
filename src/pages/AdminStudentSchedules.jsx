import React from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import FixedStudentsManager from '@/components/admin/FixedStudentsManager';
import { Users } from 'lucide-react';

export default function AdminStudentSchedules() {

  return (
    <AdminLayout currentPage="AdminStudentSchedules">
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-[#2C3E1F] flex items-center gap-2">
            <Users className="w-7 h-7 text-[#4A5D23]" />
            Gestão de Alunos Fixos
          </h1>
          <p className="text-stone-500">Importar e gerir horários semanais</p>
        </div>

        {/* Gestão de Alunos Fixos */}
        <FixedStudentsManager />
      </div>
    </AdminLayout>
  );
}