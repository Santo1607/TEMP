import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, real, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Staff roles enum
export const staffRoles = ["admin", "doctor", "nurse"] as const;
export type StaffRole = typeof staffRoles[number];

// Risk levels enum
export const riskLevels = ["normal", "warning", "critical"] as const;
export type RiskLevel = typeof riskLevels[number];

// Disease types for AI threshold assignment
export const diseaseTypes = ["Normal", "Infection", "Post Surgery", "ICU", "Fever", "Chronic", "Other"] as const;
export type DiseaseType = typeof diseaseTypes[number];

// Staff table (doctors, nurses, admins)
export const staff = pgTable("staff", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  role: text("role").notNull().$type<StaffRole>(),
  phone: text("phone").notNull(),
});

export const insertStaffSchema = createInsertSchema(staff).omit({ id: true });
export type InsertStaff = z.infer<typeof insertStaffSchema>;
export type Staff = typeof staff.$inferSelect;

// Patients table
export const patients = pgTable("patients", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  roomNumber: text("room_number").notNull(),
  floorNumber: text("floor_number").notNull(),
  blockNumber: text("block_number").notNull(),
  disease: text("disease").notNull(),
  guardianName: text("guardian_name").notNull(),
  guardianPhone: text("guardian_phone").notNull(),
  doctorId: varchar("doctor_id").references(() => staff.id),
  nurseId: varchar("nurse_id").references(() => staff.id),
  thresholdMin: real("threshold_min").notNull().default(36.5),
  thresholdMax: real("threshold_max").notNull().default(37.5),
});

export const insertPatientSchema = createInsertSchema(patients).omit({ id: true });
export type InsertPatient = z.infer<typeof insertPatientSchema>;
export type Patient = typeof patients.$inferSelect;

// Temperature logs table
export const temperatureLogs = pgTable("temperature_logs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  patientId: varchar("patient_id").notNull().references(() => patients.id),
  tempC: real("temp_c").notNull(),
  tempF: real("temp_f").notNull(),
  riskLevel: text("risk_level").notNull().$type<RiskLevel>(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertTemperatureLogSchema = createInsertSchema(temperatureLogs).omit({ id: true, createdAt: true });
export type InsertTemperatureLog = z.infer<typeof insertTemperatureLogSchema>;
export type TemperatureLog = typeof temperatureLogs.$inferSelect;

// Alert logs for SMS notifications
export const alertLogs = pgTable("alert_logs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  patientId: varchar("patient_id").notNull().references(() => patients.id),
  recipientType: text("recipient_type").notNull(), // doctor, nurse, guardian
  recipientPhone: text("recipient_phone").notNull(),
  message: text("message").notNull(),
  status: text("status").notNull(), // sent, failed
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertAlertLogSchema = createInsertSchema(alertLogs).omit({ id: true, createdAt: true });
export type InsertAlertLog = z.infer<typeof insertAlertLogSchema>;
export type AlertLog = typeof alertLogs.$inferSelect;

// Extended types for frontend with computed fields
export interface PatientWithDetails extends Patient {
  doctor?: Staff;
  nurse?: Staff;
  latestTemperature?: TemperatureLog;
}

// Login schema
export const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});
export type LoginCredentials = z.infer<typeof loginSchema>;

// Temperature input from ESP32
export const temperatureInputSchema = z.object({
  patientId: z.string().min(1, "Patient ID is required"),
  tempC: z.number().min(30).max(45),
  tempF: z.number().min(86).max(113),
});
export type TemperatureInput = z.infer<typeof temperatureInputSchema>;

// AI Threshold rules based on disease
export const diseaseThresholds: Record<string, { min: number; max: number }> = {
  "Normal": { min: 36.5, max: 37.5 },
  "Infection": { min: 36.0, max: 37.0 },
  "Post Surgery": { min: 36.5, max: 37.2 },
  "ICU": { min: 36.8, max: 37.0 },
  "Fever": { min: 36.0, max: 38.0 },
  "Chronic": { min: 36.5, max: 37.5 },
  "Other": { min: 36.5, max: 37.5 },
};

// Dashboard statistics type
export interface DashboardStats {
  totalPatients: number;
  criticalAlerts: number;
  warningAlerts: number;
  normalRange: number;
}

// Legacy User types for compatibility
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
