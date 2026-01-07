
import React, { useMemo, useState } from 'react';
import { Member, PaymentRecord, UserRole, StaffMember, AttendanceRecord, ActivityLog, PaymentStatus } from '../types';
import { 
  Users, 
  CreditCard, 
  AlertCircle, 
  TrendingUp, 
  CheckCircle2,
  Activity,
  MapPin,
  Clock,
  User as UserIcon,
  Calendar,
  Search,
  DollarSign,
  Filter,
  Bell,
  UserPlus
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  LineChart,
  Line
} from 'recharts';

interface DashboardProps {
  members: Member[];
  payments: PaymentRecord[];
  role: UserRole;
  staff: StaffMember[];
  attendanceRecords: AttendanceRecord[];
  activityLogs: ActivityLog[];
}

const AdminDashboard: React.FC<DashboardProps> = ({ members, payments, role, staff, attendanceRecords, activityLogs }) => {
  const [aiSummary, setAiSummary] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [revenuePeriod, setRevenuePeriod] = useState<'day' | 'week' | 'month' | 'year'>('month');
  const [customDateRange, setCustomDateRange] = useState({ start: '', end: '' });
  const [showCustomRange, setShowCustomRange] = useState(false);

  const stats = useMemo(() => {
    const activeCount = members.filter(m => m.status === 'active').length;
    const expiringCount = members.filter(m => m.status === 'expiring').length;
    const expiredCount = members.filter(m => m.status === 'expired').length;
    const totalRevenue = payments
      .filter(p => p.status === 'Confirmed')
      .reduce((sum, p) => sum + p.amount, 0);

    return {
      active: activeCount,
      expiring: expiringCount,
      expired: expiredCount,
      revenue: totalRevenue,
      total: members.length
    };
  }, [members, payments]);

  const chartData = useMemo(() => [
    { name: 'Active', value: stats.active },
    { name: 'Expiring', value: stats.expiring },
    { name: 'Expired', value: stats.expired },
  ], [stats]);

  // Revenue Analytics Calculations
  const revenueData = useMemo(() => {
    const confirmedPayments = payments.filter(p => p.status === 'Confirmed');
    const now = new Date();
    
    let filteredPayments: PaymentRecord[] = [];
    let periodLabel = '';
    
    if (showCustomRange && customDateRange.start && customDateRange.end) {
      // Custom date range
      filteredPayments = confirmedPayments.filter(p => {
        const paymentDate = new Date(p.date);
        const start = new Date(customDateRange.start);
        const end = new Date(customDateRange.end);
        end.setHours(23, 59, 59, 999);
        return paymentDate >= start && paymentDate <= end;
      });
      periodLabel = `${customDateRange.start} to ${customDateRange.end}`;
    } else {
      // Predefined periods
      switch (revenuePeriod) {
        case 'day':
          const today = now.toISOString().split('T')[0];
          filteredPayments = confirmedPayments.filter(p => p.date === today);
          periodLabel = 'Today';
          break;
        case 'week':
          const weekAgo = new Date(now);
          weekAgo.setDate(now.getDate() - 7);
          filteredPayments = confirmedPayments.filter(p => {
            const paymentDate = new Date(p.date);
            return paymentDate >= weekAgo;
          });
          periodLabel = 'Last 7 Days';
          break;
        case 'month':
          const monthAgo = new Date(now);
          monthAgo.setMonth(now.getMonth() - 1);
          filteredPayments = confirmedPayments.filter(p => {
            const paymentDate = new Date(p.date);
            return paymentDate >= monthAgo;
          });
          periodLabel = 'Last 30 Days';
          break;
        case 'year':
          const yearAgo = new Date(now);
          yearAgo.setFullYear(now.getFullYear() - 1);
          filteredPayments = confirmedPayments.filter(p => {
            const paymentDate = new Date(p.date);
            return paymentDate >= yearAgo;
          });
          periodLabel = 'Last 12 Months';
          break;
      }
    }

    const totalRevenue = filteredPayments.reduce((sum, p) => sum + p.amount, 0);
    const cashRevenue = filteredPayments.filter(p => p.method === 'Cash').reduce((sum, p) => sum + p.amount, 0);
    const momoRevenue = filteredPayments.filter(p => p.method === 'Mobile Money').reduce((sum, p) => sum + p.amount, 0);
    const transactionCount = filteredPayments.length;

    // Daily breakdown for chart
    const dailyBreakdown = filteredPayments.reduce((acc, payment) => {
      const date = payment.date;
      if (!acc[date]) {
        acc[date] = 0;
      }
      acc[date] += payment.amount;
      return acc;
    }, {} as Record<string, number>);

    const chartData = Object.entries(dailyBreakdown)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, amount]) => ({
        date: new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        amount: amount,
        fullDate: date
      }));

    return {
      totalRevenue,
      cashRevenue,
      momoRevenue,
      transactionCount,
      periodLabel,
      chartData,
      payments: filteredPayments
    };
  }, [payments, revenuePeriod, customDateRange, showCustomRange]);

  // Algorithm-based analytics summary generator
  const generateAnalyticsSummary = (
    statsData: { active: number; expiring: number; expired: number; revenue: number; total: number },
    revenueDataValue: { totalRevenue: number; cashRevenue: number; momoRevenue: number; transactionCount: number; periodLabel: string; chartData: Array<{ date: string; amount: number; fullDate: string }>; payments: PaymentRecord[] }
  ) => {
    const insights: string[] = [];
    
    // Member Status Analysis
    const activePercentage = statsData.total > 0 ? (statsData.active / statsData.total * 100).toFixed(1) : '0';
    const expiringPercentage = statsData.total > 0 ? (statsData.expiring / statsData.total * 100).toFixed(1) : '0';
    const expiredPercentage = statsData.total > 0 ? (statsData.expired / statsData.total * 100).toFixed(1) : '0';
    
    insights.push(`📊 MEMBER STATUS OVERVIEW`);
    insights.push(`Active Members: ${statsData.active} (${activePercentage}%)`);
    insights.push(`Expiring Soon: ${statsData.expiring} (${expiringPercentage}%)`);
    insights.push(`Expired: ${statsData.expired} (${expiredPercentage}%)`);
    insights.push(``);
    
    // Member Health Assessment
    if (parseFloat(activePercentage) >= 70) {
      insights.push(`✅ EXCELLENT: High member retention rate indicates strong business health.`);
    } else if (parseFloat(activePercentage) >= 50) {
      insights.push(`⚠️ MODERATE: Member retention could be improved. Consider engagement campaigns.`);
    } else {
      insights.push(`🔴 ATTENTION NEEDED: Low active member rate. Review retention strategies.`);
    }
    insights.push(``);
    
    // Expiring Members Alert
    if (statsData.expiring > 0) {
      insights.push(`⚠️ ACTION REQUIRED: ${statsData.expiring} member(s) expiring soon.`);
      insights.push(`Recommendation: Send renewal reminders and offer incentives.`);
      insights.push(``);
    }
    
    // Revenue Analysis
    insights.push(`💰 REVENUE ANALYSIS`);
    insights.push(`Total Revenue (All Time): ₵${statsData.revenue.toLocaleString()}`);
    insights.push(`Period Revenue (${revenueDataValue.periodLabel}): ₵${revenueDataValue.totalRevenue.toLocaleString()}`);
    
    if (revenueDataValue.transactionCount > 0) {
      const avgTransaction = revenueDataValue.totalRevenue / revenueDataValue.transactionCount;
      insights.push(`Average Transaction: ₵${avgTransaction.toFixed(0)}`);
      insights.push(`Total Transactions: ${revenueDataValue.transactionCount}`);
    }
    insights.push(``);
    
    // Payment Method Breakdown
    if (revenueDataValue.totalRevenue > 0) {
      const cashPercentage = (revenueDataValue.cashRevenue / revenueDataValue.totalRevenue * 100).toFixed(1);
      const momoPercentage = (revenueDataValue.momoRevenue / revenueDataValue.totalRevenue * 100).toFixed(1);
      insights.push(`💳 PAYMENT METHOD BREAKDOWN`);
      insights.push(`Cash: ₵${revenueDataValue.cashRevenue.toLocaleString()} (${cashPercentage}%)`);
      insights.push(`Mobile Money: ₵${revenueDataValue.momoRevenue.toLocaleString()} (${momoPercentage}%)`);
      insights.push(``);
    }
    
    // Business Health Recommendations
    insights.push(`🎯 RECOMMENDATIONS`);
    
    if (statsData.expiring >= 5) {
      insights.push(`1. Focus on member retention - ${statsData.expiring} members expiring soon`);
    }
    
    if (statsData.expired > statsData.active * 0.3) {
      insights.push(`2. High expired member count - Consider re-engagement campaigns`);
    }
    
    if (revenueDataValue.totalRevenue > 0 && statsData.active > 0) {
      const revenuePerActiveMember = revenueDataValue.totalRevenue / statsData.active;
      if (revenuePerActiveMember < 150) {
        insights.push(`3. Low revenue per active member (₵${revenuePerActiveMember.toFixed(0)}) - Consider upselling premium plans`);
      }
    }
    
    if (statsData.active < 10) {
      insights.push(`4. Low active member count - Focus on new member acquisition`);
    }
    
    if (statsData.expiring === 0 && statsData.active > 0) {
      insights.push(`5. Great job! No expiring members - Continue maintaining member satisfaction`);
    }
    
    return insights.join('\n');
  };

  const handleAiInsights = () => {
    setIsGenerating(true);
    // Simulate brief processing time for better UX
    setTimeout(() => {
      const summary = generateAnalyticsSummary(stats, revenueData);
      setAiSummary(summary);
      setIsGenerating(false);
    }, 500);
  };

  // Helper to determine staff status
  const getStaffStatus = (email: string) => {
    const today = new Date().toISOString().split('T')[0];
    // Only consider on shift if there's a sign-in time for today and no sign-out time
    const todayRecord = attendanceRecords.find(r => 
      r.staffEmail === email && 
      r.date === today && 
      r.signInTime
    );
    const isCurrentlyOnShift = todayRecord ? !todayRecord.signOutTime : false;
    
    // Find last activity
    const lastActivity = activityLogs.find(log => log.userEmail === email);
    
    return {
      isActive: isCurrentlyOnShift,
      lastAction: lastActivity?.action || 'No recent activity',
      lastSeen: lastActivity ? new Date(lastActivity.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Never'
    };
  };

  // Get pending payments (including pending member registrations)
  const pendingPayments = useMemo(() => {
    return payments.filter(p => p.status === PaymentStatus.PENDING);
  }, [payments]);

  const pendingMemberPayments = useMemo(() => {
    return pendingPayments.filter(p => p.isPendingMember);
  }, [pendingPayments]);

  return (
    <div className="space-y-6">
      {/* Pending Payment Notifications */}
      {pendingPayments.length > 0 && (
        <div className={`rounded-xl border-2 p-3 sm:p-4 ${
          pendingMemberPayments.length > 0
            ? 'bg-amber-50 border-amber-300'
            : 'bg-blue-50 border-blue-300'
        }`}>
          <div className="flex items-start gap-3 sm:gap-4">
            <div className={`p-2 rounded-lg shrink-0 ${
              pendingMemberPayments.length > 0
                ? 'bg-amber-100 text-amber-600'
                : 'bg-blue-100 text-blue-600'
            }`}>
              <Bell size={20} />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-bold text-slate-900 mb-1 flex flex-wrap items-center gap-2 text-sm sm:text-base">
                {pendingMemberPayments.length > 0 ? (
                  <>
                    <UserPlus size={18} />
                    {pendingMemberPayments.length} New Member Registration{pendingMemberPayments.length > 1 ? 's' : ''} Awaiting Payment Confirmation
                  </>
                ) : (
                  <>
                    <CreditCard size={18} />
                    {pendingPayments.length} Payment{pendingPayments.length > 1 ? 's' : ''} Pending Verification
                  </>
                )}
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 mb-2 sm:mb-3">
                {pendingMemberPayments.length > 0
                  ? `New members have submitted payments and are waiting for confirmation. Once confirmed, they will be added to the members list and receive welcome emails.`
                  : `Mobile Money payments are waiting for verification. Please review and confirm them in the Payments section.`
                }
              </p>
              <div className="text-xs text-slate-500 mt-2">
                Go to <strong>Payments</strong> section to review and confirm these payments.
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900">System Overview</h2>
          <p className="text-slate-500 text-xs sm:text-sm">Real-time metrics for Goodlife Fitness management.</p>
        </div>
        <button 
          onClick={handleAiInsights}
          disabled={isGenerating}
          className="flex items-center gap-2 px-4 py-2 bg-rose-600 text-white rounded-lg hover:bg-rose-700 transition-colors disabled:opacity-50 text-sm font-medium shadow-sm w-full sm:w-auto justify-center"
        >
          <TrendingUp size={18} />
          {isGenerating ? 'Analyzing...' : 'Analytics Insights'}
        </button>
      </div>

      {/* Revenue Analytics Section */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 sm:mb-6 gap-4">
            <div>
              <h3 className="text-lg sm:text-xl font-bold text-slate-900 flex items-center gap-2">
                <DollarSign size={20} className="text-rose-600 shrink-0" />
                <span>Revenue Analytics</span>
              </h3>
              <p className="text-xs sm:text-sm text-slate-500 mt-1">Track revenue across different time periods</p>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <button
                onClick={() => setShowCustomRange(!showCustomRange)}
                className="flex items-center gap-2 px-3 py-2 text-sm border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
              >
                <Calendar size={16} />
                Custom Range
              </button>
            </div>
          </div>

          {/* Custom Date Range Picker */}
          {showCustomRange && (
            <div className="mb-4 sm:mb-6 p-3 sm:p-4 bg-slate-50 rounded-lg border border-slate-200">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Start Date</label>
                  <input
                    type="date"
                    value={customDateRange.start}
                    onChange={e => setCustomDateRange({...customDateRange, start: e.target.value})}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-rose-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">End Date</label>
                  <input
                    type="date"
                    value={customDateRange.end}
                    onChange={e => setCustomDateRange({...customDateRange, end: e.target.value})}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-rose-500 outline-none"
                  />
                </div>
              </div>
              {(customDateRange.start || customDateRange.end) && (
                <button
                  onClick={() => {
                    setCustomDateRange({ start: '', end: '' });
                    setShowCustomRange(false);
                  }}
                  className="mt-3 text-xs text-rose-600 hover:text-rose-700 font-medium"
                >
                  Clear custom range
                </button>
              )}
            </div>
          )}

          {/* Period Selector */}
          {!showCustomRange && (
            <div className="flex gap-2 mb-6">
              {(['day', 'week', 'month', 'year'] as const).map((period) => (
                <button
                  key={period}
                  onClick={() => setRevenuePeriod(period)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    revenuePeriod === period
                      ? 'bg-rose-600 text-white shadow-sm'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  {period.charAt(0).toUpperCase() + period.slice(1)}
                </button>
              ))}
            </div>
          )}

          {/* Revenue Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 mb-4 sm:mb-6">
            <div className="bg-gradient-to-br from-rose-50 to-rose-100 p-4 rounded-xl border border-rose-200">
              <p className="text-xs font-semibold text-rose-700 uppercase tracking-wider mb-1">Total Revenue</p>
              <p className="text-2xl font-bold text-rose-900">₵{revenueData.totalRevenue.toLocaleString()}</p>
              <p className="text-xs text-rose-600 mt-1">{revenueData.periodLabel}</p>
            </div>
            <div className="bg-blue-50 p-4 rounded-xl border border-blue-200">
              <p className="text-xs font-semibold text-blue-700 uppercase tracking-wider mb-1">Cash Payments</p>
              <p className="text-2xl font-bold text-blue-900">₵{revenueData.cashRevenue.toLocaleString()}</p>
              <p className="text-xs text-blue-600 mt-1">
                {revenueData.totalRevenue > 0 
                  ? `${((revenueData.cashRevenue / revenueData.totalRevenue) * 100).toFixed(1)}%`
                  : '0%'} of total
              </p>
            </div>
            <div className="bg-emerald-50 p-4 rounded-xl border border-emerald-200">
              <p className="text-xs font-semibold text-emerald-700 uppercase tracking-wider mb-1">Mobile Money</p>
              <p className="text-2xl font-bold text-emerald-900">₵{revenueData.momoRevenue.toLocaleString()}</p>
              <p className="text-xs text-emerald-600 mt-1">
                {revenueData.totalRevenue > 0 
                  ? `${((revenueData.momoRevenue / revenueData.totalRevenue) * 100).toFixed(1)}%`
                  : '0%'} of total
              </p>
            </div>
            <div className="bg-amber-50 p-4 rounded-xl border border-amber-200">
              <p className="text-xs font-semibold text-amber-700 uppercase tracking-wider mb-1">Transactions</p>
              <p className="text-2xl font-bold text-amber-900">{revenueData.transactionCount}</p>
              <p className="text-xs text-amber-600 mt-1">
                {revenueData.transactionCount > 0 
                  ? `₵${(revenueData.totalRevenue / revenueData.transactionCount).toFixed(0)} avg`
                  : 'No transactions'}
              </p>
            </div>
          </div>

          {/* Revenue Chart */}
          {revenueData.chartData.length > 0 ? (
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
              <h4 className="text-sm font-bold text-slate-700 mb-4">Daily Revenue Breakdown</h4>
              <div className="h-[200px] w-full" style={{ minWidth: 0, minHeight: 200, width: '100%' }}>
                <ResponsiveContainer width="100%" height={200} minWidth={0}>
                  <LineChart data={revenueData.chartData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                    <XAxis 
                      dataKey="date" 
                      axisLine={false} 
                      tickLine={false}
                      tick={{ fontSize: 11, fill: '#64748b' }}
                    />
                    <YAxis 
                      axisLine={false} 
                      tickLine={false}
                      tick={{ fontSize: 11, fill: '#64748b' }}
                      tickFormatter={(value) => `₵${(value / 1000).toFixed(0)}k`}
                    />
                    <Tooltip 
                      contentStyle={{ 
                        borderRadius: '8px', 
                        border: 'none', 
                        boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                        backgroundColor: 'white'
                      }}
                      formatter={(value: number) => [`₵${value.toLocaleString()}`, 'Revenue']}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="amount" 
                      stroke="#e11d48" 
                      strokeWidth={2}
                      dot={{ fill: '#e11d48', r: 4 }}
                      activeDot={{ r: 6 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          ) : (
            <div className="bg-slate-50 p-8 rounded-xl border border-slate-200 text-center">
              <CreditCard size={48} className="mx-auto text-slate-400 mb-3" />
              <p className="text-slate-500 text-sm">No revenue data for the selected period</p>
            </div>
          )}
        </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard 
          title="Active Members" 
          value={stats.active} 
          icon={<CheckCircle2 className="text-emerald-500" />} 
          trend="+12% this month"
          bgColor="bg-emerald-50"
        />
        <StatCard 
          title="Total Revenue" 
          value={`₵${stats.revenue.toLocaleString()}`} 
          icon={<TrendingUp className="text-blue-500" />} 
          trend="Steady growth"
          bgColor="bg-blue-50"
        />
        <StatCard 
          title="Expiring Soon" 
          value={stats.expiring} 
          icon={<AlertCircle className="text-amber-500" />} 
          trend="Needs attention"
          bgColor="bg-amber-50"
        />
        <StatCard 
          title="Total Registered" 
          value={stats.total} 
          icon={<Users className="text-rose-500" />} 
          trend="Total base"
          bgColor="bg-rose-50"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Chart */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white p-4 sm:p-6 rounded-xl shadow-sm border border-slate-200">
            <h3 className="font-bold text-slate-800 mb-4 sm:mb-6 flex items-center gap-2 text-sm sm:text-base">
              <TrendingUp size={18} className="text-slate-400 shrink-0" />
              <span>Member Distribution</span>
            </h3>
            <div className="h-[200px] sm:h-[250px] w-full overflow-x-auto" style={{ minWidth: 0, minHeight: 200, width: '100%' }}>
              <ResponsiveContainer width="100%" height={250} minWidth={0}>
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} />
                  <YAxis axisLine={false} tickLine={false} />
                  <Tooltip 
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                    cursor={{ fill: '#f1f5f9' }}
                  />
                  <Bar dataKey="value" fill="#e11d48" radius={[4, 4, 0, 0]} barSize={60} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* New Super Admin Feature: Team Presence Monitoring */}
          {role === UserRole.SUPER_ADMIN && (
            <div className="bg-white p-4 sm:p-6 rounded-xl shadow-sm border border-slate-200">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 sm:mb-6 gap-2">
                <h3 className="font-bold text-slate-800 flex items-center gap-2 text-sm sm:text-base">
                  <Activity size={18} className="text-rose-500 shrink-0" />
                  <span>Team Presence & Monitoring</span>
                </h3>
                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 bg-slate-50 px-2 py-1 rounded">
                  Live Status
                </span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                {staff
                  .filter(employee => 
                    employee.email !== 'kojo@goodlife.com' && 
                    employee.email !== 'admin@goodlife.com' &&
                    employee.email !== 'staff@goodlife.com'
                  )
                  .map((employee) => {
                  const status = getStaffStatus(employee.email);
                  return (
                    <div key={employee.id} className="p-3 sm:p-4 rounded-xl border border-slate-100 bg-slate-50/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 group hover:border-rose-200 transition-colors">
                      <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
                        <div className="relative shrink-0">
                          <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center font-bold text-xs ${status.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-500'}`}>
                            {employee.fullName.split(' ').map(n => n[0]).join('')}
                          </div>
                          {status.isActive && (
                            <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 sm:w-3.5 sm:h-3.5 bg-emerald-500 border-2 border-white rounded-full animate-pulse"></div>
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-xs sm:text-sm font-bold text-slate-900 truncate">{employee.fullName}</p>
                          <p className="text-[10px] text-slate-500 truncate">{employee.position}</p>
                        </div>
                      </div>
                      <div className="text-left sm:text-right w-full sm:w-auto">
                        <div className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full inline-block ${status.isActive ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-400'}`}>
                          {status.isActive ? 'On Shift' : 'Inactive'}
                        </div>
                        <p className="text-[9px] text-slate-400 mt-1 flex items-center gap-1">
                          <Clock size={10} className="shrink-0" />
                          <span className="truncate">{status.isActive ? 'Active since ' + status.lastSeen : 'Last seen ' + status.lastSeen}</span>
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* AI Insight Sidebar */}
        <div className="bg-slate-900 text-white p-4 sm:p-6 rounded-xl shadow-lg relative overflow-hidden h-fit">
          <div className="relative z-10 h-full flex flex-col">
            <div className="flex items-center gap-2 mb-3 sm:mb-4 text-rose-400">
              <TrendingUp size={20} className="shrink-0" />
              <h3 className="font-bold uppercase tracking-wider text-xs">Business Analytics</h3>
            </div>
            <div className="flex-1">
              {aiSummary ? (
                <div className="text-slate-300 text-sm leading-relaxed whitespace-pre-wrap">
                  {aiSummary}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-center space-y-4 py-12">
                  <TrendingUp size={48} className="text-slate-700 mb-4" />
                  <p className="text-slate-500 text-sm">Click 'Analytics Insights' to generate a business health report.</p>
                </div>
              )}
            </div>
            {aiSummary && (
              <button 
                onClick={() => setAiSummary('')}
                className="mt-6 text-xs text-slate-500 hover:text-white transition-colors"
              >
                Clear Summary
              </button>
            )}
          </div>
          {/* Background decoration */}
          <div className="absolute -bottom-12 -right-12 w-48 h-48 bg-rose-500/10 rounded-full blur-3xl"></div>
        </div>
      </div>
    </div>
  );
};

const StatCard: React.FC<{ title: string; value: string | number; icon: React.ReactNode; trend: string; bgColor: string }> = ({ title, value, icon, trend, bgColor }) => (
  <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex items-start justify-between">
    <div>
      <p className="text-slate-500 text-xs font-semibold uppercase tracking-wider mb-1">{title}</p>
      <h3 className="text-2xl font-bold text-slate-900">{value}</h3>
      <p className="text-slate-400 text-[10px] mt-1 font-medium italic">{trend}</p>
    </div>
    <div className={`p-3 rounded-xl ${bgColor}`}>
      {icon}
    </div>
  </div>
);

export default AdminDashboard;
