
export enum UserRole {
  PUBLIC = 'PUBLIC',
  STAFF = 'STAFF',
  SUPER_ADMIN = 'SUPER_ADMIN'
}

export enum Privilege {
  // Member Management
  MANAGE_MEMBERS = 'MANAGE_MEMBERS',
  DELETE_MEMBERS = 'DELETE_MEMBERS',
  
  // Payment Management
  MANAGE_PAYMENTS = 'MANAGE_PAYMENTS',
  CONFIRM_PAYMENTS = 'CONFIRM_PAYMENTS',
  
  // Content Management
  MANAGE_ANNOUNCEMENTS = 'MANAGE_ANNOUNCEMENTS',
  
  // System Access
  VIEW_ACTIVITY_LOGS = 'VIEW_ACTIVITY_LOGS',
  VIEW_ALL_ATTENDANCE = 'VIEW_ALL_ATTENDANCE',
  MANAGE_STAFF = 'MANAGE_STAFF',
  MANAGE_PRIVILEGES = 'MANAGE_PRIVILEGES',
  
  // Analytics
  VIEW_REVENUE_ANALYTICS = 'VIEW_REVENUE_ANALYTICS',
  VIEW_TEAM_MONITORING = 'VIEW_TEAM_MONITORING'
}

export enum SubscriptionPlan {
  MONTHLY = 'Monthly',
  TWO_WEEKS = '2 Weeks',
  ONE_WEEK = '1 Week',
  DAY_MORNING = 'Day Morning',
  DAY_EVENING = 'Day Evening',
  // Legacy plans for backward compatibility
  BASIC = 'Basic',
  PREMIUM = 'Premium',
  VIP = 'VIP'
}

export enum PaymentMethod {
  CASH = 'Cash',
  MOMO = 'Mobile Money'
}

export enum PaymentStatus {
  PENDING = 'Pending',
  CONFIRMED = 'Confirmed',
  REJECTED = 'Rejected'
}

export interface Member {
  id: string;
  fullName: string;
  email?: string; // Optional - members can be registered without email
  phone: string;
  address?: string;
  emergencyContact?: string;
  plan: SubscriptionPlan;
  startDate: string;
  expiryDate: string;
  status: 'active' | 'expiring' | 'expired';
  photo?: string; // Base64 encoded image or URL
  createdAt?: string; // Date when member was added to the system
}

export interface PasswordHistoryEntry {
  password: string;
  changedAt: string;
}

export interface StaffMember {
  id: string;
  fullName: string;
  email: string;
  role: UserRole;
  position: string;
  phone: string;
  avatar?: string;
  privileges?: Privilege[]; // Privileges assigned by Super Admin
  password?: string; // Current password (visible to admin)
  passwordHistory?: PasswordHistoryEntry[]; // History of old passwords
  createdAt?: string; // When staff member joined
}

export interface PaymentRecord {
  id: string;
  memberId: string;
  memberName: string;
  amount: number;
  date: string;
  method: PaymentMethod;
  status: PaymentStatus;
  confirmedBy?: string;
  transactionId?: string;
  momoPhone?: string;
  network?: string;
  // Fields for pending member registrations (from checkout)
  isPendingMember?: boolean;
  memberEmail?: string;
  memberPhone?: string;
  memberAddress?: string;
  memberPhoto?: string; // Photo for pending member registration
  memberPlan?: SubscriptionPlan;
  memberStartDate?: string;
  memberExpiryDate?: string;
}

export interface Announcement {
  id: string;
  title: string;
  content: string;
  date: string;
  priority: 'low' | 'medium' | 'high';
}

export interface GalleryImage {
  id: string;
  url: string;
  caption: string;
}

export interface ActivityLog {
  id: string;
  userRole: UserRole;
  userEmail: string;
  action: string;
  details: string;
  timestamp: string;
  category: 'access' | 'admin' | 'financial';
}

export interface AttendanceRecord {
  id: string;
  staffEmail: string;
  staffRole: UserRole;
  date: string;
  signInTime: string;
  signOutTime?: string;
}

export interface ClientCheckIn {
  id: string;
  fullName: string;
  phone: string;
  email?: string;
  checkInTime: string;
  checkOutTime?: string;
  date: string;
  notes?: string;
}

export interface GymEquipment {
  id: string;
  name: string;
  state: 'old' | 'new';
  condition: 'faulty' | 'non-faulty';
  created_at?: string;
  updated_at?: string;
}

export interface EquipmentPost {
  id: string;
  title: string;
  content: string;
  category: 'sales' | 'equipment';
  created_at?: string;
}

export interface MaintenanceLog {
  id: string;
  equipmentName: string;
  description: string;
  dateTime: string; // ISO date-time string
  staffName: string; // Name of staff who recorded the log
  staffEmail?: string; // Email of staff who recorded the log
  created_at?: string;
}

export interface Expense {
  id: string;
  itemName: string; // What was bought
  description?: string; // Optional description
  amount: number; // Cost of the item
  dateTime: string; // ISO date-time string
  staffName: string; // Name of staff who recorded the expense
  staffEmail?: string; // Email of staff who recorded the expense
  created_at?: string;
}

export interface AppState {
  userRole: UserRole;
  members: Member[];
  staff: StaffMember[];
  payments: PaymentRecord[];
  announcements: Announcement[];
  gallery: GalleryImage[];
  activityLogs: ActivityLog[];
  attendanceRecords: AttendanceRecord[];
}
