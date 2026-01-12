import React, { useState, useEffect } from 'react';
import { StaffMember, UserRole } from '../types';
import { Search, Plus, Trash2, UserPlus, User, Mail, Phone, Briefcase, Shield, X, AlertCircle, Edit2, Save } from 'lucide-react';
import { staffService } from '../lib/database';
import { useToast } from '../contexts/ToastContext';
import ConfirmModal from '../components/ConfirmModal';

interface StaffManagerProps {
  staff: StaffMember[];
  setStaff: React.Dispatch<React.SetStateAction<StaffMember[]>>;
  role: UserRole;
  logActivity: (action: string, details: string, category: 'access' | 'admin' | 'financial') => void;
}

const StaffManager: React.FC<StaffManagerProps> = ({ staff, setStaff, role, logActivity }) => {
  const { showSuccess, showError } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingStaff, setEditingStaff] = useState<StaffMember & { password?: string } | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{
    isOpen: boolean;
    staffMember: StaffMember | null;
    onConfirm: () => void;
  } | null>(null);
  const [newStaff, setNewStaff] = useState<Partial<StaffMember> & { password: string }>({
    fullName: '',
    email: '',
    phone: '',
    position: '',
    role: UserRole.STAFF,
    password: ''
  });

  // Clear form fields on component mount
  useEffect(() => {
    setSearchTerm('');
    setNewStaff({
      fullName: '',
      email: '',
      phone: '',
      position: '',
      role: UserRole.STAFF,
      password: ''
    });
  }, []);

  // Only Super Admin can access this
  if (role !== UserRole.SUPER_ADMIN) {
    return (
      <div className="h-[60vh] flex flex-col items-center justify-center text-center p-6">
        <div className="w-16 h-16 bg-amber-50 text-amber-600 rounded-full flex items-center justify-center mb-4">
          <AlertCircle size={32} />
        </div>
        <h2 className="text-2xl font-bold text-slate-900 mb-2">Access Restricted</h2>
        <p className="text-slate-500 max-w-sm">Staff management is reserved for Super Administrators only.</p>
      </div>
    );
  }

  const filteredStaff = staff.filter(s => {
    const searchLower = searchTerm.toLowerCase();
    return (
      s.fullName.toLowerCase().includes(searchLower) ||
      s.email.toLowerCase().includes(searchLower) ||
      s.position.toLowerCase().includes(searchLower) ||
      s.phone.includes(searchTerm)
    );
  });

  const handleAddStaff = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!newStaff.fullName || !newStaff.email || !newStaff.phone || !newStaff.position || !newStaff.password) {
      showError('Please fill in all required fields');
      return;
    }

    // Check if email already exists
    const emailExists = staff.some(s => s.email.toLowerCase() === newStaff.email?.toLowerCase());
    if (emailExists) {
      showError('A staff member with this email already exists');
      return;
    }

    // Validate password length
    if (newStaff.password.length < 6) {
      showError('Password must be at least 6 characters long');
      return;
    }

    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

      let createdStaff: StaffMember;

      if (supabaseUrl && supabaseKey) {
        // Save to Supabase database
        createdStaff = await staffService.create({
          fullName: newStaff.fullName!,
          email: newStaff.email!,
          phone: newStaff.phone!,
          position: newStaff.position!,
          role: newStaff.role || UserRole.STAFF,
          password: newStaff.password
        });
        console.log('✅ Staff saved to Supabase:', createdStaff.id);
      } else {
        // No Supabase configured, use local state only
        createdStaff = {
          id: Math.random().toString(36).substr(2, 9),
          fullName: newStaff.fullName!,
          email: newStaff.email!,
          phone: newStaff.phone!,
          position: newStaff.position!,
          role: newStaff.role || UserRole.STAFF
        } as StaffMember;
        console.log('📝 Staff saved to local state only (Supabase not configured)');
      }

      // Update local state
      setStaff(prev => [...prev, createdStaff]);
      logActivity('Add Staff', `Created staff account for ${createdStaff.fullName} (${createdStaff.email})`, 'admin');
      
      showSuccess(`Staff member ${createdStaff.fullName} added successfully`);
      setShowAddModal(false);
      setNewStaff({
        fullName: '',
        email: '',
        phone: '',
        position: '',
        role: UserRole.STAFF,
        password: ''
      });
    } catch (error: any) {
      console.error('Error creating staff:', error);
      showError(error.message || 'Failed to create staff member. Please try again.');
    }
  };

  const handleEditStaff = (staffMember: StaffMember) => {
    setEditingStaff({ ...staffMember, password: '' });
    setShowEditModal(true);
  };

  const handleUpdateStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingStaff) return;

    // Validation
    if (!editingStaff.fullName || !editingStaff.email || !editingStaff.phone || !editingStaff.position) {
      showError('Please fill in all required fields');
      return;
    }

    // Check if email already exists (excluding current staff member)
    const emailExists = staff.some(s => 
      s.id !== editingStaff.id && s.email.toLowerCase() === editingStaff.email?.toLowerCase()
    );
    if (emailExists) {
      showError('A staff member with this email already exists');
      return;
    }

    // Validate password if provided
    if (editingStaff.password && editingStaff.password.length < 6) {
      showError('Password must be at least 6 characters long');
      return;
    }

    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

      if (supabaseUrl && supabaseKey) {
        // Prepare update data
        const updateData: Partial<StaffMember> & { password?: string } = {
          fullName: editingStaff.fullName,
          email: editingStaff.email,
          phone: editingStaff.phone,
          position: editingStaff.position,
          role: editingStaff.role
        };

        // Only include password if it was changed
        if (editingStaff.password && editingStaff.password.length > 0) {
          updateData.password = editingStaff.password;
        }

        const updatedStaff = await staffService.update(editingStaff.id, updateData);
        console.log('✅ Staff updated in Supabase:', updatedStaff.id);

        // Update local state
        setStaff(prev => prev.map(s => s.id === updatedStaff.id ? updatedStaff : s));
        logActivity('Update Staff', `Updated staff account for ${updatedStaff.fullName} (${updatedStaff.email})`, 'admin');
        
        showSuccess(`Staff member ${updatedStaff.fullName} updated successfully`);
        setShowEditModal(false);
        setEditingStaff(null);
      } else {
        showError('Database not configured. Cannot update staff member.');
      }
    } catch (error: any) {
      console.error('Error updating staff:', error);
      showError(error.message || 'Failed to update staff member. Please try again.');
    }
  };

  const handleDeleteStaff = (staffMember: StaffMember) => {
    setDeleteConfirm({
      isOpen: true,
      staffMember,
      onConfirm: async () => {
        try {
          const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
          const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

          if (supabaseUrl && supabaseKey) {
            await staffService.delete(staffMember.id);
            console.log('✅ Staff deleted from Supabase:', staffMember.id);
          }

          // Update local state
          setStaff(prev => prev.filter(s => s.id !== staffMember.id));
          logActivity('Delete Staff', `Removed staff member ${staffMember.fullName} (${staffMember.email})`, 'admin');
          
          showSuccess(`Staff member ${staffMember.fullName} deleted successfully`);
          setDeleteConfirm(null);
        } catch (error: any) {
          console.error('Error deleting staff:', error);
          showError(error.message || 'Failed to delete staff member. Please try again.');
        }
      }
    });
  };

  return (
    <>
      {deleteConfirm && (
        <ConfirmModal
          isOpen={deleteConfirm.isOpen}
          title="Delete Staff Member"
          message={`Are you sure you want to delete ${deleteConfirm.staffMember?.fullName}? This action cannot be undone and will revoke their access to the system.`}
          confirmText="Delete"
          cancelText="Cancel"
          type="danger"
          onConfirm={deleteConfirm.onConfirm}
          onCancel={() => setDeleteConfirm(null)}
        />
      )}

      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">Staff Management</h1>
            <p className="text-slate-500 mt-1">Add, view, and manage staff members</p>
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg font-medium transition-colors w-full sm:w-auto justify-center"
          >
            <Plus size={20} />
            Add Staff Member
          </button>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={20} />
          <input
            type="text"
            placeholder="Search by name, email, position, or phone..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-transparent"
          />
        </div>

        {/* Staff List */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          {filteredStaff.length === 0 ? (
            <div className="p-12 text-center">
              <UserPlus className="mx-auto text-slate-300 mb-4" size={48} />
              <p className="text-slate-500 text-lg">No staff members found</p>
              <p className="text-slate-400 text-sm mt-2">
                {searchTerm ? 'Try adjusting your search' : 'Add your first staff member to get started'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Staff Member</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Position</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Contact</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Role</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {filteredStaff.map((staffMember) => (
                    <tr key={staffMember.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-rose-100 flex items-center justify-center">
                            <User size={20} className="text-rose-600" />
                          </div>
                          <div>
                            <div className="font-semibold text-slate-900">{staffMember.fullName}</div>
                            <div className="text-sm text-slate-500">{staffMember.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-2">
                          <Briefcase size={16} className="text-slate-400" />
                          <span className="text-slate-700">{staffMember.position}</span>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-2 text-slate-600">
                          <Phone size={16} className="text-slate-400" />
                          <span>{staffMember.phone}</span>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                          staffMember.role === UserRole.SUPER_ADMIN
                            ? 'bg-amber-100 text-amber-700'
                            : 'bg-blue-100 text-blue-700'
                        }`}>
                          {staffMember.role === UserRole.SUPER_ADMIN ? 'Super Admin' : 'Staff'}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleEditStaff(staffMember)}
                            className="p-2 text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                            title="Edit staff member"
                          >
                            <Edit2 size={18} />
                          </button>
                          <button
                            onClick={() => handleDeleteStaff(staffMember)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Delete staff member"
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
          )}
        </div>
      </div>

      {/* Add Staff Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between">
              <h2 className="text-xl font-bold text-slate-900">Add New Staff Member</h2>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleAddStaff} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Full Name *</label>
                <input
                  type="text"
                  value={newStaff.fullName}
                  onChange={(e) => setNewStaff({ ...newStaff, fullName: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Email *</label>
                <input
                  type="email"
                  value={newStaff.email}
                  onChange={(e) => setNewStaff({ ...newStaff, email: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Phone *</label>
                <input
                  type="tel"
                  value={newStaff.phone}
                  onChange={(e) => setNewStaff({ ...newStaff, phone: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Position *</label>
                <input
                  type="text"
                  value={newStaff.position}
                  onChange={(e) => setNewStaff({ ...newStaff, position: e.target.value })}
                  placeholder="e.g., Front Desk Officer, Trainer, Manager"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Role *</label>
                <select
                  value={newStaff.role}
                  onChange={(e) => setNewStaff({ ...newStaff, role: e.target.value as UserRole })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-transparent"
                  required
                >
                  <option value={UserRole.STAFF}>Staff</option>
                  <option value={UserRole.SUPER_ADMIN}>Super Admin</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Password *</label>
                <input
                  type="password"
                  value={newStaff.password}
                  onChange={(e) => setNewStaff({ ...newStaff, password: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-transparent"
                  placeholder="Minimum 6 characters"
                  minLength={6}
                  required
                />
                <p className="text-xs text-slate-500 mt-1">Staff will use this password to log in</p>
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
                  className="flex-1 px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg font-medium transition-colors"
                >
                  Add Staff Member
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Staff Modal */}
      {showEditModal && editingStaff && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between">
              <h2 className="text-xl font-bold text-slate-900">Edit Staff Member</h2>
              <button
                onClick={() => {
                  setShowEditModal(false);
                  setEditingStaff(null);
                }}
                className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleUpdateStaff} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Full Name *</label>
                <input
                  type="text"
                  value={editingStaff.fullName}
                  onChange={(e) => setEditingStaff({ ...editingStaff, fullName: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Email *</label>
                <input
                  type="email"
                  value={editingStaff.email}
                  onChange={(e) => setEditingStaff({ ...editingStaff, email: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Phone *</label>
                <input
                  type="tel"
                  value={editingStaff.phone}
                  onChange={(e) => setEditingStaff({ ...editingStaff, phone: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Position *</label>
                <input
                  type="text"
                  value={editingStaff.position}
                  onChange={(e) => setEditingStaff({ ...editingStaff, position: e.target.value })}
                  placeholder="e.g., Front Desk Officer, Trainer, Manager"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Role *</label>
                <select
                  value={editingStaff.role}
                  onChange={(e) => setEditingStaff({ ...editingStaff, role: e.target.value as UserRole })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-transparent"
                  required
                >
                  <option value={UserRole.STAFF}>Staff</option>
                  <option value={UserRole.SUPER_ADMIN}>Super Admin</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Password</label>
                <input
                  type="password"
                  value={editingStaff.password || ''}
                  onChange={(e) => setEditingStaff({ ...editingStaff, password: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-transparent"
                  placeholder="Leave blank to keep current password"
                  minLength={6}
                />
                <p className="text-xs text-slate-500 mt-1">Leave blank to keep current password. Minimum 6 characters if changing.</p>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowEditModal(false);
                    setEditingStaff(null);
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
    </>
  );
};

export default StaffManager;

