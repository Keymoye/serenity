export interface TimeSlot {
  id: string;
  therapist_id: string;
  start_time: string;
  end_time: string;
  is_available: boolean;
  locked_until: string | null;
}

