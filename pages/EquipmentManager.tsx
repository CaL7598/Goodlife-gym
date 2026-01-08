import React, { useState, useEffect } from 'react';
import { GymEquipment, UserRole } from '../types';
import { Search, Plus, Edit2, Trash2, X, Save, Image as ImageIcon, AlertCircle, CheckCircle2, Wrench, Activity } from 'lucide-react';
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
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
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
    category: 'Cardio',
    description: '',
    price: '',
    status: 'active',
    location: '',
    features: []
  });

  const categories = ['all', 'Cardio', 'Strength', 'Free Weights', 'Accessories'];

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

    if (!newEquipment.name || !newEquipment.category || !newEquipment.description) {
      showError('Please fill in all required fields (Name, Category, Description)');
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
        category: newEquipment.category!,
        description: newEquipment.description!,
        price: newEquipment.price,
        imageUrl: newEquipment.imageUrl,
        features: newEquipment.features || [],
        status: newEquipment.status || 'active',
        location: newEquipment.location,
        purchaseDate: newEquipment.purchaseDate,
        warrantyExpiry: newEquipment.warrantyExpiry,
        serialNumber: newEquipment.serialNumber,
        notes: newEquipment.notes
      });

      setEquipment(prev => [created, ...prev]);
      logActivity('Add Equipment', `Added equipment: ${created.name} (${created.category})`, 'admin');
      showSuccess(`Equipment "${created.name}" added successfully!`);

      // Reset form
      setNewEquipment({
        name: '',
        category: 'Cardio',
        description: '',
        price: '',
        status: 'active',
        location: '',
        features: []
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
        category: editingEquipment.category,
        description: editingEquipment.description,
        price: editingEquipment.price,
        imageUrl: editingEquipment.imageUrl,
        features: editingEquipment.features,
        status: editingEquipment.status,
        location: editingEquipment.location,
        purchaseDate: editingEquipment.purchaseDate,
        warrantyExpiry: editingEquipment.warrantyExpiry,
        serialNumber: editingEquipment.serialNumber,
        notes: editingEquipment.notes
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

  const addFeature = (feature: string) => {
    if (!feature.trim()) return;
    if (editingEquipment) {
      setEditingEquipment({
        ...editingEquipment,
        features: [...(editingEquipment.features || []), feature.trim()]
      });
    } else {
      setNewEquipment({
        ...newEquipment,
        features: [...(newEquipment.features || []), feature.trim()]
      });
    }
  };

  const removeFeature = (index: number) => {
    if (editingEquipment) {
      setEditingEquipment({
        ...editingEquipment,
        features: editingEquipment.features?.filter((_, i) => i !== index) || []
      });
    } else {
      setNewEquipment({
        ...newEquipment,
        features: newEquipment.features?.filter((_, i) => i !== index) || []
      });
    }
  };

  const filteredEquipment = equipment.filter(eq => {
    const matchesSearch = eq.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         eq.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         eq.category.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || eq.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

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
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">Equipment Management</h1>
          <p className="text-slate-600 mt-1">Manage all gym equipment inventory</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="px-4 py-2 bg-rose-600 text-white rounded-lg hover:bg-rose-700 transition-colors flex items-center gap-2 font-semibold"
        >
          <Plus size={20} />
          Add Equipment
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow-sm border border-slate-200">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={20} />
              <input
                type="text"
                placeholder="Search equipment..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-transparent"
              />
            </div>
          </div>
          <div className="flex gap-2 flex-wrap">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  selectedCategory === cat
                    ? 'bg-rose-600 text-white'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                {cat.charAt(0).toUpperCase() + cat.slice(1)}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Equipment Grid */}
      {filteredEquipment.length === 0 ? (
        <div className="bg-white p-12 rounded-lg shadow-sm border border-slate-200 text-center">
          <Activity className="mx-auto text-slate-400 mb-4" size={48} />
          <p className="text-slate-600 text-lg">No equipment found</p>
          <p className="text-slate-500 text-sm mt-2">
            {searchTerm || selectedCategory !== 'all' 
              ? 'Try adjusting your search or filters' 
              : 'Add your first piece of equipment to get started'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredEquipment.map((eq) => (
            <div key={eq.id} className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden hover:shadow-lg transition-shadow">
              {eq.imageUrl && (
                <div className="h-48 bg-slate-100 overflow-hidden">
                  <img src={eq.imageUrl} alt={eq.name} className="w-full h-full object-cover" />
                </div>
              )}
              <div className="p-4">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <h3 className="font-bold text-lg text-slate-900">{eq.name}</h3>
                    <span className="inline-block px-2 py-1 bg-rose-100 text-rose-600 text-xs font-semibold rounded mt-1">
                      {eq.category}
                    </span>
                  </div>
                  <div className="flex gap-1">
                    <button
                      onClick={() => handleEditClick(eq)}
                      className="p-1 text-slate-600 hover:text-rose-600 transition-colors"
                      title="Edit"
                    >
                      <Edit2 size={18} />
                    </button>
                    <button
                      onClick={() => handleDeleteClick(eq)}
                      className="p-1 text-slate-600 hover:text-red-600 transition-colors"
                      title="Delete"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
                <p className="text-slate-600 text-sm mb-3 line-clamp-2">{eq.description}</p>
                {eq.price && (
                  <p className="text-rose-600 font-bold mb-2">{eq.price}</p>
                )}
                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <span className={`px-2 py-1 rounded ${
                    eq.status === 'active' ? 'bg-green-100 text-green-700' :
                    eq.status === 'maintenance' ? 'bg-yellow-100 text-yellow-700' :
                    'bg-slate-100 text-slate-700'
                  }`}>
                    {eq.status}
                  </span>
                  {eq.location && <span>📍 {eq.location}</span>}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Equipment Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-slate-200 p-4 flex justify-between items-center">
              <h2 className="text-xl font-bold text-slate-900">Add New Equipment</h2>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-600">
                <X size={24} />
              </button>
            </div>
            <form onSubmit={handleAddEquipment} className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Name *</label>
                  <input
                    type="text"
                    value={newEquipment.name || ''}
                    onChange={(e) => setNewEquipment({...newEquipment, name: e.target.value})}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-rose-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Category *</label>
                  <select
                    value={newEquipment.category || 'Cardio'}
                    onChange={(e) => setNewEquipment({...newEquipment, category: e.target.value})}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-rose-500"
                    required
                  >
                    <option value="Cardio">Cardio</option>
                    <option value="Strength">Strength</option>
                    <option value="Free Weights">Free Weights</option>
                    <option value="Accessories">Accessories</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Description *</label>
                <textarea
                  value={newEquipment.description || ''}
                  onChange={(e) => setNewEquipment({...newEquipment, description: e.target.value})}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-rose-500"
                  rows={3}
                  required
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Price</label>
                  <input
                    type="text"
                    value={newEquipment.price || ''}
                    onChange={(e) => setNewEquipment({...newEquipment, price: e.target.value})}
                    placeholder="₵15,000"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-rose-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Status</label>
                  <select
                    value={newEquipment.status || 'active'}
                    onChange={(e) => setNewEquipment({...newEquipment, status: e.target.value as any})}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-rose-500"
                  >
                    <option value="active">Active</option>
                    <option value="maintenance">Maintenance</option>
                    <option value="retired">Retired</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Image URL</label>
                  <input
                    type="text"
                    value={newEquipment.imageUrl || ''}
                    onChange={(e) => setNewEquipment({...newEquipment, imageUrl: e.target.value})}
                    placeholder="https://..."
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-rose-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Location</label>
                  <input
                    type="text"
                    value={newEquipment.location || ''}
                    onChange={(e) => setNewEquipment({...newEquipment, location: e.target.value})}
                    placeholder="Sunyani Airport Branch"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-rose-500"
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Purchase Date</label>
                  <input
                    type="date"
                    value={newEquipment.purchaseDate || ''}
                    onChange={(e) => setNewEquipment({...newEquipment, purchaseDate: e.target.value})}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-rose-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Warranty Expiry</label>
                  <input
                    type="date"
                    value={newEquipment.warrantyExpiry || ''}
                    onChange={(e) => setNewEquipment({...newEquipment, warrantyExpiry: e.target.value})}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-rose-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Serial Number</label>
                <input
                  type="text"
                  value={newEquipment.serialNumber || ''}
                  onChange={(e) => setNewEquipment({...newEquipment, serialNumber: e.target.value})}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-rose-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Features</label>
                <div className="flex gap-2 mb-2">
                  <input
                    type="text"
                    placeholder="Add a feature..."
                    className="flex-1 px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-rose-500"
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        addFeature(e.currentTarget.value);
                        e.currentTarget.value = '';
                      }
                    }}
                  />
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      const input = e.currentTarget.previousElementSibling as HTMLInputElement;
                      if (input) {
                        addFeature(input.value);
                        input.value = '';
                      }
                    }}
                    className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200"
                  >
                    Add
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {(newEquipment.features || []).map((feature, idx) => (
                    <span key={idx} className="px-3 py-1 bg-rose-100 text-rose-700 rounded-full text-sm flex items-center gap-2">
                      {feature}
                      <button
                        type="button"
                        onClick={() => removeFeature(idx)}
                        className="hover:text-rose-900"
                      >
                        <X size={14} />
                      </button>
                    </span>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Notes</label>
                <textarea
                  value={newEquipment.notes || ''}
                  onChange={(e) => setNewEquipment({...newEquipment, notes: e.target.value})}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-rose-500"
                  rows={2}
                />
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
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-slate-200 p-4 flex justify-between items-center">
              <h2 className="text-xl font-bold text-slate-900">Edit Equipment</h2>
              <button onClick={() => setShowEditModal(false)} className="text-slate-400 hover:text-slate-600">
                <X size={24} />
              </button>
            </div>
            <form onSubmit={handleUpdateEquipment} className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Name *</label>
                  <input
                    type="text"
                    value={editingEquipment.name}
                    onChange={(e) => setEditingEquipment({...editingEquipment, name: e.target.value})}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-rose-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Category *</label>
                  <select
                    value={editingEquipment.category}
                    onChange={(e) => setEditingEquipment({...editingEquipment, category: e.target.value})}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-rose-500"
                    required
                  >
                    <option value="Cardio">Cardio</option>
                    <option value="Strength">Strength</option>
                    <option value="Free Weights">Free Weights</option>
                    <option value="Accessories">Accessories</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Description *</label>
                <textarea
                  value={editingEquipment.description}
                  onChange={(e) => setEditingEquipment({...editingEquipment, description: e.target.value})}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-rose-500"
                  rows={3}
                  required
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Price</label>
                  <input
                    type="text"
                    value={editingEquipment.price || ''}
                    onChange={(e) => setEditingEquipment({...editingEquipment, price: e.target.value})}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-rose-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Status</label>
                  <select
                    value={editingEquipment.status}
                    onChange={(e) => setEditingEquipment({...editingEquipment, status: e.target.value as any})}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-rose-500"
                  >
                    <option value="active">Active</option>
                    <option value="maintenance">Maintenance</option>
                    <option value="retired">Retired</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Image URL</label>
                  <input
                    type="text"
                    value={editingEquipment.imageUrl || ''}
                    onChange={(e) => setEditingEquipment({...editingEquipment, imageUrl: e.target.value})}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-rose-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Location</label>
                  <input
                    type="text"
                    value={editingEquipment.location || ''}
                    onChange={(e) => setEditingEquipment({...editingEquipment, location: e.target.value})}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-rose-500"
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Purchase Date</label>
                  <input
                    type="date"
                    value={editingEquipment.purchaseDate || ''}
                    onChange={(e) => setEditingEquipment({...editingEquipment, purchaseDate: e.target.value})}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-rose-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Warranty Expiry</label>
                  <input
                    type="date"
                    value={editingEquipment.warrantyExpiry || ''}
                    onChange={(e) => setEditingEquipment({...editingEquipment, warrantyExpiry: e.target.value})}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-rose-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Serial Number</label>
                <input
                  type="text"
                  value={editingEquipment.serialNumber || ''}
                  onChange={(e) => setEditingEquipment({...editingEquipment, serialNumber: e.target.value})}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-rose-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Features</label>
                <div className="flex gap-2 mb-2">
                  <input
                    type="text"
                    placeholder="Add a feature..."
                    className="flex-1 px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-rose-500"
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        addFeature(e.currentTarget.value);
                        e.currentTarget.value = '';
                      }
                    }}
                  />
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      const input = e.currentTarget.previousElementSibling as HTMLInputElement;
                      if (input) {
                        addFeature(input.value);
                        input.value = '';
                      }
                    }}
                    className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200"
                  >
                    Add
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {(editingEquipment.features || []).map((feature, idx) => (
                    <span key={idx} className="px-3 py-1 bg-rose-100 text-rose-700 rounded-full text-sm flex items-center gap-2">
                      {feature}
                      <button
                        type="button"
                        onClick={() => removeFeature(idx)}
                        className="hover:text-rose-900"
                      >
                        <X size={14} />
                      </button>
                    </span>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Notes</label>
                <textarea
                  value={editingEquipment.notes || ''}
                  onChange={(e) => setEditingEquipment({...editingEquipment, notes: e.target.value})}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-rose-500"
                  rows={2}
                />
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
