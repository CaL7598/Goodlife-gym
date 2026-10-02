import React, { useState } from 'react';
import { Member, SubscriptionPlan, PaymentMethod, PaymentStatus, UserRole, PaymentRecord } from '../types';
import { RefreshCw, X, Calendar, CreditCard, Phone, Mail } from 'lucide-react';
import { membersService, paymentsService } from '../lib/database';
import { useToast } from '../contexts/ToastContext';
import {
  calculateExpiryDate,
  calculateMemberStatus,
  formatExpiryDate,
  getLocalDateString,
  parseLocalDate
} from '../lib/dateUtils';
import { sendPaymentEmail } from '../lib/emailService';
import { sendPaymentSMS } from '../lib/smsService';

const NEVER_EXPIRES = '9999-12-31';

const RENEWAL_PLANS: SubscriptionPlan[] = [
  SubscriptionPlan.MONTHLY,
  SubscriptionPlan.TWO_WEEKS,
  SubscriptionPlan.ONE_WEEK,
  SubscriptionPlan.DAY_MORNING,
  SubscriptionPlan.DAY_EVENING,
  SubscriptionPlan.FREE
];

/** Default renewal amount for a plan (staff can still adjust it) */
const getRenewalAmount = (plan: SubscriptionPlan): number => {
  switch (plan) {
    case SubscriptionPlan.MONTHLY:
      return 140;
    case SubscriptionPlan.TWO_WEEKS:
      return 90;
    case SubscriptionPlan.ONE_WEEK:
      return 50;
    case SubscriptionPlan.DAY_MORNING:
    case SubscriptionPlan.DAY_EVENING:
      return 10;
    default:
      return 0;
  }
};

interface RenewalModalProps {
  member: Member;
  setMembers: React.Dispatch<React.SetStateAction<Member[]>>;
  setPayments: React.Dispatch<React.SetStateAction<PaymentRecord[]>>;
  role: UserRole;
  staffEmail: string;
  logActivity: (action: string, details: string, category: 'access' | 'admin' | 'financial') => void;
  onClose: () => void;
}

interface RenewalForm {
  plan: SubscriptionPlan;
  paymentMethod: PaymentMethod;
  amount: number;
  transactionId?: string;
  momoPhone?: string;
  network?: string;
}

/**
 * Renews a membership: saves the new plan and dates, records a confirmed payment,
 * and sends SMS/email confirmations. Used by Expired Members and Subscriptions.
 */
