import React from 'react';
import { X, User, Mail, Phone, Briefcase, ShieldCheck, UserCircle } from 'lucide-react';
import { StaffMember, UserRole } from '../types';

interface StaffProfileModalProps {
  isOpen: boolean;
  staff: StaffMember | null;
  role: UserRole;
  onClose: () => void;
}

const StaffProfileModal: React.FC<StaffProfileModalProps> = ({
  isOpen,
  staff,
  role,
  onClose
}) => {
  if (!isOpen || !staff) return null;

  // Get initials from full name
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={onClose}>
      <div 
        className="bg-white rounded-lg shadow-2xl max-w-md w-full mx-4 animate-in zoom-in-95 fade-in duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-900 to-slate-800 px-6 py-4 rounded-t-lg flex items-center justify-between">
          <h3 className="text-lg font-bold text-white">Staff Profile</h3>
          <button
            onClick={onClose}
            className="text-slate-300 hover:text-white transition-colors"
            aria-label="Close"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Profile Picture/Avatar */}
          <div className="flex flex-col items-center mb-6">
            <div className="relative">
              {staff.avatar ? (
                <img
                  src={staff.avatar}
                  alt={staff.fullName}
                  className="w-24 h-24 rounded-full object-cover border-4 border-slate-200"
                />
              ) : (
                <div className={`w-24 h-24 rounded-full flex items-center justify-center text-2xl font-bold text-white ${
                  role === UserRole.SUPER_ADMIN ? 'bg-amber-500' : 'bg-blue-500'
                }`}>
                  {getInitials(staff.fullName)}
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
            <h2 className="mt-4 text-xl font-bold text-slate-900">{staff.fullName}</h2>
            <p className="text-sm text-slate-500 mt-1">{staff.position}</p>
            <span className={`mt-2 px-3 py-1 rounded-full text-xs font-semibold ${
              role === UserRole.SUPER_ADMIN 
                ? 'bg-amber-100 text-amber-700' 
                : 'bg-blue-100 text-blue-700'
            }`}>
              {role === UserRole.SUPER_ADMIN ? 'Super Admin' : 'Staff Member'}
            </span>
          </div>

          {/* Profile Details */}
          <div className="space-y-4 border-t border-slate-200 pt-6">
            <div className="flex items-start gap-4">
              <div className="p-2 bg-slate-100 rounded-lg">
                <Mail className="text-slate-600" size={18} />
              </div>
              <div className="flex-1">
                <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold">Email</p>
                <p className="text-sm text-slate-900 mt-1">{staff.email}</p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="p-2 bg-slate-100 rounded-lg">
                <Phone className="text-slate-600" size={18} />
              </div>
              <div className="flex-1">
                <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold">Phone</p>
                <p className="text-sm text-slate-900 mt-1">{staff.phone}</p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="p-2 bg-slate-100 rounded-lg">
                <Briefcase className="text-slate-600" size={18} />
              </div>
              <div className="flex-1">
                <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold">Position</p>
                <p className="text-sm text-slate-900 mt-1">{staff.position}</p>
              </div>
            </div>

            {staff.privileges && staff.privileges.length > 0 && (
              <div className="flex items-start gap-4">
                <div className="p-2 bg-slate-100 rounded-lg">
                  <ShieldCheck className="text-slate-600" size={18} />
                </div>
                <div className="flex-1">
                  <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold">Privileges</p>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {staff.privileges.map((privilege, index) => (
                      <span
                        key={index}
                        className="px-2 py-1 bg-rose-50 text-rose-700 text-xs rounded-md font-medium"
                      >
                        {privilege.replace(/_/g, ' ')}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 rounded-b-lg flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded font-medium transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default StaffProfileModal;

