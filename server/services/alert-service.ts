import type { Patient, Staff, RiskLevel } from "@shared/schema";
import { storage } from "../storage";

interface AlertRecipient {
  type: "doctor" | "nurse" | "guardian";
  name: string;
  phone: string;
}

export async function sendTemperatureAlert(
  patient: Patient,
  tempC: number,
  tempF: number,
  riskLevel: RiskLevel
): Promise<void> {
  if (riskLevel === "normal") return;

  const recipients: AlertRecipient[] = [];

  if (patient.doctorId) {
    const doctor = await storage.getStaff(patient.doctorId);
    if (doctor) {
      recipients.push({
        type: "doctor",
        name: doctor.name,
        phone: doctor.phone,
      });
    }
  }

  if (patient.nurseId) {
    const nurse = await storage.getStaff(patient.nurseId);
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

  const message = buildAlertMessage(patient, tempC, tempF, riskLevel);

  for (const recipient of recipients) {
    await sendSMS(patient, recipient, message, riskLevel);
  }
}

function buildAlertMessage(
  patient: Patient,
  tempC: number,
  tempF: number,
  riskLevel: RiskLevel
): string {
  const riskText = riskLevel === "critical" ? "CRITICAL" : "WARNING";
  
  return `[${riskText} ALERT] Hospital Temperature Monitor
Patient: ${patient.name}
Room: ${patient.roomNumber}, Floor: ${patient.floorNumber}, Block: ${patient.blockNumber}
Condition: ${patient.disease}
Temperature: ${tempC.toFixed(1)}°C / ${tempF.toFixed(1)}°F
Status: ${riskText}
Please respond immediately.`;
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
    console.log(`[SMS] Message: ${message}`);
    
    status = "sent";
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
