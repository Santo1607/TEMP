import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { sendTemperatureAlert, calculateRiskLevel } from "./services/alert-service";
import {
  insertPatientSchema,
  insertStaffSchema,
  loginSchema,
  temperatureInputSchema,
} from "@shared/schema";
import { z } from "zod";
import ws from "ws";

// Store device data
interface DeviceData {
  deviceId: string;
  ambientTemp: number;
  objectTemp: number;
  timestamp: number;
}

const deviceLatestData = new Map<string, DeviceData>();
const connectedClients = new Set<any>();
let wss: any = null;

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  
  // ============================================================================
  // WebSocket Server Setup
  // ============================================================================
  
  wss = new ws.Server({ noServer: true });
  
  httpServer.on('upgrade', (request, socket, head) => {
    const pathname = request.url || '';
    
    if (pathname === '/ws/temperature') {
      wss.handleUpgrade(request, socket, head, (websocket: any) => {
        wss.emit('connection', websocket, request);
      });
    } else {
      socket.destroy();
    }
  });
  
  wss.on('connection', (websocket: any, request: any) => {
    const clientId = `client-${Date.now()}`;
    console.log(`[WebSocket] New connection: ${clientId}`);
    
    connectedClients.add(websocket);
    
    websocket.on('message', (data: Buffer) => {
      try {
        const message = JSON.parse(data.toString());
        
        if (message.type === 'temperature') {
          // Temperature data from ESP32
          const deviceData: DeviceData = {
            deviceId: message.deviceId,
            ambientTemp: message.ambientTemp,
            objectTemp: message.objectTemp,
            timestamp: message.timestamp || Date.now(),
          };
          
          // Store latest data
          deviceLatestData.set(message.deviceId, deviceData);
          
          console.log(`[Temperature] ${message.deviceId}: Ambient=${message.ambientTemp}°C, Object=${message.objectTemp}°C`);
          
          // Broadcast to all connected clients
          broadcastToClients({
            type: 'temperature-update',
            data: deviceData,
            timestamp: Date.now(),
          });
          
          // Store in database for history
          storeTemperatureReading(message.deviceId, message.ambientTemp, message.objectTemp);
          
        } else if (message.type === 'handshake') {
          console.log(`[WebSocket] Handshake from ${message.deviceId}: ${message.deviceName}`);
          
          websocket.send(JSON.stringify({
            type: 'handshake-ack',
            message: 'Welcome to Temperature Monitor',
            timestamp: Date.now(),
          }));
        }
      } catch (error) {
        console.error('[WebSocket] Message parse error:', error);
      }
    });
    
    websocket.on('close', () => {
      console.log(`[WebSocket] Client disconnected: ${clientId}`);
      connectedClients.delete(websocket);
    });
    
    websocket.on('error', (error: any) => {
      console.error(`[WebSocket] Client error: ${error.message}`);
      connectedClients.delete(websocket);
    });
  });
  
  // ============================================================================
  // API Endpoints
  // ============================================================================
  
  app.get("/api/temperature/latest", (req: Request, res: Response) => {
    try {
      const deviceId = req.query.deviceId as string | undefined;
      
      if (deviceId) {
        const data = deviceLatestData.get(deviceId);
        return res.json(data || { error: "Device not found" });
      }
      
      // Return all devices
      const allData = Array.from(deviceLatestData.values());
      return res.json(allData);
    } catch (error) {
      console.error("Temperature latest error:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  });
  
  app.post("/api/temperature/alert", (req: Request, res: Response) => {
    try {
      const { deviceId, alertMessage } = req.body;
      
      // Broadcast alert to all clients
      broadcastToClients({
        type: 'alert',
        deviceId,
        message: alertMessage,
        timestamp: Date.now(),
      });
      
      return res.json({ success: true, message: "Alert sent" });
    } catch (error) {
      console.error("Temperature alert error:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  });
  
  // ============================================================================
  // Helper Functions
  // ============================================================================
  
  function broadcastToClients(message: any) {
    const json = JSON.stringify(message);
    connectedClients.forEach((client) => {
      if (client.readyState === 1) { // WebSocket.OPEN
        client.send(json);
      }
    });
  }
  
  function storeTemperatureReading(deviceId: string, ambientTemp: number, objectTemp: number) {
    // This would store in database - for now just log
    console.log(`[DB] Temperature reading stored: ${deviceId} - Ambient: ${ambientTemp}°C, Object: ${objectTemp}°C`);
  }

  app.post("/api/auth/login", async (req: Request, res: Response) => {
    try {
      const parsed = loginSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: "Invalid credentials format" });
      }

      const { email, password } = parsed.data;
      const user = await storage.getStaffByEmail(email);

      if (!user || user.password !== password) {
        return res.status(401).json({ error: "Invalid email or password" });
      }

      const { password: _, ...safeUser } = user;
      return res.json({ user: safeUser });
    } catch (error) {
      console.error("Login error:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  });

  app.get("/api/dashboard/stats", async (req: Request, res: Response) => {
    try {
      const staffId = req.query.staffId as string | undefined;
      const role = req.query.role as string | undefined;
      const stats = await storage.getDashboardStats(staffId, role);
      return res.json(stats);
    } catch (error) {
      console.error("Dashboard stats error:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  });

  app.get("/api/staff", async (_req: Request, res: Response) => {
    try {
      const staff = await storage.getAllStaff();
      const safeStaff = staff.map(({ password, ...s }) => s);
      return res.json(safeStaff);
    } catch (error) {
      console.error("Get staff error:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  });

  app.get("/api/staff/doctors", async (_req: Request, res: Response) => {
    try {
      const doctors = await storage.getStaffByRole("doctor");
      const safeDoctors = doctors.map(({ password, ...s }) => s);
      return res.json(safeDoctors);
    } catch (error) {
      console.error("Get doctors error:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  });

  app.get("/api/staff/nurses", async (_req: Request, res: Response) => {
    try {
      const nurses = await storage.getStaffByRole("nurse");
      const safeNurses = nurses.map(({ password, ...s }) => s);
      return res.json(safeNurses);
    } catch (error) {
      console.error("Get nurses error:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  });

  app.get("/api/staff/:id", async (req: Request, res: Response) => {
    try {
      const staff = await storage.getStaff(req.params.id);
      if (!staff) {
        return res.status(404).json({ error: "Staff not found" });
      }
      const { password, ...safeStaff } = staff;
      return res.json(safeStaff);
    } catch (error) {
      console.error("Get staff error:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  });

  app.post("/api/staff", async (req: Request, res: Response) => {
    try {
      const parsed = insertStaffSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: "Invalid staff data", details: parsed.error.errors });
      }

      const existing = await storage.getStaffByEmail(parsed.data.email);
      if (existing) {
        return res.status(400).json({ error: "Email already exists" });
      }

      const staff = await storage.createStaff(parsed.data);
      const { password, ...safeStaff } = staff;
      return res.status(201).json(safeStaff);
    } catch (error) {
      console.error("Create staff error:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  });

  app.patch("/api/staff/:id", async (req: Request, res: Response) => {
    try {
      const staff = await storage.updateStaff(req.params.id, req.body);
      if (!staff) {
        return res.status(404).json({ error: "Staff not found" });
      }
      const { password, ...safeStaff } = staff;
      return res.json(safeStaff);
    } catch (error) {
      console.error("Update staff error:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  });

  app.delete("/api/staff/:id", async (req: Request, res: Response) => {
    try {
      const deleted = await storage.deleteStaff(req.params.id);
      if (!deleted) {
        return res.status(404).json({ error: "Staff not found" });
      }
      return res.status(204).send();
    } catch (error) {
      console.error("Delete staff error:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  });

  app.get("/api/patients", async (req: Request, res: Response) => {
    try {
      const staffId = req.query.staffId as string | undefined;
      let patients;

      if (staffId) {
        patients = await storage.getPatientsByStaff(staffId);
      } else {
        patients = await storage.getAllPatientsWithDetails();
      }

      return res.json(patients);
    } catch (error) {
      console.error("Get patients error:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  });

  app.get("/api/patients/critical", async (req: Request, res: Response) => {
    try {
      const staffId = req.query.staffId as string | undefined;
      let patients = await storage.getCriticalPatients();
      
      if (staffId) {
        patients = patients.filter(
          (p) => p.doctorId === staffId || p.nurseId === staffId
        );
      }
      
      return res.json(patients);
    } catch (error) {
      console.error("Get critical patients error:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  });

  app.get("/api/patients/:id", async (req: Request, res: Response) => {
    try {
      const patient = await storage.getPatientWithDetails(req.params.id);
      if (!patient) {
        return res.status(404).json({ error: "Patient not found" });
      }
      return res.json(patient);
    } catch (error) {
      console.error("Get patient error:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  });

  app.post("/api/patients", async (req: Request, res: Response) => {
    try {
      const parsed = insertPatientSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: "Invalid patient data", details: parsed.error.errors });
      }

      const patient = await storage.createPatient(parsed.data);
      return res.status(201).json(patient);
    } catch (error) {
      console.error("Create patient error:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  });

  app.patch("/api/patients/:id", async (req: Request, res: Response) => {
    try {
      const patient = await storage.updatePatient(req.params.id, req.body);
      if (!patient) {
        return res.status(404).json({ error: "Patient not found" });
      }
      return res.json(patient);
    } catch (error) {
      console.error("Update patient error:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  });

  app.delete("/api/patients/:id", async (req: Request, res: Response) => {
    try {
      const deleted = await storage.deletePatient(req.params.id);
      if (!deleted) {
        return res.status(404).json({ error: "Patient not found" });
      }
      return res.status(204).send();
    } catch (error) {
      console.error("Delete patient error:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  });

  app.post("/api/temperature", async (req: Request, res: Response) => {
    try {
      const parsed = temperatureInputSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: "Invalid temperature data", details: parsed.error.errors });
      }

      const { patientId, tempC, tempF } = parsed.data;

      const patient = await storage.getPatient(patientId);
      if (!patient) {
        return res.status(404).json({ error: "Patient not found" });
      }

      const riskLevel = calculateRiskLevel(tempC, patient.thresholdMin, patient.thresholdMax);

      const log = await storage.createTemperatureLog({
        patientId,
        tempC,
        tempF,
        riskLevel,
      });

      if (riskLevel !== "normal") {
        await sendTemperatureAlert(patient, tempC, tempF, riskLevel);
      }

      return res.status(201).json({
        ...log,
        riskLevel,
        alertsSent: riskLevel !== "normal",
      });
    } catch (error) {
      console.error("Temperature log error:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  });

  app.get("/api/temperature-logs", async (req: Request, res: Response) => {
    try {
      const patientId = req.query.patientId as string | undefined;
      const staffId = req.query.staffId as string | undefined;
      
      if (patientId) {
        const logs = await storage.getTemperatureLogsByPatient(patientId);
        return res.json(logs);
      }

      let logs = await storage.getTemperatureLogs();
      
      if (staffId) {
        const patients = await storage.getPatientsByStaff(staffId);
        const patientIds = new Set(patients.map(p => p.id));
        logs = logs.filter(log => patientIds.has(log.patientId));
      }
      
      return res.json(logs);
    } catch (error) {
      console.error("Get temperature logs error:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  });

  app.get("/api/alerts", async (req: Request, res: Response) => {
    try {
      const staffId = req.query.staffId as string | undefined;
      let alerts = await storage.getAlertLogs();
      
      if (staffId) {
        const patients = await storage.getPatientsByStaff(staffId);
        const patientIds = new Set(patients.map(p => p.id));
        alerts = alerts.filter(alert => patientIds.has(alert.patientId));
      }
      
      return res.json(alerts);
    } catch (error) {
      console.error("Get alerts error:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  });

  return httpServer;
}
