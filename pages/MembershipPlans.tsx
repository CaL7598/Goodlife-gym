
import React from 'react';
import { Check, ArrowRight } from 'lucide-react';
import { SubscriptionPlan } from '../types';

interface MembershipPlansProps {
  setCurrentPage: (page: string) => void;
  selectedPlan?: {
    name: SubscriptionPlan;
    price: string;
    period: string;
  } | null;
  onPlanSelect?: (plan: { name: SubscriptionPlan; price: string; period: string }) => void;
}

const MembershipPlans: React.FC<MembershipPlansProps> = ({ setCurrentPage, selectedPlan, onPlanSelect }) => {
  const plans = [
    {
      name: 'Monthly',
      price: '140',
      period: 'Month',
      registrationFee: '100',
      features: ['Full gym access', 'All equipment access', 'Group classes included', 'Locker access'],
      color: 'rose',
      recommended: true
    },
    {
      name: '2 Weeks',
      price: '100',
      period: '2 Weeks',
      registrationFee: '100',
      features: ['Full gym access', 'All equipment access', 'Group classes included', 'Locker access'],
      color: 'slate',
      recommended: false
    },
    {
      name: '1 Week',
      price: '70',
      period: 'Week',
      registrationFee: '100',
      features: ['Full gym access', 'All equipment access', 'Group classes included', 'Locker access'],
      color: 'slate',
      recommended: false
    },
    {
      name: 'Day Morning',
      price: '25',
      period: 'Day',
      registrationFee: '0',
      features: ['Morning workout access', 'All equipment access', '5:00 AM - 11:00 AM'],
      color: 'slate',
      recommended: false
    },
    {
      name: 'Day Evening',
      price: '25',
      period: 'Day',
      registrationFee: '0',
      features: ['Evening workout access', 'All equipment access', '4:00 PM - 8:00 PM'],
      color: 'slate',
      recommended: false
    }
  ];

  return (
    <div className="py-20 bg-slate-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-slate-900 mb-4">Choose Your Plan</h2>
          <p className="text-slate-600">Flexible options tailored to your fitness lifestyle.</p>
          <p className="text-sm text-slate-500 mt-2">Registration Fee: <span className="font-bold text-rose-600">₵100</span> (one-time, not applicable for day passes)</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 sm:gap-6 lg:gap-8">
          {plans.map((plan) => (
            <div 
              key={plan.name} 
              className={`relative bg-white rounded-2xl shadow-lg overflow-hidden flex flex-col ${
                plan.recommended ? 'border-2 border-rose-500 lg:scale-105 z-10' : 'border border-slate-200'
              }`}
            >
              {plan.recommended && (
                <div className="bg-rose-500 text-white text-xs font-bold uppercase tracking-widest text-center py-1">
                  Most Popular
                </div>
              )}
              <div className="p-4 sm:p-6 lg:p-8">
                <h3 className="text-xl sm:text-2xl font-bold text-slate-900 mb-2">{plan.name}</h3>
                <div className="flex items-baseline mb-2">
                  <span className="text-3xl sm:text-4xl font-bold">₵{plan.price}</span>
                  <span className="text-slate-500 ml-1 text-sm sm:text-base">/{plan.period}</span>
                </div>
                {plan.registrationFee !== '0' && (
                  <p className="text-sm text-slate-500 mb-4">
                    + Registration: <span className="font-semibold text-rose-600">₵{plan.registrationFee}</span>
                  </p>
                )}
                <ul className="space-y-4 mb-8">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-3 text-slate-600 text-sm">
                      <Check className="text-rose-500 shrink-0" size={18} />
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="p-8 mt-auto border-t border-slate-100 bg-slate-50">
                <button 
                  onClick={() => {
                    const planData = {
                      name: plan.name as SubscriptionPlan,
                      price: plan.price,
                      period: plan.period
                    };
                    if (onPlanSelect) {
                      onPlanSelect(planData);
                    } else if (setCurrentPage) {
                      // Store selected plan in sessionStorage and navigate to checkout
                      sessionStorage.setItem('selectedPlan', JSON.stringify(planData));
                      setCurrentPage('checkout');
                    }
                  }}
                  className={`w-full py-3 rounded-lg font-bold transition-colors flex items-center justify-center gap-2 ${
                    plan.recommended 
                      ? 'bg-rose-600 text-white hover:bg-rose-700' 
                      : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
                  }`}
                >
                  Select {plan.name}
                  <ArrowRight size={18} />
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-16 text-center text-slate-500 text-sm">
          * Corporate discounts available for teams of 5 or more. Contact us for details.
        </div>
      </div>
    </div>
  );
};

export default MembershipPlans;
