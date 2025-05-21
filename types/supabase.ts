import { User } from "@supabase/supabase-js";

// types/supabase.ts
export type Payable = {
  id: string;
  user_id: string;
  title: string;
  type: string;
  total_amount: number;
  remaining_amount: number;
  start_date: string;
  end_date: string;
  emi_amount: number;
  emi_day: number;
  status: string;
  is_closed: boolean;
  closed_at?: string;
  payment_bank?: string;
  pay_type?: string;
  payee?: string;
  interest_per_month: number;
  extra_pay: number;
  created_at: string;
};

export type Database = {
  public: {
    Tables: {
      payables: {
        Row: Payable;
        Insert: Omit<Payable, "id" | "created_at">;
        Update: Partial<Omit<Payable, "id">>;
      };
    };
  };
};

export interface Profile {
  display_name?: string;
  photo_url?: string;
  [key: string]: any;
}

export interface ExtendedUser extends User {
  profile?: Profile;
}
