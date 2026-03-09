# Resend (Email)

## Overview
Resend sends transactional emails for the Serenity Spa booking application. Used for booking confirmations, cancellation notices, and admin alerts. Resend provides a modern API-first email service with reliable delivery and analytics.

## Environment variables
| Variable | Required | Default | Purpose | Where to get it |
|----------|----------|---------|---------|-----------------|
| `RESEND_API_KEY` | Yes | - | Resend API authentication | Resend Dashboard → API Keys |
| `RESEND_FROM_EMAIL` | No | "bookings@serenity.spa" | Default from email address | Domain verification in Resend |
| `RESEND_ADMIN_EMAIL` | No | "admin@serenity.spa" | Admin notification recipient | Resend Dashboard (optional) |
| `SPA_NAME` | No | "Serenity Spa" | Email personalization | Application config |

**Email domain requirements:**
- `RESEND_FROM_EMAIL` domain must be verified in Resend
- For production: update to your actual domain (e.g., "bookings@yourspa.com")
- Development: Resend provides test domains for testing

## Email types

### 1. sendBookingConfirmation
**Function:** `sendBookingConfirmation(data)`  
**Trigger:** Successful booking confirmation  
**Recipient:** Customer email  
**Subject line:** `"Booking Confirmed - {referenceCode}"`  
**Template:** `bookingConfirmationTemplate`  
**Key data included:**
```typescript
{
  to: string,              // customer email
  customerName: string,     // customer full name
  referenceCode: string,   // booking reference
  serviceName: string,     // service name
  therapistName: string,   // therapist name (or null)
  appointmentDate: string,  // formatted date
  appointmentTime: string,  // formatted time
  notes: string,           // customer notes
  cancellationUrl: string, // direct cancel link
  spaName: string,         // from config
  spaAddress: string,      // from config
  spaPhone: string,        // from config
  spaWebsite: string       // from config
}
```

### 2. sendAdminNewBookingNotification
**Function:** `sendAdminNewBookingNotification(data)`  
**Trigger:** New booking created in system  
**Recipient:** Admin email (`RESEND_ADMIN_EMAIL`)  
**Subject line:** `"New Booking - {referenceCode}"`  
**Template:** `adminNewBookingTemplate`  
**Key data included:**
```typescript
{
  referenceCode: string,   // booking reference
  customerName: string,     // customer name
  customerEmail: string,    // customer email
  serviceName: string,     // service name
  therapistName: string,   // therapist name
  appointmentDate: string,  // formatted date
  appointmentTime: string,  // formatted time
  notes: string,           // customer notes
  spaName: string,         // from config
  spaAddress: string,      // from config
  spaPhone: string,        // from config
  spaWebsite: string       // from config
}
```

### 3. sendAdminLateCancellationAlert
**Function:** `sendAdminLateCancellationAlert(data)`  
**Trigger:** Cancellation within 24 hours of appointment  
**Recipient:** Admin email (`RESEND_ADMIN_EMAIL`)  
**Subject line:** `"ALERT: Late Cancellation - {referenceCode}"`  
**Template:** `adminLateCancellationTemplate`  
**Key data included:**
```typescript
{
  referenceCode: string,           // booking reference
  customerName: string,           // customer name
  serviceName: string,           // service name
  therapistName: string,         // therapist name
  appointmentDate: string,        // formatted date
  appointmentTime: string,        // formatted time
  hoursUntilAppointment: number,  // hours remaining
  spaName: string,               // from config
  spaAddress: string,            // from config
  spaPhone: string,              // from config
  spaWebsite: string             // from config
}
```

### 4. sendCancellationConfirmation
**Function:** `sendCancellationConfirmation(data)`  
**Trigger:** Booking cancelled by customer  
**Recipient:** Customer email  
**Subject line:** `"Booking Cancelled - {referenceCode}"`  
**Template:** `cancellationConfirmationTemplate`  
**Key data included:**
```typescript
{
  to: string,              // customer email
  customerName: string,   // customer name
  referenceCode: string,  // booking reference
  serviceName: string,    // service name
  therapistName: string,  // therapist name
  appointmentDate: string, // formatted date
  appointmentTime: string, // formatted time
  spaName: string,        // from config
  spaAddress: string,     // from config
  spaPhone: string,       // from config
  spaWebsite: string      // from config
}
```

