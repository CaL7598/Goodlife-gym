
import React from 'react';
import { Mail, Phone, MapPin, Clock } from 'lucide-react';

const Contact: React.FC = () => {
  return (
    <div className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-extrabold text-slate-900 mb-4 tracking-tight">Visit Us</h2>
          <p className="text-slate-600">Have questions? We are here to help you get started.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          <div className="space-y-8">
            <div className="flex gap-6 p-8 bg-slate-50 rounded-2xl border border-slate-100 transition-transform hover:-translate-y-1">
              <div className="w-12 h-12 bg-rose-600 text-white rounded-xl flex items-center justify-center shrink-0">
                <MapPin size={24} />
              </div>
              <div>
                <h4 className="font-bold text-slate-900 text-lg mb-1">Our Location</h4>
                <p className="text-slate-500 text-sm">Sunyani Airport Road near Esbak Kitchen</p>
              </div>
            </div>

            <div className="flex gap-6 p-8 bg-slate-50 rounded-2xl border border-slate-100 transition-transform hover:-translate-y-1">
              <div className="w-12 h-12 bg-rose-600 text-white rounded-xl flex items-center justify-center shrink-0">
                <Phone size={24} />
              </div>
              <div className="flex-1">
                <h4 className="font-bold text-slate-900 text-lg mb-3">Contact Lines</h4>
                <div className="space-y-2 text-slate-700">
                  <p className="text-sm">
                    <a href="tel:+233551336976" className="text-rose-600 hover:text-rose-700">0551336976</a>
                  </p>
                  <p className="text-sm">
                    <a href="tel:+233246458898" className="text-rose-600 hover:text-rose-700">0246458898</a>
                  </p>
                  <p className="text-sm">
                    <a href="tel:+233243505882" className="text-rose-600 hover:text-rose-700">0243505882</a>
                  </p>
                  <p className="text-sm">
                    <a href="tel:+233556620810" className="text-rose-600 hover:text-rose-700">0556620810</a>
                  </p>
                  <p className="text-sm">
                    <a href="tel:+16477451003" className="text-rose-600 hover:text-rose-700">+1 647 745 1003</a>
                  </p>
                </div>
              </div>
            </div>

            <div className="flex gap-6 p-8 bg-slate-50 rounded-2xl border border-slate-100 transition-transform hover:-translate-y-1">
              <div className="w-12 h-12 bg-rose-600 text-white rounded-xl flex items-center justify-center shrink-0">
                <Mail size={24} />
              </div>
              <div>
                <h4 className="font-bold text-slate-900 text-lg mb-1">Email Address</h4>
                <p className="text-slate-500 text-sm">
                  <a href="mailto:goodlifeghana13@gmail.com" className="text-rose-600 hover:text-rose-700 hover:underline">goodlifeghana13@gmail.com</a>
                </p>
              </div>
            </div>
          </div>

          <div className="bg-slate-900 rounded-3xl p-10 text-white relative overflow-hidden">
            <h3 className="text-2xl font-bold mb-6">Operating Hours</h3>
            <div className="space-y-4 relative z-10">
              <div className="border-b border-slate-800 pb-3">
                <div className="font-semibold mb-2 text-rose-400">MONDAYS - FRIDAYS</div>
                <div className="flex flex-col gap-1 text-sm">
                  <div className="flex justify-between">
                    <span>Morning</span>
                    <span className="font-bold">5:00 AM - 11:00 AM</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Evening</span>
                    <span className="font-bold">4:00 PM - 8:00 PM</span>
                  </div>
                </div>
              </div>
              <div className="border-b border-slate-800 pb-3">
                <div className="font-semibold mb-2 text-rose-400">SATURDAYS</div>
                <div className="flex flex-col gap-1 text-sm">
                  <div className="flex justify-between">
                    <span>Morning</span>
                    <span className="font-bold">5:00 AM - 11:00 AM</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Evening</span>
                    <span className="font-bold">5:00 PM - 7:30 PM</span>
                  </div>
                </div>
              </div>
              <div className="pt-2">
                <div className="font-semibold mb-3 text-rose-400 flex items-center gap-2">
                  <Clock size={18} />
                  AEROBICS CLASSES
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Mondays</span>
                    <span className="font-bold">6:00 AM</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Wednesdays</span>
                    <span className="font-bold">6:00 AM</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Saturdays</span>
                    <span className="font-bold">6:00 AM</span>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="mt-8 p-6 bg-slate-800 rounded-2xl">
              <p className="text-sm text-slate-300">Join us for energizing aerobics classes to kickstart your fitness journey!</p>
            </div>
            
            <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-rose-600/20 rounded-full blur-3xl"></div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Contact;
