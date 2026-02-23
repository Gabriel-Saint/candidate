/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  Users, 
  UserPlus, 
  Search, 
  MoreVertical, 
  Phone, 
  Mail, 
  Calendar,
  ChevronRight,
  LayoutDashboard,
  Settings,
  LogOut,
  TrendingUp,
  Clock,
  CheckCircle2,
  Plus,
  X,
  Download,
  MessageSquare,
  Sparkles,
  FileText,
  Table
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { generateClassDescription, generateWhatsAppMessage } from './services/geminiService';

interface Student {
  id: number;
  name: string;
  email: string;
  phone: string;
  status: string;
  plan: string;
  created_at: string;
}

interface Schedule {
  id: number;
  student_id: number;
  scheduled_at: string;
  duration_minutes: number;
  notes: string;
  student?: { name: string };
}

interface Transaction {
  id: number;
  description: string;
  amount: number;
  type: 'Receita' | 'Despesa';
  category: string;
  due_date: string;
  status: 'Pendente' | 'Pago';
}

export default function App() {
  const [students, setStudents] = useState<Student[]>([]);
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [currentView, setCurrentView] = useState<'dashboard' | 'agenda' | 'financeiro'>('dashboard');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const [isFinanceModalOpen, setIsFinanceModalOpen] = useState(false);
  const [activeMenuId, setActiveMenuId] = useState<number | null>(null);
  const [editingStudentId, setEditingStudentId] = useState<number | null>(null);
  const [deactivatingStudentId, setDeactivatingStudentId] = useState<number | null>(null);
  const [isWhatsAppModalOpen, setIsWhatsAppModalOpen] = useState(false);
  const [whatsAppMessage, setWhatsAppMessage] = useState('');
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);
  const [statusFilter, setStatusFilter] = useState<'Todos' | 'Ativo' | 'Inativo'>('Todos');
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  
  const [newStudent, setNewStudent] = useState({
    name: '',
    email: '',
    phone: '',
    plan: 'Mensal',
    status: 'Ativo'
  });

  const [newSchedule, setNewSchedule] = useState({
    student_id: '',
    scheduled_at: '',
    duration_minutes: 60,
    notes: ''
  });

  const [newTransaction, setNewTransaction] = useState({
    description: '',
    amount: 0,
    type: 'Receita' as 'Receita' | 'Despesa',
    category: 'Mensalidade',
    due_date: new Date().toISOString().split('T')[0],
    status: 'Pendente' as 'Pendente' | 'Pago'
  });

  useEffect(() => {
    fetchStudents();
    fetchSchedules();
    fetchTransactions();

    const handleClickOutside = () => setActiveMenuId(null);
    window.addEventListener('click', handleClickOutside);
    return () => window.removeEventListener('click', handleClickOutside);
  }, []);

  const fetchStudents = async () => {
    try {
      const response = await fetch('/api/students');
      const data = await response.json();
      setStudents(data);
    } catch (error) {
      console.error('Error fetching students:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchSchedules = async () => {
    try {
      const response = await fetch('/api/schedules');
      const data = await response.json();
      setSchedules(data);
    } catch (error) {
      console.error('Error fetching schedules:', error);
    }
  };

  const fetchTransactions = async () => {
    try {
      const response = await fetch('/api/transactions');
      const data = await response.json();
      setTransactions(data);
    } catch (error) {
      console.error('Error fetching transactions:', error);
    }
  };

  const handleAddStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const url = editingStudentId ? `/api/students/${editingStudentId}` : '/api/students';
      const method = editingStudentId ? 'PATCH' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newStudent)
      });
      
      const result = await response.json();
      
      if (response.ok) {
        fetchStudents();
        setIsModalOpen(false);
        setEditingStudentId(null);
        setNewStudent({ name: '', email: '', phone: '', plan: 'Mensal', status: 'Ativo' });
        alert(editingStudentId ? 'Aluno atualizado com sucesso!' : 'Aluno cadastrado com sucesso!');
      } else {
        console.error('Server error:', result);
        alert(`Erro: ${result.error || 'Erro desconhecido'}`);
      }
    } catch (error: any) {
      console.error('Network error:', error);
      alert(`Erro de rede: ${error.message}`);
    }
  };

  const handleAddSchedule = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch('/api/schedules', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newSchedule)
      });
      
      const result = await response.json();
      
      if (response.ok) {
        fetchSchedules();
        setIsScheduleModalOpen(false);
        setNewSchedule({ student_id: '', scheduled_at: '', duration_minutes: 60, notes: '' });
        alert('Aula agendada com sucesso!');
      } else {
        alert(`Erro ao agendar: ${result.error || 'Erro desconhecido'}`);
      }
    } catch (error: any) {
      alert(`Erro de rede: ${error.message}`);
    }
  };

  const handleAddTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch('/api/transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newTransaction)
      });
      
      const result = await response.json();
      
      if (response.ok) {
        fetchTransactions();
        setIsFinanceModalOpen(false);
        setNewTransaction({
          description: '',
          amount: 0,
          type: 'Receita',
          category: 'Mensalidade',
          due_date: new Date().toISOString().split('T')[0],
          status: 'Pendente'
        });
        alert('Lançamento realizado com sucesso!');
      } else {
        alert(`Erro ao lançar: ${result.error || 'Erro desconhecido'}`);
      }
    } catch (error: any) {
      alert(`Erro de rede: ${error.message}`);
    }
  };

  const handleUpdateTransactionStatus = async (id: number, currentStatus: string) => {
    const newStatus = currentStatus === 'Pendente' ? 'Pago' : 'Pendente';
    try {
      const response = await fetch(`/api/transactions/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });
      if (response.ok) {
        fetchTransactions();
      } else {
        const result = await response.json();
        alert(`Erro ao atualizar status: ${result.error || 'Erro desconhecido'}`);
      }
    } catch (error: any) {
      alert(`Erro de rede: ${error.message}`);
    }
  };

  const handleDeleteStudent = async (id: number) => {
    try {
      const response = await fetch(`/api/students/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'Inativo' })
      });
      if (response.ok) {
        fetchStudents();
        setDeactivatingStudentId(null);
        alert('Aluno desativado com sucesso!');
      } else {
        const result = await response.json();
        alert(`Erro ao desativar: ${result.error || 'Erro desconhecido'}`);
      }
    } catch (error: any) {
      alert(`Erro de rede: ${error.message}`);
    }
  };

  const handleDeleteTransaction = async (id: number) => {
    if (!confirm('Tem certeza que deseja excluir este lançamento?')) return;
    try {
      const response = await fetch(`/api/transactions/${id}`, {
        method: 'DELETE'
      });
      if (response.ok) {
        fetchTransactions();
      } else {
        const result = await response.json();
        alert(`Erro ao excluir: ${result.error || 'Erro desconhecido'}`);
      }
    } catch (error: any) {
      alert(`Erro de rede: ${error.message}`);
    }
  };

  const exportToCSV = () => {
    const headers = ['Nome', 'Email', 'Telefone', 'Status', 'Plano', 'Data Cadastro'];
    const rows = filteredStudents.map(s => [
      s.name,
      s.email,
      s.phone,
      s.status,
      s.plan,
      new Date(s.created_at).toLocaleDateString('pt-BR')
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(r => r.join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `alunos_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportToPDF = () => {
    const doc = new jsPDF();
    doc.text('Lista de Alunos - VOLL Pilates', 14, 15);
    
    const tableColumn = ["Nome", "Email", "Telefone", "Status", "Plano"];
    const tableRows = filteredStudents.map(s => [
      s.name,
      s.email,
      s.phone,
      s.status,
      s.plan
    ]);

    autoTable(doc, {
      head: [tableColumn],
      body: tableRows,
      startY: 20,
    });
    doc.save(`alunos_${new Date().toISOString().split('T')[0]}.pdf`);
  };

  const handleAIDescription = async () => {
    if (!newSchedule.student_id) {
      alert('Selecione um aluno primeiro.');
      return;
    }
    const student = students.find(s => s.id === parseInt(newSchedule.student_id));
    if (!student) return;

    setIsGeneratingAI(true);
    const description = await generateClassDescription(student.name, newSchedule.notes);
    setNewSchedule({ ...newSchedule, notes: description || '' });
    setIsGeneratingAI(false);
  };

  const handleAIWhatsApp = async (student: Student, type: 'lembrete' | 'boas-vindas' | 'cobranca') => {
    setIsGeneratingAI(true);
    setIsWhatsAppModalOpen(true);
    const message = await generateWhatsAppMessage(student.name, type);
    setWhatsAppMessage(message || '');
    setIsGeneratingAI(false);
  };

  const filteredStudents = students.filter(s => {
    const matchesSearch = s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         s.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'Todos' || s.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const stats = {
    total: students.length,
    active: students.filter(s => s.status === 'Ativo').length,
    trial: students.filter(s => s.status === 'Experimental').length,
  };

  return (
    <div className="min-h-screen bg-[#F8F9FA] flex font-sans text-slate-900">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-slate-200 hidden md:flex flex-col">
        <div className="p-6">
          <div className="flex items-center gap-2 mb-8">
            <div className="w-8 h-8 bg-emerald-600 rounded-lg flex items-center justify-center text-white font-bold">V</div>
            <h1 className="text-xl font-bold tracking-tight text-emerald-900">VOLL Candidate</h1>
          </div>
          
          <nav className="space-y-1">
            <NavItem 
              icon={<LayoutDashboard size={20} />} 
              label="Dashboard" 
              active={currentView === 'dashboard'} 
              onClick={() => setCurrentView('dashboard')}
            />
            <NavItem 
              icon={<Users size={20} />} 
              label="Alunos" 
              active={false} 
              disabled 
            />
            <NavItem 
              icon={<Calendar size={20} />} 
              label="Agenda" 
              active={currentView === 'agenda'} 
              onClick={() => setCurrentView('agenda')}
            />
            <NavItem 
              icon={<TrendingUp size={20} />} 
              label="Financeiro" 
              active={currentView === 'financeiro'}
              onClick={() => setCurrentView('financeiro')}
            />
          </nav>
        </div>
        
        <div className="mt-auto p-6 border-t border-slate-100">
          <NavItem icon={<Settings size={20} />} label="Configurações" />
          <NavItem icon={<LogOut size={20} />} label="Sair" />
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col">
        {/* Header */}
        <header className="h-16 bg-white border-bottom border-slate-200 flex items-center justify-between px-8">
          <div className="relative w-96">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text" 
              placeholder="Buscar..." 
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <div className="flex gap-3">
            <button 
              onClick={() => setIsFinanceModalOpen(true)}
              className="bg-white border border-slate-200 text-slate-700 px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors hover:bg-slate-50 shadow-sm"
            >
              <TrendingUp size={18} />
              Lançar Financeiro
            </button>
            <button 
              onClick={() => setIsScheduleModalOpen(true)}
              className="bg-white border border-slate-200 text-slate-700 px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors hover:bg-slate-50 shadow-sm"
            >
              <Calendar size={18} />
              Agendar Aula
            </button>
            <button 
              onClick={() => {
                setEditingStudentId(null);
                setNewStudent({ name: '', email: '', phone: '', plan: 'Mensal', status: 'Ativo' });
                setIsModalOpen(true);
              }}
              className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors shadow-sm"
            >
              <UserPlus size={18} />
              Novo Aluno
            </button>
          </div>
        </header>

        {/* Content Area */}
        <div className="p-8 overflow-y-auto">
          {currentView === 'dashboard' ? (
            <>
              <div className="mb-8">
                <h2 className="text-2xl font-bold text-slate-800 mb-1">Bem-vindo ao VOLL</h2>
                <p className="text-slate-500 text-sm">Gerencie seus alunos e acompanhe o crescimento do seu studio.</p>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <StatCard 
                  label="Total de Alunos" 
                  value={stats.total} 
                  icon={<Users className="text-blue-600" />} 
                  trend="+12% este mês"
                />
                <StatCard 
                  label="Alunos Ativos" 
                  value={stats.active} 
                  icon={<CheckCircle2 className="text-emerald-600" />} 
                  trend="94% de retenção"
                />
                <StatCard 
                  label="Aulas Experimentais" 
                  value={stats.trial} 
                  icon={<Clock className="text-amber-600" />} 
                  trend="3 pendentes"
                />
              </div>

              {/* Student List Table */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <h3 className="font-bold text-slate-800">Lista de Alunos</h3>
                    <div className="flex gap-2 border-l border-slate-200 pl-4">
                      <button 
                        onClick={exportToCSV}
                        className="p-1.5 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-all"
                        title="Exportar CSV"
                      >
                        <Table size={18} />
                      </button>
                      <button 
                        onClick={exportToPDF}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all"
                        title="Exportar PDF"
                      >
                        <FileText size={18} />
                      </button>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    {(['Todos', 'Ativo', 'Inativo'] as const).map((filter) => (
                      <button
                        key={filter}
                        onClick={() => setStatusFilter(filter)}
                        className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
                          statusFilter === filter 
                            ? 'bg-emerald-100 text-emerald-700' 
                            : 'text-slate-400 hover:bg-slate-50'
                        }`}
                      >
                        {filter === 'Ativo' ? 'Ativos' : filter === 'Inativo' ? 'Inativos' : filter}
                      </button>
                    ))}
                  </div>
                </div>
                
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="bg-slate-50/50 text-slate-500 text-xs uppercase tracking-wider">
                        <th className="px-6 py-4 font-semibold">Aluno</th>
                        <th className="px-6 py-4 font-semibold">Status</th>
                        <th className="px-6 py-4 font-semibold">Plano</th>
                        <th className="px-6 py-4 font-semibold">Contato</th>
                        <th className="px-6 py-4 font-semibold text-right">Ações</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {loading ? (
                        <tr>
                          <td colSpan={5} className="px-6 py-12 text-center text-slate-400">Carregando alunos...</td>
                        </tr>
                      ) : filteredStudents.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="px-6 py-12 text-center text-slate-400">Nenhum aluno encontrado.</td>
                        </tr>
                      ) : (
                        filteredStudents.map((student) => (
                          <tr key={student.id} className="hover:bg-slate-50/50 transition-colors group">
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-sm">
                                  {student.name.charAt(0)}
                                </div>
                                <div>
                                  <p className="font-semibold text-slate-800">{student.name}</p>
                                  <p className="text-xs text-slate-500">Desde {new Date(student.created_at).toLocaleDateString('pt-BR')}</p>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <StatusBadge status={student.status} />
                            </td>
                            <td className="px-6 py-4">
                              <span className="text-sm text-slate-600">{student.plan}</span>
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex flex-col gap-1">
                                <div className="flex items-center gap-2 text-xs text-slate-500">
                                  <Phone size={12} /> {student.phone}
                                </div>
                                <div className="flex items-center gap-2 text-xs text-slate-500">
                                  <Mail size={12} /> {student.email}
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 text-right">
                              <div className="flex justify-end gap-2 relative">
                                <button 
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setDeactivatingStudentId(student.id);
                                  }}
                                  className="p-2 text-rose-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all"
                                  title="Desativar Aluno"
                                >
                                  <X size={18} />
                                </button>
                                <div className="relative">
                                  <button 
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setActiveMenuId(activeMenuId === student.id ? null : student.id);
                                    }}
                                    className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-all"
                                  >
                                    <MoreVertical size={18} />
                                  </button>
                                  
                                  {activeMenuId === student.id && (
                                    <div 
                                      className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-xl border border-slate-100 py-2 z-50"
                                      onClick={(e) => e.stopPropagation()}
                                    >
                                      <button 
                                        onClick={() => {
                                          setEditingStudentId(student.id);
                                          setNewStudent({
                                            name: student.name,
                                            email: student.email,
                                            phone: student.phone,
                                            plan: student.plan,
                                            status: student.status
                                          });
                                          setIsModalOpen(true);
                                          setActiveMenuId(null);
                                        }}
                                        className="w-full text-left px-4 py-2 text-sm text-slate-600 hover:bg-slate-50 transition-colors"
                                      >
                                        Editar Aluno
                                      </button>
                                      <button 
                                        onClick={() => {
                                          handleAIWhatsApp(student, 'lembrete');
                                          setActiveMenuId(null);
                                        }}
                                        className="w-full text-left px-4 py-2 text-sm text-emerald-600 hover:bg-emerald-50 transition-colors flex items-center gap-2"
                                      >
                                        <MessageSquare size={14} /> WhatsApp Lembrete
                                      </button>
                                      <button 
                                        onClick={() => {
                                          setDeactivatingStudentId(student.id);
                                          setActiveMenuId(null);
                                        }}
                                        className="w-full text-left px-4 py-2 text-sm text-rose-600 hover:bg-rose-50 transition-colors"
                                      >
                                        Desativar Aluno
                                      </button>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          ) : currentView === 'agenda' ? (
            <div className="space-y-6">
              <div className="mb-8">
                <h2 className="text-2xl font-bold text-slate-800 mb-1">Agenda de Aulas</h2>
                <p className="text-slate-500 text-sm">Visualize e gerencie os horários das aulas.</p>
              </div>

              <div className="grid grid-cols-1 gap-4">
                {schedules.length === 0 ? (
                  <div className="bg-white p-12 text-center rounded-2xl border border-slate-200 text-slate-400">
                    Nenhuma aula agendada.
                  </div>
                ) : (
                  schedules.map((schedule) => (
                    <div key={schedule.id} className="bg-white p-4 rounded-xl border border-slate-200 flex items-center justify-between hover:shadow-md transition-shadow">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-lg flex flex-col items-center justify-center">
                          <span className="text-xs font-bold uppercase">{new Date(schedule.scheduled_at).toLocaleDateString('pt-BR', { weekday: 'short' })}</span>
                          <span className="text-lg font-bold">{new Date(schedule.scheduled_at).getDate()}</span>
                        </div>
                        <div>
                          <h4 className="font-bold text-slate-800">{schedule.student?.name}</h4>
                          <div className="flex items-center gap-3 text-xs text-slate-500">
                            <span className="flex items-center gap-1"><Clock size={12} /> {new Date(schedule.scheduled_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</span>
                            <span>•</span>
                            <span>{schedule.duration_minutes} min</span>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-slate-400 italic">{schedule.notes || 'Sem observações'}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="mb-8 flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-slate-800 mb-1">Financeiro</h2>
                  <p className="text-slate-500 text-sm">Controle de entradas e saídas do studio.</p>
                </div>
                <div className="flex gap-4">
                  <div className="bg-emerald-50 p-4 rounded-xl border border-emerald-100">
                    <p className="text-xs text-emerald-600 font-bold uppercase mb-1">Receitas</p>
                    <p className="text-xl font-bold text-emerald-700">R$ {transactions.filter(t => t.type === 'Receita').reduce((acc, t) => acc + Number(t.amount), 0).toFixed(2)}</p>
                  </div>
                  <div className="bg-rose-50 p-4 rounded-xl border border-rose-100">
                    <p className="text-xs text-rose-600 font-bold uppercase mb-1">Despesas</p>
                    <p className="text-xl font-bold text-rose-700">R$ {transactions.filter(t => t.type === 'Despesa').reduce((acc, t) => acc + Number(t.amount), 0).toFixed(2)}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-slate-50/50 text-slate-500 text-xs uppercase tracking-wider">
                      <th className="px-6 py-4 font-semibold">Descrição</th>
                      <th className="px-6 py-4 font-semibold">Vencimento</th>
                      <th className="px-6 py-4 font-semibold">Valor</th>
                      <th className="px-6 py-4 font-semibold">Status</th>
                      <th className="px-6 py-4 font-semibold text-right">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {transactions.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="px-6 py-12 text-center text-slate-400">Nenhum lançamento encontrado.</td>
                      </tr>
                    ) : (
                      transactions.map((t) => (
                        <tr key={t.id} className="hover:bg-slate-50/50 transition-colors">
                          <td className="px-6 py-4">
                            <p className="font-semibold text-slate-800">{t.description}</p>
                            <p className="text-xs text-slate-500">{t.category}</p>
                          </td>
                          <td className="px-6 py-4 text-sm text-slate-600">
                            {new Date(t.due_date).toLocaleDateString('pt-BR')}
                          </td>
                          <td className="px-6 py-4">
                            <span className={`font-bold ${t.type === 'Receita' ? 'text-emerald-600' : 'text-rose-600'}`}>
                              {t.type === 'Receita' ? '+' : '-'} R$ {Number(t.amount).toFixed(2)}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <button 
                              onClick={() => handleUpdateTransactionStatus(t.id, t.status)}
                              className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase transition-all hover:scale-105 ${t.status === 'Pago' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}
                            >
                              {t.status}
                            </button>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <button 
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteTransaction(t.id);
                              }}
                              className="p-2 text-rose-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all"
                            >
                              <X size={18} />
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* WhatsApp Modal */}
      <AnimatePresence>
        {isWhatsAppModalOpen && (
          <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsWhatsAppModalOpen(false)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden"
            >
              <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-emerald-600 text-white">
                <div className="flex items-center gap-2">
                  <MessageSquare size={20} />
                  <h3 className="text-lg font-bold">Gerador de WhatsApp (IA)</h3>
                </div>
                <button onClick={() => setIsWhatsAppModalOpen(false)} className="text-white/80 hover:text-white transition-colors">
                  <X size={20} />
                </button>
              </div>
              
              <div className="p-6 space-y-4">
                {isGeneratingAI ? (
                  <div className="py-12 text-center space-y-4">
                    <div className="w-12 h-12 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
                    <p className="text-slate-500 animate-pulse font-medium">Gemini está redigindo sua mensagem...</p>
                  </div>
                ) : (
                  <>
                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                      <p className="text-sm text-slate-700 whitespace-pre-wrap leading-relaxed">{whatsAppMessage}</p>
                    </div>
                    <div className="flex gap-3">
                      <button 
                        onClick={() => {
                          navigator.clipboard.writeText(whatsAppMessage);
                          alert('Mensagem copiada!');
                        }}
                        className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-3 rounded-xl transition-all flex items-center justify-center gap-2"
                      >
                        Copiar Texto
                      </button>
                      <button 
                        onClick={() => {
                          const url = `https://wa.me/?text=${encodeURIComponent(whatsAppMessage)}`;
                          window.open(url, '_blank');
                        }}
                        className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 rounded-xl transition-all shadow-lg shadow-emerald-600/20 flex items-center justify-center gap-2"
                      >
                        Abrir WhatsApp
                      </button>
                    </div>
                  </>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Confirmation Modal */}
      <AnimatePresence>
        {deactivatingStudentId && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setDeactivatingStudentId(null)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="relative w-full max-w-sm bg-white rounded-2xl shadow-2xl p-6 text-center"
            >
              <div className="w-16 h-16 bg-rose-50 text-rose-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <X size={32} />
              </div>
              <h3 className="text-xl font-bold text-slate-800 mb-2">Desativar Aluno?</h3>
              <p className="text-slate-500 text-sm mb-6">
                O aluno será movido para a lista de inativos. Você poderá reativá-lo editando seu perfil.
              </p>
              <div className="flex gap-3">
                <button 
                  onClick={() => setDeactivatingStudentId(null)}
                  className="flex-1 px-4 py-2 border border-slate-200 text-slate-600 rounded-lg text-sm font-bold hover:bg-slate-50 transition-all"
                >
                  Cancelar
                </button>
                <button 
                  onClick={() => handleDeleteStudent(deactivatingStudentId)}
                  className="flex-1 px-4 py-2 bg-rose-600 text-white rounded-lg text-sm font-bold hover:bg-rose-700 transition-all shadow-lg shadow-rose-600/20"
                >
                  Confirmar
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Add Finance Modal */}
      <AnimatePresence>
        {isFinanceModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsFinanceModalOpen(false)}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden"
            >
              <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                <h3 className="text-xl font-bold text-slate-800">Novo Lançamento</h3>
                <button onClick={() => setIsFinanceModalOpen(false)} className="text-slate-400 hover:text-slate-600 transition-colors">
                  <X size={20} />
                </button>
              </div>
              
              <form onSubmit={handleAddTransaction} className="p-6 space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Descrição</label>
                  <input 
                    required
                    type="text" 
                    className="w-full px-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                    placeholder="Ex: Mensalidade João"
                    value={newTransaction.description}
                    onChange={e => setNewTransaction({...newTransaction, description: e.target.value})}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Valor (R$)</label>
                    <input 
                      required
                      type="number" 
                      step="0.01"
                      className="w-full px-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                      value={newTransaction.amount}
                      onChange={e => setNewTransaction({...newTransaction, amount: parseFloat(e.target.value)})}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Tipo</label>
                    <select 
                      className="w-full px-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                      value={newTransaction.type}
                      onChange={e => setNewTransaction({...newTransaction, type: e.target.value as 'Receita' | 'Despesa'})}
                    >
                      <option value="Receita">Receita (Entrada)</option>
                      <option value="Despesa">Despesa (Saída)</option>
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Categoria</label>
                    <input 
                      type="text" 
                      className="w-full px-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                      placeholder="Ex: Aluguel, Salário"
                      value={newTransaction.category}
                      onChange={e => setNewTransaction({...newTransaction, category: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Vencimento</label>
                    <input 
                      required
                      type="date" 
                      className="w-full px-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                      value={newTransaction.due_date}
                      onChange={e => setNewTransaction({...newTransaction, due_date: e.target.value})}
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Status</label>
                  <div className="flex gap-2">
                    {['Pendente', 'Pago'].map(status => (
                      <button
                        key={status}
                        type="button"
                        onClick={() => setNewTransaction({...newTransaction, status: status as 'Pendente' | 'Pago'})}
                        className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${
                          newTransaction.status === status 
                            ? 'bg-emerald-600 text-white shadow-md' 
                            : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                        }`}
                      >
                        {status}
                      </button>
                    ))}
                  </div>
                </div>
                
                <div className="pt-4">
                  <button 
                    type="submit"
                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 rounded-xl transition-all shadow-lg shadow-emerald-600/20 flex items-center justify-center gap-2"
                  >
                    <TrendingUp size={20} />
                    Confirmar Lançamento
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Add Schedule Modal */}
      <AnimatePresence>
        {isScheduleModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsScheduleModalOpen(false)}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden"
            >
              <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                <h3 className="text-xl font-bold text-slate-800">Agendar Aula</h3>
                <button onClick={() => setIsScheduleModalOpen(false)} className="text-slate-400 hover:text-slate-600 transition-colors">
                  <X size={20} />
                </button>
              </div>
              
              <form onSubmit={handleAddSchedule} className="p-6 space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Aluno</label>
                  <select 
                    required
                    className="w-full px-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                    value={newSchedule.student_id}
                    onChange={e => setNewSchedule({...newSchedule, student_id: e.target.value})}
                  >
                    <option value="">Selecione um aluno</option>
                    {students.map(s => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Data e Hora</label>
                  <input 
                    required
                    type="datetime-local" 
                    className="w-full px-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                    value={newSchedule.scheduled_at}
                    onChange={e => setNewSchedule({...newSchedule, scheduled_at: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Duração (minutos)</label>
                  <input 
                    type="number" 
                    className="w-full px-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                    value={newSchedule.duration_minutes}
                    onChange={e => setNewSchedule({...newSchedule, duration_minutes: parseInt(e.target.value)})}
                  />
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-bold text-slate-500 uppercase">Observações</label>
                    <button 
                      type="button"
                      onClick={handleAIDescription}
                      disabled={isGeneratingAI}
                      className="text-[10px] font-bold text-emerald-600 flex items-center gap-1 hover:text-emerald-700 disabled:opacity-50"
                    >
                      <Sparkles size={12} /> {isGeneratingAI ? 'Gerando...' : 'IA Assistente'}
                    </button>
                  </div>
                  <textarea 
                    className="w-full px-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                    placeholder="Alguma observação importante?"
                    value={newSchedule.notes}
                    onChange={e => setNewSchedule({...newSchedule, notes: e.target.value})}
                  />
                </div>
                
                <div className="pt-4">
                  <button 
                    type="submit"
                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 rounded-xl transition-all shadow-lg shadow-emerald-600/20 flex items-center justify-center gap-2"
                  >
                    <Calendar size={20} />
                    Confirmar Agendamento
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden"
            >
              <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                <h3 className="text-xl font-bold text-slate-800">
                  {editingStudentId ? 'Editar Aluno' : 'Novo Aluno'}
                </h3>
                <button 
                  onClick={() => {
                    setIsModalOpen(false);
                    setEditingStudentId(null);
                    setNewStudent({ name: '', email: '', phone: '', plan: 'Mensal', status: 'Ativo' });
                  }} 
                  className="text-slate-400 hover:text-slate-600 transition-colors"
                >
                  <X size={20} />
                </button>
              </div>
              
              <form onSubmit={handleAddStudent} className="p-6 space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Nome Completo</label>
                  <input 
                    required
                    type="text" 
                    className="w-full px-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                    placeholder="Ex: João Silva"
                    value={newStudent.name}
                    onChange={e => setNewStudent({...newStudent, name: e.target.value})}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">E-mail</label>
                    <input 
                      required
                      type="email" 
                      className="w-full px-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                      placeholder="joao@email.com"
                      value={newStudent.email}
                      onChange={e => setNewStudent({...newStudent, email: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Telefone</label>
                    <input 
                      required
                      type="tel" 
                      className="w-full px-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                      placeholder="(11) 99999-9999"
                      value={newStudent.phone}
                      onChange={e => setNewStudent({...newStudent, phone: e.target.value})}
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Plano</label>
                  <select 
                    className="w-full px-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                    value={newStudent.plan}
                    onChange={e => setNewStudent({...newStudent, plan: e.target.value})}
                  >
                    <option>Mensal</option>
                    <option>Trimestral</option>
                    <option>Semestral</option>
                    <option>Anual</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Status Inicial</label>
                  <div className="flex gap-2">
                    {['Ativo', 'Experimental'].map(status => (
                      <button
                        key={status}
                        type="button"
                        onClick={() => setNewStudent({...newStudent, status})}
                        className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${
                          newStudent.status === status 
                            ? 'bg-emerald-600 text-white shadow-md' 
                            : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                        }`}
                      >
                        {status}
                      </button>
                    ))}
                  </div>
                </div>
                
                <div className="pt-4">
                  <button 
                    type="submit"
                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 rounded-xl transition-all shadow-lg shadow-emerald-600/20 flex items-center justify-center gap-2"
                  >
                    {editingStudentId ? <CheckCircle2 size={20} /> : <Plus size={20} />}
                    {editingStudentId ? 'Salvar Alterações' : 'Cadastrar Aluno'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

function NavItem({ icon, label, active = false, disabled = false, onClick }: { icon: React.ReactNode, label: string, active?: boolean, disabled?: boolean, onClick?: () => void }) {
  return (
    <div 
      onClick={!disabled ? onClick : undefined}
      className={`
      flex items-center justify-between px-4 py-3 rounded-xl cursor-pointer transition-all group
      ${active ? 'bg-emerald-50 text-emerald-700' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700'}
      ${disabled ? 'opacity-40 cursor-not-allowed grayscale' : ''}
    `}>
      <div className="flex items-center gap-3">
        {icon}
        <span className="text-sm font-medium">{label}</span>
      </div>
      {active && <ChevronRight size={14} />}
      {disabled && <span className="text-[10px] font-bold uppercase tracking-wider bg-slate-200 text-slate-500 px-1.5 py-0.5 rounded">Em breve</span>}
    </div>
  );
}

function StatCard({ label, value, icon, trend }: { label: string, value: number, icon: React.ReactNode, trend: string }) {
  return (
    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center">
          {icon}
        </div>
        <span className="text-xs font-medium text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full">{trend}</span>
      </div>
      <p className="text-slate-500 text-sm font-medium mb-1">{label}</p>
      <h4 className="text-3xl font-bold text-slate-800">{value}</h4>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const styles = {
    'Ativo': 'bg-emerald-100 text-emerald-700',
    'Experimental': 'bg-amber-100 text-amber-700',
    'Inativo': 'bg-slate-100 text-slate-700',
  }[status] || 'bg-slate-100 text-slate-700';

  return (
    <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${styles}`}>
      {status}
    </span>
  );
}
