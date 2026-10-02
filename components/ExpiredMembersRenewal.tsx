import React, { useState, useMemo } from 'react';
import { Member, SubscriptionPlan, UserRole, PaymentRecord } from '../types';
import { RefreshCw, X, Search } from 'lucide-react';
import {
  calculateMemberStatus,
  formatExpiryDate,
  getLocalDateString,
  parseLocalDate
} from '../lib/dateUtils';
import RenewalModal from './RenewalModal';

interface ExpiredMembersRenewalProps {
  members: Member[];
  setMembers: React.Dispatch<React.SetStateAction<Member[]>>;
  setPayments: React.Dispatch<React.SetStateAction<PaymentRecord[]>>;
  role: UserRole;
  staffEmail: string;
  logActivity: (action: string, details: string, category: 'access' | 'admin' | 'financial') => void;
}

const ExpiredMembersRenewal: React.FC<ExpiredMembersRenewalProps> = ({
  members,
  setMembers,
  setPayments,
  role,
  staffEmail,
  logActivity
}) => {
  const [expiredSearchTerm, setExpiredSearchTerm] = useState('');
  const [renewingMember, setRenewingMember] = useState<Member | null>(null);

  const today = getLocalDateString();

  // Get expired members - status is recalculated so members due today appear without a reload
  const expiredMembers = useMemo(() => {
    return members.filter(m => calculateMemberStatus(m.expiryDate, m.plan) === 'expired').sort((a, b) => 
      new Date(b.expiryDate).getTime() - new Date(a.expiryDate).getTime()
    );
  }, [members]);

  // Filter expired members by search
  const filteredExpiredMembers = useMemo(() => {
    if (!expiredSearchTerm.trim()) return expiredMembers;
    const term = expiredSearchTerm.toLowerCase().trim();
    return expiredMembers.filter(m =>
      m.fullName.toLowerCase().includes(term) ||
      (m.email && m.email.toLowerCase().includes(term)) ||
      (m.phone && m.phone.includes(term))
    );
  }, [expiredMembers, expiredSearchTerm]);

  // Always show the page, even if no expired members (shows empty state)
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 flex items-center gap-2">
            <RefreshCw size={24} className="text-rose-600" />
            Expired Members - Quick Renewal
          </h2>
          <p className="text-slate-500 text-xs sm:text-sm mt-1">
            {expiredMembers.length > 0 
              ? `${expiredMembers.length} member${expiredMembers.length > 1 ? 's' : ''} with expired subscription${expiredMembers.length > 1 ? 's' : ''}`
              : 'All memberships are active'
            }
          </p>
        </div>
        {expiredMembers.length > 0 && (
          <div className="bg-rose-100 text-rose-700 px-4 py-2 rounded-full text-sm font-bold animate-pulse">
            {expiredMembers.length} Expired
          </div>
        )}
      </div>

      {/* Main Content Card */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 sm:p-6">

        {expiredMembers.length === 0 ? (
          <div className="text-center py-12">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-emerald-100 mb-4">
              <RefreshCw size={40} className="text-emerald-600" />
            </div>
            <p className="text-lg text-slate-700 font-semibold mb-2">All Memberships Are Active! 🎉</p>
            <p className="text-sm text-slate-500">No renewals needed at this time.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Search bar for expired members */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input
                type="text"
                placeholder="Search by name, email, or phone..."
                value={expiredSearchTerm}
                onChange={e => setExpiredSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-rose-500 text-sm"
              />
              {expiredSearchTerm && (
                <button
                  type="button"
                  onClick={() => setExpiredSearchTerm('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <X size={16} />
                </button>
              )}
            </div>
            {filteredExpiredMembers.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-slate-500">No expired members match &quot;{expiredSearchTerm}&quot;</p>
                <button
                  type="button"
                  onClick={() => setExpiredSearchTerm('')}
                  className="mt-2 text-sm text-rose-600 hover:underline"
                >
                  Clear search
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredExpiredMembers.map((member) => (
              <div
                key={member.id}
                className="flex items-center justify-between p-4 bg-amber-50 border border-amber-200 rounded-lg hover:border-amber-300 hover:shadow-md transition-all"
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  {member.photo ? (
                    <img
                      src={member.photo}
                      alt={member.fullName}
                      className="w-12 h-12 rounded-full object-cover border-2 border-amber-200 shrink-0"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-amber-200 flex items-center justify-center text-amber-700 font-bold shrink-0">
                      {member.fullName.split(' ').map(n => n[0]).join('')}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-slate-900 truncate">{member.fullName}</p>
                    <p className="text-xs text-slate-500 truncate">{member.email || '-'}</p>
                    <p className="text-xs text-slate-500 truncate">{member.phone || '-'}</p>
                    <p className="text-xs text-slate-600 mt-1">
                      Registered: {parseLocalDate(member.startDate).toLocaleDateString()}
                    </p>
                    <p className="text-xs text-amber-600 font-medium">
                      {member.expiryDate?.split('T')[0] === today
                        ? `Expires today - due for renewal (${member.plan})`
                        : `Expired: ${member.plan === SubscriptionPlan.FREE ? 'Never' : formatExpiryDate(member.expiryDate)} (${member.plan})`}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setRenewingMember(member)}
                  className="ml-4 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors flex items-center gap-2 text-sm font-medium whitespace-nowrap shrink-0"
                >
                  <RefreshCw size={16} />
                  Renew
                </button>
              </div>
            ))}
              </div>
            )}
          </div>
        )}
      </div>

      {renewingMember && (
        <RenewalModal
          member={renewingMember}
          setMembers={setMembers}
          setPayments={setPayments}
          role={role}
          staffEmail={staffEmail}
          logActivity={logActivity}
          onClose={() => setRenewingMember(null)}
        />
      )}
    </div>
  );
};

export default ExpiredMembersRenewal;
