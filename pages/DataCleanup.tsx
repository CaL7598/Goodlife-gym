import React, { useState } from 'react';
import { UserRole } from '../types';
import { Trash2, AlertTriangle, ShieldAlert } from 'lucide-react';
import { 
  activityLogsService,
  attendanceService,
  paymentsService,
  clientCheckInService,
  expensesService,
  maintenanceLogsService,
  announcementsService,
  galleryService,
  equipmentPostsService
} from '../lib/database';
import { useToast } from '../contexts/ToastContext';
import ConfirmModal from '../components/ConfirmModal';

interface DataCleanupProps {
  role: UserRole;
  setActivityLogs: React.Dispatch<React.SetStateAction<any[]>>;
  setAttendanceRecords: React.Dispatch<React.SetStateAction<any[]>>;
  setPayments: React.Dispatch<React.SetStateAction<any[]>>;
  setClientCheckIns: React.Dispatch<React.SetStateAction<any[]>>;
  setExpenses: React.Dispatch<React.SetStateAction<any[]>>;
  setMaintenanceLogs: React.Dispatch<React.SetStateAction<any[]>>;
  setAnnouncements: React.Dispatch<React.SetStateAction<any[]>>;
  setGallery: React.Dispatch<React.SetStateAction<any[]>>;
  logActivity: (action: string, details: string, category: 'access' | 'admin' | 'financial') => void;
}

const DataCleanup: React.FC<DataCleanupProps> = ({
  role,
  setActivityLogs,
  setAttendanceRecords,
  setPayments,
  setClientCheckIns,
  setExpenses,
  setMaintenanceLogs,
  setAnnouncements,
  setGallery,
  logActivity
}) => {
  const { showSuccess, showError } = useToast();
  const [confirm, setConfirm] = useState<{ message: string; onConfirm: () => void } | null>(null);

  if (role !== UserRole.SUPER_ADMIN) {
    return (
      <div className="h-[60vh] flex flex-col items-center justify-center text-center p-6">
        <div className="w-16 h-16 bg-amber-50 text-amber-600 rounded-full flex items-center justify-center mb-4">
          <AlertTriangle size={32} />
        </div>
        <h2 className="text-2xl font-bold text-slate-900 mb-2">Access Restricted</h2>
        <p className="text-slate-500 max-w-sm">Only Super Admins can clear system data.</p>
      </div>
    );
  }

  const ensureSupabase = () => {
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
    if (!supabaseUrl || !supabaseKey) {
      showError('Database not configured. Please configure Supabase first.');
      return false;
    }
    return true;
  };

  const requestConfirm = (message: string, action: () => Promise<void>) => {
    setConfirm({
      message,
      onConfirm: async () => {
        if (!ensureSupabase()) {
          setConfirm(null);
          return;
        }
        try {
          await action();
        } catch (error: any) {
          console.error('Clear data error:', error);
          showError(error.message || 'Failed to clear data.');
        } finally {
          setConfirm(null);
        }
      }
    });
  };

  const actions = [
    {
      id: 'activity-logs',
      title: 'Clear Activity Logs',
      description: 'Removes all audit trail entries.',
      onClear: async () => {
        await activityLogsService.clearAll();
        setActivityLogs([]);
        logActivity('Clear Activity Logs', 'Cleared all activity logs', 'admin');
        showSuccess('Activity logs cleared.');
      }
    },
    {
      id: 'attendance',
      title: 'Clear Attendance Records',
      description: 'Removes all staff attendance records.',
      onClear: async () => {
        await attendanceService.clearAll();
        setAttendanceRecords([]);
        logActivity('Clear Attendance', 'Cleared all attendance records', 'admin');
        showSuccess('Attendance records cleared.');
      }
    },
    {
      id: 'payments',
      title: 'Clear Payment History',
      description: 'Removes all payment records.',
      onClear: async () => {
        await paymentsService.clearAll();
        setPayments([]);
        logActivity('Clear Payments', 'Cleared all payment records', 'financial');
        showSuccess('Payment history cleared.');
      }
    },
    {
      id: 'checkins',
      title: 'Clear Client Check-Ins',
      description: 'Removes all client check-in records.',
      onClear: async () => {
        await clientCheckInService.clearAll();
        setClientCheckIns([]);
        logActivity('Clear Check-Ins', 'Cleared all client check-ins', 'admin');
        showSuccess('Client check-ins cleared.');
      }
    },
    {
      id: 'expenses',
      title: 'Clear Expenses',
      description: 'Removes all expense records.',
      onClear: async () => {
        await expensesService.clearAll();
        setExpenses([]);
        logActivity('Clear Expenses', 'Cleared all expense records', 'financial');
        showSuccess('Expenses cleared.');
      }
    },
    {
      id: 'maintenance',
      title: 'Clear Maintenance Logs',
      description: 'Removes all equipment maintenance logs.',
      onClear: async () => {
        await maintenanceLogsService.clearAll();
        setMaintenanceLogs([]);
        logActivity('Clear Maintenance Logs', 'Cleared all maintenance logs', 'admin');
        showSuccess('Maintenance logs cleared.');
      }
    },
    {
      id: 'announcements',
      title: 'Clear Announcements',
      description: 'Removes all announcements from the public site.',
      onClear: async () => {
        await announcementsService.clearAll();
        setAnnouncements([]);
        logActivity('Clear Announcements', 'Cleared all announcements', 'admin');
        showSuccess('Announcements cleared.');
      }
    },
    {
      id: 'gallery',
      title: 'Clear Gallery',
      description: 'Removes all gallery images.',
      onClear: async () => {
        await galleryService.clearAll();
        setGallery([]);
        logActivity('Clear Gallery', 'Cleared all gallery images', 'admin');
        showSuccess('Gallery cleared.');
      }
    },
    {
      id: 'equipment-posts',
      title: 'Clear Equipment & Sales Posts',
      description: 'Removes all posts shown on the Equipment & Sales page.',
      onClear: async () => {
        await equipmentPostsService.clearAll();
        logActivity('Clear Equipment Posts', 'Cleared all equipment & sales posts', 'admin');
        showSuccess('Equipment posts cleared.');
      }
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-start gap-4 bg-amber-50 border border-amber-200 rounded-lg p-4">
        <div className="text-amber-600">
          <ShieldAlert size={24} />
        </div>
        <div>
          <h2 className="text-lg font-bold text-amber-900">Danger Zone: Clear System Data</h2>
          <p className="text-sm text-amber-700 mt-1">
            These actions permanently delete records from the database. Use with caution.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {actions.map((action) => (
          <div key={action.id} className="bg-white border border-slate-200 rounded-lg p-4 flex items-start justify-between gap-4">
            <div>
              <h3 className="font-bold text-slate-900">{action.title}</h3>
              <p className="text-sm text-slate-600 mt-1">{action.description}</p>
            </div>
            <button
              onClick={() => requestConfirm(`Are you sure you want to ${action.title.toLowerCase()}? This cannot be undone.`, action.onClear)}
              className="px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center gap-2 text-sm font-semibold"
            >
              <Trash2 size={16} />
              Clear
            </button>
          </div>
        ))}
      </div>

      {confirm && (
        <ConfirmModal
          isOpen={true}
          message={confirm.message}
          onConfirm={confirm.onConfirm}
          onCancel={() => setConfirm(null)}
          confirmText="Clear"
          type="danger"
        />
      )}
    </div>
  );
};

export default DataCleanup;
