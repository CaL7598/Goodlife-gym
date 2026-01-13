
import React, { useState, useEffect, useCallback } from 'react';
import {
  UserRole, 
  Member, 
  StaffMember,
  PaymentRecord, 
  Announcement, 
  GalleryImage,
  SubscriptionPlan,
  PaymentMethod,
  PaymentStatus,
  ActivityLog,
  AttendanceRecord,
  ClientCheckIn,
  MaintenanceLog,
  Expense
} from './types';
import { 
  INITIAL_MEMBERS, 
  INITIAL_STAFF,
  INITIAL_PAYMENTS, 
  INITIAL_ANNOUNCEMENTS, 
  INITIAL_GALLERY 
} from './constants';
import {
  membersService,
  staffService,
  paymentsService,
  announcementsService,
  galleryService,
  activityLogsService,
  attendanceService,
  clientCheckInService,
  equipmentService,
  maintenanceLogsService,
  expensesService
} from './lib/database';
import { supabase } from './lib/supabase';

// UI Components
import PublicLayout from './components/PublicLayout';
import AdminLayout from './components/AdminLayout';
import UpdateNotification from './components/UpdateNotification';
import { ToastProvider } from './contexts/ToastContext';
import ConfirmModal from './components/ConfirmModal';
import PublicHome from './pages/PublicHome';
import About from './pages/About';
import Gallery from './pages/Gallery';
import Announcements from './pages/Announcements';
import Contact from './pages/Contact';
import Equipment from './pages/Equipment';
import MembershipPlans from './pages/MembershipPlans';
import Checkout from './pages/Checkout';
import AdminDashboard from './pages/AdminDashboard';
import MemberManager from './pages/MemberManager';
import PaymentProcessor from './pages/PaymentProcessor';
import SubscriptionTracker from './pages/SubscriptionTracker';
import CommunicationCenter from './pages/CommunicationCenter';
import ContentManager from './pages/ContentManager';
import AdminLogin from './pages/AdminLogin';
import ActivityLogs from './pages/ActivityLogs';
import AttendanceManager from './pages/AttendanceManager';
import PrivilegeManager from './pages/PrivilegeManager';
import StaffManager from './pages/StaffManager';
import EquipmentManager from './pages/EquipmentManager';
import CheckIn from './pages/CheckIn';
import CheckInManager from './pages/CheckInManager';
import MaintenanceLogbook from './pages/MaintenanceLogbook';
import ExpensesManager from './pages/ExpensesManager';

