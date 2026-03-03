import { z } from "zod";
import {
  adminServiceSchema as baseAdminServiceSchema,
  adminTherapistSchema as baseAdminTherapistSchema,
  adminTimeSlotCreateSchema as baseAdminTimeSlotCreateSchema,
  adminBookingStatusSchema as baseAdminBookingStatusSchema,
  type AdminServiceInput as BaseAdminServiceInput,
  type AdminTherapistInput as BaseAdminTherapistInput,
  type AdminTimeSlotCreateInput as BaseAdminTimeSlotCreateInput,
  type AdminBookingStatusInput as BaseAdminBookingStatusInput,
} from "../utils/validation";

export const adminServiceSchema = baseAdminServiceSchema;
export const adminTherapistSchema = baseAdminTherapistSchema;
export const adminTimeSlotCreateSchema = baseAdminTimeSlotCreateSchema;
export const adminBookingStatusSchema = baseAdminBookingStatusSchema;

export const adminServiceUpdateSchema = adminServiceSchema.extend({
  id: z.string().min(1, "Service ID is required."),
});

export const adminTherapistUpdateSchema = adminTherapistSchema.extend({
  id: z.string().min(1, "Therapist ID is required."),
});

export type AdminServiceInput = BaseAdminServiceInput;
export type AdminTherapistInput = BaseAdminTherapistInput;
export type AdminTimeSlotCreateInput = BaseAdminTimeSlotCreateInput;
export type AdminBookingStatusInput = BaseAdminBookingStatusInput;

