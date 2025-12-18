import type { Patient, Staff, RiskLevel } from "@shared/schema";
import { storage } from "../storage";
import { getSmsProvider, formatAlertMessage } from "./sms-provider";

interface AlertRecipient {
  type: "doctor" | "nurse" | "guardian";
  name: string;
  phone: string;
}

const smsProvider = getSmsProvider();

export async function sendTemperatureAlert(
  patient: Patient,
  tempC: number,
  tempF: number,
  riskLevel: RiskLevel
): Promise<void> {
  if (riskLevel === "normal") return;

  const recipients: AlertRecipient[] = [];
  let doctor: Staff | undefined;
  let nurse: Staff | undefined;

  if (patient.doctorId) {
    doctor = await storage.getStaff(patient.doctorId);
    if (doctor) {
      recipients.push({
        type: "doctor",
        name: doctor.name,
        phone: doctor.phone,
      });
    }
  }

  if (patient.nurseId) {
    nurse = await storage.getStaff(patient.nurseId);
    if (nurse) {
      recipients.push({
        type: "nurse",
        name: nurse.name,
        phone: nurse.phone,
      });
    }
  }

  recipients.push({
    type: "guardian",
    name: patient.guardianName,
    phone: patient.guardianPhone,
  });

  const message = formatAlertMessage(patient, doctor, nurse, tempC, tempF, riskLevel);

  for (const recipient of recipients) {
    await sendSMS(patient, recipient, message, riskLevel);
  }
}

async function sendSMS(
  patient: Patient,
  recipient: AlertRecipient,
  message: string,
  riskLevel: RiskLevel
): Promise<void> {
  let status: "sent" | "failed" = "sent";

  try {
    console.log(`[SMS] Sending ${riskLevel} alert to ${recipient.type} (${recipient.name}): ${recipient.phone}`);
    
    const result = await smsProvider.sendSms(recipient.phone, message);
    status = result.success ? "sent" : "failed";
    
    if (!result.success) {
      console.error(`[SMS] Failed to send to ${recipient.phone}:`, result.error);
    }
  } catch (error) {
    console.error(`[SMS] Failed to send to ${recipient.phone}:`, error);
    status = "failed";
  }

  await storage.createAlertLog({
    patientId: patient.id,
    recipientType: recipient.type,
    recipientPhone: recipient.phone,
    message,
    status,
  });
}

export function calculateRiskLevel(
  tempC: number,
  thresholdMin: number,
  thresholdMax: number
): RiskLevel {
  if (tempC < thresholdMin - 1 || tempC > thresholdMax + 1) {
    return "critical";
  }
  
  if (tempC < thresholdMin || tempC > thresholdMax) {
    return "warning";
  }
  
  return "normal";
}
