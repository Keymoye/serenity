import { InternalError, ValidationError } from "../domain/errors";
import {
  createMessageRepository,
  type MessageRepository,
} from "../infra/supabase/message.repo";

const MAX_SUBMISSIONS_PER_HOUR = 5;

export interface ContactDependencies {
  messageRepo: MessageRepository;
}

function createDefaultDeps(): ContactDependencies {
  return { messageRepo: createMessageRepository() };
}

export async function submitContactMessage(
  input: {
    fullName: string;
    email: string;
    phone?: string | null;
    subject: string;
    message: string;
  },
  context: { ipAddress: string },
  deps: ContactDependencies = createDefaultDeps(),
): Promise<void> {
  if (!input.fullName || !input.email || !input.subject || !input.message) {
    throw new ValidationError("Invalid form data.");
  }

  const ip = context.ipAddress || "unknown";
  const since = new Date(Date.now() - 60 * 60 * 1000).toISOString();

  try {
    const count = await deps.messageRepo.countMessagesFromIpSince(ip, since);
    if (count >= MAX_SUBMISSIONS_PER_HOUR) {
      throw new ValidationError("Rate limit exceeded.", { ip, count }, "RATE_LIMIT");
    }
  } catch (error) {
    if (error instanceof ValidationError) throw error;
    // If rate-limit lookup fails, continue (best effort) to preserve current behavior.
  }

  try {
    await deps.messageRepo.insertContactMessage({
      full_name: input.fullName,
      email: input.email,
      phone: input.phone ?? null,
      subject: input.subject,
      message: input.message,
      ip_address: ip,
    });
  } catch (error) {
    throw new InternalError("INSERT_FAILED", "Unable to save your message.", {
      error,
      ip,
    });
  }
}

