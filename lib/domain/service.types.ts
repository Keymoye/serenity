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

export interface ServiceImage {
  id: string;
  service_id: string;
  image_url: string;
  sort_order: number | null;
}

export interface ServiceWithTherapists extends Service {
  therapists: Array<{
    id: string
    name: string
    title: string | null
    photo_url: string | null
    is_active: boolean
  }>
}

export interface ServiceImageAddInput {
  service_id: string
  image_url: string
  sort_order?: number
}

export interface ServiceImageDeleteInput {
  id: string
  service_id: string
}

