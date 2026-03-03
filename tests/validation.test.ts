import { describe, it, expect } from 'vitest';
import { contactFormSchema, adminServiceSchema } from '../lib/utils/validation';

describe('validation schemas', () => {
  it('accepts a valid contact form', () => {
    const valid = {
      fullName: 'Jane Doe',
      email: 'jane@example.com',
      subject: 'Booking question',
      message: 'I have a question about booking availability.'
    };
    const result = contactFormSchema.safeParse(valid);
    expect(result.success).toBe(true);
  });

  it('rejects an invalid contact form (short message)', () => {
    const invalid = {
      fullName: 'J',
      email: 'not-an-email',
      subject: 'Hi',
      message: 'short'
    };
    const result = contactFormSchema.safeParse(invalid);
    expect(result.success).toBe(false);
  });

  it('validates admin service schema', () => {
    const ok = {
      name: 'Swedish Massage',
      duration_minutes: 60,
      price: 120
    };
    const result = adminServiceSchema.safeParse(ok);
    expect(result.success).toBe(true);
  });
});
