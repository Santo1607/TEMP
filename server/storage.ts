import {
  type Staff,
  type InsertStaff,
  type Patient,
  type InsertPatient,
  type TemperatureLog,
  type InsertTemperatureLog,
  type AlertLog,
  type InsertAlertLog,
  type PatientWithDetails,
  type DashboardStats,
  type RiskLevel,
  diseaseThresholds,
} from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  // Staff operations
  getStaff(id: string): Promise<Staff | undefined>;
  getStaffByEmail(email: string): Promise<Staff | undefined>;
  getAllStaff(): Promise<Staff[]>;
  getStaffByRole(role: string): Promise<Staff[]>;
  createStaff(staff: InsertStaff): Promise<Staff>;
  updateStaff(id: string, staff: Partial<InsertStaff>): Promise<Staff | undefined>;
  deleteStaff(id: string): Promise<boolean>;

  // Patient operations
  getPatient(id: string): Promise<Patient | undefined>;
  getPatientWithDetails(id: string): Promise<PatientWithDetails | undefined>;
  getAllPatients(): Promise<Patient[]>;
  getAllPatientsWithDetails(): Promise<PatientWithDetails[]>;
  getPatientsByStaff(staffId: string): Promise<PatientWithDetails[]>;
  getCriticalPatients(): Promise<PatientWithDetails[]>;
  createPatient(patient: InsertPatient): Promise<Patient>;
  updatePatient(id: string, patient: Partial<InsertPatient>): Promise<Patient | undefined>;
  deletePatient(id: string): Promise<boolean>;

  // Temperature log operations
  getTemperatureLogs(): Promise<(TemperatureLog & { patient?: Patient })[]>;
  getTemperatureLogsByPatient(patientId: string): Promise<TemperatureLog[]>;
  getLatestTemperature(patientId: string): Promise<TemperatureLog | undefined>;
  createTemperatureLog(log: InsertTemperatureLog): Promise<TemperatureLog>;

  // Alert log operations
  getAlertLogs(): Promise<(AlertLog & { patient?: Patient })[]>;
  createAlertLog(log: InsertAlertLog): Promise<AlertLog>;

  // Dashboard stats
  getDashboardStats(staffId?: string, role?: string): Promise<DashboardStats>;
}

export class MemStorage implements IStorage {
  private staff: Map<string, Staff>;
  private patients: Map<string, Patient>;
  private temperatureLogs: Map<string, TemperatureLog>;
  private alertLogs: Map<string, AlertLog>;

  constructor() {
    this.staff = new Map();
    this.patients = new Map();
    this.temperatureLogs = new Map();
    this.alertLogs = new Map();

    this.seedData();
  }

  private seedData() {
    const adminId = randomUUID();
    const doctorId = randomUUID();
    const nurseId = randomUUID();

    // Admin user
    this.staff.set(adminId, {
      id: adminId,
      name: "Dr. Admin",
      email: "admin@hospital.com",
      password: "admin123",
      role: "admin",
      phone: "+919876543210",
    });

    // Single doctor for the patient
    this.staff.set(doctorId, {
      id: doctorId,
      name: "Dr. Rajesh Kumar",
      email: "doctor@hospital.com",
      password: "doctor123",
      role: "doctor",
      phone: "+919876543211",
    });

    // Single nurse for the patient
    this.staff.set(nurseId, {
      id: nurseId,
      name: "Nurse Priya Sharma",
      email: "nurse@hospital.com",
      password: "nurse123",
      role: "nurse",
      phone: "+919876543212",
    });

    // Single patient with Indian phone numbers
    const patientId = randomUUID();

    this.patients.set(patientId, {
      id: patientId,
      name: "Patient Name",
      roomNumber: "101",
      floorNumber: "1",
      blockNumber: "A",
      disease: "Normal",
      guardianName: "Guardian Name",
      guardianPhone: "+919876543213",
      doctorId: doctorId,
      nurseId: nurseId,
      thresholdMin: 36.5,
      thresholdMax: 37.5,
    });

    // Initial temperature reading
    const logId = randomUUID();
    this.temperatureLogs.set(logId, {
      id: logId,
      patientId: patientId,
      tempC: 36.8,
      tempF: 98.24,
      riskLevel: "normal",
      createdAt: new Date(),
    });
  }

  async getStaff(id: string): Promise<Staff | undefined> {
    return this.staff.get(id);
  }

  async getStaffByEmail(email: string): Promise<Staff | undefined> {
    return Array.from(this.staff.values()).find((s) => s.email === email);
  }

  async getAllStaff(): Promise<Staff[]> {
    return Array.from(this.staff.values());
  }

  async getStaffByRole(role: string): Promise<Staff[]> {
    return Array.from(this.staff.values()).filter((s) => s.role === role);
  }

  async createStaff(insertStaff: InsertStaff): Promise<Staff> {
    const id = randomUUID();
    const staff: Staff = { 
      id,
      name: insertStaff.name,
      email: insertStaff.email,
      password: insertStaff.password,
      role: insertStaff.role as Staff["role"],
      phone: insertStaff.phone,
    };
    this.staff.set(id, staff);
    return staff;
  }

  async updateStaff(id: string, updates: Partial<InsertStaff>): Promise<Staff | undefined> {
    const staff = this.staff.get(id);
    if (!staff) return undefined;
    const updated: Staff = { 
      ...staff, 
      ...updates,
      role: (updates.role || staff.role) as Staff["role"],
    };
    this.staff.set(id, updated);
    return updated;
  }

  async deleteStaff(id: string): Promise<boolean> {
    return this.staff.delete(id);
  }

  async getPatient(id: string): Promise<Patient | undefined> {
    return this.patients.get(id);
  }

