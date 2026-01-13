
import React from 'react';
import { UserRole, StaffMember, Privilege } from '../types';
import { NAVIGATION_ITEMS } from '../constants';
import { hasPrivilege } from '../lib/privileges';
import StaffProfileEditModal from './StaffProfileEditModal';
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
  setStaff: React.Dispatch<React.SetStateAction<StaffMember[]>>;
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
  setStaff,
  userEmail,
  onLogout,
  isOnShift,
  onShiftSignIn,
  onShiftSignOut
}) => {
  const [isSidebarOpen, setIsSidebarOpen] = React.useState(false); // Start closed on mobile
  const [showProfileModal, setShowProfileModal] = React.useState(false);

  // Close sidebar when clicking outside on mobile
  React.useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setIsSidebarOpen(true);
      } else {
        setIsSidebarOpen(false);
      }
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Get current staff member for privilege checks - recompute when staff array changes
  const currentStaff = React.useMemo(() => {
    const found = staff.find(s => s.email === userEmail);
    if (found) {
      console.log('👤 Current staff member:', {
        name: found.fullName,
        email: found.email,
        privileges: found.privileges,
        privilegesCount: found.privileges?.length || 0
      });
    }
    return found;
  }, [staff, userEmail]);

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

  // Filter navigation based on role and privileges - memoized to update when currentStaff changes
  const filteredNav = React.useMemo(() => {
    const filtered = NAVIGATION_ITEMS.filter(item => {
      // Basic role check
      if (!item.roles.includes(role)) return false;
      
      // Super Admin has access to everything
      if (role === UserRole.SUPER_ADMIN) return true;
      
      // Staff members need privilege checks for admin-only items
      if (item.id === 'activity-logs' && !hasPrivilege(role, Privilege.VIEW_ACTIVITY_LOGS, currentStaff)) return false;
      if (item.id === 'content' && !hasPrivilege(role, Privilege.MANAGE_ANNOUNCEMENTS, currentStaff)) return false;
      if (item.id === 'settings' && !hasPrivilege(role, Privilege.MANAGE_PRIVILEGES, currentStaff)) return false;
      
      return true;
    });
    
    // Debug logging
    console.log('🔍 Navigation filtered:', {
      totalItems: NAVIGATION_ITEMS.length,
      filteredCount: filtered.length,
      currentStaffPrivileges: currentStaff?.privileges,
      hasActivityLogs: hasPrivilege(role, Privilege.VIEW_ACTIVITY_LOGS, currentStaff),
      hasManageAnnouncements: hasPrivilege(role, Privilege.MANAGE_ANNOUNCEMENTS, currentStaff),
      hasManagePrivileges: hasPrivilege(role, Privilege.MANAGE_PRIVILEGES, currentStaff)
    });
    
    return filtered;
  }, [role, currentStaff]);

  return (
    <div className="flex h-screen bg-gray-100 overflow-hidden">
      {/* Mobile Overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`bg-slate-900 text-white transition-all duration-300 flex flex-col fixed lg:static inset-y-0 left-0 z-50 ${isSidebarOpen ? 'w-64' : 'w-0 lg:w-20'} overflow-hidden`}>
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
        <header className="h-16 bg-white border-b flex items-center justify-between px-4 sm:px-6 shrink-0">
          <div className="flex items-center min-w-0 flex-1">
            <button 
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="text-slate-600 hover:text-slate-900 p-1 rounded-md hover:bg-gray-100 lg:hidden"
            >
              <Menu size={20} />
            </button>
            <button 
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="hidden lg:block text-slate-600 hover:text-slate-900 p-1 rounded-md hover:bg-gray-100"
            >
              {isSidebarOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
            <h1 className="ml-2 sm:ml-4 text-base sm:text-lg font-semibold text-slate-800 truncate">
              Goodlife Fitness Ghana{currentPage !== 'dashboard' && ` | ${currentPage.replace('-', ' ')}`}
            </h1>
          </div>

          <div className="flex items-center gap-2 sm:gap-4">
            {/* Shift In/Out Button */}
            <div className="hidden md:flex items-center mr-2 sm:mr-4 border-r pr-4 sm:pr-6 border-slate-100">
              {isOnShift ? (
                <button 
                  onClick={onShiftSignOut}
                  className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-rose-50 text-rose-600 border border-rose-100 rounded-lg text-xs font-bold hover:bg-rose-600 hover:text-white transition-all shadow-sm"
                >
                  <Square size={14} fill="currentColor" />
                  <span className="hidden lg:inline">SIGN OUT FROM SHIFT</span>
                  <span className="lg:hidden">SIGN OUT</span>
                </button>
              ) : (
                <button 
                  onClick={onShiftSignIn}
                  className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-emerald-50 text-emerald-600 border border-emerald-100 rounded-lg text-xs font-bold hover:bg-emerald-600 hover:text-white transition-all shadow-sm"
                >
                  <Play size={14} fill="currentColor" />
                  <span className="hidden lg:inline">SIGN IN FOR SHIFT</span>
                  <span className="lg:hidden">SIGN IN</span>
                </button>
              )}
            </div>

            <button
              onClick={() => setShowProfileModal(true)}
              className="flex items-center gap-2 sm:gap-3 hover:opacity-80 transition-opacity cursor-pointer"
            >
              <div className="flex flex-col items-start hidden lg:flex">
                <span className="text-base font-bold text-slate-900 leading-tight">
                  {currentStaff?.fullName || (role === UserRole.SUPER_ADMIN ? 'Super Admin' : 'Staff Member')}
                </span>
                <span className="text-[10px] text-slate-500 uppercase tracking-widest leading-none mt-0.5">
                  {role}
                </span>
              </div>
              <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full border border-blue-300 flex items-center justify-center shrink-0 ${
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
            <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 sm:py-4">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
                <div className="flex items-start sm:items-center gap-3 sm:gap-4 flex-1">
                  <div className="bg-amber-600 rounded-full p-2 shrink-0">
                    <AlertTriangle className="text-white" size={20} />
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-white font-bold text-base sm:text-lg flex items-center gap-2">
                      <Clock size={18} className="shrink-0" />
                      <span>Action Required: Start Your Shift</span>
                    </h3>
                    <p className="text-amber-100 text-xs sm:text-sm mt-1">
                      Please click "SIGN IN FOR SHIFT" in the header to begin tracking your work hours.
                    </p>
                  </div>
                </div>
                {onShiftSignIn && (
                  <button
                    onClick={onShiftSignIn}
                    className="flex items-center gap-2 px-4 sm:px-6 py-2 sm:py-3 bg-white text-amber-600 rounded-lg font-bold hover:bg-amber-50 transition-all shadow-md hover:shadow-lg transform hover:scale-105 text-sm sm:text-base w-full sm:w-auto justify-center"
                  >
                    <Play size={16} fill="currentColor" />
                    START SHIFT NOW
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Dynamic Content */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 bg-gray-50">
          <div className="max-w-7xl mx-auto w-full">
            {children}
          </div>
        </main>
      </div>

      {/* Staff Profile Edit Modal */}
      <StaffProfileEditModal
        isOpen={showProfileModal}
        staff={currentStaff || null}
        role={role}
        isOwnProfile={true}
        onClose={() => setShowProfileModal(false)}
        onUpdate={(updatedStaff) => {
          setStaff(prev => prev.map(s => s.id === updatedStaff.id ? updatedStaff : s));
        }}
      />
    </div>
  );
};

export default AdminLayout;
