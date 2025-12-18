import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth-context";
import { DataTable, type Column } from "@/components/data-table";
import { EmptyState } from "@/components/empty-state";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Search, Bell, CheckCircle, XCircle, User, Stethoscope, Heart } from "lucide-react";
import type { AlertLog, Patient } from "@shared/schema";

interface AlertWithPatient extends AlertLog {
  patient?: Patient;
}

export default function AlertsPage() {
  const { user, isAdmin } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [recipientFilter, setRecipientFilter] = useState<string>("all");

  const { data: alerts, isLoading } = useQuery<AlertWithPatient[]>({
    queryKey: ["/api/alerts", user?.id],
    queryFn: async () => {
      const endpoint = isAdmin 
        ? "/api/alerts" 
        : `/api/alerts?staffId=${user?.id}`;
      const res = await fetch(endpoint);
      if (!res.ok) throw new Error("Failed to fetch alerts");
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

  const getRecipientIcon = (type: string) => {
    switch (type) {
      case "doctor":
        return <Stethoscope className="h-4 w-4" />;
      case "nurse":
        return <Heart className="h-4 w-4" />;
      case "guardian":
        return <User className="h-4 w-4" />;
      default:
        return <User className="h-4 w-4" />;
    }
  };

  const columns: Column<AlertWithPatient>[] = [
    {
      key: "patient",
      header: "Patient",
      render: (alert) => (
        <div className="flex flex-col">
          <span className="font-medium">{alert.patient?.name || "Unknown"}</span>
          <span className="text-xs text-muted-foreground">
            Room {alert.patient?.roomNumber}
          </span>
        </div>
      ),
    },
    {
      key: "recipientType",
      header: "Recipient",
      render: (alert) => (
        <div className="flex items-center gap-2">
          {getRecipientIcon(alert.recipientType)}
          <div className="flex flex-col">
            <span className="capitalize">{alert.recipientType}</span>
            <span className="text-xs text-muted-foreground">{alert.recipientPhone}</span>
          </div>
        </div>
      ),
    },
    {
      key: "message",
      header: "Message",
      className: "max-w-xs",
      render: (alert) => (
        <span className="truncate block text-sm">{alert.message}</span>
      ),
    },
    {
      key: "status",
      header: "Status",
      render: (alert) => (
        <Badge
          variant={alert.status === "sent" ? "default" : "destructive"}
          className="gap-1"
        >
          {alert.status === "sent" ? (
            <CheckCircle className="h-3 w-3" />
          ) : (
            <XCircle className="h-3 w-3" />
          )}
          {alert.status === "sent" ? "Sent" : "Failed"}
        </Badge>
      ),
    },
    {
      key: "createdAt",
      header: "Sent At",
      render: (alert) => (
        <span className="text-sm text-muted-foreground">
          {formatDate(alert.createdAt)}
        </span>
      ),
    },
  ];

  const filteredAlerts = alerts?.filter((alert) => {
    const matchesSearch =
      alert.patient?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      alert.recipientPhone.includes(searchTerm);

    const matchesStatus = statusFilter === "all" || alert.status === statusFilter;
    const matchesRecipient = recipientFilter === "all" || alert.recipientType === recipientFilter;

    return matchesSearch && matchesStatus && matchesRecipient;
  });

  const getStats = () => {
    if (!alerts) return { total: 0, sent: 0, failed: 0 };
    return {
      total: alerts.length,
      sent: alerts.filter((a) => a.status === "sent").length,
      failed: alerts.filter((a) => a.status === "failed").length,
    };
  };

  const stats = getStats();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold" data-testid="text-alerts-title">
          SMS Alert History
        </h1>
        <p className="text-muted-foreground">
          View all SMS notifications sent for temperature alerts
        </p>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Alerts
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-mono">{stats.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-emerald-600 dark:text-emerald-400">
              Sent Successfully
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-mono text-emerald-600 dark:text-emerald-400">
              {stats.sent}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-red-600 dark:text-red-400">
              Failed
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-mono text-red-600 dark:text-red-400">
              {stats.failed}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-col gap-4 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by patient name or phone..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
            data-testid="input-search-alerts"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-36" data-testid="select-status-filter">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="sent">Sent</SelectItem>
            <SelectItem value="failed">Failed</SelectItem>
          </SelectContent>
        </Select>
        <Select value={recipientFilter} onValueChange={setRecipientFilter}>
          <SelectTrigger className="w-full sm:w-36" data-testid="select-recipient-filter">
            <SelectValue placeholder="Recipient" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Recipients</SelectItem>
            <SelectItem value="doctor">Doctor</SelectItem>
            <SelectItem value="nurse">Nurse</SelectItem>
            <SelectItem value="guardian">Guardian</SelectItem>
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
          testIdPrefix="alerts"
        />
      ) : filteredAlerts && filteredAlerts.length > 0 ? (
        <DataTable
          columns={columns}
          data={filteredAlerts}
          keyField="id"
          showActions={false}
          testIdPrefix="alerts"
        />
      ) : (
        <EmptyState
          icon={Bell}
          title={searchTerm || statusFilter !== "all" || recipientFilter !== "all" ? "No matches found" : "No alerts yet"}
          description={
            searchTerm || statusFilter !== "all" || recipientFilter !== "all"
              ? "Try adjusting your search or filter criteria."
              : "SMS alerts will appear here when temperature thresholds are exceeded."
          }
          testId="empty-alerts"
        />
      )}
    </div>
  );
}
