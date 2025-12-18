import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { AlertTriangle, AlertCircle, Info, X } from "lucide-react";
import { cn } from "@/lib/utils";

type AlertType = "critical" | "warning" | "info";

interface AlertBannerProps {
  type: AlertType;
  title: string;
  message: string;
  onDismiss?: () => void;
  className?: string;
  testId?: string;
}

export function AlertBanner({
  type,
  title,
  message,
  onDismiss,
  className,
  testId,
}: AlertBannerProps) {
  const getIcon = () => {
    switch (type) {
      case "critical":
        return <AlertTriangle className="h-5 w-5" />;
      case "warning":
        return <AlertCircle className="h-5 w-5" />;
      case "info":
        return <Info className="h-5 w-5" />;
    }
  };

  const getStyles = () => {
    switch (type) {
      case "critical":
        return "border-red-500 bg-red-50 text-red-900 dark:bg-red-950/50 dark:text-red-200 dark:border-red-800";
      case "warning":
        return "border-amber-500 bg-amber-50 text-amber-900 dark:bg-amber-950/50 dark:text-amber-200 dark:border-amber-800";
      case "info":
        return "border-blue-500 bg-blue-50 text-blue-900 dark:bg-blue-950/50 dark:text-blue-200 dark:border-blue-800";
    }
  };

  return (
    <Alert
      className={cn("relative", getStyles(), className)}
      data-testid={testId}
    >
      <div className="flex items-start gap-3">
        {getIcon()}
        <div className="flex-1">
          <AlertTitle className="font-semibold">{title}</AlertTitle>
          <AlertDescription className="mt-1 text-sm opacity-90">
            {message}
          </AlertDescription>
        </div>
        {onDismiss && (
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 shrink-0"
            onClick={onDismiss}
            data-testid={`${testId}-dismiss`}
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>
    </Alert>
  );
}
