// Database types for Supabase
// These match the schema from SUPABASE_SETUP.md

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
          photo_url: string | null;
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
          photo_url?: string | null;
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
          photo_url?: string | null;
          updated_at?: string;
        };
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
      };
      areas: {
        Row: {
          id: string;
          name: string;
          route_id: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          route_id?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          route_id?: string | null;
        };
      };
      learners: {
        Row: {
          id: string;
          name: string;
          admission_no: string;
          class: string;
          pickup_area: string;
          pickup_time: string;
          dropoff_area: string | null;
          drop_time: string | null;
          trip: number;
          father_phone: string;
          mother_phone: string;
          route_id: string | null;
          active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          admission_no: string;
          class: string;
          pickup_area: string;
          pickup_time: string;
          dropoff_area?: string | null;
          drop_time?: string | null;
          trip?: number;
          father_phone: string;
          mother_phone: string;
          route_id?: string | null;
          active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          admission_no?: string;
          class?: string;
          pickup_area?: string;
          pickup_time?: string;
          dropoff_area?: string | null;
          drop_time?: string | null;
          trip?: number;
          father_phone?: string;
          mother_phone?: string;
          route_id?: string | null;
          active?: boolean;
          updated_at?: string;
        };
      };
      vehicles: {
        Row: {
          id: string;
          vehicle_no: string;
          make: string | null;
          model: string | null;
          year: number | null;
          color: string | null;
          capacity: number;
          image_url: string | null;
          status: "active" | "inactive" | "maintenance";
          route_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          vehicle_no: string;
          make?: string | null;
          model?: string | null;
          year?: number | null;
          color?: string | null;
          capacity?: number;
          image_url?: string | null;
          status?: "active" | "inactive" | "maintenance";
          route_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          vehicle_no?: string;
          make?: string | null;
          model?: string | null;
          year?: number | null;
          color?: string | null;
          capacity?: number;
          image_url?: string | null;
          status?: "active" | "inactive" | "maintenance";
          route_id?: string | null;
          updated_at?: string;
        };
      };
      school_settings: {
        Row: {
          id: string;
          school_name: string;
          phone: string | null;
          email: string | null;
          website: string | null;
          address: string | null;
          logo_url: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          school_name?: string;
          phone?: string | null;
          email?: string | null;
          website?: string | null;
          address?: string | null;
          logo_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          school_name?: string;
          phone?: string | null;
          email?: string | null;
          website?: string | null;
          address?: string | null;
          logo_url?: string | null;
          updated_at?: string;
        };
      };
      school_config: {
        Row: {
          id: string;
          type: "grade" | "stream";
          name: string;
          parent_id: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          type: "grade" | "stream";
          name: string;
          parent_id?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          type?: "grade" | "stream";
          name?: string;
          parent_id?: string | null;
        };
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
          timestamp: string;
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
          timestamp?: string;
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
      };
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
export type SchoolSettings = Database["public"]["Tables"]["school_settings"]["Row"];
export type SchoolConfig = Database["public"]["Tables"]["school_config"]["Row"];
export type AuditLog = Database["public"]["Tables"]["audit_logs"]["Row"];

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
