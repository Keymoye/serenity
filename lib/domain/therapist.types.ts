export interface Therapist {
  id: string;
  name: string;
  title: string | null;
  photo_url: string | null;
  bio_short: string | null;
  is_active: boolean | null;
  created_at: string | null;
}

export interface TherapistWithServices extends Therapist {
  services: Array<{
    id: string
    name: string
    category: string | null
    duration_minutes: number | null
    price: number | null
    thumbnail_url: string | null
  }>
}

