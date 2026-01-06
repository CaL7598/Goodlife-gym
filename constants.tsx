
import React from 'react';
import { 
  LayoutDashboard, 
  Users, 
  CreditCard, 
  MessageSquare, 
  Settings, 
  Image as ImageIcon, 
  Bell, 
  LogOut,
  ShieldCheck,
  UserCircle,
  History,
  Clock,
  LogIn
} from 'lucide-react';
import { UserRole } from './types';

export const COLORS = {
  primary: '#e11d48', // rose-600
  secondary: '#1e293b', // slate-800
  accent: '#fbbf24', // amber-400
};

export const NAVIGATION_ITEMS = [
  { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard size={20} />, roles: [UserRole.STAFF, UserRole.SUPER_ADMIN] },
  { id: 'members', label: 'Members', icon: <Users size={20} />, roles: [UserRole.STAFF, UserRole.SUPER_ADMIN] },
  { id: 'subscriptions', label: 'Subscriptions', icon: <Bell size={20} />, roles: [UserRole.STAFF, UserRole.SUPER_ADMIN] },
  { id: 'payments', label: 'Payments', icon: <CreditCard size={20} />, roles: [UserRole.STAFF, UserRole.SUPER_ADMIN] },
  { id: 'attendance', label: 'Attendance', icon: <Clock size={20} />, roles: [UserRole.STAFF, UserRole.SUPER_ADMIN] },
  { id: 'checkins', label: 'Client Check-Ins', icon: <LogIn size={20} />, roles: [UserRole.STAFF, UserRole.SUPER_ADMIN] },
  { id: 'communications', label: 'Comms', icon: <MessageSquare size={20} />, roles: [UserRole.STAFF, UserRole.SUPER_ADMIN] },
  { id: 'activity-logs', label: 'Activity Logs', icon: <History size={20} />, roles: [UserRole.SUPER_ADMIN] },
  { id: 'content', label: 'Website CMS', icon: <ImageIcon size={20} />, roles: [UserRole.SUPER_ADMIN] },
  { id: 'settings', label: 'Settings', icon: <Settings size={20} />, roles: [UserRole.SUPER_ADMIN] },
];

export const INITIAL_STAFF = [
  { id: 's1', fullName: 'Kwame Admin', email: 'admin@goodlife.com', role: UserRole.SUPER_ADMIN, position: 'Owner / Manager', phone: '0244000111' },
  { id: 's2', fullName: 'Amara Staff', email: 'staff@goodlife.com', role: UserRole.STAFF, position: 'Front Desk Officer', phone: '0244222333' },
  { id: 's3', fullName: 'Kojo Trainer', email: 'kojo@goodlife.com', role: UserRole.STAFF, position: 'Head Fitness Coach', phone: '0244333444' },
];

export const INITIAL_MEMBERS = [
  { id: '1', fullName: 'John Doe', email: 'john@example.com', phone: '0244123456', plan: 'Premium', startDate: '2023-10-01', expiryDate: '2024-10-01', status: 'active' },
  { id: '2', fullName: 'Jane Smith', email: 'jane@example.com', phone: '0200987654', plan: 'Basic', startDate: '2024-01-15', expiryDate: '2024-05-15', status: 'expiring' },
  { id: '3', fullName: 'Kwame Mensah', email: 'kwame@example.com', phone: '0555112233', plan: 'VIP', startDate: '2023-05-01', expiryDate: '2024-05-01', status: 'expired' },
];

export const INITIAL_PAYMENTS = [
  { id: 'pay1', memberId: '1', memberName: 'John Doe', amount: 1200, date: '2023-10-01', method: 'Cash', status: 'Confirmed', confirmedBy: 'Admin' },
  { id: 'pay2', memberId: '2', memberName: 'Jane Smith', amount: 400, date: '2024-01-15', method: 'Mobile Money', status: 'Confirmed', confirmedBy: 'StaffA', transactionId: 'TX100234', momoPhone: '0200987654', network: 'Telecel' },
  { id: 'pay3', memberId: '3', memberName: 'Kwame Mensah', amount: 2000, date: '2023-05-01', method: 'Mobile Money', status: 'Confirmed', confirmedBy: 'Admin', transactionId: 'TX100889', momoPhone: '0555112233', network: 'MTN' },
];

export const INITIAL_ANNOUNCEMENTS = [
  { id: 'ann1', title: 'Easter Gym Hours', content: 'The gym will be closed on Good Friday and Easter Monday.', date: '2024-03-20', priority: 'medium' },
  { id: 'ann2', title: 'New Yoga Classes', content: 'Starting April 1st, we are introducing morning Yoga sessions at 6:00 AM.', date: '2024-03-25', priority: 'low' },
];

export const INITIAL_GALLERY = [
  { id: 'img1', url: 'https://picsum.photos/800/600?random=1', caption: 'State of the art cardio zone' },
  { id: 'img2', url: 'https://picsum.photos/800/600?random=2', caption: 'Heavy weight lifting area' },
  { id: 'img3', url: 'https://picsum.photos/800/600?random=3', caption: 'Spinning class studio' },
];

// Mobile Money Payment Configuration
export const MOBILE_MONEY_NUMBER = '0551336976'; // Main mobile money number for payments