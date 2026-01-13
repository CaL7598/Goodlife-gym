import React, { useState, useEffect } from 'react';
import { MaintenanceLog, UserRole, StaffMember } from '../types';
import { Search, Plus, Trash2, X, Save, Wrench, Calendar, Clock, User, FileText } from 'lucide-react';
import { maintenanceLogsService, equipmentService } from '../lib/database';
import { useToast } from '../contexts/ToastContext';
import ConfirmModal from '../components/ConfirmModal';

interface MaintenanceLogbookProps {
  role: UserRole;
  userEmail: string;
  staff: StaffMember[];
  logActivity: (action: string, details: string, category: 'access' | 'admin' | 'financial') => void;
}

const MaintenanceLogbook: React.FC<MaintenanceLogbookProps> = ({ role, userEmail, staff, logActivity }) => {
  const { showSuccess, showError } = useToast();
  const [logs, setLogs] = useState<MaintenanceLog[]>([]);
  const [equipment, setEquipment] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<{
    isOpen: boolean;
    log: MaintenanceLog | null;
    onConfirm: () => void;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [newLog, setNewLog] = useState<Partial<MaintenanceLog>>({
    equipmentName: '',
    description: '',
    dateTime: new Date().toISOString().slice(0, 16), // Format: YYYY-MM-DDTHH:mm
    staffName: ''
  });

  // Get current staff member
  const currentStaff = staff.find(s => s.email === userEmail);

  // Load logs and equipment from database
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

      if (supabaseUrl && supabaseKey) {
        const [logsData, equipmentData] = await Promise.all([
          maintenanceLogsService.getAll(),
          equipmentService.getAll()
        ]);
        setLogs(logsData);
        // Extract unique equipment names
        const equipmentNames = [...new Set(equipmentData.map(eq => eq.name))];
        setEquipment(equipmentNames);
        
        // Set current staff name in form
        if (currentStaff) {
          setNewLog(prev => ({ ...prev, staffName: currentStaff.fullName }));
        }
      } else {
        showError('Database not configured. Please configure Supabase.');
      }
    } catch (error: any) {
      console.error('Error loading data:', error);
      showError(`Failed to load data: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddLog = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newLog.equipmentName || !newLog.description || !newLog.dateTime || !newLog.staffName) {
      showError('Please fill in all required fields');
      return;
    }

    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

      if (!supabaseUrl || !supabaseKey) {
        showError('Database not configured. Cannot save log.');
        return;
      }

      const createdLog = await maintenanceLogsService.create({
        equipmentName: newLog.equipmentName!,
        description: newLog.description!,
        dateTime: new Date(newLog.dateTime!).toISOString(),
        staffName: newLog.staffName!,
        staffEmail: currentStaff?.email
      });

      setLogs(prev => [createdLog, ...prev]);
      logActivity('Add Maintenance Log', `Added maintenance log for ${createdLog.equipmentName}`, 'admin');
      showSuccess(`Maintenance log added successfully!`);

      // Reset form
      setNewLog({
        equipmentName: '',
        description: '',
        dateTime: new Date().toISOString().slice(0, 16),
        staffName: currentStaff?.fullName || ''
      });
      setShowAddModal(false);
    } catch (error: any) {
      console.error('Error adding maintenance log:', error);
      showError(`Failed to add maintenance log: ${error.message}`);
    }
  };

  const handleDeleteLog = (log: MaintenanceLog) => {
    setDeleteConfirm({
      isOpen: true,
      log,
      onConfirm: async () => {
        try {
          await maintenanceLogsService.delete(log.id);
          setLogs(prev => prev.filter(l => l.id !== log.id));
          logActivity('Delete Maintenance Log', `Deleted maintenance log for ${log.equipmentName}`, 'admin');
          showSuccess(`Maintenance log deleted successfully!`);
          setDeleteConfirm(null);
        } catch (error: any) {
          console.error('Error deleting maintenance log:', error);
          showError(`Failed to delete maintenance log: ${error.message}`);
          setDeleteConfirm(null);
        }
      }
    });
  };

  const filteredLogs = logs.filter(log => {
    const searchLower = searchTerm.toLowerCase();
    return (
      log.equipmentName.toLowerCase().includes(searchLower) ||
      log.description.toLowerCase().includes(searchLower) ||
      log.staffName.toLowerCase().includes(searchLower)
    );
  });

  const formatDateTime = (dateTime: string) => {
    try {
      const date = new Date(dateTime);
      return {
        date: date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }),
        time: date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
      };
    } catch {
      return { date: 'Invalid Date', time: '' };
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-rose-600 mx-auto mb-4"></div>
          <p className="text-slate-600">Loading maintenance logs...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {deleteConfirm && (
        <ConfirmModal
          isOpen={deleteConfirm.isOpen}
          title="Delete Maintenance Log"
          message={`Are you sure you want to delete the maintenance log for "${deleteConfirm.log?.equipmentName}"? This action cannot be undone.`}
          confirmText="Delete"
          cancelText="Cancel"
          type="danger"
          onConfirm={deleteConfirm.onConfirm}
          onCancel={() => setDeleteConfirm(null)}
        />
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 flex items-center gap-3">
            <Wrench className="text-rose-600" size={28} />
            Maintenance Logbook
          </h1>
          <p className="text-slate-500 mt-1">Track equipment maintenance and repairs</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg font-medium transition-colors w-full sm:w-auto justify-center"
        >
          <Plus size={20} />
          Add Maintenance Log
        </button>
      </div>

      {/* Statistics Card */}
      <div className="bg-white p-4 rounded-lg shadow-sm border border-slate-200">
        <p className="text-slate-600 text-sm mb-1">Total Maintenance Records</p>
        <p className="text-2xl font-bold text-slate-900">{logs.length}</p>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={20} />
        <input
          type="text"
          placeholder="Search by equipment name, description, or staff name..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-transparent"
        />
      </div>

      {/* Logs List */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        {filteredLogs.length === 0 ? (
          <div className="p-12 text-center">
            <FileText className="mx-auto text-slate-300 mb-4" size={48} />
            <p className="text-slate-500 text-lg">No maintenance logs found</p>
            <p className="text-slate-400 text-sm mt-2">
              {searchTerm ? 'Try adjusting your search' : 'Add your first maintenance log to get started'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Equipment</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Description</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Date & Time</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Recorded By</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {filteredLogs.map((log) => {
                  const { date, time } = formatDateTime(log.dateTime);
                  return (
                    <tr key={log.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-2">
                          <Wrench size={16} className="text-slate-400" />
                          <span className="font-semibold text-slate-900">{log.equipmentName}</span>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <p className="text-slate-700 text-sm max-w-md">{log.description}</p>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-2 text-slate-600">
                          <Calendar size={16} className="text-slate-400" />
                          <div>
                            <div className="text-sm font-medium">{date}</div>
                            <div className="text-xs text-slate-500 flex items-center gap-1">
                              <Clock size={12} />
                              {time}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-2 text-slate-600">
                          <User size={16} className="text-slate-400" />
                          <span className="text-sm">{log.staffName}</span>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        {role === UserRole.SUPER_ADMIN && (
                          <button
                            onClick={() => handleDeleteLog(log)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Delete maintenance log"
                          >
                            <Trash2 size={18} />
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add Log Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between">
              <h2 className="text-xl font-bold text-slate-900">Add Maintenance Log</h2>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleAddLog} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Equipment Name *</label>
                {equipment.length > 0 ? (
                  <select
                    value={newLog.equipmentName || ''}
                    onChange={(e) => setNewLog({ ...newLog, equipmentName: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-transparent"
                    required
                  >
                    <option value="">Select equipment...</option>
                    {equipment.map((eq) => (
                      <option key={eq} value={eq}>{eq}</option>
                    ))}
                  </select>
                ) : (
                  <input
                    type="text"
                    value={newLog.equipmentName || ''}
                    onChange={(e) => setNewLog({ ...newLog, equipmentName: e.target.value })}
                    placeholder="Enter equipment name"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-transparent"
                    required
                  />
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Description *</label>
                <textarea
                  value={newLog.description || ''}
                  onChange={(e) => setNewLog({ ...newLog, description: e.target.value })}
                  placeholder="Describe the maintenance work performed..."
                  rows={4}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Date & Time *</label>
                <input
                  type="datetime-local"
                  value={newLog.dateTime || ''}
                  onChange={(e) => setNewLog({ ...newLog, dateTime: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Recorded By *</label>
                <input
                  type="text"
                  value={newLog.staffName || ''}
                  onChange={(e) => setNewLog({ ...newLog, staffName: e.target.value })}
                  placeholder="Staff name"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-transparent"
                  required
                />
                <p className="text-xs text-slate-500 mt-1">Name of the staff member recording this log</p>
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
                  className="flex-1 px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                >
                  <Save size={18} />
                  Save Log
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default MaintenanceLogbook;
