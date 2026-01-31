
import React, { useState, useEffect, useMemo } from 'react';
import { PaymentRecord, UserRole, Member, PaymentMethod, PaymentStatus, SubscriptionPlan, StaffMember } from '../types';
import { CreditCard, Smartphone, CheckCircle, Search, Filter, History, X, UserPlus, AlertCircle, RefreshCw } from 'lucide-react';
import { sendPaymentEmail, sendWelcomeEmail } from '../lib/emailService';
import { membersService, paymentsService } from '../lib/database';
import { useToast } from '../contexts/ToastContext';
import { calculateExpiryDate } from '../lib/dateUtils';

interface PaymentProcessorProps {
  payments: PaymentRecord[];
  setPayments: React.Dispatch<React.SetStateAction<PaymentRecord[]>>;
  members: Member[];
  setMembers: React.Dispatch<React.SetStateAction<Member[]>>;
  role: UserRole;
  userEmail: string;
  staff: StaffMember[];
  logActivity: (action: string, details: string, category: 'access' | 'admin' | 'financial') => void;
}

const PaymentProcessor: React.FC<PaymentProcessorProps> = ({ payments, setPayments, members, setMembers, role, userEmail, staff, logActivity }) => {
  const { showSuccess, showError } = useToast();
  const [activeTab, setActiveTab] = useState<'history' | 'momo'>('history');
  const [showPayModal, setShowPayModal] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [newPay, setNewPay] = useState<Partial<PaymentRecord>>({
    memberId: '',
    amount: 0,
    method: PaymentMethod.CASH,
    status: PaymentStatus.CONFIRMED
  });
  const [momoDetails, setMomoDetails] = useState({
    transactionId: '',
    momoPhone: '',
    network: ''
  });
  const [memberSearchTerm, setMemberSearchTerm] = useState('');
  
  // Get current staff member for confirmation tracking
  const currentStaff = useMemo(() => {
    return staff.find(s => s.email === userEmail);
  }, [staff, userEmail]);
  
  // Get staff name for confirmedBy field
  const getConfirmedByName = (): string => {
    if (role === UserRole.SUPER_ADMIN) {
      return currentStaff?.fullName || 'Admin';
    }
    return currentStaff?.fullName || 'Staff';
  };

  // Filter members for Record Payment search
  const filteredMembersForPayment = useMemo(() => {
    if (!memberSearchTerm.trim()) return members;
    const term = memberSearchTerm.toLowerCase().trim();
    return members.filter(m =>
      m.fullName.toLowerCase().includes(term) ||
      (m.email && m.email.toLowerCase().includes(term)) ||
      (m.phone && m.phone.includes(term))
    );
  }, [members, memberSearchTerm]);

  // Function to refresh payments from Supabase
  const refreshPayments = async () => {
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
    
    if (!supabaseUrl || !supabaseKey) {
      return; // Can't refresh if Supabase not configured
    }

    setIsRefreshing(true);
    try {
      const paymentsData = await paymentsService.getAll();
      setPayments(paymentsData);
      console.log('✅ Payments refreshed:', paymentsData.length);
    } catch (error) {
      console.error('Error refreshing payments:', error);
    } finally {
      setIsRefreshing(false);
    }
  };

  // Clear form fields on component mount (page refresh)
  useEffect(() => {
    setNewPay({
      memberId: '',
      amount: 0,
      method: PaymentMethod.CASH,
      status: PaymentStatus.CONFIRMED
    });
    setMomoDetails({
      transactionId: '',
      momoPhone: '',
      network: ''
    });
    
    // Refresh payments when component mounts
    refreshPayments();
  }, []);

  // Auto-refresh payments every 30 seconds when on Mobile Money Verification tab
  useEffect(() => {
    if (activeTab === 'momo') {
      const interval = setInterval(() => {
        refreshPayments();
      }, 30000); // Refresh every 30 seconds

      return () => clearInterval(interval);
    }
  }, [activeTab]);

  const handleConfirmPayment = async (id: string) => {
    const pay = payments.find(p => p.id === id);
    if (!pay) return;
    
    try {
      // If this is a pending member registration, create the member first
      if (pay.isPendingMember && pay.memberEmail) {
        const plan = (pay.memberPlan || SubscriptionPlan.BASIC) as SubscriptionPlan;
        // Use local timezone for default start date if not provided
        const now = new Date();
        const defaultStartDate = pay.memberStartDate || `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
        const startDate = pay.memberStartDate || defaultStartDate;
        const expiryDate = pay.memberExpiryDate || calculateExpiryDate(plan, startDate);
        
        const memberToCreate = {
          fullName: pay.memberName,
          email: pay.memberEmail,
          phone: pay.memberPhone || '',
          address: pay.memberAddress,
          photo: pay.memberPhoto, // Include photo from payment record
          plan,
          startDate,
          expiryDate,
          status: 'active' as const
        };

        // Create member in database
        const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
        const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

        if (!supabaseUrl || !supabaseKey) {
          showError('Database not configured. Cannot create member. Please configure Supabase.');
          return;
        }

        try {
            // Check if member already exists by email
            let existingMember = await membersService.getByEmail(memberToCreate.email);
            let createdMember: Member;
            
            if (existingMember) {
              // Member already exists, use existing member and update if needed
              console.log('ℹ️ Member already exists with email:', memberToCreate.email);
              createdMember = existingMember;
              
              // Optionally update member details if payment has newer information
              // (e.g., update plan, expiry date, etc.)
              const updates: Partial<Member> = {};
              if (memberToCreate.plan && memberToCreate.plan !== existingMember.plan) {
                updates.plan = memberToCreate.plan;
              }
              if (memberToCreate.expiryDate && memberToCreate.expiryDate > existingMember.expiryDate) {
                updates.expiryDate = memberToCreate.expiryDate;
              }
              if (memberToCreate.photo && !existingMember.photo) {
                updates.photo = memberToCreate.photo;
              }
              
              if (Object.keys(updates).length > 0) {
                createdMember = await membersService.update(existingMember.id, updates);
                console.log('✅ Member updated:', createdMember.id);
              }
            } else {
              // Member doesn't exist, create new one
              try {
                createdMember = await membersService.create(memberToCreate);
                console.log('✅ Member created:', createdMember.id);
              } catch (createError: any) {
                console.error('❌ Error creating member:', createError);
                showError(`Failed to create member: ${createError?.message || 'Unknown error'}. Payment not confirmed.`);
                return; // Don't proceed with payment confirmation
              }
            }
            
            // Update local state if member not already in list
            setMembers(prev => {
              const exists = prev.some(m => m.id === createdMember.id);
              return exists ? prev : [...prev, createdMember];
            });
            
            // Update payment with memberId
            const confirmedByName = getConfirmedByName();
            const updatedPayment = {
              ...pay,
              memberId: createdMember.id,
              status: PaymentStatus.CONFIRMED,
              confirmedBy: confirmedByName
            };
            
            // Update payment in database
            await paymentsService.update(id, {
              memberId: createdMember.id,
              status: PaymentStatus.CONFIRMED,
              confirmedBy: confirmedByName
            });
            
            // Update local state
            setPayments(prev => prev.map(p => p.id === id ? updatedPayment : p));
            
            logActivity('Confirm Payment & Create Member', `Verified ${pay.method} payment of ₵${pay.amount} and ${existingMember ? 'linked to existing' : 'created'} member ${pay.memberName}`, 'financial');
            
            // Send welcome email only if member was just created
            if (!existingMember && createdMember.email) {
              const emailSent = await sendWelcomeEmail({
                memberName: createdMember.fullName,
                memberEmail: createdMember.email,
                memberPhone: createdMember.phone, // Include phone for SMS
                plan: createdMember.plan,
                startDate: createdMember.startDate,
                expiryDate: createdMember.expiryDate
              });
              
              if (emailSent) {
                console.log(`Welcome email and SMS sent to ${createdMember.email}`);
              }
            }
            
            // Send payment confirmation email
            if (createdMember.email) {
              await sendPaymentEmail({
                memberName: pay.memberName,
                memberEmail: createdMember.email,
                memberPhone: createdMember.phone, // Include phone for SMS
                amount: pay.amount,
                paymentMethod: pay.method,
                paymentDate: pay.date,
                transactionId: pay.transactionId,
                expiryDate: createdMember.expiryDate
              });
            }
            
            showSuccess(`Payment confirmed and member ${pay.memberName} has been ${existingMember ? 'linked' : 'created'} successfully!`);
            // Refresh payments to get updated list
            await refreshPayments();
            return;
          } catch (error: any) {
            console.error('Error creating member:', error);
            // Check if it's a duplicate key error
            if (error.code === '23505' || error.message?.includes('duplicate key') || error.message?.includes('unique constraint')) {
              // Try to get the existing member and use it
              try {
                const existingMember = await membersService.getByEmail(memberToCreate.email);
                if (existingMember) {
                  // Use existing member and continue with payment confirmation
                  const confirmedByName = getConfirmedByName();
                  const updatedPayment = {
                    ...pay,
                    memberId: existingMember.id,
                    status: PaymentStatus.CONFIRMED,
                    confirmedBy: confirmedByName
                  };
                  
                  await paymentsService.update(id, {
                    memberId: existingMember.id,
                    status: PaymentStatus.CONFIRMED,
                    confirmedBy: confirmedByName
                  });
                  
                  setPayments(prev => prev.map(p => p.id === id ? updatedPayment : p));
                  setMembers(prev => {
                    const exists = prev.some(m => m.id === existingMember.id);
                    return exists ? prev : [...prev, existingMember];
                  });
                  
                  showSuccess(`Payment confirmed and linked to existing member ${pay.memberName}!`);
                  return;
                }
              } catch (retryError) {
                console.error('Error retrieving existing member:', retryError);
              }
            }
            showError(`Failed to create member: ${error.message || 'Please try again'}`);
            return;
          }
        } else {
        // Regular payment confirmation (member already exists)
        const confirmedByName = getConfirmedByName();
        const updatedPayment = {
          ...pay,
          status: PaymentStatus.CONFIRMED,
          confirmedBy: confirmedByName
        };
        
        // Update payment in database
        const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
        const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
        
        if (supabaseUrl && supabaseKey) {
          await paymentsService.update(id, {
            status: PaymentStatus.CONFIRMED,
            confirmedBy: confirmedByName
          });
        }
        
        // Update local state
        setPayments(prev => prev.map(p => p.id === id ? updatedPayment : p));
        logActivity('Confirm Payment', `Verified ${pay.method} payment of ₵${pay.amount} for ${pay.memberName}`, 'financial');
        
        // Send payment confirmation email
        const member = members.find(m => m.id === pay.memberId);
        if (member && member.email) {
          await sendPaymentEmail({
            memberName: pay.memberName,
            memberEmail: member.email,
            memberPhone: member.phone, // Include phone for SMS
            amount: pay.amount,
            paymentMethod: pay.method,
            paymentDate: pay.date,
            transactionId: pay.transactionId,
            expiryDate: member.expiryDate
          });
        }
        
        showSuccess(`Payment confirmed!`);
        // Refresh payments to get updated list
        await refreshPayments();
      }
    } catch (error: any) {
      console.error('Error confirming payment:', error);
      showError(`Failed to confirm payment: ${error.message || 'Please try again'}`);
    }
  };

  const handleRecordPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    const member = members.find(m => m.id === newPay.memberId);
    if (!member) {
      showError('Please select a member');
      return;
    }

    try {
      // Get staff name for confirmedBy field
      const confirmedByName = getConfirmedByName();
      
      // Create payment object without ID - database will generate UUID
      const paymentData: Omit<PaymentRecord, 'id'> = {
        memberId: member.id,
        memberName: member.fullName,
        amount: newPay.amount || 0,
        date: (() => {
          const d = new Date();
          return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
        })(),
        method: newPay.method as PaymentMethod,
        status: newPay.method === PaymentMethod.CASH ? PaymentStatus.CONFIRMED : PaymentStatus.PENDING,
        confirmedBy: newPay.method === PaymentMethod.CASH ? confirmedByName : undefined,
        // Include mobile money details if method is Mobile Money
        ...(newPay.method === PaymentMethod.MOMO && {
          transactionId: momoDetails.transactionId || undefined,
          momoPhone: momoDetails.momoPhone || undefined,
          network: momoDetails.network || undefined
        })
      };

      // Save payment to database first (database will generate UUID)
      const createdPayment = await paymentsService.create(paymentData);
      
      // Update local state with the payment returned from database (includes UUID)
      setPayments(prev => [createdPayment, ...prev]);
      showSuccess(`Payment of ₵${createdPayment.amount} recorded successfully`);
      logActivity('Record Payment', `Logged ₵${createdPayment.amount} ${createdPayment.method} entry for ${member.fullName}`, 'financial');
      
      // Send payment confirmation email if payment is confirmed (Cash payments)
      if (createdPayment.status === PaymentStatus.CONFIRMED && member.email) {
        const emailSent = await sendPaymentEmail({
          memberName: createdPayment.memberName,
          memberEmail: member.email,
          memberPhone: member.phone, // Include phone for SMS
          amount: createdPayment.amount,
          paymentMethod: createdPayment.method,
          paymentDate: createdPayment.date,
          transactionId: createdPayment.transactionId,
          expiryDate: member.expiryDate
        });
        
        if (emailSent) {
          console.log(`Payment confirmation email sent to ${member.email}`);
        } else {
          console.warn(`Failed to send payment email to ${member.email}`);
        }
      }
      
      // Reset form
      setMemberSearchTerm('');
      setNewPay({
        memberId: '',
        amount: 0,
        method: PaymentMethod.CASH,
        status: PaymentStatus.CONFIRMED
      });
      setMomoDetails({
        transactionId: '',
        momoPhone: '',
        network: ''
      });
      setShowPayModal(false);
    } catch (error: any) {
      console.error('Error recording payment:', error);
      showError(`Failed to record payment: ${error.message || 'Unknown error'}`);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-slate-900">Payment Center</h2>
        <div className="flex items-center gap-2">
          <button 
            onClick={refreshPayments}
            disabled={isRefreshing}
            className="bg-slate-100 text-slate-700 px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-slate-200 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            title="Refresh payments list"
          >
            <RefreshCw size={18} className={isRefreshing ? 'animate-spin' : ''} />
            {isRefreshing ? 'Refreshing...' : 'Refresh'}
          </button>
          <button 
            onClick={() => setShowPayModal(true)}
            className="bg-slate-900 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-slate-800 shadow-sm"
          >
            <CreditCard size={20} />
            Record New Payment
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200">
        <div className="flex border-b">
          <button 
            onClick={() => setActiveTab('history')}
            className={`flex-1 py-4 text-sm font-bold border-b-2 transition-colors ${activeTab === 'history' ? 'border-rose-600 text-rose-600' : 'border-transparent text-slate-400 hover:text-slate-600'}`}
          >
            Payment History
          </button>
          <button 
            onClick={() => setActiveTab('momo')}
            className={`flex-1 py-4 text-sm font-bold border-b-2 transition-colors flex items-center justify-center gap-2 ${activeTab === 'momo' ? 'border-rose-600 text-rose-600' : 'border-transparent text-slate-400 hover:text-slate-600'}`}
          >
            <Smartphone size={18} />
            Mobile Money Verification
          </button>
        </div>

        <div className="p-4">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="text-slate-500 text-[10px] font-bold uppercase tracking-widest bg-slate-50/50">
                  <th className="px-6 py-4">Transaction Details</th>
                  <th className="px-6 py-4">Member</th>
                  <th className="px-6 py-4">Amount</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {payments
                  .filter(p => activeTab === 'history' || p.status === PaymentStatus.PENDING)
                  .map((payment) => (
                    <tr key={payment.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className={`p-2 rounded-lg ${payment.method === PaymentMethod.CASH ? 'bg-amber-50 text-amber-600' : 'bg-blue-50 text-blue-600'}`}>
                            {payment.method === PaymentMethod.CASH ? <CreditCard size={18} /> : <Smartphone size={18} />}
                          </div>
                          <div>
                            <div className="text-xs font-bold text-slate-900">{payment.method}</div>
                            <div className="text-[10px] text-slate-400">
                              {payment.date}
                              {payment.transactionId && ` • ${payment.transactionId}`}
                              {payment.momoPhone && ` • ${payment.momoPhone}`}
                              {payment.network && ` (${payment.network})`}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium text-slate-700">{payment.memberName}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm font-bold text-slate-900">₵{payment.amount.toLocaleString()}</div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                          payment.status === PaymentStatus.CONFIRMED ? 'bg-emerald-100 text-emerald-700' :
                          payment.status === PaymentStatus.PENDING ? 'bg-amber-100 text-amber-700' : 'bg-rose-100 text-rose-700'
                        }`}>
                          {payment.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        {payment.status === PaymentStatus.PENDING ? (
                          <button 
                            onClick={() => handleConfirmPayment(payment.id)}
                            className={`text-xs font-bold px-3 py-1.5 rounded-lg transition-colors ${
                              payment.isPendingMember
                                ? 'bg-rose-600 text-white hover:bg-rose-700'
                                : 'text-rose-600 hover:text-rose-700 underline'
                            }`}
                          >
                            {payment.isPendingMember ? (
                              <span className="flex items-center gap-1">
                                <UserPlus size={14} />
                                Confirm & Add Member
                              </span>
                            ) : (
                              'Verify & Confirm'
                            )}
                          </button>
                        ) : (
                          <div className="text-[10px] text-slate-400">By {payment.confirmedBy}</div>
                        )}
                      </td>
                    </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Pay Modal */}
      {showPayModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden">
             <div className="flex items-center justify-between p-6 border-b bg-slate-900 text-white">
              <h3 className="text-lg font-bold">Record Payment</h3>
              <button 
                onClick={() => {
                  setShowPayModal(false);
                  setMemberSearchTerm('');
                  setNewPay({
                    memberId: '',
                    amount: 0,
                    method: PaymentMethod.CASH,
                    status: PaymentStatus.CONFIRMED
                  });
                  setMomoDetails({
                    transactionId: '',
                    momoPhone: '',
                    network: ''
                  });
                }} 
                className="hover:text-rose-400"
              >
                <X size={24} />
              </button>
            </div>
            <form onSubmit={handleRecordPayment} className="p-6 space-y-4">
               <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Select Member</label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input
                      type="text"
                      placeholder="Search by name, phone, or email..."
                      value={memberSearchTerm}
                      onChange={e => setMemberSearchTerm(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-rose-500 text-sm"
                    />
                    {memberSearchTerm && (
                      <button
                        type="button"
                        onClick={() => setMemberSearchTerm('')}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                      >
                        <X size={16} />
                      </button>
                    )}
                  </div>
                  <div className="mt-2 max-h-48 overflow-y-auto border border-slate-200 rounded-lg divide-y divide-slate-100">
                    {filteredMembersForPayment.length === 0 ? (
                      <div className="px-4 py-3 text-sm text-slate-500 text-center">
                        {memberSearchTerm ? `No members match "${memberSearchTerm}"` : 'Type to search members'}
                      </div>
                    ) : (
                      filteredMembersForPayment.map(m => (
                        <button
                          key={m.id}
                          type="button"
                          onClick={() => {
                            setNewPay({...newPay, memberId: m.id});
                            setMemberSearchTerm('');
                          }}
                          className={`w-full flex items-center justify-between px-4 py-2.5 text-left text-sm hover:bg-slate-50 transition-colors ${newPay.memberId === m.id ? 'bg-rose-50 border-l-4 border-l-rose-500' : ''}`}
                        >
                          <span className="font-medium text-slate-800">{m.fullName}</span>
                          <span className="text-slate-500 text-xs">({m.plan})</span>
                        </button>
                      ))
                    )}
                  </div>
                  {newPay.memberId && (
                    <p className="mt-2 text-xs text-slate-600 flex items-center gap-2">
                      <CheckCircle size={14} className="text-emerald-500 shrink-0" />
                      <span>Selected: {members.find(m => m.id === newPay.memberId)?.fullName}</span>
                      <button
                        type="button"
                        onClick={() => setNewPay({...newPay, memberId: ''})}
                        className="text-rose-600 hover:underline"
                      >
                        Change
                      </button>
                    </p>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Amount (₵)</label>
                    <input 
                      required
                      type="number"
                      className="w-full px-4 py-2 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-rose-500"
                      onChange={e => setNewPay({...newPay, amount: parseFloat(e.target.value)})}
                    />
                  </div>
                   <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Method</label>
                    <select 
                      className="w-full px-4 py-2 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-rose-500"
                      onChange={e => setNewPay({...newPay, method: e.target.value as PaymentMethod})}
                    >
                      <option value={PaymentMethod.CASH}>Cash</option>
                      <option value={PaymentMethod.MOMO}>Mobile Money</option>
                    </select>
                  </div>
                </div>

                {newPay.method === PaymentMethod.MOMO && (
                  <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                    <p className="text-[10px] font-bold text-slate-500 uppercase">Mobile Money Details</p>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-medium text-slate-600 mb-1">Transaction ID</label>
                        <input 
                          type="text"
                          placeholder="e.g., TX123456"
                          value={momoDetails.transactionId}
                          onChange={e => setMomoDetails({...momoDetails, transactionId: e.target.value})}
                          className="w-full px-3 py-1.5 border border-slate-200 rounded text-sm focus:ring-2 focus:ring-rose-500 outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-slate-600 mb-1">Sender Phone</label>
                        <input 
                          type="text"
                          placeholder="e.g., 0244123456"
                          value={momoDetails.momoPhone}
                          onChange={e => setMomoDetails({...momoDetails, momoPhone: e.target.value})}
                          className="w-full px-3 py-1.5 border border-slate-200 rounded text-sm focus:ring-2 focus:ring-rose-500 outline-none"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-600 mb-1">Network</label>
                      <select
                        value={momoDetails.network}
                        onChange={e => setMomoDetails({...momoDetails, network: e.target.value})}
                        className="w-full px-3 py-1.5 border border-slate-200 rounded text-sm focus:ring-2 focus:ring-rose-500 outline-none"
                      >
                        <option value="">-- Select Network --</option>
                        <option value="MTN">MTN</option>
                        <option value="Vodafone">Vodafone</option>
                        <option value="Telecel">Telecel</option>
                        <option value="AirtelTigo">AirtelTigo</option>
                      </select>
                    </div>
                  </div>
                )}

                <div className="pt-4">
                  <button type="submit" className="w-full py-3 bg-rose-600 text-white font-bold rounded-xl hover:bg-rose-700 transition-shadow shadow-md">
                    Confirm & Update Subscription
                  </button>
                </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default PaymentProcessor;
