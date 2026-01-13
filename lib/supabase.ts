import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

// Diagnostic logging (only in development or if URL is missing)
if (import.meta.env.DEV || !supabaseUrl) {
  console.log('🔍 Supabase Configuration Check:');
  console.log('  VITE_SUPABASE_URL:', supabaseUrl ? `${supabaseUrl.substring(0, 30)}...` : '❌ NOT SET');
  console.log('  VITE_SUPABASE_ANON_KEY:', supabaseAnonKey ? `${supabaseAnonKey.substring(0, 20)}...` : '❌ NOT SET');
  
  if (!supabaseUrl) {
    console.error('❌ CRITICAL: VITE_SUPABASE_URL is not set!');
    console.error('   → Check GitHub Secrets: Settings → Secrets → Actions → VITE_SUPABASE_URL');
    console.error('   → After adding secret, trigger new deployment');
  }
  if (!supabaseAnonKey) {
    console.error('❌ CRITICAL: VITE_SUPABASE_ANON_KEY is not set!');
    console.error('   → Check GitHub Secrets: Settings → Secrets → Actions → VITE_SUPABASE_ANON_KEY');
    console.error('   → After adding secret, trigger new deployment');
  }
  if (supabaseUrl && !supabaseUrl.includes('.supabase.co')) {
    console.warn('⚠️ WARNING: Supabase URL does not look correct!');
    console.warn('   Expected format: https://xxxxxxxxxxxxx.supabase.co');
    console.warn('   Current value:', supabaseUrl);
  }
}

// Only create Supabase client if both URL and key are provided
let supabase: SupabaseClient | null = null;

if (supabaseUrl && supabaseAnonKey) {
  try {
    supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
  db: {
    schema: 'public',
  },
  global: {
    headers: {
      'x-client-info': 'goodlife-fitness-gym@1.0.0',
    },
  },
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
    });
    console.log('✅ Supabase client initialized successfully');
  } catch (error) {
    console.error('❌ Failed to initialize Supabase client:', error);
    supabase = null;
  }
} else {
  console.warn('⚠️ Supabase environment variables not configured. Some features may not work.');
  console.warn('   See FRONTEND_ENV_VARS_SETUP.md for setup instructions');
}

// Export supabase - will be null if not configured
export { supabase };

// Database types (will be generated from Supabase schema)
export type Database = {
  public: {
    Tables: {
      members: {
        Row: {
          id: string;
          full_name: string;
          email: string;
          phone: string;
          address?: string;
          emergency_contact?: string;
          plan: string;
          start_date: string;
          expiry_date: string;
          status: 'active' | 'expiring' | 'expired';
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          full_name: string;
          email: string;
          phone: string;
          address?: string;
          emergency_contact?: string;
          plan: string;
          start_date: string;
          expiry_date: string;
          status?: 'active' | 'expiring' | 'expired';
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          full_name?: string;
          email?: string;
          phone?: string;
          address?: string;
          emergency_contact?: string;
          plan?: string;
          start_date?: string;
          expiry_date?: string;
          status?: 'active' | 'expiring' | 'expired';
          updated_at?: string;
        };
      };
      staff: {
        Row: {
          id: string;
          full_name: string;
          email: string;
          role: string;
          position: string;
          phone: string;
          avatar?: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          full_name: string;
          email: string;
          role: string;
          position: string;
          phone: string;
          avatar?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          full_name?: string;
          email?: string;
          role?: string;
          position?: string;
          phone?: string;
          avatar?: string;
          updated_at?: string;
        };
      };
      payments: {
        Row: {
          id: string;
          member_id: string;
          member_name: string;
          amount: number;
          date: string;
          method: string;
          status: string;
          confirmed_by?: string;
          transaction_id?: string;
          momo_phone?: string;
          network?: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          member_id: string;
          member_name: string;
          amount: number;
          date: string;
          method: string;
          status: string;
          confirmed_by?: string;
          transaction_id?: string;
          momo_phone?: string;
          network?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          member_id?: string;
          member_name?: string;
          amount?: number;
          date?: string;
          method?: string;
          status?: string;
          confirmed_by?: string;
          transaction_id?: string;
          momo_phone?: string;
          network?: string;
          updated_at?: string;
        };
      };
      announcements: {
        Row: {
          id: string;
          title: string;
          content: string;
          date: string;
          priority: 'low' | 'medium' | 'high';
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          title: string;
          content: string;
          date: string;
          priority?: 'low' | 'medium' | 'high';
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          title?: string;
          content?: string;
          date?: string;
          priority?: 'low' | 'medium' | 'high';
          updated_at?: string;
        };
      };
      gallery: {
        Row: {
          id: string;
          url: string;
          caption: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          url: string;
          caption: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          url?: string;
          caption?: string;
        };
      };
      activity_logs: {
        Row: {
          id: string;
          user_role: string;
          user_email: string;
          action: string;
          details: string;
          timestamp: string;
          category: 'access' | 'admin' | 'financial';
          created_at: string;
        };
        Insert: {
          id?: string;
          user_role: string;
          user_email: string;
          action: string;
          details: string;
          timestamp: string;
          category: 'access' | 'admin' | 'financial';
          created_at?: string;
        };
        Update: {
          id?: string;
          user_role?: string;
          user_email?: string;
          action?: string;
          details?: string;
          timestamp?: string;
          category?: 'access' | 'admin' | 'financial';
        };
      };
      attendance_records: {
        Row: {
          id: string;
          staff_email: string;
          staff_role: string;
          date: string;
          sign_in_time: string;
          sign_out_time?: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          staff_email: string;
          staff_role: string;
          date: string;
          sign_in_time: string;
          sign_out_time?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          staff_email?: string;
          staff_role?: string;
          date?: string;
          sign_in_time?: string;
          sign_out_time?: string;
        };
      };
    };
  };
};

