# Hospital Temperature Management System

## Overview

A production-grade hospital temperature monitoring web application that enables real-time patient temperature tracking with role-based access control. The system integrates ESP32 microcontrollers with MLX90614 infrared thermometers to stream live temperature data via WebSocket connections. It provides separate dashboards for admins, doctors, and nurses with appropriate permission levels for patient management, temperature monitoring, and alert notifications.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React with Vite for fast development and HMR
- **Routing**: Wouter for lightweight client-side routing
- **State Management**: TanStack React Query for server state and caching
- **Styling**: Tailwind CSS with shadcn/ui component library
- **Theme Support**: Light/dark mode with CSS custom properties
- **Design System**: Medical-grade healthcare dashboard design following Inter/IBM Plex Sans typography

### Backend Architecture
- **Runtime**: Node.js with Express
- **API Design**: RESTful endpoints under `/api/*` prefix
- **Real-time Communication**: WebSocket server on `/ws/temperature` for live temperature streaming from ESP32 devices
- **Build System**: esbuild for server bundling, Vite for client bundling

### Authentication & Authorization
- **Role-based Access**: Three roles - admin, doctor, nurse
- **Admin**: Full access (manage patients, staff, edit thresholds)
- **Doctor/Nurse**: View assigned patients and temperature data only
- **Session Storage**: Client-side localStorage for user session persistence

### Data Storage
- **ORM**: Drizzle ORM with PostgreSQL dialect
- **Schema Location**: `shared/schema.ts` contains all table definitions
- **Tables**: staff, patients, temperature_logs, alert_logs
- **In-memory Fallback**: `server/storage.ts` provides interface for data operations

### Real-time Features
- **ESP32 Integration**: Arduino firmware streams temperature readings every 2 seconds
- **WebSocket Server**: Receives device data, stores latest readings, broadcasts to dashboard clients
- **Alert System**: Automatic SMS notifications for temperature threshold violations

### Project Structure
```
client/           # React frontend
  src/
    components/   # Reusable UI components
    pages/        # Route pages
    lib/          # Utilities, contexts, query client
server/           # Express backend
  routes.ts       # API endpoints and WebSocket setup
  storage.ts      # Data access layer interface
  services/       # Alert and SMS services
shared/           # Shared types and schema
arduino/          # ESP32 firmware for temperature sensors
```

## External Dependencies

### Database
- **PostgreSQL**: Primary database via `DATABASE_URL` environment variable
- **Drizzle Kit**: Database migrations and schema pushing

### SMS Notifications
- **Twilio**: Optional SMS provider for real-time temperature alerts
- **Console Fallback**: Logs SMS to console when Twilio not configured

### IoT Hardware
- **ESP32**: Microcontroller for sensor data collection
- **MLX90614**: Infrared temperature sensor
- **SSD1306 OLED**: Display for device status

### Frontend Libraries
- **Radix UI**: Accessible component primitives
- **React Hook Form**: Form state management with Zod validation
- **Lucide React**: Icon library
- **date-fns**: Date formatting utilities

### Build Tools
- **Vite**: Frontend bundler with React plugin
- **esbuild**: Server-side bundling for production
- **TypeScript**: Type checking across full stack