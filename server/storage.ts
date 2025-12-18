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
    const doctor1Id = randomUUID();
    const doctor2Id = randomUUID();
    const nurse1Id = randomUUID();
    const nurse2Id = randomUUID();

    this.staff.set(adminId, {
      id: adminId,
      name: "Dr. Admin Singh",
      email: "admin@hospital.com",
      password: "admin123",
      role: "admin",
      phone: "+1234567890",
    });

    this.staff.set(doctor1Id, {
      id: doctor1Id,
      name: "Dr. Sarah Johnson",
      email: "doctor@hospital.com",
      password: "doctor123",
      role: "doctor",
      phone: "+1234567891",
    });

    this.staff.set(doctor2Id, {
      id: doctor2Id,
      name: "Dr. Michael Chen",
      email: "doctor2@hospital.com",
      password: "doctor123",
      role: "doctor",
      phone: "+1234567892",
    });

    this.staff.set(nurse1Id, {
      id: nurse1Id,
      name: "Nurse Emily Davis",
      email: "nurse@hospital.com",
      password: "nurse123",
      role: "nurse",
      phone: "+1234567893",
    });

    this.staff.set(nurse2Id, {
      id: nurse2Id,
      name: "Nurse James Wilson",
      email: "nurse2@hospital.com",
      password: "nurse123",
      role: "nurse",
      phone: "+1234567894",
    });

    const patient1Id = randomUUID();
    const patient2Id = randomUUID();
    const patient3Id = randomUUID();
    const patient4Id = randomUUID();
    const patient5Id = randomUUID();

    this.patients.set(patient1Id, {
      id: patient1Id,
      name: "John Smith",
      roomNumber: "101",
      floorNumber: "1",
      blockNumber: "A",
      disease: "Infection",
      guardianName: "Mary Smith",
      guardianPhone: "+1555123456",
      doctorId: doctor1Id,
      nurseId: nurse1Id,
      thresholdMin: 36.0,
      thresholdMax: 37.0,
    });

    this.patients.set(patient2Id, {
      id: patient2Id,
      name: "Emma Brown",
      roomNumber: "205",
      floorNumber: "2",
      blockNumber: "B",
      disease: "Post Surgery",
      guardianName: "Robert Brown",
      guardianPhone: "+1555234567",
      doctorId: doctor1Id,
      nurseId: nurse1Id,
      thresholdMin: 36.5,
      thresholdMax: 37.2,
    });

    this.patients.set(patient3Id, {
      id: patient3Id,
      name: "David Lee",
      roomNumber: "302",
      floorNumber: "3",
      blockNumber: "A",
      disease: "ICU",
      guardianName: "Jennifer Lee",
      guardianPhone: "+1555345678",
      doctorId: doctor2Id,
      nurseId: nurse2Id,
      thresholdMin: 36.8,
      thresholdMax: 37.0,
    });

    this.patients.set(patient4Id, {
      id: patient4Id,
      name: "Lisa Anderson",
      roomNumber: "108",
      floorNumber: "1",
      blockNumber: "C",
      disease: "Normal",
      guardianName: "Tom Anderson",
      guardianPhone: "+1555456789",
      doctorId: doctor2Id,
      nurseId: nurse2Id,
      thresholdMin: 36.5,
      thresholdMax: 37.5,
    });

    this.patients.set(patient5Id, {
      id: patient5Id,
      name: "Michael Taylor",
      roomNumber: "410",
      floorNumber: "4",
      blockNumber: "B",
      disease: "Fever",
      guardianName: "Susan Taylor",
      guardianPhone: "+1555567890",
      doctorId: doctor1Id,
      nurseId: nurse1Id,
      thresholdMin: 36.0,
      thresholdMax: 38.0,
    });

    const temps = [
      { patientId: patient1Id, tempC: 37.8, riskLevel: "warning" as RiskLevel },
      { patientId: patient2Id, tempC: 36.8, riskLevel: "normal" as RiskLevel },
      { patientId: patient3Id, tempC: 38.5, riskLevel: "critical" as RiskLevel },
      { patientId: patient4Id, tempC: 36.6, riskLevel: "normal" as RiskLevel },
      { patientId: patient5Id, tempC: 39.2, riskLevel: "critical" as RiskLevel },
    ];

    temps.forEach((t) => {
      const logId = randomUUID();
      this.temperatureLogs.set(logId, {
        id: logId,
        patientId: t.patientId,
        tempC: t.tempC,
        tempF: (t.tempC * 9) / 5 + 32,
        riskLevel: t.riskLevel,
        createdAt: new Date(),
      });
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