## Template system

### Template architecture:
All email templates use a consistent wrapper system for branding and layout:

```typescript
// lib/utils/emailTemplates.ts
function baseTemplate(content: string, title: string, options: TemplateOptions): string {
  // Returns complete HTML with:
  // - Sage green header bar
  // - White card container
  // - Consistent typography
  // - Footer with contact info
}
```

### Design system:
**Color palette:**
```typescript
const COLORS = {
  sageGreen: "#7aaa6e",      // Primary brand color
  sageLight: "#eef4eb",      // Light background
  bgCream: "#f8faf5",        // Page background
  textDark: "#1a1a1a",      // Primary text
  textGray: "#666666",      // Secondary text
  borderLight: "#e0e0e0",    // Borders
  amberWarning: "#fff8e1",    // Warning background
  amberBorder: "#f59e0b",     // Warning border
};
```

**Typography:**
```typescript
const FONTS = {
  header: "Georgia, Cormorant Garamond, serif",  // Elegant serif
  body: "system-ui, -apple-system, sans-serif", // System sans-serif
  mono: "Courier New, monospace",                // For codes/references
};
```

### Email client compatibility:
- **All CSS is inline** - Email clients strip `<style>` tags
- **Hex colors only** - No CSS variables support
- **Table-based layout** - Maximum compatibility
- **Alt text on images** - Fallback for image blocking
- **Plain text fallback** - Some clients prefer text

### Template structure:
```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>{title}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f8faf5; font-family: system-ui;">
  <table cellpadding="0" cellspacing="0" style="width: 100%; max-width: 600px; margin: 0 auto; padding: 20px;">
    <tr>
      <td>
        <!-- Main card with sage green top border -->
        <div style="background-color: white; border-top: 3px solid #7aaa6e; border-radius: 4px; padding: 40px;">
          <!-- Spa name header -->
          <div style="text-align: center; margin-bottom: 30px; border-bottom: 1px solid #e0e0e0; padding-bottom: 20px;">
            <h1 style="margin: 0; font-family: Georgia; font-size: 28px; color: #7aaa6e;">{spaName}</h1>
          </div>
          
          <!-- Email content -->
          <div style="margin-bottom: 40px;">
            {content}
          </div>
          
          <!-- Footer with contact info -->
          <div style="text-align: center; border-top: 1px solid #e0e0e0; padding-top: 20px;">
            <p style="margin: 0 0 8px 0; font-size: 12px; color: #666;">{spaAddress}</p>
            <p style="margin: 0 0 8px 0; font-size: 12px; color: #666;">{spaPhone}</p>
            <p style="margin: 0; font-size: 12px; color: #666;">
              <a href="{spaWebsite}" style="color: #7aaa6e; text-decoration: none;">{spaWebsite}</a>
            </p>
          </div>
        </div>
      </td>
    </tr>
  </table>
</body>
</html>
```

## Adding a new email type

### Step-by-step guide:

#### 1. Create template function
**File:** `lib/utils/emailTemplates.ts`

```typescript
export function myNewEmailTemplate(data: {
  customerName: string;
  referenceCode: string;
  // ... other fields
  spaName?: string;
  spaAddress?: string;
  spaPhone?: string;
  spaWebsite?: string;
}): string {
  const content = `
    <h2 style="color: #1a1a1a; margin-bottom: 16px;">My New Email Subject</h2>
    <p style="margin-bottom: 16px;">Hello ${data.customerName},</p>
    <p style="margin-bottom: 16px;">
      Your booking ${data.referenceCode} has been updated.
    </p>
    <!-- Add more content as needed -->
  `;
  
  return baseTemplate(content, "My Email Subject", {
    spaName: data.spaName,
    spaAddress: data.spaAddress,
    spaPhone: data.spaPhone,
    spaWebsite: data.spaWebsite,
  });
}
```

#### 2. Add send function
**File:** `lib/utils/emailService.ts`

