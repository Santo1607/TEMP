import { Badge } from "@/components/ui/badge";
import type { RiskLevel } from "@shared/schema";
import { cn } from "@/lib/utils";

interface RiskBadgeProps {
  level: RiskLevel;
  showPulse?: boolean;
  className?: string;
  testId?: string;
}

export function RiskBadge({ level, showPulse = false, className, testId }: RiskBadgeProps) {
  const getStyles = () => {
    switch (level) {
      case "critical":
        return "bg-red-100 text-red-700 border-red-200 dark:bg-red-900/40 dark:text-red-300 dark:border-red-800";
      case "warning":
        return "bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/40 dark:text-amber-300 dark:border-amber-800";
      case "normal":
        return "bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/40 dark:text-emerald-300 dark:border-emerald-800";
      default:
        return "";
    }
  };

  const getLabel = () => {
    switch (level) {
      case "critical":
        return "Critical";
      case "warning":
        return "Warning";
      case "normal":
        return "Normal";
      default:
        return level;
    }
  };

  return (
    <Badge
      variant="outline"
      className={cn(
        "text-xs font-bold uppercase tracking-wide",
        getStyles(),
        showPulse && level === "critical" && "animate-pulse",
        className
      )}
      data-testid={testId}
    >
      {showPulse && (
        <span
          className={cn(
            "mr-1.5 inline-block h-2 w-2 rounded-full",
            level === "critical" && "bg-red-500",
            level === "warning" && "bg-amber-500",
            level === "normal" && "bg-emerald-500"
          )}
        />
      )}
      {getLabel()}
    </Badge>
  );
}
