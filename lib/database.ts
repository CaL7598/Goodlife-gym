import { supabase } from './supabase';
import { 
  Member, 
  StaffMember, 
  PaymentRecord, 
  Announcement, 
  GalleryImage,
  ActivityLog,
  AttendanceRecord,
  ClientCheckIn,
  SubscriptionPlan,
  PaymentMethod,
  PaymentStatus,
  UserRole,
  Privilege
} from '../types';

// Helper function to check if Supabase is configured
function requireSupabase() {
  if (!supabase) {
    throw new Error('Supabase is not configured. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY environment variables.');
  }
  return supabase;
}

// Members
export const membersService = {
  async getAll(): Promise<Member[]> {
    const { data, error } = await requireSupabase()
      .from('members')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Error fetching members:', error);
      throw error;
    }
    
    return (data || []).map(mapMemberFromDB);
  },

  async getById(id: string): Promise<Member | null> {
    const { data, error } = await requireSupabase()
      .from('members')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) {
      console.error('Error fetching member:', error);
      return null;
    }
    
    return data ? mapMemberFromDB(data) : null;
  },

  async getByEmail(email: string): Promise<Member | null> {
    const { data, error } = await requireSupabase()
      .from('members')
      .select('*')
      .eq('email', email)
      .single();
    
    if (error) {
      // If no rows found, that's fine - member doesn't exist
      if (error.code === 'PGRST116') {
        return null;
      }
      console.error('Error fetching member by email:', error);
      return null;
    }
    
    return data ? mapMemberFromDB(data) : null;
  },

  async create(member: Omit<Member, 'id'>): Promise<Member> {
    const { data, error } = await requireSupabase()
      .from('members')
      .insert(mapMemberToDB(member))
      .select()
      .single();
    
    if (error) {
      console.error('Error creating member:', error);
      throw error;
    }
    
    return mapMemberFromDB(data);
  },

  async update(id: string, updates: Partial<Member>): Promise<Member> {
    const { data, error } = await requireSupabase()
      .from('members')
      .update({
        ...mapMemberToDB(updates as Member),
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();
    
    if (error) {
      console.error('Error updating member:', error);
      throw error;
    }
    
    return mapMemberFromDB(data);
  },

  async delete(id: string): Promise<void> {
    const { error } = await requireSupabase()
      .from('members')
      .delete()
      .eq('id', id);
    
    if (error) {
      console.error('Error deleting member:', error);
      throw error;
    }
  }
};

// Staff
export const staffService = {
  async getAll(): Promise<StaffMember[]> {
    const { data, error } = await supabase
      .from('staff')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Error fetching staff:', error);
      throw error;
    }
    
    return (data || []).map(mapStaffFromDB);
  },

  async getByEmail(email: string): Promise<StaffMember | null> {
    const { data, error } = await supabase
      .from('staff')
      .select('*')
      .eq('email', email)
      .single();
    
    if (error) {
      console.error('Error fetching staff:', error);
      return null;
    }
    
    return data ? mapStaffFromDB(data) : null;
  },

  async authenticate(email: string, password: string): Promise<StaffMember | null> {
    const { data, error } = await supabase
      .from('staff')
      .select('*')
      .eq('email', email)
      .eq('password', password)
      .single();
    
    if (error) {
      // Don't log error for invalid credentials (security best practice)
      if (error.code !== 'PGRST116') {
        console.error('Error authenticating staff:', error);
      }
      return null;
    }
    
    return data ? mapStaffFromDB(data) : null;
  },

  async update(id: string, updates: Partial<StaffMember>, retries: number = 3): Promise<StaffMember> {
    let lastError: any = null;
    
    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        const { data, error } = await supabase
          .from('staff')
          .update({
            ...mapStaffToDB(updates),
            updated_at: new Date().toISOString()
          })
          .eq('id', id)
          .select()
          .single();
        
        if (error) {
          lastError = error;
          console.warn(`⚠️ Attempt ${attempt}/${retries} failed:`, error);
          
          // If it's a network error and we have retries left, wait and retry
          if (attempt < retries && (error.message?.includes('fetch') || error.message?.includes('network'))) {
            await new Promise(resolve => setTimeout(resolve, 1000 * attempt)); // Exponential backoff
            continue;
          }
          
          throw error;
        }
        
        console.log(`✅ Staff updated successfully on attempt ${attempt}`);
        return mapStaffFromDB(data);
      } catch (error: any) {
        lastError = error;
        
        // If it's a network error and we have retries left, retry
        if (attempt < retries && (error.message?.includes('fetch') || error.message?.includes('network') || error.message?.includes('Failed to fetch'))) {
          console.warn(`⚠️ Network error on attempt ${attempt}, retrying...`);
          await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
          continue;
        }
        
        // If it's the last attempt or not a network error, throw
        if (attempt === retries) {
          console.error('❌ Error updating staff after all retries:', error);
          throw error;
        }
      }
    }
    
    throw lastError || new Error('Failed to update staff after retries');
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('staff')
      .delete()
      .eq('id', id);
    
    if (error) {
      console.error('Error deleting staff:', error);
      throw error;
    }
  },

  async deleteByEmail(email: string): Promise<void> {
    const { error } = await supabase
      .from('staff')
      .delete()
      .eq('email', email);
    
    if (error) {
      console.error('Error deleting staff by email:', error);
      throw error;
    }
  },

  async create(staffData: Partial<StaffMember> & { password: string }): Promise<StaffMember> {
    const dbData = mapStaffToDB(staffData);
    dbData.password = staffData.password; // Include password in database insert
    
    const { data, error } = await supabase
      .from('staff')
      .insert(dbData)
      .select()
      .single();
    
    if (error) {
      console.error('Error creating staff:', error);
      throw error;
    }
    
    return mapStaffFromDB(data);
  }
};

