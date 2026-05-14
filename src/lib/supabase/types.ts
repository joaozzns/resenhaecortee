/**
 * Tipos do Database — espelham public.* do Postgres.
 *
 * Mantenha em sincronia com supabase/migrations/*. Para regenerar
 * automaticamente quando o schema crescer:
 *
 *   npx supabase login
 *   npx supabase gen types typescript --project-id ykwfjhdjdlzlvyivegps \
 *     --schema public > src/lib/supabase/types.ts
 *
 * Convenção (mesma do supabase gen):
 *  - Row: o que sai do SELECT
 *  - Insert: tudo opcional exceto colunas NOT NULL sem DEFAULT
 *  - Update: tudo opcional
 *  - Relationships: array vazio mantido para satisfazer o cliente tipado
 */

export type UserRole = "client" | "barber" | "admin";
export type ServiceCategory = "cabelo" | "barba" | "combo" | "tratamento";
export type AppointmentStatus =
  | "pending"
  | "confirmed"
  | "cancelled"
  | "completed"
  | "no_show";
export type SubscriptionStatus = "active" | "paused" | "cancelled";

type ISOString = string;
type UUID = string;

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: UUID;
          role: UserRole;
          full_name: string | null;
          phone: string | null;
          birthdate: string | null;
          avatar_url: string | null;
          notification_email: boolean;
          notification_whatsapp: boolean;
          favorite_barber_id: UUID | null;
          loyalty_points: number;
          created_at: ISOString;
          updated_at: ISOString;
        };
        Insert: {
          id: UUID;
          role?: UserRole;
          full_name?: string | null;
          phone?: string | null;
          birthdate?: string | null;
          avatar_url?: string | null;
          notification_email?: boolean;
          notification_whatsapp?: boolean;
          favorite_barber_id?: UUID | null;
          loyalty_points?: number;
          created_at?: ISOString;
          updated_at?: ISOString;
        };
        Update: {
          id?: UUID;
          role?: UserRole;
          full_name?: string | null;
          phone?: string | null;
          birthdate?: string | null;
          avatar_url?: string | null;
          notification_email?: boolean;
          notification_whatsapp?: boolean;
          favorite_barber_id?: UUID | null;
          loyalty_points?: number;
          created_at?: ISOString;
          updated_at?: ISOString;
        };
        Relationships: [];
      };

      services: {
        Row: {
          id: UUID;
          name: string;
          description: string | null;
          duration_minutes: number;
          price_cents: number;
          category: ServiceCategory;
          active: boolean;
          sort_order: number;
          created_at: ISOString;
        };
        Insert: {
          id?: UUID;
          name: string;
          description?: string | null;
          duration_minutes: number;
          price_cents: number;
          category: ServiceCategory;
          active?: boolean;
          sort_order?: number;
          created_at?: ISOString;
        };
        Update: {
          id?: UUID;
          name?: string;
          description?: string | null;
          duration_minutes?: number;
          price_cents?: number;
          category?: ServiceCategory;
          active?: boolean;
          sort_order?: number;
          created_at?: ISOString;
        };
        Relationships: [];
      };

      barbers: {
        Row: {
          id: UUID;
          profile_id: UUID | null;
          name: string;
          bio: string | null;
          photo_url: string | null;
          specialties: string[];
          instagram: string | null;
          active: boolean;
          sort_order: number;
          created_at: ISOString;
        };
        Insert: {
          id?: UUID;
          profile_id?: UUID | null;
          name: string;
          bio?: string | null;
          photo_url?: string | null;
          specialties?: string[];
          instagram?: string | null;
          active?: boolean;
          sort_order?: number;
          created_at?: ISOString;
        };
        Update: {
          id?: UUID;
          profile_id?: UUID | null;
          name?: string;
          bio?: string | null;
          photo_url?: string | null;
          specialties?: string[];
          instagram?: string | null;
          active?: boolean;
          sort_order?: number;
          created_at?: ISOString;
        };
        Relationships: [];
      };

      working_hours: {
        Row: {
          id: UUID;
          barber_id: UUID;
          weekday: number;
          start_time: string;
          end_time: string;
        };
        Insert: {
          id?: UUID;
          barber_id: UUID;
          weekday: number;
          start_time: string;
          end_time: string;
        };
        Update: {
          id?: UUID;
          barber_id?: UUID;
          weekday?: number;
          start_time?: string;
          end_time?: string;
        };
        Relationships: [];
      };

      time_blocks: {
        Row: {
          id: UUID;
          barber_id: UUID;
          starts_at: ISOString;
          ends_at: ISOString;
          reason: string | null;
          created_at: ISOString;
        };
        Insert: {
          id?: UUID;
          barber_id: UUID;
          starts_at: ISOString;
          ends_at: ISOString;
          reason?: string | null;
          created_at?: ISOString;
        };
        Update: {
          id?: UUID;
          barber_id?: UUID;
          starts_at?: ISOString;
          ends_at?: ISOString;
          reason?: string | null;
          created_at?: ISOString;
        };
        Relationships: [];
      };

      appointments: {
        Row: {
          id: UUID;
          client_id: UUID | null;
          client_name: string;
          client_phone: string;
          client_email: string;
          barber_id: UUID;
          starts_at: ISOString;
          ends_at: ISOString;
          status: AppointmentStatus;
          cancel_token: UUID;
          total_cents: number;
          notes: string | null;
          rating: number | null;
          review: string | null;
          created_at: ISOString;
          cancelled_at: ISOString | null;
        };
        Insert: {
          id?: UUID;
          client_id?: UUID | null;
          client_name: string;
          client_phone: string;
          client_email: string;
          barber_id: UUID;
          starts_at: ISOString;
          ends_at: ISOString;
          status?: AppointmentStatus;
          cancel_token?: UUID;
          total_cents?: number;
          notes?: string | null;
          rating?: number | null;
          review?: string | null;
          created_at?: ISOString;
          cancelled_at?: ISOString | null;
        };
        Update: {
          id?: UUID;
          client_id?: UUID | null;
          client_name?: string;
          client_phone?: string;
          client_email?: string;
          barber_id?: UUID;
          starts_at?: ISOString;
          ends_at?: ISOString;
          status?: AppointmentStatus;
          cancel_token?: UUID;
          total_cents?: number;
          notes?: string | null;
          rating?: number | null;
          review?: string | null;
          created_at?: ISOString;
          cancelled_at?: ISOString | null;
        };
        Relationships: [];
      };

      appointment_services: {
        Row: {
          appointment_id: UUID;
          service_id: UUID;
          price_cents: number;
          duration_minutes: number;
        };
        Insert: {
          appointment_id: UUID;
          service_id: UUID;
          price_cents: number;
          duration_minutes: number;
        };
        Update: {
          appointment_id?: UUID;
          service_id?: UUID;
          price_cents?: number;
          duration_minutes?: number;
        };
        Relationships: [];
      };

      loyalty_transactions: {
        Row: {
          id: UUID;
          profile_id: UUID;
          appointment_id: UUID | null;
          points: number;
          reason: string;
          created_at: ISOString;
        };
        Insert: {
          id?: UUID;
          profile_id: UUID;
          appointment_id?: UUID | null;
          points: number;
          reason: string;
          created_at?: ISOString;
        };
        Update: {
          id?: UUID;
          profile_id?: UUID;
          appointment_id?: UUID | null;
          points?: number;
          reason?: string;
          created_at?: ISOString;
        };
        Relationships: [];
      };

      client_subscriptions: {
        Row: {
          id: UUID;
          profile_id: UUID;
          plan_name: string;
          price_cents: number;
          started_at: string;
          status: SubscriptionStatus;
          notes: string | null;
          created_at: ISOString;
          updated_at: ISOString;
        };
        Insert: {
          id?: UUID;
          profile_id: UUID;
          plan_name: string;
          price_cents?: number;
          started_at?: string;
          status?: SubscriptionStatus;
          notes?: string | null;
          created_at?: ISOString;
          updated_at?: ISOString;
        };
        Update: {
          id?: UUID;
          profile_id?: UUID;
          plan_name?: string;
          price_cents?: number;
          started_at?: string;
          status?: SubscriptionStatus;
          notes?: string | null;
          created_at?: ISOString;
          updated_at?: ISOString;
        };
        Relationships: [];
      };

      subscription_payments: {
        Row: {
          id: UUID;
          subscription_id: UUID;
          amount_cents: number;
          paid_at: string;
          method: string | null;
          notes: string | null;
          created_at: ISOString;
        };
        Insert: {
          id?: UUID;
          subscription_id: UUID;
          amount_cents: number;
          paid_at?: string;
          method?: string | null;
          notes?: string | null;
          created_at?: ISOString;
        };
        Update: {
          id?: UUID;
          subscription_id?: UUID;
          amount_cents?: number;
          paid_at?: string;
          method?: string | null;
          notes?: string | null;
          created_at?: ISOString;
        };
        Relationships: [];
      };

      favorite_services: {
        Row: {
          profile_id: UUID;
          service_id: UUID;
          created_at: ISOString;
        };
        Insert: {
          profile_id: UUID;
          service_id: UUID;
          created_at?: ISOString;
        };
        Update: {
          profile_id?: UUID;
          service_id?: UUID;
          created_at?: ISOString;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      is_admin: { Args: Record<string, never>; Returns: boolean };
      is_staff: { Args: Record<string, never>; Returns: boolean };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}

export type Tables<K extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][K]["Row"];
export type TableInsert<K extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][K]["Insert"];
export type TableUpdate<K extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][K]["Update"];
