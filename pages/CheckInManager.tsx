import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { ClientCheckIn, Member } from '../types';
import {
  Download, Calendar, Users, TrendingUp, Search, X, LogIn, LogOut,
  UserCheck, History, Loader2, ArrowUp, ArrowDown, ArrowUpDown
} from 'lucide-react';
import { useToast } from '../contexts/ToastContext';
import {
  clientCheckInService,
  membersService,
  checkInNotesForMemberId,
} from '../lib/database';

const normalizePhone = (phone: string) => phone.replace(/\D/g, '');

const normalizeName = (name: string) =>
  name.toLowerCase().replace(/\s+/g, ' ').trim();

const displayMemberName = (member: Member) =>
  member.fullName?.trim() || member.phone?.trim() || 'Unnamed Member';

const getLocalDateString = (date: Date = new Date()) => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

const getVisitDate = (checkIn: ClientCheckIn) => {
  if (checkIn.date) return checkIn.date.split('T')[0];
  return getLocalDateString(new Date(checkIn.checkInTime));
};

const isActiveCheckIn = (checkIn: ClientCheckIn) =>
  checkIn.checkOutTime == null || checkIn.checkOutTime === '';

const isVisitToday = (checkIn: ClientCheckIn, today: string) =>
  getVisitDate(checkIn) === today;

const memberMatchesCheckIn = (member: Member, checkIn: ClientCheckIn) => {
  if (checkIn.memberId) return checkIn.memberId === member.id;
  return (
    normalizePhone(member.phone) === normalizePhone(checkIn.phone) &&
    normalizeName(displayMemberName(member)) === normalizeName(checkIn.fullName || '')
  );
};

interface CheckInManagerProps {
  members: Member[];
  checkIns: ClientCheckIn[];
  setCheckIns: (checkIns: ClientCheckIn[]) => void;
  logActivity?: (action: string, details: string, category: 'access' | 'admin' | 'financial') => void;
}

type ActiveTab = 'checkin' | 'history';
type HistorySortField = 'date' | 'checkInTime' | 'checkOutTime' | 'fullName' | 'phone' | 'duration' | 'status';
type SortDirection = 'asc' | 'desc';
type DatePreset = 'all' | 'today' | 'week' | 'month';

const getVisitDuration = (ci: ClientCheckIn): number | null => {
  if (!ci.checkOutTime) return null;
  return Math.round(
    (new Date(ci.checkOutTime).getTime() - new Date(ci.checkInTime).getTime()) / 1000 / 60
  );
};

