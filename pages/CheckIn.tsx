import React, { useState } from 'react';
import { LogIn, LogOut, CheckCircle, Clock, User, Phone, Mail } from 'lucide-react';
import { useToast } from '../contexts/ToastContext';
import { clientCheckInService } from '../lib/database';

const CheckIn: React.FC = () => {
  const { showSuccess, showError } = useToast();
  const [formData, setFormData] = useState({
    fullName: '',
    phone: '',
    email: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [action, setAction] = useState<'checkin' | 'checkout'>('checkin');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.fullName.trim() || !formData.phone.trim()) {
      showError('Please fill in your name and phone number');
      return;
    }

    setIsSubmitting(true);

    try {
      const now = new Date();
      const date = now.toISOString().split('T')[0];
      const time = now.toISOString();

      if (action === 'checkin') {
        // Check if user already checked in today
        const allCheckIns = await clientCheckInService.getAll();
        const todayCheckIn = allCheckIns.find(
          ci => ci.phone === formData.phone && 
                 ci.date === date && 
                 !ci.checkOutTime
        );

        if (todayCheckIn) {
          showError('You have already checked in today. Please check out first.');
          setIsSubmitting(false);
          return;
        }

        await clientCheckInService.create({
          fullName: formData.fullName.trim(),
          phone: formData.phone.trim(),
          email: formData.email.trim() || undefined,
          checkInTime: time,
          date: date
        });

        showSuccess(`Welcome, ${formData.fullName}! You've successfully checked in.`);
        setFormData({ fullName: '', phone: '', email: '' });
      } else {
        // Check out
        const allCheckIns = await clientCheckInService.getAll();
        const todayCheckIn = allCheckIns.find(
          ci => ci.phone === formData.phone && 
                 ci.date === date && 
                 !ci.checkOutTime
        );

        if (!todayCheckIn) {
          showError('No active check-in found. Please check in first.');
          setIsSubmitting(false);
          return;
        }

        await clientCheckInService.update(todayCheckIn.id, {
          checkOutTime: time
        });

        showSuccess(`Thank you, ${formData.fullName}! You've successfully checked out.`);
        setFormData({ fullName: '', phone: '', email: '' });
      }
    } catch (error: any) {
      console.error('Check-in error:', error);
      showError(error.message || 'An error occurred. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 py-20">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          {/* Header */}
          <div className={`bg-gradient-to-r ${action === 'checkin' ? 'from-emerald-600 to-emerald-700' : 'from-rose-600 to-rose-700'} text-white p-8 text-center`}>
            <div className="flex justify-center mb-4">
              {action === 'checkin' ? (
                <LogIn size={48} className="text-white" />
              ) : (
                <LogOut size={48} className="text-white" />
              )}
            </div>
            <h1 className="text-3xl font-bold mb-2">
              {action === 'checkin' ? 'Check In' : 'Check Out'}
            </h1>
            <p className="text-emerald-100">
              {action === 'checkin' 
                ? 'Welcome to Goodlife Fitness! Please enter your details to check in.'
                : 'Thank you for visiting! Please enter your details to check out.'}
            </p>
          </div>

          {/* Action Toggle */}
          <div className="p-4 bg-slate-50 border-b border-slate-200">
            <div className="flex gap-2">
              <button
                onClick={() => setAction('checkin')}
                className={`flex-1 py-2 px-4 rounded-lg font-semibold transition-all ${
                  action === 'checkin'
                    ? 'bg-emerald-600 text-white shadow-md'
                    : 'bg-white text-slate-600 hover:bg-slate-100'
                }`}
              >
                <LogIn size={18} className="inline mr-2" />
                Check In
              </button>
              <button
                onClick={() => setAction('checkout')}
                className={`flex-1 py-2 px-4 rounded-lg font-semibold transition-all ${
                  action === 'checkout'
                    ? 'bg-rose-600 text-white shadow-md'
                    : 'bg-white text-slate-600 hover:bg-slate-100'
                }`}
              >
                <LogOut size={18} className="inline mr-2" />
                Check Out
              </button>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-8 space-y-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                <User size={16} className="inline mr-2" />
                Full Name <span className="text-rose-600">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.fullName}
                onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-rose-500 outline-none"
                placeholder="Enter your full name"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                <Phone size={16} className="inline mr-2" />
                Phone Number <span className="text-rose-600">*</span>
              </label>
              <input
                type="tel"
                required
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-rose-500 outline-none"
                placeholder="e.g., 0551234567"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                <Mail size={16} className="inline mr-2" />
                Email (Optional)
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-rose-500 outline-none"
                placeholder="your.email@example.com"
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className={`w-full py-4 rounded-lg font-bold text-white transition-all ${
                action === 'checkin'
                  ? 'bg-emerald-600 hover:bg-emerald-700'
                  : 'bg-rose-600 hover:bg-rose-700'
              } disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2`}
            >
              {isSubmitting ? (
                <>
                  <Clock className="animate-spin" size={20} />
                  Processing...
                </>
              ) : (
                <>
                  {action === 'checkin' ? <LogIn size={20} /> : <LogOut size={20} />}
                  {action === 'checkin' ? 'Check In' : 'Check Out'}
                </>
              )}
            </button>
          </form>

          {/* Info Box */}
          <div className="p-6 bg-blue-50 border-t border-blue-100">
            <div className="flex items-start gap-3">
              <CheckCircle className="text-blue-600 shrink-0 mt-0.5" size={20} />
              <div className="text-sm text-blue-800">
                <p className="font-semibold mb-1">Quick Check-In Process</p>
                <ul className="list-disc list-inside space-y-1 text-blue-700">
                  <li>Enter your name and phone number</li>
                  <li>Click Check In when you arrive</li>
                  <li>Click Check Out when you leave</li>
                  <li>Your visit is automatically recorded</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CheckIn;

