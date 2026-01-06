import React, { useState } from 'react';
import { StaffMember, UserRole, Privilege } from '../types';
import { Shield, Check, X, User, Save, AlertCircle } from 'lucide-react';
import { PRIVILEGE_DESCRIPTIONS, getPrivilegesByCategory } from '../lib/privileges';

interface PrivilegeManagerProps {
  staff: StaffMember[];
  setStaff: React.Dispatch<React.SetStateAction<StaffMember[]>>;
  role: UserRole;
  logActivity?: (action: string, details: string, category: 'access' | 'admin' | 'financial') => void;
}

const PrivilegeManager: React.FC<PrivilegeManagerProps> = ({ 
  staff, 
  setStaff, 
  role,
  logActivity 
}) => {
  const { showSuccess } = useToast();
  const [selectedStaffId, setSelectedStaffId] = useState<string>('');
  const [editingPrivileges, setEditingPrivileges] = useState<Set<Privilege>>(new Set());
  const [hasChanges, setHasChanges] = useState(false);
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    message: string;
    onConfirm: () => void;
  } | null>(null);

  // Only Super Admin can access this
  if (role !== UserRole.SUPER_ADMIN) {
    return (
      <div className="h-[60vh] flex flex-col items-center justify-center text-center p-6">
        <div className="w-16 h-16 bg-amber-50 text-amber-600 rounded-full flex items-center justify-center mb-4">
          <AlertCircle size={32} />
        </div>
        <h2 className="text-2xl font-bold text-slate-900 mb-2">Access Restricted</h2>
        <p className="text-slate-500 max-w-sm">Privilege management is reserved for Super Administrators only.</p>
      </div>
    );
  }

  const selectedStaff = staff.find(s => s.id === selectedStaffId);
  const staffMembers = staff.filter(s => s.role === UserRole.STAFF);
  const privilegesByCategory = getPrivilegesByCategory();

  const handleStaffSelect = (staffId: string) => {
    if (hasChanges) {
      setConfirmModal({
        isOpen: true,
        message: 'You have unsaved changes. Do you want to discard them?',
        onConfirm: () => {
          setConfirmModal(null);
          setSelectedStaffId(staffId);
          const staffMember = staff.find(s => s.id === staffId);
          setEditingPrivileges(new Set(staffMember?.privileges || []));
          setHasChanges(false);
        }
      });
      return;
    }
    setSelectedStaffId(staffId);
    const staffMember = staff.find(s => s.id === staffId);
    setEditingPrivileges(new Set(staffMember?.privileges || []));
    setHasChanges(false);
  };

  const handlePrivilegeToggle = (privilege: Privilege) => {
    const newPrivileges = new Set(editingPrivileges);
    if (newPrivileges.has(privilege)) {
      newPrivileges.delete(privilege);
    } else {
      newPrivileges.add(privilege);
    }
    setEditingPrivileges(newPrivileges);
    setHasChanges(true);
  };

  const handleSave = async () => {
    if (!selectedStaff) return;

    const updatedStaff = staff.map(s => 
      s.id === selectedStaffId 
        ? { ...s, privileges: Array.from(editingPrivileges) }
        : s
    );

    setStaff(updatedStaff);
    setHasChanges(false);

    // Log activity
    if (logActivity) {
      const privilegeCount = editingPrivileges.size;
      logActivity(
        'Update Staff Privileges',
        `Updated privileges for ${selectedStaff.fullName}: ${privilegeCount} privilege(s) assigned`,
        'admin'
      );
    }

    // Save to database if configured
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
    
    if (supabaseUrl && supabaseKey) {
      try {
        // Update staff member in database
        const { staffService } = await import('../lib/database');
        await staffService.update(selectedStaffId, {
          privileges: Array.from(editingPrivileges)
        });
        console.log('✅ Privileges saved to database');
      } catch (error) {
        console.error('Error saving privileges to database:', error);
      }
    }

    showSuccess(`Privileges updated successfully for ${selectedStaff.fullName}`);
  };

  const handleReset = () => {
    if (selectedStaff) {
      setEditingPrivileges(new Set(selectedStaff.privileges || []));
      setHasChanges(false);
    }
  };

  return (
    <>
      {confirmModal && (
        <ConfirmModal
          isOpen={confirmModal.isOpen}
          title="Confirm Action"
          message={confirmModal.message}
          confirmText="Yes, Discard"
          cancelText="Cancel"
          type="warning"
          onConfirm={confirmModal.onConfirm}
          onCancel={() => setConfirmModal(null)}
        />
      )}
      <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Shield className="text-rose-600" size={24} />
            Privilege Management
          </h2>
          <p className="text-slate-500 text-sm mt-1">
            Assign specific admin privileges to staff members
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Staff Selection */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
              <User size={18} />
              Select Staff Member
            </h3>
            <div className="space-y-2">
              {staffMembers.length === 0 ? (
                <p className="text-sm text-slate-500 text-center py-4">
                  No staff members found
                </p>
              ) : (
                staffMembers.map((member) => (
                  <button
                    key={member.id}
                    onClick={() => handleStaffSelect(member.id)}
                    className={`w-full text-left p-3 rounded-lg transition-colors ${
                      selectedStaffId === member.id
                        ? 'bg-rose-50 border-2 border-rose-500'
                        : 'bg-slate-50 border-2 border-transparent hover:bg-slate-100'
                    }`}
                  >
                    <div className="font-semibold text-slate-900">{member.fullName}</div>
                    <div className="text-xs text-slate-500 mt-1">{member.position}</div>
                    <div className="text-xs text-slate-400 mt-1">
                      {member.privileges?.length || 0} privilege(s) assigned
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Privilege Assignment */}
        <div className="lg:col-span-2">
          {selectedStaff ? (
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="font-bold text-slate-800 text-lg">
                    {selectedStaff.fullName}
                  </h3>
                  <p className="text-sm text-slate-500">{selectedStaff.position}</p>
                </div>
                {hasChanges && (
                  <div className="flex gap-2">
                    <button
                      onClick={handleReset}
                      className="px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors"
                    >
                      Reset
                    </button>
                    <button
                      onClick={handleSave}
                      className="px-4 py-2 text-sm font-medium text-white bg-rose-600 rounded-lg hover:bg-rose-700 transition-colors flex items-center gap-2"
                    >
                      <Save size={16} />
                      Save Changes
                    </button>
                  </div>
                )}
              </div>

              <div className="space-y-6">
                {Object.entries(privilegesByCategory).map(([category, privileges]) => (
                  <div key={category} className="border-b border-slate-200 pb-6 last:border-b-0 last:pb-0">
                    <h4 className="font-semibold text-slate-700 mb-3 text-sm uppercase tracking-wider">
                      {category}
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {privileges.map((privilege) => {
                        const isSelected = editingPrivileges.has(privilege);
                        const info = PRIVILEGE_DESCRIPTIONS[privilege];
                        
                        return (
                          <label
                            key={privilege}
                            className={`flex items-start gap-3 p-4 rounded-lg border-2 cursor-pointer transition-all ${
                              isSelected
                                ? 'bg-rose-50 border-rose-500'
                                : 'bg-slate-50 border-slate-200 hover:border-slate-300'
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => handlePrivilegeToggle(privilege)}
                              className="mt-1 w-4 h-4 text-rose-600 border-slate-300 rounded focus:ring-rose-500"
                            />
                            <div className="flex-1">
                              <div className="font-semibold text-slate-900 text-sm">
                                {info.label}
                              </div>
                              <div className="text-xs text-slate-500 mt-1">
                                {info.description}
                              </div>
                            </div>
                            {isSelected && (
                              <Check size={18} className="text-rose-600 shrink-0" />
                            )}
                          </label>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>

              {editingPrivileges.size === 0 && (
                <div className="mt-6 p-4 bg-amber-50 border border-amber-200 rounded-lg">
                  <p className="text-sm text-amber-800">
                    <strong>Note:</strong> This staff member has no privileges assigned. They will only have basic staff access.
                  </p>
                </div>
              )}
            </div>
          ) : (
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-12 text-center">
              <Shield size={48} className="mx-auto text-slate-300 mb-4" />
              <h3 className="font-semibold text-slate-700 mb-2">No Staff Selected</h3>
              <p className="text-sm text-slate-500">
                Select a staff member from the list to assign privileges
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
    </>
  );
};

export default PrivilegeManager;

