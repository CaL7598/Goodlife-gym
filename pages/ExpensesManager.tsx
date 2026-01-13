import React, { useState, useEffect } from 'react';
import { Expense, UserRole, StaffMember } from '../types';
import { Search, Plus, Trash2, X, Save, Edit2, DollarSign, Calendar, Clock, User, FileText, TrendingUp } from 'lucide-react';
import { expensesService } from '../lib/database';
import { useToast } from '../contexts/ToastContext';
import ConfirmModal from '../components/ConfirmModal';

interface ExpensesManagerProps {
  role: UserRole;
  userEmail: string;
  staff: StaffMember[];
  logActivity: (action: string, details: string, category: 'access' | 'admin' | 'financial') => void;
}

type FilterPeriod = 'all' | 'today' | 'week' | 'month';

const ExpensesManager: React.FC<ExpensesManagerProps> = ({ role, userEmail, staff, logActivity }) => {
  const { showSuccess, showError } = useToast();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterPeriod, setFilterPeriod] = useState<FilterPeriod>('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{
    isOpen: boolean;
    expense: Expense | null;
    onConfirm: () => void;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [newExpense, setNewExpense] = useState<Partial<Expense>>({
    itemName: '',
    description: '',
    amount: 0,
    dateTime: new Date().toISOString().slice(0, 16),
    staffName: ''
  });

  // Get current staff member
  const currentStaff = staff.find(s => s.email === userEmail);

  // Load expenses from database
  useEffect(() => {
    loadExpenses();
  }, []);

  useEffect(() => {
    if (currentStaff) {
      setNewExpense(prev => ({ ...prev, staffName: currentStaff.fullName }));
    }
  }, [currentStaff]);

  const loadExpenses = async () => {
    setIsLoading(true);
    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

      if (supabaseUrl && supabaseKey) {
        const data = await expensesService.getAll();
        setExpenses(data);
      } else {
        showError('Database not configured. Please configure Supabase.');
      }
    } catch (error: any) {
      console.error('Error loading expenses:', error);
      showError(`Failed to load expenses: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddExpense = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newExpense.itemName || !newExpense.amount || newExpense.amount <= 0 || !newExpense.dateTime || !newExpense.staffName) {
      showError('Please fill in all required fields with valid values');
      return;
    }

    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

      if (!supabaseUrl || !supabaseKey) {
        showError('Database not configured. Cannot save expense.');
        return;
      }

      const createdExpense = await expensesService.create({
        itemName: newExpense.itemName!,
        description: newExpense.description || '',
        amount: newExpense.amount!,
        dateTime: new Date(newExpense.dateTime!).toISOString(),
        staffName: newExpense.staffName!,
        staffEmail: currentStaff?.email
      });

      setExpenses(prev => [createdExpense, ...prev]);
      logActivity('Add Expense', `Added expense: ${createdExpense.itemName} - ₵${createdExpense.amount.toLocaleString()}`, 'financial');
      showSuccess(`Expense recorded successfully!`);

      // Reset form
      setNewExpense({
        itemName: '',
        description: '',
        amount: 0,
        dateTime: new Date().toISOString().slice(0, 16),
        staffName: currentStaff?.fullName || ''
      });
      setShowAddModal(false);
    } catch (error: any) {
      console.error('Error adding expense:', error);
      showError(`Failed to add expense: ${error.message}`);
    }
  };

  const handleEditExpense = (expense: Expense) => {
    setEditingExpense(expense);
    setShowEditModal(true);
  };

  const handleUpdateExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingExpense) return;

    try {
      const updatedExpense = await expensesService.update(editingExpense.id, editingExpense);
      setExpenses(prev => prev.map(e => e.id === updatedExpense.id ? updatedExpense : e));
      logActivity('Update Expense', `Updated expense: ${updatedExpense.itemName} - ₵${updatedExpense.amount.toLocaleString()}`, 'financial');
      showSuccess(`Expense updated successfully!`);
      setShowEditModal(false);
      setEditingExpense(null);
    } catch (error: any) {
      console.error('Error updating expense:', error);
      showError(`Failed to update expense: ${error.message}`);
    }
  };

  const handleDeleteExpense = (expense: Expense) => {
    setDeleteConfirm({
      isOpen: true,
      expense,
      onConfirm: async () => {
        try {
          await expensesService.delete(expense.id);
          setExpenses(prev => prev.filter(e => e.id !== expense.id));
          logActivity('Delete Expense', `Deleted expense: ${expense.itemName} - ₵${expense.amount.toLocaleString()}`, 'financial');
          showSuccess(`Expense deleted successfully!`);
          setDeleteConfirm(null);
        } catch (error: any) {
          console.error('Error deleting expense:', error);
          showError(`Failed to delete expense: ${error.message}`);
          setDeleteConfirm(null);
        }
      }
    });
  };

  // Filter expenses based on period
  const getFilteredExpenses = () => {
    let filtered = expenses;

    // Apply date filter
    const now = new Date();
    switch (filterPeriod) {
      case 'today':
        const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        filtered = filtered.filter(e => new Date(e.dateTime) >= todayStart);
        break;
      case 'week':
        const weekStart = new Date(now);
        weekStart.setDate(now.getDate() - 7);
        filtered = filtered.filter(e => new Date(e.dateTime) >= weekStart);
        break;
      case 'month':
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
        filtered = filtered.filter(e => new Date(e.dateTime) >= monthStart);
        break;
    }

    // Apply search filter
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(e =>
        e.itemName.toLowerCase().includes(searchLower) ||
        (e.description && e.description.toLowerCase().includes(searchLower)) ||
        e.staffName.toLowerCase().includes(searchLower)
      );
    }

    return filtered;
  };

  const filteredExpenses = getFilteredExpenses();

  // Calculate totals
  const totalExpenses = filteredExpenses.reduce((sum, e) => sum + e.amount, 0);
  const todayTotal = expenses
    .filter(e => {
      const expenseDate = new Date(e.dateTime);
      const today = new Date();
      return expenseDate.toDateString() === today.toDateString();
    })
    .reduce((sum, e) => sum + e.amount, 0);
  const weekTotal = expenses
    .filter(e => {
      const expenseDate = new Date(e.dateTime);
      const weekStart = new Date();
      weekStart.setDate(weekStart.getDate() - 7);
      return expenseDate >= weekStart;
    })
    .reduce((sum, e) => sum + e.amount, 0);
  const monthTotal = expenses
    .filter(e => {
      const expenseDate = new Date(e.dateTime);
      const monthStart = new Date();
      monthStart.setDate(1);
      return expenseDate >= monthStart;
    })
    .reduce((sum, e) => sum + e.amount, 0);

  const formatDateTime = (dateTime: string) => {
    try {
      const date = new Date(dateTime);
      return {
        date: date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }),
        time: date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
      };
    } catch {
      return { date: 'Invalid Date', time: '' };
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-rose-600 mx-auto mb-4"></div>
          <p className="text-slate-600">Loading expenses...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {deleteConfirm && (
        <ConfirmModal
          isOpen={deleteConfirm.isOpen}
          title="Delete Expense"
          message={`Are you sure you want to delete the expense "${deleteConfirm.expense?.itemName}" (₵${deleteConfirm.expense?.amount.toLocaleString()})? This action cannot be undone.`}
          confirmText="Delete"
          cancelText="Cancel"
          type="danger"
          onConfirm={deleteConfirm.onConfirm}
          onCancel={() => setDeleteConfirm(null)}
        />
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 flex items-center gap-3">
            <DollarSign className="text-rose-600" size={28} />
            Expense Tracking
          </h1>
          <p className="text-slate-500 mt-1">Record and track all gym expenses and purchases</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg font-medium transition-colors w-full sm:w-auto justify-center"
        >
          <Plus size={20} />
          Add Expense
        </button>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg shadow-sm border border-slate-200">
          <p className="text-slate-600 text-sm mb-1">Total Expenses</p>
          <p className="text-2xl font-bold text-slate-900">₵{totalExpenses.toLocaleString()}</p>
          <p className="text-xs text-slate-500 mt-1">Based on current filter</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm border border-slate-200">
          <p className="text-slate-600 text-sm mb-1">Today</p>
          <p className="text-2xl font-bold text-emerald-600">₵{todayTotal.toLocaleString()}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm border border-slate-200">
          <p className="text-slate-600 text-sm mb-1">This Week</p>
          <p className="text-2xl font-bold text-blue-600">₵{weekTotal.toLocaleString()}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm border border-slate-200">
          <p className="text-slate-600 text-sm mb-1">This Month</p>
          <p className="text-2xl font-bold text-rose-600">₵{monthTotal.toLocaleString()}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow-sm border border-slate-200">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={20} />
              <input
                type="text"
                placeholder="Search by item name, description, or staff name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-transparent"
              />
            </div>
          </div>
          <div className="flex gap-2">
            <select
              value={filterPeriod}
              onChange={(e) => setFilterPeriod(e.target.value as FilterPeriod)}
              className="px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-rose-500"
            >
              <option value="all">All Time</option>
              <option value="today">Today</option>
              <option value="week">This Week</option>
              <option value="month">This Month</option>
            </select>
          </div>
        </div>
      </div>

      {/* Expenses List */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        {filteredExpenses.length === 0 ? (
          <div className="p-12 text-center">
            <FileText className="mx-auto text-slate-300 mb-4" size={48} />
            <p className="text-slate-500 text-lg">No expenses found</p>
            <p className="text-slate-400 text-sm mt-2">
              {searchTerm || filterPeriod !== 'all' ? 'Try adjusting your search or filter' : 'Add your first expense to get started'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Item</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Description</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Amount</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Date & Time</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Recorded By</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {filteredExpenses.map((expense) => {
                  const { date, time } = formatDateTime(expense.dateTime);
                  return (
                    <tr key={expense.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-2">
                          <TrendingUp size={16} className="text-slate-400" />
                          <span className="font-semibold text-slate-900">{expense.itemName}</span>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <p className="text-slate-700 text-sm max-w-md">{expense.description || '-'}</p>
                      </td>
                      <td className="px-4 py-4">
                        <span className="font-bold text-rose-600">₵{expense.amount.toLocaleString()}</span>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-2 text-slate-600">
                          <Calendar size={16} className="text-slate-400" />
                          <div>
                            <div className="text-sm font-medium">{date}</div>
                            <div className="text-xs text-slate-500 flex items-center gap-1">
                              <Clock size={12} />
                              {time}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-2 text-slate-600">
                          <User size={16} className="text-slate-400" />
                          <span className="text-sm">{expense.staffName}</span>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-2">
                          {role === UserRole.SUPER_ADMIN && (
                            <>
                              <button
                                onClick={() => handleEditExpense(expense)}
                                className="p-2 text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                                title="Edit expense"
                              >
                                <Edit2 size={18} />
                              </button>
                              <button
                                onClick={() => handleDeleteExpense(expense)}
                                className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                title="Delete expense"
                              >
                                <Trash2 size={18} />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add Expense Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between">
              <h2 className="text-xl font-bold text-slate-900">Add Expense</h2>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleAddExpense} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Item Name *</label>
                <input
                  type="text"
                  value={newExpense.itemName || ''}
                  onChange={(e) => setNewExpense({ ...newExpense, itemName: e.target.value })}
                  placeholder="e.g., Cleaning supplies, Equipment parts"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
                <textarea
                  value={newExpense.description || ''}
                  onChange={(e) => setNewExpense({ ...newExpense, description: e.target.value })}
                  placeholder="Optional description..."
                  rows={3}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Amount (₵) *</label>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={newExpense.amount || ''}
                  onChange={(e) => setNewExpense({ ...newExpense, amount: parseFloat(e.target.value) || 0 })}
                  placeholder="0.00"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Date & Time *</label>
                <input
                  type="datetime-local"
                  value={newExpense.dateTime || ''}
                  onChange={(e) => setNewExpense({ ...newExpense, dateTime: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Recorded By *</label>
                <input
                  type="text"
                  value={newExpense.staffName || ''}
                  onChange={(e) => setNewExpense({ ...newExpense, staffName: e.target.value })}
                  placeholder="Staff name"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-transparent"
                  required
                />
                <p className="text-xs text-slate-500 mt-1">Name of the staff member recording this expense</p>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                >
                  <Save size={18} />
                  Save Expense
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Expense Modal */}
      {showEditModal && editingExpense && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between">
              <h2 className="text-xl font-bold text-slate-900">Edit Expense</h2>
              <button
                onClick={() => {
                  setShowEditModal(false);
                  setEditingExpense(null);
                }}
                className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleUpdateExpense} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Item Name *</label>
                <input
                  type="text"
                  value={editingExpense.itemName}
                  onChange={(e) => setEditingExpense({ ...editingExpense, itemName: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
                <textarea
                  value={editingExpense.description || ''}
                  onChange={(e) => setEditingExpense({ ...editingExpense, description: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Amount (₵) *</label>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={editingExpense.amount}
                  onChange={(e) => setEditingExpense({ ...editingExpense, amount: parseFloat(e.target.value) || 0 })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Date & Time *</label>
                <input
                  type="datetime-local"
                  value={new Date(editingExpense.dateTime).toISOString().slice(0, 16)}
                  onChange={(e) => setEditingExpense({ ...editingExpense, dateTime: new Date(e.target.value).toISOString() })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Recorded By *</label>
                <input
                  type="text"
                  value={editingExpense.staffName}
                  onChange={(e) => setEditingExpense({ ...editingExpense, staffName: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-transparent"
                  required
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowEditModal(false);
                    setEditingExpense(null);
                  }}
                  className="flex-1 px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                >
                  <Save size={18} />
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ExpensesManager;
