import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, Thermometer, Wifi, WifiOff } from "lucide-react";

interface TemperatureData {
  deviceId: string;
  ambientTemp: number;
  objectTemp: number;
  timestamp: number;
}

interface AlertMessage {
  type: string;
  deviceId?: string;
  message?: string;
  timestamp: number;
  data?: TemperatureData;
}

export function TemperatureDashboard() {
  const [temperatureData, setTemperatureData] = useState<TemperatureData | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [alerts, setAlerts] = useState<AlertMessage[]>([]);
  const [ws, setWs] = useState<WebSocket | null>(null);

  useEffect(() => {
    // Connect to WebSocket server
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const wsUrl = `${protocol}//${window.location.host}/ws/temperature`;

    const websocket = new WebSocket(wsUrl);

    websocket.onopen = () => {
      console.log("WebSocket connected");
      setIsConnected(true);
    };

    websocket.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);

        if (message.type === "temperature-update") {
          setTemperatureData(message.data);
          setLastUpdate(new Date(message.timestamp));

          // Remove old alerts (keep only last 5)
          setAlerts((prev) => {
            const updated = [
              ...prev,
              {
                type: "temperature-update",
                timestamp: message.timestamp,
                data: message.data,
              },
            ];
            return updated.slice(-5);
          });
        } else if (message.type === "alert") {
          setAlerts((prev) => [
            ...prev,
            {
              type: "alert",
              deviceId: message.deviceId,
              message: message.message,
              timestamp: message.timestamp,
            },
          ]);
        }
      } catch (error) {
        console.error("Failed to parse WebSocket message:", error);
      }
    };

    websocket.onclose = () => {
      console.log("WebSocket disconnected");
      setIsConnected(false);
    };

    websocket.onerror = (error) => {
      console.error("WebSocket error:", error);
      setIsConnected(false);
    };

    setWs(websocket);

    return () => {
      if (websocket.readyState === WebSocket.OPEN) {
        websocket.close();
      }
    };
  }, []);

  const getTemperatureColor = (temp: number) => {
    if (temp < 35) return "text-blue-600 dark:text-blue-400";
    if (temp < 36.5) return "text-cyan-600 dark:text-cyan-400";
    if (temp < 37.5) return "text-green-600 dark:text-green-400";
    if (temp < 38.5) return "text-yellow-600 dark:text-yellow-400";
    if (temp < 39.5) return "text-orange-600 dark:text-orange-400";
    return "text-red-600 dark:text-red-400";
  };

  const getTemperatureStatus = (temp: number) => {
    if (temp < 35) return "Hypothermia";
    if (temp < 36.5) return "Low";
    if (temp < 37.5) return "Normal";
    if (temp < 38.5) return "Mild Fever";
    if (temp < 39.5) return "Moderate Fever";
    return "High Fever";
  };

  return (
    <div className="space-y-6" data-testid="temperature-dashboard">
      {/* Connection Status */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              {isConnected ? (
                <>
                  <Wifi className="w-4 h-4 text-green-600" />
                  <span>Connected</span>
                </>
              ) : (
                <>
                  <WifiOff className="w-4 h-4 text-red-600" />
                  <span>Disconnected</span>
                </>
              )}
            </span>
            {lastUpdate && (
              <span className="text-xs text-muted-foreground font-normal">
                Last update: {lastUpdate.toLocaleTimeString()}
              </span>
            )}
          </CardTitle>
        </CardHeader>
      </Card>

      {/* Current Temperature Display */}
      {temperatureData ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Ambient Temperature */}
          <Card data-testid="card-ambient-temperature">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Ambient Temperature</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div
                  className={`text-4xl font-bold ${getTemperatureColor(
                    temperatureData.ambientTemp
                  )}`}
                  data-testid="text-ambient-value"
                >
                  {temperatureData.ambientTemp.toFixed(1)}°C
                </div>
                <Badge variant="outline">
                  {getTemperatureStatus(temperatureData.ambientTemp)}
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* Object Temperature */}
          <Card data-testid="card-object-temperature">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Object Temperature</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div
                  className={`text-4xl font-bold ${getTemperatureColor(
                    temperatureData.objectTemp
                  )}`}
                  data-testid="text-object-value"
                >
                  {temperatureData.objectTemp.toFixed(1)}°C
                </div>
                <Badge variant="outline">
                  {getTemperatureStatus(temperatureData.objectTemp)}
                </Badge>
              </div>
            </CardContent>
          </Card>
        </div>
      ) : (
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>Waiting for temperature data...</AlertDescription>
        </Alert>
      )}

      {/* Device Information */}
      {temperatureData && (
        <Card data-testid="card-device-info">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Thermometer className="w-4 h-4" />
              Device Information
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Device ID:</span>
                <span className="font-mono" data-testid="text-device-id">
                  {temperatureData.deviceId}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Timestamp:</span>
                <span data-testid="text-timestamp">
                  {new Date(temperatureData.timestamp).toLocaleTimeString()}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Temperature Difference:</span>
                <span data-testid="text-temp-diff">
                  {Math.abs(
                    temperatureData.objectTemp - temperatureData.ambientTemp
                  ).toFixed(1)}°C
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recent Activity */}
      {alerts.length > 0 && (
        <Card data-testid="card-activity">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {alerts.map((alert, idx) => (
                <div
                  key={idx}
                  className="text-xs p-2 bg-muted rounded flex justify-between items-start"
                  data-testid={`activity-${idx}`}
                >
                  <span>
                    {alert.type === "temperature-update"
                      ? `Temperature reading: ${alert.data?.ambientTemp.toFixed(1)}°C (ambient)`
                      : alert.message || "Alert received"}
                  </span>
                  <span className="text-muted-foreground">
                    {new Date(alert.timestamp).toLocaleTimeString()}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
