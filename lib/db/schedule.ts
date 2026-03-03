export type ScheduleItem = {
  id?: string;
  therapist_id: string;
  date: string; // ISO date
  start_time: string;
  end_time: string;
  capacity?: number;
};

import { createScheduleRepository } from "../infra/supabase/schedule.repo";

const scheduleRepo = createScheduleRepository();

export async function listSchedule() {
  return scheduleRepo.listSchedule();
}

export async function createSchedule(payload: ScheduleItem) {
  return scheduleRepo.createSchedule(payload);
}

export async function updateSchedule(id: string, payload: Partial<ScheduleItem>) {
  return scheduleRepo.updateSchedule(id, payload);
}

export async function deleteSchedule(id: string) {
  await scheduleRepo.deleteSchedule(id);
  return true;
}