// Payments
export const paymentsService = {
  async getAll(): Promise<PaymentRecord[]> {
    const { data, error } = await supabase
      .from('payments')
      .select('*')
      .order('date', { ascending: false });
    
    if (error) {
      console.error('Error fetching payments:', error);
      throw error;
    }
    
    return (data || []).map(mapPaymentFromDB);
  },

  async create(payment: Omit<PaymentRecord, 'id'>): Promise<PaymentRecord> {
    const { data, error } = await supabase
      .from('payments')
      .insert(mapPaymentToDB(payment))
      .select()
      .single();
    
    if (error) {
      console.error('Error creating payment:', error);
      console.error('Payment data that failed:', JSON.stringify(mapPaymentToDB(payment), null, 2));
      // Check if error is about missing columns
      if (error.message && (error.message.includes('is_pending_member') || error.message.includes('column') || error.message.includes('does not exist'))) {
        const helpfulError = new Error(
          'Database schema is missing required columns. Please run the migration: MIGRATION_ADD_PENDING_MEMBER_FIELDS.sql in your Supabase SQL Editor.'
        );
        helpfulError.name = 'SCHEMA_MIGRATION_REQUIRED';
        throw helpfulError;
      }
      // Provide more detailed error information
      const detailedError = new Error(`Failed to create payment: ${error.message || JSON.stringify(error)}`);
      (detailedError as any).originalError = error;
      throw detailedError;
    }
    
    return mapPaymentFromDB(data);
  },

  async update(id: string, updates: Partial<PaymentRecord>): Promise<PaymentRecord> {
    const { data, error } = await supabase
      .from('payments')
      .update({
        ...mapPaymentToDB(updates as PaymentRecord),
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();
    
    if (error) {
      console.error('Error updating payment:', error);
      throw error;
    }
    
    return mapPaymentFromDB(data);
  }
};

// Announcements
export const announcementsService = {
  async getAll(): Promise<Announcement[]> {
    const { data, error } = await supabase
      .from('announcements')
      .select('*')
      .order('date', { ascending: false });
    
    if (error) {
      console.error('Error fetching announcements:', error);
      throw error;
    }
    
    return (data || []).map(mapAnnouncementFromDB);
  },

  async create(announcement: Omit<Announcement, 'id'>): Promise<Announcement> {
    const { data, error } = await supabase
      .from('announcements')
      .insert(mapAnnouncementToDB(announcement))
      .select()
      .single();
    
    if (error) {
      console.error('Error creating announcement:', error);
      throw error;
    }
    
    return mapAnnouncementFromDB(data);
  },

  async update(id: string, updates: Partial<Announcement>): Promise<Announcement> {
    const { data, error } = await supabase
      .from('announcements')
      .update({
        ...mapAnnouncementToDB(updates as Announcement),
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();
    
    if (error) {
      console.error('Error updating announcement:', error);
      throw error;
    }
    
    return mapAnnouncementFromDB(data);
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('announcements')
      .delete()
      .eq('id', id);
    
    if (error) {
      console.error('Error deleting announcement:', error);
      throw error;
    }
  }
};

// Gallery
export const galleryService = {
  async getAll(): Promise<GalleryImage[]> {
    const { data, error } = await supabase
      .from('gallery')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Error fetching gallery:', error);
      throw error;
    }
    
    return (data || []).map(mapGalleryFromDB);
  },

  async create(image: Omit<GalleryImage, 'id'>): Promise<GalleryImage> {
    const { data, error } = await supabase
      .from('gallery')
      .insert(mapGalleryToDB(image))
      .select()
      .single();
    
    if (error) {
      console.error('Error creating gallery image:', error);
      throw error;
    }
    
    return mapGalleryFromDB(data);
  },

  async update(id: string, updates: Partial<GalleryImage>): Promise<GalleryImage> {
    const { data, error } = await supabase
      .from('gallery')
      .update(mapGalleryToDB(updates as GalleryImage))
      .eq('id', id)
      .select()
      .single();
    
    if (error) {
      console.error('Error updating gallery image:', error);
      throw error;
    }
    
    return mapGalleryFromDB(data);
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('gallery')
      .delete()
      .eq('id', id);
    
    if (error) {
      console.error('Error deleting gallery image:', error);
      throw error;
    }
  }
};

// Activity Logs
export const activityLogsService = {
  async getAll(): Promise<ActivityLog[]> {
    const { data, error } = await supabase
      .from('activity_logs')
      .select('*')
      .order('timestamp', { ascending: false });
    
    if (error) {
      console.error('Error fetching activity logs:', error);
      throw error;
    }
    
    return (data || []).map(mapActivityLogFromDB);
  },

  async create(log: Omit<ActivityLog, 'id'>): Promise<ActivityLog> {
    const { data, error } = await supabase
      .from('activity_logs')
      .insert(mapActivityLogToDB(log))
      .select()
      .single();
    
    if (error) {
      console.error('Error creating activity log:', error);
      throw error;
    }
    
    return mapActivityLogFromDB(data);
  }
};

// Attendance Records
export const attendanceService = {
  async getAll(): Promise<AttendanceRecord[]> {
    const { data, error } = await supabase
      .from('attendance_records')
      .select('*')
      .order('date', { ascending: false });
    
    if (error) {
      console.error('Error fetching attendance records:', error);
      throw error;
    }
    
    return (data || []).map(mapAttendanceFromDB);
  },

  async create(record: Omit<AttendanceRecord, 'id'>): Promise<AttendanceRecord> {
    const { data, error } = await supabase
      .from('attendance_records')
      .insert(mapAttendanceToDB(record))
      .select()
      .single();
    
    if (error) {
      console.error('Error creating attendance record:', error);
      throw error;
    }
    
    return mapAttendanceFromDB(data);
  },

  async update(id: string, updates: Partial<AttendanceRecord>): Promise<AttendanceRecord> {
    const { data, error } = await supabase
      .from('attendance_records')
      .update(mapAttendanceToDB(updates as AttendanceRecord))
      .eq('id', id)
      .select()
      .single();
    
    if (error) {
      console.error('Error updating attendance record:', error);
      throw error;
    }
    
    return mapAttendanceFromDB(data);
  }
};

// Client Check-Ins
export const clientCheckInService = {
  async getAll(): Promise<ClientCheckIn[]> {
    const { data, error } = await supabase
      .from('client_checkins')
      .select('*')
      .order('check_in_time', { ascending: false });
    
    if (error) {
      console.error('Error fetching client check-ins:', error);
      throw error;
    }
    
    return (data || []).map(mapClientCheckInFromDB);
  },

  async create(checkIn: Omit<ClientCheckIn, 'id'>): Promise<ClientCheckIn> {
    const { data, error } = await supabase
      .from('client_checkins')
      .insert(mapClientCheckInToDB(checkIn))
      .select()
      .single();
    
    if (error) {
      console.error('Error creating client check-in:', error);
      throw error;
    }
    
    return mapClientCheckInFromDB(data);
  },

  async update(id: string, updates: Partial<ClientCheckIn>): Promise<ClientCheckIn> {
    const { data, error } = await supabase
      .from('client_checkins')
      .update(mapClientCheckInToDB(updates as ClientCheckIn))
      .eq('id', id)
      .select()
      .single();
    
    if (error) {
      console.error('Error updating client check-in:', error);
      throw error;
    }
    
    return mapClientCheckInFromDB(data);
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('client_checkins')
      .delete()
      .eq('id', id);
    
    if (error) {
      console.error('Error deleting client check-in:', error);
      throw error;
    }
  }
};

// Mapper functions to convert between DB format and app format
function mapMemberFromDB(db: any): Member {
  return {
    id: db.id,
    fullName: db.full_name,
    email: db.email,
    phone: db.phone,
    address: db.address,
    emergencyContact: db.emergency_contact,
    plan: db.plan as SubscriptionPlan,
    startDate: db.start_date,
    expiryDate: db.expiry_date,
    status: db.status,
    photo: db.photo
  };
}

function mapMemberToDB(member: Partial<Member>): any {
  const db: any = {};
  if (member.fullName !== undefined) db.full_name = member.fullName;
  if (member.email !== undefined) db.email = member.email;
  if (member.phone !== undefined) db.phone = member.phone;
  if (member.address !== undefined) db.address = member.address;
  if (member.emergencyContact !== undefined) db.emergency_contact = member.emergencyContact;
  if (member.plan !== undefined) db.plan = member.plan;
  if (member.startDate !== undefined) db.start_date = member.startDate;
  if (member.expiryDate !== undefined) db.expiry_date = member.expiryDate;
  if (member.status !== undefined) db.status = member.status;
  if (member.photo !== undefined) db.photo = member.photo;
  return db;
}

function mapStaffFromDB(db: any): StaffMember {
  let privileges: Privilege[] | undefined = undefined;
  
  if (db.privileges) {
    try {
      const parsed = JSON.parse(db.privileges);
      
      // Ensure it's an array and not empty, and cast to Privilege enum
      if (Array.isArray(parsed) && parsed.length > 0) {
        // Validate and cast each privilege to ensure they're valid enum values
        const validPrivileges = parsed
          .filter((p): p is Privilege => {
            const isValid = typeof p === 'string' && Object.values(Privilege).includes(p as Privilege);
            if (!isValid) {
              console.warn('⚠️ Invalid privilege filtered out:', p, 'for staff:', db.email);
            }
            return isValid;
          })
          .map(p => p as Privilege);
        
        privileges = validPrivileges;
        
        // Log if any privileges were filtered out
        if (parsed.length !== privileges.length) {
          console.warn('⚠️ Some invalid privileges were filtered out for', db.email, ':', {
            original: parsed,
            valid: privileges,
            filteredCount: parsed.length - privileges.length
          });
        }
        
        // Log successful privilege mapping for debugging
        if (privileges.length > 0) {
          console.log('✅ Loaded privileges for', db.email, ':', privileges);
        }
      }
    } catch (error) {
      console.error('❌ Error parsing privileges for', db.email, ':', error, {
        rawValue: db.privileges
      });
      privileges = undefined;
    }
  }
  
  return {
    id: db.id,
    fullName: db.full_name,
    email: db.email,
    role: db.role as UserRole,
    position: db.position,
    phone: db.phone,
    avatar: db.avatar,
    privileges
  };
}

function mapStaffToDB(staff: Partial<StaffMember> & { password?: string }): any {
  const db: any = {};
  if (staff.fullName !== undefined) db.full_name = staff.fullName;
  if (staff.email !== undefined) db.email = staff.email;
  if (staff.role !== undefined) db.role = staff.role;
  if (staff.position !== undefined) db.position = staff.position;
  if (staff.phone !== undefined) db.phone = staff.phone;
  if (staff.avatar !== undefined) db.avatar = staff.avatar;
  if (staff.password !== undefined) db.password = staff.password;
  if (staff.privileges !== undefined) {
    // Only save if it's a non-empty array, otherwise save as null
    if (Array.isArray(staff.privileges) && staff.privileges.length > 0) {
      const privilegesToSave = staff.privileges.map(p => String(p));
      db.privileges = JSON.stringify(privilegesToSave);
      console.log('💾 Mapping privileges to DB:', {
        original: staff.privileges,
        stringified: db.privileges,
        count: staff.privileges.length
      });
    } else {
      db.privileges = null;
      console.log('💾 No privileges to save (empty or null)');
    }
  }
  return db;
}

function mapPaymentFromDB(db: any): PaymentRecord {
  return {
    id: db.id,
    memberId: db.member_id || '',
    memberName: db.member_name,
    amount: db.amount,
    date: db.date,
    method: db.method as PaymentMethod,
    status: db.status as PaymentStatus,
    confirmedBy: db.confirmed_by,
    transactionId: db.transaction_id,
    momoPhone: db.momo_phone,
    network: db.network,
    // Pending member fields
    isPendingMember: db.is_pending_member || false,
    memberEmail: db.member_email,
    memberPhone: db.member_phone,
    memberAddress: db.member_address,
    memberPhoto: db.member_photo,
    memberPlan: db.member_plan,
    memberStartDate: db.member_start_date,
    memberExpiryDate: db.member_expiry_date
  };
}

function mapPaymentToDB(payment: Partial<PaymentRecord>): any {
  const db: any = {};
  // Handle memberId - convert empty string to null, or use null if undefined for pending members
  if (payment.memberId !== undefined) {
    db.member_id = (payment.memberId === '' || payment.memberId === null) ? null : payment.memberId;
  }
  if (payment.memberName !== undefined) db.member_name = payment.memberName;
  if (payment.amount !== undefined) db.amount = payment.amount;
  if (payment.date !== undefined) db.date = payment.date;
  if (payment.method !== undefined) db.method = payment.method;
  if (payment.status !== undefined) db.status = payment.status;
  if (payment.confirmedBy !== undefined) db.confirmed_by = payment.confirmedBy;
  if (payment.transactionId !== undefined) db.transaction_id = payment.transactionId;
  if (payment.momoPhone !== undefined) db.momo_phone = payment.momoPhone;
  if (payment.network !== undefined) db.network = payment.network;
  // Pending member fields - only include if they have actual values (not undefined)
  if (payment.isPendingMember !== undefined && payment.isPendingMember !== null) {
    db.is_pending_member = payment.isPendingMember;
  }
  if (payment.memberEmail !== undefined && payment.memberEmail !== null && payment.memberEmail !== '') {
    db.member_email = payment.memberEmail;
  }
  if (payment.memberPhone !== undefined && payment.memberPhone !== null && payment.memberPhone !== '') {
    db.member_phone = payment.memberPhone;
  }
  if (payment.memberAddress !== undefined && payment.memberAddress !== null && payment.memberAddress !== '') {
    db.member_address = payment.memberAddress;
  }
  if (payment.memberPhoto !== undefined && payment.memberPhoto !== null && payment.memberPhoto !== '') {
    db.member_photo = payment.memberPhoto;
  }
  if (payment.memberPlan !== undefined && payment.memberPlan !== null) {
    db.member_plan = payment.memberPlan;
  }
  if (payment.memberStartDate !== undefined && payment.memberStartDate !== null && payment.memberStartDate !== '') {
    db.member_start_date = payment.memberStartDate;
  }
  if (payment.memberExpiryDate !== undefined && payment.memberExpiryDate !== null && payment.memberExpiryDate !== '') {
    db.member_expiry_date = payment.memberExpiryDate;
  }
  return db;
}

function mapAnnouncementFromDB(db: any): Announcement {
  return {
    id: db.id,
    title: db.title,
    content: db.content,
    date: db.date,
    priority: db.priority
  };
}

function mapAnnouncementToDB(announcement: Partial<Announcement>): any {
  const db: any = {};
  if (announcement.title !== undefined) db.title = announcement.title;
  if (announcement.content !== undefined) db.content = announcement.content;
  if (announcement.date !== undefined) db.date = announcement.date;
  if (announcement.priority !== undefined) db.priority = announcement.priority;
  return db;
}

function mapGalleryFromDB(db: any): GalleryImage {
  return {
    id: db.id,
    url: db.url,
    caption: db.caption
  };
}

function mapGalleryToDB(image: Partial<GalleryImage>): any {
  const db: any = {};
  if (image.url !== undefined) db.url = image.url;
  if (image.caption !== undefined) db.caption = image.caption;
  return db;
}

function mapActivityLogFromDB(db: any): ActivityLog {
  return {
    id: db.id,
    userRole: db.user_role as UserRole,
    userEmail: db.user_email,
    action: db.action,
    details: db.details,
    timestamp: db.timestamp,
    category: db.category
  };
}

function mapActivityLogToDB(log: Partial<ActivityLog>): any {
  const db: any = {};
  if (log.userRole !== undefined) db.user_role = log.userRole;
  if (log.userEmail !== undefined) db.user_email = log.userEmail;
  if (log.action !== undefined) db.action = log.action;
  if (log.details !== undefined) db.details = log.details;
  if (log.timestamp !== undefined) db.timestamp = log.timestamp;
  if (log.category !== undefined) db.category = log.category;
  return db;
}

function mapAttendanceFromDB(db: any): AttendanceRecord {
  return {
    id: db.id,
    staffEmail: db.staff_email,
    staffRole: db.staff_role as UserRole,
    date: db.date,
    signInTime: db.sign_in_time,
    signOutTime: db.sign_out_time
  };
}

function mapAttendanceToDB(record: Partial<AttendanceRecord>): any {
  const db: any = {};
  if (record.staffEmail !== undefined) db.staff_email = record.staffEmail;
  if (record.staffRole !== undefined) db.staff_role = record.staffRole;
  if (record.date !== undefined) db.date = record.date;
  if (record.signInTime !== undefined) db.sign_in_time = record.signInTime;
  if (record.signOutTime !== undefined) db.sign_out_time = record.signOutTime;
  return db;
}

function mapClientCheckInFromDB(db: any): ClientCheckIn {
  return {
    id: db.id,
    fullName: db.full_name,
    phone: db.phone,
    email: db.email,
    checkInTime: db.check_in_time,
    checkOutTime: db.check_out_time,
    date: db.date,
    notes: db.notes
  };
}

function mapClientCheckInToDB(checkIn: Partial<ClientCheckIn>): any {
  const db: any = {};
  if (checkIn.fullName !== undefined) db.full_name = checkIn.fullName;
  if (checkIn.phone !== undefined) db.phone = checkIn.phone;
  if (checkIn.email !== undefined) db.email = checkIn.email;
  if (checkIn.checkInTime !== undefined) db.check_in_time = checkIn.checkInTime;
  if (checkIn.checkOutTime !== undefined) db.check_out_time = checkIn.checkOutTime;
  if (checkIn.date !== undefined) db.date = checkIn.date;
  if (checkIn.notes !== undefined) db.notes = checkIn.notes;
  return db;
}

