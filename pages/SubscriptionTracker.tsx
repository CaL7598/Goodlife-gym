
import React, { useMemo } from 'react';
import { Member, UserRole } from '../types';
import { Clock, CheckCircle, XCircle, RefreshCw } from 'lucide-react';
import { useToast } from '../contexts/ToastContext';
import { calculateExpiryDate } from '../lib/dateUtils';

const SubscriptionTracker: React.FC<{ members: Member[]; setMembers: any; role: UserRole; logActivity: (action: string, details: string, category: 'access' | 'admin' | 'financial') => void }> = ({ members, setMembers, role, logActivity }) => {
  const { showSuccess } = useToast();
  
  const sortedMembers = useMemo(() => {
    return [...members].sort((a, b) => {
      const statusOrder = { 'expired': 0, 'expiring': 1, 'active': 2 };
      return statusOrder[a.status] - statusOrder[b.status];
    });
  }, [members]);

  const handleRenew = (id: string) => {
    const member = members.find(m => m.id === id);
    if (!member) return;
    
    const now = new Date();
    // Get start date in local timezone to avoid UTC conversion issues
    const startDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    const expiryDate = calculateExpiryDate(member.plan, startDate);

    setMembers(members.map(m => m.id === id ? {
      ...m,
      status: 'active',
      startDate,
      expiryDate
    } : m));

    logActivity('Manual Renewal', `Extended subscription for ${member.fullName} until ${expiryDate}`, 'admin');
    showSuccess(`Subscription renewed successfully for ${member.fullName}!`);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Subscription Health</h2>
          <p className="text-slate-500 text-sm">Monitor member lifecycle and renewals.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <SummaryCard label="Needs Renewal" count={members.filter(m => m.status === 'expired').length} color="bg-rose-50 text-rose-600" icon={<XCircle />} />
        <SummaryCard label="Expiring Soon" count={members.filter(m => m.status === 'expiring').length} color="bg-amber-50 text-amber-600" icon={<Clock />} />
        <SummaryCard label="Healthy Status" count={members.filter(m => m.status === 'active').length} color="bg-emerald-50 text-emerald-600" icon={<CheckCircle />} />
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50 text-[10px] font-bold uppercase tracking-widest text-slate-500 border-b border-slate-200">
                <th className="px-6 py-4">Member</th>
                <th className="px-6 py-4">Plan</th>
                <th className="px-6 py-4">Expiry Date</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Intervention</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {sortedMembers.map(member => (
                <tr key={member.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="text-sm font-bold text-slate-900">{member.fullName}</div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-xs text-slate-500">{member.plan}</span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-slate-600">{member.expiryDate}</div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                      member.status === 'active' ? 'bg-emerald-100 text-emerald-700' :
                      member.status === 'expiring' ? 'bg-amber-100 text-amber-700' : 'bg-rose-100 text-rose-700'
                    }`}>
                      {member.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    {member.status !== 'active' ? (
                      <button 
                        onClick={() => handleRenew(member.id)}
                        className="text-xs font-bold text-rose-600 hover:text-rose-700 flex items-center gap-1 justify-end ml-auto"
                      >
                        <RefreshCw size={12} />
                        Process Renewal
                      </button>
                    ) : (
                      <span className="text-[10px] text-slate-400">All set</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

const SummaryCard = ({ label, count, color, icon }: any) => (
  <div className={`p-6 rounded-xl border border-slate-200 flex items-center justify-between ${color}`}>
    <div>
      <p className="text-xs font-bold uppercase tracking-widest opacity-70 mb-1">{label}</p>
      <h3 className="text-3xl font-extrabold">{count}</h3>
    </div>
    <div className="p-3 bg-white/50 rounded-lg">
      {React.cloneElement(icon, { size: 24 })}
    </div>
  </div>
);

export default SubscriptionTracker;
