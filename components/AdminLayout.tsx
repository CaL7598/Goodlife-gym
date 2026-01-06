
import React from 'react';
import { UserRole, StaffMember, Privilege } from '../types';
import { NAVIGATION_ITEMS } from '../constants';
import { hasPrivilege } from '../lib/privileges';
import StaffProfileModal from './StaffProfileModal';
import { 
  LogOut, 
  Menu, 
  X, 
  Dumbbell,
  ShieldCheck,
  UserCircle,
  Play,
  Square,
  AlertTriangle,
  Clock
} from 'lucide-react';

interface AdminLayoutProps {
  children: React.ReactNode;
  setCurrentPage: (page: string) => void;
  currentPage: string;
  role: UserRole;
  staff: StaffMember[];
  userEmail: string;
  onLogout: () => void;
  isOnShift?: boolean;
  onShiftSignIn?: () => void;
  onShiftSignOut?: () => void;
}

const AdminLayout: React.FC<AdminLayoutProps> = ({ 
  children, 
  setCurrentPage, 
  currentPage, 
  role,
  staff,
  userEmail,
  onLogout,
  isOnShift,
  onShiftSignIn,
  onShiftSignOut
}) => {
  const [isSidebarOpen, setIsSidebarOpen] = React.useState(true);
  const [showProfileModal, setShowProfileModal] = React.useState(false);

  // Get current staff member for privilege checks
  const currentStaff = staff.find(s => s.email === userEmail);

  // Get initials from full name for avatar fallback
  const getInitials = (name: string) => {
    if (!name) return 'U';
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  // Filter navigation based on role and privileges
  const filteredNav = NAVIGATION_ITEMS.filter(item => {
    // Basic role check
    if (!item.roles.includes(role)) return false;
    
    // Super Admin has access to everything
    if (role === UserRole.SUPER_ADMIN) return true;
    
    // Staff members need privilege checks for admin-only items
    if (item.id === 'activity-logs' && !hasPrivilege(role, Privilege.VIEW_ACTIVITY_LOGS, currentStaff)) return false;
    if (item.id === 'content' && !hasPrivilege(role, Privilege.MANAGE_CONTENT, currentStaff)) return false;
    if (item.id === 'settings' && !hasPrivilege(role, Privilege.MANAGE_PRIVILEGES, currentStaff)) return false;
    
    return true;
  });

  return (
    <div className="flex h-screen bg-gray-100 overflow-hidden">
      {/* Sidebar */}
      <aside className={`bg-slate-900 text-white transition-all duration-300 flex flex-col ${isSidebarOpen ? 'w-64' : 'w-20'}`}>
        <div className="h-16 flex items-center px-6 border-b border-slate-800 shrink-0">
          <Dumbbell className="text-rose-500 h-8 w-8 shrink-0" />
          {isSidebarOpen && (
            <span className="ml-3 font-bold tracking-tight text-lg">
              GOOD<span className="text-rose-500">LIFE</span>
            </span>
          )}
        </div>

        <nav className="flex-1 overflow-y-auto py-6">
          <ul className="space-y-1 px-3">
            {filteredNav.map((item) => (
              <li key={item.id}>
                <button
                  onClick={() => setCurrentPage(item.id)}
                  className={`w-full flex items-center p-3 rounded-lg transition-colors group ${
                    currentPage === item.id 
                      ? 'bg-rose-600 text-white' 
                      : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                  }`}
                >
                  <span className={`${currentPage === item.id ? 'text-white' : 'text-slate-400 group-hover:text-white'}`}>
                    {item.icon}
                  </span>
                  {isSidebarOpen && <span className="ml-3 text-sm font-medium">{item.label}</span>}
                </button>
              </li>
            ))}
          </ul>
        </nav>

        <div className="p-3 border-t border-slate-800 space-y-2">
          {/* Shift Status Indicator for Staff */}
          {role === UserRole.STAFF && (
            <div className={`px-3 py-2 rounded-lg text-xs font-bold text-center ${
              isOnShift 
                ? 'bg-emerald-900/30 text-emerald-400 border border-emerald-800' 
                : 'bg-amber-900/30 text-amber-400 border border-amber-800'
            }`}>
              {isOnShift ? (
                <span className="flex items-center justify-center gap-1.5">
                  <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></div>
                  ON SHIFT
                </span>
              ) : (
                <span className="flex items-center justify-center gap-1.5">
                  <AlertTriangle size={12} />
                  NOT ON SHIFT
                </span>
              )}
            </div>
          )}
          <button
            onClick={onLogout}
            className="w-full flex items-center p-3 rounded-lg text-slate-400 hover:bg-rose-900/20 hover:text-rose-400 transition-colors"
          >
            <LogOut size={20} />
            {isSidebarOpen && <span className="ml-3 text-sm font-medium">Logout</span>}
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Header */}
        <header className="h-16 bg-white border-b flex items-center justify-between px-6 shrink-0">
          <div className="flex items-center">
            <button 
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="text-slate-600 hover:text-slate-900 p-1 rounded-md hover:bg-gray-100"
            >
              {isSidebarOpen ? <Menu size={20} /> : <X size={20} />}
            </button>
            <h1 className="ml-4 text-lg font-semibold text-slate-800 capitalize">
              {currentPage.replace('-', ' ')}
            </h1>
          </div>

          <div className="flex items-center gap-4">
            {/* Shift In/Out Button */}
            <div className="hidden sm:flex items-center mr-4 border-r pr-6 border-slate-100">
              {isOnShift ? (
                <button 
                  onClick={onShiftSignOut}
                  className="flex items-center gap-2 px-4 py-2 bg-rose-50 text-rose-600 border border-rose-100 rounded-lg text-xs font-bold hover:bg-rose-600 hover:text-white transition-all shadow-sm"
                >
                  <Square size={14} fill="currentColor" />
                  SIGN OUT FROM SHIFT
                </button>
              ) : (
                <button 
                  onClick={onShiftSignIn}
                  className="flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-600 border border-emerald-100 rounded-lg text-xs font-bold hover:bg-emerald-600 hover:text-white transition-all shadow-sm"
                >
                  <Play size={14} fill="currentColor" />
                  SIGN IN FOR SHIFT
                </button>
              )}
            </div>

            <button
              onClick={() => setShowProfileModal(true)}
              className="flex items-center gap-3 hover:opacity-80 transition-opacity cursor-pointer"
            >
              <div className="flex flex-col items-start hidden sm:flex">
                <span className="text-base font-bold text-slate-900 leading-tight">
                  {currentStaff?.fullName || (role === UserRole.SUPER_ADMIN ? 'Super Admin' : 'Staff Member')}
                </span>
                <span className="text-[10px] text-slate-500 uppercase tracking-widest leading-none mt-0.5">
                  {role}
                </span>
              </div>
              <div className={`w-10 h-10 rounded-full border border-blue-300 flex items-center justify-center ${
                role === UserRole.SUPER_ADMIN ? 'bg-amber-50' : 'bg-blue-50'
              }`}>
                {currentStaff?.avatar ? (
                  <img
                    src={currentStaff.avatar}
                    alt={currentStaff.fullName}
                    className="w-8 h-8 rounded-full object-cover"
                  />
                ) : (
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    role === UserRole.SUPER_ADMIN 
                      ? 'bg-amber-500 text-white' 
                      : 'bg-blue-500 text-white'
                  }`}>
                    {currentStaff ? (
                      <span className="text-xs font-bold">
                        {getInitials(currentStaff.fullName)}
                      </span>
                    ) : (
                      role === UserRole.SUPER_ADMIN ? (
                        <ShieldCheck size={18} className="text-white" />
                      ) : (
                        <UserCircle size={18} className="text-white" />
                      )
                    )}
                  </div>
                )}
              </div>
            </button>
          </div>
        </header>

        {/* Shift Prompt Banner - Only for Staff */}
        {role === UserRole.STAFF && !isOnShift && (
          <div className="bg-amber-500 border-b-4 border-amber-600 shadow-lg">
            <div className="max-w-7xl mx-auto px-6 py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="bg-amber-600 rounded-full p-2">
                    <AlertTriangle className="text-white" size={24} />
                  </div>
                  <div>
                    <h3 className="text-white font-bold text-lg flex items-center gap-2">
                      <Clock size={20} />
                      Action Required: Start Your Shift
                    </h3>
                    <p className="text-amber-100 text-sm mt-1">
                      Please click "SIGN IN FOR SHIFT" in the header to begin tracking your work hours.
                    </p>
                  </div>
                </div>
                {onShiftSignIn && (
                  <button
                    onClick={onShiftSignIn}
                    className="flex items-center gap-2 px-6 py-3 bg-white text-amber-600 rounded-lg font-bold hover:bg-amber-50 transition-all shadow-md hover:shadow-lg transform hover:scale-105"
                  >
                    <Play size={18} fill="currentColor" />
                    START SHIFT NOW
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Dynamic Content */}
        <main className="flex-1 overflow-y-auto p-6 bg-gray-50">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>

      {/* Staff Profile Modal */}
      <StaffProfileModal
        isOpen={showProfileModal}
        staff={currentStaff || null}
        role={role}
        onClose={() => setShowProfileModal(false)}
      />
    </div>
  );
};

export default AdminLayout;
