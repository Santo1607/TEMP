import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth-context";
import { DataTable, type Column } from "@/components/data-table";
import { RiskBadge } from "@/components/risk-badge";
import { EmptyState } from "@/components/empty-state";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Search, Activity, Thermometer, Clock } from "lucide-react";
import type { TemperatureLog, Patient, RiskLevel } from "@shared/schema";

interface LogWithPatient extends TemperatureLog {
  patient?: Patient;
}

export default function TemperatureLogsPage() {
  const { user, isAdmin } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [riskFilter, setRiskFilter] = useState<string>("all");

  const { data: logs, isLoading } = useQuery<LogWithPatient[]>({
    queryKey: ["/api/temperature-logs", user?.id],
    queryFn: async () => {
      const endpoint = isAdmin 
        ? "/api/temperature-logs" 
        : `/api/temperature-logs?staffId=${user?.id}`;
      const res = await fetch(endpoint);
      if (!res.ok) throw new Error("Failed to fetch logs");
      return res.json();
    },
    enabled: !!user,
  });

  const formatDate = (date: Date | string) => {
    const d = new Date(date);
    return d.toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const columns: Column<LogWithPatient>[] = [
    {
      key: "patient",
      header: "Patient",
      render: (log) => (
        <div className="flex flex-col">
          <span className="font-medium">{log.patient?.name || "Unknown"}</span>
          <span className="text-xs text-muted-foreground">
            Room {log.patient?.roomNumber}
          </span>
        </div>
      ),
    },
    {
      key: "tempC",
      header: "Temperature",
      render: (log) => (
        <div className="flex items-center gap-2">
          <Thermometer className="h-4 w-4 text-muted-foreground" />
          <span className="font-mono font-medium">{log.tempC.toFixed(1)}°C</span>
          <span className="text-sm text-muted-foreground font-mono">
            / {log.tempF.toFixed(1)}°F
          </span>
        </div>
      ),
    },
    {
      key: "riskLevel",
      header: "Risk Level",
      render: (log) => <RiskBadge level={log.riskLevel as RiskLevel} showPulse />,
    },
    {
      key: "createdAt",
      header: "Recorded At",
      render: (log) => (
        <div className="flex items-center gap-2 text-muted-foreground">
          <Clock className="h-4 w-4" />
          <span className="text-sm">{formatDate(log.createdAt)}</span>
        </div>
      ),
    },
  ];

  const filteredLogs = logs?.filter((log) => {
    const matchesSearch =
      log.patient?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.patient?.roomNumber?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesRisk = riskFilter === "all" || log.riskLevel === riskFilter;

    return matchesSearch && matchesRisk;
  });

  const getStats = () => {
    if (!logs) return { total: 0, critical: 0, warning: 0, normal: 0, avgTemp: 0 };
    const critical = logs.filter((l) => l.riskLevel === "critical").length;
    const warning = logs.filter((l) => l.riskLevel === "warning").length;
    const normal = logs.filter((l) => l.riskLevel === "normal").length;
    const avgTemp = logs.length > 0
      ? logs.reduce((sum, l) => sum + l.tempC, 0) / logs.length
      : 0;
    return { total: logs.length, critical, warning, normal, avgTemp };
  };

  const stats = getStats();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold" data-testid="text-logs-title">
          Temperature Logs
        </h1>
        <p className="text-muted-foreground">
          View historical temperature readings and trends
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Readings
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-mono">{stats.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Avg. Temperature
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-mono">
              {stats.avgTemp.toFixed(1)}°C
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-red-600 dark:text-red-400">
              Critical
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-mono text-red-600 dark:text-red-400">
              {stats.critical}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-amber-600 dark:text-amber-400">
              Warnings
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-mono text-amber-600 dark:text-amber-400">
              {stats.warning}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-col gap-4 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by patient name or room..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
            data-testid="input-search-logs"
          />
        </div>
        <Select value={riskFilter} onValueChange={setRiskFilter}>
          <SelectTrigger className="w-full sm:w-40" data-testid="select-risk-filter">
            <SelectValue placeholder="Filter by risk" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Levels</SelectItem>
            <SelectItem value="critical">Critical</SelectItem>
            <SelectItem value="warning">Warning</SelectItem>
            <SelectItem value="normal">Normal</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <DataTable
          columns={columns}
          data={[]}
          keyField="id"
          isLoading={true}
          showActions={false}
          testIdPrefix="logs"
        />
      ) : filteredLogs && filteredLogs.length > 0 ? (
        <DataTable
          columns={columns}
          data={filteredLogs}
          keyField="id"
          showActions={false}
          testIdPrefix="logs"
        />
      ) : (
        <EmptyState
          icon={Activity}
          title={searchTerm || riskFilter !== "all" ? "No matches found" : "No temperature logs"}
          description={
            searchTerm || riskFilter !== "all"
              ? "Try adjusting your search or filter criteria."
              : "Temperature readings will appear here once the sensors start transmitting data."
          }
          testId="empty-logs"
        />
      )}
    </div>
  );
}
