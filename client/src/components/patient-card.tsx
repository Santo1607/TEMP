import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { RiskBadge } from "./risk-badge";
import { Button } from "@/components/ui/button";
import { Thermometer, MapPin, Building2, Layers, Stethoscope, User, Phone, Edit, Eye } from "lucide-react";
import type { PatientWithDetails, RiskLevel } from "@shared/schema";
import { cn } from "@/lib/utils";

interface PatientCardProps {
  patient: PatientWithDetails;
  onView?: (patient: PatientWithDetails) => void;
  onEdit?: (patient: PatientWithDetails) => void;
  showActions?: boolean;
  testId?: string;
}

export function PatientCard({
  patient,
  onView,
  onEdit,
  showActions = true,
  testId,
}: PatientCardProps) {
  const latestTemp = patient.latestTemperature;
  const riskLevel: RiskLevel = latestTemp?.riskLevel || "normal";

  const tempC = latestTemp?.tempC ?? 36.5;
  const tempF = latestTemp?.tempF ?? 97.7;

  const getBorderStyle = () => {
    switch (riskLevel) {
      case "critical":
        return "border-l-4 border-l-red-500 dark:border-l-red-400";
      case "warning":
        return "border-l-4 border-l-amber-500 dark:border-l-amber-400";
      default:
        return "";
    }
  };

  return (
    <Card
      className={cn("overflow-visible transition-all", getBorderStyle())}
      data-testid={testId}
    >
      <CardHeader className="flex flex-row items-start justify-between gap-2 pb-3">
        <div className="flex flex-col gap-1">
          <h3 className="text-base font-medium" data-testid={`${testId}-name`}>
            {patient.name}
          </h3>
          <span className="text-sm text-muted-foreground">{patient.disease}</span>
        </div>
        <RiskBadge level={riskLevel} showPulse testId={`${testId}-risk`} />
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="flex items-center justify-center gap-1 rounded-md bg-muted/50 p-4">
          <Thermometer className={cn(
            "h-8 w-8",
            riskLevel === "critical" && "text-red-500",
            riskLevel === "warning" && "text-amber-500",
            riskLevel === "normal" && "text-emerald-500"
          )} />
          <div className="flex flex-col items-center">
            <span
              className={cn(
                "text-3xl font-bold font-mono",
                riskLevel === "critical" && "text-red-600 dark:text-red-400",
                riskLevel === "warning" && "text-amber-600 dark:text-amber-400",
                riskLevel === "normal" && "text-emerald-600 dark:text-emerald-400"
              )}
              data-testid={`${testId}-temp`}
            >
              {tempC.toFixed(1)}°C
            </span>
            <span className="text-sm text-muted-foreground font-mono">
              {tempF.toFixed(1)}°F
            </span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 text-sm">
          <div className="flex items-center gap-2 text-muted-foreground">
            <MapPin className="h-4 w-4 shrink-0" />
            <span>Room {patient.roomNumber}</span>
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <Layers className="h-4 w-4 shrink-0" />
            <span>Floor {patient.floorNumber}</span>
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <Building2 className="h-4 w-4 shrink-0" />
            <span>Block {patient.blockNumber}</span>
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <Stethoscope className="h-4 w-4 shrink-0" />
            <span className="truncate">{patient.doctor?.name || "Unassigned"}</span>
          </div>
        </div>

        <div className="border-t pt-3">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <User className="h-4 w-4 shrink-0" />
            <span className="truncate">{patient.guardianName}</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
            <Phone className="h-4 w-4 shrink-0" />
            <span>{patient.guardianPhone}</span>
          </div>
        </div>

        {showActions && (
          <div className="flex gap-2 pt-2">
            <Button
              variant="outline"
              size="sm"
              className="flex-1"
              onClick={() => onView?.(patient)}
              data-testid={`${testId}-view`}
            >
              <Eye className="h-4 w-4 mr-1" />
              View
            </Button>
            {onEdit && (
              <Button
                variant="outline"
                size="sm"
                className="flex-1"
                onClick={() => onEdit(patient)}
                data-testid={`${testId}-edit`}
              >
                <Edit className="h-4 w-4 mr-1" />
                Edit
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