const RenewalModal: React.FC<RenewalModalProps> = ({
  member,
  setMembers,
  setPayments,
  role,
  staffEmail,
  logActivity,
  onClose
}) => {
  const { showSuccess, showError } = useToast();
  const [isProcessing, setIsProcessing] = useState(false);
  const [renewalForm, setRenewalForm] = useState<RenewalForm>(() => {
    // Default to their previous plan
    const plan = RENEWAL_PLANS.includes(member.plan) ? member.plan : SubscriptionPlan.MONTHLY;
    return { plan, paymentMethod: PaymentMethod.CASH, amount: getRenewalAmount(plan) };
  });

  const today = getLocalDateString();
  const isStillActive = calculateMemberStatus(member.expiryDate, member.plan) !== 'expired';

  // Handle plan selection - auto-calculate amount
  const handlePlanChange = (planValue: string) => {
    const plan = planValue as SubscriptionPlan;
    setRenewalForm({ ...renewalForm, plan, amount: getRenewalAmount(plan) });
  };

  // Process renewal
  const handleProcessRenewal = async () => {
    if (!renewalForm.plan) {
      showError('Please select a plan');
      return;
    }
    // Allow amount 0 only for Free plan
    if (renewalForm.amount < 0 || (renewalForm.amount === 0 && renewalForm.plan !== SubscriptionPlan.FREE)) {
      showError('Please enter a valid amount');
      return;
    }

    if (renewalForm.paymentMethod === PaymentMethod.MOMO && !renewalForm.momoPhone) {
      showError('Please enter Mobile Money phone number');
      return;
    }

    setIsProcessing(true);

    try {
      // The new period starts on the payment date and includes it
      // (e.g. paid 2 Oct → expires 1 Nov, and is renewed again on 2 Nov)
      const newExpiryDate = calculateExpiryDate(renewalForm.plan, today) || NEVER_EXPIRES;

      // Update member with new plan and dates
      const updatedMember: Member = {
        ...member,
        plan: renewalForm.plan,
        startDate: today,
        expiryDate: newExpiryDate,
        status: calculateMemberStatus(newExpiryDate, renewalForm.plan) // Reactivate the member
      };

      await membersService.update(member.id, updatedMember);

      // Create payment record
      const paymentRecord: Omit<PaymentRecord, 'id'> = {
        memberId: member.id,
        memberName: member.fullName,
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
        prevMembers.map(m => m.id === member.id ? updatedMember : m)
      );
      setPayments(prevPayments => [newPayment, ...prevPayments]);

      // Log activity
      logActivity(
        'Member Renewed',
        `Renewed ${member.fullName}'s subscription (${renewalForm.plan}) - Payment: ₵${renewalForm.amount}`,
        'financial'
      );

      // Send payment confirmation SMS (phone is on the member record)
      if (member.phone) {
        try {
          await sendPaymentSMS({
            memberName: member.fullName,
            memberPhone: member.phone,
            amount: renewalForm.amount,
            paymentMethod: renewalForm.paymentMethod,
            paymentDate: today,
            transactionId: renewalForm.transactionId,
            expiryDate: newExpiryDate
          });
        } catch (smsError) {
          console.warn('Failed to send renewal confirmation SMS:', smsError);
        }
      }
      // Optionally send payment confirmation email if member has email
      if (member.email) {
        try {
          await sendPaymentEmail({
            memberName: member.fullName,
            memberEmail: member.email,
            memberPhone: member.phone,
            amount: renewalForm.amount,
            paymentMethod: renewalForm.paymentMethod,
            paymentDate: today,
            transactionId: renewalForm.transactionId,
            expiryDate: newExpiryDate
          });
        } catch (emailError) {
          console.warn('Failed to send renewal confirmation email:', emailError);
        }
      }

      showSuccess(`${member.fullName} successfully renewed! New expiry: ${formatExpiryDate(newExpiryDate)}`);
      onClose();
    } catch (error) {
      console.error('Error processing renewal:', error);
      showError('Failed to process renewal. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleClose = () => {
    if (!isProcessing) onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-slate-200 px-6 py-4 flex justify-between items-center">
          <div>
            <h2 className="text-xl font-bold text-slate-900">Renew Membership</h2>
            <p className="text-sm text-slate-500 mt-1">Process renewal for {member.fullName}</p>
          </div>
          <button
            onClick={handleClose}
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
              {member.photo ? (
                <img
                  src={member.photo}
                  alt={member.fullName}
                  className="w-16 h-16 rounded-full object-cover border-2 border-amber-300"
                />
              ) : (
                <div className="w-16 h-16 rounded-full bg-amber-200 flex items-center justify-center text-amber-700 font-bold text-xl">
                  {member.fullName.split(' ').map(n => n[0]).join('')}
                </div>
              )}
              <div>
                <h3 className="font-bold text-slate-900">{member.fullName}</h3>
                <p className="text-sm text-slate-600 flex items-center gap-2 mt-1">
                  <Mail size={14} />
                  {member.email || '-'}
                </p>
                <p className="text-sm text-slate-600 flex items-center gap-2 mt-1">
                  <Phone size={14} />
                  {member.phone}
                </p>
              </div>
            </div>
            <div className="pt-3 border-t border-amber-200">
              <p className="text-xs text-amber-700">
                <strong>Registration Date:</strong> {parseLocalDate(member.startDate).toLocaleDateString()}
              </p>
              <p className="text-xs text-amber-700 mt-1">
                <strong>Previous Plan:</strong> {member.plan}
              </p>
              <p className="text-xs text-amber-700 mt-1">
                <strong>{isStillActive ? 'Expires On' : 'Expired On'}:</strong> {formatExpiryDate(member.expiryDate)}
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
              <option value={SubscriptionPlan.MONTHLY}>Monthly - ₵140</option>
              <option value={SubscriptionPlan.TWO_WEEKS}>2 Weeks - ₵90</option>
              <option value={SubscriptionPlan.ONE_WEEK}>1 Week - ₵50</option>
              <option value={SubscriptionPlan.DAY_MORNING}>Day Morning - ₵10</option>
              <option value={SubscriptionPlan.DAY_EVENING}>Day Evening - ₵10</option>
              {role !== UserRole.PUBLIC && (
                <option value={SubscriptionPlan.FREE}>Free - ₵0</option>
              )}
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
              <p><strong>Start Date:</strong> {parseLocalDate(today).toLocaleDateString()} (payment date)</p>
              <p><strong>New Expiry:</strong> {formatExpiryDate(calculateExpiryDate(renewalForm.plan, today))}</p>
              <p><strong>Amount:</strong> ₵{renewalForm.amount.toFixed(2)}</p>
              <p><strong>Payment Method:</strong> {renewalForm.paymentMethod}</p>
            </div>
            {isStillActive && (
              <p className="mt-3 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg p-2">
                Current membership runs until {formatExpiryDate(member.expiryDate)}. The new period starts
                today (payment date) - remaining days are not carried over.
              </p>
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="sticky bottom-0 bg-slate-50 border-t border-slate-200 px-6 py-4 flex justify-end gap-3">
          <button
            onClick={handleClose}
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
  );
};

export default RenewalModal;
