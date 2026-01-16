import React, { useState, useMemo } from 'react';
import { Member, SubscriptionPlan, PaymentMethod, PaymentStatus, UserRole, PaymentRecord } from '../types';
import { RefreshCw, X, Calendar, CreditCard, User, Phone, Mail, AlertCircle } from 'lucide-react';
import { membersService, paymentsService } from '../lib/database';
import { useToast } from '../contexts/ToastContext';
import { calculateExpiryDate } from '../lib/dateUtils';
import { sendPaymentEmail } from '../lib/emailService';

interface ExpiredMembersRenewalProps {
  members: Member[];
  setMembers: React.Dispatch<React.SetStateAction<Member[]>>;
  setPayments: React.Dispatch<React.SetStateAction<PaymentRecord[]>>;
  role: UserRole;
  staffEmail: string;
  logActivity: (action: string, details: string, category: 'access' | 'admin' | 'financial') => void;
}

interface RenewalForm {
  plan: SubscriptionPlan;
  paymentMethod: PaymentMethod;
  amount: number;
  transactionId?: string;
  momoPhone?: string;
  network?: string;
}

const ExpiredMembersRenewal: React.FC<ExpiredMembersRenewalProps> = ({
  members,
  setMembers,
  setPayments,
  role,
  staffEmail,
  logActivity
}) => {
  const { showSuccess, showError } = useToast();
  const [showRenewalModal, setShowRenewalModal] = useState(false);
  const [renewingMember, setRenewingMember] = useState<Member | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [renewalForm, setRenewalForm] = useState<RenewalForm>({
    plan: SubscriptionPlan.MONTHLY,
    paymentMethod: PaymentMethod.CASH,
    amount: 0
  });

  // Get expired members
  const expiredMembers = useMemo(() => {
    return members.filter(m => m.status === 'expired').sort((a, b) => 
      new Date(b.expiryDate).getTime() - new Date(a.expiryDate).getTime()
    );
  }, [members]);

  // Handle plan selection - auto-calculate amount
  const handlePlanChange = (planValue: string) => {
    const plan = planValue as SubscriptionPlan;
    let amount = 0;
    switch (plan) {
      case SubscriptionPlan.MONTHLY:
        amount = 150;
        break;
      case SubscriptionPlan.TWO_WEEKS:
        amount = 90;
        break;
      case SubscriptionPlan.ONE_WEEK:
        amount = 50;
        break;
      case SubscriptionPlan.DAY_MORNING:
      case SubscriptionPlan.DAY_EVENING:
        amount = 10;
        break;
      default:
        amount = 0;
    }
    setRenewalForm({ ...renewalForm, plan, amount });
  };

  // Open renewal modal
  const handleRenewClick = (member: Member) => {
    setRenewingMember(member);
    
    // Calculate initial amount based on member's plan
    let initialAmount = 0;
    switch (member.plan) {
      case SubscriptionPlan.MONTHLY:
        initialAmount = 150;
        break;
      case SubscriptionPlan.TWO_WEEKS:
        initialAmount = 90;
        break;
      case SubscriptionPlan.ONE_WEEK:
        initialAmount = 50;
        break;
      case SubscriptionPlan.DAY_MORNING:
      case SubscriptionPlan.DAY_EVENING:
        initialAmount = 10;
        break;
    }
    
    setRenewalForm({
      plan: member.plan, // Default to their previous plan
      paymentMethod: PaymentMethod.CASH,
      amount: initialAmount
    });
    setShowRenewalModal(true);
  };

  // Process renewal
  const handleProcessRenewal = async () => {
    if (!renewingMember) return;

    if (!renewalForm.plan || renewalForm.amount <= 0) {
      showError('Please select a plan and enter a valid amount');
      return;
    }

    if (renewalForm.paymentMethod === PaymentMethod.MOMO && !renewalForm.momoPhone) {
      showError('Please enter Mobile Money phone number');
      return;
    }

    setIsProcessing(true);

    try {
      const today = new Date().toISOString().split('T')[0];
      const newExpiryDate = calculateExpiryDate(renewalForm.plan, today);

      // Update member with new plan and dates
      const updatedMember: Member = {
        ...renewingMember,
        plan: renewalForm.plan,
        startDate: today,
        expiryDate: newExpiryDate,
        status: 'active' // Reactivate the member
      };

      await membersService.update(renewingMember.id, updatedMember);

      // Create payment record
      const paymentRecord: Omit<PaymentRecord, 'id'> = {
        memberId: renewingMember.id,
        memberName: renewingMember.fullName,
        amount: renewalForm.amount,
        date: today,
        method: renewalForm.paymentMethod,
        status: PaymentStatus.CONFIRMED,
        confirmedBy: staffEmail,
        transactionId: renewalForm.transactionId,
        momoPhone: renewalForm.momoPhone,
        network: renewalForm.network,
        isPendingMember: false
      };

      const newPayment = await paymentsService.create(paymentRecord);

      // Update local state
      setMembers(prevMembers =>
        prevMembers.map(m => m.id === renewingMember.id ? updatedMember : m)
      );
      setPayments(prevPayments => [newPayment, ...prevPayments]);

      // Log activity
      logActivity(
        'Member Renewed',
        `Renewed ${renewingMember.fullName}'s subscription (${renewalForm.plan}) - Payment: ₵${renewalForm.amount}`,
        'financial'
      );

      // Send confirmation email/SMS
      try {
        await sendPaymentEmail({
          memberName: renewingMember.fullName,
          memberEmail: renewingMember.email,
          memberPhone: renewingMember.phone,
          amount: renewalForm.amount,
          paymentMethod: renewalForm.paymentMethod,
          paymentDate: today,
          transactionId: renewalForm.transactionId,
          expiryDate: newExpiryDate
        });
      } catch (emailError) {
        console.warn('Failed to send renewal confirmation email:', emailError);
        // Don't fail the whole operation if email fails
      }

      showSuccess(`${renewingMember.fullName} successfully renewed! New expiry: ${new Date(newExpiryDate).toLocaleDateString()}`);
      setShowRenewalModal(false);
      setRenewingMember(null);
    } catch (error) {
      console.error('Error processing renewal:', error);
      showError('Failed to process renewal. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCloseModal = () => {
    if (!isProcessing) {
      setShowRenewalModal(false);
      setRenewingMember(null);
    }
  };

  if (expiredMembers.length === 0) {
    return null; // Don't show section if no expired members
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 sm:p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <RefreshCw size={20} className="text-amber-600" />
            Expired Members - Quick Renewal
          </h3>
          <p className="text-sm text-slate-500 mt-1">
            {expiredMembers.length} member{expiredMembers.length > 1 ? 's' : ''} with expired subscription{expiredMembers.length > 1 ? 's' : ''}
          </p>
        </div>
        <div className="bg-amber-100 text-amber-700 px-3 py-1 rounded-full text-xs font-bold">
          {expiredMembers.length} Expired
        </div>
      </div>

      <div className="space-y-3 max-h-96 overflow-y-auto">
        {expiredMembers.map((member) => (
          <div
            key={member.id}
            className="flex items-center justify-between p-4 bg-amber-50 border border-amber-200 rounded-lg hover:border-amber-300 transition-colors"
          >
            <div className="flex items-center gap-3 flex-1 min-w-0">
              {member.photo ? (
                <img
                  src={member.photo}
                  alt={member.fullName}
                  className="w-10 h-10 rounded-full object-cover border-2 border-amber-200"
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-amber-200 flex items-center justify-center text-amber-700 font-bold">
                  {member.fullName.split(' ').map(n => n[0]).join('')}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-slate-900 truncate">{member.fullName}</p>
                <p className="text-xs text-slate-500 truncate">{member.email}</p>
                <p className="text-xs text-amber-600 mt-1">
                  Expired: {new Date(member.expiryDate).toLocaleDateString()} ({member.plan})
                </p>
              </div>
            </div>
            <button
              onClick={() => handleRenewClick(member)}
              className="ml-4 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors flex items-center gap-2 text-sm font-medium whitespace-nowrap"
            >
              <RefreshCw size={16} />
              Renew
            </button>
          </div>
        ))}
      </div>

      {/* Renewal Modal */}
      {showRenewalModal && renewingMember && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-slate-200 px-6 py-4 flex justify-between items-center">
              <div>
                <h2 className="text-xl font-bold text-slate-900">Renew Membership</h2>
                <p className="text-sm text-slate-500 mt-1">Process renewal for {renewingMember.fullName}</p>
              </div>
              <button
                onClick={handleCloseModal}
                disabled={isProcessing}
                className="p-2 hover:bg-slate-100 rounded-lg transition-colors disabled:opacity-50"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Member Info */}
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                <div className="flex items-center gap-3 mb-3">
                  {renewingMember.photo ? (
                    <img
                      src={renewingMember.photo}
                      alt={renewingMember.fullName}
                      className="w-16 h-16 rounded-full object-cover border-2 border-amber-300"
                    />
                  ) : (
                    <div className="w-16 h-16 rounded-full bg-amber-200 flex items-center justify-center text-amber-700 font-bold text-xl">
                      {renewingMember.fullName.split(' ').map(n => n[0]).join('')}
                    </div>
                  )}
                  <div>
                    <h3 className="font-bold text-slate-900">{renewingMember.fullName}</h3>
                    <p className="text-sm text-slate-600 flex items-center gap-2 mt-1">
                      <Mail size={14} />
                      {renewingMember.email}
                    </p>
                    <p className="text-sm text-slate-600 flex items-center gap-2 mt-1">
                      <Phone size={14} />
                      {renewingMember.phone}
                    </p>
                  </div>
                </div>
                <div className="pt-3 border-t border-amber-200">
                  <p className="text-xs text-amber-700">
                    <strong>Previous Plan:</strong> {renewingMember.plan}
                  </p>
                  <p className="text-xs text-amber-700 mt-1">
                    <strong>Expired On:</strong> {new Date(renewingMember.expiryDate).toLocaleDateString()}
                  </p>
                </div>
              </div>

              {/* Plan Selection */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  <Calendar size={16} className="inline mr-2" />
                  New Subscription Plan
                </label>
                <select
                  value={renewalForm.plan}
                  onChange={(e) => handlePlanChange(e.target.value)}
                  disabled={isProcessing}
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none disabled:bg-slate-100"
                >
                  <option value={SubscriptionPlan.MONTHLY}>Monthly - ₵150</option>
                  <option value={SubscriptionPlan.TWO_WEEKS}>2 Weeks - ₵90</option>
                  <option value={SubscriptionPlan.ONE_WEEK}>1 Week - ₵50</option>
                  <option value={SubscriptionPlan.DAY_MORNING}>Day Morning - ₵10</option>
                  <option value={SubscriptionPlan.DAY_EVENING}>Day Evening - ₵10</option>
                </select>
              </div>

              {/* Payment Method */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  <CreditCard size={16} className="inline mr-2" />
                  Payment Method
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setRenewalForm({ ...renewalForm, paymentMethod: PaymentMethod.CASH })}
                    disabled={isProcessing}
                    className={`px-4 py-3 rounded-lg border-2 font-medium transition-colors ${
                      renewalForm.paymentMethod === PaymentMethod.CASH
                        ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                        : 'border-slate-200 hover:border-slate-300'
                    } disabled:opacity-50`}
                  >
                    Cash
                  </button>
                  <button
                    type="button"
                    onClick={() => setRenewalForm({ ...renewalForm, paymentMethod: PaymentMethod.MOMO })}
                    disabled={isProcessing}
                    className={`px-4 py-3 rounded-lg border-2 font-medium transition-colors ${
                      renewalForm.paymentMethod === PaymentMethod.MOMO
                        ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                        : 'border-slate-200 hover:border-slate-300'
                    } disabled:opacity-50`}
                  >
                    Mobile Money
                  </button>
                </div>
              </div>

              {/* Mobile Money Details */}
              {renewalForm.paymentMethod === PaymentMethod.MOMO && (
                <div className="space-y-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Mobile Money Phone Number <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="tel"
                      value={renewalForm.momoPhone || ''}
                      onChange={(e) => setRenewalForm({ ...renewalForm, momoPhone: e.target.value })}
                      disabled={isProcessing}
                      placeholder="e.g., 0244123456"
                      className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none disabled:bg-slate-100"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Network</label>
                    <select
                      value={renewalForm.network || ''}
                      onChange={(e) => setRenewalForm({ ...renewalForm, network: e.target.value })}
                      disabled={isProcessing}
                      className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none disabled:bg-slate-100"
                    >
                      <option value="">Select Network</option>
                      <option value="MTN">MTN</option>
                      <option value="Vodafone">Vodafone</option>
                      <option value="AirtelTigo">AirtelTigo</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Transaction ID</label>
                    <input
                      type="text"
                      value={renewalForm.transactionId || ''}
                      onChange={(e) => setRenewalForm({ ...renewalForm, transactionId: e.target.value })}
                      disabled={isProcessing}
                      placeholder="Optional"
                      className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none disabled:bg-slate-100"
                    />
                  </div>
                </div>
              )}

              {/* Amount */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Amount (GHS)
                </label>
                <input
                  type="number"
                  value={renewalForm.amount}
                  onChange={(e) => setRenewalForm({ ...renewalForm, amount: parseFloat(e.target.value) || 0 })}
                  disabled={isProcessing}
                  min="0"
                  step="0.01"
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none disabled:bg-slate-100 text-lg font-semibold"
                />
              </div>

              {/* Summary */}
              <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4">
                <p className="text-sm font-semibold text-emerald-900 mb-2">Renewal Summary</p>
                <div className="space-y-1 text-sm text-emerald-700">
                  <p><strong>New Plan:</strong> {renewalForm.plan}</p>
                  <p><strong>Start Date:</strong> {new Date().toLocaleDateString()}</p>
                  <p><strong>New Expiry:</strong> {(() => {
                    const today = new Date().toISOString().split('T')[0];
                    const expiryDate = calculateExpiryDate(renewalForm.plan, today);
                    return new Date(expiryDate).toLocaleDateString();
                  })()}</p>
                  <p><strong>Amount:</strong> ₵{renewalForm.amount.toFixed(2)}</p>
                  <p><strong>Payment Method:</strong> {renewalForm.paymentMethod}</p>
                </div>
              </div>
            </div>

            {/* Footer Actions */}
            <div className="sticky bottom-0 bg-slate-50 border-t border-slate-200 px-6 py-4 flex justify-end gap-3">
              <button
                onClick={handleCloseModal}
                disabled={isProcessing}
                className="px-6 py-2 border border-slate-300 rounded-lg hover:bg-slate-100 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleProcessRenewal}
                disabled={isProcessing}
                className="px-6 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors flex items-center gap-2 disabled:opacity-50"
              >
                {isProcessing ? (
                  <>
                    <RefreshCw size={16} className="animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <RefreshCw size={16} />
                    Process Renewal
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ExpiredMembersRenewal;
