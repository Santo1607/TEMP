import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth-context";
import { StatsCard } from "@/components/stats-card";
import { PatientCard } from "@/components/patient-card";
import { AlertBanner } from "@/components/alert-banner";
import { EmptyState } from "@/components/empty-state";
import { TemperatureDashboard } from "@/components/temperature-dashboard";
import { Skeleton } from "@/components/ui/skeleton";
import { Users, AlertTriangle, AlertCircle, HeartPulse, Activity } from "lucide-react";
import type { PatientWithDetails, DashboardStats } from "@shared/schema";

export default function DashboardPage() {
  const { user, isAdmin, isDoctor, isNurse } = useAuth();

  const statsQueryKey = isAdmin 
    ? "/api/dashboard/stats" 
    : `/api/dashboard/stats?staffId=${user?.id}&role=${user?.role}`;

  const patientsQueryKey = isAdmin 
    ? "/api/patients" 
    : `/api/patients?staffId=${user?.id}`;

  const { data: stats, isLoading: statsLoading } = useQuery<DashboardStats>({
    queryKey: ["/api/dashboard/stats", user?.id, user?.role],
    queryFn: async () => {
      const res = await fetch(statsQueryKey);
      if (!res.ok) throw new Error("Failed to fetch stats");
      return res.json();
    },
    enabled: !!user,
  });

  const { data: patients, isLoading: patientsLoading } = useQuery<PatientWithDetails[]>({
    queryKey: ["/api/patients", user?.id],
    queryFn: async () => {
      const res = await fetch(patientsQueryKey);
      if (!res.ok) throw new Error("Failed to fetch patients");
      return res.json();
    },
    enabled: !!user,
  });

  const { data: criticalPatients } = useQuery<PatientWithDetails[]>({
    queryKey: ["/api/patients/critical", user?.id],
    queryFn: async () => {
      const endpoint = isAdmin 
        ? "/api/patients/critical" 
        : `/api/patients/critical?staffId=${user?.id}`;
      const res = await fetch(endpoint);
      if (!res.ok) throw new Error("Failed to fetch critical patients");
      return res.json();
    },
    enabled: !!user,
  });

  const getRoleWelcome = () => {
    if (isAdmin) return "Administrator Dashboard";
    if (isDoctor) return "Doctor Dashboard";
    if (isNurse) return "Nurse Dashboard";
    return "Dashboard";
  };

  const getPatientListTitle = () => {
    if (isAdmin) return "All Patients";
    return "My Patients";
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold" data-testid="text-dashboard-title">
          {getRoleWelcome()}
        </h1>
        <p className="text-muted-foreground">
          Welcome back, {user?.name}. Here's an overview of patient temperature status.
        </p>
      </div>

      {/* Real-time Temperature Monitoring */}
      <section>
        <h2 className="text-lg font-semibold mb-4">Real-time Temperature Monitoring</h2>
        <TemperatureDashboard />
      </section>

      {criticalPatients && criticalPatients.length > 0 && (
        <AlertBanner
          type="critical"
          title="Critical Temperature Alert"
          message={`${criticalPatients.length} patient(s) have critical temperature readings requiring immediate attention.`}
          testId="alert-critical"
        />
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {statsLoading ? (
          <>
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-32 rounded-lg" />
            ))}
          </>
        ) : (
          <>
            <StatsCard
              title="Total Patients"
              value={stats?.totalPatients ?? 0}
              icon={Users}
              variant="default"
              subtitle={isAdmin ? "All patients" : "Assigned to you"}
              testId="stat-total-patients"
            />
            <StatsCard
              title="Critical Alerts"
              value={stats?.criticalAlerts ?? 0}
              icon={AlertTriangle}
              variant="danger"
              subtitle="Immediate attention"
              testId="stat-critical"
            />
            <StatsCard
              title="Warnings"
              value={stats?.warningAlerts ?? 0}
              icon={AlertCircle}
              variant="warning"
              subtitle="Monitor closely"
              testId="stat-warnings"
            />
            <StatsCard
              title="Normal Range"
              value={stats?.normalRange ?? 0}
              icon={HeartPulse}
              variant="success"
              subtitle="Stable condition"
              testId="stat-normal"
            />
          </>
        )}
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-medium">{getPatientListTitle()}</h2>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Activity className="h-4 w-4" />
            <span>Live monitoring</span>
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
          </div>
        </div>

        {patientsLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-80 rounded-lg" />
            ))}
          </div>
        ) : patients && patients.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {patients.map((patient) => (
              <PatientCard
                key={patient.id}
                patient={patient}
                showActions={isAdmin}
                testId={`patient-card-${patient.id}`}
              />
            ))}
          </div>
        ) : (
          <EmptyState
            icon={Users}
            title="No patients found"
            description={
              isAdmin
                ? "Start by adding patients to the system."
                : "No patients have been assigned to you yet."
            }
            testId="empty-patients"
          />
        )}
      </div>
    </div>
  );
}
