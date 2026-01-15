import React, { useState, useEffect } from 'react';
import { GymEquipment, UserRole } from '../types';
import { Search, Plus, Edit2, Trash2, X, Save, AlertCircle, CheckCircle2, Activity } from 'lucide-react';
import { equipmentService } from '../lib/database';
import { useToast } from '../contexts/ToastContext';
import ConfirmModal from '../components/ConfirmModal';

interface EquipmentManagerProps {
  role: UserRole;
  logActivity: (action: string, details: string, category: 'access' | 'admin' | 'financial') => void;
}

const EquipmentManager: React.FC<EquipmentManagerProps> = ({ role, logActivity }) => {
  const { showSuccess, showError } = useToast();
  const [equipment, setEquipment] = useState<GymEquipment[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterState, setFilterState] = useState<string>('all');
  const [filterCondition, setFilterCondition] = useState<string>('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingEquipment, setEditingEquipment] = useState<GymEquipment | null>(null);
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    message: string;
    onConfirm: () => void;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const [newEquipment, setNewEquipment] = useState<Partial<GymEquipment>>({
    name: '',
    state: 'old',
    condition: 'non-faulty'
  });

  // Load equipment from database
  useEffect(() => {
    loadEquipment();
  }, []);

  const loadEquipment = async () => {
    setIsLoading(true);
    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

      if (supabaseUrl && supabaseKey) {
        const data = await equipmentService.getAll();
        setEquipment(data);
      } else {
        showError('Database not configured. Please configure Supabase.');
      }
    } catch (error: any) {
      console.error('Error loading equipment:', error);
      showError(`Failed to load equipment: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddEquipment = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newEquipment.name || !newEquipment.state || !newEquipment.condition) {
      showError('Please fill in all required fields (Name, State, Condition)');
      return;
    }

    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

      if (!supabaseUrl || !supabaseKey) {
        showError('Database not configured. Cannot save equipment.');
        return;
      }

      const created = await equipmentService.create({
        name: newEquipment.name!,
        state: newEquipment.state as 'old' | 'new',
        condition: newEquipment.condition as 'faulty' | 'non-faulty'
      });

      setEquipment(prev => [created, ...prev]);
      logActivity('Add Equipment', `Added equipment: ${created.name} (${created.state}, ${created.condition})`, 'admin');
      showSuccess(`Equipment "${created.name}" added successfully!`);

      // Reset form
      setNewEquipment({
        name: '',
        state: 'old',
        condition: 'non-faulty'
      });
      setShowAddModal(false);
    } catch (error: any) {
      console.error('Error adding equipment:', error);
      showError(`Failed to add equipment: ${error.message}`);
    }
  };

  const handleEditClick = (eq: GymEquipment) => {
    setEditingEquipment(eq);
    setShowEditModal(true);
  };

  const handleUpdateEquipment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingEquipment) return;

    try {
      const updated = await equipmentService.update(editingEquipment.id, {
        name: editingEquipment.name,
        state: editingEquipment.state,
        condition: editingEquipment.condition
      });

      setEquipment(prev => prev.map(eq => eq.id === updated.id ? updated : eq));
      logActivity('Update Equipment', `Updated equipment: ${updated.name}`, 'admin');
      showSuccess(`Equipment "${updated.name}" updated successfully!`);
      setShowEditModal(false);
      setEditingEquipment(null);
    } catch (error: any) {
      console.error('Error updating equipment:', error);
      showError(`Failed to update equipment: ${error.message}`);
    }
  };

  const handleDeleteClick = (eq: GymEquipment) => {
    setConfirmModal({
      isOpen: true,
      message: `Are you sure you want to delete "${eq.name}"? This action cannot be undone.`,
      onConfirm: async () => {
        try {
          await equipmentService.delete(eq.id);
          setEquipment(prev => prev.filter(e => e.id !== eq.id));
          logActivity('Delete Equipment', `Deleted equipment: ${eq.name}`, 'admin');
          showSuccess(`Equipment "${eq.name}" deleted successfully!`);
          setConfirmModal(null);
        } catch (error: any) {
          console.error('Error deleting equipment:', error);
          showError(`Failed to delete equipment: ${error.message}`);
          setConfirmModal(null);
        }
      }
    });
  };

  const filteredEquipment = equipment.filter(eq => {
    const matchesSearch = eq.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesState = filterState === 'all' || eq.state === filterState;
    const matchesCondition = filterCondition === 'all' || eq.condition === filterCondition;
    return matchesSearch && matchesState && matchesCondition;
  });

  // Calculate statistics
  const stats = {
    total: equipment.length,
    new: equipment.filter(eq => eq.state === 'new').length,
    old: equipment.filter(eq => eq.state === 'old').length,
    faulty: equipment.filter(eq => eq.condition === 'faulty').length,
    nonFaulty: equipment.filter(eq => eq.condition === 'non-faulty').length
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-rose-600 mx-auto mb-4"></div>
          <p className="text-slate-600">Loading equipment...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">Equipment Inventory</h1>
          <p className="text-slate-600 mt-1">Track all gym equipment and their condition</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="px-4 py-2 bg-rose-600 text-white rounded-lg hover:bg-rose-700 transition-colors flex items-center gap-2 font-semibold"
        >
          <Plus size={20} />
          Add Equipment
        </button>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <div className="bg-white p-4 rounded-lg shadow-sm border border-slate-200">
          <p className="text-slate-600 text-sm mb-1">Total Equipment</p>
          <p className="text-2xl font-bold text-slate-900">{stats.total}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm border border-slate-200">
          <p className="text-slate-600 text-sm mb-1">New</p>
          <p className="text-2xl font-bold text-green-600">{stats.new}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm border border-slate-200">
          <p className="text-slate-600 text-sm mb-1">Old</p>
          <p className="text-2xl font-bold text-amber-600">{stats.old}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm border border-slate-200">
          <p className="text-slate-600 text-sm mb-1">Faulty</p>
          <p className="text-2xl font-bold text-red-600">{stats.faulty}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm border border-slate-200">
          <p className="text-slate-600 text-sm mb-1">Non-Faulty</p>
          <p className="text-2xl font-bold text-green-600">{stats.nonFaulty}</p>
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
                placeholder="Search equipment by name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-transparent"
              />
            </div>
          </div>
          <div className="flex gap-2 flex-wrap">
            <select
              value={filterState}
              onChange={(e) => setFilterState(e.target.value)}
              className="px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-rose-500"
            >
              <option value="all">All States</option>
              <option value="new">New</option>
              <option value="old">Old</option>
            </select>
            <select
              value={filterCondition}
              onChange={(e) => setFilterCondition(e.target.value)}
              className="px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-rose-500"
            >
              <option value="all">All Conditions</option>
              <option value="non-faulty">Non-Faulty</option>
              <option value="faulty">Faulty</option>
            </select>
          </div>
        </div>
      </div>

      {/* Equipment Table */}
      {filteredEquipment.length === 0 ? (
        <div className="bg-white p-12 rounded-lg shadow-sm border border-slate-200 text-center">
          <Activity className="mx-auto text-slate-400 mb-4" size={48} />
          <p className="text-slate-600 text-lg">No equipment found</p>
          <p className="text-slate-500 text-sm mt-2">
            {searchTerm || filterState !== 'all' || filterCondition !== 'all'
              ? 'Try adjusting your search or filters' 
              : 'Add your first piece of equipment to get started'}
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-700 uppercase tracking-wider">Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-700 uppercase tracking-wider">State</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-700 uppercase tracking-wider">Condition</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-slate-700 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-slate-200">
                {filteredEquipment.map((eq) => (
                  <tr key={eq.id} className="hover:bg-slate-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-slate-900">{eq.name}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                        eq.state === 'new' 
                          ? 'bg-green-100 text-green-700' 
                          : 'bg-amber-100 text-amber-700'
                      }`}>
                        {eq.state === 'new' ? 'New' : 'Old'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs font-semibold rounded-full flex items-center gap-1 w-fit ${
                        eq.condition === 'non-faulty' 
                          ? 'bg-green-100 text-green-700' 
                          : 'bg-red-100 text-red-700'
                      }`}>
                        {eq.condition === 'non-faulty' ? (
                          <CheckCircle2 size={14} />
                        ) : (
                          <AlertCircle size={14} />
                        )}
                        {eq.condition === 'non-faulty' ? 'Non-Faulty' : 'Faulty'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => handleEditClick(eq)}
                          className="text-rose-600 hover:text-rose-900 transition-colors"
                          title="Edit"
                        >
                          <Edit2 size={18} />
                        </button>
                        <button
                          onClick={() => handleDeleteClick(eq)}
                          className="text-red-600 hover:text-red-900 transition-colors"
                          title="Delete"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add Equipment Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full">
            <div className="border-b border-slate-200 p-4 flex justify-between items-center">
              <h2 className="text-xl font-bold text-slate-900">Add New Equipment</h2>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-600">
                <X size={24} />
              </button>
            </div>
            <form onSubmit={handleAddEquipment} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Equipment Name *</label>
                <input
                  type="text"
                  value={newEquipment.name || ''}
                  onChange={(e) => setNewEquipment({...newEquipment, name: e.target.value})}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-rose-500"
                  placeholder="e.g., Treadmill, Dumbbells, Bench Press"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">State *</label>
                <select
                  value={newEquipment.state || 'old'}
                  onChange={(e) => setNewEquipment({...newEquipment, state: e.target.value as 'old' | 'new'})}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-rose-500"
                  required
                >
                  <option value="old">Old</option>
                  <option value="new">New</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Condition *</label>
                <select
                  value={newEquipment.condition || 'non-faulty'}
                  onChange={(e) => setNewEquipment({...newEquipment, condition: e.target.value as 'faulty' | 'non-faulty'})}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-rose-500"
                  required
                >
                  <option value="non-faulty">Non-Faulty</option>
                  <option value="faulty">Faulty</option>
                </select>
              </div>
              <div className="flex gap-3 pt-4 border-t">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-rose-600 text-white rounded-lg hover:bg-rose-700 flex items-center justify-center gap-2"
                >
                  <Save size={18} />
                  Add Equipment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Equipment Modal */}
      {showEditModal && editingEquipment && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full">
            <div className="border-b border-slate-200 p-4 flex justify-between items-center">
              <h2 className="text-xl font-bold text-slate-900">Edit Equipment</h2>
              <button onClick={() => setShowEditModal(false)} className="text-slate-400 hover:text-slate-600">
                <X size={24} />
              </button>
            </div>
            <form onSubmit={handleUpdateEquipment} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Equipment Name *</label>
                <input
                  type="text"
                  value={editingEquipment.name}
                  onChange={(e) => setEditingEquipment({...editingEquipment, name: e.target.value})}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-rose-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">State *</label>
                <select
                  value={editingEquipment.state}
                  onChange={(e) => setEditingEquipment({...editingEquipment, state: e.target.value as 'old' | 'new'})}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-rose-500"
                  required
                >
                  <option value="new">New</option>
                  <option value="old">Old</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Condition *</label>
                <select
                  value={editingEquipment.condition}
                  onChange={(e) => setEditingEquipment({...editingEquipment, condition: e.target.value as 'faulty' | 'non-faulty'})}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-rose-500"
                  required
                >
                  <option value="non-faulty">Non-Faulty</option>
                  <option value="faulty">Faulty</option>
                </select>
              </div>
              <div className="flex gap-3 pt-4 border-t">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="flex-1 px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-rose-600 text-white rounded-lg hover:bg-rose-700 flex items-center justify-center gap-2"
                >
                  <Save size={18} />
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {confirmModal && (
        <ConfirmModal
          isOpen={confirmModal.isOpen}
          message={confirmModal.message}
          onConfirm={confirmModal.onConfirm}
          onCancel={() => setConfirmModal(null)}
        />
      )}
    </div>
  );
};

export default EquipmentManager;
