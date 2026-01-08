import React, { useState } from 'react';
import { SubscriptionPlan, PaymentMethod, PaymentStatus } from '../types';
import { ArrowLeft, CreditCard, Smartphone, X, CheckCircle2, AlertCircle, Copy, Check, Image as ImageIcon, User } from 'lucide-react';
import { paymentsService } from '../lib/database';
import { MOBILE_MONEY_NUMBER } from '../constants';
import { calculateExpiryDate } from '../lib/dateUtils';

interface CheckoutProps {
  selectedPlan: {
    name: SubscriptionPlan;
    price: string;
    period: string;
  } | null;
  onBack: () => void;
  onSuccess: () => void;
  setCurrentPage?: (page: string) => void;
}

const Checkout: React.FC<CheckoutProps> = ({ selectedPlan, onBack, onSuccess, setCurrentPage }) => {
  const [step, setStep] = useState<'member' | 'momo-instructions' | 'payment'>('member');
  const [memberData, setMemberData] = useState({
    fullName: '',
    email: '',
    phone: '',
    address: '',
    photo: '' as string | undefined
  });
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [paymentData, setPaymentData] = useState({
    method: PaymentMethod.MOMO as PaymentMethod,
    transactionId: '',
    momoPhone: '',
    network: ''
  });
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [copied, setCopied] = useState(false);

  if (!selectedPlan) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <AlertCircle className="mx-auto text-rose-500 mb-4" size={48} />
          <h2 className="text-2xl font-bold text-slate-900 mb-2">No Plan Selected</h2>
          <p className="text-slate-600 mb-6">Please select a plan first.</p>
          <button
            onClick={onBack}
            className="px-6 py-3 bg-rose-600 text-white rounded-lg hover:bg-rose-700 transition-colors"
          >
            View Plans
          </button>
        </div>
      </div>
    );
  }

  const planPrice = parseFloat(selectedPlan.price);
  // Registration fee: ₵100 for monthly/weekly plans, ₵0 for day passes
  const registrationFee = (selectedPlan.name === 'Day Morning' || selectedPlan.name === 'Day Evening') ? 0 : 100;
  const totalAmount = planPrice + registrationFee;

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        setError('Please select an image file');
        return;
      }
      
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setError('Image size must be less than 5MB');
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        setPhotoPreview(base64String);
        setMemberData({ ...memberData, photo: base64String });
        setError('');
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemovePhoto = () => {
    setPhotoPreview(null);
    setMemberData({ ...memberData, photo: undefined });
  };

  const handleMemberSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!memberData.fullName || !memberData.email || !memberData.phone) {
      setError('Please fill in all required fields');
      return;
    }
    if (!memberData.photo) {
      setError('Please upload your photo. Photo is required for registration.');
      return;
    }
    setError('');
    setStep('momo-instructions');
  };

  const handleCopyNumber = () => {
    navigator.clipboard.writeText(MOBILE_MONEY_NUMBER);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleAfterPayment = () => {
    setStep('payment');
  };

  const handlePaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);
    setError('');

    try {
      // Create payment record with member info (member will be created after admin confirms payment)
      const now = new Date();
      const paymentAmount = totalAmount;
      
      // Get start date as string (YYYY-MM-DD) in local timezone to avoid timezone issues
      const startDateStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
      
      // Calculate expiry date based on plan (will be used when member is created)
      const expiryDate = calculateExpiryDate(selectedPlan.name, startDateStr);

      // Create payment record WITHOUT memberId - member will be created after admin confirms
      const paymentRecord = {
        memberId: null as any, // Null - will be set when admin confirms and creates member
        memberName: memberData.fullName,
        memberEmail: memberData.email, // Store email for member creation later
        memberPhone: memberData.phone,
        memberAddress: memberData.address,
        memberPhoto: memberData.photo, // Store photo for member creation
        memberPlan: selectedPlan.name,
        memberStartDate: startDateStr,
        memberExpiryDate: expiryDate,
        amount: paymentAmount,
        date: startDateStr,
        method: paymentData.method,
        status: PaymentStatus.PENDING, // Will be confirmed by admin
        transactionId: paymentData.transactionId,
        momoPhone: paymentData.momoPhone,
        network: paymentData.network,
        isPendingMember: true // Flag to indicate this payment is for a new member registration
      };

      // Save payment to database
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

      if (supabaseUrl && supabaseKey) {
        try {
          await paymentsService.create(paymentRecord as any);
          console.log('✅ Payment record created - awaiting admin confirmation');
        } catch (error: any) {
          console.error('Error creating payment record:', error);
          if (error.name === 'SCHEMA_MIGRATION_REQUIRED' || (error.message && error.message.includes('is_pending_member'))) {
            setError('Database setup incomplete. Please contact support - they need to run a database migration.');
          } else {
            setError('Failed to submit payment. Please try again or contact support.');
          }
          setIsProcessing(false);
          return;
        }
      } else {
        setError('Database not configured. Please contact support.');
        setIsProcessing(false);
        return;
      }

      // If payment is cash, show success immediately
      // If mobile money, show success but note that payment needs verification
      setSuccess(true);
      
      // Redirect after 5 seconds (give time to read success message)
      setTimeout(() => {
        if (setCurrentPage) {
          setCurrentPage('home');
        } else {
          onSuccess();
        }
      }, 5000);

    } catch (error: any) {
      console.error('Registration error:', error);
      setError(`Registration failed: ${error.message || 'Please try again'}`);
    } finally {
      setIsProcessing(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 py-20">
        <div className="max-w-md w-full mx-4">
          <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
            <CheckCircle2 className="mx-auto text-emerald-500 mb-6" size={64} />
            <h2 className="text-3xl font-bold text-slate-900 mb-4">Payment Submitted!</h2>
            <p className="text-slate-600 mb-2">
              Thank you, <strong>{memberData.fullName}</strong>!
            </p>
            <p className="text-slate-600 mb-4">
              Your payment details have been submitted for the <strong>{selectedPlan.name}</strong> plan.
            </p>
            
            {/* Payment Status */}
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-4">
              <p className="text-sm font-bold text-amber-800 mb-2">
                Payment Status: Pending Verification
              </p>
              {paymentData.transactionId && (
                <p className="text-xs text-amber-700 mb-2">
                  Transaction ID: <strong>{paymentData.transactionId}</strong>
                </p>
              )}
              <p className="text-xs text-amber-700">
                Our team will verify your Mobile Money payment. Once confirmed, you'll receive a welcome email and your membership will be activated.
              </p>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
              <p className="text-xs text-blue-800">
                <strong>What happens next?</strong><br />
                1. Our admin team will verify your payment<br />
                2. You'll receive a welcome email once verified<br />
                3. Your membership will be activated
              </p>
            </div>

            <p className="text-xs text-slate-400 mt-4">
              Redirecting to home page in a few seconds...
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 py-20">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-slate-600 hover:text-rose-600 mb-6 transition-colors"
        >
          <ArrowLeft size={20} />
          <span>Back to Plans</span>
        </button>

        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
          <div className="bg-gradient-to-r from-rose-600 to-rose-700 text-white p-6">
            <h1 className="text-3xl font-bold mb-2">Complete Your Registration</h1>
            <p className="text-rose-100">
              You're signing up for the <strong>{selectedPlan.name}</strong> plan - ₵{selectedPlan.price}/{selectedPlan.period.toLowerCase()}
              {registrationFee > 0 && <span> + Registration: ₵{registrationFee}</span>}
            </p>
          </div>

          <div className="p-6 md:p-8">
            {step === 'member' ? (
              <form onSubmit={handleMemberSubmit} className="space-y-6">
                <div>
                  <h2 className="text-xl font-bold text-slate-900 mb-4">Member Information</h2>
                  
                  {/* Photo Upload Section */}
                  <div className="mb-6 pb-6 border-b border-slate-200">
                    <label className="block text-sm font-medium text-slate-700 mb-3">
                      Profile Photo <span className="text-rose-600">*</span>
                    </label>
                    <div className="flex flex-col items-center gap-4">
                      <div className="relative">
                        {photoPreview ? (
                          <div className="relative">
                            <img 
                              src={photoPreview} 
                              alt="Preview" 
                              className="w-40 h-40 rounded-full object-cover border-4 border-rose-500"
                            />
                            <button
                              type="button"
                              onClick={handleRemovePhoto}
                              className="absolute -top-2 -right-2 bg-rose-600 text-white rounded-full p-1.5 hover:bg-rose-700 transition-colors"
                            >
                              <X size={16} />
                            </button>
                          </div>
                        ) : (
                          <div className="w-40 h-40 rounded-full bg-slate-100 border-4 border-slate-200 flex items-center justify-center">
                            <User size={60} className="text-slate-400" />
                          </div>
                        )}
                      </div>
                      <div className="text-center">
                        <label className="inline-flex items-center gap-2 px-4 py-2 bg-rose-600 text-white rounded-lg cursor-pointer hover:bg-rose-700 transition-colors">
                          <ImageIcon size={18} />
                          <span className="text-sm font-medium">Upload Photo</span>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handlePhotoUpload}
                            className="hidden"
                            required
                          />
                        </label>
                        <p className="text-xs text-slate-500 mt-2">Max size: 5MB (JPG, PNG) - Required</p>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-slate-700 mb-1">
                        Full Name <span className="text-rose-600">*</span>
                      </label>
                      <input
                        required
                        type="text"
                        className="w-full px-4 py-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-rose-500 outline-none"
                        value={memberData.fullName}
                        onChange={e => setMemberData({...memberData, fullName: e.target.value})}
                        placeholder="John Doe"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">
                        Email <span className="text-rose-600">*</span>
                      </label>
                      <input
                        required
                        type="email"
                        className="w-full px-4 py-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-rose-500 outline-none"
                        value={memberData.email}
                        onChange={e => setMemberData({...memberData, email: e.target.value})}
                        placeholder="john@example.com"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">
                        Phone <span className="text-rose-600">*</span>
                      </label>
                      <input
                        required
                        type="tel"
                        className="w-full px-4 py-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-rose-500 outline-none"
                        value={memberData.phone}
                        onChange={e => setMemberData({...memberData, phone: e.target.value})}
                        placeholder="0244123456"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-slate-700 mb-1">
                        Address (Optional)
                      </label>
                      <input
                        type="text"
                        className="w-full px-4 py-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-rose-500 outline-none"
                        value={memberData.address}
                        onChange={e => setMemberData({...memberData, address: e.target.value})}
                        placeholder="Your address"
                      />
                    </div>
                  </div>
                </div>

                {error && (
                  <div className="bg-rose-50 border border-rose-200 rounded-lg p-4 flex items-start gap-3">
                    <AlertCircle className="text-rose-600 shrink-0 mt-0.5" size={20} />
                    <p className="text-sm text-rose-800">{error}</p>
                  </div>
                )}

                <div className="flex gap-4">
                  <button
                    type="button"
                    onClick={onBack}
                    className="flex-1 py-3 bg-slate-100 text-slate-600 font-bold rounded-lg hover:bg-slate-200 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-3 bg-rose-600 text-white font-bold rounded-lg hover:bg-rose-700 transition-colors"
                  >
                    Continue to Payment
                  </button>
                </div>
              </form>
            ) : step === 'momo-instructions' ? (
              <div className="space-y-6">
                <div>
                  <h2 className="text-xl font-bold text-slate-900 mb-4">Mobile Money Payment</h2>
                  
                  <div className="bg-slate-50 rounded-lg p-4 mb-6">
                    <div className="flex justify-between items-center">
                      <span className="text-slate-600">Plan:</span>
                      <span className="font-bold text-slate-900">{selectedPlan.name}</span>
                    </div>
                    <div className="flex justify-between items-center mt-2">
                      <span className="text-slate-600">Plan Amount:</span>
                      <span className="text-lg font-semibold text-slate-900">₵{selectedPlan.price}</span>
                    </div>
                    {registrationFee > 0 && (
                      <div className="flex justify-between items-center mt-2">
                        <span className="text-slate-600">Registration Fee:</span>
                        <span className="text-lg font-semibold text-slate-900">₵{registrationFee}</span>
                      </div>
                    )}
                    <div className="flex justify-between items-center mt-3 pt-3 border-t border-slate-200">
                      <span className="text-slate-700 font-semibold">Total Amount:</span>
                      <span className="text-2xl font-bold text-rose-600">₵{totalAmount}</span>
                    </div>
                  </div>

                  <div className="bg-gradient-to-r from-rose-50 to-rose-100 border-2 border-rose-200 rounded-xl p-6 mb-6">
                    <div className="text-center">
                      <Smartphone className="mx-auto text-rose-600 mb-4" size={48} />
                      <h3 className="text-lg font-bold text-slate-900 mb-2">Send Payment To:</h3>
                      <div className="flex items-center justify-center gap-3 mb-4">
                        <span className="text-3xl font-extrabold text-rose-600">{MOBILE_MONEY_NUMBER}</span>
                        <button
                          type="button"
                          onClick={handleCopyNumber}
                          className="p-2 bg-white rounded-lg hover:bg-slate-50 transition-colors border border-slate-200"
                          title="Copy number"
                        >
                          {copied ? (
                            <Check className="text-emerald-600" size={20} />
                          ) : (
                            <Copy className="text-slate-600" size={20} />
                          )}
                        </button>
                      </div>
                      <p className="text-sm text-slate-600">
                        Use any Mobile Money network (MTN, Vodafone, Telecel, AirtelTigo)
                      </p>
                    </div>
                  </div>

                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                    <h4 className="font-bold text-blue-900 mb-2">Instructions:</h4>
                    <ol className="list-decimal list-inside space-y-2 text-sm text-blue-800">
                      <li>Dial <strong>*170#</strong> on your phone</li>
                      <li>Select <strong>"Send Money"</strong> or <strong>"Transfer"</strong></li>
                      <li>Enter the number: <strong>{MOBILE_MONEY_NUMBER}</strong></li>
                      <li>Enter the amount: <strong>₵{totalAmount}</strong> (Plan: ₵{selectedPlan.price}{registrationFee > 0 ? ` + Registration: ₵${registrationFee}` : ''})</li>
                      <li>Enter your Mobile Money PIN</li>
                      <li>Confirm the transaction</li>
                      <li>Save the <strong>Transaction ID</strong> you receive</li>
                    </ol>
                  </div>

                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                    <p className="text-sm text-amber-800">
                      <strong>Important:</strong> After sending the payment, you'll need to enter your Transaction ID and other details on the next step. Your payment will be verified by our team before your membership is activated.
                    </p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <button
                    type="button"
                    onClick={() => setStep('member')}
                    className="flex-1 py-3 bg-slate-100 text-slate-600 font-bold rounded-lg hover:bg-slate-200 transition-colors"
                  >
                    Back
                  </button>
                  <button
                    type="button"
                    onClick={handleAfterPayment}
                    className="flex-1 py-3 bg-rose-600 text-white font-bold rounded-lg hover:bg-rose-700 transition-colors"
                  >
                    I've Sent the Payment
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handlePaymentSubmit} className="space-y-6">
                <div>
                  <h2 className="text-xl font-bold text-slate-900 mb-4">Enter Payment Details</h2>
                  
                  <div className="bg-slate-50 rounded-lg p-4 mb-6">
                    <div className="flex justify-between items-center">
                      <span className="text-slate-600">Plan:</span>
                      <span className="font-bold text-slate-900">{selectedPlan.name}</span>
                    </div>
                    <div className="flex justify-between items-center mt-2">
                      <span className="text-slate-600">Plan Amount:</span>
                      <span className="text-lg font-semibold text-slate-900">₵{selectedPlan.price}</span>
                    </div>
                    {registrationFee > 0 && (
                      <div className="flex justify-between items-center mt-2">
                        <span className="text-slate-600">Registration Fee:</span>
                        <span className="text-lg font-semibold text-slate-900">₵{registrationFee}</span>
                      </div>
                    )}
                    <div className="flex justify-between items-center mt-3 pt-3 border-t border-slate-200">
                      <span className="text-slate-700 font-semibold">Total Amount Paid:</span>
                      <span className="text-2xl font-bold text-rose-600">₵{totalAmount}</span>
                    </div>
                    <div className="flex justify-between items-center mt-2 text-sm">
                      <span className="text-slate-600">To:</span>
                      <span className="font-semibold text-slate-900">{MOBILE_MONEY_NUMBER}</span>
                    </div>
                  </div>

                  <div className="bg-slate-50 rounded-lg p-4 space-y-4">
                    <p className="text-sm text-slate-600 mb-4">
                      Enter the details from your Mobile Money payment. Our team will verify your payment and activate your membership.
                    </p>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">
                        Transaction ID <span className="text-rose-600">*</span>
                      </label>
                      <input
                        required
                        type="text"
                        className="w-full px-4 py-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-rose-500 outline-none"
                        value={paymentData.transactionId}
                        onChange={e => setPaymentData({...paymentData, transactionId: e.target.value})}
                        placeholder="Enter transaction ID from your Mobile Money payment"
                      />
                      <p className="text-xs text-slate-500 mt-1">
                        This is the transaction ID/reference number you received after making the payment
                      </p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">
                        Mobile Money Number <span className="text-rose-600">*</span>
                      </label>
                      <input
                        required
                        type="tel"
                        className="w-full px-4 py-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-rose-500 outline-none"
                        value={paymentData.momoPhone}
                        onChange={e => setPaymentData({...paymentData, momoPhone: e.target.value})}
                        placeholder="0244123456"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">
                        Network <span className="text-rose-600">*</span>
                      </label>
                      <select
                        required
                        className="w-full px-4 py-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-rose-500 outline-none"
                        value={paymentData.network}
                        onChange={e => setPaymentData({...paymentData, network: e.target.value})}
                      >
                        <option value="">-- Select Network --</option>
                        <option value="MTN">MTN</option>
                        <option value="Vodafone">Vodafone</option>
                        <option value="Telecel">Telecel</option>
                        <option value="AirtelTigo">AirtelTigo</option>
                      </select>
                    </div>
                  </div>
                </div>

                {error && (
                  <div className="bg-rose-50 border border-rose-200 rounded-lg p-4 flex items-start gap-3">
                    <AlertCircle className="text-rose-600 shrink-0 mt-0.5" size={20} />
                    <p className="text-sm text-rose-800">{error}</p>
                  </div>
                )}

                <div className="flex gap-4">
                  <button
                    type="button"
                    onClick={() => setStep('member')}
                    className="flex-1 py-3 bg-slate-100 text-slate-600 font-bold rounded-lg hover:bg-slate-200 transition-colors"
                  >
                    Back
                  </button>
                  <button
                    type="submit"
                    disabled={isProcessing}
                    className="flex-1 py-3 bg-rose-600 text-white font-bold rounded-lg hover:bg-rose-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {isProcessing ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Processing...
                      </>
                    ) : (
                      <>
                        Complete Registration
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Checkout;


