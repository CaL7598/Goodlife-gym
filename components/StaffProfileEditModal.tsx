import React, { useState, useEffect } from 'react';
import { X, User, Mail, Phone, Briefcase, ShieldCheck, UserCircle, Upload, Save, Trash2 } from 'lucide-react';
import { StaffMember, UserRole } from '../types';
import { staffService } from '../lib/database';
import { useToast } from '../contexts/ToastContext';

interface StaffProfileEditModalProps {
  isOpen: boolean;
  staff: StaffMember | null;
  role: UserRole;
  isOwnProfile: boolean; // Whether this is the staff member's own profile
  onClose: () => void;
  onUpdate: (updatedStaff: StaffMember) => void;
}

const StaffProfileEditModal: React.FC<StaffProfileEditModalProps> = ({
  isOpen,
  staff,
  role,
  isOwnProfile,
  onClose,
  onUpdate
}) => {
  const { showSuccess, showError } = useToast();
  const [editingStaff, setEditingStaff] = useState<StaffMember | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (staff) {
      setEditingStaff({ ...staff });
      setAvatarPreview(staff.avatar || null);
    }
  }, [staff]);

  if (!isOpen || !staff || !editingStaff) return null;

  // Get initials from full name
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        showError('Please select an image file');
        return;
      }
      
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        showError('Image size must be less than 5MB');
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        setAvatarPreview(base64String);
        setEditingStaff({ ...editingStaff, avatar: base64String });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveAvatar = () => {
    setAvatarPreview(null);
    setEditingStaff({ ...editingStaff, avatar: undefined });
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingStaff) return;

    setIsSaving(true);
    try {
      // Prepare update data - staff can only update their own avatar, admin can update everything
      const updateData: Partial<StaffMember> = {};
      
      if (isOwnProfile) {
        // Staff can only update their avatar
        updateData.avatar = editingStaff.avatar;
      } else {
        // Admin can update all fields
        updateData.fullName = editingStaff.fullName;
        updateData.email = editingStaff.email;
        updateData.phone = editingStaff.phone;
        updateData.position = editingStaff.position;
        updateData.avatar = editingStaff.avatar;
      }

      const updatedStaff = await staffService.update(editingStaff.id, updateData);
      onUpdate(updatedStaff);
      showSuccess(isOwnProfile ? 'Profile updated successfully!' : 'Staff profile updated successfully!');
      onClose();
    } catch (error: any) {
      console.error('Error updating staff profile:', error);
      showError(error.message || 'Failed to update profile. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={onClose}>
      <div 
        className="bg-white rounded-lg shadow-2xl max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto animate-in zoom-in-95 fade-in duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-900 to-slate-800 px-6 py-4 rounded-t-lg flex items-center justify-between sticky top-0 z-10">
          <h3 className="text-lg font-bold text-white">
            {isOwnProfile ? 'Edit My Profile' : 'Edit Staff Profile'}
          </h3>
          <button
            onClick={onClose}
            className="text-slate-300 hover:text-white transition-colors"
            aria-label="Close"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSave} className="p-6">
          {/* Profile Picture/Avatar Upload */}
          <div className="flex flex-col items-center mb-6">
            <div className="relative">
              {avatarPreview ? (
                <img
                  src={avatarPreview}
                  alt={editingStaff.fullName}
                  className="w-24 h-24 rounded-full object-cover border-4 border-slate-200"
                />
              ) : (
                <div className={`w-24 h-24 rounded-full flex items-center justify-center text-2xl font-bold text-white ${
                  role === UserRole.SUPER_ADMIN ? 'bg-amber-500' : 'bg-blue-500'
                }`}>
                  {getInitials(editingStaff.fullName)}
                </div>
              )}
              <div className={`absolute -bottom-1 -right-1 p-1.5 rounded-full border-2 border-white ${
                role === UserRole.SUPER_ADMIN ? 'bg-amber-500' : 'bg-blue-500'
              }`}>
                {role === UserRole.SUPER_ADMIN ? (
                  <ShieldCheck size={16} className="text-white" />
                ) : (
                  <UserCircle size={16} className="text-white" />
                )}
              </div>
            </div>
            
            {/* Avatar Upload Controls */}
            <div className="mt-4 flex flex-col items-center gap-2">
              <label className="cursor-pointer">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarUpload}
                  className="hidden"
                />
                <span className="flex items-center gap-2 px-4 py-2 bg-rose-600 text-white rounded-lg hover:bg-rose-700 transition-colors text-sm font-medium">
                  <Upload size={16} />
                  {avatarPreview ? 'Change Photo' : 'Upload Photo'}
                </span>
              </label>
              {avatarPreview && (
                <button
                  type="button"
                  onClick={handleRemoveAvatar}
                  className="flex items-center gap-2 px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors text-sm font-medium"
                >
                  <Trash2 size={16} />
                  Remove Photo
                </button>
              )}
              <p className="text-xs text-slate-500">Max: 5MB</p>
            </div>
          </div>

          {/* Editable Fields */}
          <div className="space-y-4">
            {/* Full Name - Admin only */}
            {!isOwnProfile && (
              <div>
                <label className="block text-xs text-slate-500 uppercase tracking-wider font-semibold mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  value={editingStaff.fullName}
                  onChange={(e) => setEditingStaff({ ...editingStaff, fullName: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-transparent"
                  required
                />
              </div>
            )}

            {/* Email - Admin only */}
            {!isOwnProfile && (
              <div>
                <label className="block text-xs text-slate-500 uppercase tracking-wider font-semibold mb-1">
                  Email
                </label>
                <input
                  type="email"
                  value={editingStaff.email}
                  onChange={(e) => setEditingStaff({ ...editingStaff, email: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-transparent"
                  required
                />
              </div>
            )}

            {/* Phone - Admin only */}
            {!isOwnProfile && (
              <div>
                <label className="block text-xs text-slate-500 uppercase tracking-wider font-semibold mb-1">
                  Phone
                </label>
                <input
                  type="tel"
                  value={editingStaff.phone}
                  onChange={(e) => setEditingStaff({ ...editingStaff, phone: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-transparent"
                  required
                />
              </div>
            )}

            {/* Position - Admin only */}
            {!isOwnProfile && (
              <div>
                <label className="block text-xs text-slate-500 uppercase tracking-wider font-semibold mb-1">
                  Position
                </label>
                <input
                  type="text"
                  value={editingStaff.position}
                  onChange={(e) => setEditingStaff({ ...editingStaff, position: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-transparent"
                  required
                />
              </div>
            )}

            {/* Read-only fields for staff viewing their own profile */}
            {isOwnProfile && (
              <>
                <div className="flex items-start gap-4">
                  <div className="p-2 bg-slate-100 rounded-lg">
                    <Mail className="text-slate-600" size={18} />
                  </div>
                  <div className="flex-1">
                    <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold">Email</p>
                    <p className="text-sm text-slate-900 mt-1">{editingStaff.email}</p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="p-2 bg-slate-100 rounded-lg">
                    <Phone className="text-slate-600" size={18} />
                  </div>
                  <div className="flex-1">
                    <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold">Phone</p>
                    <p className="text-sm text-slate-900 mt-1">{editingStaff.phone}</p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="p-2 bg-slate-100 rounded-lg">
                    <Briefcase className="text-slate-600" size={18} />
                  </div>
                  <div className="flex-1">
                    <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold">Position</p>
                    <p className="text-sm text-slate-900 mt-1">{editingStaff.position}</p>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Footer */}
          <div className="mt-6 pt-4 border-t border-slate-200 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="px-6 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg transition-colors font-medium flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Save size={18} />
              {isSaving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default StaffProfileEditModal;