const App: React.FC = () => {
  // Initialize state from localStorage if available
  const getInitialUserRole = (): UserRole => {
    const saved = localStorage.getItem('userRole') as UserRole | null;
    return (saved === UserRole.STAFF || saved === UserRole.SUPER_ADMIN) ? saved : UserRole.PUBLIC;
  };
  
  const [userRole, setUserRole] = useState<UserRole>(getInitialUserRole());
  const [userEmail, setUserEmail] = useState<string>(localStorage.getItem('userEmail') || '');
  const [currentPage, setCurrentPage] = useState<string>(localStorage.getItem('currentPage') || 'home');
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState(localStorage.getItem('isAdminLoggedIn') === 'true');
  const [isLoading, setIsLoading] = useState(true);
  const [useSupabase, setUseSupabase] = useState(false);
  
  // App State - will sync with Supabase if configured
  const [members, setMembers] = useState<Member[]>(INITIAL_MEMBERS as Member[]);
  const [staff, setStaff] = useState<StaffMember[]>(INITIAL_STAFF as StaffMember[]);
  const [payments, setPayments] = useState<PaymentRecord[]>(INITIAL_PAYMENTS as PaymentRecord[]);
  const [announcements, setAnnouncements] = useState<Announcement[]>(INITIAL_ANNOUNCEMENTS as Announcement[]);
  const [gallery, setGallery] = useState<GalleryImage[]>(INITIAL_GALLERY as GalleryImage[]);
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([]);
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const [clientCheckIns, setClientCheckIns] = useState<ClientCheckIn[]>([]);
  const [maintenanceLogs, setMaintenanceLogs] = useState<MaintenanceLog[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  
  // Update notification system
  const [lastCheckedTimestamp, setLastCheckedTimestamp] = useState<string | null>(
    localStorage.getItem('lastUpdateCheck') || null
  );
  const [updateNotificationDismissed, setUpdateNotificationDismissed] = useState(false);
  
  // Confirmation modal state
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title?: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    type?: 'warning' | 'danger' | 'info';
    onConfirm: () => void;
  } | null>(null);

  // Save authentication state to localStorage whenever it changes
  useEffect(() => {
    if (userRole === UserRole.STAFF || userRole === UserRole.SUPER_ADMIN) {
      localStorage.setItem('userRole', userRole);
      localStorage.setItem('userEmail', userEmail);
      localStorage.setItem('isAdminLoggedIn', String(isAdminLoggedIn));
      localStorage.setItem('currentPage', currentPage);
    } else {
      // Clear auth data when logged out
      localStorage.removeItem('userRole');
      localStorage.removeItem('userEmail');
      localStorage.removeItem('isAdminLoggedIn');
    }
  }, [userRole, userEmail, isAdminLoggedIn, currentPage]);

  // Save current page to localStorage whenever it changes (for both public and admin)
  useEffect(() => {
    localStorage.setItem('currentPage', currentPage);
  }, [currentPage]);

  // Check for updates periodically when logged in
  useEffect(() => {
    if (userRole === UserRole.PUBLIC || !useSupabase) return;

    const checkForUpdates = async () => {
      try {
        const latestAnnouncements = await announcementsService.getAll().catch(() => []);
        
        // Always update announcements to get latest data
        if (latestAnnouncements.length > 0) {
          setAnnouncements(latestAnnouncements);
        }
        
        // If we have a last checked timestamp, check for new ones
        if (lastCheckedTimestamp && latestAnnouncements.length > 0) {
          const lastChecked = new Date(lastCheckedTimestamp);
          const hasNewUpdates = latestAnnouncements.some(ann => {
            // Compare announcement date with last checked time
            const annDate = new Date(ann.date);
            return annDate > lastChecked;
          });

          if (hasNewUpdates) {
            // Reset dismissed state when new updates are found
            setUpdateNotificationDismissed(false);
          }
        }
      } catch (error) {
        console.error('Error checking for updates:', error);
      }
    };

    // Check immediately
    checkForUpdates();

    // Check every 2 minutes while logged in
    const interval = setInterval(checkForUpdates, 2 * 60 * 1000);

    return () => clearInterval(interval);
  }, [userRole, useSupabase, lastCheckedTimestamp]);

  // Check if Supabase is configured and load data
  useEffect(() => {
    const loadData = async () => {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
      
      if (!supabaseUrl || !supabaseKey) {
        console.log('⚠️ Supabase not configured, using local state');
        setIsLoading(false);
        return;
      }

      console.log('🔄 Connecting to Supabase...');
      setUseSupabase(true);
      setIsLoading(true);

      try {
        // Test connection first
        const { data: testData, error: testError } = await supabase.from('members').select('count').limit(1);
        
        if (testError) {
          if (testError.code === 'PGRST116' || testError.message.includes('relation') || testError.message.includes('does not exist')) {
            console.warn('⚠️ Supabase connected, but tables not created yet.');
            console.log('💡 Run the SQL from SUPABASE_SETUP.md in your Supabase SQL Editor to create tables.');
          } else {
            console.error('❌ Supabase connection error:', testError.message);
          }
        } else {
          console.log('✅ Supabase connection successful!');
        }

        // Load all data from Supabase
        const [membersData, staffData, paymentsData, announcementsData, galleryData, logsData, attendanceData, checkInsData, maintenanceLogsData, expensesData] = await Promise.all([
          membersService.getAll().catch(() => []),
          staffService.getAll().catch(() => []),
          paymentsService.getAll().catch(() => []),
          announcementsService.getAll().catch(() => []),
          galleryService.getAll().catch(() => []),
          activityLogsService.getAll().catch(() => []),
          attendanceService.getAll().catch(() => []),
          clientCheckInService.getAll().catch(() => []),
          maintenanceLogsService.getAll().catch(() => []),
          expensesService.getAll().catch(() => [])
        ]);

        console.log('📊 Data loaded from Supabase:', {
          members: membersData.length,
          staff: staffData.length,
          payments: paymentsData.length,
          announcements: announcementsData.length,
          gallery: galleryData.length,
          logs: logsData.length,
          attendance: attendanceData.length,
          checkIns: checkInsData.length,
          maintenanceLogs: maintenanceLogsData.length
        });

        // Always set data, even if empty, to ensure state is synced with database
        setMembers(membersData);
        setStaff(staffData);
        setPayments(paymentsData);
        setAnnouncements(announcementsData);
        setGallery(galleryData);
        setActivityLogs(logsData);
        setAttendanceRecords(attendanceData);
        setClientCheckIns(checkInsData);
        setMaintenanceLogs(maintenanceLogsData);
        setExpenses(expensesData);
      } catch (error) {
        console.error('Error loading data from Supabase:', error);
        // Fall back to local state if Supabase fails
        setUseSupabase(false);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, []);

  const logActivity = useCallback(async (action: string, details: string, category: 'access' | 'admin' | 'financial') => {
    const newLog: Omit<ActivityLog, 'id'> = {
      userRole,
      userEmail,
      action,
      details,
      timestamp: new Date().toISOString(),
      category
    };
    
    // Update local state immediately for UI responsiveness
    const tempLog: ActivityLog = {
      ...newLog,
      id: `log-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`
    };
    setActivityLogs(prev => [tempLog, ...prev]);

    // Save to Supabase if configured
    if (useSupabase) {
      try {
        await activityLogsService.create(newLog);
      } catch (error) {
        console.error('Error saving activity log to Supabase:', error);
      }
    }
  }, [userRole, userEmail, useSupabase]);

  const handleShiftSignIn = async () => {
    const today = new Date().toISOString().split('T')[0];
    const newRecord: Omit<AttendanceRecord, 'id'> = {
      staffEmail: userEmail,
      staffRole: userRole,
      date: today,
      signInTime: new Date().toISOString()
    };
    
    // Update local state immediately
    const tempRecord: AttendanceRecord = {
      ...newRecord,
      id: `att-${Date.now()}`
    };
    setAttendanceRecords(prev => [tempRecord, ...prev]);
    
    // Save to Supabase if configured
    if (useSupabase) {
      try {
        const savedRecord = await attendanceService.create(newRecord);
        // Update with real ID from database
        setAttendanceRecords(prev => prev.map(r => 
          r.id === tempRecord.id ? savedRecord : r
        ));
      } catch (error) {
        console.error('Error saving attendance record to Supabase:', error);
      }
    }
    
    logActivity('Shift Sign In', `Staff member signed in for their work shift`, 'access');
  };

  const handleShiftSignOut = async () => {
    const today = new Date().toISOString().split('T')[0];
    const recordToUpdate = attendanceRecords.find(
      r => r.staffEmail === userEmail && r.date === today && !r.signOutTime
    );
    
    if (!recordToUpdate) return;
    
    const updatedRecord = {
      ...recordToUpdate,
      signOutTime: new Date().toISOString()
    };
    
    // Update local state immediately
    setAttendanceRecords(prev => prev.map(rec => 
      rec.id === recordToUpdate.id ? updatedRecord : rec
    ));
    
    // Save to Supabase if configured
    if (useSupabase) {
      try {
        await attendanceService.update(recordToUpdate.id, { signOutTime: updatedRecord.signOutTime });
      } catch (error) {
        console.error('Error updating attendance record in Supabase:', error);
      }
    }
    
    logActivity('Shift Sign Out', `Staff member signed out and closed their work shift`, 'access');
  };

  const isOnShift = attendanceRecords.some(r => r.staffEmail === userEmail && r.date === new Date().toISOString().split('T')[0] && !r.signOutTime);

  // Wrapper functions to sync with Supabase
  const updateMembers = useCallback(async (updater: (prev: Member[]) => Member[]) => {
    const newMembers = updater(members);
    setMembers(newMembers);
    
    if (useSupabase) {
      // Sync individual changes - this is a simplified version
      // In a real app, you'd track which members changed
      try {
        // For now, we'll let individual components handle Supabase updates
        // This ensures we don't overwrite concurrent changes
      } catch (error) {
        console.error('Error syncing members to Supabase:', error);
      }
    }
  }, [members, useSupabase]);

  const updatePayments = useCallback(async (updater: (prev: PaymentRecord[]) => PaymentRecord[]) => {
    const newPayments = updater(payments);
    setPayments(newPayments);
    
    if (useSupabase) {
      // Similar to members - let components handle individual updates
    }
  }, [payments, useSupabase]);

  const updateAnnouncements = useCallback(async (updater: (prev: Announcement[]) => Announcement[]) => {
    const newAnnouncements = updater(announcements);
    setAnnouncements(newAnnouncements);
    
    if (useSupabase) {
      // Similar pattern
    }
  }, [announcements, useSupabase]);

  const updateGallery = useCallback(async (updater: (prev: GalleryImage[]) => GalleryImage[]) => {
    const newGallery = updater(gallery);
    setGallery(newGallery);
    
    if (useSupabase) {
      // Similar pattern
    }
  }, [gallery, useSupabase]);

  // Simple Router
  const renderPage = () => {
    if (userRole === UserRole.PUBLIC) {
      switch (currentPage) {
        case 'home': return <PublicHome setCurrentPage={setCurrentPage} />;
        case 'about': return <About />;
        case 'gallery': return <Gallery gallery={gallery} />;
        case 'announcements': return <Announcements announcements={announcements} />;
        case 'contact': return <Contact />;
        case 'equipment': return <Equipment />;
        case 'plans': return <MembershipPlans setCurrentPage={setCurrentPage} />;
        case 'checkin': return <CheckIn />;
        case 'checkout': {
          const storedPlan = sessionStorage.getItem('selectedPlan');
          const selectedPlan = storedPlan ? JSON.parse(storedPlan) : null;
          return (
            <Checkout
              selectedPlan={selectedPlan}
              onBack={() => setCurrentPage('plans')}
              onSuccess={() => {
                sessionStorage.removeItem('selectedPlan');
                setCurrentPage('home');
              }}
              setCurrentPage={setCurrentPage}
            />
          );
        }
        case 'admin-login': return <AdminLogin onLogin={(role, email) => {
          setUserRole(role);
          setUserEmail(email);
          setIsAdminLoggedIn(true);
          // Save to localStorage immediately
          localStorage.setItem('userRole', role);
          localStorage.setItem('userEmail', email);
          localStorage.setItem('isAdminLoggedIn', 'true');
          // Reset update check on login to show new updates
          const now = new Date().toISOString();
          setLastCheckedTimestamp(now);
          localStorage.setItem('lastUpdateCheck', now);
          setUpdateNotificationDismissed(false);
          setCurrentPage('dashboard');
          localStorage.setItem('currentPage', 'dashboard');
        }} logActivity={logActivity} />;
        default: return <PublicHome setCurrentPage={setCurrentPage} />;
      }
    } else {
      // Admin Pages
      switch (currentPage) {
        case 'dashboard': return (
          <AdminDashboard 
            members={members} 
            payments={payments} 
            role={userRole} 
            staff={staff}
            attendanceRecords={attendanceRecords}
            activityLogs={activityLogs}
            expenses={expenses}
          />
        );
        case 'members': return <MemberManager members={members} setMembers={setMembers} role={userRole} logActivity={logActivity} />;
        case 'payments': return <PaymentProcessor payments={payments} setPayments={setPayments} members={members} setMembers={setMembers} role={userRole} userEmail={userEmail} staff={staff} logActivity={logActivity} />;
        case 'expenses': return <ExpensesManager 
          role={userRole}
          userEmail={userEmail}
          staff={staff}
          logActivity={logActivity}
        />;
        case 'subscriptions': return <SubscriptionTracker members={members} setMembers={setMembers} role={userRole} logActivity={logActivity} />;
        case 'communications': return <CommunicationCenter members={members} />;
        case 'activity-logs': return <ActivityLogs logs={activityLogs} />;
        case 'attendance': return <AttendanceManager records={attendanceRecords} currentUserEmail={userEmail} role={userRole} />;
        case 'checkins': return <CheckInManager checkIns={clientCheckIns} setCheckIns={setClientCheckIns} />;
        case 'content': return <ContentManager 
          announcements={announcements} 
          setAnnouncements={setAnnouncements} 
          role={userRole} 
        />;
        case 'equipment-manager': return <EquipmentManager 
          role={userRole}
          logActivity={logActivity}
        />;
        case 'maintenance-logbook': return <MaintenanceLogbook 
          role={userRole}
          userEmail={userEmail}
          staff={staff}
          logActivity={logActivity}
        />;
        case 'staff': return <StaffManager 
          staff={staff} 
          setStaff={setStaff} 
          role={userRole}
          logActivity={logActivity}
        />;
        case 'settings': return <PrivilegeManager 
          staff={staff} 
          setStaff={setStaff} 
          role={userRole}
          logActivity={logActivity}
        />;
        default: return <AdminDashboard members={members} payments={payments} role={userRole} staff={staff} attendanceRecords={attendanceRecords} activityLogs={activityLogs} expenses={expenses} />;
      }
    }
  };

  const handleLogout = () => {
    // Check if staff is on shift and warn them
    if (userRole === UserRole.STAFF && isOnShift) {
      setConfirmModal({
        isOpen: true,
        title: 'Warning',
        message: '⚠️ WARNING: You are currently on shift!\n\n' +
          'You must sign out from your shift before logging out.\n\n' +
          'Would you like to:\n' +
          '• Click "Cancel" to sign out from shift first\n' +
          '• Click "OK" to logout anyway (NOT RECOMMENDED)',
        confirmText: 'OK',
        cancelText: 'Cancel',
        type: 'warning',
        onConfirm: () => {
          // User confirmed logout even though on shift - log this as a warning
          logActivity('Logout Warning', 'Staff member logged out while still on shift', 'access');
          setConfirmModal(null);
          performLogout();
        }
      });
      return;
    }
    
    performLogout();
  };

  const performLogout = () => {
    logActivity('Logout', 'User signed out of the portal', 'access');
    setUserRole(UserRole.PUBLIC);
    setUserEmail('');
    setIsAdminLoggedIn(false);
    setCurrentPage('home');
    // Clear authentication data from localStorage
    localStorage.removeItem('userRole');
    localStorage.removeItem('userEmail');
    localStorage.removeItem('isAdminLoggedIn');
    localStorage.setItem('currentPage', 'home');
  };

  // Show loading state while initializing
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-rose-600 mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  const handleDismissUpdateNotification = () => {
    setUpdateNotificationDismissed(true);
    // Update last checked timestamp when dismissed
    const now = new Date().toISOString();
    setLastCheckedTimestamp(now);
    localStorage.setItem('lastUpdateCheck', now);
  };

  return (
    <ToastProvider>
      <div className="min-h-screen">
        {/* Update Notification - Only show for logged-in staff */}
        {userRole !== UserRole.PUBLIC && !updateNotificationDismissed && (
          <UpdateNotification
            announcements={announcements}
            lastCheckedTimestamp={lastCheckedTimestamp}
            onDismiss={handleDismissUpdateNotification}
          />
        )}

        {/* Confirmation Modal */}
        {confirmModal && (
          <ConfirmModal
            isOpen={confirmModal.isOpen}
            title={confirmModal.title}
            message={confirmModal.message}
            confirmText={confirmModal.confirmText}
            cancelText={confirmModal.cancelText}
            type={confirmModal.type}
            onConfirm={confirmModal.onConfirm}
            onCancel={() => setConfirmModal(null)}
          />
        )}
        
        {userRole === UserRole.PUBLIC ? (
          <PublicLayout setCurrentPage={setCurrentPage} currentPage={currentPage}>
            {renderPage()}
          </PublicLayout>
        ) : (
          <AdminLayout
            setCurrentPage={setCurrentPage}
            currentPage={currentPage}
            role={userRole}
            staff={staff}
            setStaff={setStaff}
            userEmail={userEmail}
            onLogout={handleLogout}
            isOnShift={isOnShift}
            onShiftSignIn={handleShiftSignIn}
            onShiftSignOut={handleShiftSignOut}
          >
            {renderPage()}
          </AdminLayout>
        )}
      </div>
    </ToastProvider>
  );
};

export default App;
