// This extends the Supabase Database type definitions
import { Database as SupabaseDatabase } from './types';

export interface IndustryBenchmark {
  id: string;
  industry: string;
  metric: string;
  value: number;
  description?: string | null;
  created_at: string;
  updated_at: string;
}

export interface UserBenchmark {
  id: string;
  metric: string;
  value: number;
  user_id: string;
  created_at: string;
  updated_at: string;
}

export interface StartupScore {
  id: string;
  company_id?: string;
  total_score: number;
  growth_score: number;
  team_score: number;
  finance_score: number;
  market_score: number;
  product_score: number;
  calculation_date: string;
  created_at: string;
  updated_at: string;
}

export interface BusinessQuestion {
  id: string;
  company_id?: string | null;
  problem_solving?: string | null;
  solution?: string | null;
  why_now?: string | null;
  business_model?: string | null;
  founding_team_gender?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
}

export interface SocialMedia {
  id: string;
  company_id?: string | null;
  linkedin?: string | null;
  instagram?: string | null;
  crunchbase?: string | null;
  twitter?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
}

export interface Company {
  id: string;
  name: string;
  business_activity?: string | null;
  industry?: string | null;
  last_revenue?: number | null;
  stage?: string | null;
  total_employees?: number | null;
  founded_year?: number | null;
  created_at?: string | null;
  updated_at?: string | null;
  website_url?: string | null;
  country?: string | null;
  currency?: string | null;
  sector?: string | null;
  company_series?: string | null;
}

export interface Profile {
  id: string;
  full_name?: string | null;
  last_name?: string | null;
  avatar_url?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
  designation?: string | null;
  phone?: string | null;
  country_code?: string | null;
}

export interface AppUser {
  id: string;
  user_id: string;
  company_id?: string | null;
  user_type?: string | null;
  status?: string | null;
  role?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
  profiles?: {
    full_name?: string | null;
    last_name?: string | null;
    email?: {
      email?: string | null;
    } | null;
  } | null;
}

// Extend the Database interface to include our custom tables
export interface Database extends SupabaseDatabase {
  public: {
    Tables: SupabaseDatabase['public']['Tables'] & {
      industry_benchmarks: {
        Row: IndustryBenchmark;
      };
      user_benchmarks: {
        Row: UserBenchmark;
      };
      startup_scores: {
        Row: StartupScore;
      };
      business_questions: {
        Row: BusinessQuestion;
      };
      social_media: {
        Row: SocialMedia;
      };
      app_users: {
        Row: AppUser;
      };
      companies: {
        Row: Company;
      };
      profiles: {
        Row: Profile;
      };
    };
    Views: SupabaseDatabase['public']['Views'];
    Functions: SupabaseDatabase['public']['Functions'];
    Enums: SupabaseDatabase['public']['Enums'];
    CompositeTypes: SupabaseDatabase['public']['CompositeTypes'];
  }
}

// Re-export the extended supabase client
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = "https://zketdtgucabdbfdtlxzq.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InprZXRkdGd1Y2FiZGJmZHRseHpxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDMxMjQ5NDYsImV4cCI6MjA1ODcwMDk0Nn0.7UR1Epax73cRK8tQh_K7aLrL6lxKPIZzBnAPVqkqnkI";

export const extendedSupabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);
