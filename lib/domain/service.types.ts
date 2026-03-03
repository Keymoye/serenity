export interface Service {
  id: string;
  name: string;
  category: string | null;
  duration_minutes: number | null;
  price: number | null;
  thumbnail_url?: string | null;
  description?: string | null;
  is_active: boolean | null;
  is_featured?: boolean | null;
  updated_at: string | null;
}