  async getPatientWithDetails(id: string): Promise<PatientWithDetails | undefined> {
    const patient = this.patients.get(id);
    if (!patient) return undefined;

    const doctor = patient.doctorId ? await this.getStaff(patient.doctorId) : undefined;
    const nurse = patient.nurseId ? await this.getStaff(patient.nurseId) : undefined;
    const latestTemperature = await this.getLatestTemperature(id);

    return { ...patient, doctor, nurse, latestTemperature };
  }

  async getAllPatients(): Promise<Patient[]> {
    return Array.from(this.patients.values());
  }

  async getAllPatientsWithDetails(): Promise<PatientWithDetails[]> {
    const patients = Array.from(this.patients.values());
    const result: PatientWithDetails[] = [];

    for (const patient of patients) {
      const doctor = patient.doctorId ? await this.getStaff(patient.doctorId) : undefined;
      const nurse = patient.nurseId ? await this.getStaff(patient.nurseId) : undefined;
      const latestTemperature = await this.getLatestTemperature(patient.id);
      result.push({ ...patient, doctor, nurse, latestTemperature });
    }

    return result;
  }

  async getPatientsByStaff(staffId: string): Promise<PatientWithDetails[]> {
    const patients = Array.from(this.patients.values()).filter(
      (p) => p.doctorId === staffId || p.nurseId === staffId
    );

    const result: PatientWithDetails[] = [];
    for (const patient of patients) {
      const doctor = patient.doctorId ? await this.getStaff(patient.doctorId) : undefined;
      const nurse = patient.nurseId ? await this.getStaff(patient.nurseId) : undefined;
      const latestTemperature = await this.getLatestTemperature(patient.id);
      result.push({ ...patient, doctor, nurse, latestTemperature });
    }

    return result;
  }

  async getCriticalPatients(): Promise<PatientWithDetails[]> {
    const allPatients = await this.getAllPatientsWithDetails();
    return allPatients.filter((p) => p.latestTemperature?.riskLevel === "critical");
  }

  async createPatient(insertPatient: InsertPatient): Promise<Patient> {
    const id = randomUUID();
    
    const thresholds = diseaseThresholds[insertPatient.disease] || diseaseThresholds["Normal"];
    
    const patient: Patient = {
      id,
      name: insertPatient.name,
      roomNumber: insertPatient.roomNumber,
      floorNumber: insertPatient.floorNumber,
      blockNumber: insertPatient.blockNumber,
      disease: insertPatient.disease,
      guardianName: insertPatient.guardianName,
      guardianPhone: insertPatient.guardianPhone,
      doctorId: insertPatient.doctorId ?? null,
      nurseId: insertPatient.nurseId ?? null,
      thresholdMin: insertPatient.thresholdMin ?? thresholds.min,
      thresholdMax: insertPatient.thresholdMax ?? thresholds.max,
    };
    this.patients.set(id, patient);
    return patient;
  }

  async updatePatient(id: string, updates: Partial<InsertPatient>): Promise<Patient | undefined> {
    const patient = this.patients.get(id);
    if (!patient) return undefined;
    const updated = { ...patient, ...updates };
    this.patients.set(id, updated);
    return updated;
  }

  async deletePatient(id: string): Promise<boolean> {
    return this.patients.delete(id);
  }

  async getTemperatureLogs(): Promise<(TemperatureLog & { patient?: Patient })[]> {
    const logs = Array.from(this.temperatureLogs.values());
    return logs
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .map((log) => ({
        ...log,
        patient: this.patients.get(log.patientId),
      }));
  }

  async getTemperatureLogsByPatient(patientId: string): Promise<TemperatureLog[]> {
    return Array.from(this.temperatureLogs.values())
      .filter((log) => log.patientId === patientId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  async getLatestTemperature(patientId: string): Promise<TemperatureLog | undefined> {
    const logs = await this.getTemperatureLogsByPatient(patientId);
    return logs[0];
  }

  async createTemperatureLog(insertLog: InsertTemperatureLog): Promise<TemperatureLog> {
    const id = randomUUID();
    const log: TemperatureLog = {
      id,
      patientId: insertLog.patientId,
      tempC: insertLog.tempC,
      tempF: insertLog.tempF,
      riskLevel: insertLog.riskLevel as TemperatureLog["riskLevel"],
      createdAt: new Date(),
    };
    this.temperatureLogs.set(id, log);
    return log;
  }

  async getAlertLogs(): Promise<(AlertLog & { patient?: Patient })[]> {
    const logs = Array.from(this.alertLogs.values());
    return logs
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .map((log) => ({
        ...log,
        patient: this.patients.get(log.patientId),
      }));
  }

  async createAlertLog(insertLog: InsertAlertLog): Promise<AlertLog> {
    const id = randomUUID();
    const log: AlertLog = {
      ...insertLog,
      id,
      createdAt: new Date(),
    };
    this.alertLogs.set(id, log);
    return log;
  }

  async getDashboardStats(staffId?: string, role?: string): Promise<DashboardStats> {
    let patients: PatientWithDetails[];

    if (role === "admin" || !staffId) {
      patients = await this.getAllPatientsWithDetails();
    } else {
      patients = await this.getPatientsByStaff(staffId);
    }

    const totalPatients = patients.length;
    const criticalAlerts = patients.filter((p) => p.latestTemperature?.riskLevel === "critical").length;
    const warningAlerts = patients.filter((p) => p.latestTemperature?.riskLevel === "warning").length;
    const normalRange = patients.filter((p) => p.latestTemperature?.riskLevel === "normal" || !p.latestTemperature).length;

    return { totalPatients, criticalAlerts, warningAlerts, normalRange };
  }
}

export const storage = new MemStorage();