const CheckInManager: React.FC<CheckInManagerProps> = ({
  members,
  checkIns,
  setCheckIns,
  logActivity,
}) => {
  const { showSuccess, showError } = useToast();
  const [activeTab, setActiveTab] = useState<ActiveTab>('checkin');
  const [memberSearch, setMemberSearch] = useState('');
  const [checkInMembers, setCheckInMembers] = useState<Member[]>(members);
  const [membersLoading, setMembersLoading] = useState(false);
  const [processingMemberId, setProcessingMemberId] = useState<string | null>(null);

  const [searchTerm, setSearchTerm] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [datePreset, setDatePreset] = useState<DatePreset>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'checked-in' | 'checked-out'>('all');
  const [sortField, setSortField] = useState<HistorySortField>('checkInTime');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [historyLoading, setHistoryLoading] = useState(false);

  const safeCheckIns = Array.isArray(checkIns) ? checkIns : [];
  const safeMembers = Array.isArray(checkInMembers) ? checkInMembers : [];
  const today = getLocalDateString();

  useEffect(() => {
    setCheckInMembers(members);
  }, [members]);

  useEffect(() => {
    const loadMembers = async () => {
      setMembersLoading(true);
      try {
        const data = await membersService.getAllForCheckIn();
        setCheckInMembers(data);
      } catch (error: any) {
        console.error('Error loading members for check-in:', error);
        if (!error.message?.includes('not configured')) {
          showError('Failed to load all members. Showing cached list.');
        }
      } finally {
        setMembersLoading(false);
      }
    };
    loadMembers();
  }, [showError]);

  const loadAllCheckIns = useCallback(async () => {
    setHistoryLoading(true);
    try {
      const data = await clientCheckInService.getAll();
      setCheckIns(data);
    } catch (error: any) {
      console.error('Error loading check-ins:', error);
      if (!error.message?.includes('relation') && !error.message?.includes('does not exist')) {
        showError('Failed to load check-in history.');
      }
    } finally {
      setHistoryLoading(false);
    }
  }, [setCheckIns, showError]);

  useEffect(() => {
    loadAllCheckIns();
  }, [loadAllCheckIns]);

  useEffect(() => {
    if (activeTab === 'checkin' || activeTab === 'history') {
      loadAllCheckIns();
    }
  }, [activeTab, loadAllCheckIns]);

  // Keep "Currently In Gym" in sync across staff sessions
  useEffect(() => {
    if (activeTab !== 'checkin') return;
    const interval = setInterval(() => {
      loadAllCheckIns();
    }, 30000);
    return () => clearInterval(interval);
  }, [activeTab, loadAllCheckIns]);

  const applyDatePreset = useCallback((preset: DatePreset) => {
    setDatePreset(preset);
    const now = new Date();
    const fmt = (d: Date) => d.toISOString().split('T')[0];

    if (preset === 'all') {
      setDateFrom('');
      setDateTo('');
    } else if (preset === 'today') {
      setDateFrom(fmt(now));
      setDateTo(fmt(now));
    } else if (preset === 'week') {
      const weekAgo = new Date(now);
      weekAgo.setDate(weekAgo.getDate() - 7);
      setDateFrom(fmt(weekAgo));
      setDateTo(fmt(now));
    } else if (preset === 'month') {
      const monthAgo = new Date(now);
      monthAgo.setMonth(monthAgo.getMonth() - 1);
      setDateFrom(fmt(monthAgo));
      setDateTo(fmt(now));
    }
  }, []);

  const handleSort = (field: HistorySortField) => {
    if (sortField === field) {
      setSortDirection(prev => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDirection(field === 'fullName' || field === 'phone' ? 'asc' : 'desc');
    }
  };

  const currentlyInGymRecords = useMemo(
    () =>
      safeCheckIns
        .filter(ci => isActiveCheckIn(ci) && isVisitToday(ci, today))
        .sort(
          (a, b) =>
            new Date(b.checkInTime).getTime() - new Date(a.checkInTime).getTime()
        ),
    [safeCheckIns, today]
  );

  const findMemberForCheckIn = useCallback(
    (checkIn: ClientCheckIn) => safeMembers.find(m => memberMatchesCheckIn(m, checkIn)),
    [safeMembers]
  );

  const isMemberCurrentlyInGym = useCallback(
    (member: Member) => currentlyInGymRecords.some(ci => memberMatchesCheckIn(member, ci)),
    [currentlyInGymRecords]
  );

  const matchesMemberSearch = useCallback((member: Member) => {
    if (!memberSearch.trim()) return true;
    const q = memberSearch.toLowerCase().trim();
    const name = displayMemberName(member).toLowerCase();
    return (
      name.includes(q) ||
      member.phone.includes(memberSearch.trim()) ||
      normalizePhone(member.phone).includes(normalizePhone(memberSearch)) ||
      (member.email && member.email.toLowerCase().includes(q))
    );
  }, [memberSearch]);

  const matchesCheckInSearch = useCallback((checkIn: ClientCheckIn) => {
    if (!memberSearch.trim()) return true;
    const q = memberSearch.toLowerCase().trim();
    const member = findMemberForCheckIn(checkIn);
    if (member && matchesMemberSearch(member)) return true;
    return (
      (checkIn.fullName || '').toLowerCase().includes(q) ||
      checkIn.phone.includes(memberSearch.trim()) ||
      normalizePhone(checkIn.phone).includes(normalizePhone(memberSearch))
    );
  }, [memberSearch, findMemberForCheckIn, matchesMemberSearch]);

  const pendingCheckInMembers = useMemo(() => {
    return [...safeMembers]
      .filter(member => matchesMemberSearch(member) && !isMemberCurrentlyInGym(member))
      .sort((a, b) => displayMemberName(a).localeCompare(displayMemberName(b)));
  }, [safeMembers, matchesMemberSearch, isMemberCurrentlyInGym]);

  const filteredCurrentlyInGym = useMemo(
    () => currentlyInGymRecords.filter(matchesCheckInSearch),
    [currentlyInGymRecords, matchesCheckInSearch]
  );

  const handleMemberCheckIn = async (member: Member) => {
    if (isMemberCurrentlyInGym(member)) {
      showError(`${displayMemberName(member)} is already in the gym.`);
      return;
    }

    setProcessingMemberId(member.id);
    try {
      const now = new Date();
      const newCheckIn = await clientCheckInService.create({
        fullName: displayMemberName(member),
        phone: member.phone.trim(),
        email: member.email,
        checkInTime: now.toISOString(),
        date: today,
        notes: checkInNotesForMemberId(member.id),
      });

      const withMemberId = { ...newCheckIn, memberId: member.id };
      setCheckIns([withMemberId, ...safeCheckIns]);
      showSuccess(`${displayMemberName(member)} checked in at ${now.toLocaleTimeString()}`);
      logActivity?.('Client Check-In', `Checked in ${displayMemberName(member)} (${member.phone})`, 'access');
    } catch (error: any) {
      showError(error.message || 'Failed to check in client');
    } finally {
      setProcessingMemberId(null);
    }
  };

  const handleCheckOutRecord = async (record: ClientCheckIn) => {
    if (!isActiveCheckIn(record)) {
      showError('This client is not currently checked in.');
      return;
    }

    const member = findMemberForCheckIn(record);
    const processingKey = member?.id ?? record.id;
    setProcessingMemberId(processingKey);

    try {
      const now = new Date();
      const updated = await clientCheckInService.update(record.id, {
        checkOutTime: now.toISOString(),
      });

      setCheckIns(safeCheckIns.map(ci => (ci.id === record.id ? updated : ci)));
      showSuccess(`${record.fullName} checked out at ${now.toLocaleTimeString()}`);
      logActivity?.('Client Check-Out', `Checked out ${record.fullName} (${record.phone})`, 'access');
    } catch (error: any) {
      showError(error.message || 'Failed to check out client');
    } finally {
      setProcessingMemberId(null);
    }
  };

  const filteredCheckIns = useMemo(() => {
    return safeCheckIns.filter(ci => {
      const q = searchTerm.toLowerCase().trim();
      const matchesSearch = !q ||
        ci.fullName.toLowerCase().includes(q) ||
        ci.phone.includes(searchTerm.trim()) ||
        normalizePhone(ci.phone).includes(normalizePhone(searchTerm)) ||
        (ci.email && ci.email.toLowerCase().includes(q));

      const matchesDateFrom = !dateFrom || ci.date >= dateFrom;
      const matchesDateTo = !dateTo || ci.date <= dateTo;

      const matchesStatus =
        statusFilter === 'all' ||
        (statusFilter === 'checked-in' && isActiveCheckIn(ci)) ||
        (statusFilter === 'checked-out' && !isActiveCheckIn(ci));

      return matchesSearch && matchesDateFrom && matchesDateTo && matchesStatus;
    });
  }, [safeCheckIns, searchTerm, dateFrom, dateTo, statusFilter]);

  const sortedCheckIns = useMemo(() => {
    const sorted = [...filteredCheckIns];
    const dir = sortDirection === 'asc' ? 1 : -1;

    sorted.sort((a, b) => {
      let cmp = 0;
      switch (sortField) {
        case 'date':
          cmp = a.date.localeCompare(b.date);
          break;
        case 'checkInTime':
          cmp = new Date(a.checkInTime).getTime() - new Date(b.checkInTime).getTime();
          break;
        case 'checkOutTime': {
          const aOut = a.checkOutTime ? new Date(a.checkOutTime).getTime() : 0;
          const bOut = b.checkOutTime ? new Date(b.checkOutTime).getTime() : 0;
          cmp = aOut - bOut;
          break;
        }
        case 'fullName':
          cmp = a.fullName.localeCompare(b.fullName);
          break;
        case 'phone':
          cmp = a.phone.localeCompare(b.phone);
          break;
        case 'duration': {
          const aDur = getVisitDuration(a) ?? -1;
          const bDur = getVisitDuration(b) ?? -1;
          cmp = aDur - bDur;
          break;
        }
        case 'status': {
          const aStatus = isActiveCheckIn(a) ? 0 : 1;
          const bStatus = isActiveCheckIn(b) ? 0 : 1;
          cmp = aStatus - bStatus;
          break;
        }
      }
      return cmp * dir;
    });

    return sorted;
  }, [filteredCheckIns, sortField, sortDirection]);

  const analytics = useMemo(() => {
    const todayVisits = safeCheckIns.filter(ci => isVisitToday(ci, today));
    const todayCheckedIn = currentlyInGymRecords.length;
    const todayCheckedOut = todayVisits.filter(ci => !isActiveCheckIn(ci)).length;

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

    const uniqueVisitors = new Set(safeCheckIns.map(ci => ci.phone)).size;

    const checkedOutVisits = safeCheckIns.filter(ci => !isActiveCheckIn(ci));
    const totalDuration = checkedOutVisits.reduce((sum, ci) => {
      const checkIn = new Date(ci.checkInTime).getTime();
      const checkOut = new Date(ci.checkOutTime!).getTime();
      return sum + (checkOut - checkIn);
    }, 0);
    const avgDuration = checkedOutVisits.length > 0
      ? Math.round(totalDuration / checkedOutVisits.length / 1000 / 60)
      : 0;

    return {
      todayTotal: todayVisits.length,
      todayCheckedIn,
      todayCheckedOut,
      thisWeek,
      thisMonth,
      uniqueVisitors,
      avgDuration,
    };
  }, [safeCheckIns, today, currentlyInGymRecords]);

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this check-in record?')) return;

    try {
      await clientCheckInService.delete(id);
      setCheckIns(safeCheckIns.filter(ci => ci.id !== id));
      showSuccess('Check-in record deleted successfully');
    } catch (error: any) {
      showError(error.message || 'Failed to delete check-in record');
    }
  };

  const handleDownload = () => {
    const headers = ['Date', 'Name', 'Phone', 'Email', 'Check-In Time', 'Check-Out Time', 'Duration (minutes)', 'Status'];

    const rows = sortedCheckIns.map(ci => {
      const checkInTime = new Date(ci.checkInTime).toLocaleString();
      const checkOutTime = ci.checkOutTime ? new Date(ci.checkOutTime).toLocaleString() : 'N/A';

      let duration = 'N/A';
      if (ci.checkOutTime) {
        const checkIn = new Date(ci.checkInTime).getTime();
        const checkOut = new Date(ci.checkOutTime).getTime();
        duration = Math.round((checkOut - checkIn) / 1000 / 60).toString();
      }

      const status = isActiveCheckIn(ci) ? 'Checked In' : 'Checked Out';

      return [ci.date, ci.fullName, ci.phone, ci.email || 'N/A', checkInTime, checkOutTime, duration, status];
    });

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(',')),
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
      hour12: true,
    });
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const statusBadgeClass = (status: Member['status']) => {
    switch (status) {
      case 'active': return 'bg-emerald-100 text-emerald-700';
      case 'expiring': return 'bg-amber-100 text-amber-700';
      case 'expired': return 'bg-rose-100 text-rose-700';
      default: return 'bg-slate-100 text-slate-700';
    }
  };

  const SortableHeader = ({
    field,
    label,
    className = '',
  }: {
    field: HistorySortField;
    label: string;
    className?: string;
  }) => (
    <th className={`px-3 sm:px-4 lg:px-6 py-3 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider ${className}`}>
      <button
        type="button"
        onClick={() => handleSort(field)}
        className="inline-flex items-center gap-1 hover:text-rose-600 transition-colors group"
      >
        {label}
        {sortField === field ? (
          sortDirection === 'asc' ? <ArrowUp size={14} /> : <ArrowDown size={14} />
        ) : (
          <ArrowUpDown size={14} className="opacity-0 group-hover:opacity-50" />
        )}
      </button>
    </th>
  );

  const renderMemberRow = (member: Member) => {
    const isProcessing = processingMemberId === member.id;

    return (
      <div
        key={member.id}
        className="flex items-center justify-between gap-3 p-3 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 transition-colors"
      >
        <div className="min-w-0 flex-1">
          <div className="font-medium text-slate-900 text-sm break-words">{displayMemberName(member)}</div>
          <div className="text-xs text-slate-500">{member.phone}</div>
          <div className="flex flex-wrap items-center gap-2 mt-1.5">
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold capitalize ${statusBadgeClass(member.status)}`}>
              {member.status}
            </span>
            <span className="text-[10px] text-slate-500">{member.plan}</span>
          </div>
        </div>
        <div className="shrink-0">
          {isProcessing ? (
            <span className="inline-flex items-center gap-1 text-slate-400 text-xs">
              <Loader2 size={14} className="animate-spin" />
            </span>
          ) : (
            <button
              onClick={() => handleMemberCheckIn(member)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 text-white text-xs font-semibold rounded-lg hover:bg-emerald-700 transition-colors"
            >
              <LogIn size={14} />
              Check In
            </button>
          )}
        </div>
      </div>
    );
  };

  const renderCurrentlyInGymRow = (record: ClientCheckIn) => {
    const member = findMemberForCheckIn(record);
    const processingKey = member?.id ?? record.id;
    const isProcessing = processingMemberId === processingKey;

    return (
      <div
        key={record.id}
        className="flex items-center justify-between gap-3 p-3 rounded-lg border border-emerald-200 bg-emerald-50 hover:bg-emerald-100/80 transition-colors"
      >
        <div className="min-w-0 flex-1">
          <div className="font-medium text-slate-900 text-sm break-words">
            {record.fullName?.trim() || (member ? displayMemberName(member) : 'Unknown Client')}
          </div>
          <div className="text-xs text-slate-500">{record.phone}</div>
          <div className="flex flex-wrap items-center gap-2 mt-1.5">
            {member && (
              <>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold capitalize ${statusBadgeClass(member.status)}`}>
                  {member.status}
                </span>
                <span className="text-[10px] text-slate-500">{member.plan}</span>
              </>
            )}
            <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-700">
              <LogIn size={10} />
              In since {formatTime(record.checkInTime)}
            </span>
          </div>
        </div>
        <div className="shrink-0">
          {isProcessing ? (
            <span className="inline-flex items-center gap-1 text-slate-400 text-xs">
              <Loader2 size={14} className="animate-spin" />
            </span>
          ) : (
            <button
              onClick={() => handleCheckOutRecord(record)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-rose-600 text-white text-xs font-semibold rounded-lg hover:bg-rose-700 transition-colors"
            >
              <LogOut size={14} />
              Check Out
            </button>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Client Check-In</h2>
          <p className="text-slate-600 text-sm mt-1">
            Staff check-in for gym members — date and time recorded automatically
          </p>
        </div>
        {activeTab === 'history' && (
          <button
            onClick={handleDownload}
            className="flex items-center gap-2 px-4 py-2 bg-rose-600 text-white rounded-lg hover:bg-rose-700 transition-colors"
          >
            <Download size={18} />
            Download CSV
          </button>
        )}
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-2 border-b border-slate-200">
        <button
          onClick={() => setActiveTab('checkin')}
          className={`flex items-center gap-2 px-4 py-3 text-sm font-semibold border-b-2 transition-colors ${
            activeTab === 'checkin'
              ? 'border-rose-600 text-rose-600'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <UserCheck size={18} />
          Check In Clients
        </button>
        <button
          onClick={() => setActiveTab('history')}
          className={`flex items-center gap-2 px-4 py-3 text-sm font-semibold border-b-2 transition-colors ${
            activeTab === 'history'
              ? 'border-rose-600 text-rose-600'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <History size={18} />
          Check-In History
        </button>
      </div>

      {activeTab === 'checkin' ? (
        <>
          {/* Quick Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm text-slate-600">Total Members</span>
                <Users className="text-slate-400" size={18} />
              </div>
              <div className="text-2xl font-bold text-slate-900">{safeMembers.length}</div>
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm text-slate-600">Currently In Gym</span>
                <LogIn className="text-emerald-600" size={18} />
              </div>
              <div className="text-2xl font-bold text-emerald-600">{analytics.todayCheckedIn}</div>
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm text-slate-600">Today's Visits</span>
                <Calendar className="text-rose-600" size={18} />
              </div>
              <div className="text-2xl font-bold text-slate-900">{analytics.todayTotal}</div>
            </div>
          </div>

          {membersLoading && (
            <div className="flex items-center justify-center gap-2 text-sm text-slate-500 py-2">
              <Loader2 size={16} className="animate-spin" />
              Loading all members...
            </div>
          )}

          {/* Search */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input
                type="text"
                placeholder="Search members by name, phone, or email..."
                value={memberSearch}
                onChange={(e) => setMemberSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-rose-500 outline-none"
              />
              {memberSearch && (
                <button
                  onClick={() => setMemberSearch('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <X size={18} />
                </button>
              )}
            </div>
          </div>

          {/* Split panels: pending left, checked-in right */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Left — members awaiting check-in */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col min-h-[420px]">
              <div className="px-4 py-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-slate-900 text-sm">All Members</h3>
                  <p className="text-xs text-slate-500">Tap Check In when a client arrives</p>
                </div>
                <span className="px-2.5 py-1 rounded-full bg-slate-200 text-slate-700 text-xs font-bold">
                  {pendingCheckInMembers.length}
                </span>
              </div>
              <div className="flex-1 overflow-y-auto p-3 space-y-2 max-h-[520px]">
                {pendingCheckInMembers.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full py-12 text-center text-slate-500">
                    <UserCheck size={32} className="text-slate-300 mb-2" />
                    <p className="text-sm">
                      {safeMembers.length === 0
                        ? 'No members found. Add members first.'
                        : 'Everyone is checked in or no matches found.'}
                    </p>
                  </div>
                ) : (
                  pendingCheckInMembers.map(member => renderMemberRow(member))
                )}
              </div>
            </div>

            {/* Right — checked in today */}
            <div className="bg-white rounded-xl shadow-sm border border-emerald-200 overflow-hidden flex flex-col min-h-[420px]">
              <div className="px-4 py-3 bg-emerald-50 border-b border-emerald-200 flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-emerald-900 text-sm">Currently In Gym</h3>
                  <p className="text-xs text-emerald-700">Active check-ins — no checkout yet today</p>
                </div>
                <span className="px-2.5 py-1 rounded-full bg-emerald-600 text-white text-xs font-bold">
                  {filteredCurrentlyInGym.length}
                </span>
              </div>
              <div className="flex-1 overflow-y-auto p-3 space-y-2 max-h-[520px]">
                {filteredCurrentlyInGym.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full py-12 text-center text-slate-500">
                    <LogIn size={32} className="text-slate-300 mb-2" />
                    <p className="text-sm">No clients in the gym right now.<br />Check in a member from the left panel.</p>
                  </div>
                ) : (
                  filteredCurrentlyInGym.map(record => renderCurrentlyInGymRow(record))
                )}
              </div>
            </div>
          </div>

          <div className="text-sm text-slate-600 text-center">
            {safeMembers.length} members loaded · {currentlyInGymRecords.length} currently in gym · {pendingCheckInMembers.length} awaiting check-in
          </div>
        </>
      ) : (
        <>
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

          {/* History section header */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
              <div>
                <h3 className="font-semibold text-slate-900">All Check-In History</h3>
                <p className="text-xs text-slate-500">Filter and sort every client visit record</p>
              </div>
              {historyLoading && (
                <span className="inline-flex items-center gap-1.5 text-xs text-slate-500">
                  <Loader2 size={14} className="animate-spin" />
                  Refreshing...
                </span>
              )}
            </div>

            {/* Quick date presets */}
            <div className="flex flex-wrap gap-2 mb-4">
              {([
                ['all', 'All Time'],
                ['today', 'Today'],
                ['week', 'This Week'],
                ['month', 'This Month'],
              ] as [DatePreset, string][]).map(([preset, label]) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => applyDatePreset(preset)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                    datePreset === preset
                      ? 'bg-rose-600 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="relative lg:col-span-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input
                  type="text"
                  placeholder="Search name, phone, email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-rose-500 outline-none text-sm"
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
                <label className="block text-[10px] font-semibold text-slate-500 uppercase mb-1">From Date</label>
                <input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => { setDateFrom(e.target.value); setDatePreset('all'); }}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-rose-500 outline-none text-sm"
                />
              </div>

              <div>
                <label className="block text-[10px] font-semibold text-slate-500 uppercase mb-1">To Date</label>
                <input
                  type="date"
                  value={dateTo}
                  onChange={(e) => { setDateTo(e.target.value); setDatePreset('all'); }}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-rose-500 outline-none text-sm"
                />
              </div>

              <div>
                <label className="block text-[10px] font-semibold text-slate-500 uppercase mb-1">Status</label>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-rose-500 outline-none text-sm"
                >
                  <option value="all">All Status</option>
                  <option value="checked-in">Still In Gym</option>
                  <option value="checked-out">Checked Out</option>
                </select>
              </div>
            </div>

            <div className="mt-4 flex flex-col sm:flex-row sm:items-center gap-3">
              <label className="text-xs font-semibold text-slate-600 shrink-0">Sort by:</label>
              <select
                value={`${sortField}-${sortDirection}`}
                onChange={(e) => {
                  const [field, dir] = e.target.value.split('-') as [HistorySortField, SortDirection];
                  setSortField(field);
                  setSortDirection(dir);
                }}
                className="flex-1 max-w-xs px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-rose-500 outline-none text-sm"
              >
                <option value="checkInTime-desc">Check-In Time (Newest)</option>
                <option value="checkInTime-asc">Check-In Time (Oldest)</option>
                <option value="date-desc">Date (Newest)</option>
                <option value="date-asc">Date (Oldest)</option>
                <option value="checkOutTime-desc">Check-Out Time (Newest)</option>
                <option value="checkOutTime-asc">Check-Out Time (Oldest)</option>
                <option value="fullName-asc">Name (A–Z)</option>
                <option value="fullName-desc">Name (Z–A)</option>
                <option value="phone-asc">Phone (A–Z)</option>
                <option value="duration-desc">Duration (Longest)</option>
                <option value="duration-asc">Duration (Shortest)</option>
                <option value="status-asc">Status (In first)</option>
                <option value="status-desc">Status (Out first)</option>
              </select>
              {(searchTerm || dateFrom || dateTo || statusFilter !== 'all') && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchTerm('');
                    applyDatePreset('all');
                    setStatusFilter('all');
                  }}
                  className="text-xs text-rose-600 hover:text-rose-700 font-semibold"
                >
                  Clear filters
                </button>
              )}
            </div>
          </div>

          {/* History Table */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <SortableHeader field="date" label="Date" />
                    <SortableHeader field="fullName" label="Name" />
                    <SortableHeader field="phone" label="Phone" className="hidden sm:table-cell" />
                    <th className="px-3 sm:px-4 lg:px-6 py-3 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider hidden md:table-cell">Email</th>
                    <SortableHeader field="checkInTime" label="Check-In" />
                    <SortableHeader field="checkOutTime" label="Check-Out" />
                    <SortableHeader field="duration" label="Duration" className="hidden lg:table-cell" />
                    <SortableHeader field="status" label="Status" />
                    <th className="px-3 sm:px-4 lg:px-6 py-3 text-right text-xs font-semibold text-slate-700 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {sortedCheckIns.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="px-4 sm:px-6 py-12 text-center text-slate-500">
                        No check-ins found for the selected filters
                      </td>
                    </tr>
                  ) : (
                    sortedCheckIns.map(ci => {
                      const duration = getVisitDuration(ci);

                      return (
                        <tr key={ci.id} className="hover:bg-slate-50">
                          <td className="px-3 sm:px-4 lg:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-slate-900">
                            {formatDate(ci.date)}
                          </td>
                          <td className="px-3 sm:px-4 lg:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm font-medium text-slate-900">
                            {ci.fullName}
                          </td>
                          <td className="px-3 sm:px-4 lg:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-slate-600 hidden sm:table-cell">
                            {ci.phone}
                          </td>
                          <td className="px-3 sm:px-4 lg:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-slate-600 hidden md:table-cell">
                            {ci.email || '-'}
                          </td>
                          <td className="px-3 sm:px-4 lg:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-slate-600">
                            <div className="flex items-center gap-1">
                              <LogIn size={12} className="text-emerald-600 shrink-0" />
                              <span>{formatTime(ci.checkInTime)}</span>
                            </div>
                          </td>
                          <td className="px-3 sm:px-4 lg:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-slate-600">
                            {ci.checkOutTime ? (
                              <div className="flex items-center gap-1">
                                <LogOut size={12} className="text-rose-600 shrink-0" />
                                <span>{formatTime(ci.checkOutTime)}</span>
                              </div>
                            ) : (
                              '-'
                            )}
                          </td>
                          <td className="px-3 sm:px-4 lg:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-slate-600 hidden lg:table-cell">
                            {duration !== null ? `${duration} min` : '-'}
                          </td>
                          <td className="px-3 sm:px-4 lg:px-6 py-3 sm:py-4 whitespace-nowrap">
                            <span className={`px-2 py-1 rounded-full text-[10px] sm:text-xs font-semibold ${
                              isActiveCheckIn(ci) ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-700'
                            }`}>
                              {isActiveCheckIn(ci) ? 'In Gym' : 'Out'}
                            </span>
                          </td>
                          <td className="px-3 sm:px-4 lg:px-6 py-3 sm:py-4 whitespace-nowrap text-right text-xs sm:text-sm">
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

          <div className="text-sm text-slate-600 text-center">
            Showing {sortedCheckIns.length} of {safeCheckIns.length} check-ins
            {sortedCheckIns.length > 0 && (
              <> · sorted by {sortField.replace(/([A-Z])/g, ' $1').toLowerCase()} ({sortDirection})</>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default CheckInManager;
