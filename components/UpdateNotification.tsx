import React, { useState, useEffect } from 'react';
import { Bell, X, AlertCircle, CheckCircle, Info } from 'lucide-react';
import { Announcement } from '../types';

interface UpdateNotificationProps {
  announcements: Announcement[];
  lastCheckedTimestamp: string | null;
  onDismiss: () => void;
}

const UpdateNotification: React.FC<UpdateNotificationProps> = ({ 
  announcements, 
  lastCheckedTimestamp,
  onDismiss 
}) => {
  const [newAnnouncements, setNewAnnouncements] = useState<Announcement[]>([]);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (!lastCheckedTimestamp || announcements.length === 0) {
      return;
    }

    // Find announcements created after the last check
    const lastChecked = new Date(lastCheckedTimestamp);
    const newOnes = announcements.filter(ann => {
      const annDate = new Date(ann.date);
      return annDate > lastChecked;
    });

    if (newOnes.length > 0) {
      setNewAnnouncements(newOnes);
      setIsVisible(true);
    }
  }, [announcements, lastCheckedTimestamp]);

  if (!isVisible || newAnnouncements.length === 0) {
    return null;
  }

  const handleDismiss = () => {
    setIsVisible(false);
    onDismiss();
  };

  return (
    <div className="fixed top-4 right-4 z-50 max-w-md animate-in slide-in-from-top-5 fade-in duration-300">
      <div className="bg-white rounded-xl shadow-2xl border-2 border-rose-500 overflow-hidden">
        <div className="bg-gradient-to-r from-rose-600 to-rose-500 p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-white/20 rounded-full p-2">
              <Bell className="text-white" size={20} />
            </div>
            <div>
              <h3 className="text-white font-bold text-sm">
                {newAnnouncements.length} New Update{newAnnouncements.length > 1 ? 's' : ''}
              </h3>
              <p className="text-rose-100 text-xs">New announcements available</p>
            </div>
          </div>
          <button
            onClick={handleDismiss}
            className="text-white hover:bg-white/20 rounded-full p-1 transition-colors"
          >
            <X size={18} />
          </button>
        </div>
        
        <div className="p-4 space-y-2 max-h-64 overflow-y-auto">
          {newAnnouncements.map((ann) => (
            <div 
              key={ann.id} 
              className="p-3 bg-slate-50 rounded-lg border border-slate-200 hover:bg-slate-100 transition-colors"
            >
              <div className="flex items-start gap-2">
                {ann.priority === 'high' ? (
                  <AlertCircle className="text-rose-600 shrink-0 mt-0.5" size={16} />
                ) : (
                  <Info className="text-blue-600 shrink-0 mt-0.5" size={16} />
                )}
                <div className="flex-1 min-w-0">
                  <h4 className="font-bold text-slate-900 text-sm truncate">{ann.title}</h4>
                  <p className="text-xs text-slate-600 mt-1 line-clamp-2">{ann.content}</p>
                  <span className="text-[10px] text-slate-400 mt-1 block">{ann.date}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
        
        <div className="px-4 py-3 bg-slate-50 border-t border-slate-200">
          <button
            onClick={handleDismiss}
            className="w-full py-2 bg-rose-600 text-white text-sm font-bold rounded-lg hover:bg-rose-700 transition-colors"
          >
            Got it, thanks!
          </button>
        </div>
      </div>
    </div>
  );
};

export default UpdateNotification;