```typescript
/**
 * Send my new email notification
 */
export async function sendMyNewEmail(data: {
  to: string;
  customerName: string;
  referenceCode: string;
  // ... other fields
}): Promise<EmailResult> {
  try {
    const resend = getResendClient();
    const spaConfig = getSpaConfig();

    const html = myNewEmailTemplate({
      ...data,
      ...spaConfig,
    });

    const result = await resend.emails.send({
      from: getFromEmail(),
      to: data.to,
      subject: `My Email Subject - ${data.referenceCode}`,
      html,
    });

    if (result.error) {
      logger.error("Resend API error sending my email", result.error, {
        referenceCode: data.referenceCode,
        to: data.to,
      });
      return { success: false, error: result.error.message };
    }

    logger.info("My email sent", {
      referenceCode: data.referenceCode,
      to: data.to,
      messageId: result.data?.id,
    });

    return { success: true };
  } catch (error) {
    logger.error("Failed to send my email", error, {
      referenceCode: data.referenceCode,
      to: data.to,
    });
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}
```

#### 3. Call from application service
**File:** `lib/application/your.service.ts`

```typescript
import { sendMyNewEmail } from "@/lib/utils/emailService";

export async function myBusinessFunction(input: MyInput): Promise<MyResult> {
  // ... business logic
  
  // Send email (never throws)
  await sendMyNewEmail({
    to: customerEmail,
    customerName: customerName,
    referenceCode: referenceCode,
    // ... other data
  });
  
  return result;
}
```

#### 4. Add environment variable (if needed)
**File:** `.env.example`

```bash
# Optional: new recipient email
RESEND_MY_EMAIL_RECIPIENT=
```

#### 5. Test the email
```typescript
// In development, check Resend dashboard
// In production, verify delivery
```

## Resend dashboard

### Key features:
- **Email logs** - View all sent emails with status
- **Delivery analytics** - Open rates, click rates, bounces
- **API key management** - Create and revoke API keys
- **Domain verification** - Verify sending domains
- **Webhook configuration** - Receive delivery events

### Monitoring checklist:
- [ ] Check delivery status after important emails
- [ ] Monitor bounce rates (should be < 5%)
- [ ] Review spam complaints (should be 0)
- [ ] Track API usage and limits

### Common dashboard tasks:
1. **Verify domain** - Add DNS records for SPF/DKIM
2. **Create API key** - Generate keys for different environments
3. **View email logs** - Debug failed deliveries
4. **Set up webhooks** - Get real-time delivery events

## Email deliverability notes

### Domain verification:
- **Required for production:** Verify your sending domain in Resend
- **DNS records needed:** SPF, DKIM (provided by Resend)
- **Process:** Add TXT records to your domain's DNS

### From address configuration:
```typescript
// Default from address
const getFromEmail = (): string => {
  return process.env.RESEND_FROM_EMAIL ?? "bookings@serenity.spa";
};
```

**Production setup:**
```bash
# .env.local
RESEND_FROM_EMAIL="bookings@yourspa.com"
```

### Best practices:
1. **Use verified domain** - Don't use @resend.com in production
2. **Set proper SPF/DKIM** - Resend provides DNS records
3. **Monitor bounce rates** - High bounces hurt deliverability
4. **Include plain text** - Some clients prefer text over HTML
5. **Test with multiple clients** - Gmail, Outlook, Apple Mail

### Troubleshooting:
- **Email not arriving:** Check Resend logs for delivery status
- **Marked as spam:** Verify domain reputation and SPF/DKIM
- **Bounced emails:** Review recipient email validity
- **API errors:** Check API key and rate limits

## Error handling

### Email service never throws:
```typescript
// All email functions return EmailResult
interface EmailResult {
  success: boolean;
  error?: string;
}

// Usage in services
const emailResult = await sendBookingConfirmation(data);
if (!emailResult.success) {
  logger.error("Email failed", { error: emailResult.error });
  // Continue with booking - email failure doesn't block
}
```

### Logging:
- All email attempts logged with reference codes
- Success logs include message ID
- Error logs include full error details
- Use correlation IDs for debugging

### Graceful degradation:
- Booking confirmation failures don't block bookings
- Admin notifications are best-effort
- Customer always gets booking confirmation page
- Failed emails logged for manual follow-up
