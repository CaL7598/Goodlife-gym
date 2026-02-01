
import React, { useState, useEffect, useCallback } from 'react';
import { Member, UserRole, SubscriptionPlan } from '../types';
import { Search, Plus, Edit2, Trash2, Filter, ChevronLeft, ChevronRight, X, Upload, AlertCircle, CheckCircle2, Image as ImageIcon, User } from 'lucide-react';
import { sendWelcomeEmail } from '../lib/emailService';
import { membersService } from '../lib/database';
import { resizeImageForUpload } from '../lib/imageUtils';
import { useToast } from '../contexts/ToastContext';
import ConfirmModal from '../components/ConfirmModal';
import { calculateExpiryDate } from '../lib/dateUtils';

interface MemberManagerProps {
  members: Member[];
  setMembers: React.Dispatch<React.SetStateAction<Member[]>>;
  role: UserRole;
  logActivity: (action: string, details: string, category: 'access' | 'admin' | 'financial') => void;
}

const MemberManager: React.FC<MemberManagerProps> = ({ members, setMembers, role, logActivity }) => {
  const { showSuccess, showError, showWarning } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showAddExistingModal, setShowAddExistingModal] = useState(false);
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    message: string;
    onConfirm: () => void;
  } | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingMember, setEditingMember] = useState<Member | null>(null);
  const [editPhotoPreview, setEditPhotoPreview] = useState<string | null>(null);
  const [showBulkImportModal, setShowBulkImportModal] = useState(false);
  const [bulkData, setBulkData] = useState('');
  const [bulkImportMode, setBulkImportMode] = useState<'csv' | 'json'>('csv');
  const [isImporting, setIsImporting] = useState(false);
  const [importResults, setImportResults] = useState<{ success: number; failed: number; errors: string[] } | null>(null);
  const [skipWelcomeEmails, setSkipWelcomeEmails] = useState(true);
  const [newMember, setNewMember] = useState<Partial<Member>>({
    fullName: '',
    email: '',
    phone: '',
    plan: SubscriptionPlan.MONTHLY,
    status: 'active'
  });
  const [existingMember, setExistingMember] = useState<Partial<Member>>({
    fullName: '',
    email: '',
    phone: '',
    plan: SubscriptionPlan.MONTHLY,
    startDate: '',
    expiryDate: ''
  });
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [existingPhotoPreview, setExistingPhotoPreview] = useState<string | null>(null);
  const [registrationFee, setRegistrationFee] = useState<number>(0);

  // Pagination state
  const PAGE_SIZE = 25;
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMorePages, setHasMorePages] = useState(false);
  const [displayMembers, setDisplayMembers] = useState<Member[]>([]);
  const [listLoading, setListLoading] = useState(false);
  const [isSearchMode, setIsSearchMode] = useState(false);

  // Clear form fields on component mount (page refresh)
  useEffect(() => {
    setSearchTerm('');
    setBulkData('');
              setNewMember({
                fullName: '',
                email: '',
                phone: '',
                plan: SubscriptionPlan.MONTHLY,
                status: 'active'
              });
              setRegistrationFee(0);
    setPhotoPreview(null);
  }, []);

  // Handle photo upload
  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        showError('Please select an image file');
        return;
      }
      
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        showError('Image size must be less than 5MB');
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        setPhotoPreview(base64String);
        setNewMember({ ...newMember, photo: base64String });
      };
      reader.readAsDataURL(file);
    }
  };

  // Handle photo upload for existing members (resizes before base64)
  const handleExistingPhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      showError('Please select an image file');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      showError('Image size must be less than 5MB');
      return;
    }
    try {
      const base64String = await resizeImageForUpload(file);
      setExistingPhotoPreview(base64String);
      setExistingMember(prev => ({ ...prev, photo: base64String }));
    } catch {
      showError('Failed to process image. Please try another file.');
    }
  };

  const handleRemovePhoto = () => {
    setPhotoPreview(null);
    setNewMember(prev => ({ ...prev, photo: undefined }));
  };

  // Handle edit member
  const handleEditClick = (member: Member) => {
    setEditingMember(member);
    setEditPhotoPreview(member.photo || null);
    setShowEditModal(true);
  };

  // Handle edit photo upload (resizes before base64)
  const handleEditPhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      showError('Please select an image file');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      showError('Image size must be less than 5MB');
      return;
    }
    try {
      const base64String = await resizeImageForUpload(file);
      setEditPhotoPreview(base64String);
      if (editingMember) {
        setEditingMember({ ...editingMember, photo: base64String });
      }
    } catch {
      showError('Failed to process image. Please try another file.');
    }
  };

  const handleRemoveEditPhoto = () => {
    setEditPhotoPreview(null);
    if (editingMember) {
      setEditingMember({ ...editingMember, photo: undefined });
    }
  };

  // Handle save edited member
  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingMember) return;

    // Validate photo is required (if staff, they must upload photo; if admin editing, photo must exist)
    if (role === UserRole.STAFF && !editingMember.photo) {
      showWarning('Photo is required. Please upload a member photo.');
      return;
    }
    if (role === UserRole.SUPER_ADMIN && !editingMember.photo) {
      showWarning('Photo is required. Please upload a member photo to complete the update.');
      return;
    }

    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

      if (supabaseUrl && supabaseKey) {
        // If staff, only update photo
        if (role === UserRole.STAFF) {
          await membersService.update(editingMember.id, {
            photo: editingMember.photo
          });
          logActivity('Update Member Photo', `Updated photo for ${editingMember.fullName}`, 'admin');
        } else {
          // If admin, update all fields
          await membersService.update(editingMember.id, {
            fullName: editingMember.fullName,
            email: editingMember.email,
            phone: editingMember.phone,
            address: editingMember.address,
            emergencyContact: editingMember.emergencyContact,
            plan: editingMember.plan,
            photo: editingMember.photo,
            status: editingMember.status
          });
          logActivity('Update Member', `Updated information for ${editingMember.fullName}`, 'admin');
        }
      }

      // Update local state
      setMembers(prev => prev.map(m => m.id === editingMember.id ? editingMember : m));
      if (searchTerm.trim()) {
        void loadSearch(searchTerm);
      } else {
        membersService.getPaginated(PAGE_SIZE, (currentPage - 1) * PAGE_SIZE).then(({ data, hasMore }) => {
          setDisplayMembers(data);
          setHasMorePages(hasMore);
        }).catch(() => {});
      }
      setShowEditModal(false);
      setEditingMember(null);
      setEditPhotoPreview(null);
      showSuccess(role === UserRole.STAFF ? 'Photo updated successfully!' : 'Member information updated successfully!');
    } catch (error: any) {
      console.error('Error updating member:', error);
      showError(`Failed to update member: ${error.message || 'Please try again'}`);
    }
  };

  const filteredMembers = members.filter(m => 
    m.fullName.toLowerCase().includes(searchTerm.toLowerCase()) || 
    (m.email && m.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
    m.phone.includes(searchTerm)
  );

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate photo is required
    if (!newMember.photo) {
      showWarning('Photo is required. Please upload a member photo to complete registration.');
      return;
    }
    
    const now = new Date();
    // Get start date in local timezone to avoid UTC conversion issues
    const startDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    const expiryDate = calculateExpiryDate(newMember.plan, startDate);

    // Prepare member data (without id - will be generated by Supabase)
    const memberData: Omit<Member, 'id'> = {
      ...newMember as any,
      startDate,
      expiryDate,
      status: 'active',
      photo: newMember.photo // Ensure photo is included
    };

    let createdMember: Member;

    // Try to save to Supabase if configured
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
    
    if (supabaseUrl && supabaseKey) {
      try {
        // Check if member with this email already exists (only if email is provided)
        if (memberData.email && memberData.email.trim()) {
          const existingMember = await membersService.getByEmail(memberData.email);
          if (existingMember) {
            showError(`A member with email "${memberData.email}" already exists. Please use a different email address or edit the existing member.`);
            return;
          }
        }

        // Save to Supabase database
        createdMember = await membersService.create(memberData);
        console.log('✅ Member saved to Supabase:', createdMember.id);
        showSuccess(`Member ${createdMember.fullName} has been successfully registered!`);
      } catch (error: any) {
        console.error('❌ Error saving member to Supabase:', error);
        
        // Check for duplicate email error (PostgreSQL error code 23505) - only if email was provided
        if ((error?.code === '23505' || error?.message?.includes('duplicate key') || error?.message?.includes('members_email_key')) && memberData.email) {
          showError(`A member with email "${memberData.email}" already exists. Please use a different email address or edit the existing member.`);
          return;
        }
        
        // Show error to user - don't create local fallback as it won't persist
        const errorMessage = error?.message || 'Failed to save member to database';
        showError(`Failed to save member: ${errorMessage}. Please check your connection and try again.`);
        return; // Don't proceed with local state update
      }
    } else {
      // No Supabase configured, show warning
      showError('Database not configured. Please configure Supabase to save members permanently.');
      return; // Don't create local-only members as they won't persist
    }

    // Update local state
    setMembers(prev => [...prev, createdMember]);
    setCurrentPage(1);
    membersService.getPaginated(PAGE_SIZE, 0).then(({ data, hasMore }) => {
      setDisplayMembers(data);
      setHasMorePages(hasMore);
    }).catch(() => {});
    logActivity('Register Member', `Created profile for ${createdMember.fullName} (${createdMember.plan})`, 'admin');
    
    // Send welcome email
    if (createdMember.email) {
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
      } else {
        console.warn(`Failed to send welcome email to ${createdMember.email}`);
      }
    }
    
    setShowAddModal(false);
    setNewMember({ fullName: '', email: '', phone: '', plan: SubscriptionPlan.BASIC });
  };

  // Handle adding existing member with custom dates
  const handleAddExistingMember = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate photo is required
    if (!existingMember.photo) {
      showWarning('Photo is required. Please upload a member photo.');
      return;
    }

    // Validate dates are provided
    if (!existingMember.startDate || !existingMember.expiryDate) {
      showError('Please provide both registration date and expiry date for existing members.');
      return;
    }

    // Validate expiry date is after start date
    if (new Date(existingMember.expiryDate) <= new Date(existingMember.startDate)) {
      showError('Expiry date must be after registration date.');
      return;
    }

    // Prepare member data (without id - will be generated by Supabase)
    const memberData: Omit<Member, 'id'> = {
      ...existingMember as any,
      status: existingMember.status || 'active',
      photo: existingMember.photo
    };

    let createdMember: Member;

    // Try to save to Supabase if configured
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
    
    if (supabaseUrl && supabaseKey) {
      try {
        // Check if member with this email already exists (only if email is provided)
        if (memberData.email && memberData.email.trim()) {
          const existingMemberCheck = await membersService.getByEmail(memberData.email);
          if (existingMemberCheck) {
            showError(`A member with email "${memberData.email}" already exists. Please use a different email address.`);
            return;
          }
        }

        // Save to Supabase database
        createdMember = await membersService.create(memberData);
        console.log('✅ Existing member added to Supabase:', createdMember.id);
        showSuccess(`Member ${createdMember.fullName} has been successfully added with custom dates!`);
      } catch (error: any) {
        console.error('❌ Error saving existing member to Supabase:', error);
        
        // Check for duplicate email error - only if email was provided
        if ((error?.code === '23505' || error?.message?.includes('duplicate key') || error?.message?.includes('members_email_key')) && memberData.email) {
          showError(`A member with email "${memberData.email}" already exists.`);
          return;
        }
        
        const errorMessage = error?.message || 'Failed to save member to database';
        showError(`Failed to save member: ${errorMessage}. Please check your connection and try again.`);
        return;
      }
    } else {
      showError('Database not configured. Please configure Supabase to save members permanently.');
      return;
    }

    // Update local state
    setMembers(prev => [...prev, createdMember]);
    logActivity('Add Existing Member', `Added existing member ${createdMember.fullName} with custom dates (${createdMember.plan})`, 'admin');
    
    setShowAddExistingModal(false);
    setExistingMember({ fullName: '', email: '', phone: '', plan: SubscriptionPlan.MONTHLY, status: 'active', startDate: '', expiryDate: '' });
    setExistingPhotoPreview(null);
  };

  // Parse CSV data
  const parseCSV = (csvText: string): Partial<Member>[] => {
    const lines = csvText.trim().split('\n');
    if (lines.length < 2) {
      throw new Error('CSV must have at least a header row and one data row');
    }

    const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
    const data: Partial<Member>[] = [];

    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map(v => v.trim());
      if (values.length === 0 || values.every(v => !v)) continue;

      const row: any = {};
      headers.forEach((header, index) => {
        row[header] = values[index] || '';
      });

      // Map CSV columns to Member fields
      const member: Partial<Member> = {
        fullName: row['full name'] || row['fullname'] || row['name'] || '',
        email: row['email'] || '',
        phone: row['phone'] || row['phone number'] || '',
        plan: (row['plan'] || SubscriptionPlan.BASIC) as SubscriptionPlan,
        startDate: row['start date'] || row['startdate'] || '',
        expiryDate: row['expiry date'] || row['expirydate'] || row['expiry'] || '',
        status: (row['status'] || 'active') as 'active' | 'expiring' | 'expired',
        address: row['address'] || undefined,
        emergencyContact: row['emergency contact'] || row['emergencycontact'] || undefined
      };

      // Email is optional, only require fullName and phone
      if (member.fullName && member.phone) {
        data.push(member);
      }
    }

    return data;
  };

  // Parse JSON data
  const parseJSON = (jsonText: string): Partial<Member>[] => {
    try {
      const data = JSON.parse(jsonText);
      const members = Array.isArray(data) ? data : [data];
      
      return members.map((item: any) => ({
        fullName: item.fullName || item.full_name || item.name || '',
        email: item.email || '',
        phone: item.phone || item.phoneNumber || '',
        plan: item.plan || SubscriptionPlan.BASIC,
        startDate: item.startDate || item.start_date || '',
        expiryDate: item.expiryDate || item.expiry_date || item.expiry || '',
        status: item.status || 'active',
        address: item.address || undefined,
        emergencyContact: item.emergencyContact || item.emergency_contact || undefined
      })).filter((m: Partial<Member>) => m.fullName && m.phone); // Email is optional
    } catch (error) {
      throw new Error('Invalid JSON format');
    }
  };

  // Handle bulk import
  const handleBulkImport = async () => {
    if (!bulkData.trim()) {
      showWarning('Please enter or paste member data');
      return;
    }

    setIsImporting(true);
    setImportResults(null);

    try {
      let parsedMembers: Partial<Member>[];
      
      if (bulkImportMode === 'csv') {
        parsedMembers = parseCSV(bulkData);
      } else {
        parsedMembers = parseJSON(bulkData);
      }

      if (parsedMembers.length === 0) {
        throw new Error('No valid members found in the data');
      }

      const errors: string[] = [];
      let successCount = 0;
      let failedCount = 0;

      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
      const hasSupabase = !!(supabaseUrl && supabaseKey);

      // Process members one by one
      for (const memberData of parsedMembers) {
        try {
          // Set default dates if not provided (use local timezone)
          const now = new Date();
          const defaultStartDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
          const startDate = memberData.startDate || defaultStartDate;
          const plan = memberData.plan || SubscriptionPlan.BASIC;
          const expiryDate = memberData.expiryDate || calculateExpiryDate(plan, startDate);

          const memberToCreate: Omit<Member, 'id'> = {
            fullName: memberData.fullName!,
            email: memberData.email && memberData.email.trim() ? memberData.email.trim() : undefined,
            phone: memberData.phone!,
            plan: memberData.plan || SubscriptionPlan.BASIC,
            startDate,
            expiryDate,
            status: memberData.status || 'active',
            address: memberData.address,
            emergencyContact: memberData.emergencyContact
          };

          if (!hasSupabase) {
            errors.push(`${memberData.fullName}: Database not configured. Cannot import members.`);
            failedCount++;
            continue;
          }

          let createdMember: Member;
          try {
            createdMember = await membersService.create(memberToCreate);
          } catch (error: any) {
            // If duplicate email, skip this member (only if email was provided)
            if ((error?.message?.includes('duplicate') || error?.code === '23505') && memberToCreate.email) {
              errors.push(`${memberData.fullName}: Email already exists`);
              failedCount++;
              continue;
            }
            // For other errors, log and skip
            errors.push(`${memberData.fullName}: ${error?.message || 'Failed to create member'}`);
            failedCount++;
            continue;
          }

          // Update local state
          setMembers(prev => [...prev, createdMember]);
          logActivity('Bulk Import', `Imported ${createdMember.fullName} (${createdMember.plan})`, 'admin');

          // Send welcome email only if not skipped
          if (!skipWelcomeEmails && createdMember.email) {
            await sendWelcomeEmail({
              memberName: createdMember.fullName,
              memberEmail: createdMember.email,
              memberPhone: createdMember.phone, // Include phone for SMS
              plan: createdMember.plan,
              startDate: createdMember.startDate,
              expiryDate: createdMember.expiryDate
            });
          }

          successCount++;
        } catch (error: any) {
          errors.push(`${memberData.fullName || 'Unknown'}: ${error.message || 'Import failed'}`);
          failedCount++;
        }
      }

      setImportResults({
        success: successCount,
        failed: failedCount,
        errors: errors.slice(0, 10) // Show first 10 errors
      });

      if (successCount > 0) {
        setCurrentPage(1);
        membersService.getPaginated(PAGE_SIZE, 0).then(({ data, hasMore }) => {
          setDisplayMembers(data);
          setHasMorePages(hasMore);
        }).catch(() => {});
        setTimeout(() => {
          setBulkData('');
          if (failedCount === 0) {
            setShowBulkImportModal(false);
          }
        }, 3000);
      }
    } catch (error: any) {
      showError(`Import Error: ${error.message}`);
      setImportResults({
        success: 0,
        failed: 0,
        errors: [error.message]
      });
    } finally {
      setIsImporting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (role !== UserRole.SUPER_ADMIN) {
      showError("Only Super Admins can delete members.");
      return;
    }
    const memberToDelete = displayMembers.find(m => m.id === id) ?? members.find(m => m.id === id);
    setConfirmModal({
      isOpen: true,
      message: `Are you sure you want to delete ${memberToDelete?.fullName}? This action cannot be undone.`,
      onConfirm: async () => {
        setConfirmModal(null);
        await performDelete(id);
      }
    });
  };

  const performDelete = async (id: string) => {
    const memberToDelete = displayMembers.find(m => m.id === id) ?? members.find(m => m.id === id);
    
    // Try to delete from Supabase if configured
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
    
    if (supabaseUrl && supabaseKey) {
      try {
        await membersService.delete(id);
        console.log('✅ Member deleted from Supabase:', id);
      } catch (error) {
        console.error('❌ Error deleting member from Supabase:', error);
        showError('Failed to delete member from database. Please try again.');
        return;
      }
    }

    // Update local state
    setMembers(prev => prev.filter(m => m.id !== id));
    membersService.getPaginated(PAGE_SIZE, (currentPage - 1) * PAGE_SIZE).then(({ data, hasMore }) => {
      setDisplayMembers(data);
      setHasMorePages(hasMore);
      if (data.length === 0 && currentPage > 1) setCurrentPage(p => Math.max(1, p - 1));
    }).catch(() => {});
    logActivity('Delete Member', `Removed member ${memberToDelete?.fullName} from directory`, 'admin');
    showSuccess(`Member ${memberToDelete?.fullName} deleted successfully`);
  };

  return (
    <>
      {confirmModal && (
        <ConfirmModal
          isOpen={confirmModal.isOpen}
          title="Confirm Delete"
          message={confirmModal.message}
          confirmText="Delete"
          cancelText="Cancel"
          type="danger"
          onConfirm={confirmModal.onConfirm}
          onCancel={() => setConfirmModal(null)}
        />
      )}
      <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-2xl font-bold text-slate-900">Member Directory</h2>
        <div className="flex gap-2">
          <button 
            onClick={() => setShowBulkImportModal(true)}
            className="bg-slate-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-slate-700 transition-colors shadow-sm"
          >
            <Upload size={20} />
            Bulk Import
          </button>
          <button 
            onClick={() => setShowAddExistingModal(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700 transition-colors shadow-sm"
          >
            <Plus size={20} />
            Add Existing Member
          </button>
          <button 
            onClick={() => setShowAddModal(true)}
            className="bg-rose-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-rose-700 transition-colors shadow-sm"
          >
            <Plus size={20} />
            Register New Member
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-4 border-b bg-slate-50 flex flex-col sm:flex-row gap-4 items-center justify-between">
          <div className="relative w-full sm:w-96">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text" 
              placeholder="Search by name, email, or phone..." 
              className="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-rose-500 text-sm"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto pb-2 sm:pb-0">
             <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-slate-200 text-xs font-medium text-slate-600 hover:bg-white bg-slate-100 whitespace-nowrap">
              <Filter size={14} /> Filter
             </button>
          </div>
        </div>

        {/* Desktop Table View */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="text-slate-500 text-xs font-bold uppercase tracking-wider bg-slate-50/50">
                <th className="px-4 lg:px-6 py-3 lg:py-4">Member</th>
                <th className="px-4 lg:px-6 py-3 lg:py-4">Subscription</th>
                <th className="px-4 lg:px-6 py-3 lg:py-4">Status</th>
                <th className="px-4 lg:px-6 py-3 lg:py-4">Contact</th>
                <th className="px-4 lg:px-6 py-3 lg:py-4">Date Added</th>
                <th className="px-4 lg:px-6 py-3 lg:py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {listLoading ? (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-slate-500">
                    <div className="flex justify-center gap-2">
                      <div className="w-5 h-5 border-2 border-rose-500 border-t-transparent rounded-full animate-spin" />
                      Loading members...
                    </div>
                  </td>
                </tr>
              ) : (
              displayMembers.map((member) => (
                <tr key={member.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-4 lg:px-6 py-3 lg:py-4">
                    <div className="flex items-center gap-3">
                      {member.photo ? (
                        <img 
                          src={member.photo} 
                          alt={member.fullName}
                          className="w-16 h-16 lg:w-20 lg:h-20 rounded-full object-cover border-2 border-slate-200 shrink-0"
                        />
                      ) : (
                        <div className="w-16 h-16 lg:w-20 lg:h-20 rounded-full bg-slate-100 border-2 border-slate-200 flex items-center justify-center shrink-0">
                          <User size={24} className="text-slate-400 lg:w-8 lg:h-8" />
                        </div>
                      )}
                      <div className="min-w-0">
                        <div className="font-bold text-slate-900 text-sm lg:text-base truncate">{member.fullName}</div>
                        <div className="text-xs text-slate-400 truncate">ID: {member.id.slice(0, 8)}...</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 lg:px-6 py-3 lg:py-4">
                    <span className="text-xs font-semibold px-2 py-1 rounded bg-slate-100 text-slate-700">{member.plan}</span>
                    <div className="text-[10px] text-slate-400 mt-1">Exp: {member.expiryDate}</div>
                  </td>
                  <td className="px-4 lg:px-6 py-3 lg:py-4">
                    <span className={`text-[10px] font-bold uppercase px-2 py-1 rounded-full ${
                      member.status === 'active' ? 'bg-emerald-100 text-emerald-700' :
                      member.status === 'expiring' ? 'bg-amber-100 text-amber-700' : 'bg-rose-100 text-rose-700'
                    }`}>
                      {member.status}
                    </span>
                  </td>
                  <td className="px-4 lg:px-6 py-3 lg:py-4">
                    <div className="text-xs lg:text-sm text-slate-600 truncate">{member.phone}</div>
                    <div className="text-xs text-slate-400 truncate">{member.email || '-'}</div>
                  </td>
                  <td className="px-4 lg:px-6 py-3 lg:py-4">
                    <div className="text-xs text-slate-600">
                      {member.createdAt ? new Date(member.createdAt).toLocaleDateString('en-US', { 
                        year: 'numeric', 
                        month: 'short', 
                        day: 'numeric' 
                      }) : '-'}
                    </div>
                    {member.createdAt && (
                      <div className="text-[10px] text-slate-400 mt-0.5">
                        {new Date(member.createdAt).toLocaleTimeString('en-US', { 
                          hour: '2-digit', 
                          minute: '2-digit' 
                        })}
                      </div>
                    )}
                  </td>
                  <td className="px-4 lg:px-6 py-3 lg:py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button 
                        onClick={() => handleEditClick(member)}
                        className="p-2 text-slate-400 hover:text-blue-600 transition-colors"
                        title={role === UserRole.STAFF ? 'Upload Photo' : 'Edit Member'}
                      >
                        <Edit2 size={16} />
                      </button>
                      <button 
                        onClick={() => handleDelete(member.id)}
                        className={`p-2 text-slate-400 transition-colors ${role === UserRole.SUPER_ADMIN ? 'hover:text-rose-600' : 'opacity-30 cursor-not-allowed'}`}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              )))}
            </tbody>
          </table>
        </div>

        {/* Pagination footer - show when we have data */}
        {!listLoading && displayMembers.length > 0 && (
          <div className="px-4 py-3 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-50/50">
            <div className="text-sm text-slate-600">
              {isSearchMode
                ? `Showing 1–${displayMembers.length} of ${displayMembers.length} results`
                : hasMorePages
                  ? `Showing ${startItem}–${endItem}`
                  : `Showing ${startItem}–${endItem} of ${endItem} members`}
            </div>
            <div className="flex items-center gap-2">
              {!isSearchMode && (currentPage > 1 || hasMorePages) && (
                <>
                  <button
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage <= 1}
                    className="p-2 rounded-lg border border-slate-200 text-slate-600 hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    aria-label="Previous page"
                  >
                    <ChevronLeft size={18} />
                  </button>
                  <span className="text-sm font-medium text-slate-700 min-w-[60px] text-center">
                    Page {currentPage}
                  </span>
                  <button
                    onClick={() => setCurrentPage(p => p + 1)}
                    disabled={!hasMorePages}
                    className="p-2 rounded-lg border border-slate-200 text-slate-600 hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    aria-label="Next page"
                  >
                    <ChevronRight size={18} />
                  </button>
                </>
              )}
            </div>
          </div>
        )}

        {/* Mobile Card View */}
        <div className="md:hidden space-y-4 p-4">
          {listLoading ? (
            <div className="py-12 text-center text-slate-500">
              <div className="flex justify-center gap-2">
                <div className="w-5 h-5 border-2 border-rose-500 border-t-transparent rounded-full animate-spin" />
                Loading members...
              </div>
            </div>
          ) : displayMembers.length === 0 ? (
            <div className="py-12 text-center text-slate-500">
              {searchTerm.trim() ? 'No members match your search.' : 'No members yet. Register your first member to get started.'}
            </div>
          ) : (
          displayMembers.map((member) => (
            <div key={member.id} className="bg-white border border-slate-200 rounded-lg p-4 space-y-3">
              <div className="flex items-start gap-3">
                {member.photo ? (
                  <img 
                    src={member.photo} 
                    alt={member.fullName}
                    className="w-16 h-16 rounded-full object-cover border-2 border-slate-200 shrink-0"
                  />
                ) : (
                  <div className="w-16 h-16 rounded-full bg-slate-100 border-2 border-slate-200 flex items-center justify-center shrink-0">
                    <User size={24} className="text-slate-400" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="font-bold text-slate-900 text-base">{member.fullName}</div>
                  <div className="text-xs text-slate-400 mt-1">ID: {member.id.slice(0, 8)}...</div>
                </div>
                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => handleEditClick(member)}
                    className="p-2 text-slate-400 hover:text-blue-600 transition-colors"
                    title={role === UserRole.STAFF ? 'Upload Photo' : 'Edit Member'}
                  >
                    <Edit2 size={18} />
                  </button>
                  <button 
                    onClick={() => handleDelete(member.id)}
                    className={`p-2 text-slate-400 transition-colors ${role === UserRole.SUPER_ADMIN ? 'hover:text-rose-600' : 'opacity-30 cursor-not-allowed'}`}
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3 pt-3 border-t border-slate-100">
                <div>
                  <div className="text-xs text-slate-500 mb-1">Subscription</div>
                  <span className="text-xs font-semibold px-2 py-1 rounded bg-slate-100 text-slate-700">{member.plan}</span>
                  <div className="text-[10px] text-slate-400 mt-1">Exp: {member.expiryDate}</div>
                </div>
                <div>
                  <div className="text-xs text-slate-500 mb-1">Status</div>
                  <span className={`text-[10px] font-bold uppercase px-2 py-1 rounded-full inline-block ${
                    member.status === 'active' ? 'bg-emerald-100 text-emerald-700' :
                    member.status === 'expiring' ? 'bg-amber-100 text-amber-700' : 'bg-rose-100 text-rose-700'
                  }`}>
                    {member.status}
                  </span>
                </div>
              </div>
              <div className="pt-3 border-t border-slate-100">
                <div className="text-xs text-slate-500 mb-1">Contact</div>
                <div className="text-sm text-slate-600">{member.phone}</div>
                <div className="text-xs text-slate-400 truncate">{member.email || '-'}</div>
              </div>
              {member.createdAt && (
                <div className="pt-3 border-t border-slate-100">
                  <div className="text-xs text-slate-500 mb-1">Date Added</div>
                  <div className="text-xs text-slate-600">
                    {new Date(member.createdAt).toLocaleDateString('en-US', { 
                      year: 'numeric', 
                      month: 'short', 
                      day: 'numeric' 
                    })}
                  </div>
                  <div className="text-[10px] text-slate-400 mt-0.5">
                    {new Date(member.createdAt).toLocaleTimeString('en-US', { 
                      hour: '2-digit', 
                      minute: '2-digit' 
                    })}
                  </div>
                </div>
              )}
            </div>
          )))}
        </div>
      </div>

      {/* Add Member Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-2 sm:p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl animate-in zoom-in-95 fade-in duration-200 flex flex-col max-h-[95vh] sm:max-h-[90vh]">
            <div className="flex items-center justify-between p-4 border-b shrink-0">
              <h3 className="text-base font-bold text-slate-900">New Registration</h3>
              <button onClick={() => {
                setShowAddModal(false);
                setPhotoPreview(null);
              setNewMember({
                fullName: '',
                email: '',
                phone: '',
                plan: SubscriptionPlan.MONTHLY,
                status: 'active'
              });
              setRegistrationFee(0);
              }} className="text-slate-400 hover:text-slate-600">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleAddMember} className="flex flex-col flex-1 overflow-hidden">
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {/* Photo Upload Section */}
              <div className="flex flex-col items-center gap-4 pb-4 border-b border-slate-200">
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
                  <p className="text-xs text-slate-500 mt-2">
                    Max size: 5MB (JPG, PNG) <span className="text-rose-600 font-bold">* Required</span>
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Full Name</label>
                  <input 
                    required 
                    type="text" 
                    className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-rose-500 outline-none" 
                    value={newMember.fullName}
                    onChange={e => setNewMember({...newMember, fullName: e.target.value})}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                   <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Email (Optional)</label>
                    <input 
                      type="email" 
                      className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-rose-500 outline-none"
                      value={newMember.email || ''}
                      onChange={e => setNewMember({...newMember, email: e.target.value || undefined})}
                      placeholder="email@example.com"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Phone</label>
                    <input 
                      required 
                      type="tel" 
                      className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-rose-500 outline-none"
                      value={newMember.phone}
                      onChange={e => setNewMember({...newMember, phone: e.target.value})}
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Subscription Plan</label>
                  <select 
                    className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-rose-500 outline-none"
                    value={newMember.plan}
                    onChange={e => {
                      const newPlan = e.target.value as SubscriptionPlan;
                      setNewMember({...newMember, plan: newPlan});
                      // Reset registration fee when switching to day passes
                      if (newPlan === SubscriptionPlan.DAY_MORNING || newPlan === SubscriptionPlan.DAY_EVENING) {
                        setRegistrationFee(0);
                      }
                    }}
                  >
                    <option value={SubscriptionPlan.MONTHLY}>Monthly (₵140/mo)</option>
                    <option value={SubscriptionPlan.TWO_WEEKS}>2 Weeks (₵100)</option>
                    <option value={SubscriptionPlan.ONE_WEEK}>1 Week (₵70)</option>
                    <option value={SubscriptionPlan.DAY_MORNING}>Day Morning (₵25)</option>
                    <option value={SubscriptionPlan.DAY_EVENING}>Day Evening (₵25)</option>
                  </select>
                </div>
                {/* Registration Fee - Only for Monthly, 2 Weeks, and 1 Week plans */}
                {(newMember.plan === SubscriptionPlan.MONTHLY || 
                  newMember.plan === SubscriptionPlan.TWO_WEEKS || 
                  newMember.plan === SubscriptionPlan.ONE_WEEK) && (
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Registration Fee (GHS)</label>
                    <input 
                      type="number"
                      min="0"
                      step="0.01"
                      className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-rose-500 outline-none"
                      value={registrationFee}
                      onChange={e => setRegistrationFee(parseFloat(e.target.value) || 0)}
                      placeholder="0.00"
                    />
                  </div>
                )}
                
                {/* Payment Summary */}
                <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 space-y-2">
                  <p className="text-sm font-semibold text-slate-900 mb-2">Payment Summary</p>
                  <div className="flex justify-between text-sm text-slate-600">
                    <span>Plan Price:</span>
                    <span className="font-medium">
                      {(() => {
                        switch (newMember.plan) {
                          case SubscriptionPlan.MONTHLY: return '₵140.00';
                          case SubscriptionPlan.TWO_WEEKS: return '₵100.00';
                          case SubscriptionPlan.ONE_WEEK: return '₵70.00';
                          case SubscriptionPlan.DAY_MORNING:
                          case SubscriptionPlan.DAY_EVENING: return '₵25.00';
                          default: return '₵0.00';
                        }
                      })()}
                    </span>
                  </div>
                  {/* Only show registration fee for non-day passes */}
                  {(newMember.plan === SubscriptionPlan.MONTHLY || 
                    newMember.plan === SubscriptionPlan.TWO_WEEKS || 
                    newMember.plan === SubscriptionPlan.ONE_WEEK) && (
                    <div className="flex justify-between text-sm text-slate-600">
                      <span>Registration Fee:</span>
                      <span className="font-medium">₵{registrationFee.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="border-t border-slate-300 pt-2 mt-2">
                    <div className="flex justify-between text-base font-bold text-slate-900">
                      <span>Total Amount:</span>
                      <span className="text-rose-600">
                        {(() => {
                          let planPrice = 0;
                          switch (newMember.plan) {
                            case SubscriptionPlan.MONTHLY: planPrice = 140; break;
                            case SubscriptionPlan.TWO_WEEKS: planPrice = 100; break;
                            case SubscriptionPlan.ONE_WEEK: planPrice = 70; break;
                            case SubscriptionPlan.DAY_MORNING:
                            case SubscriptionPlan.DAY_EVENING: planPrice = 25; break;
                            default: planPrice = 0;
                          }
                          // Registration fee only applies to Monthly, 2 Weeks, and 1 Week plans
                          const isDayPass = newMember.plan === SubscriptionPlan.DAY_MORNING || 
                                          newMember.plan === SubscriptionPlan.DAY_EVENING;
                          const totalAmount = isDayPass ? planPrice : planPrice + registrationFee;
                          return `₵${totalAmount.toFixed(2)}`;
                        })()}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
              </div>

              {/* Sticky Footer with Buttons */}
              <div className="border-t border-slate-200 p-4 bg-white shrink-0">
                <div className="flex gap-3">
                  <button 
                    type="button" 
                    onClick={() => {
                      setShowAddModal(false);
                      setPhotoPreview(null);
              setNewMember({
                fullName: '',
                email: '',
                phone: '',
                plan: SubscriptionPlan.MONTHLY,
                status: 'active'
              });
              setRegistrationFee(0);
                    }}
                    className="flex-1 py-2.5 bg-slate-100 text-slate-600 font-bold rounded-lg hover:bg-slate-200 transition-colors text-sm"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit"
                    className="flex-1 py-2.5 bg-rose-600 text-white font-bold rounded-lg hover:bg-rose-700 transition-colors text-sm"
                  >
                    Complete Registration
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Member Modal */}
      {showEditModal && editingMember && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-2 sm:p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl animate-in zoom-in-95 fade-in duration-200 flex flex-col max-h-[95vh] sm:max-h-[90vh]">
            <div className="flex items-center justify-between p-4 border-b shrink-0">
              <h3 className="text-base font-bold text-slate-900">
                {role === UserRole.STAFF ? 'Upload Member Photo' : 'Edit Member Information'}
              </h3>
              <button 
                onClick={() => {
                  setShowEditModal(false);
                  setEditingMember(null);
                  setEditPhotoPreview(null);
                }} 
                className="text-slate-400 hover:text-slate-600"
              >
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSaveEdit} className="flex flex-col flex-1 overflow-hidden">
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {/* Photo Upload Section */}
                <div className="flex flex-col items-center gap-2 pb-3 border-b border-slate-200">
                  <div className="relative">
                    {editPhotoPreview ? (
                      <div className="relative">
                        <img 
                          src={editPhotoPreview} 
                          alt="Preview" 
                          className="w-36 h-36 rounded-full object-cover border-2 border-rose-500"
                        />
                        <button
                          type="button"
                          onClick={handleRemoveEditPhoto}
                          className="absolute -top-1 -right-1 bg-rose-600 text-white rounded-full p-1 hover:bg-rose-700 transition-colors"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    ) : (
                      <div className="w-36 h-36 rounded-full bg-slate-100 border-2 border-slate-200 flex items-center justify-center">
                        <User size={48} className="text-slate-400" />
                      </div>
                    )}
                  </div>
                  <div className="text-center">
                    <label className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-rose-600 text-white rounded-lg cursor-pointer hover:bg-rose-700 transition-colors text-xs">
                      <ImageIcon size={14} />
                      <span>Upload Photo</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleEditPhotoUpload}
                        className="hidden"
                      />
                    </label>
                    <p className="text-[10px] text-slate-500 mt-1">
                      Max: 5MB {!editPhotoPreview && <span className="text-rose-600 font-bold">* Required</span>}
                    </p>
                  </div>
                </div>

                {/* Admin can edit all fields, Staff can only see read-only info */}
                {role === UserRole.SUPER_ADMIN ? (
                  <div className="grid grid-cols-1 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-slate-700 mb-1">Full Name</label>
                      <input 
                        required 
                        type="text" 
                        className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-rose-500 outline-none" 
                        value={editingMember.fullName}
                        onChange={e => setEditingMember({...editingMember, fullName: e.target.value})}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-medium text-slate-700 mb-1">Email (Optional)</label>
                        <input 
                          type="email" 
                          className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-rose-500 outline-none"
                          value={editingMember.email || ''}
                          onChange={e => setEditingMember({...editingMember, email: e.target.value || undefined})}
                          placeholder="email@example.com"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-slate-700 mb-1">Phone</label>
                        <input 
                          required 
                          type="tel" 
                          className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-rose-500 outline-none"
                          value={editingMember.phone}
                          onChange={e => setEditingMember({...editingMember, phone: e.target.value})}
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-700 mb-1">Address</label>
                      <input 
                        type="text" 
                        className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-rose-500 outline-none"
                        value={editingMember.address || ''}
                        onChange={e => setEditingMember({...editingMember, address: e.target.value})}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-700 mb-1">Emergency Contact</label>
                      <input 
                        type="text" 
                        className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-rose-500 outline-none"
                        value={editingMember.emergencyContact || ''}
                        onChange={e => setEditingMember({...editingMember, emergencyContact: e.target.value})}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-700 mb-1">Subscription Plan</label>
                      <select 
                        className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-rose-500 outline-none"
                        value={editingMember.plan}
                        onChange={e => setEditingMember({...editingMember, plan: e.target.value as SubscriptionPlan})}
                      >
                        <option value={SubscriptionPlan.MONTHLY}>Monthly (₵140/mo)</option>
                        <option value={SubscriptionPlan.TWO_WEEKS}>2 Weeks (₵100)</option>
                        <option value={SubscriptionPlan.ONE_WEEK}>1 Week (₵70)</option>
                        <option value={SubscriptionPlan.DAY_MORNING}>Day Morning (₵25)</option>
                        <option value={SubscriptionPlan.DAY_EVENING}>Day Evening (₵25)</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-700 mb-1">Status</label>
                      <select 
                        className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-rose-500 outline-none"
                        value={editingMember.status}
                        onChange={e => setEditingMember({...editingMember, status: e.target.value as 'active' | 'expiring' | 'expired'})}
                      >
                        <option value="active">Active</option>
                        <option value="expiring">Expiring</option>
                        <option value="expired">Expired</option>
                      </select>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2 bg-slate-50 p-3 rounded-lg">
                    <div>
                      <label className="block text-xs font-medium text-slate-500 mb-0.5">Full Name</label>
                      <p className="text-xs text-slate-900 font-medium">{editingMember.fullName}</p>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-medium text-slate-500 mb-0.5">Email</label>
                        <p className="text-xs text-slate-900">{editingMember.email}</p>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-slate-500 mb-0.5">Phone</label>
                        <p className="text-xs text-slate-900">{editingMember.phone}</p>
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-500 mb-0.5">Plan</label>
                      <p className="text-xs text-slate-900">{editingMember.plan}</p>
                    </div>
                    <p className="text-[10px] text-slate-500 italic mt-2">
                      Staff members can only upload photos. Contact an admin to edit other information.
                    </p>
                  </div>
                )}
              </div>

              {/* Sticky Footer with Buttons */}
              <div className="border-t border-slate-200 p-4 bg-white shrink-0">
                <div className="flex gap-3">
                  <button 
                    type="button" 
                    onClick={() => {
                      setShowEditModal(false);
                      setEditingMember(null);
                      setEditPhotoPreview(null);
                    }}
                    className="flex-1 py-2.5 bg-slate-100 text-slate-600 font-bold rounded-lg hover:bg-slate-200 transition-colors text-sm"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit"
                    className="flex-1 py-2.5 bg-rose-600 text-white font-bold rounded-lg hover:bg-rose-700 transition-colors text-sm"
                  >
                    {role === UserRole.STAFF ? 'Save Photo' : 'Complete Registration'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Bulk Import Modal */}
      {showBulkImportModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-2 sm:p-4">
          <div className="bg-white rounded-2xl w-full max-w-4xl shadow-2xl max-h-[95vh] sm:max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b sticky top-0 bg-white">
              <div>
                <h3 className="text-lg font-bold text-slate-900">Bulk Import Members</h3>
                <p className="text-sm text-slate-500 mt-1">Import multiple members at once from CSV or JSON</p>
              </div>
              <button onClick={() => {
                setShowBulkImportModal(false);
                setBulkData('');
                setImportResults(null);
              }} className="text-slate-400 hover:text-slate-600">
                <X size={24} />
              </button>
            </div>
            
            <div className="p-6 space-y-4">
              {/* Format Selector */}
              <div className="flex gap-2">
                <button
                  onClick={() => setBulkImportMode('csv')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    bulkImportMode === 'csv'
                      ? 'bg-blue-600 text-white'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  CSV Format
                </button>
                <button
                  onClick={() => setBulkImportMode('json')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    bulkImportMode === 'json'
                      ? 'bg-blue-600 text-white'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  JSON Format
                </button>
              </div>

              {/* Format Help */}
              <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
                <h4 className="text-sm font-bold text-slate-700 mb-2">Expected Format ({bulkImportMode.toUpperCase()}):</h4>
                {bulkImportMode === 'csv' ? (
                  <div className="text-xs text-slate-600 space-y-1">
                    <p><strong>CSV Format:</strong> First row should be headers, subsequent rows are data</p>
                    <pre className="bg-white p-2 rounded border border-slate-200 mt-2 text-[10px] overflow-x-auto">
{`Full Name,Email,Phone,Plan,Start Date,Expiry Date,Status
John Doe,john@example.com,0244123456,Basic,2024-01-01,2024-02-01,active
Jane Smith,jane@example.com,0244123457,Premium,2024-01-15,2024-02-15,active`}
                    </pre>
                    <p className="mt-2 text-slate-500">Required fields: Full Name, Phone (Email is optional)</p>
                  </div>
                ) : (
                  <div className="text-xs text-slate-600 space-y-1">
                    <p><strong>JSON Format:</strong> Array of member objects</p>
                    <pre className="bg-white p-2 rounded border border-slate-200 mt-2 text-[10px] overflow-x-auto">
{`[
  {
    "fullName": "John Doe",
    "email": "john@example.com",
    "phone": "0244123456",
    "plan": "Basic",
    "startDate": "2024-01-01",
    "expiryDate": "2024-02-01",
    "status": "active"
  }
]`}
                    </pre>
                  </div>
                )}
              </div>

              {/* Skip Welcome Emails Option */}
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="skipEmails"
                  checked={skipWelcomeEmails}
                  onChange={(e) => setSkipWelcomeEmails(e.target.checked)}
                  className="w-4 h-4 text-blue-600 border-slate-300 rounded focus:ring-blue-500"
                />
                <label htmlFor="skipEmails" className="text-sm text-slate-700">
                  Skip welcome emails (recommended for existing members)
                </label>
              </div>

              {/* Data Input */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Paste {bulkImportMode.toUpperCase()} Data
                </label>
                <textarea
                  value={bulkData}
                  onChange={(e) => setBulkData(e.target.value)}
                  placeholder={bulkImportMode === 'csv' 
                    ? 'Paste CSV data here...'
                    : 'Paste JSON data here...'
                  }
                  className="w-full h-64 px-4 py-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none font-mono text-sm"
                />
              </div>

              {/* Import Results */}
              {importResults && (
                <div className={`p-4 rounded-lg border ${
                  importResults.failed === 0 
                    ? 'bg-emerald-50 border-emerald-200' 
                    : 'bg-amber-50 border-amber-200'
                }`}>
                  <div className="flex items-start gap-3">
                    {importResults.failed === 0 ? (
                      <CheckCircle2 className="text-emerald-600 mt-0.5" size={20} />
                    ) : (
                      <AlertCircle className="text-amber-600 mt-0.5" size={20} />
                    )}
                    <div className="flex-1">
                      <p className={`text-sm font-bold ${
                        importResults.failed === 0 ? 'text-emerald-800' : 'text-amber-800'
                      }`}>
                        Import Complete: {importResults.success} succeeded, {importResults.failed} failed
                      </p>
                      {importResults.errors.length > 0 && (
                        <div className="mt-2 text-xs text-amber-700">
                          <p className="font-bold mb-1">Errors:</p>
                          <ul className="list-disc list-inside space-y-1">
                            {importResults.errors.map((error, index) => (
                              <li key={index}>{error}</li>
                            ))}
                            {importResults.errors.length === 10 && (
                              <li className="text-amber-600">... and more errors (showing first 10)</li>
                            )}
                          </ul>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowBulkImportModal(false);
                    setBulkData('');
                    setImportResults(null);
                  }}
                  className="flex-1 py-3 bg-slate-100 text-slate-600 font-bold rounded-xl hover:bg-slate-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleBulkImport}
                  disabled={isImporting || !bulkData.trim()}
                  className="flex-1 py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isImporting ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Importing...
                    </>
                  ) : (
                    <>
                      <Upload size={20} />
                      Import Members
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Existing Member Modal */}
      {showAddExistingModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-2 sm:p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl animate-in zoom-in-95 fade-in duration-200 flex flex-col max-h-[95vh] sm:max-h-[90vh]">
            <form onSubmit={handleAddExistingMember} className="flex flex-col flex-1 overflow-hidden">
              {/* Header */}
              <div className="flex items-center justify-between p-4 sm:p-6 border-b border-slate-200 shrink-0">
                <div>
                  <h2 className="text-xl sm:text-2xl font-bold text-slate-900">Add Existing Member</h2>
                  <p className="text-xs sm:text-sm text-slate-500 mt-1">Member with existing subscription dates</p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setShowAddExistingModal(false);
                    setExistingPhotoPreview(null);
                    setExistingMember({
                      fullName: '',
                      email: '',
                      phone: '',
                      plan: SubscriptionPlan.MONTHLY,
                      startDate: '',
                      expiryDate: ''
                    });
                  }}
                  className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Scrollable Content */}
              <div className="flex-1 overflow-y-auto p-4 sm:p-6">
                <div className="space-y-4">
                  {/* Photo Upload */}
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Member Photo *</label>
                    <div className="flex items-center gap-4">
                      {existingPhotoPreview ? (
                        <div className="relative">
                          <img 
                            src={existingPhotoPreview} 
                            alt="Preview" 
                            className="w-24 h-24 rounded-full object-cover border-2 border-slate-200"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              setExistingPhotoPreview(null);
                              setExistingMember({...existingMember, photo: undefined});
                            }}
                            className="absolute -top-2 -right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
                          >
                            <X size={16} />
                          </button>
                        </div>
                      ) : (
                        <div className="w-24 h-24 rounded-full bg-slate-100 border-2 border-slate-200 flex items-center justify-center">
                          <User size={40} className="text-slate-400" />
                        </div>
                      )}
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleExistingPhotoUpload}
                        className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                      />
                    </div>
                  </div>

                  {/* Full Name */}
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Full Name</label>
                    <input 
                      required 
                      type="text" 
                      className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" 
                      value={existingMember.fullName}
                      onChange={e => setExistingMember({...existingMember, fullName: e.target.value})}
                    />
                  </div>

                  {/* Email and Phone */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Email (Optional)</label>
                      <input 
                        type="email" 
                        className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                        value={existingMember.email || ''}
                        onChange={e => setExistingMember({...existingMember, email: e.target.value || undefined})}
                        placeholder="email@example.com"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Phone</label>
                      <input 
                        required 
                        type="tel" 
                        className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                        value={existingMember.phone}
                        onChange={e => setExistingMember({...existingMember, phone: e.target.value})}
                      />
                    </div>
                  </div>

                  {/* Address */}
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Address (Optional)</label>
                    <input 
                      type="text" 
                      className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                      value={existingMember.address || ''}
                      onChange={e => setExistingMember({...existingMember, address: e.target.value})}
                    />
                  </div>

                  {/* Emergency Contact */}
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Emergency Contact (Optional)</label>
                    <input 
                      type="text" 
                      className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                      value={existingMember.emergencyContact || ''}
                      onChange={e => setExistingMember({...existingMember, emergencyContact: e.target.value})}
                    />
                  </div>

                  {/* Subscription Plan */}
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Subscription Plan</label>
                    <select 
                      className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                      value={existingMember.plan}
                      onChange={e => setExistingMember({...existingMember, plan: e.target.value as SubscriptionPlan})}
                    >
                      <option value={SubscriptionPlan.MONTHLY}>Monthly (₵140/mo)</option>
                      <option value={SubscriptionPlan.TWO_WEEKS}>2 Weeks (₵100)</option>
                      <option value={SubscriptionPlan.ONE_WEEK}>1 Week (₵70)</option>
                      <option value={SubscriptionPlan.DAY_MORNING}>Day Morning (₵25)</option>
                      <option value={SubscriptionPlan.DAY_EVENING}>Day Evening (₵25)</option>
                    </select>
                  </div>

                  {/* Registration Date */}
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Registration Date *</label>
                    <input 
                      required 
                      type="date" 
                      className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                      value={existingMember.startDate}
                      onChange={e => setExistingMember({...existingMember, startDate: e.target.value})}
                    />
                  </div>

                  {/* Expiry Date */}
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Expiry Date * 
                      {(existingMember.plan === SubscriptionPlan.DAY_MORNING || existingMember.plan === SubscriptionPlan.DAY_EVENING) && (
                        <span className="text-xs text-blue-600 ml-2">
                          (Time will be auto-set: {existingMember.plan === SubscriptionPlan.DAY_MORNING ? '11:00 AM' : '8:00 PM'})
                        </span>
                      )}
                    </label>
                    <input 
                      required 
                      type="date" 
                      className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                      value={existingMember.expiryDate?.split('T')[0] || existingMember.expiryDate}
                      onChange={e => {
                        let expiryValue = e.target.value;
                        // For day passes, add the appropriate time
                        if (existingMember.plan === SubscriptionPlan.DAY_MORNING) {
                          expiryValue = `${expiryValue}T11:00:00`;
                        } else if (existingMember.plan === SubscriptionPlan.DAY_EVENING) {
                          expiryValue = `${expiryValue}T20:00:00`;
                        }
                        setExistingMember({...existingMember, expiryDate: expiryValue});
                      }}
                    />
                  </div>

                  {/* Status - Auto-calculated info */}
                  <div className="bg-slate-50 border border-slate-200 rounded-lg p-3">
                    <div className="flex items-start gap-2">
                      <div className="mt-0.5">
                        <svg className="w-4 h-4 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <div>
                        <p className="text-xs font-medium text-slate-700">Status Auto-Calculation</p>
                        <p className="text-xs text-slate-600 mt-0.5">
                          Member status (Active/Expiring/Expired) will be automatically calculated based on the expiry date when displayed in the system.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                    <p className="text-xs text-blue-700">
                      * This form is for adding members who already have subscriptions. The system will NOT automatically calculate dates.
                    </p>
                  </div>
                </div>
              </div>

              {/* Sticky Footer with Buttons */}
              <div className="border-t border-slate-200 p-4 bg-white shrink-0">
                <div className="flex gap-3">
                  <button 
                    type="button" 
                    onClick={() => {
                      setShowAddExistingModal(false);
                      setExistingPhotoPreview(null);
                      setExistingMember({
                        fullName: '',
                        email: '',
                        phone: '',
                        plan: SubscriptionPlan.MONTHLY,
                        startDate: '',
                        expiryDate: ''
                      });
                    }}
                    className="flex-1 py-2.5 bg-slate-100 text-slate-600 font-bold rounded-lg hover:bg-slate-200 transition-colors text-sm"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit"
                    className="flex-1 py-2.5 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 transition-colors text-sm"
                  >
                    Add Member
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
    </>
  );
};

export default MemberManager;
