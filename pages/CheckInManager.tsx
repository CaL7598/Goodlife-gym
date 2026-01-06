import React, { useState, useMemo, useEffect } from 'react';
import { ClientCheckIn } from '../types';
import { Download, Filter, Calendar, Users, Clock, TrendingUp, Search, X, LogIn, LogOut } from 'lucide-react';
import { useToast } from '../contexts/ToastContext';
import { clientCheckInService } from '../lib/database';

interface CheckInManagerProps {
  checkIns: ClientCheckIn[];
  setCheckIns: (checkIns: ClientCheckIn[]) => void;
}

const CheckInManager: React.FC<CheckInManagerProps> = ({ checkIns, setCheckIns }) => {
  const { showSuccess, showError } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilter, setDateFilter] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'checked-in' | 'checked-out'>('all');

  // Ensure checkIns is always an array
  const safeCheckIns = Array.isArray(checkIns) ? checkIns : [];

  // Load check-ins on mount
  useEffect(() => {
    const loadCheckIns = async () => {
      try {
        const data = await clientCheckInService.getAll();
        setCheckIns(data);
      } catch (error: any) {
        console.error('Error loading check-ins:', error);
        // Don't show error if table doesn't exist yet
        if (!error.message?.includes('relation') && !error.message?.includes('does not exist')) {
          showError('Failed to load check-ins. Please ensure the database table exists.');
        }
      }
    };
    loadCheckIns();
  }, [setCheckIns, showError]);

  // Filter check-ins
  const filteredCheckIns = useMemo(() => {
    return safeCheckIns.filter(ci => {
      const matchesSearch = 
        ci.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        ci.phone.includes(searchTerm) ||
        (ci.email && ci.email.toLowerCase().includes(searchTerm.toLowerCase()));
      
      const matchesDate = !dateFilter || ci.date === dateFilter;
      
      const matchesStatus = 
        statusFilter === 'all' ||
        (statusFilter === 'checked-in' && !ci.checkOutTime) ||
        (statusFilter === 'checked-out' && !!ci.checkOutTime);
      
      return matchesSearch && matchesDate && matchesStatus;
    });
  }, [safeCheckIns, searchTerm, dateFilter, statusFilter]);

  // Analytics
  const analytics = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    const todayCheckIns = safeCheckIns.filter(ci => ci.date === today);
    const todayCheckedIn = todayCheckIns.filter(ci => !ci.checkOutTime).length;
    const todayCheckedOut = todayCheckIns.filter(ci => !!ci.checkOutTime).length;
    
    const thisWeek = safeCheckIns.filter(ci => {
      const checkInDate = new Date(ci.date);
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      return checkInDate >= weekAgo;
    }).length;

    const thisMonth = safeCheckIns.filter(ci => {
      const checkInDate = new Date(ci.date);
      const monthAgo = new Date();
      monthAgo.setMonth(monthAgo.getMonth() - 1);
      return checkInDate >= monthAgo;
    }).length;

    // Unique visitors
    const uniqueVisitors = new Set(safeCheckIns.map(ci => ci.phone)).size;

    // Average visit duration (for checked out visits)
    const checkedOutVisits = safeCheckIns.filter(ci => ci.checkOutTime);
    const totalDuration = checkedOutVisits.reduce((sum, ci) => {
      const checkIn = new Date(ci.checkInTime).getTime();
      const checkOut = new Date(ci.checkOutTime!).getTime();
      return sum + (checkOut - checkIn);
    }, 0);
    const avgDuration = checkedOutVisits.length > 0 
      ? Math.round(totalDuration / checkedOutVisits.length / 1000 / 60) // minutes
      : 0;

    return {
      todayTotal: todayCheckIns.length,
      todayCheckedIn,
      todayCheckedOut,
      thisWeek,
      thisMonth,
      uniqueVisitors,
      avgDuration
    };
  }, [safeCheckIns]);

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this check-in record?')) return;
    
    try {
      await clientCheckInService.delete(id);
      setCheckIns(checkIns.filter(ci => ci.id !== id));
      showSuccess('Check-in record deleted successfully');
    } catch (error: any) {
      showError(error.message || 'Failed to delete check-in record');
    }
  };

  const handleDownload = () => {
    const headers = ['Date', 'Name', 'Phone', 'Email', 'Check-In Time', 'Check-Out Time', 'Duration (minutes)', 'Status'];
    
    const rows = filteredCheckIns.map(ci => {
      const checkInTime = new Date(ci.checkInTime).toLocaleString();
      const checkOutTime = ci.checkOutTime ? new Date(ci.checkOutTime).toLocaleString() : 'N/A';
      
      let duration = 'N/A';
      if (ci.checkOutTime) {
        const checkIn = new Date(ci.checkInTime).getTime();
        const checkOut = new Date(ci.checkOutTime).getTime();
        duration = Math.round((checkOut - checkIn) / 1000 / 60).toString();
      }
      
      const status = ci.checkOutTime ? 'Checked Out' : 'Checked In';
      
      return [
        ci.date,
        ci.fullName,
        ci.phone,
        ci.email || 'N/A',
        checkInTime,
        checkOutTime,
        duration,
        status
      ];
    });

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `Goodlife_CheckIns_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    showSuccess('Check-in list downloaded successfully');
  };

  const formatTime = (timeString: string) => {
    return new Date(timeString).toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: true 
    });
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Client Check-Ins</h2>
          <p className="text-slate-600 text-sm mt-1">Monitor and manage client visits</p>
        </div>
        <button
          onClick={handleDownload}
          className="flex items-center gap-2 px-4 py-2 bg-rose-600 text-white rounded-lg hover:bg-rose-700 transition-colors"
        >
          <Download size={18} />
          Download CSV
        </button>
      </div>

      {/* Analytics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-slate-600">Today's Check-Ins</span>
            <Users className="text-rose-600" size={20} />
          </div>
          <div className="text-3xl font-bold text-slate-900">{analytics.todayTotal}</div>
          <div className="text-xs text-slate-500 mt-1">
            {analytics.todayCheckedIn} checked in, {analytics.todayCheckedOut} checked out
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-slate-600">This Week</span>
            <Calendar className="text-blue-600" size={20} />
          </div>
          <div className="text-3xl font-bold text-slate-900">{analytics.thisWeek}</div>
          <div className="text-xs text-slate-500 mt-1">Total visits</div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-slate-600">This Month</span>
            <TrendingUp className="text-emerald-600" size={20} />
          </div>
          <div className="text-3xl font-bold text-slate-900">{analytics.thisMonth}</div>
          <div className="text-xs text-slate-500 mt-1">Total visits</div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-slate-600">Unique Visitors</span>
            <Users className="text-purple-600" size={20} />
          </div>
          <div className="text-3xl font-bold text-slate-900">{analytics.uniqueVisitors}</div>
          <div className="text-xs text-slate-500 mt-1">
            {analytics.avgDuration > 0 ? `Avg: ${analytics.avgDuration} min` : 'No data'}
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input
              type="text"
              placeholder="Search by name, phone, or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-rose-500 outline-none"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X size={18} />
              </button>
            )}
          </div>

          <div>
            <input
              type="date"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-rose-500 outline-none"
            />
          </div>

          <div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-rose-500 outline-none"
            >
              <option value="all">All Status</option>
              <option value="checked-in">Checked In</option>
              <option value="checked-out">Checked Out</option>
            </select>
          </div>
        </div>
      </div>

      {/* Check-Ins Table */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">Date</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">Name</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">Phone</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">Email</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">Check-In</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">Check-Out</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">Duration</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-right text-xs font-semibold text-slate-700 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filteredCheckIns.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-6 py-12 text-center text-slate-500">
                    No check-ins found
                  </td>
                </tr>
              ) : (
                filteredCheckIns.map((ci) => {
                  const duration = ci.checkOutTime 
                    ? Math.round((new Date(ci.checkOutTime).getTime() - new Date(ci.checkInTime).getTime()) / 1000 / 60)
                    : null;

                  return (
                    <tr key={ci.id} className="hover:bg-slate-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900">
                        {formatDate(ci.date)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900">
                        {ci.fullName}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">
                        {ci.phone}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">
                        {ci.email || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">
                        <div className="flex items-center gap-1">
                          <LogIn size={14} className="text-emerald-600" />
                          {formatTime(ci.checkInTime)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">
                        {ci.checkOutTime ? (
                          <div className="flex items-center gap-1">
                            <LogOut size={14} className="text-rose-600" />
                            {formatTime(ci.checkOutTime)}
                          </div>
                        ) : (
                          '-'
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">
                        {duration !== null ? `${duration} min` : '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                          ci.checkOutTime
                            ? 'bg-slate-100 text-slate-700'
                            : 'bg-emerald-100 text-emerald-700'
                        }`}>
                          {ci.checkOutTime ? 'Checked Out' : 'Checked In'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                        <button
                          onClick={() => handleDelete(ci.id)}
                          className="text-rose-600 hover:text-rose-700 font-medium"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Summary */}
      <div className="text-sm text-slate-600 text-center">
        Showing {filteredCheckIns.length} of {safeCheckIns.length} check-ins
      </div>
    </div>
  );
};

export default CheckInManager;

