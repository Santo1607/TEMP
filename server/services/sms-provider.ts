import type { Patient, Staff, RiskLevel } from "@shared/schema";

export interface SmsProvider {
  sendSms(to: string, message: string): Promise<{ success: boolean; error?: string }>;
}

// Console logger - logs SMS to console (for development/testing)
export class ConsoleSmsProvider implements SmsProvider {
  async sendSms(to: string, message: string): Promise<{ success: boolean; error?: string }> {
    console.log(`\n========== SMS NOTIFICATION ==========`);
    console.log(`TO: ${to}`);
    console.log(`MESSAGE:\n${message}`);
    console.log(`=======================================\n`);
    return { success: true };
  }
}

// Twilio SMS Provider - for real SMS delivery
export class TwilioSmsProvider implements SmsProvider {
  private accountSid: string;
  private authToken: string;
  private fromNumber: string;

  constructor(accountSid: string, authToken: string, fromNumber: string) {
    this.accountSid = accountSid;
    this.authToken = authToken;
    this.fromNumber = fromNumber;
  }

  async sendSms(to: string, message: string): Promise<{ success: boolean; error?: string }> {
    try {
      const url = `https://api.twilio.com/2010-04-01/Accounts/${this.accountSid}/Messages.json`;
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': 'Basic ' + Buffer.from(`${this.accountSid}:${this.authToken}`).toString('base64'),
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          To: to,
          From: this.fromNumber,
          Body: message,
        }),
      });

      if (!response.ok) {
        const error = await response.text();
        console.error(`[Twilio] Failed to send SMS to ${to}:`, error);
        return { success: false, error };
      }

      console.log(`[Twilio] SMS sent successfully to ${to}`);
      return { success: true };
    } catch (error: any) {
      console.error(`[Twilio] Error sending SMS to ${to}:`, error.message);
      return { success: false, error: error.message };
    }
  }
}

// Factory function to get SMS provider based on environment
export function getSmsProvider(): SmsProvider {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const fromNumber = process.env.TWILIO_PHONE_NUMBER;

  if (accountSid && authToken && fromNumber) {
    console.log('[SMS] Using Twilio SMS Provider');
    return new TwilioSmsProvider(accountSid, authToken, fromNumber);
  }

  console.log('[SMS] Using Console SMS Provider (no Twilio credentials)');
  return new ConsoleSmsProvider();
}

// Format alert message with full patient details
export function formatAlertMessage(
  patient: Patient,
  doctor: Staff | undefined,
  nurse: Staff | undefined,
  tempC: number,
  tempF: number,
  riskLevel: RiskLevel
): string {
  const riskText = riskLevel === "critical" ? "CRITICAL" : "WARNING";
  const timestamp = new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });
  
  return `[${riskText} ALERT] Hospital Temperature Monitor

Patient: ${patient.name}
Room: ${patient.roomNumber}
Floor: ${patient.floorNumber}
Block: ${patient.blockNumber}
Condition: ${patient.disease}

Temperature: ${tempC.toFixed(1)}°C / ${tempF.toFixed(1)}°F
Status: ${riskText}
Time: ${timestamp}

Doctor: ${doctor?.name || 'Not assigned'}
Nurse: ${nurse?.name || 'Not assigned'}

Please respond immediately.`;
}
