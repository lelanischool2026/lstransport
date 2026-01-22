// Database types for Supabase
// These match the schema from SUPABASE_SETUP_GUIDE.md

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      routes: {
        Row: {
          id: string;
          name: string;
          vehicle_no: string;
          areas: string[] | null;
          term: string;
          year: number;
          status: "active" | "archived";
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          vehicle_no: string;
          areas?: string[] | null;
          term?: string;
          year?: number;
          status?: "active" | "archived";
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          vehicle_no?: string;
          areas?: string[] | null;
          term?: string;
          year?: number;
          status?: "active" | "archived";
          updated_at?: string;
        };
        Relationships: [];
      };
      drivers: {
        Row: {
          id: string;
          user_id: string | null;
          name: string;
          email: string;
          phone: string;
          route_id: string | null;
          role: "driver" | "admin";
          status: "active" | "inactive";
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id?: string | null;
          name: string;
          email: string;
          phone: string;
          route_id?: string | null;
          role?: "driver" | "admin";
          status?: "active" | "inactive";
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string | null;
          name?: string;
          email?: string;
          phone?: string;
          route_id?: string | null;
          role?: "driver" | "admin";
          status?: "active" | "inactive";
          updated_at?: string;
        };
        Relationships: [];
      };
      minders: {
        Row: {
          id: string;
          name: string;
          phone: string;
          driver_id: string | null;
          route_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          phone: string;
          driver_id?: string | null;
          route_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          phone?: string;
          driver_id?: string | null;
          route_id?: string | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      areas: {
        Row: {
          id: string;
          name: string;
          route_id: string;
          pickup_order: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          route_id: string;
          pickup_order?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          route_id?: string;
          pickup_order?: number;
        };
        Relationships: [];
      };
      learners: {
        Row: {
          id: string;
          name: string;
          admission_no: string | null;
          class: string | null;
          pickup_area: string | null;
          pickup_time: string | null;
          dropoff_area: string | null;
          drop_time: string | null;
          father_phone: string | null;
          mother_phone: string | null;
          house_help_phone: string | null;
          route_id: string | null;
          trip: number | null;
          active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          admission_no?: string | null;
          class?: string | null;
          pickup_area?: string | null;
          pickup_time?: string | null;
          dropoff_area?: string | null;
          drop_time?: string | null;
          father_phone?: string | null;
          mother_phone?: string | null;
          house_help_phone?: string | null;
          route_id?: string | null;
          trip?: number | null;
          active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          admission_no?: string | null;
          class?: string | null;
          pickup_area?: string | null;
          pickup_time?: string | null;
          dropoff_area?: string | null;
          drop_time?: string | null;
          father_phone?: string | null;
          mother_phone?: string | null;
          house_help_phone?: string | null;
          route_id?: string | null;
          trip?: number | null;
          active?: boolean;
          updated_at?: string;
        };
        Relationships: [];
      };
      vehicles: {
        Row: {
          id: string;
          reg_number: string;
          make: string | null;
          model: string | null;
          capacity: number;
          status: "active" | "maintenance" | "retired";
          photo_url: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          reg_number: string;
          make?: string | null;
          model?: string | null;
          capacity?: number;
          status?: "active" | "maintenance" | "retired";
          photo_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          reg_number?: string;
          make?: string | null;
          model?: string | null;
          capacity?: number;
          status?: "active" | "maintenance" | "retired";
          photo_url?: string | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      school_settings: {
        Row: {
          id: string;
          school_name: string;
          school_logo: string | null;
          contact_email: string | null;
          contact_phone: string | null;
          address: string | null;
          current_term: string;
          current_year: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          school_name: string;
          school_logo?: string | null;
          contact_email?: string | null;
          contact_phone?: string | null;
          address?: string | null;
          current_term?: string;
          current_year?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          school_name?: string;
          school_logo?: string | null;
          contact_email?: string | null;
          contact_phone?: string | null;
          address?: string | null;
          current_term?: string;
          current_year?: number;
          updated_at?: string;
        };
        Relationships: [];
      };
      school_config: {
        Row: {
          id: string;
          type: "grade" | "stream";
          name: string;
          grade: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          type: "grade" | "stream";
          name: string;
          grade?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          type?: "grade" | "stream";
          name?: string;
          grade?: string | null;
        };
        Relationships: [];
      };
      audit_logs: {
        Row: {
          id: string;
          learner_id: string | null;
          user_id: string | null;
          user_name: string;
          user_role: string;
          action: "created" | "updated" | "deactivated" | "reactivated";
          field_name: string | null;
          old_value: string | null;
          new_value: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          learner_id?: string | null;
          user_id?: string | null;
          user_name: string;
          user_role: string;
          action: "created" | "updated" | "deactivated" | "reactivated";
          field_name?: string | null;
          old_value?: string | null;
          new_value?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          learner_id?: string | null;
          user_id?: string | null;
          user_name?: string;
          user_role?: string;
          action?: "created" | "updated" | "deactivated" | "reactivated";
          field_name?: string | null;
          old_value?: string | null;
          new_value?: string | null;
        };
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
}

// Helper types
export type Route = Database["public"]["Tables"]["routes"]["Row"];
export type Driver = Database["public"]["Tables"]["drivers"]["Row"];
export type Minder = Database["public"]["Tables"]["minders"]["Row"];
export type Learner = Database["public"]["Tables"]["learners"]["Row"];
export type Vehicle = Database["public"]["Tables"]["vehicles"]["Row"];
export type Area = Database["public"]["Tables"]["areas"]["Row"];
export type SchoolSettings =
  Database["public"]["Tables"]["school_settings"]["Row"];
export type SchoolConfig = Database["public"]["Tables"]["school_config"]["Row"];
export type AuditLog = Database["public"]["Tables"]["audit_logs"]["Row"];

// Insert types
export type RouteInsert = Database["public"]["Tables"]["routes"]["Insert"];
export type DriverInsert = Database["public"]["Tables"]["drivers"]["Insert"];
export type MinderInsert = Database["public"]["Tables"]["minders"]["Insert"];
export type LearnerInsert = Database["public"]["Tables"]["learners"]["Insert"];
export type VehicleInsert = Database["public"]["Tables"]["vehicles"]["Insert"];
export type AreaInsert = Database["public"]["Tables"]["areas"]["Insert"];
export type SchoolSettingsInsert =
  Database["public"]["Tables"]["school_settings"]["Insert"];
export type SchoolConfigInsert =
  Database["public"]["Tables"]["school_config"]["Insert"];
export type AuditLogInsert =
  Database["public"]["Tables"]["audit_logs"]["Insert"];

// Extended types with relations
export interface RouteWithRelations extends Route {
  driver?: Driver | null;
  minder?: Minder | null;
  vehicle?: Vehicle | null;
  learner_count?: number;
}

export interface DriverWithRelations extends Driver {
  route?: Route | null;
  minder?: Minder | null;
}
